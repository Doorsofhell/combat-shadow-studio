"""1.19 (Inaya rebuilt, Youssef 05/11 « je ne veux pas de jointure entre la tête et le reste du corps »): repaints the
skin where the bikini top was drawn (removed from the shape by clean_torso.py) and the lower neck, in the textures
convert.py reads (in place).

  python3 tools/generator/rocketbox/skin_paint.py clean.blend texdir

Verified finding (05/11, Youssef's 9 phone captures of 1.18): light patches and zigzag lines on the shoulders and the
upper back. They are the edges of the 1.12/1.15 repaint: the islands took one colour per point, smooth and without the
photo's grain, so they read lighter and flatter than the skin around them, and their border drew a line. First pass of
1.19 (05/11 07:30): thin dark lines left along the bikini's outline (the texture between the islands stayed black and
the GPU's filtering reads it at their border) and a light band on the nape (the halter strap is also drawn on the
head's texture, under the neck).

Method:
- unknown surface: the bikini top's triangles of the body (same rule as clean_torso.py) and the head's triangles below
  NECK_HEAD cm (lower neck, where the strap is drawn); plus the skin within RING cm of it (the photo's shadow of the
  bikini's edges);
- one colour per point of the mesh: the known points take the mean of the known texels around them (both textures,
  so a point on the head / body seam has ONE colour), the unknown ones are solved smooth between them (Laplace on the
  mesh's edges), so the colour is continuous across every UV seam, the neck included;
- each unknown texel takes the colour of its triangle (barycentric), plus the grain of the skin (high frequencies of
  the cleanest patch of the body's photo, tiled at the same size in cm on the head);
- soft edge of 3 px; the texels outside the islands (padding: the GPU's mipmaps read them, the phone shows the coach
  small, at a reduced mip level) take the colour of the nearest texel of an island;
- normal maps: flat over the unknown texels (the surface is smooth there now), blended at their edge.
"""
import bpy, bmesh, sys, os
import numpy as np
from PIL import Image
from scipy.spatial import cKDTree
from scipy.ndimage import gaussian_filter, distance_transform_edt
from scipy.sparse import lil_matrix
from scipy.sparse.linalg import spsolve

src, texdir = sys.argv[-2], sys.argv[-1]
RING = float(os.environ.get('RING', '1.5'))  # cm
NECK_HEAD = float(os.environ.get('NECK_HEAD', '147'))  # cm
PAD = int(os.environ.get('PAD', '4096'))  # px: every texel outside the islands (the GPU's mipmaps read far around them)

bpy.ops.wm.open_mainfile(filepath=src)
me = [o for o in bpy.data.objects if o.type == 'MESH' and len(o.data.vertices) > 500][0]
mats = [m.name for m in me.data.materials]
bm = bmesh.new()
bm.from_mesh(me.data)
bmesh.ops.triangulate(bm, faces=bm.faces[:])
bm.verts.ensure_lookup_table()
uvl = bm.loops.layers.uv.active
NV = len(bm.verts)
VP = np.array([tuple(v.co) for v in bm.verts])


def is_bik(P, T):
    # same rule as clean_torso.py: Blender v < 0.22 on the body, above the waist (115 cm)
    return T[:, 1].max() < 0.22 and P[:, 2].min() > 115


tris = []  # (material key, P, T (blender uv), vertex ids, unknown)
for f in bm.faces:
    m = mats[f.material_index]
    key = 'body' if m.endswith('body') else 'head' if m.endswith('head') else None
    if key is None:
        continue
    P = np.array([tuple(l.vert.co) for l in f.loops])
    T = np.array([tuple(l[uvl].uv) for l in f.loops])
    I = [l.vert.index for l in f.loops]
    unk = is_bik(P, T) if key == 'body' else P[:, 2].max() < NECK_HEAD
    tris.append((key, P, T, I, unk))


def load(name, mode='RGB'):
    return np.asarray(Image.open(os.path.join(texdir, name)).convert(mode), dtype=np.float32) / 255


def save(a, name):
    Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8)).save(os.path.join(texdir, name))


