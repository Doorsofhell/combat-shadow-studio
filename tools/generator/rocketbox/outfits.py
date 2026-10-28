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
    rows of stitches sunk into a fine grain, like the stitched rows of a real belt or gi collar"""
    y, x = np.mgrid[0:size, 0:size] / size
    h = (base if base is not None else rice(size, 24, 12)) * 0.35 + 0.65
    for k in range(lines):
        v = (k + 0.5) / lines
        groove = np.exp(-(((y - v) / 0.012) ** 2))
        dash = 0.6 + 0.4 * (np.sin(2 * np.pi * x * 16) > -0.3)
        h = h - groove * dash * 0.55
    # the two folded edges of the strip are rounded
    h = h - (np.exp(-((y / 0.05) ** 2)) + np.exp(-(((1 - y) / 0.05) ** 2))) * 0.3
    return h


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
            'ceinture': lambda: stitched(256, 9), 'col-judo': lambda: stitched(256, 7, rice(256, 24, 12, 0.6)),
            'col-bjj': lambda: stitched(256, 4, rice(256, 32, 16, 0.9)), 'serge': serge,
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
    # v0.32: small holes left by the body mesh (navel, a seam the weld missed) are closed; the real openings of a
    # garment (neck, sleeves, legs: dozens of edges) are kept
    bmesh.ops.holes_fill(bm_, edges=[e for e in bm_.edges if e.is_boundary], sides=10)
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
            # v0.32: a hem lies exactly on its cut (the push along the skin's normal used to move each point a little
            # up or down the limb: a ragged, toothed edge on the sleeves and the waistbands)
            # the cut the edge comes from is the closest one (another plane can pass a few centimetres away)
            q = MW @ v.co
            ds = sorted((abs((q - pt).dot(nr)), k) for k, (pt, nr) in enumerate(cuts))
            if ds and ds[0][0] < 0.035:
                pt, nr = cuts[ds[0][1]]
                q = q - nr * (q - pt).dot(nr)
            v.co = MWI @ q
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
    smooth(o, 2, cuts)
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


def smooth(o, n, planes=()):
    """relax the shell (cloth drapes, it does not copy every muscle). v0.43: the points lying on a cut plane (a hem,
    the edge of a colour band) stay on it, so those lines stay straight (the slivers beside a cut used to pull them
    up and down: wavy straps and bands)"""
    if not n:
        return
    m = o.modifiers.new('Smooth', 'SMOOTH')
    m.factor = 0.5
    m.iterations = n
    if planes:
        g = o.vertex_groups.new(name='css-lisse')
        for v in o.data.vertices:
            q = o.matrix_world @ v.co
            on = any(abs((q - pt).dot(nr)) < 0.0015 for pt, nr in planes)
            g.add([v.index], 0.0 if on else 1.0, 'REPLACE')
        m.vertex_group = g.name
    apply(o, m)
    if planes and 'css-lisse' in o.vertex_groups:
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
_GLOVE = None


def lin(hexc):
    c = [int(hexc[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]


def boxing_glove_v2(s, color, accent, thai=False):
    """v0.43 sculpted glove (tools/generator/rocketbox/glove.py): one mesh per hand, vertex-coloured regions"""
    global _GLOVE
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import glove as GL
    if _GLOVE is None:
        _GLOVE = GL.glove_mesh()
    v, q, _, _ = _GLOVE
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

    vreg, pip = GL.regions(np.array([local(MW @ vv.co) for vv in me_.vertices]))
    freg, _ = GL.regions(np.array([local(MW @ f_.center) for f_ in me_.polygons]))
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
    cuffLen = 0.12
    weighted(o, lambda p_: (lambda t: {f'{s}Hand': 1 - t, f'{s}ForeArm': t})(max(0.0, min(1.0, ((p_ - wr).dot(back) - 0.01) / cuffLen))))
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
    m = fabric(f'ceinture-{color}', color, 'ceinture', rough=0.75, strength=1.6, tone=0.25)
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


def skirt(color, kind, top_z, length):
    """lower part of a gi jacket: a sleeve of cloth around the hips (not one tube per leg), open at the front where
    the two sides overlap; each front panel follows its thigh a little so a kick lifts it instead of piercing it"""
    bm_ = bmesh.new()
    seg = 48
    rows = []
    n = 6
    # v0.32: closer to the body (the old 2.5 to 4.5 cm made a padded, inflated skirt)
    pad0, pad1 = (0.014, 0.016) if kind == 'judo' else (0.011, 0.012)
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
        t = min(0.65, down * (0.35 + 0.4 * min(1.0, front)))
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
    m = fabric(f'col-{color}-{kind}', color, 'col-judo' if kind == 'judo' else 'col-bjj', rough=0.9, strength=0.9, tone=0.08)
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
        # v0.32: the MMA side slit is gone (cut along the skin's triangles, it came out torn, Youssef 2026-10-22:
        # « bordures irrégulières »); the hem is straight like the other shorts
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

    # v0.32 (« matières trop brillantes ou plastifiées »): satin keeps a soft sheen but is no longer wet-looking,
    # polyester is matt; the satin relief is shallower (it drew wavy lines)
    sheenK = {'boxe': ('satin', 0.6, 0.35, 0.3), 'thai': ('satin', 0.58, 0.4, 0.3), 'kick': ('serge', 0.62, 0.2, 0.4), 'mma': ('flat', 0.68, 0.1, 1.0), 'compression': ('jersey', 0.6, 0.1, 0.5)}[kind]
    mats = [fabric(f'short-{kind}-{color}', color, sheenK[0], rough=sheenK[1], sheen=sheenK[2], strength=sheenK[3]), fabric(f'ceinture-{kind}-{band}', band, 'elastique', rough=0.65, strength=0.5, tone=0.1)]
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
        if P[i].z < lowZ or w(i, 'Head') > 0.2 or w(i, *HANDS) > 0.5 or P[i].z > H['Neck'].z + 0.01:
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

    mats = [fabric(f'haut-{kind}-{color}', color, 'jersey', rough=0.6, strength=0.5, sheen=0.15)]
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
    o, cov = shell(f'haut-{kind}', keep, lambda i: 0.0035 if kind != 'debardeur' else 0.006, 0.003, mats,
                   (lambda c, ids: 1 if w(ids[0], *ARMS) < 0.2 and abs(abs(c.x) - 0.16) < 0.02 and abs(c.y) < 0.03 and c.z < chestZ else 0) if accent else None, cuts=cuts)
    for s_ in ('Left', 'Right'):
        fold_weights(o, [n for n in G if n.startswith(s_) and 'Hand' in n], f'{s_}ForeArm')
    return [o], cov


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
        if P[i].z > H[f'{s}Leg'].z:
            v = loose(i, f'{s}UpLeg', f'{s}Leg', 0.006, lambda u: (0.016 + 0.006 * u) if judo else (0.012 + 0.004 * u))
        else:
            v = loose(i, f'{s}Leg', f'{s}Foot', 0.006, lambda u: (0.022 + 0.01 * u) if judo else (0.016 + 0.008 * u))
        return v + N[i] * (folds(i, 0.004) + bunch(P[i].z, ankleZ + 0.06, 0.14, 0.006))

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

    def push(i):
        s = 'Left' if P[i].x > 0 else 'Right'
        if w(i, f'{s}ForeArm') > 0.3:
            c, u = axis_point(i, f'{s}ForeArm', f'{s}Hand')
            v = loose(i, f'{s}ForeArm', f'{s}Hand', 0.006, lambda u: (0.016 + 0.012 * u) if judo else (0.01 + 0.006 * u))
            return v + N[i] * (folds(i, 0.003) + (0.004 * (0.5 + 0.5 * math.sin(u * 2 * math.pi * 3)) if u < 0.35 else 0))
        if w(i, f'{s}Arm') > 0.4:
            return loose(i, f'{s}Arm', f'{s}ForeArm', 0.005, lambda u: 0.007 if judo else 0.004) + N[i] * folds(i, 0.003)
        # the short rash guard worn under the gi (Amara) stays under the jacket: the folds only push outwards there
        if female:
            return (0.011 if judo else 0.009) + abs(folds(i, 0.004 if judo else 0.003))
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
            if sel.sum() < 4:
                sel = np.abs(Z - z_) < 0.02
            q_ = pts[sel]
            c_ = (q_[:, :2].max(0) + q_[:, :2].min(0)) / 2
            cx.append(c_[0]); cy.append(c_[1])
            rx.append((q_[:, 0].max() - q_[:, 0].min()) / 2 + 0.0045); ry.append((q_[:, 1].max() - q_[:, 1].min()) / 2 + 0.0045)
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
            foot = GL.smax(foot, np.maximum(u0 - 0.004 - u, u - u1 - 0.006), 0.03)
            iz = lambda a: np.interp(z, zs, a)
            ell = np.sqrt(((g[..., 0] - iz(cx)) / iz(rx)) ** 2 + ((g[..., 1] - iz(cy)) / iz(ry)) ** 2)
            shaft = (ell - 1) * np.minimum(iz(rx), iz(ry))
            shaft = np.maximum(shaft, np.maximum(z - top_z, ankleZ - 0.06 - z))
            d = GL.smin(foot, shaft, 0.018)
            # sole: the footprint, 4 mm wider, from the ground to 1.6 cm
            fp = np.maximum(np.maximum(ip(vmin) - 0.004 - v, v - ip(vmax) - 0.004), np.maximum(u0 - 0.008 - u, u - u1 - 0.01))
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
        for zc in (ground + 0.016, collar_z):
            bmesh.ops.bisect_plane(bm_, geom=bm_.verts[:] + bm_.edges[:] + bm_.faces[:], plane_co=MWI @ Vector((0, 0, zc)), plane_no=nz)
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
        cov |= {i for k2, i in enumerate(mine) if dpts[k2] < -0.001 and P[i].z < top_z - 0.012}
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


def mma_gloves(color, accent='#B3122A'):
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

    def strap(c, ids):
        pt, d_ = wrist['Left' if c.x > 0 else 'Right']
        return 1 if (c - pt).dot(d_) < 0 else 0

    o, cov = shell('gants-mma', keep, push, 0.004, [fabric(f'gant-mma-{color}', color, 'grain', rough=0.55, strength=0.7, coat=0.2),
                                                    fabric(f'sangle-mma-{accent}', accent, 'weave', rough=0.7, strength=1.2)], strap, cuts=cuts)
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
            parts.extend(boxing_glove_v2(s, C['glove'], '#F4F4F5'))
        hide |= hide_hands()
        add(shoes_v2('#16181D' if not female else '#F4F4F5', '#F4F4F5' if not female else '#16181D'))
    elif name == 'kickboxing':
        add(shorts('kick', *C['kick']))
        if female:
            add(top('brassiere', C['kick'][1], C['kick'][0]))
        for s in ('Left', 'Right'):
            parts.extend(boxing_glove_v2(s, C['glove2'], C['kick'][1]))
        hide |= hide_hands()
        add(shin_guards('#F4F4F5' if not female else '#16181D', C['kick'][1] if not female else C['kick'][0]))
    elif name == 'muaythai':
        add(shorts('thai', *C['thai']))
        if female:
            add(top('brassiere', C['thai'][0], C['thai'][1]))
        for s in ('Left', 'Right'):
            parts.extend(boxing_glove_v2(s, C['glove'], C['thai'][1], thai=True))
            parts.extend(prajioud_v2(s, '#B3122A' if female else '#D4AF37'))
        hide |= hide_hands()
    elif name == 'mma':
        add(shorts('mma', *C['mma']))
        if female:
            add(top('brassiere', C['mma'][0], C['mma'][1]))
        add(mma_gloves('#16181D', C['mma'][1]))
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
    return parts, hide


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
