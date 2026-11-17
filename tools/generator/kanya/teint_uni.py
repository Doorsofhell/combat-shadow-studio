"""Kanya 1.56.2 (Youssef 2026-11-17 22:50, « il y a une différence de couleur entre les jambes et le haut du corps »).
Vérifié sur la texture du corps (héritée d'Inaya, Rocketbox) : les jambes sont plus roses (bleu/vert 0,91 contre 0,83 au
ventre), le bas des jambes plus rouge (rouge/vert 1,48 contre 1,38), les pieds plus clairs et plus roses. Ce script
ramène la teinte de basse fréquence de toute la peau du corps sur celle du buste (ventre, poitrine, dos) : la couleur
moyenne, mesurée par un flou large sur la peau seule (sans le noir du bas peint ni l'encre des tatouages), est
corrigée à 100 % pour la teinte et à 50 % pour la clarté ; le grain, les ombres fines et les tatouages restent.
  python3 tools/generator/kanya/teint_uni.py inaya.npz corps.jpg sortie.jpg"""
import sys, numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter

npz, src, out = sys.argv[1:4]
d = np.load(npz)
P, T, U, M = d['P'], d['tris'], d['uvs'], d['mat']
im = Image.open(src).convert('RGB')
S = im.size[0]
K = np.asarray(im).astype(np.float32) / 255
lum = K @ np.array([0.2126, 0.7152, 0.0722], np.float32)
# peau : assez claire et chaude (pas le noir du bas peint, pas l'encre)
skin = ((lum > 0.28) & (K[..., 0] > K[..., 2] + 0.05)).astype(np.float32)
# buste : triangles du corps entre le nombril et les clavicules
c = P[T].mean(1)
sel = (M == 0) & (c[:, 2] > 0.95) & (c[:, 2] < 1.35) & (np.abs(c[:, 0]) < 0.2)
mk = Image.new('L', (S, S), 0)
dr = ImageDraw.Draw(mk)
for uv in U[sel]:
    dr.polygon([(u * S, (1 - v) * S) for u, v in uv], fill=255)
torso = (np.asarray(mk) > 0) & (skin > 0)
tgt = np.median(K[torso], axis=0)
tl = float(tgt @ np.array([0.2126, 0.7152, 0.0722]))
sig = S / 50
w = gaussian_filter(skin, sig) + 1e-4
LP = np.stack([gaussian_filter(K[..., k] * skin, sig) for k in range(3)], -1) / w[..., None]
LPl = LP @ np.array([0.2126, 0.7152, 0.0722], np.float32)
# couleur voulue : la teinte du buste, à mi-chemin entre la clarté locale et celle du buste
want_l = LPl + 0.5 * (tl - LPl)
want = tgt[None, None, :] / tl * want_l[..., None]
g = want / np.maximum(LP, 1e-3)
g = np.clip(g, 0.6, 1.6)
O = K * (1 + (g - 1) * np.clip(gaussian_filter(skin, 3), 0, 1)[..., None])
Image.fromarray((np.clip(O, 0, 1) * 255 + 0.5).astype(np.uint8)).save(out, quality=86)
def report(img, lab):
    for lo, hi, n in [(0.1, 0.45, 'bas des jambes'), (0.5, 0.85, 'cuisses'), (1.05, 1.2, 'ventre'), (1.2, 1.4, 'poitrine')]:
        s = (M == 0) & (c[:, 2] > lo) & (c[:, 2] < hi) & (np.abs(c[:, 0]) < 0.25)
        uv = U[s].mean(1)
        px = img[np.clip(((1 - uv[:, 1]) * S).astype(int), 0, S - 1), np.clip((uv[:, 0] * S).astype(int), 0, S - 1)]
        m = np.median(px, 0)
        print(lab, n, (m * 255).round(1), 'R/G', round(m[0] / m[1], 3), 'B/G', round(m[2] / m[1], 3))
report(K, 'avant')
report(O, 'après')
print('teinte du buste', (tgt * 255).round(1))
