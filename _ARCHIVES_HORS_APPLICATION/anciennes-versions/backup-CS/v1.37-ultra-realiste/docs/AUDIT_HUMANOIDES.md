# Audit du système humanoïde 3D (2026-10-18, v0.14.0 en cours)

Audit fait sur le code réel du dépôt, avant toute modification. Point de restauration : `restauration/lot-5c`.

## 1. Ce que sont les coachs aujourd'hui

| Question | Réponse vérifiée |
|---|---|
| Géométrie procédurale ou primitives Three.js ? | **Non.** |
| Modèles GLB/GLTF ? | **Oui** : `public/models/coach_{male,female}[_manga].glb` (4,2 à 4,7 Mo). **Correction après vérification : ils ne sont pas compressés en Draco** (aucune extension `KHR_draco_mesh_compression` dans les fichiers ; le module Blender utilisé n'inclut pas Draco). Le décodeur Draco est présent dans l'application mais inutilisé. |
| Modèles VRM ? | Non. |
| Origine des modèles | Générés par notre script Blender + **MPFB2** (`tools/generator/build.py`) : maillage de base MakeHuman (CC0), cibles morphologiques (musculature, proportions), vêtements découpés dans le corps, texture de peau peinte par texel et multipliée par une occlusion ambiante cuite. |
| Squelette | **Rig Mixamo standard de MPFB** : 52 os, dont bassin, 3 vertèbres, cou, tête, épaules, bras, avant-bras, mains, **5 doigts à 3 phalanges**, hanches, genoux, chevilles, orteils. Le même squelette pour les deux coachs. |
| Polygones | ~64 000 sommets (homme), ~69 000 (femme), 4 à 6 matériaux, 2 textures (peau 2048 px, yeux). |
| Animations | **Calculées par programme** (`src/engine`) : poses-clés biomécaniques écrites à la main par technique (`src/engine/library/*.ts`, 100+ mouvements) et résolues par **cinématique inverse à deux os** (`rig.ts`) sur le squelette réel. Pas d'`AnimationClip` ni d'`AnimationMixer` : les mouvements sont paramétrés (garde orthodoxe/gaucher par symétrie, taille du coach). |
| Rendu | 3 styles au choix : **Encre** (défaut v0.14.0, `src/three/manga.ts`), Manga (cel shading), Réaliste. Contours d'encre par coque inversée. |

## 2. Les 12 points demandés

1. **Affichage 3D** : `three/CoachStage.tsx` (scène, caméra, lecture), `three/StudioStage.tsx` (studio, éclairage 3 lumières + hémisphère, sol, ombres), `three/CoachModel.tsx` (chargement GLB, matériaux), `three/ArScene.tsx` (réalité augmentée).
2. **Création des personnages** : générateur Blender/MPFB2 hors application ; dans l'application, `three/customize.ts` + `editor/look.ts` (créateur de combattant).
3. **Modèles présents** : 4 GLB (homme/femme × manga/réaliste) + masques et métadonnées pour la personnalisation.
4. **Squelettes** : rig Mixamo 52 os (voir ci-dessus) ; `engine/rig.ts` mesure les longueurs réelles et applique des limites articulaires (coude, genou).
5. **Animations disponibles** : boxe, kick-boxing, muay-thaï, MMA (dont sol en solo), BJJ et judo solo (`engine/library/`).
6. **Déclenchement** : `engine/player.ts` (`ComboPlayer`) lit une suite de techniques, avec lecture, pause, vitesse (ralenti), répétition, rounds.
7. **Transitions** : fondu entre la pose de fin et la pose de début (`engine/motion.ts`), états debout/sol et validation des enchaînements (`domain/transitions.ts`), retour à la garde.
8. **Sélection des disciplines** : `ui/screens/Train.tsx`, `Discipline.tsx`, référentiel central d'illustrations.
9. **Entraînement** : `ui/screens/Training.tsx` (studio blanc, consignes, coach IA, caméra Auto par technique).
10. **Enchaînements** : `ui/screens/Builder.tsx` + validation `transitions.ts` ; catalogue officiel des légendes séparé des créations de l'utilisateur.
11. **Personnalisation** : morphologie (taille, jambes, corpulence), peau, cheveux, barbe, tenues, gants, protections, couleurs (`customize.ts`).
12. **Android** : qualité Auto qui passe en mode Économie si les images par seconde chutent (`PerformanceMonitor`), DPR limité. Pas de compression Draco effective. **60 images/s non mesurées sur un vrai téléphone.**

## 3. Limites constatées

- **Définition musculaire** : la forme vient des cibles MakeHuman (volumes larges). Il n'y a **pas de carte de relief (normal map)** : les séparations des muscles (abdominaux, pectoraux, deltoïdes, dentelés) ne sont suggérées que par la texture. C'est la première cause du rendu « mannequin ».
- **Éclairage** : correct mais plat pour faire ressortir les volumes.
- **Deux personnages** : le moteur n'anime qu'un coach à la fois. Les projections, passages et soumissions sont décrits en fiches, pas animés.
- **Statut de validation des animations** : non tracé par technique (validée, à corriger, manquante).
- **Dossier du générateur** : hors du dépôt Git (copie dans les fichiers du projet seulement). Corrigé en v0.14.0 : `tools/generator`.

## 4. Ressources externes vérifiées

| Ressource | Licence | Décision |
|---|---|---|
| MPFB2 (code) | GPL 3 | Outil Blender seulement, **jamais livré dans l'application**. |
| MPFB2 / MakeHuman (maillages, cibles, yeux) | CC0 | Utilisés. |
| `upf-gti/retargeting-threejs` | Apache 2.0 | Pas nécessaire tant que nos animations sont calculées sur notre propre squelette ; à reconsidérer si on importe de la capture de mouvement. |
| `@pixiv/three-vrm` | MIT | Pas nécessaire : nos deux coachs partagent déjà un squelette standard (Mixamo). Utile seulement si des modèles VRoid sont fournis. |
| CMU Motion Capture Database | Utilisation libre, revente des données interdite | **Site inaccessible depuis cet environnement.** Peu de séquences de boxe, aucune de judo ou de BJJ exploitable telle quelle. |

## 5. Architecture cible (sans repartir de zéro)

- Garder : moteur IK et bibliothèque de mouvements, `ComboPlayer`, transitions, caméra Auto, personnalisation, styles de rendu.
- Améliorer, dans l'ordre :
  1. **Corps** : générateur dans le dépôt (`tools/generator`), musculature renforcée et **carte de relief anatomique** cuite dans Blender, éclairage qui sculpte les volumes. Même squelette, donc toutes les animations restent compatibles.
  2. **Registre des animations** : statut validée / à corriger / manquante par technique, affiché honnêtement.
  3. **Moteur à deux personnages** : chronologie commune et points de contact, pour le judo, le BJJ et le MMA.
  4. Optimisation mesurée sur Android (taille des textures, niveaux de détail).

## 6. Réalisé en v0.14.0 (branche `feature/combat-shadow-v2`)

| Élément | État |
|---|---|
| Carte de relief anatomique cuite (4 modèles) | Implémentée, vérifiée par rendus avant/après (face, dos, Encre, Manga, Réaliste). |
| Relief conservé par les 3 styles de rendu | Implémenté ; tests automatiques : voir rapport du lot. |
| Générateur dans le dépôt + documentation du pipeline | `tools/generator/README.md`. |
| Squelette, maillage, animations | **Inchangés** (même rig, mêmes repères `meta.json`) : aucune animation à reprendre. |
| Testé sur téléphone réel | **Non.** |
