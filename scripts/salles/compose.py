"""1.23 Salles immersives: turns the Blender panorama of a room (salles.py) into the pictures the app loads.

The render gets what makes a photo of a gym: light that bleeds around the lamps (bloom), a haze that grows with the
distance (strongest around the horizon of the panorama, where the far walls are), the far room very slightly out of
focus while the floor under the coach stays sharp, and a fine grain. It also writes the mask of the lamps, which the
app uses to make each light breathe and flicker a little.

Usage: python3 -I scripts/salles/compose.py <render dir> <public/salles dir> [room ...]
Writes <public>/<room>/: fond.webp (4096×2048), fond-2k.webp (2048×1024), lumiere-coach.webp (512×256, lights the
coach), lumieres.webp (1024×512, grey),
sprite-*.webp, salle.json. The result depends only on the render and the room (fixed seed).
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image


def _box(a, r, axis, wrap):
    """box blur of radius r along one axis (running sum), wrapping or clamping at the ends"""
    n = a.shape[axis]
    idx = np.arange(n)
    lo, hi = idx - r - 1, idx + r
    c = np.cumsum(a, axis=axis, dtype=np.float64)
    c = np.concatenate([np.zeros_like(np.take(c, [0], axis=axis)), c], axis=axis)
    if wrap:
        total = np.take(c, [n], axis=axis)
        def at(i):
            q, m = np.floor_divide(i + 1, n), np.mod(i + 1, n)
            return np.take(c, m, axis=axis) + q.reshape([-1 if k == axis else 1 for k in range(a.ndim)]) * total
        return ((at(hi) - at(lo)) / (2 * r + 1)).astype(np.float32)
    lo_c, hi_c = np.clip(lo + 1, 0, n), np.clip(hi + 1, 0, n)
    cnt = (hi_c - lo_c).reshape([-1 if k == axis else 1 for k in range(a.ndim)])
    return ((np.take(c, hi_c, axis=axis) - np.take(c, lo_c, axis=axis)) / cnt).astype(np.float32)


def gblur(img, r, wrap=True):
    """gaussian-like blur (three box passes) of an H×W×C float image, wrapping around horizontally (no seam in the
    panorama) and clamping vertically"""
    if r <= 0.5:
        return img
    b = max(1, int(round(r * 0.9)))
    out = img
    for _ in range(3):
        out = _box(out, b, 1, wrap)
        out = _box(out, b, 0, False)
    return out


def hexrgb(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], np.float32)


def compose(src: Path, dst: Path, room: str):
    meta = json.loads((src / 'salle.json').read_text())
    im = Image.open(src / 'pano.png')
    arr = np.asarray(im, np.float32)
    arr = arr / (65535.0 if arr.max() > 255 else 255.0)
    arr = arr[..., :3]
    H, W = arr.shape[:2]
    s = W / 4096
    v = (np.arange(H, dtype=np.float32) / H)[:, None, None]
    lum = arr @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    # 1. the far room slightly out of focus: a band around the horizon; the floor near the coach (bottom) stays sharp
    far = np.exp(-((v - 0.47) / 0.16) ** 2)
    soft = gblur(arr, 2.2 * s)
    img = arr * (1 - far * 0.85) + soft * far * 0.85
    # 2. bloom around what is bright (lamps, spots, windows)
    bright = np.clip((lum - 0.62) / 0.38, 0, 1)[..., None] * arr
    bloom = gblur(bright, 10 * s) * 0.55 + gblur(bright, 42 * s) * 0.45
    img = img + bloom * 0.45
    # 3. haze: the room's air, lit by its lights (more where it is far, a veil over the lights' halo)
    haze = hexrgb(meta.get('haze', '#202020'))
    veil = gblur(arr, 90 * s).mean(axis=2, keepdims=True)
    img = img + haze * far * 0.22 + veil * haze / max(1e-3, haze.max()) * far * 0.18
    # 4. grade: lift the blacks a touch (a photo is never pure black), a gentle S curve
    img = np.clip(img, 0, 1)
    img = 0.018 + img * 0.982
    img = img + 0.06 * (img - img ** 2) * (2 * img - 1) * -1
    # 5. fine grain (fixed seed)
    rng = np.random.default_rng(1230 + sum(map(ord, room)))
    g = rng.normal(0, 0.012, (H, W, 1)).astype(np.float32)
    img = np.clip(img + g * (0.6 + 0.4 * (1 - img)), 0, 1)
    out = dst / room
    out.mkdir(parents=True, exist_ok=True)
    pic = Image.fromarray((img * 255 + 0.5).astype(np.uint8))
    pic.resize((4096, 2048), Image.LANCZOS).save(out / 'fond.webp', quality=82, method=6)
    pic.resize((2048, 1024), Image.LANCZOS).save(out / 'fond-2k.webp', quality=82, method=6)
    # a small copy for the light and reflections on the coach (prefiltered on the device: cheap at this size)
    pic.resize((512, 256), Image.LANCZOS).save(out / 'lumiere-coach.webp', quality=90, method=6)
    # mask of the lights (what glows), soft, for the flicker in the app
    mask = np.clip((lum - 0.55) / 0.45, 0, 1)
    mask = gblur(mask[..., None], 6 * s)[..., 0]
    mask = np.clip(mask * 1.6, 0, 1)
    Image.fromarray((mask * 255).astype(np.uint8), mode='L').resize((1024, 512), Image.LANCZOS).save(out / 'lumieres.webp', quality=85, method=6)
    sprites = []
    for p in sorted(src.glob('sprite-*.png')):
        sp = Image.open(p).convert('RGBA')
        sp.save(out / (p.stem + '.webp'), quality=88, method=6)
        sprites.append(p.stem[len('sprite-'):])
    meta['sprites'] = sprites
    (out / 'salle.json').write_text(json.dumps(meta, indent=1, ensure_ascii=False))
    print('ok', room, flush=True)


def main():
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    rooms = sys.argv[3:] or sorted(p.name for p in src.iterdir() if (p / 'pano.png').exists())
    for r in rooms:
        compose(src / r, dst, r)


if __name__ == '__main__':
    main()
