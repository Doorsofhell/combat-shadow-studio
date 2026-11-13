"""1.23 Salles immersives: one photo-like room per discipline, behind the 3D coach of the training screen.

Each room is modelled here (no downloaded asset, no brand, no writing) and rendered with Cycles as a 360° panorama
seen from where the coach stands, 1.4 m above the floor. The app lays it on a ground-projected dome (three.js
GroundedSkybox): the floor under the coach stays flat and right when the camera turns, and the same picture lights and
reflects on the coach. What moves (heavy bags that swing) is left out of the panorama and rendered on its own, with
the room's light, as a cut-out picture the app hangs and swings in 3D.

Output (in <out>/<room>/): pano.png (read by compose.py), sprite-<name>.png, salle.json (props, lights)
Usage: python3 scripts/salles/salles.py <out dir> [room ...]      QUICK=1 for a small, fast render
"""
import json
import math
import os
import sys
from pathlib import Path

import bpy  # noqa: I001
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import equipement as EQ  # noqa: E402
from equipement import at  # noqa: E402

QUICK = os.environ.get('QUICK') == '1'
PW = 1024 if QUICK else int(os.environ.get('RES', '4096'))
PH = PW // 2
SAMPLES = 16 if QUICK else int(os.environ.get('SAMPLES', '96'))
EYE = 1.4  # height of the panorama camera (GroundedSkybox height in the app)


# --- helpers ------------------------------------------------------------------------------------------------------


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _mats.clear()
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = SAMPLES
    sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 6
    sc.cycles.caustics_reflective = False
    sc.cycles.caustics_refractive = False
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = 'AgX - Base Contrast'
    world = bpy.data.worlds.new('w')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs[0].default_value = (0.01, 0.011, 0.013, 1)
    world.node_tree.nodes['Background'].inputs[1].default_value = 1.0
    sc.world = world
    return sc


def hexrgb(h):
    h = h.lstrip('#')
    return tuple((int(h[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4))


_mats = {}


def pbr(name, colour, rough=0.6, metal=0.0, var=0.25, scale=6.0, bump=0.15, kind='noise', emit=None, emit_k=0.0, sheen=0.0, coat=0.0, axes='xy', brick=None, b2=0.72):
    """principled material with a procedural texture: colour variation, roughness variation and bump, so no surface
    is a flat colour (what makes a render look like a photo). kind: noise | brick | planks; axes: the plane the
    pattern lies in (xy floor, xz wall facing ±y, yz wall facing ±x); brick: (width, row height, mortar) in metres"""
    key = (name, colour, rough, axes, brick)
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    c = hexrgb(colour) if isinstance(colour, str) else colour
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if sheen:
        b.inputs['Sheen Weight'].default_value = sheen
    if coat:
        b.inputs['Coat Weight'].default_value = coat
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Rotation'].default_value = {'xy': (0, 0, 0), 'xz': (-math.pi / 2, 0, 0), 'yz': (-math.pi / 2, 0, -math.pi / 2)}[axes]
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    vec = mp.outputs['Vector']
    noise = nt.nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = scale
    noise.inputs['Detail'].default_value = 8.0
    noise.inputs['Roughness'].default_value = 0.6
    if kind == 'planks':
        # long grain: the noise stretched along the planks
        st = nt.nodes.new('ShaderNodeMapping')
        st.inputs['Scale'].default_value = (0.08, 1.0, 1.0)
        nt.links.new(vec, st.inputs['Vector'])
        nt.links.new(st.outputs['Vector'], noise.inputs['Vector'])
    else:
        nt.links.new(vec, noise.inputs['Vector'])
    fac = noise.outputs['Fac']
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (*(x * (1 - var) for x in c), 1)
    ramp.color_ramp.elements[1].color = (*(min(1, x * (1 + var)) for x in c), 1)
    nt.links.new(fac, ramp.inputs['Fac'])
    colour_out = ramp.outputs['Color']
    height = fac
    if kind in ('brick', 'planks'):
        bw, rh, mort = brick or ((0.24, 0.075, 0.012) if kind == 'brick' else (1.6, 0.14, 0.003))
        br = nt.nodes.new('ShaderNodeTexBrick')
        br.inputs['Scale'].default_value = 1.0
        br.inputs['Brick Width'].default_value = bw
        br.inputs['Row Height'].default_value = rh
        br.inputs['Mortar Size'].default_value = mort
        br.inputs['Mortar Smooth'].default_value = 0.2
        br.inputs['Color1'].default_value = (1, 1, 1, 1)
        br.inputs['Color2'].default_value = (b2, b2, b2, 1)
        br.inputs['Mortar'].default_value = (0.35, 0.35, 0.35, 1)
        br.offset_frequency = 2
        br.squash_frequency = 2
        nt.links.new(vec, br.inputs['Vector'])
        mix = nt.nodes.new('ShaderNodeMix')
        mix.data_type = 'RGBA'
        mix.blend_type = 'MULTIPLY'
        mix.inputs['Factor'].default_value = 1.0
        nt.links.new(ramp.outputs['Color'], mix.inputs['A'])
        nt.links.new(br.outputs['Color'], mix.inputs['B'])
        colour_out = mix.outputs['Result']
        height = br.outputs['Fac']
    nt.links.new(colour_out, b.inputs['Base Color'])
    # roughness follows the wear
    mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['To Min'].default_value = max(0.02, rough - 0.15)
    mr.inputs['To Max'].default_value = min(1, rough + 0.15)
    nt.links.new(fac, mr.inputs['Value'])
    nt.links.new(mr.outputs['Result'], b.inputs['Roughness'])
    if bump:
        bn = nt.nodes.new('ShaderNodeBump')
        bn.inputs['Strength'].default_value = bump
        bn.inputs['Distance'].default_value = 0.02
        nt.links.new(height, bn.inputs['Height'])
        nt.links.new(bn.outputs['Normal'], b.inputs['Normal'])
    if emit:
        b.inputs['Emission Color'].default_value = (*hexrgb(emit), 1)
        b.inputs['Emission Strength'].default_value = emit_k
    _mats[key] = m
    return m


def glow(name, colour, k):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    e = nt.nodes.new('ShaderNodeEmission')
    e.inputs['Color'].default_value = (*hexrgb(colour), 1)
    e.inputs['Strength'].default_value = k
    nt.links.new(e.outputs['Emission'], nt.nodes['Material Output'].inputs['Surface'])
    return m


def _finish(o, m, bevel):
    if bevel:
        mod = o.modifiers.new('b', 'BEVEL')
        mod.width = bevel
        mod.segments = 2
        mod.limit_method = 'ANGLE'
    if m:
        o.data.materials.append(m)
    return o


def box(size, loc, m, bevel=0.0, rz=0.0, name='box'):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=(0, 0, rz))
    o = bpy.context.object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    return _finish(o, m, bevel)


def cyl(r, depth, loc, m, rot=(0, 0, 0), verts=24, smooth=True, bevel=0.0, name='cyl'):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, rotation=rot, vertices=verts)
    o = bpy.context.object
    o.name = name
    if smooth:
        bpy.ops.object.shade_smooth()
    return _finish(o, m, bevel)


def rod(a, b, r, m, verts=12, name='rod'):
    a, b = Vector(a), Vector(b)
    d = b - a
    o = cyl(r, d.length, (a + b) / 2, m, verts=verts, name=name)
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = d.to_track_quat('Z', 'Y')
    return o


def sphere(r, loc, m, name='sphere'):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=24, ring_count=12)
    o = bpy.context.object
    o.name = name
    bpy.ops.object.shade_smooth()
    return _finish(o, m, 0)


def area(loc, target, energy, size, colour='#ffffff', shape='SQUARE', size_y=None, spread=None):
    bpy.ops.object.light_add(type='AREA', location=loc)
    lt = bpy.context.object
    lt.data.energy = energy
    lt.data.shape = shape
    lt.data.size = size
    if size_y:
        lt.data.size_y = size_y
    if spread:
        lt.data.spread = math.radians(spread)
    lt.data.color = hexrgb(colour)
    lt.rotation_mode = 'QUATERNION'
    lt.rotation_quaternion = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y')
    return lt


def point(loc, energy, colour='#ffffff', radius=0.05):
    bpy.ops.object.light_add(type='POINT', location=loc)
    lt = bpy.context.object
    lt.data.energy = energy
    lt.data.shadow_soft_size = radius
    lt.data.color = hexrgb(colour)
    return lt


def room_shell(half_x, half_y, height, floor_m, wall, ceil_m):
    """floor, four walls and a ceiling around the coach (centred on the origin); wall(axes) gives the wall material
    with its pattern in the wall's plane"""
    box((half_x * 2, half_y * 2, 0.1), (0, 0, -0.05), floor_m, name='sol')
    box((half_x * 2, 0.2, height), (0, half_y + 0.1, height / 2), wall('xz'), name='mur-fond')
    box((half_x * 2, 0.2, height), (0, -half_y - 0.1, height / 2), wall('xz'), name='mur-avant')
    box((0.2, half_y * 2, height), (half_x + 0.1, 0, height / 2), wall('yz'), name='mur-droit')
    box((0.2, half_y * 2, height), (-half_x - 0.1, 0, height / 2), wall('yz'), name='mur-gauche')
    box((half_x * 2, half_y * 2, 0.1), (0, 0, height + 0.05), ceil_m, name='plafond')


def industrial_lamp(x, y, z, colour, k, shade_m, cable_m, top):
    """an industrial pendant: metal cone shade, glowing bulb, a cable to the ceiling; the light is a point light"""
    bpy.ops.mesh.primitive_cone_add(radius1=0.32, radius2=0.08, depth=0.28, location=(x, y, z + 0.12), vertices=32)
    shade = bpy.context.object
    shade.name = 'abat-jour'
    bpy.ops.object.shade_smooth()
    sol = shade.modifiers.new('s', 'SOLIDIFY')
    sol.thickness = 0.01
    shade.data.materials.append(shade_m)
    sphere(0.07, (x, y, z + 0.02), glow('ampoule', colour, 30), name='ampoule')
    rod((x, y, z + 0.26), (x, y, top), 0.006, cable_m, verts=6, name='fin-cable')
    point((x, y, z - 0.02), k, colour, 0.06)


