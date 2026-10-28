"""v0.46 Encyclopédie: Blender scenes for the equipment, venue and culture illustrations (images.ts SCENES).

Equipment comes from the coach Kadir's own outfits (public/coaches/mma-kadir/tenues/*.glb), shown without the body in
their bind pose; the ring, cage, tatami area and belts are modelled here. Cycles render on a transparent background
with a shadow catcher, so the picture sits on the app's surface colour in light and dark themes.

Usage: python3 scripts/encyclopedie/scenes.py <out png dir> [scene ...]   (npm run visuels -- --only scenes runs it, then lays the pictures in their ambiance)
"""
import math
import sys
from pathlib import Path

import bpy  # noqa: I001 (bpy first: it makes bmesh importable)
import bmesh
from mathutils import Matrix, Quaternion, Vector

ROOT = Path(__file__).resolve().parents[2]
TENUES = ROOT / 'public/coaches/mma-kadir/tenues'
import os
QUICK = os.environ.get('QUICK') == '1'
W, H = (720, 400) if QUICK else (1440, 800)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = 24 if QUICK else 96
    sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = W, H
    sc.render.film_transparent = True
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.look = 'Medium Contrast'
    world = bpy.data.worlds.new('w')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs[0].default_value = (0.55, 0.56, 0.6, 1)
    world.node_tree.nodes['Background'].inputs[1].default_value = 0.35
    sc.world = world


def mat(name, rgb, rough=0.6, metal=0.0, sheen=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if sheen:
        b.inputs['Sheen Weight'].default_value = sheen
    return m


def hexrgb(h):
    h = h.lstrip('#')
    return tuple((int(h[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4))


def add(obj, m=None):
    bpy.context.collection.objects.link(obj) if obj.name not in bpy.context.collection.objects else None
    if m:
        obj.data.materials.clear()
        obj.data.materials.append(m)
    return obj


def box(name, size, loc, m, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        mod = o.modifiers.new('b', 'BEVEL')
        mod.width = bevel
        mod.segments = 3
    o.data.materials.append(m)
    return o


def cyl(name, r, depth, loc, m, rot=(0, 0, 0), verts=24):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, rotation=rot, vertices=verts)
    o = bpy.context.object
    o.name = name
    o.data.materials.append(m)
    bpy.ops.object.shade_smooth()
    return o


def rope(name, a, b, r, m):
    a, b = Vector(a), Vector(b)
    d = b - a
    o = cyl(name, r, d.length, (a + b) / 2, m, verts=16)
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = d.to_track_quat('Z', 'Y')
    return o


def ground(z=0.0, size=40):
    bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, z))
    g = bpy.context.object
    g.is_shadow_catcher = True
    return g


def lights(target, scale=1.0):
    t = Vector(target)
    for loc, energy, size in (((-2.2, -3.0, 3.2), 900, 2.5), ((2.8, -1.6, 2.0), 380, 2.0), ((0.5, 3.0, 3.0), 600, 2.5)):
        bpy.ops.object.light_add(type='AREA', location=t + Vector(loc) * scale)
        lt = bpy.context.object
        lt.data.energy = energy * scale * scale * 0.18
        lt.data.size = size * scale
        lt.rotation_mode = 'QUATERNION'
        lt.rotation_quaternion = (t - lt.location).to_track_quat('-Z', 'Y')


def frame(objs, azimuth=18, elevation=14, lens=60, margin=1.12, shift_z=0.0):
    """perspective camera looking at the objects' bounds from the front (-Y), fitted so the whole bounds show"""
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    lo = Vector([min(p[i] for p in pts) for i in range(3)])
    hi = Vector([max(p[i] for p in pts) for i in range(3)])
    c = (lo + hi) / 2 + Vector((0, 0, shift_z))
    cam = bpy.data.cameras.new('cam')
    cam.lens = lens
    cam.sensor_fit = 'HORIZONTAL'
    o = bpy.data.objects.new('cam', cam)
    bpy.context.collection.objects.link(o)
    az, el = math.radians(azimuth), math.radians(elevation)
    direction = Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = (-direction).to_track_quat('-Z', 'Y')
    bpy.context.scene.camera = o
    # fit: walk the camera back until every corner projects inside the frame
    from bpy_extras.object_utils import world_to_camera_view
    sc = bpy.context.scene
    dist = (hi - lo).length
    for _ in range(60):
        o.location = c + direction * dist
        bpy.context.view_layer.update()
        ok = all(0.5 - 0.5 / margin <= v.x <= 0.5 + 0.5 / margin and 0.5 - 0.5 / margin <= v.y <= 0.5 + 0.5 / margin for v in (world_to_camera_view(sc, o, p) for p in pts))
        dist *= 1.04 if not ok else 0.97
        if ok and _ > 30:
            break
    while True:
        o.location = c + direction * dist
        bpy.context.view_layer.update()
        if all(0.5 - 0.5 / margin <= v.x <= 0.5 + 0.5 / margin and 0.5 - 0.5 / margin <= v.y <= 0.5 + 0.5 / margin for v in (world_to_camera_view(sc, o, p) for p in pts)):
            break
        dist *= 1.02
    return c, lo, hi


def outfit(tenue, keep):
    """imports one outfit and keeps the named meshes, frozen in their bind pose and free from the armature"""
    bpy.ops.import_scene.gltf(filepath=str(TENUES / f'{tenue}.glb'))
    out = []
    for o in list(bpy.data.objects):
        if o.type == 'MESH' and o.name in keep:
            for m in list(o.modifiers):
                o.modifiers.remove(m)
            mw = o.matrix_world.copy()
            o.parent = None
            o.matrix_world = mw
            out.append(o)
    for o in list(bpy.data.objects):
        if o not in out:
            bpy.data.objects.remove(o, do_unlink=True)
    for o in out:
        o.rotation_mode = 'XYZ'
        bpy.context.view_layer.objects.active = o
        o.select_set(True)
        bpy.ops.object.shade_smooth()
        o.select_set(False)
    return out


def split_x(o):
    """splits a mesh holding both sides (left and right glove) into two objects"""
    other = o.copy()
    other.data = o.data.copy()
    bpy.context.collection.objects.link(other)
    for ob, keep_pos in ((o, True), (other, False)):
        bm = bmesh.new()
        bm.from_mesh(ob.data)
        world = ob.matrix_world
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if ((world @ v.co).x > 0) != keep_pos], context='VERTS')
        bm.to_mesh(ob.data)
        bm.free()
        origin_to_geometry(ob)
    return o, other


def origin_to_geometry(o):
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    o.select_set(False)


def long_axis(o):
    """unit vector along the longest extent of a mesh (power iteration on the covariance), in world space"""
    pts = [o.matrix_world @ v.co for v in o.data.vertices]
    c = sum(pts, Vector()) / len(pts)
    cov = [[sum((p[i] - c[i]) * (p[j] - c[j]) for p in pts) for j in range(3)] for i in range(3)]
    v = Vector((0.3, 0.2, 1.0))
    for _ in range(50):
        v = Vector([sum(cov[i][j] * v[j] for j in range(3)) for i in range(3)]).normalized()
    return v


