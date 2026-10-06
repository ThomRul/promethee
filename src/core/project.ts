import { lstat, mkdir, readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { assertEmptyGitMetadata } from './git-empty.js';
import { loadCatalogue, safeRelativePath, sha256, type CatalogueResources } from './catalogue.js';
import {
  createManifest,
  readManifest,
  updateStep,
  writeManifest,
  type Manifest,
} from './manifest.js';
import { planProject, type ProjectPlan } from './render.js';
import { assertInstallable, resolveSelection, type Selection } from './selection.js';

export interface CreateProjectInput {
  resourcesRoot: string;
  parentDirectory: string;
  folderName: string;
  projectName: string;
  selection: Selection;
  documentOnly?: boolean;
  installDependencies?: boolean;
}
export interface ProjectResult {
  root: string;
  manifest: Manifest;
  selection: Selection;
  plan: ProjectPlan;
}
export interface Destination {
  root: string;
  parent: string;
  existing: boolean;
}

function samePath(a: string, b: string): boolean {
  return process.platform === 'win32'
    ? path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase()
    : path.resolve(a) === path.resolve(b);
}
export function validateFolderName(name: string): void {
  if (
    !name ||
    name === '.' ||
    name === '..' ||
    /[<>:"/\\|?*\x00-\x1f\x7f]/.test(name) ||
    /[. ]$/.test(name) ||
    /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)
  ) {
    throw new Error(
      'Nom du dossier invalide : choisir un seul nom de dossier sans chemin ni caractère réservé.',
    );
  }
}
async function exists(filename: string): Promise<boolean> {
  try {
    await lstat(filename);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

export async function inspectDestination(
  parentDirectory: string,
  folderName: string,
): Promise<Destination> {
  validateFolderName(folderName);
  if (!path.isAbsolute(parentDirectory))
    throw new Error('Choisir explicitement un dossier parent absolu.');
  const parent = await realpath(parentDirectory);
  if (!samePath(parentDirectory, parent))
    throw new Error(
      `Le dossier parent redirige vers ${parent}. Sélectionner ce chemin réel avant installation.`,
    );
  if (!(await lstat(parent)).isDirectory())
    throw new Error('Le parent doit être un dossier existant.');
  const root = path.join(parent, folderName);
  const existing = await exists(root);
  if (existing) {
    const stat = await lstat(root);
    if (!stat.isDirectory() || stat.isSymbolicLink())
      throw new Error('Destination liée ou non régulière refusée.');
    const entries = await readdir(root);
    if (entries.some((entry) => entry !== '.git'))
      throw new Error(
        'Le dossier est non vide. Choisir un nouveau dossier ou reprendre un projet Prométhée suivi.',
      );
    if (entries.includes('.git')) {
      const git = await lstat(path.join(root, '.git'));
      if (!git.isDirectory() || git.isSymbolicLink())
        throw new Error('Seul un dossier .git existant et non lié est admissible.');
      await assertEmptyGitMetadata(path.join(root, '.git'));
    }
  }
  return { root, parent, existing };
}

async function assertRoot(root: string): Promise<void> {
  const stat = await lstat(root);
  if (!stat.isDirectory() || stat.isSymbolicLink() || !samePath(root, await realpath(root))) {
    throw new Error('La destination a changé ou pointe vers un autre emplacement.');
  }
}

async function ensureDirectory(root: string, relative: string): Promise<void> {
  await assertRoot(root);
  let current = root;
  for (const part of relative.split('/').filter((part) => part !== '.' && part !== '')) {
    current = path.join(current, part);
    if (!(await exists(current))) await mkdir(current);
    const stat = await lstat(current);
    if (!stat.isDirectory() || stat.isSymbolicLink())
      throw new Error('Un dossier cible a été remplacé par un lien ou un fichier.');
  }
}

async function writeNewFile(root: string, relative: string, buffer: Buffer): Promise<void> {
  safeRelativePath(relative);
  await ensureDirectory(root, path.posix.dirname(relative));
  await assertRoot(root);
  await writeFile(path.join(root, relative), buffer, { flag: 'wx' });
}

function selectionFromManifest(resources: CatalogueResources, manifest: Manifest): Selection {
  return resolveSelection(resources, {
    profile: manifest.project.profile,
    options: manifest.project.options,
    skillIds: manifest.skills.map((skill) => skill.id),
    scope: manifest.project.scope,
    git: manifest.project.git,
  });
}

export async function createProject(input: CreateProjectInput): Promise<ProjectResult> {
  if (input.installDependencies)
    throw new Error(
      'Les dépendances doivent être installées par l’orchestrateur après le précontrôle des outils.',
    );
  const resources = await loadCatalogue(input.resourcesRoot);
  const selection = resolveSelection(resources, {
    profile: input.selection.profile.id,
    options: input.selection.options,
    skillIds: input.selection.skills.map((skill) => skill.id),
    scope: input.selection.scope,
    git: input.selection.git,
  });
  if (!input.documentOnly) assertInstallable(selection);
  const destination = await inspectDestination(input.parentDirectory, input.folderName);
  const plan = await planProject(resources, selection, {
    projectName: input.projectName,
    documentOnly: input.documentOnly,
  });
  // Hashes, eligibility, source files and destination are checked before the first write.
  await inspectDestination(input.parentDirectory, input.folderName);
  if (!samePath(destination.parent, await realpath(input.parentDirectory)))
    throw new Error('Le parent sélectionné a changé.');
  if (!destination.existing) await mkdir(destination.root);
  await ensureDirectory(destination.root, '.promethee');
  const manifest = createManifest(
    resources,
    selection,
    plan,
    input.projectName,
    input.documentOnly,
  );
  await writeManifest(destination.root, manifest);
  try {
    for (const [relative, buffer] of plan.files)
      await writeNewFile(destination.root, relative, buffer);
    if (!input.documentOnly) updateStep(manifest, 'scaffold', 'succeeded');
    updateStep(manifest, 'documents', 'succeeded');
    updateStep(manifest, 'skills', 'succeeded');
    for (const skill of manifest.skills) skill.state = 'installed';
    await writeManifest(destination.root, manifest);
  } catch (error) {
    updateStep(manifest, input.documentOnly ? 'documents' : 'scaffold', 'failed', undefined, {
      code: 'SCAFFOLD_FAILED',
      message:
        error instanceof Error ? error.message.replace(/[\r\n]+/g, ' ') : 'Écriture interrompue.',
    });
    await writeManifest(destination.root, manifest);
    throw error;
  }
  return { root: destination.root, manifest, selection, plan };
}

export async function resumeProject(root: string, resourcesRoot: string): Promise<ProjectResult> {
  if (!path.isAbsolute(root)) throw new Error('Choisir un chemin de projet absolu.');
  await assertRoot(root);
  const manifest = await readManifest(root);
  const resources = await loadCatalogue(resourcesRoot);
  if (manifest.catalogue.sha256 !== resources.catalogueHash)
    throw new Error(
      'Le catalogue a changé : reprise automatique refusée pour préserver le projet.',
    );
  const selection = selectionFromManifest(resources, manifest);
  const documentOnly = manifest.steps.some(
    (step) => step.id === 'scaffold' && step.state === 'skipped',
  );
  if (!documentOnly) assertInstallable(selection);
  const plan = await planProject(resources, selection, {
    projectName: manifest.project.name,
    documentOnly,
  });
  const completed = new Set(
    manifest.steps.filter((step) => step.state === 'succeeded').map((step) => step.id),
  );
  for (const file of manifest.files) {
    safeRelativePath(file.path);
    const expected = plan.files.get(file.path);
    if (!expected || sha256(expected) !== file.sha256)
      throw new Error(`Ressource de reprise différente : ${file.path}`);
    let current = root;
    const parts = file.path.split('/');
    for (const [index, part] of parts.entries()) {
      current = path.join(current, part);
      if (!(await exists(current))) break;
      const stat = await lstat(current);
      if (
        stat.isSymbolicLink() ||
        (index < parts.length - 1 ? !stat.isDirectory() : !stat.isFile())
      ) {
        throw new Error(`Chemin suivi lié ou non régulier : ${file.path}`);
      }
    }
  }
  // No repair begins before every recorded baseline and existing path is admissible.
  for (const file of manifest.files) {
    const expected = plan.files.get(file.path)!;
    const phase = file.path.startsWith('.agents/skills/')
      ? 'skills'
      : file.path.startsWith('docs/') ||
          ['AGENTS.md', 'PROJECT.md', 'handoff.txt', '.gitignore'].includes(file.path)
        ? 'documents'
        : 'scaffold';
    if (!(await exists(path.join(root, file.path)))) {
      // A deletion after a successful phase can be intentional; repair only an interrupted phase.
      if (!completed.has(phase)) await writeNewFile(root, file.path, expected);
    } else {
      await ensureDirectory(root, path.posix.dirname(file.path));
      if ((await lstat(path.join(root, file.path))).isSymbolicLink())
        throw new Error(`Fichier suivi lié : ${file.path}`);
    }
  }
  for (const skill of manifest.skills) {
    let custom = false;
    const skillRoot = path.join(root, '.agents', 'skills', skill.id);
    for (const file of skill.baselineFiles) {
      try {
        const buffer = await readFile(path.join(skillRoot, file.path));
        if (sha256(buffer) !== file.sha256) custom = true;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        custom = true;
      }
    }
    const actualFiles = (await exists(skillRoot)) ? await listProjectFiles(skillRoot) : [];
    if (actualFiles.length !== skill.baselineFiles.length) custom = true;
    skill.state = custom ? 'preserved-custom' : 'installed';
  }
  if (!documentOnly) updateStep(manifest, 'scaffold', 'succeeded');
  updateStep(manifest, 'documents', 'succeeded');
  updateStep(manifest, 'skills', 'succeeded');
  await writeManifest(root, manifest);
  return { root, manifest, selection, plan };
}

async function listProjectFiles(root: string): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error('Lien dans un skill suivi : reprise refusée.');
    if (entry.isDirectory())
      result.push(
        ...(await listProjectFiles(path.join(root, entry.name))).map(
          (file) => `${entry.name}/${file}`,
        ),
      );
    else result.push(entry.name);
  }
  return result;
}
