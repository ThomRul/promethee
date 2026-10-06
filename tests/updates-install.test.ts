import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { loadCatalogue } from '../src/core/catalogue.js';
import { resolveSelection } from '../src/core/selection.js';
import { createProject } from '../src/core/project.js';
import { readManifest } from '../src/core/manifest.js';
import { planSkillUpdates, applySkillUpdates } from '../src/core/skill-updates.js';
import { installProjectDependencies } from '../src/core/install.js';
import type { CommandRunner } from '../src/system/commands.js';
import type { ToolInspection } from '../src/system/preflight.js';

const resourcesRoot = process.cwd();
async function fixture(t: any, skillIds: string[] = [], documentOnly = false) {
  const parent = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), 'promethee-operations-')),
  );
  t.after(async () => {
    const actual = path.resolve(parent);
    assert.ok(
      path.basename(actual).startsWith('promethee-operations-') &&
        path.dirname(actual) === path.resolve(os.tmpdir()),
    );
    await fs.rm(actual, { recursive: true, force: true });
  });
  const resources = await loadCatalogue(resourcesRoot);
  const selection = resolveSelection(resources, { profile: 'desktop', skillIds, git: false });
  return createProject({
    resourcesRoot,
    parentDirectory: parent,
    folderName: 'projet',
    projectName: 'Projet test',
    selection,
    documentOnly,
  });
}
test('skill updates preserve custom prose by default and replace only explicit choices with full backup', async (t) => {
  const { root } = await fixture(t, ['humanizer'], true);
  const file = path.join(root, '.agents/skills/humanizer/SKILL.md');
  const custom = (await fs.readFile(file, 'utf8')) + '\nMa règle locale.\n';
  await fs.writeFile(file, custom);
  const plan = await planSkillUpdates(root, resourcesRoot);
  assert.equal(plan[0]?.action, 'preserve-custom');
  await applySkillUpdates(root, resourcesRoot, { expected: plan });
  assert.equal(await fs.readFile(file, 'utf8'), custom);
  assert.equal((await readManifest(root)).skills[0]?.state, 'preserved-custom');
  const second = await planSkillUpdates(root, resourcesRoot);
  await applySkillUpdates(root, resourcesRoot, {
    expected: second,
    replaceModified: ['humanizer'],
  });
  const record = (await readManifest(root)).skills[0]!;
  assert.equal(record.state, 'installed');
  assert.equal(await fs.readFile(path.join(root, record.backupPath!, 'SKILL.md'), 'utf8'), custom);
  assert.notEqual(await fs.readFile(file, 'utf8'), custom);
});
test('a skill changed after the recap is not overwritten or backed up', async (t) => {
  const { root } = await fixture(t, ['humanizer'], true);
  const file = path.join(root, '.agents/skills/humanizer/SKILL.md');
  await fs.appendFile(file, '\nPremière modification.');
  const plan = await planSkillUpdates(root, resourcesRoot);
  await fs.appendFile(file, '\nDeuxième modification.');
  await assert.rejects(
    applySkillUpdates(root, resourcesRoot, { expected: plan, replaceModified: ['humanizer'] }),
    /changé/,
  );
  assert.ok((await fs.readFile(file, 'utf8')).endsWith('Deuxième modification.'));
  await assert.rejects(fs.access(path.join(root, '.promethee/backups')));
});
const tools: ToolInspection[] = [
  {
    id: 'npm',
    state: 'compatible',
    qualification: 'qualified',
    version: '11.19.0',
    executable: process.execPath,
    reason: 'runner injecté',
  },
];

test('incompatible tools stop dependency installation without altering the manifest', async (t) => {
  const { root, plan } = await fixture(t);
  const file = path.join(root, '.promethee/manifest.json');
  const before = await fs.readFile(file);
  let invoked = false;
  await assert.rejects(
    installProjectDependencies(
      root,
      plan.dependencyTargets,
      [{ ...tools[0]!, state: 'incompatible' }],
      async () => {
        invoked = true;
        return { code: 0, stdout: '', stderr: '' };
      },
    ),
    /Précontrôle/,
  );
  assert.equal(invoked, false);
  assert.deepEqual(await fs.readFile(file), before);
  await assert.rejects(fs.access(path.join(root, '.promethee/local-checks.json')));
});
test('unchanged successful dependency/verification steps are reused; source changes rerun only checks', async (t) => {
  const { root, plan } = await fixture(t);
  const calls: string[][] = [];
  const runner: CommandRunner = async (r) => {
    calls.push([...r.args]);
    return { code: 0, stdout: '', stderr: '' };
  };
  await installProjectDependencies(root, plan.dependencyTargets, tools, runner);
  assert.ok(calls.length > 1);
  calls.length = 0;
  await installProjectDependencies(root, plan.dependencyTargets, tools, runner);
  assert.equal(calls.length, 0);
  await fs.appendFile(path.join(root, 'src/App.tsx'), '\n// Modification utilisateur\n');
  await installProjectDependencies(root, plan.dependencyTargets, tools, runner);
  assert.ok(calls.length > 0);
  assert.ok(calls.every((args) => args[0] === 'run'));
});
test('a failed dependency command is recorded and never claimed verified', async (t) => {
  const { root, plan } = await fixture(t);
  await assert.rejects(
    installProjectDependencies(root, plan.dependencyTargets, tools, async () => ({
      code: 1,
      stdout: '',
      stderr: 'failure',
    })),
    /Échec/,
  );
  const m = await readManifest(root);
  assert.equal(m.steps.find((s) => s.id === 'dependencies')?.state, 'failed');
  assert.notEqual(m.steps.find((s) => s.id === 'verification')?.state, 'succeeded');
  assert.equal(m.steps.find((s) => s.id === 'git-init')?.state, 'skipped');
});
test('changed sources during checks invalidate verification instead of creating a reusable proof', async (t) => {
  const { root, plan } = await fixture(t);
  const runner: CommandRunner = async (r) => {
    if (r.args[0] === 'run' && r.args[1] === 'build')
      await fs.appendFile(path.join(root, 'src/App.tsx'), '\n// Changed during check\n');
    return { code: 0, stdout: '', stderr: '' };
  };
  await assert.rejects(
    installProjectDependencies(root, plan.dependencyTargets, tools, runner),
    /sources ont changé/,
  );
  assert.equal(
    (await readManifest(root)).steps.find((s) => s.id === 'verification' && s.target === '.')
      ?.state,
    'failed',
  );
});
