"""
Detailed discipline emblems (variant A) for Combat Shadow Studio, 0.33.

Every object is modelled here from simple primitives (no downloaded model, no texture image): metaballs for the
padded gloves, parametric shells for the shin guards, braided helices for the mongkhon, profiled curves for the belt
and the judogi collar. Materials are procedural (leather grain, fabric weave, gold thread). Each emblem is rendered
with Cycles on a transparent background with a soft contact shadow, then exported by export.py.

usage: python3 tools/generator/emblems/render.py OUTDIR [ids...] [--size 512] [--samples 64]
ids: boxe kickboxing mma muaythai bjj judo (all by default)
"""
import math
import sys
from pathlib import Path

import bpy
import bmesh
from mathutils import Euler, Matrix, Vector

IDS = ['boxe', 'kickboxing', 'mma', 'muaythai', 'bjj', 'judo']

# ----------------------------------------------------------------------------------------------- scene


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.render.image_settings.color_depth = '8'
    try:
        sc.view_settings.view_transform = 'AgX'
        sc.view_settings.look = 'AgX - Base Contrast'
    except TypeError:
        sc.view_settings.view_transform = 'Filmic'
    sc.view_settings.exposure = -0.35
    sc.cycles.use_denoising = True
    try:
        sc.cycles.denoiser = 'OPENIMAGEDENOISE'
    except TypeError:
        pass
    world = bpy.data.worlds.new('w')
    sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = (0.32, 0.33, 0.36, 1)
    bg.inputs['Strength'].default_value = 0.35
    return sc


def light(name, loc, power, size, color=(1, 1, 1)):
    d = bpy.data.lights.new(name, 'AREA')
    d.energy = power
    d.size = size
    d.color = color
    o = bpy.data.objects.new(name, d)
    bpy.context.collection.objects.link(o)
    o.location = loc
    look_at(o, Vector((0, 0, 0.4)))
    return o


def look_at(o, target):
    d = target - Vector(o.location)
    o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()


def studio(sc, size, samples):
    sc.render.resolution_x = size
    sc.render.resolution_y = size
    sc.cycles.samples = samples
    cam_d = bpy.data.cameras.new('cam')
    cam_d.lens = 70
    cam = bpy.data.objects.new('cam', cam_d)
    bpy.context.collection.objects.link(cam)
    cam.location = (0.0, -7.4, 2.6)
    look_at(cam, Vector((0, 0, 0.12)))
    sc.camera = cam
    # warm key, cool rim, soft fill: the same light for the six emblems
    light('key', (3.2, -3.4, 4.4), 900, 3.2, (1.0, 0.96, 0.9))
    light('rim', (-2.6, 3.6, 3.4), 750, 2.4, (0.85, 0.9, 1.0))
    light('fill', (-3.6, -2.4, 1.2), 220, 4.0)
    light('top', (0.0, 0.5, 6.0), 250, 5.0)
    # contact shadow only (the background stays transparent)
    bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 0, -1.0))
    pl = bpy.context.active_object
    pl.name = 'shadow'
    pl.is_shadow_catcher = True
    return cam


# ----------------------------------------------------------------------------------------------- materials


def _bsdf(m):
    m.use_nodes = True
    nt = m.node_tree
    return nt, nt.nodes['Principled BSDF']


def _bump(nt, bsdf, height_socket, strength, distance=0.02):
    b = nt.nodes.new('ShaderNodeBump')
    b.inputs['Strength'].default_value = strength
    b.inputs['Distance'].default_value = distance
    nt.links.new(height_socket, b.inputs['Height'])
    nt.links.new(b.outputs['Normal'], bsdf.inputs['Normal'])
    return b


def leather(name, color, rough=0.36, coat=0.45, grain=0.22):
    m = bpy.data.materials.new(name)
    nt, p = _bsdf(m)
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Coat Weight'].default_value = coat
    p.inputs['Coat Roughness'].default_value = 0.18
    # pebbled leather grain: fine Voronoi cells over a soft noise
    v = nt.nodes.new('ShaderNodeTexVoronoi')
    v.inputs['Scale'].default_value = 160
    n = nt.nodes.new('ShaderNodeTexNoise')
    n.inputs['Scale'].default_value = 40
    mix = nt.nodes.new('ShaderNodeMath')
    mix.operation = 'ADD'
    nt.links.new(v.outputs['Distance'], mix.inputs[0])
    nt.links.new(n.outputs['Fac'], mix.inputs[1])
    _bump(nt, p, mix.outputs[0], grain, 0.01)
    return m


