"""1.20 (Youssef, 05/11 14:09: « la définition du corps d'Amara est meilleure, les muscles sont bien dessinés et il
paraît plus réaliste, pourquoi ? », 14:38 « la reprise du détail des muscles d'Amara : oui »).

Measured: Inaya's body relief map had 40 % less detail than Amara's, its colour 22 % less. Both coaches are the same
Rocketbox body (Sports_Female_01, same texture layout), but Amara's shipped relief map carries our anatomy bake, and
Inaya's skin was repainted where her old bikini was (skin_paint.py: flat relief, smooth colour).

This takes Amara's muscle drawing, never her colour, into Inaya's textures, wherever Amara's texel is skin (her
bikini is painted black in her colour map and modelled in her relief map: both excluded, as is everything outside the
texture's islands):
- relief: Amara's relief map, faded in over a few texels at the edges of the region;
- colour: Inaya's own colour, blurred, times Amara's shading detail (her luminance divided by its blur), so the shadow
  lines between the muscles come across and the tone stays Inaya's.

usage: python3 detail_from.py <Inaya texture dir> <Amara photo.glb> [COLOR=0.8] [EDGE=6]
Run after skin_paint.py, before convert.py.
"""
import io
import json
import os
import struct
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, distance_transform_edt, gaussian_filter

texdir, donor = sys.argv[1], sys.argv[2]
COLOR = float(os.environ.get('COLOR', '0.8'))
EDGE = float(os.environ.get('EDGE', '6'))  # px of fade (2048 px texture)
BIK = int(os.environ.get('BIK', '44'))  # px kept away from her bikini


def glb_images(path, suffix):
    b = open(path, 'rb').read()
    jl = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + jl])
    bin_ = b[20 + jl + 8:]
    mat = next(m for m in j['materials'] if m['name'].endswith(suffix))

    def get(ref):
        img = j['images'][j['textures'][ref['index']]['source']]
        v = j['bufferViews'][img['bufferView']]
        o = v.get('byteOffset', 0)
        return Image.open(io.BytesIO(bin_[o:o + v['byteLength']])).convert('RGB')
    return get(mat['pbrMetallicRoughness']['baseColorTexture']), get(mat['normalTexture'])


def arr(im, size):
    if im.size != size:
        im = im.resize(size, Image.LANCZOS)
    return np.asarray(im, dtype=np.float32) / 255


cp = os.path.join(texdir, 'f021_body_color.png')
npth = os.path.join(texdir, 'f021_body_normal.tga')
ic = np.asarray(Image.open(cp).convert('RGB'), dtype=np.float32) / 255
inn = np.asarray(Image.open(npth).convert('RGB'), dtype=np.float32) / 255
H, W = ic.shape[:2]
dc_im, dn_im = glb_images(donor, '_body')
dc, dn = arr(dc_im, (W, H)), arr(dn_im, (W, H))

lum = lambda a: a @ np.array([0.299, 0.587, 0.114], np.float32)
dl = lum(dc)
# Amara's skin: not the black bikini nor the black outside the islands; a margin around them (jpeg and blur)
dark = dl < 0.12
# relief maps: outside the islands both are flat (0.5, 0.5, 1); keep only where Amara's map has an island too
flat = np.abs(dn - np.array([0.5, 0.5, 1.0], np.float32)).max(2) < 0.01
flat = gaussian_filter(flat.astype(np.float32), 3) > 0.99
# her bikini is black inside an island: its edges (seams, the cups' rims) are drawn well beyond the black, so a
# wide margin there; the black outside the islands only needs a small one
# where her bikini was is where Inaya's was too (same body): skin_paint.py marks those texels (_repeint.png)
rp = os.path.join(texdir, 'f021_body_repeint.png')
bik = dark & ~binary_dilation(flat, iterations=8)
if os.path.exists(rp):
    bik |= np.asarray(Image.open(rp).convert('L').resize((W, H))) > 127
skin = ~binary_dilation(dark, iterations=int(EDGE) + 4) & ~binary_dilation(bik, iterations=BIK) & ~flat
w = np.clip(distance_transform_edt(skin) / EDGE, 0, 1)[..., None]

# relief: Amara's, renormalised
n_new = inn * (1 - w) + dn * w
v = n_new * 2 - 1
v /= np.maximum(np.linalg.norm(v, axis=2, keepdims=True), 1e-6)
n_new = (v + 1) / 2

# colour: Inaya's low frequencies times Amara's relative shading
R = 6
dlow = gaussian_filter(dl, R)
ratio = np.clip(dl / np.maximum(dlow, 1e-3), 0.6, 1.4)
ilow = gaussian_filter(ic, (R, R, 0))
ihigh = ic - ilow
# her own fine grain is kept; the shading of the muscles is Amara's
c_new = ilow * (1 + COLOR * (ratio[..., None] - 1)) + ihigh * 0.6
c_out = ic * (1 - w) + c_new * w

Image.fromarray((np.clip(c_out, 0, 1) * 255 + 0.5).astype(np.uint8)).save(cp)
Image.fromarray((np.clip(n_new, 0, 1) * 255 + 0.5).astype(np.uint8)).save(npth)


def detail(a):
    g = lum(a) if a.ndim == 3 else a
    return float(np.std(g - gaussian_filter(g, 12)))


m = w[..., 0] > 0.5
print(f'détail des muscles repris d\'Amara sur {m.mean() * 100:.0f} % de la texture du corps ; '
      f'relief {detail(inn) * 255:.2f} -> {detail(n_new) * 255:.2f} (Amara {detail(dn) * 255:.2f}), '
      f'couleur {detail(ic) * 255:.2f} -> {detail(c_out) * 255:.2f} (Amara {detail(dc) * 255:.2f})')
