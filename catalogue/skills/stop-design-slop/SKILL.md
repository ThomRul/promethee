---
name: stop-design-slop
description: Auditer et corriger les artefacts et contenus génériques d'une interface existante lorsque son rendu est jugé généré par IA, ou lorsqu'un audit anti-slop est demandé. Préserver sa direction visuelle ; utiliser les références natives du projet pour les contrôles spécifiques au mobile.
---

<!-- Adapté par Prométhée le 2026-10-05 ; provenance et modifications : NOTICE.promethee. -->

# Audit anti-slop ciblé

Adaptation Prométhée de la méthode CLEAN de Juuzoe. Lire le brief et les conventions de la zone touchée. Distinguer défaut fonctionnel, contenu trompeur, décoration intentionnelle et décision de direction artistique. Un style courant constitue un indice à examiner, pas une preuve d'origine IA ou un défaut à supprimer.

## Choisir la portée

- Audit seul : observer et rapporter, sans modifier de fichiers.
- Correction demandée : CLEAN sur les pages ou composants concernés. Préserver typographie, palette, échelle des tokens et structure ; corriger localement un défaut d'accessibilité sans étendre la refonte.
- Refonte explicitement demandée : reprendre le brief et la direction choisie, puis [la méthode de refonte](references/direction.md). Cette demande peut aussi être formulée en langage naturel ; aucun mot-clé n'est obligatoire.

Pour CLEAN, lire [les contrôles ciblés](references/clean.md). Examiner le rendu si les outils le permettent et les composants/états concernés. Avec le seul code, préciser les vérifications visuelles ou interactives manquantes.

Corriger les artefacts réellement constatés et les faux contenus. Préserver faits, promesses, limites et ton validés. Demander les faits manquants utiles au lieu d'inventer une preuve commerciale. Retirer un contrôle ou un effet seulement en préservant la fonction qu'il remplissait et les choix explicites de l'utilisateur.

Vérifier le diff, les interactions et l'accessibilité touchées. Rapporter constats, corrections, éléments conservés et limites. Les suggestions de refonte restent des suggestions tant que la demande ne les autorise pas.

## Portée de l'adaptation

Entrée courte et deux références adaptées, sans chargement intégral du catalogue amont, score obligatoire, outil imposé, service tiers ou script téléchargé. Les contrôles HTML/CSS et métadonnées concernent le web et le renderer Electron. Sur React Native, limiter ces critères à leur équivalent pertinent et utiliser le guide mobile ainsi que les skills natifs sélectionnés.
