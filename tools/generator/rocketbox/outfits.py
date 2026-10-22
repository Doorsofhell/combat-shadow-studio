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

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
for o in list(bpy.data.objects):
    if o.type == 'MESH' and not o.vertex_groups:
        bpy.data.objects.remove(o)
arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
body = [o for o in bpy.data.objects if o.type == 'MESH'][0]
MW = body.matrix_world.copy()
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


MATS = {}


def fabric(name, color, kind, rough=0.7, strength=2.0, sheen=0.0, coat=0.0):
    """material with a generated relief; colour as sRGB hex"""
    if name in MATS:
        return MATS[name]
    h = {'weave': weave, 'knit': knit, 'satin': satin, 'grain': grain, 'flat': lambda: noise(256, 3) * 0.2}[kind]()
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


def shell(name, keep, push, thick, mats, mat_of=None, hem=0.006, cuts=()):
    """body faces whose vertices all satisfy keep(i), pushed out by push(i) (metres along the normal, or a
    Vector: free displacement), given a thickness. mats: list of materials, mat_of(face centre, vertex ids) -> index.
    cuts: (point, normal) planes the body is sliced along first, so hems and colour bands are straight lines
    instead of following the triangles"""
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
    dec.ratio = float(os.environ.get('DECIMATE', '0.4'))
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

    bmesh.ops.delete(bm_, geom=[f for f in bm_.faces if not face_ok(f)], context='FACES')
    bmesh.ops.delete(bm_, geom=[v for v in bm_.verts if not v.link_faces], context='VERTS')
    # the body is split along its texture seams: weld them, or the garment shows a crack there
    bmesh.ops.remove_doubles(bm_, verts=bm_.verts[:], dist=0.0005 / max(MW.to_scale()))
    bm_.normal_update()
    # body vertices under the garment: every body vertex of the region, but those near the garment's free edges
    # (the skin stays drawn where the cloth ends)
    edge_pts = [MW @ v.co for e in bm_.edges if e.is_boundary for v in e.verts]
    ekd = KDTree(max(1, len(edge_pts)))
    for k_, q_ in enumerate(edge_pts):
        ekd.insert(q_, k_)
    ekd.balance()
    covered = {i for i in range(len(P)) if ok[i] and (not edge_pts or ekd.find(P[i])[2] > 0.012)}
    garment = KDTree(len(bm_.verts))
    for k_, v in enumerate(bm_.verts):
        garment.insert(MW @ v.co, k_)
    garment.balance()
    # only where the garment really is (the region test alone would also hide skin a cut removed)
    covered = {i for i in covered if garment.find(P[i])[2] < 0.07}
    for v in bm_.verts:
        i = v[lay]
        d = push(i)
        world = (MW @ v.co) + (N[i] * d if isinstance(d, (int, float)) else d)
        v.co = MWI @ world
    # hems: the free edges stand off the skin a little (a folded, stitched edge is thicker, and the skin never shows over it)
    for v in bm_.verts:
        if any(e.is_boundary for e in v.link_edges):
            v.co = v.co + (MWI.to_3x3() @ N[v[lay]]) * (hem * 0.25)
    if mats:
        o.data.materials.clear()
        for m in mats:
            o.data.materials.append(m)
        for f in bm_.faces:
            c = MW @ f.calc_center_median()
            f.material_index = mat_of(c, [v[lay] for v in f.verts]) if mat_of else 0
    bm_.to_mesh(o.data)
    bm_.free()
    o.data.attributes.remove(o.data.attributes['src']) if 'src' in o.data.attributes else None
    smooth(o, 2)
    if thick:
        sol = o.modifiers.new('Solidify', 'SOLIDIFY')
        sol.thickness = thick / max(MW.to_scale())
        sol.offset = -1
        sol.use_rim = True
        # no « even thickness »: on a sharp corner (a slit, a finger hole) it pushes points metres away
        sol.use_even_offset = False
        sol.use_quality_normals = True
        sol.material_offset_rim = 0
        apply(o, sol)
    for p in o.data.polygons:
        p.use_smooth = True
    o['covers'] = len(covered)
    return o, covered


