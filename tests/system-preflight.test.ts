import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectHost, type HostInspection } from '../src/system/host.js';
import {
  getRequirements,
  inspectTools,
  parseToolVersion,
  type ToolRequirement,
} from '../src/system/preflight.js';
import { planBootstrap } from '../src/system/bootstrap.js';

const requirement = (id: string, range: string): ToolRequirement => ({
  id,
  label: id,
  range,
  commands: [{ name: id }],
  versionArgs: ['--version'],
  qualification: 'qualified',
  evidence: ['test'],
});
const host: HostInspection = {
  platform: 'linux',
  family: 'ubuntu',
  architecture: 'x64',
  version: 'Ubuntu 24.04',
  supported: true,
  wsl: false,
  reasons: [],
  evidence: [],
};

test('host rejects ARM, Windows Server and wrong Ubuntu; existing WSL is identified', async () => {
  const ubuntu = {
    platform: 'linux' as const,
    machine: 'x86_64',
    release: '6.6-microsoft',
    env: {},
    readText: async () => 'ID=ubuntu\nVERSION_ID="24.04"\nPRETTY_NAME="Ubuntu 24.04 LTS"',
  };
  const actual = await inspectHost(ubuntu);
  assert.equal(actual.supported, true);
  assert.equal(actual.wsl, true);
  assert.equal((await inspectHost({ ...ubuntu, machine: 'aarch64' })).supported, false);
  assert.equal(
    (await inspectHost({ ...ubuntu, readText: async () => 'ID=ubuntu\nVERSION_ID="22.04"' }))
      .supported,
    false,
  );
  assert.equal(
    (
      await inspectHost({
        platform: 'win32',
        machine: 'AMD64',
        release: '10.0.26100',
        windowsEdition: 'ServerStandard',
        windowsInstallationType: 'Server',
        now: new Date('2026-10-06'),
      })
    ).supported,
    false,
  );
});

test('Windows support follows edition and actual lifecycle date, not every build above 22000', async () => {
  const windows = {
    platform: 'win32' as const,
    machine: 'AMD64',
    release: '10.0.26100',
    windowsInstallationType: 'Client',
    windowsEdition: 'Professional',
  };
  assert.equal((await inspectHost({ ...windows, now: new Date('2026-10-06') })).supported, true);
  assert.equal((await inspectHost({ ...windows, now: new Date('2026-10-14') })).supported, false);
  assert.equal(
    (await inspectHost({ ...windows, windowsEdition: 'Enterprise', now: new Date('2026-10-14') }))
      .supported,
    true,
  );
  assert.equal((await inspectHost({ ...windows, release: '10.0.99999' })).supported, false);
});

test('inspection finishes every selected requirement before returning conflicts', async () => {
  const visited: string[] = [];
  const tools = await inspectTools(
    [requirement('node', '^24'), requirement('npm', '^11'), requirement('git', '^2')],
    {
      resolver: async (command) => {
        visited.push(command);
        return `/tools/${command}`;
      },
      runner: async ({ command }) => ({
        code: 0,
        stderr: '',
        stdout: command.endsWith('/node')
          ? 'v22.0.0'
          : command.endsWith('/npm')
            ? '11.3.0'
            : 'git version 2.50.0',
      }),
    },
  );
  assert.deepEqual(visited.sort(), ['git', 'node', 'npm']);
  assert.equal(tools[0]?.state, 'incompatible');
  assert.equal(tools[1]?.state, 'compatible');
  assert.equal(tools[2]?.state, 'compatible');
});

