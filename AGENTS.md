# Développer Prométhée

Lire README.md pour le démarrage, SPECIFICATION.md pour les choix validés et docs/IMPLEMENTATION-REVIEW.md pour les qualifications ouvertes. Les archives et rapports antérieurs sont des preuves de préparation, pas des tests du CLI courant.

Architecture : src/cli contient les interactions du terminal, src/core la sélection/rendu/suivi des projets et src/system les commandes, outils et services. Garder des responsabilités lisibles, réutiliser ces modules, éviter wrappers et abstractions spéculatives. Viser 300 lignes manuscrites par fichier sans découpage artificiel. Pas de submodules, packages autonomes ou nouvelle application sans demande explicite.

Pour chaque tâche, lire les fichiers de la zone concernée. Les skills livrés dans catalogue/skills sont des ressources à installer selon la sélection utilisateur ; ne pas les activer tous pour développer le CLI. Préserver leur provenance, licences et empreintes, et mettre à jour la qualification lors d'une adaptation.

Avant toute mutation : destination réelle explicite, préflight complet, outils requis compatibles et sélection qualifiée. L'absence d'une recette ne donne pas autorisation d'improviser une installation ; le conflit d'une version présente ne se contourne ni par remplacement ni par version parallèle. Le runtime privé du CLI n'est pas celui du projet.

Respecter les modifications et suppressions utilisateur dans une reprise. Les mises à jour de skills personnalisés préservent par défaut ; remplacement explicitement demandé avec sauvegarde complète hors découverte. Aucun Docker/WSL installé ou piloté par le menu des services.

Vérifications : npm run typecheck, npm test et npm run verify:resources selon l'impact. Tests des comportements et frontières utiles ; pas de quota de couverture, de tests miroir ou de suite répétée sans changement. Une preuve avec runner simulé ne qualifie pas un installateur ou une base native. Ne pas annoncer prêt si une étape requise n'a pas été vérifiée.

Git : préserver identité/signatures/configuration. Commits locaux cohérents après vérification, type(scope): description concrète. Préférer rebase et fast-forward ; histoire partagée jamais réécrite implicitement. Push uniquement sur demande explicite. Ne pas commiter runtime, node_modules, dist, releases, secrets ou données locales.
