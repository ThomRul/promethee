import fs from 'node:fs/promises';
import path from 'node:path';
import { select, text, isCancel } from '@clack/prompts';

export class Cancelled extends Error {
  constructor() {
    super('Opération annulée.');
  }
}
export function answer<T>(value: T): Exclude<T, symbol> {
  if (isCancel(value)) throw new Cancelled();
  return value as Exclude<T, symbol>;
}
export const display = (value: string) => value.replace(/[\x00-\x1f\x7f-\x9f]/g, '?');
export async function listDirectories(
  directory: string,
): Promise<{ name: string; path: string }[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const folders = await Promise.all(
    entries.map(async (e) => {
      const full = path.join(directory, e.name);
      if (e.isDirectory()) return { name: e.name, path: full };
      if (e.isSymbolicLink() && (await fs.stat(full).catch(() => null))?.isDirectory())
        return { name: e.name + ' ↗', path: full };
      return null;
    }),
  );
  return folders.filter((x) => x !== null).sort((a, b) => a.name.localeCompare(b.name));
}
async function roots(): Promise<string[]> {
  if (process.platform !== 'win32') return ['/'];
  const candidates = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i) + ':\\');
  return (
    await Promise.all(
      candidates.map(
        async (p) =>
          await fs
            .access(p)
            .then(() => p)
            .catch(() => null),
      ),
    )
  ).filter((x) => x !== null);
}
export async function browseDirectory(message: string, start = process.cwd()): Promise<string> {
  let current = await fs.realpath(start);
  while (true) {
    const folders = await listDirectories(current).catch(() => []);
    const options = [
      { value: 'choose', label: 'Choisir ce dossier' },
      { value: 'parent', label: '.. — dossier parent' },
      { value: 'paste', label: 'Saisir ou coller un chemin' },
      { value: 'roots', label: process.platform === 'win32' ? 'Changer de lecteur' : 'Racine /' },
      ...folders.map((x) => ({ value: 'open:' + x.path, label: display(x.name) })),
      { value: 'cancel', label: 'Annuler' },
    ];
    const action = answer(
      await select({ message: message + '\n' + display(current), options, maxItems: 12 }),
    );
    if (action === 'cancel') throw new Cancelled();
    if (action === 'choose') return await fs.realpath(current);
    if (action === 'parent') {
      current = path.dirname(current);
      continue;
    }
    if (action === 'roots') {
      current = answer(
        await select({
          message: 'Lecteur ou racine',
          options: (await roots()).map((value) => ({ value, label: value })),
        }),
      );
      continue;
    }
    let target: string;
    if (action === 'paste')
      target = path.resolve(
        current,
        answer(
          await text({
            message: 'Chemin du dossier',
            validate: (v) => (!v?.trim() ? 'Saisir un chemin.' : undefined),
          }),
        )
          .trim()
          .replace(/^"(.*)"$/, '$1'),
      );
    else target = action.slice(5);
    try {
      const resolved = await fs.realpath(target);
      if (!(await fs.stat(resolved)).isDirectory()) throw Error();
      current = resolved;
    } catch {
      console.error('Ce dossier est inaccessible. Le dossier courant reste sélectionné.');
    }
  }
}
