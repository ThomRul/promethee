# Repères React et API

Un dépôt, `frontend/` et `backend/`. Les dossiers ne constituent pas des packages de workspace imposés. Les routes/pages React restent minces ; composants, accès API et logique d'une fonctionnalité restent proches. Partager ce qui est effectivement réutilisé. Nest sépare contrôleurs HTTP, services métier et persistance.

Avant une nouvelle interface, vérifier composants shadcn déjà présents, variantes et tokens CSS. Respecter le brief avec UI UX Pro Max. Une optimisation React doit répondre à un problème ou une mesure ; une règle Next.js serveur ne s'applique pas automatiquement à Vite.

L'API initiale expose seulement `/api/health`. Son `DataSource` prépare PostgreSQL mais n'est pas initialisé par le module applicatif : activer l'intégration quand le modèle de données est défini. Créer des migrations pour le schéma retenu et conserver `synchronize=false`. Ne pas ajouter repositories, CQRS ou couches DDD sans besoin réel.

Les DTO valident les entrées ; les services et gardes contrôlent autorisations et invariants selon la fonctionnalité. Les requêtes sont paramétrées. Les transactions, index et tailles de pool répondent au besoin réel. Ne pas imposer RLS ou PgBouncer par la seule présence du skill PostgreSQL.

Le backend écoute par défaut sur `127.0.0.1` ; le proxy Vite sert le développement local. Adapter exposition, CORS, TLS et URL selon le déploiement. Aucun secret dans le bundle client ou dans une variable Vite publique. L'absence d'authentification initiale exige de définir les autorisations avant d'ajouter une route privée.

Après copie de `.env.example` vers `.env`, lancer une première compilation backend. En développement, `npm run dev` compile en continu et `npm run dev:server` lance le serveur compilé dans un autre terminal. Les tests Nest utilisent Vitest/SWC avec métadonnées de décorateurs. Les cartes distinguent UI, HTTP/métier et données lorsque le code correspondant existe.

[Base Nest](https://docs.nestjs.com/techniques/database) · [Validation](https://docs.nestjs.com/techniques/validation) · [Sécurité Express](https://expressjs.com/en/advanced/best-practice-security.html)