test('broken command is not classified as absent, and lockfile engines reject too recent versions', async () => {
  const tool = requirement('node', '^24');
  tool.additionalRanges = ['>=24.15.0'];
  const inspected = await inspectTools([tool], {
    resolver: async () => '/node',
    runner: async () => ({ code: 0, stdout: 'v24.1.0', stderr: '' }),
  });
  assert.equal(inspected[0]?.state, 'incompatible');
  assert.match(inspected[0]!.reason, />=24\.15\.0/u);
  const broken = await inspectTools([tool], {
    resolver: async () => '/node',
    runner: async () => ({ code: 1, stdout: '', stderr: 'broken install' }),
  });
  assert.equal(broken[0]?.state, 'detection-failed');
  assert.equal(parseToolVersion('node', 'v24.1.0-rc.1'), '24.1.0-rc.1');
});

test('all compatible tools permit reuse despite missing installation recipes; absent tools block', async () => {
  const requirements = [requirement('node', '^24')];
  const options = {
    host,
    inspectionOptions: {
      resolver: async () => '/node',
      runner: async () => ({ code: 0, stdout: 'v24.21.0', stderr: '' }),
    },
  };
  const plan = await planBootstrap(requirements, options);
  assert.equal(plan.status, 'ready');
  assert.deepEqual(plan.actions, []);
  const missing = await planBootstrap(requirements, {
    host,
    inspectionOptions: { resolver: async () => undefined },
  });
  assert.equal(missing.status, 'blocked');
  assert.match(missing.reasons.join(' '), /aucune recette/u);
});

test('shipped web locks give an actionable Node reference without bypassing the version conflict', async () => {
  const root = process.env.PROMETHEE_RESOURCE_ROOT ?? process.cwd();
  const requirements = await getRequirements({ profile: 'web-api', git: false, options: {} }, root);
  const node = requirements.find((item) => item.id === 'node')!;
  for (const [version, state] of [
    ['24.10.0', 'incompatible'],
    ['24.13.1', 'compatible'],
    ['24.15.0', 'compatible'],
    ['24.21.0', 'compatible'],
    ['26.0.0', 'incompatible'],
  ]) {
    const [inspection] = await inspectTools([node], {
      resolver: async () => '/node',
      runner: async () => ({ code: 0, stdout: `v${version}`, stderr: '' }),
    });
    assert.equal(inspection?.state, state, version);
    if (state === 'incompatible') {
      assert.match(inspection!.reason, /Node\.js du projet 24\.21\.0/u);
      assert.match(inspection!.reason, /nouveau terminal/u);
      assert.doesNotMatch(inspection!.reason, />=26/u);
    }
  }
  const plan = await planBootstrap([node], {
    host,
    inspectionOptions: {
      resolver: async () => '/node',
      runner: async () => ({ code: 0, stdout: 'v24.10.0', stderr: '' }),
    },
  });
  assert.equal(plan.status, 'blocked');
  assert.deepEqual(plan.actions, []);
});

test('every default profile reuses Node 24.13.1 independently of the newer reference runtime', async () => {
  const root = process.env.PROMETHEE_RESOURCE_ROOT ?? process.cwd();
  for (const profile of ['web-api', 'desktop', 'php', 'mobile']) {
    const requirements = await getRequirements({ profile, git: false, options: {} }, root);
    const node = requirements.find((item) => item.id === 'node')!;
    const plan = await planBootstrap([node], {
      host,
      inspectionOptions: {
        resolver: async () => '/usual/node',
        runner: async () => ({ code: 0, stdout: 'v24.13.1', stderr: '' }),
      },
    });
    assert.equal(plan.status, 'ready', `${profile}: ${plan.reasons.join(' ')}`);
    assert.deepEqual(plan.actions, []);
    assert.equal(plan.tools[0]?.executable, '/usual/node');
    assert.equal(node.referenceVersion, '24.21.0');
  }
});

test('an incompatible reference version is never suggested as a resolution', async () => {
  const node = requirement('node', '^24');
  node.additionalRanges = ['>=24.21.0'];
  node.referenceVersion = '24.13.1';
  const [inspection] = await inspectTools([node], {
    resolver: async () => '/node',
    runner: async () => ({ code: 0, stdout: 'v24.13.1', stderr: '' }),
  });
  assert.equal(inspection?.state, 'incompatible');
  assert.match(inspection!.reason, />=24\.21\.0/u);
  assert.doesNotMatch(inspection!.reason, /version de référence compatible/u);
});

