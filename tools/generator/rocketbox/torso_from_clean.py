"""1.38: Amara's torso without the bikini sculpted in the Sports_Female_01 body (photo.glb, numpy only, no Blender).

  python3 tools/generator/rocketbox/torso_from_clean.py public/coaches/mma-amara/photo.glb \
      public/coaches/inaya/photo.glb out.glb

Verified finding (12/11, Youssef's phone captures of 1.37.7 and Lab close-ups): the halter bikini of the base body is
still modelled in Amara's skin (cups with a raised outline, cord round the neck, back band, knots, folded hems, a
second skin layer under the band). Every garment is a copy of the skin: flattening it in the garment script only
(1.37.7) reduced the relief, the knots and the band still showed on her tops. Inaya's body was cleaned at its source
in 1.19 (clean_torso.py, on the low-poly mesh before subdivision) and her tops are clean.

Both bodies come from the same base mesh and keep its texture coordinates: 96 % of the points of Inaya's body have a
point of Amara's at the same texture coordinate. Method:
- Amara's body takes the TOPOLOGY of Inaya's cleaned body (triangles, texture coordinates);
- every point with a twin on Amara outside the bikini's outline keeps Amara's own position, normal, colours, skin
  weights and expression deltas, exactly: limbs, belly, shoulders, the neck seam and the middle of the cups (the
  volume of the bust) do not change;
- the points of the cleaned zone (the outline of the cups over EDGE rows, the cord, the band, the knots, RINGS rows
  of skin around) take Inaya's clean shape carried onto Amara: Inaya's position plus the difference Amara - Inaya
  of the points around, spread smoothly over the zone (harmonic interpolation on the mesh);
- their normals are recomputed, their weights are Inaya's (same skeleton names).
- the head's skin below the jaw is part of the same surface (the cord of the bikini goes round the neck on it): its
  points keep Amara's order, triangles, weights and expressions; only those where Amara's neck differs locally from the
  cleaned one by more than CORD (2 mm: the cord), and HRINGS rows around, are carried over the same way.
The face, the eyes, the textures and the skeleton are untouched. The outfits hide body points by position: rebuild
them after (outfits.py).
"""
import sys, json, struct, os
import numpy as np
from scipy.spatial import cKDTree
from scipy.sparse import coo_matrix, identity
from scipy.sparse.linalg import spsolve

A_PATH, I_PATH, OUT = sys.argv[1:4]
EDGE = int(os.environ.get('EDGE', '4'))
RINGS = int(os.environ.get('RINGS', '4'))
CT = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


