"""1.19 (Inaya rebuilt from a clean base, Youssef 05/11): removes the bikini top sculpted in the Sports_Female_01
body at its source, the low-poly .blend of face_transfer.py, before convert.py subdivides it.

  python3 tools/generator/rocketbox/clean_torso.py in.blend out.blend

Verified finding (05/11, the .blend of the rebuild): at low poly the bikini top is not a separate garment, it is the
skin surface itself (one welded, manifold piece: 736 faces, 422 points) shaped like a halter bikini: cups with a raised
outline, a strap round the neck, two back band halves and a knot. Every later fix (1.12 to 1.18) worked on the
subdivided copy, where the folded hems had already become thin tubes; here they are a few rows of points.

Method:
- the pieces are found by their texture islands (Blender v < 0.22 on the body material, above the waist);
- the strap, the back band, the knot and the outline of the cups (cup points within EDGE rows of its border), with
  RINGS rows of skin round them, take the height of a quadric fitted on the skin around each point (its 7 cm
  neighbourhood outside the region, in the tangent plane of that skin): the cord, the ridge and the hems go, the
  shape of the trunk stays; the middle of the cups is held, so the breasts keep their volume;
- a few passes of a light Laplacian smoothing on the region only, the outer ring held;
- points closer than MERGE (the collapsed hems) are merged and degenerate faces dissolved;
- the skin weights of the merged points are those of the kept point (same bones on both sides of a hem).
The texture islands of the pieces still hold the bikini's colour: skin_paint.py repaints them from the skin around.
"""
import bpy, bmesh, sys, os, math
import numpy as np
from mathutils import Vector
from scipy.spatial import cKDTree

src, out = sys.argv[-2], sys.argv[-1]
EDGE = int(os.environ.get('EDGE', '1'))
RINGS = int(os.environ.get('RINGS', '2'))
WIN = float(os.environ.get('WIN', '7'))  # cm, the mesh is in centimetres (armature scale 0.01)
KNN = int(os.environ.get('KNN', '36'))
MERGE = float(os.environ.get('MERGE', '0.35'))  # cm
NECK_HEAD = float(os.environ.get('NECK_HEAD', '147'))  # cm, as in skin_paint.py
bpy.ops.wm.open_mainfile(filepath=src)
me = [o for o in bpy.data.objects if o.type == 'MESH' and len(o.data.vertices) > 500][0]
mats = [m.name for m in me.data.materials]
# the original normals travel with the corners through the bmesh edits (see the end)
_cn = me.data.attributes.new('cn_orig', 'FLOAT_VECTOR', 'CORNER')
_cn.data.foreach_set('vector', [c for n in me.data.corner_normals for c in n.vector])
bm = bmesh.new()
bm.from_mesh(me.data)


def _ordered(items):
    # 1.19: sets of BMesh elements iterate in memory order, which changed the result of the collapses from one run
    # to the next; sorted by index, the build is the same every time
    bm.verts.index_update()
    bm.edges.index_update()
    bm.faces.index_update()
    return sorted(items, key=lambda x: x.index)
bm.verts.ensure_lookup_table()
bm.faces.ensure_lookup_table()
uv = bm.loops.layers.uv.active


def is_bik(f):
    return mats[f.material_index].endswith('body') and max(l[uv].uv[1] for l in f.loops) < 0.22 and min(v.co.z for v in f.verts) > 115


# first the folded hems (rows of points a fraction of a millimetre apart round the pieces) are merged, so the pieces
# become plain skin rows before their shape is corrected
_bv = {v for f in bm.faces if is_bik(f) for v in f.verts}
for _ in range(2):
    _bv |= {w for v in _bv for e in v.link_edges for w in e.verts}