def smooth(o, n):
    """relax the shell (cloth drapes, it does not copy every muscle)"""
    if not n:
        return
    m = o.modifiers.new('Smooth', 'SMOOTH')
    m.factor = 0.5
    m.iterations = n
    apply(o, m)


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


def ellipsoid(name, centre, axes, radii, seg=28, rings=18):
    bm_ = bmesh.new()
    bmesh.ops.create_uvsphere(bm_, u_segments=seg, v_segments=rings, radius=1.0)
    M = Matrix((axes[0] * radii[0], axes[1] * radii[1], axes[2] * radii[2])).transposed()
    for v in bm_.verts:
        v.co = MWI @ (centre + M @ v.co)
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
    mitt = ellipsoid(f'gant-{s}', wr + a * (L * 0.5), (a, lat, up), (L * 0.55, 0.068 if not thai else 0.064, 0.056 if not thai else 0.058))
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
    mitt.data.materials.append(fabric(f'cuir-{color}', color, 'grain', rough=0.38, strength=1.2, coat=0.6))
    parts.append(mitt)
    # thumb along the side of the mitt (attached, as on real gloves)
    th = ellipsoid(f'pouce-{s}', wr + a * (L * 0.45) + lat * 0.06 + up * 0.012, (a, lat, up), (0.045, 0.022, 0.024), 18, 12)
    th.data.materials.append(fabric(f'cuir-{color}', color, 'grain', rough=0.38, strength=1.2, coat=0.6))
    parts.append(th)
    # cuff up the forearm, then a strap (velcro on boxing gloves, a longer laced-look cuff on Thai gloves)
    fa = H[f'{s}ForeArm']
    cuffLen = 0.1 if not thai else 0.12
    top = wr + (fa - wr).normalized() * cuffLen
    cuff = tube(f'manchette-{s}', wr + a * 0.03, top, 0.05, 0.047, around=up)
    cuff.data.materials.append(fabric(f'cuir-{color}', color, 'grain', rough=0.38, strength=1.2, coat=0.6))
    solid(cuff, 0.008)
    parts.append(cuff)
    strap = tube(f'sangle-{s}', wr + (fa - wr).normalized() * (cuffLen * 0.35), wr + (fa - wr).normalized() * (cuffLen * 0.75), 0.054, 0.053, around=up)
    strap.data.materials.append(fabric(f'sangle-{accent}', accent, 'knit', rough=0.6, strength=1.5))
    solid(strap, 0.004)
    parts.append(strap)
    for o in parts:
        for p in o.data.polygons:
            p.use_smooth = True
        weighted(o, lambda p_: (lambda t: {f'{s}Hand': 1 - t, f'{s}ForeArm': t})(max(0.0, min(1.0, ((p_ - wr).dot((fa - wr).normalized()) - 0.02) / cuffLen))))
    return parts


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


def belt(color, z, extra=0.03):
    cx, cy, rad = ring_profile(z, pad=extra)
    bm_ = bmesh.new()
    seg = 72
    hgt = 0.042
    rows = []
    for k, dzz in enumerate((-hgt / 2, hgt / 2)):
        row = []
        for j in range(seg):
            ang = -math.pi + 2 * math.pi * j / seg
            f = j / seg * 36
            r = rad[int(f) % 36] * (1 - f % 1) + rad[(int(f) + 1) % 36] * (f % 1)
            row.append(bm_.verts.new(MWI @ Vector((cx + r * math.cos(ang), cy + r * math.sin(ang), z + dzz))))
        rows.append(row)
    for j in range(seg):
        bm_.faces.new((rows[0][j], rows[0][(j + 1) % seg], rows[1][(j + 1) % seg], rows[1][j]))
    o = new_obj('ceinture', bm_)
    bm_.free()
    o.matrix_world = MW
    solid(o, 0.006)
    m = fabric(f'ceinture-{color}', color, 'weave', rough=0.8, strength=1.5)
    o.data.materials.append(m)
    parts = [o]
    # knot at the front and two tails hanging down (square knot of a judo or jiu-jitsu belt)
    front = Vector((cx, cy - rad[9] - 0.012, z))
    knot = ellipsoid('noeud', front + Vector((0, -0.01, 0)), (Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))), (0.035, 0.016, 0.03), 18, 12)
    knot.data.materials.append(m)
    parts.append(knot)
    for sgn in (1, -1):
        a = front + Vector((0.012 * sgn, -0.012, -0.015))
        b = a + Vector((0.07 * sgn, -0.02, -0.24))
        t = tube(f'pan-{sgn}', a, b, 0.02, 0.02, 4, 4, around=Vector((0, 1, 0)))
        bmt = bmesh.new()
        bmt.from_mesh(t.data)
        for v in bmt.verts:  # flatten the 4-sided tube into a strip of belt
            p = MW @ v.co
            c = a + (b - a) * max(0.0, min(1.0, (p - a).dot((b - a).normalized()) / (b - a).length))
            q = p - c
            v.co = MWI @ (c + Vector((q.x * 1.0, q.y * 0.25, q.z)))
        bmt.to_mesh(t.data)
        bmt.free()
        t.data.materials.append(m)
        parts.append(t)
    for p_ in parts:
        weighted(p_, {'Hips': 0.8, 'Spine': 0.2})
    return parts


