import { readFile } from 'node:fs/promises';
import path from 'node:path';
import semver from 'semver';
import {
  resolveCommand,
  runCommand,
  type CommandResolver,
  type CommandRunner,
  type ResolveOptions,
} from './commands.js';

export interface ToolRequirement {
  id: string;
  label: string;
  commands: { name: string; prefixArgs?: string[] }[];
  versionArgs: string[];
  range?: string;
  additionalRanges?: string[];
  referenceVersion?: string;
  qualification: 'qualified' | 'pending';
  evidence: string[];
  kind?: 'external' | 'database' | 'native';
  extensions?: string[];
  composerRuntimeRange?: string;
}
export interface ToolInspection {
  id: string;
  state: 'compatible' | 'missing' | 'incompatible' | 'detection-failed' | 'qualification-pending';
  qualification: 'qualified' | 'pending';
  version?: string;
  executable?: string;
  prefixArgs?: string[];
  reason: string;
}
export interface SystemSelection {
  profile: string | { id: string };
  git: boolean;
  skills?: readonly (string | { id: string })[];
  options: Record<string, unknown>;
  databases?: readonly { id: string; engine: string; mode: string }[];
}
export interface InspectionOptions extends ResolveOptions {
  runner?: CommandRunner;
  resolver?: CommandResolver;
}

function tool(
  id: string,
  label: string,
  range: string,
  evidence: string,
  referenceVersion?: string,
): ToolRequirement {
  return {
    id,
    label,
    commands: [{ name: id }],
    versionArgs: ['--version'],
    range,
    qualification: 'qualified',
    evidence: [evidence],
    ...(referenceVersion ? { referenceVersion } : {}),
  };
}

async function nodeEngineRanges(
  root: string,
  profile: string,
  backend: unknown,
): Promise<string[]> {
  const zones = profile === 'web-api' ? ['web-api/frontend', 'web-api/backend'] : [profile];
  if (profile === 'mobile' && backend === 'new') zones.push('web-api/backend');
  const ranges = new Set<string>();
  for (const zone of zones) {
    const filename = path.join(root, 'templates', 'profiles', zone, 'package-lock.json');
    const lock = JSON.parse(await readFile(filename, 'utf8')) as {
      packages?: Record<string, { engines?: { node?: string } }>;
    };
    if (!lock.packages) throw new Error(`Lockfile npm sans packages : ${filename}.`);
    for (const entry of Object.values(lock.packages)) {
      if (entry.engines?.node) {
        if (!semver.validRange(entry.engines.node))
          throw new Error(`Exigence Node non interprétable : ${entry.engines.node}.`);
        ranges.add(entry.engines.node);
      }
    }
  }
  return [...ranges].sort();
}

async function phpRequirements(root: string, database: unknown): Promise<ToolRequirement[]> {
  const lockPath = path.join(root, 'templates', 'profiles', 'php', 'composer.lock');
  const lock = JSON.parse(await readFile(lockPath, 'utf8')) as {
    packages: { require?: Record<string, string> }[];
    'packages-dev': { require?: Record<string, string> }[];
  };
  const extensions = new Set<string>(['pdo']);
  const phpRanges = new Set<string>();
  for (const pkg of [...lock.packages, ...lock['packages-dev']]) {
    for (const [name, constraint] of Object.entries(pkg.require ?? {})) {
      if (name.startsWith('ext-')) extensions.add(name.slice(4));
      if (name === 'php') {
        const range = constraint.split(/\s*\|{1,2}\s*/u).join(' || ');
        if (!semver.validRange(range))
          throw new Error(`Contrainte PHP non prise en charge : ${constraint}.`);
        phpRanges.add(range);
      }
    }
  }
  if (database === 'mysql' || database === 'mariadb') extensions.add('pdo_mysql');
  if (database === 'sqlite') extensions.add('pdo_sqlite');
  const php = tool(
    'php',
    'PHP',
    '>=8.3.0 <9.0.0',
    'templates/profiles/php/composer.json: php ^8.3',
  );
  php.additionalRanges = [...phpRanges];
  php.extensions = [...extensions].sort();
  const composer = tool(
    'composer',
    'Composer',
    '>=2.2.0 <3.0.0',
    'composer.lock: composer-runtime-api ^2.2, contrôlé séparément',
  );
  composer.composerRuntimeRange = '^2.2';
  return [php, composer];
}