# nipples stored by clean_torso.py (cm, same space as the points)
_nip = next((list(o_.data.get('css_nipples', [])) for o_ in bpy.data.objects if o_.type == 'MESH' and o_.data.get('css_nipples')), [])
NIP = np.array(_nip).reshape(-1, 3) if _nip else None
AREOLA_R = float(os.environ.get('AREOLA_R', '1.9'))  # cm
TEX = {k: load(f'f021_{k}_color.png') for k in ('body', 'head')}
H, W = TEX['body'].shape[:2]


def raster(key):
    """for each texel covered by the material: 3D position, triangle's 3 points and barycentric weights, unknown flag"""
    pos = np.full((H, W, 3), np.nan, np.float32)
    vid = np.full((H, W, 3), -1, np.int32)
    bw = np.zeros((H, W, 3), np.float32)
    flag = np.zeros((H, W), np.uint8)  # 1 known face, 2 unknown face
    area_uv = area_3d = 0.0
    for k, P, T0, I, unk in tris:
        if k != key:
            continue
        T = T0 * [W, H]
        T[:, 1] = H - T[:, 1]  # image rows go down
        e1, e2 = T[1] - T[0], T[2] - T[0]
        area_uv += abs(e1[0] * e2[1] - e1[1] * e2[0]) / 2
        area_3d += np.linalg.norm(np.cross(P[1] - P[0], P[2] - P[0])) / 2
        x0, y0 = np.floor(T.min(0)).astype(int)
        x1, y1 = np.ceil(T.max(0)).astype(int)
        x0, y0, x1, y1 = max(x0, 0), max(y0, 0), min(x1, W - 1), min(y1, H - 1)
        if x1 < x0 or y1 < y0:
            continue
        a, b, c = T
        M = np.array([b - a, c - a]).T
        if abs(np.linalg.det(M)) < 1e-9:
            continue
        yy, xx = np.mgrid[y0:y1 + 1, x0:x1 + 1]
        p = np.stack([xx + 0.5, yy + 0.5], -1).reshape(-1, 2)
        l = np.linalg.solve(M, (p - a).T).T
        w = np.stack([1 - l[:, 0] - l[:, 1], l[:, 0], l[:, 1]], -1)
        ins = (w >= -0.01).all(-1)
        ys, xs = yy.ravel()[ins], xx.ravel()[ins]
        wi = np.clip(w[ins], 0, None)
        wi /= wi.sum(1, keepdims=True)
        pos[ys, xs] = wi @ P
        vid[ys, xs] = I
        bw[ys, xs] = wi
        flag[ys, xs] = 2 if unk else 1
    return dict(pos=pos, vid=vid, bw=bw, flag=flag, dens=np.sqrt(area_uv / max(area_3d, 1e-9)))


R = {k: raster(k) for k in TEX}
# unknown texels: unknown faces + known skin within RING cm (3D) of them
up = np.concatenate([R[k]['pos'][R[k]['flag'] == 2] for k in R])
tu = cKDTree(up[::3])
for k, r in R.items():
    kn = r['flag'] == 1
    d, _ = tu.query(r['pos'][kn], k=1, distance_upper_bound=RING * 2)
    near = np.zeros_like(kn)
    near[kn] = d < RING
    r['unknown'] = (r['flag'] == 2) | near
    r['known'] = kn & ~near
    print(f"{k} : {(r['flag'] > 0).sum()} texels couverts, {(r['flag'] == 2).sum()} à refaire, {near.sum()} autour, "
          f"{r['dens']:.1f} px/cm")

# 1.20 (Youssef, 05/11 13:42: « son cou n'est pas naturel, tout le corps doit être harmonieux »). Measured on the
# rendered model: the face is warmer and darker than the neck and the chest (cheek 213/157/118, neck 230/187/152,
# chest 234/200/167; Amara, same body: 145/76/49, 155/92/58, 175/111/76): the head of the face's texture and the
# body's do not share one tone, so the face read as a mask over a pale neck. The body's texture takes, channel by
# channel, HARMO of the gap between its mean skin (chest and belly) and the mean of the face (cheeks, forehead)
HARMO = float(os.environ.get('HARMO', '0.7'))
if HARMO > 0:
    rb, rh = R['body'], R['head']
    bsel = rb['known'] & (rb['pos'][..., 2] > 100) & (rb['pos'][..., 2] < 135)
    hsel = rh['known'] & (rh['pos'][..., 2] > 156) & (rh['pos'][..., 1] < -4)
    bm_, hm_ = TEX['body'][bsel].mean(0), TEX['head'][hsel].mean(0)
    gain = 1 + HARMO * (hm_ / np.maximum(bm_, 1e-3) - 1)
    TEX['body'] = np.clip(TEX['body'] * gain, 0, 1)
    # the head's own skin below the jaw (the neck) is graded the same, fading in from the jaw line to the neck
    hz = rh['pos'][..., 2]
    t_ = np.clip((158 - np.nan_to_num(hz, nan=200)) / 6, 0, 1)[..., None] * (rh['flag'] > 0)[..., None]
    TEX['head'] = np.clip(TEX['head'] * (1 + (gain - 1) * t_), 0, 1)
    print('peau du corps accordée au visage : gain', np.round(gain, 3), 'corps', np.round(bm_ * 255), 'visage', np.round(hm_ * 255))
