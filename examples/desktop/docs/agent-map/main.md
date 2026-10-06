# Processus principal

Responsabilité : Fenêtre, permissions et ressources système..

## Entrées et fichiers utiles

- `electron/main/index.ts`

## Dépendances et frontières

Aucun accès système libre depuis renderer ; valider émetteur et données des futurs IPC.

## Éléments réutilisables

Création de fenêtre avec sandbox et contextIsolation.

## Vérifications

- typecheck
- lint
- build
- essai Electron et permissions

Mettre à jour cette carte lorsque ces informations changent. Ne pas y recopier le contenu des fichiers ou le catalogue complet des composants.
