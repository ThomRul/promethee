import fs from 'node:fs/promises';
import path from 'node:path';
import { updateStep, writeManifest, type Manifest } from './manifest.js';
import { runCommand, resolveCommand, type CommandRunner } from '../system/commands.js';
import { checkedDirectory } from './checks.js';

export async function initializeGit(
  root: string,
  manifest: Manifest,
  runner: CommandRunner = runCommand,
): Promise<void> {
  if (!manifest.project.git) return;
  const git = await resolveCommand('git');
  if (!git) throw Error('Git indisponible après le contrôle.');
  let step: 'git-init' | 'initial-commit' = 'git-init';
  try {
    await checkedDirectory(root, '.');
    updateStep(manifest, step, 'running');
    await writeManifest(root, manifest);
    const exists = await fs
      .access(path.join(root, '.git'))
      .then(() => true)
      .catch(() => false);
    if (!exists) {
      const result = await runner({
        command: git,
        args: ['init', '--initial-branch=main'],
        cwd: root,
      });
      if (result.code !== 0) throw Error('Initialisation Git échouée.');
    }
    updateStep(manifest, step, 'succeeded');
    await writeManifest(root, manifest);
    step = 'initial-commit';
    if (manifest.steps.some((s) => s.id === step && s.state === 'succeeded')) return;
    const identity = await Promise.all(
      ['user.name', 'user.email'].map((key) =>
        runner({ command: git, args: ['config', '--get', key], cwd: root }),
      ),
    );
    if (!identity.every((x) => x.code === 0 && x.stdout.trim())) {
      console.log('Premier commit en attente : configurer identité/signature Git.');
      return;
    }
    updateStep(manifest, step, 'running');
    await writeManifest(root, manifest);
    const paths = [...manifest.files.map((f) => f.path), '.promethee/manifest.json'];
    for (let i = 0; i < paths.length; i += 60) {
      await checkedDirectory(root, '.');
      const stage = await runner({
        command: git,
        args: ['add', '--', ...paths.slice(i, i + 60)],
        cwd: root,
      });
      if (stage.code !== 0) throw Error('Préparation du premier commit échouée.');
    }
    const result = await runner({
      command: git,
      args: ['commit', '-m', 'chore(scaffold): initialize project with Prométhée'],
      cwd: root,
      stdio: 'inherit',
    });
    if (result.code !== 0)
      throw Error('Premier commit échoué ; vérifier identité et signature Git.');
    updateStep(manifest, step, 'succeeded');
    await writeManifest(root, manifest);
    console.log(
      'Premier commit local créé ; son état final est enregistré dans le manifeste local. Aucun push.',
    );
  } catch (error) {
    updateStep(manifest, step, 'failed', undefined, {
      code: 'GIT_FAILED',
      message: (error as Error).message,
    });
    await writeManifest(root, manifest);
    throw error;
  }
}
