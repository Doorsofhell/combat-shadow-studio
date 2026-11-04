"""1.18 (correctif n° 4, docs/coachs-3d/CORRECTIFS_IDENTIFIES.md): fairs away the shape of the bikini sculpted in the
Sports_Female_01 body (Inaya, Amara), in place in photo.glb.

  python3 tools/generator/rocketbox/fair_bikini.py public/coaches/inaya/photo.glb [edge_cm]

Verified finding (04/11, Lab captures without outfit, normal map and colour map switched off): the bikini top is not a
layer on the skin, it IS the surface. Its pieces (separate parts of the body mesh, UV islands at v > 0.78) fill holes
in the skin: removing them leaves a hole under the breasts, round the neck and across the back (ray test: no skin
under 92 % of their points). Their shape still draws the garment after the 1.15 Taubin smoothing (which keeps the
shapes it smooths): the halter strap round the neck stands off as a cord, the back band as a ridge, the edges of the
cups and the under-band as lines, so the bust reads as a part fitted into the body.

Method (geometry only: the same points, UVs, skin weights and expression morphs; only folded hem triangles removed):
- points at the same place are merged across the pieces, the body and the head (welded surface);
- the trunk is read as a height field around a vertical axis (radius as a function of the angle and the height; the
  axis of the neck above the shoulders): the points of the strap, of the back band and of the cups' outline (closer
  than edge_cm to the cup's border), with a few rings of skin round them, take the radius of a thin plate spline
  fitted on the trunk skin around them (5 cm window, arm skin excluded). They move along the radius only, so the
  shape of the trunk is kept while the cord, the ridge and the lines of the garment disappear. The middle of the
  cups is held: the breasts keep their volume;
- the border points of the pieces are put back on the surface next to them (Blender BVH, 4 mm);
- the borders of the pieces are folded under like hems: once the surface round them is smooth, those triangles face
  inward and show as hairlines. The triangles of the region facing the axis are removed;
- the skin round the shoulder joints is left as it is (ARM_KEEP, as in flatten_halter.py: smoothed there, the side
  of the cups folded more sharply under the arm in the guard);
- normals recomputed over the moved surface and shared by the points at the same place (no shading seam).
The outfits hide body points by position: regenerate them after (regen_outfits.sh). The expression morphs are
offsets of the face only: they stay valid (positions of the face unchanged).
"""
import sys, os, json, struct
from collections import defaultdict
import numpy as np

path = sys.argv[1]
EDGE = float(sys.argv[2]) / 100 if len(sys.argv) > 2 else 0.025
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


# skin primitives (body, head); the head's vertex buffer is shared with the eyes and hair cards (their faces are left out)
prims = []
for m in J['meshes']:
    for p in m['primitives']:
        name = J['materials'][p['material']]['name']
        if not (name.endswith('_body') or name.endswith('_head')):
            continue
        k = p['attributes']['POSITION']
        prims.append(dict(name=name, P=view(k), N=view(p['attributes']['NORMAL']), UV=view(p['attributes']['TEXCOORD_0']),
                          F=np.array(view(p['indices'])).astype(int).reshape(-1, 3), pa=k))
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

# welded surface: one point per place over the skin primitives. The pieces were cut and welded by hand: points that
# belong together can sit up to a millimetre apart, so points closer than WELD are merged (else they part when moved
# and the seam opens as a white hairline)
from scipy.spatial import cKDTree
WELD = float(os.environ.get('WELD', '0.0015'))
allv = np.concatenate([np.asarray(p['P'], np.float64) for p in prims])
par = np.arange(len(allv))


def root(x):
    while par[x] != x:
        par[x] = par[par[x]]
        x = par[x]
    return x


for a, b in cKDTree(allv).query_pairs(WELD):
    ra, rb = root(a), root(b)
    if ra != rb:
        par[max(ra, rb)] = min(ra, rb)
roots = np.array([root(i) for i in range(len(allv))])
uniq, inv = np.unique(roots, return_inverse=True)
G = np.zeros((len(uniq), 3))
np.add.at(G, inv, allv)
G /= np.bincount(inv)[:, None]
gof, o = [], 0
for p in prims:
    k = len(np.asarray(p['P']))
    gof.append(inv[o:o + k])
    o += k
