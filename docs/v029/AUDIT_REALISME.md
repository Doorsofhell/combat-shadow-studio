# v0.29.0 · Audit ultra-réalisme (phase 1)

Date : 2026-10-21. Référence : v0.28.0, commit `95d704d` (tag `restauration/avant-v029`), dernière version
publiée et vérifiée (artifact v32 + GitHub Pages). Branche de travail : `feature/combat-shadow-v029`.

Captures de Youssef : `captures/avant-youssef-ultra-realiste.png`, `captures/avant-youssef-anime.png`
(Kadir, garde MMA).

## 1. Constats vérifiés dans le code

| Défaut vu sur la capture | Cause trouvée dans le dépôt | Fichier |
|---|---|---|
| Barbe « en points » granuleuse | La barbe n'est **pas de la géométrie** : c'est une couleur peinte dans le shader de peau, modulée par un bruit **par texel** (`cssHash(floor(vMapUv * 2048.0))`), d'où les points réguliers. Aucune direction de pousse, aucun volume, bord défini par des seuils géométriques (`beardRegion`). | `src/three/customize.ts` l. 397-424 |
| Cheveux « casque » | Une coque gonflée le long des normales du crâne (`uHairLen * prof`) + la même texture à bruit par texel, + des « mèches » qui sont des lames opaques en `MeshLambertMaterial` (pas de transparence, pas de reflet anisotrope). Ligne frontale = seuil `hair_limit()` lissé. | `customize.ts` l. 486-493, `buildLocks` l. 1651 ; `tools/generator/build.py` l. 169-251 |
| Sourcils peints, pas de cils | Sourcils = arc peint (bruit) dans la texture de peau et `model_face.png` ; cils = trait sombre peint sur la paupière, aucune géométrie. | `build.py` l. 526-553, `coaches/face_paint.py` |
| Pilosité corporelle « taches » | Même bruit par texel, masque `mk.a`. | `customize.ts` l. 426 |
| Peau lisse / cireuse | Texture de base MakeHuman + occlusion cuite ; **aucune carte de pores, de rugosité ou de variation de teinte** ; normal map « relief anatomique » basse fréquence seulement. Ultra-réaliste = `MeshPhysicalMaterial` avec sheen, sans diffusion sous la surface. | `src/three/CoachModel.tsx` l. 99-135, `tools/generator/anatomy.py` |
| Éclairage plat | Hémisphère + 2-3 directionnelles, reflets d'une `RoomEnvironment` uniquement en qualité haute, **ombres désactivées** (`shadows={false}`). Une partie du « plastique » vient de là, pas de la géométrie. | `src/three/CoachStage.tsx` l. 220-244, `StudioStage.tsx` |
| Gants uniformes | Gants = géométrie procédurale simple accrochée de façon rigide à l'os de la main, matériau uni. | `customize.ts` `gloveGeometry` l. 1123 |
| Short sans détail textile | Coque décalée de la peau (`buildShell` + `drapeShell`), skinnée au corps (elle suit donc les mouvements), tissu procédural sans couture ni ceinture modélisée. | `customize.ts` l. 730-943 |
| Pas de tenue par discipline | Chaque coach a **une** tenue fixe (MMA) dans `COACH_LOOKS`. | `src/domain/coaches/looks.ts` |
| Pas d'environnement | Fond uni (thème) + marques au sol. Aucun ring, cage ou tatami. | `StudioStage.tsx`, `GroundMarks.tsx` |
| Style par défaut | `coachStyle: 'encre'` (Anime) par défaut, pas Ultra-réaliste. | `src/store/settings.ts` l. 84 |

Conclusion : les défauts majeurs viennent de la **méthode** (pilosité peinte avec un bruit par pixel,
matériaux et éclairage simples), pas d'un manque de résolution. Augmenter les textures ne suffirait pas.

## 2. Moyens disponibles (vérifiés le 2026-10-21)

