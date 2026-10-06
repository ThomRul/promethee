import { lstat, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { readManifest } from '../core/manifest.js';
import { runCommand, type CommandRunner } from './commands.js';
import { parseToolVersion, satisfiesRequirement, type ToolRequirement } from './preflight.js';

export type DatabaseEngine = 'postgresql' | 'mysql' | 'mariadb' | 'sqlite';
export interface ServiceDatabase {
  id: string;
  engine: DatabaseEngine;
  mode: 'native' | 'containerized' | 'remote' | 'embedded' | 'undecided';
  target: string;
}
export interface ServiceBinding {
  databaseId: string;
  engine: Exclude<DatabaseEngine, 'sqlite'>;
  adapter: 'windows-service' | 'ubuntu-systemd' | 'qualified-process';
  instanceId: string;
  ownership: 'existing-shared' | 'created-shared' | 'created-dedicated';
  port?: number;
}
export interface ProjectServices {
  projectRoot: string;
  databases: ServiceDatabase[];
  bindings: ServiceBinding[];
}
export interface ServiceStatus {
  databaseId: string;
  mode: ServiceDatabase['mode'];
  state: 'active' | 'inactive' | 'pending' | 'unknown' | 'ignored' | 'unbound' | 'unavailable';
  reason: string;
  instanceId?: string;
  ownership?: ServiceBinding['ownership'];
  version?: string;
  identityVerified?: boolean;
  sqlVerification: 'not-run';
}
export interface ServiceOptions {
  runner?: CommandRunner;
  platform?: NodeJS.Platform;
  env?: NodeJS.ProcessEnv;
  compatibility?: Partial<Record<Exclude<DatabaseEngine, 'sqlite'>, ToolRequirement>>;
  readContext?: (projectRoot: string) => Promise<ProjectServices>;
}

const idPattern = /^[a-z0-9][a-z0-9-]*$/u;
const instancePattern = /^[A-Za-z0-9][A-Za-z0-9_.@:-]{0,199}$/u;

export function validateServiceContext(context: ProjectServices): void {
  if (!Array.isArray(context.databases) || !Array.isArray(context.bindings))
    throw new Error('Déclaration de services incorrecte.');
  const databases = new Map<string, ServiceDatabase>();
  for (const database of context.databases) {
    if (
      !idPattern.test(database.id) ||
      databases.has(database.id) ||
      !['postgresql', 'mysql', 'mariadb', 'sqlite'].includes(database.engine) ||
      !['native', 'containerized', 'remote', 'embedded', 'undecided'].includes(database.mode)
    )
      throw new Error('Base invalide ou identifiant dupliqué.');
    if (
      typeof database.target !== 'string' ||
      !database.target ||
      /[\0\r\n\\]/u.test(database.target) ||
      path.posix.isAbsolute(database.target) ||
      /^[A-Za-z]:/u.test(database.target) ||
      database.target.split('/').includes('..')
    )
      throw new Error('Cible de base incorrecte.');
    if (
      (database.engine === 'sqlite') !== (database.mode === 'embedded') &&
      database.mode !== 'undecided'
    )
      throw new Error('Mode incompatible avec le moteur de la base.');
    databases.set(database.id, database);
  }
  const ids = new Set<string>();
  for (const binding of context.bindings) {
    const allowedKeys = ['databaseId', 'engine', 'adapter', 'instanceId', 'ownership', 'port'];
    if (Object.keys(binding).some((key) => !allowedKeys.includes(key)))
      throw new Error('Association contenant des champs non autorisés.');
    const database = databases.get(binding.databaseId);
    if (
      !database ||
      database.engine !== binding.engine ||
      !idPattern.test(binding.databaseId) ||
      ids.has(binding.databaseId) ||
      !instancePattern.test(binding.instanceId) ||
      !['windows-service', 'ubuntu-systemd', 'qualified-process'].includes(binding.adapter) ||
      !['existing-shared', 'created-shared', 'created-dedicated'].includes(binding.ownership) ||
      (binding.port !== undefined &&
        (!Number.isInteger(binding.port) || binding.port < 1 || binding.port > 65535))
    )
      throw new Error('Association native périmée ou incorrecte.');
    ids.add(binding.databaseId);
  }
}

export async function readProjectServices(projectRoot: string): Promise<ProjectServices> {
  const root = await realpath(projectRoot);
  const directory = path.join(root, '.promethee');
  if ((await lstat(directory)).isSymbolicLink())
    throw new Error('Le suivi des services ne peut pas être un lien ou une jonction.');
  const canonicalDirectory = await realpath(directory);
  if (path.relative(root, canonicalDirectory) !== '.promethee')
    throw new Error('Le suivi des services sort du projet sélectionné.');
  const manifest = await readManifest(root);
  let bindings: ServiceBinding[] = [];
  try {
    const filename = path.join(directory, 'local-services.json');
    if ((await lstat(filename)).isSymbolicLink())
      throw new Error('Le fichier local-services ne peut pas être un lien.');
    const local = JSON.parse(await readFile(filename, 'utf8')) as {
      schemaVersion: number;
      bindings: ServiceBinding[];
    };
    if (
      local.schemaVersion !== 1 ||
      Object.keys(local).some((key) => !['schemaVersion', 'bindings'].includes(key))
    )
      throw new Error('Fichier local-services incorrect.');
    bindings = local.bindings;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  const context = { projectRoot: root, databases: manifest.databases, bindings };
  validateServiceContext(context);
  return context;
}

function systemCommand(name: string, options: ServiceOptions): string {
  if ((options.platform ?? process.platform) === 'win32') {
    return path.win32.join(
      options.env?.SystemRoot ?? process.env.SystemRoot ?? 'C:\\Windows',
      'System32',
      `${name}.exe`,
    );
  }
  return `/usr/bin/${name}`;
}

interface NativeInspection {
  state: ServiceStatus['state'];
  version?: string;
  identityVerified: boolean;
  reason: string;
}

async function inspectNative(
  binding: ServiceBinding,
  options: ServiceOptions,
): Promise<NativeInspection> {
  const runner = options.runner ?? runCommand;
  const platform = options.platform ?? process.platform;
  let executable: string | undefined;
  let state: ServiceStatus['state'] = 'unknown';
  if (binding.adapter === 'windows-service' && platform === 'win32') {
    const query = await runner({
      command: systemCommand('sc', options),
      args: ['query', binding.instanceId],
      timeoutMs: 10_000,
    });
    if (query.code !== 0 || query.error)
      throw new Error('Service Windows absent, inaccessible ou non vérifiable.');
    const code = Number(/STATE\s*:\s*(\d+)/u.exec(query.stdout)?.[1]);
    state =
      code === 4
        ? 'active'
        : code === 1
          ? 'inactive'
          : [2, 3].includes(code)
            ? 'pending'
            : 'unknown';
    const configuration = await runner({
      command: systemCommand('sc', options),
      args: ['qc', binding.instanceId],
      timeoutMs: 10_000,
    });
    if (configuration.code !== 0 || configuration.error)
      throw new Error('Identité du service Windows impossible à vérifier.');
    const binary =
      /BINARY_PATH_NAME\s*:\s*(?:"([A-Za-z]:\\[^"\r\n]+\.exe)"|([A-Za-z]:\\[^\r\n]+?\.exe))(?:\s|$)/iu.exec(
        configuration.stdout,
      );
    executable = binary?.[1] ?? binary?.[2];
  } else if (binding.adapter === 'ubuntu-systemd' && platform === 'linux') {
    if (!binding.instanceId.endsWith('.service'))
      throw new Error('Une unité .service exacte est requise.');
    const query = await runner({
      command: systemCommand('systemctl', options),
      args: [
        'show',
        '--no-pager',
        '--property=LoadState,ActiveState,SubState,ExecStart,Id',
        '--',
        binding.instanceId,
      ],
      timeoutMs: 10_000,
    });
    if (query.code !== 0 || query.error)
      throw new Error('Gestionnaire systemd absent ou inaccessible ; aucun repli Docker/WSL.');
    const properties = Object.fromEntries(
      query.stdout
        .split(/\r?\n/u)
        .filter((line) => line.includes('='))
        .map((line) => {
          const index = line.indexOf('=');
          return [line.slice(0, index), line.slice(index + 1)];
        }),
    );
    if (properties.LoadState !== 'loaded' || properties.Id !== binding.instanceId)
      throw new Error('Unité systemd absente ou identité différente.');
    state =
      properties.ActiveState === 'active'
        ? 'active'
        : properties.ActiveState === 'inactive'
          ? 'inactive'
          : ['activating', 'deactivating'].includes(properties.ActiveState ?? '')
            ? 'pending'
            : 'unknown';
    executable = /(?:^|[ {;])path=([^ ;}]+)/u.exec(properties.ExecStart ?? '')?.[1];
    if (executable === '/usr/bin/pg_ctlcluster' && binding.engine === 'postgresql') {
      const cluster = /^postgresql@(\d+)-([A-Za-z0-9_-]+)\.service$/u.exec(binding.instanceId);
      if (!cluster) throw new Error('Identité du cluster PostgreSQL incorrecte.');
      const clusterInfo = await runner({
        command: '/usr/bin/pg_lsclusters',
        args: ['--no-header', cluster[1]!, cluster[2]!],
        timeoutMs: 10_000,
      });
      const row = /^(\d+)\s+(\S+)\s+(\d+)\s+(?:online|down)\b/mu.exec(clusterInfo.stdout);
      if (
        clusterInfo.code !== 0 ||
        clusterInfo.error ||
        row?.[1] !== cluster[1] ||
        row?.[2] !== cluster[2] ||
        (binding.port !== undefined && Number(row[3]) !== binding.port)
      )
        throw new Error('Cluster ou port PostgreSQL différent de l’association locale.');
      executable = `/usr/lib/postgresql/${cluster[1]}/bin/postgres`;
    }
  } else
    throw new Error('Adaptateur non qualifié pour cet hôte ; aucune commande système exécutée.');
  if (
    !executable ||
    !(platform === 'win32' ? path.win32.isAbsolute(executable) : path.posix.isAbsolute(executable))
  )
    throw new Error('Binaire du service impossible à identifier.');
  const basename = (platform === 'win32' ? path.win32 : path.posix)
    .basename(executable)
    .toLowerCase()
    .replace(/\.exe$/u, '');
  const allowed =
    binding.engine === 'postgresql'
      ? ['postgres', 'pg_ctl']
      : binding.engine === 'mysql'
        ? ['mysqld']
        : ['mariadbd', 'mysqld'];
  if (!allowed.includes(basename))
    throw new Error('Le service associé ne correspond pas au moteur déclaré.');
  const output = await runner({ command: executable, args: ['--version'], timeoutMs: 10_000 });
  const text = `${output.stdout}\n${output.stderr}`;
  if (binding.engine === 'mysql' && /MariaDB/iu.test(text))
    throw new Error('Service MariaDB associé à une base déclarée MySQL.');
  if (binding.engine === 'mariadb' && !/MariaDB/iu.test(text))
    throw new Error('Identité MariaDB impossible à confirmer.');
  const version = parseToolVersion(binding.engine, text);
  if (output.code !== 0 || output.error || !version)
    throw new Error('Version du binaire serveur impossible à vérifier.');
  return {
    state,
    version,
    identityVerified: true,
    reason: 'État natif et identité du moteur vérifiés ; connexion SQL non testée.',
  };
}