def ring(cx, cy, side, height, rot, posts, rope_m, canvas_m, apron_m, steel_m, n_ropes=4, wrap=None):
    """a boxing ring standing at (cx, cy): platform, canvas, four corner posts with pads, ropes"""
    c, s = math.cos(rot), math.sin(rot)

    def w(x, y, z):
        return (cx + x * c - y * s, cy + x * s + y * c, z)

    box((side + 1.0, side + 1.0, height), w(0, 0, height / 2), apron_m, 0.01, rz=rot, name='ring-plateau')
    box((side + 0.9, side + 0.9, 0.05), w(0, 0, height + 0.025), canvas_m, 0.02, rz=rot, name='ring-toile')
    h = side / 2
    corners = [(-h, -h), (h, -h), (h, h), (-h, h)]
    for (x, y), pad_m in zip(corners, posts):
        cyl(0.06, 1.6, w(x * 1.03, y * 1.03, height + 0.8), steel_m, name='ring-poteau')
        box((0.24, 0.24, 1.3), w(x, y, height + 0.85), pad_m, 0.05, rz=rot, name='ring-coussin')
    zs = [0.4, 0.75, 1.1, 1.45][:n_ropes] if n_ropes == 4 else [0.45, 0.85, 1.25]
    # 1.27 (Youssef, 06/11, capture of the Thai ring: ropes huge, blurred, torn): in the depth picture each side of
    # the ring is a solid plane from the canvas to the top rope, like the fence of the cage (render_depth)
    for i in range(4):
        a, b = corners[i], corners[(i + 1) % 4]
        mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        along_x = abs(b[0] - a[0]) > abs(b[1] - a[1])
        pl = box((side, 0.02, zs[-1] + 0.06), w(mid[0], mid[1], height + (zs[-1] + 0.06) / 2), None, rz=rot + (0 if along_x else math.pi / 2), name='ring-plan')
        pl.hide_render = True
    for z in zs:
        for i in range(4):
            a, b = corners[i], corners[(i + 1) % 4]
            if wrap:
                # cloth wrapped around the rope in coloured sections (Thai rings)
                n = 9
                for k in range(n):
                    p0 = (a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n)
                    p1 = (a[0] + (b[0] - a[0]) * (k + 1) / n, a[1] + (b[1] - a[1]) * (k + 1) / n)
                    rod(w(*p0, height + z), w(*p1, height + z), 0.04, wrap[k % len(wrap)], name='ring-corde')
            else:
                rod(w(*a, height + z), w(*b, height + z), 0.032, rope_m, name='ring-corde')


def heavy_bag(name, x, y, top, length, r, body_m, band_m, chain_m):
    """a heavy bag hanging from a chain; returns its objects"""
    objs = []
    objs.append(cyl(r, length, (x, y, top - 0.25 - length / 2), body_m, verts=40, bevel=0.04, name=f'{name}-corps'))
    objs.append(cyl(r * 1.02, 0.12, (x, y, top - 0.25 - 0.18), band_m, verts=40, bevel=0.01, name=f'{name}-bande'))
    objs.append(cyl(r * 1.02, 0.1, (x, y, top - 0.25 - length + 0.14), band_m, verts=40, bevel=0.01, name=f'{name}-bande2'))
    for k in range(4):
        a = k * math.pi / 2
        objs.append(rod((x + math.cos(a) * r * 0.8, y + math.sin(a) * r * 0.8, top - 0.26), (x, y, top - 0.05), 0.006, chain_m, verts=6, name=f'{name}-chaine'))
    objs.append(rod((x, y, top - 0.05), (x, y, top + 3), 0.012, chain_m, verts=6, name=f'{name}-chaine'))
    return objs


def pano_camera(sc):
    cam = bpy.data.cameras.new('pano')
    cam.type = 'PANO'
    cam.panorama_type = 'EQUIRECTANGULAR'
    o = bpy.data.objects.new('pano', cam)
    sc.collection.objects.link(o)
    o.location = (0, 0, EYE)
    # looks along +Y (the back of the room, what the training camera sees behind the coach)
    o.rotation_euler = (math.pi / 2, 0, 0)
    sc.camera = o
    sc.render.resolution_x, sc.render.resolution_y = PW, PH
    sc.render.film_transparent = False
    return o


def render_pano(sc, out_dir):
    """the panorama as a 16-bit PNG, with the AgX view (compose.py adds haze, bloom and grain)"""
    sc.render.image_settings.media_type = 'IMAGE'
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGB'
    sc.render.image_settings.color_depth = '16'
    sc.render.filepath = str(out_dir / 'pano.png')
    bpy.ops.render.render(write_still=True)


DMAX = 60.0  # metres: farthest distance kept in the depth picture (the sky and beyond count as this far)


def render_depth(sc, out_dir, width=1024):
    """1.25: distance from the panorama camera to what each pixel shows, as a 16-bit grey picture (0 = here,
    65535 = DMAX). The app lays the panorama on a mesh pushed out to these distances, so the room keeps its real size
    and perspective when the training camera stands 5 m in front of the coach instead of at his place."""
    cam = sc.camera.location  # (matrix_world is not updated before the first render)
    m = bpy.data.materials.new('distance')
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    dist = nt.nodes.new('ShaderNodeVectorMath')
    dist.operation = 'DISTANCE'
    dist.inputs[1].default_value = cam
    scale = nt.nodes.new('ShaderNodeMath')
    scale.operation = 'DIVIDE'
    scale.inputs[1].default_value = DMAX
    emit = nt.nodes.new('ShaderNodeEmission')
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(geo.outputs['Position'], dist.inputs[0])
    nt.links.new(dist.outputs['Value'], scale.inputs[0])
    nt.links.new(scale.outputs['Value'], emit.inputs['Color'])
    nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    vl = sc.view_layers[0]
    keep = (sc.cycles.samples, sc.cycles.use_denoising, sc.view_settings.view_transform, sc.view_settings.look, sc.render.resolution_x, sc.render.resolution_y, sc.render.filter_size)
    bg = sc.world.node_tree.nodes['Background']
    keep_bg = (tuple(bg.inputs[0].default_value), bg.inputs[1].default_value)
    vl.material_override = m
    sc.cycles.samples = 1
    sc.cycles.use_denoising = False
    sc.render.filter_size = 0.01
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.look = 'None'
    sc.render.resolution_x, sc.render.resolution_y = width, width // 2
    bg.inputs[0].default_value = (1, 1, 1, 1)
    bg.inputs[1].default_value = 1.0
    # lights would add to the emission: hidden for this picture
    lamps = [o for o in sc.objects if o.type == 'LIGHT' and not o.hide_render]
    for o in lamps:
        o.hide_render = True
    # 1.26 (Youssef, 2026-11-06: « la cage MMA est déformée »): the wire mesh is thinner than a pixel of this
    # picture, so its distances flickered between the fence and the far side of the cage and the relief tore what is
    # seen through it. For the distances only, each fence panel is a solid plane: what is seen through the fence lies
    # on it, flat and straight, like the fence itself
    # 1.27: the ring's ropes the same way (ring-plan), and every thin thing (cables, ropes, bands, named 'fin-') is
    # left out: a cord thinner than a pixel tore the relief around it
    fence = [o for o in sc.objects if o.name.startswith(('cage-grillage', 'ring-corde', 'fin-')) and not o.hide_render]
    planes = [o for o in sc.objects if o.name.startswith(('cage-plan', 'ring-plan'))]
    keep_scale = [tuple(o.scale) for o in planes]
    for o in fence:
        o.hide_render = True
    for o in planes:
        o.hide_render = False
        if o.name.startswith('cage-plan'):
            o.scale.y = 0.01
    sc.render.image_settings.color_management = 'OVERRIDE'
    sc.render.image_settings.view_settings.view_transform = 'Standard'
    sc.render.image_settings.display_settings.display_device = 'sRGB'
    sc.render.image_settings.linear_colorspace_settings.name = 'Linear Rec.709'
    sc.render.image_settings.file_format = 'OPEN_EXR'
    sc.render.image_settings.color_depth = '32'
    sc.render.filepath = str(out_dir / 'depth.exr')
    bpy.ops.render.render(write_still=True)
    for o in lamps:
        o.hide_render = False
    for o in fence:
        o.hide_render = False
    for o, k in zip(planes, keep_scale):
        o.hide_render = True
        o.scale = k
    vl.material_override = None
    sc.cycles.samples, sc.cycles.use_denoising, sc.view_settings.view_transform, sc.view_settings.look, sc.render.resolution_x, sc.render.resolution_y, sc.render.filter_size = keep
    bg.inputs[0].default_value, bg.inputs[1].default_value = keep_bg[0], keep_bg[1]
    sc.render.image_settings.color_management = 'FOLLOW_SCENE'


def render_sprite(sc, out_dir, name, objs, all_objs, px_per_m=220):
    """one prop alone, lit by the whole room (the rest stays in the light paths but out of the picture), seen from
    the coach's place, on a transparent background"""
    keep = set(objs)
    for o in all_objs:
        if o.type in ('MESH', 'CURVE'):
            o.visible_camera = o in keep
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    lo = Vector([min(p[i] for p in pts) for i in range(3)])
    hi = Vector([max(p[i] for p in pts) for i in range(3)])
    # the chain to the ceiling is cut 2.6 m above the bottom of the bag
    hi.z = min(hi.z, lo.z + 2.6)
    c = (lo + hi) / 2
    w = max(hi.x - lo.x, hi.y - lo.y) * 1.08
    h = (hi.z - lo.z) * 1.02
    cam = bpy.data.cameras.new('ortho')
    cam.type = 'ORTHO'
    cam.ortho_scale = max(w, h)
    o = bpy.data.objects.new('ortho', cam)
    sc.collection.objects.link(o)
    d = Vector((c.x, c.y, 0)).normalized()  # looks from the coach's place towards the prop
    o.location = c - d * 6
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = d.to_track_quat('-Z', 'Y')
    prev = (sc.camera, sc.render.resolution_x, sc.render.resolution_y, sc.render.film_transparent, sc.render.image_settings.file_format)
    sc.camera = o
    sc.render.resolution_x = max(16, int(w / max(w, h) * max(w, h) * px_per_m))
    sc.render.resolution_y = max(16, int(h / max(w, h) * max(w, h) * px_per_m))
    # ortho_scale covers the longest side of the picture
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.render.image_settings.color_depth = '8'
    sc.render.filepath = str(out_dir / f'sprite-{name}.png')
    bpy.ops.render.render(write_still=True)
    sc.camera, sc.render.resolution_x, sc.render.resolution_y, sc.render.film_transparent, sc.render.image_settings.file_format = prev
    for ob in all_objs:
        if ob.type in ('MESH', 'CURVE'):
            ob.visible_camera = True
    for ob in objs:
        ob.hide_render = True  # out of the panorama: the app draws it, swinging
    return {'w': w, 'h': h, 'center': [c.x, c.y, c.z]}


