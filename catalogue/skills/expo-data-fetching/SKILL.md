---
name: expo-data-fetching
description: "Implémenter ou diagnostiquer accès API, chargement, erreur, annulation et cache dans Expo. Offline et synchronisation seulement selon le besoin."
license: MIT
metadata:
  promethee-adaptation: "1"
  upstream-version: "1.0.0"
---

<!-- Adapté par Prométhée le 2026-10-05 ; provenance et modifications : NOTICE.promethee. -->

# expo-data-fetching pour le profil mobile

Le profil est Expo SDK 57 avec NativeWind 4 et Tailwind 3. Lire le guide de profil et l’existant avant de choisir un mécanisme. Garder les routes dans src/app et le code métier hors des routes. Réutiliser tokens, composants et dépendances ; aucune bibliothèque supplémentaire par simple préférence.

Choisir seulement le chapitre ou la référence liée à la tâche :

- [When to Use](references/guide-when-to-use.md)
- [Preferences](references/guide-preferences.md)
- [Every Screen Has Four States](references/guide-every-screen-has-four-states.md)
- [Common Issues & Solutions](references/guide-common-issues-solutions.md)
- [Decision Tree](references/guide-decision-tree.md)
- [Common Mistakes](references/guide-common-mistakes.md)
- [Example Invocations](references/guide-example-invocations.md)

Les autres références du dossier couvrent des APIs ciblées et sont chargées au besoin. Vérifier la compatibilité SDK, OS et appareil avant d’utiliser une API native. Les exemples de styles inline restent des exemples ; NativeWind demeure le système choisi. Les options data-fetching et animation ne sont requises que si installées. Aucun chargement de skill absent, envoi de feedback automatique ou service payant.

Préférer les interactions simples. Animations avancées : objectif utile, reduced motion, interruption et performances ; vérifier sur les appareils disponibles et indiquer les limites sans prétendre avoir testé ailleurs.
