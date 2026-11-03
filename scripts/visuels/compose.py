"""Studio visuals: lays transparent renders of our 3D coaches (scripts/visuels/generate.mjs) in a dark gym made here,
in the ambiance of their discipline (ambiances.json): out-of-focus heavy bags and lamps, a cone of light, smoke,
bloom, colour grade, vignette and film grain. Nothing is downloaded: every pixel comes from our renders or from code.

Usage: python3 -I scripts/visuels/compose.py <jobs.json>
A job: {out, w, h, mood, seed, layers: [png...], centers: [x...], mode: floor|top, fill, top, blur, sizes, mini, full, marks}
- marks (1.3.2, schemas of the encyclopedia): zones, joints and labels drawn over the coach, at the bones the Lab
  reported for each layer (raw pixels of the capture), moved like the layer was
- layers share one crop (the union of their subjects), so the instants of a sequence keep their sizes and heights;
- mode floor: feet on the floor of the room; mode top: a close-up whose top starts at `top` (share of the height);
- sizes: the same picture at other sizes ([[w, h, file without extension]]); mini: square around layer i ({layer, size, suffix}).
The picture of a job depends only on its inputs and its seed: regenerating gives the same file.
"""
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

AMBIANCES = json.loads((Path(__file__).parent / 'ambiances.json').read_text())


def blur(arr, r):
    """gaussian blur of a 0-1 float map (through 8 bits: enough for soft light)"""
    im = Image.fromarray(np.clip(arr * 255, 0, 255).astype(np.uint8))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(r)), dtype=np.float32) / 255


def blur3(img, r):
    return np.stack([blur(img[..., k], r) for k in range(3)], axis=2)