n0 = len(bm.verts)
bmesh.ops.remove_doubles(bm, verts=_ordered(_bv), dist=MERGE)
bmesh.ops.dissolve_degenerate(bm, dist=MERGE * 0.2, edges=_ordered({e for v in _bv if v.is_valid for e in v.link_edges}))
bm.verts.ensure_lookup_table()
bm.faces.ensure_lookup_table()
bm.verts.index_update()
bm.faces.index_update()
bm.normal_update()
print(f'{n0 - len(bm.verts)} points d’ourlet fusionnés')
# slivers left between the pieces of the bikini (the knot of the back band): faces of skin whose every point
# belongs to the bikini, mapped on another part of the texture (first pass of 1.19, 05/11: two light lines in the
# middle of the back). They take the texture coordinates of the bikini at their points, so skin_paint.py repaints them
_bikv = {v for f in bm.faces if is_bik(f) for v in f.verts}
nsl = 0
for f in bm.faces:
    if is_bik(f) or not all(v in _bikv for v in f.verts) or not mats[f.material_index].endswith('body'):
        continue
    new_uv = []
    for l in f.loops:
        o = next((m for m in l.vert.link_loops if m.face is not f and is_bik(m.face)), None)
        new_uv.append(o[uv].uv.copy() if o else None)
    if all(u is not None for u in new_uv):
        for l, u in zip(f.loops, new_uv):
            l[uv].uv = u
        nsl += is_bik(f)
print(f'{nsl} faces de peau entre les pièces rattachées au haut de maillot')
bik = [f for f in bm.faces if is_bik(f)]
bset = {f.index for f in bik}


def same_uv(e):
    ls = list(e.link_loops)
    if len(ls) != 2:
        return False
    a, b = ls
    ua = {a.vert.index: a[uv].uv.copy(), a.link_loop_next.vert.index: a.link_loop_next[uv].uv.copy()}
    ub = {b.vert.index: b[uv].uv.copy(), b.link_loop_next.vert.index: b.link_loop_next[uv].uv.copy()}
    return all((ua[k] - ub[k]).length < 1e-5 for k in ua)


# texture islands of the pieces
seen, islands = set(), []
for f in bik:
    if f.index in seen:
        continue
    st, cf = [f], []
    seen.add(f.index)
    while st:
        g = st.pop()
        cf.append(g)
        for e in g.edges:
            if not same_uv(e):
                continue
            for h in e.link_faces:
                if h.index in bset and h.index not in seen:
                    seen.add(h.index)
                    st.append(h)
    islands.append(cf)
islands.sort(key=len, reverse=True)
cup = islands[0]
cupv = {v.index for f in cup for v in f.verts}
allv = {v.index for f in bik for v in f.verts}
print(f'pièces : {[len(i) for i in islands]} faces ; bonnets {len(cup)} faces')


def ring(s):
    return {w.index for i in s for e in bm.verts[i].link_edges for w in e.verts} - s


# border of the cups (points of the cups next to a point that is not on the cups)
border = {i for i in cupv if any(w.index not in cupv for e in bm.verts[i].link_edges for w in e.verts)}
rim = set(border)
for _ in range(EDGE):
    rim |= ring(rim)
region = allv - cupv
for _ in range(RINGS):
    region |= ring(region) - cupv
rim -= region
print(f'{len(region)} points refaits (bretelle, bande, nœud), {len(rim)} points du bord des bonnets lissés')
P = np.array([tuple(v.co) for v in bm.verts])
N = np.array([tuple(v.normal) for v in bm.verts])
# trunk and neck skin only (not the arms): the support points of the fit
dom = {}
gn = {g.index: g.name for g in me.vertex_groups}
dl = bm.verts.layers.deform.active
for v in bm.verts:
    if dl and v[dl]:
        dom[v.index] = gn[max(v[dl].items(), key=lambda x: x[1])[0]]
ARMLIKE = ('UpperArm', 'Forearm', 'Hand', 'Finger', 'Thigh', 'Calf', 'Foot', 'Toe')
trunk = np.array([not any(k in dom.get(i, '') for k in ARMLIKE) for i in range(len(P))])
supp = np.array([i for i in range(len(P)) if i not in region and i not in cupv and i not in rim and trunk[i]])
tree = cKDTree(P[supp])
X = P.copy()
idx = np.array(sorted(region))
# the back band and the knot (a wide flat strip on the curve of the back) take the quadric of the skin around; the
# strap round the neck (narrow, between neck and chest skin) is filled by the smoothing below alone
NECK_Z = float(os.environ.get('NECK_Z', '134'))
for i in ([j for j in idx if P[j][2] < NECK_Z] if os.environ.get('FIT', '1') == '1' else []):
    dd, kk = tree.query(P[i], k=KNN)
    near = supp[kk]
    Q = P[near]
    c = Q.mean(0)
    # tangent frame from the skin normals around
    n = N[near].mean(0)
    n /= np.linalg.norm(n)
    t1 = np.cross(n, [0, 0, 1.0])
    if np.linalg.norm(t1) < 1e-3:
        t1 = np.cross(n, [1.0, 0, 0])
    t1 /= np.linalg.norm(t1)
    t2 = np.cross(n, t1)
    L = Q - c
    u, w, h = L @ t1, L @ t2, L @ n
    A = np.stack([np.ones_like(u), u, w, u * u, u * w, w * w], 1)
    sc = max(dd.max(), 1e-3)
    wt = np.exp(-((u * u + w * w) / (0.7 * sc) ** 2))
    coef, *_ = np.linalg.lstsq(A * wt[:, None], h * wt, rcond=None)
    p = P[i] - c
    pu, pw = p @ t1, p @ t2
    X[i] = c + pu * t1 + pw * t2 + n * (coef @ [1, pu, pw, pu * pu, pu * pw, pw * pw])
