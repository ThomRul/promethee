---
name: livewire-development
description: "Développer ou diagnostiquer des composants Livewire 4 dans Laravel : état, actions, validation, autorisations et interactions. Ne s’applique pas aux écrans Alpine seuls."
license: MIT
metadata:
  promethee-adaptation: "1"
  upstream-version: "unversioned"
---

<!-- Adapté par Prométhée le 2026-10-05 ; provenance et modifications : NOTICE.promethee. -->

# Livewire 4

Respecter le format de composants déjà présent. Lire le [guide de la version 4](references/guide.md) pour l’API concernée et la [référence des hooks](reference/javascript-hooks.md) uniquement si du JavaScript Livewire est modifié. Vérifier la syntaxe dans https://livewire.laravel.com/docs/4.x.

Traiter les actions comme des requêtes : valider et autoriser côté serveur, considérer les propriétés publiques comme contrôlables par le client. Réutiliser les composants Blade et tokens présents. Alpine est fourni par Livewire ; ne pas le démarrer une seconde fois. Tester les comportements avec PHPUnit et les outils Livewire quand pertinent.
