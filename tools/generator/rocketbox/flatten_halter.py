"""1.15: smooths away the relief of the halter bikini top sculpted in a sports woman's body (photo.glb, in place).

  python3 tools/generator/rocketbox/flatten_halter.py public/coaches/inaya/photo.glb [iterations]

Verified finding (Youssef 04/11 12:07 « on dirait qu'il est emboîté, il y a des traces »; Lab close-ups of Inaya with
and without her outfit): the bikini top of Sports_Female_01 is not painted on the skin, it is modelled as pieces of
the body surface (cups, under-band, a halter strap round the neck, two small knots), welded to the skin along their
edges. Their raised edges and the strap's stand-off stay visible as lines and steps on the chest, the neck and the
back above any 3D top, so the bust reads as a separate piece fitted into the body. Repainting them skin coloured (1.12)
and flattening their normal map hid the colour, not the shape.

Method: the bikini pieces are the body's UV islands at the bottom middle of the texture (v > 0.78) above the waist,
and the small pieces welded to them; every point is merged with the points at the same place (body and head, the
strap meets the head's skin), and the pieces plus 5 rings of skin around them are smoothed with Taubin's method
(lambda/mu: no shrinking, the breasts keep their volume), the outer ring held still. Normals are recomputed over the
moved region. The skinning weights are unchanged. The outfits hide body points by position: regenerate them after.
"""
import sys, json, struct
from collections import defaultdict
import numpy as np

path = sys.argv[1]
ITER = int(sys.argv[2]) if len(sys.argv) > 2 else 150
RINGS = int(sys.argv[3]) if len(sys.argv) > 3 else 5
raw = bytearray(open(path, 'rb').read())
jl = struct.unpack_from('<I', raw, 12)[0]
J = json.loads(raw[20:20 + jl])
B0 = 20 + jl + 8
CT = {5126: ('f', 4), 5123: ('H', 2), 5125: ('I', 4), 5121: ('B', 1)}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


def view(i):
    a = J['accessors'][i]
    bv = J['bufferViews'][a['bufferView']]
    t, s = CT[a['componentType']]
    n = NC[a['type']]
    o = B0 + bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    st = bv.get('byteStride', s * n)
    return np.ndarray((a['count'], n), dtype='<' + t, buffer=raw, offset=o, strides=(st, s))


prims = []
seen = set()
for m in J['meshes']:
    for p in m['primitives']:
        k = p['attributes']['POSITION']
        if k in seen:
            continue
        seen.add(k)
        name = J['materials'][p['material']]['name']
        prims.append(dict(name=name, P=view(k), N=view(p['attributes']['NORMAL']), UV=view(p['attributes']['TEXCOORD_0']), F=np.array(view(p['indices'])).astype(int).reshape(-1, 3), pa=k))
body = next(p for p in prims if p['name'].endswith('_body'))


def components(n, F):
    par = np.arange(n)

    def f(x):
        while par[x] != x:
            par[x] = par[par[x]]
            x = par[x]
        return x

    for a, b, c in F:
        ra = f(a)
        par[f(b)] = ra
        par[f(c)] = ra
    return np.array([f(i) for i in range(n)])


P = np.array(body['P'], np.float64)
UV = np.array(body['UV'])
lab = components(len(P), body['F'])
comps = {c: np.where(lab == c)[0] for c in np.unique(lab)}
bik = {c for c, s in comps.items() if UV[s, 1].min() > 0.78 and P[s, 1].min() > 1.15}

# merge points at the same place, over all the primitives
gid = {}
groups = []
members = []
for pi, p in enumerate(prims):
    for i, v in enumerate(np.asarray(p['P'])):
        k = tuple(np.round(v, 4))
        if k not in gid:
            gid[k] = len(groups)
            groups.append(np.array(v, np.float64))
            members.append([])
        members[gid[k]].append((pi, i))
G = np.array(groups)
gof = [np.array([gid[tuple(np.round(v, 4))] for v in np.asarray(p['P'])]) for p in prims]
# small pieces welded to the bikini (the knots between the cups)
for c, s in comps.items():
    if c in bik or len(s) > 60 or P[s, 1].min() < 1.15:
        continue
    gs = set(gof[0][s])
    if any(set(gof[0][comps[b]]) & gs for b in bik):
        bik.add(c)
