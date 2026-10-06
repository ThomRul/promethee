import path from 'node:path';
import {
  readResource,
  resourceFiles,
  safeRelativePath,
  verifiedSkillFiles,
  type CatalogueResources,
  type Zone,
} from './catalogue.js';
import { relevantRouting, type Selection } from './selection.js';

export interface DependencyTarget {
  target: string;
  manager: 'npm' | 'composer';
  lockNeedsUpdate: boolean;
}
export interface ProjectPlan {
  files: Map<string, Buffer>;
  zones: Zone[];
  dependencyTargets: DependencyTarget[];
  packageName: string;
}

export function packageNameFor(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
  if (!slug)
    throw new Error('Le nom du projet doit permettre de produire un identifiant de package.');
  return slug;
}

function cell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');
}
function renderTemplate(source: string, variables: Record<string, string>): string {
  return source.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_, key: string) => {
    if (!(key in variables)) throw new Error(`Variable de gabarit inconnue : ${key}`);
    return variables[key]!;
  });
}

export async function planProject(
  resources: CatalogueResources,
  selection: Selection,
  input: { projectName: string; documentOnly?: boolean },
): Promise<ProjectPlan> {
  if (!input.projectName.trim() || /[\x00-\x1f\x7f]/.test(input.projectName))
    throw new Error('Nom affiché invalide.');
  const files = new Map<string, Buffer>();
  const packageName = packageNameFor(input.projectName);
  const prefix =
    selection.profile.id === 'mobile' && selection.options.backend === 'new' ? 'mobile/' : '';
  const dependencyTargets: DependencyTarget[] = [];
  async function copyTree(template: string, destination = ''): Promise<void> {
    const source = `templates/${safeRelativePath(template)}`;
    for (const relative of await resourceFiles(resources.root, source)) {
      files.set(
        destination + relative.slice(source.length + 1),
        await readResource(resources.root, relative),
      );
    }
  }
  if (!input.documentOnly) {
    await copyTree(selection.profile.template, prefix);
    if (prefix) await copyTree('profiles/web-api/backend', 'backend/');
    for (const [relative, buffer] of files) {
      if (path.posix.basename(relative) !== 'package.json') continue;
      const json = JSON.parse(buffer.toString());
      json.name = `${packageName}${relative.includes('/') ? '-' + relative.split('/')[0] : ''}`;
      files.set(relative, Buffer.from(JSON.stringify(json, null, 2) + '\n'));
      const target = path.posix.dirname(relative);
      const lockPath = target === '.' ? 'package-lock.json' : `${target}/package-lock.json`;
      const existingLock = files.get(lockPath);
      if (existingLock) {
        const lock = JSON.parse(existingLock.toString());
        lock.name = json.name;
        if (lock.packages?.['']) lock.packages[''].name = json.name;
        files.set(lockPath, Buffer.from(JSON.stringify(lock, null, 2) + '\n'));
      }
      dependencyTargets.push({ target, manager: 'npm', lockNeedsUpdate: false });
    }
    if (selection.profile.id === 'php') {
      const composer = JSON.parse(files.get('composer.json')!.toString());
      composer.name = `promethee/${packageName}`;
      files.set('composer.json', Buffer.from(JSON.stringify(composer, null, 2) + '\n'));
      dependencyTargets.push({ target: '.', manager: 'composer', lockNeedsUpdate: false });
    }
    applyOptions(resources, selection, files, dependencyTargets, prefix);
  }
  const zones = selection.profile.zones.map((zone) => ({
    ...zone,
    paths: zone.paths.map((file) => prefix + file),
  }));
  if (prefix) {
    const backend = resources.profiles
      .find((profile) => profile.id === 'web-api')
      ?.zones.find((zone) => zone.id === 'backend');
    if (backend) zones.push({ ...backend });
  }
  for (const skill of selection.skills) {
    for (const [relative, buffer] of await verifiedSkillFiles(resources, skill)) {
      files.set(`.agents/skills/${skill.id}/${relative}`, buffer);
    }
  }
  await addDocuments(resources, selection, input, files, zones, prefix);
  return { files, zones, dependencyTargets, packageName };
}

