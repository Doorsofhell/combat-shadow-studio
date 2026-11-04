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
| 1 | Tonemapping « Neutral » à la place d'ACES (à valider en A/B) | ACES par défaut de React Three Fiber : il ternit et décale les teintes de peau | `src/three/CoachStage.tsx` | 0,5 j | À FAIRE |
| 2 | Occlusion ambiante cuite dans les plis anatomiques (couleurs de sommet), dans les deux qualités | Pas d'ombres en mode Auto sur téléphone (`CoachStage.tsx` l. 317), aucune AO : corps à plat | `tools/generator/rocketbox/`, `src/three/photoMaterials.ts` | 1 j | À FAIRE |
| 3 | Normales soudées entre corps et tête (nuque) | Corps et tête sont deux maillages : ligne d'ombrage à la nuque | `tools/generator/rocketbox/`, `public/coaches/*/photo.glb` | 0,5 j | À FAIRE |
| 4 | Retrait du maillot sculpté dans le corps (Inaya, puis Amara : même corps Sports_Female_01) | Effet « emboîté » du buste : la 1.15 a lissé les pièces du maillot, sans les retirer | `tools/generator/rocketbox/flatten_halter.py` (remplacé), `extra_textures.py`, `outfits.py`, `morph_apply.py` | 2-3 j | À FAIRE |
| 5 | Os de torsion (bras, avant-bras, cuisse) et lissage des poids | Toute la pronation se concentre dans quelques rangées de peau (`rig.ts` l. 681-686 : 55 % sur l'avant-bras, 100 % sur la main) | `tools/generator/rocketbox/convert.py`, `src/engine/rig.ts` | 2-3 j | À FAIRE |
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
