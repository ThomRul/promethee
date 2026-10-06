# Spécification du MVP de Prométhée — préparation V0.2

Prométhée prépare un projet pour le développement avec Codex. Il installe un socle technique, des skills sélectionnés et des documents courts qui orientent l'agent vers le contexte utile. L'agent de l'utilisateur réalise ensuite le cadrage restant et développe les fonctionnalités.

Ce document consolide les décisions validées dans la conversation. Il sert de référence produit. Les versions exactes sont dans `catalogue/frameworks.lock.json`, les sources et qualifications des skills dans `catalogue/skills.lock.json`, et les critères de recette dans `validation/SCENARIOS.md`.

État initial du 5 octobre 2026 : préparation du MVP, sources principales figées le 4 octobre et complément anti-slop qualifié le 5 octobre. Une implémentation en préversion a été ajoutée le 6 octobre ; ses résultats et qualifications ouvertes sont dans `docs/IMPLEMENTATION-REVIEW.md`. Les anciens résultats de préparation restent dans `validation/RESULTATS.md`.

## 1 Finalité et limites

### Exigences validées

- Nom public : **Prométhée**. Commande technique : `promethee`.
- Codex uniquement pour la première version.
- Bases de qualification du MVP : Windows 11 dans une version encore maintenue, natif dans Command Prompt et PowerShell ; Ubuntu 24.04 LTS, natif ou sous WSL déjà installé. Architecture de l'ordinateur exécutant Prométhée : x64 uniquement ; ARM reporté. Ajouter d'autres versions d'OS après qualification, sans les annoncer prises en charge à l'avance.
- Dépôt GitHub privé dans un premier temps.
- Catalogue maintenu manuellement. L'utilisateur sélectionne les skills proposés ; la création du projet ne recherche pas automatiquement sur GitHub.
- Navigateur de dossiers intégré au terminal pour créer ou consulter un projet suivi. Destination absolue affichée et choisie explicitement ; aucun emplacement d'installation déduit silencieusement du dossier de lancement.
- Skills sous MIT ou Apache-2.0, avec provenance et licences conservées, sans dépendance obligatoire à une API ou un service tiers payant.
- Économie de contexte par sélection des skills, lecture ciblée, réutilisation et mise à jour des cartes. Aucune économie chiffrée promise ; benchmark de tokens reporté.
- Prévenir le slop IA : interfaces fondées sur le projet, contenus fiables, composants réutilisés et code KISS. Règles communes explicites et audits visuels ciblés, sans imposer le même style à tous les projets.
- Le CLI fournit un squelette technique minimal. L'agent développe les comptes, authentifications, CRUD, tableaux de bord et autres fonctionnalités selon le projet.
- Le CLI télécharge et installe les outils manquants nécessaires au démarrage du profil choisi, y compris les runtimes et services locaux utiles. Docker et l'installation de WSL sont exclus ; Windows reste natif.
- Détecter et réutiliser les outils compatibles, installer les absents par les parcours habituels et conserver un cache des téléchargements. Une version incompatible détectée pour un outil requis arrête l'installation ; l'utilisateur corrige sa version avant relance. Aucun remplacement, mise à jour ou installation d'une version parallèle automatique dans ce cas.
- Aucun service IA intégré au CLI, aucune configuration globale de Codex modifiée implicitement.
- Cloud payant, Cloudflare, adoption d'un projet existant, automatisation complète et interface non interactive reportés.

### Livraison initiale

Application TypeScript compilée, interface terminal `@clack/prompts`. Distribution principale retenue : archive ZIP Windows x64 avec lanceur `promethee.cmd` pour CMD/PowerShell ; archive `.tar.gz` Ubuntu x64 avec lanceur `promethee`. Chaque archive inclut le runtime Node privé du CLI, le code compilé, les gabarits, le catalogue, les ressources et licences. Les releases du dépôt GitHub privé servent à leur téléchargement. Le packaging et les lanceurs restent à développer et qualifier ; aucun exécutable autonome SEA n'est requis pour le MVP. Un paquet npm privé peut rester complémentaire.

Le CLI utilise son runtime privé pour démarrer même sans Node installé ou avec un Node incompatible sur la machine. Cette copie reste dans le dossier du CLI, sans ajout au PATH, remplacement d'un outil utilisateur ou utilisation comme contournement des prérequis du projet. Node compatible déjà installé est réutilisé pour le projet ; Node absent est installé normalement ; Node incompatible arrête le parcours selon la règle validée. Les autres outils, services et dépendances du profil sont téléchargés depuis les sources qualifiées ; l'installation complète nécessite le réseau.

