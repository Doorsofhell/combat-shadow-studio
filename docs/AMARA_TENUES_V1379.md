# Amara — plan de finitions des tenues (v1.37.9 et suites)
Date : 12 novembre 2026.

## Objectif visuel
Des vêtements sportifs féminins soignés et crédibles : décolleté esthétique et libre (pas de couverture imposée), bords réguliers, bretelles stables, shorts au tombé naturel, ceintures propres. Préserver intégralement la morphologie de l'athlète et les caractéristiques des six disciplines.

## Lot A — matières et reflets (implémenté en 1.37.9)
- Rendu exclusivement Amara (chemin `/mma-amara/tenues/`) : jersey du haut plus mat avec trame légèrement mieux lisible ; surshort moins brillant et moins strié ; ceinture moins dure visuellement.
- Aucun changement de coupe, d'épaisseur réelle, de poids d'animation ou de maillage.
- Pas de changement des textures partagées, ni du cache de GLB, ni des autres coachs.

## Lot B — coupe du haut (NON IMPLÉMENTÉ, nécessite comparaison visuelle)
- Conserver le patron validé Inaya (v1.37.7) comme référence, adapté au buste d'Amara ; ne pas recopier ses GLB.
- Décolleté libre : ajuster sa courbe pour qu'elle soit harmonieuse, **sans ajouter une contrainte de couverture ni réduire automatiquement son ouverture**.
- Protéger les bords du haut, les emmanchures et les bretelles des triangles effilochés pendant les gardes, directs, crochets et rotations d'épaules.
- Ne pas réactiver `AMARA_PATCHES=1` (trous et bords déchirés observés en v1.37.6), ni modifier `photo.glb` ou `hideBody` sans comparaison de maillage.
- Avant toute génération : vérifier le contour actuel, sa symétrie, les intersections avec la peau et la longueur des arêtes frontales en bind-pose **et** sur les poses dynamiques.

## Lot C — shorts et ceintures (NON IMPLÉMENTÉ, maillage à vérifier)
- Conserver le surshort MMA entier et la séparation du cuissard intérieur v1.37.7 ; **ne jamais reboucher l'entrejambe avec `holes_fill`** ni restaurer les découpes v1.37.6.
- Ne pas modifier la géométrie de l'entrejambe sans détection des faces qui joignent les jambes et contrôle de l'étirement en high kick.
- Nettoyer uniquement les ourlets irréguliers réellement constatés sur comparatifs ; conserver le repérage de la limite de couleur avant déformation (v1.37.7).
- Éviter tout lissage global des poids, des os ou des vêtements.

## Validation bloquante
1. Exactement la même caméra, lumière, pose et discipline avant/après : face, dos, profil, trois-quarts.
2. Poses obligatoires : repos, garde, jab/direct, crochet, low kick, high kick, pivot ; qualité haute et basse.
3. Aucun trou poitrine / aisselle / dos ; aucune peau qui traverse ; aucune ligne de couleur dentelée ; aucun filament dans l'entrejambe.
4. Conserver les 7 modèles Inaya, 7 Naël, 7 Kadir, le corps et le squelette d'Amara bit-à-bit ; ne régénérer **que** les GLB effectivement corrigés, après sauvegarde.
5. Exécuter les tests outfit et le gate Blender `check-amara-garments-v1377.py`, la compilation et le contrôle Android ; ne publier que des GLB validés visuellement.

## Critère de livraison
Le lot A est un correctif optique immédiat et réversible. Les lots B et C restent à implémenter après comparaison des captures, car une retouche aveugle de géométrie serait une régression potentielle.