d = np.linalg.norm(X[idx] - P[idx], axis=1)
print(f'déplacement moyen {d.mean():.2f} cm, max {d.max():.2f} cm, 95e centile {np.percentile(d, 95):.2f} cm')
# light smoothing of the region, outer ring held
nbr = {i: [w.index for e in bm.verts[i].link_edges for w in e.verts if w.index != i] for i in idx}
hi = np.array([i for i in idx if P[i][2] >= NECK_Z])
lo = np.array([i for i in idx if P[i][2] < NECK_Z])
# back band and knot: the radius round the vertical axis of the chest is smoothed (cylindrical coordinates), so the
# ridge is filled without flattening the curve of the back (a smoothing in x, y, z sinks a strip on a convex surface)
if len(lo):
    chest = P[[i for i in range(len(P)) if 116 < P[i][2] < 127 and trunk[i]]]
    ax = chest[:, :2].mean(0)
    for it in range(int(os.environ.get('SMOOTH_BAND', '60'))):
        R = np.linalg.norm(X[:, :2] - ax, axis=1)
        Y = X.copy()
        for i in lo:
            r = R[i] + 0.5 * (R[nbr[i]].mean() - R[i])
            d = (X[i, :2] - ax) / max(R[i], 1e-6)
            Y[i, :2] = ax + d * r
        X = Y
for it in range(int(os.environ.get('SMOOTH_NECK', '80'))):
    Y = X.copy()
    for i in (idx if it < int(os.environ.get('SMOOTH', '12')) else hi):
        Y[i] = X[i] + 0.5 * (X[nbr[i]].mean(0) - X[i])
    X = Y
# rim of the cups: Taubin smoothing (no shrinking), so the raised outline melts into the breast
ridx = np.array(sorted(rim))
rnb = {i: [w.index for e in bm.verts[i].link_edges for w in e.verts if w.index != i] for i in ridx}
for _ in range(int(os.environ.get('RIM_ITER', '12'))):
    for k in (0.5, -0.53):
        Y = X.copy()
        for i in ridx:
            Y[i] = X[i] + k * (X[rnb[i]].mean(0) - X[i])
        X = Y
idx = np.array(sorted(set(idx.tolist()) | rim))
# knot of the back band (middle of the back): its small pieces kept a raised outline and a fold (first pass of 1.19,
# 05/11, Youssef « ça fait pas très naturel »). The patch round it is rebuilt as a membrane (3D Laplacian, the ring
# of skin round it held: removes every fold), then its radius round the chest's vertical axis is smoothed from the
# ring (restores the curve of the back the membrane flattens)
KX, KZ = float(os.environ.get('KNOT_X', '10')), (float(os.environ.get('KNOT_Z0', '115')), float(os.environ.get('KNOT_Z1', '133')))
kn = [i for i in range(len(X)) if abs(X[i, 0]) < KX and X[i, 1] > 3 and KZ[0] < X[i, 2] < KZ[1] and trunk[i]]
kset = set(kn)
knb = {i: [w.index for e in bm.verts[i].link_edges for w in e.verts if w.index != i] for i in kn}
for _ in range(int(os.environ.get('KNOT_ITER', '120'))):
    Y = X.copy()
    for i in kn:
        Y[i] = X[i] + 0.6 * (X[knb[i]].mean(0) - X[i])
    X = Y
