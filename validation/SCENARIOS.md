# Scénarios de validation de Prométhée

Ce plan définit la recette du CLI à développer et la qualification de ses ressources. Un scénario décrit un résultat observable, pas seulement une correspondance de texte. Les vérifications déjà réalisées sont dans RESULTATS.md ; les scénarios CLI ci-dessous sont à exécuter quand son implémentation et son archive existent.

## Environnements

Exécuter le parcours complet sur les bases x64 retenues : Windows 11 encore maintenu dans CMD et PowerShell, Ubuntu 24.04 LTS natif et sous WSL déjà installé. Consigner version/build Windows, mises à jour Ubuntu et configuration WSL de chaque preuve. D'autres versions d'OS requièrent une qualification avant ajout au support annoncé. Vérifier un dossier avec espaces et accents. Tester une machine équipée et une machine vierge des outils de développement : Prométhée doit préparer les outils manquants selon le profil. Les installations système se testent dans des machines de recette isolées, avec comptes et privilèges représentatifs ; ne pas préinstaller manuellement un runtime pour masquer un échec du bootstrap.

Les fixtures et remotes Git de test sont isolés, sans données privées. Tester les mises à jour sur des copies préparées et conserver les différences pour pouvoir constater la protection des modifications utilisateur.

## Distribution et terminal

| ID | Situation et action | Résultat attendu | Bloquant |
| --- | --- | --- | --- |
| DIST-01 | Extraire ZIP Windows / tar.gz Ubuntu privés et lancer depuis un dossier extérieur, sans Node installé | `promethee.cmd` fonctionne dans CMD/PowerShell, `promethee` sur Ubuntu ; menu lancé avec runtime privé et ressources trouvées sans dépendre du dossier source | Oui |
| DIST-02 | Lancer la distribution, bloquer les dépôts de skills GitHub et créer avec les sources d'outils/registres nécessaires accessibles | Skills copiés depuis la release sans recherche GitHub ; seuls les téléchargements techniques prévus sont effectués | Oui |
| DIST-03 | Afficher le menu en terminal couleur, sans couleur et avec capacité Unicode limitée | Main lisible, repli ASCII ; aucun code ANSI brut en mode sans couleur | Oui |
| DIST-04 | Utiliser nom et dossier avec espaces/accents ; entrer un nom de package invalide | Chemins corrects, identifiant normalisé ou erreur ciblée, aucune substitution de commande | Oui |
| DIST-05 | Lancer le CLI avec Node compatible, absent puis incompatible sur la machine | Runtime privé lance toujours menu/diagnostics ; Node habituel compatible réutilisé pour le projet, absent installé normalement, incompatible bloquant avant opérations | Oui |
| DIST-06 | Examiner commandes/PATH et provenance du runtime après extraction/lancement | Runtime privé non ajouté au PATH, installation Node habituelle conservée ; détection des outils du projet indépendante du runtime CLI ; licences et intégrité conservées | Oui |

## Navigation et état du projet

Le [contrat de navigation](../NAVIGATION.md) doit être testé avec le navigateur et l'écran d'état du CLI réellement implémentés.

| ID | Situation et action | Résultat attendu | Bloquant |
| --- | --- | --- | --- |
| NAV-01 | Lancer Prométhée depuis son dossier de distribution ou un dossier sans rapport, puis créer | Dossier de départ visible ; choix explicite du parent et chemin final affiché, aucun projet installé implicitement dans le dossier du CLI/courant | Oui |
| NAV-02 | Naviguer entre lecteurs Windows, parents/sous-dossiers Ubuntu et montages déjà accessibles | Navigation clavier cohérente ; aucune indexation récursive, élévation ou montage/installation WSL implicite | Oui |
| NAV-03 | Coller chemins absolus/relatifs, espaces, accents et caractères spéciaux | Résolution contre le dossier affiché, chemin absolu correct ; saisie traitée littéralement, aucune exécution shell | Oui |
| NAV-04 | Modifier parent ou nom de dossier au récapitulatif | Chemin final recalculé et utilisé pour toutes les étapes ; aucun ancien emplacement conservé pour l'installation | Oui |
| NAV-05 | Annuler pendant navigation ou avant « Installer » | Aucun dossier projet créé, dépendance téléchargée ou outil installé ; fichiers existants préservés | Oui |
| NAV-06 | Choisir cible non admissible/inaccessible ou perdre accès au volume avant installation | Erreur ciblée avant opérations ; aucun repli vers autre dossier et aucun écrasement | Oui |
| NAV-07 | Naviguer via lien/jonction, puis remplacer sa cible avant les écritures | Destination physique visible avant validation ; changement détecté, opération bloquée sans écriture inattendue | Oui |
| NAV-08 | Consulter projet suivi terminé/incomplet, puis dossier non suivi ou manifeste non pris en charge | États enregistrés et vérifiés distingués ; reprise distincte si admissible, autres dossiers inchangés sans adoption | Oui |
| NAV-09 | Passer du projet A au projet B, puis gérer services ou skills | Racine B affichée et utilisée ; aucun état/action/association du projet A réutilisé par erreur | Oui |
| NAV-10 | Ouvrir seulement l'état d'un projet avec base Docker, scripts et remotes instrumentés | Aucun build, test, installation, mise à jour, commit, démarrage de service ou appel Docker ; aucun statut de conteneur inventé | Oui |

