"""v2.2.0 Phase B — raccord de teinte entre la tête (cou, haut du thorax) et le corps.

python3 scripts/v220/raccord.py <dossier (textures-glb.mjs dump + verts)> <coach> [--appliquer]

Constat (captures 2.1.0, Victor « 07-abdomen-bassin-hanches ») : la partie basse du maillage de la tête (cou et haut
du thorax, peinte sur la texture de la tête) n'a pas la teinte du corps : plaque plus claire à bord net sur le haut
de la poitrine. Méthode, sans toucher au visage :
1. couture = sommets de la tête dont la position coïncide (< 0,6 mm) avec un sommet du corps ;
2. sur chaque sommet de couture, couleur moyenne (disque de 5 texels) côté tête et côté corps → gain RVB corps/tête ;
3. chaque sommet de la tête reçoit le gain de la couture la plus proche, atténué avec la distance à la couture
   (plein jusqu'à 2 cm, nul à 10 cm : le menton, la bouche et le visage ne bougent pas) ;
   Option --hauteur (Victor) : toute la plaque thorax/bas du cou du maillage de la tête (sous 1,47 m) prend le gain
   moyen de la couture, avec un fondu jusqu'à 1,55 m (le visage et le menton, plus haut, ne changent pas) ;
4. le gain est tracé dans l'espace UV de la tête (interpolé sur les triangles, lissé) et multiplie la texture.
Le gain est borné à ±25 % par canal. Sortie : `<tête>_color.new.<ext>` (part de la marge refaite par peau.py si elle
existe déjà) et le relevé des écarts avant/après dans raccord-v220.json.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, JpegImagePlugin

D = Path(sys.argv[1])
COACH = sys.argv[2]
APPLY = '--appliquer' in sys.argv
HAUT = '--hauteur' in sys.argv
pre = 'm021' if (D / 'm021_body.verts.bin').exists() else 'f021'


def load(mat):
    v = np.fromfile(D / f'{mat}.verts.bin', dtype=np.float32).reshape(-1, 5)
    i = np.fromfile(D / f'{mat}.idx.bin', dtype=np.uint32).reshape(-1, 3)
    return v, i


def tex(name):
    for e in ('.new.jpg', '.new.png', '.jpg', '.png'):
        p = D / f'{name}{e}'
        if p.exists():
            return p
    raise FileNotFoundError(name)


hv, hi = load(f'{pre}_head')
bv, bi = load(f'{pre}_body')
hused = np.unique(hi)
bused = np.unique(bi)
# couture : appariement par grille de 0,6 mm
q = 1 / 0.0006
grid = {}
for k in bused:
    grid.setdefault(tuple(np.round(bv[k, :3] * q).astype(int)), k)
pairs = []
for k in hused:
    key = tuple(np.round(hv[k, :3] * q).astype(int))
    m = grid.get(key)
    if m is None:
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for dz in (-1, 0, 1):
                    m = m if m is not None else grid.get((key[0] + dx, key[1] + dy, key[2] + dz))
    if m is not None:
        pairs.append((k, m))
pairs = np.array(pairs)
hpath, bpath = tex(f'{pre}_head_color'), tex(f'{pre}_body_color')
H = np.asarray(Image.open(hpath).convert('RGB'), np.float32)
B = np.asarray(Image.open(bpath).convert('RGB'), np.float32)
Hb = np.asarray(Image.fromarray(H.astype(np.uint8)).filter(ImageFilter.BoxBlur(5)), np.float32)
Bb = np.asarray(Image.fromarray(B.astype(np.uint8)).filter(ImageFilter.BoxBlur(5)), np.float32)


def sample(img, uv):
    h, w = img.shape[:2]
    x = np.clip((uv[:, 0] * w).astype(int), 0, w - 1)
    y = np.clip((uv[:, 1] * h).astype(int), 0, h - 1)
    return img[y, x]


ch = sample(Hb, hv[pairs[:, 0], 3:5])
cb = sample(Bb, bv[pairs[:, 1], 3:5])
ok = (ch.mean(1) > 20) & (cb.mean(1) > 20)  # pas les zones peintes en noir (sous-vêtement)
gain = np.clip(cb / np.maximum(ch, 1), 0.75, 1.25)
gain[~ok] = 1
# lissage le long de la couture (moyenne des 12 voisins les plus proches)
P = hv[pairs[:, 0], :3]
sg = np.empty_like(gain)
for j in range(len(P)):
    d = np.linalg.norm(P - P[j], axis=1)
    nn = np.argsort(d)[:12]
    w = ok[nn].astype(np.float32) + 1e-3
    sg[j] = (gain[nn] * w[:, None]).sum(0) / w.sum()
before = float(np.abs(ch[ok] - cb[ok]).mean())
gmean = sg[ok].mean(0)
# gain par sommet de la tête : couture la plus proche, atténuée avec la distance
G = np.ones((len(hv), 3), np.float32)
for k in hused:
    d = np.linalg.norm(P - hv[k, :3], axis=1)
    j = int(np.argmin(d))
    t = np.clip((d[j] - 0.02) / (0.10 - 0.02), 0, 1)
    f = 1 - t * t * (3 - 2 * t)
    if HAUT:
        # --hauteur : toute la partie thorax/bas du cou du maillage de la tête prend le gain moyen de la couture
        # (plein sous 1,47 m, nul à 1,55 m, bien sous le menton)
        u = np.clip((hv[k, 1] - 1.47) / (1.55 - 1.47), 0, 1)
        fh = 1 - u * u * (3 - 2 * u)
        if fh > f:
            G[k] = 1 + (gmean - 1) * fh
            continue
    G[k] = 1 + (sg[j] - 1) * f
# tracé UV : triangles colorés par le gain moyen (le gain varie lentement : la moyenne par triangle, puis un flou,
# suffit), dans une image 256 agrandie
S = 512
gimg = Image.new('RGB', (S, S), (128, 128, 128))
dr = ImageDraw.Draw(gimg)
enc = lambda g: tuple(int(np.clip(128 + (x - 1) * 400, 0, 255)) for x in g)
for t in hi:
    g = G[t].mean(0)
    if np.abs(g - 1).max() < 0.004:
        continue
    dr.polygon([(float(hv[k, 3] * S), float(hv[k, 4] * S)) for k in t], fill=enc(g))
gimg = gimg.filter(ImageFilter.GaussianBlur(3)).resize((H.shape[1], H.shape[0]), Image.BILINEAR)
gm = 1 + (np.asarray(gimg, np.float32) - 128) / 400
out = H * gm
after = float(np.abs(sample(np.asarray(Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).filter(ImageFilter.BoxBlur(5)), np.float32), hv[pairs[:, 0], 3:5])[ok] - cb[ok]).mean())
changed = float((np.abs(gm - 1).max(-1) > 0.01).mean())
res = dict(coach=COACH, sommets_couture=int(len(pairs)), ecart_moyen_avant=round(before, 2), ecart_moyen_apres=round(after, 2),
           gain_moyen=[round(float(x), 3) for x in sg[ok].mean(0)], part_texture_modifiee=round(changed, 4), applique=APPLY)
print(res)
if APPLY:
    src = D / f'{pre}_head_color{hpath.suffix.replace(".new", "")}'
    orig = next(p for p in (D / f'{pre}_head_color.jpg', D / f'{pre}_head_color.png') if p.exists())
    o = D / f'{pre}_head_color.new{orig.suffix}'
    im = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
    if orig.suffix == '.png':
        im.save(o, optimize=True)
    else:
        s = Image.open(orig)
        im.save(o, qtables=s.quantization, subsampling=JpegImagePlugin.get_sampling(s))
(D / 'raccord-v220.json').write_text(json.dumps(res, indent=1))
