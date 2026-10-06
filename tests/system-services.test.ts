import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  changeService,
  inspectServices,
  readProjectServices,
  validateServiceContext,
  type ProjectServices,
} from '../src/system/services.js';
import type { CommandRequest, CommandRunner } from '../src/system/commands.js';
import type { ToolRequirement } from '../src/system/preflight.js';

function context(mode: 'native' | 'containerized' = 'native'): ProjectServices {
  return {
    projectRoot: '/project',
    databases: [{ id: 'main', engine: 'postgresql', mode, target: 'backend' }],
    bindings: [
      {
        databaseId: 'main',
        engine: 'postgresql',
        adapter: 'windows-service',
        instanceId: 'postgresql-x64-18',
        ownership: 'existing-shared',
        port: 5432,
      },
    ],
  };
}
const compatibility: ToolRequirement = {
  id: 'postgresql',
  label: 'PG',
  commands: [],
  versionArgs: [],
  range: '>=18.0.0 <19.0.0',
  qualification: 'qualified',
  evidence: ['test'],
};

function windowsRunner(active: boolean, calls: CommandRequest[]): CommandRunner {
  return async (request) => {
    calls.push(request);
    if (request.args[0] === 'query')
      return {
        code: 0,
        stderr: '',
        stdout: `STATE : ${active ? 4 : 1} ${active ? 'RUNNING' : 'STOPPED'}`,
      };
    if (request.args[0] === 'qc')
      return {
        code: 0,
        stderr: '',
        stdout:
          'BINARY_PATH_NAME : "C:\\Program Files\\PostgreSQL\\18\\bin\\pg_ctl.exe" runservice -N postgresql-x64-18',
      };
    if (request.args[0] === 'start') active = true;
    if (request.args[0] === 'stop') active = false;
    return {
      code: 0,
      stderr: '',
      stdout: request.args[0] === '--version' ? 'pg_ctl (PostgreSQL) 18.6' : '',
    };
  };
}

test('containerized, remote and embedded databases issue zero system commands, including stale native binding', async () => {
  const ctx = context('containerized');
  ctx.databases.push(
    { id: 'remote', engine: 'mysql', mode: 'remote', target: 'backend' },
    { id: 'embedded', engine: 'sqlite', mode: 'embedded', target: 'desktop' },
  );
  let calls = 0;
  const result = await inspectServices(ctx, {
    runner: async () => {
      calls++;
      throw new Error('Unexpected command');
    },
  });
  assert.equal(calls, 0);
  assert.ok(result.every((item) => item.state === 'ignored'));
});

test('status proves configured binary identity without starting or stopping anything', async () => {
  const calls: CommandRequest[] = [];
  const result = await inspectServices(context(), {
    platform: 'win32',
    runner: windowsRunner(true, calls),
  });
  assert.equal(result[0]?.state, 'active');
  assert.equal(result[0]?.identityVerified, true);
  assert.equal(result[0]?.sqlVerification, 'not-run');
  assert.ok(!calls.some((call) => ['start', 'stop', 'config'].includes(call.args[0] ?? '')));
  const mismatched = await inspectServices(context(), {
    platform: 'win32',
    runner: async (request) => ({
      code: 0,
      stderr: '',
      stdout:
        request.args[0] === 'query'
          ? 'STATE : 4 RUNNING'
          : 'BINARY_PATH_NAME : C:\\tools\\unrelated.exe',
    }),
  });
  assert.equal(mismatched[0]?.identityVerified, false);
  assert.equal(mismatched[0]?.state, 'unavailable');
});

test('start respects existing active service and stop is scoped and explicit', async () => {
  const ctx = context(),
    calls: CommandRequest[] = [];
  const options = {
    platform: 'win32' as const,
    explicit: true as const,
    runner: windowsRunner(true, calls),
    compatibility: { postgresql: compatibility },
    readContext: async () => ctx,
  };
  await changeService(ctx, 'main', 'start', options);
  assert.ok(!calls.some((call) => call.args[0] === 'start'));
  const stopped = await changeService(ctx, 'main', 'stop', options);
  assert.equal(stopped.state, 'inactive');
  assert.equal(calls.filter((call) => call.args[0] === 'stop').length, 1);
  assert.ok(
    calls
      .filter((call) => ['start', 'stop'].includes(call.args[0] ?? ''))
      .every((call) => call.args[1] === 'postgresql-x64-18'),
  );
});

