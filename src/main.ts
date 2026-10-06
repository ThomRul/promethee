#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { intro, outro, select, log, note } from '@clack/prompts';
import { createFlow } from './cli/create.js';
import { answer, Cancelled } from './cli/navigation.js';
import { selectProject, statusFlow, servicesFlow, resumeFlow } from './cli/actions.js';
import { skillsUpdateFlow } from './cli/skills.js';
import { loadCatalogue } from './core/catalogue.js';
import { resolveSelection } from './core/selection.js';
import { getRequirements, inspectTools } from './system/preflight.js';
import { inspectHost } from './system/host.js';

const resourcesRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const help = `Prométhée 0.2.0\n\nUsage : promethee [create | status | services | resume | skills update | doctor]\n\n--project CHEMIN  Projet explicite pour status/services/resume/skills update\n--json            Résultat enregistré de status ou diagnostic doctor\n--help            Afficher cette aide\n--version         Afficher la version\n\nSans commande : menu interactif. La création demande une destination explicite.\nAucun push, démarrage Docker ou changement de configuration globale de Codex.\nLes recettes système et certaines options natives restent à qualifier.\n`;
async function doctor(json: boolean): Promise<void> {
  const resources = await loadCatalogue(resourcesRoot);
  const selection = resolveSelection(resources, { profile: 'desktop', git: true });
  const result = {
    host: await inspectHost(),
    tools: await inspectTools(await getRequirements(selection, { root: resourcesRoot }), {
      excludedDirectories: [path.join(resourcesRoot, 'runtime')],
    }),
  };
  if (json) console.log(JSON.stringify(result, null, 2));
  else note(JSON.stringify(result, null, 2), 'Diagnostic — aucune installation');
}
async function run(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(help);
    return;
  }
  if (args.includes('--version')) {
    console.log('0.2.0');
    return;
  }
  let project: string | undefined;
  const words: string[] = [];
  let json = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === '--project') {
      if (!args[i + 1]) throw Error('--project requiert un chemin.');
      project = await fs.realpath(path.resolve(args[++i]!));
    } else if (a === '--json') json = true;
    else if (a.startsWith('-')) throw Error('Option inconnue : ' + a);
    else words.push(a);
  }
  const command = words.join(' ');
  if (command === 'doctor') {
    await doctor(json);
    return;
  }
  if (command && !['create', 'status', 'services', 'resume', 'skills update'].includes(command))
    throw Error('Commande inconnue. Utiliser --help.');
  if (command === 'status' && project) {
    await statusFlow(project, json);
    return;
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY)
    throw Error(
      'Cette action nécessite un terminal interactif. Pour consulter un projet : status --project CHEMIN --json.',
    );
  const brand =
    process.env.NO_COLOR !== undefined || process.env.TERM === 'dumb'
      ? 'promethee-main-feu-console-compacte-v1-ascii.txt'
      : 'promethee-main-feu-console-compacte-v1.ansi';
  process.stdout.write(await fs.readFile(path.join(resourcesRoot, 'branding', brand), 'utf8'));
  intro('Prométhée — préparer un projet pour Codex');
  async function perform(action: string) {
    if (action === 'create') return createFlow(resourcesRoot);
    if (action === 'doctor') return doctor(false);
    const root = await selectProject(project);
    if (action === 'status') return statusFlow(root, json);
    if (action === 'services') return servicesFlow(root, resourcesRoot);
    if (action === 'resume') return resumeFlow(root, resourcesRoot);
    if (action === 'skills update') return skillsUpdateFlow(root, resourcesRoot);
  }
  if (command) {
    await perform(command);
    outro('Terminé.');
    return;
  }
  while (true) {
    const action = answer(
      await select({
        message: 'Action',
        options: [
          { value: 'create', label: 'Créer un nouveau projet' },
          { value: 'status', label: 'Voir l’état d’un projet' },
          { value: 'resume', label: 'Reprendre une préparation' },
          { value: 'services', label: 'Services du projet' },
          { value: 'skills update', label: 'Mettre à jour les skills' },
          { value: 'doctor', label: 'Diagnostic des outils' },
          { value: 'quit', label: 'Quitter' },
        ],
      }),
    );
    if (action === 'quit') break;
    try {
      await perform(action);
    } catch (error) {
      if (error instanceof Cancelled) log.info('Opération annulée.');
      else log.error((error as Error).message);
    }
  }
  outro('À bientôt.');
}
run().catch((error) => {
  if (error instanceof Cancelled) {
    console.log('Opération annulée.');
    return;
  }
  console.error((error as Error).message);
  if (process.env.PROMETHEE_DEBUG) console.error(error);
  process.exitCode = 1;
});
