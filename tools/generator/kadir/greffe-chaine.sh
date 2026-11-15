# usage: build.sh kNN  — displacement, head texture, normals, body tone, GLB, copy to dist, captures
set -e
SP=/tmp/claude-0/-home-user/637a2a93-74d7-5b10-875d-657434701d15/scratchpad; A=$SP/ana; G=$SP/gref; K=$1; cd /home/user/combat-shadow-studio
R=/tmp/claude-0/rbx/repo/Assets/Avatars; MB=$R/Professions/Sports_Male_01/Export/Sports_Male_01_facial.fbx
D=Male_Adult_${K#k}; DN=$(ls $R/Adults/$D/Textures/*head_normal.tga)
[ -f $G/$K.f32 ] || python3 tools/generator/kadir/greffe_disp.py $SP/ft/$K.blend $MB $A/k0.npz $G/$K.npz 2>&1 | grep -v WARN | tail -1
OREILLE_SRC=$SP/k0/m021_head_color.jpg python3 tools/generator/kadir/greffe_tete.py $SP/ft/${K}_head_color.png $A/tete-v16.jpg $A/masques-v16.npz $A/proj.npz $G/tete-$K.jpg | tail -1
python3 tools/generator/kadir/greffe_normale.py $MB $R/Adults/$D/Export/$D.fbx $DN $A/proj.npz $G/tete-$K-S.npy $A/normale-v16.jpg $G/normale-$K.jpg 2>&1 | grep -v WARN | tail -1
CORPS_UV=$A/body_uv.npz DEFINITION=$SP/k0/m021_body_normal.jpg python3 tools/generator/kadir/greffe_corps.py $A/corps-v16.jpg $G/tete-$K.json $G/corps-$K.jpg
HEAD_NORMAL=$G/normale-$K.jpg ROUGH_BODY=$A/rug-v16.jpg COACH=mma-kadir node tools/generator/rocketbox/victor_build.mjs tools/generator/kadir/donnees/photo-1.45.glb $G/$K.f32 $G/tete-$K.jpg $G/corps-$K.jpg $G/$K.glb | tail -1
[ -n "$NOSHOT" ] && exit 0
cp $G/$K.glb dist/coaches/mma-kadir/photo.glb
rm -rf $SP/$K; for v in ${VIEWS:-tete visage garde}; do FY=1.50 VIEWS=$v node scripts/dev/shot-kadir-planches.mjs http://localhost:4302 $SP/$K $K 2>&1 | grep -v '^ok' || true; python3 $SP/sheet.py $SP/$K "$K-$v-*.jpg" $SP/$K/sheet-$v.jpg; done
