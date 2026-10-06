---
name: systematic-debugging
description: "Diagnostiquer un bug observé, un test en échec ou un comportement inattendu : reproduction, cause probable et expérience ciblée avant correction."
license: MIT
metadata:
  promethee-adaptation: "1"
  upstream-version: "unversioned"
---

<!-- Adapté par Prométhée le 2026-10-05 ; provenance et modifications : NOTICE.promethee. -->

# Débogage ciblé

Reproduire le symptôme ou réunir les observations nécessaires. Lire l’erreur complète, les changements récents et la carte de la zone ; suivre la donnée jusqu’à la frontière où elle devient incorrecte.

Formuler une hypothèse précise et la tester par la plus petite expérience utile. Corriger la cause démontrée ou la cause la mieux étayée en indiquant l’incertitude. Ajouter une régression lorsque son intérêt le justifie, puis vérifier le comportement d’origine et les effets proches.

Après trois tentatives infructueuses, revoir hypothèses, reproduction et frontières. Ce nombre ne démontre pas un défaut d’architecture et n’autorise pas une refonte.

Les diagnostics utilisent les outils présents sur la plateforme et ne révèlent pas secrets, tokens ou valeurs d’environnement sensibles. Instrumenter seulement la zone utile et retirer les traces provisoires. Aucun outil Bash, skill TDD ou agent supplémentaire obligatoire.

Références si nécessaire : [retracer une cause](references/root-cause-tracing.md), [prévenir une récidive](references/defense-in-depth.md), [attendre une condition](references/condition-based-waiting.md).
