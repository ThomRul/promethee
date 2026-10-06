import { createHash } from 'node:crypto';
import { lstat, readFile, readdir, realpath } from 'node:fs/promises';
import path from 'node:path';

export type OptionValue = string | boolean;
export type FileHash = { path: string; sha256: string; bytes?: number };
export interface Zone {
  id: string;
  label: string;
  paths: string[];
  responsibility: string;
  boundaries: string;
  reusable: string;
  checks: string[];
}
export interface Profile {
  id: string;
  label: string;
  template: string;
  dependencyGroups: string[];
  guide: string;
  stack: string;
  defaults: Record<string, OptionValue>;
  options: string[];
  commands: Record<string, string[]>;
  zones: Zone[];
  skillSelection: {
    defaults: string[];
    optional: string[];
    optionSuggestedSkills: Record<string, string[]>;
  };
}
export interface OptionRule {
  id: string;
  profiles: string[];
  manifestOption?: string;
  choices?: string[];
  default?: OptionValue;
  when?: Record<string, OptionValue>;
  qualification?: string;
  skill?: string;
  skillStatus?: string;
  suggestedSkills?: string[];
  additionalSkills?: string[];
  dependencyGroup?: string;
  additionalTemplate?: string;
  guide?: string;
  composer?: Record<string, string>;
  removeNpm?: string[];
  env?: Record<string, string>;
}
export interface Skill {
  id: string;
  repo: string;
  profiles: string[];
  status: string;
  license: string;
  upstreamUrl: string;
  revision: string;
  adaptationVersion?: number;
  files: FileHash[];
  adaptedTreeSha256?: string;
  paidDependencyRequired: boolean;
}
export interface SkillRouting {
  id: string;
  purpose: string;
  profiles: string[];
  zones: string | Record<string, string[]>;
  when?: Record<string, OptionValue | string[]>;
  trigger: string;
  limit: string;
  toolRequirements: string[];
}
export type Dependencies = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
export interface CatalogueResources {
  root: string;
  catalogueHash: string;
  profiles: Profile[];
  optionRules: OptionRule[];
  skills: Skill[];
  routing: SkillRouting[];
  frameworkLock: {
    profiles: Record<string, Dependencies>;
    optional: Record<string, Dependencies>;
    referenceRuntime: Record<string, string>;
    composer: Record<string, string>;
  };
}

export function sha256(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

export function safeRelativePath(value: string): string {
  if (
    !value ||
    value.includes('\\') ||
    value.includes('\0') ||
    path.posix.isAbsolute(value) ||
    /^[a-z]:/i.test(value) ||
    value.split('/').some((part) => !part || part === '.' || part === '..')
  ) {
    throw new Error(`Chemin relatif invalide : ${value}`);
  }
  return value;
}

export async function readResource(root: string, relative: string): Promise<Buffer> {
  safeRelativePath(relative);
  let current = root;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    if ((await lstat(current)).isSymbolicLink())
      throw new Error(`Lien de ressource refusé : ${relative}`);
  }
  return readFile(current);
}

export async function resourceFiles(root: string, relative: string): Promise<string[]> {
  safeRelativePath(relative);
  const result: string[] = [];
  async function visit(directory: string): Promise<void> {
    for (const entry of await readdir(path.join(root, directory), { withFileTypes: true })) {
      const name = `${directory}/${entry.name}`;
      if (entry.isSymbolicLink()) throw new Error(`Lien de ressource refusé : ${name}`);
      if (entry.isDirectory()) await visit(name);
      else if (entry.isFile()) result.push(name);
      else throw new Error(`Ressource non régulière : ${name}`);
    }
  }
  let current = root;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    const stat = await lstat(current);
    if (!stat.isDirectory() || stat.isSymbolicLink())
      throw new Error(`Dossier de ressource invalide : ${relative}`);
  }
  await visit(relative);
  return result.sort();
}

export async function loadCatalogue(root: string): Promise<CatalogueResources> {
  const resolved = await realpath(root);
  const names = [
    'templates/profiles.json',
    'catalogue/frameworks.lock.json',
    'catalogue/skills.lock.json',
    'catalogue/skill-routing.json',
  ];
  const buffers = await Promise.all(names.map((name) => readResource(resolved, name)));
  const [profiles, frameworkLock, skillLock, routing] = buffers.map((buffer) =>
    JSON.parse(buffer.toString('utf8')),
  );
  if (
    profiles.schemaVersion !== 2 ||
    !Array.isArray(profiles.profiles) ||
    !Array.isArray(skillLock.entries) ||
    !Array.isArray(routing.entries) ||
    !frameworkLock.profiles ||
    !Array.isArray(profiles.optionRules)
  ) {
    throw new Error('Catalogue incompatible ou incomplet.');
  }
  for (const items of [profiles.profiles, skillLock.entries, routing.entries]) {
    const ids = items.map((entry: { id: string }) => entry.id);
    if (
      ids.some((id: string) => !/^[a-z0-9][a-z0-9-]*$/.test(id)) ||
      new Set(ids).size !== ids.length
    ) {
      throw new Error('Identifiants du catalogue invalides ou dupliqués.');
    }
  }
  return {
    root: resolved,
    catalogueHash: sha256(Buffer.concat(buffers)),
    profiles: profiles.profiles,
    optionRules: profiles.optionRules,
    frameworkLock,
    skills: skillLock.entries,
    routing: routing.entries,
  };
}

export async function verifiedSkillFiles(
  resources: CatalogueResources,
  skill: Skill,
): Promise<Map<string, Buffer>> {
  if (
    skill.status !== 'adapted-static-qualified' ||
    skill.paidDependencyRequired ||
    !['MIT', 'Apache-2.0'].includes(skill.license) ||
    !skill.adaptedTreeSha256 ||
    !skill.adaptationVersion
  ) {
    throw new Error(`Skill non distribuable : ${skill.id}`);
  }
  const prefix = `catalogue/skills/${skill.id}/`;
  const actual = (await resourceFiles(resources.root, prefix.slice(0, -1))).map((file) =>
    file.slice(prefix.length),
  );
  const expected = skill.files.map((file) => safeRelativePath(file.path)).sort();
  if (
    JSON.stringify(actual) !== JSON.stringify(expected) ||
    !expected.includes('SKILL.md') ||
    !expected.some((name) => /(?:^|\/)LICENSE(?:\.|$)/.test(name))
  ) {
    throw new Error(`Contenu du skill différent du catalogue : ${skill.id}`);
  }
  const result = new Map<string, Buffer>();
  for (const file of skill.files) {
    const buffer = await readResource(resources.root, prefix + file.path);
    if (
      sha256(buffer) !== file.sha256 ||
      (file.bytes !== undefined && file.bytes !== buffer.length)
    ) {
      throw new Error(`Intégrité du skill invalide : ${skill.id}/${file.path}`);
    }
    result.set(file.path, buffer);
  }
  // File hashes are authoritative; require the catalogue's aggregate fingerprint too.
  const digest = sha256(skill.files.map((file) => `${file.path}\0${file.sha256}`).join('\n'));
  if (digest !== skill.adaptedTreeSha256) {
    throw new Error(`Empreinte du skill invalide : ${skill.id}`);
  }
  return result;
}
