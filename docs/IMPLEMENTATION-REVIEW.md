# Revue d'implémentation Prométhée V0.2

Revue du 6 octobre 2026. Le dossier de préparation et ses preuves antérieures sont conservés ; les nouveaux contrôles du CLI doivent être distingués de ces preuves.

## Ressources et limites de qualification

Le catalogue comprend 19 copies adaptées qualifiées statiquement et trois entrées suspendues : Vercel React Best Practices, Vercel Composition Patterns et Motion AI Kit. Les trois entrées suspendues ne doivent jamais être installées ou incorporées à une archive. Le statut du skill Motion AI Kit ne concerne pas à lui seul la licence de la bibliothèque Motion.

Le contrôle des ressources vérifie les révisions Git figées, chaque taille et SHA-256 de fichier, les arbres de fichiers, la provenance, les notices d'adaptation, les licences complètes, le routage et les profils. Il refuse les fichiers ajoutés, retirés ou modifiés dans un skill, les liens symboliques, les chemins sortant du dossier et les copies non qualifiées. Il valide aussi les schémas locaux et les exemples de manifeste avec JSON Schema draft 7.

Ce contrôle ne constitue pas un audit juridique, un audit de sécurité exhaustif, une preuve d'accessibilité, ni un essai de déclenchement des skills par Codex. Un lockfile résolu ne prouve pas la compilation d'un module natif ou le fonctionnement d'une base de données.

Deux incohérences héritées ont été corrigées dans les profils du verrouillage : `mobile-backend` est devenu le profil canonique `mobile` pour le skill PostgreSQL, limité dans la sélection au backend nouvellement créé ; le skill sécurité couvre les profils JS/TS déclarés par son routage. Les limites spécialisées de ce dernier restent explicites et les arbres de fichiers concernés sont inchangés.

GSAP éditorial et Android local restent dépendants de qualifications distinctes dans les ressources de préparation : version et lockfiles pour GSAP, expo-dev-client/JDK/SDK/build tools et essais appareils pour Android. Une option non qualifiée doit être expliquée et rester bloquée à l'installation, sans être masquée par un succès de génération documentaire.

## Contrôles nouveaux

Les tests de ressources couvrent : arbre conforme, modification du contenu d'un skill, copie d'une entrée suspendue, ajout d'un fichier non suivi, suppression de licence, tentative de traversée de chemin, désaccord de provenance/routage et absence ou mauvaise version du runtime privé. Sept tests ont passé dans l'environnement Windows de développement avec Node 24.13.1, sans installation globale ni service lancé.

La vérification complète du catalogue actuel a passé : 19 arbres de skills, 265 fichiers contrôlés, trois copies suspendues absentes, schémas et exemples de manifeste conformes. Le runtime Windows officiel Node 24.21.0 déjà conservé dans le cache de préparation a passé le contrôle de version, plateforme et architecture. Son archive correspond au SHA-256 déjà relevé auprès de la source officielle ; l'archive et les fichiers ne sont pas substitués par le runtime de développement.

Les tests du moteur de génération, de navigation, de reprise, des services et du système sont à relever dans l'exécution de la suite du CLI. Un test isolé avec un adaptateur simulé n'est pas une recette de l'installateur natif correspondant.

## Construction des distributions

`scripts/package-distribution.mjs` utilise Node et Python 3 pour construire des archives reproductibles. Python est uniquement un outil de construction des archives, pas un prérequis ajouté par ce script au lancement du CLI. Le runtime Node privé est fourni explicitement ; les scripts ne le téléchargent pas et ne l'installent pas globalement.

Exemple de construction Windows depuis le dossier du projet, après compilation et vérification des ressources :

```text
node scripts/package-distribution.mjs --platform windows --runtime-dir CHEMIN_RUNTIME_EXTRAIT --runtime-version 24.21.0 --runtime-archive CHEMIN/node-v24.21.0-win-x64.zip --runtime-archive-sha256 SHA256_OFFICIEL --python CHEMIN_PYTHON
```