class Glb:
    def __init__(self, path):
        b = open(path, 'rb').read()
        jl = struct.unpack_from('<I', b, 12)[0]
        self.j = json.loads(b[20:20 + jl])
        bl = struct.unpack_from('<I', b, 20 + jl)[0]
        self.bin = b[20 + jl + 8:20 + jl + 8 + bl]
        self.new = {}  # accessor index -> replacement arrays

    def view(self, bvi, dt, n, count, off=0):
        bv = self.j['bufferViews'][bvi]
        o = bv.get('byteOffset', 0) + off
        size = np.dtype(dt).itemsize * n
        st = bv.get('byteStride') or size
        return np.ndarray((count, n), dtype=np.dtype(dt).newbyteorder('<'), buffer=self.bin, offset=o, strides=(st, np.dtype(dt).itemsize)).copy()

    def acc(self, i):
        a = self.j['accessors'][i]
        dt, n = CT[a['componentType']], NC[a['type']]
        out = self.view(a['bufferView'], dt, n, a['count'], a.get('byteOffset', 0)) if 'bufferView' in a else np.zeros((a['count'], n), dt)
        if 'sparse' in a:
            s = a['sparse']
            ix = self.view(s['indices']['bufferView'], CT[s['indices']['componentType']], 1, s['count'], s['indices'].get('byteOffset', 0))[:, 0]
            out[ix] = self.view(s['values']['bufferView'], dt, n, s['count'], s['values'].get('byteOffset', 0))
        return out

    def body(self):
        for m in self.j['meshes']:
            for p in m['primitives']:
                if self.j['materials'][p['material']]['name'].endswith('body'):
                    return p
        raise SystemExit('no body primitive')

    def head(self):
        for m in self.j['meshes']:
            for p in m['primitives']:
                if self.j['materials'][p['material']]['name'].endswith('head'):
                    return p
        raise SystemExit('no head primitive')

    def joints(self):
        return [self.j['nodes'][i]['name'] for i in self.j['skins'][0]['joints']]

    def write(self, path, repl):
        """repl: accessor index -> ('dense', array) or ('sparse', count, indices, values). Everything else is copied."""
        j = self.j
        blobs, views = [], []

        def add(data, target=None, stride=None):
            off = sum(len(x) for x in blobs)
            pad = (-len(data)) % 4
            blobs.append(bytes(data) + b'\0' * pad)
            v = {'buffer': 0, 'byteOffset': off, 'byteLength': len(data)}
            if target:
                v['target'] = target
            views.append(v)
            return len(views) - 1

        old_views = j['bufferViews']
        copied = {}

        def copy_view(i):
            if i not in copied:
                bv = old_views[i]
                o = bv.get('byteOffset', 0)
                k = add(self.bin[o:o + bv['byteLength']], bv.get('target'))
                if 'byteStride' in bv:
                    views[k]['byteStride'] = bv['byteStride']
                copied[i] = k
            return copied[i]

        for i, a in enumerate(j['accessors']):
            if i in repl:
                r = repl[i]
                a.pop('byteOffset', None)
                if r[0] == 'dense':
                    arr = np.ascontiguousarray(r[1]).astype(np.dtype(CT[a['componentType']]).newbyteorder('<'))
                    a['bufferView'] = add(arr.tobytes(), r[2] if len(r) > 2 else None)
                    a['count'] = len(arr)
                    a.pop('sparse', None)
                    if 'min' in a:
                        a['min'] = [float(x) for x in arr.reshape(len(arr), -1).min(0)]
                        a['max'] = [float(x) for x in arr.reshape(len(arr), -1).max(0)]
                else:
                    _, count, ix, vals = r
                    a['count'] = count
                    a.pop('bufferView', None)
                    vals = np.ascontiguousarray(vals, dtype='<f4')
                    if len(ix) == 0:  # glTF: a sparse accessor needs at least one entry
                        ix, vals = np.array([0], np.uint32), np.zeros((1, 3), '<f4')
                    a['sparse'] = {'count': len(ix),
                                   'indices': {'bufferView': add(np.ascontiguousarray(ix, dtype='<u4').tobytes()), 'componentType': 5125},
                                   'values': {'bufferView': add(vals.tobytes())}}
                    a['min'] = [float(min(0.0, x)) for x in vals.min(0)]
                    a['max'] = [float(max(0.0, x)) for x in vals.max(0)]
                continue
            if 'bufferView' in a:
                a['bufferView'] = copy_view(a['bufferView'])
            if 'sparse' in a:
                a['sparse']['indices']['bufferView'] = copy_view(a['sparse']['indices']['bufferView'])
                a['sparse']['values']['bufferView'] = copy_view(a['sparse']['values']['bufferView'])
        for im in j.get('images', []):
            if 'bufferView' in im:
                im['bufferView'] = copy_view(im['bufferView'])
        for s in j.get('skins', []):
            pass  # inverse bind matrices are accessors, already handled
        j['bufferViews'] = views
        data = b''.join(blobs)
        j['buffers'] = [{'byteLength': len(data)}]
        js = json.dumps(j, separators=(',', ':')).encode()
        js += b' ' * ((-len(js)) % 4)
        with open(path, 'wb') as f:
            f.write(struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(js) + 8 + len(data)))
            f.write(struct.pack('<I4s', len(js), b'JSON') + js)
            f.write(struct.pack('<I4s', len(data), b'BIN\0') + data)


A, I = Glb(A_PATH), Glb(I_PATH)
CORD = float(os.environ.get('CORD', '0.002'))
HRINGS = int(os.environ.get('HRINGS', '3'))
if A.j['asset'].get('extras', {}).get('css_clean_geometry'):
    raise SystemExit('this body is already cleaned (css_clean_geometry): start from the body before 1.38')
pa, pi, ha, hi = A.body(), I.body(), A.head(), I.head()


def twins(UAx, PAx, UIx, PIx):
    """for each point of the clean mesh, the point of Amara at the same texture coordinate (the nearest in space when
    several share it: mirrored islands)"""
    t = cKDTree(UAx)
    out = np.full(len(UIx), -1)
    for i, c in enumerate(t.query_ball_point(UIx, 1e-4)):
        if c:
            c = np.array(c)
            out[i] = c[np.argmin(np.linalg.norm(PAx[c] - PIx[i], axis=1))]
    return out


