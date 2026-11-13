"""1.36 (Youssef 12/11: « Ok pour barbe de Kadir »): lightens Kadir's moustache and the tuft under his lip so that the
mouth reads (smile, exhale of the strike); the chin beard and the stubble of the cheeks stay as they are.

  python3 tools/generator/rocketbox/beard_trim.py public/coaches/mma-kadir/photo.glb [strength 0..1] [out.glb]

Works on the head colour texture inside the GLB (Rocketbox m021_head_color, 2048 px): in a feathered zone around the
lips (moustache, mouth corners, tuft under the lip), the dark hairs are replaced by the skin around them (normalized
blur of the pixels that are not hair), at `strength` (0.85 by default: a light shadow of stubble stays, as on a man
shaved a day before). Only that image changes: geometry, skin weights and expressions are untouched. The file records
it (images[i].extras.beardTrim) and refuses a second pass.
"""
import io
import json
import struct
import sys

import numpy as np
from PIL import Image

path = sys.argv[1]
STRENGTH = float(sys.argv[2]) if len(sys.argv) > 2 else 0.85
out_path = sys.argv[3] if len(sys.argv) > 3 else path

# zone, in pixels of the 2048 px head texture (measured on m021_head_color: lips 905..1145 × 790..852)
MOUTH = (1025.0, 818.0)
RX, RY = 190.0, 125.0  # moustache above, tuft below, corners on the sides
FEATHER = 0.35  # share of the radius over which the zone fades out
CHIN_KEEP = 945.0  # under this line (the chin beard), the hairs stay
NOSE_LINE = 742.0  # above it, the nostrils
LIPS = (128.0, 36.0)  # half-width and half-height of the lips, kept as they are


def box(a, r, axis):
    c = np.cumsum(np.pad(a, [(r + 1, r) if k == axis else (0, 0) for k in range(a.ndim)], mode='edge'), axis=axis)
    hi = np.take(c, range(2 * r + 1, c.shape[axis]), axis=axis)
    lo = np.take(c, range(0, c.shape[axis] - 2 * r - 1), axis=axis)
    return (hi - lo) / (2 * r + 1)


def blur(a, r):
    for _ in range(3):
        a = box(box(a, r, 0), r, 1)
    return a


raw = bytearray(open(path, 'rb').read())
jl = struct.unpack_from('<I', raw, 12)[0]
J = json.loads(raw[20:20 + jl])
bl = struct.unpack_from('<I', raw, 20 + jl)[0]
B0 = 20 + jl + 8
binbuf = bytes(raw[B0:B0 + bl])
rest = bytes(raw[B0 + bl:])

img_i = next(i for i, im in enumerate(J['images']) if im.get('name', '').endswith('head_color'))
im = J['images'][img_i]
if im.get('extras', {}).get('beardTrim') is not None:
    sys.exit(f'{path}: beard already trimmed ({im["extras"]["beardTrim"]})')
bv = J['bufferViews'][im['bufferView']]
data = binbuf[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]
src = Image.open(io.BytesIO(data)).convert('RGB')
A = np.asarray(src).astype(np.float64) / 255.0
H, W = A.shape[:2]
assert (H, W) == (2048, 2048), f'unexpected head texture size {W}x{H}'

# the zone: an ellipse round the mouth, feathered, cut below the lower lip's tuft (the chin beard stays)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float64)
d = np.sqrt(((xx - MOUTH[0]) / RX) ** 2 + ((yy - MOUTH[1]) / RY) ** 2)
zone = np.clip((1 - d) / FEATHER, 0, 1)
zone *= np.clip((CHIN_KEEP + 25 - yy) / 50, 0, 1)
# the nostrils and the lips themselves (their dark closing line included) stay untouched
zone *= np.clip((yy - NOSE_LINE) / 18, 0, 1)
dl = np.sqrt(((xx - MOUTH[0]) / LIPS[0]) ** 2 + ((yy - MOUTH[1]) / LIPS[1]) ** 2)
zone *= np.clip((dl - 1) / 0.12, 0, 1)

# hairs: pixels clearly darker than the skin around them (lips are reddish and light: kept by the red test)
lum = A @ np.array([0.299, 0.587, 0.114])
local = blur(lum, 30)
red = A[..., 0] - A[..., 2]
hair = np.clip((local - lum - 0.03) / 0.08, 0, 1) * np.clip((0.32 - red) / 0.12 + 0.6, 0, 1)
hair = np.clip(blur(hair, 1) * 1.6, 0, 1)

# what replaces them: the colour of the skin and stubble round them (normalized blur of the non-hair pixels), with
# a part of the original fine grain so that the place keeps the texture of a shaved skin, not a smooth patch
w = (1 - hair) ** 3
def fill_from(r):
    num = np.stack([blur(A[..., k] * w, r) for k in range(3)], -1)
    den = blur(w, r)[..., None]
    return num / (den + 1e-6), den


near, dn = fill_from(16)
far, _ = fill_from(40)
# where few skin pixels are near (the middle of the dense tuft), the wider average takes over
k = np.clip(dn / 0.35, 0, 1)
skin = near * k + far * (1 - k)
fine = A - np.stack([blur(A[..., k], 2) for k in range(3)], -1)
# inside the dense tuft there is no grain to keep: the stubble grain 120 px to the side is borrowed
side = np.roll(fine, 120, axis=1)
grain = fine * k + side * (1 - k)
fill = skin + (0.45 * k + 0.9 * (1 - k)) * np.clip(grain, -0.06, 0.06)
a = (STRENGTH * zone * hair)[..., None]
OUT = A * (1 - a) + fill * a

out_img = Image.fromarray(np.clip(OUT * 255 + 0.5, 0, 255).astype(np.uint8))
buf = io.BytesIO()
out_img.save(buf, 'JPEG', quality=92, subsampling=0)
new = buf.getvalue()

# rebuild the binary chunk with the new image in place of the old one (offsets of the other views follow)
views = J['bufferViews']
order = sorted(range(len(views)), key=lambda i: views[i].get('byteOffset', 0))
nb = bytearray()
for i in order:
    v = views[i]
    chunk = new if i == im['bufferView'] else binbuf[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']]
    while len(nb) % 4:
        nb.append(0)
    v['byteOffset'] = len(nb)
    v['byteLength'] = len(chunk)
    nb.extend(chunk)
J['buffers'][0]['byteLength'] = len(nb)
while len(nb) % 4:
    nb.append(0)
im.setdefault('extras', {})['beardTrim'] = STRENGTH
js = json.dumps(J, separators=(',', ':')).encode()
js += b' ' * ((4 - len(js) % 4) % 4)
body = struct.pack('<I', len(js)) + b'JSON' + js + struct.pack('<I', len(nb)) + b'BIN\x00' + bytes(nb) + rest
open(out_path, 'wb').write(b'glTF' + struct.pack('<II', 2, 12 + len(body)) + body)
print(f'{out_path}: head texture trimmed at {STRENGTH} ({len(data)} -> {len(new)} octets), '
      f'{int((zone * hair > 0.5).sum())} hair pixels in the zone')