EQ.bind(globals())


def render_views(sc, out_dir):
    cam = bpy.data.cameras.new('vue')
    cam.lens = 22
    o = bpy.data.objects.new('vue', cam)
    sc.collection.objects.link(o)
    sc.camera = o
    sc.render.resolution_x, sc.render.resolution_y = 1280, 720
    sc.cycles.samples = int(os.environ.get('SAMPLES', '24'))
    sc.view_settings.exposure = float(os.environ.get('EXPO', '1.5'))
    views = {'face': ((0, -5, 1.5), (0, 6, 1.3)), 'gauche': ((2, 0, 1.6), (-9, 2, 1.2)), 'droite': ((-2, 0, 1.6), (9, 2, 1.2)),
             'arriere': ((0, 4, 1.6), (0, -12, 1.2)), 'fond-gauche': ((2, -3, 1.6), (-9, 9, 1.0)), 'fond-droite': ((-2, -3, 1.6), (9, 9, 1.0))}
    for k, (p, t) in views.items():
        o.location = p
        o.rotation_mode = 'QUATERNION'
        o.rotation_quaternion = (Vector(t) - Vector(p)).to_track_quat('-Z', 'Y')
        sc.render.image_settings.file_format = 'JPEG'
        sc.render.filepath = str(out_dir / f'vue-{k}.jpg')
        bpy.ops.render.render(write_still=True)


def to_three(p):
    """Blender (x, y, z), z up → three.js (x, y, z), y up (the glTF convention)"""
    return [round(p[0], 3), round(p[2], 3), round(-p[1], 3)]


# --- rooms --------------------------------------------------------------------------------------------------------


