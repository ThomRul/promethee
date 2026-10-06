import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  runCommand,
  type CommandRequest,
  type CommandResult,
  type CommandRunner,
} from './commands.js';
import { inspectHost, type HostInspection, type HostOptions } from './host.js';
import {
  inspectTools,
  type InspectionOptions,
  type ToolInspection,
  type ToolRequirement,
} from './preflight.js';

export interface DownloadArtifact {
  filename: string;
  url: string;
  sha256: string;
  allowedHosts: readonly string[];
}
/** Trusted release recipes, never command strings from a project manifest. */
export interface BootstrapRecipe {
  id: string;
  toolIds: readonly string[];
  version: string;
  family: 'windows' | 'ubuntu';
  architecture: 'x64';
  qualification: 'qualified' | 'pending';
  evidence: readonly string[];
  downloads: readonly DownloadArtifact[];
  privileged: boolean;
  installer: { command: string; args: readonly string[] };
}
export interface BootstrapPlan {
  id: string;
  status: 'ready' | 'blocked';
  host: HostInspection;
  requirements: readonly ToolRequirement[];
  tools: ToolInspection[];
  actions: BootstrapRecipe[];
  reasons: string[];
}
export interface PlanOptions {
  host?: HostInspection;
  hostOptions?: HostOptions;
  inspectionOptions?: InspectionOptions;
  recipes?: readonly BootstrapRecipe[];
}

function digest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function planIdentity(plan: Omit<BootstrapPlan, 'id'>): string {
  return digest(plan);
}

function recipeProblem(recipe: BootstrapRecipe): string | undefined {
  if (!/^[a-z0-9][a-z0-9-]*$/u.test(recipe.id) || !/^\d+\.\d+\.\d+$/u.test(recipe.version))
    return 'Identité/version de recette incorrecte.';
  if (recipe.qualification !== 'qualified' || !recipe.evidence.length)
    return 'Recette non qualifiée.';
  if (!recipe.toolIds.length || !recipe.downloads.length)
    return 'Recette sans outils ou archives qualifiées.';
  for (const artifact of recipe.downloads) {
    if (
      !/^[A-Za-z0-9][A-Za-z0-9_.-]*$/u.test(artifact.filename) ||
      !/^[a-f0-9]{64}$/u.test(artifact.sha256)
    )
      return 'Archive ou empreinte incorrecte.';
    let url: URL;
    try {
      url = new URL(artifact.url);
    } catch {
      return 'URL de téléchargement incorrecte.';
    }
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      !artifact.allowedHosts.includes(url.hostname)
    )
      return 'Source de téléchargement non autorisée.';
  }
  return undefined;
}

export async function planBootstrap(
  requirements: readonly ToolRequirement[],
  options: PlanOptions = {},
): Promise<BootstrapPlan> {
  if (new Set(requirements.map((tool) => tool.id)).size !== requirements.length)
    throw new Error('Exigences outils dupliquées.');
  const host = options.host ?? (await inspectHost(options.hostOptions));
  const tools = await inspectTools(requirements, options.inspectionOptions);
  const reasons = [...host.reasons];
  if (!host.supported && !reasons.length) reasons.push('Hôte non pris en charge.');
  const actions: BootstrapRecipe[] = [];
  for (const item of tools) {
    if (item.state === 'compatible') continue;
    if (item.state !== 'missing') {
      reasons.push(`${item.id} : ${item.reason}`);
      continue;
    }
    const requirement = requirements.find((entry) => entry.id === item.id)!;
    if (requirement.qualification !== 'qualified') {
      reasons.push(`${item.id} : compatibilité et installation encore à qualifier.`);
      continue;
    }
    const recipe = options.recipes?.find(
      (candidate) =>
        candidate.toolIds.includes(item.id) &&
        candidate.family === host.family &&
        candidate.architecture === host.architecture,
    );
    if (!recipe) {
      reasons.push(
        `${item.id} : outil absent ; aucune recette d'installation qualifiée pour cet hôte.`,
      );
      continue;
    }
    const problem = recipeProblem(recipe);
    if (problem) {
      reasons.push(`${item.id} : ${problem}`);
      continue;
    }
    if (!actions.some((action) => action.id === recipe.id)) actions.push(recipe);
  }
  const plan = {
    status: reasons.length ? ('blocked' as const) : ('ready' as const),
    host,
    requirements,
    tools,
    actions,
    reasons,
  };
  return { id: planIdentity(plan), ...plan };
}

