# Pont de contexte

Responsabilité : Expose les seules opérations nécessaires à l’interface..

## Entrées et fichiers utiles

- `electron/preload/index.ts`

## Dépendances et frontières

Pas d’exposition générale de ipcRenderer, du SQL ou du système de fichiers.

## Éléments réutilisables

Pont desktop.platform et types associés.

## Vérifications

- typecheck
- lint
- test contrat IPC si ajouté

Mettre à jour cette carte lorsque ces informations changent. Ne pas y recopier le contenu des fichiers ou le catalogue complet des composants.