export async function getRequirements(
  selection: SystemSelection,
  resources: { root: string } | string,
  options: { platform?: NodeJS.Platform } = {},
): Promise<ToolRequirement[]> {
  const profile = typeof selection.profile === 'string' ? selection.profile : selection.profile.id;
  if (!['web-api', 'php', 'desktop', 'mobile'].includes(profile))
    throw new Error(`Profil inconnu : ${profile}.`);
  const root = typeof resources === 'string' ? resources : resources.root;
  const node = tool(
    'node',
    'Node.js du projet',
    '>=24.0.0 <25.0.0',
    'BOOTSTRAP.md + contrat MVP Node 24 LTS et engines des lockfiles',
    '24.21.0',
  );
  node.additionalRanges = await nodeEngineRanges(root, profile, selection.options.backend);
  const npm = tool(
    'npm',
    'npm',
    '>=11.0.0 <12.0.0',
    'catalogue/frameworks.lock.json: branche npm 11 du runtime de référence',
    '11.19.0',
  );
  const requirements = [node, npm];
  if (selection.git)
    requirements.push(
      tool(
        'git',
        'Git',
        '>=2.0.0 <3.0.0',
        'Git 2 : init, add, diff, commit et rebase usuels du CLI',
      ),
    );
  if (
    selection.skills?.some(
      (skill) => (typeof skill === 'string' ? skill : skill.id) === 'ui-ux-pro-max',
    )
  ) {
    const python = tool(
      'python',
      'Python',
      '>=3.9.0 <4.0.0',
      'UI UX Pro Max : bibliothèque standard Python3 ; validate_data.py utilise str.removesuffix (3.9)',
    );
    python.commands =
      (options.platform ?? process.platform) === 'win32'
        ? [{ name: 'python' }, { name: 'py', prefixArgs: ['-3'] }, { name: 'python3' }]
        : [{ name: 'python3' }, { name: 'python' }];
    requirements.push(python);
  }
  if (profile === 'php')
    requirements.push(...(await phpRequirements(root, selection.options.database)));
  for (const database of selection.databases ?? []) {
    if (database.mode !== 'native') continue;
    const id = database.engine;
    if (!['postgresql', 'mysql', 'mariadb'].includes(id))
      throw new Error(`Moteur natif non pris en charge : ${id}.`);
    if (requirements.some((entry) => entry.id === id)) continue;
    requirements.push({
      id,
      label: `Moteur ${id}`,
      kind: 'database',
      commands:
        id === 'postgresql'
          ? [{ name: 'postgres' }, { name: 'pg_ctl' }]
          : [{ name: id === 'mysql' ? 'mysqld' : 'mariadbd' }],
      versionArgs: ['--version'],
      qualification: 'pending',
      evidence: [
        'catalogue/bootstrap-plan.json : moteur/instance et compatibilité native en attente de qualification',
      ],
    });
  }
  if (profile === 'mobile' && selection.options.mobileMode === 'android-local') {
    requirements.push({
      id: 'jdk',
      label: 'JDK Android',
      commands: [{ name: 'java' }],
      versionArgs: ['-version'],
      kind: 'native',
      qualification: 'pending',
      evidence: ['Lock JDK compatible Expo57/Gradle à qualifier'],
    });
    requirements.push({
      id: 'android-sdk',
      label: 'Android SDK et build tools',
      commands: [{ name: 'adb' }],
      versionArgs: ['version'],
      kind: 'native',
      qualification: 'pending',
      evidence: [
        'Composants/versions du SDK Android à qualifier ; adb seul ne prouve pas la compilation',
      ],
    });
    if (selection.options.androidTarget === 'emulator')
      requirements.push({
        id: 'android-emulator',
        label: 'Émulateur Android',
        commands: [{ name: 'emulator' }],
        versionArgs: ['-version'],
        kind: 'native',
        qualification: 'pending',
        evidence: ['Image système et accélération à qualifier'],
      });
  }
  return requirements;
}

export function parseToolVersion(id: string, output: string): string | undefined {
  const patterns: Record<string, RegExp> = {
    node: /^v?(\d+\.\d+\.\d+(?:-[\w.-]+)?)/u,
    npm: /^(\d+\.\d+\.\d+(?:-[\w.-]+)?)/u,
    git: /git version (\d+\.\d+\.\d+)/u,
    python: /Python (\d+\.\d+\.\d+)/u,
    php: /PHP (\d+\.\d+\.\d+)/u,
    composer: /Composer(?: version)? (\d+\.\d+\.\d+)/u,
    postgresql: /(?:PostgreSQL|postgres|pg_ctl)\)?\s+(\d+\.\d+(?:\.\d+)?)/iu,
    mysql: /(?:Ver|Distrib)\s+(\d+\.\d+\.\d+)/iu,
    mariadb: /(?:Ver|Distrib)\s+(\d+\.\d+\.\d+)/iu,
    jdk: /(?:openjdk|java) version "(\d+(?:\.\d+){0,2})/u,
    'android-sdk': /Android Debug Bridge version (\d+\.\d+\.\d+)/u,
    'android-emulator': /Android emulator version (\d+\.\d+\.\d+)/iu,
  };
  const found = patterns[id]?.exec(output.trim())?.[1];
  if (!found) return undefined;
  const parsed = found.split('-')[0]!.split('.').length < 3 ? semver.coerce(found)?.version : found;
  return parsed && semver.valid(parsed) ? parsed : undefined;
}

