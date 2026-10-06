# Installation des outils et démarrage des projets

Décision validée le 5 octobre 2026 : Prométhée doit télécharger et installer les éléments manquants nécessaires pour démarrer le profil choisi. Cette exigence remplace le précédent parcours qui laissait l'installation des runtimes à l'utilisateur. Docker et l'installation de WSL sont exclus. Ce document cadre le futur installateur ; aucun installateur n'est implémenté ou qualifié dans cette livraison.

## Résultat attendu

Un utilisateur choisit son profil et ses options ; Prométhée prépare les outils, les dépendances, les services locaux nécessaires, les skills et les documents. Il remet des commandes de démarrage utilisables dans un nouveau terminal et par Codex. L'agent vérifie cet état avant le développement, puis réalise le cadrage restant et les fonctionnalités.

« Prêt » signifie que le démarrage du socle sélectionné a été vérifié. Une installation npm, une archive extraite ou un fichier `.env` ne suffisent pas. Si une permission, un redémarrage, une cible native ou un téléchargement manque, afficher précisément « incomplet » et proposer la reprise.

## Installation selon la sélection

| Profil ou choix | Éléments à fournir s'ils manquent | Vérification du démarrage |
| --- | --- | --- |
| Tous les profils | Runtime privé du CLI fourni dans sa distribution ; Node/npm habituels pour les dépendances et assets du projet | CLI et commandes du projet exécutables depuis CMD/PowerShell ou Ubuntu |
| Git activé | Git ; conserver identité et signature existantes | Dépôt initialisable ; une identité absente reste une étape utilisateur |
| Skills sélectionnés | Interpréteurs et dépendances locales nécessaires aux scripts retenus, dont Python pour UI UX Pro Max | Recherche locale du skill fonctionnelle ; aucun service payant ajouté |
| React + API Nest | Frameworks et outils de qualité ; PostgreSQL si aucune instance choisie compatible n'est accessible | Page React, endpoint HTTP de l'API et connexion SQL |
| Laravel | PHP et extensions requises, Composer, frameworks/assets ; MySQL si aucune instance choisie compatible n'est accessible | Page Blade, assets construits et connexion SQL |
| Electron | Dépendances et binaire Electron réellement téléchargé ; bibliothèques système Linux nécessaires | Fenêtre native, main/preload/renderer et protections attendues |
| SQLite Electron | Driver et reconstruction compatible Electron ; outils C++/Python seulement si nécessaires | Ouverture et persistance d'une base de test |
| Expo Go, aperçu léger | Node/npm et packages compatibles avec le SDK ; installation Expo Go guidée sur téléphone | Metro et aperçu sur téléphone compatible |
| Android local, parcours recommandé | Node/npm, packages Expo, `expo-dev-client`, JDK, SDK et outils de compilation compatibles ; téléphone USB par défaut, émulateur si choisi | Première compilation et lancement Android sur la cible choisie |
| Backend mobile sélectionné | Même préparation Nest/PostgreSQL que le profil API | API accessible depuis le téléphone ou l'émulateur |

Les options UI et animation installent leurs bibliothèques uniquement si sélectionnées. Les skills non qualifiés restent indisponibles. Installer un skill ne déclenche pas tous ses scripts ; seuls les outils requis pour son usage prévu sont préparés.

## Contrôle préalable et règle de blocage

Avant tout téléchargement ou installation d'outil et avant création du projet, détecter les versions effectives des outils externes nécessaires au profil, aux options et aux skills sélectionnés. Examiner l'ensemble de cette liste avant d'installer le premier outil manquant.

- Outil présent et compatible : le réutiliser.
- Outil absent : prévoir son installation par le parcours habituel qualifié.
- Outil présent et incompatible : arrêter immédiatement avec un code de sortie d'échec. Ne pas le remplacer, le mettre à jour automatiquement, installer une version parallèle ou ignorer le conflit. L'utilisateur installe ou active lui-même une version compatible, puis relance Prométhée.
- Détection de version impossible : expliquer l'échec et arrêter ; ne pas traiter un outil inaccessible ou cassé comme absent pour lancer une installation en double.

