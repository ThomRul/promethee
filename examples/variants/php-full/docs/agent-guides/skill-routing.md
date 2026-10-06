# Choisir les skills selon la tâche

Cette matrice concerne les skills sélectionnés pour ce projet. Leur installation les rend disponibles ; elle n'impose pas leur lecture pour chaque demande. Consulter aussi [les zones](../agent-map/ROUTING.md) pour trouver les fichiers utiles.

| Skill installé | Quand l'utiliser | Limite de portée |
| --- | --- | --- |
| `ui-ux-pro-max` | Conception ou décision visuelle nécessitant des références | Tokens/brief existants ; aucune refonte pour un ajout local |
| `stop-design-slop` | Audit demandé ou correction d’un rendu jugé générique | CLEAN conserve la direction ; audit seul sans écriture ; pas de cascade |
| `verification-before-completion` | Conclure une unité de travail avec les preuves utiles | Réutiliser les résultats valables ; pas de suite complète à chaque message |
| `systematic-debugging` | Bug reproduit dont la cause reste à établir | Zones concernées ; aucune refonte ou architecture imposée |
| `laravel-best-practices` | Route, validation, métier ou données Laravel concernés | MVC natif ; abstraction justifiée par le besoin |
| `humanizer` | Rédaction ou révision de prose UI/documentation concernée | Faits, voix, liens et placeholders conservés ; pas de réécriture de code |
| `frontend-a11y` | Formulaire, dialogue, clavier/focus ou défaut d’accessibilité web | Réutiliser les primitives ; DOM ne qualifie pas React Native |
| `impeccable` | Critique de hiérarchie, parcours ou composition d’une interface existante | Variante web/native ; pas de nouveau moteur ni de refonte implicite |
| `diagram-design` | Architecture, flux, séquence, états ou données à expliquer visuellement | Périmètre réduit ; ne remplace pas les cartes de contexte |
| `security-threat-model` | Modèle de menaces explicitement demandé | Valider les hypothèses et frontières ; aucun envoi de code |
| `gpt-taste` | Composition ou séquence éditoriale explicitement choisie | GSAP qualifié uniquement ; pas de faux script, animation universelle ou fonction native |
| `livewire-development` | Composant ou interaction Livewire concernés | Une seule instance Alpine ; option et stack sélectionnées |

## Skills sélectionnés

Skills disponibles : `ui-ux-pro-max`, `stop-design-slop`, `verification-before-completion`, `systematic-debugging`, `laravel-best-practices`, `humanizer`, `frontend-a11y`, `impeccable`, `diagram-design`, `security-threat-model`, `gpt-taste`, `livewire-development`.

UI UX Pro Max est le pilote visuel lorsqu’une décision de conception le justifie.

Impeccable est sélectionné pour une critique UI ciblée ; choisir sa référence web ou native selon la zone.

Humanizer concerne la prose et protège faits, voix et tokens ; il ne réécrit pas le code.

La disponibilité ne déclenche pas une lecture générale ; choisir le spécialiste utile à la demande.

## Animation choisie

Animations UI : Motion dans la zone frontend/Blade/renderer.

Éditorial web sélectionné pour cet aperçu : GSAP reste à qualifier avant installation réelle. GPT Taste accompagne seulement les séquences éditoriales choisies.

Motion et GSAP possèdent des animations distinctes ; aucun pilotage concurrent de la même propriété du même élément.

Préserver contenu statique, contrôle clavier et reduced motion ; ne pas animer tous les contrôles par défaut.

## Arbitrage

Déterminer le résultat demandé : créer, modifier, diagnostiquer, auditer ou rédiger. Reprendre l'existant et le brief. Pour la conception visuelle, garder un seul pilote et une seule direction par tâche. Les spécialistes traitent leur domaine sans remplacer les décisions du pilote, sauf défaut de fonctionnement, de sécurité ou d'accessibilité à résoudre.

Un skill explicitement demandé s'applique à la portée autorisée. Si ses prescriptions contredisent le besoin, la stack ou les décisions du projet, appliquer les contraintes du projet et signaler le conflit concret. Ne pas réintroduire une fonctionnalité payante, une animation désactivée ou une dépendance absente par effet de bord.

Une petite modification ne lance pas tous les audits. Charger un spécialiste quand le comportement concerné le justifie : gestion de focus pour une modale, reduced motion pour une animation, langage naturel pour une réécriture, autorisations pour une opération sensible. Lire seulement la référence utile, puis réutiliser les décisions et preuves encore valables.

Un audit seul produit des constats. Une correction applique les changements autorisés. Une refonte doit être demandée et conserve les faits et fonctions du produit. Éviter deux réécritures concurrentes : si une révision éditoriale spécialisée est utilisée, l'audit vérifie ensuite les faits et le rendu sans recommencer la rédaction.

Une modification backend ou système n'appelle pas de directeur artistique. Les contrôles web ne prouvent pas l'accessibilité native. Si un skill est désélectionné, utiliser les règles et outils du profil sans imposer son installation. Les descriptions des skills doivent refléter cette matrice ; ce document seul ne rend pas un déclencheur trop large fiable.

Une critique UI cible le frontend React, les vues Blade, le renderer Electron ou les écrans mobiles selon le profil. Choisir les références web ou natives correspondantes ; conserver les conventions Expo/NativeWind sur mobile. Les processus Electron main/preload, les services API et les données restent du ressort des spécialistes techniques. Le critique apporte des constats ciblés sans remplacer le pilote visuel, ajouter un moteur ou lancer une refonte implicite.
