# Résultats de préparation

Contrôles locaux du 4 au 5 octobre 2026. Ils portent sur les ressources du futur CLI. Aucun parcours de création, reprise ou mise à jour n'a été exécuté avec Prométhée : son implémentation n'existe pas encore.

## Environnement

Windows natif, commandes lancées par PowerShell dans des copies isolées. Node 24.21.0/npm 11.19.0, PHP 8.4.26 et Composer 2.10.3 ont été utilisés depuis des runtimes portables de test, avec contrôle des sommes officielles. Aucune installation globale ni modification de Codex. La résolution Composer fixe PHP 8.3.0 ; l'exécution réelle PHP 8.3 reste une recette à faire.

Ubuntu/WSL n'a pas été testé : l'accès WSL est refusé dans l'environnement de cette session. Aucun appareil Android/iOS, serveur de base de données ou hébergement mutualisé n'a servi à ces contrôles.

L'exigence d'installation automatique des outils manquants a été ajoutée au cadrage le 5 octobre : voir [BOOTSTRAP.md](../BOOTSTRAP.md). Aucun lanceur autonome, installateur système, service local ou parcours de poste vierge n'a été implémenté/testé. Les contrôles portables ci-dessous ne constituent pas une qualification de ce nouveau parcours.

## Vérifications obtenues

| Ressource | Vérifications réalisées | Portée |
| --- | --- | --- |
| Cinq blocs npm | Résolution, lockfiles, installation de copies | Scripts de dépendances ignorés pendant la préparation ; ne prouve pas une installation native |
| React web | Types, ESLint, build de production, test de rendu accessible | Gabarit et outils de test ; pas de navigation métier ou validation visuelle du produit |
| Nest | Types, ESLint, compilation, démarrage HTTP de `/api/health` avec réponse 200 | Application compilée démarrée ; connexion PostgreSQL et migrations non testées |
| Laravel | Composer, assets Vite, Pint, PHPUnit avec page `/` en HTTP 200, routes et compilation Blade | PHP 8.4 et configuration sans schéma métier ; déploiement mutualisé non testé |
| Expo | Installation avec peers stricts, types, ESLint, Jest/RNTL, contrôle SDK, export Android JavaScript/Hermes | Aucun APK natif construit ou ouvert sur appareil |
| Electron | Résolution, types et ESLint | Build standard et lancement natif non qualifiés dans cette session |
| Options | Résolution de Motion web ; desktop SQLite/Motion ; PHP Motion sans Alpine autonome ; Livewire avec cible PHP 8.3 ; mobile SQLite/animations depuis le lockfile figé | Compatibilité de résolution ; interactions Livewire, animations et SQLite natives restent à tester |
| Skills | 14 frontmatters validés ; trois recherches locales UI UX Pro Max ; revue des dépendances/scripts et notices | Pas de scénario comportemental dans une session Codex utilisateur |
| Documents | Quatre rendus sans marqueur restant ; huit cartes dont chemins vérifiés sur copies assemblées | Exemples de documents, pas des projets installés par le CLI |
| Manifeste | Schéma et exemples, rejets de chemins sortants/absolus, exigence de baseline adaptée | Ce contrôle ne remplace pas les contrôles réels de chemins et symlinks à l'écriture |
| Ressources | Inventaire, liens locaux, empreintes des skills, absence de caches, secrets et dépendances installées dans la livraison | Les sources suspendues ne sont pas copiées |
| Pixel art | Dimensions 24×16 cellules, caractères ASCII et reset ANSI | Apparence terminal à vérifier sur les plateformes prévues |

Les tests de rendu et de démarrage ont été écrits dans les copies de qualification. Ils ne sont pas livrés comme fonctionnalités ou tests métier du squelette. Les fichiers JSON et journaux de ce dossier gardent les résultats de chaque commande ; des essais initiaux échoués y figurent également, suivis des corrections ou limites décrites ci-dessous.

## Corrections issues des contrôles