def pair(a, b, gap, tilt=12, upright=False):
    """puts two side pieces (gloves) next to each other, slightly turned in, resting on the ground; upright = standing
    on the cuff, as gloves are shown in a shop (in the bind pose the cuff is the upper end, towards the elbow)"""
    for o, s in ((a, 1), (b, -1)):
        origin_to_geometry(o)
        bpy.context.view_layer.update()
        q = Quaternion()
        if upright:
            ax = long_axis(o)
            if ax.z < 0:
                ax = -ax
            q = ax.rotation_difference(Vector((0, 0, -1)))
        q = Quaternion((0, 0, 1), math.radians(-s * tilt)) @ q
        o.rotation_mode = 'QUATERNION'
        o.rotation_quaternion = q @ o.rotation_quaternion
        o.location = (s * gap / 2, 0, 0)
    bpy.context.view_layer.update()
    for o in (a, b):
        zmin = min((o.matrix_world @ Vector(c)).z for c in o.bound_box)
        o.location.z -= zmin


def rest_on_ground(objs):
    bpy.context.view_layer.update()
    zmin = min((o.matrix_world @ Vector(c)).z for o in objs for c in o.bound_box)
    xs = [(o.matrix_world @ Vector(c)).x for o in objs for c in o.bound_box]
    ys = [(o.matrix_world @ Vector(c)).y for o in objs for c in o.bound_box]
    dx, dy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    for o in objs:
        o.location.x -= dx
        o.location.y -= dy
        o.location.z -= zmin


# --- scenes -----------------------------------------------------------------------------------------------------


def s_gants_boxe():
    gl = outfit('boxe', {'gant-Left', 'gant-Right'})
    pair(gl[0], gl[1], 0.3, upright=True)
    ground()
    c, lo, hi = frame(gl, azimuth=10, elevation=14, margin=1.3)
    lights(c, 0.5)


def s_protege_tibias():
    objs = outfit('kickboxing', {'protege-tibias'})
    rest_on_ground(objs)
    ground()
    c, *_ = frame(objs, azimuth=25, elevation=8, margin=1.15)
    lights(c, 0.6)


def _garment(tenue, keep, az=16, el=6, margin=1.12):
    objs = outfit(tenue, keep)
    rest_on_ground(objs)
    for o in objs:
        o.location.z += 0.02
    c, *_ = frame(objs, azimuth=az, elevation=el, margin=margin)
    lights(c, 0.8)


def s_rashguard():
    _garment('bjj-nogi', {'haut-rash-long', 'short-compression'})


def s_short_combat():
    _garment('mma', {'short-mma'}, margin=1.25)


def s_short_muaythai():
    _garment('muaythai', {'short-thai'}, margin=1.25)


GI = {'veste-{}', 'jupe-veste', 'pantalon-{}', 'revers-Left', 'revers-Right', 'ceinture', 'noeud', 'noeud-croise', 'pan--1', 'pan-1'}


def s_judogi():
    _garment('judo', {x.format('judo') for x in GI})


def s_kimono_jjb():
    _garment('bjj', {x.format('bjj') for x in GI})


def s_ring():
    side, h = 6.0, 1.0
    canvas = mat('canvas', hexrgb('#C9CED6'), 0.85)
    apron = mat('apron', hexrgb('#1F2937'), 0.7)
    white = mat('rope', hexrgb('#F4F4F5'), 0.45)
    red, blue = mat('red', hexrgb('#B3122A'), 0.5), mat('blue', hexrgb('#1E40AF'), 0.5)
    steel = mat('steel', (0.6, 0.6, 0.62), 0.3, 1.0)
    box('plateau', (side + 0.8, side + 0.8, h), (0, 0, h / 2), apron)
    box('toile', (side + 0.7, side + 0.7, 0.04), (0, 0, h + 0.02), canvas, 0.01)
    corners = [(-1, -1, red), (1, 1, blue), (1, -1, white), (-1, 1, white)]
    for sx, sy, m in corners:
        x, y = sx * side / 2, sy * side / 2
        cyl('poteau', 0.06, 1.6, (x * 1.04, y * 1.04, h + 0.8), steel)
        box('coussin', (0.22, 0.22, 1.25), (x, y, h + 0.85), m, 0.04)
    for k, z in enumerate((0.45, 0.8, 1.15, 1.5)):
        for (ax, ay), (bx, by) in (((-1, -1), (1, -1)), ((1, -1), (1, 1)), ((1, 1), (-1, 1)), ((-1, 1), (-1, -1))):
            rope('corde', (ax * side / 2, ay * side / 2, h + z), (bx * side / 2, by * side / 2, h + z), 0.035, white)
    # steps to the red corner
    for i in range(3):
        box('marche', (0.9, 0.35, 0.33 * (i + 1)), (-side / 2 - 0.4 - 0.35 * (2 - i) - 0.2, -side / 2 + 0.8, 0.165 * (i + 1)), apron, 0.01)
    ground(0)
    c, *_ = frame([o for o in bpy.data.objects if o.type == 'MESH' and not o.is_shadow_catcher], azimuth=32, elevation=24, lens=40, margin=1.06)
    lights(c, 3.0)


def s_cage():
    n, r, h = 8, 4.4, 0.9
    canvas = mat('canvas', hexrgb('#C9CED6'), 0.85)
    base = mat('base', hexrgb('#1F2937'), 0.7)
    pad = mat('pad', hexrgb('#16181D'), 0.55)
    wire = mat('wire', (0.5, 0.5, 0.52), 0.35, 1.0)
    rim = mat('rim', hexrgb('#B3122A'), 0.5)
    bpy.ops.mesh.primitive_cylinder_add(vertices=n, radius=r + 0.35, depth=h, location=(0, 0, h / 2))
    plat = bpy.context.object
    plat.rotation_euler.z = math.pi / n
    plat.data.materials.append(base)
    bpy.ops.mesh.primitive_cylinder_add(vertices=n, radius=r + 0.3, depth=0.04, location=(0, 0, h + 0.02))
    t = bpy.context.object
    t.rotation_euler.z = math.pi / n
    t.data.materials.append(canvas)
    fence_h = 1.8
    corners = [Vector((r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n), 0)) for i in range(n)]
    for i in range(n):
        a, b = corners[i], corners[(i + 1) % n]
        cyl('poteau', 0.08, fence_h + 0.1, (a.x, a.y, h + (fence_h + 0.1) / 2), pad)
        # chain-link side: a grid turned into wires
        mid, d = (a + b) / 2, b - a
        size = max(d.length, fence_h) * 1.5
        cells = int(size / 0.09)
        bpy.ops.mesh.primitive_grid_add(x_subdivisions=cells, y_subdivisions=cells, size=size, location=(mid.x, mid.y, h + fence_h / 2 + 0.05))
        g = bpy.context.object
        # square cells turned 45° in their plane: the diamonds of a chain-link fence
        bm = bmesh.new()
        bm.from_mesh(g.data)
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.radians(45), 3, 'Z'))
        bm.to_mesh(g.data)
        bm.free()
        g.rotation_euler = (math.pi / 2, 0, math.atan2(d.y, d.x))
        w = g.modifiers.new('w', 'WIREFRAME')
        w.thickness = 0.008
        g.data.materials.append(wire)
        # keep the diamond mesh inside the panel: boolean against a box of the panel
        bpy.ops.mesh.primitive_cube_add(size=1, location=(mid.x, mid.y, h + fence_h / 2 + 0.05))
        cut = bpy.context.object
        cut.scale = (d.length, 0.4, fence_h)
        cut.rotation_euler.z = math.atan2(d.y, d.x)
        bool_ = g.modifiers.new('cut', 'BOOLEAN')
        bool_.operation = 'INTERSECT'
        bool_.object = cut
        cut.hide_render = True
        rope('haut', (a.x, a.y, h + fence_h + 0.05), (b.x, b.y, h + fence_h + 0.05), 0.07, rim)
        rope('bas', (a.x, a.y, h + 0.12), (b.x, b.y, h + 0.12), 0.07, pad)
    ground(0)
    c, *_ = frame([o for o in bpy.data.objects if o.type == 'MESH' and not o.is_shadow_catcher and not o.hide_render], azimuth=20, elevation=26, lens=40, margin=1.06)
    lights(c, 3.0)