def value_noise(rng, W, H, scale, octaves):
    out = np.zeros((H, W), np.float32)
    amp = 1.0
    for o in range(octaves):
        s = max(2, int(W / scale * 2 ** o))
        n = rng.random((max(2, int(s * H / W)), s)).astype(np.float32)
        im = Image.fromarray((n * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
        out += amp * np.asarray(im, np.float32) / 255
        amp *= 0.5
    return out / out.max()


def room(rng, W, H, amb, cx, floor_y):
    """the gym behind the coach: dark walls, light cone on the coach, bags and lamps out of focus, smoke"""
    base, haze, light = (np.array(amb[k], np.float32) for k in ('base', 'haze', 'light'))
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    u, v = xx / W, yy / H
    img = np.ones((H, W, 3), np.float32) * base
    img += base * 0.15 * np.clip(1 - v / floor_y, 0, 1)[..., None]
    cone = np.exp(-((u - cx - (v - 0.5) * 0.08) / (0.18 + 0.32 * v)) ** 2 * 2.2) * (0.35 + 0.65 * (1 - v))
    img += cone[..., None] * haze * 0.16
    side_x = 0.12 if cx > 0.4 else 0.88
    img += (np.exp(-((u - side_x) / (0.08 + 0.2 * v)) ** 2 * 3) * (1 - v) * 0.6)[..., None] * haze * 0.12
    # floor: a dull pool of the key light, darker towards the camera
    fl = np.clip((v - floor_y + 0.04) / (1.04 - floor_y), 0, 1) ** 1.5
    pool = np.exp(-((u - cx) / 0.28) ** 2 - ((v - floor_y - 0.06) / 0.08) ** 2)
    img += (pool * np.clip((v - floor_y) / 0.05 + 0.5, 0, 1))[..., None] * light * 0.1
    img *= (1 - 0.35 * fl)[..., None]
    # heavy bags hanging from chains, away from the coach, lit on the side facing the light
    bags = np.zeros((H, W), np.float32)
    edge = np.zeros((H, W), np.float32)
    for px in ([0.08, 0.27, 0.92] if cx > 0.5 else [0.1, 0.72, 0.9]):
        px += rng.uniform(-0.04, 0.04)
        if abs(px - cx) < 0.18:
            continue
        r = rng.uniform(0.035, 0.05) * (H / W) ** 0.5
        ry = r * W / H
        top = rng.uniform(0.1, 0.25)
        bot = top + rng.uniform(0.38, 0.5)
        inside = (np.abs(u - px) < r) & (v > top + ry) & (v < bot - ry)
        inside |= (((u - px) / r) ** 2 + ((v - top - ry) / ry) ** 2 < 1) | (((u - px) / r) ** 2 + ((v - bot + ry) / ry) ** 2 < 1)
        bags = np.maximum(bags, inside * 1.0)
        edge += inside * np.clip(((u - px) * np.sign(cx - px)) / r, 0, 1) ** 6
        bags = np.maximum(bags, ((np.abs(u - px) < 0.002) & (v < top)) * 0.8)
    img = img * (1 - 0.75 * blur(bags, W * 0.016)[..., None]) + blur(edge, W * 0.01)[..., None] * haze * 0.25
    # lamps of the ceiling and dust, out of focus
    glow = np.zeros((H, W), np.float32)
    for lx in rng.choice([0.05, 0.2, 0.36, 0.8, 0.95], size=2, replace=False):
        if abs(lx - cx) < 0.12:
            continue
        ly = rng.uniform(0.02, 0.09)
        d2 = ((u - lx) * W) ** 2 + ((v - ly) * H) ** 2
        glow += np.exp(-d2 / (2 * (W * 0.035) ** 2)) + 0.35 * np.exp(-d2 / (2 * (W * 0.12) ** 2))
    bok = np.zeros((H, W), np.float32)
    for _ in range(14):
        bx, by, br = rng.uniform(0, 1), rng.uniform(0.05, 0.7), rng.uniform(0.006, 0.018) * W
        bok += (((u - bx) * W) ** 2 + ((v - by) * H) ** 2 < br * br) * rng.uniform(0.05, 0.15)
    img += glow[..., None] * light * 0.35 + blur(np.clip(bok, 0, 1), max(1, W * 0.003))[..., None] * light * 0.6
    smoke = np.clip((blur(value_noise(rng, W, H, 5, 5), W * 0.02) - 0.35) * 1.8, 0, 1)
    img += (smoke * (0.25 + 0.75 * cone) * (1 - 0.5 * fl))[..., None] * haze * 0.18
    return img, cone, u, v


def subject_box(im):
    return im.getchannel('A').point(lambda p: 255 if p > 8 else 0).getbbox()


def compose(job):
    W, H = job['w'], job['h']
    amb = AMBIANCES[job['mood']]
    seed = int(hashlib.sha1(job['seed'].encode()).hexdigest()[:8], 16)
    rng = np.random.default_rng(seed)
    mode = job.get('mode', 'floor')
    layers = [Image.open(p).convert('RGBA') for p in job['layers']]
    centers = job.get('centers') or [0.5]
    box = None
    for im in layers:
        b = subject_box(im)
        if b:
            box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    if box is None:
        raise SystemExit(f'image vide: {job["layers"]}')
    floor_y = 1.3 if mode == 'top' else job.get('floor', 0.88)
    target_h = H * job.get('fill', 1.0) if mode == 'top' else H * (floor_y - 0.07) * job.get('fill', 1.0)
    sc = target_h / (box[3] - box[1])
    # a wide pose (sprawl, a kick seen from the side) or a sequence: shrink until it fits across the picture
    if mode != 'top':
        widest = max((subject_box(im)[2] - subject_box(im)[0]) for im in layers)
        sc = min(sc, W / len(layers) * 0.94 / widest)
    cx_main = centers[min(len(centers) - 1, job.get('lightOn', len(centers) - 1))]
    img, cone, u, v = room(rng, W, H, amb, cx_main, floor_y)
    light = np.array(amb['light'], np.float32)
    haze = np.array(amb['haze'], np.float32)
    placed = []
    geo = []
    for im, cx in zip(layers, centers):
        b = subject_box(im)
        # the shared crop keeps heights; horizontally each instant is centred on its own subject
        crop = im.crop((b[0], box[1], b[2], box[3]))
        cw, ch = max(1, round(crop.width * sc)), max(1, round(crop.height * sc))
        crop = crop.resize((cw, ch), Image.LANCZOS)
        px = round(cx * W - cw / 2)
        py = round(job.get('top', 0.06) * H) if mode == 'top' else round((floor_y + 0.015) * H - ch)
        layer = np.zeros((H, W, 4), np.float32)
        x0, y0, x1, y1 = max(0, px), max(0, py), min(W, px + cw), min(H, py + ch)
        c = np.asarray(crop, np.float32) / 255
        layer[y0:y1, x0:x1] = c[y0 - py:y1 - py, x0 - px:x1 - px]
        alpha, rgb = layer[..., 3:4], layer[..., :3]
        if mode != 'top':
            # contact shadow under the feet (the lowest point of this instant)
            sb = subject_box(im)
            foot_y = (py + (sb[3] - box[1]) * sc) / H
            sh = np.exp(-((u - cx) / (cw / W * 0.45)) ** 2 - ((v - foot_y - 0.004) / 0.012) ** 2)
            img *= (1 - 0.7 * sh * (abs(foot_y - floor_y - 0.015) < 0.03))[..., None]
        # the coach in the room: softened like a lens, light falling off towards the feet and the shadow side
        rgb = blur3(rgb, max(0.4, 0.7 * W / 1600))
        fall = np.clip(1 - (v - py / H) / max(1e-3, ch / H), 0, 1)
        side = np.clip(0.75 + 0.7 * (u - cx) * W / max(cw, 1), 0.6, 1.1)
        if job.get('full'):
            # a whole room filling the picture (the dojo): lit by its own lamps, no fall-off of a subject
            fall, side = np.ones_like(fall), np.ones_like(side)
        rgb = (rgb * (0.85 + 0.25 * light) * ((0.5 + 0.5 * fall ** 0.7) * side)[..., None]) ** 1.15
        wrap = np.clip(blur(alpha[..., 0], W * 0.006)[..., None] - alpha * 0.9, 0, 1)
        img = img * (1 - alpha) + rgb * alpha + wrap * blur3(img, W * 0.02) * 0.15
        placed.append((px, py, cw, ch))
        geo.append((b, sc, px, py))
    # badges (1.3.2): small pictures standing on the floor around the subject, half on each side (emblems)
    for k, path in enumerate(job.get('badges', [])):
        n = len(job['badges'])
        side, i = (-1, k) if k < (n + 1) // 2 else (1, k - (n + 1) // 2)
        bh = round(H * job.get('badgeH', 0.3))
        em = Image.open(path).convert('RGBA')
        em = em.crop(em.getchannel('A').getbbox())
        bw = round(em.width * bh / em.height)
        em = em.resize((bw, bh), Image.LANCZOS)
        cx = W / 2 + side * (0.19 + 0.105 * i) * W
        cy = floor_y * H - bh / 2 - (0.12 if i % 2 else 0.03) * H
        e = np.asarray(em, np.float32) / 255
        x0, y0 = round(cx - bw / 2), round(cy - bh / 2)
        a = e[..., 3:4] * 0.96
        img[y0:y0 + bh, x0:x0 + bw] = img[y0:y0 + bh, x0:x0 + bw] * (1 - a) + (e[..., :3] * (0.85 + 0.2 * light)) * a
    # smoke in front, bloom, grade (teal shadows, warm highlights, soft shoulder), vignette
    img += (np.clip((blur(value_noise(rng, W, H, 4, 4), W * 0.03) - 0.4) * 1.5, 0, 1) * 0.06 * (0.4 + cone))[..., None] * haze
    img += blur3(np.clip(img - 0.55, 0, 1), W * 0.025) * 0.6
    lum = img.mean(axis=2, keepdims=True)
    img = img + (1 - np.clip(lum * 3, 0, 1)) * np.array([-0.004, 0.006, 0.014]) + np.clip(lum - 0.4, 0, 1) * np.array([0.04, 0.015, -0.02])
    img = img / (1 + img * 0.35) * 1.4
    lum = img.mean(axis=2, keepdims=True)
    img = lum + (img - lum) * 0.85
    img *= np.clip(1 - 0.55 * (((u - 0.5) / 0.75) ** 2 + ((v - 0.48) / 0.8) ** 2), 0.3, 1)[..., None]
    out = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8))
    if job.get('blur'):
        out = out.filter(ImageFilter.GaussianBlur(job['blur'] * W / 1000))
    if job.get('marks'):
        out = draw_marks(out, job['marks'], geo, W, H)
    # film grain, stronger in the shadows
    g = rng.normal(0, 1, (H, W)).astype(np.float32)
    g = np.asarray(Image.fromarray(np.clip(g * 40 + 128, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6)), np.float32) / 255 - 0.5
    arr = np.asarray(out, np.float32) / 255
    arr += g[..., None] * (0.07 * (1 - arr.mean(axis=2, keepdims=True)) + 0.02) * job.get('grain', 1.0)
    out = Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8))
    dst = Path(job['out'])
    dst.parent.mkdir(parents=True, exist_ok=True)
    q = job.get('quality', 80)
    out.save(f'{dst}.webp', 'WEBP', quality=q, method=6)
    for w, h, other in job.get('sizes', []):
        out.resize((w, h), Image.LANCZOS).save(f'{other}.webp', 'WEBP', quality=q, method=6)
    if job.get('mini'):
        m = job['mini']
        px, py, cw, ch = placed[m.get('layer', len(placed) - 1)]
        side = min(max(cw, ch) * 1.08, W, H)
        # the square stays inside the picture (no black band at the edge)
        cxp = min(max(px + cw / 2, side / 2), W - side / 2)
        cyp = min(max(py + ch / 2, side / 2), H - side / 2)
        sq = out.crop((round(cxp - side / 2), round(cyp - side / 2), round(cxp + side / 2), round(cyp + side / 2)))
        sq.resize((m['size'], m['size']), Image.LANCZOS).save(f'{dst}{m.get("suffix", "-mini")}.webp', 'WEBP', quality=q, method=6)


