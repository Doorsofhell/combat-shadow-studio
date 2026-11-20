"""Kadir 1.46 — carte de relief de la tête : les mèches en relief de la coiffure Rocketbox (motif « pelage » sous la
lumière de l'application) et le relief de son ancienne barbe sont aplatis là où la nouvelle texture met cheveux et
barbe de la planche ; la peau garde son relief d'origine.
  python3 tools/generator/kadir/tete_normale.py normale_1.45.jpg masques.npz sortie.jpg"""
import sys, numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter as gf
src, mk, out = sys.argv[1:4]
n = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 127.5 - 1
m = np.load(mk)
S = n.shape[0]
up = lambda a: np.asarray(Image.fromarray(a.astype(np.float32)).resize((S, S), Image.BILINEAR)) if a.shape[0] != S else a
poils = np.clip(np.maximum(up(m['hairy'].astype(np.float32)), up(m['kh'].astype(np.float32))), 0, 1)
k = gf(poils, 3) * 0.85  # part du relief retirée
fine = n - np.stack([gf(n[..., i], 2) for i in range(3)], -1)  # grain très fin gardé (aspect mat des poils)
flat = np.array([0, 0, 1], np.float32) + fine * 0.6
o = n * (1 - k[..., None]) + flat * k[..., None]
o /= np.linalg.norm(o, axis=-1, keepdims=True) + 1e-6
Image.fromarray(np.clip((o + 1) * 127.5 + 0.5, 0, 255).astype(np.uint8)).save(out, quality=90)
print('ok', out)