L'utilisateur lance la distribution native puis utilise `promethee`, `promethee create`, `promethee status`, `promethee services` ou `promethee skills update`. Le menu permet de créer un projet ou d'en consulter l'état après sélection dans l'arborescence ; les services et mises à jour utilisent le projet effectivement choisi. Pas d'auto-update en arrière-plan. Les contrats de [navigation](NAVIGATION.md), [installation](BOOTSTRAP.md) et [services](SERVICES.md) définissent le résultat attendu et les qualifications restantes.

## 2 Parcours de création

1. Présenter le nom et la main unique en pixel art. Utiliser la version ANSI si le terminal le permet, sinon l'ASCII. Respecter l'absence de couleurs demandée par l'environnement.
2. Parcourir l'arborescence et choisir explicitement le dossier parent, puis le nom du dossier projet. Afficher le chemin final absolu avant installation. Le nom affiché peut contenir des accents ; le nom de package est un identifiant compatible avec npm/Composer, distinct du chemin choisi.
3. Demander si le périmètre est déjà défini. Enregistrer cette réponse pour le démarrage de Codex ; le CLI ne mène pas le cadrage métier.
4. Choisir le profil et ses options techniques.
5. Afficher les skills pertinents, leur rôle, source, licence et version. Les présélections restent modifiables. Les entrées non qualifiées sont indisponibles à l'installation et explicitement identifiées.
6. Afficher un récapitulatif modifiable : destination absolue complète, profil, options, skills, Git, outils réutilisés, téléchargements et éventuelles opérations privilégiées. Annuler ou changer de destination reste possible avant « Installer » ; aucune écriture de projet ou installation pendant la navigation.
7. Contrôler OS et versions de tous les outils externes requis par la sélection. Une incompatibilité arrête le parcours avec diagnostic et code de sortie d'échec, avant téléchargement, installation d'outil ou création du projet. Un outil absent sera installé à l'étape suivante ; un outil non requis ne bloque pas ce profil.
8. Créer le suivi, installer les outils manquants par leurs parcours habituels, copier le squelette, installer les dépendances et préparer les services locaux choisis. Copier les skills et produire les documents adaptés. Enregistrer le résultat de chaque étape.
9. Effectuer les vérifications propres à l'installation, puis initialiser Git et le premier commit si les conditions sont réunies.
10. Afficher l'état exact, les commandes utiles, les éventuelles étapes restantes et un court message de démarrage à copier dans Codex.

Prométhée prend en charge les prérequis nécessaires au démarrage ; l'agent vérifie l'état livré avant le développement. Réutiliser les outils compatibles et installer les absents. Une version présente incompatible bloque le parcours sans remplacement ni contournement ; donner outil, version détectée, plage compatible et action de relance. Inclure les interpréteurs requis par les skills sélectionnés. Les commandes doivent fonctionner pour Codex et dans un nouveau terminal, avec les installations habituelles ; Prométhée ne devient pas un gestionnaire de versions dédié. Une demande de droits système, un redémarrage ou un échec laisse un état incomplet reprenable. Ne jamais annoncer « prêt » sur la seule résolution des dépendances. Docker et WSL ne sont pas installés.

### Navigation et consultation

Le [navigateur terminal](NAVIGATION.md) ouvre les sous-dossiers, remonte au parent, change de lecteur/volume accessible et permet de coller un chemin. Le dossier courant sert de départ visible ; il n'est pas une destination implicitement validée. Pas d'indexation récursive de la machine ni de registre global obligatoire. Une cible inaccessible ou modifiée bloque l'opération sans repli ailleurs.

« Voir l'état d'un projet » ouvre un projet Prométhée sélectionné : profil/options, versions/skills enregistrés, étapes d'installation, états natifs réellement contrôlés et actions pertinentes. Consulter ne lance ni installation, build, tests, mise à jour, commit ou service. Les bases Docker gardent leur gestion externe. Le chemin du projet actif reste visible et détermine toutes les actions, même lorsque le CLI est lancé depuis un autre dossier.

## 3 Profils proposés

