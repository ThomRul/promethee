# Repères Expo

`src/app` contient les routes Expo Router et leur composition. Extraire composants, logique et accès aux données vers les fonctionnalités lorsque cela devient utile. NativeWind utilise Tailwind 3 dans ce profil ; suivre les tokens présents et les conventions React Native. L'ajout d'un élément d'interface commence par une recherche de composants existants.

Respecter zones sûres, clavier, tailles de texte, lecteurs d'écran et préférences de réduction des mouvements. Le skill Expo Native UI sert les éléments natifs pertinents ; il n'impose pas de remplacer une interface NativeWind validée. Ne pas ajouter des dépendances natives sans vérifier le SDK et les versions compatibles.

Reanimated et Worklets appartiennent au socle NativeWind. L'option animations avancées sélectionne Gesture Handler et le skill Animation ; leur présence ne justifie pas d'animer chaque écran. Après changement natif, distinguer export JavaScript, dev client et build réellement installé.

SQLite est une option de persistance locale, sans synchronisation automatique ajoutée. Définir besoin offline, migrations, conflits et données sensibles selon le projet. Le backend peut être absent, existant ou créé avec le gabarit Nest dans le même dépôt, selon la sélection.

Aucun secret serveur dans `EXPO_PUBLIC_*`, les assets ou le bundle. Définir le stockage des tokens et les autorisations côté API selon le besoin. Les URL du téléphone/émulateur diffèrent de celles de l'ordinateur ; adapter l'adresse et, si nécessaire, l'écoute réseau de l'API après décision explicite d'exposition locale.

## Parcours et commandes

Respecter le parcours enregistré dans le projet : Android local avec development build, ou aperçu Expo Go. Le choix téléphone/émulateur est distinct du parcours. Android local est recommandé, avec téléphone USB par défaut ; l'émulateur est optionnel après contrôle de la machine. Vérifier les outils préparés par Prométhée et leur activation ; ne pas réinstaller ce qui reste valide.

- Expo Go : `npx expo start --go`, avec SDK et modules compatibles. Le téléphone doit disposer d'Expo Go. Si une fonction exige un development build, expliquer le besoin et actualiser le choix de parcours avant les opérations qui en dépendent ; conserver le projet existant.
- Android local : vérifier `expo-dev-client`, JDK, SDK et détection du téléphone/émulateur. Première compilation avec `npx expo run:android --device` pour sélectionner le téléphone USB, ou `npx expo run:android` avec l'émulateur choisi démarré. L'utilisateur autorise le débogage USB sur son téléphone.
- Au quotidien, `npx expo start --dev-client` sert les changements JavaScript/TypeScript. Reconstruire lorsque dépendances natives, configuration native ou SDK changent ; pas de compilation native à chaque correction JS.

Expo peut générer `android/` à la première compilation. Privilégier la configuration Expo et les config plugins. Avant un `prebuild --clean`, examiner les changements locaux et préserver les personnalisations : la régénération ne doit pas les supprimer. Actualiser les cartes si une nouvelle frontière réellement présente le nécessite.

Compiler Android localement avec Expo CLI, sans EAS/cloud requis, Docker ou installation de WSL. La compilation native iOS locale exige un Mac avec Xcode ; sous Windows/Ubuntu, l'aperçu Expo Go sur iPhone reste limité aux fonctions compatibles. Signatures et publication se cadrent avec le projet.

Distinguer dépendances installées, serveur lancé, binaire compilé, application installée et application réellement ouverte. Un test Jest ou export JS ne valide pas le comportement natif sur appareil. Si la cible est indisponible, signaler le blocage ; ne pas changer silencieusement de parcours ni annoncer une installation terminée.

[Expo Router](https://docs.expo.dev/router/introduction/) · [Development build](https://docs.expo.dev/develop/development-builds/introduction/) · [Build local](https://docs.expo.dev/guides/local-app-development/) · [Variables publiques](https://docs.expo.dev/guides/environment-variables/) · [NativeWind](https://www.nativewind.dev/docs/getting-started/installation)
