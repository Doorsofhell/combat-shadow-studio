"""v2.2.0 Phase A — analyse des textures de peau de chaque coach (couleur et normales du corps et de la tête).

python3 scripts/v220/textures.py <dossier des textures extraites par audit-coachs.mjs> [sortie.json]

Mesures (sur les texels de peau seulement : ni le fond noir hors des îlots UV, ni les zones peintes en noir) :
- `gutter_black` : part des texels noirs touchant un îlot UV (sans marge de remplissage, le noir « bave » dans les
  niveaux de mipmap et dessine une couture sombre sur le modèle à distance) ;
- `ao_depth` : écart-type de la luminance basse fréquence (flou 24 px) rapporté à la moyenne : ombres et occlusion
  photographiques peintes dans la couleur, qui doublent l'éclairage 3D ;
- `dark_blotch` : part des texels plus sombres de 25 % que leur voisinage (flou 32 px) : marbrures et taches ;
- `purple` : part des texels violacés (bleu plus fort que vert de 6 % et teinte froide) ;
- `edge_lines` : part des texels de contour fortement plus sombres que leurs voisins immédiats (lignes de dessin) ;
- `normal_strength` (cartes de normales) : inclinaison moyenne des normales (degrés) et part au-delà de 35°.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

SRC = Path(sys.argv[1])
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else 'docs/v220/audit/textures.json')


def blur(a, r):
    im = Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(r)), dtype=np.float32) / 255


def color_stats(path):
    im = Image.open(path).convert('RGB')
    a = np.asarray(im, dtype=np.float32) / 255
    lum = a @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    black = lum < 0.03
    skin = ~black & (a[..., 0] > a[..., 2])  # teinte de peau : rouge au-dessus du bleu
    # noir collé à un îlot de peau
    dil = np.asarray(Image.fromarray((skin * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
    gutter = black & dil
    # remplir le fond par la moyenne de peau pour ne pas compter les bords comme des taches
    fill = lum.copy()
    fill[~skin] = lum[skin].mean()
    lo = blur(fill, 24)
    lo32 = blur(fill, 32)
    near = blur(fill, 2)
    ao = float(lo[skin].std() / lo[skin].mean())
    dark = (fill < 0.75 * lo32) & skin
    edge = (fill < 0.82 * near) & skin
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    purple = skin & (b > g * 1.06) & (r < 1.25 * b)
    sat = (a.max(-1) - a.min(-1)) / np.maximum(a.max(-1), 1e-3)
    return dict(size=im.size, skin_fraction=round(float(skin.mean()), 3), gutter_black=round(float(gutter.sum() / max(1, skin.sum())), 4),
                ao_depth=round(ao, 4), dark_blotch=round(float(dark.sum() / skin.sum()), 4), purple=round(float(purple.sum() / skin.sum()), 4),
                edge_lines=round(float(edge.sum() / skin.sum()), 4), mean_rgb=[round(float(x), 3) for x in a[skin].mean(0)],
                saturation=round(float(sat[skin].mean()), 3), luminance=round(float(lum[skin].mean()), 3))


def normal_stats(path):
    a = np.asarray(Image.open(path).convert('RGB'), dtype=np.float32) / 255 * 2 - 1
    z = np.clip(a[..., 2], -1, 1)
    valid = np.linalg.norm(a, axis=-1) > 0.5
    ang = np.degrees(np.arccos(np.clip(z / np.maximum(np.linalg.norm(a, axis=-1), 1e-3), -1, 1)))[valid]
    return dict(mean_tilt_deg=round(float(ang.mean()), 2), p95_tilt_deg=round(float(np.percentile(ang, 95)), 2), steep_fraction=round(float((ang > 35).mean()), 4))


res = {}
for f in sorted(SRC.iterdir()):
    coach, tex = f.stem.split('__')
    if 'color' in tex and 'chignon' not in tex:
        res.setdefault(coach, {})[tex] = color_stats(f)
    elif 'normal' in tex:
        res.setdefault(coach, {})[tex] = normal_stats(f)
for c, d in res.items():
    print(c)
    for k, v in d.items():
        print('  ', k, v)
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(res, indent=1))
