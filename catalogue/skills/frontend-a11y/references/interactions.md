# Interactions web : points à vérifier

## Formulaire

Relier label/champ avec des identifiants uniques ; le placeholder complète le label. Associer l'erreur présente via aria-describedby et aria-invalid. Ne pas référencer un nœud absent. Conserver autocomplete et types utiles. Expliquer les champs obligatoires ; required fournit la validation HTML lorsqu'elle est utilisée.

## Dialogue, menu, onglets

Réutiliser les primitives du projet. Dialogue modal : nom accessible, focus initial utile, confinement du focus, fermeture adaptée, restauration à l'ouvreur et inertie de l'arrière-plan. Tester les cas imbriqués si concernés. Combobox : sélectionner une primitive éprouvée plutôt qu'un div cliquable ; vérifier sélection, saisie, Escape et annonces. Une navigation est une liste de liens, pas automatiquement un menu ARIA.

## Annonces et gestes

Limiter les régions live aux changements à annoncer ; polite suffit aux notifications non urgentes. Éviter les alertes assertives répétées à chaque frappe. Chaque action pointeur possède une alternative clavier utile ; aucune cible focusable cachée par aria-hidden. Préserver les indications d'état lorsque reduced motion est actif.

## Preuves

Séparer lecture du code, résultats automatisés, essais clavier et essais lecteur d'écran. Employer les outils déjà disponibles ; annoncer les essais impossibles. Les contrôles web ne qualifient pas une interface React Native.
