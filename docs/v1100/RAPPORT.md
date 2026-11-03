# 1.10.0 · Réalisme des coachs, des tenues et des accessoires

Demande de Youssef du 03/11/2026, 15:47. Base vérifiée : 1.9.0 (`feature/combat-shadow-v030`, f180064, même contenu
que 646b293). Branche `claude/project-thread-tdjen4`, point de restauration `restauration/avant-realisme-v1100`.
Rien n'est fusionné ni publié.

## 1. Chemin de rendu réellement utilisé (vérifié)

- Coach : `src/three/PhotoCoach.tsx` charge `public/coaches/<id>/photo.glb`. Kadir et Amara viennent de Rocketbox
  (en cm sous une échelle 0,01), Axel et Kaila de MakeHuman (en m). `GeneratedCoach` ne sert que de secours.
- Tenue : `public/coaches/<id>/tenues/<tenue>.glb`, liée au squelette du coach par `useOutfit`
  (`src/three/outfit.ts`). La peau couverte est masquée d'après la position de ses points (`hideBody`).
- Tenues générées par `tools/generator/rocketbox/outfits.py` (Blender bpy 5.2.3), coques tirées d'une copie du
  corps avec les poids du corps.
- Lab (`#/lab`) : avant la 1.10, il n'utilisait pas les lumières de l'appli. Il les utilise maintenant
  (`light=app|vive|sombre`), ce qui rend les captures représentatives.

## 2. Défauts constatés, classés, et corrections