| Profil | Socle | Données | Structure |
| --- | --- | --- | --- |
| Web React et API | React, TypeScript, Vite ; NestJS, TypeORM ; Tailwind et shadcn/ui | PostgreSQL par défaut | `frontend/` et `backend/` dans un dépôt |
| Web PHP | Laravel, Eloquent, Blade, Tailwind, Alpine | MySQL par défaut ; MariaDB selon l'hébergement | Structure native Laravel MVC |
| Desktop | Electron, React, TypeScript, Vite, Tailwind, shadcn/ui | SQLite et TypeORM si explicitement choisis | Main, preload et renderer séparés |
| Mobile | React Native, Expo, TypeScript, Expo Router, NativeWind | `expo-sqlite` en option | Routes minces dans `src/app`, fonctionnalités hors des routes |

### Options

- Laravel : Livewire optionnel. Lorsque choisi, utiliser l'instance Alpine fournie par Livewire ; éviter son double chargement.
- Mobile : backend NestJS/TypeORM/PostgreSQL optionnel. Réutiliser une API existante quand c'est le choix du projet. Un backend séparé n'est pas ajouté sans sélection.
- Mobile : un seul profil et deux parcours validés. Android local avec development build est recommandé et présélectionné ; téléphone Android USB par défaut, émulateur optionnel après vérification de la machine. Prométhée prépare JDK, SDK, outils de compilation et `expo-dev-client`, puis vérifie une première compilation et le lancement sur la cible. Expo Go est le parcours léger de prévisualisation sur téléphone pour les fonctions compatibles ; il n'installe pas d'outils Android natifs inutiles à ce mode. Le passage au development build conserve le projet et adapte outils, commandes, `AGENTS.md` et matrices. L'autorisation USB reste une action sur le téléphone.
- Deux choix distincts, désactivés par défaut : animations UI avec Motion sur web/PHP/Electron ou Reanimated sur mobile ; animations éditoriales avancées avec GPT Taste adapté et GSAP, sur web seulement. GPT Taste est présélectionné avec ce second choix après qualification ; il n'est pas imposé aux animations UI. Les animations simples restent possibles sans ces options. La version et les lockfiles GSAP restent à qualifier ; la licence gratuite spécifique est documentée séparément du MIT du skill. L’adaptation GPT Taste est préparée en V0.2. Les deux options peuvent coexister sur web, avec un seul propriétaire par animation.
- Desktop et mobile : aucune base locale créée par défaut. En cas de choix, préparer dépendance, emplacement et convention ; l'agent crée le schéma utile, les migrations et la synchronisation selon le besoin.
- Docker : décision prise avec l'agent, pas de Docker par défaut ni d'installation de Docker par le CLI. Clarifier développement, déploiement ou les deux et les services concernés. Sur mobile, distinguer l'application et son backend.
- Services de base : nouvelle instance native démarrée à la demande via Prométhée, sans activation au démarrage du PC ; état et arrêt explicite disponibles depuis le projet suivi. Respecter les réglages d'une instance existante et la portée des services partagés. Mode déclaré par base : Docker/Compose exclut installation native et contrôle de Docker/conteneurs par Prométhée ; SQLite ou base distante n'ajoutent aucun service serveur local.

### Hébergement PHP

Le profil vise un hébergement PHP mutualisé compatible, sans VPS. Les assets sont construits avant déploiement. L'agent vérifie PHP, extensions, base, accès au dossier `public`, réécriture des URL, stockage, droits et tâches planifiées. Il choisit des mécanismes compatibles avec l'hébergement pour les tâches en arrière-plan. Aucun abonnement précis n'est présenté comme universellement compatible.

La compilation iOS native et les signatures nécessitent les outils et plateformes adaptés. Windows/Ubuntu sont les plateformes du CLI ; cette couverture ne signifie pas que tous les binaires applicatifs peuvent y être construits. Les services EAS payants ne font pas partie du parcours requis.

Pour le MVP Windows/Ubuntu, iOS dispose du code partagé et d'un aperçu Expo Go sur iPhone dans les limites de compatibilité. La compilation iOS native locale exige un Mac avec Xcode. La préparation Android est locale, sans compte Expo requis ni cloud ajouté. Les deux parcours mobiles sont décidés ; versions natives, recettes et première compilation restent à qualifier.

## 4 Architecture et qualité