Pour Ubuntu, utiliser `--platform ubuntu` avec `node-v24.21.0-linux-x64.tar.xz` et le dossier officiel extrait contenant `bin/node` et `LICENSE`. Une préparation sur Windows est possible : l'archive officielle contrôlée sert à vérifier les octets du runtime Linux, dont l'exécution est alors explicitement enregistrée comme non testée. Une archive Ubuntu construite sur Windows doit encore être exécutée sur Ubuntu 24.04 et WSL déjà installé pour leur recette.

Les paramètres optionnels sont `--root`, `--build-dir` (par défaut `dist/src`), `--entry` (par défaut `main.js`), `--output-dir` (par défaut `releases`), `--overwrite` et `--development`. Le mode développement autorise une version Node 24 différente de la référence ; il ne transforme pas cette version en référence qualifiée. Une construction normale exige la référence exacte du catalogue et l'archive officielle correspondant à la plateforme/version, avec son SHA-256.

Les archives incluent le CLI compilé, les ressources nécessaires, les dépendances de production et leurs licences, le lanceur de la plateforme, le binaire Node privé et la licence Node complète. npm et Corepack ne sont pas ajoutés au runtime privé. Les tests et dépendances de développement ne font pas partie de la distribution. Les lanceurs ne doivent pas changer `PATH` : ce runtime sert uniquement à Prométhée, et ne satisfait pas le contrôle du Node requis par les projets créés.

Les octets des archives sont relus et comparés aux fichiers incorporés. Les métadonnées d'archive sont fixées, les chemins triés, et une somme SHA-256 de l'archive est produite. `DISTRIBUTION.json` décrit le runtime réellement incorporé, sa vérification et les qualifications restant ouvertes. Les archives portent le suffixe `preview` tant que la recette complète n'est pas acquise.

## Recette restant nécessaire

- Installation/reprise sur Windows 11 maintenu, Ubuntu 24.04 et WSL existant, x64 ; outils absents, présents compatibles, incompatibles et impossibles à identifier.
- Annulation, dossier non vide, chemin Unicode ou avec espaces, jonction/lien, refus de permissions, perte d'accès et reprise après un échec.
- Bases natives et leurs identités locales : démarrage explicite, partage d'instance, changement de mode et absence de commande Docker dans la gestion des services.
- Construction Electron, reconstruction SQLite native lorsqu'elle est sélectionnée, Android local sur USB et émulateur ; absence de promesse de compilation iOS sur Windows/Ubuntu.
- Désélection des skills, absence de routage vers un skill non installé, critique sans refonte implicite et cohérence de la variante native d'Impeccable.
- Archives exécutées sur chaque plateforme, commandes accessibles dans un nouveau terminal, runtime privé absent du `PATH`, licence du code Prométhée choisie avant publication publique.

Aucune publication GitHub, aucun push et aucun démarrage automatique au démarrage de la machine ne découlent de cette revue.

## Exécution du CLI — 6 octobre 2026

TypeScript, 59 tests : 58 réussis et un ignoré (création de lien fichier refusée par Windows sans élévation). Couverture : sélection, intégrité, destinations/jonctions, matrices, états/reprise, lecture CLI JSON, cache/approbation simulés, arguments CMD et lookup npm/Python, identité et exclusion Docker des services, mise à jour avec sauvegarde et preuves de vérification réutilisées. L’inspection Git refuse les index ou historiques présents sans altérer leurs métadonnées ; une source dans un dossier imbriqué nommé docs/build/dist invalide bien la preuve ; des outils incompatibles arrêtent l’installation avant modification du manifeste. Aucun installer système, service réel, compilation Android/iOS ou application Electron lancé.

Le menu et le pixel art ont été ouverts dans un terminal Windows puis annulés. Le lanceur parent et les commandes aide/version fonctionnent avec le runtime privé 24.21.0. Diagnostic réel initial, avant l’adaptation de compatibilité ci-dessous : Windows x64 reconnu, Node habituel 24.13.1 incompatible avec les locks alors livrés (minimum 24.21), npm 11.8/Git 2.45/Python 3.12 compatibles. Aucun remplacement ou contournement du Node habituel.

Les archives officielles Windows et Linux Node24.21 sont vérifiées par SHA256 ; leur binaire et LICENSE sont comparés byte à byte lors de l’empaquetage. L’exécution Linux/Ubuntu/WSL demeure non testée. Les archives restent nommées preview et ne représentent pas une release entièrement qualifiée.

