# Versions retenues

Sélection vérifiée auprès des registres npm, Packagist et des dépôts officiels le 4 octobre 2026, puis contrôlée localement jusqu'au 5 octobre. Les versions directes sont exactes ; les dépendances transitives sont figées dans les lockfiles des gabarits. `catalogue/frameworks.lock.json` conserve les intégrités npm, contraintes de runtime et dépendances peer.

## Matrice

| Bloc | Versions de référence | Choix de compatibilité |
| --- | --- | --- |
| CLI à développer | Node 24.21.0 LTS, npm 11.19.0, TypeScript 5.9.3, Clack 1.8.1 | ZIP Windows / tar.gz Ubuntu avec runtime Node privé du CLI ; lanceurs et redistribution à qualifier, aucun CLI implémenté |
| Web | React/React DOM 19.3.0, Vite 8.3.2, plugin React 6.1.1 | Types, analyse, build et rendu du gabarit contrôlés |
| API | NestJS 12.1.2, intégration TypeORM 12.0.2, TypeORM 1.1.1, pg 8.23.1 | Décorateurs historiques et métadonnées activés ; démarrage HTTP contrôlé |
| UI web/desktop/PHP | Tailwind 4.3.3 ; configuration shadcn/ui pour React | Génération shadcn 4.21.1 retenue ; composants ajoutés selon le besoin, pas de pack métier |
| Desktop | Electron 44.5.1, electron-vite 5.0.0, Vite 7.3.6, plugin React 5.2.0 | electron-vite stable impose Vite 5/6/7 ; ne pas lui appliquer Vite 8 |
| PHP | PHP minimum 8.3, référence 8.4.26 ; Composer 2.10.3 ; Laravel 13.34.0 | Résolution Composer avec `platform.php=8.3.0` pour conserver le minimum annoncé |
| Assets PHP | Vite 8.3.2, laravel-vite-plugin 3.2.0, Alpine 3.17.4 | Assets construits en amont d'un déploiement mutualisé |
| Livewire optionnel | 4.4.7 | Retirer l'import Alpine autonome ; vérifier l'intégration dans le navigateur |
| Mobile | Expo 57.0.26, Router 57.0.24, React/React DOM 19.2.3, React Native 0.86.3 | Matrice du SDK, sans sélectionner séparément les versions natives latest |
| Styles mobile | NativeWind 4.2.7, Tailwind 3.4.19, CSS Interop 0.2.7 | NativeWind stable conserve Tailwind 3 ; configuration Babel/Metro préparée |
| Animation mobile | Reanimated 4.5.1, Worklets 0.10.1 ; Gesture Handler 2.32.0 en option | Reanimated/Worklets nécessaires au socle NativeWind ; leur présence n'active pas des animations avancées |
| Tests mobile | Jest 29.7.0, jest-expo 57.0.5, RNTL 14.0.1, test-renderer 1.2.0 | Le renderer 1.2 correspond à React 19.2 ; Babel 7.29.7 et preset Expo 57.0.13 |
| Animation web/PHP | Motion 14.0.0 | Bibliothèque gratuite ; redistribution du skill AI Kit suspendue séparément |
| SQLite desktop | TypeORM 1.1.1, better-sqlite3 12.11.1, @electron/rebuild 4.2.0 | TypeORM demande better-sqlite3 12 ; rebuild et essai ABI Electron encore nécessaires |
| SQLite mobile | expo-sqlite 57.0.3 | Version du SDK ; test sur appareil encore nécessaire |

TypeScript 5.9.3 est commun aux profils TypeScript : la version 7 récente n'entre pas dans la plage déclarée de typescript-eslint retenu. Les grands sauts de version feront l'objet d'une qualification de catalogue, avec tests, plutôt que d'une substitution automatique.

Branches de référence : PostgreSQL 18 (référence 18.6), MySQL 8.4 LTS ; MariaDB selon la version maintenue réellement offerte par l'hébergeur. Prométhée devra fournir un moteur local lorsque le profil l'exige et qu'aucune instance compatible choisie n'est disponible. Les installateurs et modes de service restent à qualifier séparément ; ne pas remplacer un serveur existant pour atteindre une référence. Enregistrer la version effective. Une future décision Docker devra fixer image et digest ; le CLI n'installe pas Docker.

Le [contrat de bootstrap](BOOTSTRAP.md) exige aussi les interpréteurs des skills choisis, l'accès durable aux outils pour Codex et une distribution utilisable sans Node préinstallé. Le lock de frameworks ne qualifie pas encore les archives système, Python, Git, PHP/extensions par distribution, bases locales, JDK/SDK Android ou le packaging autonome. Un lock de bootstrap par OS/architecture doit être préparé avant publication. Ne pas présenter les versions de test portables comme des recettes système déjà validées.