export function satisfiesRequirement(version: string, requirement: ToolRequirement): boolean {
  return (
    requirement.qualification === 'qualified' &&
    Boolean(requirement.range) &&
    [requirement.range!, ...(requirement.additionalRanges ?? [])].every((range) =>
      semver.satisfies(version, range),
    )
  );
}

async function inspectExtra(
  requirement: ToolRequirement,
  executable: string,
  options: InspectionOptions,
): Promise<string | undefined> {
  const runner = options.runner ?? runCommand;
  if (requirement.extensions) {
    const result = await runner({ command: executable, args: ['-m'], timeoutMs: 10_000 });
    if (result.code !== 0 || result.error) return 'Impossible de vérifier les extensions PHP.';
    const modules = new Set(
      result.stdout
        .toLowerCase()
        .split(/\r?\n/u)
        .map((line) => line.trim()),
    );
    const missing = requirement.extensions.filter((extension) => !modules.has(extension));
    if (missing.length) return `Extensions PHP manquantes : ${missing.join(', ')}.`;
  }
  if (requirement.composerRuntimeRange) {
    const result = await runner({
      command: executable,
      args: [
        '--no-plugins',
        '--no-scripts',
        '--no-interaction',
        'show',
        '--platform',
        '--format=json',
      ],
      timeoutMs: 15_000,
    });
    if (result.code !== 0 || result.error) return 'Impossible de vérifier composer-runtime-api.';
    try {
      const platform = JSON.parse(result.stdout) as {
        installed?: { name: string; version: string }[];
      };
      const api = platform.installed?.find((item) => item.name === 'composer-runtime-api')?.version;
      const normalized = api ? semver.coerce(api)?.version : undefined;
      if (!normalized || !semver.satisfies(normalized, requirement.composerRuntimeRange))
        return 'composer-runtime-api incompatible ou introuvable.';
    } catch {
      return 'Réponse de Composer non interprétable.';
    }
  }
  return undefined;
}

export async function inspectTools(
  requirements: readonly ToolRequirement[],
  options: InspectionOptions = {},
): Promise<ToolInspection[]> {
  const resolver = options.resolver ?? ((command) => resolveCommand(command, options));
  const runner = options.runner ?? runCommand;
  // Inspect every requirement, including after a conflict. No install is allowed
  // to run between inspections of separate requirements.
  return Promise.all(
    requirements.map(async (requirement): Promise<ToolInspection> => {
      const base = { id: requirement.id, qualification: requirement.qualification };
      const failures: string[] = [];
      try {
        for (const candidate of requirement.commands) {
          let executable: string | undefined;
          try {
            executable = await resolver(candidate.name);
          } catch (error) {
            failures.push(`${candidate.name} : ${(error as Error).message}`);
            continue;
          }
          if (!executable) continue;
          const prefixArgs = candidate.prefixArgs ?? [];
          let result;
          try {
            result = await runner({
              command: executable,
              args: [...prefixArgs, ...requirement.versionArgs],
              timeoutMs: 10_000,
            });
          } catch (error) {
            failures.push(`${candidate.name} : ${(error as Error).message}`);
            continue;
          }
          const version = parseToolVersion(requirement.id, `${result.stdout}\n${result.stderr}`);
          const resolved = { ...base, executable, prefixArgs };
          if (result.code !== 0 || result.error || !version) {
            failures.push(
              `${candidate.name} : ${result.error ?? `${requirement.label} présent mais sa version ne peut pas être détectée.`}`,
            );
            continue;
          }
          if (!requirement.range || requirement.qualification !== 'qualified')
            return {
              ...resolved,
              version,
              state: 'qualification-pending',
              reason: 'Version détectée ; compatibilité encore à qualifier.',
            };
          if (!satisfiesRequirement(version, requirement)) {
            const unmet = [requirement.range, ...(requirement.additionalRanges ?? [])].filter(
              (range) => !semver.satisfies(version, range),
            );
            return {
              ...resolved,
              version,
              state: 'incompatible',
              reason: `Version incompatible ${version} ; exigences non respectées : ${unmet.join(' ; ')}. Installez ou activez une version compatible, puis relancez Prométhée.`,
            };
          }
          const extra = await inspectExtra(requirement, executable, options);
          return {
            ...resolved,
            version,
            state: extra ? 'incompatible' : 'compatible',
            reason: extra ?? 'Outil compatible : réutilisation.',
          };
        }
        return failures.length
          ? { ...base, state: 'detection-failed', reason: failures.join(' ; ') }
          : { ...base, state: 'missing', reason: `${requirement.label} absent du PATH habituel.` };
      } catch (error) {
        return { ...base, state: 'detection-failed', reason: (error as Error).message };
      }
    }),
  );
}
