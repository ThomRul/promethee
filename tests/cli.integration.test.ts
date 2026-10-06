import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { loadCatalogue } from '../src/core/catalogue.js';
import { resolveSelection } from '../src/core/selection.js';
import { planProject } from '../src/core/render.js';
import { createManifest } from '../src/core/manifest.js';

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const cli = fileURLToPath(new URL('../src/main.js', import.meta.url));

function run(args: string[], cwd: string = projectRoot) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd,
    env: { ...process.env, NO_COLOR: '1', TERM: 'dumb' },
    encoding: 'utf8',
    timeout: 10000,
    maxBuffer: 1024 * 1024,
    windowsHide: true,
  });
}

test('CLI help and version work without a terminal or a project', () => {
  const help = run(['--help']);
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /Usage : promethee/);
  assert.match(help.stdout, /--project/);
  const version = run(['--version']);
  assert.equal(version.status, 0, version.stderr);
  assert.equal(version.stdout.trim(), '0.2.0');
});

test('JSON status reads a selected project with Unicode/spaces and does not mutate it', async () => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'Prométhée CLI état '));
  try {
    const resources = await loadCatalogue(projectRoot);
    const selection = resolveSelection(resources, { profile: 'desktop', skillIds: [], git: false });
    const plan = await planProject(resources, selection, {
      projectName: 'Projet de test',
      documentOnly: true,
    });
    const manifest = createManifest(resources, selection, plan, 'Projet de test', true);
    await fs.mkdir(path.join(folder, '.promethee'));
    const filename = path.join(folder, '.promethee/manifest.json');
    const original = JSON.stringify(manifest, null, 2) + '\n';
    await fs.writeFile(filename, original);
    const result = run(['status', '--project', folder, '--json'], os.tmpdir());
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), manifest);
    assert.equal(await fs.readFile(filename, 'utf8'), original);
    assert.deepEqual(await fs.readdir(folder), ['.promethee']);
    assert.deepEqual(await fs.readdir(path.join(folder, '.promethee')), ['manifest.json']);
  } finally {
    await fs.rm(folder, { recursive: true, force: true });
  }
});

test('a missing manifest fails without adopting or writing in the selected folder', async () => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'promethee-untracked-'));
  try {
    await fs.writeFile(path.join(folder, 'existing.txt'), 'User content');
    const result = run(['status', '--project', folder, '--json']);
    assert.equal(result.status, 1);
    assert.deepEqual(await fs.readdir(folder), ['existing.txt']);
    assert.equal(await fs.readFile(path.join(folder, 'existing.txt'), 'utf8'), 'User content');
  } finally {
    await fs.rm(folder, { recursive: true, force: true });
  }
});

test('noninteractive creation is refused before any project files are created', async () => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'promethee-no-terminal-'));
  try {
    const result = run(['create'], folder);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /terminal interactif/);
    assert.deepEqual(await fs.readdir(folder), []);
  } finally {
    await fs.rm(folder, { recursive: true, force: true });
  }
});

test('unknown command and missing project argument return an actionable error', () => {
  const unknown = run(['unknown-command']);
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /Commande inconnue/);
  const missing = run(['status', '--project']);
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /requiert un chemin/);
});
