import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { verificationFingerprint } from '../src/core/checks.js';

const outputs = ['dist', 'out', 'build', 'coverage', '.expo', '.next', '.vite', '.vitest', 'docs'];
const ignoredEverywhere = ['node_modules', 'vendor', '.git', '.promethee', '.agents'];

async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'promethee-fingerprint-'));
  async function write(relative: string, text = 'initial') {
    const full = path.join(root, relative);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, text);
  }
  await write('src/index.ts');
  return { root, write, close: () => fs.rm(root, { recursive: true, force: true }) };
}

test('verification fingerprint excludes outputs, logs and TypeScript caches only at target root', async () => {
  const f = await fixture();
  try {
    const initial = await verificationFingerprint(f.root, 'tools-v1');
    for (const directory of outputs) {
      await f.write(`${directory}/generated.txt`);
      assert.equal(await verificationFingerprint(f.root, 'tools-v1'), initial, directory);
    }
    await f.write('build.log');
    assert.equal(await verificationFingerprint(f.root, 'tools-v1'), initial);
    await f.write('tsconfig.tsbuildinfo');
    assert.equal(await verificationFingerprint(f.root, 'tools-v1'), initial);
    await f.write('tsconfig.tsbuildinfo', 'incremental build cache changed');
    assert.equal(await verificationFingerprint(f.root, 'tools-v1'), initial);
    assert.notEqual(await verificationFingerprint(f.root, 'tools-v2'), initial);
  } finally {
    await f.close();
  }
});

test('nested source folders named like outputs remain part of verification fingerprint', async () => {
  const f = await fixture();
  try {
    for (const directory of outputs) {
      const relative = `src/features/${directory}/source.ts`;
      await f.write(relative);
      const before = await verificationFingerprint(f.root, 'tools-v1');
      await f.write(relative, 'source changed');
      assert.notEqual(await verificationFingerprint(f.root, 'tools-v1'), before, directory);
    }
    await f.write('src/fixtures/example.log');
    const before = await verificationFingerprint(f.root, 'tools-v1');
    await f.write('src/fixtures/example.log', 'fixture changed');
    assert.notEqual(await verificationFingerprint(f.root, 'tools-v1'), before);
    await f.write('src/fixtures/tsconfig.tsbuildinfo');
    const beforeCache = await verificationFingerprint(f.root, 'tools-v1');
    await f.write('src/fixtures/tsconfig.tsbuildinfo', 'fixture changed');
    assert.notEqual(await verificationFingerprint(f.root, 'tools-v1'), beforeCache);
  } finally {
    await f.close();
  }
});

test('dependency and project metadata directories stay excluded at every depth', async () => {
  const f = await fixture();
  try {
    const initial = await verificationFingerprint(f.root, 'tools-v1');
    for (const directory of ignoredEverywhere) {
      await f.write(`${directory}/internal.txt`);
      await f.write(`src/features/${directory}/internal.txt`);
      assert.equal(await verificationFingerprint(f.root, 'tools-v1'), initial, directory);
    }
  } finally {
    await f.close();
  }
});