La compatibilité dépend des exigences qualifiées de la sélection, pas d'une obligation d'avoir exactement le numéro de référence ni la version latest. Une version trop récente peut aussi être incompatible. Pour un outil accessible via un gestionnaire de versions déjà utilisé par l'utilisateur, contrôler la version effectivement active ; ne pas modifier son gestionnaire. Un outil non requis par la sélection ne bloque pas le parcours.

Le diagnostic liste les conflits détectés, avec outil, version effective et exigences. Exemple de message à rendre avec des valeurs réelles :

```text
Installation arrêtée : version incompatible détectée.
Outil : <outil>
Version détectée : <version>
Version compatible requise pour <profil> : <plage ou version>
Installez ou activez une version compatible, puis relancez Prométhée.
Votre installation existante n'a pas été modifiée.
```

Lors d'une reprise, refaire le contrôle préalable et préserver les fichiers et étapes déjà réussies si un conflit apparaît. Aucun état « prêt » ni premier commit après ce blocage. Le suivi peut enregistrer le diagnostic sans remplacer les fichiers du projet. Cette règle s'applique également à un moteur de base existant nécessaire au profil.

## Cache des téléchargements

Réutiliser les caches npm/Composer et conserver les archives techniques téléchargées dans un cache utilisateur. Identifier une archive par outil, version, OS/architecture et intégrité ; la vérifier avant réutilisation. Une archive corrompue n'est pas exécutée et peut être téléchargée à nouveau.

Le cache évite les téléchargements répétés ; les outils installés suivent leurs emplacements et commandes habituels. Le MVP ne fournit pas un gestionnaire de versions propre à Prométhée. La taille, le nettoyage et les erreurs de cache relèvent de la recette ; un cache indisponible ne doit jamais provoquer un contournement de la règle de compatibilité.

## Lancement de Prométhée sur une machine vierge

Formats validés : archive ZIP Windows x64 avec `promethee.cmd` utilisable dans CMD/PowerShell, et archive `.tar.gz` Ubuntu x64 avec lanceur `promethee`. Elles seront téléchargées depuis les releases du dépôt GitHub privé et incluront runtime du CLI, code compilé, gabarits, catalogue, skills qualifiés et notices. Une distribution uniquement npm/npx ne suffit pas pour une machine sans Node ; le paquet npm peut rester complémentaire.

Le lanceur utilise explicitement le runtime Node privé fourni dans l'archive, y compris si Node est déjà installé. Ce runtime sert au fonctionnement du CLI et reste dans son dossier, sans être ajouté au PATH ou remplacer une installation normale. Conserver les licences du runtime redistribué et vérifier les archives par plateforme. Les dépendances et services du profil sont ensuite téléchargés depuis les sources autorisées ; aucune substitution par les dernières versions non qualifiées.

Pour Node/npm du projet, détecter les commandes habituelles de la machine, indépendamment de `process.execPath` du CLI et de son dossier runtime : compatible = réutilisation sans réinstallation ; absent = installation habituelle ; incompatible = arrêt. La présence du runtime privé ne constitue pas une installation des outils du projet et ne permet pas de contourner un conflit. Le CLI peut ainsi afficher menu et diagnostics avant ce contrôle.

Un exécutable Node SEA n'est pas requis par le parcours MVP ; les archives avec runtime et lanceur sont le choix retenu. Les archives officielles Node de la version de référence constituent les sources à qualifier pour cette redistribution. [Node 24.21](https://nodejs.org/en/download/archive/v24.21.0). Aucun lanceur ni runtime distribué n'a encore été assemblé dans la livraison de préparation.

## Windows et Ubuntu