function applyOptions(
  resources: CatalogueResources,
  selection: Selection,
  files: Map<string, Buffer>,
  targets: DependencyTarget[],
  prefix: string,
): void {
  const target = selection.profile.id === 'web-api' ? 'frontend' : prefix ? 'mobile' : '.';
  const packagePath = target === '.' ? 'package.json' : `${target}/package.json`;
  const pkg = JSON.parse(files.get(packagePath)!.toString());
  let changedNpm = false;
  for (const rule of selection.activeRules) {
    const group = rule.dependencyGroup
      ? resources.frameworkLock.optional[rule.dependencyGroup]
      : undefined;
    if (group) {
      for (const field of ['dependencies', 'devDependencies'] as const) {
        if (group[field]) {
          pkg[field] = { ...pkg[field], ...group[field] };
          changedNpm = true;
        }
      }
    }
    for (const name of rule.removeNpm ?? []) {
      delete pkg.dependencies?.[name];
      delete pkg.devDependencies?.[name];
      changedNpm = true;
    }
    if (rule.composer) {
      const composer = JSON.parse(files.get('composer.json')!.toString());
      composer.require = { ...composer.require, ...rule.composer };
      files.set('composer.json', Buffer.from(JSON.stringify(composer, null, 2) + '\n'));
      targets.find((entry) => entry.manager === 'composer')!.lockNeedsUpdate = true;
    }
  }
  if (selection.profile.id === 'mobile' && selection.options.mobileMode === 'expo-go') {
    pkg.scripts.start = 'expo start --go';
    delete pkg.scripts.android;
    delete pkg.scripts.ios;
  }
  if (selection.profile.id === 'desktop' && selection.options.database === 'sqlite') {
    pkg.scripts['rebuild:native'] = 'electron-rebuild -f -w better-sqlite3';
  }
  files.set(packagePath, Buffer.from(JSON.stringify(pkg, null, 2) + '\n'));
  if (changedNpm)
    targets.find((entry) => entry.target === target && entry.manager === 'npm')!.lockNeedsUpdate =
      true;
  if (selection.options.livewire) {
    files.set(
      'resources/js/app.js',
      Buffer.from('// Alpine est fourni par Livewire ; ne pas démarrer une seconde instance.\n'),
    );
    const view = files
      .get('resources/views/home.blade.php')!
      .toString()
      .replace('</head>', '@livewireStyles</head>')
      .replace('</body>', '@livewireScripts</body>');
    files.set('resources/views/home.blade.php', Buffer.from(view));
  }
  if (selection.options.database === 'mariadb') {
    const env = files
      .get('.env.example')!
      .toString()
      .replace(/^DB_CONNECTION=.*$/m, 'DB_CONNECTION=mariadb');
    files.set('.env.example', Buffer.from(env));
  }
}

