#!/bin/sh
# Kadir 1.46.0 : réalisme du Kadir existant (même visage) + visage/cou plus épais + trapèzes de combattant.
# Usage : SP=<dossier de travail avec k0/ (textures d'origine) et ana/ (proj.npz, body_uv.npz, k0.npz de pose_export.py)>
#         sh tools/generator/kadir/realisme-chaine.sh
# Ne PAS relancer rocketbox/morph_apply.py après : victor_build garde les 25 expressions du modèle source, alors que
# morph_apply les retirerait des points déplacés de plus de 2 mm (mâchoire, cou, trapèzes).
set -e
OUT=${OUT:-$SP/realisme}
EPAIS=1 TRAPEZES=1 python3 tools/generator/kadir/realisme.py $SP/k0 $SP/ana/proj.npz $SP/ana/body_uv.npz $SP/ana/k0.npz $OUT
ROUGH_HEAD=$OUT/rugosite_tete.jpg HEAD_NORMAL=$OUT/normale.jpg ROUGH_BODY=$OUT/rugosite.jpg COACH=mma-kadir \
  node tools/generator/rocketbox/victor_build.mjs tools/generator/kadir/donnees/photo-1.45.glb $OUT/disp.f32 \
  $OUT/tete.jpg $OUT/corps.jpg public/coaches/mma-kadir/photo.glb