def s_tatami():
    # 1 m x 2 m mats: an 8 m x 8 m contest area inside a safety area of another colour
    inner = mat('combat', hexrgb('#3A5F9E'), 0.8)
    outer = mat('securite', hexrgb('#C9A944'), 0.8)
    gap_m = mat('joint', hexrgb('#1F2937'), 0.8)
    total, inner_half = 14, 4
    box('sous-couche', (total + 0.02, total + 0.02, 0.02), (0, 0, 0.01), gap_m)
    for i in range(total):
        for j in range(total // 2):
            x = -total / 2 + i + 0.5
            y = -total / 2 + j * 2 + 1
            m = inner if abs(x) < inner_half and abs(y) < inner_half else outer
            box('tatami', (0.985, 1.985, 0.05), (x, y, 0.045), m, 0.012)
    ground(0)
    c, *_ = frame([o for o in bpy.data.objects if o.type == 'MESH' and not o.is_shadow_catcher], azimuth=24, elevation=34, lens=40, margin=1.03)
    lights(c, 4.0)


def belt_roll(name, colour, loc, bar=None):
    """a belt rolled on itself: a spiral strip 4 cm wide, standing on its edge"""
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    sp = cu.splines.new('POLY')
    turns, r0, r1, steps = 4.5, 0.018, 0.042, 220
    sp.points.add(steps - 1)
    for k in range(steps):
        t = k / (steps - 1)
        a = t * turns * 2 * math.pi
        r = r0 + (r1 - r0) * t
        sp.points[k].co = (r * math.cos(a), 0, r * math.sin(a), 1)
    # rectangular section 40 mm x 4 mm
    prof = bpy.data.curves.new(name + '-p', 'CURVE')
    ps = prof.splines.new('POLY')
    ps.points.add(3)
    for k, (x, y) in enumerate(((-0.02, -0.002), (0.02, -0.002), (0.02, 0.002), (-0.02, 0.002))):
        ps.points[k].co = (x, y, 0, 1)
    ps.use_cyclic_u = True
    po = bpy.data.objects.new(name + '-p', prof)
    bpy.context.collection.objects.link(po)
    po.hide_render = True
    po.hide_viewport = True
    cu.bevel_mode = 'OBJECT'
    cu.bevel_object = po
    cu.twist_mode = 'Z_UP'
    o = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(mat(name, hexrgb(colour), 0.75, sheen=0.4))
    o.location = loc
    if bar:
        # the coloured bar near the end of the belt, as a band around the outer turn
        cyl(name + '-barrette', r1 + 0.003, 0.0405, (loc[0], loc[1], loc[2]), mat(name + '-b', hexrgb(bar), 0.7), rot=(0, math.radians(90), math.radians(90)), verts=48)
    return o


def s_ceintures():
    colours = [('blanche', '#F1F0EA', '#16181D'), ('bleue', '#1E40AF', '#16181D'), ('violette', '#5B2A86', '#16181D'), ('marron', '#5A3A22', '#16181D'), ('noire', '#121212', '#B3122A')]
    objs = []
    for k, (n, c, _bar) in enumerate(colours):
        objs.append(belt_roll(n, c, ((k - 2) * 0.11, 0, 0.0445)))
    ground(0)
    c, *_ = frame(objs, azimuth=0, elevation=22, lens=70, margin=1.08)
    lights(c, 0.45)


# --- 1.3.2: equipment and places modelled here (no outfit holds them) -------------------------------------------


def leather(name, colour, rough=0.42, bump=0.25, scale=180.0):
    """leather or vinyl: a fine grain in the bump, a soft sheen"""
    m = mat(name, hexrgb(colour), rough)
    nt = m.node_tree
    n = nt.nodes.new('ShaderNodeTexNoise')
    n.inputs['Scale'].default_value = scale
    n.inputs['Detail'].default_value = 4
    bp = nt.nodes.new('ShaderNodeBump')
    bp.inputs['Strength'].default_value = bump
    bp.inputs['Distance'].default_value = 0.002
    nt.links.new(n.outputs['Fac'], bp.inputs['Height'])
    nt.links.new(bp.outputs['Normal'], nt.nodes['Principled BSDF'].inputs['Normal'])
    return m


def soften(o, level=2, bevel=0.0):
    """rounded, stuffed look: bevel then subdivision surface"""
    if bevel:
        b = o.modifiers.new('b', 'BEVEL')
        b.width = bevel
        b.segments = 2
    s = o.modifiers.new('s', 'SUBSURF')
    s.levels = s.render_levels = level
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.shade_smooth()
    return o


def bend(o, angle, axis='X'):
    m = o.modifiers.new('bend', 'SIMPLE_DEFORM')
    m.deform_method = 'BEND'
    m.angle = math.radians(angle)
    m.deform_axis = axis
    return o


def curve_obj(name, pts, r, m, cyclic=False, profile=None, res=12):
    """a tube (or a strip with a profile object) along the points"""
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    sp = cu.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    for k, p in enumerate(pts):
        sp.points[k].co = (*p, 1)
    sp.use_cyclic_u = cyclic
    if profile is not None:
        cu.bevel_mode = 'OBJECT'
        cu.bevel_object = profile
    else:
        cu.bevel_depth = r
        cu.bevel_resolution = res // 3
    cu.use_fill_caps = True
    o = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(m)
    return o


def rect_profile(name, w, t):
    prof = bpy.data.curves.new(name, 'CURVE')
    ps = prof.splines.new('POLY')
    ps.points.add(3)
    for k, (x, y) in enumerate(((-w / 2, -t / 2), (w / 2, -t / 2), (w / 2, t / 2), (-w / 2, t / 2))):
        ps.points[k].co = (x, y, 0, 1)
    ps.use_cyclic_u = True
    po = bpy.data.objects.new(name, prof)
    bpy.context.collection.objects.link(po)
    po.hide_render = po.hide_viewport = True
    return po


def chain(a, b, link=0.035, m=None):
    """chain links from a to b, each turned 90° from the previous one"""
    a, b = Vector(a), Vector(b)
    d = b - a
    n = max(2, int(d.length / (link * 0.75)))
    q = d.to_track_quat('Z', 'Y')
    out = []
    for k in range(n):
        p = a + d * ((k + 0.5) / n)
        bpy.ops.mesh.primitive_torus_add(major_radius=link / 2, minor_radius=link / 9, location=p, major_segments=16, minor_segments=6)
        o = bpy.context.object
        o.scale = (0.7, 1.0, 1.0)
        o.rotation_mode = 'QUATERNION'
        o.rotation_quaternion = q @ Quaternion((0, 0, 1), math.pi / 2 * k) @ Quaternion((1, 0, 0), math.pi / 2)
        o.data.materials.append(m)
        out.append(o)
    return out


def meshes():
    return [o for o in bpy.data.objects if o.type in ('MESH', 'CURVE') and not o.is_shadow_catcher and not o.hide_render]


def s_sac():
    """heavy bag hanging on its chains from a beam, and a longer « banana » bag next to it"""
    steel = mat('acier', (0.55, 0.55, 0.57), 0.3, 1.0)
    wood = mat('poutre', hexrgb('#3B2A1E'), 0.7)
    for x, h, r, colour, band in ((-0.32, 1.1, 0.19, '#141416', '#B3122A'), (0.34, 1.75, 0.17, '#8E1020', '#141416')):
        z0 = 0.35 if h < 1.5 else 0.25
        body = cyl('sac', r, h, (x, 0, z0 + h / 2), leather('cuir-sac', colour, 0.38), verts=48)
        soften(body, 2, bevel=0.04)
        for zb in (z0 + h * 0.18, z0 + h * 0.82):
            cyl('bande', r * 1.01, 0.07, (x, 0, zb), leather('bande', band, 0.4), verts=48)
        top = z0 + h
        cyl('plateau', r * 0.5, 0.03, (x, 0, top + 0.01), steel)
        hook = Vector((x, 0, 2.55))
        for k in range(4):
            a = math.pi / 4 + k * math.pi / 2
            chain((x + math.cos(a) * r * 0.85, math.sin(a) * r * 0.85, top + 0.02), hook - Vector((0, 0, 0.12)), 0.035, steel)
        chain(hook - Vector((0, 0, 0.12)), hook, 0.035, steel)
    box('poutre', (1.6, 0.16, 0.16), (0, 0, 2.63), wood, 0.01)
    ground(0)
    c, *_ = frame(meshes(), azimuth=18, elevation=6, lens=50, margin=1.08)
    lights(c, 1.2)


def _pad(name, size, colour, face=None, curve=18):
    o = box(name, size, (0, 0, 0), leather(name, colour, 0.36))
    soften(o, 3, bevel=min(size) * 0.35)
    bend(o, curve, 'X')
    if face:
        # the striking face: a raised disc of another colour, in the middle of the front
        f = cyl(name + '-face', min(size[0], size[2]) * 0.28, size[1] * 0.25, (0, -size[1] * 0.42, 0), leather(name + '-f', face, 0.34), rot=(math.pi / 2, 0, 0), verts=48)
        soften(f, 2, bevel=0.006)
        f.parent = o
    return o


def s_pattes_ours():
    """a pair of focus mitts: one shows its striking face, the other its back and the hand strap"""
    objs = []
    for s in (-1, 1):
        o = _pad('patte', (0.2, 0.07, 0.25), '#141416', '#B3122A', curve=22)
        strap = curve_obj('poignee', [(-0.07, 0.05, 0.02), (-0.035, 0.075, 0.035), (0.035, 0.075, 0.035), (0.07, 0.05, 0.02)], 0.012, leather('sangle', '#141416', 0.5))
        strap.parent = o
        o.rotation_euler = (math.radians(-8), 0, math.radians(14 if s < 0 else 180 - 20))
        o.location = (s * 0.17, 0, 0.16)
        objs.append(o)
    ground(0)
    c, *_ = frame(meshes(), azimuth=12, elevation=12, lens=60, margin=1.25)
    lights(c, 0.5)


def s_paos():
    """a pair of Thai pads, one from the front, one from the back with its forearm straps and handle"""
    for s in (-1, 1):
        o = _pad('pao', (0.21, 0.1, 0.4), '#B3122A', None, curve=14)
        lab = box('ecusson', (0.12, 0.01, 0.05), (0, -0.052, 0.1), mat('ecusson', hexrgb('#F4F4F5'), 0.5), 0.003)
        lab.parent = o
        for z in (-0.08, 0.06):
            st = box('sangle', (0.23, 0.02, 0.045), (0, 0.06, z), leather('sangle-p', '#141416', 0.5), 0.006)
            st.parent = o
        h = curve_obj('poignee', [(-0.06, 0.06, 0.15), (-0.03, 0.09, 0.16), (0.03, 0.09, 0.16), (0.06, 0.06, 0.15)], 0.013, leather('poignee', '#141416', 0.5))
        h.parent = o
        o.rotation_euler = (0, 0, math.radians(12 if s < 0 else 180 - 18))
        o.location = (s * 0.18, 0, 0.22)
    ground(0)
    c, *_ = frame(meshes(), azimuth=14, elevation=10, lens=60, margin=1.22)
    lights(c, 0.55)


def _casque(loc, rz):
    red = leather('casque', '#B3122A', 0.36)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=48, ring_count=32, location=(0, 0, 0))
    sh = bpy.context.object
    sh.scale = (0.105, 0.12, 0.135)
    bpy.ops.object.transform_apply(scale=True)
    # open face: a rounded window at the front, and the shell stops under the ears
    bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=0.3, location=(0, -0.13, -0.01), rotation=(math.pi / 2, 0, 0), vertices=64)
    win = bpy.context.object
    win.scale = (0.95, 1.25, 1.0)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, -0.16))
    low = bpy.context.object
    low.scale = (0.4, 0.4, 0.16)
    for cut in (win, low):
        b = sh.modifiers.new('cut', 'BOOLEAN')
        b.operation = 'DIFFERENCE'
        b.object = cut
        cut.hide_render = True
        cut.display_type = 'WIRE'
    so = sh.modifiers.new('epaisseur', 'SOLIDIFY')
    so.thickness = 0.022
    so.offset = 1
    soften(sh, 2)
    sh.data.materials.append(red)
    # padding seams: a darker rim around the face and ear vents
    # the padded rim of the face opening, following the shell
    rim_pts = []
    for k in range(64):
        t = k * math.pi / 32
        x, z = 0.0665 * math.cos(t), -0.01 + 0.0875 * math.sin(t)
        if z < -0.098:
            continue
        y = -0.12 * math.sqrt(max(0.0, 1 - (x / 0.105) ** 2 - (z / 0.135) ** 2)) - 0.012
        rim_pts.append((x, y, z))
    rim = curve_obj('bord', rim_pts, 0.012, leather('bord', '#6E0B18', 0.4), cyclic=False)
    # a band over the top of the head
    top = curve_obj('bandeau', [(0.0, 0.12 * math.cos(a) * -1 * 0 + -0.12 * math.cos(a), 0.137 * math.sin(a) + 0.0) for a in [math.radians(x) for x in range(40, 141, 5)]], 0.0, leather('bandeau', '#6E0B18', 0.4), profile=rect_profile('tp', 0.03, 0.006))
    vents = []
    for sx in (-1, 1):
        v = cyl('oreille', 0.022, 0.01, (sx * 0.112, 0.0, -0.02), mat('aeration', hexrgb('#1A1A1C'), 0.6), rot=(0, math.pi / 2, 0), verts=32)
        vents.append(v)
    strap = curve_obj('jugulaire', [(-0.1, 0.0, -0.06), (-0.07, -0.02, -0.13), (0.0, -0.03, -0.155), (0.07, -0.02, -0.13), (0.1, 0.0, -0.06)], 0.0, leather('jugulaire', '#141416', 0.5), profile=rect_profile('jp', 0.025, 0.004))
    lace = box('laçage', (0.03, 0.06, 0.004), (0, 0.05, 0.13), mat('lacet', hexrgb('#F4F4F5'), 0.6))
    root = bpy.data.objects.new('casque', None)
    bpy.context.collection.objects.link(root)
    # the cutters move with the helmet, or the booleans would cut empty space
    for o in (sh, rim, top, *vents, strap, lace, win, low):
        o.parent = root
    root.rotation_euler = (0, 0, math.radians(rz))
    root.location = loc
    return root


