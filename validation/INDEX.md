# Preuves de validation

[RESULTATS.md](RESULTATS.md) interprète les preuves ci-dessous et précise leur portée. [SCENARIOS.md](SCENARIOS.md) décrit la recette future du CLI.

| Preuve | Contenu |
| --- | --- |
| [Contrôles finaux de qualité](final-quality.json) | Types, analyse, rendu React/mobile et protection des fichiers de skills contre le formatage ; échec environnemental du test Electron conservé |
| [Contrôles des gabarits](fixture-checks-web-api-frontend-web-api-backend-desktop-php.json) | Construction React/Nest/PHP et contrôles initiaux ; build Electron bloqué |
| [Démarrage HTTP Nest](api-compiled-http.json) | Réponse réelle de l'application compilée |
| [Laravel](php-checks.json) | Commandes natives PHP, vue, routes et test de démarrage |
| [Expo](mobile-checks.json) | Types, analyse, test de rendu, matrice SDK et export JS Android |
| [Types mobile alignés](mobile-types.json) | Types React 19.2 et Jest 29, dernière résolution et contrôle TypeScript |
| [Options](options-resolution.json) | Résolution des cinq cas optionnels, sans qualification native |
| [Skills](skills-check.json) | Frontmatters, imports des scripts et recherches UI UX Pro Max |
| [Qualification anti-slop](anti-slop-qualification.json) | Licence, provenance, ressources et limites de la nouvelle adaptation ; aucun scénario Codex exécuté |
| [Documents](rendered-documents.json) | Quatre rendus, zones existantes et seules présélections qualifiées |
| [Intégrité des ressources](resources-check.json) | JSON, liens, empreintes, schéma, chemins et pixel art |

Chaque résultat de commande renvoie au journal correspondant dans `logs/`. Ces journaux détaillés et le reçu Windows propre à la machine sont conservés dans la livraison locale et exclus de Git. Les rapports de synthèse ci-dessus sont versionnés. Ils gardent les essais de résolution/installation et les premières tentatives, y compris celles corrigées ensuite, et ne doivent pas être lus comme le statut final d'une release.
