import { confirm, multiselect, note, log } from '@clack/prompts';
import { planSkillUpdates, applySkillUpdates } from '../core/skill-updates.js';
import { answer, Cancelled } from './navigation.js';

export async function skillsUpdateFlow(root: string, resourcesRoot: string): Promise<void> {
  const plan = await planSkillUpdates(root, resourcesRoot);
  note(
    plan.map((s) => s.id + ' : ' + s.action).join('\n') || 'Aucun skill suivi.',
    'Catalogue de cette version du CLI',
  );
  if (plan.every((s) => s.action === 'current' || s.action === 'unavailable')) {
    log.info('Aucune mise à jour applicable.');
    return;
  }
  const modified = plan.filter((s) => s.action === 'preserve-custom');
  const replace = modified.length
    ? answer(
        await multiselect({
          message:
            'Skills personnalisés : conserver par défaut. Cocher seulement pour remplacer avec sauvegarde complète.',
          required: false,
          options: modified.map((s) => ({ value: s.id, label: s.id })),
        }),
      )
    : [];
  if (
    !answer(
      await confirm({
        message: 'Appliquer ce récapitulatif au projet choisi ?',
        initialValue: false,
      }),
    )
  )
    throw new Cancelled();
  await applySkillUpdates(root, resourcesRoot, { replaceModified: replace, expected: plan });
  log.success(
    'Catalogue appliqué ; personnalisations conservées ou sauvegardées selon les choix. Aucun téléchargement GitHub automatique.',
  );
}
