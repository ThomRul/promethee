---
name: diagram-design
description: Create a requested architecture, process, sequence, state or data-model diagram from verified project information. Use for documentation and explanation; it does not generate the agent context map or redesign the app.
license: MIT
metadata:
  upstream-version: "2.6"
---

<!-- Adaptation Prométhée V0.2 ; modifications et provenance : NOTICE.promethee. -->

# Diagrammes utiles au projet

Choisir la question à rendre visible et vérifier ses composants, relations et frontières dans les sources pertinentes. Distinguer état réel et proposition. Une liste ou une relation simple peut rester du texte ou un tableau.

Lire [types et composition](references/diagrams.md) pour le diagramme concerné. Reprendre les tokens disponibles et une typographie locale ou système. Un diagramme ne demande ni nouveau design system ni onboarding global. Pas d'icônes, polices ou images tierces ajoutées automatiquement.

Choisir Mermaid pour un petit diagramme technique ; HTML/SVG autonome lorsque la mise en page ou l'export l'exige. Préserver la sémantique d'un import ; ne pas prétendre fournir les 44 types, importeurs et exporteurs du dépôt amont, absents de cette adaptation.

Vérifier labels, direction des flèches, multiplicité et frontières, puis lisibilité, chevauchements et texte équivalent. Séparer ou résumer lorsque la densité empêche la lecture. Un export ou rendu non exécuté reste annoncé comme non vérifié.