n = len(G)
# small pieces welded to the bikini (the knots)
for c, s in comps.items():
    if c in bik or len(s) > 60 or P[s, 1].min() < 1.15:
        continue
    if any(set(gof[0][s]) & set(gof[0][comps[b]]) for b in bik):
        bik.add(c)
cup = max(bik, key=lambda c: P[comps[c], 2].max())  # the piece in front, over the breasts
flat = bik - {cup}
FG = np.concatenate([gof[pi][p['F']] for pi, p in enumerate(prims)])
FG = FG[(FG[:, 0] != FG[:, 1]) & (FG[:, 1] != FG[:, 2]) & (FG[:, 0] != FG[:, 2])]
# a triangle shared by two layers counts once (first winding kept: the normals need it)
_, first = np.unique(np.sort(FG, 1), axis=0, return_index=True)
FG = FG[np.sort(first)]
nb = defaultdict(set)
for a, b, c in FG:
    nb[a] |= {b, c}
    nb[b] |= {a, c}
    nb[c] |= {a, b}


def rings(seed, k, exclude=frozenset()):
    region, ring = set(seed), set(seed)
    for _ in range(k):
        ring = {y for x in ring for y in nb[x]} - region - exclude
        region |= ring
    return region


# the pieces are not all stitched to the skin: about half of their border points have no skin point at their place
# (an open seam a few millimetres wide). Each open border point near the bikini is tied to the closest open border
# point across the seam (virtual edge), so that the rings of skin round the pieces cross those seams.
ec = defaultdict(int)
for a, b, c in FG:
    for e in ((a, b), (b, c), (c, a)):
        ec[tuple(sorted(e))] += 1
open_pts = np.array(sorted({v for e, k in ec.items() if k == 1 for v in e}))
SEAM = float(os.environ.get('SEAM', '0.02'))
_near_bik = rings(set().union(*[set(gof[0][comps[c]]) for c in bik]), 4)
ties = []
for v in open_pts:
    if v not in _near_bik:
        continue
    d = np.linalg.norm(G[open_pts] - G[v], axis=1)
    d[open_pts == v] = np.inf
    for u in open_pts[np.argsort(d)[:3]]:
        if np.linalg.norm(G[u] - G[v]) < SEAM and u not in nb[v]:
            ties.append((v, u))
            break
for v, u in ties:
    nb[v].add(u)
    nb[u].add(v)
print(f'  {len(open_pts)} points de bord ouverts, {len(ties)} reliés à travers la couture')

# shoulders kept (bind positions of LeftArm / RightArm)
sk = J['skins'][0]
ibm = np.array(view(sk['inverseBindMatrices']), np.float64)
arms = [np.linalg.inv(ibm[k].reshape(4, 4).T)[:3, 3] for k, jn in enumerate(sk['joints'])
        if J['nodes'][jn].get('name', '').replace('mixamorig:', '') in ('LeftArm', 'RightArm')]
# within ARM_KEEP of the joints the skin is kept: faired there (strap ends, armpit, side of the cups), it folds more
# sharply over the shoulder and under the arm in the guard (deformation-v1100.test.ts, 0.10 and 0.13 tried: fails)
ARM_KEEP = float(os.environ.get('ARM_KEEP', '0.15'))
RINGS_FLAT = int(os.environ.get('RINGS_FLAT', '3'))
RINGS_CUP = int(os.environ.get('RINGS_CUP', '2'))
RINGS_FIXED = int(os.environ.get('RINGS_FIXED', '2'))
near_arm = {g for g in range(n) if any(np.linalg.norm(G[g] - a) < ARM_KEEP for a in arms)}

flat_pts = set()
for c in flat:
    flat_pts |= set(gof[0][comps[c]])
cup_pts = set(gof[0][comps[cup]])
# the cup's border: its points on its own open edges or on the edges it shares with the skin
edge_count = defaultdict(int)
for f in body['F'][lab[body['F'][:, 0]] == cup]:
    for a, b in ((0, 1), (1, 2), (2, 0)):
        e = tuple(sorted((f[a], f[b])))
        edge_count[e] += 1
