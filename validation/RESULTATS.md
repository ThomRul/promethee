# Résultats de préparation V0.2

Contrôles exécutés le 5 octobre 2026 sur les ressources, sous Windows. Les références techniques et essais V0.1 sont conservés dans [l'historique](HISTORIQUE-V0.1.md) ; les autres anciens journaux/rapports de ce dossier ne sont pas des exécutions nouvelles. Aucun moteur CLI n'est développé et aucune installation système, opération de service, compilation native ou session comportementale Codex n'a été exécutée pour cette V0.2.

## Contrôles V0.2 exécutés

- Cinq nouveaux skills : format/frontmatter validés avec quick_validate.py de skill-creator ; références locales présentes, licences et notices conservées.
- Catalogue : 19 copies adaptées avec empreintes des fichiers et de l'arbre vérifiées ; trois entrées suspendues absentes.
- Documents : 12 aperçus rendus, marqueurs résolus et chemins des zones vérifiés sur des copies isolées. Quatre defaults, quatre sélections étendues, aucun skill, Expo Go, base conteneurisée et éditorial avec GPT Taste désélectionné.
- Sélections : concordance manifeste/matrice/dossiers copiés, désélection prioritaire, absence de Python UI UX si son skill n'est pas choisi, pas de directeur artistique en main/preload, pas de provisionnement natif pour base conteneurisée.
- Schémas : manifestes V2 et associations locales ; cas négatifs chemins sortants, baseline manquante, doublons, choix hors profil, GPT Taste hors éditorial, Expo Go avec cible native, référence d'étape inexistante, secrets/commande arbitraire et ID de service suspect.
- V0.1 : les 528 fichiers de son inventaire de sommes SHA-256 sont inchangés.

Preuves : [frontmatter](new-skills-frontmatter.json), [aperçus](rendered-documents-v02.json) et [inventaire/relations](resources-v02-check.json). Le rapport final donne les nombres exacts de fichiers, liens et cas contrôlés.

Les validations des relations sont des contrôles d'auteur des ressources ; elles n'implémentent pas la logique de sélection, de reprise ou d'exécution du futur CLI. Un JSON valide ne prouve ni la sûreté d'un service réellement choisi, ni le comportement de l'agent.

## Qualifications restantes

Essais Codex réels des nouveaux déclencheurs, qualification des trois notices suspendues, versions/lockfiles GSAP, expo-dev-client et outils Android, recettes natives et services sur Windows/Ubuntu/WSL, archive exécutable et recette complète. Voir [les travaux restants](../A-TERMINER.md) et [les scénarios](SCENARIOS.md).

GSAP a une licence gratuite propre avec périmètre d'usage, distincte du MIT du skill ; source officielle consultée : [licence GSAP](https://gsap.com/community/standard-license/). Cette option reste non installable tant que sa combinaison technique n'est pas qualifiée. Aucun audit sécurité du projet utilisateur ni économie chiffrée de tokens annoncés.