export async function inspectServices(
  context: ProjectServices,
  options: ServiceOptions = {},
): Promise<ServiceStatus[]> {
  validateServiceContext(context);
  return Promise.all(
    context.databases.map(async (database): Promise<ServiceStatus> => {
      const base = {
        databaseId: database.id,
        mode: database.mode,
        sqlVerification: 'not-run' as const,
      };
      if (database.mode !== 'native')
        return {
          ...base,
          state: 'ignored',
          reason: `${database.mode} : aucune gestion de service natif.`,
        };
      const binding = context.bindings.find((item) => item.databaseId === database.id);
      if (!binding)
        return {
          ...base,
          state: 'unbound',
          reason: 'Association locale absente ; préparer une association vérifiée.',
        };
      const identity = { instanceId: binding.instanceId, ownership: binding.ownership };
      try {
        return { ...base, ...identity, ...(await inspectNative(binding, options)) };
      } catch (error) {
        return {
          ...base,
          ...identity,
          state: 'unavailable',
          identityVerified: false,
          reason: (error as Error).message,
        };
      }
    }),
  );
}

export async function changeService(
  context: ProjectServices,
  databaseId: string,
  action: 'start' | 'stop',
  options: ServiceOptions & { explicit: true },
): Promise<ServiceStatus> {
  if (options.explicit !== true || !['start', 'stop'].includes(action))
    throw new Error('Action utilisateur explicite requise pour démarrer/arrêter un service.');
  validateServiceContext(context);
  const current = await (options.readContext ?? readProjectServices)(context.projectRoot);
  validateServiceContext(current);
  const database = current.databases.find((item) => item.id === databaseId);
  const binding = current.bindings.find((item) => item.databaseId === databaseId);
  if (!database || database.mode !== 'native' || !binding)
    throw new Error('Seule une base native associée du projet sélectionné peut être contrôlée.');
  const previous = context.bindings.find((item) => item.databaseId === databaseId);
  if (!previous || JSON.stringify(previous) !== JSON.stringify(binding))
    throw new Error(
      'Association locale modifiée ; consulter de nouveau les services avant action.',
    );
  const before = await inspectNative(binding, options);
  const requirement = options.compatibility?.[binding.engine];
  if (
    !before.identityVerified ||
    !before.version ||
    !requirement ||
    requirement.id !== binding.engine ||
    !satisfiesRequirement(before.version, requirement)
  )
    throw new Error(
      'Compatibilité du moteur non qualifiée ou version incompatible ; aucune action exécutée.',
    );
  if (before.state === 'unknown' || before.state === 'pending')
    throw new Error('État du service indéterminé ou transition en cours.');
  if (
    (action === 'start' && before.state === 'inactive') ||
    (action === 'stop' && before.state === 'active')
  ) {
    const fresh = await (options.readContext ?? readProjectServices)(context.projectRoot);
    validateServiceContext(fresh);
    const freshDatabase = fresh.databases.find((item) => item.id === databaseId);
    const freshBinding = fresh.bindings.find((item) => item.databaseId === databaseId);
    if (
      freshDatabase?.mode !== 'native' ||
      JSON.stringify(freshBinding) !== JSON.stringify(binding)
    )
      throw new Error('Déclaration ou association modifiée avant action ; aucun service contrôlé.');
    const platform = options.platform ?? process.platform;
    const command =
      binding.adapter === 'windows-service'
        ? systemCommand('sc', options)
        : systemCommand('systemctl', options);
    const args =
      platform === 'win32' ? [action, binding.instanceId] : [action, '--', binding.instanceId];
    const result = await (options.runner ?? runCommand)({ command, args, timeoutMs: 30_000 });
    if (result.code !== 0 || result.error)
      throw new Error(
        result.error ??
          'Opération refusée ou droits insuffisants ; configuration et données conservées.',
      );
  }
  const after = await inspectNative(binding, options);
  return {
    databaseId,
    mode: 'native',
    instanceId: binding.instanceId,
    ownership: binding.ownership,
    ...after,
    sqlVerification: 'not-run',
  };
}
