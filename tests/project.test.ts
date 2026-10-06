import assert from 'node:assert/strict';
import {
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { loadCatalogue, sha256, verifiedSkillFiles } from '../src/core/catalogue.js';
import { readManifest, updateStep, validateManifest, writeManifest } from '../src/core/manifest.js';
import { createProject, inspectDestination, resumeProject } from '../src/core/project.js';
import { planProject } from '../src/core/render.js';
import { availableSkills, resolveSelection } from '../src/core/selection.js';

const resourcesRoot = process.env.PROMETHEE_RESOURCES_ROOT ?? process.cwd();
const resources = await loadCatalogue(resourcesRoot);

async function temporary(t: { after(fn: () => Promise<void>): void }): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'promethee-engine-'));
  t.after(async () => {
    assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir()) + path.sep));
    assert.ok(path.basename(dir).startsWith('promethee-engine-'));
    await rm(dir, { recursive: true, force: true });
  });
  return dir;
}

test('manual deselection and profile-specific skills/options remain authoritative', () => {
  const empty = resolveSelection(resources, { profile: 'web-api', skillIds: [] });
  assert.deepEqual(empty.skills, []);
  assert.throws(
    () => resolveSelection(resources, { profile: 'mobile', skillIds: ['frontend-a11y'] }),
    /indisponible/,
  );
  assert.throws(
    () => resolveSelection(resources, { profile: 'php', options: { backend: 'new' } }),
    /Option incompatible/,
  );
  assert.throws(
    () => resolveSelection(resources, { profile: 'web-api', skillIds: ['motion'] }),
    /indisponible/,
  );
  assert.throws(
    () => resolveSelection(resources, { profile: 'web-api', skillIds: ['gpt-taste'] }),
    /indisponible/,
  );
  assert.throws(
    () => resolveSelection(resources, { profile: 'web-api', skillIds: ['humanizer', 'humanizer'] }),
    /uniques/,
  );
  const editorial = resolveSelection(resources, {
    profile: 'web-api',
    options: { editorialAnimations: true },
    skillIds: [],
  });
  assert.equal(editorial.skills.length, 0);
  assert.ok(editorial.qualificationBlockers.some((message) => message.includes('gsap')));
});

test('Impeccable is eligible on every UI profile, with native reference routing', async () => {
  for (const profile of resources.profiles) {
    const selection = resolveSelection(resources, {
      profile: profile.id,
      skillIds: ['impeccable'],
      ...(profile.id === 'mobile' ? { options: { mobileMode: 'expo-go' } } : {}),
    });
    assert.ok(
      availableSkills(resources, profile.id, selection.options).some(
        (skill) => skill.id === 'impeccable',
      ),
    );
    const plan = await planProject(resources, selection, { projectName: 'Test critique' });
    const routing = plan.files.get('docs/agent-guides/skill-routing.md')!.toString();
    assert.match(routing, /impeccable\/SKILL\.md/);
    assert.ok(plan.files.has('.agents/skills/impeccable/references/native.md'));
    assert.doesNotMatch(plan.files.get('AGENTS.md')!.toString(), /UI UX Pro Max pilote/);
  }
});

test('selected skill integrity rejects modified content and undeclared files', async (t) => {
  const dir = await temporary(t);
  const skill = resources.skills.find((entry) => entry.id === 'humanizer')!;
  await cp(
    path.join(resources.root, 'catalogue/skills/humanizer'),
    path.join(dir, 'catalogue/skills/humanizer'),
    { recursive: true },
  );
  const isolated = { ...resources, root: dir };
  const files = await verifiedSkillFiles(isolated, skill);
  assert.ok(files.has('SKILL.md'));
  await writeFile(path.join(dir, 'catalogue/skills/humanizer/SKILL.md'), 'modified');
  await assert.rejects(verifiedSkillFiles(isolated, skill), /Intégrité/);
  await cp(
    path.join(resources.root, 'catalogue/skills/humanizer/SKILL.md'),
    path.join(dir, 'catalogue/skills/humanizer/SKILL.md'),
  );
  await writeFile(path.join(dir, 'catalogue/skills/humanizer/unlisted.txt'), 'unexpected');
  await assert.rejects(verifiedSkillFiles(isolated, skill), /Contenu du skill/);
});

