---
name: supabase-postgres-best-practices
description: "Concevoir ou modifier un schéma PostgreSQL, une migration, un index ou une requête, ou diagnostiquer un problème de requêtes, verrous ou connexions."
license: MIT
metadata:
  promethee-adaptation: "1"
  upstream-version: "1.1.1"
---

<!-- Adapté par Prométhée le 2026-10-05 ; provenance et modifications : NOTICE.promethee. -->

# PostgreSQL

Utiliser PostgreSQL directement via les conventions TypeORM du projet ; aucun compte Supabase requis. Lire uniquement les règles pertinentes dans references/ : query-* pour requêtes/index, schema-* pour schéma, lock-* pour transactions/verrous, conn-* pour connexions, security-* pour accès. [Index des thèmes](references/_sections.md).

Vérifier les hypothèses sur la base réelle et la version. Migrations versionnées, synchronize désactivé en production, autorisations explicites, transactions lorsqu’une opération doit être atomique. Le pool du driver suffit au départ ; ajouter pooler, RLS ou extension seulement si le besoin le justifie. Les chiffres des exemples illustrent des situations, pas une capacité garantie.