def skirt(color, kind, top_z, length):
    """lower part of a gi jacket: a sleeve of cloth around the hips (not one tube per leg), open at the front where
    the two sides overlap; each front panel follows its thigh a little so a kick lifts it instead of piercing it"""
    bm_ = bmesh.new()
    seg = 48
    rows = []
    n = 6
    for k in range(n + 1):
        z = top_z - length * k / n
        cx, cy, rad = ring_profile(z, dz=0.015, pad=0.025 + 0.02 * k / n)
        row = []
        for j in range(seg + 1):
            ang = -math.pi + 2 * math.pi * j / seg
            f = j / seg * 36
            r = rad[int(f) % 36] * (1 - f % 1) + rad[(int(f) + 1) % 36] * (f % 1)
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
    solid(o, 0.006)
    o.data.materials.append(fabric(f'gi-{color}-{kind}', color, 'weave', rough=0.85, strength=2.4 if kind == 'judo' else 1.8))

    def ww(p):
        down = max(0.0, min(1.0, (top_z - p.z) / length))
        s = 'Left' if p.x > 0 else 'Right'
        front = max(0.0, -p.y / 0.15)
        t = min(0.65, down * (0.35 + 0.4 * min(1.0, front)))
        return {'Hips': 1 - t, f'{s}UpLeg': t}

    weighted(o, ww)
    return [o]


def collar(color, kind):
    """thick collar and lapels: from the back of the neck, over the shoulders, crossing on the chest (left over
    right) down to the belt"""
    m = fabric(f'col-{color}-{kind}', color, 'weave', rough=0.85, strength=3.0)
    parts = []
    nk = H['Neck']
    for s, sg in (('Left', 1), ('Right', -1)):
        pts = [
            nk + Vector((0.0, 0.07, -0.01)),
            nk + Vector((0.06 * sg, 0.045, -0.02)),
            nk + Vector((0.085 * sg, -0.02, -0.05)),
            nk + Vector((0.05 * sg, -0.11, -0.16)),
            nk + Vector((-0.03 * sg, -0.13, -0.33)),
            nk + Vector((-0.09 * sg, -0.125, nk.z * 0 + (hipZ + 0.06) - nk.z)),
        ]
        # put the path just above the jacket surface (body + jacket offset)
        fixed = []
        for p in pts:
            j = min(range(len(P)), key=lambda i: (P[i] - p).length_squared if w(i, *ARMS) < 0.3 else 9)
            fixed.append(P[j] + N[j] * (0.028 if s == 'Left' else 0.022))
        bm_ = bmesh.new()
        prev = None
        steps = 24
        for k in range(steps + 1):
            t = k / steps * (len(fixed) - 1)
            i0 = min(int(t), len(fixed) - 2)
            u = t - i0
            c = fixed[i0] * (1 - u) + fixed[i0 + 1] * u
            d = (fixed[i0 + 1] - fixed[i0]).normalized()
            jn = min(range(len(P)), key=lambda i: (P[i] - c).length_squared)
            nn = N[jn]
            side = d.cross(nn).normalized()
            wd = 0.05 if kind == 'judo' else 0.045
            row = [bm_.verts.new(MWI @ (c - side * wd / 2)), bm_.verts.new(MWI @ (c + side * wd / 2))]
            if prev:
                bm_.faces.new((prev[0], prev[1], row[1], row[0]))
            prev = row
        o = new_obj(f'revers-{s}', bm_)
        bm_.free()
        o.matrix_world = MW
        solid(o, 0.012 if kind == 'judo' else 0.009)
        smooth(o, 1)
        o.data.materials.append(m)
        weighted(o, lambda p: {'Spine2': 0.7, 'Neck': 0.3} if p.z > chestZ else {'Spine2': 0.5, 'Spine1': 0.3, 'Spine': 0.2} if p.z > hipZ + 0.2 else {'Spine': 0.5, 'Hips': 0.5})
        parts.append(o)
    return parts


