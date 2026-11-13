# Coachs MakeHuman (Axel, Kaila)

Coachs construits à partir de MakeHuman (1.6.0, demande de Youssef du 28/10/2026 : « 2 coachs supplémentaires mieux aboutis »).
Toutes les ressources utilisées sont CC0 (voir `docs/LICENCES.md`). Le code de MPFB2 (GPL v3) sert seulement à générer les fichiers ; il n'est pas livré avec l'appli.

## Prérequis

- `pip install bpy` (Blender 5.2 en module Python) et l'extension MPFB2 installée par `python3 tools/generator/install.py mpfb.zip` (zip fait à partir de `src/mpfb` de github.com/makehumancommunity/mpfb2).
- Les packs d'assets MakeHuman de files.makehumancommunity.org, décompressés dans un dossier `ASSETS/` : `makehuman_system_assets_cc0`, `hair01_cc0`, `eyebrows01_cc0`, `eyelashes01_cc0` (et `skins0x_cc0` si une recette les utilise).
- `@gltf-transform/cli` (npm) pour compresser les textures.

## Fabrication d'un coach (exemple : Kaila)

```sh
R=tools/generator/coaches/recipes/kaila.json
# 1. modèle Anime (même recette que Kadir et Amara) : model.glb, meta, masques, relief
CSS_STYLE=manga CSS_EDITOR=1 CSS_RECIPE=$R python3 tools/generator/build.py -- female OUT/kaila EYES/high-poly/high-poly.mhclo EYES/materials/brown_eye.png 2048
python3 tools/generator/coaches/face_paint.py public/coaches/kaila/model.glb public/coaches/kaila/model.meta.json $R public/coaches/kaila/model_face.png
# 2. modèle Ultra-réaliste (peau photo, yeux, sourcils, cils, cheveux MakeHuman ; relief de l'étape 1)
python3 tools/generator/makehuman/build_photo.py -- $R ASSETS OUT/kaila.glb OUT/kaila/female_manga_kaila_normal.png
npx gltf-transform webp OUT/kaila.glb public/coaches/kaila/photo.glb --quality 85
npx gltf-transform resize public/coaches/kaila/photo.glb public/coaches/kaila/photo.glb --width 1024 --height 1024 --pattern "*hair*"
# 3. tenues des 6 disciplines, sur le modèle non compressé (mêmes points que photo.glb)
MH_BODY=1 DECIMATE=1 python3 tools/generator/rocketbox/outfits.py -- OUT/kaila.glb public/coaches/kaila/tenues femme
# 4. portrait (studio de l'appli)
npm run visuels -- --only portraits --id kaila
```

## Recette (`"photo"` dans la recette du coach)

| clé | rôle |
| --- | --- |
| `skin`, `skin_tint` | peau photo MakeHuman, multipliée par un teint |
| `hair`, `hair_tint`, `hair_cut` | cheveux (cartes alpha), recolorés ; `hair_cut` enlève tout ce qui est devant ce plan (mètres derrière les yeux) et les petits morceaux isolés |
| `scalp` | cuir chevelu peint (couleur, force) : cheveux plaqués en arrière, ou coupe rase |
| `eyebrows`, `eyelashes`, `eyes` | sourcils, cils, iris |
| `tattoo` | tatouage tribal peint (bras gauche, côtes gauches) |
| `stubble` | barbe de deux jours peinte (couleur, force) : menton, mâchoire, lèvre supérieure, autour des lèvres mesurées sur le maillage |
| `skin_normal_from`, `skin_normal`, `skin_normal_blur` | relief fin de la peau (pores, petits plis) pris dans la normal map d'une autre peau MakeHuman, filtré passe-haut (ses muscles et cicatrices ne passent pas), force, rayon du filtre (px sur 2048) |
| `relief_size` | taille de la normal map finale (1024 par défaut, pour les téléphones) |
| `subdiv`, `decimate` | une subdivision puis réduction (42 800 triangles, comme Kadir) ; sans ces clés, le maillage de base (26 700 triangles) |

## Pièges connus

- `outfits.py` doit tourner avec `MH_BODY=1 DECIMATE=1` : sinon les bords de la brassière et des ceintures sortent en dents de scie (le maillage MakeHuman a des faces plus grandes que Rocketbox).
- La taille femme de MakeHuman n'est pas linéaire (0,56 donne 1,65 m avec les autres réglages de Kaila) : vérifier la taille avant de mettre `scale`.
- Lancer chaque construction dans son propre dossier de travail : les textures intermédiaires (`<id>_hair.png`…) s'écrivent à côté de la sortie et deux constructions du même coach en parallèle s'écrasent (PNG corrompu, cheveux blancs).
- Peau `mindfront_aksel_skin` : couleur inutilisable (œil au beurre noir, cicatrices peintes), et sa normal map a des cicatrices au visage. Le relief fin vient de `mindfront_skin_male_african_middleage`, filtré.
- Ne jamais nommer un script bpy `inspect.py` (il masque le module standard et Blender plante).
