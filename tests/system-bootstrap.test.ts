import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  cacheArtifact,
  executeBootstrap,
  planBootstrap,
  type BootstrapRecipe,
} from '../src/system/bootstrap.js';
import type { HostInspection } from '../src/system/host.js';
import type { ToolRequirement } from '../src/system/preflight.js';

const host: HostInspection = {
  platform: 'linux',
  family: 'ubuntu',
  architecture: 'x64',
  version: 'Ubuntu24.04',
  supported: true,
  wsl: false,
  reasons: [],
  evidence: [],
};
const node: ToolRequirement = {
  id: 'node',
  label: 'Node',
  commands: [{ name: 'node' }],
  versionArgs: ['--version'],
  range: '^24',
  qualification: 'qualified',
  evidence: ['test'],
};
const bytes = Buffer.from('a verified installer fixture');
const recipe: BootstrapRecipe = {
  id: 'node-test',
  version: '24.21.0',
  family: 'ubuntu',
  architecture: 'x64',
  qualification: 'qualified',
  evidence: ['test'],
  toolIds: ['node'],
  privileged: false,
  downloads: [
    {
      filename: 'node.bin',
      url: 'https://nodejs.org/fixture.bin',
      sha256: createHash('sha256').update(bytes).digest('hex'),
      allowedHosts: ['nodejs.org'],
    },
  ],
  installer: { command: '{archive:0}', args: ['--fixture'] },
};
const hostOptions = {
  platform: 'linux' as const,
  machine: 'x86_64',
  env: {},
  readText: async () => 'ID=ubuntu\nVERSION_ID=24.04',
};

test('cache validates SHA256, reuses valid bytes and replaces corrupt bytes only after verification', async () => {
  const cache = await mkdtemp(path.join(os.tmpdir(), 'promethee-cache-'));
  let calls = 0;
  const fetcher = (async () => {
    calls++;
    return new Response(bytes);
  }) as typeof fetch;
  try {
    const filename = await cacheArtifact(recipe.downloads[0]!, recipe, cache, fetcher);
    assert.deepEqual(await readFile(filename), bytes);
    assert.equal(await cacheArtifact(recipe.downloads[0]!, recipe, cache, fetcher), filename);
    assert.equal(calls, 1);
    await writeFile(filename, 'corrupt');
    await cacheArtifact(recipe.downloads[0]!, recipe, cache, fetcher);
    assert.equal(calls, 2);
    assert.deepEqual(await readFile(filename), bytes);
    await writeFile(filename, 'old corrupt cache');
    await assert.rejects(
      cacheArtifact(
        recipe.downloads[0]!,
        recipe,
        cache,
        (async () => new Response('bad checksum')) as typeof fetch,
      ),
      /SHA256/u,
    );
    assert.equal(await readFile(filename, 'utf8'), 'old corrupt cache');
    assert.ok(
      (await readdir(path.dirname(filename))).every((entry) => !entry.endsWith('.partial')),
    );
  } finally {
    await rm(cache, { recursive: true, force: true });
  }
});

test('unapproved/tampered plans cannot call a downloader or installer', async () => {
  const plan = await planBootstrap([node], {
    host,
    recipes: [recipe],
    inspectionOptions: { resolver: async () => undefined },
  });
  assert.equal(plan.status, 'ready');
  await assert.rejects(
    executeBootstrap(plan, { approvedPlanId: 'not-approved', cacheRoot: 'unused' }),
    /non approuvé/u,
  );
  plan.actions[0] = { ...recipe, installer: { command: 'modified', args: [] } };
  await assert.rejects(
    executeBootstrap(plan, { approvedPlanId: plan.id, cacheRoot: 'unused' }),
    /modifié/u,
  );
});

test('new incompatibility between approval and execution blocks every download/install', async () => {
  const plan = await planBootstrap([node], {
    host,
    recipes: [recipe],
    inspectionOptions: { resolver: async () => undefined },
  });
  let fetched = false;
  const result = await executeBootstrap(plan, {
    approvedPlanId: plan.id,
    cacheRoot: 'unused',
    hostOptions,
    inspectionOptions: {
      resolver: async () => '/node',
      runner: async () => ({ code: 0, stdout: 'v22.0.0', stderr: '' }),
    },
    fetcher: (async () => {
      fetched = true;
      return new Response(bytes);
    }) as typeof fetch,
  });
  assert.equal(result.state, 'incomplete');
  assert.equal(fetched, false);
  assert.deepEqual(result.steps, []);
});

test('approved missing-tool recipe executes once, then verifies normal PATH before success', async () => {
  const cache = await mkdtemp(path.join(os.tmpdir(), 'promethee-install-test-'));
  let installed = false,
    installs = 0;
  const resolver = async () => (installed ? '/normal/node' : undefined);
  const plan = await planBootstrap([node], {
    host,
    recipes: [recipe],
    inspectionOptions: { resolver },
  });
  try {
    const result = await executeBootstrap(plan, {
      approvedPlanId: plan.id,
      cacheRoot: cache,
      hostOptions,
      inspectionOptions: { resolver },
      fetcher: (async () => new Response(bytes)) as typeof fetch,
      runner: async ({ command }) => {
        if (command.endsWith('node.bin')) {
          installs++;
          installed = true;
        }
        return { code: 0, stdout: command === '/normal/node' ? 'v24.21.0' : '', stderr: '' };
      },
    });
    assert.equal(result.state, 'succeeded');
    assert.equal(installs, 1);
    assert.deepEqual(
      result.steps.map((step) => step.phase),
      ['download', 'install', 'verify'],
    );
  } finally {
    await rm(cache, { recursive: true, force: true });
  }
});