def s_casque():
    """amateur boxing headgear, from the front and in profile"""
    _casque((-0.15, 0, 0.17), 8)
    _casque((0.17, 0, 0.17), 84)
    ground(0)
    c, *_ = frame(meshes(), azimuth=0, elevation=8, lens=60, margin=1.25)
    lights(c, 0.5)


def s_protege_dents():
    """a mouthguard (an upper arch: front wall, biting floor, back wall) next to its open case"""
    gel = mat('protege', hexrgb('#2D6CDF'), 0.25)
    gel.node_tree.nodes['Principled BSDF'].inputs['Transmission Weight'].default_value = 0.35
    arch = lambda r, k: [(r * math.sin(t) * 1.05, -r * math.cos(t) * k, 0) for t in [math.radians(a) for a in range(-80, 81, 5)]]
    outer = curve_obj('levre', arch(0.03, 1.15), 0, gel, profile=rect_profile('p1', 0.004, 0.022))
    outer.data.twist_mode = 'Z_UP'
    for o in (outer,):
        o.rotation_euler = (0, 0, 0)
    inner = curve_obj('palais', arch(0.019, 1.2), 0, gel, profile=rect_profile('p2', 0.003, 0.012))
    floor = curve_obj('dents', arch(0.025, 1.17), 0, gel, profile=rect_profile('p3', 0.012, 0.004))
    for o, z in ((outer, 0.011), (inner, 0.006), (floor, 0.002)):
        o.location = (-0.03, 0, z)
        o.data.bevel_mode = 'OBJECT'
    # the case: a rounded box and its open lid
    shell = mat('etui', hexrgb('#16181D'), 0.35)
    base = box('etui', (0.07, 0.058, 0.02), (0.06, 0.01, 0.01), shell)
    soften(base, 2, bevel=0.012)
    lid = box('couvercle', (0.07, 0.058, 0.01), (0.06, 0.045, 0.035), shell)
    soften(lid, 2, bevel=0.005)
    lid.rotation_euler = (math.radians(-75), 0, 0)
    ground(0)
    c, *_ = frame(meshes(), azimuth=20, elevation=32, lens=80, margin=1.2)
    lights(c, 0.18)


