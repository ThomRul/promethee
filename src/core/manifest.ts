import { lstat, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  safeRelativePath,
  sha256,
  type CatalogueResources,
  type FileHash,
  type OptionValue,
} from './catalogue.js';
import type { ProjectPlan } from './render.js';
import type { Selection } from './selection.js';

export type StepState = 'planned' | 'running' | 'succeeded' | 'failed' | 'skipped';
export type StepId =
  | 'scaffold'
  | 'dependencies'
  | 'skills'
  | 'documents'
  | 'verification'
  | 'git-init'
  | 'initial-commit'
  | 'preflight'
  | 'tool-install'
  | 'tool-verification'
  | 'database-setup'
  | 'database-verification'
  | 'native-build'
  | 'native-launch';
export interface ManifestStep {
  id: StepId;
  target?: string;
  state: StepState;
  updatedAt?: string;
  error?: { code: string; message: string };
  toolId?: string;
  databaseId?: string;
}
export type DatabaseMode = 'native' | 'containerized' | 'embedded' | 'remote' | 'undecided';
export interface ManifestDatabase {
  id: string;
  engine: 'postgresql' | 'mysql' | 'mariadb' | 'sqlite';
  mode: DatabaseMode;
  target: string;
  state: 'planned' | 'configured' | 'verified' | 'failed';
  qualification?: 'qualified' | 'pending';
}
export interface ManifestSkill {
  id: string;
  source: string;
  revision: string;
  adaptationVersion: number;
  installedTreeSha256: string;
  baselineFiles: FileHash[];
  state: 'installed' | 'preserved-custom' | 'pending' | 'failed';
  deferredRevision?: string;
  backupPath?: string;
}
export interface ManifestTool {
  id: string;
  required: boolean;
  referenceVersion?: string;
  compatibility?: string;
  detectedVersion?: string;
  state:
    | 'planned'
    | 'compatible'
    | 'missing'
    | 'incompatible'
    | 'detection-failed'
    | 'installed'
    | 'failed';
  qualification?: 'qualified' | 'pending';
}
export interface Manifest {
  schemaVersion: 2;
  cliVersion: string;
  createdAt: string;
  updatedAt: string;
  project: {
    name: string;
    packageName: string;
    profile: string;
    scope: 'defined' | 'undefined';
    docker: 'undecided' | 'none' | 'development' | 'deployment' | 'both';
    git: boolean;
    options: Record<string, OptionValue>;
  };
  catalogue: { id: string; sha256: string };
  versions: Record<string, string>;
  files: FileHash[];
  skills: ManifestSkill[];
  steps: ManifestStep[];
  toolchain: ManifestTool[];
  databases: ManifestDatabase[];
}
export const manifestRelativePath = '.promethee/manifest.json';

export function databasePlan(selection: Selection): ManifestDatabase[] {
  const result: ManifestDatabase[] = [];
  const { id } = selection.profile;
  if (selection.options.database !== 'none') {
    const engine = selection.options.database as ManifestDatabase['engine'];
    result.push({
      id: 'main',
      engine,
      mode: engine === 'sqlite' ? 'embedded' : 'undecided',
      target:
        id === 'web-api'
          ? 'backend'
          : id === 'mobile' && selection.options.backend === 'new'
            ? 'mobile'
            : '.',
      state: 'planned',
    });
  }
  if (id === 'mobile' && selection.options.backend === 'new') {
    result.push({
      id: 'backend',
      engine: 'postgresql',
      mode: 'undecided',
      target: 'backend',
      state: 'planned',
    });
  }
  return result;
}