- KISS : choisir la solution lisible la plus simple qui répond au besoin réel et permet une évolution raisonnable.
- Séparer affichage, logique métier, accès aux données et effets système selon le framework. Organiser les fonctionnalités ou domaines quand ils apparaissent.
- React/mobile : routes ou pages minces, logique et accès API à proximité de la fonctionnalité. Nest : contrôleurs HTTP, services métier, entités/persistance. Laravel : MVC natif, actions/services quand utiles. Electron : système, pont limité, interface.
- Rechercher les composants, variantes et tokens existants avant d'en créer. Extraire un composant partagé quand il existe un besoin réel de réutilisation.
- CSS custom permis : cohérence avec les tokens, styles limités au contexte nécessaire, accessibilité, absence de styles concurrents pour un même composant.
- Pas de couches spéculatives ou de dépendances pour une complexité hypothétique. Une abstraction devient pertinente si elle isole une responsabilité réelle, une duplication significative ou un comportement testable.
- Pas de Git submodules, dépôts supplémentaires, packages autonomes, microservices ou applications supplémentaires sans demande explicite. Des dossiers par fonctionnalité et modules logiques du framework restent normaux.
- Environ 300 lignes maximum visées par fichier de code manuscrit front/back. Au-delà, réexaminer ses responsabilités ; exception motivée si le découpage dégrade la lisibilité. Aucune division artificielle ou erreur automatique fondée uniquement sur ce nombre. Dépendances, fichiers générés, lockfiles et données volumineuses exclus.
- Respecter les conventions présentes et les décisions du projet. Faire évoluer l'architecture lorsque le besoin le justifie, en mettant à jour les documents concernés.

### Anti-slop commun aux quatre profils

Le gabarit `AGENTS.md` contient des règles courtes de prévention, avec un [guide commun](templates/common/docs/agent-guides/anti-slop.md) lu pour les tâches UI. Elles restent présentes si l'utilisateur désélectionne un skill. Concevoir à partir du brief, des usages et des contenus disponibles ; prolonger les choix et composants existants. Éviter les compositions interchangeables ajoutées sans besoin, les preuves commerciales inventées et les contrôles qui simulent un fonctionnement absent.

La qualité visuelle s'évalue contre le projet et les conventions de plateforme, avec les états utiles, l'accessibilité et les interactions. Les animations et effets ont une fonction ou expriment une identité choisie. Aucune liste universelle d'interdictions de couleurs, polices, cartes ou dégradés. Une petite demande ne lance pas une refonte, un audit complet, une nouvelle dépendance ou une abstraction inutile.

UI UX Pro Max aide la conception ; Stop Design Slop réalise un audit ciblé quand la tâche le demande. Distinguer défauts observables, faits à confirmer et choix de style. En CLEAN, conserver la direction visuelle ; la refonte doit être demandée. Charger les seules références pertinentes, vérifier le rendu lorsque possible et indiquer les limites. Ni compilation ni score anti-slop ne certifie la qualité visuelle.

### Outils préparés

| Profil | Vérifications |
| --- | --- |
| React / Electron | ESLint, Prettier, TypeScript, Vitest, React Testing Library |
| NestJS | ESLint, Prettier, TypeScript, Vitest, `@nestjs/testing`, Supertest |
| Expo | ESLint, Prettier, TypeScript, Jest, `jest-expo`, React Native Testing Library |
| Laravel | Pint, PHPUnit ; construction des assets avec Vite |

Les tests protègent comportements importants, règles métier, validations, permissions, interactions et régressions. Pas de quota arbitraire de couverture ni de test qui recopie seulement l'implémentation. Les vérifications suivent l'impact ; une vérification encore valable n'est pas répétée pour un simple message. Une absence de test n'est pas un résultat « tous les tests passent ».

## 5 Skills et sécurité

| Groupe | Choix validés |
| --- | --- |
| Tous les profils d'interface | UI UX Pro Max pour la conception ; Stop Design Slop pour l'audit visuel ciblé ; Verification Before Completion et Systematic Debugging adaptés |
| React web / renderer Electron | Vercel React Best Practices et Composition Patterns adaptés à React/Vite |
| PostgreSQL | Supabase Postgres Best Practices, utilisable sans compte Supabase |
| Laravel | Laravel Best Practices officiel ; Livewire Development officiel si Livewire choisi |
| Expo | Expo Router, Expo Design System, Expo Native UI ; Data Fetching recommandé si API ; Animation si option activée |
| Sécurité | OpenAI Security Best Practices pour les langages et contextes réellement couverts ; Security Threat Model optionnel sur demande explicite |
| Animations web / PHP | Motion, parcours gratuit adapté à React ou au JavaScript des pages Blade |

