import { lstat, open, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

async function optionalStat(filename: string) {
  try {
    return await lstat(filename);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

function refuse(reason: string): never {
  throw new Error(
    `Le dépôt Git contient ${reason}. Choisir un nouveau dossier ; Prométhée ne reprend pas ce dépôt.`,
  );
}

async function containsData(directory: string): Promise<boolean> {
  const stat = await optionalStat(directory);
  if (!stat) return false;
  if (!stat.isDirectory() || stat.isSymbolicLink())
    refuse('des métadonnées liées ou non régulières');
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) refuse('des métadonnées liées');
    if (!entry.isDirectory() || (await containsData(path.join(directory, entry.name)))) return true;
  }
  return false;
}

/** Read-only: no Git command, lock, hook, refresh or lazy fetch is invoked. */
export async function assertEmptyGitMetadata(gitDirectory: string): Promise<void> {
  const index = path.join(gitDirectory, 'index');
  const indexStat = await optionalStat(index);
  if (indexStat) {
    if (!indexStat.isFile() || indexStat.isSymbolicLink() || indexStat.size < 32)
      refuse('un index non vérifiable');
    const handle = await open(index, 'r');
    try {
      const header = Buffer.alloc(12);
      const { bytesRead } = await handle.read(header, 0, 12, 0);
      if (
        bytesRead !== 12 ||
        header.toString('ascii', 0, 4) !== 'DIRC' ||
        ![2, 3, 4].includes(header.readUInt32BE(4))
      )
        refuse('un index non vérifiable');
      if (header.readUInt32BE(8) !== 0) refuse('des fichiers suivis dans l’index');
    } finally {
      await handle.close();
    }
  }
  const head = path.join(gitDirectory, 'HEAD');
  const headStat = await optionalStat(head);
  if (headStat) {
    if (!headStat.isFile() || headStat.isSymbolicLink()) refuse('un HEAD non vérifiable');
    const value = (await readFile(head, 'utf8')).trim();
    if (!/^ref: refs\/heads\/[^\s]+$/.test(value))
      refuse('un historique ou un HEAD non vérifiable');
  }
  const packed = path.join(gitDirectory, 'packed-refs');
  const packedStat = await optionalStat(packed);
  if (packedStat) {
    if (!packedStat.isFile() || packedStat.isSymbolicLink())
      refuse('des références non vérifiables');
    if (
      (await readFile(packed, 'utf8'))
        .split(/\r?\n/)
        .some((line) => line.trim() && !line.startsWith('#'))
    ) {
      refuse('des références historiques');
    }
  }
  if (await optionalStat(path.join(gitDirectory, 'commondir')))
    refuse('des métadonnées partagées avec un autre dépôt');
  for (const directory of ['refs', 'logs', 'objects', 'reftable']) {
    if (await containsData(path.join(gitDirectory, directory)))
      refuse('un historique ou des objets déjà présents');
  }
}
