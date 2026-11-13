"""
Turns two Rocketbox avatars into the coaches Kadir and Amara (texture edits only, same geometry):
  python3 recolor.py kadir <Sports_Male_01/Textures> <out_dir>
  python3 recolor.py amara <Sports_Female_01/Textures> <out_dir>
Kadir: black hair and a full short beard, brown eyes, light tan, plain black fight shorts (no logo).
Amara: brown skin, black hair, brown eyes, black sportswear instead of the pink bikini.
Writes <material>_color.png (+ copies the normal maps) for convert.py.
"""
import sys, os, shutil
import numpy as np
from PIL import Image, ImageFilter

who, src, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)
rng = np.random.default_rng(7)


def load(name):
    return np.asarray(Image.open(os.path.join(src, name)).convert('RGB'), dtype=np.float32) / 255


def save(a, name):
    Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8)).save(os.path.join(out, name))


def blur(a, r):
    if a.ndim == 2:
        return np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), dtype=np.float32) / 255
    return np.stack([blur(a[..., i], r) for i in range(a.shape[2])], -1)


def lum(a):
    return a @ np.array([0.3, 0.59, 0.11], dtype=np.float32)


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


H = W = 2048
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
u, v = xx / W, yy / H  # image space, v down


def ellipse(cx, cy, rx, ry, soft=0.15):
    d = np.sqrt(((u - cx) / rx) ** 2 + ((v - cy) / ry) ** 2)
    return smooth(1 + soft, 1 - soft, d)


EYE = (0.2637, 0.9326, 0.021)


def iris_to_brown(head):
    # the eye is drawn in the lower left part of the head texture: blue iris -> dark brown, same light
    eye = ellipse(EYE[0], EYE[1], EYE[2], EYE[2], 0.15)
    blue = eye * smooth(0.62, 0.5, lum(head))  # the iris, not the white around it
    L = lum(head)[..., None]
    brown = np.array([0.36, 0.22, 0.12], dtype=np.float32) * (0.4 + 1.3 * L)
    return head * (1 - blue[..., None]) + brown * blue[..., None]


def fabric(a, mask, color):
    # plain fabric: keep only the large folds of the old garment (its print and logo go), fine weave noise
    L = blur(lum(a), 18)
    L = L / max(1e-3, float(np.percentile(L[mask > 0.5], 70))) if (mask > 0.5).any() else L
    weave = 1 + 0.05 * (rng.random(L.shape, dtype=np.float32) - 0.5)
    f = np.array(color, dtype=np.float32) * np.clip(0.55 + 0.45 * L, 0.3, 1.2)[..., None] * weave[..., None]
    return a * (1 - mask[..., None]) + f * mask[..., None]


def close(m, r=8, t=0.25):
    # fill the holes of a mask (white flowers, logo letters inside the garment)
    return blur((blur(m, r) > t).astype(np.float32), 1.5)


