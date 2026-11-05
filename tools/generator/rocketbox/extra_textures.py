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


def _box(a, r, axis):
    # running mean over 2r+1 pixels (edges clamped)
    pad = [(0, 0)] * a.ndim
    pad[axis] = (r + 1, r)
    c = np.cumsum(np.pad(a, pad, mode='edge'), axis=axis, dtype=np.float64)
    n = a.shape[axis]
    hi = np.take(c, np.arange(2 * r + 1, 2 * r + 1 + n), axis=axis)
    lo = np.take(c, np.arange(0, n), axis=axis)
    return ((hi - lo) / (2 * r + 1)).astype(np.float32)


def blur(a, r):
    """Gaussian-like blur of a float image (three box passes), full float precision: an 8-bit blur loses the faint
    far edge of a colour spread outwards (bleed, below)"""
    a = np.asarray(a, dtype=np.float32)
    b = max(1, int(round(r * 0.8)))
    for _ in range(3):
        a = _box(_box(a, b, 0), b, 1)
    return a


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

def bleed(a, px=32, known=None):
    """1.12 (Youssef's photo of Inaya from above, 04/11: black shreds at the neck and the shoulders): the baked
    texture stopped exactly at the edge of each UV island, black beyond. On a phone the smaller mip levels mix that
    black into the skin along every seam. The colour of each island is spread outwards by px pixels (the original
    Rocketbox textures have such a margin)"""
    known = (a.sum(-1) > 0).astype(np.float32) if known is None else known.astype(np.float32)
    out = a.copy()
    k = known.copy()
    acc = a * known[..., None]
    r = 1
    while r <= px:
        num = np.stack([blur(acc[..., c], r) for c in range(a.shape[-1])], -1)
        den = blur(k, r)
        fill = (k < 0.5) & (den > 1e-3)
        out[fill] = num[fill] / den[fill][:, None]
        k = np.maximum(k, fill.astype(np.float32))
        acc = out * k[..., None]
        r *= 2
    return out



def upper_mask(shape, above, v_min=0.0, v_max=1.0):
    """texture pixels of the body triangles above `above` metres (glTF y) whose UV centre lies between v_min and v_max,
    from a shipped model with the same UVs (Amara's photo body: same sports avatar, same UV layout)"""
    import json, struct
    from PIL import ImageDraw
    path = os.environ.get('UV_GLB', os.path.join(os.path.dirname(__file__), '../../../public/coaches/mma-amara/photo.glb'))
    raw = open(path, 'rb').read()
    jl = struct.unpack('<I', raw[12:16])[0]
    J = json.loads(raw[20:20 + jl])
    b0 = 20 + jl + 8

    def acc(i, dt, n):
        a = J['accessors'][i]
        v = J['bufferViews'][a['bufferView']]
        return np.frombuffer(raw, dtype=dt, count=a['count'] * n, offset=b0 + v.get('byteOffset', 0) + a.get('byteOffset', 0)).reshape(-1, n)
    pr = next(p for m in J['meshes'] for p in m['primitives'] if 'body' in J['materials'][p['material']]['name'])
    P = acc(pr['attributes']['POSITION'], '<f4', 3)
    T = acc(pr['attributes']['TEXCOORD_0'], '<f4', 2)
    ia = J['accessors'][pr['indices']]
    I = acc(pr['indices'], '<u4' if ia['componentType'] == 5125 else '<u2', 1).reshape(-1, 3)
    H, W = shape
    im = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(im)
    for t in I:
        if P[t, 1].mean() > above and v_min <= T[t, 1].mean() <= v_max:
            d.polygon([(float(T[k, 0] * W), float(T[k, 1] * H)) for k in t], fill=255)
    return np.asarray(im, dtype=np.float32) / 255