def fabric(name, color, rough=0.82, weave=0.35, scale=90, sheen=0.4, metallic=0.0):
    m = bpy.data.materials.new(name)
    nt, p = _bsdf(m)
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metallic
    p.inputs['Sheen Weight'].default_value = sheen
    # woven fabric: two crossed wave bands
    tc = nt.nodes.new('ShaderNodeTexCoord')
    w1 = nt.nodes.new('ShaderNodeTexWave')
    w1.wave_type = 'BANDS'
    w1.bands_direction = 'X'
    w1.inputs['Scale'].default_value = scale
    w2 = nt.nodes.new('ShaderNodeTexWave')
    w2.wave_type = 'BANDS'
    w2.bands_direction = 'Y'
    w2.inputs['Scale'].default_value = scale
    for w in (w1, w2):
        nt.links.new(tc.outputs['Object'], w.inputs['Vector'])
    mul = nt.nodes.new('ShaderNodeMath')
    mul.operation = 'MULTIPLY'
    nt.links.new(w1.outputs['Fac'], mul.inputs[0])
    nt.links.new(w2.outputs['Fac'], mul.inputs[1])
    _bump(nt, p, mul.outputs[0], weave, 0.01)
    return m


def plastic(name, color, rough=0.3):
    m = bpy.data.materials.new(name)
    _, p = _bsdf(m)
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Coat Weight'].default_value = 0.3
    return m


def srgb(h):
    """#rrggbb to linear RGB"""
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


# ----------------------------------------------------------------------------------------------- geometry helpers


def assign(o, *mats):
    o.data.materials.clear()
    for m in mats:
        o.data.materials.append(m)
    return o


def smooth(o, levels=2):
    for poly in o.data.polygons:
        poly.use_smooth = True
    mod = o.modifiers.new('sub', 'SUBSURF')
    mod.levels = levels
    mod.render_levels = levels
    return o


def metaball(name, balls, resolution=0.04, threshold=0.6):
    """balls: list of (type, location, radius, size xyz, rotation) -> mesh object"""
    mb = bpy.data.metaballs.new(name)
    mb.resolution = resolution
    mb.render_resolution = resolution
    mb.threshold = threshold
    o = bpy.data.objects.new(name, mb)
    bpy.context.collection.objects.link(o)
    for kind, loc, r, size, rot in balls:
        e = mb.elements.new(type=kind)
        e.co = loc
        e.radius = r
        if kind in ('ELLIPSOID', 'CAPSULE', 'CUBE'):
            e.size_x, e.size_y, e.size_z = size
        e.rotation = Euler(rot).to_quaternion()
    bpy.context.view_layer.update()
    deps = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(deps))
    bpy.data.objects.remove(o)
    out = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(out)
    for poly in me.polygons:
        poly.use_smooth = True
    return out


def mesh_from_grid(name, nu, nv, fn, closed_u=False):
    """grid surface: fn(u, v) -> (x, y, z), u, v in [0, 1]"""
    bm = bmesh.new()
    rows = []
    for j in range(nv + 1):
        row = []
        for i in range(nu + (0 if closed_u else 1)):
            row.append(bm.verts.new(fn(i / nu, j / nv)))
        rows.append(row)
    cols = nu if closed_u else nu
    for j in range(nv):
        for i in range(cols):
            a, b = rows[j][i], rows[j][(i + 1) % len(rows[j])]
            c, d = rows[j + 1][(i + 1) % len(rows[j])], rows[j + 1][i]
            bm.faces.new((a, b, c, d))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    return o


def curve(name, pts, radius=0.05, profile=None, closed=False, twist=None, resolution=12):
    """poly/NURBS curve through points; `profile` is a bevel object (flat strips)"""
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.resolution_u = resolution
    cu.twist_mode = 'MINIMUM'
    sp = cu.splines.new('NURBS')
    sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        sp.points[i].co = (*p, 1)
        if twist:
            sp.points[i].tilt = twist[i]
    sp.use_endpoint_u = not closed
    sp.use_cyclic_u = closed
    sp.order_u = 4
    if profile is not None:
        cu.bevel_mode = 'OBJECT'
        cu.bevel_object = profile
        cu.use_fill_caps = True
    else:
        cu.bevel_depth = radius
        cu.bevel_resolution = 6
        cu.use_fill_caps = True
    o = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(o)
    return o


