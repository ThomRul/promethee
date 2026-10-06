# Critique native Expo

Référence rédigée pour l'adaptation Prométhée ; elle ne copie pas les guides amont ios/android. Conserver Expo Router, les tokens NativeWind et les composants natifs du projet.

Vérifier les zones sûres, le clavier logiciel, le retour/navigation, les états de chargement et les gestes de la plateforme cible. Examiner la taille et séparation des zones tactiles, labels accessibles, annonce des états, grossissement du texte et réduction des mouvements selon les APIs natives et outils disponibles.

Critiquer lisibilité, hiérarchie et facilité de la tâche sur l'écran natif. Les CSS selectors, landmarks DOM et attributs ARIA web ne sont pas une recette React Native. Les conventions de navigation Android/iOS ne justifient pas une seconde application ou un backend.

Un aperçu web d'Expo ne prouve pas les gestes ou l'accessibilité du téléphone. Séparer lecture du code, capture, émulateur et appareil physique ; signaler les essais absents. Les skills Expo sélectionnés cadrent l'implémentation, sans remplacer la direction visuelle validée.