Les deux entrées Vercel et l'entrée Motion AI Kit restent sélectionnées au niveau produit, mais leur qualification conditionne leur redistribution. Le catalogue indique les éventuels blocages de licence et ne les masque pas.

UI UX Pro Max guide les choix visuels en respectant le brief et l'existant. Il ne force pas une refonte ou un style de démonstration. Stop Design Slop est présélectionné, désélectionnable, pour l'audit ; il n'est pas chargé à chaque tâche. L'adaptation conserve CLEAN, des références ciblées et une refonte sur demande, sans score obligatoire ni second directeur artistique imposé. Pour mobile, les contrôles natifs reposent sur le guide et les skills Expo pertinents. Les skills techniques précisent la mise en œuvre.

Les audits complets sont déclenchés sur demande. Les règles de développement sécurisé restent présentes dans les guides des profils : validations, autorisations, secrets, échappement/CSRF pour PHP, accès base et transactions justifiées, IPC/navigation/permissions pour Electron, secrets côté serveur pour mobile. Security Best Practices n'est pas présenté comme un audit spécialisé PHP, Electron ou React Native. Security Threat Model décrit des menaces et hypothèses, pas des vulnérabilités prouvées.

Cloudflare et les outils d'audit supplémentaires restent hors MVP. Aucun skill ne peut autoriser à lui seul un envoi de code ou de données, une installation globale, un push ou une modification externe.

### Règles d'intégration

Les autres skills de la sélection initiale restent tracés dans [la revue de compatibilité](catalogue/COMPATIBILITY.md). Rôles validés : UI UX Pro Max pilote visuel ; Stop Design Slop pour l'audit ; frontend-a11y présélectionné sur web/PHP/renderer Electron ; Humanizer présélectionné pour les textes ; Impeccable optionnel sur les quatre profils pour une critique UI ciblée, références web ou natives adaptées à Expo, sans moteur supplémentaire ; Diagram Design optionnel ; GPT Taste selon le choix éditorial avancé. Impeccable concerne frontend React, vues Blade, renderer Electron ou écrans mobiles, pas les tâches backend/SQL/système. Présélections modifiables et aucun chargement automatique de toute la stack. Les cinq adaptations sont présentes dans la préparation V0.2, avec licences et notices. Leur comportement Codex reste à tester ; GPT Taste conserve une condition éditoriale web et la combinaison GSAP reste à qualifier.

La sélection effective détermine les dossiers installés, les dépendances utiles, le manifeste, les matrices et `AGENTS.md`. Les gabarits V0.2 rendent les seules adaptations sélectionnées dans les matrices et AGENTS.md, sans références obligatoires à un skill absent. Une option technique non qualifiée reste un aperçu, pas une installation disponible.

- Installer uniquement les skills sélectionnés dans `.agents/skills/`.
- Descriptions courtes et discriminantes ; corps court et références chargées selon le besoin.
- Conserver ressources nécessaires, licences, notices et attributions, y compris la licence propre à un sous-dossier.
- Retirer dépendances obligatoires à Claude, MCP absent, services payants et envoi automatique de feedback.
- Adapter les recommandations à la version et aux conventions du profil. Ne pas changer NativeWind en styles inline obligatoires ni ajouter une architecture de workspace par effet de bord.
- Enregistrer chaque adaptation et son empreinte. Ne pas présenter la version Prométhée comme une version officielle de l'amont.
- Copier un skill n'exécute pas ses scripts. Une utilisation ultérieure de ses scripts répond au besoin de la tâche et aux règles du projet.

## 6 Documents et contexte

| Fichier | Source de vérité |
| --- | --- |
| `AGENTS.md` | Règles de travail, architecture, qualité, Git et liens de contexte |
| `PROJECT.md` | Objectif, utilisateurs, périmètre MVP, contraintes, décisions actuelles, questions ouvertes |
| `docs/agent-map/INDEX.md` | Zones réellement présentes et liens vers leurs cartes |
| `docs/agent-map/ROUTING.md` | Type de tâche → zone → skills pertinents → vérifications |
| `docs/agent-map/<zone>.md` | Entrées, responsabilités, dépendances et éléments réutilisables d'une zone |
| `docs/agent-guides/anti-slop.md` | Prévention et revue UI proportionnée, communes aux quatre profils |
| `docs/agent-guides/skill-routing.md` | Déclencheurs et limites des seuls skills sélectionnés ; arbitrage par tâche |
| `docs/agent-guides/services.md` | Services natifs à la demande, exclusions Docker/SQLite/distantes et évolution du mode de chaque base |
| `.promethee/manifest.json` | Profil, options, versions, provenance, empreintes, étapes et adaptations d'installation |
| `.promethee/local-services.json` | Association des bases natives aux services/instances du poste, hors Git, sans secrets ; format à préparer |