def rect_profile(name, w, h, r=0.3):
    """rounded rectangle cross-section (width w, height h) for flat strips"""
    pts = []
    rr = min(w, h) * r
    for cx, cy, a0 in ((w / 2 - rr, h / 2 - rr, 0), (-w / 2 + rr, h / 2 - rr, 90), (-w / 2 + rr, -h / 2 + rr, 180), (w / 2 - rr, -h / 2 + rr, 270)):
        for k in range(4):
            a = math.radians(a0 + k * 30)
            pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a), 0))
    cu = bpy.data.curves.new(name, 'CURVE')
    sp = cu.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        sp.points[i].co = (*p, 1)
    sp.use_cyclic_u = True
    o = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(o)
    o.hide_render = True
    return o


def cylinder(name, r, depth, loc, rot=(0, 0, 0), verts=48, r2=None):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2 if r2 is not None else r, depth=depth, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    bev = o.modifiers.new('bev', 'BEVEL')
    bev.width = min(r, depth) * 0.18
    bev.segments = 4
    for poly in o.data.polygons:
        poly.use_smooth = True
    o.data.shade_auto_smooth() if hasattr(o.data, 'shade_auto_smooth') else None
    return o


def group(name, objs, loc=(0, 0, 0), rot=(0, 0, 0), scale=1.0):
    e = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(e)
    for o in objs:
        o.parent = e
    e.location = loc
    e.rotation_euler = rot
    e.scale = (scale, scale, scale)
    return e


def fit(roots, size=2.3, floor=-1.0):
    """scales the whole emblem so its largest side is `size`, centred, resting on the floor"""
    bpy.context.view_layer.update()
    lo = Vector((1e9, 1e9, 1e9))
    hi = Vector((-1e9, -1e9, -1e9))
    deps = bpy.context.evaluated_depsgraph_get()
    for o in bpy.context.scene.objects:
        if o.type not in ('MESH', 'CURVE') or o.name == 'shadow' or o.hide_render:
            continue
        ev = o.evaluated_get(deps)
        try:
            me = ev.to_mesh()
        except RuntimeError:
            continue
        for v in me.vertices:
            w = ev.matrix_world @ v.co
            lo = Vector(map(min, lo, w))
            hi = Vector(map(max, hi, w))
        ev.to_mesh_clear()
    top = group('emblem', roots)
    dim = max(hi - lo)
    k = size / dim
    c = (lo + hi) / 2
    top.scale = (k, k, k)
    top.location = (-c.x * k, -c.y * k, floor - lo.z * k)
    return top


# ----------------------------------------------------------------------------------------------- emblems

RED = srgb('#B30C25')
RED_DEEP = srgb('#8E0C1F')
BLACK = srgb('#16181C')
GRAPHITE = srgb('#2A2E35')
WHITE = srgb('#F2F2EF')
GOLD = srgb('#A8741A')


def deformed_sphere(name, fn, segments=64, rings=32):
    """UV sphere of radius 1 whose vertices go through fn(Vector) -> Vector"""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, radius=1)
    o = bpy.context.active_object
    o.name = name
    for v in o.data.vertices:
        v.co = fn(Vector(v.co))
    for poly in o.data.polygons:
        poly.use_smooth = True
    return o


def boxing_glove(m_red, m_black, m_white, mirror=1):
    s = mirror

    def fist(p):
        # an elongated padded mitten, its striking face curled forward (towards -y) at the top
        x, y, z = p.x * 0.52, p.y * 0.58, p.z * 0.86
        top = max(0.0, z)
        y -= 0.42 * top * top
        y += 0.06 * (1 - abs(p.z))  # fuller palm
        return Vector((x, y, z + 0.78))

    body = deformed_sphere('poing', fist)
    assign(body, m_red)
    smooth(body, 1)

    def thumb(p):
        x, y, z = p.x * 0.17, p.y * 0.19, p.z * 0.44
        m = Matrix.Rotation(math.radians(-14 * s), 3, 'Y') @ Matrix.Rotation(math.radians(18), 3, 'X')
        q = m @ Vector((x, y, z))
        return q + Vector((0.43 * s, -0.12, 0.62))

    th = deformed_sphere('pouce', thumb, 32, 16)
    assign(th, m_red)
    smooth(th, 1)
    cuff = cylinder('manchette', 0.4, 0.78, (0, 0.02, -0.2), verts=64, r2=0.43)
    assign(cuff, m_black)
    band = cylinder('bande', 0.445, 0.17, (0, 0.02, -0.08), verts=64)
    assign(band, m_white)
    band2 = cylinder('liseré', 0.425, 0.06, (0, 0.02, -0.5), verts=64)
    assign(band2, m_white)
    return [body, th, cuff, band, band2]


