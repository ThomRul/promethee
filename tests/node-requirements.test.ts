import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test, { type TestContext } from 'node:test';
import semver from 'semver';
import { nodeEngineRanges } from '../src/system/node-requirements.js';

async function fixture(t: TestContext) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'promethee-node-options-'));
  t.after(async () => {
    const actual = path.resolve(root);
    assert.equal(path.dirname(actual), path.resolve(os.tmpdir()));
    assert.ok(path.basename(actual).startsWith('promethee-node-options-'));
    await rm(actual, { recursive: true, force: true });
  });
  await mkdir(path.join(root, 'templates', 'profiles', 'desktop'), { recursive: true });
  await mkdir(path.join(root, 'catalogue'));
  await writeFile(
    path.join(root, 'templates', 'profiles', 'desktop', 'package-lock.json'),
    JSON.stringify({ packages: { '': { engines: { node: '>=24 <25' } } } }),
  );
  await writeFile(
    path.join(root, 'templates', 'profiles.json'),
    JSON.stringify({
      profiles: [{ id: 'desktop', defaults: { database: 'none', uiAnimations: false } }],
      optionRules: [
        { id: 'desktop-sqlite', profiles: ['desktop'], dependencyGroup: 'sqlite' },
        {
          id: 'ui-animations',
          manifestOption: 'uiAnimations',
          profiles: ['desktop'],
          dependencyGroup: 'motion',
        },
        {
          id: 'ui-animations',
          manifestOption: 'uiAnimations',
          profiles: ['web-api'],
          dependencyGroup: 'web-only',
        },
      ],
    }),
  );
  await writeFile(
    path.join(root, 'catalogue', 'frameworks.lock.json'),
    JSON.stringify({
      optional: {
        sqlite: { dependencies: { typeorm: '1.1.1' } },
        motion: { devDependencies: { animation: '1.0.0' } },
        'web-only': { dependencies: { 'web-animation': '2.0.0' } },
      },
      packages: [
        { name: 'typeorm', version: '1.1.1', engines: { node: '>=24.11.0' } },
        { name: 'animation', version: '1.0.0', engines: { node: '>=24.12.0' } },
        { name: 'web-animation', version: '2.0.0', engines: { node: '>=26.0.0' } },
      ],
    }),
  );
  return root;
}

const accepts = (ranges: string[], version: string) =>
  ranges.every((range) => semver.satisfies(version, range));

test('selected optional dependencies constrain the usable version without blocking the base', async (t) => {
  const root = await fixture(t);
  const base = await nodeEngineRanges(root, 'desktop', {});
  const sqlite = await nodeEngineRanges(root, 'desktop', { database: 'sqlite' });
  assert.equal(accepts(base, '24.10.0'), true);
  assert.equal(accepts(sqlite, '24.10.0'), false);
  assert.equal(accepts(sqlite, '24.11.0'), true);
  assert.equal(accepts(sqlite, '24.13.1'), true);
});

test('inactive options and rules for another profile do not impose their engines', async (t) => {
  const root = await fixture(t);
  assert.equal(accepts(await nodeEngineRanges(root, 'desktop', {}), '24.0.0'), true);
  const animated = await nodeEngineRanges(root, 'desktop', { uiAnimations: true });
  assert.equal(accepts(animated, '24.11.0'), false);
  assert.equal(accepts(animated, '24.12.0'), true);
});

test('profile defaults select optional engines even when the caller omits the option', async (t) => {
  const root = await fixture(t);
  const filename = path.join(root, 'templates', 'profiles.json');
  const profiles = JSON.parse(await readFile(filename, 'utf8'));
  profiles.profiles[0].defaults.database = 'sqlite';
  await writeFile(filename, JSON.stringify(profiles));
  assert.equal(accepts(await nodeEngineRanges(root, 'desktop', {}), '24.10.0'), false);
  assert.equal(
    accepts(await nodeEngineRanges(root, 'desktop', { database: 'none' }), '24.10.0'),
    true,
  );
});

test('an exact optional package revision must have metadata before accepting a tool', async (t) => {
  const root = await fixture(t);
  const filename = path.join(root, 'catalogue', 'frameworks.lock.json');
  const frameworks = JSON.parse(await readFile(filename, 'utf8'));
  frameworks.packages[0].version = '1.1.0';
  await writeFile(filename, JSON.stringify(frameworks));
  await assert.rejects(
    nodeEngineRanges(root, 'desktop', { database: 'sqlite' }),
    /Métadonnées npm manquantes.*typeorm@1\.1\.1/u,
  );
  assert.equal(accepts(await nodeEngineRanges(root, 'desktop', {}), '24.0.0'), true);
});

test('uninterpretable engines fail explicitly in an active option or base lock', async (t) => {
  const root = await fixture(t);
  const filename = path.join(root, 'catalogue', 'frameworks.lock.json');
  const frameworks = JSON.parse(await readFile(filename, 'utf8'));
  frameworks.packages[0].engines.node = 'compatible';
  await writeFile(filename, JSON.stringify(frameworks));
  await assert.rejects(
    nodeEngineRanges(root, 'desktop', { database: 'sqlite' }),
    /Exigence Node non interprétable.*typeorm@1\.1\.1.*compatible/u,
  );
  await writeFile(
    path.join(root, 'templates', 'profiles', 'desktop', 'package-lock.json'),
    JSON.stringify({ packages: { '': { engines: { node: 'compatible' } } } }),
  );
  await assert.rejects(nodeEngineRanges(root, 'desktop', {}), /Exigence Node non interprétable/u);
});