L'approche de mapping est intégrée aux gabarits de Prométhée. Aucun mapper tiers obligatoire.

À la création, cartographier uniquement le squelette existant. Ensuite, l'agent consulte la carte pertinente, vérifie les chemins dans le code et élargit la recherche si la modification traverse plusieurs zones. Il met à jour les cartes affectées ; aucune relecture générale ou réécriture de toutes les cartes pour une petite correction.

Un fait a une référence principale. Éviter de recopier schémas, API, historique ou conventions dans plusieurs documents. Les documents décrivent l'état courant, pas le transcript de la conversation. Les cartes sont des repères ; le code reste vérifié avant modification.

## 7 Démarrage et évolution avec Codex

- Projet cadré : lire le brief disponible et demander uniquement les informations manquantes.
- Projet non cadré : questions progressives sur besoin, utilisateurs, MVP, priorités et contraintes, quel que soit le profil.
- Enregistrer les décisions actées et garder les questions ouvertes visibles.
- Clarifier Docker et vérifier l'état des outils/services préparés par Prométhée avant de développer. Lire leurs commandes d'activation et les étapes restantes ; ne pas refaire une installation encore valide.
- Lorsque le mode d'une base change, actualiser déclaration, commandes, règles et cartes. Une base conteneurisée n'est plus contrôlée comme service natif ; Prométhée n'exécute aucune commande Docker/Compose. La décision Docker globale ne remplace pas le mode propre à chaque base.
- Modifier `AGENTS.md` lorsque les commandes, règles, architecture ou modes d'exécution changent ; détails conditionnels dans les guides/cartes.
- La mise à jour des skills par Prométhée ne remplace pas les décisions locales dans `AGENTS.md`, `PROJECT.md` ou les cartes.
- Le CLI remet un message de démarrage. L'utilisateur lance son Codex ; aucun agent ou service IA n'est lancé implicitement.

## 8 Git

- Git activé par défaut, désactivable dans le récapitulatif. Nouveau dépôt : branche `main`. Dépôt déjà présent dans un dossier par ailleurs admissible : respecter sa branche, son historique et sa configuration.
- Versionner code, lockfiles, règles, documents, cartes, skills et manifeste. Exclure dépendances, builds, secrets, bases locales, sauvegardes et fichiers temporaires.
- Premier commit après installation complète et vérifiée : `chore(init): initialiser le projet avec Prométhée`.
- Git absent et activé : tenter son installation par le parcours qualifié. Installation bloquée, identité ou signature indisponible : préserver le projet, signaler l'étape restante ; aucune identité inventée ni configuration globale Git modifiée.
- L'agent effectue des commits locaux après une unité cohérente, terminée et vérifiée. Il inspecte le diff, conserve les changements utilisateur et stage seulement les fichiers ou portions de sa tâche.
- Si des modifications utilisateur sont indissociables, laisser les changements non commités et expliquer.
- Messages : `type(scope): description courte et concrète`, types `feat`, `fix`, `refactor`, `docs`, `test`, `perf`, `chore`, `ci`, en respectant la convention déjà présente.
- Préférer rebase et fast-forward. Merge seulement sur demande explicite ou contrainte documentée. Réécriture de commits partagés/publiés, amend ou force push : demande explicite nécessaire.
- **Push uniquement sur demande explicite de l'utilisateur.** Aucun remote GitHub créé implicitement.

## 9 Reprise et mises à jour

### Création interrompue

Le manifeste suit les étapes réussies, en cours, échouées et restantes. Une relance reconnaît un projet incomplet, offre de reprendre, vérifie les étapes déjà réalisées et réessaie les opérations manquantes. Préserver les modifications locales et expliquer les conflits. Annuler conserve le dossier ; aucun effacement automatique.

