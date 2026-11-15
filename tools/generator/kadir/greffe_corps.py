"""Kadir 1.46 — accorde la peau du corps (texture peinte d'après les planches, corps.py) au teint du visage greffé.
  python3 tools/generator/kadir/greffe_corps.py corps.jpg tete_greffe.json sortie.jpg
Le gain (calculé par greffe_tete.py sur le cou) n'agit que sur la peau : le caleçon, sombre, garde sa couleur."""
import sys, json, numpy as np
from PIL import Image
src, gj, out = sys.argv[1:4]
B = np.asarray(Image.open(src).convert('RGB'), np.float32) / 255
g = np.array(json.load(open(gj))['gain'], np.float32)
lum = B @ np.array([0.3, 0.59, 0.11], np.float32)
w = np.clip((lum - 0.18) / 0.15, 0, 1)[..., None]
O = np.clip(B * (1 + (g - 1) * w), 0, 1)
# relief musculaire mieux lisible à l'écran (mission 15/11) : ombre douce dans les creux entre les muscles, tirée de
# la carte de normales du corps (divergence des normales = courbure), sur la peau seulement ; aucun trait dessiné
import os
if os.environ.get('DEFINITION'):
    from scipy.ndimage import gaussian_filter
    Nm = np.asarray(Image.open(os.environ['DEFINITION']).convert('RGB').resize(B.shape[1::-1]), np.float32) / 127.5 - 1
    nx, ny = gaussian_filter(Nm[..., 0], 2), gaussian_filter(Nm[..., 1], 2)
    cav = gaussian_filter(np.gradient(nx, axis=1) - np.gradient(ny, axis=0), 4) * 25
    k = float(os.environ.get('DEF_FORCE', '0.10'))
    shade = 1 - k * np.clip(-cav, 0, 1) + 0.4 * k * np.clip(cav, 0, 1)
    if os.environ.get('CORPS_UV'):  # pas d'ombre près du raccord tête/corps (bas du cou, haut des trapèzes)
        bz = np.load(os.environ['CORPS_UV'])['PM'][..., 2]
        fade = np.clip((1.40 - bz) / 0.06, 0, 1)
        shade = 1 + (shade - 1) * fade
    shade = shade / float(shade[w[..., 0] > 0.5].mean())  # même teinte moyenne : le raccord avec le cou ne bouge pas
    O = np.clip(O * (1 + (shade[..., None] - 1) * w), 0, 1)
Image.fromarray((O * 255 + 0.5).astype(np.uint8)).save(out, quality=88)
print('ok', out, np.round(g, 3))
