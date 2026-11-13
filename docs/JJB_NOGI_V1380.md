# Shadow Studio 1.38.0 — JJB No-Gi, direction artistique et intégration

## Base vérifiée
- Branche de travail : `feature/jjb-nogi-v1380`, créée depuis `fix/amara-garment-finish-v1379` (package.json = 1.37.9).
- La branche `main` est historiquement en 0.14.0 : ne pas fusionner aveuglément depuis `main`.
- Génération actuelle : `tools/generator/rocketbox/outfits.py`, un GLB de tenue par coach et discipline, skinné sur son propre corps.
- Chargement : `src/three/outfit.ts` et `src/three/PhotoCoach.tsx`.
- Discipline No-Gi existante : `bjj-nogi`; conserver `bjj` pour le Gi.

## Direction artistique — NO-GI / SHADOW FLOW
Une seule tenue commune, morphologiquement adaptée à chaque coach, non une collection de tenues indépendantes.
- Rashguard compressif manches courtes, col rond propre, coutures raglan, textile technique mat.
- Short de grappling mi-cuisse légèrement ample, ceinture plate, jambes indépendantes, fentes latérales discrètes.
- Palette : anthracite #151A22, bleu nuit #152943, bleu électrique #2F8CEB, argent #A9B7C7.
- Signature graphique originale : « Shadow Flow », lignes fluides asymétriques inspirées des trajectoires de déplacement, du contrôle et des prises, jamais des logos de marques tierces.
- Torse : chevrons topographiques très fins convergeant vers le sternum, densité diminuant vers les flancs.
- Épaules : arcs angulaires bleus, continus sur les manches, sans déformer la lecture des muscles.
- Dos : réseau discret de courbes isométriques en V, symétrie imparfaite intentionnelle.
- Short : bande diagonale dégradée bleu nuit / électrique sur l'extérieur de chaque cuisse, micro-lignes coordonnées aux flancs du rashguard.
- Traitement imprimé : mat, discret, ancré aux UV ou aux coordonnées locales du vêtement; aucune pièce flottante, aucune géométrie de motif à travers le corps.
- Ni copie des marques BÔA, Kingz, Venum ou Porrada, ni reproduction de leurs illustrations.

## Critères techniques de réalisation
1. Construire les vêtements sur le mesh et les poids de skinning propres à chaque coach.
2. Réutiliser les mêmes paramètres de coupe, motifs et palette sur tous les coachs, avec adaptations locales de gabarit.
3. Ne jamais utiliser une simple mise à l'échelle globale du modèle masculin pour les coachs féminins.
4. Conserver le masquage réversible des surfaces du corps couvertes et éviter le retour des anciens vêtements.
5. Empêcher toute membrane, pont ou triangle tendu entre les jambes, y compris en flexion et garde au sol.
6. Ne pas modifier les tenues MMA, kick-boxing, boxe, muay-thaï, judo ou Gi.
7. Valider face, dos, profil, trois-quarts, flexion profonde et transitions de JJB sur chaque coach.
8. Tester les GLB exportés, les normales, les UV, le chargement dans l'app et la performance Android.

## Sécurité du travail parallèle
Claude prépare ses corrections Amara pour la 1.38.1 : ne pas écraser ses branches ni ses commits.
Conserver les changements JJB isolés, documenter tout fichier partagé avec les autres disciplines.
Avant la publication, vérifier les changements distants, les conflits éventuels et la version réellement déployée.
Aucun déploiement ne doit être annoncé avant vérification des tests et du site.

## État
- [x] Dépôt et base 1.37.9 identifiés
- [x] Branche JJB isolée
- [x] Architecture initiale identifiée
- [x] Direction artistique originale spécifiée
- [ ] Implémentation des meshes et matériaux
- [ ] Génération des GLB par coach
- [ ] Tests automatisés et captures
- [ ] Version 1.38.0 et publication vérifiée