# ---------------------------------------------------------------- regions
def shorts(kind, color, band, n_leg=None):
    """kind: boxe (loose, to just above the knee, high waistband), kick (fitted, short), thai (short, very wide,
    high waistband), mma (board short, side slits, to the knee), compression"""
    # the photo body has its underwear painted down to mid-thigh: every short reaches below it
    hem = {'boxe': 0.3, 'kick': 0.3, 'thai': 0.32, 'mma': 0.18, 'compression': 0.3}[kind]
    waist = hipZ + {'boxe': 0.13, 'kick': 0.11, 'thai': 0.13, 'mma': 0.11, 'compression': 0.1}[kind]
    bandH = {'boxe': 0.07, 'kick': 0.04, 'thai': 0.08, 'mma': 0.04, 'compression': 0.025}[kind]

    def hemz(i):
        s = leg_of(i)
        return H[f'{s}Leg'].z + hem * (H[f'{s}UpLeg'].z - H[f'{s}Leg'].z)

    def keep(i):
        if P[i].z > waist or w(i, *ARMS) > 0.2 or P[i].z < hemz(i):
            return False
        if kind == 'mma':
            # side slit: 9 cm up the outside of each leg
            s = leg_of(i)
            c, _ = axis_point(i, f'{s}UpLeg', f'{s}Leg')
            if P[i].z < hemz(i) + 0.09 and abs(P[i].x) > abs(c.x) + 0.04 and abs(P[i].y - c.y) < 0.03:
                return False
        return True

    def push(i):
        if P[i].z > hipZ + 0.02:
            return 0.004 + (0.006 if P[i].z > waist - bandH else 0)
        s = leg_of(i)
        if kind in ('kick', 'compression'):
            return 0.003
        flare = {'boxe': 0.03, 'thai': 0.075, 'mma': 0.022}[kind]
        crotch = max(0.0, 1 - abs(P[i].x) / 0.05)
        return loose(i, f'{s}UpLeg', f'{s}Leg', 0.005, lambda u: flare * u ** 1.5 * (1 - 0.7 * crotch) * (0.55 if abs(P[i].x) < abs(axis_point(i, f'{s}UpLeg', f'{s}Leg')[0].x) else 1))

    sheenK = {'boxe': ('satin', 0.32, 0.6), 'thai': ('satin', 0.3, 0.7), 'kick': ('satin', 0.4, 0.4), 'mma': ('flat', 0.6, 0.2), 'compression': ('knit', 0.55, 0.1)}[kind]
    mats = [fabric(f'short-{kind}-{color}', color, sheenK[0], rough=sheenK[1], sheen=sheenK[2]), fabric(f'ceinture-{kind}-{band}', band, 'knit', rough=0.5)]
    hems = {H[f'{s}Leg'].z + hem * (H[f'{s}UpLeg'].z - H[f'{s}Leg'].z) for s in ('Left', 'Right')}
    cuts = [(Vector((0, 0, z)), Vector((0, 0, 1))) for z in (*hems, waist, waist - bandH)]
    o, cov = shell(f'short-{kind}', keep, push, 0.004, mats, lambda c, ids: 1 if c.z > waist - bandH else 0, cuts=cuts)
    smooth(o, 1)
    return [o], cov