sel = set()
for c in bik:
    sel |= set(gof[0][comps[c]])
nb = defaultdict(set)
for pi, p in enumerate(prims):
    g = gof[pi][p['F']]
    for a, b in ((0, 1), (1, 2), (2, 0)):
        for x, y in zip(g[:, a], g[:, b]):
            if x != y:
                nb[x].add(y)
                nb[y].add(x)
region = set(sel)
ring = set(sel)
for _ in range(RINGS):
    ring = {y for x in ring for y in nb[x]} - region
    region |= ring
# the skin round the shoulder joints is left as it is (within ARM_KEEP of LeftArm/RightArm at bind time): smoothed
# there, the side of the cups folded more sharply under the arm in the guard (deformation-v1100.test.ts, armpits)
ARM_KEEP = float(sys.argv[4]) if len(sys.argv) > 4 else 0.15
sk = J['skins'][0]
ibm = np.array(view(sk['inverseBindMatrices']), np.float64)
arms = []
for k, jn in enumerate(sk['joints']):
    if J['nodes'][jn].get('name', '').replace('mixamorig:', '') in ('LeftArm', 'RightArm'):
        arms.append(np.linalg.inv(ibm[k].reshape(4, 4).T)[:3, 3])
near_arm = {g for g in region - sel if any(np.linalg.norm(G[g] - a) < ARM_KEEP for a in arms)}
region -= near_arm
print(f'{len(near_arm)} points près des épaules laissés tels quels ({len(arms)} articulations)')
fixed = {y for x in region for y in nb[x]} - region
idx = np.array(sorted(region))
pos_of = {g: i for i, g in enumerate(idx)}
X = G[idx].copy()
nbl = [np.array([y for y in nb[g]]) for g in idx]


def step(X, k):
    Y = X.copy()
    for i, g in enumerate(idx):
        ns = nbl[i]
        if not len(ns):
            continue  # a point without triangles
        c = np.mean([X[pos_of[y]] if y in pos_of else G[y] for y in ns], 0)
        Y[i] = X[i] + k * (c - X[i])
    return Y


for _ in range(ITER):
    X = step(X, 0.5)
    X = step(X, -0.53)
d = np.linalg.norm(X - G[idx], axis=1)
print(f'{path}: pièces du bikini {sorted(int(c) for c in bik)}, {len(sel)} points + {len(region) - len(sel)} de peau autour, '
      f'déplacement moyen {d.mean() * 1000:.2f} mm, max {d.max() * 1000:.2f} mm')
G2 = G.copy()
G2[idx] = X
# normals of the moved region and its first ring, area weighted over all the faces
touched = region | fixed
acc = np.zeros_like(G2)
for pi, p in enumerate(prims):
    g = gof[pi][p['F']]
    a, b, c = G2[g[:, 0]], G2[g[:, 1]], G2[g[:, 2]]
    fn = np.cross(b - a, c - a)
    for k in range(3):
        np.add.at(acc, g[:, k], fn)
for pi, p in enumerate(prims):
    g = gof[pi]
    m = np.isin(g, list(touched))
    Pv, Nv = p['P'], p['N']
    Pv[m] = G2[g[m]].astype(np.float32)
    nn = acc[g[m]]
    ln = np.linalg.norm(nn, axis=1, keepdims=True)
    nn = np.where(ln > 1e-12, nn / np.maximum(ln, 1e-12), np.asarray(Nv)[m])
    Nv[m] = nn.astype(np.float32)
    a = J['accessors'][p['pa']]
    allp = np.asarray(Pv)
    a['min'] = allp.min(0).tolist()
    a['max'] = allp.max(0).tolist()
js = json.dumps(J, separators=(',', ':')).encode()
js += b' ' * ((4 - len(js) % 4) % 4)
rest = bytes(raw[20 + jl:])
open(path, 'wb').write(b'glTF' + struct.pack('<II', 2, 12 + 8 + len(js) + len(rest)) + struct.pack('<I', len(js)) + b'JSON' + js + rest)
