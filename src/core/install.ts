import fs from 'node:fs/promises';
import path from 'node:path';
import { readManifest, writeManifest, updateStep } from './manifest.js';
import { sha256 } from './catalogue.js';
import type { DependencyTarget } from './render.js';
import { runCommand, type CommandRunner } from '../system/commands.js';
import type { ToolInspection } from '../system/preflight.js';
import {
  checkedDirectory,
  readChecks,
  writeChecks,
  dependencyFingerprint,
  verificationFingerprint,
} from './checks.js';
import { initializeGit } from './git.js';

export async function installProjectDependencies(
  root: string,
  targets: DependencyTarget[],
  tools: ToolInspection[],
  runner: CommandRunner = runCommand,
): Promise<void> {
  const blocked = tools.filter((tool) => tool.state !== 'compatible');
  const absent = targets.filter(
    (target) => !tools.some((tool) => tool.id === target.manager && tool.executable),
  );
  if (blocked.length || absent.length)
    throw Error(
      'Précontrôle incomplet ou incompatible : ' +
        [
          ...blocked.map((tool) => tool.id + ' (' + tool.state + ')'),
          ...absent.map((target) => target.manager),
        ].join(', '),
    );
  const manifest = await readManifest(root);
  const checks = await readChecks(root);
  const versions = JSON.stringify(tools.map((t) => [t.id, t.version, t.executable]));
  manifest.toolchain = tools.map((t) => ({
    id: t.id,
    required: true,
    state: t.state === 'qualification-pending' ? 'planned' : t.state,
    qualification: t.qualification,
    ...(t.version ? { detectedVersion: t.version } : {}),
  }));
  updateStep(manifest, 'preflight', 'succeeded');
  updateStep(manifest, 'tool-install', 'skipped');
  updateStep(manifest, 'tool-verification', 'succeeded');
  await writeManifest(root, manifest);
  for (const target of targets) {
    const cwd = await checkedDirectory(root, target.target);
    const saved = checks.targets[target.target] ?? {};
    const tool = tools.find((t) => t.id === target.manager && t.state === 'compatible');
    if (!tool?.executable) throw Error('Commande compatible absente : ' + target.manager);
    const before = await dependencyFingerprint(cwd, versions);
    const succeeded = manifest.steps.some(
      (s) => s.id === 'dependencies' && s.target === target.target && s.state === 'succeeded',
    );
    if (!(succeeded && saved.dependencies === before)) {
      updateStep(manifest, 'dependencies', 'running', target.target);
      await writeManifest(root, manifest);
      try {
        const calls =
          target.manager === 'npm'
            ? [
                ...(target.lockNeedsUpdate
                  ? [
                      [
                        'install',
                        '--package-lock-only',
                        '--engine-strict',
                        '--no-audit',
                        '--no-fund',
                      ],
                    ]
                  : []),
                ['ci', '--engine-strict', '--no-audit', '--no-fund'],
              ]
            : [
                ...(target.lockNeedsUpdate
                  ? [['update', 'livewire/livewire', '--with-dependencies', '--no-interaction']]
                  : []),
                ['install', '--no-interaction'],
              ];
        for (const args of calls) {
          const result = await runner({
            command: tool.executable,
            args: [...(tool.prefixArgs ?? []), ...args],
            cwd: await checkedDirectory(root, target.target),
            stdio: 'inherit',
            timeoutMs: 15 * 60_000,
          });
          if (result.code !== 0)
            throw Error(
              result.error || 'Échec de ' + target.manager + ' (code ' + result.code + ').',
            );
        }
        saved.dependencies = await dependencyFingerprint(
          await checkedDirectory(root, target.target),
          versions,
        );
        delete saved.verification;
        checks.targets[target.target] = saved;
        await writeChecks(root, checks);
        updateStep(manifest, 'dependencies', 'succeeded', target.target);
        for (const name of ['package-lock.json', 'composer.lock']) {
          const relative = (target.target === '.' ? '' : target.target + '/') + name;
          const record = manifest.files.find((f) => f.path === relative);
          if (record) record.sha256 = sha256(await fs.readFile(path.join(root, relative)));
        }
      } catch (error) {
        updateStep(manifest, 'dependencies', 'failed', target.target, {
          code: 'DEPENDENCIES_FAILED',
          message: (error as Error).message,
        });
        await writeManifest(root, manifest);
        throw error;
      }
      await writeManifest(root, manifest);
    }
    const verification = await verificationFingerprint(
      await checkedDirectory(root, target.target),
      versions,
    );
    const verified = manifest.steps.some(
      (s) => s.id === 'verification' && s.target === target.target && s.state === 'succeeded',
    );
    if (verified && saved.verification === verification) continue;
    updateStep(manifest, 'verification', 'running', target.target);
    await writeManifest(root, manifest);
    try {
      const pkg =
        target.manager === 'npm'
          ? JSON.parse(await fs.readFile(path.join(cwd, 'package.json'), 'utf8'))
          : undefined;
      const commands =
        target.manager === 'npm'
          ? ['typecheck', 'lint', 'build'].filter((s) => pkg.scripts?.[s])
          : ['lint'];
      for (const check of commands) {
        const result = await runner({
          command: tool.executable,
          args: [
            ...(tool.prefixArgs ?? []),
            ...(target.manager === 'npm' ? ['run', check] : [check]),
          ],
          cwd: await checkedDirectory(root, target.target),
          stdio: 'inherit',
          timeoutMs: 10 * 60_000,
        });
        if (result.code !== 0)
          throw Error('Vérification échouée : ' + check + '. ' + (result.error ?? ''));
      }
      const after = await verificationFingerprint(
        await checkedDirectory(root, target.target),
        versions,
      );
      if (after !== verification)
        throw Error(
          'Les sources ont changé pendant les contrôles. Relancer pour vérifier cet état.',
        );
      saved.verification = after;
      checks.targets[target.target] = saved;
      await writeChecks(root, checks);
      updateStep(manifest, 'verification', 'succeeded', target.target);
      await writeManifest(root, manifest);
    } catch (error) {
      updateStep(manifest, 'verification', 'failed', target.target, {
        code: 'VERIFICATION_FAILED',
        message: (error as Error).message,
      });
      await writeManifest(root, manifest);
      throw error;
    }
  }
  const remaining =
    manifest.databases.some((d) => d.state !== 'verified') ||
    manifest.steps.some((s) => s.id === 'native-launch' && s.state !== 'succeeded');
  updateStep(manifest, 'verification', remaining ? 'planned' : 'succeeded');
  await writeManifest(root, manifest);
  if (!remaining) await initializeGit(root, manifest, runner);
  console.log(
    remaining
      ? 'Dépendances et contrôles du socle terminés ; configuration SQL ou lancement natif encore requis.'
      : 'Socle installé et contrôlé. Consulter le manifeste pour les étapes Git restantes.',
  );
}
