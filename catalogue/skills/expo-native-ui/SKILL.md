---
name: expo-native-ui
description: "Construire ou revoir une interface Expo accessible et adaptée à iOS/Android, en réutilisant les contrôles et NativeWind du projet."
license: MIT
metadata:
  promethee-adaptation: "1"
  upstream-version: "1.1.1"
---

<!-- Adapté par Prométhée le 2026-10-05 ; provenance et modifications : NOTICE.promethee. -->

# expo-native-ui pour le profil mobile

Le profil est Expo SDK 57 avec NativeWind 4 et Tailwind 3. Lire le guide de profil et l’existant avant de choisir un mécanisme. Garder les routes dans src/app et le code métier hors des routes. Réutiliser tokens, composants et dépendances ; aucune bibliothèque supplémentaire par simple préférence.

Choisir seulement le chapitre ou la référence liée à la tâche :

- [Running the App](references/guide-running-the-app.md)
- [Code Style](references/guide-code-style.md)
- [Library Preferences](references/guide-library-preferences.md)
- [Responsiveness](references/guide-responsiveness.md)
- [Behavior](references/guide-behavior.md)
- [General Styling Rules](references/guide-general-styling-rules.md)
- [Colors](references/guide-colors.md)
- [Text Styling](references/guide-text-styling.md)
- [Shadows](references/guide-shadows.md)

Les autres références du dossier couvrent des APIs ciblées et sont chargées au besoin. Vérifier la compatibilité SDK, OS et appareil avant d’utiliser une API native. Les exemples de styles inline restent des exemples ; NativeWind demeure le système choisi. Les options data-fetching et animation ne sont requises que si installées. Aucun chargement de skill absent, envoi de feedback automatique ou service payant.

Préférer les interactions simples. Animations avancées : objectif utile, reduced motion, interruption et performances ; vérifier sur les appareils disponibles et indiquer les limites sans prétendre avoir testé ailleurs.
