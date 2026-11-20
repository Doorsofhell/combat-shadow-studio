# Générateur des coachs 3D (Blender + MPFB2 → GLB → Three.js)

`build.py` produit les quatre modèles de `public/models/` :

| Fichier | Commande |
|---|---|
| `coach_male_manga.glb` + `.meta.json` + `_masks.png` | `CSS_STYLE=manga CSS_EDITOR=1 python3 build.py -- male <sortie> <yeux.mhclo> <iris.png> 2048` |
| `coach_female_manga.glb` + `.meta.json` + `_masks.png` | idem avec `female` |
| `coach_male.glb` (style Réaliste) | `CSS_STYLE=realiste python3 build.py -- male …` |
| `coach_female.glb` | idem avec `female` |

Les styles Encre et Manga utilisent les GLB `_manga` (cheveux et barbe peints à l'exécution par le créateur de combattant).

## Installation (gratuite)

1. `pip install bpy` (Blender 5.x comme module Python, GPL).
2. MPFB2 (github.com/makehumancommunity/mpfb2, code GPL 3, données CC0) : construire le zip de l'extension puis
   `python3 install.py mpfb.zip`.
3. Yeux MakeHuman (CC0) : dossier `makehuman/data/eyes` du dépôt makehuman (`high-poly/high-poly.mhclo`, `materials/brown_eye.png`).

MPFB2 et Blender sont des **outils** : rien de leur code n'est livré dans l'application, seulement les modèles produits (maillage et cibles CC0, textures générées par nos scripts).

## Étapes du script

1. Corps MakeHuman de base, cibles morphologiques (masse musculaire, proportions de combattant, homme/femme).
2. Squelette **Mixamo de MPFB** : 52 os dont doigts à 3 phalanges, identique pour les deux coachs. Les animations de l'application (`src/engine`) mesurent ce squelette au chargement : ne pas renommer les os.
3. Vêtements découpés dans le corps (short, brassière), yeux.
4. Texture de peau peinte texel par texel à partir de la **carte de positions** cuite (pose de repos, mètres, +X = côté gauche, -Y = devant, +Z = haut), multipliée par une occlusion ambiante cuite.
5. **Relief anatomique** (`anatomy.py`, v0.14.0) : une carte de hauteur des sillons entre les muscles (ligne blanche, intersections des abdominaux, bord des pectoraux, pli de l'aine, dentelés, colonne et érecteurs, omoplates, deltoïdes, biceps/triceps, avant-bras, cuisses, mollets), placée à partir des articulations MakeHuman. Elle est cuite en **carte de normales tangentes** (nœud Bump → bake NORMAL) et assombrit légèrement la peau dans les sillons. Amplitude femme = 0,62 × homme.
   - `CSS_RELIEF=0` désactive le relief, `CSS_RELIEF_DEPTH` (défaut 0.004) règle sa profondeur.
   - Aperçus : `<who>_normal.png`, `<who>_relief_preview.png` dans le dossier de sortie.
6. Export glTF binaire : textures JPEG qualité 86, pas d'animation, skin exporté, matériau `Skin` avec `normalTexture`.

## Côté application

- `src/three/CoachModel.tsx` charge le GLB, remplace les matériaux de peau (physique pour Réaliste) en **conservant la carte de normales**.
- `src/three/manga.ts` (Encre, Manga) transmet aussi la carte de normales aux matériaux dessinés : les hachures et les lignes de pli suivent les sillons.
- `src/three/customize.ts` lit `meta.json` (repères du visage, bassin…) et `_masks.png` (cheveux, barbe, pilosité).

## Limites connues

- Le module `bpy` installé par pip **ne contient pas Draco** : l'option de compression est ignorée et les GLB ne sont pas compressés (≈ 4,3 à 4,8 Mo chacun). Gain et coût à mesurer avant de compresser (Plan V2, chantier 9).
- Le relief est une carte de normales : il change l'éclairage, pas la silhouette. Les volumes viennent des cibles MakeHuman.
- Temps de génération : ≈ 2 min 20 s par modèle (4 cœurs).