Ce lock devra distinguer version de référence pour installer un outil absent et exigences de compatibilité pour réutiliser un outil présent. Une version effective hors de ces exigences arrête le parcours avant installation/création ; aucune mise à jour ou version parallèle automatique. Le diagnostic donne la version détectée et la version/plage à installer ou activer avant relance. Les archives conservées dans le cache sont vérifiées par version, OS/architecture et intégrité avant réutilisation.

Le runtime Node privé du CLI est une ressource de sa distribution, avec intégrité/licences à qualifier séparément. Sa présence ne remplace pas la détection de Node/npm du projet : réutiliser la version habituelle compatible, installer les outils absents et bloquer sur une version incompatible. Les archives retenues ne nécessitent pas un exécutable SEA pour le MVP.

Bases hôtes retenues : Windows 11 encore maintenu et Ubuntu 24.04 LTS, x64 uniquement. Qualifier distributions et outils pour `win32-x64` et `linux-x64`, en enregistrant les builds/mises à jour réellement testés. Ubuntu sous WSL déjà installé fait partie de la recette ; Prométhée n'installe pas WSL. Aucun support ARM ou autre version d'OS annoncé avant qualification. Les cibles mobiles et binaires applicatifs ont leur propre qualification, indépendante de cette restriction du CLI.

Le parcours mobile Android local est désormais recommandé, avec `expo-dev-client`, téléphone USB ou émulateur choisi. La version de ce module, sa combinaison avec le lock Expo/NativeWind et les outils JDK/SDK/Gradle compatibles restent à figer et tester. Le lock mobile actuel qualifie le socle décrit dans la matrice, pas encore ce nouveau parcours natif. Expo Go constitue l'autre parcours, soumis à la compatibilité réelle du SDK et des modules.

## Verrouillage et mise à jour

Les cinq blocs npm disposent d'un `package-lock.json` et PHP d'un `composer.lock`. Utiliser `npm ci` / `composer install`, conserver ces fichiers dans Git. En cas de changement d'option, actualiser le lockfile fourni sur la combinaison concernée et refaire les vérifications applicables. Les dossiers `templates/options` définissent ces changements ; ils ne prétendent pas fournir des lockfiles pour toutes les combinaisons.

La résolution mobile part du lockfile figé. Une résolution npm sans ce fichier a tenté d'ajouter un peer RSC optionnel exigeant une autre version de React. L'actualisation depuis le lockfile du socle conserve la matrice native et passe avec peers stricts pour SQLite/animations. Le profil mobile n'active pas RSC ; ne pas ajouter cet ensemble serveur pour contourner le gestionnaire. Toute régénération totale future doit requalifier l'arbre obtenu. [Compatibilité et périmètre RSC selon Expo](https://expo.dev/changelog/mitigating-critical-security-vulnerability-in-react-server-components).

La qualification locale a isolé les installations dans des copies de test. Les installations npm de préparation ont ignoré les scripts de dépendances ; elles ne constituent donc pas une preuve de téléchargement d'Electron, de rebuild SQLite ou de compilation native. Les résultats et limites sont détaillés dans [RESULTATS.md](validation/RESULTATS.md).

La contrainte MIT/Apache-2.0 concerne le catalogue des **skills**. Les frameworks et outils gardent leurs propres licences : ne pas appliquer la licence d'un skill à Node, PHP, une base de données, une police ou un composant. Les métadonnées du registre ne remplacent pas une vérification des notices au moment de distribuer ces ressources.

## Sources primaires

- [Versions Node et LTS](https://nodejs.org/en/about/previous-releases), [registre officiel npm](https://registry.npmjs.org/), [Packagist](https://packagist.org/).
- [Electron Vite](https://electron-vite.org/guide/), [versions Electron](https://releases.electronjs.org/).
- [Nest et Vitest](https://docs.nestjs.com/recipes/swc), [TypeORM](https://typeorm.io/).
- [Laravel 13 et PHP supporté](https://laravel.com/framework/docs/13.x/releases), [support PHP](https://www.php.net/supported-versions.php).
- [Versions Expo](https://docs.expo.dev/versions/latest/), [matrice native du SDK figé](https://unpkg.com/expo@57.0.26/bundledNativeModules.json), [NativeWind stable](https://www.nativewind.dev/docs/getting-started/installation).
- [PostgreSQL](https://www.postgresql.org/support/versioning/), [MySQL LTS](https://dev.mysql.com/doc/refman/8.4/en/mysql-releases.html), [maintenance MariaDB](https://mariadb.org/about/#maintenance-policy).

Les versions choisies sont des décisions de préparation étayées par ces sources et les installations locales. Les essais natifs et multiplateformes restent des conditions de recette du MVP.