chest = P[[i for i in range(len(P)) if 116 < P[i][2] < 127 and trunk[i]]]
ax = chest[:, :2].mean(0)
for _ in range(int(os.environ.get('KNOT_ITER', '120'))):
    R = np.linalg.norm(X[:, :2] - ax, axis=1)
    Y = X.copy()
    for i in kn:
        r = R[i] + 0.6 * (R[knb[i]].mean() - R[i])
        d = (X[i, :2] - ax) / max(R[i], 1e-6)
        Y[i, :2] = ax + d * r
    X = Y
# front knot between the cups (05/11, test buste-inaya-v1180: 124 triangles turned towards the chest's axis, all in
# the cleavage, 1.25 to 1.27 m): the two folded pieces cross there in a pinch. A small membrane patch (3D Laplacian,
# ring held) between the breasts removes the fold; the breasts themselves are outside it
FX, FZ = float(os.environ.get('CLEAV_X', '5')), (float(os.environ.get('CLEAV_Z0', '120')), float(os.environ.get('CLEAV_Z1', '134')))
fr = [i for i in range(len(X)) if abs(X[i, 0]) < FX and X[i, 1] < -3 and FZ[0] < X[i, 2] < FZ[1] and trunk[i]]
fnb = {i: [w.index for e in bm.verts[i].link_edges for w in e.verts if w.index != i] for i in fr}
for _ in range(int(os.environ.get('CLEAV_ITER', '120'))):
    Y = X.copy()
    for i in fr:
        Y[i] = X[i] + 0.6 * (X[fnb[i]].mean(0) - X[i])
    X = Y
print(f'{len(fr)} points du pli entre les bonnets lissés')
idx = np.array(sorted(set(idx.tolist()) | kset | set(fr)))
print(f'{len(kn)} points du nœud du dos lissés')
for i in idx:
    bm.verts[i].co = Vector(X[i])
# the strap also crossed the head's texture at the base of the neck (its points kept the fold's normals there and
# drew a bright line on each shoulder): the whole trunk from the waist to the neck takes normals from its surface
_kverts = [bm.verts[i] for i in kset]
_fverts = [bm.verts[i] for i in fr]
redo = {bm.verts[i] for i in idx} | {v for v in bm.verts if 112 < v.co.z < NECK_HEAD and abs(v.co.x) < 30}
redo |= {w for v in redo for e in v.link_edges for w in e.verts}
# folded-back pieces lying on the skin (the knot: a piece of the band facing inward on the skin's face, 0.3 mm from
# it; after subdivision the two layers cross and drew two light ticks, 05/11): pairs of faces on the same points are
# both removed (the pocket closes), after merging points closer than 2.5 mm round the knot
bmesh.ops.remove_doubles(bm, verts=_ordered({w for v in _kverts if v.is_valid for e in v.link_edges for w in e.verts}), dist=float(os.environ.get('FOLD_MERGE', '0.25')))
_seen, _dup = {}, []
for f in bm.faces:
    k = frozenset(v.index for v in f.verts)
    if k in _seen:
        _dup += [f, _seen[k]]
    else:
        _seen[k] = f
# remove_doubles itself keeps one face of such a pair: the one left facing against its neighbours goes too
bm.normal_update()
for f in {f for v in redo if v.is_valid for f in v.link_faces}:
    if any(len(e.link_faces) > 2 for e in f.edges):
        ns = [g.normal for e in f.edges for g in e.link_faces if g is not f]
        m_ = sum(ns, Vector())
        if m_.length > 0 and f.normal.dot(m_.normalized()) < 0:
            _dup.append(f)