def s_coquille():
    """a groin guard on its own: the shell and its elastic waist straps"""
    shell = leather('coquille', '#1A1A1C', 0.3, 0.1)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=48, ring_count=24, location=(0, 0, 0))
    o = bpy.context.object
    o.scale = (0.07, 0.042, 0.085)
    bpy.ops.object.transform_apply(scale=True)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.1, 0))
    cut = bpy.context.object
    cut.scale = (0.4, 0.2, 0.4)
    b = o.modifiers.new('cut', 'BOOLEAN')
    b.operation = 'DIFFERENCE'
    b.object = cut
    cut.hide_render = True
    cut.display_type = 'WIRE'
    # narrower at the bottom: a tapered shell
    t = o.modifiers.new('taper', 'SIMPLE_DEFORM')
    t.deform_method = 'TAPER'
    t.factor = 0.7
    t.deform_axis = 'Z'
    so = o.modifiers.new('e', 'SOLIDIFY')
    so.thickness = 0.006
    soften(o, 2)
    o.data.materials.append(shell)
    rim = mat('mousse', hexrgb('#B3122A'), 0.7)
    edge = curve_obj('bord', [(0.07 * math.cos(a) * (1 - 0.55 * max(0, -math.sin(a))) * (1 + 0.2 * max(0, math.sin(a))), 0.002, 0.085 * math.sin(a)) for a in [k * math.pi / 24 for k in range(48)]], 0.007, rim, cyclic=True)
    elastic = mat('elastique', hexrgb('#E5E7EB'), 0.8)
    # the elastic waistband: a ring behind the top of the shell, and the two leg straps
    band = curve_obj('ceinture', [(0.16 * math.sin(a), 0.11 - 0.11 * math.cos(a), 0.095) for a in [k * math.pi / 24 for k in range(48)]], 0, elastic, profile=rect_profile('ep', 0.004, 0.025))
    band.data.splines[0].use_cyclic_u = True
    band.data.twist_mode = 'Z_UP'
    for s in (-1, 1):
        curve_obj('jambe', [(s * 0.012, 0.0, -0.08), (s * 0.06, 0.06, -0.05), (s * 0.12, 0.17, 0.06), (s * 0.13, 0.2, 0.09)], 0.006, elastic)
    root = bpy.data.objects.new('coquille', None)
    bpy.context.collection.objects.link(root)
    for x in meshes() + [cut]:
        x.parent = root
    root.rotation_euler = (math.radians(-12), 0, 0)
    root.location = (0, 0, 0.12)
    ground(0)
    c, *_ = frame(meshes(), azimuth=30, elevation=28, lens=60, margin=1.2)
    lights(c, 0.4)


