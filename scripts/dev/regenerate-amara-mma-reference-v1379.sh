#!/usr/bin/env bash
# Amara experimental MMA ONLY. Never replaces production or any other coach.
set -euo pipefail
SRC=public/coaches/mma-amara/photo.glb
DST=public/coaches/mma-amara/tenues
mkdir -p "$DST" logs
test -s "$SRC"
[[ "$AMARA_MMA_REF" == "1" ]] || { echo "AMARA_MMA_REF=1 required"; exit 3; }
# Hash all reference garment GLBs except mma (its before/after is intentionally changed).
for p in public/coaches/{inaya,nael,mma-kadir}/tenues/*.glb public/coaches/mma-amara/tenues/{boxe,kickboxing,muaythai,bjj,bjj-nogi,judo}.glb "$SRC"; do
  test -s "$p" || exit 3
done
find public/coaches -type f -name '*.glb' ! -path '*/mma-amara/tenues/mma.glb' -print0 | sort -z | xargs -0 sha256sum > /tmp/amara-reference-protected.sha256
python3 -m py_compile tools/generator/rocketbox/outfits.py
ONLY=mma AMARA_MMA_REF=1 blender --background --threads 2 --python-exit-code 42 --python tools/generator/rocketbox/outfits.py -- "$SRC" "$DST" femme 2>&1 | tee logs/amara-mma-reference.log
sha256sum --check /tmp/amara-reference-protected.sha256
python3 scripts/dev/validate-amara-mma-reference-v1379.py
echo "Prototype only: protected GLBs untouched; no deployment."