PAb, UAb = A.acc(pa['attributes']['POSITION']).astype(np.float64), A.acc(pa['attributes']['TEXCOORD_0'])
PIb, UIb = I.acc(pi['attributes']['POSITION']).astype(np.float64), I.acc(pi['attributes']['TEXCOORD_0'])
PAh, UAh = A.acc(ha['attributes']['POSITION']).astype(np.float64), A.acc(ha['attributes']['TEXCOORD_0'])
PIh, UIh = I.acc(hi['attributes']['POSITION']).astype(np.float64), I.acc(hi['attributes']['TEXCOORD_0'])
TIb = I.acc(pi['indices'])[:, 0].reshape(-1, 3).astype(np.int64)
TIh = I.acc(hi['indices'])[:, 0].reshape(-1, 3).astype(np.int64)
nb, nh = len(PIb), len(PIh)
n = nb + nh
tb, th = twins(UAb, PAb, UIb, PIb), twins(UAh, PAh, UIh, PIh)
if (th < 0).any() or len(np.unique(th)) != nh or len(PAh) != nh:
    raise SystemExit('the two heads do not have the same points')
isb = np.arange(n) < nb
PI = np.vstack([PIb, PIh])
PAt = np.vstack([PAb[np.maximum(tb, 0)], PAh[th]])  # Amara's twin position (garbage where unmatched)
matched = np.r_[tb >= 0, np.ones(nh, bool)]
UI = np.vstack([UIb, UIh])
TI = np.vstack([TIb, TIh + nb])
print('points of the clean body', nb, 'with a twin on Amara', int((tb >= 0).sum()), '; head points', nh)

# welded graph of the clean surface, body and head together (seam duplicates move together)
key = np.round(PI * 1e5).astype(np.int64)
_, weld = np.unique(key, axis=0, return_inverse=True)
weld = weld.ravel()
nw = weld.max() + 1
E = np.concatenate([TI[:, [0, 1]], TI[:, [1, 2]], TI[:, [2, 0]]])
Ew = weld[E]
Ew = Ew[Ew[:, 0] != Ew[:, 1]]
Ew = np.unique(np.sort(Ew, 1), axis=0)
adj = coo_matrix((np.ones(len(Ew) * 2), (np.r_[Ew[:, 0], Ew[:, 1]], np.r_[Ew[:, 1], Ew[:, 0]])), shape=(nw, nw)).tocsr()
deg = np.maximum(np.asarray(adj.sum(1)).ravel(), 1)


def grow(mask, k):
    m = mask.copy()
    for _ in range(k):
        m = m | (adj @ m.astype(np.float64) > 0)
    return m


def welded(mask):  # per point -> per welded point (any)
    out = np.zeros(nw, bool)
    np.logical_or.at(out, weld, mask)
    return out


torso = (PI[:, 1] > 1.12) & (PI[:, 1] < 1.56)
bik = isb & (UI[:, 1] > 0.78) & (PI[:, 1] > 1.15)  # the bikini's texture islands (glTF v; Blender v < 0.22)
un = ~matched & torso
if (~matched & ~torso).any():
    print('warning: points without a twin outside the torso', int((~matched & ~torso).sum()))
bw, uw = welded(bik), welded(un)
# the middle of the cups: bikini points further than EDGE rows from the islands' border or a rebuilt point
border = grow(~bw | uw, EDGE) & bw
zone = grow(border | uw, RINGS) & welded(torso)
zone |= uw
# the head's neck: where Amara differs locally from the clean neck (the cord)
dh = PAt - PI
tree = cKDTree(PI[~isb])
low = ~isb & (PI[:, 1] < 1.50)
res = np.zeros(n)
for i in np.where(low)[0]:
    nbr = np.array(tree.query_ball_point(PI[i], 0.02)) + nb
    res[i] = np.linalg.norm(dh[i] - np.median(dh[nbr], axis=0))
cord = low & (res > CORD)
zone |= grow(welded(cord), HRINGS) & welded(~isb & (PI[:, 1] < 1.52) | isb & torso)
# a welded point of the clean surface whose twins on Amara are apart (the seam ran along the cord there) is rebuilt
lo, hi_ = np.full((nw, 3), np.inf), np.full((nw, 3), -np.inf)
mi = np.where(matched)[0]
np.minimum.at(lo, weld[mi], PAt[mi])
np.maximum.at(hi_, weld[mi], PAt[mi])
apart = (hi_ - lo).max(1) > 1e-4
apart &= np.isfinite(hi_).all(1) & welded(torso)
print('seam points apart on Amara, rebuilt:', int(apart.sum()))
zone |= grow(apart, 1) & welded(torso)
Z = zone[weld]  # per point
keep = ~Z & matched
if (~Z & ~matched).any():
    raise SystemExit(f'{int((~Z & ~matched).sum())} points outside the zone have no twin on Amara')
