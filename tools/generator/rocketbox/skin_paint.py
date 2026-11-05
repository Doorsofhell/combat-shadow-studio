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