def build_boxe():
    m_red = leather('cuir rouge', RED)
    m_black = leather('cuir noir', BLACK, rough=0.42)
    m_white = leather('cuir blanc', WHITE, rough=0.4)
    left = group('gauche', boxing_glove(m_red, m_black, m_white, 1), loc=(-0.5, 0.4, 0), rot=(math.radians(4), math.radians(-18), math.radians(35)))
    right = group('droite', boxing_glove(m_red, m_black, m_white, -1), loc=(0.55, -0.3, -0.05), rot=(math.radians(-4), math.radians(20), math.radians(-30)))
    return [left, right]


def shin_guard(m_black, m_red, m_strap, mirror=1):
    span = math.radians(170)

    def shell(u, v, r0=0.52, r1=0.36):
        a = (u - 0.5) * span
        # anatomical shell: wide under the knee, narrower at the ankle, a ridge down the shin
        r = r1 + (r0 - r1) * (v ** 0.7) + 0.06 * max(0.0, v - 0.88) / 0.12
        h = 2.1 * v
        ridge = 0.07 * math.exp(-(a / 0.35) ** 2) * math.sin(math.pi * min(1.0, v * 1.1))
        return (r * math.sin(a), -(r + ridge) * math.cos(a), h)

    body = mesh_from_grid('tibia', 36, 30, shell)
    assign(body, m_black, m_red)
    # red central panel on the front, black sides
    for poly in body.data.polygons:
        c = poly.center
        a = math.atan2(c.x, -c.y)
        poly.material_index = 1 if abs(a) < span * 0.16 and 0.22 < c.z < 1.85 else 0
    sol = body.modifiers.new('ep', 'SOLIDIFY')
    sol.thickness = 0.1
    sol.offset = -1
    sol.material_offset_rim = 0
    bev = body.modifiers.new('bev', 'BEVEL')
    bev.width = 0.03
    bev.segments = 3
    smooth(body, 2)

    def instep(u, v):
        a = (u - 0.5) * math.radians(150)
        r = 0.36 + 0.05 * v
        x = r * math.sin(a)
        y = -r * math.cos(a) - 0.75 * v
        z = -0.05 - 0.45 * v
        return (x, y, z)

    foot = mesh_from_grid('cou-de-pied', 20, 10, instep)
    assign(foot, m_black, m_red)
    for poly in foot.data.polygons:
        poly.material_index = 1 if abs(poly.center.x) < 0.1 else 0
    sol = foot.modifiers.new('ep', 'SOLIDIFY')
    sol.thickness = 0.09
    sol.offset = -1
    smooth(foot, 2)
    # straps at the back
    straps = []
    for z in (0.5, 1.55):
        pts = [(0.5 * math.sin(a), -0.5 * math.cos(a) + 0.02, z) for a in [math.radians(x) for x in range(80, 281, 20)]]
        st = curve('sangle', pts, profile=rect_profile('p', 0.03, 0.16))
        st.data.materials.append(m_strap)
        straps.append(st)
    if mirror < 0:
        for o in [body, foot, *straps]:
            o.scale.x = -1
    return [body, foot, *straps]


def build_kickboxing():
    m_black = leather('synthétique noir', GRAPHITE, rough=0.4, grain=0.12)
    m_red = leather('panneau rouge', RED, rough=0.35, grain=0.1)
    m_strap = fabric('velcro', BLACK, rough=0.9, weave=0.5, scale=160)
    a = group('g', shin_guard(m_black, m_red, m_strap, 1), loc=(-0.6, 0.3, 0), rot=(0, 0, math.radians(18)))
    b = group('d', shin_guard(m_black, m_red, m_strap, -1), loc=(0.62, -0.1, -0.02), rot=(0, 0, math.radians(-14)))
    return [a, b]