def boxe():
    """an old boxing gym: brick walls, worn wooden floor, a ring under its own lights at the back, pendant lamps,
    heavy bags on both sides"""
    sc = reset()
    # 1.27 (Youssef: « le sol adéquat, se rapprocher de la réalité »): black sports rubber laid in rolls, as in most
    # boxing gyms (fine granules, a faint joint every 1.25 m one way only), instead of the parquet
    floor = EQ.floor_mat('caoutchouc-boxe', '#1c1c1e', 'caoutchouc', tile=(40.0, 1.25), seam=0.0012, rough=0.82)
    ceil = pbr('plafond', '#141414', 0.9, scale=3)
    room_shell(9, 15, 5.2, floor, lambda ax: pbr('brique', '#6a3326', 0.85, kind='brick', scale=4, var=0.3, bump=0.4, axes=ax), ceil)
    # wainscot and a skirting
    for y, rz, L in ((15 - 0.02, 0, 18), (-15 + 0.02, 0, 18)):
        box((L, 0.06, 1.1), (0, y, 0.55), pbr('lambris', '#1e2a2e', 0.6, scale=4), 0.01)
    for x in (9 - 0.02, -9 + 0.02):
        box((0.06, 30, 1.1), (x, 0, 0.55), pbr('lambris', '#1e2a2e', 0.6, scale=4), 0.01)
    # the ring at the back
    canvas = pbr('toile', '#8d939e', 0.9, scale=14, var=0.12, bump=0.05)
    apron = pbr('jupe', '#1b2236', 0.75, scale=8, var=0.15)
    rope_m = pbr('corde', '#e9e7e2', 0.45, scale=30, var=0.08, bump=0.02)
    red = pbr('coin-rouge', '#9e1622', 0.5, scale=10, var=0.12)
    blue = pbr('coin-bleu', '#183a8c', 0.5, scale=10, var=0.12)
    white = pbr('coin-blanc', '#d8d6d0', 0.5, scale=10, var=0.1)
    steel = pbr('acier', '#9a9ca0', 0.3, metal=1.0, var=0.1, bump=0.0)
    ring(0, 10.5, 5.0, 0.9, 0.0, (red, white, blue, white), rope_m, canvas, apron, steel)
    # ring lights: a truss with four spots
    truss = pbr('truss', '#202224', 0.4, metal=1.0, var=0.1, bump=0)
    for x, y in ((-2.2, 8.3), (2.2, 8.3), (-2.2, 12.7), (2.2, 12.7)):
        rod((x, y, 4.6), (x, y, 5.2), 0.02, truss)
    for a, b in (((-2.2, 8.3), (2.2, 8.3)), ((2.2, 8.3), (2.2, 12.7)), ((2.2, 12.7), (-2.2, 12.7)), ((-2.2, 12.7), (-2.2, 8.3))):
        rod((*a, 4.6), (*b, 4.6), 0.04, truss)
    for x, y in ((-1.2, 9.3), (1.2, 9.3), (-1.2, 11.7), (1.2, 11.7)):
        area((x, y, 4.5), (0, 10.5, 0.9), 260, 0.5, '#fff1dc')
        box((0.5, 0.5, 0.06), (x, y, 4.55), glow('spot', '#fff4e6', 25), name='spot')
    # pendant lamps over the training floor (warm), sconces on the side walls
    shade = pbr('tole', '#1c2b22', 0.45, metal=0.6, scale=5, var=0.2)
    cable = pbr('cable', '#0c0c0c', 0.6, bump=0)
    for x, y in ((-3.2, -1.5), (3.2, -1.5), (-3.2, 2.5), (3.2, 2.5), (0, -4.5), (-3.5, -7), (3.5, -7)):
        industrial_lamp(x, y, 3.5, '#ffcf96', 180, shade, cable, 5.2)
    # heavy bags on both sides (rendered alone: they swing in the app)
    leather = pbr('cuir', '#2a1a14', 0.42, scale=12, var=0.25, bump=0.12, coat=0.2)
    leather_red = pbr('cuir-rouge', '#5c1016', 0.42, scale=12, var=0.25, bump=0.12, coat=0.2)
    band = pbr('sangle', '#141414', 0.5, scale=20, var=0.1)
    chain = pbr('chaine', '#6a6c70', 0.35, metal=1.0, bump=0)
    bags = []
    # 1.27: heavy bags of several sizes (Youssef: « plusieurs sacs lourds de tailles différentes »): standard, long,
    # and a short wide uppercut bag
    for i, (x, y, L, r, red_) in enumerate(((-6.2, -2.0, 1.2, 0.18, False), (-6.2, 1.4, 1.5, 0.19, True), (6.2, -2.0, 0.85, 0.24, False),
                                            (6.2, 1.4, 1.2, 0.18, False), (-5.4, -6.5, 1.5, 0.19, False), (5.4, -6.5, 1.2, 0.18, True))):
        m = leather_red if red_ else leather
        nm = ('sac-cuir-rouge' if red_ else 'sac-cuir') + ('' if L == 1.2 else '-long' if L > 1.2 else '-court')
        bags.append((nm, heavy_bag(f'sac{i}', x, y, L + 0.9, L, r, m, band, chain)))
    # 1.27 equipment of a boxing gym, along the walls (the floor around the coach stays clear)
    # speed bag on the right wall, double-end bag between the bags and the ring
    with at(8.35, 4.6, 0, -math.pi / 2):
        EQ.speed_bag_platform(top=1.95)
    with at(4.4, 5.6):
        EQ.double_end_bag(5.2)
    # glove rack on the left wall (under the windows' end)
    with at(-8.72, 7.6, 0, math.pi / 2):
        lv = EQ.shelf(2.4, 0.42, (0.42, 0.92, 1.42))
        cols = [('#9e1622', '#f2f2f0'), ('#141414', '#9e1622'), ('#1d3a8c', '#f2f2f0'), ('#c9a24a', '#141414')]
        for j, z in enumerate(lv):
            for k in range(4):
                c, cu = cols[(k + j) % 4]
                with at(-0.84 + k * 0.56, -0.02, z):
                    EQ.glove_pair(c, cu)
    # skipping ropes hanging on the left wall
    with at(-8.98, -8.6, 0, math.pi / 2):
        EQ.jump_ropes(['#141414', '#9e1622', '#1d3a8c', '#141414', '#c9a24a'], top=1.85)
    # headgear, hand wraps and mouthguards (in boxes), towels: a shelf on the right wall
    with at(8.72, 8.2, 0, -math.pi / 2):
        lv = EQ.shelf(2.0, 0.42, (0.42, 0.92, 1.42))
        for k, c in enumerate(('#9e1622', '#141414', '#1d3a8c')):
            with at(-0.62 + k * 0.62, 0, lv[2]):
                EQ.headgear(c)
        with at(-0.45, 0, lv[1]):
            EQ.open_crate(0.6, 0.32, 0.12)
            for k in range(10):
                with at(-0.24 + (k % 5) * 0.12, -0.07 + (k // 5) * 0.14, 0.012):
                    EQ.wraps_roll(['#141414', '#9e1622', '#f2f2f0', '#1d3a8c', '#c9a24a'][k % 5])
        with at(0.45, 0, lv[1]):
            EQ.open_crate(0.5, 0.32, 0.1)
            for k in range(8):
                with at(-0.18 + (k % 4) * 0.12, -0.07 + (k // 4) * 0.14, 0.012):
                    EQ.mouthguard_box(['#e8e8e8', '#9e1622', '#1d3a8c', '#141414'][k % 4])
        for k in range(3):
            with at(-0.55 + k * 0.55, 0, lv[0]):
                EQ.folded_stack(['#f2f0ea', '#e8e4da', '#f2f0ea', '#d8d2c4'][: 3 + k % 2], w=0.34, d=0.26, t=0.06)
    # the corner: stool, bucket, towel; the gong by the other corner
    with at(3.4, 7.5, 0, 0.3):
        EQ.corner_stool()
        with at(0, 0, 0.585):
            EQ.towel_folded()
    with at(3.95, 7.15):
        EQ.bucket()
    with at(-3.75, 7.4, 0, 0.35):
        EQ.gong()
    # round timer above the ring, fight posters on the walls, a clock
    with at(0, 14.92, 3.3):
        EQ.wall_timer(1.4, '03:00')
    for k, (x, y, rz, pal) in enumerate(((-5.6, 14.97, 0, ('#d9c9a3', '#1a1a1a', '#9e1622')), (5.6, 14.97, 0, ('#c9a24a', '#141414', '#1d3a8c')),
                                         (8.97, -9.6, -math.pi / 2, ('#e8dcc0', '#2a1a14', '#9e1622')), (8.97, -11.2, -math.pi / 2, ('#1d2a3a', '#e8e4da', '#c9a24a')))):
        with at(x, y, 1.45, rz):
            EQ.picture(EQ.poster_png(f'affiche-boxe-{k}', 30 + k, pal), 0.6, 0.9, name='affiche')
    with at(-8.97, -4.0, 2.2, math.pi / 2):
        EQ.wall_clock(0.24)
    # a long mirror on the right wall, behind the bags (shadow boxing in front of it)
    box((0.02, 6.0, 2.0), (8.955, -2.2, 1.35), pbr('miroir', '#d8dcdf', 0.02, metal=1.0, var=0.0, bump=0.0), name='miroir')
    for z in (0.34, 2.36):
        box((0.04, 6.04, 0.04), (8.95, -2.2, z), pbr('cadre', '#101010', 0.5))
    # a few objects on the floor along the walls: benches and a medicine-ball rack
    wood = pbr('banc', '#5b3d26', 0.55, kind='wood', scale=3)
    for x in (-8.3, 8.3):
        box((0.4, 2.6, 0.08), (x, -4, 0.45), wood, 0.01)
        for y in (-5.1, -2.9):
            box((0.35, 0.08, 0.43), (x, y, 0.215), pbr('pied', '#151515', 0.5), 0.005)
    for k in range(4):
        sphere(0.17, (8.4, 4 + k * 0.45, 0.17), pbr('medecine', ['#3a1d1d', '#1d2a3a', '#2a2a2a', '#3a2f1d'][k], 0.7, scale=9, var=0.2))
    # big windows high on the back-left wall: cold night light
    for y in (-4, 0, 4):
        box((0.05, 2.4, 1.3), (-8.97, y, 3.6), glow('fenetre', '#2d4466', 0.9), name='fenetre')
        for k in range(1, 4):
            box((0.08, 0.05, 1.32), (-8.94, y - 1.2 + k * 0.6, 3.6), pbr('cadre', '#101010', 0.5))
        box((0.08, 2.44, 0.05), (-8.94, y, 3.6), pbr('cadre', '#101010', 0.5))
        box((0.1, 2.6, 0.08), (-8.93, y, 2.92), pbr('cadre', '#101010', 0.5))
    sc.world.node_tree.nodes['Background'].inputs[1].default_value = 0.5
    return sc, bags, {'key': '#fff1dc', 'mist': (6, 26), 'haze': '#2a2018'}


def mma():
    """a modern MMA academy: black mats around the coach, the cage at the back under cold light, concrete walls with
    LED lines, heavy bags along the side"""
    sc = reset()
    # 1.27 (Youssef: « pas l'espèce de carrelage… un tatami, un sol dédié »): black combat tatami over the whole room
    # (pressed surface, faint joints of 2 × 1 m mats) with a red tatami band round the training area; the room is
    # 4 m longer and the cage stands 2 m further back (« la cage présente des défauts »: too close, it tore)
    mats_ = EQ.floor_mat('tatami-mma', '#18191c', 'tatami', tile=(2.0, 1.0), seam=0.0015, rough=0.72)
    ceil = pbr('plafond', '#0e0f11', 0.9, scale=2)
    room_shell(10, 15, 5.5, mats_, lambda ax: pbr('beton', '#3c3e42', 0.85, scale=1.5, var=0.35, bump=0.2, axes=ax), ceil)
    red_t = EQ.floor_mat('tatami-mma-rouge', '#6e1119', 'tatami', tile=(2.0, 1.0), seam=0.0015, rough=0.72)
    for sx in (-1, 1):
        box((1.0, 15.0, 0.012), (sx * 6.0, -2.0, 0.006), red_t, name='tatami-bord')
        # between the side bands (they overlapped at the corners: two faces in one plane drew black squares)
        box((11.0, 1.0, 0.012), (0, -2.0 + sx * 7.0, 0.006), red_t, name='tatami-bord')
    # cage: octagon at the back
    n, r, h, fh = 8, 3.9, 0.6, 1.8
    cy = 10.2
    base = pbr('socle', '#16171a', 0.7, scale=6)
    canvas = pbr('toile-cage', '#2b2d31', 0.85, scale=10, var=0.15)
    pad = pbr('mousse', '#121214', 0.5, scale=8, var=0.12, coat=0.3)
    red = pbr('rouge', '#8e1520', 0.5, scale=8, var=0.12, coat=0.3)
    wire = pbr('grillage', '#5d6066', 0.35, metal=1.0, bump=0)
    bpy.ops.mesh.primitive_cylinder_add(vertices=n, radius=r + 0.4, depth=h, location=(0, cy, h / 2))
    plat = bpy.context.object
    plat.rotation_euler.z = math.pi / n
    plat.data.materials.append(base)
    bpy.ops.mesh.primitive_cylinder_add(vertices=n, radius=r + 0.35, depth=0.04, location=(0, cy, h + 0.02))
    t = bpy.context.object
    t.rotation_euler.z = math.pi / n
    t.data.materials.append(canvas)
    import bmesh
    from mathutils import Matrix
    corners = [Vector((r * math.cos(2 * math.pi * i / n + math.pi / n), cy + r * math.sin(2 * math.pi * i / n + math.pi / n), 0)) for i in range(n)]
    for i in range(n):
        a, b = corners[i], corners[(i + 1) % n]
        cyl(0.09, fh + 0.15, (a.x, a.y, h + (fh + 0.15) / 2), pad, name='cage-poteau')
        mid, d = (a + b) / 2, b - a
        size = max(d.length, fh) * 1.5
        cells = int(size / (0.12 if QUICK else 0.075))
        bpy.ops.mesh.primitive_grid_add(x_subdivisions=cells, y_subdivisions=cells, size=size, location=(mid.x, mid.y, h + fh / 2 + 0.1))
        g = bpy.context.object
        g.name = 'cage-grillage'
        bm = bmesh.new()
        bm.from_mesh(g.data)
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.radians(45), 3, 'Z'))
        bm.to_mesh(g.data)
        bm.free()
        g.rotation_euler = (math.pi / 2, 0, math.atan2(d.y, d.x))
        wm = g.modifiers.new('w', 'WIREFRAME')
        wm.thickness = 0.006
        g.data.materials.append(wire)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(mid.x, mid.y, h + fh / 2 + 0.1))
        cut = bpy.context.object
        cut.name = 'cage-plan'
        cut.scale = (d.length, 0.4, fh - 0.2)
        cut.rotation_euler.z = math.atan2(d.y, d.x)
        bo = g.modifiers.new('cut', 'BOOLEAN')
        bo.operation = 'INTERSECT'
        bo.object = cut
        cut.hide_render = True
        rod((a.x, a.y, h + fh + 0.05), (b.x, b.y, h + fh + 0.05), 0.08, red, name='cage-haut')
        rod((a.x, a.y, h + 0.12), (b.x, b.y, h + 0.12), 0.09, pad, name='cage-bas')
    # cold LED panels above the cage, linear LED lines on the walls
    for x, y in ((-1.6, cy - 1.6), (1.6, cy - 1.6), (-1.6, cy + 1.6), (1.6, cy + 1.6), (0, cy)):
        box((1.2, 1.2, 0.05), (x, y, 5.4), glow('led', '#eaf1ff', 12), name='panneau')
        area((x, y, 5.35), (x, y, 0), 260, 1.2, '#eef3ff')
    for k in range(-4, 5):
        box((0.04, 0.03, 3.4), (k * 2.2, 14.97, 2.4), glow('ligne', '#9fc0ff', 4), name='led-mur')
        box((0.03, 0.04, 3.4), (9.97, k * 2.6, 2.4), glow('ligne', '#9fc0ff', 4), name='led-mur')
        box((0.03, 0.04, 3.4), (-9.97, k * 2.6, 2.4), glow('ligne', '#9fc0ff', 4), name='led-mur')
    # a red band along the walls at 1 m
    box((20, 0.03, 0.12), (0, 14.98, 1.0), pbr('bande', '#7a1119', 0.5), name='bande')
    # light over the training area (the coach): two long soft boxes
    for x in (-2.4, 2.4):
        box((0.3, 3.2, 0.06), (x, 0, 5.4), glow('led', '#eaf1ff', 10), name='panneau')
        area((x, 0, 5.35), (x, 0, 0), 200, 0.3, '#f2f6ff', shape='RECTANGLE', size_y=3.2)
    for y in (-5, -9):
        for x in (-3, 0, 3):
            box((1.0, 1.0, 0.05), (x, y, 5.4), glow('led', '#eaf1ff', 10), name='panneau')
            area((x, y, 5.35), (x, y, 0), 90, 1.0, '#eef3ff')
    leather = pbr('vinyle', '#151515', 0.35, scale=10, var=0.2, bump=0.08, coat=0.35)
    band = pbr('sangle', '#7a1119', 0.5, scale=20, var=0.1)
    chain = pbr('chaine', '#6a6c70', 0.35, metal=1.0, bump=0)
    bags = []
    for i, (x, y) in enumerate(((-7.0, -3.0), (-7.0, 0.6), (-7.0, 4.0), (7.0, -3.0), (7.0, 0.6), (7.0, 4.0))):
        bags.append(('sac-noir', heavy_bag(f'sac{i}', x, y, 2.35, 1.5, 0.19, leather, band, chain)))
    # 1.27 equipment of a complete fight gym, along the walls
    # grappling dummies: one on its back on the mats by the cage, one sitting against the left wall
    with at(-5.4, 5.6, 0, 0.5):
        EQ.dummy('couche', '#2a2a2c', '#3a3a3c')
    with at(-9.55, 8.4, 0, math.pi / 2):
        EQ.dummy('assis', '#5a1418', '#2a2a2c')
    # shelves on the right wall: MMA gloves, shin guards, headgear
    with at(9.62, 7.4, 0, -math.pi / 2):
        lv = EQ.shelf(2.6, 0.45, (0.42, 0.92, 1.42), c='#1d1d1f')
        for k in range(4):
            with at(-0.96 + k * 0.64, 0, lv[2]):
                EQ.mma_glove_pair(['#141414', '#7a1119', '#141414', '#2a2d33'][k], ['#f2f2f0', '#141414', '#7a1119', '#f2f2f0'][k])
        for k in range(4):
            for sx in (-1, 1):
                with at(-0.96 + k * 0.64 + sx * 0.08, 0, lv[1]):
                    EQ.shin_guard(['#141414', '#141414', '#7a1119', '#2a2d33'][k], '#f2f2f0' if k % 2 else '#7a1119')
        for k in range(3):
            with at(-0.8 + k * 0.8, 0, lv[0]):
                EQ.headgear(['#141414', '#7a1119', '#141414'][k], '#0a0a0a')
    # focus mitts and Thai pads on a low rack
    with at(9.62, 11.2, 0, -math.pi / 2):
        lv = EQ.shelf(1.8, 0.45, (0.42, 0.92), c='#1d1d1f')
        for k in range(4):
            with at(-0.66 + k * 0.44, 0, lv[1]):
                EQ.focus_mitt('#141414', '#7a1119')
        for k in range(3):
            with at(-0.55 + k * 0.55, 0, lv[0]):
                EQ.thai_pad('#141414', '#7a1119')
    # strike shields standing against the right wall, a recovery bench
    for k in range(3):
        with at(9.72, -6.6 + k * 0.52, 0, -math.pi / 2):
            EQ.kick_shield('#141414' if k != 1 else '#7a1119', '#7a1119' if k != 1 else '#141414')
    with at(9.45, -2.2, 0, -math.pi / 2):
        EQ.bench(1.6)
    # conditioning corner on the left: battle ropes, kettlebells, medicine balls
    with at(-9.96, -7.4, 0, math.pi / 2):
        EQ.battle_ropes(5.0)
    for k, r_ in enumerate((0.09, 0.1, 0.11, 0.12, 0.13)):
        with at(-9.5, 1.8 + k * 0.42):
            EQ.kettlebell(r_, '#1b1b1c', ['#c9a24a', '#2a5db0', '#7a1119', '#2a8a4a', '#e8e8e8'][k])
    for k, c in enumerate(('#2a2a2c', '#5a1418', '#1d2a3a')):
        with at(-9.45, -1.6 + k * 0.5):
            EQ.medicine_ball(0.16 + 0.015 * k, c)
    # round timer above the cage, two posters, a clock
    with at(0, 14.9, 3.9):
        EQ.wall_timer(1.5, '05:00')
    for k, (x, pal) in enumerate(((-6.6, ('#141519', '#e8e4da', '#7a1119')), (6.6, ('#7a1119', '#141414', '#e8e4da')))):
        with at(x, 14.97, 1.6):
            EQ.picture(EQ.poster_png(f'affiche-mma-{k}', 50 + k, pal), 0.7, 1.05, name='affiche')
    with at(-9.97, 11.8, 2.6, math.pi / 2):
        EQ.wall_clock(0.26)
    sc.world.node_tree.nodes['Background'].inputs[1].default_value = 0.3
    return sc, bags, {'key': '#f4f7ff', 'mist': (7, 28), 'haze': '#141a24'}


def kickboxing():
    """a kick-boxing gym at night: black mats with a red border, big windows on the city at the back, red LED lines,
    rows of heavy bags on both sides"""
    sc = reset()
    ceil = pbr('plafond', '#101012', 0.9, scale=2)
    # 1.27: combat tatami (no tiles), a red tatami band round the training area
    floor = EQ.floor_mat('tatami-kb', '#19191b', 'tatami', tile=(2.0, 1.0), seam=0.0015, rough=0.72)
    room_shell(9, 12, 4.8, floor, lambda ax: pbr('enduit', '#2e2f33', 0.9, scale=1.4, var=0.3, bump=0.25, axes=ax), ceil)
    red = EQ.floor_mat('tatami-kb-rouge', '#701219', 'tatami', tile=(2.0, 1.0), seam=0.0015, rough=0.72)
    for sx in (-1, 1):
        box((1.0, 14, 0.012), (sx * 4.5, 0, 0.006), red)
        box((10, 1.0, 0.012), (0, sx * 7.5, 0.006), red)
    # back wall: three tall windows on a city at night (far lights out of focus, a deep blue sky); the solid wall of
    # the shell is replaced by pieces around the openings
    wallm = bpy.data.objects['mur-fond'].data.materials[0]
    bpy.data.objects.remove(bpy.data.objects['mur-fond'], do_unlink=True)
    box((18, 0.2, 1.28), (0, 12.1, 0.64), wallm, name='mur-fond')
    box((18, 0.2, 0.88), (0, 12.1, 4.36), wallm, name='mur-fond')
    for x0, x1 in ((-9, -6.8), (-3.2, -1.8), (1.8, 3.2), (6.8, 9)):
        box((x1 - x0, 0.2, 2.64), ((x0 + x1) / 2, 12.1, 2.6), wallm, name='mur-fond')
    for x in (-5, 0, 5):
        for k in range(5):
            box((0.06, 0.08, 2.7), (x - 1.8 + k * 0.9, 11.93, 2.6), pbr('menuiserie', '#0b0b0c', 0.4))
        box((3.7, 0.1, 0.08), (x, 11.93, 1.28), pbr('menuiserie', '#0b0b0c', 0.4))
        box((3.7, 0.1, 0.08), (x, 11.93, 3.92), pbr('menuiserie', '#0b0b0c', 0.4))
    box((30, 0.1, 8), (0, 16, 2.0), glow('ciel', '#0b1730', 1.3), name='ciel')
    import random
    rnd = random.Random(7)
    for _ in range(140):
        sphere(rnd.uniform(0.02, 0.06), (rnd.uniform(-9, 9), rnd.uniform(14, 15.8), rnd.uniform(0.3, 2.6)), glow('ville', rnd.choice(['#ffcf8a', '#ffd9a8', '#9fc4ff', '#ff9a6a']), rnd.uniform(3, 9)))
    # red LED lines along the ceiling edges, white linear lights over the floor
    for x in (-8.9, 8.9):
        box((0.04, 23, 0.04), (x, 0, 4.7), glow('led-rouge', '#ff2b3a', 6), name='led')
    for y in (11.9,):
        box((17.8, 0.04, 0.04), (0, y, 4.7), glow('led-rouge', '#ff2b3a', 6), name='led')
    for x in (-2.5, 2.5):
        for y in (-6, 0, 6):
            box((0.2, 2.6, 0.05), (x, y, 4.75), glow('tube', '#f3f1ea', 9), name='tube')
            area((x, y, 4.7), (x, y, 0), 150, 0.2, '#f6f2ea', shape='RECTANGLE', size_y=2.6)
    # 1.27 equipment of a striking gym, along the walls
    # protective gear rack on the right wall: gloves, headgear and shin guards, mitts
    with at(8.72, -3.0, 0, -math.pi / 2):
        lv = EQ.shelf(3.6, 0.42, (0.42, 0.92, 1.42), c='#1d1d1f')
        for k in range(6):
            with at(-1.5 + k * 0.6, -0.02, lv[2]):
                EQ.glove_pair(['#7a1018', '#101010', '#1a2f6b', '#7a1018', '#101010', '#6b6b6b'][k], '#f2f2f0' if k % 2 else '#101010')
        for k in range(3):
            with at(-1.3 + k * 0.6, 0, lv[1]):
                EQ.headgear(['#7a1018', '#101010', '#1a2f6b'][k])
        for k in range(3):
            for sx in (-1, 1):
                with at(0.4 + k * 0.45 + sx * 0.08, 0, lv[1]):
                    EQ.shin_guard(['#f2f2f0', '#101010', '#7a1018'][k], '#7a1018' if k != 2 else '#f2f2f0')
        for k in range(6):
            with at(-1.45 + k * 0.58, 0, lv[0]):
                EQ.focus_mitt('#101010' if k % 2 else '#7a1018', '#f2f2f0')
    # resistance bands on the right wall, an interval timer high on the left wall
    with at(8.98, 3.6, 0, -math.pi / 2):
        EQ.resistance_bands(['#b3122a', '#1d3a8c', '#141414', '#2a8a4a', '#e8c21a'], top=1.85)
    with at(-8.9, -1.0, 3.2, math.pi / 2):
        EQ.wall_timer(1.3, '01:45', c='#3dff6a')
    # pads and strike shields on the left wall
    with at(-8.72, -6.6, 0, math.pi / 2):
        lv = EQ.shelf(1.8, 0.42, (0.42, 0.92), c='#1d1d1f')
        for k in range(3):
            with at(-0.55 + k * 0.55, 0, lv[1]):
                EQ.thai_pad('#101010' if k != 1 else '#7a1018', '#7a1018' if k != 1 else '#101010')
        for k in range(3):
            with at(-0.55 + k * 0.55, 0, lv[0]):
                EQ.focus_mitt('#101010', '#7a1018')
    for k in range(3):
        with at(-8.82, -8.6 + k * 0.5, 0, math.pi / 2):
            EQ.kick_shield('#101010' if k != 1 else '#7a1018', '#7a1018' if k != 1 else '#101010')
    # free-standing bags and a kicking target on its stand
    for sx in (-1, 1):
        with at(sx * 7.5, 5.6):
            EQ.freestanding_bag('#141414', '#1d1d1f', '#7a1119' if sx < 0 else '#f2f2f0')
    with at(7.5, -8.6, 0, -0.8):
        EQ.kick_target_stand('#7a1018')
    # agility ladder and cones along the left wall, in front
    with at(-7.9, -6.0, 0.0, 0):
        EQ.agility_ladder(4.0)
    with at(-6.9, -10.6, 0, math.pi / 2):
        EQ.cones(5, step=0.65)
    # a speed-ball platform on the left
    box((0.9, 0.9, 0.06), (-8.5, 5, 2.4), pbr('plateforme', '#3a2a1c', 0.5, kind='planks', scale=3))
    sphere(0.12, (-8.3, 5, 2.18), pbr('poire', '#6b1218', 0.35, scale=10, coat=0.4))
    # posters on the side walls
    for k, (x, y, rz, pal) in enumerate(((-8.98, 2.6, math.pi / 2, ('#141519', '#e8e4da', '#b3122a')), (8.98, 6.4, -math.pi / 2, ('#b3122a', '#141414', '#e8e4da')))):
        with at(x, y, 1.5, rz):
            EQ.picture(EQ.poster_png(f'affiche-kb-{k}', 70 + k, pal), 0.6, 0.9, name='affiche')
    leather = pbr('vinyle', '#141414', 0.35, scale=10, var=0.2, bump=0.08, coat=0.35)
    band = pbr('sangle', '#7a1119', 0.5, scale=20, var=0.1)
    chain = pbr('chaine', '#6a6c70', 0.35, metal=1.0, bump=0)
    leather_red = pbr('vinyle-rouge', '#6e1219', 0.35, scale=10, var=0.2, bump=0.08, coat=0.35)
    bags = []
    for i, (x, y) in enumerate(((-6.6, -4.0), (-6.6, -0.8), (-6.6, 2.4), (6.6, -4.0), (6.6, -0.8), (6.6, 2.4), (-3.6, 7.6), (3.6, 7.6))):
        m = leather_red if i in (1, 4, 6) else leather
        bags.append(('sac-rouge' if m is leather_red else 'sac-noir', heavy_bag(f'sac{i}', x, y, 2.35, 1.5, 0.19, m, band, chain)))
    sc.world.node_tree.nodes['Background'].inputs[1].default_value = 0.3
    return sc, bags, {'key': '#f6f2ea', 'haze': '#1a1012'}


def muaythai():
    """a Thai camp at night: open shed with a wooden frame and a tin roof, a ring with wrapped ropes at the back, warm
    hanging bulbs, long Thai bags, dark tropical vegetation all around"""
    sc = reset()
    concrete = pbr('beton', '#4a4038', 0.85, scale=1.2, var=0.35, bump=0.3)
    box((40, 40, 0.1), (0, 0, -0.05), concrete, name='sol')
    # 1.27: one thick training mat under the coach (canvas cover, rounded edges), no tiles
    box((7, 7, 0.05), (0, 0, 0.025), EQ.floor_mat('tapis-mt', '#1f2a3d', 'toile', tile=(20.0, 20.0), seam=0.0, rough=0.8), bevel=0.02, name='tapis')
    wood = pbr('bois', '#4a3020', 0.6, kind='planks', axes='yz', scale=4, var=0.35, bump=0.3)
    beam = pbr('poutre', '#3a2618', 0.65, kind='planks', axes='xz', scale=4, var=0.35, bump=0.3)
    tin = pbr('tole', '#2b2a28', 0.5, metal=0.7, scale=2, var=0.4, bump=0.2)
    # frame: posts every 4 m on a 16 x 20 m shed, beams, a sloped tin roof
    # 1.27: the shed is 5 m longer and the ring stands 3 m further back (« le ring présente des défauts »: 4 m behind
    # the coach, its ropes filled the picture and tore); a plank wall closes the back, where the camp hangs its
    # belts, posters, fans and clock
    for x in (-8, -4, 0, 4, 8):
        for y in (-10, -5, 0, 5, 10, 15):
            if abs(x) == 8 or y in (-10, 15):
                box((0.22, 0.22, 4.6), (x, y, 2.3), wood, 0.01)
    for y in (-10, -5, 0, 5, 10, 15):
        box((16.4, 0.22, 0.3), (0, y, 4.55), beam, 0.01)
    for x in (-8, 8):
        box((0.22, 25.4, 0.3), (x, 2.5, 4.55), beam, 0.01)
    for sx in (-1, 1):
        r = box((8.8, 26, 0.03), (sx * 4.3, 2.5, 5.3), tin, name='toit')
        r.rotation_euler.y = sx * math.radians(-12)
    box((0.3, 26, 0.3), (0, 2.5, 6.2), beam)
    planks = pbr('planches', '#3e2a1c', 0.7, kind='planks', axes='xz', brick=(2.4, 0.18, 0.006), scale=4, var=0.35, bump=0.3)
    box((16, 0.08, 3.3), (0, 15.05, 1.65), planks, name='mur-fond')
    # ring at the back, ropes wrapped in red, white and blue cloth
    canvas = pbr('toile', '#a8946f', 0.9, scale=14, var=0.15, bump=0.06)
    apron = pbr('jupe', '#5a1a16', 0.75, scale=8, var=0.2)
    wr = [pbr('drap-rouge', '#9a1c22', 0.7, scale=20, var=0.15), pbr('drap-blanc', '#ddd6c8', 0.7, scale=20, var=0.1), pbr('drap-bleu', '#1d3a8a', 0.7, scale=20, var=0.15)]
    red = pbr('coin-rouge', '#9e1622', 0.5, scale=10, var=0.12)
    blue = pbr('coin-bleu', '#183a8c', 0.5, scale=10, var=0.12)
    white = pbr('coin-blanc', '#d8d6d0', 0.5, scale=10, var=0.1)
    steel = pbr('acier', '#8a8c90', 0.35, metal=1.0, var=0.1, bump=0.0)
    ring(0, 9.6, 5.2, 0.7, 0.0, (red, white, blue, white), None, canvas, apron, steel, n_ropes=4, wrap=wr)
    # hanging bulbs with their cables (warm), two over the ring
    cable = pbr('cable', '#0c0c0c', 0.6, bump=0)
    bulb = glow('ampoule', '#ffb766', 40)
    for x, y in ((-3, -3), (3, -3), (-3, 2), (3, 2), (0, -6.5), (-5.5, -7.5), (5.5, -7.5), (-1.5, 9.6), (1.5, 9.6), (-5.6, 4.5), (5.6, 4.5)):
        z = 3.1 + 0.25 * math.sin(x * 1.7 + y)
        sphere(0.06, (x, y, z), bulb, name='ampoule')
        rod((x, y, z + 0.06), (x, y, 4.45), 0.005, cable, verts=6, name='fin-cable')
        point((x, y, z - 0.02), 260, '#ffb35c', 0.05)
    # two caged work lights over the mats, two over the ring
    for x, y, k in ((-1.5, 0, 260), (1.5, 0, 260), (-1.6, 9.6, 300), (1.6, 9.6, 300)):
        area((x, y, 4.3), (x, y, 0), k, 0.6, '#ffcf96')
        box((0.5, 0.3, 0.08), (x, y, 4.36), glow('lampe', '#ffd9a8', 8), name='lampe')
    # moonlight from outside, and dark vegetation around the shed
    bpy.ops.object.light_add(type='SUN', location=(0, 0, 10))
    sun = bpy.context.object
    sun.data.energy = 0.25
    sun.data.color = hexrgb('#7d95c8')
    sun.rotation_euler = (math.radians(50), 0, math.radians(30))
    import random
    rnd = random.Random(11)
    leaf = [pbr('feuille', c, 0.6, scale=6, var=0.4, bump=0.5) for c in ('#1c2a16', '#18240f', '#233019')]
    for _ in range(90):
        a = rnd.uniform(0, 2 * math.pi)
        r = rnd.uniform(13, 19)
        # 1.27: round the longer shed (centre 2.5 m back), never inside it; smooth foliage instead of facets
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=rnd.uniform(1.0, 2.6), location=(r * math.cos(a), 2.5 + 1.15 * r * math.sin(a), rnd.uniform(0.4, 3.2)))
        o = bpy.context.object
        bpy.ops.object.shade_smooth()
        o.scale = (1, 1, rnd.uniform(0.6, 1.2))
        d = o.modifiers.new('d', 'DISPLACE')
        t = bpy.data.textures.new('n', 'CLOUDS')
        t.noise_scale = 0.5
        d.texture = t
        d.strength = 0.6
        o.data.materials.append(rnd.choice(leaf))
    for _ in range(14):
        a = rnd.uniform(0, 2 * math.pi)
        r = rnd.uniform(14, 18)
        x, y = r * math.cos(a), 2.5 + 1.15 * r * math.sin(a)
        rod((x, y, 0), (x + rnd.uniform(-1, 1), y + rnd.uniform(-1, 1), rnd.uniform(6, 9)), 0.18, pbr('palmier', '#2a2118', 0.8, scale=8, var=0.4, bump=0.5))
    # long Thai bags (red and black), hanging along the sides
    red_b = pbr('cuir-rouge', '#701419', 0.45, scale=12, var=0.25, bump=0.12, coat=0.2)
    black_b = pbr('cuir-noir', '#1a1716', 0.45, scale=12, var=0.25, bump=0.12, coat=0.2)
    band = pbr('sangle', '#d8cfbf', 0.6, scale=20, var=0.1)
    chain = pbr('chaine', '#6a6c70', 0.35, metal=1.0, bump=0)
    bags = []
    for i, (x, y) in enumerate(((-6.2, -3.5), (-6.2, -0.5), (-6.2, 2.5), (6.2, -3.5), (6.2, -0.5), (6.2, 2.5))):
        m = red_b if i % 2 == 0 else black_b
        bags.append(('sac-thai-rouge' if m is red_b else 'sac-thai-noir', heavy_bag(f'sac{i}', x, y, 2.45, 1.8, 0.17, m, band, chain)))
    # 1.27 equipment of a Thai camp
    # a long bench on the left: Thai pads, stacked shin guards, focus mitts, wraps, water bottles
    with at(-7.2, 6.4, 0, math.pi / 2):
        EQ.wooden_bench(2.8, '#4a3020')
        for k in range(3):
            with at(-1.1 + k * 0.3, 0, 0.455):
                EQ.thai_pad(['#9a1c22', '#1a1716', '#1d3a8a'][k], '#d8cfbf', lying=False)
        for k in range(3):
            with at(-0.15 + k * 0.05, 0.02, 0.455 + k * 0.06):
                before = set(bpy.data.objects)
                EQ.shin_guard(['#9a1c22', '#1a1716', '#ddd6c8'][k])
                EQ.tilt(before, rx=math.pi / 2, about=(0, 0, 0.05))
        with at(0.55, 0, 0.455):
            EQ.focus_mitt('#9a1c22', '#ddd6c8')
        with at(0.85, 0.02, 0.455):
            EQ.wraps_roll('#9a1c22')
        with at(0.95, -0.05, 0.455):
            EQ.wraps_roll('#ddd6c8')
        for k in range(3):
            with at(1.1 + k * 0.09, 0.06, 0.455):
                EQ.water_bottle(['#2f6fb5', '#e8e8e8', '#2a8a4a'][k])
    # low-kick shields leaning on the back wall, weighted ropes on a post
    for k in range(2):
        with at(-6.6 + k * 0.5, 14.92, 0, 0):
            EQ.low_kick_shield(['#9a1c22', '#1a1716'][k], '#ddd6c8')
    with at(-7.86, 0.0, 0, math.pi / 2):
        EQ.jump_ropes(['#1a1716', '#9a1c22', '#1a1716'], spacing=0.06, top=1.9)
    # the back wall: championship belts, trophies on a shelf, posters, a clock, wall fans
    for k, x in enumerate((-4.6, -3.2)):
        with at(x, 14.99, 2.3):
            EQ.champion_belt('#1a1716' if k else '#9a1c22')
    with at(4.6, 14.95, 0):
        box((1.8, 0.3, 0.04), (0, -0.15, 2.05), pbr('etagere', '#3a2618', 0.55, kind='planks', scale=4))
        for k in range(4):
            with at(-0.65 + k * 0.43, -0.15, 2.07):
                EQ.trophy(0.32 + 0.08 * (k % 2))
    for k, x in enumerate((-1.6, 1.8)):
        with at(x, 14.99, 2.2):
            EQ.picture(EQ.poster_png(f'affiche-mt-{k}', 90 + k, (('#e0c27a', '#2a1a10', '#9a1c22'), ('#1d3a8a', '#ece4d2', '#d4af37'))[k]), 0.55, 0.82, name='affiche')
    with at(0.1, 15.0, 2.75):
        EQ.wall_clock(0.24)
    for sx in (-1, 1):
        with at(sx * 6.9, 14.98, 2.75):
            EQ.wall_fan(0.28)
        with at(sx * 7.87, 5.0, 3.2, -sx * math.pi / 2):
            EQ.wall_fan(0.26)
    sc.world.node_tree.nodes['Background'].inputs[0].default_value = (0.004, 0.006, 0.012, 1)
    return sc, bags, {'key': '#ffc98a', 'haze': '#2a180a'}


