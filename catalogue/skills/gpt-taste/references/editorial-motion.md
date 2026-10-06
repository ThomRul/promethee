# Composition et mouvement

Relier typographie, rythme des sections et médias au récit et à l'action utile. Un titre doit rester lisible avec contenu réel, petite largeur et grossissement du texte ; clamp et largeur de conteneur se vérifient sur le rendu, sans promesse universelle de deux lignes. Les espaces et répétitions servent des étapes distinctes ; aucune grille dense imposée si elle modifie l'ordre de lecture.

Sélectionner peu d'effets qui expliquent une transition ou un parcours. Pinning, reveal, stacking et scrub sont des pistes conditionnelles ; tester leur effet sur focus, lecture et navigation. Ne pas masquer globalement overflow pour cacher un défaut de géométrie.

En React, limiter les effets à un scope et nettoyer timelines/listeners au démontage et lors du changement des dépendances. Dans Blade/Alpine, nettoyer les instances remplacées par une navigation ou un composant. Revenir à une présentation statique lisible pour reduced motion ; ne pas laisser le contenu invisible si l'animation n'initialise pas.

Définir un propriétaire par animation : Motion ou GSAP, avec séparation claire des zones/propriétés. Une composition qui combine les deux vérifie également la durée de vie des effets et le budget de rendu. Les mesures doivent être réellement exécutées ; aucun classement de qualité inventé.
