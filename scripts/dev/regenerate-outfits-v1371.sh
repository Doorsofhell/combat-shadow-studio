#!/usr/bin/env bash
# Rebuild the 28 production outfits with strict Blender error detection.
# Work is performed in the ephemeral GitHub Actions checkout. No GLB is pushed
# until every coach passes asset integrity and app regression checks.
set -euo pipefail

command -v blender >/dev/null || { echo "::error::Blender est absent"; exit 1; }
command -v python3 >/dev/null || { echo "::error::Python est absent"; exit 1; }
SCRIPT=tools/generator/rocketbox/outfits.py
VALIDATOR=scripts/dev/validate-outfit-build-v1372.py
OUTFITS=(boxe kickboxing muaythai mma bjj bjj-nogi judo)
mkdir -p logs

build_one() {
  local id="$1" sex="$2" palette="$3"
  local src="public/coaches/$id/photo.glb"
  local dst="public/coaches/$id/tenues"
  local log="logs/outfits-$id.log"
  test -s "$src" || { echo "::error::Corps introuvable : $src"; exit 1; }
  mkdir -p "$dst"

  # CRITICAL: stale GLBs in the repository previously passed test -s even when
  # Blender aborted and returned exit status 0. They are intentionally deleted
  # in this disposable checkout before attempting to regenerate them.
  for outfit in "${OUTFITS[@]}"; do
    rm -f "$dst/$outfit.glb"
  done

  echo "===== Génération $id ($sex, $palette) ====="
  # Blender normally returns status 0 for certain Python exceptions.
  # --python-exit-code propagates them so the workflow fails at the cause.
  if [ "$palette" = "default" ]; then
    blender --background --threads 2 --python-exit-code 42 --python "$SCRIPT" -- "$src" "$dst" "$sex" 2>&1 | tee "$log"
  else
    PALETTE="$palette" blender --background --threads 2 --python-exit-code 42 --python "$SCRIPT" -- "$src" "$dst" "$sex" 2>&1 | tee "$log"
  fi

  # Fail fast on the first wrong model. Never wait for 28 opaque Vitest failures.
  python3 "$VALIDATOR" "$id" "$dst"
  echo "===== $id : 7 tenues vérifiées ====="
}

build_one mma-kadir homme default
build_one mma-amara femme default
build_one nael homme nael
build_one inaya femme inaya
echo "28 tenues v1.37.2 réellement régénérées et contrôlées."
