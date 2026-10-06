import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

// The runtime verifier is plain JavaScript so it also runs before TypeScript compilation.
const verifierPath = '../../scripts/verify-resources.mjs';
const packagerPath = '../../scripts/package-distribution.mjs';
const { verifyResources, safeResourcePath } = await import(verifierPath);
const { validateRuntime } = await import(packagerPath);
const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
const revision = '1'.repeat(40);
const upstreamUrl = `https://github.com/example/skills/tree/${revision}/test`;

async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'promethee-resource-test-'));
  const files: Record<string, string> = {
    'SKILL.md': '---\nname: fixture\ndescription: Apply a focused local review.\n---\n# Fixture\n',
    LICENSE:
      'MIT License\nPermission is hereby granted, free of charge.\nTHE SOFTWARE IS PROVIDED AS IS.\n',
    'NOTICE.promethee': `Source: ${upstreamUrl}\nRevision: ${revision}\n`,
    'PROMETHEE-SOURCE.json': JSON.stringify({
      id: 'fixture',
      repository: 'example/skills',
      revision,
      source: 'test',
      upstreamUrl,
      license: 'MIT',
      adaptationVersion: 1,
    }),
  };
  const baseline = Object.entries(files)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([file, text]) => ({ path: file, bytes: Buffer.byteLength(text), sha256: sha256(text) }));
  const entries = [
    {
      id: 'fixture',
      revision,
      repo: 'example/skills',
      source: 'test',
      upstreamUrl,
      status: 'adapted-static-qualified',
      license: 'MIT',
      adaptationVersion: 1,
      paidDependencyRequired: false,
      profiles: ['web-api', 'php', 'desktop', 'mobile'],
      files: baseline,
      adaptedEntrySha256: baseline.find((file) => file.path === 'SKILL.md')!.sha256,
      adaptedTreeSha256: sha256(baseline.map((file) => `${file.path}\0${file.sha256}`).join('\n')),
    },
    { id: 'blocked', revision, status: 'blocked-redistribution', files: [] },
  ];
  async function write(relative: string, content: string) {
    const full = path.join(root, relative);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, content);
  }
  for (const [file, text] of Object.entries(files))
    await write(`catalogue/skills/fixture/${file}`, text);
  await write('catalogue/skills.lock.json', JSON.stringify({ schemaVersion: 1, entries }));
  await write(
    'catalogue/skill-routing.json',
    JSON.stringify({
      entries: [
        {
          id: 'fixture',
          profiles: ['web-api', 'php', 'desktop', 'mobile'],
          trigger: 'Review requested',
          limit: 'Relevant files only',
        },
      ],
    }),
  );
  await write(
    'catalogue/frameworks.lock.json',
    JSON.stringify({
      packages: [
        {
          name: 'example',
          version: '1.2.3',
          integrity: 'sha512-abcdef',
          tarball: 'https://registry.npmjs.org/example/-/example-1.2.3.tgz',
        },
      ],
    }),
  );
  await write(
    'templates/profiles.json',
    JSON.stringify({
      profiles: ['web-api', 'php', 'desktop', 'mobile'].map((id) => ({
        id,
        template: `profiles/${id}`,
        skills: ['fixture'],
        skillSelection: { defaults: ['fixture'], optional: [] },
      })),
    }),
  );
  for (const id of ['web-api', 'php', 'desktop', 'mobile'])
    await write(`templates/profiles/${id}/file.txt`, 'Template');
  await write('branding/art.txt', 'Hand');
  return { root, write, close: () => fs.rm(root, { recursive: true, force: true }) };
}

test('a qualified, pinned resource tree passes while an absent blocked entry stays excluded', async () => {
  const f = await fixture();
  try {
    const report = await verifyResources(f.root, { validateExamples: false });
    assert.equal(report.passed, true, report.errors.join('\n'));
    assert.equal(report.adaptedSkills, 1);
    assert.equal(report.blockedSkills, 1);
    assert.equal(report.checkedFiles, 4);
  } finally {
    await f.close();
  }
});