def top(kind, color, accent=None):
    """kind: brassiere (sports bra), debardeur (tank top), rash-court, rash-long"""
    lowZ = {'brassiere': chestZ - 0.07 if female else chestZ - 0.05, 'debardeur': hipZ + 0.06, 'rash-court': hipZ + 0.04, 'rash-long': hipZ + 0.04}[kind]
    sleeve = {'brassiere': 0, 'debardeur': 0, 'rash-court': 0.45, 'rash-long': 0.93}[kind]

    def keep(i):
        if P[i].z < lowZ or w(i, 'Head') > 0.2 or w(i, *HANDS) > 0.1 or P[i].z > H['Neck'].z + 0.01:
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

    mats = [fabric(f'haut-{kind}-{color}', color, 'knit', rough=0.55, strength=1.4, sheen=0.2)]
    if accent:
        mats.append(fabric(f'liseré-{accent}', accent, 'knit', rough=0.5, strength=1.0))
    cuts = [(Vector((0, 0, lowZ)), Vector((0, 0, 1)))]
    for s_ in ('Left', 'Right'):
        if 0 < sleeve <= 0.5:
            a, b = H[f'{s_}Arm'], H[f'{s_}ForeArm']
            cuts.append((a + (b - a) * sleeve * 2, (b - a).normalized()))
        elif sleeve > 0.5:
            a, b = H[f'{s_}ForeArm'], H[f'{s_}Hand']
            cuts.append((a + (b - a) * (sleeve - 0.5) * 2, (b - a).normalized()))
    o, cov = shell(f'haut-{kind}', keep, lambda i: 0.0035 if kind != 'debardeur' else 0.006, 0.003, mats,
                   (lambda c, ids: 1 if w(ids[0], *ARMS) < 0.2 and abs(abs(c.x) - 0.16) < 0.02 and abs(c.y) < 0.03 and c.z < chestZ else 0) if accent else None, cuts=cuts)
    return [o], cov


def pants(color, kind, legging=False):
    """gi or judogi trousers (loose, to the ankle bone), or leggings"""
    def keep(i):
        if w(i, *ARMS) > 0.2 or P[i].z > hipZ + (0.06 if legging else 0.09):
            return False
        return P[i].z > ankleZ + (0.06 if not legging else 0.05) and w(i, *FEET) < 0.4

    def push(i):
        if legging:
            return 0.0025
        if P[i].z > hipZ:
            return 0.008
        s = leg_of(i)
        if P[i].z > H[f'{s}Leg'].z:
            return loose(i, f'{s}UpLeg', f'{s}Leg', 0.01, lambda u: 0.022 + 0.008 * u)
        return loose(i, f'{s}Leg', f'{s}Foot', 0.01, lambda u: 0.03 + 0.012 * u)

    mats = [fabric(f'pantalon-{color}-{kind}', color, 'knit' if legging else 'weave', rough=0.6 if legging else 0.85, strength=1.4 if legging else 2.0)]
    cuts = [(Vector((0, 0, ankleZ + (0.06 if not legging else 0.05))), Vector((0, 0, 1))), (Vector((0, 0, hipZ + (0.06 if legging else 0.09))), Vector((0, 0, 1)))]
    o, cov = shell(f'pantalon-{kind}', keep, push, 0.004, mats, cuts=cuts)
    smooth(o, 2 if not legging else 1)
    return [o], cov