bmesh.ops.delete(bm, geom=_ordered(set(_dup)), context='FACES_ONLY')
bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
def fill_holes():
    _hb = [e for e in bm.edges if e.is_boundary and all(110 < v.co.z < 150 and abs(v.co.x) < 25 for v in e.verts)]
    # a slit (two free edges side by side, left by a collapse) cannot be filled: its points are merged first
    if _hb:
        bmesh.ops.remove_doubles(bm, verts=_ordered({v for e in _hb for v in e.verts}), dist=0.4)
        _hb = [e for e in bm.edges if e.is_valid and e.is_boundary and all(110 < v.co.z < 150 and abs(v.co.x) < 25 for v in e.verts)]
    _new = bmesh.ops.holes_fill(bm, edges=_hb, sides=40)['faces'] if _hb else []
    # loops holes_fill leaves open (small quads of the cleavage): closed by hand, point after point along the loop
    left_ = [e for e in bm.edges if e.is_valid and e.is_boundary and all(110 < v.co.z < 150 and abs(v.co.x) < 25 for v in e.verts)]
    seen_ = set()
    for e0 in left_:
        if e0 in seen_:
            continue
        loop_, v, e = [e0.verts[0]], e0.verts[1], e0
        seen_.add(e0)
        while v is not loop_[0] and len(loop_) < 40:
            loop_.append(v)
            e = next((x for x in v.link_edges if x is not e and x.is_boundary and x in left_ and x not in seen_), None)
            if e is None:
                break
            seen_.add(e)
            v = e.other_vert(v)
        if v is loop_[0] and len(loop_) >= 3:
            try:
                f_ = bm.faces.new(loop_)
                _new.append(f_)
            except ValueError:
                pass
    if _new:
        _new = bmesh.ops.triangulate(bm, faces=_new)['faces']
    newset = set(_new)
    # texture coordinates: each new triangle is unfolded next to a neighbour across their shared edge (same shape
    # as in 3D, on the other side of the edge), so it gets a small patch of its own next to that skin; skin_paint.py
    # repaints it with the skin around (05/11: copying the coordinates of the faces round each point spanned several
    # islands and painted a band down the middle line; mapping it on one point left a dark patch)
    todo = list(_new)
    for _pass in range(4):
        left = []
        for f in todo:
            done = False
            for e in f.edges:
                g = next((x for x in e.link_faces if x is not f and (x not in newset or getattr(x, 'tag', False))), None)
                if g is None:
                    continue
                a_, b_ = e.verts
                c_ = next(v for v in f.verts if v not in (a_, b_))
                ga = next(l for l in g.loops if l.vert is a_)[uv].uv.copy()
                gb = next(l for l in g.loops if l.vert is b_)[uv].uv.copy()
                gc = next(l for l in g.loops if l.vert not in (a_, b_))[uv].uv.copy()
                ab3 = b_.co - a_.co
                t = (c_.co - a_.co).dot(ab3) / max(ab3.length_squared, 1e-12)
                h = ((c_.co - a_.co) - ab3 * t).length / max(ab3.length, 1e-12)
                d2 = gb - ga
                n2 = Vector((-d2.y, d2.x))
                if (gc - ga).dot(n2) > 0:
                    n2 = -n2
                uc = ga + d2 * t + n2 * h
                for l in f.loops:
                    l[uv].uv = ga if l.vert is a_ else gb if l.vert is b_ else uc
                f.material_index = g.material_index
                f.tag = True
                done = True
                break
            if not done:
                left.append(f)
        todo = left
        if not todo:
            break
    # left without a mapped neighbour, or spanning far on the texture: mapped small (1 mm on the texture) at the
    # coordinates of a skin face round it, whose colour it takes
    for f in _new:
        us = [l[uv].uv.copy() for l in f.loops]
        if f in todo or max((a - b).length for a in us for b in us) > 0.06:
            g = next((x for v in f.verts for x in v.link_faces if x not in newset), None)
            if g is None:
                continue
            ref = sum((l[uv].uv for l in g.loops), Vector((0, 0))) / len(g.loops)
            for k, l in enumerate(f.loops):
                l[uv].uv = ref + Vector(((0.001, 0), (0, 0.001), (-0.001, -0.001))[k % 3])
            f.material_index = g.material_index
    print(f'{len(_new)} trous refermés')


# the small holes the removed pairs leave are closed; the new faces take the texture coordinates and material of
# the skin round them (one face of skin at each point)
fill_holes()
print(f'{len(set(_dup))} faces repliées sur la peau retirées')
# only round the rebuilt points (a pass over the whole mesh opened the corners of the mouth)
bmesh.ops.dissolve_degenerate(bm, dist=0.02, edges=_ordered({e for v in redo if v.is_valid for e in v.link_edges}))
# the knot's patch: its thinnest triangles (a few mm wide, between the pieces) drew two light ticks after the
# membrane: their short edges are collapsed
bm.verts.ensure_lookup_table()
_ke = _ordered({e for v in _kverts if v.is_valid for e in v.link_edges})
bmesh.ops.dissolve_degenerate(bm, dist=float(os.environ.get('KNOT_DEG', '0.45')), edges=_ke)
# the pinch between the cups: its folded slivers collapsed the same way (0.6 cm there, 0.45 on the back, where 0.6
# left two faces on one edge)
bmesh.ops.dissolve_degenerate(bm, dist=float(os.environ.get('CLEAV_DEG', '0.6')),
                              edges=_ordered({e for v in _fverts if v.is_valid for e in v.link_edges}))
