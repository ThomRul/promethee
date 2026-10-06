# Interface React

Responsabilité : Affichage React et tokens..

## Entrées et fichiers utiles

- `src/App.tsx`
- `src/main.tsx`
- `src/styles.css`
- `src/lib/utils.ts`
- `index.html`
- `components.json`

## Dépendances et frontières

Pas de Node dans renderer ; appels système uniquement par le pont défini. CSP à adapter au produit empaqueté.

## Éléments réutilisables

Tokens CSS et cn() ; composants UI existants.

## Vérifications

- typecheck
- lint
- build
- test interaction utile

Mettre à jour cette carte lorsque ces informations changent. Ne pas y recopier le contenu des fichiers ou le catalogue complet des composants.
