# usage: run.sh tag  — compose head, body, build GLB, copy to dist, capture head views
set -e
SP=/tmp/claude-0/-home-user/637a2a93-74d7-5b10-875d-657434701d15/scratchpad; A=$SP/ana; T=$1; cd /home/user/combat-shadow-studio
HAIR_GRAIN=/mnt/project-files/combat-shadow-studio/maquettes/references-kadir-2026-11-15/planche3-tete-dessus.jpg python3 tools/generator/kadir/tete_compo.py $A/proj.npz $SP/k0/m021_head_color.jpg $A/tete-$T.jpg $A/masques-$T.npz | tail -2
HAIR_GRAIN=/mnt/project-files/combat-shadow-studio/maquettes/references-kadir-2026-11-15/planche3-tete-dessus.jpg python3 tools/generator/kadir/corps.py ${BODY_SRC:-$SP/k0/m021_body_color.jpg} $A/masques-$T.json $A/body_uv.npz $A/corps-$T.jpg $A/rug-$T.jpg
python3 tools/generator/kadir/tete_normale.py $SP/k0/m021_head_normal.jpg $A/masques-$T.npz $A/normale-$T.jpg
ROUGH_BODY=$A/rug-$T.jpg HEAD_NORMAL=$A/normale-$T.jpg COACH=mma-kadir node tools/generator/rocketbox/victor_build.mjs tools/generator/kadir/donnees/photo-1.45.glb ${DISP:-$A/f1.f32} $A/tete-$T.jpg $A/corps-$T.jpg public/coaches/mma-kadir/photo.glb | tail -1
cp public/coaches/mma-kadir/photo.glb dist/coaches/mma-kadir/photo.glb
FY=${FY:-1.50} VIEWS=${VIEWS:-tete} node scripts/dev/shot-kadir-planches.mjs http://localhost:4302 $SP/$T $T 2>&1 | grep -v '^ok' || true
for v in $(echo ${VIEWS:-tete} | tr , " "); do python3 $SP/sheet.py $SP/$T "$T-$v-*.jpg" $SP/$T/sheet-$v.jpg; done
