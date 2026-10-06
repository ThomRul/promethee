import { readFile } from 'node:fs/promises';
import path from 'node:path';
import semver from 'semver';
import type { Dependencies, OptionRule, OptionValue } from '../core/catalogue.js';
import { ruleActive } from '../core/selection.js';

interface NodeMetadata {
  engines?: { node?: string };
}

/** Base lock trees and declared metadata for the options actually selected. */
export async function nodeEngineRanges(
  root: string,
  profile: string,
  options: Record<string, unknown>,
): Promise<string[]> {
  const profiles = JSON.parse(
    await readFile(path.join(root, 'templates', 'profiles.json'), 'utf8'),
  ) as {
    profiles: { id: string; defaults: Record<string, OptionValue> }[];
    optionRules: OptionRule[];
  };
  const selectedProfile = profiles.profiles.find((entry) => entry.id === profile);
  if (!selectedProfile) throw new Error(`Profil inconnu : ${profile}.`);
  const selectedOptions: Record<string, OptionValue> = { ...selectedProfile.defaults };
  for (const [name, value] of Object.entries(options)) {
    if (typeof value !== 'string' && typeof value !== 'boolean')
      throw new Error(`Valeur d'option non interprétable : ${name}.`);
    selectedOptions[name] = value;
  }
  const ranges = new Set<string>();
  const addRange = (metadata: NodeMetadata, source: string): void => {
    const range = metadata.engines?.node;
    if (range === undefined) return;
    if (typeof range !== 'string' || !semver.validRange(range))
      throw new Error(`Exigence Node non interprétable pour ${source} : ${String(range)}.`);
    ranges.add(range);
  };
  const zones = profile === 'web-api' ? ['web-api/frontend', 'web-api/backend'] : [profile];
  if (profile === 'mobile' && selectedOptions.backend === 'new') zones.push('web-api/backend');
  for (const zone of zones) {
    const filename = path.join(root, 'templates', 'profiles', zone, 'package-lock.json');
    const lock = JSON.parse(await readFile(filename, 'utf8')) as {
      packages?: Record<string, NodeMetadata>;
    };
    if (!lock.packages) throw new Error(`Lockfile npm sans packages : ${filename}.`);
    for (const [name, entry] of Object.entries(lock.packages)) addRange(entry, name || zone);
  }
  const frameworks = JSON.parse(
    await readFile(path.join(root, 'catalogue', 'frameworks.lock.json'), 'utf8'),
  ) as {
    optional: Record<string, Dependencies>;
    packages: (NodeMetadata & { name: string; version: string })[];
  };
  for (const rule of profiles.optionRules) {
    if (!rule.profiles.includes(profile) || !ruleActive(rule, selectedOptions)) continue;
    const group = rule.dependencyGroup ? frameworks.optional[rule.dependencyGroup] : undefined;
    if (!group) continue;
    for (const field of ['dependencies', 'devDependencies'] as const) {
      for (const [name, version] of Object.entries(group[field] ?? {})) {
        const metadata = frameworks.packages.find(
          (entry) => entry.name === name && entry.version === version,
        );
        if (!metadata)
          throw new Error(
            `Métadonnées npm manquantes pour l'option ${rule.id} : ${name}@${version}.`,
          );
        addRange(metadata, `${name}@${version}`);
      }
    }
  }
  return [...ranges].sort();
}