test('tampering with skill contents fails by hash instead of updating the baseline', async () => {
  const f = await fixture();
  try {
    await fs.appendFile(
      path.join(f.root, 'catalogue/skills/fixture/SKILL.md'),
      'Unexpected external instruction',
    );
    const report = await verifyResources(f.root, { validateExamples: false });
    assert.equal(report.passed, false);
    assert.ok(report.errors.some((error: string) => error.includes('SKILL.md: hash mismatch')));
  } finally {
    await f.close();
  }
});

test('a copied blocked entry and an untracked skill file both fail', async () => {
  const f = await fixture();
  try {
    await f.write('catalogue/skills/blocked/SKILL.md', 'Unqualified');
    await f.write('catalogue/skills/fixture/extra.sh', 'Untracked script');
    const report = await verifyResources(f.root, { validateExamples: false });
    assert.equal(report.passed, false);
    assert.ok(
      report.errors.some((error: string) =>
        error.includes('blocked: unqualified skill must not be copied'),
      ),
    );
    assert.ok(
      report.errors.some((error: string) => error.includes('fixture: missing or unexpected files')),
    );
  } finally {
    await f.close();
  }
});

test('a missing license fails even if every remaining instruction is unchanged', async () => {
  const f = await fixture();
  try {
    await fs.unlink(path.join(f.root, 'catalogue/skills/fixture/LICENSE'));
    const report = await verifyResources(f.root, { validateExamples: false });
    assert.equal(report.passed, false);
    assert.ok(report.errors.some((error: string) => error.includes('missing complete licence')));
  } finally {
    await f.close();
  }
});

test('metadata paths cannot read outside their selected resource tree', () => {
  for (const value of [
    '../secret',
    'a/../../secret',
    '/tmp/secret',
    'C:/secret',
    'a\\secret',
    './file',
    'a\u0000b',
  ]) {
    assert.throws(() => safeResourcePath('/resources', value), /Unsafe resource path/);
  }
  assert.equal(
    safeResourcePath('/resources', 'nested/écran.md'),
    path.join('/resources', 'nested', 'écran.md'),
  );
});

test('provenance mismatch and unsupported routing profiles are rejected', async () => {
  const f = await fixture();
  try {
    const file = path.join(f.root, 'catalogue/skills/fixture/PROMETHEE-SOURCE.json');
    const source = JSON.parse(await fs.readFile(file, 'utf8'));
    source.revision = '2'.repeat(40);
    await fs.writeFile(file, JSON.stringify(source));
    const routeFile = path.join(f.root, 'catalogue/skill-routing.json');
    const routes = JSON.parse(await fs.readFile(routeFile, 'utf8'));
    routes.entries[0].profiles.push('unknown');
    await fs.writeFile(routeFile, JSON.stringify(routes));
    const report = await verifyResources(f.root, { validateExamples: false });
    assert.ok(
      report.errors.some((error: string) => error.includes('provenance revision mismatch')),
    );
    assert.ok(report.errors.some((error: string) => error.includes('unsupported routing profile')));
  } finally {
    await f.close();
  }
});

test('packaging rejects missing runtime and unpinned runtime before running any executable', async () => {
  await assert.rejects(
    validateRuntime({
      platform: 'windows',
      runtimeVersion: '24.21.0',
      referenceVersion: '24.21.0',
    }),
    /runtime-dir/,
  );
  await assert.rejects(
    validateRuntime({
      platform: 'windows',
      runtimeDir: 'unused',
      runtimeVersion: '24.13.1',
      referenceVersion: '24.21.0',
    }),
    /pinned reference/,
  );
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'promethee-runtime-test-'));
  try {
    await fs.writeFile(path.join(root, 'node.exe'), 'Fake node');
    await assert.rejects(
      validateRuntime({
        platform: 'windows',
        runtimeDir: root,
        runtimeVersion: '24.21.0',
        referenceVersion: '24.21.0',
      }),
      /ENOENT/,
    );
    await fs.writeFile(path.join(root, 'LICENSE'), 'Synthetic');
    await assert.rejects(
      validateRuntime({
        platform: 'windows',
        runtimeDir: root,
        runtimeVersion: '24.21.0',
        referenceVersion: '24.21.0',
      }),
      /PE Node/,
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
