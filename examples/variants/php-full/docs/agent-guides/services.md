# Bases et services du projet

Lire ce guide lorsque la tâche exige démarrage, arrêt ou changement du mode d'une base. Consulter la déclaration actuelle du projet et l'association locale ; ne pas déduire le mode de toutes les bases du seul usage de Docker par l'application.

- Base native : l'utilisateur peut ouvrir « Services du projet » dans Prométhée, ou `promethee services`, pour vérifier/démarrer les services associés. Réutiliser l'état encore valide ; aucune réinstallation pour relancer une base.
- Une nouvelle instance native démarre à la demande, sans activation au démarrage du PC. Conserver les réglages des instances existantes. Un arrêt est explicite et vise l'instance indiquée ; elle peut être partagée entre projets. La fermeture du CLI n'arrête pas les services.
- Base Docker/Compose : Prométhée ne contrôle ni moteur Docker ni conteneurs et n'installe pas un moteur natif pour cette base connue comme conteneurisée. Suivre les commandes Docker du projet selon les demandes de l'utilisateur.
- Base distante ou SQLite : aucun service serveur local à gérer par Prométhée pour cette base.
- Mode, cible locale ou version incompatible non résolus : expliquer le blocage ; ne pas lancer une commande générale sur les services de la machine ou contourner la règle de compatibilité.

Après un passage à Docker, actualiser la déclaration de la base, les commandes, `AGENTS.md` et la carte concernée. Retirer la base des actions natives ; préserver ancienne instance et données sans arrêt/désinstallation implicites. Une application partiellement Dockerisée peut conserver une autre base native.

Les identités de services propres au poste vont dans `.promethee/local-services.json`, exclu de Git, sans secrets ou commandes shell arbitraires. Une association absente/périmée doit être préparée ou corrigée avant action. Les droits système nécessaires sont expliqués et limités à la cible.

Distinguer service actif, connexion SQL vérifiée et application effectivement démarrée. Aucun état « prêt » inventé. La configuration Docker, ses politiques de redémarrage et son cycle de vie restent ceux du projet, pas ceux du menu de services Prométhée.