border = {gof[0][v] for e, c in edge_count.items() if c == 1 for v in e}
bd = np.array(sorted(border))
cup_arr = np.array(sorted(cup_pts))
dist = np.min(np.linalg.norm(G[cup_arr][:, None, :] - G[bd][None, :, :], axis=2), axis=1)
cup_edge = {int(g) for g, d in zip(cup_arr, dist) if d < EDGE}

from scipy.interpolate import RBFInterpolator

# points of the trunk, neck and head (dominant bone), the only ones a fit may lean on: the arms stand beside the chest
joint_names = [J['nodes'][j].get('name', '').replace('mixamorig:', '') for j in sk['joints']]
trunk_j = np.array([not any(k in nm for k in ('Arm', 'Hand', 'UpLeg', 'Leg', 'Foot', 'Toe')) for nm in joint_names])
trunk = np.zeros(n, bool)
for pi, p in enumerate(prims):
    a = J['meshes'][0]['primitives']
    pr = next(q for m in J['meshes'] for q in m['primitives'] if q['attributes']['POSITION'] == p['pa'])
    JN = np.array(view(pr['attributes']['JOINTS_0'])).astype(int)
    W = np.array(view(pr['attributes']['WEIGHTS_0']), np.float64)
    dom = JN[np.arange(len(JN)), W.argmax(1)]
    trunk[gof[pi]] = trunk_j[dom]

all_bik = flat_pts | cup_pts
neck_pts = set(gof[0][comps[max(flat, key=lambda c: P[comps[c], 1].mean())]])  # the strap round the neck
band_pts = flat_pts - neck_pts
X = G.copy()
SMOOTH = float(os.environ.get('SMOOTH', '1e-6'))
WIN = float(os.environ.get('WIN', '0.05'))


def fill(free, axis_xz, front, label):
    """radial height field over a vertical cylinder: the free points take the radius of the smooth surface fitted
    through the held points around them (thin-plate spline in (arc length, height))"""
    free = np.array(sorted({g for g in free - near_arm if trunk[g]}))
    if not len(free):
        return free
    c = np.array([axis_xz[0], 0, axis_xz[1]])

    def cyl(Y):
        d = Y - c
        th = np.arctan2(d[:, 0], d[:, 2] if front else -d[:, 2])
        r = np.hypot(d[:, 0], d[:, 2])
        return th, r

    th, r = cyl(G)
    R0 = np.median(r[free])
    uv = np.stack([th * R0, G[:, 1]], 1)
    lo, hi = uv[free].min(0) - WIN, uv[free].max(0) + WIN
    side = (G[:, 2] - c[2]) * (1 if front else -1) > -0.06  # same side of the body (not the far wall)
    held = np.array([g for g in range(n) if g not in free_all and np.all(uv[g] >= lo) and np.all(uv[g] <= hi) and side[g] and trunk[g]])
    f = RBFInterpolator(uv[held], r[held], kernel='thin_plate_spline', smoothing=SMOOTH, neighbors=80)
    r_new = f(uv[free])
    d = G[free] - c
    dn = d.copy()
    dn[:, 1] = 0
    dn /= np.maximum(np.linalg.norm(dn, axis=1, keepdims=True), 1e-9)
    X[free] = G[free] + dn * (r_new - r[free])[:, None]
    print(f'  {label}: {len(free)} points, {len(held)} points d’appui, écart de rayon moyen {np.abs(r_new - r[free]).mean() * 1000:.1f} mm, max {np.abs(r_new - r[free]).max() * 1000:.1f} mm')
    return free


