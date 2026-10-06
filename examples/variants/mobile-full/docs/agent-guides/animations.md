# Options d'animation

Deux options indépendantes et désactivées par défaut : uiAnimations et editorialAnimations.

UI : Motion pour React/Blade/renderer Electron, Reanimated pour Expo. L'absence du skill Motion AI Kit n'interdit pas la bibliothèque Motion qualifiée ; ne pas copier le skill suspendu. En mobile, respecter les versions natives déjà fixées et activer seulement les dépendances additionnelles nécessaires.

Éditorial : web React ou Blade uniquement, GPT Taste adapté présélectionné et désélectionnable. GSAP reste à fixer et résoudre dans un lockfile ; cette option n'est pas encore installable dans la préparation. Aucun basculement implicite de desktop ou mobile vers GSAP.

Les deux options peuvent coexister sur web ; Motion traite les interactions courantes et GSAP les séquences éditoriales choisies. Attribuer chaque animation à un moteur, sans pilotage concurrent de la même propriété du même élément. Rien n'impose d'animer chaque contrôle ou de convertir toutes les pages.

La bibliothèque GSAP bénéficie d'une licence gratuite spécifique, différente de MIT/Apache-2.0 ; conserver ses avis et examiner le cas du produit avant usage, notamment s'il propose un éditeur visuel d'animations. La licence MIT du skill GPT Taste ne couvre pas la bibliothèque. [Licence officielle GSAP](https://gsap.com/community/standard-license/).

Conserver contenu et contrôles utilisables sans effets, reduced motion, focus et nettoyage des instances. Une sélection désactivée ne génère ni référence obligatoire au skill ni ajout de bibliothèque associé.
