"""Discipline outfits for the Ultra-réaliste coaches (v0.31, Youssef 2026-10-22, « TENUES ET ACCESSOIRES 3D PREMIUM
PAR DISCIPLINE »). Built in Blender (bpy) on the shipped body, so every garment carries the body's own skin weights:
it bends with the coach and never lags behind or floats.

  python3 tools/generator/rocketbox/outfits.py public/coaches/mma-kadir/photo.glb public/coaches/mma-kadir/tenues homme

One GLB per discipline (boxe, kickboxing, muaythai, mma, bjj, bjj-nogi, judo): the skeleton plus the garments only.
The app binds them to the coach's own skeleton (src/three/outfit.ts). Each GLB also lists the body vertices the
garments cover (extras.hideBody, quantised millimetres, glTF axes): the app does not draw them, so the skin can
never show through a garment, even at the end of a high kick.

Garments:
- shells: the body surface inside a region, pushed out along its normal (or away from the limb axis for loose
  cuts), with a real thickness (solidify) and hems; weights copied from the body;
- built parts: boxing and Thai gloves (padded mitts with a thumb, cuff and strap), gi skirt, collar and lapels,
  belt with knot and tails, prajioud: shaped meshes weighted to their bones.
Fabrics are generated textures (weave, satin, knit, leather), no logo, no brand.
"""
import bpy, bmesh, sys, os, math, json, base64, struct
from mathutils import Vector, Matrix

src, outdir, sex = sys.argv[sys.argv.index('--') + 1:][:3] if '--' in sys.argv else sys.argv[1:4]
ONLY = os.environ.get('ONLY', '').split(',') if os.environ.get('ONLY') else None
TEX = os.path.join(outdir, '_tex')
os.makedirs(TEX, exist_ok=True)
female = sex == 'femme'
COACH_ID = os.path.basename(os.path.dirname(src))
# v1.37.4: Inaya's approved female clothing is the construction reference.
# Every other female coach is rebuilt on HER OWN mesh and rig with the same patterns.
# The 1.37.4 workflow rebuilds Amara only; Inaya, Naël and Kadir are never touched.
INAYA_FEMALE_PATTERN = female and COACH_ID != 'inaya'

# v1.37.2 — fixed design references, NOT shared raw GLBs:
# A coach keeps his/her own body and skin weights. The same proportions/cut
# are authored from Nael (men) or Inaya (women), evaluated on each own rig.
MMA_SHORT_REFERENCE = 'inaya' if female else 'nael'
KADIR_MMA_CROTCH = os.path.basename(os.path.dirname(src)) == 'mma-kadir'
MMA_SHORT_CUTS = {
    'nael': dict(liner_hem=0.42, liner_waist=0.100),
    'inaya': dict(liner_hem=0.42, liner_waist=0.100, over_hem=0.66,
                  over_waist=0.105, over_flare=0.012),
}
# MakeHuman coaches (tools/generator/makehuman), MH_BODY=1: their quads are larger than the Rocketbox triangles, so
# every edge that followed the skin's points came out as a saw edge: the sports bra is cut by planes from positions
# (not from the skin weights) and the waistband rises over 1.5 cm instead of one step
GEOM_BRA = MH_BODY = os.environ.get('MH_BODY') == '1'
# 1.9: hem of the vale-tudo short, as a share of the thigh from the knee (0.5 = mid-thigh); the Rocketbox photo bodies
# have underwear painted down to mid-thigh, the short must cover it
VT_HEM = float(os.environ.get('VT_HEM', '0.42'))
# 1.22 women's MMA kit (Youssef 05/11 18:07, photos): over-short hem (share of the thigh from the knee) and flare
SUR_HEM = float(os.environ.get('SUR_HEM', '0.66'))
# 1.26 side slit of the MMA shorts: height and half width at the hem (metres)
SLIT_H = float(os.environ.get('SLIT_H', '0.05'))
SLIT_W = float(os.environ.get('SLIT_W', '0.011'))
SUR_FLARE = float(os.environ.get('SUR_FLARE', '0.012'))  # v1.37.2: less triangular flaring at thigh
# 1.22.1 the high kick: the liner ends 1.5 cm inside the over-short's hem (< 0: liner whole); the over-short snug at
# the crotch (half-width of the snug zone, push taken off: 4 mm instead of 10 mm, no flare, no folds)
UNDER_OVERLAP = float(os.environ.get('UNDER_OVERLAP', '0.015'))
SUR_CROTCH = float(os.environ.get('SUR_CROTCH', '0.09'))
SUR_SNUG = float(os.environ.get('SUR_SNUG', '0.006'))
# colours: a tuple is a gradient (top colour, bottom colour) carried by the points
MMAF_KITS = {
    # Amara: black and gold
    'noir-or': dict(top='#141519', topband='#D4AF37', liner='#141519', linerband='#141519', over='#141519', overband='#D4AF37'),
    # Inaya: her pink and black
    'inaya': dict(top='#D6336C', topband='#17171C', liner='#17171C', linerband='#17171C', over='#17171C', overband='#D6336C'),
    # Kaila: pink to turquoise like the photo, black band and over-short
    'degrade': dict(top=('#EC6FA6', '#63D2C6'), topband='#17171C', liner=('#63D2C6', '#EC6FA6'), linerband='#17171C', over='#17171C', overband='#17171C'),
}
MMAF = os.environ.get('MMAF', 'inaya' if os.environ.get('PALETTE') == 'inaya' else 'noir-or') if os.environ.get('MMAF', '1') != '0' else ''

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
for o in list(bpy.data.objects):
    if o.type == 'MESH' and not o.vertex_groups:
        bpy.data.objects.remove(o)
arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
body = [o for o in bpy.data.objects if o.type == 'MESH'][0]
# 1.18: the shipped photo.glb carries the facial expressions as morph targets (1.16); imported as shape keys, they
# forbid applying the modifiers of the shells. The outfits only need the rest shape: the keys are dropped.
for o in bpy.data.objects:
    if o.type == 'MESH' and o.data.shape_keys:
        o.shape_key_clear()
MW = body.matrix_world.copy()


def smooth_old_bikini(o, rings=3, radius=0.015):
    """1.37.7 (Youssef 12/11: « on voit aussi les anciens dessous », bords déchirés et trous sur toutes les tenues
    d'Amara). Verified finding: unlike Inaya (clean_torso.py, 1.19), Amara's body still carries the halter bikini of
    Sports_Female_01 sculpted in the skin itself (4416 faces of texture islands v < 0.22 above 1.15 m: raised cup
    outlines, neck strap, back band, folded hems). Every garment is a copy of that skin, so it copied the ridges (the
    band across the back of the rash guard, the cup outline on the chest) and its cut lines crossed the folded hems
    (torn edges, holes). Here, ONLY in this script's working copy (the shipped photo.glb is never written), the
    bikini region and a few rows round it are flattened: each point's distance to the trunk's axis (one centre per
    1 cm slice) goes through a morphological opening (min then max over a sphere of `radius`): a ridge or a cord
    narrower than 2 x radius goes, the breasts, the trunk and every hollow keep their shape. A light smoothing
    follows. Garments are then built on that clean surface; the skin they cover is hidden by the app as before."""
    from mathutils.kdtree import KDTree as _KD
    me_ = o.data
    mats_ = [m.name.lower() for m in me_.materials]
    uv_ = me_.uv_layers.active.data
    MW_ = o.matrix_world
    sc = max(MW_.to_scale())
    Xw = np.array([(MW_ @ v.co)[:] for v in me_.vertices], dtype=np.float64)
    gname = {g.index: g.name for g in o.vertex_groups}
    limb = np.zeros(len(Xw))
    for v in me_.vertices:
        limb[v.index] = sum(g.weight for g in v.groups if any(k in gname[g.group] for k in ('Arm', 'Hand', 'Head')))
    key = np.round(Xw * 1e5).astype(np.int64)
    _, rep = np.unique(key, axis=0, return_inverse=True)
    rep = rep.ravel()
    nb = {}
    for e in me_.edges:
        a_, b_ = e.vertices
        nb.setdefault(rep[a_], set()).add(rep[b_])
        nb.setdefault(rep[b_], set()).add(rep[a_])
    core = set()
    for p in me_.polygons:
        if 'body' in mats_[p.material_index] and max(uv_[l].uv[1] for l in p.loop_indices) < 0.22 \
                and Xw[list(p.vertices), 2].min() > 1.15:
            core |= {rep[i] for i in p.vertices}
    if not core:
        return 0
    region = set(core)
    for _ in range(rings):
        region |= {j for i in list(region) for j in nb.get(i, ())}
    sel = np.array([rep[i] in region for i in range(len(Xw))])
    # the trunk's axis, slice by slice (arms and head left out)
    zlo, zhi = Xw[sel, 2].min() - 0.03, Xw[sel, 2].max() + 0.03
    trunk = (limb < 0.3) & (Xw[:, 2] > zlo) & (Xw[:, 2] < zhi)
    bins = np.floor((Xw[:, 2] - zlo) / 0.01).astype(int)
    cen = {}
    for bi in np.unique(bins[trunk]):
        m = trunk & (bins == bi)
        lo, hi = Xw[m, :2].min(axis=0), Xw[m, :2].max(axis=0)
        cen[bi] = (lo + hi) / 2
    # one smooth axis (a quadratic in z fitted on the slices' centres): centres taken slice by slice jumped by a few
    # millimetres from one slice to the next and the opening compared distances to different axes (a 1.4 mm ridge
    # stayed across the back)
    zb = np.array(sorted(cen))
    zc = zlo + (zb + 0.5) * 0.01
    cxy = np.array([cen[b_] for b_ in zb])
    fit = [np.polyfit(zc, cxy[:, k], 2) for k in (0, 1)]

    def centre(i):
        z_ = min(max(Xw[i, 2], zc[0]), zc[-1])
        return np.array([np.polyval(fit[0], z_), np.polyval(fit[1], z_)])
    work = np.where(trunk | sel)[0]
    C = np.array([centre(i) for i in work])
    D = Xw[work, :2] - C
    R = np.linalg.norm(D, axis=1)
    kd = _KD(len(work))
    for k, i in enumerate(work):
        kd.insert(Xw[i], k)
    kd.balance()
    near = [np.array([j for (_, j, _) in kd.find_range(Xw[i], radius)]) for i in work]
    rmin = np.array([R[n].min() for n in near])
    ropen = np.array([rmin[n].max() for n in near])
    # light smoothing of the opened distances (the opening leaves small flats)
    for _ in range(2):
        ropen = np.array([ropen[n].mean() for n in near])
    newR = np.where(sel[work], np.minimum(R, ropen), R)
    # the thin parts (the back band, the neck cord, the cup outlines) lie across skin points far apart on this mesh
    # (2.5 cm rows on the back), and the skin itself rolls up to them in folds: the opening above compares them with
    # each other and left a 3 to 5 mm ridge. Each point of the region takes, if lower, the distance given by a
    # quadratic surface fitted on its neighbours within 2.5 cm, the points standing more than 0.3 mm above it
    # dropped and the fit made again (8 times) (a lower envelope: a thin ridge goes, the curve of the breasts and of the
    # back stays, the quadratic follows it)
    fitted = 0
    in_sel = sel[work]
    FR = float(os.environ.get('BIKINI_FIT_R', '0.04'))
    for k in np.where(in_sel)[0]:
        q = Xw[work[k]]
        nbs = np.array([j for (_, j, _) in kd.find_range(q, FR) if j != k])
        if len(nbs) < 14:
            continue
        rad = D[k] / max(R[k], 1e-9)
        tan = np.array([-rad[1], rad[0]])
        du = (Xw[work[nbs], :2] - q[:2]) @ tan
        dz = Xw[work[nbs], 2] - q[2]
        if not (dz.min() < -0.006 and dz.max() > 0.006 and du.min() < -0.006 and du.max() > 0.006):
            continue
        A = np.c_[np.ones(len(nbs)), du, dz, du * du, du * dz, dz * dz]
        y = R[nbs]
        keep = np.ones(len(nbs), bool)
        for _ in range(int(os.environ.get('BIKINI_FIT_IT', '8'))):
            if keep.sum() < 10:
                break
            coef = np.linalg.lstsq(A[keep], y[keep], rcond=None)[0]
            res = y - A @ coef
            keep = res < float(os.environ.get('BIKINI_FIT_TOL', '0.0003'))
        if keep.sum() >= 10 and coef[0] < newR[k] - 0.0003:
            newR[k] = coef[0]
            fitted += 1
    print('1.37.7 bikini : points posés sur la peau voisine', fitted)
    if os.environ.get('BIKINI_DEBUG'):
        for k in np.where(in_sel)[0]:
            q = Xw[work[k]]
            if abs(q[0]) < 0.002 and abs(q[2] - 1.2212) < 0.001:
                print('DBG', np.round(q, 4), 'R', round(R[k], 4), 'newR', round(newR[k], 4))
    # where the bikini lies OVER a layer of skin (its knot and band in the middle of the back: two surfaces 3 to 5 mm
    # apart) the garment copied both, and the lower copy showed through the upper one as a small bow: that skin goes
    # 4 mm further in, under the cloth's own thickness
    is_core = np.array([rep[i] in core for i in work])
    under_n = 0
    for k in np.where(~is_core)[0]:
        if any(is_core[j] and R[j] > R[k] + 0.0015 for (_, j, _) in kd.find_range(Xw[work[k]], 0.008)):
            newR[k] = R[k] - float(os.environ.get('BIKINI_UNDER', '0.004'))
            sel[work[k]] = True
            UNDER_SKIN.add(int(work[k]))
            under_n += 1
    print('1.37.7 peau sous le bikini enfoncée :', under_n)
    U = D / np.maximum(R, 1e-9)[:, None] * newR[:, None] + C
    moved = np.abs(newR - R)
    X2 = Xw.copy()
    X2[work, 0], X2[work, 1] = U[:, 0], U[:, 1]
    # the folded hems of the bikini (rows of points a fraction of a millimetre apart) are now pressed onto the skin
    # but still folded: their thin faces turn over and drew a dark crease through the garments. The points that moved
    # and two rows round them are relaxed along the surface (welded seams move together)
    n_ = rep.max() + 1
    U3 = np.zeros((n_, 3))
    np.add.at(U3, rep, X2)
    U3 /= np.bincount(rep, minlength=n_)[:, None]
    mv = np.zeros(len(Xw), bool)
    mv[work[(moved > 0.0005) & sel[work]]] = True
    relax = {rep[i] for i in np.where(mv)[0]}
    for _ in range(2):
        relax |= {j for i in list(relax) for j in nb.get(i, ())}
    relax = np.array(sorted(r for r in relax if r in region))
    nbl = [np.array(sorted(nb.get(i, ()))) for i in relax]
    for it in range(2 * int(os.environ.get('BIKINI_RELAX', '12'))):
        k = 0.5 if it % 2 == 0 else -0.53
        avg = np.array([U3[l].mean(axis=0) if len(l) else U3[i] for i, l in zip(relax, nbl)])
        U3[relax] = U3[relax] + k * (avg - U3[relax])
    X2 = U3[rep]
    BIKINI_MOVED.update(int(i) for i in np.where(np.linalg.norm(X2 - Xw, axis=1) > 0.0003)[0])
    MWI_ = MW_.inverted()
    for i in work:
        if sel[i]:
            me_.vertices[i].co = MWI_ @ Vector(X2[i])
    me_.update()
    print('1.37.7 ancien bikini aplani : points', len(core), '+', len(region) - len(core), 'autour, déplacement max (m)',
          round(float(moved.max()), 4), 'moyen', round(float(moved[sel[work]].mean()), 4))
    return len(core)


import numpy as np
# 1.37.7: the Amara-only adjustments of 1.37.4-1.37.6 (raised square neckline, 9 mm push, crotch opening of the MMA
# short, plane-projected bands, wider straps) were compensating for the old bikini sculpted in her skin; with it
# flattened (smooth_old_bikini) they made the torn edges, holes and the dark piece between the thighs seen on 12/11.
# Kept behind AMARA_PATCHES=1 for comparison; by default Amara is cut exactly like Inaya.
AMARA_PATCHES = COACH_ID == 'mma-amara' and os.environ.get('AMARA_PATCHES', '0') == '1'
CLEAN_BIKINI = os.environ.get('CLEAN_BIKINI', '1' if COACH_ID == 'mma-amara' else '0') == '1'
BIKINI_MOVED = set()
UNDER_SKIN = set()
# the body points as the shipped file stores them: the hidden-skin keys (file_key_i) must name THOSE points
P_SHIPPED = [MW @ v.co for v in body.data.vertices]
if CLEAN_BIKINI:
    smooth_old_bikini(body, int(os.environ.get('BIKINI_RINGS', '3')), float(os.environ.get('BIKINI_RADIUS', '0.015')))
MWI = MW.inverted()
NM = MW.to_3x3().inverted().transposed()
AW = arm.matrix_world
H = {b.name: AW @ b.head_local for b in arm.data.bones}
G = {g.name: g.index for g in body.vertex_groups}
GN = {i: n for n, i in G.items()}
me = body.data
VW = [{GN[x.group]: x.weight for x in v.groups} for v in me.vertices]
P = [MW @ v.co for v in me.vertices]
N = [(NM @ v.normal).normalized() for v in me.vertices]
FWD = Vector((0, -1, 0))
from mathutils.kdtree import KDTree
KD = KDTree(len(P))
for i_, p_ in enumerate(P):
    KD.insert(p_, i_)
KD.balance()
if BIKINI_MOVED:
    # 1.37.7: the folded hems of the old bikini, pressed flat, keep their collapsed faces, whose normals point
    # anywhere: every garment is pushed along the skin's normal, so the cloth over them formed a ridge (the line
    # across the back of the rash guard and the gi). Their normals are the mean of the skin's within 2 cm
    _N2 = {}
    for i_ in BIKINI_MOVED:
        acc = Vector()
        for (_, j_, _) in KD.find_range(P[i_], 0.02):
            if j_ not in BIKINI_MOVED:
                acc += N[j_]
        if acc.length > 1e-6:
            _N2[i_] = acc.normalized()
    for i_, n_ in _N2.items():
        N[i_] = n_
    print('1.37.7 normales recalculées sur l\'ancien bikini :', len(_N2))
# 1.37.7: body points within 4 cm of the old bikini (where the cloth and the shipped skin can differ)
NEAR_MOVED = {j_ for i_ in BIKINI_MOVED for (_, j_, _) in KD.find_range(P[i_], 0.04)} if BIKINI_MOVED else set()


def w(i, *names):
    return sum(VW[i].get(n, 0.0) for n in names)


def side_names(s, *parts):
    return [f'{s}{p}' for p in parts]


ARMS = [f'{s}{p}' for s in ('Left', 'Right') for p in ('Arm', 'ForeArm', 'Hand')] + [n for n in G if 'Hand' in n]
HANDS = [n for n in G if 'Hand' in n]
FEET = [f'{s}{p}' for s in ('Left', 'Right') for p in ('Foot', 'ToeBase')]
hipZ = H['Hips'].z
kneeZ = (H['LeftLeg'].z + H['RightLeg'].z) / 2
ankleZ = (H['LeftFoot'].z + H['RightFoot'].z) / 2
neckZ = H['Neck'].z
chestZ = H['Spine2'].z


def axis_point(i, top, bottom):
    """closest point of the bone segment top->bottom to vertex i, and the parameter along it"""
    a, b = H[top], H[bottom]
    d = b - a
    u = max(0.0, min(1.0, (P[i] - a).dot(d) / d.length_squared))
    return a + d * u, u


def leg_of(i):
    return 'Left' if P[i].x > 0 else 'Right'


# ---------------------------------------------------------------- fabrics (generated textures)
import numpy as np


def save_png(name, arr):
    path = os.path.join(TEX, name + '.png')
    h, wd = arr.shape[:2]
    img = bpy.data.images.new(name, wd, h, alpha=False)
    rgba = np.ones((h, wd, 4), np.float32)
    rgba[..., :3] = arr[::-1, :, :3]
    img.pixels.foreach_set(rgba.ravel())
    img.filepath_raw = path
    img.file_format = 'PNG'
    img.save()
    return img