def not_skin(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return smooth(0.12, 0.06, r - b) * (a.max(-1) > 0.02)


def skin_stats(a, mask):
    return a[mask > 0.5].mean(0)


if who == 'kadir':
    head = load('m021_head_color.tga')
    body = load('m021_body_color.tga')
    # hair: darker and less red than the skin around it; only in the scalp area (top of the texture and
    # the sides) so that the eyebrows and the shadows of the face are not touched
    Lh = lum(head)
    skin_ref = blur(head, 24)
    darker = smooth(0.02, 0.12, lum(skin_ref) - Lh + 0.06 * (head[..., 0] - head[..., 1] < 0.12))
    face = ellipse(0.5, 0.36, 0.17, 0.2, 0.25)
    scalp = smooth(0.40, 0.30, v) * (1 - face)
    hairm = np.clip(scalp * (0.35 + 0.65 * darker) * 1.6, 0, 1)
    hairm = blur(hairm, 2)
    dark_hair = np.array([0.075, 0.058, 0.05], dtype=np.float32) * (0.6 + 1.8 * Lh)[..., None]
    head = head * (1 - hairm[..., None]) + dark_hair * hairm[..., None]
    # beard: a dense short beard over the jaw, chin and upper lip, built on the photo's own stubble
    zone = np.maximum.reduce([
        ellipse(0.5, 0.455, 0.13, 0.085, 0.35),  # chin, jaw, lower cheeks
        ellipse(0.5, 0.372, 0.06, 0.016, 0.45),  # moustache
    ])
    zone *= 1 - ellipse(0.5, 0.39, 0.042, 0.011, 0.5)  # lips stay clear
    zone *= smooth(0.31, 0.35, v) * smooth(0.555, 0.52, v)  # cheekbones and neck stay clear
    zone = blur(zone, 6)
    # strands: noise stretched downwards (the beard grows down), on top of the photo's own stubble
    n = rng.random((H, W), dtype=np.float32)
    streak = np.asarray(Image.fromarray((n * 255).astype(np.uint8)).filter(ImageFilter.BoxBlur(1)).resize((W, H // 4)).resize((W, H), Image.BILINEAR), dtype=np.float32) / 255
    stub = np.clip((lum(skin_ref) - Lh) * 5, 0, 1)
    dens = np.clip(zone * (0.3 + 0.45 * smooth(0.35, 0.75, streak) + 0.9 * stub), 0, 1) * 0.85
    beard = np.array([0.055, 0.044, 0.038], dtype=np.float32) * (0.6 + 1.2 * streak)[..., None]
    head = head * (1 - dens[..., None]) + beard * dens[..., None]
    head = iris_to_brown(head)
    # light tan, the same on the head and the body so that the neck seam stays invisible
    tan = np.array([0.95, 0.89, 0.82], dtype=np.float32)
    head *= tan
    # fight shorts: the garment is the dark/blue part at the top of the leg pieces
    garment = close(not_skin(body) * smooth(0.25, 0.2, v), 10)
    body = fabric(body, garment, (0.06, 0.06, 0.065))
    body = np.where(garment[..., None] > 0.5, body, body * tan)
    save(head, 'm021_head_color.png')
    save(body, 'm021_body_color.png')
    for n in ('m021_head_normal.tga', 'm021_body_normal.tga'):
        shutil.copy(os.path.join(src, n), out)
else:
    head = load('f021_head_color.tga')
    body = load('f021_body_color.tga')
    # bikini -> black sportswear (pink/magenta: blue and red well above green)
    pink = smooth(0.08, 0.2, np.minimum(body[..., 0], body[..., 2]) - body[..., 1])
    pink = close(pink, 10)
    # hair: blond, yellower than the skin (green close to red, little blue), in the scalp area and the bun
    def hair_mask(a):
        r, g, b = a[..., 0], a[..., 1], a[..., 2]
        yellow = smooth(0.80, 0.9, g / np.maximum(r, 1e-3)) * smooth(0.25, 0.4, (r - b))
        face = ellipse(0.5, 0.36, 0.16, 0.2, 0.2)
        scalp = np.clip(smooth(0.36, 0.3, v) + (u > 0.74) * (v > 0.62), 0, 1) * (1 - face)
        return blur(np.clip(scalp * (0.8 + yellow), 0, 1), 3)
    hm = hair_mask(head)
    # skin: lighter European skin -> brown skin, the same transform on head and body
    target = np.array([0.45, 0.29, 0.2], dtype=np.float32)
    skin = ellipse(0.5, 0.42, 0.08, 0.06, 0.2)  # cheeks and nose: skin only
    mean = skin_stats(head, skin)
    def to_brown(a):
        return np.clip(a * (target / mean), 0, 1) ** np.array([1.05, 1.08, 1.1], dtype=np.float32)
    Lh = lum(head)
    black_hair = np.array([0.06, 0.045, 0.04], dtype=np.float32) * (0.5 + 1.6 * Lh)[..., None]
    head = to_brown(head) * (1 - hm[..., None]) + black_hair * hm[..., None]
    head = iris_to_brown(head)
    body = to_brown(body)
    body = fabric(body, pink, (0.055, 0.055, 0.06))
    save(head, 'f021_head_color.png')
    save(body, 'f021_body_color.png')
    for n in ('f021_head_normal.tga', 'f021_body_normal.tga'):
        shutil.copy(os.path.join(src, n), out)
print('ok', who, out)
