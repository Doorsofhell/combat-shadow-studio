#!/usr/bin/env bash
# v1.37.1: rebuild the 28 production outfit GLBs against the four shipped Rocketbox bodies.
# Must be run with Blender (bpy) installed; never touch the coaches' photo.glb/rig.
set -euo pipefail
command -v blender >/dev/null || { echo "Blender requis pour régénérer les tenues" >&2; exit 1; }
SCRIPT=tools/generator/rocketbox/outfits.py
build_one() {
  local id="$1" sex="$2" palette="$3"
  local src="public/coaches/$id/photo.glb"
  local dst="public/coaches/$id/tenues"
  test -f "$src" || { echo "Corps introuvable: $src" >&2; exit 1; }
  echo "===== $id ($sex), palette $palette ====="
  if [ "$palette" = "default" ]; then
    blender --background --threads 2 --python "$SCRIPT" -- "$src" "$dst" "$sex"
  else
    PALETTE="$palette" blender --background --threads 2 --python "$SCRIPT" -- "$src" "$dst" "$sex"
  fi
  for outfit in boxe kickboxing muaythai mma bjj bjj-nogi judo; do
    test -s "$dst/$outfit.glb" || { echo "Tenue vide ou absente: $dst/$outfit.glb" >&2; exit 1; }
  done
}
build_one mma-kadir homme default
build_one mma-amara femme default
build_one nael homme nael
build_one inaya femme inaya
echo "28 tenues régénérées."