def judo():
    """a traditional dojo by day: tatami mats laid in a staggered pattern, wooden posts and low panels, shoji screens
    glowing with daylight, an alcove with a plain scroll (no writing)"""
    sc = reset()
    L, Wd, Hh = 14.0, 16.0, 3.6
    tatami = pbr('tatami', '#7b8456', 0.85, kind='planks', brick=(2.0, 1.0, 0.008), b2=0.93, scale=3, var=0.12, bump=0.12, sheen=0.3)
    edge = pbr('tatami-bord', '#a7955f', 0.85, kind='planks', brick=(2.0, 1.0, 0.008), b2=0.93, scale=3, var=0.12, bump=0.12, sheen=0.3)
    box((10, 10, 0.06), (0, 0, -0.03), tatami, name='tatami')
    for sx in (-1, 1):
        box((1.0, 12, 0.06), (sx * 5.5, 0, -0.03), edge)
        box((10, 1.0, 0.06), (0, sx * 5.5, -0.03), edge)
    floor = pbr('plancher', '#6a4a2e', 0.4, kind='planks', scale=3, var=0.3, bump=0.2, coat=0.2)
    box((L, Wd, 0.1), (0, 0, -0.11), floor, name='sol')
    dark = pbr('bois-fonce', '#3b2a1e', 0.55, kind='planks', axes='xz', scale=4, var=0.3, bump=0.2)
    wood = pbr('bois', '#6b4a2e', 0.55, kind='planks', axes='xz', scale=4, var=0.3, bump=0.2)
    paper = pbr('shoji', '#efe6d4', 0.9, scale=40, var=0.06, bump=0.02, emit='#fff1d8', emit_k=0.45)
    hx, hy = L / 2, Wd / 2
    # walls: posts every 2 m, wooden panel up to 0.9 m, shoji above, a beam on top
    for side in ('N', 'S', 'E', 'W'):
        along_x = side in ('N', 'S')
        half = hx if along_x else hy
        fixed = (hy if side == 'N' else -hy) if along_x else (hx if side == 'E' else -hx)
        n = int(half)
        for k in range(-n, n + 1, 2):
            p = (k, fixed, Hh / 2) if along_x else (fixed, k, Hh / 2)
            box((0.18, 0.18, Hh), p, dark, 0.008)
        for k in range(-n + 1, n, 2):
            if side == 'N' and k == 1:
                continue
            c = (k, fixed, 0) if along_x else (fixed, k, 0)
            sz = (1.82, 0.06, 0.9) if along_x else (0.06, 1.82, 0.9)
            box(sz, (c[0], c[1], 0.45), wood, 0.005)
            hs = (1.82, 0.04, Hh - 1.25) if along_x else (0.04, 1.82, Hh - 1.25)
            zc = 0.9 + (Hh - 1.25) / 2 + 0.05
            box(hs, (c[0], c[1], zc), paper, name='shoji')
            for g in range(1, 4):
                off = -0.91 + 1.82 * g / 4
                box((0.025, 0.07, Hh - 1.25) if along_x else (0.07, 0.025, Hh - 1.25), (c[0] + (off if along_x else 0), c[1] + (0 if along_x else off), zc), dark)
            for g in range(1, 6):
                z = 0.95 + (Hh - 1.25) * g / 6
                box((1.82, 0.07, 0.025) if along_x else (0.07, 1.82, 0.025), (c[0], c[1], z), dark)
        box((2 * half, 0.22, 0.3) if along_x else (0.22, 2 * half, 0.3), (0, fixed, Hh - 0.1) if along_x else (fixed, 0, Hh - 0.1), dark)
        # daylight behind the screens
        lp = (0, fixed * 1.25, 2.0) if along_x else (fixed * 1.25, 0, 2.0)
        area(lp, (0, 0, 1.0), 350, 2 * half, '#fff0d6', shape='RECTANGLE', size_y=2.4)
    # the alcove (tokonoma) on the back wall: 1.27 a brush circle (ensō) on its scroll, a low table
    box((1.8, 0.75, 0.2), (1, hy - 0.4, 0.1), dark, 0.01)
    box((1.84, 0.06, Hh), (1, hy + 0.05, Hh / 2), pbr('enduit', '#d8cfbf', 0.9, scale=6, var=0.08))

    def scroll(x, y, z, png, rz=0.0):
        with at(x, y, z, rz):
            EQ.picture(png, 0.46, 1.27, frame=0, name='rouleau', rough=0.85)
            box((0.56, 0.035, 0.04), (0, 0, 1.3), dark)
            box((0.56, 0.035, 0.04), (0, 0, -0.03), dark)

    scroll(1, hy - 0.03, 1.04, EQ.enso_png('enso', 5))
    # 1.27 equipment of a dojo
    # calligraphies on the back wall (« jūdō », « seiryoku zen'yō »), two portraits of masters of the past above them
    scroll(-0.65, hy - 0.1, 1.0, EQ.kanji_png('kanji-judo', '柔道', 7))
    scroll(5.0, hy - 0.1, 1.0, EQ.kanji_png('kanji-seiryoku', '精力善用', 9))
    for k, x in enumerate((3.2, 6.1)):
        with at(x, hy - 0.1, 2.35):
            EQ.picture(EQ.portrait_png(f'portrait-{k}', 11 + k), 0.36, 0.46, frame_c='#2a1a10', frame=0.035, name='portrait')
    # belts of every grade on a board, left of the alcove
    with at(-3.6, hy - 0.1, 0):
        EQ.belt_board(['#f4f3ee', '#e8c21a', '#e07a1a', '#2a8a4a', '#1d4fb0', '#5a3a22', '#141414', ('#b3122a', '#f4f3ee'), '#b3122a'], w=2.6)
    # judogi on a rack (left), throwing dummies (right), uchikomi bands on the right wall posts
    rail = pbr('portant', '#2a2a2c', 0.4, metal=0.8, bump=0)
    with at(-6.1, -3.2, 0, math.pi / 2):
        for sx in (-1, 1):
            rod((sx * 1.1, 0, 0), (sx * 1.1, 0, 1.72), 0.016, rail)
            box((0.05, 0.5, 0.03), (sx * 1.1, 0, 0.015), rail)
        rod((-1.1, 0, 1.7), (1.1, 0, 1.7), 0.014, rail)
        for k in range(4):
            with at(-0.78 + k * 0.52, 0, 0.08):
                EQ.gi_hanging(['#f4f3ee', '#1b3f8b', '#f4f3ee', '#f4f3ee'][k], ['#141414', '#141414', '#5a3a22', '#1d4fb0'][k])
    with at(5.7, -4.4, 0, -math.pi / 2 + 0.4):
        EQ.dummy('debout', '#c9b48a', '#b39a6e')
    with at(5.2, 3.0, 0, -0.6):
        EQ.dummy('couche', '#3a2a20', '#2a2018')
    for y in (-2, 0, 2):
        with at(6.9, y, 0, -math.pi / 2):
            EQ.uchikomi_bands('#b3122a' if y else '#141414', top=1.5)
    # spare tatami stacked, a technique board on its easel
    with at(-5.9, 5.9, 0, 0.12):
        EQ.tatami_stack(6, tatami)
    with at(-5.6, 2.2, 0, math.pi / 2 - 0.35):
        before = set(bpy.data.objects)
        EQ.whiteboard(EQ.board_png('tableau-judo', 13), 1.2, 0.8, z=0.95)
        EQ.tilt(before, rx=-0.12, about=(0, 0, 0))
        for sx in (-1, 1):
            rod((sx * 0.5, 0.05, 0), (sx * 0.45, -0.02, 1.85), 0.018, dark)
        rod((0, 0.05, 1.85), (0, 0.5, 0), 0.018, dark)
    # wooden benches and a shoe rack (sandals) along the entrance wall
    for x in (-0.6, 2.4):
        with at(x, -hy + 0.35, 0, math.pi):
            EQ.wooden_bench(2.2, '#5a3a22')
    with at(-4.6, -hy + 0.3, 0, math.pi):
        box((1.8, 0.36, 0.04), (0, 0, 0.42), dark)
        box((1.8, 0.36, 0.04), (0, 0, 0.12), dark)
        for sx in (-1, 1):
            box((0.04, 0.36, 0.46), (sx * 0.88, 0, 0.23), dark)
        for k in range(4):
            with at(-0.62 + k * 0.42, 0, 0.44):
                EQ.zori_pair(['#2a2a2a', '#7a1018', '#1d3a8c', '#2a2a2a'][k])
        for k in range(3):
            with at(-0.5 + k * 0.5, 0, 0.14):
                EQ.zori_pair('#2a2a2a')
    # ceiling: wooden boards and beams
    box((L, Wd, 0.06), (0, 0, Hh + 0.2), pbr('plafond', '#5a3f28', 0.7, kind='planks', scale=3, var=0.3, bump=0.1))
    for k in range(-3, 4):
        box((L, 0.18, 0.24), (0, k * 2.2, Hh + 0.05), dark)
    # soft light from the ceiling
    for x in (-3, 3):
        for y in (-3, 3):
            area((x, y, Hh), (x, y, 0), 120, 2.0, '#fff4e4')
    sc.world.node_tree.nodes['Background'].inputs[0].default_value = (0.6, 0.55, 0.45, 1)
    sc.world.node_tree.nodes['Background'].inputs[1].default_value = 0.4
    return sc, [], {'key': '#fff4e4', 'haze': '#3a2c1e'}


