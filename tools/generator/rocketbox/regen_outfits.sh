#!/bin/sh
# 1.10: rebuilds the discipline outfits of the coaches from their shipped photo.glb (same points as the
# uncompressed models; textures do not matter here). Each coach builds in its own work folder (textures named by
# id would collide). Usage: tools/generator/rocketbox/regen_outfits.sh [outfits, comma list] [coaches]
#   e.g. tools/generator/rocketbox/regen_outfits.sh boxe,kickboxing,muaythai
set -e
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
ONLY=${1:-boxe,kickboxing,muaythai,mma,bjj,bjj-nogi,judo}
COACHES=${2:-mma-kadir,mma-amara,nael,inaya}
WORK=${WORK:-${TMPDIR:-/tmp}/css-outfits}
for c in $(echo "$COACHES" | tr ',' ' '); do
  case $c in
    mma-kadir|nael) sex=homme ;;
    *) sex=femme ;;
  esac
  # 1.11: Naël and Inaya wear their own colours (outfits.py, palette by coach id)
  case $c in
    nael|inaya) pal=$c ;;
    *) pal= ;;
  esac
  # 1.37: Axel and Kaila (MakeHuman bodies, MH_BODY=1) are removed, see « backup CS/ »
  env=""
  mkdir -p "$WORK/$c"
  (cd "$WORK/$c" && env $env PALETTE=$pal ONLY=$ONLY python3 "$ROOT/tools/generator/rocketbox/outfits.py" -- "$ROOT/public/coaches/$c/photo.glb" "$ROOT/public/coaches/$c/tenues" $sex > "$WORK/$c/outfits.log" 2>&1) &
done
wait
grep -h "^wrote" "$WORK"/*/outfits.log