def height_to_normal(hgt, strength):
    gy, gx = np.gradient(hgt)
    n = np.dstack([-gx * strength, -gy * strength, np.ones_like(hgt)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    return n * 0.5 + 0.5


rng = np.random.default_rng(7)


def noise(size, scale):
    """smooth tileable noise (sum of random waves)"""
    y, x = np.mgrid[0:size, 0:size] / size * 2 * np.pi
    out = np.zeros((size, size))
    for k in range(scale):
        fx, fy = rng.integers(1, 6 + k * 3, 2)
        ph = rng.random() * 6.28
        out += np.sin(fx * x + fy * y + ph) / (1 + k)
    return (out - out.min()) / (np.ptp(out) + 1e-9)


def weave(size=256, threads=32, thick=0.55):
    """plain weave (gi, judogi: « pearl weave » look from small raised cells)"""
    y, x = np.mgrid[0:size, 0:size] / size * threads
    fx, fy = x % 1, y % 1
    over = ((np.floor(x) + np.floor(y)) % 2) == 0
    hx = np.sin(np.pi * fx) ** thick
    hy = np.sin(np.pi * fy) ** thick
    return np.where(over, hx * 0.8 + 0.2 * hy, hy * 0.8 + 0.2 * hx)


def knit(size=256, rows=48):
    y, x = np.mgrid[0:size, 0:size] / size
    v = np.abs(np.sin(np.pi * (x * rows + 0.5 * np.sin(y * rows * np.pi)))) ** 0.6
    return v


def satin(size=256):
    y, x = np.mgrid[0:size, 0:size] / size
    return 0.5 + 0.5 * np.sin(2 * np.pi * (x * 90 + y * 6)) * 0.08 + noise(size, 4) * 0.25


def grain(size=256):
    return noise(size, 10) * 0.6 + rng.random((size, size)) * 0.08


def rice(size=512, cols=80, rows=40, depth=0.7):
    """v0.32 grain weave of the gis (Youssef, 2026-10-22: « ressemblent à des vêtements en gros tricot »): small
    staggered grains at the real scale of the cloth (1 texture = 25 cm, so 80 columns = 3 mm grains), a shallow
    relief. Judogi: double weave, larger and deeper grains; BJJ gi: pearl weave, finer and flatter"""
    y, x = np.mgrid[0:size, 0:size] / size
    X, Y = x * cols, y * rows
    Y = Y + 0.5 * (np.floor(X) % 2)
    fx, fy = X % 1 - 0.5, Y % 1 - 0.5
    d = (fx / 0.44) ** 2 + (fy / 0.47) ** 2
    h = np.clip(1 - d, 0, 1) ** depth
    return h * 0.9 + noise(size, 6) * 0.1


def blur(a, r):
    """tileable gaussian blur (FFT), r in pixels"""
    f = np.fft.fftfreq(a.shape[0])
    g = np.exp(-2 * (np.pi * r) ** 2 * (f[:, None] ** 2 + f[None, :] ** 2))
    return np.real(np.fft.ifft2(np.fft.fft2(a) * g))


def cotton(size=512, grains=0.25, slub=1.2, cells=(96, 64), depth=0.6):
    """1.2.1 cotton of the gis (Youssef, 2026-10-28: « essaye de les faire avec effet moins tricot »): the regular
    grid of grains of v0.32 still read as knitting once the picture is reduced. Now mostly an irregular cotton
    surface (soft mottling + short slubs stretched along the warp), the real grain of the weave kept only faint"""
    r = np.random.default_rng(11)
    soft = noise(size, 8)
    sl = blur(r.random((size, size)), slub)
    sl = blur(np.repeat(sl[:, ::4], 4, axis=1), 1.5)  # threads: longer along x than across
    sl = (sl - sl.min()) / (np.ptp(sl) + 1e-9)
    fine = rice(size, cells[0], cells[1], depth)
    return soft * 0.45 + sl * (0.55 - grains) + fine * grains


def stitched(size=256, lines=8, base=None):
    """strip of cloth (belt, collar): u along the strip (one texture every 5 cm), v across it (0 to 1). Parallel
    rows of stitches sunk into a fine grain, like the stitched rows of a real belt or gi collar.
    1.26 (Youssef, 2026-11-06: « des ceintures hachurées et des cols hachurés pas nets »): the rows were thin
    (0.5 mm) dashed grooves 3 to 4 mm apart; seen from a few metres on a phone, a pixel covers several of them and
    they shimmered as hatching. Now soft, continuous, shallow channels (the stitched look without the fine lines),
    a calmer grain, and the rounded folded edges kept"""
    y, x = np.mgrid[0:size, 0:size] / size
    h = (base if base is not None else rice(size, 24, 12)) * 0.15 + 0.85
    for k in range(lines):
        v = (k + 0.5) / lines
        h = h - np.exp(-(((y - v) / (0.22 / lines)) ** 2)) * 0.18
    # the two folded edges of the strip are rounded
    h = h - (np.exp(-((y / 0.08) ** 2)) + np.exp(-(((1 - y) / 0.08) ** 2))) * 0.35
    return blur(h, 1.5)


def elastic(size=256, ribs=32):
    """v0.32 ribbed elastic of a waistband (8 mm ribs across the band), instead of the coarse knit that read as rope"""
    y, x = np.mgrid[0:size, 0:size] / size
    return 0.5 + 0.5 * np.sin(2 * np.pi * x * ribs) * 0.7 + noise(size, 4) * 0.08


def pebble(size=512, cells=70):
    """v0.43 pebbled leather of the gloves: small irregular rounded grains (about 3.5 mm at 1 texture = 25 cm),
    instead of smooth waves"""
    y, x = np.mgrid[0:size, 0:size] / size
    # cell distance computed on a coarse grid of jittered points (fast, tileable)
    g = cells
    jit = rng.random((g, g, 2))
    X, Y = x * g, y * g
    ix, iy = np.floor(X).astype(int), np.floor(Y).astype(int)
    d = np.full((size, size), 9.0)
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            cx, cy = (ix + dx) % g, (iy + dy) % g
            px = ix + dx + jit[cx, cy, 0]
            py = iy + dy + jit[cx, cy, 1]
            d = np.minimum(d, np.hypot(X - px, Y - py))
    h = 1 - np.clip(d / 0.75, 0, 1) ** 1.5
    return h * 0.85 + noise(size, 5) * 0.15


def serge(size=512, lines=110):
    """twill of the gi trousers: fine diagonal ribs (2 mm)"""
    y, x = np.mgrid[0:size, 0:size] / size
    return 0.5 + 0.5 * np.sin(2 * np.pi * (x + y) * lines) * 0.8 + noise(size, 5) * 0.1


MATS = {}


def fabric(name, color, kind, rough=0.7, strength=2.0, sheen=0.0, coat=0.0, tone=0.0):
    """material with a generated relief; colour as sRGB hex. tone: how much darker the hollows of the relief are
    (a colour texture, so the weave reads even where the light is flat)"""
    if name in MATS:
        return MATS[name]
    gens = {'weave': weave, 'knit': knit, 'satin': satin, 'grain': grain, 'flat': lambda: noise(256, 3) * 0.2,
            'judogi': lambda: cotton(512, 0.22, 1.4, (96, 64), 0.6), 'perle': lambda: cotton(512, 0.18, 1.0, (128, 80), 0.9),
            'ceinture': lambda: stitched(256, 5), 'col-judo': lambda: stitched(256, 5, rice(256, 24, 12, 0.6)),
            'col-bjj': lambda: stitched(256, 3, rice(256, 32, 16, 0.9)), 'serge': serge,
            'elastique': elastic, 'jersey': lambda: knit(512, 150), 'cuir': pebble}
    h = gens[kind]()
    nimg = save_png(f'{name}_n', height_to_normal(h, strength))
    nimg.colorspace_settings.name = 'Non-Color'
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    c = [int(color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    lin = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    bsdf.inputs['Base Color'].default_value = (*lin, 1)
    bsdf.inputs['Roughness'].default_value = rough
    if tone:
        hn = (h - h.min()) / (np.ptp(h) + 1e-9)
        cimg = save_png(f'{name}_c', np.dstack([np.full_like(hn, x) * (1 - tone * (1 - hn)) for x in c]))
        ct = nt.nodes.new('ShaderNodeTexImage')
        ct.image = cimg
        nt.links.new(ct.outputs['Color'], bsdf.inputs['Base Color'])
    t = nt.nodes.new('ShaderNodeTexImage')
    t.image = nimg
    nm = nt.nodes.new('ShaderNodeNormalMap')
    nt.links.new(t.outputs['Color'], nm.inputs['Color'])
    nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
    m['css_fabric'] = kind
    m['css_sheen'] = sheen
    m['css_coat'] = coat
    MATS[name] = m
    return m


# ---------------------------------------------------------------- shells
def new_obj(name, bm_):
    mesh = bpy.data.meshes.new(name)
    bm_.to_mesh(mesh)
    o = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(o)
    return o


def shell(name, keep, push, thick, mats, mat_of=None, hem=0.006, cuts=(), iso=None, edge_skin=0.006):
    """body faces whose vertices all satisfy keep(i), pushed out by push(i) (metres along the normal, or a
    Vector: free displacement), given a thickness. mats: list of materials, mat_of(face centre, vertex ids) -> index.
    cuts: (point, normal) planes the body is sliced along first, so hems and colour bands are straight lines
    instead of following the triangles.
    iso (1.10): a field f(world point) < 0 inside the garment. Its zero line is cut exactly through the triangles
    (edges split where f changes sign, after one subdivision near the line), so a curved edge (a neckline, a strap,
    a racer back) is smooth whatever the size of the body's faces; `keep` is then only a generous region"""
    o = body.copy()
    o.data = body.data.copy()
    o.name = name
    o.data.name = name
    bpy.context.collection.objects.link(o)
    o.modifiers.clear()
    for m in o.modifiers:
        o.modifiers.remove(m)
    # lighter for phones: a garment needs far fewer points than the skin it covers. Decimated before the cuts, so
    # the hems and colour bands stay straight (weights are kept by the decimation)
    dec = o.modifiers.new('Decimate', 'DECIMATE')
    # 1.37.1: 40 % of the body triangles before the cuts was too aggressive for hems,
    # groins and kimono sleeves (saw-teeth and triangular panels). Keep more geometry
    # there; other hard-surface pieces retain the mobile-friendly budget.
    detail = name.startswith(('short-', 'haut-', 'pantalon-', 'veste-'))
    # v1.37.2: this includes 'haut-crop' / 'haut-carre' (Inaya's MMA top),
    # previously accidentally excluded: the coarse mesh tore its armholes.
    critical = name.startswith(('haut-crop', 'haut-carre', 'haut-brassiere', 'short-surshort', 'short-vale-tudo'))
    ratio = ('DECIMATE_MMA', '0.96') if critical else ('DECIMATE_DETAIL', '0.86') if detail else ('DECIMATE', '0.4')
    dec.ratio = min(1.0, max(0.1, float(os.environ.get(*ratio))))
    apply(o, dec)
    bm_ = bmesh.new()
    bm_.from_mesh(o.data)
    bm_.verts.ensure_lookup_table()
    # remember the closest body vertex of each garment vertex (its normal, weights region and side)
    lay = bm_.verts.layers.int.new('src')
    for v in bm_.verts:
        v[lay] = KD.find(MW @ v.co)[1] + 1
    ok = [keep(i) for i in range(len(P))]
    R3 = MWI.to_3x3()
    for (pt, nr) in cuts:
        bmesh.ops.bisect_plane(bm_, geom=bm_.verts[:] + bm_.edges[:] + bm_.faces[:], plane_co=MWI @ pt, plane_no=(R3 @ nr).normalized())
    # every point (the new ones on the cuts too) takes its closest body vertex; a face stays when the body around
    # its centre is inside the region, so a hem follows its cut exactly instead of the triangles
    for v in bm_.verts:
        v[lay] = KD.find(MW @ v.co)[1]
    side = lambda q: tuple((q - pt).dot(nr) > 0 for (pt, nr) in cuts)

    def face_ok(f):
        c = MW @ f.calc_center_median()
        sc = side(c)
        # the closest body vertex on the same side of every cut (the one beside the cut line otherwise decides
        # for a face on the other side, and the hem comes out ragged)
        for (_, i, _) in KD.find_n(c, 12):
            if side(P[i]) == sc:
                return ok[i]
        return ok[KD.find(c)[1]]

    if UNDER_SKIN and os.environ.get('BIKINI_DROP_UNDER', '0') == '1':
        # 1.37.7: the skin lying under the old bikini's band and knot (a second surface, see smooth_old_bikini) is
        # not copied: the cloth over the band is enough, the copy of both made a ridge across the back. Off by default: it opened holes (measured 12/11)
        under = [f for f in bm_.faces if all(KD.find(MW @ v.co)[1] in UNDER_SKIN for v in f.verts)]
        bmesh.ops.delete(bm_, geom=under, context='FACES')
    if iso is not None:
        bmesh.ops.delete(bm_, geom=[f for f in bm_.faces if not ok[KD.find(MW @ f.calc_center_median())[1]]], context='FACES')
        bmesh.ops.delete(bm_, geom=[v for v in bm_.verts if not v.link_faces], context='VERTS')
        iso_cut(bm_, iso)
        for v in bm_.verts:
            v[lay] = KD.find(MW @ v.co)[1]
        # the skin hidden under the garment: inside the field only (the generous region would hide bare skin)
        ok = [ok[i] and iso(P[i]) < -0.002 for i in range(len(P))]
    else:
        bmesh.ops.delete(bm_, geom=[f for f in bm_.faces if not face_ok(f)], context='FACES')
    bmesh.ops.delete(bm_, geom=[v for v in bm_.verts if not v.link_faces], context='VERTS')
    # the body is split along its texture seams: weld them, or the garment shows a crack there
    bmesh.ops.remove_doubles(bm_, verts=bm_.verts[:], dist=0.0005 / max(MW.to_scale()))
    # v0.32: small holes left by the body mesh (navel, a seam the weld missed) are closed; the real openings of a
    # garment (neck, sleeves, legs: dozens of edges) are kept
    # A few open body seam loops are genuine small holes; others are natural
    # crotch boundaries. Closing those on Kadir created large black bridge
    # triangles when he spread his legs. Protect just the latter while keeping
    # the generic pinhole repair (Nael and Inaya are entirely unaffected).
    if BIKINI_MOVED:
        # 1.37.7: on the old bikini the two sides of a texture seam were pressed flat apart by up to a few
        # millimetres: the weld above missed them and left slits (the back of the rash guard, captures 12/11)
        bv = [v for v in bm_.verts if v.is_boundary
              and any(j in BIKINI_MOVED for (_, j, _) in KD.find_range(MW @ v.co, 0.01))]
        if bv:
            n0 = len(bm_.verts)
            bmesh.ops.remove_doubles(bm_, verts=bv, dist=float(os.environ.get('BIKINI_WELD', '0.004')) / max(MW.to_scale()))
            print('1.37.7', name, 'couture de l\'ancien bikini soudée :', n0 - len(bm_.verts), 'points')
    fill_edges = [e for e in bm_.edges if e.is_boundary]
    if KADIR_MMA_CROTCH and name == 'short-vale-tudo':
        def crotch_seam_edge(edge):
            points = [MW @ v.co for v in edge.verts]
            return all(abs(q.x) < 0.115 and (hipZ - 0.19) < q.z < (hipZ + 0.03)
                       for q in points)
        ignored = [e for e in fill_edges if crotch_seam_edge(e)]
        fill_edges = [e for e in fill_edges if not crotch_seam_edge(e)]
        print('Kadir MMA: crotch seam boundary edges kept open:', len(ignored))
    if fill_edges:
        bmesh.ops.holes_fill(bm_, edges=fill_edges, sides=10)
    if BIKINI_MOVED:
        # 1.37.7: over the old bikini's band and knot the copy leaves small holes with more than 10 sides (its
        # pressed folds); the skin under them stayed drawn and came through as slits (captures 12/11). A closed loop
        # there shorter than 8 cm is filled whatever its number of sides
        loops, seen = [], set()
        for e in [e for e in bm_.edges if e.is_boundary]:
            if e in seen:
                continue
            loop, stack = [], [e]
            while stack:
                x = stack.pop()
                if x in seen:
                    continue
                seen.add(x)
                loop.append(x)
                for v in x.verts:
                    stack += [y for y in v.link_edges if y.is_boundary and y not in seen]
            loops.append(loop)
        small = []
        for loop in loops:
            if os.environ.get('BIKINI_DEBUG'):
                c_ = MW @ loop[0].verts[0].co
                if c_.y > 0.05 and abs(c_.x) < 0.1 and 1.15 < c_.z < 1.3:
                    print('loop', name, len(loop), round(sum(x.calc_length() for x in loop) * max(MW.to_scale()), 4), tuple(round(t, 3) for t in c_))
            if sum(x.calc_length() for x in loop) * max(MW.to_scale()) > 0.08:
                continue
            if all(any(j in BIKINI_MOVED for (_, j, _) in KD.find_range(MW @ v.co, 0.015)) for x in loop for v in x.verts):
                small += loop
        if small:
            bmesh.ops.holes_fill(bm_, edges=small, sides=0)
            print('1.37.7', name, 'trous bouchés sur l\'ancien bikini :', len(small), 'arêtes')
    bm_.normal_update()
    # body vertices under the garment: every body vertex of the region, but those near the garment's free edges
    # (the skin stays drawn where the cloth ends)
    edge_pts = [MW @ v.co for e in bm_.edges if e.is_boundary for v in e.verts]
    if BIKINI_MOVED:
        # 1.37.7: a crack the old bikini's folds leave in the copy (a few edges, under 4 cm) is not a free edge of
        # the garment: the skin under it stays hidden (drawn, it came through the cloth as a slit)
        bset, short = {e for e in bm_.edges if e.is_boundary}, set()
        while bset:
            e0 = bset.pop()
            chain, stack = [e0], [e0]
            while stack:
                x = stack.pop()
                for v in x.verts:
                    for y in v.link_edges:
                        if y in bset:
                            bset.discard(y)
                            chain.append(y)
                            stack.append(y)
            if sum(x.calc_length() for x in chain) * max(MW.to_scale()) < 0.04:
                short.update(chain)
        if short:
            edge_pts = [MW @ v.co for e in bm_.edges if e.is_boundary and e not in short for v in e.verts]
            print('1.37.7', name, 'fentes de l\'ancien bikini sans bord libre :', len(short), 'arêtes')
    ekd = KDTree(max(1, len(edge_pts)))
    for k_, q_ in enumerate(edge_pts):
        ekd.insert(q_, k_)
    ekd.balance()
    # 1.10: an edge cut by a field lies exactly on its line, the skin under it can be hidden closer to it (6 mm)
    covered = {i for i in range(len(P)) if ok[i] and (not edge_pts or ekd.find(P[i])[2] > (edge_skin if iso is not None else 0.012))}
    garment = KDTree(len(bm_.verts))
    for k_, v in enumerate(bm_.verts):
        garment.insert(MW @ v.co, k_)
    garment.balance()
    # only where the garment really is (the region test alone would also hide skin a cut removed)
    covered = {i for i in covered if garment.find(P[i])[2] < 0.07}
    # MH_BODY: the points of a cut stay on it after the push (on the tilted skin of the lower back the push along the
    # normal moved them off the plane, the smoothing then pulled them up and down: a toothed colour band)
    on_cut = {}
    # 1.22 also on the Rocketbox bodies for the women's MMA kit (its bands are a contrasting colour: gold or pink
    # on black, their lower line came out in teeth that the black-on-black bands of before hid)
    if MH_BODY or _ONCUT[0]:
        for v in bm_.verts:
            q = MW @ v.co
            for k, (pt, nr) in enumerate(cuts):
                if abs((q - pt).dot(nr)) < 0.0003:
                    on_cut[v.index] = k
                    break
    # 1.37.7: which side of a colour line a face lies on is decided HERE, before the push: the thin faces the cut
    # leaves along the line have their centre a fraction of a millimetre from it, and the push along the skin's
    # normal (which leans on the curve of the hips and the back) carried some across. They took the other colour:
    # the black and yellow « teeth » under every waistband (Amara and Inaya alike, Youssef 12/11)
    face_c = {f: MW @ f.calc_center_median() for f in bm_.faces}
    for v in bm_.verts:
        i = v[lay]
        d = push(i)
        world = (MW @ v.co) + (N[i] * d if isinstance(d, (int, float)) else d)
        if v.index in on_cut:
            pt, nr = cuts[on_cut[v.index]]
            world = world - nr * (world - pt).dot(nr)
        v.co = MWI @ world
    # hems: the free edges stand off the skin a little (a folded, stitched edge is thicker, and the skin never shows over it)
    for v in bm_.verts:
        if any(e.is_boundary for e in v.link_edges):
            v.co = v.co + (MWI.to_3x3() @ N[v[lay]]) * (hem * float(os.environ.get("HEM_LIFT", "0.25")))
            # v0.32: a hem lies exactly on its cut (the push along the skin's normal used to move each point a little
            # up or down the limb: a ragged, toothed edge on the sleeves and the waistbands)
            # the cut the edge comes from is the closest one (another plane can pass a few centimetres away)
            q = MW @ v.co
            ds = sorted((abs((q - pt).dot(nr)), k) for k, (pt, nr) in enumerate(cuts))
            if ds and ds[0][0] < 0.035 and iso is None:
                pt, nr = cuts[ds[0][1]]
                q = q - nr * (q - pt).dot(nr)
            v.co = MWI @ q
    # 1.13 (Youssef, 04/11: « bords effilochés »): a hem cut by a field crosses the body's triangles at every angle;
    # each point then took its own skin normal for the lift above and the edge came out in small waves, read as a
    # frayed hem. The free edges are relaxed along themselves (each point toward the middle of its two neighbours
    # on the edge), which keeps the line's course and removes the waves
    # 1.19 (Youssef 05/11, Inaya « le haut est toujours pas bon », hems in saw teeth on Inaya and Amara alike): the
    # hems cut by planes (shorts, waistbands, sleeves) are relaxed the same way, each point then put back on its
    # plane: every point of the edge took the push of its own closest skin point, the edge waved in and out
    bnb = {}
    for e in bm_.edges:
        if e.is_boundary:
            a_, b_ = e.verts
            bnb.setdefault(a_, []).append(b_)
            bnb.setdefault(b_, []).append(a_)
    loop = [v for v, nn in bnb.items() if len(nn) == 2]
    plane_of = {}
    if iso is None and cuts:
        for v in loop:
            q = MW @ v.co
            ds = sorted((abs((q - pt).dot(nr)), k) for k, (pt, nr) in enumerate(cuts))
            if ds[0][0] < 0.002:
                plane_of[v] = cuts[ds[0][1]]
    relax_n = int(os.environ.get('HEM_RELAX', '14'))
    if os.environ.get('HEM_PLANE_RELAX', '1') == '0' and iso is None:
        relax_n = 0
    for it in range(2 * relax_n):
        # Taubin steps (a plain relaxation shrinks a closed loop: the hem of a short sank into the thigh), more of
        # them than in 1.13: the field-cut hems still read in small teeth on Inaya and Amara (05/11)
        k = 0.5 if it % 2 == 0 else -0.53
        new = {v: v.co + k * ((bnb[v][0].co + bnb[v][1].co) * 0.5 - v.co) for v in loop}
        for v, c in new.items():
            if v in plane_of:
                pt, nr = plane_of[v]
                q = MW @ c
                c = MWI @ (q - nr * (q - pt).dot(nr))
            v.co = c
    if mats:
        o.data.materials.clear()
        for m in mats:
            o.data.materials.append(m)
        for f in bm_.faces:
            c = face_c.get(f) or MW @ f.calc_center_median()
            f.material_index = mat_of(c, [v[lay] for v in f.verts]) if mat_of else 0
    bm_.to_mesh(o.data)
    bm_.free()
    o.data.attributes.remove(o.data.attributes['src']) if 'src' in o.data.attributes else None
    smooth(o, 2, cuts, border=float(os.environ.get("SMOOTH_BORDER", "0.35")) if iso is not None else 1.0)
    if BIKINI_MOVED and int(os.environ.get('BIKINI_CLOTH_SMOOTH', '40')) > 0:
        # 1.37.7: over the old bikini's pressed folds the copy keeps rows of sliver faces; they shaded as a thin line
        # across the back. The cloth there (not its free edges) is relaxed a little more
        me_o = o.data
        import bmesh as _bm
        _b = _bm.new()
        _b.from_mesh(me_o)
        bnd = {v.index for v in _b.verts if v.is_boundary}
        _b.free()
        vg = o.vertex_groups.new(name='css-bikini')
        ids = [v.index for v in me_o.vertices if v.index not in bnd and KD.find(MW @ v.co)[2] < 0.03
               and any(j in BIKINI_MOVED for (_, j, _) in KD.find_n(MW @ v.co, 3))]
        if ids:
            vg.add(ids, 1.0, 'REPLACE')
            m_ = o.modifiers.new('SmoothBikini', 'SMOOTH')
            m_.factor = 0.5
            m_.iterations = int(os.environ.get('BIKINI_CLOTH_SMOOTH', '40'))
            m_.vertex_group = 'css-bikini'
            apply(o, m_)
        o.vertex_groups.remove(o.vertex_groups['css-bikini'])
    if BIKINI_MOVED and float(os.environ.get('BIKINI_CLEAR', '0.004')) > 0:
        # 1.37.7 (captures 12/11): the cloth follows the flattened body, the app draws the shipped one. Where a
        # shipped skin face stays drawn (one of its points is not hidden: the edge of a back opening) and still holds
        # the old band's height, its triangle came through the cloth as a slit. The cloth over such a face is kept
        # BIKINI_CLEAR outside it
        from mathutils.bvhtree import BVHTree
        clear = float(os.environ.get('BIKINI_CLEAR', '0.004'))
        drawn = [list(p_.vertices) for p_ in body.data.polygons if not all(i in covered for i in p_.vertices)
                 and any(i in NEAR_MOVED for i in p_.vertices)]
        if drawn and os.environ.get('BIKINI_DEBUG'):
            zs = sorted(P_SHIPPED[f_[0]].z for f_ in drawn)
            print('drawn', name, len(drawn), 'z', zs[0], zs[len(zs) // 2], zs[-1], 'covered', len(covered))
            for f_ in drawn:
                for i in f_:
                    if i not in covered and abs(P[i].x) < 0.08 and 1.18 < P[i].z < 1.26 and P[i].y > 0.05:
                        print(' back', i, tuple(round(c, 3) for c in P[i]), 'ok', ok[i], 'edge', round(ekd.find(P[i])[2], 4) if edge_pts else None, 'garm', round(garment.find(P[i])[2], 4), 'moved', i in BIKINI_MOVED, 'under', i in UNDER_SKIN)
                        break
        if drawn:
            bvh = BVHTree.FromPolygons(P_SHIPPED, drawn)
            moved = 0
            for v in o.data.vertices:
                q = MW @ v.co
                hit = bvh.find_nearest(q, 0.03)
                if hit[0] is None:
                    continue
                loc, nrm = hit[0], hit[1]
                if nrm.dot(N[KD.find(q)[1]]) < 0:
                    nrm = -nrm
                d = (q - loc).dot(nrm)
                if d < clear and (q - loc - nrm * d).length < float(os.environ.get('BIKINI_CLEAR_SIDE', '0.01')):
                    v.co = MWI @ (q + nrm * (clear - d))
                    moved += 1
            print('1.37.7', name, 'tissu écarté de la peau livrée encore dessinée :', moved)
    if thick:
        sol = o.modifiers.new('Solidify', 'SOLIDIFY')
        sol.thickness = thick / max(MW.to_scale())
        sol.offset = -1
        sol.use_rim = True
        # no « even thickness »: on a sharp corner (a slit, a finger hole) it pushes points metres away
        sol.use_even_offset = False
        sol.use_quality_normals = True
        sol.material_offset_rim = 0
        if iso is not None and os.environ.get('RIM_FLAT', '1') == '1':
            o.vertex_groups.new(name='css-rim')
            sol.rim_vertex_group = 'css-rim'
        apply(o, sol)
    rim = None
    if thick and iso is not None and 'css-rim' in o.vertex_groups:
        gi = o.vertex_groups['css-rim'].index
        rim = {v.index for v in o.data.vertices if any(g.group == gi and g.weight > 0.5 for g in v.groups)}
        o.vertex_groups.remove(o.vertex_groups['css-rim'])
        print('rim', name, len(rim))
    for p in o.data.polygons:
        # 1.13: the thin band that closes a field-cut hem is drawn flat: smooth, its normals blended the outside and
        # the inside of the cloth and the hem read as a puffy, wrinkled roll (« bords effilochés »)
        p.use_smooth = not (rim is not None and os.environ.get('RIM_FLAT', '1') == '1' and all(i in rim for i in p.vertices))
    o['covers'] = len(covered)
    return o, covered


def iso_cut(bm_, F, near=0.016):
    """1.10: cut a mesh along the zero line of the field F (world point -> float, < 0 inside) and delete what is
    outside. The faces near the line are subdivided once first (finer edge), each edge crossing the line is split at
    the interpolated zero, the two new points of a face are joined, and the faces whose centre is outside go"""
    val = {v: F(MW @ v.co) for v in bm_.verts}
    edges = [e for e in bm_.edges if min(abs(val[e.verts[0]]), abs(val[e.verts[1]])) < near or (val[e.verts[0]] < 0) != (val[e.verts[1]] < 0)]
    if edges:
        bmesh.ops.subdivide_edges(bm_, edges=edges, cuts=1, use_grid_fill=True, smooth=0.0)
    val = {v: F(MW @ v.co) for v in bm_.verts}
    for v, x in val.items():
        if abs(x) < 1e-6:
            val[v] = 1e-6
    on = set()
    for e in list(bm_.edges):
        a, b = e.verts
        fa, fb = val[a], val[b]
        if (fa < 0) == (fb < 0):
            continue
        t = fa / (fa - fb)
        # two refinement steps on the real field (it is not linear along the edge)
        pa, pb = a.co.copy(), b.co.copy()
        for _ in range(2):
            q = pa.lerp(pb, t)
            fq = F(MW @ q)
            if (fq < 0) == (fa < 0):
                pa, fa = q, fq
            else:
                pb, fb = q, fq
            t2 = fa / (fa - fb) if abs(fa - fb) > 1e-12 else 0.5
            t = t2
        q = pa.lerp(pb, t)
        ne, nv = bmesh.utils.edge_split(e, a, 0.5)
        nv.co = q
        val[nv] = 0.0
        on.add(nv)
    for f in list(bm_.faces):
        vs = [v for v in f.verts if v in on]
        if len(vs) == 2 and not bm_.edges.get(vs):
            try:
                bmesh.ops.connect_verts(bm_, verts=vs)
            except Exception:
                pass
    out = []
    for f in bm_.faces:
        inside = [val.get(v, 0.0) for v in f.verts if v not in on]
        c = F(MW @ f.calc_center_median())
        if c > 0 and (not inside or max(inside) > 0):
            out.append(f)
    bmesh.ops.delete(bm_, geom=out, context='FACES')
    bmesh.ops.delete(bm_, geom=[v for v in bm_.verts if not v.link_faces], context='VERTS')
    bmesh.ops.triangulate(bm_, faces=[f for f in bm_.faces if len(f.verts) > 4])


def smooth(o, n, planes=(), border=1.0):
    """relax the shell (cloth drapes, it does not copy every muscle). v0.43: the points lying on a cut plane (a hem,
    the edge of a colour band) stay on it, so those lines stay straight (the slivers beside a cut used to pull them
    up and down: wavy straps and bands)"""
    if not n:
        return
    m = o.modifiers.new('Smooth', 'SMOOTH')
    m.factor = 0.5
    m.iterations = n
    if planes or border < 1.0:
        # border < 1 (1.10, curved edges cut by a field): the free edge is smoothed less, it keeps its line
        bnd = set()
        if border < 1.0:
            import bmesh as _bm
            b_ = _bm.new()
            b_.from_mesh(o.data)
            bnd = {v.index for v in b_.verts if v.is_boundary}
            b_.free()
        g = o.vertex_groups.new(name='css-lisse')
        for v in o.data.vertices:
            q = o.matrix_world @ v.co
            on = any(abs((q - pt).dot(nr)) < 0.0015 for pt, nr in planes)
            g.add([v.index], 0.0 if on else border if v.index in bnd else 1.0, 'REPLACE')
        m.vertex_group = g.name
    apply(o, m)
    if (planes or border < 1.0) and 'css-lisse' in o.vertex_groups:
        o.vertex_groups.remove(o.vertex_groups['css-lisse'])


def apply(o, mod):
    bpy.context.view_layer.objects.active = o
    for x in bpy.context.selected_objects:
        x.select_set(False)
    o.select_set(True)
    bpy.ops.object.modifier_apply(modifier=mod.name)


def loose(i, top, bottom, base, extra):
    """push away from the limb axis (a loose leg or sleeve), base along the normal plus `extra` radially"""
    c, u = axis_point(i, top, bottom)
    r = P[i] - c
    r.z = 0 if top.endswith('UpLeg') or top.endswith('Leg') else r.z
    if r.length < 1e-6:
        return N[i] * base
    return N[i] * base + r.normalized() * extra(u)


# ---------------------------------------------------------------- built parts
def weighted(o, groups):
    """assign weights {group: weight} (or a function of the world position) to every vertex"""
    for n in G:
        if n not in o.vertex_groups:
            o.vertex_groups.new(name=n)
    for v in o.data.vertices:
        ww = groups(MW @ v.co) if callable(groups) else groups
        for n, x in ww.items():
            if x > 0:
                o.vertex_groups[n].add([v.index], x, 'REPLACE')


def fold_weights(o, src, dst):
    """v0.32: the weights of the bones in src move to dst. A sleeve or trouser edge took the hand's or foot's
    weights from the skin under it: when the wrist or ankle bent, every other point of the hem followed the hand,
    a toothed edge (Youssef, 2026-10-22: « bordures irrégulières »)"""
    groups = [o.vertex_groups[n] for n in src if n in o.vertex_groups]
    if not groups:
        return
    d = o.vertex_groups.get(dst) or o.vertex_groups.new(name=dst)
    idx = {g.index for g in groups}
    for v in o.data.vertices:
        moved = sum(x.weight for x in v.groups if x.group in idx)
        if moved <= 0:
            continue
        for g in groups:
            g.remove([v.index])
        cur = next((x.weight for x in v.groups if x.group == d.index), 0.0)
        d.add([v.index], cur + moved, 'REPLACE')


def hand_frame(s):
    wr = H[f'{s}Hand']
    kn = H[f'{s}HandMiddle1']
    a = (kn - wr).normalized()
    lat = (H[f'{s}HandIndex1'] - H[f'{s}HandPinky1'])
    lat = (lat - a * lat.dot(a)).normalized()
    up = a.cross(lat).normalized()  # back of the hand or palm, fixed below
    # back of the hand: away from the body centre line at rest (arms hang at the sides)
    if up.dot(Vector((wr.x, 0, 0)).normalized()) < 0 and abs(up.x) > 0.3:
        up = -up
    return wr, a, lat, up


def ellipsoid(name, centre, axes, radii, seg=28, rings=18, power=1.0):
    """power < 1: a rounded box rather than an egg (v0.32 gloves: « gants trop sphériques »)"""
    bm_ = bmesh.new()
    bmesh.ops.create_uvsphere(bm_, u_segments=seg, v_segments=rings, radius=1.0)
    M = Matrix((axes[0] * radii[0], axes[1] * radii[1], axes[2] * radii[2])).transposed()
    for v in bm_.verts:
        c = v.co
        if power != 1.0:
            c = Vector([math.copysign(abs(x) ** power, x) for x in c])
        v.co = MWI @ (centre + M @ c)
    o = new_obj(name, bm_)
    bm_.free()
    o.matrix_world = MW
    return o


def tube(name, a, b, r0, r1, seg=28, rings=6, around=None):
    """open tube from a to b (cuffs, straps), radius r0 at a and r1 at b"""
    d = (b - a)
    ax = d.normalized()
    ref = around or (Vector((1, 0, 0)) if abs(ax.x) < 0.9 else Vector((0, 1, 0)))
    x = (ref - ax * ref.dot(ax)).normalized()
    y = ax.cross(x)
    bm_ = bmesh.new()
    rows = []
    for k in range(rings + 1):
        t = k / rings
        c = a + d * t
        r = r0 + (r1 - r0) * t
        rows.append([bm_.verts.new(MWI @ (c + (x * math.cos(2 * math.pi * j / seg) + y * math.sin(2 * math.pi * j / seg)) * r)) for j in range(seg)])
    for k in range(rings):
        for j in range(seg):
            bm_.faces.new((rows[k][j], rows[k][(j + 1) % seg], rows[k + 1][(j + 1) % seg], rows[k + 1][j]))
    o = new_obj(name, bm_)
    bm_.free()
    o.matrix_world = MW
    return o


def solid(o, t):
    s = o.modifiers.new('Solidify', 'SOLIDIFY')
    s.thickness = t / max(MW.to_scale())
    s.offset = 1
    apply(o, s)
    for p in o.data.polygons:
        p.use_smooth = True


def boxing_glove(s, color, accent, thai=False):
    wr, a, lat, up = hand_frame(s)
    L = 0.16 if not thai else 0.15
    parts = []
    # padded mitt holding the fist: longer than wide, deeper over the knuckles
    mitt = ellipsoid(f'gant-{s}', wr + a * (L * 0.5), (a, lat, up), (L * 0.58, 0.064 if not thai else 0.061, 0.054 if not thai else 0.056), power=0.6)
    bm_ = bmesh.new()
    bm_.from_mesh(mitt.data)
    for v in bm_.verts:
        p = MW @ v.co
        q = p - wr
        along = q.dot(a)
        # the striking face is flatter and fuller, the wrist end narrows into the cuff
        if along > L * 0.62:
            v.co = MWI @ (p - a * (along - L * 0.62) * 0.35)
        if along < L * 0.25:
            k = 1 - (L * 0.25 - along) / (L * 0.25) * 0.25
            c = wr + a * along
            v.co = MWI @ (c + (p - c) * k)
    bm_.to_mesh(mitt.data)
    bm_.free()
    mitt.data.materials.append(fabric(f'cuir-{color}', color, 'grain', rough=0.5, strength=0.7, coat=0.2))
    parts.append(mitt)
    # thumb along the side of the mitt (attached, as on real gloves)
    th = ellipsoid(f'pouce-{s}', wr + a * (L * 0.45) + lat * 0.06 + up * 0.012, (a, lat, up), (0.045, 0.022, 0.024), 18, 12)
    th.data.materials.append(fabric(f'cuir-{color}', color, 'grain', rough=0.5, strength=0.7, coat=0.2))
    parts.append(th)
    # cuff up the forearm, then a strap (velcro on boxing gloves, a longer laced-look cuff on Thai gloves)
    fa = H[f'{s}ForeArm']
    cuffLen = 0.1 if not thai else 0.12
    top = wr + (fa - wr).normalized() * cuffLen
    cuff = tube(f'manchette-{s}', wr + a * 0.03, top, 0.05, 0.047, around=up)
    cuff.data.materials.append(fabric(f'cuir-{color}', color, 'grain', rough=0.5, strength=0.7, coat=0.2))
    solid(cuff, 0.008)
    parts.append(cuff)
    strap = tube(f'sangle-{s}', wr + (fa - wr).normalized() * (cuffLen * 0.35), wr + (fa - wr).normalized() * (cuffLen * 0.75), 0.054, 0.053, around=up)
    strap.data.materials.append(fabric(f'sangle-{accent}', accent, 'elastique', rough=0.65, strength=0.8))
    solid(strap, 0.004)
    parts.append(strap)
    for o in parts:
        for p in o.data.polygons:
            p.use_smooth = True
        weighted(o, lambda p_: (lambda t: {f'{s}Hand': 1 - t, f'{s}ForeArm': t})(max(0.0, min(1.0, ((p_ - wr).dot((fa - wr).normalized()) - 0.02) / cuffLen))))
    return parts


GLOVE_TRIS = int(os.environ.get('GLOVE_TRIS', '2200'))
_GLOVE = {}


def lin(hexc):
    c = [int(hexc[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]


def boxing_glove_v2(s, color, accent, thai=False):
    """v0.43 sculpted glove (tools/generator/rocketbox/glove.py): one mesh per hand, vertex-coloured regions"""
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import glove as GL
    # 1.10: the Thai cut is its own shape (glove.py, thai=True); before, `thai` only renamed the material
    if thai not in _GLOVE:
        _GLOVE[thai] = GL.glove_mesh(thai=thai)
    v, q, _, _ = _GLOVE[thai]
    wr, a, lat, up = hand_frame(s)
    # the glove follows the size of the hand (wrist to middle knuckle, 9.5 cm on the reference), within limits
    k = max(0.9, min(1.1, (H[f'{s}HandMiddle1'] - wr).length / 0.095))
    fa = H[f'{s}ForeArm']
    # the cuff goes up the forearm: the frame's x axis bends from the hand's axis to the forearm's behind the wrist
    back = (wr - fa).normalized()
    bm_ = bmesh.new()
    vs = []
    for (x, y, z) in v:
        # behind the wrist (x < 0) the cuff runs along the forearm, not along the hand
        pos = wr + (a if x >= 0 else back) * (x * k) + lat * (y * k) + up * (z * k)
        vs.append(bm_.verts.new(MWI @ pos))
    for f in q:
        try:
            bm_.faces.new([vs[i] for i in f])
        except ValueError:
            pass
    bmesh.ops.recalc_face_normals(bm_, faces=bm_.faces[:])
    o = new_obj(f'gant-{s}', bm_)
    bm_.free()
    o.matrix_world = MW
    tri = o.modifiers.new('Tri', 'TRIANGULATE')
    apply(o, tri)
    dec = o.modifiers.new('Decimate', 'DECIMATE')
    dec.ratio = min(1.0, GLOVE_TRIS / max(1, len(o.data.polygons)))
    apply(o, dec)
    me_ = o.data
    # exact edges where the strap and the lining start: the decimated triangles are long along the cuff, a colour
    # change in the middle of one would smear into streaks. Planes of constant x in the cuff frame (normal lat x up)
    nrm = MWI.to_3x3() @ lat.cross(up).normalized()
    bm_ = bmesh.new()
    bm_.from_mesh(me_)
    for xc in (GL.STRAP_C - GL.STRAP_HALF, GL.STRAP_C + GL.STRAP_HALF, GL.LINING_X):
        geom = bm_.verts[:] + bm_.edges[:] + bm_.faces[:]
        bmesh.ops.bisect_plane(bm_, geom=geom, plane_co=MWI @ (wr + back * (xc * k)), plane_no=nrm)
    bmesh.ops.triangulate(bm_, faces=bm_.faces[:])
    bm_.to_mesh(me_)
    bm_.free()
    for p_ in me_.polygons:
        p_.use_smooth = True
    # colour regions read back in the hand frame: strap and lining per face (crisp edges on the cut lines),
    # leather and its darker piping per point
    inv_f = Matrix((a, lat, up)).transposed().inverted()
    inv_b = Matrix((back, lat, up)).transposed().inverted()

    def local(w_):
        d_ = w_ - wr
        x_ = inv_f @ d_
        if x_.x < 0:
            x_ = inv_b @ d_
        return tuple(x_ / k)

    vreg, pip = GL.regions(np.array([local(MW @ vv.co) for vv in me_.vertices]), thai)
    freg, _ = GL.regions(np.array([local(MW @ f_.center) for f_ in me_.polygons]), thai)
    leather = lin(color)
    strap = lin(accent)
    lining = lin('#1A1A1C')
    pipe = [c * 0.8 for c in leather]
    col = me_.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
    for f_ in me_.polygons:
        r = freg[f_.index]
        for li in f_.loop_indices:
            vi = me_.loops[li].vertex_index
            c = strap if r == 1 else lining if r == 2 else pipe if pip[vi] and vreg[vi] == 0 else leather
            col.data[li].color = (*c, 1)
    me_.color_attributes.active_color = col
    m = fabric(f'cuir-gant-{"thai" if thai else "boxe"}', '#FFFFFF', 'cuir', rough=0.42, strength=0.6, coat=0.25)
    if not m.get('css_vcol'):
        nt = m.node_tree
        vc = nt.nodes.new('ShaderNodeVertexColor')
        vc.layer_name = 'Col'
        nt.links.new(vc.outputs['Color'], nt.nodes['Principled BSDF'].inputs['Base Color'])
        m['css_vcol'] = 1
    o.data.materials.append(m)
    # 1.10 (audit 2026-11-03): `back` points from the forearm to the wrist, so (p - wr).dot(back) is positive in
    # FRONT of the wrist: the old blend gave the padded fist up to 100 % of the forearm and left the cuff on the hand
    # (the striking volume did not follow the wrist, the cuff turned with the hand). Now the fist and the neck of the
    # cuff (up to 1 cm behind the wrist) follow the hand only; the cuff blends smoothly to the forearm, which holds
    # its open end alone (smoothstep over 8 cm behind the wrist)
    def glove_w(p_):
        u = max(0.0, min(1.0, (-(p_ - wr).dot(back) - 0.01) / 0.08))
        t = u * u * (3 - 2 * u)
        return {f'{s}Hand': 1 - t, f'{s}ForeArm': t}
    weighted(o, glove_w)
    print('gant', s, len(o.data.polygons), 'triangles, scale', round(k, 3))
    return [o]


def prajioud(s, color):
    a, b = H[f'{s}Arm'], H[f'{s}ForeArm']
    c = a + (b - a) * 0.42
    ax = (b - a).normalized()
    dist = lambda i: (P[i] - c - ax * (P[i] - c).dot(ax)).length
    idx = sorted(dist(i) for i in range(len(P)) if w(i, f'{s}Arm') > 0.85 and abs((P[i] - c).dot(ax)) < 0.015 and dist(i) < 0.075)
    r = idx[len(idx) // 2] if idx else 0.05
    print('prajioud', s, 'arm radius', round(r, 3), len(idx))
    t = tube(f'prajioud-{s}', c - (b - a).normalized() * 0.012, c + (b - a).normalized() * 0.012, r + 0.012, r + 0.012, 24, 3)
    solid(t, 0.012)
    t.data.materials.append(fabric(f'cordon-{color}', color, 'knit', rough=0.75, strength=3))
    weighted(t, {f'{s}Arm': 1.0})
    return [t]


def prajioud_v2(s, color):
    """v0.43 prajioud (Youssef, 2026-10-23: « équipements simplifiés »). Before: a smooth ring 12 mm away from the arm
    all round, floating. Now a braided cord laid on the arm: its path follows the measured outline of the upper arm
    (one radius per direction), two twisted strands, a knot on the outside of the arm with two short tails"""
    a, b = H[f'{s}Arm'], H[f'{s}ForeArm']
    ax = (b - a).normalized()
    c = a + (b - a) * 0.42
    e1 = (Vector((1, 0, 0)) - ax * ax.x).normalized()
    if (e1.x > 0) != (s == 'Left'):
        e1 = -e1  # e1: outside of the arm
    e2 = ax.cross(e1).normalized()
    # the upper arm only (skin weighted to the arm, close to its axis: not the chest or the back)
    radial = lambda i: ((P[i] - c) - ax * (P[i] - c).dot(ax)).length
    ids = [i for i in range(len(P)) if w(i, f'{s}Arm') > 0.8 and abs((P[i] - c).dot(ax)) < 0.015 and radial(i) < 0.065]
    NA = 48
    rad = []
    for k_ in range(NA):
        t_ = 2 * math.pi * k_ / NA
        d_ = e1 * math.cos(t_) + e2 * math.sin(t_)
        best = [((P[i] - c) - ax * (P[i] - c).dot(ax)).dot(d_) for i in ids
                if ((P[i] - c) - ax * (P[i] - c).dot(ax)).normalized().dot(d_) > 0.97]
        rad.append(sorted(best)[int(len(best) * 0.8)] if best else None)
    known = [r_ for r_ in rad if r_]
    rad = [r_ if r_ else sum(known) / len(known) for r_ in rad]
    rad = [(rad[k_ - 1] + 2 * rad[k_] + rad[(k_ + 1) % NA]) / 4 for k_ in range(NA)]
    cr = 0.0075  # cord radius
    bm_ = bmesh.new()
    SEG, AROUND = 72, 8

    def ring_pt(t_):
        k_ = t_ / (2 * math.pi) * NA
        i0 = int(k_) % NA
        f_ = k_ - int(k_)
        r_ = rad[i0] * (1 - f_) + rad[(i0 + 1) % NA] * f_ + cr * 1.05
        return c + (e1 * math.cos(t_) + e2 * math.sin(t_)) * r_

    rows = []
    for j in range(SEG):
        t_ = 2 * math.pi * j / SEG
        p0 = ring_pt(t_)
        tan = (ring_pt(t_ + 0.01) - ring_pt(t_ - 0.01)).normalized()
        nrm = (p0 - c - ax * (p0 - c).dot(ax)).normalized()
        bi = tan.cross(nrm).normalized()
        row = []
        for k_ in range(AROUND):
            ph = 2 * math.pi * k_ / AROUND
            # two twisted strands: the section is pinched twice, the pinch turning along the cord
            rr = cr * (1 + 0.16 * math.cos(2 * ph - 14 * t_))
            row.append(bm_.verts.new(MWI @ (p0 + (nrm * math.cos(ph) + bi * math.sin(ph)) * rr)))
        rows.append(row)
    for j in range(SEG):
        for k_ in range(AROUND):
            bm_.faces.new([rows[j][k_], rows[(j + 1) % SEG][k_], rows[(j + 1) % SEG][(k_ + 1) % AROUND], rows[j][(k_ + 1) % AROUND]])
    # knot on the outside of the arm and two tails hanging toward the elbow
    kc = ring_pt(0.0) + e1 * 0.004
    bmesh.ops.create_uvsphere(bm_, u_segments=12, v_segments=8, radius=1.0,
                              matrix=Matrix.Translation(MWI @ kc) @ (MWI.to_3x3() @ Matrix.Diagonal((0.011, 0.012, 0.011))).to_4x4())
    for sgn in (-1, 1):
        start = kc + e2 * (0.006 * sgn)
        end = start + ax * 0.045 + e1 * 0.006 + e2 * (0.008 * sgn)
        prev = None
        for j in range(7):
            u_ = j / 6
            q_ = start.lerp(end, u_)
            d_ = (end - start).normalized()
            n1 = d_.cross(e2).normalized()
            n2 = d_.cross(n1).normalized()
            rr = cr * (0.85 - 0.25 * u_)
            row = [bm_.verts.new(MWI @ (q_ + (n1 * math.cos(2 * math.pi * k_ / 8) + n2 * math.sin(2 * math.pi * k_ / 8)) * rr)) for k_ in range(8)]
            if prev:
                for k_ in range(8):
                    bm_.faces.new([prev[k_], row[k_], row[(k_ + 1) % 8], prev[(k_ + 1) % 8]])
            prev = row
        bm_.faces.new(prev[::-1])
    bmesh.ops.recalc_face_normals(bm_, faces=bm_.faces[:])
    o = new_obj(f'prajioud-{s}', bm_)
    bm_.free()
    o.matrix_world = MW
    for p_ in o.data.polygons:
        p_.use_smooth = True
    o.data.materials.append(fabric(f'cordon-{color}', color, 'knit', rough=0.8, strength=2))
    weighted(o, {f'{s}Arm': 1.0})
    print('prajioud', s, len(o.data.polygons), 'faces, arm radius', round(sum(rad) / NA, 3))
    return [o]


def ring_profile(z, dz=0.012, pad=0.0, exclude=ARMS):
    """radius of the body around the vertical axis at height z (36 directions)"""
    bins = [0.0] * 36
    cx = 0.0
    cy = sum(P[i].y for i in range(len(P)) if abs(P[i].z - z) < dz and w(i, *exclude) < 0.3) / max(1, sum(1 for i in range(len(P)) if abs(P[i].z - z) < dz and w(i, *exclude) < 0.3))
    for i in range(len(P)):
        if abs(P[i].z - z) < dz and w(i, *exclude) < 0.3:
            ang = math.atan2(P[i].y - cy, P[i].x - cx)
            k = int((ang + math.pi) / (2 * math.pi) * 36) % 36
            bins[k] = max(bins[k], math.hypot(P[i].x - cx, P[i].y - cy))
    # a stray vertex (a fingertip hanging at that height) must not stretch the ring: median of the neighbours
    med = sorted(b for b in bins if b > 0)
    cap = med[len(med) // 2] * 1.6 if med else 0.2
    bins = [min(b, cap) for b in bins]
    for _ in range(3):
        bins = [max(bins[k], (bins[k - 1] + bins[(k + 1) % 36]) / 2) for k in range(36)]
    return cx, cy, [b + pad for b in bins]


def strip(name, pts, width, fwd, thick, mat, across=2):
    """v0.32 flat band of cloth along a polyline (belt, its knot and tails, collar): constant width, its face turned
    towards fwd(point) (a vector or a function), a real thickness, its own UVs (u: one texture every 5 cm along the
    band, v: 0 to 1 across it) so the stitched rows run along it"""
    bm_ = bmesh.new()
    uvl = bm_.loops.layers.uv.new()
    rows, uvs, run = [], {}, 0.0
    for k, c in enumerate(pts):
        d = (pts[min(k + 1, len(pts) - 1)] - pts[max(k - 1, 0)]).normalized()
        f = fwd(c) if callable(fwd) else fwd
        side = d.cross(f).normalized()
        if k:
            run += (pts[k] - pts[k - 1]).length
        row = []
        for j in range(across + 1):
            t = j / across
            # rounded across: the middle stands a little proud, like a folded and stitched band
            bulge = (1 - (2 * t - 1) ** 2) * width * 0.05
            v = bm_.verts.new(MWI @ (c + side * (t - 0.5) * width + f.normalized() * bulge))
            uvs[v] = (run / 0.05, t)
            row.append(v)
        rows.append(row)
    for k in range(len(rows) - 1):
        for j in range(across):
            f_ = bm_.faces.new((rows[k][j], rows[k][j + 1], rows[k + 1][j + 1], rows[k + 1][j]))
            for l in f_.loops:
                l[uvl].uv = uvs[l.vert]
    o = new_obj(name, bm_)
    bm_.free()
    o.matrix_world = MW
    o['css_uv'] = True
    solid(o, thick)
    o.data.materials.append(mat)
    return o


def curve(a, b, bend, n=10):
    """points from a to b, bowed by the vector bend at the middle"""
    return [a + (b - a) * (k / n) + bend * (4 * (k / n) * (1 - k / n)) for k in range(n + 1)]


def belt(color, z, extra=0.03):
    """v0.32 flat belt (4 cm, 5 mm thick, rows of stitches) wound round the jacket, square knot at the front and its
    two ends hanging down (Youssef, 2026-10-22: « ceinture plate, correctement nouée, avec deux extrémités »)"""
    cx, cy, rad = ring_profile(z, pad=extra)
    m = fabric(f'ceinture-{color}', color, 'ceinture', rough=0.8, strength=0.8, tone=0.06)
    seg = 72
    ring = []
    for j in range(seg + 1):
        ang = -math.pi + 2 * math.pi * j / seg
        f = j / seg * 36
        r = rad[int(f) % 36] * (1 - f % 1) + rad[(int(f) + 1) % 36] * (f % 1)
        ring.append(Vector((cx + r * math.cos(ang), cy + r * math.sin(ang), z)))
    o = strip('ceinture', ring, 0.04, lambda c: Vector((c.x - cx, c.y - cy, 0)), 0.005, m)
    parts = [o]
    front = Vector((cx, cy - rad[9], z))
    out = Vector((0, -1, 0))
    # knot: a wrap across the belt, the crossing end over it, then the two ends
    wrap = strip('noeud', curve(front + Vector((-0.034, -0.008, 0)), front + Vector((0.034, -0.008, 0)), Vector((0, -0.006, 0)), 6), 0.046, out, 0.006, m)
    cross = strip('noeud-croise', curve(front + Vector((-0.022, -0.016, 0.022)), front + Vector((0.02, -0.016, -0.024)), Vector((0, -0.006, 0)), 6), 0.036, out, 0.006, m)
    parts += [wrap, cross]
    for sgn, ln in ((1, 0.24), (-1, 0.22)):
        a = front + Vector((0.012 * sgn, -0.02, -0.018))
        b = a + Vector((0.055 * sgn, -0.035, -ln))
        parts.append(strip(f'pan-{sgn}', curve(a, b, Vector((0.012 * sgn, -0.01, 0.0)), 12), 0.04, out, 0.005, m))
    for p_ in parts:
        weighted(p_, {'Hips': 0.8, 'Spine': 0.2})
    return parts


# 1.19 (Youssef, 05/11: « les kimonos, je les voudrais moins bouffis, plus cintrés mais pas collés »): share of the
# gi's loose volume kept (sleeves, trousers, skirt, room round the trunk); 1 = the cut of the other coaches
# 1.21 (Youssef 05/11 15:14: « applique toutes les améliorations effectuées sur Inaya sur les autres coachs »): all coaches
GI_FIT = float(os.environ.get('GI_FIT', '0.6'))


def skirt(color, kind, top_z, length):
    """lower part of a gi jacket: a sleeve of cloth around the hips (not one tube per leg), open at the front where
    the two sides overlap; each front panel follows its thigh a little so a kick lifts it instead of piercing it"""
    bm_ = bmesh.new()
    # 1.37.1: more vertical sections; the old six rows showed rectangular plates on the back.
    seg = 64
    rows = []
    n = 10
    # v0.32: closer to the body (the old 2.5 to 4.5 cm made a padded, inflated skirt)
    pad0, pad1 = (0.014, 0.016) if kind == 'judo' else (0.011, 0.012)
    if kind != 'costume':
        # only the flare towards the hem: at the top the skirt covers the trousers' waist (9 mm off the skin)
        pad1 = pad1 * GI_FIT
    for k in range(n + 1):
        z = top_z - length * k / n
        cx, cy, rad = ring_profile(z, dz=0.015, pad=pad0 + pad1 * k / n)
        row = []
        for j in range(seg + 1):
            ang = -math.pi + 2 * math.pi * j / seg
            f = j / seg * 36
            r = rad[int(f) % 36] * (1 - f % 1) + rad[(int(f) + 1) % 36] * (f % 1)
            # soft vertical folds of the hanging cloth, deeper towards the hem
            r += 0.004 * (k / n) * math.sin(ang * 9 + 0.7)
            row.append(bm_.verts.new(MWI @ Vector((cx + r * math.cos(ang), cy + r * math.sin(ang), z))))
        rows.append(row)
    for k in range(n):
        for j in range(seg):
            ang = -math.pi + 2 * math.pi * (j + 0.5) / seg
            # front opening: between -100° and -80° (front is -y), the panels overlap there
            if -math.radians(97) < ang < -math.radians(83):
                continue
            bm_.faces.new((rows[k][j], rows[k][j + 1], rows[k + 1][j + 1], rows[k + 1][j]))
    o = new_obj('jupe-veste', bm_)
    bm_.free()
    o.matrix_world = MW
    solid(o, 0.004 if kind == 'judo' else 0.003)
    o.data.materials.append(gi_fabric(color, kind))

    def ww(p):
        down = max(0.0, min(1.0, (top_z - p.z) / length))
        s = 'Left' if p.x > 0 else 'Right'
        front = max(0.0, -p.y / 0.15)
        # Back skirt hangs from the hips; it must not follow the thighs and fold into
        # rectangular patches when the coach bends. Front panels retain a little leg follow.
        t = min(0.45, down * 0.48 * min(1.0, front))
        return {'Hips': 1 - t, f'{s}UpLeg': t}

    weighted(o, ww)
    return [o]


def gi_fabric(color, kind):
    """judogi: double weave, heavy, larger grains; BJJ gi: pearl weave, lighter and finer. Matt cotton"""
    if kind == 'costume':
        # 1.4.1 a referee's suit jacket: fine twill, a little sheen
        return fabric(f'costume-{color}', color, 'serge', rough=0.7, strength=0.15, sheen=0.1, tone=0.02)
    if kind == 'judo':
        return fabric(f'gi-{color}-judo', color, 'judogi', rough=0.92, strength=0.2, tone=0.03)
    return fabric(f'gi-{color}-bjj', color, 'perle', rough=0.9, strength=0.2, tone=0.04)


def collar(color, kind):
    """thick collar and lapels: from the back of the neck, over the shoulders, crossing on the chest (left over
    right) down to the belt. v0.32: a stiff stitched band (judogi 5.5 cm wide, 1.2 cm thick, 7 rows; BJJ 4.2 cm,
    1 cm, 4 rows), no longer a thin ribbon"""
    m = fabric(f'col-{color}-{kind}', color, 'col-judo' if kind == 'judo' else 'col-bjj', rough=0.9, strength=0.6, tone=0.03)
    parts = []
    nk = H['Neck']
    wd = 0.055 if kind == 'judo' else 0.042
    for s, sg in (('Left', 1), ('Right', -1)):
        pts = [
            nk + Vector((0.0, 0.07, -0.01)),
            nk + Vector((0.06 * sg, 0.045, -0.02)),
            nk + Vector((0.085 * sg, -0.02, -0.05)),
            nk + Vector((0.05 * sg, -0.11, -0.16)),
            nk + Vector((-0.03 * sg, -0.13, -0.33)),
            nk + Vector((-0.09 * sg, -0.125, nk.z * 0 + (hipZ + 0.06) - nk.z)),
            # v0.32: down to the hem of the jacket, as on a real gi (it covers the front opening of the skirt)
            nk + Vector((-0.1 * sg, -0.13, (hipZ - (0.2 if kind == 'judo' else 0.16)) - nk.z)),
        ]
        # just above the jacket surface (body + jacket offset); the left lapel lies over the right one
        fixed = []
        for p in pts:
            j = min(range(len(P)), key=lambda i: (P[i] - p).length_squared if w(i, *ARMS) < 0.3 else 9)
            # above the skirt below the belt (the skirt stands up to 3 cm off the thigh)
            off = 0.02 if s == 'Left' else 0.013
            if p.z < hipZ:
                off += 0.02 + (hipZ - p.z) * 0.08
            fixed.append(P[j] + N[j] * off)
        path = []
        steps = 30
        for k in range(steps + 1):
            t = k / steps * (len(fixed) - 1)
            i0 = min(int(t), len(fixed) - 2)
            u = t - i0
            path.append(fixed[i0] * (1 - u) + fixed[i0 + 1] * u)
        nrm = lambda c: N[min(range(len(P)), key=lambda i: (P[i] - c).length_squared)]
        o = strip(f'revers-{s}', path, wd, nrm, 0.012 if kind == 'judo' else 0.010, m, across=3)
        smooth(o, 1)
        def lw(p):
            if p.z > chestZ:
                return {'Spine2': 0.7, 'Neck': 0.3}
            if p.z > hipZ + 0.2:
                return {'Spine2': 0.5, 'Spine1': 0.3, 'Spine': 0.2}
            if p.z > hipZ:
                return {'Spine': 0.5, 'Hips': 0.5}
            # below the belt the lapel follows the thigh it lies on, like the skirt's front panels
            t = min(0.5, (hipZ - p.z) / 0.2 * 0.5)
            return {'Hips': 1 - t, ('Left' if p.x > 0 else 'Right') + 'UpLeg': t}
        weighted(o, lw)
        parts.append(o)
    return parts


# 1.19 (Youssef, 05/11, capture of the MMA short from behind): the ribs of the elastic waistband read as crumpled,
# striped cloth over the curve of the glutes; Inaya's bands are smoother (relief and tone of the knit lowered)
# 1.21: every coach (Inaya's 1.19 setting)
BAND_RELIEF = float(os.environ.get('BAND_RELIEF', '0.15'))


def shorts(kind, color, band, n_leg=None, under=False, hem_override=None):
    """kind: boxe (loose, to just above the knee, high waistband), kick (fitted, short), thai (short, very wide,
    high waistband), mma (board short, side slits, to the knee), compression"""
    # the photo body has its underwear painted down to mid-thigh: every short reaches below it
    # 1.9 (Youssef's MMA coach references, 2026-10-29): vale-tudo = fitted compression short to mid-thigh, thin
    # flat waistband, matt jersey
    # 1.22 (Youssef 05/11 18:07, photos of women's MMA kits: « une tenue dans les styles des photos »): surshort, the
    # short loose over-short of a 2-in-1 MMA short, worn over the vale-tudo liner; high on the thigh, gathered waist
    # One cut per reference, with each wearer's own hip/thigh measurements.
    # The feminine Inaya cut follows her waist and hips with a fitted liner and
    # a short flowing outer layer; both retain their athletic mobility.
    blueprint = MMA_SHORT_CUTS[MMA_SHORT_REFERENCE]
    hem = {'boxe': 0.3, 'kick': 0.3, 'thai': 0.32, 'mma': 0.18, 'compression': 0.3,
           'vale-tudo': blueprint['liner_hem'], 'surshort': blueprint.get('over_hem', SUR_HEM)}[kind]
    if hem_override is not None:
        hem = max(0.0, min(0.75, float(hem_override)))
    waist = hipZ + {'boxe': 0.13, 'kick': 0.11, 'thai': 0.13, 'mma': 0.11, 'compression': 0.1,
                    'vale-tudo': blueprint['liner_waist'], 'surshort': blueprint.get('over_waist', 0.105)}[kind]
    # 1.10: the waistband covers the underwear painted on the skin (Kadir's showed as a brown band above his
    # vale-tudo short in 1.9), 8 mm over its top at most 6 cm higher than the cut asked
    if 'top' not in _PAINT:
        tops = [r[1] for r in (painted_cloth_range(hipZ - 0.05, hipZ + 0.2, b) for b in (True, False)) if r]
        _PAINT['top'] = max(tops) if tops else None
        print('sous-vêtement peint, haut', None if _PAINT['top'] is None else round(_PAINT['top'], 3), 'bassin', round(hipZ, 3))
    if _PAINT['top'] is not None:
        waist = max(waist, min(waist + 0.06, _PAINT['top'] + 0.008))
    if kind == 'surshort':
        # 1.22 its waistband covers the liner's (both were raised to the same painted line: the liner's rim came
        # through the top of the gathered band)
        waist += 0.008
    bandH = {'boxe': 0.07, 'kick': 0.04, 'thai': 0.08, 'mma': 0.04, 'compression': 0.025, 'vale-tudo': 0.035, 'surshort': 0.045}[kind]

    def hemz(i):
        s = leg_of(i)
        return H[f'{s}Leg'].z + hem * (H[f'{s}UpLeg'].z - H[f'{s}Leg'].z)

    def keep(i):
        if P[i].z > waist or w(i, *ARMS) > 0.2 or P[i].z < hemz(i):
            return False
        # v0.32: the MMA side slit cut along the skin's triangles came out torn (Youssef 2026-10-22: « bordures
        # irrégulières »); 1.26 brings it back, cut by the field (see slit below)
        return True

    def push(i):
        # MH_BODY: the glutes of a MakeHuman body rise close to the waistband; the loose leg push there lifted the
        # cloth over the band (black teeth on the band)
        if kind == 'surshort':
            # v1.37.2: the previous 10–12 mm belt clearance made a pink
            # floating ring around the waist. Retain enough clearance for the
            # 6.7 mm inner liner, without lifting the band away from the hips.
            if P[i].z > hipZ + 0.02:
                return 0.008 + (0.001 if P[i].z > waist - bandH else 0)
            s = leg_of(i)
            # 1.22.1 the inside of the legs close to the crotch: snug (the loose cloth there folded on itself at a high kick)
            crotch = max(0.0, 1 - abs(P[i].x) / SUR_CROTCH)
            c2 = crotch * crotch * (3 - 2 * crotch)
            # only above the liner's top (the liner, 6.7 mm out, ends there under the over-short)
            if UNDER_OVERLAP >= 0:
                t = min(1.0, max(0.0, (P[i].z - (hemz(i) + UNDER_OVERLAP)) / 0.02))
                c2 *= t * t * (3 - 2 * t)
            # Inaya reference: the inner layer contours the thigh while the
            # outer layer releases gradually from the hip to the hem. The flare
            # is suppressed near the crotch to avoid inflated / angular panels.
            female_flare = blueprint.get('over_flare', SUR_FLARE)
            return loose(i, f'{s}UpLeg', f'{s}Leg', 0.010 - SUR_SNUG * c2,
                         lambda u: female_flare * u ** 1.3 * (1 - c2)) + N[i] * folds(i, 0.002 * (1 - c2))
        if kind == 'vale-tudo':
            # a flat waistband (a raised one made lumps on the Rocketbox body). 1.10: the 3 mm of extra room at the
            # hem made the leg flare (Youssef's audit: « jambes légèrement évasées »); the hem is now cut exactly by
            # its field and the skin hidden up to 6 mm from it, so the skin no longer pierces a close fit there
            return 0.0042 + 0.0008 * max(0.0, 1 - (P[i].z - hemz(i)) / 0.03)
        if P[i].z > hipZ + 0.02 or (MH_BODY and P[i].z > waist - bandH - 0.05):
            if MH_BODY:
                t = min(1.0, max(0.0, (P[i].z - (waist - bandH)) / 0.015 + 0.5))
                return 0.004 + 0.006 * t * t * (3 - 2 * t)
            if CLEAN_BIKINI:
                # 1.37.7: the 6 mm step of the waistband taken by each point's closest skin point alternated along
                # the band's lower line (yellow teeth on Amara's boxing and Thai shorts): a soft 1 cm ramp
                t = min(1.0, max(0.0, (P[i].z - (waist - bandH - 0.008)) / 0.01))
                return 0.004 + 0.006 * t * t * (3 - 2 * t)
            return 0.004 + (0.006 if P[i].z > waist - bandH else 0)
        s = leg_of(i)
        if kind in ('kick', 'compression', 'vale-tudo'):
            return 0.003
        flare = {'boxe': 0.03, 'thai': 0.075, 'mma': 0.022}[kind]
        crotch = max(0.0, 1 - abs(P[i].x) / 0.05)
        return loose(i, f'{s}UpLeg', f'{s}Leg', 0.005, lambda u: flare * u ** 1.5 * (1 - 0.7 * crotch) * (0.55 if abs(P[i].x) < abs(axis_point(i, f'{s}UpLeg', f'{s}Leg')[0].x) else 1))

    # v0.32 (« matières trop brillantes ou plastifiées »): satin keeps a soft sheen but is no longer wet-looking,
    # polyester is matt; the satin relief is shallower (it drew wavy lines)
    sheenK = {'boxe': ('satin', 0.6, 0.35, 0.3), 'thai': ('satin', 0.58, 0.4, 0.3), 'kick': ('serge', 0.62, 0.2, 0.4), 'mma': ('flat', 0.68, 0.1, 1.0), 'compression': ('jersey', 0.78, 0.06, 0.34), 'vale-tudo': ('jersey', 0.8, 0.06, 0.4), 'surshort': ('serge', 0.64, 0.15, 0.35)}[kind]
    body_mat = grad_fabric(f'short-{kind}-degrade', sheenK[0], sheenK[1], sheenK[3], sheenK[2]) if isinstance(color, tuple) else fabric(f'short-{kind}-{color}', color, sheenK[0], rough=sheenK[1], sheen=sheenK[2], strength=sheenK[3])
    # 1.22 the gathered waist of the surshort: the elastic relief stronger (its ruffles), the colour a little darker in the hollows
    # Reduce deep corrugations: the contrasting waistband should read as
    # flexible elastic, not a row of detached stiff rectangles.
    band_rel = 0.35 if kind == 'surshort' else BAND_RELIEF
    mats = [body_mat, fabric(f'ceinture-{kind}-{band}', band, 'elastique', rough=0.65, strength=band_rel, tone=0.1 if band_rel >= 0.5 else 0.03)]
    # 1.10: waist and hems are the zero line of a field (exact, smooth edges whatever the body's triangles; the plane
    # cuts left a wavy waistband on the MakeHuman bodies); the band's lower line stays a straight plane cut
    hz = {s: H[f'{s}Leg'].z + hem * (H[f'{s}UpLeg'].z - H[f'{s}Leg'].z) for s in ('Left', 'Right')}
    F = lambda q: max(q.z - waist, hz['Left' if q.x > 0 else 'Right'] - q.z)
    # The v1.26 procedural side slit on the female over-short creates a
    # pointed torn flap when its two moving layers cross. Keep a clean hem
    # here until a dedicated reinforced slit mesh is available.
    if kind in ('vale-tudo', 'mma') and not under and SLIT_H > 0:
        # 1.26 (Youssef, 2026-11-06, two photos of MMA shorts: « les shorts de MMA doivent avoir la petite fente »):
        # a short slit on the outer side of each leg, from the hem up, narrowing to a point. Cut by the field like
        # the hem (smooth edges; the v0.32 slit, cut along the skin's triangles, came out torn). What lies under it
        # stays drawn: the skin, or the liner of a 2-in-1 short
        F1 = F

        def slit(q):
            s_ = 'Left' if q.x > 0 else 'Right'
            sx = 1 if H[f'{s_}UpLeg'].x > 0 else -1
            a, b = H[f'{s_}UpLeg'], H[f'{s_}Leg']
            t = (q.z - b.z) / (a.z - b.z)
            cx, cy = b.x + (a.x - b.x) * t, b.y + (a.y - b.y) * t
            dx, dy = q.x - cx, q.y - cy
            r = math.hypot(dx, dy)
            ang = abs(math.atan2(dy, dx * sx))
            zz = q.z - hz[s_]
            return min(SLIT_W * (1 - zz / SLIT_H) - ang * r, SLIT_H - zz)

        F = lambda q: max(F1(q), slit(q))
    if under:
        # 1.22.1 (Youssef 05/11 19:05: « essaye de régler le froissement lors du high kick »): the liner under the
        # over-short is only its legs, from its hem to 1.5 cm inside the over-short's. Whole, it kept the over-short
        # 10 mm off the skin at the crotch: that loose cloth folded on itself when the hip bent at a high kick (grey
        # patches in the groin); without the liner there, the over-short is snug at the crotch (push above)
        hz_sur = {s: H[f'{s}Leg'].z + SUR_HEM * (H[f'{s}UpLeg'].z - H[f'{s}Leg'].z) + UNDER_OVERLAP for s in ('Left', 'Right')}
        F0 = F
        F = lambda q: max(F0(q), q.z - hz_sur['Left' if q.x > 0 else 'Right'])
        if CLEAN_BIKINI:
            # 1.37.7: Amara's lower crotch puts the liner's top across it: its two leg tubes are parted along the
            # middle (12 mm each side, under the over-short): the thin panel that joined them stretched into the dark strand.
            # The skin of that strip stays hidden (LINER_GAP_SKIN=1 draws it: its large crotch triangles, stretched by
            # the guard, then came through the inside of the thigh, captures 12/11)
            F1u = F
            # only at the crotch itself (its lowest midline point and 3 cm under it): lower, the gap took the inner
            # side of each thigh away and the skin showed down the liner (captures 12/11)
            _kz = (H['LeftLeg'].z + H['LeftUpLeg'].z) * 0.5
            apex = min((q.z for q in P if abs(q.x) < 0.003 and _kz < q.z < H['Hips'].z), default=-1.0)
            gap_lo = apex - float(os.environ.get('LINER_GAP_DEPTH', '0.03'))
            F = lambda q: max(F1u(q), min(float(os.environ.get('LINER_GAP', '0.012')) - abs(q.x), q.z - gap_lo))
    # v1.37.6: A small web of very narrow polygons was measured at the
    # midline of Amara's MMA over-short near its inner hems (z ~= 0.81 m).
    # The model-derived shorts copied skin topology in that region. Excise
    # only the lower central crotch of BOTH MMA layers as an exact ISO cut,
    # rather than deleting faces after Solidify (which leaves torn open rims).
    # The cut follows the athlete's own morphology. Its top is far below the
    # front pelvis, where full garment coverage must be retained.
    if AMARA_PATCHES and kind in ('surshort', 'vale-tudo'):
        oldF = F
        if kind == 'surshort':
            cut_top = min(hz.values()) + 0.032
            clearance = 0.032
        else:
            # The fitted lower liner ends just beneath the over-short.
            # Its central skin bridge must not project into the leg gap.
            cut_top = min(hz_sur.values()) - 0.008 if under else min(hz.values()) + 0.025
            clearance = 0.027
        def no_groin_web(q):
            gap = min(clearance - abs(q.x), cut_top - q.z)
            return max(oldF(q), gap)
        F = no_groin_web
        print('v1.37.6 Amara MMA crotch opening', kind,
              'half-width', clearance, 'top', round(cut_top, 4))
    keep_g = lambda i: P[i].z < waist + 0.03 and P[i].z > min(hz.values()) - 0.04 and w(i, *ARMS) < 0.2
    cuts = [(Vector((0, 0, waist - bandH)), Vector((0, 0, 1)))]
    # fine jersey for the fitted cuts (2.5 mm with its rim), 3.5 mm for the loose ones
    thick = 0.0025 if kind in ('vale-tudo', 'compression', 'kick') else 0.003 if kind == 'surshort' else 0.0035
    # v1.37.5: yellow Thai/boxing waistbands on Amara had serrated colour
    # transitions, particularly behind her moving hips. The previous plane
    # projection was only enabled for the MMA two-layer short.
    old_oncut = _ONCUT[0]
    if AMARA_PATCHES:
        _ONCUT[0] = True
    try:
        o, cov = shell(f'short-{kind}', keep_g, push, thick, mats, lambda c, ids: 1 if c.z > waist - bandH else 0, cuts=cuts, iso=F,
                       hem=0.004 if thick < 0.003 else 0.006)
    finally:
        _ONCUT[0] = old_oncut
    smooth(o, 1)
    if AMARA_PATCHES and kind in ('surshort', 'vale-tudo'):
        # Exported into glTF extras and inspected independently by Blender CI.
        o['cssCrotchGapCut'] = round(cut_top, 5)
        o['cssCrotchGapHalfWidth'] = round(clearance, 5)
    # Kadir has a different source hip topology from the Nael reference. At the
    # inner crotch seam, alternating opposite-leg weights pull a few triangles
    # into long needles as the stance spreads. A local blend with Hips removes
    # the divergent forces without changing the male Nael silhouette or the
    # other outfits. The easing reaches zero outside the narrow seam.
    if KADIR_MMA_CROTCH and kind == 'vale-tudo':
        hips_group = o.vertex_groups.get('Hips')
        left = o.vertex_groups.get('LeftUpLeg')
        right = o.vertex_groups.get('RightUpLeg')
        if not all((hips_group, left, right)):
            raise RuntimeError('Kadir MMA: missing hips or upper-leg skinning group')
        moved_vertices = 0
        for vertex in o.data.vertices:
            q = o.matrix_world @ vertex.co
            x = max(0.0, min(1.0, (0.110 - abs(q.x)) / 0.075))
            zlo = max(0.0, min(1.0, (q.z - (hipZ - 0.20)) / 0.07))
            zhi = max(0.0, min(1.0, ((hipZ + 0.035) - q.z) / 0.06))
            fade = 0.45 * x * x * (3 - 2 * x) * zlo * zhi
            if fade < 0.0005:
                continue
            weights = {g.group: g.weight for g in vertex.groups}
            moved = 0.0
            for group in (left, right):
                original = weights.get(group.index, 0.0)
                if original > 0:
                    delta = original * fade
                    group.add([vertex.index], original - delta, 'REPLACE')
                    moved += delta
            if moved > 0:
                hips_group.add([vertex.index], weights.get(hips_group.index, 0.0) + moved, 'REPLACE')
                moved_vertices += 1
        print('Kadir MMA: crotch skin weights stabilised:', moved_vertices)
        if not moved_vertices:
            raise RuntimeError('Kadir MMA: zero crotch vertices stabilised; check source body')
    if under and CLEAN_BIKINI and os.environ.get('LINER_RIGID', '0') == '1':
        # 1.37.7 (Amara, thin dark strand between the thighs at a high kick, measured in the Lab with __labStretch: the
        # liner's faces 0.73 -> 0.78 m at the inner thigh stretched to 13 cm). Amara's crotch is lower than Inaya's,
        # so the liner's top reaches it: its points there were held half by the pelvis, half by the leg. The liner is
        # only its two leg tubes, under the over-short: each follows its own thigh entirely
        moved = 0
        for v in o.data.vertices:
            q = o.matrix_world @ v.co
            leg = o.vertex_groups.get('LeftUpLeg' if q.x > 0 else 'RightUpLeg')
            other = o.vertex_groups.get('RightUpLeg' if q.x > 0 else 'LeftUpLeg')
            tot = 0.0
            for g in list(v.groups):
                gname = o.vertex_groups[g.group].name
                if g.weight > 0 and (gname in ('Hips', 'Spine') or g.group == other.index):
                    tot += g.weight
                    o.vertex_groups[g.group].remove([v.index])
            if tot > 0:
                cur = next((g.weight for g in v.groups if g.group == leg.index), 0.0)
                leg.add([v.index], cur + tot, 'REPLACE')
                moved += 1
        print('1.37.7 Amara : sous-short tenu par chaque cuisse, points', moved)
    if under and CLEAN_BIKINI:
        o['cssLinerGap'] = float(os.environ.get('LINER_GAP', '0.012'))
    if under:
        # the skin stays hidden over the whole liner's region, as before (what the cut part covered is under the
        # over-short)
        cov = set(cov) | {i for i in range(len(P)) if keep_g(i) and F0(P[i]) < -0.002
                          and not (CLEAN_BIKINI and os.environ.get('LINER_GAP_SKIN', '0') == '1' and abs(P[i].x) < float(os.environ.get('LINER_GAP', '0.012')) + 0.004
                                   and P[i].z > gap_lo - 0.004)}
    if isinstance(color, tuple):
        paint_grad(o, color, min(hz.values()), waist - bandH)
    return [o], cov


def top(kind, color, accent=None, geom=False, nogi=False):
    """kind: brassiere (sports bra), debardeur (tank top), rash-court, rash-long"""
    lowZ = {'brassiere': chestZ - 0.07 if female else chestZ - 0.05, 'debardeur': hipZ + 0.06, 'rash-court': hipZ + 0.04, 'rash-long': hipZ + 0.04}[kind]
    sleeve = {'brassiere': 0, 'debardeur': 0, 'rash-court': 0.45, 'rash-long': 0.93}[kind]

    def keep(i):
        # The iso hem below trims the extra 3 cm exactly at lowZ. Without this
        # margin, early vertex pruning tears the hem into the body's triangle grid.
        floor = lowZ - (0.03 if kind.startswith('rash-') else 0)
        if P[i].z < floor or w(i, 'Head') > 0.2 or w(i, *HANDS) > 0.5 or P[i].z > H['Neck'].z + 0.01:
            return False
        if w(i, 'Neck') > (0.25 if kind != 'brassiere' else 0.15):
            return False
        armw = sum(w(i, f'{s}Arm', f'{s}ForeArm') for s in ('Left', 'Right'))
        if armw > 0.35:
            if not sleeve:
                return False
            s = 'Left' if P[i].x > 0 else 'Right'
            if w(i, f'{s}ForeArm') > 0.3:
                _, u = axis_point(i, f'{s}ForeArm', f'{s}Hand')
                return sleeve > 0.5 and u < (sleeve - 0.5) * 2
            _, u = axis_point(i, f'{s}Arm', f'{s}ForeArm')
            return u < sleeve * (2 if sleeve <= 0.5 else 1)
        if kind == 'brassiere' and (GEOM_BRA or geom):
            # MakeHuman bodies (1.5): their shoulder and neck weights blend over a wide area, so the weight rules
            # below gave a torn edge; the same cut drawn from positions only: scoop at the front with two straps,
            # racer back behind
            nk = H['Neck']
            ax = abs(P[i].x)
            if P[i].y < 0:
                return P[i].z < nk.z - 0.13 or (0.05 < ax < 0.1 and P[i].z < nk.z - 0.02)
            return P[i].z < chestZ + 0.02 or (ax < 0.06 and P[i].z < nk.z - 0.02)
        if kind in ('brassiere', 'debardeur'):
            # neckline: scoop at the front, racer back behind (shoulder blades free)
            nk = H['Neck']
            if P[i].y < 0 and P[i].z > nk.z - (0.13 if kind == 'brassiere' else 0.1) and abs(P[i].x) < 0.075:
                return False
            if kind == 'brassiere' and P[i].y > 0 and P[i].z > chestZ - 0.04 and abs(P[i].x) > 0.06:
                return False
            if w(i, 'LeftShoulder', 'RightShoulder') > 0.45 and abs(P[i].x) > 0.1:
                return False
        return True

    mats = [fabric(f'haut-{kind}-{color}', color, 'jersey', rough=0.79, strength=0.35, sheen=0.05)]
    if accent:
        mats.append(fabric(f'liseré-{accent}', accent, 'elastique', rough=0.6, strength=0.8))
    cuts = [(Vector((0, 0, lowZ)), Vector((0, 0, 1)))]
    for s_ in ('Left', 'Right'):
        if 0 < sleeve <= 0.5:
            a, b = H[f'{s_}Arm'], H[f'{s_}ForeArm']
            cuts.append((a + (b - a) * sleeve * 2, (b - a).normalized()))
        elif sleeve > 0.5:
            a, b = H[f'{s_}ForeArm'], H[f'{s_}Hand']
            cuts.append((a + (b - a) * (sleeve - 0.5) * 2, (b - a).normalized()))
    if nogi and accent:
        # Split source triangles on the No-Gi colour boundaries, rather than
        # assigning whole irregular triangles to different materials.
        for xcut in (-0.105, 0.105):
            cuts.append((Vector((xcut, 0, 0)), Vector((1, 0, 0))))
        cuts.append((Vector((0, 0, chestZ + 0.10)), Vector((0, 0, 1))))
    if kind == 'brassiere' and (GEOM_BRA or geom):
        nk = H['Neck']
        cuts += [(Vector((0, 0, z)), Vector((0, 0, 1))) for z in (nk.z - 0.13, chestZ + 0.02, nk.z - 0.02)]
        cuts += [(Vector((x, 0, 0)), Vector((1, 0, 0))) for x in (-0.1, -0.06, -0.05, 0.05, 0.06, 0.1)]
    def tpush(i):
        if kind == 'debardeur':
            return 0.006
        # 1.19 (Youssef, 05/11, capture of the no-gi kit): the waistband of the leggings worn under the long rash
        # guard (2.5 mm off the skin, 3 mm thick) came through its hem as black teeth; the rash guard now stands
        # 8 mm off the skin over its lowest 6 cm, easing back to 3.5 mm above
        # (the short one stays close: it is worn under the gi jacket)
        if kind == 'rash-long':
            t = max(0.0, min(1.0, (lowZ + 0.09 - P[i].z) / 0.03))
            return 0.0035 + 0.0045 * t * t * (3 - 2 * t)
        return 0.0035

    # Planar isosurface for the rashguard hem: exactly horizontal around the entire
    # waist rather than a zigzag following the skin's last surviving triangles.
    hem_field = (lambda q: lowZ - q.z) if kind.startswith('rash-') else None
    o, cov = shell(f'haut-{kind}', keep, tpush, 0.003, mats,
                   (lambda c, ids: 1 if (nogi and abs(c.x) > 0.105 and c.z < chestZ + 0.10) or (not nogi and w(ids[0], *ARMS) < 0.2 and abs(abs(c.x) - 0.16) < 0.02 and abs(c.y) < 0.03 and c.z < chestZ) else 0) if accent else None, cuts=cuts, iso=hem_field)
    for s_ in ('Left', 'Right'):
        fold_weights(o, [n for n in G if n.startswith(s_) and 'Hand' in n], f'{s_}ForeArm')
    return [o], cov


def _ss(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def _smin(a, b, k):
    h = max(0.0, min(1.0, 0.5 + 0.5 * (b - a) / k))
    return b + (a - b) * h - k * h * (1 - h)


def painted_cloth_bottom(zlo, zhi, back=True):
    r = painted_cloth_range(zlo, zhi, back)
    return None if r is None else r[0]


_PAINT = {}


def painted_cloth_range(zlo, zhi, back=True):
    """1.10: lowest height of the underwear painted on the skin texture (the Rocketbox photo bodies, and the
    MakeHuman coaches whose skin was transferred from them, carry a painted sports bra): texels much darker than the
    skin around the spine (back) or the sternum (front), between zlo and zhi. A garment must reach below it, or the
    painted band shows under its edge (seen on Kaila's back in 1.9). None when nothing is painted"""
    import numpy as _np
    mat = body.active_material
    img = None
    if mat and mat.use_nodes:
        for nd in mat.node_tree.nodes:
            if nd.type == 'TEX_IMAGE' and nd.image and 'normal' not in nd.image.name.lower():
                lk = [l for l in mat.node_tree.links if l.from_node == nd and l.to_socket.name == 'Base Color']
                if lk:
                    img = nd.image
    if img is None:
        return None
    wd, ht = img.size
    px = _np.empty(wd * ht * 4, _np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(ht, wd, 4)
    uvl = me.uv_layers.active.data
    uv_of = {}
    for lp in me.loops:
        uv_of.setdefault(lp.vertex_index, uvl[lp.index].uv)
    yc = H['Spine2'].y
    samples = []
    for i in range(len(P)):
        q = P[i]
        if not (zlo < q.z < zhi and abs(q.x) < 0.07 and ((q.y > yc + 0.02) if back else (q.y < yc - 0.04))) or i not in uv_of:
            continue
        u, v = uv_of[i]
        c = px[min(ht - 1, max(0, int(v * ht))), min(wd - 1, max(0, int(u * wd)))]
        samples.append((q.z, 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]))
    if not samples:
        return None
    skin = sorted(l for _, l in samples)[int(len(samples) * 0.85)]
    dark = sorted(z for z, l in samples if l < skin * 0.35)
    if len(dark) < 8:
        return None
    return dark[max(0, int(len(dark) * 0.03))], dark[min(len(dark) - 1, int(len(dark) * 0.97))]


def bra_field(straps=True):
    """1.10 (Youssef 2026-11-03, « brassière de la coach blonde » first): the racer-back sports bra as a field on the
    body, < 0 inside, measured on the coach's own landmarks. Before, its edges were the body's triangles (Rocketbox)
    or axis-aligned planes (MakeHuman): torn edges at the armpits and a rectangular block in the back.
    - under-band: from the band's bottom (chest joint - 7 cm) to its top, which rises from the back (at the chest
      joint) to the front cups, with a soft scoop between the cups; stops at the side seam under the arm;
    - two straps from the top of the cups, over the trapezius near the neck, down the back to meet between the
      shoulder blades, each a band 2.2 cm wide laid on the skin (a spline snapped to the body), widening to 3.2 cm
      where they meet;
    - the racer panel from that meeting point down to the band, widening as it goes;
    joined with smooth unions (rounded joins, no corner where the pieces meet)"""
    nk = H['Neck']
    cz = chestZ
    low = bra_low()
    # torso landmarks: centre depth and half width at the chest, without the arms
    def armw(i):
        return w(i, 'LeftArm', 'RightArm', 'LeftForeArm', 'RightForeArm')
    # (the arm's weights spread over the side of the torso; the hanging arms are further out than 20 cm)
    sl = [P[i] for i in range(len(P)) if abs(P[i].z - (cz - 0.03)) < 0.006 and abs(P[i].x) < 0.2 and armw(i) < 0.6 and w(i, *HANDS) < 0.1]
    yc = (min(p.y for p in sl) + max(p.y for p in sl)) / 2
    xside = max(abs(p.x) for p in sl if abs(p.y - yc) < 0.05) - 0.004
    def surf(x, z, front):
        """the body point at (x, z) on the front (smallest y) or the back"""
        c = [P[i] for i in range(len(P)) if abs(P[i].x - x) < 0.009 and abs(P[i].z - z) < 0.009 and armw(i) < 0.2]
        return (min if front else max)(c, key=lambda p: p.y)
    def top_of(x):
        # top of the trapezius: not the neck (its points rise well above the shoulder line)
        c = [P[i] for i in range(len(P)) if abs(P[i].x - x) < 0.008 and abs(P[i].y - nk.y) < 0.035 and armw(i) < 0.2 and w(i, 'Head', 'Neck') < 0.3]
        return max(c, key=lambda p: p.z)
    D = surf(0.0, cz + 0.075, False)
    paths = []
    for sx in (1, -1):
        # front: up from the cup; over the trapezius; back: straight down and in to the meeting point (a racer back
        # runs diagonally, it does not swing out over the shoulder blade)
        ctrl = [surf(sx * 0.082, nk.z - 0.135, True), surf(sx * 0.08, nk.z - 0.07, True), top_of(sx * 0.075),
                surf(sx * 0.05, (nk.z - 0.04) * 0.55 + D.z * 0.45, False), D]
        pts = []
        for k in range(len(ctrl) - 1):
            p0, p1, p2, p3 = ctrl[max(0, k - 1)], ctrl[k], ctrl[k + 1], ctrl[min(len(ctrl) - 1, k + 2)]
            for j in range(12):
                t = j / 12
                q = 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3)
                pts.append(P[KD.find(q)[1]].copy())
        pts.append(D.copy())
        # snapped to the nearest skin point each sample zigzags by a few millimetres: a wavy strap edge. Relaxed
        # along the curve, each sample then held at the skin's height under it (nearest point + its normal)
        for _ in range(6):
            pts = [pts[0]] + [(pts[k - 1] + pts[k] * 2 + pts[k + 1]) / 4 for k in range(1, len(pts) - 1)] + [pts[-1]]
        pts = [q + N[KD.find(q)[1]] * (P[KD.find(q)[1]] - q).dot(N[KD.find(q)[1]]) for q in pts]
        # arc length along the strap (0 at the cup, 1 at the meeting point): its width grows toward the back
        L = [0.0]
        for a, b in zip(pts, pts[1:]):
            L.append(L[-1] + (b - a).length)
        paths.append((pts, [x / L[-1] for x in L], [N[KD.find(q)[1]] for q in pts]))
    def strap(q):
        best = 1e9
        for pts, u, nn in paths:
            for k in range(len(pts) - 1):
                a, b = pts[k], pts[k + 1]
                ab = b - a
                t = max(0.0, min(1.0, (q - a).dot(ab) / max(1e-9, ab.dot(ab))))
                # distance measured across the skin (the part along the skin's normal counts for little): over the
                # ridge of the trapezius a plain 3D distance gave a wider, lumpy strap
                r = q - (a + ab * t)
                n_ = nn[k]
                dn = r.dot(n_)
                d = (r - n_ * dn).length + 0.3 * abs(dn) - (0.011 + 0.005 * _ss(0.7, 1.0, u[k] + (u[k + 1] - u[k]) * t))
                best = min(best, d)
        return best
    # upper arm and forearm: in the rest pose of the Rocketbox bodies the forearms hang at chest height, and with the
    # upper arm only the cut kept them (Amara's bra reached her wrists, 43 cm from the axis)
    arms = [(H[f'{s_}{a}'], H[f'{s_}{b}']) for s_ in ('Left', 'Right') for a, b in (('Arm', 'ForeArm'), ('ForeArm', 'Hand'))]
    shoulder_x = max(abs(H['LeftArm'].x), abs(H['RightArm'].x))

    def arm_clear(q):
        best = 1e9
        for a, b in arms:
            ab = b - a
            t = max(0.0, min(1.0, (q - a).dot(ab) / ab.dot(ab)))
            best = min(best, (q - (a + ab * t)).length)
        # and never past the shoulder joints sideways (the torso is narrower than that)
        return max(0.068 - best, abs(q.x) - shoulder_x - 0.01)

    def field(q):
        ax = abs(q.x)
        front = _ss(yc + 0.02, yc - 0.035, q.y)
        t_front = nk.z - 0.158 + 0.04 * _ss(0.0, 0.07, ax)
        t_back = cz + 0.004
        T = t_back + (t_front - t_back) * front
        # armhole: the top edge dips toward the side, under the armpit (no cloth over the shoulder joint)
        T -= 0.05 * _ss(0.1, 0.17, ax) * (1 - 0.6 * front)
        # the side seam is not a vertical cut any more (it left the flank bare under the arm): the band wraps the
        # whole torso and stops where the upper arm begins (6.8 cm round its axis, a smooth line in the armpit)
        band = max(q.z - T, low - q.z, arm_clear(q))
        # racer panel (back only): 2 cm wide under the meeting point, 9 cm at the band
        wz = 0.016 + 0.32 * max(0.0, D.z - q.z)
        panel = max(ax - wz, q.z - D.z, yc + 0.01 - q.y, low - q.z)
        f = _smin(band, panel, 0.02)
        if not straps:
            # 1.12 bandeau (Youssef, 04/11, « Brassière sans bretelles au cou », Inaya): the band alone, no straps and
            # no racer panel, so nothing runs over the sports body's halter straps at the neck
            return band
        # the straps never cross the under-arm side seam
        f = _smin(f, max(strap(q), arm_clear(q)), 0.008)
        return f
    print('brassiere: centre y', round(yc, 3), 'demi-largeur', round(xside, 3), 'croisement dos z', round(D.z, 3))
    return field


_BRA_LOW = []


def bra_low():
    """bottom of the under-band: 7 cm under the chest joint, lower when the skin has a bra painted lower (1 cm under it)"""
    if not _BRA_LOW:
        low = chestZ - 0.07
        for back in (True, False):
            z = painted_cloth_bottom(chestZ - 0.2, chestZ + 0.02, back)
            print('brassiere peinte', 'dos' if back else 'devant', None if z is None else round(z, 3))
            if z is not None:
                low = min(low, z - 0.01)
        _BRA_LOW.append(max(low, chestZ - 0.12))
    return _BRA_LOW[0]


def bra_v2(color, accent=None, bandeau=False, band=0.02):
    """1.10 racer-back sports bra cut by bra_field() (smooth edges), thin jersey (2.2 mm), its under-band in the
    accent colour when there is one (straight line 2 cm above the bottom). bandeau (1.12): the band alone"""
    F = bra_field(straps=not bandeau)
    nk = H['Neck']
    low = bra_low()
    def keep(i):
        return low - 0.02 < P[i].z < nk.z + 0.01 and w(i, 'Head') < 0.2 and w(i, *HANDS) < 0.3 and F(P[i]) < 0.03
    grad = isinstance(color, tuple)
    mats = [grad_fabric('haut-brassiere-degrade', 'jersey', 0.62, 0.45, 0.12) if grad else fabric(f'haut-brassiere-{color}', color, 'jersey', rough=0.62, strength=0.45, sheen=0.12)]
    cuts = []
    if accent:
        mats.append(fabric(f'liseré-{accent}', accent, 'elastique', rough=0.6, strength=0.8))
        cuts.append((Vector((0, 0, low + band)), Vector((0, 0, 1))))
    # 5.5 mm off the skin: at 3.8 the chest pushed through under the front strap when the arm reaches out (Kaila's jab)
    o, cov = shell('haut-brassiere', keep, lambda i: 0.0055, 0.0022, mats,
                   (lambda c, ids: 1 if c.z < low + band else 0) if accent else None, hem=0.008, cuts=cuts, iso=F)
    if grad:
        paint_grad(o, color, low + band, nk.z - 0.05)
    for s_ in ('Left', 'Right'):
        fold_weights(o, [n for n in G if n.startswith(s_) and 'Hand' in n], f'{s_}ForeArm')
    return [o], cov


# 1.19: with the bikini gone from Inaya's body (clean_torso.py), the crop's straps sit on the trapezius (7.5 to 11.2 cm
# from the axis) instead of out on the deltoid, where they slid off when the guard rises
# v1.37.4: Inaya's closer-to-neck strap pattern is shared by Amara.
# Correct the actual strap width for Amara's shoulder bones, not by copying
# Inaya's skin weights or inverse bind matrices.
if INAYA_FEMALE_PATTERN:
    shoulder = max(abs(H['LeftArm'].x), abs(H['RightArm'].x))
    # Inaya's template was measured at ~17 cm shoulder half-span; stay in
    # a narrow athletic range to keep straps off the deltoid in the guard.
    ratio = max(0.90, min(1.12, shoulder / 0.17))
    _SQ = (str(round(0.070 * ratio, 5)),
           str(round((0.136 if AMARA_PATCHES else 0.112) * ratio, 5)),
           '0.005' if AMARA_PATCHES else '0.012',
           '0.004' if AMARA_PATCHES else '0.012')
    print('v1.37.4 Amara: patron Inaya, shoulder half-span', round(shoulder, 4), 'strap scale', round(ratio, 4))
else:
    _SQ = ('0.075', '0.112', '0.012', '0.012') if os.environ.get('PALETTE') == 'inaya' else ('0.112', '0.142', '0.004', '0.002')
for _k, _v in zip(('SQ_IN', 'SQ_OUT', 'SQ_HIDE', 'SQ_EDGE'), _SQ):
    os.environ.setdefault(_k, _v)


def square_field(low, strap=(float(os.environ.get("SQ_IN", "0.112")), float(os.environ.get("SQ_OUT", "0.142")))):
    """1.13 (Youssef, 04/11: « une brassière moulante pleine pour masquer les fissures », Inaya): a full top with a
    square neckline and wide straps set out on the shoulders. The halter straps of the sports body run up from the
    cups to the back of the neck within 11 cm of the axis above the chest (measured on her photo.glb: x <= 0.121 at
    1.34 m, 0.106 at 1.40 m); a garment copied from the skin there copies their fold and came out torn. Straps between
    12.2 and 15.8 cm from the axis and a neckline under the cups' top (front) and at the chest joint (back) keep every
    edge off them.
    low: bottom of the top (z)"""
    nk = H['Neck']
    cz = chestZ
    sl = [P[i] for i in range(len(P)) if abs(P[i].z - (cz - 0.03)) < 0.006 and abs(P[i].x) < 0.2
          and w(i, 'LeftArm', 'RightArm', 'LeftForeArm', 'RightForeArm') < 0.6 and w(i, *HANDS) < 0.1]
    yc = (min(p.y for p in sl) + max(p.y for p in sl)) / 2
    arms = [(H[f'{s_}{a}'], H[f'{s_}{b}']) for s_ in ('Left', 'Right') for a, b in (('Arm', 'ForeArm'), ('ForeArm', 'Hand'))]
    shoulder_x = max(abs(H['LeftArm'].x), abs(H['RightArm'].x))

    def arm_clear(q):
        best = 1e9
        for a, b in arms:
            ab = b - a
            t = max(0.0, min(1.0, (q - a).dot(ab) / ab.dot(ab)))
            best = min(best, (q - (a + ab * t)).length)
        return max(0.068 - best, abs(q.x) - shoulder_x - 0.01)

    def field(q):
        ax = abs(q.x)
        front = _ss(yc + 0.02, yc - 0.035, q.y)
        # v1.37.6: Amara needs a functional sports crop, not the earlier
        # low neckline copied from the narrow Rocketbox bikini. Move the
        # chest coverage ~7 cm up while leaving the clavicle and neck bare.
        # The back/armholes remain open for free punches and pivots.
        if AMARA_PATCHES:
            front_top = nk.z - 0.078
            back_top = cz + 0.020
            T = back_top + (front_top - back_top) * front
            # Minor side taper, not the previous 5 cm scoop that exposed cups.
            T -= 0.010 * _ss(0.17, 0.205, ax) * (1 - 0.35 * front)
            arm_gap = arm_clear(q)
            # Below the upper chest, prevent the arm clearance cut from
            # punching holes through the bust's lateral coverage. It is
            # faded out before the deltoid/shoulder articulation.
            bust = front * (1 - _ss(cz + 0.065, cz + 0.115, q.z))
            arm_gap -= 0.010 * bust
            body_ = max(q.z - T, low - q.z, arm_gap)
            st = max(strap[0] - ax, ax - strap[1], low - q.z,
                     arm_clear(q) - float(os.environ.get("SQ_ARM", "0.022")))
            return _smin(body_, st, 0.014)
        # Unmodified reference cut: Inaya and all non-Amara characters.
        # 1.37.7: Amara keeps the higher front asked in 1.37.6 (« brassière trop décolletée »): the front of the
        # neckline 7.8 cm under the neck joint instead of 15 cm; the back, straps and armholes stay Inaya's
        front_top = nk.z - float(os.environ.get('NECK_FRONT', '0.078')) if CLEAN_BIKINI else nk.z - 0.15
        T = (cz + 0.004) + (front_top - (cz + 0.004)) * front
        T -= 0.05 * _ss(0.15, 0.19, ax) * (1 - 0.6 * front)
        body_ = max(q.z - T, low - q.z, arm_clear(q))
        st = max(strap[0] - ax, ax - strap[1], low - q.z, arm_clear(q) - float(os.environ.get("SQ_ARM", "0.022")))
        return _smin(body_, st, 0.012)
    return field


def relax_weights(o, repeat, k=0.5):
    """1.13: Laplacian smoothing of all the skin weights of a garment over its own edges (the points a solidify
    split along a rim share nothing: each layer is smoothed on its own, they start from the same weights), then
    the 4 strongest kept and normalised"""
    me_ = o.data
    nv = len(me_.vertices)
    ng = len(o.vertex_groups)
    Wm = [[0.0] * ng for _ in range(nv)]
    for v in me_.vertices:
        for g in v.groups:
            Wm[v.index][g.group] = g.weight
    nb = [[] for _ in range(nv)]
    for e in me_.edges:
        a_, b_ = e.vertices
        nb[a_].append(b_)
        nb[b_].append(a_)
    for _ in range(repeat):
        new = []
        for i in range(nv):
            if not nb[i]:
                new.append(Wm[i])
                continue
            avg = [0.0] * ng
            for j_ in nb[i]:
                wj = Wm[j_]
                for g in range(ng):
                    if wj[g]:
                        avg[g] += wj[g]
            m = 1.0 / len(nb[i])
            new.append([(1 - k) * Wm[i][g] + k * avg[g] * m for g in range(ng)])
        Wm = new
    for i in range(nv):
        top4 = sorted(range(ng), key=lambda g: -Wm[i][g])[:4]
        tot = sum(Wm[i][g] for g in top4) or 1.0
        for g in range(ng):
            o.vertex_groups[g].remove([i])
        for g in top4:
            if Wm[i][g] > 1e-4:
                o.vertex_groups[g].add([i], Wm[i][g] / tot, 'REPLACE')


def top_square(color, accent=None, low=None, name='haut-carre'):
    """1.13 full top with a square neckline (square_field): a sports bra (low = bra_low()), a crop top or a tank top
    (lower), fine jersey 2.2 mm laid 5.5 mm off the skin like bra_v2, an accent band at the bottom when given"""
    low = bra_low() if low is None else low
    F = square_field(low)
    nk = H['Neck']
    def keep(i):
        return low - 0.02 < P[i].z < nk.z + 0.01 and w(i, 'Head') < 0.2 and w(i, *HANDS) < 0.3 and F(P[i]) < 0.03
    mats = [fabric(f'{name}-{color}', color, 'jersey', rough=0.62, strength=0.45, sheen=0.12)]
    cuts = []
    if accent:
        mats.append(fabric(f'liseré-{accent}', accent, 'elastique', rough=0.6, strength=0.8))
        cuts.append((Vector((0, 0, low + 0.02)), Vector((0, 0, 1))))
    # over the shoulder the deltoid swells and slides under the strap when the guard is raised: the strap stands
    # 9 mm off the skin there (5.5 elsewhere), or the skin's edge came through it in teeth
    def push(i):
        q = P[i]
        # The uncleaned Rocketbox sports-bra surface had protruding seams;
        # after v1.37.5 retouch, keep Amara's crop well clear of residual
        # geometry during guard/punches without changing Inaya's approved fit.
        base = 0.009 if AMARA_PATCHES else 0.0055
        return base + float(os.environ.get("SQ_PUSH", "0.0035")) * _ss(chestZ - 0.03, chestZ + 0.03, q.z) * _ss(0.105, 0.12, abs(q.x))
    o, cov = shell(name, keep, push, 0.0022, mats,
                   (lambda c, ids: 1 if c.z < low + 0.02 else 0) if accent else None, hem=0.006, cuts=cuts, iso=F,
                   edge_skin=float(os.environ.get('SQ_EDGE', '0.002')))
    for s_ in ('Left', 'Right'):
        fold_weights(o, [n for n in G if n.startswith(s_) and 'Hand' in n], f'{s_}ForeArm')
    # each point of the decimated top takes the weights of its closest skin point: along the strap's outer edge
    # those alternate between the arm and the shoulder blade, and the edge came out in teeth when the guard rises.
    # Relaxed over the garment (the skin under it is smoothed the same way by smooth_weights.py)
    relax_weights(o, int(os.environ.get('SQ_SMOOTH', '16' if AMARA_PATCHES else '12')))  # v1.37.5: stable Amara straps during punching
    # the skin under the straps: shell() keeps the skin drawn near any free edge of the copy, and the body's texture
    # seams over the shoulder blade leave such edges inside the strap (half its skin stayed drawn, and came through
    # in teeth when the guard rises). Everything 4 mm inside the field is hidden
    # 1.19: 12 mm for Inaya's crop (the straps moved in on the shoulders, the skin at their edges showed the white
    # background when the guard rises: skin hidden but no cloth over it)
    cov = set(cov) | {i for i in range(len(P)) if keep(i) and F(P[i]) < -float(os.environ.get('SQ_HIDE', '0.004'))}
    if os.environ.get('SQ_DBG'):
        reg = [i for i in range(len(P)) if 0.135 < abs(P[i].x) < 0.155 and 1.33 < P[i].z < 1.47 and P[i].y > 0]
        print('SQDBG region', len(reg), 'covered', sum(1 for i in reg if i in cov), 'keep', sum(1 for i in reg if keep(i)),
              'Fneg', sum(1 for i in reg if F(P[i]) < -0.004), 'sample', [(round(P[i].x, 3), round(P[i].z, 3), round(F(P[i]), 4), keep(i)) for i in reg[:8]])
    return [o], cov


# 1.13 proposals for Inaya's top (INAYA_TOP): bandeau (1.12), carree (square-neck sports bra), crop (square-neck crop
# top to the navel), debardeur (square-neck tank top to the waistband)
# 1.14 (Youssef, 04/11, decision « C. Crop top »): Inaya wears the crop top in every striking discipline
# Inaya uses the same crop-top cut for all striking disciplines. Previously
# Amara silently fell back to bra_v2 (a different garment), even with the
# same colour palette. Her top now uses Inaya's pattern on Amara's torso.
INAYA_TOP = os.environ.get('INAYA_TOP', 'crop' if os.environ.get('PALETTE') == 'inaya' or INAYA_FEMALE_PATTERN else '')


def female_top(color, accent=None):
    if INAYA_TOP == 'bandeau':
        return bra_v2(color, accent, bandeau=True)
    if INAYA_TOP == 'carree':
        return top_square(color, accent)
    if INAYA_TOP == 'crop':
        # 1.14 (Youssef, 04/11: « crop top un peu court laissant voir les muscles du ventre »): its bottom sits 4 cm
        # under a sports bra's, on the lower ribs, so the abdominals stay bare
        return top_square(color, accent, low=bra_low() - float(os.environ.get('CROP_DROP', '0.04')), name='haut-crop')
    if INAYA_TOP == 'debardeur':
        return top_square(color, accent, low=hipZ + 0.05, name='haut-debardeur')
    return None


def folds(i, amp):
    """v0.32 soft folds of a loose garment: a smooth wave field over the body (wavelength 12 to 20 cm), so the cloth
    is not a smooth inflated copy of the skin"""
    p = P[i]
    return amp * (0.5 * math.sin(p.x * 41 + p.z * 23) + 0.5 * math.sin(p.y * 37 - p.z * 29 + 1.3))


def bunch(z, z0, span, amp):
    """the cloth gathering in rings above a cuff or the ankle (wavelength 4.5 cm), fading over span"""
    if z < z0 or z > z0 + span:
        return 0.0
    return amp * (1 - (z - z0) / span) * (0.5 + 0.5 * math.sin((z - z0) * 2 * math.pi / 0.045))


def pants(color, kind, legging=False):
    """gi or judogi trousers (loose, to the ankle bone), or leggings"""
    def keep(i):
        if w(i, *ARMS) > 0.2 or P[i].z > hipZ + (0.06 if legging else 0.09):
            return False
        return P[i].z > ankleZ + (0.06 if not legging else 0.05) and w(i, *FEET) < 0.4

    judo = kind == 'judo'

    def push(i):
        if legging:
            return 0.0025
        if P[i].z > hipZ:
            return 0.006
        s = leg_of(i)
        # v0.32: about half the old volume (it read as padded); folds, and the cloth gathers above the ankle
        # The trousers need extra room around the knees and groin; the fitted jacket
        # setting must not turn judogi trousers into leggings.
        g = min(1.0, GI_FIT + 0.18) if kind in ('judo', 'bjj') else 1.0
        if P[i].z > H[f'{s}Leg'].z:
            v = loose(i, f'{s}UpLeg', f'{s}Leg', 0.006, lambda u: g * ((0.016 + 0.006 * u) if judo else (0.012 + 0.004 * u)))
        else:
            v = loose(i, f'{s}Leg', f'{s}Foot', 0.006, lambda u: g * ((0.022 + 0.01 * u) if judo else (0.016 + 0.008 * u)))
        return v + N[i] * (folds(i, 0.004 * (0.5 + 0.5 * g)) + bunch(P[i].z, ankleZ + 0.06, 0.14, 0.006 * g))

    if legging:
        mats = [fabric(f'pantalon-{color}-{kind}', color, 'jersey', rough=0.6, strength=0.5)]
    else:
        # gi trousers: a plainer, twilled cotton than the jacket, matt
        mats = [fabric(f'pantalon-{color}-{kind}', color, 'serge', rough=0.9, strength=0.25, tone=0.03)]
    cuts = [(Vector((0, 0, ankleZ + (0.06 if not legging else 0.05))), Vector((0, 0, 1))), (Vector((0, 0, hipZ + (0.06 if legging else 0.09))), Vector((0, 0, 1)))]
    o, cov = shell(f'pantalon-{kind}', keep, push, 0.003, mats, cuts=cuts)
    for s_ in ('Left', 'Right'):
        fold_weights(o, [f'{s_}Foot', f'{s_}ToeBase'], f'{s_}Leg')
    smooth(o, 2 if not legging else 1)
    return [o], cov


def jacket(color, kind):
    """gi / judogi jacket body and sleeves (to just above the wrist, wide); the skirt, collar and belt are added
    separately. v0.32: closer to the body, thinner cloth, folds; the judogi is wider and heavier than the BJJ gi"""
    vz = {'judo': 0.25, 'bjj': 0.22, 'costume': 0.24}[kind]
    judo = kind == 'judo'

    def keep(i):
        # v0.32: the hand's weight no longer decides where the sleeve ends (a skin point with 5 % of it was left
        # out: the sleeve ended along the skin's triangles, a toothed edge); the straight cut below decides
        if P[i].z < hipZ + 0.02 or w(i, 'Head') > 0.2 or w(i, *HANDS) > 0.5 or w(i, 'Neck') > 0.3:
            return False
        nk = H['Neck']
        # V opening on the chest where the lapels cross
        if P[i].y < 0.0 and P[i].z > nk.z - vz:
            half = 0.085 * (P[i].z - (nk.z - vz)) / vz
            if abs(P[i].x) < half + 0.01:
                return False
        s = 'Left' if P[i].x > 0 else 'Right'
        if w(i, f'{s}ForeArm') > 0.3:
            _, u = axis_point(i, f'{s}ForeArm', f'{s}Hand')
            return u < 0.82
        return True

    g = GI_FIT if kind in ('judo', 'bjj') else 1.0

    def push(i):
        s = 'Left' if P[i].x > 0 else 'Right'
        if w(i, f'{s}ForeArm') > 0.3:
            c, u = axis_point(i, f'{s}ForeArm', f'{s}Hand')
            v = loose(i, f'{s}ForeArm', f'{s}Hand', 0.006, lambda u: g * ((0.016 + 0.012 * u) if judo else (0.01 + 0.006 * u)))
            return v + N[i] * (folds(i, 0.003) + (0.004 * g * (0.5 + 0.5 * math.sin(u * 2 * math.pi * 3)) if u < 0.35 else 0))
        if w(i, f'{s}Arm') > 0.4:
            return loose(i, f'{s}Arm', f'{s}ForeArm', 0.005, lambda u: g * (0.007 if judo else 0.004)) + N[i] * folds(i, 0.003)
        # the short rash guard worn under the gi (Amara) stays under the jacket: the folds only push outwards there
        if female:
            # 1.19 fitted (GI_FIT < 1): the room tapers in at the waist, between the chest and the belt; never under
            # 7 mm, the rash guard under it is 6.5 mm off the skin
            # 1.19 fitted (GI_FIT < 1): the room round the trunk is kept (the rash guard under it, the collar and the
            # trousers' waist need it; less made them come through), only its folds are flatter
            return (0.011 if judo else 0.009) + abs(folds(i, (0.004 if judo else 0.003) * (0.6 + 0.4 * g)))
        return (0.008 if judo else 0.006) + folds(i, 0.004 if judo else 0.003)

    mats = [gi_fabric(color, kind)]
    cuts = [(Vector((0, 0, hipZ + 0.02)), Vector((0, 0, 1)))]
    for s_ in ('Left', 'Right'):
        a, b = H[f'{s_}ForeArm'], H[f'{s_}Hand']
        cuts.append((a + (b - a) * 0.82, (b - a).normalized()))
    o, cov = shell(f'veste-{kind}', keep, push, 0.004 if judo else 0.003, mats, hem=0.01, cuts=cuts)
    for s_ in ('Left', 'Right'):
        fold_weights(o, [n for n in G if n.startswith(s_) and 'Hand' in n], f'{s_}ForeArm')
    smooth(o, 2)
    return [o], cov


def shoes(color, accent):
    """high boxing shoes: foot and ankle, up to mid-shin, thin flexible sole.
    v0.43 (Youssef, 2026-10-23, capture: « motif blanc » on the shoes): the white side stripe was chosen face by face
    on the skin's triangles, a toothed band. Now the contrasts follow straight cuts: a sole rim standing out of the
    upper (2 cm high, 6 mm proud) and a padded collar band at the top"""
    top_z = ankleZ + 0.2
    collar_z = top_z - 0.028
    sole_z = 0.022

    def keep(i):
        return P[i].z < top_z and w(i, *FEET, 'LeftLeg', 'RightLeg') > 0.5

    def push(i):
        z = P[i].z
        return 0.0065 if z < sole_z else 0.006 if z > collar_z else 0.004

    o, cov = shell('chaussures', keep, push, 0.004,
                   [fabric(f'chaussure-{color}', color, 'grain', rough=0.55, strength=0.7, coat=0.15), fabric(f'semelle-{accent}', accent, 'flat', rough=0.7)],
                   lambda c, ids: 1 if c.z < sole_z or c.z > collar_z else 0,
                   cuts=[(Vector((0, 0, top_z)), Vector((0, 0, 1))), (Vector((0, 0, collar_z)), Vector((0, 0, 1))), (Vector((0, 0, sole_z)), Vector((0, 0, 1)))])
    # a shoe does not show the toes: the front of the foot is smoothed into one rounded toe box (the gaps between
    # the toes of the skin were moulded by the upper). Smoothing fades in from the instep to the toes
    toe = o.vertex_groups.new(name='css-orteils')
    for v in o.data.vertices:
        q = MW @ v.co
        fwd = -q.y  # toes point to -y (front of the body)
        t = max(0.0, min(1.0, (fwd - 0.02) / 0.06)) * (1.0 if q.z < ankleZ else 0.0)
        if t > 0:
            toe.add([v.index], t, 'REPLACE')
    sm = o.modifiers.new('Orteils', 'SMOOTH')
    sm.factor = 1.0
    sm.iterations = 30
    sm.vertex_group = toe.name
    apply(o, sm)
    if 'css-orteils' in o.vertex_groups:
        o.vertex_groups.remove(o.vertex_groups['css-orteils'])
    return [o], cov


SHOE_TRIS = int(os.environ.get('SHOE_TRIS', '2400'))


def shoes_v2(color, accent):
    """v0.43 boxing shoes (Youssef, 2026-10-23, capture: black shoes « avec un motif blanc »). Before: the skin of
    the foot pushed out (shell): the shoe showed every toe and its white side stripe was cut along the skin's
    triangles. Now each shoe is a closed shape measured on the coach's own foot and shin (cross-sections every
    centimetre, plus a margin): a rounded toe box, a heel counter, a high shaft open at the top, a sole standing
    out of the upper. Contrasts follow straight cuts (sole, padded collar): one mesh per shoe, vertex colours"""
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import glove as GL
    top_z = ankleZ + 0.2
    collar_z = top_z - 0.028
    parts, cov = [], set()
    up_c, sole_c, collar_c = lin(color), lin(accent), lin(accent)
    lining_c = lin('#1A1A1C')
    m = fabric(f'chaussure-v2-{color}', '#FFFFFF', 'grain', rough=0.55, strength=0.7, coat=0.15)
    if not m.get('css_vcol'):
        nt = m.node_tree
        vc = nt.nodes.new('ShaderNodeVertexColor')
        vc.layer_name = 'Col'
        nt.links.new(vc.outputs['Color'], nt.nodes['Principled BSDF'].inputs['Base Color'])
        m['css_vcol'] = 1
    for s in ('Left', 'Right'):
        bones = (f'{s}Foot', f'{s}ToeBase', f'{s}Leg')
        mine = [i for i in range(len(P)) if leg_of(i) == s and P[i].z < top_z + 0.01 and w(i, *bones) > 0.5]
        O = H[f'{s}Foot'].copy()
        O.z = 0
        f = H[f'{s}ToeBase'] - H[f'{s}Foot']
        f.z = 0
        f.normalize()
        l = Vector((0, 0, 1)).cross(f)
        pts = np.array([P[i][:] for i in mine])
        rel = pts - np.array(O[:])
        U, V, Z = rel @ np.array(f[:]), rel @ np.array(l[:]), pts[:, 2]
        ground = Z.min()
        footm = Z < ankleZ + 0.03
        u0, u1 = U[footm].min(), U[footm].max()
        # foot cross-sections every centimetre: sides and top of the foot
        us = np.arange(u0, u1 + 0.0101, 0.01)
        vmin, vmax, hmax = [], [], []
        for u_ in us:
            sel = footm & (np.abs(U - u_) < 0.008)
            if sel.sum() < 3:
                sel = footm & (np.abs(U - u_) < 0.02)
            vmin.append(V[sel].min()); vmax.append(V[sel].max()); hmax.append(Z[sel].max())
        sm_ = lambda a: np.convolve(np.pad(a, 1, mode='edge'), np.ones(3) / 3, mode='valid')
        vmin, vmax, hmax = sm_(np.array(vmin)) - 0.0045, sm_(np.array(vmax)) + 0.0045, sm_(np.array(hmax)) + 0.0045
        # shin cross-sections every centimetre (ellipses round the leg)
        zs = np.arange(ankleZ - 0.03, top_z + 0.0101, 0.01)
        cx, cy, rx, ry = [], [], [], []
        for z_ in zs:
            sel = (~footm | (Z > ankleZ - 0.04)) & (np.abs(Z - z_) < 0.008) & (U < (u0 + u1) / 2)
            for w_ in (0.02, 0.04, 0.08):  # coarser meshes (MakeHuman base mesh): wider slices
                if sel.sum() >= 4:
                    break
                sel = np.abs(Z - z_) < w_
            q_ = pts[sel]
            c_ = (q_[:, :2].max(0) + q_[:, :2].min(0)) / 2
            cx.append(c_[0]); cy.append(c_[1])
            # 1.26: 11 mm of room round the shin of the MakeHuman bodies (their large skin faces cut the curve of the
            # shin: a corner stood out of the 4.5 mm shaft just under the collar, Axel)
            mg = 0.011 if MH_BODY else 0.0045
            rx.append((q_[:, 0].max() - q_[:, 0].min()) / 2 + mg); ry.append((q_[:, 1].max() - q_[:, 1].min()) / 2 + mg)
        cx, cy, rx, ry = (sm_(np.array(a)) for a in (cx, cy, rx, ry))

        def field(g):
            u = (g - np.array(O[:])) @ np.array(f[:])
            v = (g - np.array(O[:])) @ np.array(l[:])
            z = g[..., 2]
            ip = lambda a: np.interp(u, us, a)
            a_ = np.maximum((ip(vmax) - ip(vmin)) / 2, 0.01)
            vc_ = (ip(vmax) + ip(vmin)) / 2
            b_ = np.maximum(ip(hmax) - ground, 0.01)
            n_ = 2.6
            qq = (np.abs(v - vc_) / a_) ** n_ + (np.maximum(z - ground, 0) / b_) ** n_
            foot = (qq ** (1 / n_) - 1) * np.minimum(a_, b_)
            foot = np.maximum(foot, ground - 0.004 - z)
            # 1.10: 1.2 cm of room in front of the toes (was 6 mm): when the forefoot bends the toes came through the
            # tip of the toe box (skin-coloured notches at the front of the soles)
            foot = GL.smax(foot, np.maximum(u0 - 0.004 - u, u - u1 - 0.012), 0.03)
            iz = lambda a: np.interp(z, zs, a)
            ell = np.sqrt(((g[..., 0] - iz(cx)) / iz(rx)) ** 2 + ((g[..., 1] - iz(cy)) / iz(ry)) ** 2)
            shaft = (ell - 1) * np.minimum(iz(rx), iz(ry))
            shaft = np.maximum(shaft, np.maximum(z - top_z, ankleZ - 0.06 - z))
            d = GL.smin(foot, shaft, 0.018)
            # sole: the footprint, 4 mm wider, from the ground to 1.6 cm
            fp = np.maximum(np.maximum(ip(vmin) - 0.004 - v, v - ip(vmax) - 0.004), np.maximum(u0 - 0.008 - u, u - u1 - 0.016))
            sole = GL.smax(fp, np.maximum(z - ground - 0.016, ground - 0.001 - z), 0.006)
            d = GL.smin(d, sole, 0.004)
            # open top: the leg goes in (inner wall 5 mm)
            inner = np.maximum(shaft + 0.005, top_z - 0.035 - z)
            return GL.smax(d, -inner, 0.002)

        lo = np.array([min(pts[:, 0].min(), pts[:, 0].min()) - 0.04, pts[:, 1].min() - 0.05, ground - 0.01])
        hi = np.array([pts[:, 0].max() + 0.04, pts[:, 1].max() + 0.05, top_z + 0.01])
        step = 0.0025
        n = np.ceil((hi - lo) / step).astype(int) + 1
        grid = np.stack(np.meshgrid(*[lo[a] + np.arange(n[a]) * step for a in range(3)], indexing='ij'), -1)
        vv, qd = GL.surface_nets(field(grid), lo, step)
        for _ in range(2):
            e = 1e-4
            dv = field(vv)
            gr = np.stack([(field(vv + np.eye(3)[a] * e) - dv) / e for a in range(3)], -1)
            gl = np.maximum(np.sqrt((gr * gr).sum(-1)), 1e-6)
            vv = vv - (dv / gl)[:, None] * (gr / gl[:, None])
        bm_ = bmesh.new()
        bv = [bm_.verts.new(MWI @ Vector(p_)) for p_ in vv]
        for q4 in qd:
            try:
                bm_.faces.new([bv[i] for i in q4])
            except ValueError:
                pass
        bmesh.ops.recalc_face_normals(bm_, faces=bm_.faces[:])
        o = new_obj(f'chaussure-{s}', bm_)
        bm_.free()
        o.matrix_world = MW
        apply(o, o.modifiers.new('Tri', 'TRIANGULATE'))
        dec = o.modifiers.new('Decimate', 'DECIMATE')
        dec.ratio = min(1.0, SHOE_TRIS / max(1, len(o.data.polygons)))
        apply(o, dec)
        bm_ = bmesh.new()
        bm_.from_mesh(o.data)
        nz = (MWI.to_3x3() @ Vector((0, 0, 1))).normalized()
        for zc in (ground + 0.016, collar_z, top_z - 0.006):
            bmesh.ops.bisect_plane(bm_, geom=bm_.verts[:] + bm_.edges[:] + bm_.faces[:], plane_co=MWI @ Vector((0, 0, zc)), plane_no=nz)
        # 1.10: the rolled top of the shaft came out of the field toothed (2.5 mm grid, then decimated): cut straight,
        # the shaft ends on a clean ring and its dark lining shows inside
        bmesh.ops.delete(bm_, geom=[f_ for f_ in bm_.faces if (MW @ f_.calc_center_median()).z > top_z - 0.006], context='FACES')
        bmesh.ops.delete(bm_, geom=[v_ for v_ in bm_.verts if not v_.link_faces], context='VERTS')
        bmesh.ops.triangulate(bm_, faces=bm_.faces[:])
        bm_.to_mesh(o.data)
        bm_.free()
        me_ = o.data
        for p_ in me_.polygons:
            p_.use_smooth = True
        col = me_.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
        for p_ in me_.polygons:
            c = MW @ p_.center
            # inside the opening (wall and floor of the cavity the leg goes into): dark lining
            zi = min(max(c.z, zs[0]), zs[-1])
            r_ = min(np.interp(zi, zs, rx), np.interp(zi, zs, ry))
            inside = c.z > top_z - 0.04 and math.hypot(c.x - np.interp(zi, zs, cx), c.y - np.interp(zi, zs, cy)) < r_ - 0.0035
            k_ = lining_c if inside else sole_c if c.z < ground + 0.016 else collar_c if c.z > collar_z else up_c
            for li in p_.loop_indices:
                col.data[li].color = (*k_, 1)
        me_.color_attributes.active_color = col
        o.data.materials.append(m)
        # skin weights of the closest point of the foot or shin
        kd = KDTree(len(mine))
        for k2, i in enumerate(mine):
            kd.insert(P[i], k2)
        kd.balance()
        weighted(o, lambda p_: VW[mine[kd.find(p_)[1]]])
        # skin hidden under the shoe: inside it, except at the opening
        dpts = field(np.array([P[i][:] for i in mine]))
        # (up to 3 mm under the straight top: the leg skin no longer shows inside the opening; and the skin that
        # pokes a few millimetres through the shaft at the Achilles tendon is hidden too, it showed as orange drips)
        # 1.26 (Youssef, 2026-11-06: « les bottes avec des trous »): where the shin is not round (the edge of the
        # tibia at the front), its skin stood out of the measured ellipse by more than 6 mm, through the 5 mm wall of
        # the opening: skin-coloured holes on the front of the shaft. Every point of the foot and shin under the
        # shoe's straight top is now hidden, wherever it lies (the shoe is closed everywhere below it)
        # (every point of that leg under the top, not only those weighted mostly to the foot and shin: on Axel's
        # MakeHuman body part of the shin is weighted to other bones and stayed drawn)
        low = [i for i in range(len(P)) if leg_of(i) == s and P[i].z < top_z - 0.009]
        dl = field(np.array([P[i][:] for i in low]))
        cov |= {i for k2, i in enumerate(low) if dl[k2] < 0.03}
        print('chaussure', s, len(me_.polygons), 'triangles')
        parts.append(o)
    return parts, cov


def shin_guards(color, accent='#B3122A'):
    """v0.32 shin guard (Youssef, 2026-10-22: « protège-tibias incomplets ou mal ajustés »): a sleeve round the whole
    shin with straight edges (under the knee, above the ankle), padded in front, thinner behind. Before: only the
    skin facing forward, with a toothed outline. No instep piece yet (a plate laid on the foot did not sit right).
    v0.43 (« équipements simplifiés »: a plain white sleeve, like a sock): the front plate is quilted in vertical
    channels and two hook-and-loop straps in the accent colour close it behind the calf, each edge a straight cut"""
    top_z = kneeZ - 0.06
    bot_z = ankleZ + 0.02
    length = top_z - bot_z
    straps = [(bot_z + length * 0.22, bot_z + length * 0.22 + 0.035), (bot_z + length * 0.68, bot_z + length * 0.68 + 0.035)]

    def keep(i):
        s = 'Left' if P[i].x > 0 else 'Right'
        return w(i, f'{s}Leg', f'{s}Foot') > 0.5 and top_z > P[i].z > bot_z

    def centre(i):
        s = 'Left' if P[i].x > 0 else 'Right'
        c, _ = axis_point(i, f'{s}Leg', f'{s}Foot')
        return c

    def push(i):
        front = max(0.0, N[i].dot(FWD))
        if P[i].z < ankleZ + 0.01:
            return 0.008
        # quilting: three padded channels side by side on the front plate, sewn lines between them
        lat = P[i].x - centre(i).x
        quilt = 0.5 + 0.5 * math.cos(lat / 0.024 * 2 * math.pi)
        return 0.004 + (0.009 + 0.004 * quilt) * front ** 0.7

    # behind the calf: beyond the vertical plane through the shin axes (the legs stand side by side at rest)
    back_y = (H['LeftLeg'].y + H['RightLeg'].y) / 2 + 0.01

    def mat_of(c, ids):
        return 1 if c.y > back_y and any(lo < c.z < hi for lo, hi in straps) else 0

    pad = fabric(f'protection-{color}', color, 'grain', rough=0.62, strength=0.8, coat=0.1)
    velcro = fabric(f'velcro-{accent}', accent, 'knit', rough=0.85, strength=1.5)
    cuts = [(Vector((0, 0, z)), Vector((0, 0, 1))) for z in (top_z, bot_z, *[z for b in straps for z in b])] + [(Vector((0, back_y, 0)), Vector((0, 1, 0)))]
    o, cov = shell('protege-tibias', keep, push, 0.006, [pad, velcro], mat_of, cuts=cuts)
    for s_ in ('Left', 'Right'):
        fold_weights(o, [f'{s_}Foot', f'{s_}ToeBase'], f'{s_}Leg')
    smooth(o, 2, cuts)
    return [o], cov


def mma_shin_guards(color, accent):
    """1.27 MMA shin-and-instep guards (Youssef, 2026-11-06, three photos of sock-style guards: « des protège-tibias
    bien faits comme les autres, pas de bavures »): one stretch sleeve from under the knee down over the ankle and
    the instep, the heel left bare in a rounded opening, the toes free; a padded plate in front of the shin, a thin
    pad on the instep, an elastic band in the accent colour round the top. Every edge is cut by a field (iso), so
    the outline is a smooth line whatever the size of the body's triangles: under the knee, round the heel, across
    the foot before the toes, along the sides of the foot above the sole"""
    top_z = kneeZ - 0.07
    band_z = top_z - 0.03
    frames = {}
    for s in ('Left', 'Right'):
        O = H[f'{s}Foot'].copy()
        f = H[f'{s}ToeBase'] - H[f'{s}Foot']
        f.z = 0
        toe = f.length
        f.normalize()
        mine = [i for i in range(len(P)) if leg_of(i) == s and P[i].z < ankleZ + 0.05]
        ground = min(P[i].z for i in mine)
        heel = min((P[i] - O).dot(f) for i in mine)
        frames[s] = (O, f, toe, ground, heel)

    def field(q):
        s = 'Left' if q.x > 0 else 'Right'
        O, f, toe, ground, heel = frames[s]
        u = (q - O).dot(f)
        top = q.z - top_z
        # across the foot, 2.5 cm before the toe joint (the toes stay free)
        front = u - (toe - 0.025)
        # along the sides of the foot, 1.4 cm above the floor (the sole stays bare)
        sole = (ground + 0.014) - q.z
        # the heel: a rounded opening behind the ankle
        hu, hz = heel + 0.005, ground
        e = ((u - hu) / 0.075) ** 2 + ((q.z - hz) / (ankleZ - ground + 0.005)) ** 2
        hole = (1.0 - e) * 0.03
        return max(top, front, sole, hole)

    def keep(i):
        s = leg_of(i)
        return w(i, f'{s}Leg', f'{s}Foot', f'{s}ToeBase') > 0.5 and P[i].z < top_z + 0.03

    def centre(i):
        s = leg_of(i)
        c, _ = axis_point(i, f'{s}Leg', f'{s}Foot')
        return c

    def push(i):
        front = max(0.0, N[i].dot(FWD))
        z = P[i].z
        if z < ankleZ + 0.02:
            # instep: a thin pad on the top of the foot, the sides snug
            return 0.0035 + 0.003 * max(0.0, N[i].z)
        lat = P[i].x - centre(i).x
        quilt = 0.5 + 0.5 * math.cos(lat / 0.026 * 2 * math.pi)
        # the plate fades out toward the ankle and under the knee band
        fade = min(1.0, (z - ankleZ - 0.02) / 0.05, max(0.0, (band_z - 0.01 - z) / 0.03))
        return 0.0035 + (0.008 + 0.003 * quilt) * front ** 0.8 * max(0.0, fade)

    def mat_of(c, ids):
        return 1 if c.z > band_z else 0

    sleeve = fabric(f'protection-mma-{color}', color, 'knit', rough=0.75, strength=0.9)
    band = fabric(f'elastique-{accent}', accent, 'knit', rough=0.8, strength=1.3)
    cuts = [(Vector((0, 0, band_z)), Vector((0, 0, 1)))]
    _ONCUT[0] = True
    # a longer relaxation of the free edges than the shorts': the top band crosses the fine skin of the MakeHuman
    # bodies at the knee and kept small waves with the usual 14 steps (Kaila, 06/11)
    keep_relax = os.environ.get('HEM_RELAX')
    os.environ['HEM_RELAX'] = os.environ.get('SHIN_RELAX', '40')
    try:
        o, cov = shell('protege-tibias-mma', keep, push, 0.005, [sleeve, band], mat_of, cuts=cuts, iso=field)
    finally:
        _ONCUT[0] = False
        if keep_relax is None:
            os.environ.pop('HEM_RELAX', None)
        else:
            os.environ['HEM_RELAX'] = keep_relax
    # the top band took some of the thigh's weight from the skin under it (MakeHuman bodies most): when the knee
    # bent, its points followed the thigh one by one and the edge came out frilled. The sleeve follows the shin only
    for s_ in ('Left', 'Right'):
        fold_weights(o, [f'{s_}UpLeg'], f'{s_}Leg')
    return [o], cov


def mma_gloves(color, accent='#B3122A', palm=None):
    def keep(i):
        s = 'Left' if P[i].x > 0 else 'Right'
        if w(i, f'{s}Hand') > 0.45:
            return True
        fingers = [f'{s}Hand{f}1' for f in ('Index', 'Middle', 'Ring', 'Pinky')]
        if w(i, *fingers) > 0.5:
            f = max(fingers, key=lambda n: w(i, n))
            _, u = axis_point(i, f, f.replace('1', '2'))
            return u < 0.55
        if w(i, f'{s}ForeArm') > 0.3:
            # the strap ends on a straight cut 5 cm up the forearm (cut below): no frayed edge
            d_ = (H[f'{s}Hand'] - H[f'{s}ForeArm']).normalized()
            return (P[i] - H[f'{s}Hand']).dot(d_) > -0.05
        return False

    def push(i):
        s = 'Left' if P[i].x > 0 else 'Right'
        wr, a, lat, up = hand_frame(s)
        q = P[i] - wr
        knuckles = max(0.0, 1 - abs(q.dot(a) - (H[f'{s}HandMiddle1'] - wr).length) / 0.03)
        back = max(0.0, N[i].dot(up))
        return 0.004 + 0.015 * knuckles * back

    # v0.43: the wide wrist strap in the accent colour, cut straight across the forearm (before: one colour, the
    # strap could not be told from the glove)
    cuts, wrist = [], {}
    for s in ('Left', 'Right'):
        d_ = (H[f'{s}Hand'] - H[f'{s}ForeArm']).normalized()
        wrist[s] = (H[f'{s}Hand'] - d_ * 0.006, d_)
        cuts.append(wrist[s])
        cuts.append((H[f'{s}Hand'] - d_ * 0.05, d_))
        # v1.7: the open end of each finger hole on a straight cut across the finger (where keep() stops), not
        # along the skin's triangles: on the MakeHuman fingers the ragged edge looked like black claws
        if MH_BODY:
            for f in (f'{s}Hand{n}1' for n in ('Index', 'Middle', 'Ring', 'Pinky')):
                ax = H[f.replace('1', '2')] - H[f]
                cuts.append((H[f] + ax * 0.55, ax.normalized()))

    def strap(c, ids):
        s = 'Left' if c.x > 0 else 'Right'
        pt, d_ = wrist[s]
        if (c - pt).dot(d_) < 0:
            return 1
        # 1.9: palm padding in its own colour (white palm of the reference glove, Youssef 2026-10-29)
        if palm and w(ids[0], f'{s}Hand') > 0.6 and N[ids[0]].dot(hand_frame(s)[3]) < -0.35:
            return 2
        return 0

    mats = [fabric(f'gant-mma-{color}', color, 'grain', rough=0.55, strength=0.7, coat=0.2),
            fabric(f'sangle-mma-{accent}', accent, 'weave', rough=0.7, strength=1.2)]
    if palm:
        mats.append(fabric(f'paume-mma-{palm}', palm, 'grain', rough=0.6, strength=0.6, coat=0.1))
    o, cov = shell('gants-mma', keep, push, 0.004, mats, strap, cuts=cuts)
    return [o], set()


def hide_hands():
    return {i for i in range(len(P)) if w(i, *HANDS) > 0.5}


# ---------------------------------------------------------------- brand logo
# 1.19 (Youssef 05/11: « met des logos de l'application (CS) comme marque de vêtements, utilise-le si nécessaire pour
# masquer des irrégularités »): the app's mark (public/icons/icon.svg: a red slash, « CS » in white, a bar under it)
# printed on the garments as thin geometry laid on the cloth (no texture: the outfits export their images as JPEG,
# which has no transparency). The letters come from Inter Black (free font, SIL OFL), turned into a mesh, cut in a
# 3 mm grid so they follow the cloth, put on the garment by rays along the view direction, 0.8 mm off it, and skinned
# with the weights of the closest point of the garment.
LOGO_FONT = os.environ.get('LOGO_FONT', '/usr/share/fonts/opentype/inter/Inter-Black.otf')
# 1.21: the CS mark on every coach's kit (Inaya's since 1.19)
LOGO = os.environ.get('LOGO', '1') == '1'


def _flat_mat(name, color, rough=0.55):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    c = [int(color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    lin = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    b_ = m.node_tree.nodes['Principled BSDF']
    b_.inputs['Base Color'].default_value = (*lin, 1)
    b_.inputs['Roughness'].default_value = rough
    MATS[name] = m
    return m


def logo_mesh(width, letters='#FFFFFF', slash='#C8102E'):
    """the mark in a local frame: x to the right, y up, centred, `width` metres wide; material 0 letters, 1 slash"""
    from mathutils.bvhtree import BVHTree  # noqa: F401 (keeps the import with its use below)
    font = bpy.data.fonts.load(LOGO_FONT, check_existing=True) if os.path.exists(LOGO_FONT) else None
    cu = bpy.data.curves.new('logo-txt', 'FONT')
    cu.body = 'CS'
    if font:
        cu.font = font
    cu.align_x, cu.align_y = 'CENTER', 'CENTER'
    cu.space_character = 0.92
    t = bpy.data.objects.new('logo-txt', cu)
    bpy.context.collection.objects.link(t)
    dg = bpy.context.evaluated_depsgraph_get()
    tm = bpy.data.meshes.new_from_object(t.evaluated_get(dg))
    bpy.data.objects.remove(t)
    bm_ = bmesh.new()
    bm_.from_mesh(tm)
    for f in bm_.faces:
        f.material_index = 0
    xs = [v.co.x for v in bm_.verts]
    ys = [v.co.y for v in bm_.verts]
    w0, h0 = max(xs) - min(xs), max(ys) - min(ys)
    cx, cy = (max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2
    for v in bm_.verts:
        v.co = Vector(((v.co.x - cx) / w0, (v.co.y - cy) / w0, 0))
    hh = h0 / w0  # height of the letters for a width of 1
    # the slash behind the letters (from the icon: bottom left to top right) and the bar under them
    def quad(pts, mi):
        vs = [bm_.verts.new(Vector((x, y, 0))) for x, y in pts]
        f = bm_.faces.new(vs)
        f.material_index = mi
    sl = 0.62 * hh
    quad([(-0.62, -sl - 0.06), (-0.40, -sl - 0.06), (0.62, sl + 0.06), (0.40, sl + 0.06)], 1)
    quad([(-0.45, -hh / 2 - 0.14), (0.45, -hh / 2 - 0.14), (0.45, -hh / 2 - 0.08), (-0.45, -hh / 2 - 0.08)], 0)
    # the letters above the slash: lift them a hair (the projection keeps the order: letters are put 0.3 mm higher)
    bmesh.ops.triangulate(bm_, faces=bm_.faces[:])
    # 3 mm grid so the flat mark bends with the cloth
    step = 0.003 / width
    for k in range(-int(1 / step), int(1 / step) + 1):
        bmesh.ops.bisect_plane(bm_, geom=bm_.verts[:] + bm_.edges[:] + bm_.faces[:], plane_co=(k * step, 0, 0), plane_no=(1, 0, 0))
        bmesh.ops.bisect_plane(bm_, geom=bm_.verts[:] + bm_.edges[:] + bm_.faces[:], plane_co=(0, k * step, 0), plane_no=(0, 1, 0))
    bmesh.ops.triangulate(bm_, faces=bm_.faces[:])
    for v in bm_.verts:
        v.co *= width
    me_ = bpy.data.meshes.new('logo')
    bm_.to_mesh(me_)
    bm_.free()
    bpy.data.meshes.remove(tm)
    me_.materials.append(_flat_mat(f'logo-lettres-{letters}', letters, 0.5))
    me_.materials.append(_flat_mat(f'logo-trait-{slash}', slash, 0.5))
    return me_


def logo_on(garment, name, centre, view, width, up=Vector((0, 0, 1)), letters='#FFFFFF', slash='#C8102E', lift=0.0015):
    """prints the mark on `garment` (an object of this file, skinned by vertex groups), centred where the ray from
    `centre` + view * 0.25 towards -view meets it; view: the direction the print faces (world)"""
    from mathutils.bvhtree import BVHTree
    dg = bpy.context.evaluated_depsgraph_get()
    gm = garment.evaluated_get(dg).to_mesh()
    gw = garment.matrix_world
    verts = [gw @ v.co for v in gm.vertices]
    tree = BVHTree.FromPolygons(verts, [tuple(p.vertices) for p in gm.polygons])
    kd = KDTree(len(verts))
    for k, q in enumerate(verts):
        kd.insert(q, k)
    kd.balance()
    groups = {g.index: g.name for g in garment.vertex_groups}
    vw = [{groups[g.group]: g.weight for g in v.groups if g.weight > 1e-4} for v in gm.vertices]
    view = view.normalized()
    xr = up.cross(view).normalized()  # print's right, seen from outside
    yu = view.cross(xr).normalized()
    me_ = logo_mesh(width, letters, slash)
    o = bpy.data.objects.new(name, me_)
    bpy.context.collection.objects.link(o)
    from mathutils.interpolate import poly_3d_calc
    miss = 0
    keep_pos = []
    keep_w = []
    keep_n = []
    for v in me_.vertices:
        a = centre + xr * v.co.x + yu * v.co.y + view * 0.25
        hit, nrm, fi, d = tree.ray_cast(a, -view, 0.5)
        if hit is None:
            miss += 1
            keep_pos.append(None)
            keep_w.append(None)
            keep_n.append(None)
            continue
        if nrm.dot(view) < 0:
            nrm = -nrm
        keep_pos.append(hit + nrm * lift)
        poly = gm.polygons[fi]
        bw = poly_3d_calc([verts[i] for i in poly.vertices], hit)
        keep_w.append([(poly.vertices[j], bw[j]) for j in range(len(bw))])
        sn = sum((gw.to_3x3() @ gm.vertices[poly.vertices[j]].normal * bw[j] for j in range(len(bw))), Vector())
        keep_n.append(sn.normalized() if sn.length > 1e-9 else nrm)
    pos = [q for q in keep_pos if q is not None]
    if not pos:
        bpy.data.objects.remove(o)
        garment.evaluated_get(dg).to_mesh_clear()
        return None
    # the letters lie 0.4 mm above the slash that passes behind them
    top_v = {i for p_ in me_.polygons if p_.material_index == 0 for i in p_.vertices}
    for v, q in zip(me_.vertices, keep_pos):
        v.co = q if q is not None else pos[0]
        if v.index in top_v and q is not None:
            v.co = v.co + view * 0.0004
    # skin: the weights of the garment at the point hit, interpolated over its face (1.19: the weights of the
    # nearest garment point made the mark move apart from the coarse faces of the shorts, which hid parts of it
    # once the thigh bent)
    for v, bw in zip(me_.vertices, keep_w):
        acc = {}
        if bw is None:
            _, k, _ = kd.find(v.co)
            bw = [(k, 1.0)]
        for k, b in bw:
            for gname, wt in vw[k].items():
                acc[gname] = acc.get(gname, 0.0) + wt * b
        for gname, wt in acc.items():
            if wt > 1e-4:
                vg = o.vertex_groups.get(gname) or o.vertex_groups.new(name=gname)
                vg.add([v.index], wt, 'REPLACE')
    # 1.20 (Youssef, 05/11: « le logo CS sur la brassière disparaît et réapparaît pendant les mouvements »).
    # Verified: the breathing of the app (src/three/breath.ts) moves every point along its own normal; the mark's
    # points had the flat normal of the print while the cloth under it is curved, so at each breath the cloth came
    # out over the letters. The mark now takes the cloth's normals at the points it lies on: both move together
    o.data.normals_split_custom_set_from_vertices([n if n is not None else Vector((0, 0, 1)) for n in keep_n])
    garment.evaluated_get(dg).to_mesh_clear()
    o.data.update()
    print('logo', name, len(me_.vertices), 'points', miss, 'hors du vêtement')
    return o


# ---------------------------------------------------------------- outfits (6 disciplines x 2 coaches)
# colours: the app's palette (anthracite #1F2937, deep red #B3122A, gold #D4AF37, white) for the coaches, a
# different combination for each coach so they never wear the same outfit
C = {
    'homme': dict(boxe=('#B3122A', '#D4AF37'), kick=('#16181D', '#B3122A'), thai=('#C8102E', '#F4F4F5'), mma=('#3A3D43', '#1A1B1F'), gi='#1E2A44', judo='#F7F6F2', belt='#121212', glove='#B3122A', glove2='#16181D', rash='#1F2937'),
    'femme': dict(boxe=('#16181D', '#D4AF37'), kick=('#B3122A', '#16181D'), thai=('#1D2B57', '#D4AF37'), mma=('#141519', '#202126'), gi='#F2F0EA', judo='#F7F6F2', belt='#121212', glove='#16181D', glove2='#B3122A', rash='#B3122A'),
    # 1.11 (Youssef 2026-11-03: « colore leurs vêtements différemment des autres »): Naël in royal blue, white and
    # emerald, Inaya in plum and orange; the gi colours stay those the rules allow (judo white or blue, BJJ white,
    # blue or black): blue judogi for both (the four others wear white), black BJJ gi for Naël, blue for Inaya.
    # No white tight kick-boxing shorts: on white, a spot of thigh skin showed through at the front in the guard
    # (hidden by the dark shorts of the others), so Naël's white is on the loose boxing shorts
    'nael': dict(boxe=('#F4F4F5', '#1D4E89'), kick=('#1D4E89', '#F4F4F5'), thai=('#0F6B57', '#D4AF37'), mma=('#24344D', '#101521'), gi='#17181C', judo='#1B3F8B', belt='#121212', glove='#1D4E89', glove2='#F4F4F5', rash='#1D4E89', praj='#F4F4F5', mmag=('#1D4E89', '#F4F4F5', '#F4F4F5'), logo='#D4AF37'),
    # 1.19 (Youssef 05/11 « change la couleur »): carbon black and raspberry pink, the CS mark printed in white and pink
    'inaya': dict(boxe=('#D6336C', '#17171C'), kick=('#17171C', '#D6336C'), thai=('#F4F4F5', '#D6336C'), mma=('#17171C', '#D6336C'), gi='#1B3F8B', judo='#1B3F8B', belt='#121212', glove='#D6336C', glove2='#17171C', rash='#D6336C', praj='#D6336C', mmag=('#17171C', '#D6336C', '#D6336C'), logo='#D6336C'),
}[os.environ.get('PALETTE') or sex]
# 1.12 (Youssef, 04/11, decision « Brassière sans bretelles au cou »): Inaya's boxing and kick-boxing tops are bandeaus;
# her sports body's halter straps run round the neck and a strapped bra copied over them came out torn there
BANDEAU = os.environ.get('PALETTE') == 'inaya' or INAYA_FEMALE_PATTERN


_ONCUT = [False]


def grad_fabric(name, kind, rough, strength, sheen=0.0):
    """1.22 a fabric whose colour is carried by the points (glTF COLOR_0, see paint_grad): a gradient"""
    m = fabric(name, '#FFFFFF', kind, rough=rough, strength=strength, sheen=sheen)
    if not m.get('css_grad'):
        nt = m.node_tree
        ca = nt.nodes.new('ShaderNodeVertexColor')
        ca.layer_name = 'Col'
        nt.links.new(ca.outputs['Color'], nt.nodes['Principled BSDF'].inputs['Base Color'])
        m['css_grad'] = 1
    return m


def paint_grad(o, cols, z0, z1):
    """1.22 colours of a gradient garment by height: cols[0] at z1 and above, cols[1] at z0 and below, smooth in
    between; per face corner, so the faces of another material (a band) stay white (no tint)"""
    def lin(hexc):
        c = [int(hexc[i:i + 2], 16) / 255 for i in (1, 3, 5)]
        return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    a, b = lin(cols[0]), lin(cols[1])
    me_ = o.data
    at = me_.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
    mw = o.matrix_world
    grad_idx = [k for k, m in enumerate(me_.materials) if m and m.get('css_grad')]
    for p_ in me_.polygons:
        for li in p_.loop_indices:
            if p_.material_index not in grad_idx:
                at.data[li].color = (1, 1, 1, 1)
                continue
            z = (mw @ me_.vertices[me_.loops[li].vertex_index].co).z
            t = _ss(z0, z1, z)
            at.data[li].color = (*[b[j] + (a[j] - b[j]) * t for j in range(3)], 1)


def outfit(name):
    parts, hide = [], set()

    def add(r):
        ps, cov = r
        parts.extend(ps)
        hide.update(cov)

    if name == 'boxe':
        add(shorts('boxe', *C['boxe']))
        if female:
            add(female_top(C['boxe'][0], C['boxe'][1]) or bra_v2(C['boxe'][0], C['boxe'][1], bandeau=BANDEAU))
        for s in ('Left', 'Right'):
            parts.extend(boxing_glove_v2(s, C['glove'], '#F4F4F5'))
        hide |= hide_hands()
        add(shoes_v2('#16181D' if not female else '#F4F4F5', '#F4F4F5' if not female else '#16181D'))
    elif name == 'kickboxing':
        add(shorts('kick', *C['kick']))
        if female:
            add(female_top(C['kick'][1], C['kick'][0]) or bra_v2(C['kick'][1], C['kick'][0], bandeau=BANDEAU))
        for s in ('Left', 'Right'):
            parts.extend(boxing_glove_v2(s, C['glove2'], C['kick'][1]))
        hide |= hide_hands()
        add(shin_guards('#F4F4F5' if not female else '#16181D', C['kick'][1] if not female else C['kick'][0]))
    elif name == 'muaythai':
        add(shorts('thai', *C['thai']))
        if female:
            add(female_top(C['thai'][0], C['thai'][1]) or bra_v2(C['thai'][0], C['thai'][1]))
        for s in ('Left', 'Right'):
            parts.extend(boxing_glove_v2(s, C['glove'], C['thai'][1], thai=True))
            parts.extend(prajioud_v2(s, C.get('praj', '#B3122A' if female else '#D4AF37')))
        hide |= hide_hands()
    elif name == 'mma':
        # 1.9 (Youssef's references, 2026-10-29): vale-tudo short to mid-thigh (charcoal for him, black for her),
        # plain black racer-back bra, open gloves black with a white strap and palm (him) or all black (her)
        if female and MMAF:
            # 1.22 (Youssef 05/11 18:07-18:09, photos, « MMA seulement »): 2-in-1 short (liner and gathered
            # over-short) and a sports bra with a wide elastic under-band, colours per coach (MMAF_KITS)
            k = MMAF_KITS[MMAF]
            _ONCUT[0] = True
            add(shorts('vale-tudo', k['liner'], k['linerband'], under=UNDER_OVERLAP >= 0))
            add(shorts('surshort', k['over'], k['overband']))
            add(female_top(k['top'], k['topband']) or bra_v2(k['top'], k['topband'], band=0.035))
            _ONCUT[0] = False
        else:
            add(shorts('vale-tudo', *C['mma']))
        if female and not MMAF:
            # geom: the racer back cut by planes on Amara too (her weight cut left a torn edge on the back)
            add(female_top(C['mma'][0]) or bra_v2(C['mma'][0]))
        if 'mmag' in C:
            add(mma_gloves(*C['mmag']))
        else:
            add(mma_gloves('#16181D', '#E9E9E6', '#E9E9E6') if not female else mma_gloves('#16181D', '#2B2D33'))
        # 1.27 (Youssef 06/11): shin-and-instep guards, in the gloves' colours
        if os.environ.get('MMA_SHIN', '1') == '1':
            g = C['mmag'][:2] if 'mmag' in C else (('#16181D', '#E9E9E6') if not female else ('#16181D', '#2B2D33'))
            add(mma_shin_guards(*g))
    elif name == 'bjj-nogi':
        # 1.38.0: same No-Gi pattern and skinning, distinct colours per coach.
        # Keep the generator's exportable fabric materials: procedural Wave
        # nodes are not reliably exported by Blender's glTF/GLB exporter.
        NOGI_PALETTES = {
            'mma-kadir': ('#17191D', '#292D34', '#D73B42'),
            'kadir': ('#17191D', '#292D34', '#D73B42'),
            'mma-nael': ('#152943', '#111821', '#2F8CEB'),
            'nael': ('#152943', '#111821', '#2F8CEB'),
            'inaya': ('#48203F', '#19151C', '#EA4E92'),
            'mma-inaya': ('#48203F', '#19151C', '#EA4E92'),
            'mma-amara': ('#151419', '#1D1B20', '#D4AF37'),
            'amara': ('#151419', '#1D1B20', '#D4AF37'),
        }
        top_color, short_color, accent_color = NOGI_PALETTES.get(
            COACH_ID, ('#152943', '#151A22', '#2F8CEB'))
        # Premium combatwear styling: fitted rashguard, contrasted shoulder /
        # side panels and technical elastic waistband, without third-party marks.
        # The accent is applied to actual exported mesh materials (not to a
        # procedural Blender-only shader) so it survives glTF export.
        nogi_top = top('rash-court', top_color, accent=accent_color, nogi=True)
        nogi_short = shorts('mma', short_color, accent_color, hem_override=0.46)
        add(nogi_top)
        add(nogi_short)
        for garment in (nogi_top, nogi_short):
            if garment is None:
                continue
            for mesh in garment[0]:
                if mesh is None or not hasattr(mesh, 'data'):
                    continue
                mesh['cssNoGiPalette'] = COACH_ID
                mesh['cssNoGiAccent'] = accent_color
                mesh['cssNoGiCollection'] = 'Shadow Flow - original combatwear'
    elif name in ('bjj', 'judo'):
        col = C['gi'] if name == 'bjj' else C['judo']
        if female:
            add(top('rash-court', '#16181D'))
        add(jacket(col, name))
        add(pants(col, name))
        parts.extend(skirt(col, name, hipZ + 0.03, 0.2 if name == 'bjj' else 0.25))
        parts.extend(collar(col, name))
        parts.extend(belt(C['belt'], hipZ + 0.035, extra=0.02))
    elif name == 'arbitre':
        # 1.4.1 boxing referee (illustrations of the encyclopedia only): white shirt, black trousers, bow tie, shoes
        add(top('rash-long', '#EEEEEA'))
        parts.extend(shirt_collar('#EEEEEA'))
        parts.extend(bow_tie('#111214'))
        add(pants('#17181C', 'arbitre'))
        add(shoes_v2('#16181D', '#16181D'))
    elif name == 'arbitre-judo':
        # judo referee: dark suit jacket over a white shirt front and a tie, dark trousers, barefoot on the tatami
        parts.extend(shirt_front('#EEEEEA'))
        parts.extend(shirt_collar('#EEEEEA'))
        parts.extend(neck_tie('#5A1A22'))
        add(jacket('#1C2230', 'costume'))
        parts.extend(skirt('#1C2230', 'costume', hipZ + 0.03, 0.16))
        add(pants('#1C2230', 'arbitre'))
    if LOGO:
        parts.extend(brand_logos(parts))
    return parts, hide


def brand_logos(parts):
    """1.19: the CS mark on the top (front, under the bust; back, over the middle of the back where Inaya's body
    kept the trace of the bikini's knot) and on the left leg of the shorts or trousers"""
    out = []
    accent = C.get('logo', '#C8102E')
    if any(g.name.startswith('veste') for g in parts):
        return []  # gi: no print (and the rash under it is hidden)
    def ink(g):
        # white letters on a dark cloth, carbon on a light one (white muay-thai kit: the mark vanished)
        m = g.data.materials[0] if g.data.materials else None
        col = m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value if m and m.use_nodes else (0, 0, 0, 1)
        lum = 0.2126 * col[0] + 0.7152 * col[1] + 0.0722 * col[2]
        return '#17171C' if lum > 0.45 else '#FFFFFF'

    for g in parts:
        n = g.name
        if n.startswith('haut-') and female:
            # 1.26 (Youssef, 2026-11-06: « retire aussi le logo sur les brassières des coachs femmes »): plain bras
            continue
        if n.startswith('haut-') or n.startswith('rash-'):
            low = bra_low() - (0.04 if 'crop' in n else 0)
            # 1.22 the wide under-band of the women's MMA bra (3.5 cm): both marks above it, on the plain cloth
            wide = 0.025 if (MMAF and n.startswith('haut-brassiere') and len(g.data.materials) > 1) else 0.0
            out.append(logo_on(g, f'logo-{n}-avant', Vector((0, 0, low + 0.035 + wide)), Vector((0, -1, 0)), 0.05, letters=ink(g), slash=accent))
            out.append(logo_on(g, f'logo-{n}-dos', Vector((0, 0, float(os.environ.get('LOGO_BACK_Z', str(chestZ - 0.035))) + wide)), Vector((0, 1, 0)), 0.075, letters=ink(g), slash=accent))
        elif n.startswith('short-') or n.startswith('pantalon') or n.startswith('legging'):
            # 1.22 2-in-1 short: the mark on the over-short only (the liner's would lie under it), higher on the thigh
            over = any(q.name.startswith('short-surshort') for q in parts)
            if over and not n.startswith('short-surshort'):
                continue
            s_ = 'Left'
            k, u = H[f'{s_}Leg'], H[f'{s_}UpLeg']
            # on the front of the thigh, a little to the outside, facing forward (seen from the side it crossed the
            # curve of the thigh and read garbled)
            c = k + (u - k) * (0.8 if over else 0.6)
            sx = 1 if c.x > 0 else -1
            out.append(logo_on(g, f'logo-{n}', Vector((c.x + 0.015 * sx, 0, c.z)), Vector((0.25 * sx, -1, 0)), 0.04, letters=ink(g), slash=accent, lift=0.0025))
    return merge_prints([o for o in out if o is not None])


def merge_prints(objs):
    """1.21 (all coaches wear the mark now): each print was two materials (letters, slash), so up to 6 more draw calls
    per outfit, over the phones' budget (outfit-v043 test). All the prints of an outfit become one mesh with one
    material, the two colours carried by the points (glTF COLOR_0): one draw call"""
    if not objs:
        return []
    def lin(hexc):
        c = [int(hexc[i:i + 2], 16) / 255 for i in (1, 3, 5)]
        return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    for o in objs:
        me_ = o.data
        cols = [lin(m.name.rsplit('-', 1)[1]) for m in me_.materials]
        at = me_.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
        for p_ in me_.polygons:
            col = cols[p_.material_index]
            for vi in p_.vertices:
                at.data[vi].color = (*col, 1)
        for p_ in me_.polygons:
            p_.material_index = 0
        while len(me_.materials) > 1:
            me_.materials.pop(index=len(me_.materials) - 1)
    name = 'logo-cs'
    m = MATS.get(name)
    if m is None:
        m = bpy.data.materials.new(name)
        m.use_nodes = True
        nt = m.node_tree
        b_ = nt.nodes['Principled BSDF']
        b_.inputs['Roughness'].default_value = 0.5
        ca = nt.nodes.new('ShaderNodeVertexColor')
        ca.layer_name = 'Col'
        nt.links.new(ca.outputs['Color'], b_.inputs['Base Color'])
        MATS[name] = m
    for o in objs:
        o.data.materials[0] = m
    if len(objs) > 1:
        bpy.ops.object.select_all(action='DESELECT')
        for o in objs:
            o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        bpy.ops.object.join()
    objs[0].name = 'logo-cs'
    return [objs[0]]


def neck_ring(z):
    """centre and mean radius of the neck at height z"""
    cx, cy, rad = ring_profile(z, pad=0.0)
    return cx, cy, sum(rad) / len(rad), rad


def shirt_collar(color):
    """1.4.1 the band collar of a referee's shirt: a short tube round the base of the neck"""
    z = H['Neck'].z - 0.02
    cx, cy, r, _ = neck_ring(z)
    o = tube('col-chemise', Vector((cx, cy, z - 0.03)), Vector((cx, cy, z + 0.02)), r + 0.012, r + 0.007, seg=40, rings=4)
    solid(o, 0.003)
    o.data.materials.append(fabric(f'col-{color}', color, 'flat', rough=0.7, strength=0.3))
    weighted(o, {'Neck': 0.6, 'Spine2': 0.4})
    return [o]


def bow_tie(color):
    """1.4.1 a boxing referee's bow tie at the collar: two wings and the knot"""
    z = H['Neck'].z - 0.035
    cx, cy, r, rad = neck_ring(z)
    front = Vector((cx, cy - rad[9] - 0.016, z))
    X, Y, Z = Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))
    m = fabric(f'noeud-{color}', color, 'satin', rough=0.45, strength=0.4, sheen=0.3)
    parts = []
    for sg in (1, -1):
        o = ellipsoid(f'papillon-{sg}', front + Vector((0.034 * sg, 0.002, 0)), (X, Y, Z), (0.034, 0.008, 0.02), seg=20, rings=12, power=0.7)
        o.data.materials.append(m)
        parts.append(o)
    k = ellipsoid('papillon-noeud', front + Vector((0, -0.004, 0)), (X, Y, Z), (0.011, 0.009, 0.014), seg=16, rings=10)
    k.data.materials.append(m)
    parts.append(k)
    for o in parts:
        weighted(o, {'Neck': 0.5, 'Spine2': 0.5})
    return parts


def shirt_front(color):
    """1.4.1 the shirt front seen in the V of a suit jacket (a whole shirt under the jacket showed through it)"""
    z = H['Neck'].z - 0.03
    cx = 0.0
    pts = []
    for k in range(13):
        zz = z - k / 12 * 0.3
        _, cy2, rad2 = ring_profile(zz, pad=0.0)
        pts.append(Vector((cx, cy2 - rad2[9] - 0.004, zz)))
    m = fabric(f'plastron-{color}', color, 'flat', rough=0.7, strength=0.3)
    o = strip('plastron', pts, 0.17, Vector((0, -1, 0)), 0.002, m, across=6)
    weighted(o, lambda c: {'Spine2': 0.8, 'Neck': 0.2} if c.z > chestZ else {'Spine2': 0.6, 'Spine1': 0.4})
    return [o]


def neck_tie(color):
    """1.4.1 a judo referee's tie, from the collar down the shirt front to the top of the trousers"""
    z = H['Neck'].z - 0.035
    cx, cy, r, rad = neck_ring(z)
    top_ = Vector((cx, cy - rad[9] - 0.012, z))
    pts = []
    for k in range(13):
        t = k / 12
        zz = z - t * (z - (hipZ + 0.1))
        _, cy2, rad2 = ring_profile(zz, pad=0.0)
        pts.append(Vector((cx, cy2 - rad2[9] - 0.008, zz)))
    m = fabric(f'cravate-{color}', color, 'satin', rough=0.45, strength=0.4, sheen=0.3)
    o = strip('cravate', pts, 0.06, Vector((0, -1, 0)), 0.004, m)
    knot = ellipsoid('cravate-noeud', top_ + Vector((0, -0.006, -0.006)), (Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))), (0.016, 0.01, 0.02), seg=16, rings=10)
    knot.data.materials.append(m)
    weighted(o, lambda c: {'Spine2': 0.7, 'Spine1': 0.3} if c.z > chestZ - 0.1 else {'Spine1': 0.6, 'Spine': 0.4})
    weighted(knot, {'Neck': 0.5, 'Spine2': 0.5})
    return [o, knot]


# quantisation of the hidden body vertices: millimetres
HQ = 1000


def _file_positions():
    """1.11: the body points exactly as the shipped file stores them (float32, glTF axes). The app rounds those
    values; Blender's import scales them (cm -> m) in float32 and a point at x.5 mm could land on the other side of
    the half (Naël, kick-boxing: one skin point left drawn, its triangles pierced the short as a patch on the thigh).
    1.26 (Youssef, 2026-11-06: « les bottes avec des trous »): each stored point is found from where the skeleton at
    rest puts it. On the MakeHuman bodies (Axel, Kaila) the bind pose is not the rest pose: Blender imports the skin
    posed at rest, about 1 cm from the stored points, so only 8 % of the hidden points of every garment matched a
    point of the file and the skin under their clothes stayed drawn (the shin through the boxing shoes)"""
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from skinmap import skinned_points
    F, S = skinned_points(src)
    F = F.astype(np.float32)
    kd = KDTree(len(S))
    for k, f in enumerate(S):
        kd.insert(Vector((float(f[0]), float(-f[2]), float(f[1]))), k)
    kd.balance()
    return F, kd


_FP = []


def file_key_i(i):
    """key of body point i (see _file_positions); 1.37.7: its shipped position (P may hold the flattened bikini)"""
    return file_key(P_SHIPPED[i])


def file_key(c):
    """key of a body point as the app computes it: Math.round(value * scale), on the file's own float32 value"""
    if not _FP:
        _FP.append(_file_positions())
    F, kd = _FP[0]
    _, k, d = kd.find(c)
    f = F[k] if d < 1e-4 else np.array((c.x, c.z, -c.y), dtype=np.float32)
    # Math.round: halves go up (Python's round() sends them to the even number)
    return tuple(math.floor(float(x) * HQ + 0.5) for x in f)


# 1.26 (Youssef, 2026-11-06: « je voudrais aussi des effets d'ombre … il faut que ça soit NET »): the clothes were lit
# as if nothing stood near them (a white gi read flat, a belt seemed glued on the jacket). Each garment now carries
# its ambient occlusion in its point colours (glTF COLOR_0, multiplied by its colour on every phone, with or without
# the shadow maps): darker in the folds, under the belt and the collar, at the waistband, inside the cuffs and where
# the cloth meets the skin. Measured once here, on the outfit at rest, with the body and every other garment around.
AO = os.environ.get('AO', '1') == '1'
AO_DIST = float(os.environ.get('AO_DIST', '0.15'))
AO_K = float(os.environ.get('AO_K', '0.9'))
AO_MIN = float(os.environ.get('AO_MIN', '0.35'))
AO_RAYS = int(os.environ.get('AO_RAYS', '24'))
AO_COVER = float(os.environ.get('AO_COVER', '0.03'))


def _ao_dirs(n):
    """n directions over the hemisphere around +z, cosine weighted (Fibonacci spiral)"""
    out = []
    g = math.pi * (3 - math.sqrt(5))
    for k in range(n):
        r = math.sqrt((k + 0.5) / n)
        a = k * g
        out.append(Vector((r * math.cos(a), r * math.sin(a), math.sqrt(max(0.0, 1 - r * r)))))
    return out


def bake_ao(parts):
    from mathutils.bvhtree import BVHTree
    verts, polys = [p_.copy() for p_ in P], [tuple(p_.vertices) for p_ in me.polygons]
    for o in parts:
        mw = o.matrix_world
        base = len(verts)
        verts += [mw @ v.co for v in o.data.vertices]
        polys += [tuple(base + i for i in p_.vertices) for p_ in o.data.polygons]
    tree = BVHTree.FromPolygons(verts, polys, epsilon=0.0)
    dirs = _ao_dirs(AO_RAYS)
    rng_ = np.random.default_rng(5)
    for o in parts:
        me_ = o.data
        mw = o.matrix_world
        nm = mw.to_3x3().inverted().transposed()
        nv = len(me_.vertices)
        ao = np.ones(nv)
        for vi, v in enumerate(me_.vertices):
            p_ = mw @ v.co
            n_ = (nm @ v.normal).normalized()
            # a frame round the normal, turned at random per point (no banding between neighbours)
            t_ = n_.orthogonal().normalized()
            t_.rotate(Matrix.Rotation(rng_.random() * 2 * math.pi, 3, n_))
            b_ = n_.cross(t_)
            o_ = p_ + n_ * 0.0015
            # under another garment (the trousers under the skirt of the gi, the jacket under the belt) or the inside
            # of the cloth: not seen, left bright, so that where it pokes through a fold it does not show as a grey
            # stain on the white cloth (first 1.26 bake)
            if tree.ray_cast(o_, n_, AO_COVER)[0] is not None:
                continue
            occ = 0.0
            for d in dirs:
                dw = t_ * d.x + b_ * d.y + n_ * d.z
                hit = tree.ray_cast(o_, dw, AO_DIST)
                if hit[0] is not None:
                    occ += 1 - hit[3] / AO_DIST
            ao[vi] = 1 - occ / len(dirs)
        # one pass over the neighbours: the ray noise smoothed, the shadow stays where it is
        nb = [[] for _ in range(nv)]
        for e in me_.edges:
            a, b = e.vertices
            nb[a].append(b)
            nb[b].append(a)
        ao = np.array([(ao[i] * 2 + sum(ao[j] for j in nb[i])) / (2 + len(nb[i])) for i in range(nv)])
        shade = np.clip(1 - AO_K * (1 - ao), AO_MIN, 1)
        col = me_.color_attributes.get('Col')
        if col is None:
            col = me_.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
            for c in col.data:
                c.color = (1, 1, 1, 1)
        if col.domain == 'POINT':
            for vi, c in enumerate(col.data):
                k = shade[vi]
                c.color = (c.color[0] * k, c.color[1] * k, c.color[2] * k, c.color[3])
        else:
            for li, l in enumerate(me_.loops):
                c = col.data[li]
                k = shade[l.vertex_index]
                c.color = (c.color[0] * k, c.color[1] * k, c.color[2] * k, c.color[3])
        me_.color_attributes.active_color = col
        print('ombre', o.name, nv, 'points, moyenne', round(float(shade.mean()), 3), 'min', round(float(shade.min()), 3))


def export(name, parts, hide):
    if AO:
        bake_ao(parts)
    for o in parts:
        # every garment is skinned to the coach's skeleton
        if o.parent != arm:
            mw = o.matrix_world.copy()
            o.parent = arm
            o.matrix_parent_inverse = arm.matrix_world.inverted()
            o.matrix_basis = mw
        if not any(m.type == 'ARMATURE' for m in o.modifiers):
            m = o.modifiers.new('Armature', 'ARMATURE')
            m.object = arm
        uv_world(o)
    # body vertices drawn no more under this outfit, in glTF axes, millimetres
    q = bytearray()
    for i in sorted(hide):
        q += struct.pack('<hhh', *file_key_i(i))
    parts[0]['hideBody'] = base64.b64encode(bytes(q)).decode()
    parts[0]['hideScale'] = HQ
    parts[0]['outfit'] = name
    # Assets can now be verified as freshly regenerated: unchanged legacy GLBs must
    # never pass the v1.37.2 deployment gate with old cutouts.
    parts[0]['generatorVersion'] = '1.37.7' if COACH_ID == 'mma-amara' else '1.37.4' if INAYA_FEMALE_PATTERN else '1.37.2'
    if COACH_ID == 'mma-amara':
        if AMARA_PATCHES:
            parts[0]['sportsTopCut'] = 'covered-square-1376'
            if name == 'mma':
                parts[0]['shortCrotchGeometry'] = 'separate-leg-openings-1376'
        else:
            # 1.37.7: Inaya's crop with the higher front of 1.37.6; the MMA liner parted at the middle
            parts[0]['sportsTopCut'] = 'inaya-crop-high-front-1377'
            if name == 'mma':
                parts[0]['shortCrotchGeometry'] = 'liner-split-1377'
    if CLEAN_BIKINI:
        parts[0]['oldBikiniFlattened'] = True
    if INAYA_FEMALE_PATTERN:
        parts[0]['clothingReference'] = 'inaya'
        parts[0]['clothingMorphology'] = COACH_ID
    for o in bpy.context.view_layer.objects:
        o.select_set(o in parts or o == arm)
    body.select_set(False)
    out = os.path.join(outdir, f'{name}.glb')
    # Blender 4.0's glTF exporter does not accept export_vertex_color.
    # Pass the legacy option only when it exists, without affecting other outfits.
    gltf_options = dict(filepath=out, export_format='GLB', export_image_format='JPEG',
                        export_jpeg_quality=85, export_animations=False, export_skins=True,
                        export_yup=True, use_selection=True, export_extras=True, export_apply=False)
    gltf_properties = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    if 'export_vertex_color' in gltf_properties:
        gltf_options['export_vertex_color'] = 'ACTIVE' if AO else 'MATERIAL'
    bpy.ops.export_scene.gltf(**gltf_options)
    print('wrote', out, os.path.getsize(out), 'parts', len(parts), 'hidden body vertices', len(hide))
    for o in parts:
        bpy.data.objects.remove(o)


def uv_world(o):
    """box-mapped UVs at a fixed scale (1 UV = 25 cm): the woven or knitted relief keeps the same size on every
    garment, whatever its shape"""
    me_ = o.data
    if o.get('css_uv'):
        return
    if not me_.uv_layers:
        me_.uv_layers.new()
    uv = me_.uv_layers.active.data
    for poly in me_.polygons:
        n = poly.normal
        ax = max(range(3), key=lambda k: abs(n[k]))
        for li in poly.loop_indices:
            p = o.matrix_world @ me_.vertices[me_.loops[li].vertex_index].co
            a, b = [(p.y, p.z), (p.x, p.z), (p.x, p.y)][ax]
            uv[li].uv = (a / 0.25, b / 0.25)


for name in ONLY or ['boxe', 'kickboxing', 'muaythai', 'mma', 'bjj', 'bjj-nogi', 'judo']:
    parts, hide = outfit(name)
    export(name, parts, hide)
