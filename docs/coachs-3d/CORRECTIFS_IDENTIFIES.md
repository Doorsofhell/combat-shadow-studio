# Correctifs identifiés pour les coachs 3D

Source : études de faisabilité du 04/11/2026 (fil « Évaluer la construction de coachs 3D maison »), faites sur la
version 1.17.0 (`16ecd16`) et sur `Doorsofhell/cme-3d-motion-lab` v0.7.54. Demande de Youssef (04/11 16:07) :
« sauvegarde déjà la liste des correctifs identifiés, puis passe aux corrections avec un gain max les moins coûteuses ;
à chaque mise à jour, marque-le dans le fichier des correctifs identifiés comme fait ».

Ordre de traitement : le meilleur gain pour le moindre coût d'abord. Chaque ligne passe à **FAIT** avec la version,
le commit et la vérification (mesure ou capture) quand elle est livrée. Le détail de chaque correction va aussi dans
`docs/JOURNAL_CORRECTIONS.md`.

Légende du statut : À FAIRE · EN COURS · FAIT · ABANDONNÉ (avec la raison).

| # | Correctif | Défaut corrigé (constat vérifié) | Fichiers | Coût estimé | Statut |
|---|---|---|---|---|---|
| 1 | Tonemapping « Neutral » à la place d'ACES (à valider en A/B) | ACES par défaut de React Three Fiber : il ternit et décale les teintes de peau | `src/three/CoachStage.tsx` | 0,5 j | **ABANDONNÉ** (04/11) : essayé puis retiré. Mesuré sur Inaya et Kadir (Lab, lumières app et vive) : écart de luminance moyenne < 1 %, saturation 0,514 contre 0,512, 7 pixels sur 187 000 différant de plus de 15/255. Avec l'exposition qui garde la même luminosité, Neutral et ACES donnent la même image sur ces scènes sans hautes lumières : aucun gain visible |
| 2 | Occlusion ambiante cuite dans les plis anatomiques (couleurs de sommet), dans les deux qualités | Pas d'ombres en mode Auto sur téléphone (`CoachStage.tsx` l. 317), aucune AO : corps à plat | `tools/generator/rocketbox/`, `src/three/photoMaterials.ts` | 1 j | **ABANDONNÉ** (04/11) : réalisé puis retiré. Occlusion cuite sur les 6 coachs (64 rayons par point, rayon 5 cm, plis limités aux segments voisins), appliquée par le shader de peau. Mesuré sur 9 paires de captures avant/après (garde, buste, visage, high kick, changement de niveau ; Inaya, Kadir, Amara) : 0,0 à 0,1 % des pixels du coach assombris de plus de 8/255. Raison : la pose de repos Rocketbox est ouverte (bras écartés, jambes droites), les plis n'y existent pas ; ils naissent pendant les mouvements, qu'une occlusion figée ne peut pas suivre. Le gain serait réservé à une occlusion calculée à l'écran, trop chère sur téléphone |
| 3 | Normales soudées entre corps et tête (nuque) | Corps et tête sont deux maillages : ligne d'ombrage à la nuque | `tools/generator/rocketbox/`, `public/coaches/*/photo.glb` | 0,5 j | **ABANDONNÉ** (04/11) : constat erroné. Vérifié dans les GLB : les normales du corps et de la tête sont déjà identiques à la nuque (0,0° d'écart sur 136 points pour Inaya, 56 pour Kadir). Les seules normales cassées restantes sont au bout des doigts (Amara, Inaya) et, chez Amara seule, au bord du maillot sculpté : traitées par le n° 4 |
| 4 | Retrait du maillot sculpté dans le corps (Inaya, puis Amara : même corps Sports_Female_01) | Effet « emboîté » du buste : la 1.15 a lissé les pièces du maillot, sans les retirer | `tools/generator/rocketbox/fair_bikini.py` (nouveau), `outfits.py`, `public/coaches/inaya/` | 2-3 j | **FAIT pour Inaya** (v1.18.0, 04/11, PR en attente de « je valide ») : cordon du cou, bourrelet du dos et contour des bonnets effacés ; triangles d'ourlet tournés vers l'intérieur 305 → 20 ; bosse du dos 3,7 → < 2 mm ; poitrine gardée ; test des déformations inchangé et réussi. Captures `docs/v1180/captures/`. **Amara : non appliqué** (maillot peint en noir : il resterait visible et se déformerait ; il faudrait repeindre sa peau d'abord, à décider) |
| 5 | Os de torsion (bras, avant-bras, cuisse) et lissage des poids | Toute la pronation se concentre dans quelques rangées de peau (`rig.ts` l. 681-686 : 55 % sur l'avant-bras, 100 % sur la main) | `tools/generator/rocketbox/convert.py`, `src/engine/rig.ts` | 2-3 j | **ABANDONNÉ** (04/11) : mesuré avant d'être fait. Zone de 6 cm autour des poignets ajoutée à la mesure des déformations (`deformation-v1100.test.ts`, 6 coachs, garde, jab, crochet, bras levés) : pli 12 à 33°, plus petit triangle à 37 % de son aire au repos ou plus, étirement 1,27 à 1,76. Aux coudes : 30 à 119°, jusqu'à 2 % de l'aire. Aux aisselles : jusqu'à 93° et un étirement de 4,87. La torsion de l'avant-bras ne fait donc pas de défaut notable, et les poignets sont couverts par les gants ou les bandes dans la plupart des disciplines. Les défauts mesurés sont aux coudes et aux aisselles : c'est le n° 6 |
| 6 | Correctifs automatiques pilotés par les angles (épaule, coude, hanche, genou), corps et tenues | Plis de 102 à 135° et triangles écrasés à 2 % de leur aire à l'aine et au genou (`docs/v1100/MESURES_DEFORMATIONS.md`) | Blender (nouveau script), module après `CoachRig.apply`, `deformation-v1100.test.ts` | 3-4 j | À FAIRE |
| 7 | Textures KTX2/Basis et géométrie meshopt : normal map du corps en 2048 en qualité haute | La normal map du corps est réduite à 1024 px (`convert.py`) : relief musculaire flou | `convert.py`, chargeur des GLB, chaîne de l'artefact | 1,5-2 j | À FAIRE |
| 8 | Moteur de mouvements commun CME / Shadow | CME garde une copie ancienne du moteur (`rig.ts` 811 lignes contre 1 109) | `src/engine`, `cme-3d-motion-lab/src/shadow-engine` | 1,5-3 j | À FAIRE |
| 9 | Couche morphologique : cibles MakeHuman CC0 transférées, longueurs d'os, tenues synchronisées, masquage par indices | Coachs photo : seule la longueur des jambes se règle ; CME étire les sommets autour de l'origine sans bouger les os | Blender, `PhotoCoach.tsx`, `outfit.ts`, `pose.ts`, CME `coachGeometry.ts` | 8-12 j | À FAIRE |
| 10 | Micro-relief des pores en normal map tuilée (optionnel) | Pores simulés par du bruit dans l'albédo | `src/three/skinShader.ts` | 1 j | À FAIRE |
| 11 | Mouvement secondaire des tissus mous (optionnel) | Corps rigide pendant les accélérations | `src/three/breath.ts` | 2-3 j | À FAIRE |

À éviter (étude du 04/11) : dual quaternion skinning, simulation de tissu en temps réel, muscles dynamiques
multicouches, amélioration de l'étirement CPU de CME (à remplacer par le n° 9), remplacement de Rocketbox à ce stade.

## Historique des mises à jour

- 2026-11-04 : liste créée (11 correctifs, tous À FAIRE).
- 2026-11-04 : n° 1 et n° 3 vérifiés puis abandonnés (pas de gain mesurable, défaut absent). Suite : n° 2.
- 2026-11-04 : n° 2 réalisé, mesuré sans effet visible, retiré. Suite : n° 4 (buste d'Inaya), puis n° 5 et n° 6, les seuls dont le défaut est démontré par des mesures.
- 2026-11-04 : n° 4 fait pour Inaya (v1.18.0) ; Amara essayé, non appliqué (maillot peint). Suite : n° 5 (os de torsion).
- 2026-11-04 : n° 5 mesuré avant d'être fait (poignets : défaut faible face aux coudes et aux aisselles), abandonné. Suite : n° 6 (coudes, aisselles, aine, genoux).
