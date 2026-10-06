# Routage des tâches

Lire le périmètre fonctionnel dans `PROJECT.md` seulement lorsque la tâche le nécessite. Ouvrir la carte utile et les fichiers qu'elle indique ; ne pas charger toutes les cartes ou tous les skills.

Pour les tâches UI, consulter [le guide anti-slop](../agent-guides/anti-slop.md). La conception et l'audit ciblé ont des déclencheurs distincts ; une tâche backend ou système ne charge pas les références visuelles.

| Tâche | Zone | Skills installés pertinents | Vérifications |
| --- | --- | --- | --- |
| Modifier interface react | [frontend](frontend.md) | `ui-ux-pro-max`, `verification-before-completion`, `systematic-debugging`, `frontend-a11y` | typecheck, lint, build, test comportement utile |
| Modifier api et configuration des données | [backend](backend.md) | `verification-before-completion`, `systematic-debugging`, `supabase-postgres-best-practices` | typecheck, lint, build, test API utile, migration si schéma modifié |
| Audit demandé ou correction d’un rendu jugé générique | [frontend](frontend.md) | `stop-design-slop` | CLEAN conserve la direction ; audit seul sans écriture ; pas de cascade |
| Critique de hiérarchie, parcours ou composition d’une interface existante | [frontend](frontend.md) | `impeccable` | Variante web/native ; pas de nouveau moteur ni de refonte implicite |
| Composition ou séquence éditoriale explicitement choisie | [frontend](frontend.md) | `gpt-taste` | GSAP qualifié uniquement ; pas de faux script, animation universelle ou fonction native |
| Rédaction ou révision de prose UI/documentation concernée | Zones réellement concernées | `humanizer` | Faits, voix, liens et placeholders conservés ; pas de réécriture de code |
| Architecture, flux, séquence, états ou données à expliquer visuellement | Documentation | `diagram-design` | Périmètre réduit ; ne remplace pas les cartes de contexte |
| Audit ou durcissement sécurité demandé dans le contexte couvert | Zones réellement concernées | `security-best-practices` | Langages couverts JS/TS/Python/Go ; pas d’expertise PHP implicite |
| Modèle de menaces explicitement demandé | Zones réellement concernées | `security-threat-model` | Valider les hypothèses et frontières ; aucun envoi de code |

Pour un changement transversal, consulter chaque frontière touchée et élargir les vérifications. En cas de différence entre carte et code, vérifier le code et corriger la carte concernée. Les skills non sélectionnés ne sont pas requis.
