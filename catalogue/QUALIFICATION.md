# Qualification des skills

Révisions principales figées au 4 octobre 2026 ; Stop Design Slop ajouté le 5 octobre. « Adapté et contrôlé statiquement » signifie licence complète conservée, instructions adaptées et ressources inventoriées ; cela ne prouve pas encore leur comportement dans une vraie session Codex. Les scénarios de recette restent nécessaires. Les rôles et sources des choix initiaux sont identifiés dans [COMPATIBILITY.md](COMPATIBILITY.md) et [initial-selection.json](initial-selection.json).

| Skill | Licence | Révision | État |
| --- | --- | --- | --- |
| ui-ux-pro-max | MIT | [477bcb28c981](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/tree/477bcb28c9812b385cb51a4605ddf30d7b2266e2/.claude/skills/ui-ux-pro-max) | Adapté, contrôle statique |
| stop-design-slop | MIT | [8ad7755204f4](https://github.com/Juuzoe/stop-design-slop/tree/8ad7755204f44cae4350e5a31eb7e8f4d90f0e5e) | Adapté, contrôle statique ; CLEAN ciblé |
| verification-before-completion | MIT | [8ca22dba9a94](https://github.com/obra/superpowers/tree/8ca22dba9a94f28898bbce59f2537ff4d87c747d/skills/verification-before-completion) | Adapté, contrôle statique |
| systematic-debugging | MIT | [8ca22dba9a94](https://github.com/obra/superpowers/tree/8ca22dba9a94f28898bbce59f2537ff4d87c747d/skills/systematic-debugging) | Adapté, contrôle statique |
| vercel-react-best-practices | MIT-declared | [063bee94c3f4](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/react-best-practices) | Redistribution suspendue |
| vercel-composition-patterns | MIT-declared | [063bee94c3f4](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/composition-patterns) | Redistribution suspendue |
| supabase-postgres-best-practices | MIT | [c9be0e931b79](https://github.com/supabase/agent-skills/tree/c9be0e931b7930f7d02126d04774d904c381e7d7/skills/supabase-postgres-best-practices) | Adapté, contrôle statique |
| laravel-best-practices | MIT | [97b8da0cb8c2](https://github.com/laravel/boost/tree/97b8da0cb8c2c1da75531a36e34adaa313a64afc/.ai/laravel/skill/laravel-best-practices) | Adapté, contrôle statique |
| livewire-development | MIT | [97b8da0cb8c2](https://github.com/laravel/boost/tree/97b8da0cb8c2c1da75531a36e34adaa313a64afc/.ai/livewire/4/skill/livewire-development) | Adapté, contrôle statique |
| expo-router | MIT | [13ad8e058741](https://github.com/expo/skills/tree/13ad8e05874195633b5c185f6947bb6400e228fc/plugins/expo/skills/expo-router) | Adapté, contrôle statique |
| expo-design-system | MIT | [13ad8e058741](https://github.com/expo/skills/tree/13ad8e05874195633b5c185f6947bb6400e228fc/plugins/expo/skills/expo-design-system) | Adapté, contrôle statique |
| expo-native-ui | MIT | [13ad8e058741](https://github.com/expo/skills/tree/13ad8e05874195633b5c185f6947bb6400e228fc/plugins/expo/skills/expo-native-ui) | Adapté, contrôle statique |
| expo-data-fetching | MIT | [13ad8e058741](https://github.com/expo/skills/tree/13ad8e05874195633b5c185f6947bb6400e228fc/plugins/expo/skills/expo-data-fetching) | Adapté, contrôle statique |
| expo-animation | MIT | [13ad8e058741](https://github.com/expo/skills/tree/13ad8e05874195633b5c185f6947bb6400e228fc/plugins/expo/skills/expo-animation) | Adapté, contrôle statique |
| security-best-practices | Apache-2.0 | [49f948faa925](https://github.com/openai/skills/tree/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-best-practices) | Adapté, contrôle statique |
| security-threat-model | Apache-2.0 | [49f948faa925](https://github.com/openai/skills/tree/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-threat-model) | Adapté, contrôle statique |
| motion | MIT-declared | [d1c5c26f424a](https://github.com/motiondivision/ai-kit/tree/d1c5c26f424adfd47c112d894e9d424b57338c7e/plugins/motion/skills/motion) | Redistribution suspendue |
| frontend-a11y | MIT | [ef648e01899b](https://github.com/affaan-m/ECC/tree/ef648e01899ba3e8dc6371642deaaf64b4477775/skills/frontend-a11y) | Adapté V0.2, contrôle statique ; comportement à tester |
| humanizer | MIT | [225a6f39ac85](https://github.com/blader/humanizer/tree/225a6f39ac85f76ee48dbad772ea4abe4ed6c9d8) | Adapté V0.2, contrôle statique ; comportement à tester |
| diagram-design | MIT | [cb80b0d299a5](https://github.com/cathrynlavery/diagram-design/tree/cb80b0d299a5c0674e0d133d33f91f19af8cda0f/skills/diagram-design) | Adapté V0.2, contrôle statique ; comportement à tester |
| impeccable | Apache-2.0 | [ece38d9904b8](https://github.com/pbakaus/impeccable/tree/ece38d9904b8a619b3f77cab476eacad09c4fb11/.agents/skills/impeccable) | Adapté V0.2, contrôle statique ; comportement à tester |
| gpt-taste | MIT | [ce26fc25c0e5](https://github.com/Leonxlnx/taste-skill/tree/ce26fc25c0e5e8cab638f883de62d9a86ee5e45b/skills/gpt-tasteskill) | Adapté V0.2, contrôle statique ; comportement à tester |

## Entrées suspendues

- **vercel-react-best-practices** : MIT déclaré dans SKILL.md et README, mais aucun LICENSE/NOTICE de redistribution complet dans cette révision. Pas de copie distribuable préparée. Adaptations à réaliser : Restreindre React/Vite client ; désactiver les règles Next/RSC/server-only hors contexte. Lire les seules règles utiles ; optimisation fondée sur un problème ou une mesure.
- **vercel-composition-patterns** : Même absence de licence complète ; erreurs et formulations à corriger avant une adaptation distribuée. Adaptations à réaliser : Corriger Composer.Context et contrôler les exemples React 19. Ne pas imposer contexte, compound components ou suppression globale de useContext/forwardRef.
- **motion** : MIT annoncé dans la documentation et package.json, mais LICENSE/NOTICE complet absent à la révision. Redistribution suspendue. Adaptations à réaliser : Distribuer seulement best-practices gratuits, sans Motion+ ni MCP payant. Router React ou JavaScript/Blade selon le profil ; bibliothèques déjà choisies.

Ces entrées restent les choix validés au niveau produit. Leur source n’est pas copiée dans le dossier redistribuable. Ne pas inventer une notice MIT, présenter une déclaration courte comme un fichier de licence complet, ou remplacer silencieusement les skills retenus.

## Limites de couverture

Security Best Practices conserve ses langues JS/TS, Python et Go, et ses déclencheurs sécurité. Le catalogue ne lui attribue pas une expertise spécialisée absente. Les guides de profil couvrent les précautions spécifiques PHP, mobile et Electron. Security Threat Model conserve la validation des hypothèses utilisateur avant le rapport final. Aucun audit du projet utilisateur n’a été exécuté.

UI UX Pro Max contient des métadonnées de polices/icônes et des recommandations, sans embarquer de police ou SVG tiers. Les licences de ces futurs assets doivent être vérifiées séparément ; le MIT du skill ne les remplace pas.

Stop Design Slop conserve la méthode CLEAN et les principes de refonte sur demande sous une entrée courte et deux références adaptées. Le catalogue exhaustif, les exemples et les scores amont ne sont pas embarqués. Aucune dépendance exécutable ou API payante. Les critères web sont limités au web/renderer ; les contrôles natifs passent par les références Expo pertinentes. La licence MIT et les empreintes des sources utilisées sont conservées.

Les versions adaptées sont identifiées par `adaptationVersion: 1` dans `PROMETHEE-SOURCE.json`, la notice de modification et les empreintes du catalogue. Les différences avec l’amont, les ressources sources et les fichiers préparés sont consignés dans skills.lock.json. L'empreinte de l'arbre est le SHA-256 UTF-8 des lignes `chemin\0empreinte`, séparées par un saut de ligne, triées par chemin avec comparaison lexicale et séparateurs `/`.

## Complément V0.2

Cinq copies adaptées ajoutées : frontend-a11y, Humanizer, Diagram Design et GPT Taste sous MIT ; Impeccable sous Apache-2.0 avec NOTICE.md conservé. Révisions et licences complètes dans skills.lock.json. Références condensées/rédigées pour la portée Prométhée ; pas de scripts/exports/assets ou moteur non qualifiés. Ces adaptations ne prétendent pas proposer l'ensemble des fonctions amont.

Validation frontmatter et références locales consignée dans le rapport V0.2 ; essais réels Codex à faire. La licence du skill GPT Taste ne remplace pas la licence propre GSAP, gratuite pour les usages permis. Source consultée le 5 octobre 2026 : [licence GSAP](https://gsap.com/community/standard-license/). Version/lockfile éditorial restent ouverts.
