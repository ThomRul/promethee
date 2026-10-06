# Interfaces spécifiques au projet

Consulter ce guide pour créer ou modifier une interface web, PHP, desktop ou mobile. Les tâches métier, données et système suivent les règles KISS et les frontières du profil sans nécessiter un audit visuel.

## Conception

Partir du besoin : utilisateurs, action principale, contenu disponible, densité d'information et conventions de la plateforme. Reprendre le brief et les décisions existantes ; demander seulement les informations manquantes qui changent le résultat. Pour une nouvelle direction, consigner les choix durables dans la section interface de `PROJECT.md` ou dans le document de design déjà utilisé : hiérarchie, tokens, composants, ton et mouvements. Éviter une nouvelle source de vérité concurrente.

Composer avec les données et parcours réels. Une grille de cartes, une landing page ou un tableau de bord se justifie par son usage. Dégradés, arrondis, ombres et animations sont des outils : juger leur fonction et leur cohérence avec le brief. Ne pas imposer une esthétique identique à tous les projets.

Avant un ajout, rechercher les éléments existants. Étendre une variante utile plutôt que recréer un Button ou une règle CSS concurrente. Une petite demande garde une petite portée. KISS s'applique aussi au code d'interface : abstraction, état global ou bibliothèque supplémentaire seulement pour un besoin démontré.

## Contenus et fonctionnement

Utiliser des libellés qui nomment l'action et des textes concrets dans le ton du produit. Conserver les faits, limites et promesses validés. Ne pas inventer utilisateurs, témoignages, logos partenaires, intégrations, chiffres ou capacités pour remplir une composition. Dans une maquette explicitement demandée, identifier les données fictives ; dans le produit, utiliser les états vides appropriés.

Un contrôle doit réaliser son action, afficher un état indisponible compréhensible ou être retiré selon le périmètre. Un formulaire sans traitement ne simule pas un succès. Prévoir chargement, vide, erreur, validation, désactivation et retour d'action lorsqu'ils peuvent réellement survenir.

## Revue proportionnée

UI UX Pro Max, lorsqu'il est sélectionné, aide à concevoir. `stop-design-slop`, lorsqu'il est sélectionné, sert l'audit ciblé d'une interface jugée générique ou comportant des artefacts. Ouvrir seulement les références utiles à la zone. Un ajout normal de bouton n'impose pas une revue complète de l'application.

Pour un audit, distinguer défauts observables, faits à confirmer et choix de style. Préserver palette, typographie, tokens et structure hors d'une refonte demandée. Ne pas retirer une décoration intentionnelle sur la seule base d'une liste d'interdictions. Une correction d'accessibilité locale garde priorité sans devenir une refonte générale.

Vérifier le rendu et les interactions touchés à des tailles pertinentes : lisibilité, contraste, focus/clavier web ou accès natif, états et réduction des mouvements. Comparer avec le brief et l'interface existante. Une liste de signaux ou un score ne prouve ni qualité ni origine IA ; une compilation ne prouve pas le rendu. Rapporter les contrôles réalisés et leurs limites.
