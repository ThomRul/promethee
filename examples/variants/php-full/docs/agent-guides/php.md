# Repères Laravel sur hébergement PHP

Conserver MVC et la structure Laravel. Blade affiche, les contrôleurs orchestrent HTTP, Eloquent persiste. Extraire action/service lorsqu'une responsabilité, réutilisation ou règle métier le justifie ; éviter un repository générique recouvrant tout Eloquent.

Le socle prépare MySQL, une page Blade et des assets Tailwind/Alpine. Il ne crée ni utilisateurs, ni authentification, ni schéma métier. Les sessions, cache et file d'attente utilisent les modes locaux simples ; décider d'un autre mode quand le projet en a besoin.

Échapper l'affichage Blade, utiliser CSRF pour les formulaires, valider les entrées et contrôler policies/gates selon le cas. Définir explicitement les champs modifiables des modèles. Vérifier uploads, chemin de stockage et accès public si ces fonctionnalités sont ajoutées. Les requêtes SQL brutes restent paramétrées. Secrets hors Git ; `APP_DEBUG=false` en production.

Livewire est optionnel. Lorsqu'il est choisi, utiliser son Alpine intégré et retirer l'import/démarrage autonome de `resources/js/app.js`. Les propriétés/actions venant du navigateur ne prouvent pas une autorisation : valider et autoriser côté serveur.

L'agent vérifie PHP 8.3 minimum, extensions Laravel et PDO du serveur choisi, Composer si exécuté sur l'hôte, version effective de MySQL/MariaDB, racine web dirigée vers `public/`, réécriture des URL et droits d'écriture de `storage/` et `bootstrap/cache/`. Préparer ces dossiers s'ils n'existent pas. Construire les assets avant déploiement ; Node ne doit pas devenir un daemon requis sur l'hébergement PHP.

Copier `.env.example`, renseigner l'environnement, générer la clé applicative. Choisir cron, tâches synchrones ou worker seulement selon les possibilités réelles de l'hôte et le besoin. Tester sauvegarde, migrations et restauration avant mise en production. Aucun plan Hostinger particulier n'est supposé compatible sans vérification.

`composer lint` lance Pint ; `composer test` utilise directement PHPUnit. La suite est configurée mais ne contient pas de tests métier initiaux. Ajouter les tests utiles aux fonctionnalités développées.

[Déploiement Laravel](https://laravel.com/framework/docs/13.x/deployment) · [Validation](https://laravel.com/framework/docs/13.x/validation) · [Autorisation](https://laravel.com/framework/docs/13.x/authorization) · [Livewire](https://livewire.laravel.com/docs/4.x/installation)
