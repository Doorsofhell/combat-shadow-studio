"""v2.2.0 Phase B — textures de peau : marges des îlots UV (coutures) et correction locale de Victor.

python3 scripts/v220/peau.py <dossier dump de textures-glb.mjs> <coach>

1. Marges des îlots UV (tous les coachs, couleur et normales) : les îlots sont tracés depuis les triangles UV réels
   du maillage (pas d'après la couleur : les sous-vêtements peints en noir restent noirs). Hors des îlots, chaque texel
   prend la valeur moyenne de ses voisins déjà remplis, de proche en proche sur 24 texels. Sans cette marge, le fond
   noir entre dans le filtrage (anisotrope, mipmaps) et dessine une ligne sombre le long des coutures, plus visible
   de loin et sur téléphone. Les texels DANS les îlots ne changent pas (vérifié : écart maximal 0).
2. Victor seulement (`victor`) : la couleur du corps repeinte en 1.43 porte des lignes de contour sombres et une teinte
   grise (saturation 0,37 contre 0,50 à 0,55 pour les autres hommes) que le shader « cleanBody » de 1.48 atténuait
   à chaque image. Correction dans la texture : les traits fins plus sombres que leur voisinage (filtre médian 7 px)
   sont ramenés vers ce voisinage, la saturation est relevée de 15 % autour de la luminance (teinte et clarté
   moyennes conservées).
Sorties : <texture>.new.<ext> dans le même dossier (puis textures-glb.mjs swap) et un résumé JSON.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, JpegImagePlugin

D = Path(sys.argv[1])
COACH = sys.argv[2]
PAD = 24


def island_mask(uv_bin, size):
    tri = np.fromfile(uv_bin, dtype=np.float32).reshape(-1, 3, 2)
    w, h = size
    im = Image.new('L', (w, h), 0)
    dr = ImageDraw.Draw(im)
    for t in tri:
        dr.polygon([(float(u * w), float(v * h)) for u, v in t], fill=255, outline=255)
    return np.asarray(im) > 0


def pad(a, mask, n=PAD):
    """remplit les texels hors îlots par la moyenne des voisins déjà remplis, n anneaux"""
    a = a.astype(np.float32).copy()
    filled = mask.copy()
    k = np.ones((3, 3), np.float32)
    for _ in range(n):
        acc = np.zeros_like(a)
        cnt = np.zeros(mask.shape, np.float32)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dx == 0 and dy == 0:
                    continue
                sh = np.roll(np.roll(filled, dy, 0), dx, 1)
                acc += np.roll(np.roll(a * filled[..., None], dy, 0), dx, 1)
                cnt += sh
        new = (~filled) & (cnt > 0)
        if not new.any():
            break
        a[new] = acc[new] / cnt[new][:, None]
        filled |= new
    return a, filled


def save(arr, src, out):
    im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    if src.suffix == '.png':
        im.save(out, optimize=True)
    else:
        # mêmes tables de quantification et même sous-échantillonnage que la source : poids du fichier conservé
        srcim = Image.open(src)
        im.save(out, qtables=srcim.quantization, subsampling=JpegImagePlugin.get_sampling(srcim))


def victor_body(a, mask):
    lum = a @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    med = np.asarray(Image.fromarray(np.clip(lum, 0, 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(7)), np.float32)
    # traits fins plus sombres que le voisinage : ramenés vers lui (proportionnellement à l'écart)
    gap = np.clip((med - lum) / np.maximum(med, 1), 0, 1)
    k = np.clip((gap - 0.04) / 0.10, 0, 1)[..., None] * mask[..., None]
    ratio = np.where(lum > 1, med / np.maximum(lum, 1), 1)[..., None]
    a = a * (1 + (np.clip(ratio, 1, 1.6) - 1) * k)
    # saturation +15 % autour de la luminance
    l2 = (a @ np.array([0.2126, 0.7152, 0.0722], np.float32))[..., None]
    sat = l2 + (a - l2) * 1.15
    return np.where(mask[..., None], sat, a), float(k.mean())


report = {}
for uvb in sorted(D.glob('*.uv.bin')):
    mat = uvb.name.replace('.uv.bin', '')
    if 'Eyes' in mat:
        continue
    for kind in ('color', 'normal', 'rough'):
        stem = mat + '_' + kind
        src = next((p for p in D.iterdir() if p.stem == stem and '.new' not in p.name and p.suffix in ('.jpg', '.png')), None)
        if not src:
            continue
        im = Image.open(src)
        mode = im.mode
        a = np.asarray(im.convert('RGB'), np.float32)
        mask = island_mask(uvb, im.size)
        # les yeux sont peints sur la texture de la tête : leurs îlots comptent aussi
        if '_head' in mat and (D / 'Eyes_opacity.uv.bin').exists():
            mask |= island_mask(D / 'Eyes_opacity.uv.bin', im.size)
        before_black = float(((a.mean(-1) < 8) & ~mask).mean())
        info = {}
        if COACH == 'victor' and stem == 'm021_body_color':
            a, share = victor_body(a, mask)
            info['victor_lignes_corrigees'] = round(share, 4)
        if COACH == 'victor' and stem == 'm021_body_color':
            # le liseré sombre de 1.43 longe l'intérieur des îlots (jusqu'à 6 texels) : refait depuis l'intérieur
            inner = np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(13))) > 0
            a, _ = pad(a, inner, 7)
            info['victor_lisere_refait'] = round(float((mask & ~inner).mean()), 4)
        out_a, filled = pad(a, mask)
        # dans les îlots, rien ne bouge (sauf la correction de Victor ci-dessus)
        ref = np.asarray(im.convert('RGB'), np.float32)
        inside = float(np.abs(out_a - ref)[mask].max()) if COACH != 'victor' or stem != 'm021_body_color' else None
        out = src.with_name(f'{stem}.new{src.suffix}')
        save(out_a, src, out)
        info.update(size=im.size, ilots=round(float(mask.mean()), 3), fond_noir_avant=round(before_black, 4), marge_remplie=round(float((filled & ~mask).mean()), 4), ecart_max_dans_ilots=inside)
        report[stem] = info
        print(COACH, stem, info)
(D / 'peau-v220.json').write_text(json.dumps(report, indent=1))