def jacket(color, kind):
    """gi / judogi jacket body and sleeves (to just above the wrist, wide); the skirt, collar and belt are added
    separately"""
    vz = {'judo': 0.25, 'bjj': 0.22}[kind]

    def keep(i):
        if P[i].z < hipZ + 0.02 or w(i, 'Head') > 0.2 or w(i, *HANDS) > 0.05 or w(i, 'Neck') > 0.3:
            return False
        nk = H['Neck']
        # V opening on the chest where the lapels cross
        if P[i].y < 0.0 and P[i].z > nk.z - vz:
            half = 0.11 * (P[i].z - (nk.z - vz)) / vz
            if abs(P[i].x) < half + 0.01:
                return False
        s = 'Left' if P[i].x > 0 else 'Right'
        if w(i, f'{s}ForeArm') > 0.3:
            _, u = axis_point(i, f'{s}ForeArm', f'{s}Hand')
            return u < 0.82
        return True

    def push(i):
        s = 'Left' if P[i].x > 0 else 'Right'
        if w(i, f'{s}ForeArm') > 0.3:
            return loose(i, f'{s}ForeArm', f'{s}Hand', 0.012, lambda u: 0.02 + 0.015 * u)
        if w(i, f'{s}Arm') > 0.4:
            return loose(i, f'{s}Arm', f'{s}ForeArm', 0.014, lambda u: 0.012)
        return 0.018 if kind == 'judo' else 0.014

    mats = [fabric(f'gi-{color}-{kind}', color, 'weave', rough=0.85, strength=2.4 if kind == 'judo' else 1.8)]
    cuts = [(Vector((0, 0, hipZ + 0.02)), Vector((0, 0, 1)))]
    for s_ in ('Left', 'Right'):
        a, b = H[f'{s_}ForeArm'], H[f'{s_}Hand']
        cuts.append((a + (b - a) * 0.82, (b - a).normalized()))
    o, cov = shell(f'veste-{kind}', keep, push, 0.006 if kind == 'judo' else 0.005, mats, hem=0.01, cuts=cuts)
    smooth(o, 3)
    return [o], cov


def shoes(color, accent):
    """high boxing shoes: foot and ankle, up to mid-shin, thin flexible sole"""
    def keep(i):
        return P[i].z < ankleZ + 0.2 and w(i, *FEET, 'LeftLeg', 'RightLeg') > 0.5

    o, cov = shell('chaussures', keep, lambda i: 0.004 if P[i].z > 0.012 else 0.0015, 0.004,
                   [fabric(f'chaussure-{color}', color, 'grain', rough=0.45, strength=1.0, coat=0.3), fabric(f'semelle-{accent}', accent, 'flat', rough=0.7)],
                   lambda c, ids: 1 if c.z < 0.015 or (c.y < -0.04 and c.z < ankleZ + 0.15 and abs(abs(c.x) - 0.11) < 0.012) else 0,
                   cuts=[(Vector((0, 0, ankleZ + 0.2)), Vector((0, 0, 1))), (Vector((0, 0, 0.015)), Vector((0, 0, 1)))])
    return [o], cov


def shin_guards(color):
    def keep(i):
        s = 'Left' if P[i].x > 0 else 'Right'
        front = N[i].dot(FWD) > 0.15 or (w(i, f'{s}Foot') > 0.5 and N[i].z > 0.3)
        return front and w(i, f'{s}Leg', f'{s}Foot') > 0.6 and kneeZ - 0.05 > P[i].z > 0.035

    o, cov = shell('protege-tibias', keep, lambda i: 0.012, 0.012, [fabric(f'protection-{color}', color, 'grain', rough=0.5, strength=1.5, coat=0.2)])
    smooth(o, 2)
    return [o], set()  # partial cover: the skin around stays drawn


def mma_gloves(color):
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
            _, u = axis_point(i, f'{s}ForeArm', f'{s}Hand')
            return u > 0.88
        return False

    def push(i):
        s = 'Left' if P[i].x > 0 else 'Right'
        wr, a, lat, up = hand_frame(s)
        q = P[i] - wr
        knuckles = max(0.0, 1 - abs(q.dot(a) - (H[f'{s}HandMiddle1'] - wr).length) / 0.03)
        back = max(0.0, N[i].dot(up))
        return 0.004 + 0.012 * knuckles * back

    o, cov = shell('gants-mma', keep, push, 0.004, [fabric(f'gant-mma-{color}', color, 'grain', rough=0.4, strength=1.2, coat=0.5)])
    return [o], set()


def hide_hands():
    return {i for i in range(len(P)) if w(i, *HANDS) > 0.5}


