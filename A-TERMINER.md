# Travaux restant avant une release du CLI

Le cadrage de cette version est arrêté. Le présent dossier permet d'implémenter sans reprendre les choix produit déjà validés.

| Travail | État et résultat attendu |
| --- | --- |
| Routage/sélection des cinq nouveaux skills | Ressources et aperçus préparés ; essais réels de déclenchement Codex restant à faire |
| Trois skills suspendus | Résoudre les notices des révisions Vercel/Motion AI Kit avant toute redistribution |
| Éditorial GSAP | Fixer version, licence applicable, intégrités et lockfile de chaque combinaison ; option non installable en l'état |
| Android local | Qualifier expo-dev-client avec SDK fixé, JDK/SDK/build tools et première compilation USB/émulateur ; Expo Go reste distinct |
| Installateurs natifs | Qualifier sources, versions/plages, signatures/hashes, accès commandes et élévation ciblée sur Windows/Ubuntu/WSL |
| Bases et services | Implémenter les adaptateurs, valider instances, identité du projet, partage et changements de mode ; pas de gestion Docker |
| Schémas et migration | Implémenter références uniques, transitions, validation des sélections et correspondance locale ; ne pas migrer silencieusement un ancien manifeste |
| CLI et distribution | Code compilé, menus/génération/reprise/status/updates, adaptateurs et packaging présents ; qualifier recettes système, service lifecycle réel et recette plateformes avant release |
| Recette | Exécuter scénarios sur CLI réel, machine vierge et outils présents/incompatibles, chemins à espaces, annulation/reprise et permissions |
| Licence Prométhée | Choisir la licence de son propre code avant publication publique ; aucune attribution automatique |

Un package résolu, une adaptation statique ou un document généré n'est pas une preuve de démarrage natif, d'accessibilité ou d'audit sécurité. État prêt uniquement après les vérifications réellement exécutées pour la sélection installée.

Actualisation du 6 octobre 2026 : le code est maintenant présent. Les résultats exécutés et limites de cette préversion sont dans docs/IMPLEMENTATION-REVIEW.md. Les anciennes preuves de préparation restent distinctes.