def build_mma():
    m_black = leather('cuir noir', BLACK, rough=0.38)
    m_red = leather('rouge', RED, rough=0.38)
    m_lining = leather('doublure', GRAPHITE, rough=0.62, grain=0.05)

    def pad(p):
        # thin knuckle pad over the back of the hand, curled over the fingers at the top (fist closed)
        x, y, z = p.x * 0.5, p.y * 0.2, p.z * 0.62
        top = max(0.0, z)
        y -= 0.9 * top * top + 0.05
        y += 0.12 * (x / 0.5) ** 2  # rounded across the knuckles
        return Vector((x, y, z + 0.62))

    back = deformed_sphere('rembourrage', pad)
    assign(back, m_black)
    smooth(back, 1)

    def fingers(p):
        # the fingers, folded in a fist, seen through the open glove (dark lining)
        x, y, z = p.x * 0.46, p.y * 0.2, p.z * 0.17
        return Vector((x, y - 0.42, z + 0.88))

    fist = deformed_sphere('doigts', fingers, 48, 24)
    assign(fist, m_lining)
    smooth(fist, 1)
    loops = []
    # four finger loops at the bottom edge of the pad: the open fingers of an MMA glove
    for x in (-0.31, -0.105, 0.105, 0.31):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.085, minor_radius=0.03, location=(x, -0.5, 0.74), rotation=(0, math.radians(90), 0), major_segments=32, minor_segments=12)
        t = bpy.context.active_object
        for poly in t.data.polygons:
            poly.use_smooth = True
        assign(t, m_black)
        loops.append(t)
    cuff = cylinder('poignet', 0.36, 0.56, (0, -0.02, -0.02), verts=64, r2=0.33)
    assign(cuff, m_black)
    strap = cylinder('sangle', 0.375, 0.26, (0, -0.02, 0.0), verts=64)
    assign(strap, m_red)
    tab = cylinder('patte', 0.1, 0.06, (0.36, -0.04, 0.0), rot=(0, math.radians(90), 0), verts=24)
    assign(tab, m_red)
    accent = curve('liseré', [(-0.5, -0.02, 0.55), (-0.25, -0.16, 0.66), (0, -0.2, 0.68), (0.25, -0.16, 0.66), (0.5, -0.02, 0.55)], radius=0.03)
    accent.data.materials.append(m_red)
    return [group('gant', [back, fist, *loops, cuff, strap, tab, accent], rot=(math.radians(-6), 0, math.radians(-28)))]


def braid(name, path, n_strands=3, rope_r=0.085, strand_r=0.052, turns=40, samples=360, closed=True):
    """three strands twisted along a path(t) -> (point, tangent); returns curve objects"""
    out = []
    for s in range(n_strands):
        pts = []
        for k in range(samples + (0 if closed else 1)):
            t = k / samples
            p, tan = path(t)
            tan = tan.normalized()
            up = Vector((0, 0, 1)) if abs(tan.z) < 0.9 else Vector((1, 0, 0))
            nrm = tan.cross(up).normalized()
            bin_ = tan.cross(nrm).normalized()
            a = 2 * math.pi * (turns * t + s / n_strands)
            q = p + (nrm * math.cos(a) + bin_ * math.sin(a)) * rope_r * 0.62
            pts.append(tuple(q))
        out.append(curve(f'{name}{s}', pts, radius=strand_r, closed=closed, resolution=3))
    return out


