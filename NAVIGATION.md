# Navigation et choix du projet

Exigence validée le 5 octobre 2026 : l'utilisateur peut parcourir l'arborescence depuis Prométhée pour choisir où créer un projet ou consulter un projet déjà suivi. L'emplacement d'exécution du CLI ne constitue pas une destination d'installation implicite. Ce document définit le parcours du futur CLI ; aucun navigateur de dossiers n'est encore développé.

## Menu et navigateur commun

Le menu principal propose « Créer un projet » et « Voir l'état d'un projet ». Les services et mises à jour de skills utilisent le même choix de projet. `promethee status` est le raccourci de consultation ; si aucun projet n'a été choisi, il ouvre le sélecteur. Un projet détecté dans le dossier courant peut être proposé avec son chemin complet, avec possibilité d'en choisir un autre.

Le navigateur terminal fonctionne dans CMD, PowerShell et Ubuntu, avec navigation clavier : ouvrir un sous-dossier, remonter au parent, utiliser le dossier affiché, saisir/coller un chemin, revenir ou annuler. Sur Windows, proposer les lecteurs accessibles ; sur Ubuntu, permettre les racines et points de montage déjà accessibles dans l'environnement courant. Ne pas monter de volume ou lancer WSL pour naviguer.

Afficher en permanence le chemin absolu courant. Le dossier de lancement est un point de départ visible, pas une sélection validée automatiquement. Lister les dossiers du seul niveau ouvert ; aucune recherche récursive ou indexation de toute la machine. Répertoire non accessible : message et retour possible, sans élévation automatique ni sélection d'un autre dossier en remplacement.

La saisie d'un chemin est traitée comme une valeur de chemin, jamais comme une commande shell. Résoudre les chemins relatifs contre le dossier affiché du navigateur, puis montrer le résultat absolu. Les noms contenant espaces, accents ou caractères spéciaux restent des valeurs littérales. Rendre les caractères de contrôle de manière lisible pour éviter qu'un nom ne masque la destination dans le terminal.

## Création

1. Choisir explicitement le dossier parent dans le navigateur.
2. Donner le nom du nouveau dossier projet, indépendamment du nom affiché et de l'identifiant npm/Composer. Valider ce nom comme un composant de chemin, sans séparateur ni remontée implicite.
3. Afficher le chemin final complet, construit à partir du parent choisi et du nom du dossier. Le récapitulatif montre cette destination avec profil, options, skills et opérations nécessaires.
4. Permettre de modifier l'emplacement ou d'annuler avant l'action « Installer ». Aucune création de dossier, dépendance téléchargée ou installation d'outil pendant la simple navigation.
5. Après ce choix, contrôler admissibilité du dossier, OS et versions des outils avant les opérations. Un dossier préexistant non admissible, une cible inaccessible ou une version incompatible bloque le parcours ; aucun repli silencieux vers le dossier courant, le dossier du CLI ou le dossier utilisateur.

Appliquer la règle existante : nouveau dossier, cible vide ou dépôt `.git` seul admissible ; projet interrompu reconnu par son manifeste pour reprise ; pas d'adoption ou écrasement d'un projet préexistant quelconque. Changer de destination recalcule le récapitulatif ; ne pas réutiliser l'ancien emplacement lors de l'installation.

Lorsque des liens/jonctions interviennent, rendre visible la destination physique résolue avant validation. Revérifier la cible avant les écritures : un lien remplacé, un volume disparu ou des droits modifiés bloque l'action au lieu d'installer ailleurs. Les fichiers générés restent dans le projet effectivement choisi et contrôlé.

Le navigateur choisit l'emplacement des fichiers du projet et de ses dépendances locales. Les outils système absents suivent les parcours habituels validés, avec emplacements annoncés dans le plan ; le cache reste séparé. Choisir un dossier projet ne déplace pas arbitrairement les installations système.

## Consultation d'un projet

Sélectionner un dossier projet et vérifier son manifeste Prométhée. S'il est absent ou incompatible, expliquer la situation sans modifier le dossier ni l'adopter automatiquement. Une installation incomplète reconnue peut proposer la reprise comme action distincte.

Présenter chemin absolu, profil/options, versions et skills enregistrés, état des étapes d'installation et actions pertinentes : services natifs, reprise ou mise à jour choisie des skills. Distinguer état enregistré et contrôles réellement obtenus au moment de la consultation. Ne pas présenter cet écran comme un audit qualité ou une preuve de progression métier.

Consulter l'état ne lance pas build, tests, mise à jour, installation, commit ou service. Une interrogation native d'état peut actualiser l'affichage sans démarrer/arrêter la cible. Une base Docker affiche son mode et sa gestion externe, sans appel Docker/Compose ni statut de conteneur inventé.

Chaque changement de projet remplace le contexte d'action par celui de la racine choisie ; la page d'état et les actions affichent toujours ce chemin. Les opérations utilisent le manifeste et l'association locale de cette sélection, pas ceux du dossier de lancement ou du projet précédemment ouvert. Aucun registre global des projets n'est requis pour le MVP.

## Qualification

Tester les [scénarios de navigation](validation/SCENARIOS.md) sur Windows 11 x64 et Ubuntu 24.04 x64, y compris WSL déjà installé : lecteurs, chemins collés, espaces/accents, annulation, cibles non admissibles, droits, liens/jonctions, consultation sans effet de bord et changement de projet. Les [résultats](validation/RESULTATS.md) actuels décrivent uniquement la préparation documentaire.