def halter_skin(body, head):
    """the body texture with the bikini's UV islands painted with the colour of the skin around them, and their mask"""
    import json, struct
    from collections import defaultdict
    path = os.environ.get('HEAD_UV_GLB', os.path.join(os.path.dirname(__file__), '../../../public/coaches/inaya/photo.glb'))
    raw = open(path, 'rb').read()
    jl = struct.unpack('<I', raw[12:16])[0]
    J = json.loads(raw[20:20 + jl])
    b0 = 20 + jl + 8

    def acc(i, dt, n):
        a = J['accessors'][i]
        v = J['bufferViews'][a['bufferView']]
        return np.frombuffer(raw, dtype=dt, count=a['count'] * n, offset=b0 + v.get('byteOffset', 0) + a.get('byteOffset', 0)).reshape(-1, n)

    def prim(key):
        pr = next(p for m in J['meshes'] for p in m['primitives'] if J['materials'][p['material']]['name'].endswith(key))
        ia = J['accessors'][pr['indices']]
        return (acc(pr['attributes']['POSITION'], '<f4', 3), acc(pr['attributes']['TEXCOORD_0'], '<f4', 2),
                acc(pr['indices'], '<u4' if ia['componentType'] == 5125 else '<u2', 1).reshape(-1, 3).astype(int))

    Pb, Tb, Fb = prim('_body')
    Ph, Th, Fh = prim('_head')
    # the bikini pieces: body islands (connected by their indices) at the bottom middle of the texture, above the
    # waist, and the small pieces welded to them (same rule as flatten_halter.py)
    par = np.arange(len(Pb))

    def f(x):
        while par[x] != x:
            par[x] = par[par[x]]
            x = par[x]
        return x

    for a, b, c in Fb:
        r = f(a)
        par[f(b)] = r
        par[f(c)] = r
    lab = np.array([f(i) for i in range(len(Pb))])
    comps = {c: np.where(lab == c)[0] for c in np.unique(lab)}
    bik = {c for c, ix in comps.items() if Tb[ix, 1].min() > 0.78 and Pb[ix, 1].min() > 1.15}
    key = lambda v: (round(float(v[0]), 4), round(float(v[1]), 4), round(float(v[2]), 4))
    gid = {}
    gb = np.array([gid.setdefault(key(v), len(gid)) for v in Pb])
    gh = np.array([gid.setdefault(key(v), len(gid)) for v in Ph])
    for c, ix in comps.items():
        if c not in bik and len(ix) <= 60 and Pb[ix, 1].min() >= 1.15 and any(set(gb[ix]) & set(gb[comps[b]]) for b in bik):
            bik.add(c)
    inb = np.isin(lab, list(bik))
    n = len(gid)
    # colour of each point from the skin textures (slightly blurred); a point belongs to the bikini when no skin
    # point lies at its place
    sb, sh = blur(body, 3), blur(head, 3)

    def sample(img, T):
        H, W = img.shape[:2]
        return img[np.clip((T[:, 1] * H).astype(int), 0, H - 1), np.clip((T[:, 0] * W).astype(int), 0, W - 1)]

    col = np.zeros((n, body.shape[-1]))
    cnt = np.zeros(n)
    skinb = ~inb
    np.add.at(col, gb[skinb], sample(sb, Tb[skinb]))
    np.add.at(cnt, gb[skinb], 1)
    np.add.at(col, gh, sample(sh, Th))
    np.add.at(cnt, gh, 1)
    known = cnt > 0
    col[known] /= cnt[known][:, None]
    nb = defaultdict(set)
    for F, g in ((Fb, gb), (Fh, gh)):
        G = g[F]
        for a, b in ((0, 1), (1, 2), (2, 0)):
            for x, y in zip(G[:, a], G[:, b]):
                nb[x].add(y)
                nb[y].add(x)
    # the skin just around the bikini holds the photo's shadow of its edges (a dark line under the back band):
    # two rings of body skin are repainted with it, from the skin beyond
    region = set(gb[inb])
    ring = set(region)
    for _ in range(int(os.environ.get('HALTER_RINGS', '2'))):
        ring = {y for x in ring for y in nb[x]} - region
        region |= ring
    # the head's skin welded to the neck strap holds its shadow too (a line round the base of the neck): its two
    # rings are repainted the same way, on the head texture
    free = sorted(region)
    known = cnt > 0
    known[free] = False
    col[free] = col[known].mean(0)
    nbl = {g: np.array(sorted(nb[g] - {g})) for g in free}
    for _ in range(600):
        new = {g: col[nbl[g]].mean(0) for g in free}
        for g, c in new.items():
            col[g] = c

    def paint(img, T, F, g):
        """the triangles of the region painted with the colours of their points (barycentric), a little skin grain,
        a margin around them, and their mask"""
        H, W = img.shape[:2]
        out = img.copy()
        mask = np.zeros((H, W), np.float32)
        inr = np.isin(g, free)
        for t in F[inr[F].all(1)]:
            uv = T[t] * [W, H]
            c = col[g[t]]
            x0, y0 = np.floor(uv.min(0)).astype(int) - 1
            x1, y1 = np.ceil(uv.max(0)).astype(int) + 1
            x0, y0, x1, y1 = max(x0, 0), max(y0, 0), min(x1, W - 1), min(y1, H - 1)
            if x1 < x0 or y1 < y0:
                continue
            yy, xx = np.mgrid[y0:y1 + 1, x0:x1 + 1]
            p = np.stack([xx + 0.5, yy + 0.5], -1)
            a, b, cc = uv
            m = np.array([b - a, cc - a]).T
            if abs(np.linalg.det(m)) < 1e-9:
                continue
            l = np.linalg.solve(m, (p - a).reshape(-1, 2).T).T.reshape(p.shape)
            w = np.stack([1 - l[..., 0] - l[..., 1], l[..., 0], l[..., 1]], -1)
            ins = (w >= -0.02).all(-1)
            out[yy[ins], xx[ins]] = (w[ins] @ c).astype(np.float32)
            mask[yy[ins], xx[ins]] = 1
        grain = 1 + 0.035 * (blur(rng.random((H, W), dtype=np.float32), 1) - 0.5) * 4
        out[..., :3] = out[..., :3] * np.where(mask[..., None] > 0, grain[..., None], 1)
        # the margin around each island (sampled at the seams and by the mip levels) takes the same colours
        out = bleed(np.where(mask[..., None] > 0, out, 0), px=16, known=mask)
        grown = np.clip(blur((blur(mask, 3) > 0.01).astype(np.float32), 1.5) * 2, 0, 1)
        return img * (1 - grown[..., None]) + out * grown[..., None], grown

    nb_, gb_ = paint(body, Tb, Fb, gb)
    nh_, gh_ = paint(head, Th, Fh, gh)
    print('bikini repeint :', len(bik), 'pièces,', int(inb.sum()), 'points,', len(free), 'interpolés (corps et cou)')
    return nb_, gb_, nh_, gh_


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
    # 1.12 (Youssef's photo, 04/11, black shreds at the neck and the shoulders): the sports body's halter bikini top
    # is a part of the body mesh itself (its own UV island, bottom middle of the texture), its straps run up to the
    # neck, outside every 3D bra of the outfits. That island takes the chest's skin colour (its own folds kept, softer),
    # so a strap no longer shows; every outfit has its own 3D top over the chest
    # 1.15 (Youssef 04/11 12:07 « on dirait qu'il est emboîté, il y a des traces »): one skin tone over the whole
    # island still drew the bikini's outline, a step of colour along every edge (back band, straps, cups). The
    # island now takes the colour of the skin around it: the colours at its edge (body and head skin welded to it)
    # are spread over its points (harmonic interpolation on the mesh), then painted on its triangles
    # the normal map too: flat over the island (1.12) it lit the old band as a light strip on the curved back; it now
    # takes the relief of the skin around, interpolated the same way
    nmb = np.asarray(Image.open(os.path.join(basetex, 'f021_body_normal.tga')).convert('RGB'), dtype=np.float32) / 255
    nmh = np.asarray(Image.open(os.path.join(basetex, 'f021_head_normal.tga')).convert('RGB'), dtype=np.float32) / 255
    if os.environ.get('HALTER_SKIN', '1') == '0':
        # 1.19: the bikini top is removed from the low-poly body (clean_torso.py) and its islands repainted from the
        # skin around by skin_paint.py, after this script: nothing to do here
        both, bothh = np.concatenate([body, nmb], -1), np.concatenate([head, nmh], -1)
        grown, grownh = np.zeros(body.shape[:2], np.float32), np.zeros(head.shape[:2], np.float32)
    else:
        both, grown, bothh, grownh = halter_skin(np.concatenate([body, nmb], -1), np.concatenate([head, nmh], -1))
    body, halter_normal = both[..., :3], both[..., 3:]
    head, halter_head_normal = bothh[..., :3], bothh[..., 3:]
    pink = pink * (1 - grown)
    body = fabric(body, pink, (0.055, 0.055, 0.06))