def bjj():
    """a modern jiu-jitsu academy: grey mats with a black border (the blue gi stands out on them), padded black walls, a rack of belts on the wall,
    bright ceiling panels"""
    sc = reset()
    # 1.27: grappling tatami (pressed surface, faint joints), no tiles
    mats_ = EQ.floor_mat('tatami-jjb', '#62666e', 'tatami', tile=(2.0, 1.0), seam=0.0015, rough=0.74)
    border = EQ.floor_mat('tatami-jjb-noir', '#141517', 'tatami', tile=(2.0, 1.0), seam=0.0015, rough=0.74)
    ceil = pbr('plafond', '#1a1c1f', 0.9, scale=2)
    room_shell(9, 11, 4.2, border, lambda ax: pbr('mur', '#5a5d62', 0.9, scale=1.4, var=0.25, bump=0.15, axes=ax), ceil)
    box((14, 18, 0.03), (0, 0, 0.015), mats_, name='tapis')
    # padded walls up to 1.6 m (black, vertical seams), a blue line above
    for side in ('N', 'S', 'E', 'W'):
        along_x = side in ('N', 'S')
        fixed = (10.95 if side == 'N' else -10.95) if along_x else (8.95 if side == 'E' else -8.95)
        span = 18 if along_x else 22
        pad = pbr('mousse', '#141416', 0.55, kind='brick', brick=(1.0, 1.6, 0.01), b2=0.95, axes='xz' if along_x else 'yz', scale=6, var=0.1, bump=0.3, coat=0.25)
        box((span, 0.1, 1.6) if along_x else (0.1, span, 1.6), (0, fixed, 0.8) if along_x else (fixed, 0, 0.8), pad)
        box((span, 0.04, 0.08) if along_x else (0.04, span, 0.08), (0, fixed * 0.998, 1.7) if along_x else (fixed * 0.998, 0, 1.7), pbr('ligne', '#2a5db0', 0.5))
    # belt rack on the back wall: white, blue, purple, brown, black belts hanging
    rack = pbr('support', '#2a2a2c', 0.4, metal=0.8, bump=0)
    box((3.2, 0.12, 0.06), (-3, 10.85, 2.4), rack)
    for k, c in enumerate(['#e9e6df', '#1d4fb0', '#5b2a8c', '#5a3a22', '#141414'] * 2):
        x = -4.4 + k * 0.32
        box((0.045, 0.012, 1.05), (x, 10.83, 1.88), pbr(f'ceinture{k % 5}', c, 0.7, scale=30, var=0.1))
        box((0.05, 0.014, 0.12), (x, 10.825, 1.45), pbr('barrette', '#111111' if c != '#141414' else '#9e1622', 0.6))
    # stacked crash mats and kettlebells along the right wall
    for k in range(4):
        box((1.2, 2.0, 0.15), (7.9, 6.5, 0.08 + k * 0.155), pbr('matelas', ['#6a6e75', '#121315'][k % 2], 0.7, scale=5, var=0.1), 0.03)
    for k in range(5):
        sphere(0.12 + 0.015 * k, (8.2, -6 + k * 0.45, 0.13 + 0.015 * k), pbr('fonte', '#1b1b1c', 0.45, metal=0.5, scale=10, var=0.2))
    # LED panels
    for x in (-4.5, 0, 4.5):
        for y in (-7, -2.5, 2, 6.5):
            box((1.2, 1.2, 0.04), (x, y, 4.15), glow('led', '#f3f6ff', 5), name='panneau')
            area((x, y, 4.1), (x, y, 0), 110, 1.2, '#f3f6ff')
    # 1.27 equipment of a grappling academy
    # submission dummies: on its back on the mats, sitting against the left wall
    with at(5.4, 8.4, 0, 0.35):
        EQ.dummy('couche', '#1d2a44', '#141414')
    with at(-8.78, 6.2, 0, math.pi / 2):
        EQ.dummy('assis', '#141414', '#2a2a2c')
    # folded kimonos and rashguards on shelves (left wall)
    with at(-8.7, -1.6, 0, math.pi / 2):
        lv = EQ.shelf(2.6, 0.42, (0.42, 0.92, 1.42), c='#2a2a2c')
        gis = [['#f2f0ea'] * 4, ['#1d3f8b'] * 3, ['#17181c'] * 4]
        for j, z in enumerate(lv[1:]):
            for k in range(3):
                with at(-0.85 + k * 0.85, 0, z):
                    EQ.folded_stack(gis[(k + j) % 3][: 3 + (k + j) % 2])
        for k in range(4):
            with at(-0.96 + k * 0.64, 0, lv[0]):
                EQ.folded_stack([['#b3122a', '#17181c'], ['#1d3f8b', '#17181c', '#1d3f8b'], ['#17181c', '#e8e8e8'], ['#5b2a8c', '#17181c']][k], w=0.3, d=0.24, t=0.035)
    # foam rollers, mobility balls and medicine balls along the right wall
    for k, c in enumerate(('#1d3f8b', '#17181c', '#b3122a', '#17181c', '#2a8a4a')):
        with at(8.45, 1.0 + k * 0.2):
            EQ.foam_roller(c)
    for k, (y, r_, c) in enumerate(((-1.6, 0.32, '#1d3f8b'), (-2.4, 0.28, '#17181c'))):
        with at(8.3, y):
            EQ.swiss_ball(r_, c)
    for k, c in enumerate(('#2a2a2c', '#5a1418', '#1d2a3a')):
        with at(8.45, 3.2 + k * 0.45):
            EQ.medicine_ball(0.15, c)
    # bench and shoe cubbies by the entrance (front wall)
    with at(-5.6, -10.6, 0, math.pi):
        EQ.wooden_bench(2.2, '#3a3a3c')
    with at(-2.4, -10.72, 0, math.pi):
        cells = EQ.cubbies(4, 2, c='#2a2a2c')
        for k, (x, z) in enumerate(cells):
            if k % 3 != 2:
                with at(x, 0, z):
                    EQ.shoe_pair(['#17181c', '#f2f0ea', '#1d3f8b', '#b3122a'][k % 4])
    # technique board and competition posters on the back wall (above the padding)
    with at(3.4, 10.88, 0):
        EQ.whiteboard(EQ.board_png('tableau-jjb', 17), 1.8, 1.1, z=1.8)
    for k, x in enumerate((0.7, 6.5)):
        with at(x, 10.88, 1.85):
            EQ.picture(EQ.poster_png(f'affiche-jjb-{k}', 110 + k, (('#1d3f8b', '#f2f0ea', '#e8c21a'), ('#17181c', '#e8e8e8', '#b3122a'))[k]), 0.62, 0.92, name='affiche')
    # the upper walls: kimonos hanging on hooks (left), a flag of Brazil, a round timer (right)
    for k in range(5):
        with at(-8.86, 2.0 + k * 1.05, 0.55, math.pi / 2):
            EQ.gi_hanging(['#f2f0ea', '#1d3f8b', '#17181c', '#f2f0ea', '#1d3f8b'][k], ['#141414', '#5b2a8c', '#141414', '#1d4fb0', '#5a3a22'][k])
    with at(8.9, 2.0, 2.0, -math.pi / 2):
        EQ.picture(EQ.flag_png('drapeau-bresil'), 1.8, 1.26, frame=0, name='drapeau', rough=0.85)
    with at(8.88, -4.0, 2.4, -math.pi / 2):
        EQ.wall_timer(1.2, '06:00')
    with at(-2.0, -10.9, 2.3, math.pi):
        EQ.wall_clock(0.26)
    sc.world.node_tree.nodes['Background'].inputs[1].default_value = 0.3
    return sc, [], {'key': '#ffffff', 'haze': '#121722'}


