# Option SQLite desktop

Ajouter les versions exactes du groupe desktop-sqlite de frameworks.lock.json. Stocker la base dans app.getPath('userData'), ouvrir la connexion dans le main et conserver synchronize=false pour les migrations. L’agent ajoute entités et migrations selon le projet.

Le module better-sqlite3 doit être reconstruit pour l’ABI de l’Electron retenu avec @electron/rebuild (commande locale préparée). Tester une ouverture de base et une migration réversible dans un dossier de test avant de qualifier cette option. Ne jamais exposer SQL, chemins arbitraires ou ipcRenderer au renderer.
