---
name: expo-router
description: "Modifier routes, navigation, liens, stacks et modales Expo Router ; consulter uniquement les références de la navigation concernée."
license: MIT
metadata:
  promethee-adaptation: "1"
  upstream-version: "1.0.1"
---

<!-- Adapté par Prométhée le 2026-10-05 ; provenance et modifications : NOTICE.promethee. -->

# expo-router pour le profil mobile

Le profil est Expo SDK 57 avec NativeWind 4 et Tailwind 3. Lire le guide de profil et l’existant avant de choisir un mécanisme. Garder les routes dans src/app et le code métier hors des routes. Réutiliser tokens, composants et dépendances ; aucune bibliothèque supplémentaire par simple préférence.

Choisir seulement le chapitre ou la référence liée à la tâche :

- [Code Style](references/guide-code-style.md)
- [Routes](references/guide-routes.md)
- [Library Preferences](references/guide-library-preferences.md)
- [Behavior](references/guide-behavior.md)
- [Link](references/guide-link.md)
- [Stack](references/guide-stack.md)
- [Context Menus](references/guide-context-menus.md)
- [Link Previews](references/guide-link-previews.md)
- [Modal](references/guide-modal.md)
- [Sheet](references/guide-sheet.md)
- [Common route structure](references/guide-common-route-structure.md)

Les autres références du dossier couvrent des APIs ciblées et sont chargées au besoin. Vérifier la compatibilité SDK, OS et appareil avant d’utiliser une API native. Les exemples de styles inline restent des exemples ; NativeWind demeure le système choisi. Les options data-fetching et animation ne sont requises que si installées. Aucun chargement de skill absent, envoi de feedback automatique ou service payant.

Préférer les interactions simples. Animations avancées : objectif utile, reduced motion, interruption et performances ; vérifier sur les appareils disponibles et indiquer les limites sans prétendre avoir testé ailleurs.