test('profile requirements derive Node engines and PHP extensions from shipped lockfiles', async () => {
  const root = process.env.PROMETHEE_RESOURCE_ROOT ?? process.cwd();
  const base = { profile: { id: 'php' }, git: false, skills: [], options: { database: 'mysql' } };
  const requirements = await getRequirements(base, { root });
  const php = requirements.find((item) => item.id === 'php');
  assert.ok(php?.extensions);
  assert.ok(php.extensions.includes('pdo_mysql'));
  assert.ok(php.extensions.includes('mbstring'));
  assert.ok(requirements[0]?.additionalRanges?.length);
  assert.ok(!requirements.some((item) => item.id === 'git' || item.id === 'python'));
  const mobile = await getRequirements(
    {
      profile: 'mobile',
      git: false,
      skills: [],
      options: { mobileMode: 'expo-go', backend: 'none' },
    },
    { root },
  );
  assert.ok(!mobile.some((item) => item.id === 'jdk' || item.id === 'android-sdk'));
});

test('Windows Python uses the real ordinary python before the Microsoft Store python3 alias', async () => {
  const root = process.env.PROMETHEE_RESOURCE_ROOT ?? process.cwd();
  const selection = { profile: 'web-api', git: false, skills: ['ui-ux-pro-max'], options: {} };
  const windows = await getRequirements(selection, root, { platform: 'win32' });
  const python = windows.find((item) => item.id === 'python')!;
  assert.deepEqual(
    python.commands.map((candidate) => candidate.name),
    ['python', 'py', 'python3'],
  );
  const lookedUp: string[] = [];
  const tools = await inspectTools([python], {
    resolver: async (name) => {
      lookedUp.push(name);
      if (name === 'python3') throw new Error('MicrosoftWindowsApps alias EACCES');
      return '/real/python';
    },
    runner: async () => ({ code: 0, stdout: 'Python 3.12.10', stderr: '' }),
  });
  assert.equal(tools[0]?.state, 'compatible');
  assert.deepEqual(lookedUp, ['python']);
  const ubuntu = await getRequirements(selection, root, { platform: 'linux' });
  assert.equal(ubuntu.find((item) => item.id === 'python')?.commands[0]?.name, 'python3');
});

test('a broken Python alias permits a valid usual alternative but never becomes a missing tool', async () => {
  const root = process.env.PROMETHEE_RESOURCE_ROOT ?? process.cwd();
  const requirements = await getRequirements(
    { profile: 'web-api', git: false, skills: ['ui-ux-pro-max'], options: {} },
    root,
    { platform: 'win32' },
  );
  const python = requirements.find((item) => item.id === 'python')!;
  const resolved = await inspectTools([python], {
    resolver: async (name) => {
      if (name === 'python') throw new Error('WindowsApps alias EACCES');
      return name === 'py' ? '/usual/py.exe' : undefined;
    },
    runner: async (request) => {
      assert.deepEqual(request.args, ['-3', '--version']);
      return { code: 0, stdout: 'Python 3.12.10', stderr: '' };
    },
  });
  assert.equal(resolved[0]?.state, 'compatible');
  assert.deepEqual(resolved[0]?.prefixArgs, ['-3']);
  const broken = await inspectTools([python], {
    resolver: async (name) => {
      if (name === 'python3') throw new Error('Alias inaccessible');
      return name === 'python' ? '/broken/python.exe' : undefined;
    },
    runner: async () => ({ code: 1, stdout: '', stderr: 'Broken Python' }),
  });
  assert.equal(broken[0]?.state, 'detection-failed');
  assert.match(broken[0]!.reason, /présent.*Alias inaccessible/u);
});
