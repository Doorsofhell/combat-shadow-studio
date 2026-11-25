#!/bin/sh
# 2.4.0 prototype 2 (Amara et Victor) : visage -> corps sculpté -> taille de la planche -> peau sans ombrage cuit.
# Les configs (configs/*2.json, *-corps.json, *-peau.json) écrivent dans $TRAVAIL (dossier de travail) ; les chemins
# « $TRAVAIL » y sont remplacés à l'exécution. Sources : modèles 2.3.5 archivés. Puis les tenues MMA :
#   AMARA_MMA_REF=1 ONLY=mma outfits.py -- public/coaches/mma-amara/photo-clean.glb ... femme (+ short_folds.mjs)
#   tools/generator/rocketbox/regen_outfits.sh mma victor
set -e
TRAVAIL=${TRAVAIL:?dossier de travail}
F=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$TRAVAIL/w" "$TRAVAIL/w2" "$TRAVAIL/w3" "$TRAVAIL/w4"
for n in amara2 victor2 amara-corps victor-corps amara-peau victor-peau kadir2 nael2 inaya2 kanya2 kadir-peau nael-peau inaya-peau kanya-peau; do
  sed "s#\$TRAVAIL#$TRAVAIL#g" "$F/configs/$n.json" > "$TRAVAIL/w/$n.json"
done
for c in amara2 victor2; do python3 "$F/visage.py" "$TRAVAIL/w/$c.json"; done
python3 "$F/corps.py" "$TRAVAIL/w/amara-corps.json"
python3 "$F/corps.py" "$TRAVAIL/w/victor-corps.json"
for f in amara-photo amara-photo-clean; do node "$F/taille.mjs" "$TRAVAIL/w3/$f.glb" "$TRAVAIL/w3/$f.glb" 1.70; done
node "$F/taille.mjs" "$TRAVAIL/w3/victor-photo.glb" "$TRAVAIL/w3/victor-photo.glb" 1.88
python3 "$F/peau.py" "$TRAVAIL/w/amara-peau.json"
python3 "$F/peau.py" "$TRAVAIL/w/victor-peau.json"
# 24/11 (Youssef « je valide ») : Kadir, Naël, Inaya, Kanya : visage et peau seulement (corps et taille gardés : les
# tenues restent ajustées)
for n in kadir nael inaya kanya; do
  python3 "$F/visage.py" "$TRAVAIL/w/${n}2.json"
  cp "$TRAVAIL/w2/$n-photo.glb" "$TRAVAIL/w3/$n-photo.glb"
  python3 "$F/peau.py" "$TRAVAIL/w/$n-peau.json"
done
echo "modèles prêts dans $TRAVAIL/w4 (à copier dans public/coaches/<id>/photo.glb)"