async function addDocuments(
  resources: CatalogueResources,
  selection: Selection,
  input: { projectName: string; documentOnly?: boolean },
  files: Map<string, Buffer>,
  zones: Zone[],
  prefix: string,
): Promise<void> {
  const routes = relevantRouting(resources, selection);
  const link = (id: string, base: string) => `[${id}](${base}.agents/skills/${id}/SKILL.md)`;
  const inZone = (zone: Zone) =>
    routes.filter(
      (route) =>
        typeof route.zones === 'string' ||
        (route.zones[selection.profile.id] ?? []).includes(zone.id),
    );
  const selected = new Set(selection.skills.map((skill) => skill.id));
  const policy = [
    '## Skills sélectionnés',
    selected.size
      ? 'Consulter seulement les skills sélectionnés dont le déclencheur correspond à la tâche.'
      : 'Aucun skill installé. Appliquer les règles du projet et les outils de la stack.',
    selected.has('ui-ux-pro-max')
      ? 'UI UX Pro Max pilote la conception visuelle selon le brief et les composants existants.'
      : '',
    selected.has('impeccable')
      ? 'Impeccable apporte une critique UI ciblée, avec références natives sur mobile ; un audit seul ne modifie pas les fichiers.'
      : '',
    selected.has('humanizer')
      ? 'Humanizer concerne uniquement les textes ; conserver faits, voix, liens et placeholders.'
      : '',
    selected.has('diagram-design')
      ? 'Diagram Design répond aux diagrammes demandés ; les cartes restent la source du contexte de code.'
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');
  const animation = [
    '## Animations',
    selection.options.uiAnimations
      ? `Animations UI activées : ${selection.profile.id === 'mobile' ? 'Reanimated' : 'Motion'}, seulement lorsqu’elles servent le besoin.`
      : 'Animations UI avancées désactivées. Aucune bibliothèque ajoutée par un skill ; les transitions simples utiles restent permises.',
    selection.options.editorialAnimations
      ? 'Séquences éditoriales web choisies : GSAP doit être qualifié et installé avant utilisation.'
      : '',
    selected.has('gpt-taste')
      ? 'GPT Taste cadre uniquement les séquences éditoriales explicitement choisies.'
      : '',
    selection.options.uiAnimations && selection.options.editorialAnimations
      ? 'Motion et GSAP ne pilotent pas simultanément les mêmes propriétés d’un élément.'
      : '',
    'Respecter la réduction des mouvements et la maîtrise des interactions par l’utilisateur.',
  ]
    .filter(Boolean)
    .join('\n\n');
  const profileRules = [
    `## Profil ${selection.profile.label}`,
    selection.profile.stack,
    `Suivre [les conventions du profil](docs/agent-guides/${selection.profile.guide}.md).`,
    prefix
      ? 'Application native dans mobile/ et API dans backend/, dans un dépôt sans sous-module ni workspace implicite.'
      : '',
    selection.profile.id === 'mobile'
      ? `Parcours : ${selection.options.mobileMode}. ${
          selection.options.mobileMode === 'expo-go'
            ? 'Expo Go est un aperçu limité aux modules compatibles ; aucun build natif annoncé.'
            : 'Le build Android local et sa cible nécessitent la qualification des outils avant installation.'
        }`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');
  const commands = { ...selection.profile.commands };
  if (prefix) {
    commands.mobile = commands['.']!;
    delete commands['.'];
    commands.backend = resources.profiles.find(
      (profile) => profile.id === 'web-api',
    )!.commands.backend!;
  }
  const variables: Record<string, string> = {
    project_name: cell(input.projectName),
    profile_label: selection.profile.label,
    scope_status:
      selection.scope === 'defined'
        ? 'défini, reprendre le brief et demander seulement les précisions manquantes'
        : 'à cadrer progressivement avec l’utilisateur',
    docker_status: 'à clarifier avec l’utilisateur avant développement',
    git_status: selection.git ? 'activé, initialisation suivie séparément' : 'désactivé',
    stack_summary: selection.profile.stack,
    options_summary: Object.entries(selection.options)
      .map(([key, value]) => `${key}=${value}`)
      .join(', '),
    profile_rules: profileRules,
    selected_skill_policy: policy,
    animation_policy: animation,
    quality_commands:
      '## Commandes par dossier\n\n' +
      Object.entries(commands)
        .map(
          ([dir, values]) => `- \`${dir}\` : ${values.map((value) => `\`${value}\``).join(', ')}`,
        )
        .join('\n'),
    profile_gitignore: selection.profile.id === 'mobile' ? 'android/\nios/\n' : '',
    zone_links: zones.map((zone) => `- [${zone.label}](zones/${zone.id}.md)`).join('\n'),
    routing_rows: zones
      .map(
        (zone) =>
          `| ${cell(zone.responsibility)} | [${zone.label}](zones/${zone.id}.md) | ${
            inZone(zone)
              .map((route) => link(route.id, '../../'))
              .join(', ') || 'Règles du projet'
          } | ${zone.checks.join(', ')} |`,
      )
      .join('\n'),
    skill_routing_rows: routes
      .map(
        (route) =>
          `| ${link(route.id, '../../')} | ${cell(route.trigger)} | ${cell(route.limit)} |`,
      )
      .join('\n'),
    installation_status: input.documentOnly
      ? 'aperçu documentaire, aucun framework ni outil installé'
      : 'squelette copié ; installation des dépendances et vérifications restantes',
    remaining_steps: input.documentOnly
      ? 'qualification et installation réelle à effectuer'
      : 'outils, dépendances, bases et vérifications selon le manifeste ; Git ensuite si activé',
  };
  for (const source of await resourceFiles(resources.root, 'templates/common')) {
    if (source.endsWith('/zone.md.tpl')) continue;
    const target = source.slice('templates/common/'.length).replace(/\.tpl$/, '');
    const buffer = await readResource(resources.root, source);
    files.set(
      target,
      source.endsWith('.tpl') ? Buffer.from(renderTemplate(buffer.toString(), variables)) : buffer,
    );
  }
  for (const zone of zones) {
    const source = (
      await readResource(resources.root, 'templates/common/docs/agent-map/zone.md.tpl')
    ).toString();
    files.set(
      `docs/agent-map/zones/${zone.id}.md`,
      Buffer.from(
        renderTemplate(source, {
          ...variables,
          zone_label: zone.label,
          responsibility: zone.responsibility,
          entrypoints: zone.paths
            .map((file) => `- \`${file}\`${input.documentOnly ? ' (prévu, non créé)' : ''}`)
            .join('\n'),
          boundaries: zone.boundaries,
          reusable_elements: zone.reusable,
          checks: zone.checks.map((check) => `- ${check}`).join('\n'),
        }),
      ),
    );
  }
  files.set(
    `docs/agent-guides/${selection.profile.guide}.md`,
    await readResource(resources.root, `templates/guides/${selection.profile.guide}.md`),
  );
  if (prefix)
    files.set(
      'docs/agent-guides/backend.md',
      await readResource(resources.root, 'templates/guides/web-api.md'),
    );
  const guides = new Set(selection.activeRules.flatMap((rule) => (rule.guide ? [rule.guide] : [])));
  for (const guide of guides) {
    const name = path.posix.basename(guide);
    files.set(
      `docs/agent-guides/options/${name}`,
      await readResource(resources.root, `templates/${guide}`),
    );
  }
  for (const [relative, buffer] of files) {
    safeRelativePath(relative);
    if (
      !relative.startsWith('.agents/skills/') &&
      relative.endsWith('.md') &&
      /\{\{\s*[a-z_]+\s*\}\}/.test(buffer.toString())
    )
      throw new Error(`Gabarit non résolu : ${relative}`);
  }
}
