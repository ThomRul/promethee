import { confirm, select, note, log } from '@clack/prompts';
import path from 'node:path';
import { loadCatalogue } from '../core/catalogue.js';
import { readManifest } from '../core/manifest.js';
import { resumeProject } from '../core/project.js';
import { resolveSelection } from '../core/selection.js';
import { planProject } from '../core/render.js';
import { installProjectDependencies } from '../core/install.js';
import { getRequirements } from '../system/preflight.js';
import { planBootstrap } from '../system/bootstrap.js';
import { inspectHost } from '../system/host.js';
import { readProjectServices, inspectServices, changeService } from '../system/services.js';
import { answer, browseDirectory, display, Cancelled } from './navigation.js';

export async function selectProject(explicit?: string): Promise<string> {
  return explicit ?? browseDirectory('Choisir le dossier du projet Prométhée');
}
export async function statusFlow(root: string, json = false): Promise<void> {
  const manifest = await readManifest(root);
  if (json) {
    console.log(JSON.stringify(manifest, null, 2));
    return;
  }
  note(
    [
      'Dossier : ' + display(root),
      'Projet : ' + display(manifest.project.name),
      'Profil : ' + manifest.project.profile,
      'Skills : ' + manifest.skills.length,
      'Options : ' + JSON.stringify(manifest.project.options),
      ...manifest.steps.map(
        (s) => s.id + (s.target ? ' (' + s.target + ')' : '') + ' : ' + s.state,
      ),
    ].join('\n'),
    'État enregistré',
  );
  const context = await readProjectServices(root);
  const statuses = await inspectServices(context);
  if (statuses.length)
    note(statuses.map((s) => JSON.stringify(s)).join('\n'), 'Services natifs — état interrogé');
  else
    log.info(
      'Aucun service natif associé. Les bases Docker, distantes et SQLite gardent leur gestion propre.',
    );
}
export async function servicesFlow(root: string, resourcesRoot: string): Promise<void> {
  const context = await readProjectServices(root);
  const statuses = await inspectServices(context);
  if (!statuses.length) {
    log.info('Aucun service natif validé associé à ce projet. Aucun appel Docker effectué.');
    return;
  }
  note(statuses.map((s) => JSON.stringify(s)).join('\n'), 'Services du projet');
  const manifest = await readManifest(root);
  const requirements = await getRequirements(
    {
      profile: manifest.project.profile,
      git: manifest.project.git,
      options: manifest.project.options,
      skills: manifest.skills,
      databases: manifest.databases,
    },
    { root: resourcesRoot },
  );
  const compatibility = Object.fromEntries(
    requirements
      .filter((r) => r.kind === 'database' && r.qualification === 'qualified')
      .map((r) => [r.id, r]),
  );
  const actionable = statuses.filter(
    (s) =>
      s.mode === 'native' &&
      s.instanceId &&
      context.databases.some((d) => d.id === s.databaseId && compatibility[d.engine]),
  );
  if (!actionable.length) {
    log.info(
      'Aucune action native disponible : association ou compatibilité du moteur encore à qualifier. Les autres bases restent informatives.',
    );
    return;
  }
  const db = answer(
    await select({
      message: 'Base native',
      options: actionable.map((s) => ({ value: s.databaseId, label: s.databaseId })),
    }),
  );
  const action = answer(
    await select({
      message: 'Action',
      options: [
        { value: 'start', label: 'Démarrer' },
        {
          value: 'stop',
          label: 'Arrêter — peut affecter les autres projets partageant cette instance',
        },
        { value: 'back', label: 'Retour' },
      ],
    }),
  );
  if (action === 'back') return;
  if (
    !answer(
      await confirm({
        message:
          action === 'stop'
            ? 'Arrêter explicitement cette instance ?'
            : 'Démarrer cette instance ?',
        initialValue: false,
      }),
    )
  )
    throw new Cancelled();
  const result = await changeService(context, db, action, { explicit: true, compatibility });
  log.info(JSON.stringify(result));
}
export async function resumeFlow(root: string, resourcesRoot: string): Promise<void> {
  const before = await readManifest(root);
  const resources = await loadCatalogue(resourcesRoot);
  const documentOnly = before.steps.find((s) => s.id === 'scaffold')?.state === 'skipped';
  const selection = resolveSelection(resources, {
    profile: before.project.profile,
    options: before.project.options,
    scope: before.project.scope,
    git: before.project.git,
    skillIds: before.skills.map((s) => s.id),
  });
  let bootstrap;
  if (!documentOnly) {
    bootstrap = await planBootstrap(
      await getRequirements({ ...selection, databases: before.databases }, { root: resourcesRoot }),
      {
        host: await inspectHost(),
        inspectionOptions: { excludedDirectories: [path.join(resourcesRoot, 'runtime')] },
      },
    );
    if (bootstrap.status !== 'ready') throw Error(bootstrap.reasons.join('\n'));
  }
  if (
    !answer(
      await confirm({
        message: 'Reprendre la préparation en conservant les modifications locales ?',
        initialValue: false,
      }),
    )
  )
    throw new Cancelled();
  const resumed = await resumeProject(root, resourcesRoot);
  log.success('Fichiers manquants restaurés ; modifications conservées.');
  if (!documentOnly && bootstrap) {
    const plan = await planProject(resources, resumed.selection, {
      projectName: before.project.name,
    });
    await installProjectDependencies(root, plan.dependencyTargets, bootstrap.tools);
  }
}