def build_muaythai():
    m_gold = fabric('fil doré', GOLD, rough=0.38, weave=0.25, scale=220, sheen=0.3, metallic=0.7)
    m_red = fabric('tissu rouge', RED, rough=0.65, weave=0.3, scale=200)
    m_dark = fabric('âme', srgb('#5A3B17'), rough=0.6)
    R = 1.0

    def ring(t):
        a = 2 * math.pi * t
        return Vector((R * math.cos(a), R * math.sin(a), 0)), Vector((-math.sin(a), math.cos(a), 0))

    strands = braid('anneau', ring, turns=40, rope_r=0.13, strand_r=0.075)
    for o in strands:
        o.data.materials.append(m_gold)
    core = curve('âme', [tuple(ring(k / 64)[0]) for k in range(64)], radius=0.1, closed=True, resolution=4)
    core.data.materials.append(m_dark)
    wraps = []
    for a in (25, 70, 115, 160, 205, 250):
        r = math.radians(a)
        o = cylinder('ruban', 0.165, 0.14, (R * math.cos(r), R * math.sin(r), 0), rot=(math.radians(90), 0, r), verts=32)
        assign(o, m_red)
        wraps.append(o)
    # the two tails leave from the back of the ring, braided as well, with a red tassel at the end
    tails = []
    for side in (-1, 1):
        x0 = 0.1 * side
        ctrl = [Vector((x0, -R, 0)), Vector((0.16 * side, -R - 0.25, -0.2)), Vector((0.22 * side, -R - 0.36, -0.5)), Vector((0.26 * side, -R - 0.38, -0.82))]

        def tail(t, ctrl=ctrl):
            # cubic Bézier
            p = ctrl[0] * (1 - t) ** 3 + ctrl[1] * 3 * (1 - t) ** 2 * t + ctrl[2] * 3 * (1 - t) * t ** 2 + ctrl[3] * t ** 3
            d = (ctrl[1] - ctrl[0]) * 3 * (1 - t) ** 2 + (ctrl[2] - ctrl[1]) * 6 * (1 - t) * t + (ctrl[3] - ctrl[2]) * 3 * t ** 2
            return p, d

        for o in braid('queue', tail, turns=14, samples=140, closed=False, rope_r=0.1, strand_r=0.06):
            o.data.materials.append(m_gold)
            tails.append(o)
        tip = ctrl[3]
        cone = cylinder('pompon', 0.09, 0.22, tuple(tip + Vector((0, 0, -0.1))), verts=24, r2=0.04)
        assign(cone, m_red)
        knot = cylinder('nœud', 0.1, 0.1, tuple(ctrl[0] + Vector((0, -0.04, 0))), rot=(math.radians(90), 0, 0), verts=24)
        assign(knot, m_red)
        tails += [cone, knot]
    return [group('mongkhon', [*strands, core, *wraps, *tails], rot=(math.radians(14), 0, 0))]


def belt_strip(name, pts, mat, w=0.36, h=0.055, twist=None):
    o = curve(name, pts, profile=rect_profile(name + '-p', w, h), twist=twist, resolution=16)
    o.data.materials.append(mat)
    return o


def stitched(name, color):
    """belt fabric: dense stitch lines along the length"""
    m = bpy.data.materials.new(name)
    nt, p = _bsdf(m)
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = 0.68
    p.inputs['Sheen Weight'].default_value = 0.15
    tc = nt.nodes.new('ShaderNodeTexCoord')
    w = nt.nodes.new('ShaderNodeTexWave')
    w.wave_type = 'BANDS'
    w.bands_direction = 'Z'
    w.inputs['Scale'].default_value = 26
    w.inputs['Distortion'].default_value = 0.4
    nt.links.new(tc.outputs['Object'], w.inputs['Vector'])
    n = nt.nodes.new('ShaderNodeTexNoise')
    n.inputs['Scale'].default_value = 300
    add = nt.nodes.new('ShaderNodeMath')
    add.operation = 'ADD'
    nt.links.new(w.outputs['Fac'], add.inputs[0])
    nt.links.new(n.outputs['Fac'], add.inputs[1])
    _bump(nt, p, add.outputs[0], 0.3, 0.01)
    return m


def ribbon(name, pts, normals, width, thickness, mats, mat_of=None, smooth_levels=1):
    """flat band through `pts`, its face turned towards `normals`; mat_of(i, n) gives the material of segment i"""
    pts = [Vector(p) for p in pts]
    n = len(pts)
    bm = bmesh.new()
    rows = []
    for i, p in enumerate(pts):
        t = (pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]).normalized()
        nr = Vector(normals[i]).normalized()
        side = t.cross(nr).normalized() * (width / 2)
        off = nr * (thickness / 2)
        rows.append([bm.verts.new(p - side + off), bm.verts.new(p + side + off), bm.verts.new(p + side - off), bm.verts.new(p - side - off)])
    for i in range(n - 1):
        for k in range(4):
            a, b = rows[i][k], rows[i][(k + 1) % 4]
            c, d = rows[i + 1][(k + 1) % 4], rows[i + 1][k]
            f = bm.faces.new((a, b, c, d))
            f.material_index = mat_of(i, n - 1) if mat_of else 0
    for r, rev in ((rows[0], True), (rows[-1], False)):
        f = bm.faces.new(list(reversed(r)) if rev else r)
        f.material_index = mat_of(0 if rev else n - 2, n - 1) if mat_of else 0
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    for m in mats:
        me.materials.append(m)
    bev = o.modifiers.new('bev', 'BEVEL')
    bev.width = thickness * 0.35
    bev.segments = 2
    smooth(o, smooth_levels)
    return o


