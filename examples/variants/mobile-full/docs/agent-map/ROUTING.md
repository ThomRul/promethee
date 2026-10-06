# Routage des tâches

Lire le périmètre fonctionnel dans `PROJECT.md` seulement lorsque la tâche le nécessite. Ouvrir la carte utile et les fichiers qu'elle indique ; ne pas charger toutes les cartes ou tous les skills.

Pour les tâches UI, consulter [le guide anti-slop](../agent-guides/anti-slop.md). La conception et l'audit ciblé ont des déclencheurs distincts ; une tâche backend ou système ne charge pas les références visuelles.

| Tâche | Zone | Skills installés pertinents | Vérifications |
| --- | --- | --- | --- |
| Modifier application expo | [mobile](mobile.md) | `ui-ux-pro-max`, `verification-before-completion`, `systematic-debugging`, `expo-router`, `expo-design-system`, `expo-native-ui`, `expo-animation`, `expo-data-fetching` | typecheck, lint, test comportement utile, expo install --check, appareil si changement natif |
| Audit demandé ou correction d’un rendu jugé générique | [mobile](mobile.md) | `stop-design-slop` | CLEAN conserve la direction ; audit seul sans écriture ; pas de cascade |
| Critique de hiérarchie, parcours ou composition d’une interface existante | [mobile](mobile.md) | `impeccable` | Variante web/native ; pas de nouveau moteur ni de refonte implicite |
| Rédaction ou révision de prose UI/documentation concernée | Zones réellement concernées | `humanizer` | Faits, voix, liens et placeholders conservés ; pas de réécriture de code |
| Architecture, flux, séquence, états ou données à expliquer visuellement | Documentation | `diagram-design` | Périmètre réduit ; ne remplace pas les cartes de contexte |
| Modèle de menaces explicitement demandé | Zones réellement concernées | `security-threat-model` | Valider les hypothèses et frontières ; aucun envoi de code |

Pour un changement transversal, consulter chaque frontière touchée et élargir les vérifications. En cas de différence entre carte et code, vérifier le code et corriger la carte concernée. Les skills non sélectionnés ne sont pas requis.
