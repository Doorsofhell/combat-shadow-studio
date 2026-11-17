"""Kanya 1.48 — texture du corps : celle d'Inaya ramenée au teint de Kanya par le MÊME gain que la peau de la tête
(tete_compo.py, .json) : la couture du cou se raccorde comme chez Inaya (leçon de Victor : cou plus clair). Puis les
tatouages Sak Yant (tatouages.py) si leur calque est donné.
  python3 tools/generator/kanya/corps.py corps_inaya.jpg masques.json sortie.jpg [taille] [calque_tatouages.png]"""
import sys, json, numpy as np
from PIL import Image
src, js, out = sys.argv[1:4]
size = int(sys.argv[4]) if len(sys.argv) > 4 else 2048
im = Image.open(src).convert('RGB')
if im.size[0] != size: im = im.resize((size, size), Image.LANCZOS)
K = np.asarray(im).astype(np.float32) / 255
g = np.array(json.load(open(js))['gain_peau'], np.float32)
# le bas noir peint d'Inaya (sous le short) reste noir : le gain ne touche que la peau (assez claire, saturée)
lum = K @ np.array([0.2126, 0.7152, 0.0722], np.float32)
O = K * g
if len(sys.argv) > 5:
    t = np.asarray(Image.open(sys.argv[5]).convert('LA').resize((size, size), Image.LANCZOS)).astype(np.float32) / 255
    a = t[..., 1:2] * 0.85
    ink = np.array([0.10, 0.11, 0.14], np.float32)  # encre bleu-noir un peu passée
    O = O * (1 - a) + (O * 0.35 + ink * 0.65) * a
Image.fromarray((np.clip(O, 0, 1) * 255 + 0.5).astype(np.uint8)).save(out, quality=86)
print('corps', size, 'gain', g.round(3))