def bezier(ctrl, k=24):
    c = [Vector(x) for x in ctrl]
    out = []
    for i in range(k + 1):
        t = i / k
        out.append(c[0] * (1 - t) ** 3 + c[1] * 3 * (1 - t) ** 2 * t + c[2] * 3 * (1 - t) * t ** 2 + c[3] * t ** 3)
    return out


def tied_belt(m_belt, m_bar=None, waist=(1.0, 0.55), z=0.0, tail_len=1.25, width=0.34, thick=0.05):
    """a belt tied around an invisible waist: the loop, the square knot on the front, two hanging tails"""
    rx, ry = waist
    angles = [math.radians(x) for x in range(-78, 259, 4)]
    loop_pts = [(rx * math.cos(a), ry * math.sin(a), z) for a in angles]
    loop_n = [(math.cos(a) / rx, math.sin(a) / ry, 0) for a in angles]
    parts = [ribbon('tour de taille', loop_pts, loop_n, width, thick, [m_belt])]
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -ry - 0.05, z))
    k = bpy.context.active_object
    k.name = 'nœud'
    k.scale = (width * 0.95, 0.16, width * 1.05)
    bev = k.modifiers.new('bev', 'BEVEL')
    bev.width = 0.05
    bev.segments = 4
    smooth(k, 2)
    assign(k, m_belt)
    parts.append(k)
    # the wrap over the knot, diagonal
    wrap = bezier([(-width * 0.6, -ry - 0.12, z + width * 0.55), (-width * 0.2, -ry - 0.17, z + width * 0.2), (width * 0.2, -ry - 0.17, z - width * 0.2), (width * 0.6, -ry - 0.12, z - width * 0.55)], 12)
    parts.append(ribbon('tour du nœud', wrap, [(0, -1, 0)] * len(wrap), width * 0.62, thick, [m_belt]))
    for side in (-1, 1):
        x = 0.06 * side
        tail = bezier([(x, -ry - 0.14, z - 0.08), (x + 0.1 * side, -ry - 0.24, z - tail_len * 0.35), (x + 0.22 * side, -ry - 0.24, z - tail_len * 0.7), (x + 0.32 * side, -ry - 0.18, z - tail_len)], 28)
        nrm = [(math.sin(math.radians(14 * side * i / 28)), -1, 0) for i in range(29)]
        if m_bar is not None and side == -1:
            # BJJ black belt: the red rank bar near the end of a tail (black tip after it)
            parts.append(ribbon('queue', tail, nrm, width, thick, [m_belt, m_bar], lambda i, n: 1 if 0.52 < i / n < 0.86 else 0))
        else:
            parts.append(ribbon('queue', tail, nrm, width, thick, [m_belt]))
    return parts


def build_bjj():
    m_belt = stitched('ceinture noire', BLACK)
    m_bar = stitched('barrette rouge', RED)
    return [group('ceinture', tied_belt(m_belt, m_bar), rot=(math.radians(-8), 0, 0))]


