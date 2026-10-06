# Routage des tâches

Lire le périmètre fonctionnel dans `PROJECT.md` seulement lorsque la tâche le nécessite. Ouvrir la carte utile et les fichiers qu'elle indique ; ne pas charger toutes les cartes ou tous les skills.

Pour les tâches UI, consulter [le guide anti-slop](../agent-guides/anti-slop.md). La conception et l'audit ciblé ont des déclencheurs distincts ; une tâche backend ou système ne charge pas les références visuelles.

| Tâche | Zone | Skills installés pertinents | Vérifications |
| --- | --- | --- | --- |
| Modifier application expo | [mobile](mobile.md) | `ui-ux-pro-max`, `verification-before-completion`, `systematic-debugging`, `expo-router`, `expo-design-system`, `expo-native-ui` | typecheck, lint, test comportement utile, expo install --check, appareil si changement natif |
| Audit demandé ou correction d’un rendu jugé générique | [mobile](mobile.md) | `stop-design-slop` | CLEAN conserve la direction ; audit seul sans écriture ; pas de cascade |
| Rédaction ou révision de prose UI/documentation concernée | Zones réellement concernées | `humanizer` | Faits, voix, liens et placeholders conservés ; pas de réécriture de code |

Pour un changement transversal, consulter chaque frontière touchée et élargir les vérifications. En cas de différence entre carte et code, vérifier le code et corriger la carte concernée. Les skills non sélectionnés ne sont pas requis.
