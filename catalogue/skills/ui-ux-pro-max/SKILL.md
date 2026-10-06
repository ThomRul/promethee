---
name: ui-ux-pro-max
description: "Choisir ou améliorer une interface web, desktop ou mobile : direction visuelle, accessibilité, composants et tokens. Recherche locale ciblée ; respecter le brief et le système existant."
license: MIT
metadata:
  promethee-adaptation: "1"
  upstream-version: "unversioned"
---

<!-- Adapté par Prométhée le 2026-10-05 ; provenance et modifications : NOTICE.promethee. -->

# UI UX Pro Max pour Codex

Identifier la stack et le système visuel du projet. Réutiliser ses composants et tokens avant de créer une variante ou une nouvelle pièce. Pour une petite correction, conserver la direction validée ; pour une nouvelle direction globale, établir une proposition adaptée au produit, à ses utilisateurs et à ses contenus.

## Recherche locale

Le script appartient à ce dossier de skill. Résoudre son chemin absolu depuis le SKILL.md chargé, puis exécuter :

`python "<skill-directory>/scripts/search.py" "<2 à 5 termes utiles>" --domain ux`

Essayer python3 ou py -3 selon l’environnement. Python 3 et sa bibliothèque standard suffisent. Choisir un domaine (ux, color, typography, product, icons…) ou la stack pertinente (react, shadcn, laravel, react-native). Une seule intention par recherche ; réessayer une fois en précisant si le résultat ne correspond pas. Vérifier son applicabilité avant de l’utiliser.

La recherche ne persiste rien par défaut. Pour une direction nouvelle, --design-system peut aider ; garder les décisions dans la référence visuelle actuelle du projet. Ne pas utiliser --persist ou --force implicitement. Ne pas passer de données privées dans une recherche ou un fichier de recommandation.

## Qualité visuelle

Ancrer les choix dans les usages, contenus et conventions de plateforme. Éviter blocs de démonstration interchangeables, décorations répétées, gradients et animations sans fonction. Respecter contraste, focus visible, clavier web, libellés et états utiles. CSS personnalisé permis dans les conventions du projet. Les recommandations de la base sont des pistes à vérifier, pas des obligations universelles.

## Références ciblées

- [Guide pratique](references/quick-reference.md) : consulter uniquement la rubrique liée au problème.
- [Règles de finition](references/pro-rules.md) : revue visuelle, app, accessibilité.
- Les données et métadonnées locales restent dans data/. Aucun fichier de police ou d’icône tiers n’est livré. Préférer les assets déjà disponibles et vérifier leurs licences si de nouveaux assets sont ajoutés.

Ne pas ajouter GSAP, une police payante, un service de génération ou un outil externe pour appliquer une recommandation. Les animations avancées suivent l’option et les dépendances du projet.