| # | Défaut constaté (vérifié) | Catégorie | Correction | Preuve |
|---|---|---|---|---|
| 1 | Gants de boxe : le poing suivait l'avant-bras à 76 % et la manchette la main. La projection sur l'axe avant-bras → poignet était inversée dans `boxing_glove_v2`. | poids (skinning) | Poids recalculés selon la position (poing = main 100 %, bout de manchette = avant-bras 100 %, transition lissée de 8 cm) | test spatial `realisme-v1100` (4 coachs × 3 tenues × 2 mains) |
| 2 | Gants de thaï identiques aux gants de boxe | géométrie | Coupe thaïe dans `glove.py` (rembourrage étalé, pouce serré, manchette plus courte d'environ 2 cm) | test « manchette thaïe plus courte de plus de 1,2 cm » |
| 3 | Yeux, sourcils et cils traités comme des cheveux : la regex `/opacity/` prenait `Eyes_opacity`. Les mèches n'étaient dessinées que d'un côté. | matériau | `photoPart()` classe explicitement (extras `css_kind`, puis noms). Cheveux, sourcils et cils dessinés des deux côtés avec alpha-to-coverage. Cornée MakeHuman gardée découpée. | tests de classification |
| 4 | `PhotoCoach` et `dress()` perdaient des propriétés des matériaux sources (faces doubles, couleurs de sommets, transparence, cartes) | matériau | `physicalFrom()` et `standardParams()` reprennent toutes les propriétés | tests de conservation |
| 5 | Pli marqué sous l'omoplate droite de Kadir en garde. C'est un pli de peau (les poids passent du bras à l'omoplate sur une ou deux rangées de triangles) assombri par l'ombre portée, pas un défaut de normal map. | poids, puis lumière | `smooth_weights.py` lisse les poids autour des épaules sans bouger aucun point (Kadir `epaules=0.16:14`). L'ombre portée sur la peau garde un peu de lumière chaude (diffusion). | pli de garde 74° → 62°, bras levés 124° → 76° (`MESURES_DEFORMATIONS.md`) |
| 6 | Peau étirée sous les bras de Kaila | poids | Lissage `epaules=0.15:12` | étirement en garde 7,2 → 3,1 |
| 7 | Brassière de Kaila : bords en escalier (coupe par plans), bretelles flottantes, trou sur le côté sous le bras, bande sombre dessous (brassière peinte dans la texture de peau) | géométrie | Coupe par champ (`iso_cut`) : bords lisses, bretelles posées sur la peau (spline relâchée, distance dans le plan tangent), emmanchure, côté continu jusqu'au bras, bande descendue sous la brassière peinte | captures « après » |
| 8 | Brassière d'Amara étendue jusqu'aux avant-bras (au repos, les avant-bras Rocketbox sont à hauteur de poitrine) : une nappe de tissu entourait les bras en mouvement | géométrie | Le dégagement des bras couvre aussi l'avant-bras et s'arrête aux épaules | test « brassières entre les épaules » |
| 9 | Peau qui traversait la bretelle avant de Kaila pendant le jab | géométrie | Brassière à 5,5 mm de la peau au lieu de 3,8 mm | capture du jab en mouvement |
| 10 | Shorts : vale-tudo évasé, ourlets épais, sous-vêtement peint visible au-dessus de la ceinture (Kadir) | géométrie | Coupe par champ (taille et ourlets exacts), tissu de 2,5 mm pour vale-tudo, compression et kick, vale-tudo sans évasement, ceinture remontée au-dessus du sous-vêtement peint (lu dans la texture) | captures « après » |
| 11 | Chaussures de boxe : bout entaillé, col déchiqueté, peau qui coulait derrière le talon | géométrie | Marge avant plus grande, col coupé droit, peau masquée à moins de 6 mm sous la tige | captures pieds |
| 12 | Peau uniforme, terminateur gris, ombres doublées (ombre peinte dans la photo plus ombre portée) | matériau, lumière | `skinShader.ts` : diffusion approchée (lumière enroulée, plus en rouge), ombre portée adoucie et chaude, pores atténués avec la distance, rugosité variable. Réglages par coach dans `SKIN_LOOK` (relief 1,15 à 1,5 au lieu de 1,5 pour tous). Pas de passe ni de texture en plus. | tests du shader, captures sous 3 lumières |
| 13 | Effet « casque » des cheveux : pointes coupées net | matériau | Fondu alpha sur les 2,5 derniers cm des mèches (`hairFadeAttribute`). Bords des textures étendus sous l'alpha (`alpha_bleed.py`) : plus de liseré blanc. | captures visage et dos |
| 14 | Thorax immobile | animation | `breath.ts` : thorax et ventre gonflent de 3 à 5 mm (14/min au repos, jusqu'à 30 en effort, expiration à la frappe), vêtements compris. Aucun os ne bouge. | `breath.test` |
| 15 | Respiration (défaut introduit puis corrigé pendant ce lot) : en mouvement, la brassière d'Amara et la ceinture de Kadir étaient projetées à plusieurs centimètres. Le déplacement suivait `objectNormal`, que three.js a déjà posée au moment où le point est déplacé : la pose était donc appliquée deux fois. Trouvé par la mesure de performance, pas par les captures fixes (respiration à zéro). | animation (shader) | Déplacement le long de la normale de repos | `breath.test` vérifie le code du shader ; capture du jab en mouvement |
| 16 | Veste de gi et pans de ceinture figés | animation | `sway.ts` : ressort amorti par vêtement, piloté par la vitesse du bas du vêtement. Nœud fixe ; le judo, plus lourd, bouge moins. | `sway.test` |

## 3. Mesures

### Déformations aux articulations (processeur, peau posée comme dans l'appli)

Voir `docs/v1100/MESURES_DEFORMATIONS.md` (généré par `src/engine/__tests__/deformation-v1100.test.ts`), avec la
référence 1.9.0 dans `deformations-1.9.0.json`. Aucune zone d'aucun coach ne se dégrade (tolérance : pli +4°,
étirement ×1,05). Les épaules ont une tolérance d'écrasement plus large : dans le pli intérieur de l'aisselle, les
triangles deviennent plus petits, comme la vraie peau qui s'y plisse.

### Poids des fichiers (tous les coachs et tenues)

- Triangles : 950 388 → 1 062 160 (+12 %).
- Poids des fichiers : 50,1 → 55,8 Mo.
- Parties dessinées : 218 → 218.

Le surcoût vient surtout des brassières et des shorts coupés par champ, qui ajoutent des triangles près des bords.
Le détail est dans le tableau ci-dessous.

### Performance sur ordinateur

**Ce n'est pas une mesure Android.** Mesure faite avec Chromium en rendu logiciel (swiftshader, sur processeur), à
360×640, dans le Lab : jab, visage animé, lumières de l'appli. Médiane de 40 images, deux séries par version.

| coach, tenue | chargement 1.9.0 → 1.10.0 | image (médiane) 1.9.0 → 1.10.0 |
|---|---|---|
| Kadir, MMA | 4,7 s → 4,6 s | 208 ms → 233 ms (+12 %) |
| Amara, boxe | 4,1 s → 4,0 s | 217 ms → 317 ms (+46 %) |
| Axel, judo | 3,9 s → 4,0 s | 500 ms → 517 ms (+3 %) |
| Kaila, MMA | 4,0 s → 4,5 s | 300 ms → 408 ms (+36 %) |

Le rendu logiciel grossit le coût des pixels et des petits triangles. Ces écarts ne disent donc pas ce que fera un
téléphone : la mesure Android reste à faire sur un vrai appareil. Si elle montre un coût trop élevé, deux leviers
existent : la densité de la coupe des bords (`iso_cut`, `near` 0,016 → 0,008 : environ −20 % de triangles sur les
brassières, mais des bords un peu ondulés) et les pores, qui sont désactivés en qualité basse.

### Tableau des triangles

| coach | fichier | triangles 1.9.0 → 1.10.0 | parties | Mo |
|---|---|---|---|---|
| mma-kadir | photo | 44148 → 44148 | 3 → 3 | 2.52 → 2.52 |
| mma-kadir | boxe | 15550 → 17448 | 6 → 6 | 0.98 → 1.06 |
| mma-kadir | kickboxing | 13566 → 15666 | 6 → 6 | 0.89 → 0.98 |
| mma-kadir | muaythai | 12906 → 14988 | 6 → 6 | 0.81 → 0.91 |
| mma-kadir | mma | 7676 → 9824 | 5 → 5 | 0.51 → 0.60 |
| mma-kadir | bjj | 19486 → 19486 | 10 → 10 | 0.96 → 0.96 |
| mma-kadir | bjj-nogi | 18542 → 22938 | 5 → 5 | 0.98 → 1.16 |
| mma-kadir | judo | 19460 → 19460 | 10 → 10 | 0.97 → 0.97 |
| mma-amara | photo | 50880 → 50880 | 3 → 3 | 2.87 → 2.87 |
| mma-amara | boxe | 20646 → 31232 | 8 → 8 | 1.45 → 2.15 |
| mma-amara | kickboxing | 18628 → 29070 | 8 → 8 | 1.41 → 2.10 |
| mma-amara | muaythai | 18016 → 28692 | 8 → 8 | 1.28 → 1.98 |
| mma-amara | mma | 15306 → 22626 | 5 → 5 | 1.15 → 1.66 |
| mma-amara | bjj | 34896 → 34880 | 11 → 11 | 2.15 → 2.15 |
| mma-amara | bjj-nogi | 19570 → 19562 | 2 → 2 | 1.27 → 1.27 |
| mma-amara | judo | 34784 → 34772 | 11 → 11 | 2.16 → 2.16 |
| axel | photo | 49086 → 49086 | 5 → 5 | 2.30 → 2.25 |
| axel | boxe | 22076 → 25351 | 6 → 6 | 1.26 → 1.41 |
| axel | kickboxing | 24390 → 27726 | 6 → 6 | 1.32 → 1.46 |
| axel | muaythai | 19138 → 22508 | 6 → 6 | 1.05 → 1.21 |
| axel | mma | 19332 → 22904 | 5 → 5 | 1.04 → 1.19 |
| axel | bjj | 40324 → 40324 | 10 → 10 | 1.70 → 1.70 |
| axel | bjj-nogi | 41868 → 48872 | 5 → 5 | 1.81 → 2.11 |
| axel | judo | 40244 → 40244 | 10 → 10 | 1.72 → 1.72 |
| kaila | photo | 50760 → 50760 | 5 → 5 | 2.47 → 2.44 |
| kaila | boxe | 30462 → 40423 | 8 → 8 | 1.65 → 2.11 |
| kaila | kickboxing | 32508 → 42584 | 8 → 8 | 1.73 → 2.19 |
| kaila | muaythai | 27616 → 38030 | 8 → 8 | 1.48 → 1.96 |
| kaila | mma | 26048 → 35188 | 5 → 5 | 1.38 → 1.79 |
| kaila | bjj | 61784 → 61788 | 11 → 11 | 2.59 → 2.59 |
| kaila | bjj-nogi | 38956 → 38960 | 2 → 2 | 1.64 → 1.64 |
| kaila | judo | 61736 → 61740 | 11 → 11 | 2.60 → 2.60 |

## 4. Tests

- TypeScript (`npx tsc -b`) : TEST RÉUSSI.
- Build (`vite build`, titre v1.10.0) : TEST RÉUSSI.
- Vitest complet : 991 RÉUSSIS, 1 ignoré (déjà ignoré en 1.9.0). Nouveaux : `realisme-v1100` (gants, coupe thaïe, matériaux, brassières entre les épaules), `deformation-v1100` (4 coachs × 7 poses × 4 zones contre la 1.9.0), `breath`, `sway`.
- Playwright ciblé (`coach-3d-recovery`, `coach-render`, `coach-studio`, `coachs-v160`, `ecran-coach-v140`, `moteur-lumiere`, `outfit-loading`) : 30 RÉUSSIS.
- Playwright complet (282 tests, environ 40 min) : NON EXÉCUTÉ.
- Téléphone Android réel : NON EXÉCUTÉ.
- Captures avant/après : 36 planches dans `docs/v1100/captures/` (`tenues-*`, `detail-*`, `lumieres-*`) et page de comparaison https://claude.ai/artifact/CAejygcuEVDqz1siRRa2nM.

## 5. Limites restantes

- Protège-tibias, gants de MMA et prajioud : pas retravaillés dans ce lot (seuls les poids des gants de MMA
  viennent du corps, comme avant).
- Gi de BJJ et de judo : la différence vient du tissu, du col et du mouvement (le judo est plus lourd). La coupe
  elle-même n'a pas changé.
- Kaila : à certains angles, un petit cran reste visible sur le côté de la brassière, sous le bras, en garde.
- Mains et pieds : l'anatomie dépend toujours des modèles sources. Aucun correctif de forme (blend shapes) n'a été
  ajouté.
- Le masquage du corps sous les vêtements n'est pas présenté comme une résolution des collisions : en pose
  extrême (high kick, sol), le tissu peut encore passer sous la peau à certains endroits.
- Android : rien n'a été mesuré sur téléphone.

## 6. Reproduire

```sh
# tenues (bpy 5.2.3, pip) : 4 coachs x 7 tenues, puis les arbitres
tools/generator/rocketbox/regen_outfits.sh
(cd /tmp/css-outfits/mma-kadir && ONLY=arbitre-judo python3 $PWD/tools/generator/rocketbox/outfits.py -- public/coaches/mma-kadir/photo.glb public/coaches/mma-kadir/tenues homme)
(cd /tmp/css-outfits/mma-amara && ONLY=arbitre python3 $PWD/tools/generator/rocketbox/outfits.py -- public/coaches/mma-amara/photo.glb public/coaches/mma-amara/tenues femme)
# poids lissés (déjà appliqués aux photo.glb livrés)
python3 tools/generator/rocketbox/smooth_weights.py public/coaches/mma-kadir/photo.glb epaules=0.16:14
python3 tools/generator/rocketbox/smooth_weights.py public/coaches/kaila/photo.glb epaules=0.15:12
# textures des cheveux (déjà appliqué)
python3 tools/generator/makehuman/alpha_bleed.py public/coaches/kaila/photo.glb 0.9
python3 tools/generator/makehuman/alpha_bleed.py public/coaches/axel/photo.glb 1.0
# captures avant/après : même pose, caméra, lumière et instant (Lab, image fixe, respiration à zéro)
npx vite build --outDir /tmp/dist && npx vite preview --outDir /tmp/dist --port 4181
BASE=http://localhost:4181 node scripts/dev/shot-realisme.mjs <dossier> all     # COACHES, OUTFITS, LIGHTS
# mesures
npx vitest run src/engine/__tests__/deformation-v1100.test.ts src/three/__tests__/realisme-v1100.test.ts
```