- Blender 5.2.2 en module Python (`bpy`), rendu Cycles CPU (4 cœurs). Eevee indisponible (pas d'EGL).
- Réseau : GitHub, npm et PyPI accessibles. **Bloqués** : polyhaven.com, ambientcg.com, blender.org,
  sketchfab.com, opengameart.org, makehumancommunity.org, fab.com, huggingface.co.
  Conséquence : pas de téléchargement direct des textures CC0 de Poly Haven / ambientCG ni des cheveux
  MakeHuman communautaires. Les assets seront **générés par nos outils** (Blender procédural) ou pris dans
  des dépôts GitHub dont la licence est vérifiée et documentée.
- Pas de téléphone Android ici : les performances seront mesurées sur ordinateur (Chromium, profil CPU/GPU
  limité) et marquées « NON EXÉCUTÉ sur appareil » tant que Youssef ne les a pas vérifiées.

## 3. Méthode retenue

1. **Pilosité (priorité)** : générer dans Blender des mèches (courbes) sur le scalp, la barbe, les sourcils et
   les cils du modèle, puis les convertir en **hair cards** (bandes texturées) : texture alpha de mèches
   cuite depuis de vraies courbes, carte de direction et de profondeur. Rendu temps réel : shader de cheveux
   anisotrope (deux reflets de type Kajiya-Kay), alpha testé + alpha-to-coverage (pas de tri cassé),
   ombre de racine sur la peau. Barbe : cards courtes orientées selon le sens de pousse + ombre de rasage
   directionnelle dans la peau (à la place des points). Le bruit par texel est retiré.
2. **Peau** : carte de micro-relief (pores, plis) et de rugosité générées, variation de teinte (rougeurs nez,
   joues, oreilles, phalanges), diffusion sous la surface approchée (wrap lighting + teinte rouge dans les
   ombres), ombres activées, éclairage studio à 3 points + environnement.
3. **Ultra-réaliste par défaut** pour les nouveaux profils ; préférence explicite existante conservée
   (migration testée). Qualité graphique séparée du style : la qualité basse simplifie, sans passer en dessin.
4. **Tenues par discipline** modélisées dans Blender, skinnées sur le squelette existant (pas de duplication
   des personnages) ; gants modélisés et skinnés aux doigts ; kimono/judogi avec manches, pantalon et
   ceinture nouée ; contrôle d'interpénétration sur toutes les animations.
5. **Environnements** : ring, cage, dojo, académie BJJ et studio neutre modélisés dans Blender, textures
   procédurales PBR cuites, éclairage cuit (lightmaps), chargement différé et secours si l'asset échoue.
6. **Options A (tenue) et B (environnement)** indépendantes, activées par défaut, persistantes.
7. **Tests** : matrice des 48 configurations (Playwright), captures face/profil/dos/trois-quarts,
   contrôle d'intersection vêtements/corps sur les animations, non-régression complète.

## 4. Découpage en lots (une version publiée par lot)

| Lot | Contenu |
|---|---|
| 29-1 | Pilosité homme et femme (cheveux, barbe, sourcils, cils, poils discrets) + éclairage/ombres |
| 29-2 | Peau et visages, Ultra-réaliste par défaut avec migration |
| 29-3 | Tenues des 6 disciplines + option A |
| 29-4 | Environnements des 6 disciplines + studio neutre + option B |
| 29-5 | Matrice 48 configurations, mesures de performance, rapport final, pull request (sans fusion) |

## 5. Limites annoncées dès maintenant

- Le niveau « simulation sportive premium » (type jeu AAA) repose d'habitude sur des scans 3D et des
  artistes ; ici tout est généré par code à partir de MakeHuman et Blender. Le gain sera net, mais chaque
  lot montrera des captures avant/après pour que Youssef juge le niveau réel. Rien ne sera déclaré
  « ultra-réaliste » sans sa validation visuelle.
- Les performances Android ne peuvent pas être mesurées ici sur un vrai téléphone.