- Mobile : alignement React/React DOM, Babel 7, preset Expo, test-renderer et plugin JSX. Le contrôle strict d'une installation complète a révélé des incompatibilités qu'une première résolution avait acceptées avec avertissements.
- Mobile avec options : actualisation depuis le lockfile du socle. Une résolution totale sans lockfile essayait d'ajouter un peer RSC optionnel incompatible avec React natif ; ce profil n'active pas RSC.
- PHP : résolution sur PHP 8.3 minimum, commande PHPUnit directe sans dépendance à Collision, configuration de démarrage local et rendu des ressources Blade du skill Laravel.
- Qualité : fichiers de skills et sauvegardes du manifeste exclus des outils de formatage/analyse. Le catalogue installé doit garder ses empreintes après une commande de qualité normale.
- Skills : entrées courtes, références progressives, suppression des sections de feedback automatique, provenance et avis de modification conservés avec chaque copie.
- Anti-slop : Stop Design Slop réintégré avec licence MIT complète, entrée courte et références ciblées. Prévention explicite, guides et matrice des skills rendus pour les quatre profils ; scénarios dédiés ajoutés. Ces contrôles portent sur les ressources, pas sur une garantie de rendu ou un comportement Codex exécuté.
- Sélection initiale : statut des 13 skills rendu explicite. Revue des conflits et sources figées des options manquantes, rôles désormais validés ; aucune copie installable annoncée avant adaptation. Les présélections accessibilité/texte et l'option GPT Taste/GSAP restent à intégrer après qualification.
- Bootstrap : spécification corrigée pour exiger outils et services nécessaires au démarrage, distribution sans Node préinstallé, reprise et exclusion Docker/installation WSL. Scénarios de poste vierge ajoutés ; vérification documentaire uniquement.
- Mobile : deux parcours validés et consignés dans les métadonnées, guides et exemple planifié. Android local recommandé avec téléphone USB par défaut ; Expo Go pour aperçu léger. Aucun `expo-dev-client` ajouté au lock avant qualification, aucun JDK/SDK ou build natif nouvellement testé.
- Architecture hôte : x64 uniquement pour Windows/Ubuntu acté dans la spécification et les scénarios. ARM reporté ; aucune recette d'installation système ou détection d'hôte nouvellement exécutée.
- Bases OS : Windows 11 maintenu et Ubuntu 24.04 LTS (natif ou WSL déjà installé) validés comme environnements de qualification. Le futur CLI et ses recettes n'ont pas encore été testés sur ces bases ; les builds/mises à jour effectifs seront consignés lors de la recette.
- Outils existants : parcours habituels et cache retenus ; contrôle préalable bloquant pour version incompatible, sans remplacement, mise à jour ou installation parallèle automatique. Spécification, règle Codex et scénarios corrigés ; aucun installateur ou contrôle réel des versions nouvellement exécuté.
- Distribution : ZIP Windows x64 et tar.gz Ubuntu x64, lanceurs et runtime Node privé du CLI validés comme parcours. Node habituel du projet conserve la règle compatible/absent/incompatible. Aucun lanceur, bundle de runtime ou release GitHub effectivement construit/publié ; scénarios ajoutés pour qualifier cette séparation.
- Services : relance des bases natives à la demande depuis Prométhée consignée, sans activation au démarrage du PC pour les nouvelles instances ni gestion de Docker/Compose. Guide commun, règles Codex et scénarios ajoutés ; suivi par base/association locale et adaptateurs restent à implémenter/qualifier. Aucune opération de service exécutée.
- Navigation : navigateur terminal, destination explicite et consultation d'un projet suivi cadrés dans la spécification et les scénarios. Actions de services/skills rattachées au projet sélectionné ; aucun navigateur, écran d'état ou test de navigation réel exécuté.
- Impeccable : couverture optionnelle des quatre profils validée, avec critique web/native adaptée à Expo/NativeWind et sans moteur supplémentaire. Décision consignée dans la revue, la sélection initiale et les règles génériques de routage ; adaptation installable et essais comportementaux toujours à préparer.

## Limites rencontrées

**Vitest/SWC pour Nest** : le module natif SWC refuse son cache dans cet environnement Windows restreint. Le répertoire de cache local essayé est rejeté par sa vérification des droits ; la suite d'intégration Nest reste non qualifiée. La compilation TypeScript et l'essai HTTP de l'application compilée passent. Aucun contournement de la protection ou changement des permissions système n'a été effectué.

**Electron : build et test de rendu** : le chargeur de configuration Vite/electron-vite/esbuild rencontre un refus d'accès à un répertoire parent. Les types et l'analyse passent, mais le build standard et le test Vitest du renderer ne peuvent pas être déclarés réussis. Le téléchargement de l'exécutable, le lancement, l'empaquetage et l'ABI SQLite doivent être testés dans un environnement approprié.

**Catalogue** : les deux skills Vercel et Motion AI Kit sont figés et documentés, mais non distribués. Les révisions vérifiées déclarent MIT sans fournir la notice complète retenue comme exigence de distribution. La licence de la bibliothèque Motion ne suffit pas à qualifier le dépôt du skill.

## Recette avant une release

Exécuter [SCENARIOS.md](SCENARIOS.md) avec le CLI et son archive réellement construits : Windows CMD/PowerShell, Ubuntu et WSL, options natives, reprise, mises à jour personnalisées, Git, intégrité et comportement Codex. Terminer les contrôles des options de données et de l'hébergement PHP. Lever les qualifications manquantes avant toute copie des trois skills suspendus.

La préparation fournit des versions et ressources reviewables. Elle ne constitue pas une certification sécurité ni une annonce de release prête.