def s_protege_poitrine():
    """a chest guard for women: a moulded oval shell with two cups, a foam edge and back straps, standing at an angle"""
    shell = leather('plastron', '#F1F1F3', 0.3, 0.06)
    bpy.ops.mesh.primitive_cylinder_add(radius=1, depth=1, vertices=64, location=(0, 0, 0))
    plate = bpy.context.object
    plate.scale = (0.17, 0.12, 0.012)
    bpy.ops.object.transform_apply(scale=True)
    plate.data.materials.append(shell)
    soften(plate, 2, bevel=0.005)
    bend(plate, -25, 'Y')
    for sx in (-1, 1):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=48, ring_count=24, location=(sx * 0.072, 0.01, 0.004))
        cup = bpy.context.object
        cup.scale = (0.068, 0.066, 0.04)
        cup.data.materials.append(shell)
        bpy.ops.object.shade_smooth()
    edge = mat('mousse', hexrgb('#B3122A'), 0.7)
    curve_obj('bord', [(0.172 * math.cos(a), 0.122 * math.sin(a), -0.004 + 0.012 * math.cos(a) ** 2) for a in [k * math.pi / 32 for k in range(64)]], 0.007, edge, cyclic=True)
    strap = leather('sangle', '#16181D', 0.5)
    for sx in (-1, 1):
        curve_obj('bretelle', [(sx * 0.1, 0.11, -0.01), (sx * 0.12, 0.2, -0.04), (sx * 0.13, 0.27, -0.06)], 0.006, strap)
    root = bpy.data.objects.new('plastron', None)
    bpy.context.collection.objects.link(root)
    for x in meshes():
        x.parent = root
    root.rotation_euler = (math.radians(62), 0, 0)
    root.location = (0, 0, 0.16)
    ground(0)
    c, *_ = frame(meshes(), azimuth=12, elevation=12, lens=60, margin=1.2)
    lights(c, 0.5)


def _roll(name, colour, loc, tail, rz):
    """a hand wrap rolled up (lying on its side), its free end unrolled flat on the ground, thumb loop at the tip"""
    m = mat(name, hexrgb(colour), 0.85, sheen=0.5)
    r, w = 0.027, 0.05
    parts = [soften(cyl(name, r, w, (0, 0, r), m, rot=(math.pi / 2, 0, 0), verts=48), 1, bevel=0.003)]
    for k in range(1, 6):
        for sy in (-1, 1):
            bpy.ops.mesh.primitive_torus_add(major_radius=r * k / 6, minor_radius=0.0007, location=(0, sy * w / 2, r), rotation=(math.pi / 2, 0, 0), major_segments=48, minor_segments=4)
            t = bpy.context.object
            t.data.materials.append(mat(name + '-t', hexrgb(colour), 0.95))
            parts.append(t)
    if tail:
        parts.append(box(name + '-queue', (tail, w, 0.002), (tail / 2, 0, 0.001), m))
        bpy.ops.mesh.primitive_torus_add(major_radius=0.03, minor_radius=0.003, location=(tail + 0.028, 0, 0.003), major_segments=48, minor_segments=6)
        lp = bpy.context.object
        lp.scale = (1, 0.7, 0.4)
        lp.data.materials.append(m)
        parts.append(lp)
    root = bpy.data.objects.new(name + '-root', None)
    bpy.context.collection.objects.link(root)
    for o in parts:
        o.parent = root
    root.rotation_euler = (0, 0, math.radians(rz))
    root.location = loc
    return root


def s_bandes():
    """two hand wraps: one rolled up, one unrolled on the ground with its thumb loop"""
    _roll('bande-rouge', '#B3122A', (-0.16, 0.03, 0.0), 0.3, -6)
    _roll('bande-noire', '#1A1A1C', (0.0, -0.07, 0.0), 0.0, 24)
    ground(0)
    c, *_ = frame(meshes(), azimuth=8, elevation=28, lens=70, margin=1.12)
    lights(c, 0.3)


def _twist(name, R, r, colours, loc, rot=(0, 0, 0), wraps=26, tail=None):
    """a ring of cloth wound with cords of two colours (mongkon, pra jiad)"""
    base = mat(name, hexrgb(colours[0]), 0.75, sheen=0.5)
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=96, minor_segments=16, location=(0, 0, 0))
    ring = bpy.context.object
    ring.data.materials.append(base)
    bpy.ops.object.shade_smooth()
    cord = mat(name + '-c', hexrgb(colours[1]), 0.6, sheen=0.4)
    steps = wraps * 16
    pts = []
    for k in range(steps + 1):
        u = k / steps * 2 * math.pi
        v = k / 16 * 2 * math.pi
        rr = R + r * 1.02 * math.cos(v)
        pts.append((rr * math.cos(u), rr * math.sin(u), r * 1.02 * math.sin(v)))
    helix = curve_obj(name + '-h', pts, r * 0.22, cord)
    parts = [ring, helix]
    if tail:
        # the two ends joined in a long tail at the back
        tl = curve_obj(name + '-queue', [(R * 0.9, 0, 0), (R + tail * 0.3, 0.01, -0.005), (R + tail * 0.7, 0.03, -0.012), (R + tail, 0.02, -0.015)], r * 0.75, base)
        parts.append(tl)
    root = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(root)
    for o in parts:
        o.parent = root
    root.rotation_euler = rot
    root.location = loc
    return root


def s_mongkon():
    """a mongkon and two pra jiad on a wooden board"""
    _twist('mongkon', 0.1, 0.016, ('#F4F1EA', '#B3122A'), (-0.08, 0.02, 0.018), tail=0.24)
    _twist('prajiad-g', 0.045, 0.011, ('#B3122A', '#E2B33B'), (0.2, -0.06, 0.012), rot=(0, 0, 0.4), wraps=14)
    _twist('prajiad-d', 0.045, 0.011, ('#B3122A', '#E2B33B'), (0.31, 0.03, 0.012), rot=(0, 0, -0.3), wraps=14)
    box('planche', (0.9, 0.42, 0.03), (0.08, 0, -0.015), mat('bois', hexrgb('#5A3A22'), 0.55), 0.01)
    ground(-0.03)
    c, *_ = frame([o for o in meshes() if o.name != 'planche'], azimuth=0, elevation=40, lens=60, margin=1.18)
    lights(c, 0.45)