## Bootstrap des outils et services

Appliquer le [contrat d'installation](../BOOTSTRAP.md) aux combinaisons OS/architecture réellement annoncées. Le schéma de suivi des outils/services et le lock des recettes sont à préparer avant exécution de ces scénarios.

| ID | Situation et action | Résultat attendu | Bloquant |
| --- | --- | --- | --- |
| BOOT-01 | Poste vierge : créer chaque profil proposé | Runtimes et outils nécessaires téléchargés/installés ; dépendances et services du profil prêts, aucun renvoi générique vers une installation manuelle | Oui |
| BOOT-02 | Outils compatibles déjà présents ; puis outil requis présent dans une version incompatible et autres outils absents | Réutilisation du compatible dans le premier cas ; arrêt préalable dans le second, sans installer les absents ni remplacer/ajouter une version parallèle ; diagnostic et code de sortie d'échec | Oui |
| BOOT-03 | Windows sans WinGet ; Ubuntu avec versions de paquets variables | Recette native qualifiée disponible ou limitation de plateforme explicite ; aucun recours à WSL pour installer sous Windows | Oui |
| BOOT-04 | Refuser l'élévation, interrompre une installation ou simuler un redémarrage requis | État incomplet précis, projet préservé ; reprise ciblée après résolution, pas de faux succès | Oui |
| BOOT-05 | Corrompre une archive ou couper le réseau pendant téléchargement d'un outil | Intégrité/erreur détectée avant exécution ; reprise sans supprimer les étapes valides | Oui |
| BOOT-06 | Sélectionner PostgreSQL/MySQL sans instance ; ensuite avec instance compatible existante et conflit de port | Instance dédiée ou connexion choisie, base/compte de développement, SQL vérifié ; données et comptes existants préservés | Oui |
| BOOT-07 | Fermer l'installateur, ouvrir nouveau CMD/PowerShell/terminal Ubuntu puis utiliser Codex | Outils retenus accessibles par le parcours documenté ; commandes de démarrage et qualité fonctionnelles | Oui |
| BOOT-08 | Sélectionner UI UX Pro Max sur machine sans Python ; désélectionner le skill dans une autre fixture | Interpréteur nécessaire préparé et recherche locale fonctionnelle ; outil non requis non ajouté par effet de bord | Oui |
| BOOT-09 | Installer Electron et l'option SQLite dans une machine vierge | Binaire téléchargé, fenêtre ouverte ; module SQLite compatible, outils de compilation ajoutés seulement si nécessaires | Oui si profil/option |
| BOOT-10 | Mobile : choisir Expo Go, puis Android local avec téléphone USB ou émulateur | Parcours et cible enregistrés ; outils adaptés, première compilation/lancement Android local ; aucune compilation iOS locale annoncée sous Windows/Ubuntu | Oui si cible |
| BOOT-11 | Créer les profils sans Docker et sans WSL ; comparer les opérations système | Aucun téléchargement/installation de Docker ou WSL ; démarrage natif du profil possible | Oui |
| BOOT-12 | Examiner manifeste, journaux, guide d'activation, annuler puis reprendre | Versions, provenance et états exacts ; secrets absents de Git/journaux, outils partagés et données conservés | Oui |
| BOOT-13 | Vérifier la détection des hôtes Windows/Linux x64 ; simuler ARM ou 32 bits, y compris processus traduit/émulé | Seuls les hôtes x64 utilisent les recettes MVP ; architecture non prise en charge signalée avant téléchargement/installation, aucun outil existant modifié | Oui |
| BOOT-14 | Vérifier les bases Windows 11 maintenu/Ubuntu 24.04 LTS ; simuler version d'OS hors qualification | Recette correspondant à l'OS/version qualifiés ; autre environnement signalé avant opération système, aucune mise à niveau d'OS implicite | Oui |
| BOOT-15 | Outil requis trop ancien, trop récent ou dont la version ne peut pas être déterminée ; outil incompatible non requis dans une autre fixture | Cas requis bloquants avec diagnostic adapté avant installation/création ; outil non requis sans effet sur le profil choisi | Oui |
| BOOT-16 | Après blocage, activer une version compatible et relancer ; introduire un conflit lors d'une reprise de projet interrompu | Contrôle préalable réexécuté ; création/reprise possible une fois compatible, fichiers et succès antérieurs conservés en cas de nouveau blocage | Oui |
| BOOT-17 | Recréer un projet avec les archives déjà en cache, puis altérer une archive | Téléchargement technique valide réutilisé ; archive corrompue refusée avant exécution et récupérée à nouveau ; règles de compatibilité toujours appliquées | Oui |

## Services de base à la demande

Le [contrat services](../SERVICES.md) se teste avec adaptateurs et suivi réellement implémentés. Les commandes mentionnées sont des interfaces à développer.

| ID | Situation et action | Résultat attendu | Bloquant |
| --- | --- | --- | --- |
| SERVICE-01 | Préparer une nouvelle base native, redémarrer le poste puis ouvrir le menu services du projet | Aucun démarrage au boot activé par Prométhée ; association trouvée, démarrage explicite et disponibilité vérifiée | Oui |
| SERVICE-02 | Démarrer une base déjà active, puis fermer Prométhée | État correct, aucun redémarrage superflu ; fermeture du CLI sans arrêt de la base | Oui |
| SERVICE-03 | Réutiliser un serveur compatible existant avec réglages de démarrage définis | Réglages conservés ; seules actions explicites sur la cible associée ; aucune reconfiguration globale | Oui |
| SERVICE-04 | Demander un arrêt sur un serveur identifié partagé entre plusieurs projets | Portée partagée visible avant action explicite ; aucune prétendue isolation par base/compte, aucun arrêt global ou suppression de données | Oui |
| SERVICE-05 | Refuser les droits système, altérer la cible locale ou détecter une version incompatible | Diagnostic, échec exact et données conservées ; aucun contournement ou action sur un autre service | Oui |
| SERVICE-06 | Base déclarée Docker/Compose, commandes Docker instrumentées dans une fixture | Aucun moteur natif installé pour ce besoin ; aucun appel Docker/Compose, démarrage/arrêt de daemon ou conteneur | Oui |
| SERVICE-07 | Dockeriser une base auparavant native, puis gérer les services ; essayer une API Docker avec autre base native | Base passée en Docker retirée des actions natives malgré association ancienne ; autre base native encore gérable ; anciennes données/instance préservées | Oui |
| SERVICE-08 | Projet SQLite, base distante ou aucune base ; puis plusieurs bases de modes différents | Aucun service serveur local inutile ; gestion limitée aux associations natives effectives, par base | Oui |
| SERVICE-09 | Ouvrir le projet sur un autre poste sans association locale ; reprendre avec association préparée | Pas de découverte/commande générale ; association manquante expliquée, parcours qualifié nécessaire ; fichier local exclu de Git et sans secrets | Oui |

## Création et profils

| ID | Situation et action | Résultat attendu | Bloquant |
| --- | --- | --- | --- |
| CREATE-01 | Choisir chaque profil sans option | Squelette conforme, seules dépendances et skills pertinents ; aucune fonctionnalité métier ajoutée | Oui |
| CREATE-02 | Modifier des choix dans le récapitulatif avant installation | Le projet reflète les derniers choix ; aucune ancienne présélection copiée par erreur | Oui |
| CREATE-03 | Désélectionner un skill proposé | Pas de dossier de ce skill ni de référence obligatoire dans le routage | Oui |
| CREATE-04 | Tenter de sélectionner une entrée suspendue pour licence/qualification | Entrée indisponible ou erreur explicite ; aucune copie de source non qualifiée | Oui |
| CREATE-05 | Créer dans un dossier non vide sans manifeste | Refus lisible ; inventaire et contenu existants inchangés | Oui |
| CREATE-06 | Créer dans un dépôt initialisé admissible ; essayer un dépôt avec travail préexistant | Respect de branche/config dans le premier cas ; refus de l'adoption dans le second | Oui |
| WEB-01 | Installer React/API, construire et lancer ; ouvrir page et `/api/health` | Interface et API fonctionnelles, proxy local correct, TypeScript et analyse passent | Oui |
| WEB-02 | Définir une base PostgreSQL de test, créer une migration technique temporaire et la révoquer | Driver et TypeORM fonctionnels, schéma suivi par migration, aucun synchronize en production | Oui |
| PHP-01 | Installer Laravel, préparer environnement local, construire assets et ouvrir `/` | Vue Blade servie, styles/Alpine chargés, aucun schéma métier requis pour la page initiale | Oui |
| PHP-02 | Ajouter Livewire, interagir avec un composant temporaire de test | Mise à jour serveur correcte, validation/autorisation vérifiées, une seule instance Alpine | Oui si option |
| PHP-03 | Déployer sur environnement PHP mutualisé de référence compatible | `public` correctement exposé, secrets inaccessibles, assets présents, droits et exécution documentés | Oui |
| DESKTOP-01 | Construire puis lancer Electron | Main/preload/renderer fonctionnent ; renderer sans Node, sandbox/contextIsolation actifs | Oui |
| DESKTOP-02 | Essayer popup, navigation non prévue et demande de permission | Refus conforme ; aucun pont IPC générique ou accès système arbitraire | Oui |
| DESKTOP-03 | Option SQLite : rebuild ABI Electron, ouverture base temporaire et migration aller/retour | Module natif compatible ; base côté main, située hors du bundle ; données conservées au redémarrage | Oui si option |
| MOBILE-01 | Installer Expo, vérifier la matrice SDK, exporter JS Android puis ouvrir sur appareil/émulateur | Routes, styles NativeWind et zones sûres fonctionnent ; aucune version native latest incompatible | Oui |
| MOBILE-02 | Option SQLite : lire/écrire une base de test puis redémarrer | Persistance locale opérationnelle ; pas de synchronisation ajoutée implicitement | Oui si option |
| MOBILE-03 | Option backend : appeler l'API depuis appareil/émulateur | Adresse et exposition locale adaptées, erreurs traitées ; aucun secret EXPO_PUBLIC_* | Oui si option |
| MOBILE-04 | Passer du parcours Expo Go à Android local, avec modifications utilisateur présentes | Projet conservé ; outils et dev client ajoutés, commandes/AGENTS/matrices actualisés ; compilation et lancement sur la cible choisie | Oui |
| MOBILE-05 | Modifier seulement du JS/TS, puis ajouter une dépendance native compatible | Serveur de développement utilisé pour JS/TS ; reconstruction après changement natif, état réellement vérifié | Oui |
| MOBILE-06 | Régénérer une configuration native après personnalisation locale ; proposer un émulateur incompatible avec la machine | Personnalisations préservées ; limitation de cible explicite, aucun changement silencieux ou faux démarrage | Oui |
| MOTION-01 | Choisir animations UI, créer une interaction de test et activer reduced motion | Motion ou Reanimated selon profil, interruption et réduction correctes ; GPT Taste non imposé | Oui si option |
| MOTION-02 | Choisir animation éditoriale avancée web après qualification | GSAP et GPT Taste adapté présents ; matrices/AGENTS cohérents, aucune simulation de preuve ou animation globale obligatoire | Oui si option |

## Reprise et protection des fichiers

| ID | Situation et action | Résultat attendu | Bloquant |
| --- | --- | --- | --- |
| RESUME-01 | Interrompre après création du squelette puis relancer | Étapes existantes reconnues, seules opérations manquantes reprises, pas de duplication | Oui |
| RESUME-02 | Couper l'accès registre pendant installation npm/Composer | Échec identifié, succès précédents conservés ; reprise possible après rétablissement | Oui |
| RESUME-03 | Modifier un fichier généré avant reprise | Modification conservée ; conflit expliqué avant remplacement | Oui |
| RESUME-04 | Annuler pendant création | Dossier conservé et état intelligible, aucune suppression automatique | Oui |
| UPDATE-01 | Mettre à jour un skill intact sélectionné | Version choisie installée avec ressources/licences ; empreintes et manifeste cohérents | Oui |
| UPDATE-02 | Modifier, ajouter et supprimer des fichiers d'un skill avant mise à jour | Tous les écarts détectés ; conservation locale proposée par défaut | Oui |
| UPDATE-03 | Demander remplacement d'un skill modifié | Sauvegarde complète réussie hors `.agents/skills` avant remplacement ; copie retrouvable | Oui |
| UPDATE-04 | Provoquer une erreur de sauvegarde ou une interruption de copie | Ancienne copie utilisable conservée, pas de moitié de version présentée comme installée | Oui |
| UPDATE-05 | Conserver une personnalisation et reporter une mise à jour | Ancienne version et choix reporté enregistrés ; règles et cartes du projet inchangées | Oui |
| FS-01 | Introduire un lien redirigeant vers l'extérieur ou un chemin d'archive avec `..` | Aucune écriture générée hors du projet ou de l'emplacement déclaré d'un outil ; erreur ciblée | Oui |

## Contexte et comportement de Codex

Évaluer ces scénarios avec des demandes réalistes et les fichiers du projet. Examiner changements, fichiers consultés et commandes, sans mesurer un quota de tokens pour cette version.

| ID | Demande de test | Résultat attendu | Bloquant |
| --- | --- | --- | --- |
| AGENT-01 | Projet déjà cadré, demander la première fonctionnalité | L'agent reprend le périmètre et demande uniquement ce qui manque, vérifie prérequis et décision Docker | Oui |
| AGENT-02 | Projet non cadré, idée vague | Questions ciblées progressives ; périmètre utile enregistré avant les choix dépendants | Oui |
| AGENT-03 | Ajouter un bouton alors qu'un Button avec variantes existe | Réutilisation ou extension motivée ; absence de duplication concurrente | Oui |
| AGENT-04 | Corriger un petit style dans une zone connue | Lecture ciblée, pas de refonte de l'app ni de chargement général des cartes | Oui |
| AGENT-05 | Fonctionnalité traversant UI/API/données | Consultation et mise à jour des frontières concernées, vérifications élargies selon impact | Oui |
| AGENT-06 | Une source dépasse 300 lignes | Revue des responsabilités ; découpage utile ou exception motivée, pas de morcellement mécanique | Oui |
| AGENT-07 | Ajouter une fonctionnalité normale au projet | Organisation locale cohérente ; pas de submodule, microservice ou package autonome implicite | Oui |
| AGENT-08 | Reprendre après décision de Dockeriser le backend | Documents et commandes reflètent la décision actuelle sans répéter le cadrage résolu | Oui |
| SKILL-01 | Corriger un bug reproduit | Hypothèse/expérience utiles, correction de la cause et vérification ; aucune refonte après trois échecs par règle automatique | Oui |
| SKILL-02 | Annoncer une tâche terminée avec des résultats de vérification encore valables | Preuves proportionnées réutilisées, pas de nouvelle suite complète pour chaque message | Oui |
| SECURITY-01 | Demander un audit JS/TS puis un audit PHP | Références applicables utilisées, limites de couverture explicites ; pas d'expertise PHP attribuée au skill JS | Oui |
| SECURITY-02 | Demander un modèle de menaces avec exposition inconnue | Hypothèses importantes soumises à clarification ; menaces distinguées des vulnérabilités prouvées | Oui |
| SECURITY-03 | Travailler sur une interface Expo | Aucun envoi de feedback/source ni activation de MCP/service payant implicite | Oui |

## Anti-slop : prévention et audit ciblé

Exécuter avec des fixtures réalistes des quatre profils. Évaluer le rendu, les actions et le diff ; ne pas faire de la présence d'un mot dans un document ou d'un score un critère de réussite. Les références web ne constituent pas une validation de composants natifs mobile.

| ID | Demande de test | Résultat attendu | Bloquant |
| --- | --- | --- | --- |
| SLOP-01 | Créer un écran de gestion de rendez-vous avec utilisateurs, données et action principale définis | Hiérarchie et composition adaptées au parcours ; aucun tableau de bord, chiffre ou bloc marketing ajouté seulement pour remplir l'écran | Oui |
| SLOP-02 | Ajouter un bouton dans une interface dont composants et tokens sont présents | Réutilisation et états adaptés ; pas de direction visuelle remplacée, audit global, nouvelle bibliothèque ou couche d'abstraction inutile | Oui |
| SLOP-03 | Demander un audit seul sur une fixture avec témoignage inventé, lien sans destination et faux succès de formulaire | Constats localisés, impact et corrections proposées ; fichiers inchangés, faits non inventés | Oui |
| SLOP-04 | Demander une correction anti-slop sur cette fixture, avec palette et effet visuel intentionnels | Défauts corrigés dans la portée ; faits, ton, tokens et direction conservés ; effet intentionnel examiné sans suppression mécanique | Oui |
| SLOP-05 | Demander explicitement une refonte avec brief et éléments validés | Décisions cohérentes, tokens/composants adaptés ensemble ; conventions de plateforme, interactions, responsive et accessibilité préservés | Oui |
| SLOP-06 | Livrer une liste asynchrone vide, en erreur, puis chargée, sur web et mobile | États compréhensibles et vrais retours d'action ; contrôle clavier web ou natif pertinent, reduced motion si animations ; aucune simulation de succès | Oui |
| SLOP-07 | Désélectionner Stop Design Slop pendant création puis développer une petite UI | Skill absent et aucune référence obligatoire dans la matrice ; politique commune et guide disponibles, audit tiers non imposé | Oui |
| SLOP-08 | Corriger un service backend, puis auditer une UI sans accès au rendu | Backend : aucune référence visuelle chargée. Audit UI : constats limités aux preuves disponibles et vérifications visuelles manquantes annoncées | Oui |

Après adaptation des skills dont les rôles sont validés, ajouter à la recette : une demande de modale ciblant frontend-a11y, une révision documentaire ciblant Humanizer, un diagramme ciblant Diagram Design, une critique ciblant Impeccable et une demande UI courante qui ne déclenche pas GPT Taste. Vérifier le pilote unique, les faits conservés, les descriptions discriminantes et l'absence de références à un skill désélectionné ; ne pas qualifier ces adaptations sur la seule base du présent tableau.

Pour Impeccable, essayer la critique ciblée sur React, Blade, renderer Electron et écran Expo, puis une tâche backend/SQL/main/preload. Vérifier références web/native pertinentes, tokens et direction conservés, rôle technique des skills Expo, absence de moteur/génération payante et absence d'appel visuel pour la tâche non UI. Désélectionner Impeccable doit retirer sa copie et ses références obligatoires ; une critique seule laisse les fichiers inchangés. Ces essais restent à exécuter après adaptation.

## Git et traçabilité

| ID | Situation et action | Résultat attendu | Bloquant |
| --- | --- | --- | --- |
| GIT-01 | Création avec Git activé/désactivé | Branche main et premier commit après succès complet dans le premier cas ; pas d'initialisation dans le second | Oui |
| GIT-02 | Identité ou signature requise manquante | Projet préservé, étape Git signalée ; aucune configuration globale modifiée | Oui |
| GIT-03 | Mélanger changement utilisateur et tâche agent | Seuls changements autorisés commités ; si indissociables, explication et conservation non commitée | Oui |
| GIT-04 | Branches locales divergentes dans une fixture | Rebase privilégié, historique linéaire ; aucun merge implicite ou réécriture de commits partagés | Oui |
| GIT-05 | Aucun push demandé, remote instrumenté de test présent | Aucun appel push ; messages conformes au format retenu | Oui |
| LICENSE-01 | Examiner chaque skill copié et son manifeste | Révision, licence complète, notices, ressources, modifications et empreintes retrouvables | Oui |
| LICENSE-02 | Comparer arbre adapté et baseline effectivement installée | Mise à jour compare les adaptations incluses, pas uniquement le SHA Git amont | Oui |

## Critère de clôture

Chaque scénario applicable possède environnement, date, résultat et preuve. Les scénarios bloquants échoués ou non exécutés empêchent de déclarer le CLI prêt à utiliser. Une option peut être retirée de la release par décision explicite de périmètre ; son échec ne doit pas être caché. Les tests de préparation des ressources ne remplacent pas cette recette du CLI.

## Combinaisons V0.2

Contrôler quatre defaults, quatre sélections étendues, désélection de tous les skills, Expo Go sans cible Android et base Docker sans association native. Vérifier que copie des skills/matrice/AGENTS correspondent, que GPT Taste est rejeté hors éditorial web et que frontend-a11y n'est pas proposé en natif. Les aperçus ne démarrent aucun service. Rejeter les schémas avec chemins de traversée, commande arbitraire de service ou secret ; vérifier séparément relations moteur/mode/IDs lors de l'implémentation.

En session Codex : bouton réutilisé, modale clavier, critique sans écriture, prose avec faits/placeholders protégés, diagramme sans onboarding global, animation choisie sans moteur concurrent, backend sans directeur artistique et écran natif sans recette DOM. Ces essais comportementaux restent à exécuter.
