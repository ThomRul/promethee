import fs from 'node:fs/promises';
import path from 'node:path';
import { sha256, safeRelativePath } from './catalogue.js';

export type LocalChecks = {
  schemaVersion: 1;
  targets: Record<string, { dependencies?: string; verification?: string }>;
};
export async function checkedDirectory(root: string, target: string): Promise<string> {
  if (target !== '.') safeRelativePath(target);
  let current = path.resolve(root);
  if ((await fs.realpath(current)) !== current || (await fs.lstat(current)).isSymbolicLink())
    throw Error('Le dossier du projet a changé.');
  for (const part of target === '.' ? [] : target.split('/')) {
    current = path.join(current, part);
    const stat = await fs.lstat(current);
    if (!stat.isDirectory() || stat.isSymbolicLink())
      throw Error('Le bloc du projet a changé ou est lié.');
  }
  if ((await fs.realpath(current)) !== current) throw Error('Le bloc du projet redirige ailleurs.');
  return current;
}
export async function readChecks(root: string): Promise<LocalChecks> {
  const file = path.join(root, '.promethee/local-checks.json');
  try {
    if (!(await fs.lstat(file)).isFile() || (await fs.lstat(file)).isSymbolicLink())
      throw Error('Preuves locales liées ou invalides.');
    const result = JSON.parse(await fs.readFile(file, 'utf8'));
    if (
      result.schemaVersion !== 1 ||
      !result.targets ||
      typeof result.targets !== 'object' ||
      Array.isArray(result.targets)
    )
      throw Error('Preuves locales invalides.');
    for (const [target, row] of Object.entries(result.targets)) {
      if (target !== '.') safeRelativePath(target);
      if (
        !row ||
        typeof row !== 'object' ||
        Object.values(row).some((v) => typeof v !== 'string' || !/^[a-f0-9]{64}$/.test(v))
      )
        throw Error('Empreinte locale invalide.');
    }
    return result;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    return { schemaVersion: 1, targets: {} };
  }
}
export async function writeChecks(root: string, checks: LocalChecks): Promise<void> {
  await checkedDirectory(root, '.promethee');
  const file = path.join(root, '.promethee/local-checks.json');
  try {
    if ((await fs.lstat(file)).isSymbolicLink()) throw Error('Preuves locales liées.');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  const temp = file + '.' + process.pid + '.tmp';
  await fs.writeFile(temp, JSON.stringify(checks, null, 2) + '\n', { flag: 'wx' });
  await fs.rename(temp, file);
}
export async function dependencyFingerprint(cwd: string, versions: string): Promise<string> {
  const inputs = [];
  for (const file of ['package.json', 'package-lock.json', 'composer.json', 'composer.lock']) {
    try {
      if ((await fs.lstat(path.join(cwd, file))).isSymbolicLink())
        throw Error('Manifeste de dépendances lié.');
      inputs.push(file + '\0' + sha256(await fs.readFile(path.join(cwd, file))));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  return sha256(versions + '\n' + inputs.join('\n'));
}
export async function verificationFingerprint(cwd: string, versions: string): Promise<string> {
  const ignoredEverywhere = new Set(['node_modules', 'vendor', '.git', '.agents', '.promethee']);
  const ignoredAtRoot = new Set([
    'dist',
    'out',
    'build',
    'coverage',
    '.expo',
    '.next',
    '.vite',
    '.vitest',
    'docs',
  ]);
  const rows: string[] = [];
  async function walk(dir: string, atRoot: boolean) {
    for (const item of await fs.readdir(dir, { withFileTypes: true })) {
      if (
        ignoredEverywhere.has(item.name) ||
        (atRoot &&
          (ignoredAtRoot.has(item.name) ||
            item.name.endsWith('.log') ||
            item.name.endsWith('.tsbuildinfo')))
      )
        continue;
      const full = path.join(dir, item.name);
      if (item.isSymbolicLink()) throw Error('Lien source à vérifier manuellement : ' + full);
      if (item.isDirectory()) await walk(full, false);
      else if (item.isFile())
        rows.push(
          path.relative(cwd, full).replaceAll('\\', '/') + '\0' + sha256(await fs.readFile(full)),
        );
    }
  }
  await walk(cwd, true);
  rows.sort();
  return sha256(versions + '\n' + rows.join('\n'));
}
