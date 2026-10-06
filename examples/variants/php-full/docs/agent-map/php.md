# Routes et application Laravel

Responsabilité : HTTP, configuration et services Laravel ; modèle métier à définir..

## Entrées et fichiers utiles

- `routes/web.php`
- `bootstrap/app.php`
- `app/Providers/AppServiceProvider.php`
- `app/Http/Controllers/Controller.php`
- `config/database.php`
- `.env.example`

## Dépendances et frontières

Blade assure l’affichage ; Eloquent assure la persistance. Validation et autorisation côté serveur.

## Éléments réutilisables

Conventions Laravel et configuration native. Pas de repository générique imposé.

## Vérifications

- composer lint
- composer test si tests présents
- migration si schéma modifié

Mettre à jour cette carte lorsque ces informations changent. Ne pas y recopier le contenu des fichiers ou le catalogue complet des composants.
