# Direction pour une refonte demandée

Synthèse adaptée des principes de `SKILL.md` et `references/method.md` de Juuzoe : une suite d'interdictions ou des retouches isolées peut rendre une interface incohérente. Une refonte choisit un ensemble cohérent à partir du projet.

Reprendre utilisateurs, action principale, contenus disponibles, contraintes et identité. Conserver les décisions déjà prises ; demander seulement ce qui change les choix dépendants. Ne pas imposer un style, un nombre de pistes, une asymétrie ou une texture à tous les projets.

Enregistrer les décisions visuelles durables dans le document de design du projet ou dans la section interface de `PROJECT.md` : hiérarchie, tokens de couleur et typographie, espacements, composants, ton et mouvements. Garder une source de vérité. La précision doit suffire à reproduire les choix sans devenir une spécification exhaustive de chaque pixel.

Faire évoluer les tokens et composants concernés ensemble, puis les vues utilisant ces éléments. Respecter la portée de la refonte ; ni suppression globale de la palette du framework, ni réinitialisation Git, ni nouvelle bibliothèque par effet de bord. Les interfaces standard et conventions de plateforme restent pertinentes lorsqu'elles servent les utilisateurs.

Vérifier le rendu contre le brief, les contenus réels et les parcours importants. Contrôler responsive, états, accessibilité et reduced motion. Décrire ce qui distingue la solution en termes concrets ; aucun score n'est une preuve de qualité. Une nouvelle interface peut suivre ces mêmes principes avec UI UX Pro Max, sans imposer un audit de code qui n'existe pas encore.
