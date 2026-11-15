"""Kadir 1.46 — texture et rugosité du corps.
1. Même teinte que la nouvelle tête (gain calculé par tete_compo.py) : le cou et la poitrine se raccordent.
2. Caleçon de la planche 1 : boxer ajusté gris anthracite mat, jambes jusqu'à mi-cuisse (1.45 : slip court noir
   brillant), ceinture élastique de 3,5 cm, couture d'ourlet. Peint dans la texture (comme celui de 1.45).
3. Carte de rugosité (canal vert) : peau 0,62, caleçon 0,93 (mat), ceinture 0,85.
  python3 tools/generator/kadir/corps.py corps_1.45.jpg masques.json corps_uv.npz corps_sortie.jpg rugosite_sortie.jpg"""
import sys, json, numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter as gf
src, gj, uvf, out, rout = sys.argv[1:6]
g = np.array(json.load(open(gj))['gain_peau'], np.float32)
a = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255
S = a.shape[0]
L = a @ np.array([0.2126, 0.7152, 0.0722], np.float32)
old = np.clip((0.09 - L) / 0.05, 0, 1)  # caleçon noir peint de 1.45
o = np.clip(a * g, 0, 1)
u = np.load(uvf); PM, VM = u['PM'], u['VM']
x, y, z = PM[..., 0], PM[..., 1], PM[..., 2]
HEM, TOP = 0.69, 1.02
reg = VM & (z > HEM) & (z < TOP + 0.002) & (np.abs(x) < 0.26)
reg = reg | (old > 0.5)
box = np.clip(gf(reg.astype(np.float32), 1.2) * 1.6, 0, 1) * (VM | (old > 0.5))
band = np.clip((z - (TOP - 0.035)) / 0.004, 0, 1) * VM  # ceinture
hem = np.exp(-((z - HEM - 0.012) / 0.0025) ** 2) * VM * (np.abs(x) < 0.26)  # couture de l'ourlet
rng = np.random.default_rng(146)
knit = gf(rng.normal(0, 1, (S, S)).astype(np.float32), 0.7)
knit = 1 + 0.06 * knit / (knit.std() + 1e-6)
shade = 1 - 0.05 * np.clip(gf(rng.normal(0, 1, (S, S)).astype(np.float32), 12) * 25, -1, 1)
fab = np.array([46, 46, 49], np.float32) / 255
col = fab[None, None] * (knit * shade)[..., None]
col = col * (1 - 0.18 * band[..., None]) * (1 - 0.25 * hem[..., None])
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from poils import torse
o = torse(o, PM, VM, S)
o = o * (1 - box[..., None]) + col * box[..., None]
Image.fromarray((np.clip(o, 0, 1) * 255 + 0.5).astype(np.uint8)).save(out, quality=90)
r = 0.62 * (1 - box) + (0.93 - 0.08 * band) * box
rg = np.stack([np.zeros_like(r) + 1, r, np.zeros_like(r)], -1)  # R libre, G rugosité, B métal = 0
Image.fromarray((rg * 255 + 0.5).astype(np.uint8)).resize((512, 512), Image.BILINEAR).save(rout, quality=88)
print('ok', out, rout)