def build_judo():
    """a folded white judogi standing up, its crossed collar on the front, a black belt tied around it"""
    m_gi = fabric('toile de judogi', WHITE, rough=0.86, weave=0.6, scale=110, sheen=0.25)
    m_col = fabric('col', srgb('#D8D4C8'), rough=0.8, weave=1.4, scale=36, sheen=0.2)
    m_belt = stitched('ceinture noire', srgb('#0E0F12'))
    W, Hh, T = 0.86, 0.72, 0.22
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
    body = bpy.context.active_object
    body.name = 'veste pliée'
    body.scale = (2 * W, 2 * T, 2 * Hh)
    bpy.ops.object.transform_apply(scale=True)
    bev = body.modifiers.new('bev', 'BEVEL')
    bev.width = 0.12
    bev.segments = 6
    smooth(body, 2)
    assign(body, m_gi)
    parts = [body]
    # a second fold seen at the bottom edge: a thinner layer slightly wider
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.02, -Hh + 0.07))
    fold = bpy.context.active_object
    fold.name = 'pli'
    fold.scale = (2 * W + 0.06, 2 * T + 0.05, 0.16)
    bpy.ops.object.transform_apply(scale=True)
    bev = fold.modifiers.new('bev', 'BEVEL')
    bev.width = 0.07
    bev.segments = 5
    smooth(fold, 2)
    assign(fold, m_gi)
    parts.append(fold)
    # the collar: two thick bands from over the top edge down to a cross below the middle, left over right
    for side, off in ((1, 0.05), (-1, 0.11)):
        pts = [Vector((-0.36 * side, 0.02, Hh + 0.02)), Vector((-0.36 * side, -T, Hh - 0.04))]
        pts += [q + Vector((0, -T - off, 0)) for q in bezier([(-0.36 * side, 0, Hh - 0.12), (-0.3 * side, 0, Hh - 0.6), (0.1 * side, 0, -0.08), (0.42 * side, 0, -0.42)], 24)]
        nrm = [(0, 0, 1), (0, -1, 1)] + [(0, -1, 0)] * (len(pts) - 2)
        parts.append(ribbon('revers', pts, nrm, 0.3, 0.085, [m_col]))
    # the belt: around the jacket at the lower third, knot on the front
    z = -0.3
    angles = [math.radians(-89.5 + 1.5 * i) for i in range(240)]

    def sq(a, rx, ry, p=4.0):
        c, s_ = math.cos(a), math.sin(a)
        return (rx * math.copysign(abs(c) ** (2 / p), c), ry * math.copysign(abs(s_) ** (2 / p), s_))
    # the belt passes over the collar, so it stands a little further out than the jacket
    rx, ry = W + 0.05, T + 0.17
    loop = [(*sq(a, rx, ry), z) for a in angles]
    nl = [(math.cos(a) * ry, math.sin(a) * rx, 0) for a in angles]
    parts.append(ribbon('tour de taille', loop, nl, 0.2, 0.05, [m_belt]))
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -ry - 0.06, z))
    k = bpy.context.active_object
    k.name = 'nœud'
    k.scale = (0.2, 0.14, 0.22)
    bev = k.modifiers.new('bev', 'BEVEL')
    bev.width = 0.045
    bev.segments = 4
    smooth(k, 2)
    assign(k, m_belt)
    parts.append(k)
    wrap = bezier([(-0.13, -ry - 0.12, z + 0.11), (-0.04, -ry - 0.16, z + 0.04), (0.04, -ry - 0.16, z - 0.04), (0.13, -ry - 0.12, z - 0.11)], 12)
    parts.append(ribbon('tour du nœud', wrap, [(0, -1, 0)] * len(wrap), 0.13, 0.05, [m_belt]))
    for side in (-1, 1):
        x = 0.05 * side
        tail = bezier([(x, -ry - 0.13, z - 0.06), (x + 0.08 * side, -ry - 0.2, z - 0.2), (x + 0.16 * side, -ry - 0.22, z - 0.4), (x + 0.24 * side, -ry - 0.2, z - 0.56)], 24)
        parts.append(ribbon('queue', tail, [(0, -1, 0)] * len(tail), 0.2, 0.05, [m_belt]))
    return [group('judogi', parts, rot=(math.radians(-12), 0, math.radians(-14)))]


BUILD = {'boxe': build_boxe, 'kickboxing': build_kickboxing, 'mma': build_mma, 'muaythai': build_muaythai, 'bjj': build_bjj, 'judo': build_judo}


def main():
    argv = sys.argv[1:]
    out = Path(argv[0])
    size = int(argv[argv.index('--size') + 1]) if '--size' in argv else 512
    samples = int(argv[argv.index('--samples') + 1]) if '--samples' in argv else 64
    ids = [a for a in argv[1:] if a in IDS] or IDS
    out.mkdir(parents=True, exist_ok=True)
    for d in ids:
        sc = reset()
        studio(sc, size, samples)
        fit(BUILD[d]())
        sc.render.filepath = str(out / f'{d}.png')
        bpy.ops.render.render(write_still=True)
        print('rendered', d, sc.render.filepath, flush=True)


if __name__ == '__main__':
    main()