export function createManifest(
  resources: CatalogueResources,
  selection: Selection,
  plan: ProjectPlan,
  projectName: string,
  documentOnly = false,
): Manifest {
  const now = new Date().toISOString();
  const steps: ManifestStep[] = [
    { id: 'preflight', state: documentOnly ? 'skipped' : 'planned' },
    { id: 'tool-install', state: documentOnly ? 'skipped' : 'planned' },
    { id: 'tool-verification', state: documentOnly ? 'skipped' : 'planned' },
    { id: 'scaffold', state: documentOnly ? 'skipped' : 'planned' },
    { id: 'skills', state: 'planned' },
    { id: 'documents', state: 'planned' },
    ...plan.dependencyTargets.map((target) => ({
      id: 'dependencies' as const,
      target: target.target,
      state: 'planned' as const,
    })),
    { id: 'verification', state: documentOnly ? 'skipped' : 'planned' },
    { id: 'git-init', state: documentOnly || !selection.git ? 'skipped' : 'planned' },
    { id: 'initial-commit', state: documentOnly || !selection.git ? 'skipped' : 'planned' },
  ];
  const databases = databasePlan(selection);
  for (const database of databases) {
    steps.push(
      {
        id: 'database-setup',
        databaseId: database.id,
        state: documentOnly ? 'skipped' : 'planned',
      },
      {
        id: 'database-verification',
        databaseId: database.id,
        state: documentOnly ? 'skipped' : 'planned',
      },
    );
  }
  if (selection.profile.id === 'mobile' && selection.options.mobileMode === 'android-local') {
    steps.push(
      { id: 'native-build', state: documentOnly ? 'skipped' : 'planned' },
      { id: 'native-launch', state: documentOnly ? 'skipped' : 'planned' },
    );
  }
  return {
    schemaVersion: 2,
    cliVersion: '0.2.0',
    createdAt: now,
    updatedAt: now,
    project: {
      name: projectName,
      packageName: plan.packageName,
      profile: selection.profile.id,
      scope: selection.scope,
      docker: 'undecided',
      git: selection.git,
      options: selection.options,
    },
    catalogue: { id: 'promethee-0.2.0', sha256: resources.catalogueHash },
    versions: { ...resources.frameworkLock.referenceRuntime },
    databases,
    toolchain: [],
    steps,
    files: [...plan.files].map(([relative, buffer]) => ({
      path: relative,
      sha256: sha256(buffer),
    })),
    skills: selection.skills.map((skill) => ({
      id: skill.id,
      source: skill.upstreamUrl,
      revision: skill.revision,
      adaptationVersion: skill.adaptationVersion!,
      installedTreeSha256: skill.adaptedTreeSha256!,
      baselineFiles: skill.files.map(({ path: relative, sha256: hash }) => ({
        path: relative,
        sha256: hash,
      })),
      state: 'pending',
    })),
  };
}

export function updateStep(
  manifest: Manifest,
  id: StepId,
  state: StepState,
  target?: string,
  error?: { code: string; message: string },
  context: { toolId?: string; databaseId?: string } = {},
): void {
  let step = manifest.steps.find(
    (candidate) =>
      candidate.id === id &&
      candidate.target === target &&
      candidate.toolId === context.toolId &&
      candidate.databaseId === context.databaseId,
  );
  if (!step) {
    step = { id, state, ...(target ? { target } : {}), ...context };
    manifest.steps.push(step);
  }
  step.state = state;
  step.updatedAt = new Date().toISOString();
  if (error) step.error = error;
  else delete step.error;
  manifest.updatedAt = step.updatedAt;
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Manifeste invalide : objet attendu.');
  return value as Record<string, unknown>;
}
function keys(value: Record<string, unknown>, required: string[], optional: string[] = []): void {
  if (
    required.some((key) => !(key in value)) ||
    Object.keys(value).some((key) => !required.includes(key) && !optional.includes(key))
  ) {
    throw new Error('Manifeste invalide : propriétés manquantes ou inattendues.');
  }
}
function text(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !value.length || /[\x00-\x1f]/.test(value))
    throw new Error('Manifeste invalide : texte attendu.');
}
function choice(value: unknown, allowed: string[]): void {
  if (typeof value !== 'string' || !allowed.includes(value))
    throw new Error('Manifeste invalide : valeur inconnue.');
}
function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error('Manifeste invalide : liste attendue.');
  return value;
}
function identifier(value: unknown): void {
  text(value);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(value)) throw new Error('Identifiant invalide.');
}
function hash(value: unknown): void {
  text(value);
  if (!/^[a-f0-9]{64}$/.test(value)) throw new Error('Empreinte invalide.');
}
function relative(value: unknown): void {
  text(value);
  safeRelativePath(value === '.' ? '_root' : value);
}
function fileList(value: unknown): void {
  const seen = new Set<string>();
  for (const row of array(value)) {
    const file = record(row);
    keys(file, ['path', 'sha256']);
    text(file.path);
    safeRelativePath(file.path);
    hash(file.sha256);
    if (seen.has(String(file.path))) throw new Error('Chemin dupliqué dans le manifeste.');
    seen.add(String(file.path));
  }
}

function uniqueIds(value: unknown): Set<string> {
  const seen = new Set<string>();
  for (const row of array(value)) {
    const id = record(row).id;
    identifier(id);
    if (seen.has(String(id))) throw new Error('Identifiant dupliqué dans le manifeste.');
    seen.add(String(id));
  }
  return seen;
}