- Bases de qualification du MVP : Windows 11 encore maintenu et Ubuntu 24.04 LTS sur hôte x64, y compris Ubuntu sous WSL déjà installé. ARM et 32 bits sont hors périmètre ; d'autres versions d'OS seront ajoutées après qualification. Identifier OS, version et architecture native de l'hôte avant téléchargement ou installation ; une cible non prise en charge reçoit une explication, sans opération système ni tentative de contournement.
- Consigner version/build Windows et niveau de mise à jour Ubuntu dans les preuves de recette. Les recettes restent à exécuter sur ces bases ; le choix d'une plateforme n'est pas un résultat de test. Prométhée prépare les outils du projet et n'effectue pas de mise à niveau du système d'exploitation.
- Cette limite concerne l'ordinateur exécutant Prométhée et les binaires de ses outils. Les cibles de compilation des applications sont vérifiées séparément ; les téléphones Android ARM restent des cibles possibles du parcours mobile.
- Windows : fonctionnement natif dans CMD et PowerShell, sans appeler WSL. Utiliser les parcours habituels qualifiés des outils : installateurs ou archives officielles, avec commandes rendues accessibles. La portée utilisateur/système dépend du parcours retenu pour l'outil. WinGet est un adaptateur possible, pas une condition unique de lancement.
- Ubuntu : qualifier les recettes par version de distribution et architecture. Utiliser les archives officielles ou les paquets/dépôts autorisés pour les outils et services. Une version disponible par défaut dans la distribution n'est pas automatiquement compatible avec le profil.
- Réutiliser les outils compatibles ; installer les absents. Une version incompatible arrête le parcours avec diagnostic, sans changement de version ni installation parallèle automatique. Les services déjà présents et leurs données sont conservés.
- Les téléchargements ont source, version et contrôle d'intégrité connus. Les installateurs, runtimes et licences propres aux outils demandent une qualification séparée des lockfiles npm/Composer.
- Windows UAC et Ubuntu sudo peuvent être nécessaires. Afficher les opérations concernées et demander l'élévation seulement pour elles. L'installation des dépendances du projet reste sous le compte utilisateur normal. Refus, politique machine ou redémarrage : état incomplet et reprise, pas contournement.

WinGet peut manquer et certains installateurs requièrent une élévation. PHP Windows a notamment un runtime Visual C++ requis. Ubuntu 24.04 fournit PHP 8.3, tandis qu'Ubuntu 22.04 propose PHP 8.1 : le parcours Laravel doit fournir une version compatible ou annoncer une distribution non qualifiée. [WinGet](https://learn.microsoft.com/en-us/windows/package-manager/winget/), [PHP Windows](https://www.php.net/manual/en/install.windows.manual.php), [PHP Ubuntu 24.04](https://packages.ubuntu.com/noble/php), [PHP Ubuntu 22.04](https://packages.ubuntu.com/jammy/php8.1-cli).

## Bases et configuration locale

Préparer le moteur local lorsque la base est déclarée native et qu'aucune instance compatible choisie n'est disponible. Une base connue comme Docker/Compose, distante ou embarquée n'ajoute pas un moteur natif pour ce besoin. Créer une base et un compte de développement dédiés, configurer le projet et vérifier une connexion. Ne pas ajouter de schéma métier ni réinitialiser une instance, un compte ou des données préexistants. En cas de conflit de port, utiliser une configuration distincte et l'enregistrer.

Les secrets vont dans la configuration locale exclue de Git, sans apparaître dans le manifeste versionné ou les journaux. Une nouvelle instance native est configurée pour démarrage à la demande, sans activation au démarrage du PC ; elle peut être démarrée pour sa configuration et ses tests. Les instances existantes conservent leurs réglages. Ne pas exposer la base au réseau par défaut. L'adaptateur service/processus et les droits nécessaires doivent être qualifiés par plateforme.

Le [menu services](SERVICES.md) permet de relancer les bases natives du projet suivi sans refaire la création. État et démarrage/arrêt sont explicites ; aucune gestion de Docker ou de ses conteneurs. Suivre le mode de chaque base et son association locale, pas seulement l'option Docker de l'application. Les règles de projet et cartes sont actualisées lorsque l'agent Dockerise une base.

PostgreSQL et MySQL fournissent des parcours d'installation natifs ; les dépôts Ubuntu peuvent être nécessaires pour obtenir les branches retenues. [PostgreSQL Ubuntu](https://www.postgresql.org/download/linux/ubuntu/), [MySQL APT](https://dev.mysql.com/doc/mysql-apt-repo-quick-guide/en/).

## Commandes accessibles à l'utilisateur et à Codex

Une modification du PATH du seul processus d'installation ne suffit pas. Les installations habituelles doivent rendre les commandes utilisables dans un nouveau terminal et par Codex. Vérifier la version effectivement résolue et documenter un redémarrage du terminal/de Codex si nécessaire. Enregistrer version attendue et commandes utiles dans un guide court ; le lier depuis `AGENTS.md` uniquement lorsqu'il est réellement généré. Aucun environnement de versions géré par Prométhée imposé.

