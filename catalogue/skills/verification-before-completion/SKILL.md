---
name: verification-before-completion
description: "Vérifier les résultats avant d’annoncer une tâche terminée ou de créer un commit. Choisir des contrôles proportionnés et réutiliser les preuves encore valables."
license: MIT
metadata:
  promethee-adaptation: "1"
  upstream-version: "unversioned"
---

<!-- Adapté par Prométhée le 2026-10-05 ; provenance et modifications : NOTICE.promethee. -->

# Vérifier avant de conclure

Relier chaque affirmation à une preuve dont la portée couvre le changement.

1. Déterminer les vérifications utiles : comportement modifié, test de régression, types, analyse, build ou revue selon l’impact.
2. Réutiliser un résultat s’il porte toujours sur le même code, ses dépendances et sa configuration, et si aucun changement ne l’invalide. Sinon relancer le contrôle nécessaire.
3. Lire sortie et code de retour. Un lint ne prouve pas un build ; une compilation ne prouve pas un comportement ; une suite absente ne prouve pas que les tests passent.
4. Vérifier les exigences importantes et le diff, y compris les documents/cartes affectés.
5. Résumer ce qui est établi, ce qui échoue et ce qui reste non vérifié.

Commencer par les contrôles ciblés ; élargir lorsque les frontières du changement le demandent. Ne pas relancer toute une suite pour chaque message ou chaque correction documentaire. Pas de taux de couverture imposé. Une régression importante doit être reproduite avant le correctif quand c’est possible, puis vérifiée après.
