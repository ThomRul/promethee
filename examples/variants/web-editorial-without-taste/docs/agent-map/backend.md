# API et configuration des données

Responsabilité : Transport HTTP et préparation PostgreSQL, sans modèle métier..

## Entrées et fichiers utiles

- `backend/src/main.ts`
- `backend/src/app.module.ts`
- `backend/src/app.controller.ts`
- `backend/src/database/data-source.ts`
- `backend/.env.example`

## Dépendances et frontières

Validation globale ; services métier et intégration TypeORM à ajouter selon le périmètre. synchronize=false.

## Éléments réutilisables

AppModule, route technique /api/health et DataSource.

## Vérifications

- typecheck
- lint
- build
- test API utile
- migration si schéma modifié

Mettre à jour cette carte lorsque ces informations changent. Ne pas y recopier le contenu des fichiers ou le catalogue complet des composants.