# ---------------------------------------------------------------- outfits (6 disciplines x 2 coaches)
# colours: the app's palette (anthracite #1F2937, deep red #B3122A, gold #D4AF37, white) for the coaches, a
# different combination for each coach so they never wear the same outfit
C = {
    'homme': dict(boxe=('#B3122A', '#D4AF37'), kick=('#16181D', '#B3122A'), thai=('#C8102E', '#F4F4F5'), mma=('#1F2937', '#B3122A'), gi='#1E2A44', judo='#F7F6F2', belt='#121212', glove='#B3122A', glove2='#16181D', rash='#1F2937'),
    'femme': dict(boxe=('#16181D', '#D4AF37'), kick=('#B3122A', '#16181D'), thai=('#1D2B57', '#D4AF37'), mma=('#16181D', '#D4AF37'), gi='#F2F0EA', judo='#F7F6F2', belt='#121212', glove='#16181D', glove2='#B3122A', rash='#B3122A'),
}[sex]


def outfit(name):
    parts, hide = [], set()

    def add(r):
        ps, cov = r
        parts.extend(ps)
        hide.update(cov)

    if name == 'boxe':
        add(shorts('boxe', *C['boxe']))
        if female:
            add(top('brassiere', C['boxe'][0], C['boxe'][1]))
        for s in ('Left', 'Right'):
            parts.extend(boxing_glove(s, C['glove'], '#F4F4F5'))
        hide |= hide_hands()
        add(shoes('#16181D' if not female else '#F4F4F5', '#F4F4F5' if not female else '#16181D'))
    elif name == 'kickboxing':
        add(shorts('kick', *C['kick']))
        if female:
            add(top('brassiere', C['kick'][1], C['kick'][0]))
        for s in ('Left', 'Right'):
            parts.extend(boxing_glove(s, C['glove2'], C['kick'][1]))
        hide |= hide_hands()
        add(shin_guards('#F4F4F5' if not female else '#16181D'))
    elif name == 'muaythai':
        add(shorts('thai', *C['thai']))
        if female:
            add(top('brassiere', C['thai'][0], C['thai'][1]))
        for s in ('Left', 'Right'):
            parts.extend(boxing_glove(s, C['glove'], C['thai'][1], thai=True))
            parts.extend(prajioud(s, '#B3122A' if female else '#D4AF37'))
        hide |= hide_hands()
    elif name == 'mma':
        add(shorts('mma', *C['mma']))
        if female:
            add(top('brassiere', C['mma'][0], C['mma'][1]))
        add(mma_gloves('#16181D'))
    elif name == 'bjj-nogi':
        add(top('rash-long', C['rash']))
        add(pants('#16181D', 'nogi', legging=True) if female else shorts('compression', '#16181D', '#B3122A'))
        if not female:
            add(shorts('mma', '#16181D', '#B3122A'))
    elif name in ('bjj', 'judo'):
        col = C['gi'] if name == 'bjj' else C['judo']
        if female:
            add(top('rash-court', '#16181D'))
        add(jacket(col, name))
        add(pants(col, name))
        parts.extend(skirt(col, name, hipZ + 0.03, 0.2 if name == 'bjj' else 0.25))
        parts.extend(collar(col, name))
        parts.extend(belt(C['belt'], hipZ + 0.035, extra=0.035))
    return parts, hide


# quantisation of the hidden body vertices: millimetres
HQ = 1000


def export(name, parts, hide):
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
        c = P[i]  # the shipped body is in metres, at rest, in the world (glTF: x, z, -y)
        q += struct.pack('<hhh', round(c.x * HQ), round(c.z * HQ), round(-c.y * HQ))
    parts[0]['hideBody'] = base64.b64encode(bytes(q)).decode()
    parts[0]['hideScale'] = HQ
    parts[0]['outfit'] = name
    for o in bpy.context.view_layer.objects:
        o.select_set(o in parts or o == arm)
    body.select_set(False)
    out = os.path.join(outdir, f'{name}.glb')
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_image_format='JPEG', export_jpeg_quality=85, export_animations=False,
                              export_skins=True, export_yup=True, use_selection=True, export_extras=True, export_apply=False)
    print('wrote', out, os.path.getsize(out), 'parts', len(parts), 'hidden body vertices', len(hide))
    for o in parts:
        bpy.data.objects.remove(o)


def uv_world(o):
    """box-mapped UVs at a fixed scale (1 UV = 25 cm): the woven or knitted relief keeps the same size on every
    garment, whatever its shape"""
    me_ = o.data
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
