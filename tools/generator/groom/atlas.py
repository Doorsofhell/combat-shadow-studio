"""
Hair card atlas for the realistic coaches (v0.29).

Every card texture is drawn from real strands: each strand is a tapered curve with its own length,
curl, thickness and shade, rasterised 4x larger and filtered down (anti-aliased coverage). Cards are
vertical: the root at the bottom (v = 0), the tip at the top.

Output (public/groom/):
- hair_atlas.png  RGBA, R = position along the strand (0 root, 1 tip), G = strand id (random, for
  colour variation), B = depth in the clump (0 inner strands, 1 outer), A = coverage
- src/three/hair_atlas.json  rectangles of every card variant in UV units, by family (scalp, short, beard, brow, lash)

Usage: python3 tools/generator/groom/atlas.py [out_dir]
"""
import json
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

SIZE = 2048
SS = 4  # supersampling
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', '..', '..', 'public', 'groom')

rng = np.random.default_rng(29)
big = SIZE * SS
cov = Image.new('L', (big, big), 0)
pos = Image.new('L', (big, big), 0)
sid = Image.new('L', (big, big), 0)
dep = Image.new('L', (big, big), 0)
dc, dp, ds, dd = (ImageDraw.Draw(i) for i in (cov, pos, sid, dep))


def strand(x0, y0, w, h, *, n, length, width, curl, wave, spread, lean, tipfade=0.35, clump=0.0, kink=0.0):
    """Draw n strands in the card rect (x0, y0, w, h) (atlas pixels, y down, root at the bottom)."""
    X0, Y0, W, H = (v * SS for v in (x0, y0, w, h))
    order = rng.permutation(n)
    for k in order:
        depth = rng.random()
        u = rng.normal(0.5, spread)
        u = min(0.95, max(0.05, u))
        L = H * min(0.98, max(0.15, rng.normal(length, length * 0.18)))
        th = W * width * (0.6 + 0.8 * rng.random())
        seg = 28
        ph = rng.random() * math.tau
        fr = curl * (0.7 + 0.6 * rng.random())
        amp = W * wave * (0.5 + rng.random())
        dl = lean * (rng.random() - 0.5) * 2
        pts = []
        for i in range(seg + 1):
            t = i / seg
            # clumping: strands converge towards the card centre at the tip
            cx = u + (0.5 - u) * clump * t * t
            x = X0 + W * cx + amp * math.sin(ph + fr * t * math.tau) * t + W * dl * t * t
            if kink and rng.random() < kink:
                x += W * 0.02 * (rng.random() - 0.5)
            y = Y0 + H - L * t
            pts.append((x, y))
        v_id = int(rng.integers(1, 255))
        v_d = int(255 * depth)
        for i in range(seg):
            t = i / seg
            wdt = max(1, int(round(th * (1 - 0.85 * t))))
            a = 255 if t < 1 - tipfade else int(255 * (1 - (t - (1 - tipfade)) / tipfade * 0.75))
            seg_pts = [pts[i], pts[i + 1]]
            dc.line(seg_pts, fill=a, width=wdt)
            dp.line(seg_pts, fill=int(255 * t), width=wdt)
            ds.line(seg_pts, fill=v_id, width=wdt)
            dd.line(seg_pts, fill=v_d, width=wdt)


rects = {'scalp': [], 'short': [], 'beard': [], 'brow': [], 'lash': []}


def add(family, x, y, w, h, **kw):
    strand(x, y, w, h, **kw)
    rects[family].append([x / SIZE, 1 - (y + h) / SIZE, w / SIZE, h / SIZE])  # u, v (bottom), w, h; flipY


# scalp locks: 8 cards 128 x 768 (combed hair, slight wave, clumped tips)
for i in range(8):
    add('scalp', i * 128, 0, 128, 768, n=55, length=0.82, width=0.016, curl=0.6 + 0.2 * (i % 3), wave=0.035,
        spread=0.2, lean=0.08, clump=0.35 + 0.05 * (i % 4))
# short dense hair (sides, nape, very short cuts): 8 cards 128 x 384
for i in range(8):
    add('short', i * 128, 768, 128, 384, n=70, length=0.75, width=0.02, curl=1.0, wave=0.03, spread=0.2,
        lean=0.12, clump=0.15)
# beard: 16 cards 128 x 256, short, curled, uneven lengths
for i in range(16):
    add('beard', (i % 8) * 128, 1152 + (i // 8) * 256, 128, 256, n=22, length=0.7, width=0.028,
        curl=1.4 + 0.3 * (i % 3), wave=0.06, spread=0.2, lean=0.25, clump=0.0, kink=0.15, tipfade=0.4)
# eyebrows: 4 cards 256 x 128, fine short hairs leaning along the card
for i in range(4):
    add('brow', 1024 + (i % 2) * 256, 1152 + (i // 2) * 128, 256, 128, n=40, length=0.75, width=0.012,
        curl=0.3, wave=0.02, spread=0.2, lean=0.45, clump=0.0, tipfade=0.5)
# eyelashes: 2 strips 512 x 96, curved hairs
for i in range(2):
    add('lash', 1024, 1408 + i * 96, 512, 96, n=110, length=0.85, width=0.008, curl=0.15, wave=0.0,
        spread=0.2, lean=0.25, clump=0.25, tipfade=0.45)


def down(img):
    return np.asarray(img.resize((SIZE, SIZE), Image.BOX), dtype=np.float32)


A = down(cov)
# value channels are drawn without blending: divide by the coverage so that the filtered edges keep the
# strand's value (no dark fringe), then fill the empty texels with their neighbours (mip-mapping)
mask = np.asarray(cov, dtype=np.float32) > 0
def chan(img):
    v = np.asarray(img, dtype=np.float32) * mask
    s = np.asarray(Image.fromarray(v.astype(np.float32)).resize((SIZE, SIZE), Image.BOX), dtype=np.float32)
    m = np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).resize((SIZE, SIZE), Image.BOX), dtype=np.float32) / 255
    out = np.where(m > 0, s / np.maximum(m, 1e-3), 0)
    return out

R, G, B = chan(pos), chan(sid), chan(dep)
# dilate values into the empty texels (a few passes)
filled = A > 0
for _ in range(8):
    for C in (R, G, B):
        sh = [np.roll(C, d, a) for a in (0, 1) for d in (-1, 1)]
        fs = [np.roll(filled, d, a) for a in (0, 1) for d in (-1, 1)]
        acc = sum(s * f for s, f in zip(sh, fs))
        cnt = sum(f.astype(np.float32) for f in fs)
        C[~filled] = np.where(cnt[~filled] > 0, acc[~filled] / np.maximum(cnt[~filled], 1), C[~filled])
    filled = filled | (sum(np.roll(filled, d, a) for a in (0, 1) for d in (-1, 1)) > 0)

img = np.stack([R, G, B, A], -1).clip(0, 255).astype(np.uint8)
os.makedirs(OUT, exist_ok=True)
Image.fromarray(img, 'RGBA').save(os.path.join(OUT, 'hair_atlas.png'), optimize=True)
SRC = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'src', 'three', 'hair_atlas.json')
with open(SRC, 'w') as f:
    json.dump({'size': SIZE, 'rects': rects}, f, indent=1)
print('atlas', os.path.join(OUT, 'hair_atlas.png'), {k: len(v) for k, v in rects.items()})
