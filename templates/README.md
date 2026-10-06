# Gabarits V0.2

Les quatre squelettes techniques/lockfiles de V0.1 sont conservés. [Profils](profiles.json), [routage des skills](../catalogue/skill-routing.json), [manifeste](manifest.schema.json), [associations services](local-services.schema.json), [chemins outils](local-tools.schema.json).

Rendre les documents communs, cartes de zones réelles, guide du profil et guides communs. Les marqueurs inconnus ou non résolus arrêtent le rendu. Champs ajoutés : selected_skill_policy et animation_policy ; skill_routing_rows contient les seuls skills choisis. Ne pas recopier une référence à un skill désélectionné. AGENTS.md présente le pilote lorsqu'il est choisi, les critiques optionnelles sélectionnées et les règles d'animation réellement pertinentes.

La sélection explicite/désélection prime sur les présélections et suggestions des options. Valider profil, conditions et disponibilité avant copie. GPT Taste est lié à editorialAnimations web ; l'option technique reste non installable avant qualification GSAP. Options inactives mobiles : omettre androidTarget pour Expo Go.

Le manifeste V2 sépare version CLI, versions techniques, skills et état des étapes. Les aperçus utilisent cliVersion 0.2.0-preparation, skills pending et étapes planned : aucune installation réussie simulée. Adapter les noms/package names et lockfiles à un vrai projet lors de l'implémentation.

toolchain décrit les outils requis et leurs états ; databases décrit chaque base et son mode native/containerized/embedded/remote/undecided. Une base embarquée correspond à SQLite ; les autres moteurs ne reçoivent pas un service natif pour une base Docker ou distante. Le schéma JSON ne vérifie pas à lui seul ces relations : le moteur doit valider IDs uniques, compatibilité de sélection, transitions et références des étapes.

.promethee/local-services.json contient les associations machine, sans mot de passe ni commande arbitraire. .promethee/local-tools.json contient chemins effectifs/version, exclus de Git. Les fichiers locaux sont validés avant usage : contrôler projet, mode actuel, adapter autorisé, ID réel du service et executablePath. Les schémas ne constituent pas une autorisation d'exécuter une entrée modifiée.

Le plan [bootstrap](../catalogue/bootstrap-plan.json) est déclaratif, pas une recette exécutable. Toutes les exigences sélectionnées sont contrôlées avant installation ; incompatibilité ou détection impossible arrêtent le parcours. Services nouveaux à la demande, instances existantes préservées, Docker/WSL non installés et Docker non piloté par le menu services.

Les guides options existants restent utilisables dans leur contexte ; [animations](options/animations.md) distingue les deux choix. Qualifier dépendances/options avant de présenter un projet prêt. Les preuves antérieures et qualifications natives restantes sont dans [validation](../validation/RESULTATS.md).