# colour per point: mean of the known texels around it (weight = barycentric weight squared), both textures
acc = np.zeros((NV, 3))
wsum = np.zeros(NV)
for k, r in R.items():
    low = gaussian_filter(TEX[k], (2, 2, 0))
    m = r['known']
    vi, w, col = r['vid'][m], r['bw'][m] ** 2, low[m]
    for j in range(3):
        np.add.at(acc, vi[:, j], col * w[:, j:j + 1])
        np.add.at(wsum, vi[:, j], w[:, j])
known_v = wsum > 0.5
vcol = np.zeros((NV, 3))
vcol[known_v] = acc[known_v] / wsum[known_v][:, None]
# points used by the textures: only those are solved
used = np.zeros(NV, bool)
for k, P, T, I, unk in tris:
    used[I] = True
unk_v = np.nonzero(used & ~known_v)[0]
print(f'{known_v.sum()} points de couleur connue, {len(unk_v)} à calculer')
idx = -np.ones(NV, int)
idx[unk_v] = np.arange(len(unk_v))
nb = [set() for _ in range(NV)]
for e in bm.edges:
    a, b = e.verts[0].index, e.verts[1].index
    nb[a].add(b)
    nb[b].add(a)
A = lil_matrix((len(unk_v), len(unk_v)))
B = np.zeros((len(unk_v), 3))
for r_, v in enumerate(unk_v):
    ns = [n for n in nb[v] if used[n]]
    A[r_, r_] = len(ns)
    for n in ns:
        if idx[n] >= 0:
            A[r_, idx[n]] -= 1
        else:
            B[r_] += vcol[n]
if len(unk_v):
    vcol[unk_v] = np.stack([spsolve(A.tocsr(), B[:, c]) for c in range(3)], -1)

# grain: high frequencies of the cleanest 256 px patch of known body skin
body = TEX['body']
lowb = gaussian_filter(body, (6, 6, 0))
hp = body - lowb
best, bxy, S = 1e9, None, 256
kb = R['body']['known']
for y in range(0, H - S, 64):
    for x in range(0, W - S, 64):
        if not kb[y:y + S, x:x + S].all():
            continue
        sc = lowb[y:y + S, x:x + S].std(axis=(0, 1)).sum()
        if sc < best:
            best, bxy = sc, (y, x)
patch = hp[bxy[0]:bxy[0] + S, bxy[1]:bxy[1] + S] if bxy else np.zeros((S, S, 3), np.float32)
print(f'grain de peau pris à {bxy}')