# after the fills and the collapses the bottom of the cleavage keeps small folds (triangles turned towards the inside
# of the body, buste-inaya-v1180, and points 4 mm out of the plane of their neighbours, buste-inaya-v1150): the points
# of that box are relaxed once more towards the middle of their ring, the skin round it holding them
_cz0, _cz1 = float(os.environ.get('POST_Z0', '122')), float(os.environ.get('POST_Z1', '132'))
_post = [v for v in bm.verts if v.is_valid and ((abs(v.co.x) < float(os.environ.get('POST_X', '4')) and v.co.y < -3
         and _cz0 < v.co.z < _cz1) or (abs(v.co.x) < float(os.environ.get('POST_BACK_X', '0')) and v.co.y > 3
         and 118 < v.co.z < 130))]
_post.sort(key=lambda v: v.index)
for _ in range(int(os.environ.get('POST_ITER', '40'))):
    new_ = [sum((e.other_vert(v).co for e in v.link_edges), Vector()) / len(v.link_edges) for v in _post]
    for v, q in zip(_post, new_):
        v.co = v.co * 0.5 + q * 0.5
print(f'{len(_post)} points du fond du décolleté détendus')
# what stays folded there (and at the back knot) is a flap of the old garment's inner faces, turned towards the inside of the body: those faces
# go and the hole is closed again (at most three rounds)
_band = [v.co for v in bm.verts if 115 < v.co.z < 135 and abs(v.co.x) < 12]
_ay = sum(c.y for c in _band) / len(_band)
for _r in range(int(os.environ.get('FLAP_ROUNDS', '8'))):
    # faces of the fills may come out wound the wrong way: made consistent first, so only real folds are caught
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    flap_ = []
    for f in bm.faces:
        c_ = f.calc_center_median()
        if not ((abs(c_.x) < 6 and c_.y < -3 and 120 < c_.z < 134) or (abs(c_.x) < float(os.environ.get('FLAP_BACK_X', '4')) and c_.y > 3 and 115 < c_.z < 133)):
            continue
        r_ = Vector((c_.x, c_.y - _ay, 0))
        if r_.length > 0 and f.normal.dot(r_.normalized()) < float(os.environ.get('FLAP_T', '-0.3')):
            flap_.append(f)
    if not flap_:
        break
    if os.environ.get('FLAP_DEBUG'):
        for f in flap_:
            c_ = f.calc_center_median()
            print('FLAP', _r, round(c_.x, 1), round(c_.y, 1), round(c_.z, 1), 'arête max', round(max(e.calc_length() for e in f.edges), 2), 'aire', round(f.calc_area(), 3))
    # each folded face is shrunk to its centre (a hole filled flat there folded the same way again)
    n_ = 0
    _merged = []
    for f in _ordered(flap_):
        # small folds only: a large face merged to its centre pulled the skin round it in (a dent 7 cm off the spine)
        if not f.is_valid:
            continue
        if max(e.calc_length() for e in f.edges) > float(os.environ.get('FLAP_MAX_EDGE', '1.2')):
            # a larger one loses its shortest edge only (merged whole, it pulled the skin round it by centimetres)
            e_ = min(f.edges, key=lambda e: e.calc_length())
            vs = list(e_.verts)
            c_ = (vs[0].co + vs[1].co) / 2
        else:
            vs = list(f.verts)
            c_ = f.calc_center_median()
        bmesh.ops.pointmerge(bm, verts=vs, merge_co=c_)
        n_ += 1
        _merged.append(c_.copy())
    # only round the merged points (a pass over the whole mesh opens the corners of the mouth)
    _me = [e for e in bm.edges if any((v.co - q).length < 2.0 for v in e.verts for q in _merged)]
    bmesh.ops.dissolve_degenerate(bm, dist=0.01, edges=_me)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    print(f'{n_} faces repliées (décolleté, nœud du dos) ramenées à un point')
