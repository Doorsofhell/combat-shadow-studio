# Kadir 1.46 — visage greffé (proposition, non publiée)

Version 2 (V2=1 OREILLES=0). Visage de l'avatar Rocketbox **Male_Adult_19** (github.com/microsoft/Microsoft-Rocketbox, licence MIT) greffé sur le
corps de Kadir par `tools/generator/rocketbox/face_transfer.py`, puis :

- `greffe_disp.py` : forme de la tête (+ oreilles de lutteur) → `disp.f32` ;
- `greffe_tete.py` : visage du donneur, crâne et oreilles d'après les planches, barbe en collier sans moustache, yeux bruns → `tete.jpg` ;
- `greffe_normale.py` : relief fin du visage du donneur → `normale.jpg` ;
- `greffe_corps.py` : teint et relief musculaire du corps → `corps.jpg` ;
- `rugosite.jpg` : rugosité du corps (corps.py, lot planches).

Reconstruction du modèle (aucune dépendance au réseau) :

    HEAD_NORMAL=$D/normale.jpg ROUGH_BODY=$D/rugosite.jpg COACH=mma-kadir node tools/generator/rocketbox/victor_build.mjs \
      tools/generator/kadir/donnees/photo-1.45.glb $D/disp.f32 $D/tete.jpg $D/corps.jpg public/coaches/mma-kadir/photo.glb

La chaîne complète (depuis les FBX Rocketbox) est dans `tools/generator/kadir/greffe-chaine.sh`.
