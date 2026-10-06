import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  loadCatalogue,
  resourceFiles,
  sha256,
  verifiedSkillFiles,
  type CatalogueResources,
  type Skill,
} from './catalogue.js';
import { readManifest, writeManifest, type ManifestSkill } from './manifest.js';

export interface SkillUpdate {
  id: string;
  action: 'current' | 'update' | 'preserve-custom' | 'unavailable';
  old: ManifestSkill;
  next?: Skill;
  tree?: string;
}
async function inside(root: string, relative: string, create = false): Promise<string> {
  const canonical = await fs.realpath(root);
  let current = canonical;
  for (const part of relative.split('/')) {
    if (!part || part === '.' || part === '..' || /[\\\x00-\x1f]/.test(part))
      throw Error('Chemin de skill invalide.');
    current = path.join(current, part);
    let stat;
    try {
      stat = await fs.lstat(current);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      if (create) {
        await fs.mkdir(current);
        stat = await fs.lstat(current);
      } else throw error;
    }
    if (stat.isSymbolicLink() || !stat.isDirectory())
      throw Error('Répertoire lié ou non régulier refusé.');
  }
  return current;
}
async function treeHash(directory: string): Promise<string> {
  const prefix = path.basename(directory);
  const files = await resourceFiles(path.dirname(directory), prefix);
  const rows = [];
  for (const file of files) {
    const relative = file.slice(prefix.length + 1);
    rows.push(relative + '\0' + sha256(await fs.readFile(path.join(directory, relative))));
  }
  return sha256(rows.join('\n'));
}
export async function planSkillUpdates(
  root: string,
  resourcesRoot: string,
): Promise<SkillUpdate[]> {
  const manifest = await readManifest(root);
  const resources = await loadCatalogue(resourcesRoot);
  const updates = [];
  for (const old of manifest.skills) {
    const next = resources.skills.find(
      (s) => s.id === old.id && s.status === 'adapted-static-qualified',
    );
    if (!next || !next.profiles.includes(manifest.project.profile)) {
      updates.push({ id: old.id, action: 'unavailable' as const, old });
      continue;
    }
    await verifiedSkillFiles(resources, next);
    const directory = await inside(root, '.agents/skills/' + old.id);
    const tree = await treeHash(directory);
    const custom = tree !== old.installedTreeSha256;
    updates.push({
      id: old.id,
      action: custom ? 'preserve-custom' : tree === next.adaptedTreeSha256 ? 'current' : 'update',
      old,
      next,
      tree,
    } as SkillUpdate);
  }
  return updates;
}
export async function applySkillUpdates(
  root: string,
  resourcesRoot: string,
  options: { replaceModified?: string[]; expected?: SkillUpdate[] } = {},
): Promise<SkillUpdate[]> {
  const updates = await planSkillUpdates(root, resourcesRoot);
  if (
    options.expected &&
    JSON.stringify(updates.map((x) => [x.id, x.action, x.tree, x.next?.adaptedTreeSha256])) !==
      JSON.stringify(
        options.expected.map((x) => [x.id, x.action, x.tree, x.next?.adaptedTreeSha256]),
      )
  )
    throw Error('Les skills ont changé depuis le récapitulatif. Refaire la sélection.');
  const replacements = new Set(options.replaceModified ?? []);
  if (
    [...replacements].some(
      (id) => !updates.some((x) => x.id === id && x.action === 'preserve-custom'),
    )
  )
    throw Error('Remplacement non applicable à ce skill.');
  const resources = await loadCatalogue(resourcesRoot);
  const manifest = await readManifest(root);
  for (const update of updates) {
    const record = manifest.skills.find((s) => s.id === update.id)!;
    if (update.action === 'preserve-custom' && !replacements.has(update.id)) {
      record.state = 'preserved-custom';
      if (update.next?.revision !== record.revision)
        record.deferredRevision = update.next?.revision;
      continue;
    }
    if (update.action === 'current' || update.action === 'unavailable') continue;
    const next = update.next!;
    const files = await verifiedSkillFiles(resources, next);
    const destination = await inside(root, '.agents/skills/' + update.id);
    if ((await treeHash(destination)) !== update.tree)
      throw Error('Le skill a changé pendant la mise à jour : ' + update.id);
    const stamp = Date.now() + '-' + randomUUID();
    const backupRelative = '.promethee/backups/' + stamp + '/' + update.id;
    const backupParent = await inside(root, '.promethee/backups/' + stamp, true);
    const backup = path.join(backupParent, update.id);
    const stageParent = await inside(root, '.promethee/tmp', true);
    const stage = path.join(stageParent, 'skill-' + stamp);
    await fs.mkdir(stage);
    for (const [relative, buffer] of files) {
      const target = path.join(stage, relative);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, buffer, { flag: 'wx' });
    }
    if ((await treeHash(stage)) !== next.adaptedTreeSha256) throw Error('Copie préparée invalide.');
    // Preserve the complete old tree outside discovery. Roll back if replacement fails.
    await fs.rename(destination, backup);
    try {
      await fs.rename(stage, destination);
    } catch (error) {
      await fs.rename(backup, destination);
      throw error;
    }
    Object.assign(record, {
      source: next.upstreamUrl,
      revision: next.revision,
      adaptationVersion: next.adaptationVersion!,
      installedTreeSha256: next.adaptedTreeSha256!,
      baselineFiles: next.files.map((f) => ({ path: f.path, sha256: f.sha256 })),
      state: 'installed',
      backupPath: backupRelative,
    });
    delete record.deferredRevision;
    const prefix = '.agents/skills/' + update.id + '/';
    manifest.files = manifest.files.filter((f) => !f.path.startsWith(prefix));
    manifest.files.push(...next.files.map((f) => ({ path: prefix + f.path, sha256: f.sha256 })));
    manifest.updatedAt = new Date().toISOString();
    await writeManifest(root, manifest);
  }
  manifest.catalogue = { id: 'promethee-0.2.0', sha256: resources.catalogueHash };
  manifest.updatedAt = new Date().toISOString();
  await writeManifest(root, manifest);
  return updates;
}