free_all = rings(band_pts, RINGS_FLAT) | rings(neck_pts, RINGS_FLAT) | rings(cup_edge, RINGS_CUP)
free_all -= near_arm
neck_c = G[list(neck_pts)][:, [0, 2]].mean(0)
neck_y = G[list(neck_pts), 1].min() + 0.02
torso_c = np.array([0.0, (G[list(cup_pts), 2].max() + G[list(band_pts), 2].min()) / 2])
print(f'{path}: pièces {sorted(int(c) for c in bik)} (bonnets {cup}, bretelle {len(neck_pts)}, bande {len(band_pts)}, bord des bonnets {len(cup_edge)})')
fill(rings(neck_pts, RINGS_FLAT), neck_c, False, 'bretelle du cou')
back = {g for g in rings(band_pts, RINGS_FLAT) if G[g, 2] < torso_c[1]}
fill(back, torso_c, False, 'bande du dos')
front = (rings(cup_edge, RINGS_CUP) | rings(band_pts, RINGS_FLAT)) - back
fill(front, torso_c, True, 'bonnets et sous-bande')
fi = np.array(sorted(free_all))
# close the seams: each open border point of the region (an edge with one triangle) is put on the closest surface
# across the seam (a triangle that does not touch it, closer than SNAP); T-junctions and the millimetre gaps between
# the hand-welded pieces would otherwise open as hairlines once the surface has moved
import bpy  # noqa: F401 (Blender's mathutils)
from mathutils import Vector
from mathutils.bvhtree import BVHTree
SNAP = float(os.environ.get('SNAP', '0.004'))
zone = rings(set(fi.tolist()), 2)
ec2 = defaultdict(int)
for a_, b_, c_ in FG:
    for e in ((a_, b_), (b_, c_), (c_, a_)):
        ec2[tuple(sorted(e))] += 1
seam_pts = sorted({v for e, k in ec2.items() if k == 1 for v in e if v in zone})
inc = defaultdict(set)
for t, f in enumerate(FG):
    for v in f:
        inc[v].add(t)
for _ in range(2):
    bvh = BVHTree.FromPolygons([Vector(v) for v in X], FG.tolist(), all_triangles=True)
    snapped = 0
    for v in seam_pts:
        own = set().union(*(inc[u] for u in nb[v] | {v}))
        best = None
        for loc, nrm, t, d in bvh.find_nearest_range(Vector(X[v]), SNAP):
            if t not in own and (best is None or d < best[1]):
                best = (loc, d)
        if best is not None:
            X[v] = np.array(best[0])
            snapped += 1
print(f'  coutures : {len(seam_pts)} points de bord, {snapped} recollés à la surface voisine')
fi = np.array(sorted(set(fi.tolist()) | set(seam_pts)))
mv = np.linalg.norm(X[fi] - G[fi], axis=1)
print(f'  déplacement moyen {mv.mean() * 1000:.2f} mm, 95e centile {np.percentile(mv, 95) * 1000:.2f} mm, max {mv.max() * 1000:.2f} mm')

# the borders of the pieces are folded under like hems (rims a few millimetres wide, facing inward): once the
# surface around them is smooth they show as dark or light hairlines (1.12 drew the body from both sides because of
# them). The triangles of the region that face inward (towards the axis of the trunk or of the neck) are dropped.
# (round the shoulders the pieces are not faired, and removing their hems would open them: kept, see ARM_KEEP)
zone2 = rings(set(fi.tolist()), 2)
dropped = 0
for pi, p in enumerate(prims):
    g = gof[pi][p['F']]
    fnp = np.cross(X[g[:, 1]] - X[g[:, 0]], X[g[:, 2]] - X[g[:, 0]])
    fnp /= np.maximum(np.linalg.norm(fnp, axis=1, keepdims=True), 1e-12)
    # outward = radial, from the axis of the trunk, or of the neck for the neck itself (within 7 cm of its axis)
    cen = X[g].mean(1)
    on_neck = (cen[:, 1] > neck_y) & (np.hypot(cen[:, 0] - neck_c[0], cen[:, 2] - neck_c[1]) < 0.07)
    ax = np.where(on_neck[:, None], np.array([neck_c[0], 0, neck_c[1]]), np.array([torso_c[0], 0, torso_c[1]]))
    rad = cen - ax
    rad[:, 1] = 0
    rad /= np.maximum(np.linalg.norm(rad, axis=1, keepdims=True), 1e-12)
    out = rad
    inz = np.isin(g, list(zone2)).all(1) & trunk[g].any(1)
    bad = inz & ((fnp * out).sum(1) < -0.3)
    dropped += int(bad.sum())
    p['F_keep'] = p['F'][~bad]