for k, r in R.items():
    img = TEX[k]
    unknown = r['unknown']
    ys, xs = np.nonzero(unknown)
    fill = (vcol[r['vid'][ys, xs]] * r['bw'][ys, xs][..., None]).sum(1)
    sc = R['body']['dens'] / r['dens']  # same grain size in cm
    gy = (ys * sc).astype(int) % S
    gx = (xs * sc).astype(int) % S
    new = img.copy()
    new[ys, xs] = fill + patch[gy, gx]
    dist_out = distance_transform_edt(~unknown)
    edge = np.clip(1 - dist_out / 3, 0, 1)
    edge[unknown] = 1
    covered = r['flag'] > 0
    edge[~covered] = 0
    out = img * (1 - edge[..., None]) + new * edge[..., None]
    if k == 'body' and NIP is not None:
        # 1.19: areola and nipple (clean_torso.py raises the nipple and stores where): a soft, slightly pink brown
        # disc 1.9 cm in radius that fades into the skin, darker and a little rosier on the nipple, with fine bumps
        cov_ = r['flag'] > 0
        py_, px_ = np.nonzero(cov_)
        pp = r['pos'][py_, px_]
        for c_ in NIP:
            d_ = np.linalg.norm(pp - c_, axis=1)
            m_ = d_ < AREOLA_R * 1.6
            if not m_.any():
                continue
            dd = d_[m_]
            # irregular rim (a real areola is not a perfect disc) and a wide soft fade into the skin
            ang = np.arctan2(pp[m_][:, 2] - c_[2], pp[m_][:, 0] - c_[0])
            rim = AREOLA_R * (1 + 0.06 * np.sin(ang * 3 + 0.5) + 0.04 * np.sin(ang * 7))
            a_ = np.clip((rim - dd) / (AREOLA_R * 0.55), 0, 1) ** 2 * 0.95
            n_ = np.clip((0.42 - dd) / 0.22, 0, 1)
            ring_ = np.exp(-((dd - 0.5) / 0.12) ** 2) * 0.5
            yy_, xx_ = py_[m_], px_[m_]
            base = out[yy_, xx_]
            # muted rosy brown (the coach's skin grade warms it again in the app): no orange
            lum = base.mean(1, keepdims=True)
            grey = base * 0.6 + lum * 0.4
            tint = grey * np.array([0.83, 0.72, 0.73])
            tip = grey * np.array([0.76, 0.63, 0.65])
            bumps = 1 + 0.035 * np.sin(xx_ * 1.7) * np.sin(yy_ * 1.9)
            col = base * (1 - a_[:, None]) + tint * bumps[:, None] * a_[:, None]
            col = col * (1 - n_[:, None]) + tip * n_[:, None]
            # a light shadow where the nipple stands off the areola
            col = col * (1 - 0.12 * ring_[:, None])
            out[yy_, xx_] = col
        print('aréoles peintes', len(NIP))
    # padding: texels outside every island take the colour of the nearest covered texel
    d, (iy, ix) = distance_transform_edt(~covered, return_indices=True)
    pad = (~covered) & (d <= PAD)
    out[pad] = out[iy[pad], ix[pad]]
    TEX[k] = out
    if os.environ.get('DEBUG'):
        dbg = np.zeros((H, W, 3), np.uint8)
        dbg[r['flag'] == 1] = (90, 90, 90)
        dbg[r['flag'] == 2] = (255, 0, 0)
        dbg[unknown & (r['flag'] == 1)] = (255, 200, 0)
        dbg[pad] = (0, 0, 255)
        Image.fromarray(dbg).save(os.path.join(os.environ['DEBUG'], f'mask_{k}.png'))
    save(out, f'f021_{k}_color.png')
    # normal map: flat over the unknown texels
    nmp = os.path.join(texdir, f'f021_{k}_normal.tga')
    nm = np.asarray(Image.open(nmp).convert('RGB'), dtype=np.float32) / 255
    g = gaussian_filter((unknown | pad).astype(np.float32), 2)[..., None]
    nm = nm * (1 - g) + np.array([0.5, 0.5, 1.0], np.float32) * g
    Image.fromarray((np.clip(nm, 0, 1) * 255 + 0.5).astype(np.uint8)).save(nmp)
    print(f'{k} : {len(ys)} texels repeints, {pad.sum()} de marge')

# check: colour of head and body at the points they share
vb, vh = {}, {}
for k, P, T, I, unk in tris:
    for j in range(3):
        (vb if k == 'body' else vh).setdefault(I[j], []).append(T[j])
shared = sorted(set(vb) & set(vh))
bb = gaussian_filter(TEX['body'], (4, 4, 0))
hh = gaussian_filter(TEX['head'], (4, 4, 0))


def at(img, uv):
    u, v = uv
    return img[int(np.clip((1 - v) * H, 0, H - 1)), int(np.clip(u * W, 0, W - 1))]


D = np.array([np.mean([at(hh, t) for t in vh[i]], 0) - np.mean([at(bb, t) for t in vb[i]], 0) for i in shared])
print(f'{len(shared)} points communs tête / corps, écart moyen {np.abs(D).mean() * 255:.1f} / 255, '
      f'max {np.abs(D).max() * 255:.1f}')
print('ok', texdir)
