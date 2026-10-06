import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';
import { sha256 } from '../src/core/catalogue.js';
import { inspectDestination } from '../src/core/project.js';

const execute = promisify(execFile);
async function fixture(t: { after(fn: () => Promise<void>): void }) {
  const parent = await mkdtemp(path.join(os.tmpdir(), 'promethee-git-empty-'));
  t.after(async () => {
    assert.ok(parent.startsWith(path.resolve(os.tmpdir()) + path.sep));
    assert.ok(path.basename(parent).startsWith('promethee-git-empty-'));
    await rm(parent, { recursive: true, force: true });
  });
  const root = path.join(parent, 'project');
  await mkdir(root);
  const config = path.join(parent, 'empty-git-config');
  await writeFile(config, '');
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: config,
  };
  for (const key of Object.keys(env)) {
    if (key.startsWith('GIT_') && !['GIT_CONFIG_NOSYSTEM', 'GIT_CONFIG_GLOBAL'].includes(key))
      delete env[key];
  }
  const git = (...args: string[]) =>
    execute(
      'git',
      [
        '-c',
        'commit.gpgSign=false',
        '-c',
        'core.hooksPath=' + path.join(root, '.git/test-hooks'),
        ...args,
      ],
      { cwd: root, env, timeout: 10_000 },
    );
  await git('init', '--initial-branch=main');
  return { parent, root, git };
}

async function snapshot(root: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  async function visit(directory: string) {
    for (const entry of await readdir(path.join(root, directory), { withFileTypes: true })) {
      const relative = directory ? directory + '/' + entry.name : entry.name;
      if (entry.isDirectory()) {
        result[relative + '/'] = 'directory';
        await visit(relative);
      } else result[relative] = sha256(await readFile(path.join(root, relative)));
    }
  }
  await visit('');
  return result;
}

test('a genuine empty git init is accepted without changing its metadata', async (t) => {
  const { parent, root } = await fixture(t);
  const before = await snapshot(root);
  const destination = await inspectDestination(parent, 'project');
  assert.equal(destination.existing, true);
  assert.deepEqual(await snapshot(root), before);
});

test('a git-only folder with indexed files deleted from its working tree is refused read-only', async (t) => {
  const { parent, root, git } = await fixture(t);
  await writeFile(path.join(root, 'tracked.txt'), 'Existing work');
  await git('add', '--', 'tracked.txt');
  await rm(path.join(root, 'tracked.txt'));
  assert.deepEqual(await readdir(root), ['.git']);
  const before = await snapshot(root);
  await assert.rejects(inspectDestination(parent, 'project'), /fichiers suivis dans l’index/);
  assert.deepEqual(await snapshot(root), before);
});

test('a git-only folder with committed history and an emptied index is refused read-only', async (t) => {
  const { parent, root, git } = await fixture(t);
  await writeFile(path.join(root, 'tracked.txt'), 'Previous project');
  await git('add', '--', 'tracked.txt');
  await git(
    '-c',
    'user.name=Promethee test',
    '-c',
    'user.email=test@example.invalid',
    'commit',
    '-m',
    'fixture: existing history',
  );
  await git('rm', '--', 'tracked.txt');
  assert.deepEqual(await readdir(root), ['.git']);
  const before = await snapshot(root);
  await assert.rejects(inspectDestination(parent, 'project'), /historique/);
  assert.deepEqual(await snapshot(root), before);
});
