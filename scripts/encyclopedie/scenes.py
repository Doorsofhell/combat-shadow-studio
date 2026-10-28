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
