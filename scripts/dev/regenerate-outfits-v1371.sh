#!/usr/bin/env bash
# Rebuild the 28 production outfits with strict Blender error detection.
# Work is performed in the ephemeral GitHub Actions checkout. No GLB is pushed
# until every coach passes asset integrity and app regression checks.
set -euo pipefail

command -v blender >/dev/null || { echo "::error::Blender est absent"; exit 1; }
command -v python3 >/dev/null || { echo "::error::Python est absent"; exit 1; }
SCRIPT=tools/generator/rocketbox/outfits.py
VALIDATOR=scripts/dev/validate-outfit-build-v1372.py
# The approved templates are shipped 1.37.2 GLBs: NEVER rebuild them here.
# Only the two follower coaches receive a retargeted MMA short.
OUTFITS=(mma)
export ONLY=mma
REFERENCE_NAEL='e4d1e0e46de56ea8a702d776f055a0b4fe2d9478'
REFERENCE_INAYA='0237f76c9fc0db9e154efa5321cb0c17ace813b4'
verify_references() {
  local n i
  n=$(git hash-object public/coaches/nael/tenues/mma.glb)
  i=$(git hash-object public/coaches/inaya/tenues/mma.glb)
  if [ "$n" != "$REFERENCE_NAEL" ] || [ "$i" != "$REFERENCE_INAYA" ]; then
    echo "::error::Les GLB de référence Naël/Inaya ont changé ; publication refusée."
    return 1
  fi
}
verify_references
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
  local failed=0
  if [ "$palette" = "default" ]; then
    blender --background --threads 2 --python-exit-code 42 --python "$SCRIPT" -- "$src" "$dst" "$sex" 2>&1 | tee "$log" || failed=1
  else
    PALETTE="$palette" blender --background --threads 2 --python-exit-code 42 --python "$SCRIPT" -- "$src" "$dst" "$sex" 2>&1 | tee "$log" || failed=1
  fi
  if [ "$failed" -ne 0 ]; then
    echo "::error title=Blender $id::Échec de génération Python ; consulter les dernières lignes et l'artifact de logs."
    tail -n 65 "$log"
    if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
      {
        echo "### Échec Blender — $id"
        echo "Le script Python s'est interrompu. Extrait de fin du journal :"
        echo '~~~text'
        tail -n 65 "$log"
        echo '~~~'
      } >> "$GITHUB_STEP_SUMMARY"
    fi
    return 42
  fi

  # Fail fast on the first wrong model. Never wait for 28 opaque Vitest failures.
  python3 "$VALIDATOR" "$id" "$dst" mma
  echo "===== $id : short MMA régénéré et vérifié ====="
}

build_one mma-kadir homme default
build_one mma-amara femme default
verify_references
echo "Shorts MMA Kadir/Amara reconstruits ; modèles de référence Naël/Inaya préservés."