def s_dojo():
    """a traditional judo hall: green tatami, wooden posts and low panels, shoji screens, a plain alcove (tokonoma)"""
    sc = bpy.context.scene
    L, Wd, Hh = 10.0, 8.0, 3.2
    mats_ = [mat('tatami-v', hexrgb('#6F7A4C'), 0.85), mat('tatami-b', hexrgb('#9C9468'), 0.85)]
    for i in range(int(L)):
        for j in range(int(Wd / 2)):
            x, y = -L / 2 + i + 0.5, -Wd / 2 + j * 2 + 1
            box('tatami', (0.985, 1.985, 0.05), (x, y, 0.025), mats_[(i + j) % 2 if abs(x) > 3 or abs(y) > 2 else 0], 0.01)
    wood = mat('bois', hexrgb('#6B4A2E'), 0.6)
    dark = mat('bois-fonce', hexrgb('#3B2A1E'), 0.6)
    paper = mat('shoji', hexrgb('#EFE9DC'), 0.9)
    paper.node_tree.nodes['Principled BSDF'].inputs['Emission Color'].default_value = (1.0, 0.92, 0.8, 1)
    paper.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 0.12
    # back wall (y = +W/2) and the two side walls: posts every 2 m, low wooden panel, shoji above
    for wall in ('fond', 'gauche', 'droite'):
        n = int(L / 2) if wall == 'fond' else int(Wd / 2)
        for k in range(n + 1):
            t = -1 + 2 * k / n
            if wall == 'fond':
                p = (t * L / 2, Wd / 2, Hh / 2)
            else:
                p = ((-1 if wall == 'gauche' else 1) * L / 2, t * Wd / 2, Hh / 2)
            box('poteau', (0.16, 0.16, Hh), p, dark)
        for k in range(n):
            t0 = -1 + 2 * (k + 0.5) / n
            if wall == 'fond' and k in (2,):
                continue  # the alcove
            size = (L / n - 0.16, 0.06, 0.9) if wall == 'fond' else (0.06, Wd / n - 0.16, 0.9)
            pos = (t0 * L / 2, Wd / 2, 0.45) if wall == 'fond' else ((-1 if wall == 'gauche' else 1) * L / 2, t0 * Wd / 2, 0.45)
            box('panneau', size, pos, wood)
            hi = (size[0], size[1], Hh - 1.2) if wall == 'fond' else (size[0], size[1], Hh - 1.2)
            pos_hi = (pos[0], pos[1], 0.9 + (Hh - 1.2) / 2 + 0.05)
            box('shoji', hi, pos_hi, paper)
            # the shoji lattice
            span = size[0] if wall == 'fond' else size[1]
            for g in range(1, 4):
                off = -span / 2 + span * g / 4
                lp = (pos_hi[0] + (off if wall == 'fond' else 0), pos_hi[1] + (0 if wall == 'fond' else off), pos_hi[2])
                box('kumiko', (0.025, 0.08, hi[2]) if wall == 'fond' else (0.08, 0.025, hi[2]), lp, dark)
            for g in range(1, 5):
                z = 0.95 + (Hh - 1.2) * g / 5
                box('kumiko', (size[0], 0.08, 0.025) if wall == 'fond' else (0.08, size[1], 0.025), (pos_hi[0], pos_hi[1], z), dark)
    # the alcove: a raised wooden floor and a plain hanging scroll (no writing)
    box('tokonoma', (1.8, 0.7, 0.18), (0, Wd / 2 - 0.35, 0.09), dark, 0.01)
    box('fond-alcove', (1.84, 0.05, Hh), (0, Wd / 2 + 0.02, Hh / 2), mat('enduit', hexrgb('#D8CFBF'), 0.9))
    box('kakemono', (0.5, 0.02, 1.2), (0, Wd / 2 - 0.02, 1.6), mat('rouleau', hexrgb('#EDE6D6'), 0.85))
    box('kakemono-b', (0.56, 0.03, 0.04), (0, Wd / 2 - 0.02, 2.22), dark)
    # ceiling beams
    for k in range(6):
        box('poutre', (L, 0.18, 0.22), (0, -Wd / 2 + (k + 0.5) * Wd / 6, Hh), dark)
    box('plafond', (L, Wd, 0.04), (0, 0, Hh + 0.13), mat('plafond', hexrgb('#4A3626'), 0.8))
    # camera inside, from the front corner, slightly above eye height
    cam = bpy.data.cameras.new('cam')
    cam.lens = 18
    o = bpy.data.objects.new('cam', cam)
    sc.collection.objects.link(o)
    o.location = (2.6, -Wd / 2 + 0.6, 1.7)
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = (Vector((-0.8, Wd / 2, 1.1)) - o.location).to_track_quat('-Z', 'Y')
    sc.camera = o
    for x in (-3, 0, 3):
        for y in (-2, 2):
            bpy.ops.object.light_add(type='AREA', location=(x, y, Hh - 0.1))
            lt = bpy.context.object
            lt.data.energy = 70
            lt.data.size = 1.4
    sc.world.node_tree.nodes['Background'].inputs[1].default_value = 0.15


def _digit_text(body, size, loc, m, rot=(math.pi / 2, 0, 0)):
    cu = bpy.data.curves.new('t', 'FONT')
    cu.body = body
    cu.size = size
    cu.align_x = 'CENTER'
    cu.align_y = 'CENTER'
    cu.extrude = 0.002
    o = bpy.data.objects.new('t', cu)
    bpy.context.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = rot
    o.data.materials.append(m)
    return o


def s_round():
    """the round clock (round number and time left, rest light) and the bell with its hammer"""
    led = mat('led', (1.0, 0.1, 0.08))
    b = led.node_tree.nodes['Principled BSDF']
    b.inputs['Emission Color'].default_value = (1.0, 0.12, 0.08, 1)
    b.inputs['Emission Strength'].default_value = 6
    green = mat('led-v', (0.1, 1.0, 0.4))
    g = green.node_tree.nodes['Principled BSDF']
    g.inputs['Emission Color'].default_value = (0.2, 1.0, 0.5, 1)
    g.inputs['Emission Strength'].default_value = 3
    case = box('chrono', (0.62, 0.1, 0.34), (-0.36, 0.2, 0.62), mat('boitier', hexrgb('#141416'), 0.35), 0.02)
    box('ecran', (0.56, 0.01, 0.28), (-0.36, 0.148, 0.62), mat('ecran', hexrgb('#050506'), 0.15))
    _digit_text('2:47', 0.15, (-0.42, 0.14, 0.6), led)
    _digit_text('R3', 0.07, (-0.17, 0.14, 0.66), led)
    cyl('repos', 0.018, 0.01, (-0.17, 0.142, 0.56), green, rot=(math.pi / 2, 0, 0))
    for sx in (-0.56, -0.16):
        box('pied', (0.03, 0.03, 0.45), (sx, 0.2, 0.225), mat('pied', (0.5, 0.5, 0.52), 0.3, 1.0))
    # the bell on its board
    board = box('socle', (0.34, 0.06, 0.42), (0.3, 0.25, 0.42), mat('bois', hexrgb('#5A3A22'), 0.55), 0.015)
    brass = mat('laiton', hexrgb('#C9A13B'), 0.22, 1.0)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.12, segments=64, ring_count=32, location=(0.3, 0.16, 0.42))
    bell = bpy.context.object
    bell.scale = (1, 0.55, 1)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0.3, 0.3, 0.42))
    cut = bpy.context.object
    cut.scale = (0.4, 0.2, 0.4)
    bb = bell.modifiers.new('cut', 'BOOLEAN')
    bb.operation = 'DIFFERENCE'
    bb.object = cut
    cut.hide_render = True
    cut.display_type = 'WIRE'
    bell.modifiers.new('e', 'SOLIDIFY').thickness = 0.006
    soften(bell, 1)
    bell.data.materials.append(brass)
    cyl('bouton', 0.015, 0.03, (0.3, 0.1, 0.42), brass, rot=(math.pi / 2, 0, 0))
    hammer = cyl('manche', 0.008, 0.26, (0.56, 0.05, 0.04), mat('manche', hexrgb('#3B2A1E'), 0.6), rot=(0, math.pi / 2, 0.3))
    head = cyl('tete', 0.02, 0.06, (0.44, 0.0, 0.04), brass, rot=(0, 0, 0.3))
    ground(0)
    c, *_ = frame(meshes(), azimuth=10, elevation=8, lens=55, margin=1.12)
    lights(c, 0.7)