export function validateManifest(input: unknown): Manifest {
  const value = record(input);
  keys(value, [
    'schemaVersion',
    'cliVersion',
    'createdAt',
    'updatedAt',
    'project',
    'catalogue',
    'versions',
    'files',
    'skills',
    'steps',
    'toolchain',
    'databases',
  ]);
  if (value.schemaVersion !== 2) throw new Error('Version de manifeste incompatible.');
  text(value.cliVersion);
  for (const key of ['createdAt', 'updatedAt']) {
    text(value[key]);
    if (Number.isNaN(Date.parse(value[key]))) throw new Error('Date invalide.');
  }
  const project = record(value.project);
  keys(project, ['name', 'packageName', 'profile', 'scope', 'docker', 'git', 'options']);
  text(project.name);
  text(project.packageName);
  choice(project.profile, ['web-api', 'php', 'desktop', 'mobile']);
  choice(project.scope, ['defined', 'undefined']);
  choice(project.docker, ['undecided', 'none', 'development', 'deployment', 'both']);
  if (typeof project.git !== 'boolean') throw new Error('Choix Git invalide.');
  const options = record(project.options);
  keys(
    options,
    ['uiAnimations', 'database'],
    ['editorialAnimations', 'livewire', 'mobileMode', 'androidTarget', 'backend'],
  );
  for (const key of ['uiAnimations', 'editorialAnimations', 'livewire'])
    if (key in options && typeof options[key] !== 'boolean')
      throw new Error('Option booléenne invalide.');
  choice(options.database, ['none', 'postgresql', 'mysql', 'mariadb', 'sqlite']);
  if (project.profile === 'mobile') {
    choice(options.backend, ['none', 'existing', 'new']);
    choice(options.mobileMode, ['android-local', 'expo-go']);
    if (options.mobileMode === 'expo-go' && 'androidTarget' in options)
      throw new Error('Cible Android inactive.');
    if (options.mobileMode === 'android-local')
      choice(options.androidTarget, ['device', 'emulator']);
  } else if (['backend', 'mobileMode', 'androidTarget'].some((key) => key in options))
    throw new Error('Options mobiles hors profil.');
  if (!['web-api', 'php'].includes(String(project.profile)) && 'editorialAnimations' in options)
    throw new Error('Option éditoriale hors profil.');
  if (project.profile !== 'php' && 'livewire' in options)
    throw new Error('Livewire hors profil PHP.');
  const allowedDatabases: Record<string, string[]> = {
    'web-api': ['postgresql'],
    php: ['mysql', 'mariadb'],
    desktop: ['none', 'sqlite'],
    mobile: ['none', 'sqlite'],
  };
  choice(options.database, allowedDatabases[String(project.profile)]!);
  if (
    ['web-api', 'php'].includes(String(project.profile)) &&
    typeof options.editorialAnimations !== 'boolean'
  )
    throw new Error('Option éditoriale manquante.');
  if (project.profile === 'php' && typeof options.livewire !== 'boolean')
    throw new Error('Option Livewire manquante.');
  const catalogue = record(value.catalogue);
  keys(catalogue, ['id', 'sha256']);
  text(catalogue.id);
  hash(catalogue.sha256);
  for (const version of Object.values(record(value.versions))) text(version);
  fileList(value.files);
  uniqueIds(value.skills);
  for (const row of array(value.skills)) {
    const skill = record(row);
    keys(
      skill,
      [
        'id',
        'source',
        'revision',
        'adaptationVersion',
        'installedTreeSha256',
        'baselineFiles',
        'state',
      ],
      ['deferredRevision', 'backupPath'],
    );
    identifier(skill.id);
    text(skill.source);
    if (!/^https:\/\//.test(skill.source)) throw new Error('Source de skill invalide.');
    text(skill.revision);
    if (!/^[a-f0-9]{40}$/.test(skill.revision)) throw new Error('Révision invalide.');
    if (!Number.isInteger(skill.adaptationVersion) || Number(skill.adaptationVersion) < 1)
      throw new Error('Adaptation invalide.');
    hash(skill.installedTreeSha256);
    fileList(skill.baselineFiles);
    choice(skill.state, ['installed', 'preserved-custom', 'pending', 'failed']);
    if (skill.backupPath !== undefined) relative(skill.backupPath);
    if (
      skill.deferredRevision !== undefined &&
      !/^[a-f0-9]{40}$/.test(String(skill.deferredRevision))
    )
      throw new Error('Révision différée invalide.');
  }
  const states = ['planned', 'running', 'succeeded', 'failed', 'skipped'];
  const ids = [
    'scaffold',
    'dependencies',
    'skills',
    'documents',
    'verification',
    'git-init',
    'initial-commit',
    'preflight',
    'tool-install',
    'tool-verification',
    'database-setup',
    'database-verification',
    'native-build',
    'native-launch',
  ];
  const toolIds = uniqueIds(value.toolchain);
  const databaseIds = uniqueIds(value.databases);
  const stepKeys = new Set<string>();
  for (const row of array(value.steps)) {
    const step = record(row);
    keys(step, ['id', 'state'], ['target', 'updatedAt', 'error', 'toolId', 'databaseId']);
    choice(step.id, ids);
    choice(step.state, states);
    if (step.target !== undefined) relative(step.target);
    for (const key of ['toolId', 'databaseId']) if (step[key] !== undefined) identifier(step[key]);
    if (step.toolId !== undefined && !toolIds.has(String(step.toolId)))
      throw new Error('Référence à un outil absent.');
    if (step.databaseId !== undefined && !databaseIds.has(String(step.databaseId)))
      throw new Error('Référence à une base absente.');
    const key = JSON.stringify([step.id, step.target, step.toolId, step.databaseId]);
    if (stepKeys.has(key)) throw new Error('Étape dupliquée dans le manifeste.');
    stepKeys.add(key);
    if (step.updatedAt !== undefined) {
      text(step.updatedAt);
      if (Number.isNaN(Date.parse(step.updatedAt))) throw new Error('Date d’étape invalide.');
    }
    if (step.error !== undefined) {
      const error = record(step.error);
      keys(error, ['code', 'message']);
      text(error.code);
      text(error.message);
    }
  }
  for (const row of array(value.toolchain)) {
    const tool = record(row);
    keys(
      tool,
      ['id', 'required', 'state'],
      ['referenceVersion', 'compatibility', 'detectedVersion', 'qualification'],
    );
    identifier(tool.id);
    if (typeof tool.required !== 'boolean') throw new Error('Prérequis invalide.');
    choice(tool.state, [
      'planned',
      'compatible',
      'missing',
      'incompatible',
      'detection-failed',
      'installed',
      'failed',
    ]);
    for (const key of ['referenceVersion', 'compatibility', 'detectedVersion'])
      if (tool[key] !== undefined) text(tool[key]);
    if (tool.qualification !== undefined) choice(tool.qualification, ['qualified', 'pending']);
  }
  for (const row of array(value.databases)) {
    const database = record(row);
    keys(database, ['id', 'engine', 'mode', 'target', 'state'], ['qualification']);
    identifier(database.id);
    relative(database.target);
    choice(database.engine, ['postgresql', 'mysql', 'mariadb', 'sqlite']);
    choice(database.mode, ['native', 'containerized', 'embedded', 'remote', 'undecided']);
    choice(database.state, ['planned', 'configured', 'verified', 'failed']);
    if ((database.engine === 'sqlite') !== (database.mode === 'embedded'))
      throw new Error('Mode de base incompatible avec le moteur.');
    if (database.qualification !== undefined)
      choice(database.qualification, ['qualified', 'pending']);
  }
  return input as Manifest;
}

export async function readManifest(root: string): Promise<Manifest> {
  const directory = path.join(root, '.promethee');
  if ((await lstat(directory)).isSymbolicLink())
    throw new Error('Le suivi du projet ne peut pas être un lien.');
  const filename = path.join(root, manifestRelativePath);
  if ((await lstat(filename)).isSymbolicLink())
    throw new Error('Le manifeste ne peut pas être un lien.');
  return validateManifest(JSON.parse(await readFile(filename, 'utf8')));
}

export async function writeManifest(root: string, manifest: Manifest): Promise<void> {
  validateManifest(manifest);
  const directory = path.join(root, '.promethee');
  if ((await lstat(directory)).isSymbolicLink())
    throw new Error('Le suivi du projet ne peut pas être un lien.');
  const temp = path.join(directory, `manifest-${process.pid}-${Date.now()}.tmp`);
  await writeFile(temp, JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
  const filename = path.join(directory, 'manifest.json');
  try {
    if ((await lstat(filename)).isSymbolicLink()) throw new Error('Manifeste lié refusé.');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  await rename(temp, filename);
}
