# Choisir les skills selon la tâche

Cette matrice concerne les skills sélectionnés pour ce projet. Leur installation les rend disponibles ; elle n'impose pas leur lecture pour chaque demande. Consulter aussi [les zones](../agent-map/ROUTING.md) pour trouver les fichiers utiles.

| Skill installé | Quand l'utiliser | Limite de portée |
| --- | --- | --- |
| Aucun | Conventions du profil | Aucun skill imposé |

## Skills sélectionnés

Aucun skill sélectionné. Utiliser les conventions et outils du profil.

Reprendre la direction visuelle existante et les conventions du profil.

La disponibilité ne déclenche pas une lecture générale ; choisir le spécialiste utile à la demande.

## Animation choisie

Animations UI avancées désactivées ; aucune dépendance ajoutée pour cette option.

Préserver contenu statique, contrôle clavier et reduced motion ; ne pas animer tous les contrôles par défaut.

## Arbitrage

Déterminer le résultat demandé : créer, modifier, diagnostiquer, auditer ou rédiger. Reprendre l'existant et le brief. Pour la conception visuelle, garder un seul pilote et une seule direction par tâche. Les spécialistes traitent leur domaine sans remplacer les décisions du pilote, sauf défaut de fonctionnement, de sécurité ou d'accessibilité à résoudre.

Un skill explicitement demandé s'applique à la portée autorisée. Si ses prescriptions contredisent le besoin, la stack ou les décisions du projet, appliquer les contraintes du projet et signaler le conflit concret. Ne pas réintroduire une fonctionnalité payante, une animation désactivée ou une dépendance absente par effet de bord.

Une petite modification ne lance pas tous les audits. Charger un spécialiste quand le comportement concerné le justifie : gestion de focus pour une modale, reduced motion pour une animation, langage naturel pour une réécriture, autorisations pour une opération sensible. Lire seulement la référence utile, puis réutiliser les décisions et preuves encore valables.

Un audit seul produit des constats. Une correction applique les changements autorisés. Une refonte doit être demandée et conserve les faits et fonctions du produit. Éviter deux réécritures concurrentes : si une révision éditoriale spécialisée est utilisée, l'audit vérifie ensuite les faits et le rendu sans recommencer la rédaction.

Une modification backend ou système n'appelle pas de directeur artistique. Les contrôles web ne prouvent pas l'accessibilité native. Si un skill est désélectionné, utiliser les règles et outils du profil sans imposer son installation. Les descriptions des skills doivent refléter cette matrice ; ce document seul ne rend pas un déclencheur trop large fiable.

Une critique UI cible le frontend React, les vues Blade, le renderer Electron ou les écrans mobiles selon le profil. Choisir les références web ou natives correspondantes ; conserver les conventions Expo/NativeWind sur mobile. Les processus Electron main/preload, les services API et les données restent du ressort des spécialistes techniques. Le critique apporte des constats ciblés sans remplacer le pilote visuel, ajouter un moteur ou lancer une refonte implicite.
