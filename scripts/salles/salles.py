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

QUICK = os.environ.get('QUICK') == '1'
PW, PH = (1024, 512) if QUICK else (4096, 2048)
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
    rod((x, y, z + 0.26), (x, y, top), 0.006, cable_m, verts=6, name='cable')
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


def to_three(p):
    """Blender (x, y, z), z up → three.js (x, y, z), y up (the glTF convention)"""
    return [round(p[0], 3), round(p[2], 3), round(-p[1], 3)]


# --- rooms --------------------------------------------------------------------------------------------------------


def boxe():
    """an old boxing gym: brick walls, worn wooden floor, a ring under its own lights at the back, pendant lamps,
    heavy bags on both sides"""
    sc = reset()
    floor = pbr('parquet', '#5a4029', 0.45, kind='planks', scale=3.0, var=0.3, bump=0.25, coat=0.15)
    ceil = pbr('plafond', '#141414', 0.9, scale=3)
    room_shell(9, 12, 5.2, floor, lambda ax: pbr('brique', '#6a3326', 0.85, kind='brick', scale=4, var=0.3, bump=0.4, axes=ax), ceil)
    # wainscot and a skirting
    for y, rz, L in ((12 - 0.02, 0, 18), (-12 + 0.02, 0, 18)):
        box((L, 0.06, 1.1), (0, y, 0.55), pbr('lambris', '#1e2a2e', 0.6, scale=4), 0.01)
    for x in (9 - 0.02, -9 + 0.02):
        box((0.06, 24, 1.1), (x, 0, 0.55), pbr('lambris', '#1e2a2e', 0.6, scale=4), 0.01)
    # the ring at the back
    canvas = pbr('toile', '#b9bcc2', 0.9, scale=14, var=0.12, bump=0.05)
    apron = pbr('jupe', '#1b2236', 0.75, scale=8, var=0.15)
    rope_m = pbr('corde', '#e9e7e2', 0.45, scale=30, var=0.08, bump=0.02)
    red = pbr('coin-rouge', '#9e1622', 0.5, scale=10, var=0.12)
    blue = pbr('coin-bleu', '#183a8c', 0.5, scale=10, var=0.12)
    white = pbr('coin-blanc', '#d8d6d0', 0.5, scale=10, var=0.1)
    steel = pbr('acier', '#9a9ca0', 0.3, metal=1.0, var=0.1, bump=0.0)
    ring(0, 7.0, 5.0, 0.9, 0.0, (red, white, blue, white), rope_m, canvas, apron, steel)
    # ring lights: a truss with four spots
    truss = pbr('truss', '#202224', 0.4, metal=1.0, var=0.1, bump=0)
    for x, y in ((-2.2, 4.8), (2.2, 4.8), (-2.2, 9.2), (2.2, 9.2)):
        rod((x, y, 4.6), (x, y, 5.2), 0.02, truss)
    for a, b in (((-2.2, 4.8), (2.2, 4.8)), ((2.2, 4.8), (2.2, 9.2)), ((2.2, 9.2), (-2.2, 9.2)), ((-2.2, 9.2), (-2.2, 4.8))):
        rod((*a, 4.6), (*b, 4.6), 0.04, truss)
    for x, y in ((-1.2, 5.8), (1.2, 5.8), (-1.2, 8.2), (1.2, 8.2)):
        area((x, y, 4.5), (0, 7, 0.9), 420, 0.5, '#fff1dc')
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
    for i, (x, y) in enumerate(((-6.2, -2.0), (-6.2, 1.4), (6.2, -2.0), (6.2, 1.4), (-5.4, -6.5), (5.4, -6.5))):
        m = leather_red if i % 3 == 1 else leather
        bags.append(('sac-cuir-rouge' if m is leather_red else 'sac-cuir', heavy_bag(f'sac{i}', x, y, 2.1, 1.2, 0.18, m, band, chain)))
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
    mats_ = pbr('tapis', '#1a1b1e', 0.7, scale=3, var=0.18, bump=0.05)
    ceil = pbr('plafond', '#0e0f11', 0.9, scale=2)
    room_shell(10, 13, 5.5, mats_, lambda ax: pbr('beton', '#3c3e42', 0.85, scale=1.5, var=0.35, bump=0.2, axes=ax), ceil)
    # mat seams (1 m tiles)
    seam = pbr('joint', '#0b0b0c', 0.8, bump=0)
    for k in range(-9, 10):
        box((0.012, 26, 0.004), (k, 0, 0.002), seam)
    for k in range(-12, 13):
        box((20, 0.012, 0.004), (0, k, 0.002), seam)
    # cage: octagon at the back
    n, r, h, fh = 8, 3.9, 0.6, 1.8
    cy = 8.2
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
        box((0.04, 0.03, 3.4), (k * 2.2, 12.97, 2.4), glow('ligne', '#9fc0ff', 4), name='led-mur')
        box((0.03, 0.04, 3.4), (9.97, k * 2.6, 2.4), glow('ligne', '#9fc0ff', 4), name='led-mur')
        box((0.03, 0.04, 3.4), (-9.97, k * 2.6, 2.4), glow('ligne', '#9fc0ff', 4), name='led-mur')
    # a red band along the walls at 1 m
    box((20, 0.03, 0.12), (0, 12.98, 1.0), pbr('bande', '#7a1119', 0.5), name='bande')
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
    sc.world.node_tree.nodes['Background'].inputs[1].default_value = 0.3
    return sc, bags, {'key': '#f4f7ff', 'mist': (7, 28), 'haze': '#141a24'}