print('cleaned zone: body', int((Z & isb).sum()), 'points, head (neck)', int((Z & ~isb).sum()), '; bikini points', int(bik.sum()), 'of which kept (middle of the cups)', int((bik & ~Z).sum()))

# displacement Amara - Inaya, known outside the zone, harmonic inside
disp = np.zeros((nw, 3))
cnt = np.zeros(nw)
np.add.at(disp, weld[keep], (PAt - PI)[keep])
np.add.at(cnt, weld[keep], 1)
known = cnt > 0
disp[known] /= cnt[known, None]
free = np.where(zone)[0]
L = (identity(nw, format='csr').multiply(np.asarray(adj.sum(1)).ravel()[:, None]) - adj).tocsr()
Lff = L[free][:, free].tocsc()
fixed = np.where(~zone)[0]
rhs = -(L[free][:, fixed] @ disp[fixed])
sol = np.column_stack([spsolve(Lff, rhs[:, c]) for c in range(3)])
disp[free] = sol
print('displacement carried into the zone (mm): mean', round(float(np.linalg.norm(sol, axis=1).mean() * 1000), 2), 'max', round(float(np.linalg.norm(sol, axis=1).max() * 1000), 2))

P = np.where(Z[:, None], PI + disp[weld], PAt)
# a light fairing of the zone only (its border held), on the welded points
Pw = np.zeros((nw, 3))
np.add.at(Pw, weld, P)
Pw /= np.bincount(weld, minlength=nw)[:, None]
inner = zone & ~(adj @ (~zone).astype(np.float64) > 0)
for it in range(int(os.environ.get('FAIR', '6'))):
    avg = (adj @ Pw) / deg[:, None]
    k = 0.5 if it % 2 == 0 else -0.53  # Taubin: no shrinking
    Pw[inner] += k * (avg[inner] - Pw[inner])
P[Z] = Pw[weld][Z]

# normals: recomputed on the zone (area weighted, welded), Amara's elsewhere
fn = np.cross(P[TI[:, 1]] - P[TI[:, 0]], P[TI[:, 2]] - P[TI[:, 0]])
Nw = np.zeros((nw, 3))
for c in range(3):
    np.add.at(Nw, weld[TI[:, c]], fn)
Nw /= np.maximum(np.linalg.norm(Nw, axis=1), 1e-12)[:, None]
NAt = np.vstack([A.acc(pa['attributes']['NORMAL']).astype(np.float64)[np.maximum(tb, 0)], A.acc(ha['attributes']['NORMAL']).astype(np.float64)[th]])
ring = grow(zone, 2) & ~zone  # two rows of blend with Amara's normals
N = np.where(Z[:, None], Nw[weld], NAt)
rb = ring[weld] & matched
N[rb] = 0.5 * Nw[weld][rb] + 0.5 * NAt[rb]
N /= np.maximum(np.linalg.norm(N, axis=1), 1e-12)[:, None]

# skin weights: every point with a twin keeps Amara's own. The points without one (rebuilt hems and knots) take
# weights spread from the points around them (harmonic on the mesh, like the positions), so the skinning stays one
# smooth field: with Inaya's weights on them the fold under the arms in guard grew (deformation-v1100 test), and a
# point shared by the head and the body must have ONE set of weights or the two open as a slit in motion
ja = A.joints()
nj = len(ja)
JA, WA = A.acc(pa['attributes']['JOINTS_0']).astype(np.int64), A.acc(pa['attributes']['WEIGHTS_0']).astype(np.float64)
JHa, WHa = A.acc(ha['attributes']['JOINTS_0']).astype(np.int64), A.acc(ha['attributes']['WEIGHTS_0']).astype(np.float64)
Ww = np.zeros((nw, nj))
cw = np.zeros(nw)
mb, tb0 = tb >= 0, np.maximum(tb, 0)
for idx, Jx, Wx, tw in ((np.where(mb)[0], JA, WA, tb), (np.arange(nh) + nb, JHa, WHa, np.r_[np.zeros(nb, np.int64), th])):
    src = tw[idx]
    for c in range(4):
        np.add.at(Ww, (weld[idx], Jx[src, c]), Wx[src, c])
    np.add.at(cw, weld[idx], 1)
kw = cw > 0
Ww[kw] /= cw[kw, None]
fw = np.where(~kw)[0]
if len(fw):
    used = np.where(np.abs(Ww).sum(0) > 0)[0]
    Lf = L[fw][:, fw].tocsc()
    kx = np.where(kw)[0]
    rh = -(L[fw][:, kx] @ Ww[kx][:, used])
    from scipy.sparse.linalg import splu
    lu = splu(Lf)
    Ww[np.ix_(fw, used)] = np.clip(lu.solve(rh), 0, None)
