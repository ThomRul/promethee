# Main et feu

La main unique avec feu validée est conservée : fichier ANSI compact, repli ASCII, pixels de palette et aperçu. La version console mesure 24 colonnes sur 16 lignes ; deux rangées de pixels par cellule donnent 32 rangées de pixels dans le modèle.

Le futur CLI choisit ANSI seulement si le terminal le supporte, respecte `NO_COLOR` et fournit le repli ASCII. Les contrôles actuels portent sur les dimensions et caractères ; l'apparence native dans CMD, PowerShell et Ubuntu reste à vérifier.

L'image et le prompt d'origine sont conservés comme sources visuelles. La version console est la ressource d'affichage du MVP ; aucun nouveau logo n'a été généré pendant cette préparation.
