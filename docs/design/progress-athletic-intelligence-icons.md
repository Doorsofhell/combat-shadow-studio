# Progrès — Athletic Intelligence : référence de livraison

## Objectif
Refondre l'écran **Progrès** en direction premium éditoriale « Athletic Intelligence », en **un seul viewport mobile sans défilement vertical** pour les tailles d'écran ciblées, avec une barre de navigation unique et **Progrès immédiatement après Entraîner**.

## Règle impérative : icônes existantes
- **Réutiliser exclusivement les composants, fichiers et assets d'icônes premium déjà utilisés dans l'application**, notamment les emblèmes officiels de disciplines et la famille d'icônes de navigation.
- Avant intégration, inventorier les icônes réellement utilisées dans Accueil, Entraîner, Techniques, Historique et Menu et référencer leurs imports/identifiants.
- Ne pas remplacer les emblèmes par des emoji, ne pas introduire une seconde librairie, ne pas fabriquer des icônes visuellement divergentes.
- Réutiliser les mêmes composants/tailles optiques, épaisseurs, couleurs et états actif/inactif. Les variantes jour/nuit sont des adaptations de thème, pas de nouvelles icônes.
- Si un pictogramme requis manque, le signaler explicitement et soumettre une variante dans la même famille à validation avant intégration.
- La branche `design/premium-discipline-emblems` contient des prototypes SVG : **ne pas les traiter comme assets premium validés** ni les remplacer automatiquement par ceux-ci.

## Composition mobile, sans ascenseur
1. En-tête Progrès + filtres.
2. Filtre des six disciplines en bande compacte (libellés et icônes lisibles).
3. Périodes et comparaison.
4. Techniques découvertes : 41/84, 49 % (exemple tiré de la capture, données réelles dans l'app).
5. Quatre KPI : temps actif, séances, répétitions, exercices.
6. Graphique compact de l'activité.
7. Progression par discipline et jours actifs / pause max, dans l'espace disponible.
8. Navigation contextuelle unique en bas.

Les valeurs de progression par discipline figurant sur la maquette sont illustratives et ne doivent jamais être injectées dans l'application comme des données réelles.

Pour les petits écrans : adapter la densité et, si nécessaire, proposer des vues contextuelles/onglets plutôt que rendre le texte illisible, couper des données ou introduire un défilement vertical. Garder l'accès à toutes les métriques existantes, aux niveaux, catégories, exercices et historique.

## Exigences de non-régression
- Préserver calculs, filtres, historiques, données persistantes, navigation, mode jour/nuit, safe areas, PWA et Android.
- Ne pas toucher aux coachs, modèles 3D, animations ou techniques validées.
- Comparer les captures et les statistiques avant/après à jeu de données identique.
- Tester les tailles Android compactes et grandes, l'accessibilité, les états sans données, la comparaison et le hors-ligne.

## État de cette livraison
Cette branche contient **la référence de design et les consignes de réutilisation des icônes**, pas encore une modification du code de l'écran Progrès ni de nouveaux assets. Une implémentation doit commencer par l'inventaire réel des composants d'icônes existants.