Refuser la création dans un dossier non vide sans manifeste Prométhée. Un dossier contenant uniquement `.git` peut être traité comme dépôt initialisé si aucun fichier suivi ou travail préexistant ne risque d'être remplacé ; sinon appliquer le refus et réserver l'adoption à une version future. Cette précision résout la coexistence des règles « respecter Git existant » et « pas d'adoption MVP ».

### Skills

Chaque release du CLI porte un catalogue revu et figé. Les projets existants choisissent explicitement leurs mises à jour. Comparer les fichiers locaux à la copie effectivement installée, adaptations comprises, pas au seul upstream.

- Copie intacte : appliquer la mise à jour sélectionnée.
- Copie modifiée : conserver par défaut ; remplacement possible seulement après choix explicite et sauvegarde complète réussie.
- Sauvegarder dans `.promethee/backups/`, hors découverte des skills et hors Git.
- Conserver la version réellement présente et les mises à jour reportées dans le manifeste.
- Fusion manuelle des instructions pour le MVP ; pas de fusion automatique qui pourrait changer leur sens.

### Intégrité des opérations

Précisions techniques de préparation : fichiers du projet limités au dossier cible ; outils installés par leurs parcours habituels aux emplacements déclarés et opérations système prévues dans le plan, cache utilisateur séparé. Contrôler liens/symlinks avant écriture et refuser les chemins d'archive sortant de leur dossier d'extraction. Écrire le suivi atomiquement ; copier un nouveau skill dans un emplacement temporaire puis remplacer après contrôles. Préserver les données et outils existants, y compris lors d'une annulation.

## 10 Conditions de recette

Les scénarios couvrent installation de l'archive, terminal, chaque profil, cohérence des documents, sélection des skills, reprise, mises à jour personnalisées, traçabilité et politique Git. Les vérifications natives mobile, Electron avec base locale et hébergement PHP exigent les environnements appropriés.

Une release ne peut être déclarée prête tant que les scénarios bloquants applicables ne passent pas et que les entrées distribuées ne sont pas qualifiées. Résoudre un manifeste npm ne prouve pas un démarrage natif ; un test de template ne prouve pas le fonctionnement du CLI à venir.

## 11 Décisions restantes avant publication

Le périmètre fonctionnel est validé. Préparation restante : qualifier distribution autonome et recettes d'installation OS/architecture, modes des services de base, cibles mobiles et interpréteurs des skills ; étendre le suivi aux outils/services ; terminer les adaptations et licences du catalogue, dont les nouveaux rôles visuels et GSAP. Puis produire le CLI, terminer les vérifications d'exécution et valider la distribution réellement construite. Le [contrat de bootstrap](BOOTSTRAP.md) distingue ces besoins des contrôles déjà obtenus.

La licence du code propre de Prométhée n'a pas été choisie. Le dépôt reste privé ; ne pas lui attribuer automatiquement la licence d'un skill tiers. Les fichiers tiers livrés conservent leurs licences respectives.

## Sources de référence

- [Skills Codex et chargement progressif](https://learn.chatgpt.com/docs/build-skills)
- [React](https://react.dev/learn), [Vite](https://vite.dev/guide/), [Tailwind](https://tailwindcss.com/docs), [shadcn pour Vite](https://ui.shadcn.com/docs/installation/vite)
- [NestJS et base de données](https://docs.nestjs.com/techniques/database), [tests Vitest/SWC](https://docs.nestjs.com/recipes/swc)
- [Laravel 13 et support PHP](https://laravel.com/framework/docs/13.x/releases), [déploiement](https://laravel.com/framework/docs/13.x/deployment)
- [Electron sécurité](https://www.electronjs.org/docs/latest/tutorial/security)
- [Expo SDK](https://docs.expo.dev/versions/latest/), [NativeWind stable](https://www.nativewind.dev/docs/getting-started/installation)

Les choix de produit et d'architecture ci-dessus viennent de la conversation. Les liens appuient les comportements et compatibilités techniques ; ils ne constituent pas une approbation externe de Prométhée.

## Ressources V0.2

Préparation 0.2.0, manifeste schemaVersion 2. Les options générées distinguent uiAnimations et editorialAnimations. Suivi toolchain/databases par sélection et par base ; schémas locaux séparés pour outils/services. [État et limites](A-TERMINER.md). Les commandes, adaptateurs et transitions du futur CLI sont à implémenter : aucun schéma ne les exécute.