test('destination is explicit, traversal/nonempty folders rejected, empty git-only folder preserved', async (t) => {
  const parent = await temporary(t);
  await assert.rejects(inspectDestination('.', 'demo'), /absolu/);
  for (const name of ['../escape', '..', 'a/b', 'CON', 'name.', 'bad\nname']) {
    await assert.rejects(inspectDestination(parent, name), /Nom du dossier/);
  }
  const occupied = path.join(parent, 'occupied');
  await mkdir(occupied);
  await writeFile(path.join(occupied, 'user.txt'), 'preserve');
  await assert.rejects(inspectDestination(parent, 'occupied'), /non vide/);
  const gitOnly = path.join(parent, 'git-only');
  await mkdir(path.join(gitOnly, '.git'), { recursive: true });
  await writeFile(path.join(gitOnly, '.git/config'), '[core]');
  const selection = resolveSelection(resources, { profile: 'desktop', skillIds: [], git: false });
  const result = await createProject({
    resourcesRoot,
    parentDirectory: parent,
    folderName: 'git-only',
    projectName: 'Mon projet',
    selection,
  });
  assert.equal(await readFile(path.join(gitOnly, '.git/config'), 'utf8'), '[core]');
  assert.equal(result.manifest.project.git, false);
  assert.equal(
    result.manifest.steps.find((step) => step.id === 'initial-commit')?.state,
    'skipped',
  );
});

test('unqualified options block before project mutation, documentary preview records no framework installation', async (t) => {
  const parent = await temporary(t);
  const selection = resolveSelection(resources, { profile: 'mobile', skillIds: ['humanizer'] });
  await assert.rejects(
    createProject({
      resourcesRoot,
      parentDirectory: parent,
      folderName: 'blocked',
      projectName: 'Mobile',
      selection,
    }),
    /qualification/,
  );
  assert.deepEqual(await readdir(parent), []);
  const preview = await createProject({
    resourcesRoot,
    parentDirectory: parent,
    folderName: 'preview',
    projectName: 'Mobile',
    selection,
    documentOnly: true,
  });
  assert.equal(preview.manifest.steps.find((step) => step.id === 'scaffold')?.state, 'skipped');
  assert.equal(preview.manifest.steps.find((step) => step.id === 'native-build')?.state, 'skipped');
  assert.equal(preview.manifest.skills[0]?.state, 'installed');
  assert.match(
    await readFile(path.join(preview.root, 'handoff.txt'), 'utf8'),
    /aucun framework ni outil installé/,
  );
  assert.equal(preview.plan.dependencyTargets.length, 0);
  assert.equal(
    await lstat(path.join(preview.root, 'AGENTS.md')).then((stat) => stat.isFile()),
    true,
  );
  await assert.rejects(lstat(path.join(preview.root, 'package.json')), { code: 'ENOENT' });
});

test('mobile Expo Go and new API have correct directories/maps and independent databases', async () => {
  const selection = resolveSelection(resources, {
    profile: 'mobile',
    options: { mobileMode: 'expo-go', backend: 'new', database: 'sqlite' },
  });
  assert.equal(selection.options.androidTarget, undefined);
  assert.equal(selection.qualificationBlockers.length, 0);
  const plan = await planProject(resources, selection, { projectName: 'Appli mobile' });
  assert.ok(plan.files.has('mobile/src/app/index.tsx'));
  assert.ok(plan.files.has('backend/src/main.ts'));
  assert.equal(plan.files.has('src/app/index.tsx'), false);
  assert.match(
    plan.files.get('docs/agent-map/zones/mobile.md')!.toString(),
    /mobile\/src\/app\/_layout.tsx/,
  );
  assert.match(
    plan.files.get('docs/agent-map/ROUTING.md')!.toString(),
    /supabase-postgres-best-practices/,
  );
  const pkg = JSON.parse(plan.files.get('mobile/package.json')!.toString());
  assert.equal(pkg.scripts.start, 'expo start --go');
  assert.equal(pkg.scripts.android, undefined);
  assert.equal(pkg.dependencies['expo-sqlite'], '57.0.3');
  assert.equal(
    plan.dependencyTargets.find((target) => target.target === 'mobile')?.lockNeedsUpdate,
    true,
  );
});

