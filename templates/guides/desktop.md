# Repères Electron

Le main détient les accès système, le preload expose des opérations limitées, le renderer React affiche. `contextIsolation` et sandbox restent actifs ; `nodeIntegration` reste désactivé. Une action utilisateur expose une fonction précise du pont, pas `ipcRenderer`, SQL, commandes shell ou accès arbitraire au disque.

Pour chaque futur message IPC, vérifier émetteur, format et autorisation. Refuser les navigations, nouvelles fenêtres et permissions non prévues. Valider une URL avant un éventuel `shell.openExternal`. Ne pas charger de contenu distant non maîtrisé dans un renderer privilégié.

Le gabarit possède une CSP. Les autorisations de connexion localhost/WebSocket sont prévues pour le développement ; les réduire à la politique réelle du produit dans l'artefact de distribution. Tester la page empaquetée, les erreurs et les frontières main/preload ; un build seul ne suffit pas.

SQLite est optionnel. Ouvrir la base dans le main, sous `app.getPath('userData')`, avec migrations et sauvegardes adaptées. Le renderer passe par des opérations métier du pont. Recompiler better-sqlite3 pour l'ABI Electron et vérifier une migration aller/retour dans une base isolée.

La signature, l'installateur, les plateformes de distribution et les mises à jour applicatives dépendent du projet. Aucun auto-update ou certificat n'est ajouté implicitement. La règle Git de push explicite reste applicable.

[Sécurité Electron](https://www.electronjs.org/docs/latest/tutorial/security) · [Context isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation) · [Modules natifs](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules)