test('native-to-Docker transition immediately blocks action from a stale menu context', async () => {
  let called = false;
  await assert.rejects(
    changeService(context(), 'main', 'start', {
      platform: 'win32',
      explicit: true,
      readContext: async () => context('containerized'),
      runner: async () => {
        called = true;
        throw new Error('unexpected');
      },
    }),
    /base native/u,
  );
  assert.equal(called, false);
});

test('unqualified compatibility, extra shell commands, option-like IDs and duplicate bindings are refused', async () => {
  const ctx = context(),
    calls: CommandRequest[] = [];
  await assert.rejects(
    changeService(ctx, 'main', 'stop', {
      explicit: true,
      platform: 'win32',
      runner: windowsRunner(true, calls),
      readContext: async () => ctx,
    }),
    /non qualifiée/u,
  );
  assert.ok(!calls.some((call) => call.args[0] === 'stop'));
  const malformed = context();
  malformed.bindings[0]!.instanceId = '--all';
  assert.throws(() => validateServiceContext(malformed));
  const duplicate = context();
  duplicate.bindings.push({ ...duplicate.bindings[0]! });
  assert.throws(() => validateServiceContext(duplicate));
  const extra = context();
  Object.assign(extra.bindings[0]!, { command: 'docker stop all' });
  assert.throws(() => validateServiceContext(extra));
});

test('Ubuntu systemd identity must match the concrete PostgreSQL cluster and port', async () => {
  const ctx = context();
  ctx.bindings[0]!.adapter = 'ubuntu-systemd';
  ctx.bindings[0]!.instanceId = 'postgresql@18-main.service';
  const calls: CommandRequest[] = [];
  const statuses = await inspectServices(ctx, {
    platform: 'linux',
    runner: async (request) => {
      calls.push(request);
      return {
        code: 0,
        stderr: '',
        stdout: request.command.endsWith('systemctl')
          ? 'Id=postgresql@18-main.service\nLoadState=loaded\nActiveState=active\nSubState=running\nExecStart={ path=/usr/bin/pg_ctlcluster ; argv[]=pg_ctlcluster ... ; }'
          : request.command.endsWith('pg_lsclusters')
            ? '18 main 5432 online postgres /var/lib/postgresql/18/main /var/log/postgresql.log'
            : 'postgres (PostgreSQL) 18.6',
      };
    },
  });
  assert.equal(statuses[0]?.identityVerified, true);
  assert.equal(statuses[0]?.state, 'active');
  assert.ok(calls.every((call) => !['start', 'stop', 'enable'].includes(call.args[0] ?? '')));
});

test('service tracking rejects directory junctions and validates the complete manifest', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'promethee-tracking-'));
  try {
    const actual = path.join(root, 'actual');
    await mkdir(actual);
    await symlink(
      actual,
      path.join(root, '.promethee'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    await assert.rejects(readProjectServices(root), /lien ou une jonction/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
  const malformed = await mkdtemp(path.join(os.tmpdir(), 'promethee-invalid-manifest-'));
  try {
    await mkdir(path.join(malformed, '.promethee'));
    await writeFile(
      path.join(malformed, '.promethee', 'manifest.json'),
      JSON.stringify({ schemaVersion: 2, databases: [] }),
    );
    await assert.rejects(readProjectServices(malformed), /Manifeste invalide/u);
  } finally {
    await rm(malformed, { recursive: true, force: true });
  }
});

test('local-services file links are refused even when their destination is inside the selected project', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'promethee-local-link-'));
  try {
    await mkdir(path.join(root, '.promethee'));
    const resources = process.env.PROMETHEE_RESOURCE_ROOT ?? process.cwd();
    const manifest = await readFile(
      path.join(resources, 'examples', 'web-api', 'manifest.example.json'),
    );
    await writeFile(path.join(root, '.promethee', 'manifest.json'), manifest);
    const local = path.join(root, 'actual-services.json');
    await writeFile(local, JSON.stringify({ schemaVersion: 1, bindings: [] }));
    try {
      await symlink(local, path.join(root, '.promethee', 'local-services.json'), 'file');
    } catch (error) {
      if (['EPERM', 'EACCES', 'ENOTSUP'].includes((error as NodeJS.ErrnoException).code ?? '')) {
        t.skip('Cet hôte n’autorise pas la création de liens de fichiers sans élévation.');
        return;
      }
      throw error;
    }
    await assert.rejects(readProjectServices(root), /local-services ne peut pas être un lien/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
