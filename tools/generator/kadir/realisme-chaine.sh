set -e
SP=/tmp/claude-0/-home-user/637a2a93-74d7-5b10-875d-657434701d15/scratchpad; cd /home/user/combat-shadow-studio
python3 tools/generator/kadir/realisme.py $SP/k0 $SP/ana/proj.npz $SP/ana/body_uv.npz $SP/ana/k0.npz $SP/real | tail -1
ROUGH_HEAD=$SP/real/rugosite_tete.jpg HEAD_NORMAL=$SP/real/normale.jpg ROUGH_BODY=$SP/real/rugosite.jpg COACH=mma-kadir node tools/generator/rocketbox/victor_build.mjs tools/generator/kadir/donnees/photo-1.45.glb $SP/real/disp.f32 $SP/real/tete.jpg $SP/real/corps.jpg $SP/real/kadir.glb | tail -1
cp $SP/real/kadir.glb dist/coaches/mma-kadir/photo.glb
rm -rf $SP/r1; for v in ${VIEWS:-tete}; do FY=1.50 VIEWS=$v node scripts/dev/shot-kadir-planches.mjs http://localhost:4302 $SP/r1 r1 2>&1 | grep -v '^ok' || true; done