test('installed scaffold and manifest report only actual completed steps; resume preserves modifications', async (t) => {
  const parent = await temporary(t);
  const selection = resolveSelection(resources, {
    profile: 'web-api',
    skillIds: ['humanizer'],
    git: false,
  });
  const created = await createProject({
    resourcesRoot,
    parentDirectory: parent,
    folderName: 'mon-projet',
    projectName: 'Mon projet',
    selection,
  });
  const manifest = await readManifest(created.root);
  assert.equal(manifest.schemaVersion, 2);
  assert.equal(manifest.steps.find((step) => step.id === 'scaffold')?.state, 'succeeded');
  assert.ok(
    manifest.steps
      .filter((step) => step.id === 'dependencies')
      .every((step) => step.state === 'planned'),
  );
  assert.equal(manifest.steps.find((step) => step.id === 'verification')?.state, 'planned');
  assert.equal(manifest.databases[0]?.mode, 'undecided');
  const modified = path.join(created.root, '.agents/skills/humanizer/SKILL.md');
  await writeFile(modified, 'User-custom skill\n');
  const missing = path.join(created.root, 'frontend/src/main.tsx');
  await rm(missing);
  updateStep(manifest, 'scaffold', 'failed');
  await writeManifest(created.root, manifest);
  await writeFile(path.join(created.root, 'user-note.md'), 'User work');
  const resumed = await resumeProject(created.root, resourcesRoot);
  assert.equal(await readFile(modified, 'utf8'), 'User-custom skill\n');
  assert.equal(resumed.manifest.skills[0]?.state, 'preserved-custom');
  assert.equal(
    sha256(await readFile(missing)),
    manifest.files.find((file) => file.path === 'frontend/src/main.tsx')?.sha256,
  );
  assert.equal(await readFile(path.join(created.root, 'user-note.md'), 'utf8'), 'User work');
  await rm(path.join(created.root, 'frontend/src/App.tsx'));
  await rm(path.join(created.root, '.agents/skills/humanizer/SKILL.md'));
  const again = await resumeProject(created.root, resourcesRoot);
  await assert.rejects(lstat(path.join(created.root, 'frontend/src/App.tsx')), { code: 'ENOENT' });
  await assert.rejects(lstat(path.join(created.root, '.agents/skills/humanizer/SKILL.md')), {
    code: 'ENOENT',
  });
  assert.equal(again.manifest.skills[0]?.state, 'preserved-custom');
});

test('manifest rejects unsupported versions, path escape and unknown executable fields', async (t) => {
  const parent = await temporary(t);
  const selection = resolveSelection(resources, { profile: 'desktop', skillIds: [], git: false });
  const { manifest } = await createProject({
    resourcesRoot,
    parentDirectory: parent,
    folderName: 'schema',
    projectName: 'Schema',
    selection,
  });
  assert.throws(() => validateManifest({ ...manifest, schemaVersion: 1 }), /Version/);
  assert.throws(
    () => validateManifest({ ...manifest, files: [{ path: '../escape', sha256: 'a'.repeat(64) }] }),
    /Chemin/,
  );
  assert.throws(() => validateManifest({ ...manifest, run: 'cmd /c anything' }), /inattendues/);
  assert.throws(
    () => validateManifest({ ...manifest, steps: [manifest.steps[0], manifest.steps[0]] }),
    /dupliquée/,
  );
  assert.throws(
    () =>
      validateManifest({
        ...manifest,
        steps: [{ id: 'tool-install', state: 'planned', toolId: 'missing' }],
      }),
    /outil absent/,
  );
  assert.throws(
    () =>
      validateManifest({
        ...manifest,
        project: {
          ...manifest.project,
          options: { ...manifest.project.options, database: 'mysql' },
        },
      }),
    /valeur inconnue/,
  );
  assert.throws(
    () =>
      validateManifest({
        ...manifest,
        project: { ...manifest.project, options: { ...manifest.project.options, livewire: false } },
      }),
    /Livewire hors/,
  );
  assert.throws(
    () => validateManifest({ ...manifest, files: [{ path: '.', sha256: 'a'.repeat(64) }] }),
    /Chemin/,
  );
  assert.throws(
    () =>
      validateManifest({
        ...manifest,
        databases: [
          {
            id: 'main',
            engine: 'sqlite',
            mode: 'embedded',
            target: '../../other',
            state: 'planned',
          },
        ],
      }),
    /Chemin/,
  );
});

test('resume checks every baseline before restoring an interrupted project', async (t) => {
  const parent = await temporary(t);
  const selection = resolveSelection(resources, { profile: 'desktop', skillIds: [], git: false });
  const created = await createProject({
    resourcesRoot,
    parentDirectory: parent,
    folderName: 'resume-check',
    projectName: 'Resume check',
    selection,
  });
  await rm(path.join(created.root, 'src/App.tsx'));
  updateStep(created.manifest, 'scaffold', 'failed');
  created.manifest.files.at(-1)!.sha256 = 'a'.repeat(64);
  await writeManifest(created.root, created.manifest);
  await assert.rejects(
    resumeProject(created.root, resourcesRoot),
    /Ressource de reprise différente/,
  );
  await assert.rejects(lstat(path.join(created.root, 'src/App.tsx')), { code: 'ENOENT' });
});

test('symlink destination is refused before writing', async (t) => {
  const parent = await temporary(t);
  const other = path.join(parent, 'other');
  await mkdir(other);
  try {
    await symlink(
      other,
      path.join(parent, 'linked'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EPERM') {
      t.skip('Symlinks unavailable on host');
      return;
    }
    throw error;
  }
  await assert.rejects(inspectDestination(parent, 'linked'), /liée/);
  assert.deepEqual(await readdir(other), []);
});
