"""1.11 textures of the coaches made by face_transfer.py (Naël, Inaya), the input folder of convert.py.

  python3 extra_textures.py nael  <face_transfer out dir> <Sports_Male_01/Textures>   <Male_Adult_07/Textures>   <out_dir>
  python3 extra_textures.py inaya <face_transfer out dir> <Sports_Female_01/Textures> <Female_Adult_01/Textures> <out_dir>

The head and body colours come from face_transfer.py (donor face baked on the sports body, body tinted to the donor
skin). Here only the garment painted on the sports body changes, as recolor.py does for Kadir and Amara: plain dark
fabric instead of the printed shorts (Naël) or the pink bikini (Inaya); the 3D outfits cover it, but a seam or a
gap must never show a logo or a pink patch. The relief maps of the sports body and the donor's hair texture are
copied under the material names convert.py looks for.
"""
import sys, os, shutil, glob
import numpy as np
from PIL import Image, ImageFilter

who, ftdir, basetex, donortex, out = sys.argv[1:6]
os.makedirs(out, exist_ok=True)
rng = np.random.default_rng(11)


def load(p):
    return np.asarray(Image.open(p).convert('RGB'), dtype=np.float32) / 255


def save(a, name):
    Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8)).save(os.path.join(out, name))


def blur(a, r):
    return np.asarray(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), dtype=np.float32) / 255


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def lum(a):
    return a @ np.array([0.3, 0.59, 0.11], dtype=np.float32)


def close(m, r=8, t=0.25):
    return blur((blur(m, r) > t).astype(np.float32), 1.5)


def fabric(a, mask, color):
    # same treatment as recolor.py: only the large folds of the old garment are kept, fine weave noise
    L = blur(lum(a), 18)
    L = L / max(1e-3, float(np.percentile(L[mask > 0.5], 70))) if (mask > 0.5).any() else L
    weave = 1 + 0.05 * (rng.random(L.shape, dtype=np.float32) - 0.5)
    f = np.array(color, dtype=np.float32) * np.clip(0.55 + 0.45 * L, 0.3, 1.2)[..., None] * weave[..., None]
    return a * (1 - mask[..., None]) + f * mask[..., None]


name = os.path.basename(ftdir.rstrip('/'))
head = load(os.path.join(ftdir, f'{name}_head_color.png'))
body = load(os.path.join(ftdir, f'{name}_body_color.png'))
H, W = body.shape[:2]
v = np.mgrid[0:H, 0:W][0].astype(np.float32) / H  # image space, v down
if who == 'nael':
    pre = 'm021'
    # the printed shorts: not skin (red close to blue) in the top part of the leg pieces, as in recolor.py
    r, g, b = body[..., 0], body[..., 1], body[..., 2]
    garment = close(smooth(0.12, 0.06, r - b) * (body.max(-1) > 0.02) * smooth(0.25, 0.2, v), 10)
    body = fabric(body, garment, (0.06, 0.065, 0.075))
else:
    pre = 'f021'
    pink = close(smooth(0.08, 0.2, np.minimum(body[..., 0], body[..., 2]) - body[..., 1]), 10)
    body = fabric(body, pink, (0.055, 0.055, 0.06))
save(head, f'{pre}_head_color.png')
save(body, f'{pre}_body_color.png')
for n in (f'{pre}_head_normal.tga', f'{pre}_body_normal.tga'):
    shutil.copy(os.path.join(basetex, n), out)
for p in glob.glob(os.path.join(donortex, '*_opacity_color.tga')):
    shutil.copy(p, os.path.join(out, 'Hair_opacity_color.tga'))  # face_transfer.py renames the material
print('ok', who, out, sorted(os.listdir(out)))