if who == 'inaya':
    # 1.12: the bun is the sports body's (its geometry), but the head texture is the donor's: on the bun's UV islands
    # (bottom right) the donor's atlas holds unrelated pieces (bits of face, light skin), hence a patchy bun and a
    # light square at the nape. Those islands are found from the shipped model's head (triangles behind the head,
    # above 1.5 m, nape included) and filled with strands from the donor's own hair (crop from the top of the head, tiled),
    # shaded darker towards each island's edge so the bun keeps its volume
    import json, struct
    from PIL import ImageDraw
    path = os.environ.get('HEAD_UV_GLB', os.path.join(os.path.dirname(__file__), '../../../public/coaches/inaya/photo.glb'))
    raw = open(path, 'rb').read()
    jl = struct.unpack('<I', raw[12:16])[0]
    J = json.loads(raw[20:20 + jl])
    b0 = 20 + jl + 8

    def gacc(i, dt, n):
        a = J['accessors'][i]
        v = J['bufferViews'][a['bufferView']]
        return np.frombuffer(raw, dtype=dt, count=a['count'] * n, offset=b0 + v.get('byteOffset', 0) + a.get('byteOffset', 0)).reshape(-1, n)
    pr = next(p for m in J['meshes'] for p in m['primitives'] if 'head' in J['materials'][p['material']]['name'])
    P = gacc(pr['attributes']['POSITION'], '<f4', 3)
    T = gacc(pr['attributes']['TEXCOORD_0'], '<f4', 2)
    ia = J['accessors'][pr['indices']]
    I = gacc(pr['indices'], '<u4' if ia['componentType'] == 5125 else '<u2', 1).reshape(-1, 3)
    HH, HW = head.shape[:2]
    im = Image.new('L', (HW, HH), 0)
    d = ImageDraw.Draw(im)
    for t in I:
        c = P[t].mean(0)
        u = T[t].mean(0)
        if c[1] > float(os.environ.get("BUN_Y", "1.5")) and c[2] < -0.08 and u[0] > 0.5 and u[1] > 0.62:
            d.polygon([(float(T[k, 0] * HW), float(T[k, 1] * HH)) for k in t], fill=255)
    bun = np.asarray(im, dtype=np.float32) / 255
    hv, hu = np.mgrid[0:HH, 0:HW].astype(np.float32)
    hv /= HH
    hu /= HW
    crown = head[(hv < 0.35) & (hu > 0.1) & (hu < 0.9)]
    blond = crown[lum(crown) > np.percentile(lum(crown), 60)].mean(0)
    y0, y1, x0, x1 = int(0.05 * HH), int(0.25 * HH), int(0.12 * HW), int(0.38 * HW)
    patch = head[y0:y1, x0:x1]
    patch = np.concatenate([patch, patch[::-1]], 0)  # mirrored tiles: no seam line
    patch = np.concatenate([patch, patch[:, ::-1]], 1)
    reps = (HH // patch.shape[0] + 1, HW // patch.shape[1] + 1, 1)
    strands = np.tile(patch, reps)[:HH, :HW]
    # distance to the island's edge, through repeated blurs: 0 at the edge, 1 inside
    depth = np.clip(blur(bun, 24) * 2 - 1, 0, 1) * bun
    strands = strands * (0.62 + 0.38 * depth)[..., None]
    m = np.clip(blur(bun, 1.5) * 1.5, 0, 1)
    head = head * (1 - m[..., None]) + strands * m[..., None]
    # the nape under the bun: the sports head keeps its hair down to about 1.5 m there, the donor's texture is bare
    # skin (a light square under the bun). Same strands behind the head above 1.5 m, faded in over 3 cm
    im = Image.new('L', (HW, HH), 0)
    d = ImageDraw.Draw(im)
    for t in I:
        c = P[t].mean(0)
        if c[2] < -0.06 and 1.48 < c[1] < 1.6 and abs(c[0]) < 0.055 and not (T[t, 0].mean() > 0.5 and T[t, 1].mean() > 0.62):
            d.polygon([(float(T[k, 0] * HW), float(T[k, 1] * HH)) for k in t], fill=int(255 * min(1.0, (c[1] - 1.48) / 0.03)))
    nape = blur(np.asarray(im, dtype=np.float32) / 255, 3)
    # only where that texture is bare skin (closer to the neck's skin than to the blonde): the hair already there stays
    skin_ref = np.median(head[(hv > 0.5) & (hv < 0.6) & (hu > 0.4) & (hu < 0.6)], 0)
    dh = np.linalg.norm(head - blond, axis=-1)
    ds = np.linalg.norm(head - skin_ref, axis=-1)
    bare = np.clip((dh - ds) / 0.08 + 0.5, 0, 1)
    nm_ = blur(nape * bare, 2)[..., None]
    raw_strands = np.tile(patch, reps)[:HH, :HW]
    sel_ = nm_[..., 0] > 0.3
    if sel_.any():
        raw_strands = raw_strands * (0.9 * blond / np.maximum(raw_strands[sel_].mean(0), 1e-3))
    head = head * (1 - nm_) + raw_strands * nm_
    # 1.14 (« zone claire et ligne sur la nuque, sous le chignon », picked on the model: 1.60 m, texture u 0.01-0.03 and
    # 0.97-0.99, v 0.23): the two edges of the head's atlas where its halves meet behind the head hold a strip of the
    # donor's skin (next to its ear), about 5 % of the width. On the sports head that strip is the hair right under
    # the bun: a light square split down the middle by the seam. Filled with the hair beside it, mirrored across the
    # strip's inner edge, so both halves meet on the same strands
    sx = int(0.055 * HW)
    r0, r1 = int(0.18 * HH), int(0.31 * HH)
    # a fixed rectangle (the strip is the same on every build: the sports head's UV layout), feathered at its ends
    rows = np.ones(r1 - r0, dtype=np.float32)
    f_ = int(0.01 * HH)
    rows[:f_] = np.linspace(0, 1, f_)
    rows[-f_:] = np.linspace(1, 0, f_)
    sk = rows[:, None, None]
    for left in (True, False):
        band = head[r0:r1, :sx] if left else head[r0:r1, HW - sx:]
        src = (head[r0:r1, sx:2 * sx] if left else head[r0:r1, HW - 2 * sx:HW - sx])[:, ::-1].copy()
        band[:] = band * (1 - sk) + src * sk
    # 1.15 (Youssef 04/11 12:07 « il y a des traces »; picked on the model: nape 1.50 to 1.56 m = head atlas edges,
    # v 0.32 to 0.53): lower on the same edges the donor's atlas holds pieces of its face (the bridge of the nose, the
    # philtrum and the lips). Under the hairline they drew a light « I » across the strands (v 0.37 to 0.44) and a
    # light patch with faint features on the nape (v 0.445 to 0.54). The skin of the nape: its own colour blurred (no
    # features left), brought to the tone of the neck's skin below it
    r0, r1, sx = int(0.44 * HH), int(0.545 * HH), int(0.085 * HW)
    neck = body[(grown > 0.5) & (v > 0.80) & (v < 0.83)]
    for left in (True, False):
        cols = slice(0, sx) if left else slice(HW - sx, HW)
        zone = head[r0:r1, cols].copy()
        soft = blur(zone, 30)
        if len(neck):
            soft = soft * (np.median(neck, 0) / np.maximum(np.median(soft.reshape(-1, 3), 0), 1e-3))
        soft = soft * (1 + 0.03 * (blur(rng.random(soft.shape[:2], dtype=np.float32), 1) - 0.5) * 4)[..., None]
        h_, w_ = zone.shape[:2]
        fy = np.clip(np.minimum(np.arange(h_), h_ - 1 - np.arange(h_)) / (0.012 * HH), 0, 1)
        xr = np.arange(w_) if not left else (w_ - 1 - np.arange(w_))
        fx = np.clip(xr / (0.012 * HW), 0, 1)  # feathered on the inner side only (the seam side stays filled)
        k = (fy[:, None] * fx[None, :])[..., None]
        head[r0:r1, cols] = zone * (1 - k) + soft * k
    # the strands of the nape (from the bun down to the hairline, 1.535 m) are redrawn as one piece: the donor's
    # atlas there is a patchwork (a light chevron, a dark star where its pieces meet, the « I »). Same strands as the
    # bun, tinted to her blonde, mirrored across the seam so both halves meet on the same strands; the hairline is
    # faded over 1.5 cm
    im = Image.new('L', (HW, HH), 0)
    d = ImageDraw.Draw(im)
    for t in I:
        c = P[t].mean(0)
        if c[2] < -0.05 and 1.52 < c[1] < 1.63 and abs(c[0]) < 0.075 and not (T[t, 0].mean() > 0.5 and T[t, 1].mean() > 0.62):
            d.polygon([(float(T[k, 0] * HW), float(T[k, 1] * HH)) for k in t], fill=int(255 * np.clip((c[1] - 1.528) / 0.015, 0, 1)))
    hairm = blur(np.asarray(im, dtype=np.float32) / 255, 3)
    sym = raw_strands.copy()
    sym[:, HW // 2:] = raw_strands[:, :HW - HW // 2][:, ::-1]
    sym = sym * (0.95 * blond / np.maximum(sym[hairm > 0.5].mean(0), 1e-3)) if (hairm > 0.5).any() else sym
    head = head * (1 - hairm[..., None]) + sym * hairm[..., None]
head = bleed(head)
body = bleed(body)
save(head, f'{pre}_head_color.png')
save(body, f'{pre}_body_color.png')
for n in (f'{pre}_head_normal.tga', f'{pre}_body_normal.tga'):
    shutil.copy(os.path.join(basetex, n), out)
if who == 'inaya':
    # 1.12: the normal map still carried the halter's relief (raised strap edges, cup seams): on screen, thin white
    # highlight lines along the old straps at the neck and the shoulders. Flat normal (0.5, 0.5, 1) over that island
    nm = Image.open(os.path.join(basetex, f'{pre}_body_normal.tga')).convert('RGB')
    g = np.asarray(Image.fromarray((grown * 255).astype(np.uint8)).resize(nm.size, Image.BILINEAR), dtype=np.float32)[..., None] / 255
    a = np.asarray(nm, dtype=np.float32)
    a = a * (1 - g) + halter_normal * 255 * g
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(os.path.join(out, f'{pre}_body_normal.tga'))
    a = np.asarray(Image.open(os.path.join(basetex, f'{pre}_head_normal.tga')).convert('RGB'), dtype=np.float32)
    g = grownh[..., None]
    a = a * (1 - g) + halter_head_normal * 255 * g
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(os.path.join(out, f'{pre}_head_normal.tga'))
for p in glob.glob(os.path.join(donortex, '*_opacity_color.tga')):
    shutil.copy(p, os.path.join(out, 'Hair_opacity_color.tga'))  # face_transfer.py renames the material
print('ok', who, out, sorted(os.listdir(out)))