def kickboxing():
    """a kick-boxing gym at night: black mats with a red border, big windows on the city at the back, red LED lines,
    rows of heavy bags on both sides"""
    sc = reset()
    ceil = pbr('plafond', '#101012', 0.9, scale=2)
    floor = pbr('tapis', '#18181a', 0.75, kind='brick', brick=(1.0, 1.0, 0.004), b2=0.9, scale=3, var=0.15, bump=0.1)
    room_shell(9, 12, 4.8, floor, lambda ax: pbr('enduit', '#2e2f33', 0.9, scale=1.4, var=0.3, bump=0.25, axes=ax), ceil)
    red = pbr('bord', '#7d151c', 0.7, kind='brick', brick=(1.0, 1.0, 0.004), b2=0.9, scale=3, var=0.15, bump=0.1)
    for sx in (-1, 1):
        box((1.0, 14, 0.012), (sx * 4.5, 0, 0.006), red)
        box((10, 1.0, 0.012), (0, sx * 7.5, 0.006), red)
    # back wall: three tall windows on a city at night (far lights out of focus, a deep blue sky)
    for x in (-5, 0, 5):
        box((3.6, 0.05, 2.6), (x, 11.97, 2.6), pbr('verre', '#05070a', 0.05, metal=0.0, var=0.05, bump=0), name='vitre')
        for k in range(5):
            box((0.06, 0.08, 2.7), (x - 1.8 + k * 0.9, 11.93, 2.6), pbr('menuiserie', '#0b0b0c', 0.4))
        box((3.7, 0.1, 0.08), (x, 11.93, 1.28), pbr('menuiserie', '#0b0b0c', 0.4))
        box((3.7, 0.1, 0.08), (x, 11.93, 3.92), pbr('menuiserie', '#0b0b0c', 0.4))
    box((20, 0.1, 4), (0, 16, 1.8), glow('ciel', '#0d1a33', 1.2), name='ciel')
    import random
    rnd = random.Random(7)
    for _ in range(140):
        sphere(rnd.uniform(0.04, 0.12), (rnd.uniform(-9, 9), rnd.uniform(14, 15.8), rnd.uniform(0.6, 3.4)), glow('ville', rnd.choice(['#ffcf8a', '#ffd9a8', '#9fc4ff', '#ff9a6a']), rnd.uniform(4, 14)))
    # red LED lines along the ceiling edges, white linear lights over the floor
    for x in (-8.9, 8.9):
        box((0.04, 23, 0.04), (x, 0, 4.7), glow('led-rouge', '#ff2b3a', 6), name='led')
    for y in (11.9,):
        box((17.8, 0.04, 0.04), (0, y, 4.7), glow('led-rouge', '#ff2b3a', 6), name='led')
    for x in (-2.5, 2.5):
        for y in (-6, 0, 6):
            box((0.2, 2.6, 0.05), (x, y, 4.75), glow('tube', '#f3f1ea', 9), name='tube')
            area((x, y, 4.7), (x, y, 0), 150, 0.2, '#f6f2ea', shape='RECTANGLE', size_y=2.6)
    # a glove shelf on the right wall (pairs of gloves as soft rounded shapes) and a speed-ball platform on the left
    shelf = pbr('etagere', '#2b2b2d', 0.5, metal=0.6, bump=0)
    box((0.35, 4.0, 0.04), (8.8, -3, 1.5), shelf)
    rnd2 = random.Random(3)
    for k in range(8):
        c = rnd2.choice(['#7a1018', '#101010', '#1a2f6b', '#6b6b6b'])
        for j in (-0.09, 0.09):
            o = sphere(0.11, (8.78, -4.7 + k * 0.48 + j, 1.64), pbr('gant', c, 0.4, scale=10, var=0.15, coat=0.3))
            o.scale = (1.0, 0.8, 1.25)
    box((0.9, 0.9, 0.06), (-8.5, 5, 2.4), pbr('plateforme', '#3a2a1c', 0.5, kind='planks', scale=3))
    sphere(0.12, (-8.3, 5, 2.18), pbr('poire', '#6b1218', 0.35, scale=10, coat=0.4))
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
    # rubber mats under the coach
    box((7, 7, 0.02), (0, 0, 0.01), pbr('tapis', '#2a2420', 0.8, kind='brick', brick=(1.0, 1.0, 0.004), b2=0.85, scale=3, var=0.2), name='tapis')
    wood = pbr('bois', '#4a3020', 0.6, kind='planks', axes='yz', scale=4, var=0.35, bump=0.3)
    beam = pbr('poutre', '#3a2618', 0.65, kind='planks', axes='xz', scale=4, var=0.35, bump=0.3)
    tin = pbr('tole', '#2b2a28', 0.5, metal=0.7, scale=2, var=0.4, bump=0.2)
    # frame: posts every 4 m on a 16 x 20 m shed, beams, a sloped tin roof
    for x in (-8, -4, 0, 4, 8):
        for y in (-10, -5, 0, 5, 10):
            if abs(x) == 8 or abs(y) == 10:
                box((0.22, 0.22, 4.6), (x, y, 2.3), wood, 0.01)
    for y in (-10, -5, 0, 5, 10):
        box((16.4, 0.22, 0.3), (0, y, 4.55), beam, 0.01)
    for x in (-8, 8):
        box((0.22, 20.4, 0.3), (x, 0, 4.55), beam, 0.01)
    for sx in (-1, 1):
        r = box((8.8, 21, 0.03), (sx * 4.3, 0, 5.3), tin, name='toit')
        r.rotation_euler.y = sx * math.radians(-12)
    box((0.3, 21, 0.3), (0, 0, 6.2), beam)
    # ring at the back, ropes wrapped in red, white and blue cloth
    canvas = pbr('toile', '#a8946f', 0.9, scale=14, var=0.15, bump=0.06)
    apron = pbr('jupe', '#5a1a16', 0.75, scale=8, var=0.2)
    wr = [pbr('drap-rouge', '#9a1c22', 0.7, scale=20, var=0.15), pbr('drap-blanc', '#ddd6c8', 0.7, scale=20, var=0.1), pbr('drap-bleu', '#1d3a8a', 0.7, scale=20, var=0.15)]
    red = pbr('coin-rouge', '#9e1622', 0.5, scale=10, var=0.12)
    blue = pbr('coin-bleu', '#183a8c', 0.5, scale=10, var=0.12)
    white = pbr('coin-blanc', '#d8d6d0', 0.5, scale=10, var=0.1)
    steel = pbr('acier', '#8a8c90', 0.35, metal=1.0, var=0.1, bump=0.0)
    ring(0, 6.6, 5.2, 0.7, 0.0, (red, white, blue, white), None, canvas, apron, steel, n_ropes=4, wrap=wr)
    # hanging bulbs with their cables (warm), two over the ring
    cable = pbr('cable', '#0c0c0c', 0.6, bump=0)
    bulb = glow('ampoule', '#ffb766', 40)
    for x, y in ((-3, -3), (3, -3), (-3, 2), (3, 2), (0, -6.5), (-5.5, -7.5), (5.5, -7.5), (-1.5, 6.6), (1.5, 6.6), (-5.6, 4.5), (5.6, 4.5)):
        z = 3.1 + 0.25 * math.sin(x * 1.7 + y)
        sphere(0.06, (x, y, z), bulb, name='ampoule')
        rod((x, y, z + 0.06), (x, y, 4.45), 0.005, cable, verts=6)
        point((x, y, z - 0.02), 70, '#ffb35c', 0.05)
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
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=rnd.uniform(1.0, 2.6), location=(r * math.cos(a), r * math.sin(a), rnd.uniform(0.4, 3.2)))
        o = bpy.context.object
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
        x, y = r * math.cos(a), r * math.sin(a)
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
    paper = pbr('shoji', '#efe6d4', 0.9, scale=40, var=0.06, bump=0.02, emit='#fff1d8', emit_k=1.6)
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
        area(lp, (0, 0, 1.0), 900, 2 * half, '#fff0d6', shape='RECTANGLE', size_y=2.4)
    # the alcove (tokonoma) on the back wall, a plain scroll and a low table
    box((1.8, 0.75, 0.2), (1, hy - 0.4, 0.1), dark, 0.01)
    box((1.84, 0.06, Hh), (1, hy + 0.05, Hh / 2), pbr('enduit', '#d8cfbf', 0.9, scale=6, var=0.08))
    box((0.5, 0.02, 1.3), (1, hy - 0.03, 1.7), pbr('rouleau', '#ece4d2', 0.85, scale=20, var=0.06))
    box((0.56, 0.035, 0.04), (1, hy - 0.03, 2.37), dark)
    box((0.56, 0.035, 0.04), (1, hy - 0.03, 1.04), dark)
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
    """a modern jiu-jitsu academy: blue mats with a black border, padded black walls, a rack of belts on the wall,
    bright ceiling panels"""
    sc = reset()
    mats_ = pbr('tapis-bleu', '#1f3f78', 0.75, kind='brick', brick=(1.0, 2.0, 0.005), b2=0.95, scale=3, var=0.1, bump=0.12)
    border = pbr('tapis-noir', '#121315', 0.75, kind='brick', brick=(1.0, 2.0, 0.005), b2=0.95, scale=3, var=0.1, bump=0.12)
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
        box((1.2, 2.0, 0.15), (7.9, 6.5, 0.08 + k * 0.155), pbr('matelas', ['#1f3f78', '#121315'][k % 2], 0.7, scale=5, var=0.1), 0.03)
    for k in range(5):
        sphere(0.12 + 0.015 * k, (8.2, -6 + k * 0.45, 0.13 + 0.015 * k), pbr('fonte', '#1b1b1c', 0.45, metal=0.5, scale=10, var=0.2))
    # LED panels
    for x in (-4.5, 0, 4.5):
        for y in (-7, -2.5, 2, 6.5):
            box((1.2, 1.2, 0.04), (x, y, 4.15), glow('led', '#f3f6ff', 10), name='panneau')
            area((x, y, 4.1), (x, y, 0), 110, 1.2, '#f3f6ff')
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
        (d / 'salle.json').write_text(json.dumps({'room': name, 'eye': EYE, 'props': props, 'key': meta['key'], 'haze': meta['haze']}, indent=1))
        print('ok', name, flush=True)


if __name__ == '__main__':
    main()