print(f'  {dropped} triangles d’ourlet tournés vers l’intérieur retirés')
FGk = np.concatenate([gof[pi][p['F_keep']] for pi, p in enumerate(prims)])
FGk = FGk[(FGk[:, 0] != FGk[:, 1]) & (FGk[:, 1] != FGk[:, 2]) & (FGk[:, 0] != FGk[:, 2])]
_, first = np.unique(np.sort(FGk, 1), axis=0, return_index=True)
FGk = FGk[np.sort(first)]
# last pass on the spikes left by the seams and the hems removed (a few points at the side of the band and at the
# back): a point standing more than RELIEF off the plane of its neighbours is brought back to RELIEF, along the
# normal of that plane only, so the smooth surface around (and the breasts' volume) is not touched
RELIEF = 0.0015
nbk = defaultdict(set)
for a_, b_ in ((0, 1), (1, 2), (2, 0)):
    for x_, y_ in zip(FGk[:, a_], FGk[:, b_]):
        nbk[x_].add(y_)
        nbk[y_].add(x_)
spiky = sorted(g for g in zone2 if g not in near_arm and len(nbk[g]) >= 3)
fixed_spikes = set()
for it in range(40):
    moved = 0
    for g in spiky:
        Qn = X[list(nbk[g])]
        c = Qn.mean(0)
        nn = np.zeros(3)
        for k in range(len(Qn)):  # Newell over all pairs, as buste-inaya-v1150.test.ts measures it
            for m_ in range(k + 1, len(Qn)):
                cr = np.cross(Qn[k] - c, Qn[m_] - c)
                nn += cr if cr @ nn >= 0 else -cr
        if nn @ nn < 1e-16:
            continue
        nn /= np.linalg.norm(nn)
        h = (X[g] - c) @ nn
        if abs(h) > RELIEF:
            X[g] -= nn * (h - np.sign(h) * RELIEF)
            fixed_spikes.add(g)
            moved += 1
    if not moved:
        break
print(f'  {len(fixed_spikes)} pointes ramenées à {RELIEF * 1000:.1f} mm du plan de leurs voisins')
# normals of the welded surface, area weighted, for the moved points and their ring
acc = np.zeros_like(X)
fn = np.cross(X[FGk[:, 1]] - X[FGk[:, 0]], X[FGk[:, 2]] - X[FGk[:, 0]])
for k in range(3):
    np.add.at(acc, FGk[:, k], fn)
touched = rings(set(fi.tolist()) | fixed_spikes, 1)
for pi, p in enumerate(prims):
    g = gof[pi]
    m = np.isin(g, list(touched))
    Pv, Nv = p['P'], p['N']
    Pv[m] = X[g[m]].astype(np.float32)
    nn = acc[g[m]]
    ln = np.linalg.norm(nn, axis=1, keepdims=True)
    nn = np.where(ln > 1e-12, nn / np.maximum(ln, 1e-12), np.asarray(Nv)[m])
    Nv[m] = nn.astype(np.float32)
    if len(p['F_keep']) < len(p['F']):
        pr = next(q for m_ in J['meshes'] for q in m_['primitives'] if q['attributes']['POSITION'] == p['pa'] and J['materials'][q['material']]['name'] == p['name'])
        ia = J['accessors'][pr['indices']]
        t_, s_ = CT[ia['componentType']]
        ibv = J['bufferViews'][ia['bufferView']]
        o_ = B0 + ibv.get('byteOffset', 0) + ia.get('byteOffset', 0)
        flat_idx = p['F_keep'].ravel().astype('<' + t_)
        raw[o_:o_ + flat_idx.nbytes] = flat_idx.tobytes()
        ia['count'] = int(len(flat_idx))
    a = J['accessors'][p['pa']]
    allp = np.asarray(Pv)
    a['min'] = allp.min(0).tolist()
    a['max'] = allp.max(0).tolist()
js = json.dumps(J, separators=(',', ':')).encode()
js += b' ' * ((4 - len(js) % 4) % 4)
rest = bytes(raw[20 + jl:])
open(path, 'wb').write(b'glTF' + struct.pack('<II', 2, 12 + 8 + len(js) + len(rest)) + struct.pack('<I', len(js)) + b'JSON' + js + rest)
