# Services de base du projet

Décision produit du 5 octobre 2026 : l'utilisateur peut relancer Prométhée pour démarrer les bases natives dont son projet a besoin. Aucune activation au démarrage du PC pour une nouvelle instance. La gestion des bases conteneurisées reste au workflow Docker/Compose du projet. Ce document prépare une fonction du futur CLI ; aucune commande de services n'est implémentée.

## Parcours minimal

Depuis le menu, choisir un projet suivi dans le [navigateur de dossiers](NAVIGATION.md), puis « Services du projet ». `promethee services` ouvre directement ce parcours ; un projet du dossier courant peut être proposé avec son chemin complet et possibilité d'en choisir un autre. Lire la déclaration et l'association locale du projet effectivement sélectionné ; ne pas parcourir tous les services de la machine ni créer un registre global de tous les projets.

Le menu montre les services natifs associés, leur état connu, leur portée et les actions disponibles : consulter l'état, démarrer, arrêter. Un lancement du CLI ne démarre rien implicitement. L'action de démarrage vise les services sélectionnés nécessaires au projet ; un service déjà actif n'est pas redémarré. Aucune réinstallation des frameworks ou des skills, aucun nouveau cadrage métier pour cette opération.

## Traitement par base

| Mode déclaré pour la base | Comportement de Prométhée |
| --- | --- |
| Native, PostgreSQL/MySQL ou moteur qualifié sur l'hôte | Installation/préparation si nécessaire ; association au projet ; état et démarrage/arrêt à la demande |
| Conteneurisée, Docker/Compose | Pas d'installation d'un moteur natif pour cette base ; aucune commande Docker/Compose, aucun démarrage/arrêt du daemon ou des conteneurs |
| Distante | Pas de contrôle d'un service distant ; utiliser la configuration de connexion du projet |
| Embarquée, SQLite | Aucun service serveur à démarrer |
| Aucune base ou mode non renseigné | Aucune action de service ; expliquer ce qui doit être renseigné si le projet en attend un |

Le mode est déclaré **par base**, indépendamment de la décision Docker globale de l'application. Une API conteneurisée peut utiliser une base native ; une application native peut utiliser une base conteneurisée. Seule l'association native effective autorise l'action de Prométhée.

Le choix de Docker reste cadré par l'agent avant le développement, comme prévu dans la spécification. Si la base est déjà déclarée conteneurisée avant le bootstrap, exclure son moteur natif des outils à installer. Sinon, le profil natif initial suit sa sélection ; un passage ultérieur à Docker retire son association des actions natives sans désinstaller ni arrêter automatiquement une ancienne instance.

## Démarrage et arrêt

- Une nouvelle instance native est configurée pour un démarrage à la demande. Prométhée peut la démarrer pendant sa préparation et la vérification SQL ; il ne l'active pas au démarrage du PC.
- Une instance existante conserve son mode de démarrage et sa configuration. La réutiliser ne donne pas permission de changer ses réglages système.
- Identifier exactement instance/service/processus et version attendus avant action. Appliquer la règle de blocage des versions incompatibles aux outils nécessaires à cette opération.
- Démarrer seulement la sélection native du projet, puis vérifier état et disponibilité SQL. Signaler séparément « actif » et « connexion SQL vérifiée ».
- Arrêter seulement après une action explicite de l'utilisateur sur la cible indiquée. Un service serveur peut être partagé entre plusieurs projets : afficher cette portée connue avant l'action, sans promettre une isolation par simple base ou compte dédié.
- Aucun arrêt à la fermeture de Prométhée, aucun arrêt global de tous les serveurs, aucune suppression de données ou désinstallation pour une opération de services.
- Les opérations peuvent requérir UAC/sudo selon la recette qualifiée. Expliquer la cible et les droits nécessaires ; élever seulement l'opération concernée. Un refus laisse l'état réel et les données conservés.

Les adaptateurs Windows 11/Ubuntu 24.04, y compris WSL déjà installé, doivent être qualifiés pour le gestionnaire natif ou le processus retenu. Ne pas présumer la présence d'un gestionnaire opérationnel dans toute session WSL ; signaler une capacité manquante sans installer WSL ou Docker comme solution de repli.

## Données de suivi à préparer

La déclaration versionnée du projet devra identifier chaque base logique et son mode : native, conteneurisée, distante ou embarquée. Le manifeste V2 et le schéma local-services décrivent ces données ; les exemples ne contiennent aucun service réellement enregistré. Les adaptateurs et validations d’association restent à implémenter et qualifier.

L'identité propre à la machine — instance, identifiant de service/processus, port et adapter qualifié — ira dans `.promethee/local-services.json`, exclu de Git. Relier cette association à la base logique du projet. Aucun mot de passe ni commande shell arbitraire à exécuter depuis ce fichier ; les adaptateurs autorisés construisent les opérations à partir de cibles validées.

Sur une autre machine, l'absence d'association locale ne provoque pas de découverte/commande générale : préparer l'association par le parcours de bootstrap applicable. Une association périmée ou incohérente bloque l'action avec un diagnostic. Les secrets restent dans la configuration locale prévue, hors journaux et manifeste versionné.

## Évolution avec l'agent

Lorsque le mode d'une base change, l'agent actualise déclaration du projet, commandes, `AGENTS.md` et cartes concernées. Une base déclarée Docker sort immédiatement des actions natives, même si une ancienne association locale subsiste. Le démarrage de Docker ou Compose relève des instructions de développement du projet et des demandes de l'utilisateur.

La présence d'un fichier Compose ne suffit pas à classer toutes les bases comme conteneurisées. La vérification et les références de l'agent suivent la base réellement concernée. Les politiques de redémarrage des conteneurs sont des décisions du workflow Docker ; elles ne sont pas configurées par le menu services de Prométhée.

Compose peut créer/démarrer les conteneurs, et leur redémarrage automatique dépend des politiques définies. Une base conteneurisée n'est donc pas nécessairement lancée sans action ; cette responsabilité reste à Docker/Compose. [Compose up](https://docs.docker.com/reference/cli/docker/compose/up/), [politiques de redémarrage](https://docs.docker.com/engine/containers/start-containers-automatically/).

## Qualification

Préparer le suivi par base, l'association locale, les adaptateurs natifs et le menu minimal ; puis exécuter les [scénarios de services](validation/SCENARIOS.md). Vérifier données préservées, portée des services partagés, refus de droits, version incompatible, mode Docker sans aucun appel Docker, transitions native/conteneur et état réel après fermeture du CLI. Les [résultats actuels](validation/RESULTATS.md) ne contiennent aucune opération de service exécutée.

## Ressources V0.2

Le manifeste V2 contient databases avec mode par base et états planifiés. Le schéma local-services décrit les associations natives locales sans secrets/commandes ; local-tools suit les exécutables effectifs. Les fichiers locaux sont ignorés par Git. Valider moteur/mode, IDs uniques, références et adaptation autorisée avant opération : schéma valide ne signifie pas association fiable. Aucun service réel n'est enregistré ou lancé par ces aperçus ; adaptateurs/recettes restent à qualifier.