L’audit npm a signalé une vulnérabilité modérée sur Ajv 8.17.1 ; le validateur du CLI est passé à 8.20.0, avec le lockfile mis à jour. L’audit du CLI, dépendances de développement incluses, ne signale plus de vulnérabilité connue à cette date. Les tests et la vérification des schémas ont été relancés après ce changement. Cela ne constitue pas un audit des applications que l’utilisateur développera.

## Adaptation de la compatibilité Node — 6 octobre 2026

Le minimum uniforme Node 24.21.0 du socle est remplacé par les exigences propres aux profils et aux options sélectionnées. Node 24.21.0 reste la référence du runtime privé du CLI ; cette référence ne fixe pas à elle seule le minimum du Node utilisé par un projet. Les contrôles conservent la branche Node 24 et les exigences réelles des dépendances verrouillées.

Pour les interfaces web et bureau, `jsdom` passe de 30.1.2 à 29.1.1, sous licence MIT, afin de retenir une version compatible avec Node 24.13.1. Les déclarations de versions dans les gabarits et les lockfiles sont adaptées ensemble. Les minima déclarés sont Node 24.0 pour le frontend web et le frontend PHP, 24.12 pour le bureau, 24.11 pour l’API et 24.3 pour le mobile. Le minimum bureau tient compte des dépendances optionnelles Linux ; un backend mobile nouvellement créé ajoute les exigences du socle API. La vérification de tous les contrats `engines` présents dans les locks web et bureau accepte Node 24.13.1 ; leurs audits npm ne signalent aucune vulnérabilité connue à cette date.

Validation réalisée sur Windows avec le Node habituel 24.13.1 et npm 11.8.0, sans remplacement des outils :

- Suite du CLI : 67 tests, 66 réussis et un ignoré pour la restriction Windows sur les liens de fichiers. Compilation TypeScript, format et intégrité des 19 skills vérifiés.
- La sélection web montrée par l’utilisateur, avec ses dix skills et Git activé, passe le précontrôle réel : Node, npm, Git et Python compatibles, aucune installation d’outil nécessaire.
- Web et API : installation npm stricte, typecheck, lint et build réussis dans des projets générés isolés. Deux tests React/jsdom vérifient le rendu accessible et les interactions clavier ; l’API compilée répond correctement à `/api/health`.
- Bureau : installation npm stricte, typecheck, lint, build Electron et les deux tests d’interface réussis. L’application Electron n’a pas été ouverte.
- Mobile Expo Go : installation npm stricte, typecheck et lint réussis. Aucun téléphone, émulateur ou build Android/iOS exécuté.
- Assets PHP : installation npm stricte et build Vite réussis ; PHP, Composer et Laravel complet n’ont pas été exécutés.

Les installations npm du CLI imposent désormais `--engine-strict`, y compris lorsqu’une option actualise le lockfile. Le précontrôle ajoute les exigences Node des métadonnées des dépendances optionnelles réellement choisies ; leur arbre transitif résolu reste soumis au contrôle npm. Les caches TypeScript `.tsbuildinfo` générés à la racine d’une cible sont exclus de l’empreinte des sources et de Git pour éviter un faux échec après compilation ; des fichiers de même nom utilisés dans un sous-dossier source continuent à invalider la preuve lorsqu’ils changent.

Le test Vitest de l’API n’a pas pu être lancé dans cet environnement : le chargeur natif SWC refuse les droits ou propriétaires des caches Windows disponibles. Le contrôle HTTP a donc exécuté le JavaScript compilé avec Node 24.13.1. Les contrôles de confiance des caches n’ont pas été désactivés ; le comportement du chargeur est décrit dans le [guide officiel SWC](https://github.com/swc-project/swc/blob/main/docs/native-addon-carriers.md).

Aucun contrôle ne contourne les contraintes `engines` des dépendances, et aucun remplacement automatique du Node installé n’est introduit. Les preuves détaillées restent dans les dossiers de validation locaux ; Ubuntu et les recettes natives conservent leur qualification en attente.
