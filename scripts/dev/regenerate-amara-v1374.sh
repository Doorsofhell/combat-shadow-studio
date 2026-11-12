#!/usr/bin/env bash
# v1.37.4 — Inaya is the immutable female outfit pattern reference.
# Rebuild only Amara, on Amara's own body/rig. Preserve other 21 GLBs.
set -euo pipefail

command -v blender >/dev/null || { echo "::error::Blender manquant"; exit 1; }
command -v python3 >/dev/null || { echo "::error::Python manquant"; exit 1; }

SCRIPT=tools/generator/rocketbox/outfits.py
VALIDATOR=scripts/dev/validate-outfit-build-v1372.py
SRC=public/coaches/mma-amara/photo.glb
DST=public/coaches/mma-amara/tenues
OUTFITS=(boxe kickboxing muaythai mma bjj bjj-nogi judo)
mkdir -p "$DST" logs
test -s "$SRC"

# The user-approved Inaya variants must remain bit-for-bit identical.
declare -A INAYA=(
  [boxe]=6ae0e87eab10edc1586ec00e48635557cb7a38b9
  [kickboxing]=00f89d185790d9515edb08f7f5864d4d611418f2
  [muaythai]=d292d31dc7d04d641d197cc74fd6394f32ec6db2
  [mma]=0237f76c9fc0db9e154efa5321cb0c17ace813b4
  [bjj]=d867e25d3dd16fe4e227ee4b34ad6b15fab15ba1
  [bjj-nogi]=f874d571568e3d5c3abb7023954410fd3d2e594c
  [judo]=0f79f8a23c0b65b92224f88f8387acc4cb74c5f5
)
check_refs() {
  for outfit in "${OUTFITS[@]}"; do
    hash=$(git hash-object "public/coaches/inaya/tenues/$outfit.glb")
    if [[ "$hash" != "${INAYA[$outfit]}" ]]; then
      echo "::error::Inaya/$outfit a été modifiée : arrêt de sécurité"; exit 1
    fi
  done
  [[ "$(git hash-object public/coaches/nael/tenues/mma.glb)" == e4d1e0e46de56ea8a702d776f055a0b4fe2d9478 ]] || exit 1
  [[ "$(git hash-object public/coaches/mma-kadir/tenues/mma.glb)" == 0408bed276844fa7d85e469aab825fe301ef1e0c ]] || exit 1
}
check_refs

# No existing (stale) Amara outfit may falsely count as a successful build.
for outfit in "${OUTFITS[@]}"; do rm -f "$DST/$outfit.glb"; done

echo "Référence : Inaya. Morphologie, palette et squelette : Amara."
if ! PALETTE=default ONLY=boxe,kickboxing,muaythai,mma,bjj,bjj-nogi,judo blender --background --threads 2 --python-exit-code 42 --python "$SCRIPT" -- "$SRC" "$DST" femme 2>&1 | tee logs/amara-v1374.log; then
  echo "::error::Erreur Blender sur Amara v1.37.4"
  tail -n 80 logs/amara-v1374.log
  exit 42
fi

python3 "$VALIDATOR" mma-amara "$DST"
check_refs
echo "Amara : sept tenues reconstruites sur le patron Inaya ; trois autres coachs inchangés."