Ne pas supposer que CMD, PowerShell, un nouveau terminal, l'application Codex et une session Ubuntu partagent le même environnement. Vérifier le parcours annoncé sur chacun. Aucun changement global de la configuration Codex.

## Limites mobile et desktop

Deux parcours validés pour un seul projet : Android local avec development build recommandé ; Expo Go pour l'aperçu léger. Le choix de parcours est distinct du choix d'appareil. Android local propose le téléphone USB par défaut et un émulateur optionnel après contrôle de compatibilité de la machine. Expo Go peut prévisualiser sur téléphone Android ou iPhone si le SDK et les modules choisis sont compatibles.

Le récapitulatif enregistre parcours et cible. Expo Go ne couvre pas tous les modules natifs ; une option qui nécessite une development build doit utiliser le parcours complet. Préparer les outils de la sélection plutôt qu'annoncer un support natif général à partir d'un export JavaScript. Le passage au development build conserve le projet ; adapter dépendances, règles, commandes, manifeste et matrices. Compiler localement avec Expo CLI, sans ajouter EAS ou un compte cloud requis. [Development builds Expo](https://docs.expo.dev/develop/development-builds/introduction/).

L'installation sur un téléphone, son appairage et l'acceptation des licences d'outils restent des actions à rendre visibles. La compilation iOS locale exige un Mac et Xcode ; Windows/Ubuntu ne peuvent pas être déclarés prêts pour cette cible. Aucun cloud payant ajouté pour combler cette limite. [Expo, builds locaux](https://docs.expo.dev/guides/local-app-development/), [simulateur iOS](https://docs.expo.dev/workflow/ios-simulator/).

Electron doit être téléchargé avant la vérification finale, même si son installation npm diffère selon la version. Les dépendances natives doivent correspondre à son ABI ; leur compilation peut nécessiter des outils supplémentaires. [Installation Electron](https://www.electronjs.org/docs/latest/tutorial/installation), [modules natifs](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules).

Docker n'est ni téléchargé ni installé. L'agent garde la question de dockerisation prévue dans le cadrage, puis adapte règles et commandes à la décision. Une décision ultérieure de Dockeriser peut nécessiter que l'utilisateur fournisse Docker. Prométhée n'installe ni ne met à jour WSL ; Ubuntu sous WSL reste utilisable lorsque l'utilisateur l'a déjà installé.

## Suivi et qualification restant à préparer

Avant installation, établir un plan concret des outils réutilisés, téléchargements, emplacements et opérations privilégiées, puis terminer le contrôle préalable de compatibilité. Suivre séparément téléchargement, installation, configuration et vérification ; conserver les succès et revalider leur état lors d'une reprise. Ne pas supprimer un outil utilisé par d'autres projets pour annuler la création.

Le manifeste devra enregistrer OS/architecture, versions effectives, provenance/méthode, statut des outils et services, activation et preuves de vérification, sans secrets ni chemins privés inutiles dans Git. La V0.2 ajoute toolchain/databases et les étapes système ; provenance des recettes et preuves OS/architecture restent à préciser dans la qualification locale. Aucun exemple existant ne constitue la preuve d'un bootstrap exécuté.

Avant développement de l'installateur : qualifier le packaging autonome, les recettes OS/architecture, les interpréteurs des skills, les modes de service des bases et l'exécution des parcours mobiles validés ; figer versions, licences, sources et empreintes dans un lock de bootstrap. Les métadonnées mobiles consignent les choix, sans prétendre fournir déjà le lock de `expo-dev-client` et des outils natifs. Ensuite, exécuter les [scénarios de poste vierge](validation/SCENARIOS.md). Les résultats actuels sont dans [RESULTATS.md](validation/RESULTATS.md).

## Ressources V0.2

Le [plan déclaratif](catalogue/bootstrap-plan.json) et les schémas V2 préparent le suivi des outils et des bases. Il reste à qualifier les recettes exécutables, plages de compatibilité, téléchargements/intégrités et démarrages sur les deux OS. Les nouveaux exemples sont des états planned/pending, jamais des traces d'installation accomplie.
