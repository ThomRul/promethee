# Prométhée V0.2 — préparation du CLI

Dossier distinct de la préparation précédente, créé le 5 octobre 2026. Il consolide les choix validés et les ressources du futur CLI ; aucun moteur CLI, installateur système ou application métier n'est développé ici.

Commencer par [la spécification](SPECIFICATION.md), puis [les changements](CHANGES.md) et [ce qui reste](A-TERMINER.md).

| Ressource | Contenu |
| --- | --- |
| [Compatibilité des skills](catalogue/COMPATIBILITY.md) | Rôles, defaults, options et frontières des quatre profils |
| [Catalogue figé](catalogue/skills.lock.json) | 19 copies adaptées, provenance, notices et empreintes ; trois entrées suspendues sans copie |
| [Routage](catalogue/skill-routing.json) | Déclencheurs, zones et conditions de sélection |
| [Gabarits](templates/README.md) | Architecture, AGENTS.md, contexte, manifeste et schémas locaux |
| [Exemples](examples/README.md) | Documents rendus avec plusieurs sélections ; aucun état d'installation réussi inventé |
| [Installation](BOOTSTRAP.md) | Outils compatibles réutilisés ; absents à installer ; conflit bloquant |
| [Plan des outils](catalogue/bootstrap-plan.json) | Exigences conditionnelles ; recettes système encore non qualifiées |
| [Services](SERVICES.md) | Bases natives à la demande, sans gestion Docker ; mode suivi par base |
| [Navigation](NAVIGATION.md) | Choix explicite du dossier et du projet suivi |
| [Versions](VERSIONS.md) | Références conservées de V0.1 ; qualifications natives restantes |
| [Validation](validation/RESULTATS.md) | Contrôles exécutés et limites réelles |
| [Image validée](promethee-main-feu.png) | Main unique détaillée avec feu ; ressources console dans branding/ |

Les cinq nouvelles adaptations sont frontend-a11y, Humanizer, Diagram Design, Impeccable et GPT Taste. Instructions condensées et références locales, sans outils ou assets amont non qualifiés. Cette réduction est documentée, notamment pour les types de diagrammes et le moteur Impeccable absents.

UI UX Pro Max reste pilote visuel, Stop Design Slop audite selon la demande. frontend-a11y est présélectionné sur React/Blade/renderer ; Humanizer sur les quatre profils pour la prose. Diagram Design et Impeccable sont optionnels, décochés ; Impeccable dispose d'une référence de critique native adaptée au profil Expo. Les présélections sont désélectionnables et ne déclenchent pas une lecture systématique des skills.

Animations UI et éditoriales sont deux options distinctes, désactivées par défaut. GPT Taste est suggéré avec l'éditorial web ; GSAP/version/lock restent à qualifier. La licence propre de GSAP est indiquée dans [le guide animation](templates/options/animations.md). Les trois skills suspendus Vercel/Motion AI Kit ne sont pas distribués.

La V0.2 est un dossier de préparation, pas une release exécutable. La licence du futur code Prométhée reste à choisir ; les fichiers tiers conservent leurs licences. Rien n'est installé globalement, lancé, commité ou publié par cette préparation.
