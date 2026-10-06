# CLEAN : examiner seulement les catégories touchées

Synthèse adaptée de `SKILL.md` et `references/clean-pass.md` de Juuzoe. Ce protocole guide un audit demandé ; il ne transforme pas chaque modification d'interface en audit général.

| Catégorie | Observation utile | Intervention proportionnée |
| --- | --- | --- |
| Artefacts de génération | Texte de placeholder affiché en produit, nom incohérent, badge de builder résiduel, titre/favicon de scaffold, instruction LLM rendue | Remplacer par le contenu du produit ou l'état approprié ; conserver les attributions nécessaires. Distinguer exemples de développement et contenu destiné aux utilisateurs |
| Fonctionnement | Lien sans destination, bouton sans action, formulaire qui annonce un succès sans traitement, erreur console liée à la zone | Relier l'action, présenter l'indisponibilité ou retirer le contrôle selon le besoin ; ne pas ajouter une intégration ou un service absent du périmètre |
| Vérité du contenu | Témoignage, chiffre, logo client, intégration, certification ou capacité sans preuve | Demander la source utile, employer un fait confirmé ou retirer l'affirmation non fondée. Identifier les données fictives d'une maquette autorisée |
| Lisibilité et accès | Contraste insuffisant, focus masqué, nom accessible absent, hiérarchie confuse, cible difficile, clavier bloqué | Réparer avec les composants et tokens présents, tester le comportement concerné ; signaler si une correction nécessite une décision globale |
| Décoration | Boucle ambiante, effet au survol, compteur, dégradé ou animation répétés sans rôle clair | Examiner compréhension, identité, coût et reduced motion. Préserver un choix intentionnel. Une liste d'indices ne justifie pas de tout supprimer |
| Soin local | État vide/erreur/chargement absent, message vague, retour d'action ambigu, texte inutilement long | Employer des états et libellés précis adaptés au parcours. Conserver le ton et les faits ; juger la longueur au rendu et au contexte plutôt qu'avec un quota universel |
| Direction | Typographie, palette, échelle d'arrondis/ombres, disposition générale | Signaler les incohérences avec le brief. CLEAN ne remplace pas le système visuel ; refonte seulement lorsqu'elle est demandée |

Avant et après : comparer les états concernés, le responsive et les interactions. Garder les indications de clic et les retours focus/active/disabled. Ne pas convertir une convention d'ergonomie en interdiction esthétique.

Métadonnées, référencement et performance s'examinent selon le produit : un outil interne ou une app native n'a pas les mêmes exigences qu'une page publique. Un secret exposé est un incident de sécurité à traiter selon les règles du projet, pas une simple note de style.

Le rapport peut être court : emplacement, problème observé, impact, correction ou fait restant à confirmer, preuve disponible. Aucun score de détection IA ou seuil de qualité obligatoire n'est conservé dans cette adaptation.
