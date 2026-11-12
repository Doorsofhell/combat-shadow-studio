#!/usr/bin/env bash
# v1.37.3: binary rollback to the LAST KNOWN GOOD Kadir garments from v1.37.0.
# Restore only Kadir; the other coaches and the avatar meshes stay unchanged.
set -euo pipefail

BASELINE=bcb49f9281
OUT=public/coaches/mma-kadir/tenues
declare -A EXPECTED=(
  [boxe]=9c4a33b36d2468a9f653cce3e62260e69c3c9664
  [kickboxing]=8cbced0c2a190539c7f3c172da3e9ca4ed4e4010
  [muaythai]=c6c183d9a4784ad02d5390eddf272ff6772b41a1
  [mma]=0408bed276844fa7d85e469aab825fe301ef1e0c
  [judo]=9ec4ec99f383d5bde97f9ea46efc9d78e131e804
  [bjj]=18546da1ff3acb931583d642b2e04e53ec1cbb4c
  [bjj-nogi]=fdbeded76c3b976e6c95d81001529cc692ac3518
)
git cat-file -e "${BASELINE}^{commit}" || { echo "::error::Commit stable v1.37.0 absent"; exit 1; }
for item in boxe kickboxing muaythai mma judo bjj bjj-nogi; do
  path="$OUT/$item.glb"
  git show "$BASELINE:$path" > "$path"
  actual=$(git hash-object "$path")
  if [[ "$actual" != "${EXPECTED[$item]}" ]]; then
    echo "::error::Checksum mismatch $path: $actual"; exit 1
  fi
  echo "OK: $item restore from 1.37.0 ($actual)"
done

photo=$(git hash-object public/coaches/mma-kadir/photo.glb)
[[ "$photo" == 9b720189cdd3a9f27e55c14d0a90fb423b3801a2 ]] || { echo "::error::Avatar Kadir changed"; exit 1; }

# Reference bodies and their approved MMA models must not be changed.
[[ "$(git hash-object public/coaches/nael/tenues/mma.glb)" == e4d1e0e46de56ea8a702d776f055a0b4fe2d9478 ]] || exit 1
[[ "$(git hash-object public/coaches/inaya/tenues/mma.glb)" == 0237f76c9fc0db9e154efa5321cb0c17ace813b4 ]] || exit 1
echo "Kadir: 7 stable GLBs restored. Nael, Inaya and Amara untouched."