async function fileHash(filename: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filename)) hash.update(chunk as Buffer);
  return hash.digest('hex');
}

export async function cacheArtifact(
  artifact: DownloadArtifact,
  recipe: Pick<BootstrapRecipe, 'id' | 'version' | 'family' | 'architecture'>,
  cacheRoot: string,
  fetcher: typeof fetch = fetch,
): Promise<string> {
  if (
    recipeProblem({
      ...recipe,
      toolIds: ['artifact'],
      qualification: 'qualified',
      evidence: ['caller'],
      downloads: [artifact],
      privileged: false,
      installer: { command: 'unused', args: [] },
    })
  )
    throw new Error('Archive non qualifiée.');
  const directory = path.resolve(
    cacheRoot,
    recipe.id,
    recipe.version,
    recipe.family,
    recipe.architecture,
    artifact.sha256,
  );
  const target = path.join(directory, artifact.filename);
  try {
    if ((await fileHash(target)) === artifact.sha256) return target;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  await mkdir(directory, { recursive: true });
  const temporary = `${target}.${randomUUID()}.partial`;
  try {
    const response = await fetcher(artifact.url, {
      redirect: 'error',
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok || !response.body)
      throw new Error(`Téléchargement refusé (${response.status}).`);
    if (response.url && new URL(response.url).hostname !== new URL(artifact.url).hostname)
      throw new Error('Source de téléchargement modifiée.');
    const hash = createHash('sha256');
    // Write incrementally; never execute a partial/corrupt archive.
    await writeFile(temporary, '', { flag: 'wx', mode: 0o600 });
    const handle = await import('node:fs/promises').then((fs) => fs.open(temporary, 'a'));
    try {
      for await (const chunk of response.body) {
        hash.update(chunk);
        await handle.write(chunk);
      }
    } finally {
      await handle.close();
    }
    if (hash.digest('hex') !== artifact.sha256)
      throw new Error('Empreinte SHA256 du téléchargement incorrecte.');
    // An invalid previous cache entry is replaced only after complete validation.
    try {
      await unlink(target);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    await rename(temporary, target);
    return target;
  } catch (error) {
    try {
      await unlink(temporary);
    } catch {
      /* Preserve the original diagnostic. */
    }
    throw error;
  }
}

export interface BootstrapStep {
  recipeId: string;
  phase: 'download' | 'install' | 'verify';
  state: 'succeeded' | 'failed' | 'skipped';
  message?: string;
}
export interface BootstrapExecution {
  state: 'succeeded' | 'incomplete';
  steps: BootstrapStep[];
  tools: ToolInspection[];
  reasons: string[];
}
export interface ExecuteBootstrapOptions {
  approvedPlanId: string;
  cacheRoot: string;
  runner?: CommandRunner;
  elevatedRunner?: CommandRunner;
  inspectionOptions?: InspectionOptions;
  hostOptions?: HostOptions;
  fetcher?: typeof fetch;
}

function installerRequest(recipe: BootstrapRecipe, archives: readonly string[]): CommandRequest {
  const substitute = (value: string) =>
    value.replace(/\{archive:(\d+)\}/gu, (_match, index: string) => {
      const archive = archives[Number(index)];
      if (!archive) throw new Error('Archive référencée par la recette inexistante.');
      return archive;
    });
  return {
    command: substitute(recipe.installer.command),
    args: recipe.installer.args.map(substitute),
    timeoutMs: 0,
    stdio: 'inherit',
  };
}

/** Resumable sequence: installed tools are preserved if a later step fails. */
export async function executeBootstrap(
  plan: BootstrapPlan,
  options: ExecuteBootstrapOptions,
): Promise<BootstrapExecution> {
  const { id, ...body } = plan;
  if (plan.status !== 'ready' || options.approvedPlanId !== id || planIdentity(body) !== id) {
    throw new Error('Plan bloqué, modifié ou non approuvé ; aucune installation exécutée.');
  }
  const state: BootstrapExecution = { state: 'incomplete', steps: [], tools: [], reasons: [] };
  const host = await inspectHost(options.hostOptions);
  const inspectionOptions = {
    ...options.inspectionOptions,
    ...(options.runner ? { runner: options.runner } : {}),
  };
  state.tools = await inspectTools(plan.requirements, inspectionOptions);
  if (
    !host.supported ||
    host.family !== plan.host.family ||
    host.architecture !== plan.host.architecture
  ) {
    state.reasons.push('Hôte non compatible avec le plan approuvé.', ...host.reasons);
    return state;
  }
  const blockers = state.tools.filter((tool) => !['compatible', 'missing'].includes(tool.state));
  if (blockers.length) {
    state.reasons.push(...blockers.map((tool) => tool.reason));
    return state;
  }
  const uncovered = state.tools.filter(
    (tool) =>
      tool.state === 'missing' && !plan.actions.some((action) => action.toolIds.includes(tool.id)),
  );
  if (uncovered.length) {
    state.reasons.push('Un nouvel outil manquant nécessite un nouveau plan.');
    return state;
  }
  if (
    plan.actions.some(
      (action) =>
        action.privileged &&
        state.tools.some((tool) => tool.state === 'missing' && action.toolIds.includes(tool.id)),
    ) &&
    !options.elevatedRunner
  ) {
    state.reasons.push('Adaptateur d’élévation ciblée indisponible.');
    return state;
  }
  for (const recipe of plan.actions) {
    const needed = state.tools.some(
      (tool) => recipe.toolIds.includes(tool.id) && tool.state === 'missing',
    );
    if (!needed) {
      state.steps.push({ recipeId: recipe.id, phase: 'install', state: 'skipped' });
      continue;
    }
    const existing = state.tools.some(
      (tool) => recipe.toolIds.includes(tool.id) && tool.state === 'compatible',
    );
    if (existing) {
      state.reasons.push(
        'La recette remplacerait un outil existant ; préparer une recette distincte.',
      );
      return state;
    }
    let phase: BootstrapStep['phase'] = 'download';
    try {
      if (recipeProblem(recipe)) throw new Error('Recette non qualifiée.');
      const archives: string[] = [];
      for (const artifact of recipe.downloads)
        archives.push(await cacheArtifact(artifact, recipe, options.cacheRoot, options.fetcher));
      state.steps.push({ recipeId: recipe.id, phase: 'download', state: 'succeeded' });
      phase = 'install';
      const runner = recipe.privileged ? options.elevatedRunner! : (options.runner ?? runCommand);
      const result: CommandResult = await runner(installerRequest(recipe, archives));
      if (result.code !== 0 || result.error)
        throw new Error(result.error ?? `Installateur interrompu (code ${result.code}).`);
      state.steps.push({ recipeId: recipe.id, phase: 'install', state: 'succeeded' });
      phase = 'verify';
      state.tools = await inspectTools(plan.requirements, inspectionOptions);
      if (
        state.tools.some((tool) => recipe.toolIds.includes(tool.id) && tool.state !== 'compatible')
      ) {
        throw new Error(
          'Installation non vérifiée. Le PATH du terminal peut nécessiter un redémarrage.',
        );
      }
      if (state.tools.some((tool) => !['compatible', 'missing'].includes(tool.state)))
        throw new Error('Conflit détecté après installation.');
      state.steps.push({ recipeId: recipe.id, phase: 'verify', state: 'succeeded' });
    } catch (error) {
      state.steps.push({
        recipeId: recipe.id,
        phase,
        state: 'failed',
        message: (error as Error).message,
      });
      state.reasons.push((error as Error).message);
      return state;
    }
  }
  state.tools = await inspectTools(plan.requirements, inspectionOptions);
  if (state.tools.every((tool) => tool.state === 'compatible')) state.state = 'succeeded';
  else state.reasons.push('Certains outils restent absents ou non vérifiés.');
  return state;
}