# a face left on an edge shared by three faces after the fill and the collapses, facing against its neighbours, goes as well
for _round in range(4):
    for _ in range(3):
        bm.normal_update()
        bad_ = []
        for f in bm.faces:
            if any(len(e.link_faces) > 2 for e in f.edges):
                ns = [g.normal for e in f.edges for g in e.link_faces if g is not f]
                m_ = sum(ns, Vector())
                if m_.length > 0 and f.normal.dot(m_.normalized()) < 0:
                    bad_.append(f)
        # otherwise, on an edge shared by three faces, the smallest one goes
        for e in bm.edges:
            if len(e.link_faces) > 2 and not any(g in bad_ for g in e.link_faces):
                bad_.append(min(e.link_faces, key=lambda g: g.calc_area()))
        if not bad_:
            break
        bmesh.ops.delete(bm, geom=bad_, context='FACES_ONLY')
        print(f'{len(bad_)} faces retournées en trop retirées')
    fill_holes()
    if not any(len(e.link_faces) > 2 for e in bm.edges) and not any(
            e.is_boundary and all(110 < v.co.z < 150 and abs(v.co.x) < 25 for v in e.verts) for e in bm.edges):
        break
print('bords libres', sum(1 for e in bm.edges if e.is_boundary), ', arêtes à 3 faces', sum(1 for e in bm.edges if len(e.link_faces) > 2))
# 1.19 (Youssef, 05/11: « pour le corps nu, je veux que les tétons soient visibles », « pas visibles sous les
# vêtements, il faut que ce soit naturel »): the cups of the old bikini had flattened the tip of each breast. A soft
# nipple is raised there (3 mm, 0.65 cm wide, along the normal); skin_paint.py paints the areola round it. The
# tops stand 3.5 mm or more off the skin and hide the skin under them: nothing shows through the clothes
NIP_H = float(os.environ.get('NIP_H', '0.3'))
NIP_R = float(os.environ.get('NIP_R', '0.65'))
bm.normal_update()
NIPPLES = []
for sx in (1, -1):
    cand = [v for v in bm.verts if 115 < v.co.z < 133 and 5 < sx * v.co.x < 16 and v.co.y < 0]
    # the tip of the breast seen along its axis, turned 20° outward (the straight-ahead apex sits against the
    # cleavage, 6.8 cm off the middle)
    ax_ = Vector((sx * math.sin(math.radians(20)), -math.cos(math.radians(20)), 0))
    apex = max(cand, key=lambda v: v.co.dot(ax_))
    NIPPLES.append(apex.co.copy())
    nrm = apex.normal.copy()
    for v in cand:
        d = (v.co - apex.co).length
        if d < NIP_R * 3:
            v.co += nrm * NIP_H * math.exp(-(d / NIP_R) ** 2)
print('tétons', [tuple(round(c, 1) for c in q) for q in NIPPLES])
me.data['css_nipples'] = [c for q in NIPPLES for c in q]
bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
bm.normal_update()
# normals: the Rocketbox mesh carries custom normals and sharp edges along the bikini's folded hems; kept on the
# rebuilt skin, they drew thin bright lines on the shoulders and the back (first pass of 1.19, 05/11). Round the rebuilt
# points the sharp edges are cleared and the normals follow the surface; elsewhere the original normals are kept.
redo = {v for v in redo if v.is_valid}
for e in bm.edges:
    if e.verts[0] in redo or e.verts[1] in redo:
        e.smooth = True
bm.verts.index_update()
redo_i = {v.index for v in redo}
bm.to_mesh(me.data)
me.data.update()
dm = me.data
cn = dm.attributes['cn_orig']
cn = [tuple(dm.vertices[l.vertex_index].normal) if l.vertex_index in redo_i else tuple(cn.data[i].vector)
      for i, l in enumerate(dm.loops)]
dm.normals_split_custom_set(cn)
dm.attributes.remove(dm.attributes['cn_orig'])
print(f'normales refaites autour de {len(redo_i)} points')
bpy.ops.wm.save_as_mainfile(filepath=out)
print('SAVED', out)
