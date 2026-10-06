import path from 'node:path';
import os from 'node:os';
import { confirm, multiselect, select, text, note, log } from '@clack/prompts';
import { loadCatalogue } from '../core/catalogue.js';
import { availableSkills, resolveSelection } from '../core/selection.js';
import { planProject } from '../core/render.js';
import { createProject, inspectDestination } from '../core/project.js';
import { answer, browseDirectory, display, Cancelled } from './navigation.js';
import { getRequirements } from '../system/preflight.js';
import { planBootstrap, executeBootstrap } from '../system/bootstrap.js';
import { inspectHost } from '../system/host.js';
import { installProjectDependencies } from '../core/install.js';

export async function createFlow(resourcesRoot: string): Promise<void> {
  const resources = await loadCatalogue(resourcesRoot);
  const parent = await browseDirectory('Choisir le dossier parent du nouveau projet');
  const folder = answer(
    await text({
      message: 'Nom du dossier à créer',
      validate: (v) =>
        !v?.trim() ||
        v !== path.basename(v) ||
        /[\\/:*?"<>|\x00-\x1f]/.test(v) ||
        ['.', '..'].includes(v)
          ? 'Saisir un nom de dossier simple.'
          : undefined,
    }),
  );
  const name = answer(
    await text({
      message: 'Nom du projet',
      initialValue: folder,
      validate: (v) => (!v?.trim() ? 'Saisir un nom.' : undefined),
    }),
  );
  const scope = answer(
    await select({
      message: 'Le projet est-il déjà cadré ?',
      options: [
        { value: 'defined', label: 'Oui — le brief est déjà défini' },
        { value: 'undefined', label: 'Non — Codex aidera à cadrer le projet' },
      ],
    }),
  ) as 'defined' | 'undefined';
  const profile = answer(
    await select({
      message: 'Type de projet',
      options: resources.profiles.map((p) => ({ value: p.id, label: p.label, hint: p.stack })),
    }),
  );
  const options: Record<string, string | boolean> = {
    ...resources.profiles.find((p) => p.id === profile)!.defaults,
  };
  if (profile === 'php') {
    options.database = answer(
      await select({
        message: 'Base de données',
        options: [
          { value: 'mysql', label: 'MySQL' },
          { value: 'mariadb', label: 'MariaDB — recette native à qualifier' },
        ],
      }),
    );
    options.livewire = answer(
      await confirm({ message: 'Ajouter Livewire ?', initialValue: false }),
    );
  }
  if (profile === 'desktop' || profile === 'mobile')
    options.database = answer(
      await confirm({ message: 'Ajouter une base SQLite locale ?', initialValue: false }),
    )
      ? 'sqlite'
      : 'none';
  if (profile === 'mobile') {
    options.mobileMode = answer(
      await select({
        message: 'Parcours mobile',
        initialValue: 'android-local',
        options: [
          {
            value: 'android-local',
            label: 'Android local — recommandé',
            hint: 'Installation native encore à qualifier ; aperçu disponible',
          },
          { value: 'expo-go', label: 'Expo Go — aperçu sur téléphone' },
        ],
      }),
    );
    if (options.mobileMode === 'android-local')
      options.androidTarget = answer(
        await select({
          message: 'Cible Android',
          options: [
            { value: 'device', label: 'Téléphone USB' },
            { value: 'emulator', label: 'Émulateur — préparation à qualifier' },
          ],
        }),
      );
    options.backend = answer(
      await select({
        message: 'Backend mobile',
        options: [
          { value: 'none', label: 'Aucun pour le moment' },
          { value: 'existing', label: 'Réutiliser une API existante' },
          { value: 'new', label: 'Ajouter NestJS / TypeORM / PostgreSQL' },
        ],
      }),
    );
  }
  options.uiAnimations = answer(
    await confirm({ message: 'Activer les animations UI ?', initialValue: false }),
  );
  if (profile === 'web-api' || profile === 'php')
    options.editorialAnimations = answer(
      await confirm({
        message:
          'Prévoir les animations éditoriales avancées ? (installation GSAP encore indisponible)',
        initialValue: false,
      }),
    );
  const defaults = resolveSelection(resources, { profile, options, scope });
  const skills = availableSkills(resources, profile, defaults.options);
  const suspended = resources.skills.filter(
    (skill) => skill.profiles.includes(profile) && skill.status === 'blocked-redistribution',
  );
  if (suspended.length)
    note(
      suspended.map((skill) => skill.id).join(', ') +
        '\nCopies suspendues : licences/mentions complètes non qualifiées pour la redistribution.',
      'Skills indisponibles dans ce catalogue',
    );
  const ids = answer(
    await multiselect({
      message: 'Skills à préparer (Espace pour cocher)',
      required: false,
      initialValues: defaults.skills.map((s) => s.id),
      options: skills.map((s) => ({
        value: s.id,
        label: s.id,
        hint: [
          resources.routing.find((route) => route.id === s.id)?.purpose,
          s.license,
          s.repo + '@' + s.revision.slice(0, 8),
          s.adaptationVersion ? 'adaptation ' + s.adaptationVersion : undefined,
        ]
          .filter(Boolean)
          .join(' · '),
      })),
    }),
  );
  const git = answer(
    await confirm({ message: 'Prévoir Git pour ce projet ?', initialValue: true }),
  );
  const selection = resolveSelection(resources, { profile, options, scope, git, skillIds: ids });
  const documentOnly = answer(
    await select({
      message: 'Action',
      options: [
        {
          value: false,
          label: 'Préparer le socle et installer ses dépendances',
          hint: 'Les outils incompatibles ou recettes manquantes bloquent le parcours',
        },
        {
          value: true,
          label: 'Préparer un aperçu des documents et skills',
          hint: 'Aucune application ou dépendance installée',
        },
      ],
    }),
  );
  let bootstrap;
  if (!documentOnly) {
    if (selection.qualificationBlockers.length)
      throw Error(
        'Installation indisponible pour ces options. ' +
          selection.qualificationBlockers.join('; ') +
          '. Un aperçu documentaire est possible.',
      );
    const host = await inspectHost();
    const requirements = await getRequirements(selection, { root: resourcesRoot });
    await inspectDestination(parent, folder);
    bootstrap = await planBootstrap(requirements, {
      host,
      inspectionOptions: { excludedDirectories: [path.join(resourcesRoot, 'runtime')] },
    });
    if (bootstrap.status !== 'ready')
      throw Error('Préparation arrêtée avant création : ' + bootstrap.reasons.join('\n'));
  }
  note(
    [
      'Destination : ' + display(path.resolve(parent, folder)),
      'Profil : ' + selection.profile.label,
      'Skills : ' + (ids.join(', ') || 'aucun'),
      'Mode : ' + (documentOnly ? 'aperçu documentaire' : 'socle avec dépendances'),
      'Docker : question réservée à Codex',
      ...(bootstrap?.tools.map((t) => t.id + ' : ' + t.state) ?? []),
      ...(bootstrap?.actions.map(
        (a) =>
          a.id +
          ' : téléchargement/installation' +
          (a.privileged ? ' — droits système nécessaires' : ''),
      ) ?? []),
      ...selection.qualificationBlockers,
    ].join('\n'),
    'Récapitulatif',
  );
  if (
    !answer(
      await confirm({ message: 'Préparer ce projet à cet emplacement ?', initialValue: false }),
    )
  )
    throw new Cancelled();
  if (bootstrap?.actions.length) {
    const cacheRoot = path.join(
      process.platform === 'win32'
        ? (process.env.LOCALAPPDATA ?? os.homedir())
        : (process.env.XDG_CACHE_HOME ?? path.join(os.homedir(), '.cache')),
      'promethee',
      'downloads',
    );
    const execution = await executeBootstrap(bootstrap, {
      approvedPlanId: bootstrap.id,
      cacheRoot,
      inspectionOptions: { excludedDirectories: [path.join(resourcesRoot, 'runtime')] },
    });
    if (execution.state !== 'succeeded') throw Error(execution.reasons.join('\n'));
    bootstrap.tools = execution.tools;
  }
  const plan = await planProject(resources, selection, { projectName: name, documentOnly });
  const created = await createProject({
    resourcesRoot,
    parentDirectory: parent,
    folderName: folder,
    projectName: name,
    selection,
    documentOnly,
  });
  log.success('Documents et skills préparés dans ' + display(created.root));
  if (!documentOnly && bootstrap)
    await installProjectDependencies(created.root, plan.dependencyTargets, bootstrap.tools);
  note(
    'Ouvrir ce dossier dans Codex et lire handoff.txt. Les étapes restantes sont enregistrées dans le manifeste. Aucun push automatique.',
    'Suite du projet',
  );
}