ROOMS = {'boxe': boxe, 'mma': mma, 'kickboxing': kickboxing, 'muaythai': muaythai, 'judo': judo, 'bjj': bjj}


def main():
    out = Path(sys.argv[1])
    names = sys.argv[2:] or list(ROOMS)
    for name in names:
        d = out / name
        d.mkdir(parents=True, exist_ok=True)
        sc, bags, meta = ROOMS[name]()
        pano_camera(sc)
        all_objs = list(sc.objects)
        if os.environ.get('VIEWS') == '1':
            # 1.27 check pictures: ordinary photos of the room from where the training camera stands (in front of the
            # coach) and toward each side, to look at the equipment closer than the panorama shows it
            render_views(sc, d)
            print('ok', name, 'views', flush=True)
            continue
        if os.environ.get('DEPTH_ONLY') == '1':
            # only the depth picture of an existing render (the bags are not in the panorama)
            for _sprite, objs in bags:
                for ob in objs:
                    ob.hide_render = True
            render_depth(sc, d)
            print('ok', name, 'depth', flush=True)
            continue
        props = []
        done = {}
        for sprite, objs in bags:
            pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
            body = [o for o in objs if o.name.endswith('-corps')][0]
            bc = body.matrix_world.translation
            bottom = min(p.z for p in pts)
            top = min(max(p.z for p in pts), bottom + 2.6)
            if sprite not in done:
                done[sprite] = render_sprite(sc, d, sprite, objs, all_objs)
            else:
                for ob in objs:
                    ob.hide_render = True
            sz = done[sprite]
            # centre of the picture and its size in metres; the app swings it around its top (the chain)
            props.append({'sprite': sprite, 'at': to_three((bc.x, bc.y, (bottom + top) / 2)), 'w': round(sz['w'], 3), 'h': round(sz['h'], 3)})
        render_pano(sc, d)
        render_depth(sc, d)
        (d / 'salle.json').write_text(json.dumps({'room': name, 'eye': EYE, 'props': props, 'key': meta['key'], 'haze': meta['haze']}, indent=1))
        print('ok', name, flush=True)


if __name__ == '__main__':
    main()
