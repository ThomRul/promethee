# Options mobile

SQLite : ajouter expo-sqlite 57.0.3, le schéma et le besoin offline seront définis par l’agent.

Animations avancées : Reanimated 4.5.1 et Worklets 0.10.1 sont déjà nécessaires à NativeWind ; ajouter Gesture Handler 2.32.0 et expo-animation lorsque l’option est choisie. Ne pas activer des animations partout par effet de la présence de ces dépendances.

Backend : placer ce squelette Expo dans mobile/ et ajouter le squelette Nest dans backend/. Un seul dépôt, pas de workspace ou submodule implicite. L’URL API locale doit tenir compte du téléphone/émulateur ; localhost n’y désigne pas toujours l’ordinateur. Aucun token secret dans EXPO_PUBLIC_*.
