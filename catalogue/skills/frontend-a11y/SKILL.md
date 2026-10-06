---
name: frontend-a11y
description: Build or review accessible web interactions in React, Laravel Blade or Electron renderer. Use for forms, dialogs, menus, tabs, keyboard focus or accessibility findings; native React Native screens use their native references.
license: MIT
---

<!-- Adaptation Prométhée V0.2 ; modifications et provenance : NOTICE.promethee. -->

# Accessibilité des interactions web

Reprendre les composants accessibles et leurs variantes déjà présents. Choisir les éléments HTML sémantiques et conserver un nom accessible cohérent avec le libellé visible. Les conventions React et Blade diffèrent ; adapter les attributs à la vue réellement utilisée.

Pour une interaction complexe, lire [la référence interactions](references/interactions.md). Une modale ou une combobox exige un comportement complet : ne pas reconstruire ce contrat à partir d'un exemple partiel.

Vérifier les comportements touchés : parcours Tab/Shift+Tab, activation clavier, focus visible et restauration, noms et états annoncés, erreurs reliées aux champs, contenu à différents zooms et réduction des mouvements. Les outils automatiques apportent des constats, sans prouver seuls le fonctionnement au clavier ou au lecteur d'écran.

Rendre les défauts observés, leurs impacts et les limites des essais. Audit demandé seul : constats sans correction implicite. Garder les décisions de design qui ne compromettent pas l'usage ; signaler les conflits concrets plutôt que proposer une refonte.