def s_boxe_ancienne():
    """the beginnings of boxing: a pair of old brown leather gloves with laces on a wooden table, next to a printed rule sheet"""
    gl = outfit('boxe', {'gant-Left', 'gant-Right'})
    old = leather('cuir-ancien', '#6B3F22', 0.55, 0.45, 120)
    for o in gl:
        o.data.materials.clear()
        o.data.materials.append(old)
    pair(gl[0], gl[1], 0.27, tilt=24)
    for o in gl:
        o.location.x -= 0.12
    paper = mat('papier', hexrgb('#E6D9B8'), 0.9)
    ink = mat('encre', hexrgb('#2A2218'), 0.8)
    rz = math.radians(-9)
    rot = Matrix.Rotation(rz, 4, 'Z')
    at = lambda x, y, z: tuple(Vector((0.24, 0.0, 0.0)) + (rot @ Vector((x, y, z))))
    sheet = box('feuille', (0.21, 0.28, 0.002), at(0, 0, 0.001), paper)
    sheet.rotation_euler.z = rz
    # a printed page seen from afar: a title band and columns of lines, nothing readable
    parts = [box('titre', (0.12, 0.012, 0.0005), at(0.0, 0.11, 0.0023), ink)]
    for k in range(18):
        w = 0.16 if k % 6 != 5 else 0.09
        parts.append(box('ligne', (w, 0.004, 0.0005), at(-0.08 + w / 2, 0.085 - k * 0.0105, 0.0023), ink))
    for ln in parts:
        ln.rotation_euler.z = rz
    box('table', (0.8, 0.46, 0.04), (0.06, 0.02, -0.02), leather('bois', '#4A3020', 0.5, 0.15, 30), 0.01)
    ground(-0.04)
    c, *_ = frame([*gl, sheet], azimuth=8, elevation=30, lens=60, margin=1.12)
    lights(c, 0.5)


def s_tableau_jjb():
    """a BJJ scoreboard: two athletes, their points, advantages (green) and penalties (red), and the time left"""
    led = lambda name, rgb, power=5: (lambda m: (m.node_tree.nodes['Principled BSDF'].inputs['Emission Color'].__setattr__('default_value', (*rgb, 1)), m.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].__setattr__('default_value', power), m)[2])(mat(name, rgb))
    white, green, red, yellow = led('blanc', (1, 1, 1)), led('vert', (0.15, 1, 0.35)), led('rouge', (1, 0.12, 0.1)), led('jaune', (1, 0.8, 0.2))
    box('ecran', (1.2, 0.06, 0.62), (0, 0.04, 0.6), mat('boitier', hexrgb('#0A0A0C'), 0.3), 0.015)
    for row, (z, band, pts, adv, pen) in enumerate(((0.75, '#1E40AF', '4', '1', '0'), (0.47, '#F4F4F5', '2', '2', '1'))):
        box('couleur', (0.06, 0.01, 0.2), (-0.55, 0.005, z), mat('c%d' % row, hexrgb(band), 0.5))
        for k in range(4):
            box('nom', (0.07, 0.005, 0.03), (-0.44 + k * 0.085, 0.006, z + 0.05), mat('nom', hexrgb('#9CA3AF'), 0.5))
        _digit_text(pts, 0.2, (0.08, 0.0, z), white)
        _digit_text(adv, 0.11, (0.3, 0.0, z), green)
        _digit_text(pen, 0.11, (0.46, 0.0, z), red)
    _digit_text('4:12', 0.1, (-0.32, 0.0, 0.36), yellow)
    for x in (-0.4, 0.4):
        box('pied', (0.04, 0.04, 0.3), (x, 0.05, 0.15), mat('pied', (0.5, 0.5, 0.52), 0.3, 1.0))
    ground(0)
    c, *_ = frame(meshes(), azimuth=6, elevation=4, lens=55, margin=1.1)
    lights(c, 0.8)


def s_livre_regles():
    """a closed rule book lying on the floor: hard red cover with gold fillets, cream page edges (no title, no logo)"""
    cover = leather('couverture', '#7A1020', 0.45, 0.2, 90)
    gold = mat('or', hexrgb('#C9A13B'), 0.25, 1.0)
    pages = mat('pages', hexrgb('#EFE6D0'), 0.85)
    w, dpt, h = 0.24, 0.32, 0.05
    box('pages', (w - 0.01, dpt - 0.012, h - 0.01), (0.004, 0, h / 2), pages)
    box('plat-bas', (w, dpt, 0.006), (0, 0, 0.003), cover, 0.002)
    box('plat-haut', (w, dpt, 0.006), (0, 0, h - 0.003), cover, 0.002)
    dos = cyl('dos', h / 2, dpt, (-w / 2, 0, h / 2), cover, rot=(math.pi / 2, 0, 0), verts=32)
    for k, inset in enumerate((0.018, 0.026)):
        for (ax, ay), (bx, by) in (((-1, -1), (1, -1)), ((1, -1), (1, 1)), ((1, 1), (-1, 1)), ((-1, 1), (-1, -1))):
            rope('filet', (ax * (w / 2 - inset), ay * (dpt / 2 - inset), h + 0.0005), (bx * (w / 2 - inset), by * (dpt / 2 - inset), h + 0.0005), 0.0012, gold)
    box('cartouche', (0.11, 0.05, 0.001), (0, 0.06, h + 0.0008), gold)
    for z in (0.012, 0.038):
        cyl('nerf', h / 2 + 0.002, 0.008, (-w / 2, 0, h / 2), gold, rot=(math.pi / 2, 0, 0), verts=32).location.y = (z - 0.025) * 4
    root = bpy.data.objects.new('livre', None)
    bpy.context.collection.objects.link(root)
    for o in meshes():
        o.parent = root
    root.rotation_euler.z = math.radians(-18)
    ground(0)
    c, *_ = frame(meshes(), azimuth=8, elevation=34, lens=60, margin=1.15)
    lights(c, 0.45)


SCENES = {
    'gants-boxe': s_gants_boxe,
    'protege-tibias': s_protege_tibias,
    'rashguard': s_rashguard,
    'short-combat': s_short_combat,
    'short-muaythai': s_short_muaythai,
    'judogi': s_judogi,
    'kimono-jjb': s_kimono_jjb,
    'ring': s_ring,
    'cage': s_cage,
    'tatami': s_tatami,
    'ceintures': s_ceintures,
    'sac': s_sac,
    'pattes-ours': s_pattes_ours,
    'paos': s_paos,
    'casque': s_casque,
    'protege-dents': s_protege_dents,
    'coquille': s_coquille,
    'protege-poitrine': s_protege_poitrine,
    'bandes': s_bandes,
    'mongkon': s_mongkon,
    'dojo': s_dojo,
    'round': s_round,
    'boxe-ancienne': s_boxe_ancienne,
    'tableau-jjb': s_tableau_jjb,
    'livre-regles': s_livre_regles,
}

if __name__ == '__main__':
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    names = sys.argv[2:] or list(SCENES)
    for name in names:
        reset()
        SCENES[name]()
        bpy.context.scene.render.filepath = str(out / f'{name}.png')
        bpy.ops.render.render(write_still=True)
        print('SCENE', name, 'ok')