FONT = '/usr/share/fonts/opentype/inter/Inter-SemiBold.otf'
RED = (235, 64, 64)


def draw_marks(out, marks, geo, W, H):
    """zones (soft red discs), joints (rings), twist arrows (arcs) and their labels, over the composed picture. The
    labels of one side stand in a column beside the coach, spread so that they never overlap"""
    import math
    base = out.convert('RGBA')
    glow = Image.new('RGBA', base.size, (0, 0, 0, 0))
    over = Image.new('RGBA', base.size, (0, 0, 0, 0))
    g, d = ImageDraw.Draw(glow), ImageDraw.Draw(over)
    try:
        font = ImageFont.truetype(FONT, max(12, round(W / 46)))
    except OSError:
        font = ImageFont.load_default()
    th = font.size
    pts = []
    for m in marks:
        b, sc, px, py = geo[m.get('layer', 0)]
        fh = b[3] - b[1]
        x = px + (m['x'] + m.get('dxH', 0) * fh - b[0]) * sc
        y = py + (m['y'] + m.get('dyH', 0) * fh - b[1]) * sc
        r = m.get('r', 0.035) * H
        pts.append((m, x, y, r))
        kind = m.get('kind', 'zone')
        if kind == 'zone':
            g.ellipse((x - r * 1.6, y - r * 1.6, x + r * 1.6, y + r * 1.6), fill=(*RED, 90))
            d.ellipse((x - r, y - r, x + r, y + r), fill=(*RED, 110), outline=(255, 120, 110, 235), width=2)
        elif kind == 'arc':
            # a curved arrow around the joint: the direction it must not be forced in
            d.arc((x - r, y - r, x + r, y + r), 200, 470, fill=(255, 110, 90, 240), width=3)
            a = math.radians(470)
            ex, ey = x + r * math.cos(a), y + r * math.sin(a)
            t = a + math.pi / 2
            for s_ in (-1, 1):
                d.line((ex, ey, ex - 9 * math.cos(t) + s_ * 6 * math.cos(a), ey - 9 * math.sin(t) + s_ * 6 * math.sin(a)), fill=(255, 110, 90, 240), width=3)
        else:
            d.ellipse((x - 5, y - 5, x + 5, y + 5), fill=(255, 255, 255, 235), outline=(*RED, 255), width=2)
    for side in (-1, 1):
        col = [(m, x, y, r) for m, x, y, r in pts if m.get('label') and (-1 if m.get('side', 'r') == 'l' else 1) == side]
        if not col:
            continue
        col.sort(key=lambda p: p[2])
        # one column per side, just beyond the farthest mark of that side
        edge = (max(x + r for _, x, _, r in col) if side > 0 else min(x - r for _, x, _, r in col))
        cx = edge + side * 0.05 * W
        ys, gap = [], th * 1.9
        for _, _, y, _ in col:
            ys.append(max(y, ys[-1] + gap) if ys else y)
        over_h = ys[-1] - (H - th)
        if over_h > 0:
            ys = [v - over_h for v in ys]
        for (m, x, y, r), ty in zip(col, ys):
            tw = d.textlength(m['label'], font=font)
            lx = min(max(cx, 8 + tw + 10), W - 8 - tw - 10) if True else cx
            kind = m.get('kind', 'zone')
            start = x + side * (r if kind != 'point' else 6)
            d.line((start, y, lx - side * 6, ty), fill=(255, 255, 255, 170), width=1)
            tx = lx - tw if side < 0 else lx
            d.rounded_rectangle((tx - 5, ty - th * 0.75, tx + tw + 5, ty + th * 0.75), radius=4, fill=(12, 12, 16, 170))
            d.text((tx, ty), m['label'], font=font, fill=(255, 255, 255, 245), anchor='lm')
    glow = glow.filter(ImageFilter.GaussianBlur(W / 90))
    return Image.alpha_composite(Image.alpha_composite(base, glow), over).convert('RGB')


def main():
    jobs = json.loads(Path(sys.argv[1]).read_text())
    for i, job in enumerate(jobs):
        compose(job)
        print(f'[{i + 1}/{len(jobs)}] {job["out"]}', flush=True)


if __name__ == '__main__':
    main()
