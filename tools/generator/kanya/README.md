# Kanya « La Tigresse » (1.51.0)

Coach de muay-thaï dessinée par Youssef (planches générées par Gemini, libres d'utilisation, copiées dans `planches/`),
construite sur une **copie** du corps Rocketbox d'Inaya (MIT) : Inaya ne change pas. Méthode de Victor (1.43) : mêmes
points, même squelette, mêmes 25 expressions ; seuls la tête, les textures, le chignon et les tenues sont neufs.

## Chaîne

Venv Python avec bpy 5.3, numpy, scipy, Pillow (`export PATH=/home/user/venv/bin:$PATH`). Dossier de travail `W`.

1. `pose_export.py` (copie de celui de Kadir) : points, normales, UV et triangles d'Inaya → `inaya.npz` ; textures
   d'Inaya extraites dans `W/tex/`.
2. `forme_tete.py inaya.npz f1.npz` : efface le chignon bas d'Inaya (points ramenés sur l'ellipsoïde du crâne), pommettes
   et mâchoire (≤ 1,4 mm) ; écrit aussi `f1.f32` (déplacements lus par `kanya_build.mjs`).
3. `tete_proj.py inaya.npz f1.npz planches/planche2-tete-7vues.jpg proj.npz 2048` : projette les vues de face, de profil
   (droit et gauche en miroir) et de dos sur la texture (plaque mince entre les repères de `reperes.py`).
4. `VENTRE=planches/planche7-tenue-mma-ventre.png tatouages.py inaya.npz f1.npz planches/planche3-dos-tatouages.jpg
   tat-corps.png tat-tete.png 2048` : encre des tatouages Sak Yant (nuque, omoplates, épaules ; 1.55 : ventre, yant
   central et deux tigres, d'après le gros plan de la planche MMA) en décalcomanies.
5. `NORMALE_SRC=tex/f021_head_normal.jpg TATOUAGES=tat-tete.png tete_compo.py proj.npz tex/f021_head_color.jpg tete.jpg
   masques.npz` : délumage de chaque vue, teint de la planche sur la luminance d'Inaya, égalisation basse fréquence mesurée
   sur la peau seule (pas de plaques sombres), cheveux noirs, iris brun, carte de relief sans l'ancien chignon.
6. `corps.py tex/f021_body_color.jpg masques.json corps.jpg 2048 tat-corps.png` : même gain de teint sur le corps (pas de
   raccord tête/cou), tatouages.
7. `chignon.py f1.npz chignon.npz chignon.jpg` : chignon haut (maillage à part, lié à l'os `Head`).
8. `node tools/generator/rocketbox/kanya_build.mjs public/coaches/inaya/photo.glb W/f1.f32 W/tete.jpg W/corps.jpg
   W/chignon.npz W/chignon.jpg public/coaches/kanya/photo.glb` (`HEAD_NORMAL=W/tete-normale.jpg`). `morph_apply.py`
   n'est pas relancé (les expressions d'Inaya sont gardées). Taille : 1,68 m depuis la 1.55 (`KANYA_SCALE`, 0.9687 par
   défaut ; 1 = la taille d'Inaya), le moteur réglant ses pas sur la taille de chaque coach (journal 1.55.0).
9. Tenues : `tools/generator/rocketbox/regen_outfits.sh boxe,kickboxing,muaythai,mma,bjj,bjj-nogi,judo kanya`
   (palette `kanya` dans `outfits.py`, puis plis des shorts). 1.55 : muay-thaï, MMA, boxe et kick-boxing viennent de
   `kanya_kit()` (planches de `maquettes/kanya-v155`, copiées dans `planches/` pour le ventre), brassière tendue entre
   les bonnets (`bridge_cleavage`) ; `KANYA_KIT=1151` rend les tenues de la 1.51.

## Polices

`polices/Kanit-Bold-thai.ttf` : Kanit Bold (Cadson Demak, SIL OFL 1.1, licence `polices/OFL-Kanit.txt`), sous-ensemble
thaï de `@fontsource/kanit` 5.3.0, pour « มวยไทย » sur le short. « COACH » et « MUAY THAI » : Inter Black (OFL), déjà
utilisée par le logo CS.
