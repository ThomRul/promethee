---
name: expo-animation
description: "Concevoir ou diagnostiquer une animation avancée Expo avec les versions Reanimated compatibles du projet ; accessibilité, interruption et performance."
license: MIT
metadata:
  promethee-adaptation: "1"
  upstream-version: "1.0.0"
---

<!-- Adapté par Prométhée le 2026-10-05 ; provenance et modifications : NOTICE.promethee. -->

# expo-animation pour le profil mobile

Le profil est Expo SDK 57 avec NativeWind 4 et Tailwind 3. Lire le guide de profil et l’existant avant de choisir un mécanisme. Garder les routes dans src/app et le code métier hors des routes. Réutiliser tokens, composants et dépendances ; aucune bibliothèque supplémentaire par simple préférence.

Choisir seulement le chapitre ou la référence liée à la tâche :

- [Operating Posture](references/guide-operating-posture.md)
- [Hard Rules](references/guide-hard-rules.md)
- [The Build Sequence](references/guide-the-build-sequence.md)
- [Setup that silently breaks motion](references/guide-setup-that-silently-breaks-motion.md)
- [120fps](references/guide-120fps.md)
- [Recipes](references/guide-recipes.md)
- [Never Ship](references/guide-never-ship.md)
- [Output](references/guide-output.md)
- [Tone](references/guide-tone.md)

Les autres références du dossier couvrent des APIs ciblées et sont chargées au besoin. Vérifier la compatibilité SDK, OS et appareil avant d’utiliser une API native. Les exemples de styles inline restent des exemples ; NativeWind demeure le système choisi. Les options data-fetching et animation ne sont requises que si installées. Aucun chargement de skill absent, envoi de feedback automatique ou service payant.

Préférer les interactions simples. Animations avancées : objectif utile, reduced motion, interruption et performances ; vérifier sur les appareils disponibles et indiquer les limites sans prétendre avoir testé ailleurs.