# ... and the weights of the zone's inside are relaxed a little (WSMOOTH passes): the old band and the skin under it
# had slightly different weights, which now meet on one surface (crease measured by the deformation-v1100 test)
for _ in range(int(os.environ.get('WSMOOTH', '3'))):
    avg = (adj @ Ww) / deg[:, None]
    Ww[inner] = 0.5 * Ww[inner] + 0.5 * avg[inner]
J = JA[tb0].copy()
W = WA[tb0].astype(np.float32)
ub = np.where(~mb | inner[weld][:nb])[0]
top = np.argsort(-Ww[weld[ub]], axis=1)[:, :4]
wt = np.take_along_axis(Ww[weld[ub]], top, 1)
wt /= wt.sum(1, keepdims=True)
J[ub], W[ub] = top, wt
# the head's points of the zone's inside take the same field (one set of weights per shared point)
uh = np.where(inner[weld][nb:])[0]
toph = np.argsort(-Ww[weld[uh + nb]], axis=1)[:, :4]
wth = np.take_along_axis(Ww[weld[uh + nb]], toph, 1)
wth /= wth.sum(1, keepdims=True)
JHa[th[uh]], WHa[th[uh]] = toph, wth
repl_head_w = (JHa, WHa.astype(np.float32))
print('skin weights: spread to', int((~mb).sum()), 'points without a twin, relaxed on', len(ub), 'body and', len(uh), 'head points')
Zb = Z[:nb]


def colour(name):
    ca, ci = A.acc(pa['attributes'][name]), I.acc(pi['attributes'][name])
    return np.where(mb[:, None], ca[tb0], ci)


repl = {pa['attributes']['POSITION']: ('dense', P[:nb].astype(np.float32), 34962),
        pa['attributes']['NORMAL']: ('dense', N[:nb].astype(np.float32), 34962),
        pa['attributes']['TEXCOORD_0']: ('dense', UIb, 34962),
        pa['attributes']['JOINTS_0']: ('dense', J, 34962),
        pa['attributes']['WEIGHTS_0']: ('dense', W, 34962),
        pa['indices']: ('dense', TIb.reshape(-1, 1), 34963)}
for name in ('COLOR_0', 'COLOR_1'):
    if name in pa['attributes']:
        repl[pa['attributes'][name]] = ('dense', colour(name), 34962)
# the head keeps Amara's own points (order, triangles, weights, expressions): only the neck zone moves
PH, NH = PAh.copy(), A.acc(ha['attributes']['NORMAL']).astype(np.float64)
zh = np.where(Z[nb:])[0]
PH[th[zh]] = P[nb:][zh]
NH[th[zh]] = N[nb:][zh]
repl[ha['attributes']['JOINTS_0']] = ('dense', repl_head_w[0], 34962)
repl[ha['attributes']['WEIGHTS_0']] = ('dense', repl_head_w[1], 34962)
repl[ha['attributes']['POSITION']] = ('dense', PH.astype(np.float32), 34962)
repl[ha['attributes']['NORMAL']] = ('dense', NH.astype(np.float32), 34962)
# expressions: the deltas of Amara's body points follow their twins (the zone's rebuilt points do not move)
src_of = np.where(mb & ~Zb, tb, -1)
moved = 0
for t in pa.get('targets', []):
    if t['POSITION'] in repl:
        continue
    dlt = A.acc(t['POSITION'])
    new = np.zeros((nb, 3), np.float32)
    ok = src_of >= 0
    new[ok] = dlt[src_of[ok]]
    ix = np.where(np.abs(new).max(1) > 0)[0]
    moved = max(moved, len(ix))
    repl[t['POSITION']] = ('sparse', nb, ix, new[ix])
print('expression targets carried:', len(pa.get('targets', [])), 'most body points moved by one:', moved)
A.j['asset'].setdefault('extras', {})['css_clean_geometry'] = '1.38.0'
A.j['asset']['extras']['css_clean_geometry_reference'] = 'inaya-clean-topology'
A.write(OUT, repl)
zh_a = np.zeros(nh, bool)
zh_a[th[zh]] = True
np.savez(OUT + '.zone.npz', body=Z[:nb], head=zh_a, bikini=bik[:nb])  # for torso_textures.py
dev = np.linalg.norm((P - PAt)[matched], axis=1)
print('written', OUT, os.path.getsize(OUT), 'bytes; body points', len(PAb), '->', nb)
print('points with a twin moved more than 1 mm:', int((dev > 1e-3).sum()), 'max (mm)', round(float(dev.max() * 1000), 1), '; cup points kept exactly:', int((bik & ~Z).sum()))
