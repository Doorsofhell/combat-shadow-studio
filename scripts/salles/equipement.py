"""1.27 Salles équipées (Youssef, 2026-11-06: « transforme chaque salle en un véritable environnement d'entraînement
professionnel, avec des équipements propres à chaque discipline, mais aussi des petits objets du quotidien qui rendent
les décors crédibles », then « il ne faut pas que ce soit trop chargé, reste premium mais immersif », « pas minimaliste
quand même »).

The equipment of the six rooms, modelled here from simple shapes (no downloaded asset, no brand, no readable writing):
gloves, pads, shields, dummies, racks, timers, posters… salles.py builds each room and calls these to furnish it,
along the walls, so the floor around the coach stays clear.

Each builder works in its own frame: the object stands on z = 0, its front faces −y. `at(x, y, z, rz)` places what
is built inside it (rz turns the front: 0 faces −y, the back wall; pi faces +y; −pi/2 faces −x, the right wall;
pi/2 faces +x, the left wall). salles.py hands its helpers over with bind(globals()).
"""
import math
import os
import random
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

box = cyl = rod = sphere = pbr = glow = None  # set by bind()
TEX = Path(os.environ.get('SALLES_TEX', '/tmp/salles-tex'))


def bind(ns):
    g = globals()
    for k in ('box', 'cyl', 'rod', 'sphere', 'pbr', 'glow'):
        g[k] = ns[k]


class at:
    """what is built inside `with at(x, y, z, rz):` is moved there (nested calls compose)"""

    def __init__(self, x, y, z=0.0, rz=0.0):
        self.m = Matrix.Translation((x, y, z)) @ Matrix.Rotation(rz, 4, 'Z')

    def __enter__(self):
        self.before = set(bpy.data.objects)
        return self

    def __exit__(self, *a):
        bpy.context.view_layer.update()
        for o in bpy.data.objects:
            if o not in self.before and o.parent is None:
                o.matrix_world = self.m @ o.matrix_world
        bpy.context.view_layer.update()


def tilt(objs_before, rx=0.0, ry=0.0, about=(0, 0, 0)):
    """turn what was built since objs_before around a point (to lay a glove down, lean a shield…)"""
    bpy.context.view_layer.update()
    c = Vector(about)
    m = Matrix.Translation(c) @ Matrix.Rotation(ry, 4, 'Y') @ Matrix.Rotation(rx, 4, 'X') @ Matrix.Translation(-c)
    for o in bpy.data.objects:
        if o not in objs_before and o.parent is None:
            o.matrix_world = m @ o.matrix_world
    bpy.context.view_layer.update()


# --- materials ----------------------------------------------------------------------------------------------------


def leather(c):
    return pbr('cuir', c, 0.42, scale=12, var=0.18, bump=0.08, coat=0.25)


def vinyl(c):
    return pbr('vinyle', c, 0.32, scale=10, var=0.14, bump=0.05, coat=0.4)


def cloth(c):
    return pbr('tissu', c, 0.85, scale=40, var=0.1, bump=0.04, sheen=0.3)


def metal(c='#9a9ca0', rough=0.3):
    return pbr('metal', c, rough, metal=1.0, var=0.08, bump=0.0)


def wood(c='#6b4a2e'):
    return pbr('bois', c, 0.55, kind='planks', scale=4, var=0.3, bump=0.15)


def plastic(c, rough=0.4):
    return pbr('plastique', c, rough, scale=8, var=0.08, bump=0.02)


def rubber(c):
    return pbr('caoutchouc', c, 0.7, scale=40, var=0.12, bump=0.08)


def image_mat(name, path, rough=0.6, emit=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    t = nt.nodes.new('ShaderNodeTexImage')
    t.image = bpy.data.images.load(str(path))
    t.interpolation = 'Cubic'
    nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = rough
    if emit:
        nt.links.new(t.outputs['Color'], b.inputs['Emission Color'])
        b.inputs['Emission Strength'].default_value = emit
    return m


def floor_mat(name, colour, kind, tile=(2.0, 1.0), seam=0.002, rough=0.75):
    """1.27 dedicated training floors (Youssef: « pas l'espèce de carrelage, comme dans les vraies salles, un tatami,
    un sol dédié »). kind: 'tatami' (pressed straw texture, faint joints of 2 × 1 m mats), 'caoutchouc' (sports
    rubber in rolls: fine granules, a joint every 1.25 m along one way only), 'toile' (canvas cover of a thick mat)"""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    c = colour if not isinstance(colour, str) else tuple((int(colour.lstrip('#')[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4))
    tc = nt.nodes.new('ShaderNodeTexCoord')
    vec = tc.outputs['Object']
    # large, soft variation (wear, light marks)
    big = nt.nodes.new('ShaderNodeTexNoise')
    big.inputs['Scale'].default_value = 0.6
    big.inputs['Detail'].default_value = 4
    nt.links.new(vec, big.inputs['Vector'])
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (*(x * 0.86 for x in c), 1)
    ramp.color_ramp.elements[1].color = (*(min(1, x * 1.12) for x in c), 1)
    nt.links.new(big.outputs['Fac'], ramp.inputs['Fac'])
    col = ramp.outputs['Color']
    # fine surface: straw weave lines, rubber granules or canvas
    if kind == 'tatami':
        wave = nt.nodes.new('ShaderNodeTexWave')
        wave.wave_type = 'BANDS'
        wave.bands_direction = 'X'
        wave.inputs['Scale'].default_value = 160
        wave.inputs['Distortion'].default_value = 1.5
        wave.inputs['Detail'].default_value = 2
        nt.links.new(vec, wave.inputs['Vector'])
        fine = wave.outputs['Fac']
        fine_k = 0.25
    elif kind == 'caoutchouc':
        vor = nt.nodes.new('ShaderNodeTexVoronoi')
        vor.inputs['Scale'].default_value = 900
        nt.links.new(vec, vor.inputs['Vector'])
        fine = vor.outputs['Distance']
        fine_k = 0.35
        # a few lighter granules (EPDM flecks)
        fl = nt.nodes.new('ShaderNodeTexVoronoi')
        fl.inputs['Scale'].default_value = 420
        nt.links.new(vec, fl.inputs['Vector'])
        th = nt.nodes.new('ShaderNodeMath')
        th.operation = 'LESS_THAN'
        th.inputs[1].default_value = 0.06
        nt.links.new(fl.outputs['Distance'], th.inputs[0])
        fleck = nt.nodes.new('ShaderNodeMix')
        fleck.data_type = 'RGBA'
        fleck.inputs['B'].default_value = (0.09, 0.09, 0.09, 1)
        nt.links.new(th.outputs['Value'], fleck.inputs['Factor'])
        nt.links.new(col, fleck.inputs['A'])
        col = fleck.outputs['Result']
    else:
        wave = nt.nodes.new('ShaderNodeTexNoise')
        wave.inputs['Scale'].default_value = 300
        wave.inputs['Detail'].default_value = 2
        nt.links.new(vec, wave.inputs['Vector'])
        fine = wave.outputs['Fac']
        fine_k = 0.15
    # joints: faint lines only (no grid of contrasting tiles)
    br = nt.nodes.new('ShaderNodeTexBrick')
    bw, bh = tile
    br.inputs['Scale'].default_value = 1.0
    br.inputs['Brick Width'].default_value = bw
    br.inputs['Row Height'].default_value = bh
    br.inputs['Mortar Size'].default_value = seam
    br.inputs['Mortar Smooth'].default_value = 0.6
    br.inputs['Color1'].default_value = (1, 1, 1, 1)
    br.inputs['Color2'].default_value = (1, 1, 1, 1)
    br.inputs['Mortar'].default_value = (0.0, 0.0, 0.0, 1)
    br.offset = 0.5
    nt.links.new(vec, br.inputs['Vector'])
    joint = nt.nodes.new('ShaderNodeMath')
    joint.operation = 'MULTIPLY_ADD'
    joint.inputs[1].default_value = 0.35
    joint.inputs[2].default_value = 0.65
    nt.links.new(br.outputs['Fac'], joint.inputs[0])
    mul = nt.nodes.new('ShaderNodeMix')
    mul.data_type = 'RGBA'
    mul.blend_type = 'MULTIPLY'
    mul.inputs['Factor'].default_value = 1.0
    nt.links.new(col, mul.inputs['A'])
    jc = nt.nodes.new('ShaderNodeCombineColor')
    for k in ('Red', 'Green', 'Blue'):
        nt.links.new(joint.outputs['Value'], jc.inputs[k])
    nt.links.new(jc.outputs['Color'], mul.inputs['B'])
    nt.links.new(mul.outputs['Result'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = rough
    # (no sheen: on a dark mat seen at a grazing angle it turned the whole floor pale grey)
    # relief: the fine surface plus the joints pressed in
    hsum = nt.nodes.new('ShaderNodeMath')
    hsum.operation = 'MULTIPLY_ADD'
    hsum.inputs[1].default_value = fine_k
    nt.links.new(fine, hsum.inputs[0])
    nt.links.new(br.outputs['Fac'], hsum.inputs[2])
    bn = nt.nodes.new('ShaderNodeBump')
    bn.inputs['Strength'].default_value = 0.35
    bn.inputs['Distance'].default_value = 0.004
    nt.links.new(hsum.outputs['Value'], bn.inputs['Height'])
    nt.links.new(bn.outputs['Normal'], b.inputs['Normal'])
    return m


# --- pictures (made here: no downloaded image, no readable writing) ---------------------------------------------


def _pil():
    from PIL import Image, ImageDraw, ImageFilter
    return Image, ImageDraw, ImageFilter


def poster_png(name, seed, palette):
    """a fight poster: a coloured ground, two fighters face to face as dark figures, bars of type that cannot be
    read (out of focus at this distance anyway), a printed paper grain"""
    Image, ImageDraw, ImageFilter = _pil()
    TEX.mkdir(parents=True, exist_ok=True)
    p = TEX / f'{name}.png'
    rnd = random.Random(seed)
    W, H = 600, 900
    bg, ink, accent = palette
    im = Image.new('RGB', (W, H), bg)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, W, 170), fill=accent)
    for k in range(2):
        d.rectangle((60, 40 + k * 60, W - 60 - rnd.randint(0, 200), 80 + k * 60), fill=ink)
    # two fighters in guard, facing each other
    for sx in (-1, 1):
        cx = W / 2 + sx * 130
        d.ellipse((cx - 45, 260, cx + 45, 360), fill=ink)
        d.polygon([(cx - 95, 640), (cx - 70, 380), (cx + 70, 380), (cx + 95, 640)], fill=ink)
        d.ellipse((cx - sx * 30 - 40, 330, cx - sx * 30 + 40, 410), fill=accent)
        d.ellipse((cx - sx * 85 - 38, 380, cx - sx * 85 + 38, 456), fill=accent)
    d.rectangle((0, 660, W, 690), fill=accent)
    for k in range(4):
        w_ = rnd.randint(260, 480)
        d.rectangle(((W - w_) / 2, 720 + k * 40, (W + w_) / 2, 742 + k * 40), fill=ink)
    im = im.filter(ImageFilter.GaussianBlur(1.2))
    # paper grain and worn edges
    import numpy as np
    a = np.asarray(im).astype(np.float32)
    a *= 0.92 + 0.08 * np.random.default_rng(seed).random((H, W, 1))
    yy, xx = np.mgrid[0:H, 0:W]
    v = 1 - 0.25 * (((xx - W / 2) / (W / 2)) ** 4 + ((yy - H / 2) / (H / 2)) ** 4)
    a *= v[..., None]
    Image.fromarray(a.clip(0, 255).astype('uint8')).save(p)
    return p


def board_png(name, seed, ink=((30, 60, 160), (180, 30, 40))):
    """a technique board: marker drawings of two figures, arrows of the movement, rows of strokes (notes, not
    readable at this distance)"""
    Image, ImageDraw, ImageFilter = _pil()
    TEX.mkdir(parents=True, exist_ok=True)
    p = TEX / f'{name}.png'
    rnd = random.Random(seed)
    W, H = 1000, 640
    im = Image.new('RGB', (W, H), (236, 238, 236))
    d = ImageDraw.Draw(im)
    for k in range(3):
        x0 = 60 + k * 300
        c = ink[k % 2]
        # stick figure in a stance
        hx, hy = x0 + 90, 120
        d.ellipse((hx - 22, hy - 22, hx + 22, hy + 22), outline=c, width=6)
        d.line((hx, hy + 22, hx + rnd.randint(-20, 20), hy + 150), fill=c, width=6)
        d.line((hx, hy + 60, hx + 70, hy + 40 + rnd.randint(-30, 30)), fill=c, width=6)
        d.line((hx, hy + 60, hx - 60, hy + 90), fill=c, width=6)
        d.line((hx, hy + 150, hx + 60, hy + 260), fill=c, width=6)
        d.line((hx, hy + 150, hx - 50, hy + 260), fill=c, width=6)
        # arrow of the movement
        d.arc((x0 + 120, 100, x0 + 260, 280), 200, 340, fill=ink[1 - k % 2], width=5)
        d.polygon([(x0 + 250, 160), (x0 + 270, 190), (x0 + 236, 186)], fill=ink[1 - k % 2])
    for k in range(5):
        x = 70 + rnd.randint(0, 40)
        d.ellipse((x - 6, 452 + k * 34, x + 6, 464 + k * 34), fill=ink[0])
        d.line((x + 20, 458 + k * 34, x + 20 + rnd.randint(200, 640), 458 + k * 34), fill=ink[0], width=5)
    im = im.filter(ImageFilter.GaussianBlur(0.8))
    im.save(p)
    return p


def enso_png(name, seed):
    """a brush circle (ensō) on rice paper: Zen calligraphy without a word"""
    Image, ImageDraw, ImageFilter = _pil()
    import numpy as np
    TEX.mkdir(parents=True, exist_ok=True)
    p = TEX / f'{name}.png'
    W, H = 400, 1100
    rng = np.random.default_rng(seed)
    paper = np.full((H, W, 3), (236, 228, 208), np.float32)
    paper *= 0.95 + 0.05 * rng.random((H, W, 1))
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    cx, cy, R = W / 2, 430, 140
    ang = (np.arctan2(yy - cy, xx - cx) + math.pi * 0.62) % (2 * math.pi)
    r = np.hypot(xx - cx, yy - cy)
    # the stroke thins and dries toward its end
    width = 34 * (1 - 0.75 * ang / (2 * math.pi)) * (ang < 1.88 * math.pi)
    streak = 0.75 + 0.25 * np.sin(r * 1.3 + rng.random() * 6)
    ink = (np.abs(r - R) < width / 2) * np.clip(streak + (1 - ang / (2 * math.pi)), 0, 1)
    # the seal (a red square, no characters)
    seal = (np.abs(xx - cx - 70) < 22) & (np.abs(yy - 760) < 22)
    out = paper * (1 - 0.9 * ink[..., None])
    out[seal] = (160, 30, 28)
    Image.fromarray(out.clip(0, 255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.7)).save(p)
    return p


def kanji_png(name, text, seed):
    """characters brushed on a hanging scroll: the font's shape, roughened and dried like ink on paper"""
    Image, ImageDraw, ImageFilter = _pil()
    from PIL import ImageFont
    import numpy as np
    TEX.mkdir(parents=True, exist_ok=True)
    p = TEX / f'{name}.png'
    W, H = 400, 1100
    font = None
    for f in ('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', '/usr/share/fonts/opentype/unifont/unifont_jp.otf'):
        if os.path.exists(f):
            font = ImageFont.truetype(f, 230)
            break
    mask = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(mask)
    # the characters share the height of the scroll (two big ones, or four smaller)
    step = min(300, 860 / max(1, len(text)))
    if font and len(text) > 2:
        font = ImageFont.truetype(font.path, int(step * 0.8))
    for k, ch in enumerate(text):
        if font:
            d.text((W / 2, 120 + step * (k + 0.5)), ch, fill=255, font=font, anchor='mm')
    m = np.asarray(mask.filter(ImageFilter.GaussianBlur(3))).astype(np.float32) / 255
    rng = np.random.default_rng(seed)
    n = np.asarray(Image.fromarray((rng.random((H // 6, W // 6)) * 255).astype('uint8')).resize((W, H), Image.BICUBIC)).astype(np.float32) / 255
    ink = np.clip((m - 0.35 + 0.25 * (n - 0.5)) * 4, 0, 1)
    paper = np.full((H, W, 3), (234, 226, 204), np.float32) * (0.95 + 0.05 * rng.random((H, W, 1)))
    out = paper * (1 - 0.92 * ink[..., None])
    Image.fromarray(out.clip(0, 255).astype('uint8')).save(p)
    return p


def flag_png(name):
    """the flag of Brazil, the home of jiu-jitsu (plain: the motto band is left without its words)"""
    Image, ImageDraw, ImageFilter = _pil()
    TEX.mkdir(parents=True, exist_ok=True)
    p = TEX / f'{name}.png'
    W, H = 1000, 700
    im = Image.new('RGB', (W, H), (0, 148, 64))
    d = ImageDraw.Draw(im)
    d.polygon([(85, H / 2), (W / 2, 85), (W - 85, H / 2), (W / 2, H - 85)], fill=(254, 221, 0))
    d.ellipse((W / 2 - 175, H / 2 - 175, W / 2 + 175, H / 2 + 175), fill=(0, 39, 118))
    d.arc((W / 2 - 330, H / 2 - 120, W / 2 + 330, H / 2 + 520), 236, 304, fill=(250, 250, 250), width=26)
    import random as _r
    rr = _r.Random(4)
    for _ in range(22):
        a, rad = rr.uniform(0, 2 * math.pi), rr.uniform(20, 150)
        x, y = W / 2 + rad * math.cos(a), H / 2 + rad * math.sin(a) + 25
        if (x - W / 2) ** 2 + (y - H / 2) ** 2 < 165 ** 2:
            d.ellipse((x - 4, y - 4, x + 4, y + 4), fill=(250, 250, 250))
    im.filter(ImageFilter.GaussianBlur(0.8)).save(p)
    return p


def portrait_png(name, seed):
    """an old photograph in sepia: a figure from the chest up in a dark jacket (a master of the past, nobody in
    particular), soft focus, a vignette"""
    Image, ImageDraw, ImageFilter = _pil()
    import numpy as np
    TEX.mkdir(parents=True, exist_ok=True)
    p = TEX / f'{name}.png'
    W, H = 360, 460
    rnd = random.Random(seed)
    im = Image.new('L', (W, H), 168)
    d = ImageDraw.Draw(im)
    hx = W / 2 + rnd.randint(-15, 15)
    d.ellipse((hx - 58, 90, hx + 58, 230), fill=82 + rnd.randint(-10, 10))
    d.ellipse((hx - 60, 80, hx + 60, 140), fill=40)
    d.polygon([(hx - 150, H), (hx - 120, 290), (hx - 40, 250), (hx + 40, 250), (hx + 120, 290), (hx + 150, H)], fill=36)
    d.polygon([(hx - 40, 250), (hx, 340), (hx + 40, 250)], fill=200)
    im = im.filter(ImageFilter.GaussianBlur(4))
    a = np.asarray(im).astype(np.float32) / 255
    yy, xx = np.mgrid[0:H, 0:W]
    a *= 1 - 0.55 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
    a += 0.04 * (np.random.default_rng(seed).random((H, W)) - 0.5)
    sep = np.stack([a * 1.0, a * 0.86, a * 0.66], -1) * 255
    Image.fromarray(sep.clip(0, 255).astype('uint8')).save(p)
    return p


def clock_png(name):
    Image, ImageDraw, ImageFilter = _pil()
    TEX.mkdir(parents=True, exist_ok=True)
    p = TEX / f'{name}.png'
    S = 512
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((2, 2, S - 2, S - 2), fill=(238, 236, 230, 255))
    for k in range(60):
        a = k / 60 * 2 * math.pi
        r0 = 0.40 if k % 5 == 0 else 0.44
        w_ = 9 if k % 5 == 0 else 3
        d.line((S / 2 + math.sin(a) * S * r0, S / 2 - math.cos(a) * S * r0, S / 2 + math.sin(a) * S * 0.47, S / 2 - math.cos(a) * S * 0.47), fill=(20, 20, 20, 255), width=w_)
    im.save(p)
    return p


def picture(path, w, h, frame_c='#111111', frame=0.03, name='cadre', rough=0.6, emit=0.0):
    """a framed picture hanging flat on a wall (its face toward −y)"""
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -0.012, h / 2), rotation=(math.pi / 2, 0, 0))
    o = bpy.context.object
    o.name = name
    o.scale = (w, h, 1)
    o.data.materials.append(image_mat(name, path, rough, emit))
    if frame:
        f = pbr('cadre', frame_c, 0.5)
        box((w + 2 * frame, 0.02, frame), (0, 0, h + frame / 2), f)
        box((w + 2 * frame, 0.02, frame), (0, 0, -frame / 2), f)
        box((frame, 0.02, h), (-w / 2 - frame / 2, 0, h / 2), f)
        box((frame, 0.02, h), (w / 2 + frame / 2, 0, h / 2), f)
    return o


# --- cords (ropes, bands, cables): thin, so they are left out of the depth picture (name 'fin-') ---------------


def cord(points, r, m, name='fin-corde'):
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = r
    cu.bevel_resolution = 3
    sp = cu.splines.new('POLY')
    sp.points.add(len(points) - 1)
    for p_, q in zip(sp.points, points):
        p_.co = (*q, 1)
    sp.use_smooth = True
    o = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(m)
    return o


def hanging_loop(top, drop, spread, r, m, n=24, name='fin-corde'):
    """a rope or a band hanging from a hook: a long U"""
    pts = []
    for k in range(n + 1):
        t = k / n
        a = math.pi * t
        pts.append((top[0] + spread * (t - 0.5), top[1] - 0.02 * math.sin(a), top[2] - drop * math.sin(a) ** 0.6))
    return cord(pts, r, m, name)


# --- striking equipment -------------------------------------------------------------------------------------------


def boxing_glove(c, cuff='#f2f2f0'):
    """a boxing glove standing on its cuff, fingers up, palm toward −y"""
    m = leather(c)
    o = sphere(0.1, (0, 0, 0.22), m, name='gant')
    o.scale = (0.78, 0.92, 1.2)
    t = sphere(0.045, (0.075, -0.035, 0.18), m, name='gant')
    t.scale = (0.85, 0.85, 1.55)
    cyl(0.06, 0.14, (0, 0, 0.07), m, name='gant')
    cyl(0.062, 0.035, (0, 0, 0.1), leather(cuff), name='gant')


def glove_pair(c, cuff='#f2f2f0', lying=True):
    for sx in (-1, 1):
        before = set(bpy.data.objects)
        with at(sx * 0.11, 0, 0, 0):
            boxing_glove(c, cuff)
        if lying:
            # laid down on the shelf, the fists toward the room
            tilt(before, rx=-math.pi / 2 + 0.25, about=(sx * 0.11, 0, 0.06))
            bpy.context.view_layer.update()
            for o in bpy.data.objects:
                if o not in before:
                    o.location.z += 0.07
                    o.location.y += 0.06


def mma_glove_pair(c, accent):
    for sx in (-1, 1):
        o = sphere(0.06, (sx * 0.08, 0, 0.065), leather(c), name='gant-mma')
        o.scale = (0.9, 1.25, 0.8)
        cyl(0.048, 0.08, (sx * 0.08, 0.1, 0.05), leather(c), rot=(math.pi / 2, 0, 0), name='gant-mma')
        cyl(0.05, 0.035, (sx * 0.08, 0.1, 0.05), leather(accent), rot=(math.pi / 2, 0, 0), name='gant-mma')


def headgear(c, inner='#141414'):
    m = leather(c)
    o = sphere(0.12, (0, 0, 0.15), m, name='casque')
    o.scale = (0.85, 0.95, 1.15)
    f = cyl(0.068, 0.04, (0, -0.1, 0.14), leather(inner), rot=(math.pi / 2, 0, 0), name='casque')
    f.scale = (1.0, 1.25, 1.0)
    for sx in (-1, 1):
        q = sphere(0.045, (sx * 0.07, -0.085, 0.09), m, name='casque')
        q.scale = (0.8, 0.6, 1.2)
    cyl(0.07, 0.03, (0, 0.0, 0.02), m, name='casque')


def shin_guard(c, accent=None, standing=True):
    """a padded shin-and-instep guard, as the MMA ones of the coaches (1.27)"""
    m = leather(c)
    o = cyl(0.055, 0.36, (0, 0, 0.26), m, verts=24, name='tibia')
    o.scale = (1.15, 0.75, 1.0)
    q = sphere(0.06, (0, -0.06, 0.07), m, name='tibia')
    q.scale = (1.0, 1.4, 0.55)
    if accent:
        b = cyl(0.057, 0.03, (0, 0, 0.42), leather(accent), verts=24, name='tibia')
        b.scale = (1.15, 0.75, 1.0)


def focus_mitt(c, centre='#f2f2f0'):
    """a focus mitt lying flat, its target up"""
    m = leather(c)
    o = sphere(0.12, (0, 0, 0.05), m, name='patte')
    o.scale = (0.9, 1.15, 0.42)
    t = cyl(0.05, 0.01, (0, 0, 0.1), leather(centre), name='patte')
    t.scale = (1, 1.2, 1)


def thai_pad(c, edge='#141414', lying=True):
    """a thick Thai pad (forearm pad): a long, slightly curved block, its handles behind"""
    m = leather(c)
    if lying:
        box((0.22, 0.42, 0.09), (0, 0, 0.045), m, bevel=0.035, name='pao')
        box((0.225, 0.03, 0.092), (0, 0.15, 0.046), leather(edge), bevel=0.01, name='pao')
    else:
        box((0.22, 0.09, 0.42), (0, 0, 0.21), m, bevel=0.035, name='pao')
        box((0.225, 0.092, 0.03), (0, 0, 0.36), leather(edge), bevel=0.01, name='pao')


def kick_shield(c, band='#141414', lean=0.12):
    """a big curved strike shield standing on end, leaning on the wall behind it"""
    before = set(bpy.data.objects)
    m = vinyl(c)
    box((0.42, 0.18, 0.74), (0, 0, 0.37), m, bevel=0.07, name='bouclier')
    for z in (0.22, 0.52):
        box((0.43, 0.185, 0.05), (0, 0, z), vinyl(band), bevel=0.012, name='bouclier')
    tilt(before, rx=-lean, about=(0, 0.09, 0))


def low_kick_shield(c, band='#f2f2f0', lean=0.12):
    """the long Thai low-kick shield (a tall pad, rounded top)"""
    before = set(bpy.data.objects)
    m = leather(c)
    box((0.34, 0.16, 0.8), (0, 0, 0.4), m, bevel=0.06, name='bouclier')
    o = cyl(0.17, 0.16, (0, 0, 0.8), m, rot=(math.pi / 2, 0, 0), name='bouclier')
    o.scale = (1, 1, 1)
    box((0.345, 0.165, 0.035), (0, 0, 0.6), leather(band), bevel=0.01, name='bouclier')
    tilt(before, rx=-lean, about=(0, 0.08, 0))


def wraps_roll(c):
    o = cyl(0.035, 0.055, (0, 0, 0.035), cloth(c), rot=(0, math.pi / 2, 0), name='bande')
    return o


def open_crate(w, d, h, c='#1a1a1c'):
    m = plastic(c, 0.55)
    box((w, d, 0.01), (0, 0, 0.005), m)
    box((w, 0.01, h), (0, -d / 2, h / 2), m)
    box((w, 0.01, h), (0, d / 2, h / 2), m)
    box((0.01, d, h), (-w / 2, 0, h / 2), m)
    box((0.01, d, h), (w / 2, 0, h / 2), m)


def mouthguard_box(c):
    box((0.075, 0.055, 0.03), (0, 0, 0.015), plastic(c, 0.25), bevel=0.008, name='protege-dents')


def water_bottle(c='#2f6fb5'):
    cyl(0.036, 0.2, (0, 0, 0.1), plastic(c, 0.2), name='gourde')
    cyl(0.026, 0.04, (0, 0, 0.22), plastic('#141414', 0.5), name='gourde')


def towel_folded(c='#f2f0ea'):
    box((0.3, 0.22, 0.06), (0, 0, 0.03), cloth(c), bevel=0.02, name='serviette')


def jump_ropes(colours, spacing=0.16, top=1.75):
    """ropes hanging in loops from hooks on a wall (the wall is behind, at y = +0.02)"""
    steel = metal('#6a6c70')
    for k, c in enumerate(colours):
        x = (k - (len(colours) - 1) / 2) * spacing
        rod((x, 0.02, top), (x, -0.04, top + 0.01), 0.006, steel, name='crochet')
        hanging_loop((x, -0.035, top - 0.01), 0.62 + 0.04 * (k % 3), 0.07, 0.0045, plastic(c, 0.45))
        for sx in (-1, 1):
            cyl(0.014, 0.13, (x + sx * 0.03, -0.045, top - 0.085), plastic('#141414' if k % 2 else c, 0.4), name='poignee')


def resistance_bands(colours, spacing=0.14, top=1.8):
    steel = metal('#6a6c70')
    for k, c in enumerate(colours):
        x = (k - (len(colours) - 1) / 2) * spacing
        rod((x, 0.02, top), (x, -0.04, top + 0.01), 0.006, steel, name='crochet')
        hanging_loop((x, -0.035, top - 0.01), 0.75, 0.05, 0.009, rubber(c), name='fin-elastique')


# --- fitness equipment --------------------------------------------------------------------------------------------


def kettlebell(r, c='#1b1b1c', band=None):
    sphere(r, (0, 0, r), pbr('fonte', c, 0.45, metal=0.5, scale=10, var=0.15), name='kettlebell')
    bpy.ops.mesh.primitive_torus_add(major_radius=r * 0.62, minor_radius=r * 0.13, location=(0, 0, r * 1.95), rotation=(math.pi / 2, 0, 0))
    o = bpy.context.object
    o.name = 'kettlebell'
    bpy.ops.object.shade_smooth()
    o.data.materials.append(pbr('fonte', c, 0.45, metal=0.5, scale=10, var=0.15))
    if band:
        cyl(r * 1.01, r * 0.18, (0, 0, r * 1.1), plastic(band, 0.5), name='kettlebell')


def medicine_ball(r, c):
    sphere(r, (0, 0, r), rubber(c), name='medecine')
    bpy.ops.mesh.primitive_torus_add(major_radius=r * 1.0, minor_radius=r * 0.03, location=(0, 0, r), rotation=(0, math.pi / 2, 0))
    o = bpy.context.object
    o.data.materials.append(rubber('#0e0e0e'))


def swiss_ball(r, c):
    sphere(r, (0, 0, r), plastic(c, 0.35), name='ballon')


def foam_roller(c, standing=True):
    if standing:
        cyl(0.075, 0.45, (0, 0, 0.225), rubber(c), name='rouleau')
    else:
        cyl(0.075, 0.45, (0, 0, 0.075), rubber(c), rot=(0, math.pi / 2, 0), name='rouleau')


def battle_ropes(length=6.0, gap=0.35, c='#1c1c1c'):
    """two heavy ropes from a ring fixed low on the wall (at y = 0), lying on the floor toward −y, a loose S"""
    m = pbr('corde', c, 0.8, scale=60, var=0.12, bump=0.15)
    box((0.2, 0.06, 0.2), (0, 0.03, 0.15), metal('#2a2a2c'))
    for sx in (-1, 1):
        pts = []
        for k in range(41):
            t = k / 40
            y = -t * length
            x = sx * gap * t + 0.18 * math.sin(t * math.pi * 3 + sx) * t
            pts.append((x, y, 0.025 + 0.12 * max(0.0, 1 - t * 8)))
        cord(pts, 0.022, m, name='corde-ondulatoire')
        cyl(0.03, 0.22, (pts[-1][0], pts[-1][1] - 0.1, 0.03), plastic('#141414'), rot=(math.pi / 2, 0, 0), name='poignee')


def cones(n, c='#ff6a1a', step=0.6):
    for k in range(n):
        bpy.ops.mesh.primitive_cone_add(radius1=0.09, radius2=0.012, depth=0.22, location=(k * step, 0, 0.11), vertices=24)
        o = bpy.context.object
        bpy.ops.object.shade_smooth()
        o.data.materials.append(plastic(c, 0.45))
        box((0.2, 0.2, 0.012), (k * step, 0, 0.006), plastic(c, 0.45), bevel=0.004)


def agility_ladder(length=4.0, width=0.5, c='#e8c21a'):
    strap = cloth('#141414')
    for sx in (-1, 1):
        box((0.035, length, 0.006), (sx * width / 2, 0, 0.003), strap)
    for k in range(int(length / 0.45) + 1):
        box((width, 0.04, 0.012), (0, -length / 2 + k * 0.45, 0.006), plastic(c, 0.45))


def bench(L=1.4, c='#151515', frame='#2a2a2c'):
    """a padded recovery bench"""
    box((L, 0.32, 0.09), (0, 0, 0.46), leather(c), bevel=0.03, name='banc')
    for sx in (-1, 1):
        box((0.05, 0.28, 0.42), (sx * (L / 2 - 0.12), 0, 0.21), metal(frame, 0.45))
        box((0.05, 0.36, 0.04), (sx * (L / 2 - 0.12), 0, 0.02), metal(frame, 0.45))


def wooden_bench(L=1.8, c='#6b4a2e'):
    box((L, 0.32, 0.05), (0, 0, 0.43), wood(c), bevel=0.008, name='banc')
    for sx in (-1, 1):
        box((0.06, 0.28, 0.41), (sx * (L / 2 - 0.15), 0, 0.205), wood(c), bevel=0.005)


# --- furniture ----------------------------------------------------------------------------------------------------


def shelf(w, d, levels, c='#2b2b2d', mat=None):
    """an open metal shelf against the wall (behind it, +y); returns the heights of its levels"""
    m = mat or metal(c, 0.45)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box((0.035, 0.035, levels[-1] + 0.05), (sx * (w / 2 - 0.02), sy * (d / 2 - 0.02), (levels[-1] + 0.05) / 2), m)
    for z in levels:
        box((w, d, 0.025), (0, 0, z), m, bevel=0.004)
    return [z + 0.0125 for z in levels]


def cubbies(cols, rows, cw=0.34, ch=0.3, d=0.36, c='#6b4a2e'):
    """open wooden cubbies (shoes, bags); returns the floor of each box (x, z)"""
    m = wood(c)
    W, Hh = cols * cw, rows * ch
    for k in range(cols + 1):
        box((0.02, d, Hh), (-W / 2 + k * cw, 0, Hh / 2 + 0.06), m)
    for k in range(rows + 1):
        box((W, d, 0.02), (0, 0, 0.06 + k * ch), m)
    box((W, 0.01, Hh), (0, d / 2, Hh / 2 + 0.06), m)
    return [(-W / 2 + (i + 0.5) * cw, 0.07 + j * ch) for i in range(cols) for j in range(rows)]


def shoe_pair(c, sole='#f2f2f0'):
    for sx in (-1, 1):
        o = sphere(0.06, (sx * 0.055, 0, 0.04), leather(c), name='chaussure')
        o.scale = (0.75, 2.0, 0.6)
        s = sphere(0.06, (sx * 0.055, 0, 0.02), rubber(sole), name='chaussure')
        s.scale = (0.8, 2.05, 0.3)


def zori_pair(c='#2a2a2a'):
    for sx in (-1, 1):
        o = box((0.1, 0.25, 0.025), (sx * 0.06, 0, 0.0125), wood('#c9b48a'), bevel=0.01, name='zori')
        cord([(sx * 0.06 - 0.04, 0.02, 0.03), (sx * 0.06, -0.07, 0.045), (sx * 0.06 + 0.04, 0.02, 0.03)], 0.005, cloth(c), name='fin-zori')


def folded_stack(colours, w=0.36, d=0.28, t=0.055):
    """folded kimonos or rashguards in a pile"""
    z = 0.0
    for c in colours:
        box((w, d, t), (0, 0, z + t / 2), cloth(c), bevel=0.018, name='plie')
        z += t * 0.96
    return z


def wall_timer(w=1.0, text='03:00', c='#ff2a1f', case='#0c0c0d'):
    """a gym timer on the wall: a black case and red seven-segment digits (glowing); 1 m wide by default"""
    h = w * 0.34
    box((w, 0.07, h), (0, 0.035, h / 2), plastic(case, 0.35), bevel=0.01, name='chrono')
    seg = {'0': 'abcdef', '1': 'bc', '2': 'abdeg', '3': 'abcdg', '4': 'bcfg', '5': 'acdfg', '6': 'acdefg', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg'}
    on = glow('chiffre', c, 12)
    off = plastic('#1a0b0b', 0.3)
    cells = [ch for ch in text]
    cw = w * 0.17
    gx = w * 0.035
    total = sum(cw * (0.35 if ch == ':' else 1) for ch in cells) + gx * (len(cells) - 1)
    x = -total / 2
    ch_ = h * 0.66
    z0 = h * 0.17
    t = cw * 0.16
    for ch in cells:
        if ch == ':':
            for z in (z0 + ch_ * 0.3, z0 + ch_ * 0.7):
                box((t, 0.01, t), (x + cw * 0.17, -0.002, z), on)
            x += cw * 0.35 + gx
            continue
        segs = {'a': (x + cw / 2, z0 + ch_, cw - t, t), 'g': (x + cw / 2, z0 + ch_ / 2, cw - t, t), 'd': (x + cw / 2, z0, cw - t, t),
                'f': (x + t / 2, z0 + ch_ * 0.75, t, ch_ / 2 - t), 'b': (x + cw - t / 2, z0 + ch_ * 0.75, t, ch_ / 2 - t),
                'e': (x + t / 2, z0 + ch_ * 0.25, t, ch_ / 2 - t), 'c': (x + cw - t / 2, z0 + ch_ * 0.25, t, ch_ / 2 - t)}
        for k, (sx, sz, sw, sh) in segs.items():
            box((sw * 0.92, 0.01, sh * 0.92), (sx, -0.002, sz), on if k in seg.get(ch, '') else off)
        x += cw + gx


def wall_clock(r=0.22):
    bpy.ops.mesh.primitive_plane_add(size=2 * r, location=(0, -0.03, 0), rotation=(math.pi / 2, 0, 0))
    o = bpy.context.object
    o.name = 'horloge'
    m = image_mat('horloge', clock_png('horloge'), 0.4)
    nt = m.node_tree
    nt.links.new(nt.nodes['Image Texture'].outputs['Alpha'], nt.nodes['Principled BSDF'].inputs['Alpha'])
    o.data.materials.append(m)
    bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=0.018, location=(0, -0.02, 0), rotation=(math.pi / 2, 0, 0))
    t = bpy.context.object
    t.data.materials.append(plastic('#141414', 0.35))
    k = pbr('aiguille', '#141414', 0.4)
    for a, L, wd in ((2.1, 0.55, 0.018), (5.2, 0.78, 0.012)):
        L *= r
        box((wd, 0.005, L), (math.sin(a) * L / 2, -0.035, math.cos(a) * L / 2), k, rz=0).rotation_euler.y = a
    box((0.004, 0.004, 0.85 * r), (math.sin(3.6) * 0.42 * r, -0.038, math.cos(3.6) * 0.42 * r), pbr('trotteuse', '#b3122a', 0.4)).rotation_euler.y = 3.6


def gong(r=0.32):
    br = metal('#b8873a', 0.28)
    frame = wood('#3a2416')
    for sx in (-1, 1):
        box((0.06, 0.06, 1.25), (sx * (r + 0.12), 0, 0.625), frame, bevel=0.005)
        box((0.3, 0.3, 0.05), (sx * (r + 0.12), 0, 0.025), frame, bevel=0.005)
    box((2 * r + 0.36, 0.07, 0.07), (0, 0, 1.24), frame, bevel=0.005)
    cyl(r, 0.02, (0, 0, 1.24 - 0.12 - r), br, rot=(math.pi / 2, 0, 0), verts=48, name='gong')
    sphere(0.07, (0, -0.015, 1.24 - 0.12 - r), br, name='gong').scale = (1, 0.4, 1)
    for sx in (-1, 1):
        rod((sx * 0.08, 0, 1.2), (sx * 0.05, 0, 1.24 - 0.12 - 0.02), 0.004, metal('#4a4a4a'), name='fin-gong')
    rod((r + 0.05, -0.08, 0.6), (r + 0.25, -0.12, 0.05), 0.012, frame, name='mailloche')
    sphere(0.05, (r + 0.05, -0.08, 0.62), cloth('#7a1018'), name='mailloche')


def corner_stool(c='#141414'):
    cyl(0.17, 0.05, (0, 0, 0.56), leather(c), name='tabouret')
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4
        rod((0.11 * math.cos(a), 0.11 * math.sin(a), 0.54), (0.19 * math.cos(a), 0.19 * math.sin(a), 0.0), 0.012, metal('#8a8c90'), name='tabouret')


def bucket(c='#1d3a8c'):
    bpy.ops.mesh.primitive_cone_add(radius1=0.12, radius2=0.15, depth=0.3, location=(0, 0, 0.15), vertices=32, end_fill_type='NOTHING')
    o = bpy.context.object
    o.name = 'seau'
    bpy.ops.object.shade_smooth()
    s = o.modifiers.new('s', 'SOLIDIFY')
    s.thickness = 0.008
    o.data.materials.append(plastic(c, 0.35))
    cyl(0.12, 0.01, (0, 0, 0.005), plastic(c, 0.35))
    cyl(0.135, 0.01, (0, 0, 0.2), pbr('eau', '#1a2a33', 0.05))
    bpy.ops.mesh.primitive_torus_add(major_radius=0.15, minor_radius=0.004, location=(0, 0, 0.3), rotation=(math.pi / 2, 0, 0))
    bpy.context.object.data.materials.append(metal('#9a9ca0'))


def trophy(h=0.4, c='#c9a24a'):
    g = metal(c, 0.22)
    box((0.14, 0.14, 0.06), (0, 0, 0.03), wood('#2a1a10'), bevel=0.005)
    cyl(0.018, h * 0.35, (0, 0, 0.06 + h * 0.175), g)
    bpy.ops.mesh.primitive_cone_add(radius1=0.03, radius2=0.09, depth=h * 0.45, location=(0, 0, 0.06 + h * 0.35 + h * 0.225), vertices=32)
    o = bpy.context.object
    bpy.ops.object.shade_smooth()
    o.data.materials.append(g)
    for sx in (-1, 1):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.035, minor_radius=0.006, location=(sx * 0.09, 0, 0.06 + h * 0.6), rotation=(math.pi / 2, 0, 0))
        bpy.context.object.data.materials.append(g)


def champion_belt(c='#1a1a1a', plate='#c9a24a'):
    """a championship belt hung flat on the wall: a wide strap, a big round centre plate, two side plates"""
    g = metal(plate, 0.22)
    box((1.0, 0.02, 0.13), (0, 0, 0.065), leather(c), bevel=0.01, name='ceinture-champion')
    cyl(0.12, 0.025, (0, -0.012, 0.075), g, rot=(math.pi / 2, 0, 0), verts=40, name='ceinture-champion')
    cyl(0.07, 0.03, (0, -0.02, 0.075), metal('#b3122a', 0.3), rot=(math.pi / 2, 0, 0), verts=40, name='ceinture-champion')
    for sx in (-1, 1):
        box((0.12, 0.022, 0.1), (sx * 0.24, -0.012, 0.065), g, bevel=0.012, name='ceinture-champion')


def wall_fan(r=0.28):
    """a wall fan in its round cage (Thai camps)"""
    cage = metal('#d8d8d4', 0.4)
    box((0.12, 0.12, 0.2), (0, 0.06, 0), plastic('#e2e2de'), bevel=0.02)
    cyl(0.07, 0.14, (0, -0.06, 0), plastic('#e2e2de'), rot=(math.pi / 2, 0, 0))
    for k in range(3):
        a = k * 2 * math.pi / 3
        o = box((0.09, 0.008, r * 0.9), (math.sin(a) * r * 0.48, -0.15, math.cos(a) * r * 0.48), plastic('#3c6aa8', 0.3))
        o.rotation_euler.y = a
    for rr in (r, r * 0.6):
        for yy in (-0.2, -0.1):
            bpy.ops.mesh.primitive_torus_add(major_radius=rr, minor_radius=0.004, location=(0, yy, 0), rotation=(math.pi / 2, 0, 0))
            bpy.context.object.data.materials.append(cage)
            bpy.context.object.name = 'fin-ventilo'
    for k in range(12):
        a = k * math.pi / 6
        rod((0, -0.22, 0), (math.sin(a) * r, -0.2, math.cos(a) * r), 0.003, cage, verts=4, name='fin-ventilo')


# --- bags and stands ----------------------------------------------------------------------------------------------


def speed_bag_platform(top=2.35, c='#6b1218'):
    """a speed bag under its round platform, the platform on a bracket from the wall (wall at y = +0.6)"""
    pf = wood('#3a2a1c')
    cyl(0.32, 0.06, (0, 0, top), pf, verts=40, name='plateforme')
    for sx in (-1, 1):
        rod((sx * 0.2, 0.0, top - 0.02), (sx * 0.2, 0.6, top - 0.02), 0.02, metal('#2a2a2c'))
        rod((sx * 0.2, 0.6, top - 0.35), (sx * 0.2, 0.2, top - 0.03), 0.015, metal('#2a2a2c'))
    cyl(0.02, 0.06, (0, 0, top - 0.06), metal('#9a9ca0'))
    o = sphere(0.1, (0, 0, top - 0.2), leather(c), name='poire')
    o.scale = (0.85, 0.85, 1.25)


def double_end_bag(ceiling, c='#7a1018'):
    """a double-end bag: a ball held by an elastic cord from the ceiling and another to a weight on the floor"""
    z = 1.5
    o = sphere(0.11, (0, 0, z), leather(c), name='double')
    o.scale = (1, 1, 1.15)
    cord([(0, 0, z + 0.12), (0, 0, ceiling)], 0.005, rubber('#141414'), name='fin-double')
    cord([(0, 0, z - 0.12), (0, 0, 0.08)], 0.005, rubber('#141414'), name='fin-double')
    cyl(0.12, 0.08, (0, 0, 0.04), metal('#202022', 0.5), name='double')


def freestanding_bag(c='#141414', base='#1d1d1f', accent='#7a1119'):
    cyl(0.32, 0.32, (0, 0, 0.16), plastic(base, 0.5), verts=40, bevel=0.03, name='autoportant')
    cyl(0.12, 0.18, (0, 0, 0.4), rubber('#141414'), name='autoportant')
    cyl(0.2, 1.25, (0, 0, 0.49 + 0.625), vinyl(c), verts=40, bevel=0.05, name='autoportant')
    cyl(0.205, 0.08, (0, 0, 1.35), vinyl(accent), verts=40, name='autoportant')


def kick_target_stand(c='#7a1018'):
    """a kicking target on an adjustable stand"""
    st = metal('#2a2a2c', 0.45)
    for a in (0, math.pi / 2):
        box((0.6, 0.06, 0.04), (0, 0, 0.02), st, rz=a)
    rod((0, 0, 0.0), (0, 0, 1.25), 0.025, st)
    o = sphere(0.18, (0, -0.06, 1.15), vinyl(c), name='cible')
    o.scale = (1.0, 0.45, 1.4)
    box((0.3, 0.02, 0.06), (0, -0.14, 1.15), vinyl('#f2f2f0'))


def dummy(pose='assis', c='#3b2a20', limbs=None):
    """a grappling / throwing dummy: torso, head, arms, legs. pose: 'debout' (judo throws), 'assis' (against a
    wall), 'couche' (on its back, on the mats)"""
    m = leather(c)
    lm = leather(limbs or c)
    before = set(bpy.data.objects)
    hip = 0.88
    cyl(0.17, 0.62, (0, 0, hip + 0.33), m, verts=32, name='mannequin')
    sphere(0.115, (0, 0, hip + 0.76), m, name='mannequin')
    cyl(0.055, 0.1, (0, 0, hip + 0.66), m, name='mannequin')
    for sx in (-1, 1):
        rod((sx * 0.19, 0, hip + 0.58), (sx * 0.3, -0.12, hip + 0.12), 0.055, lm, name='mannequin')
        if pose == 'debout':
            rod((sx * 0.09, 0, hip + 0.05), (sx * 0.12, 0, 0.05), 0.075, lm, name='mannequin')
        else:
            rod((sx * 0.09, 0, hip + 0.05), (sx * 0.12, -0.8, hip - 0.02), 0.075, lm, name='mannequin')
    if pose == 'assis':
        for o in bpy.data.objects:
            if o not in before:
                o.location.z -= hip - 0.09
        tilt(before, rx=0.22, about=(0, 0.17, 0.05))
    elif pose == 'couche':
        tilt(before, rx=math.pi / 2, about=(0, 0, hip))
        bpy.context.view_layer.update()
        for o in bpy.data.objects:
            if o not in before:
                o.location.z -= hip - 0.17
    elif pose == 'debout':
        box((0.5, 0.5, 0.04), (0, 0, 0.02), metal('#2a2a2c', 0.5))


def gi_hanging(c='#f4f3ee', belt='#141414'):
    """a judogi hanging on a hanger: the jacket with its lapels and sleeves, the belt over the hanger"""
    m = cloth(c)
    rod((-0.22, 0, 1.62), (0.22, 0, 1.62), 0.008, wood('#6b4a2e'), name='cintre')
    box((0.5, 0.1, 0.78), (0, 0, 1.22), m, bevel=0.03, name='judogi')
    for sx in (-1, 1):
        o = box((0.14, 0.09, 0.6), (sx * 0.3, 0, 1.25), m, bevel=0.03, name='judogi')
        o.rotation_euler.y = sx * 0.18
        box((0.07, 0.012, 0.6), (sx * 0.06, -0.052, 1.3), m, bevel=0.01, name='judogi').rotation_euler.y = -sx * 0.2
    box((0.04, 0.11, 0.5), (0.05, 0, 1.35), cloth(belt), name='judogi')


def belt_board(colours, w=1.6, c='#4a2e1c'):
    """a wooden board with pegs, a belt of each grade hanging folded on it"""
    box((w, 0.03, 0.14), (0, 0.015, 1.9), wood(c), bevel=0.006)
    n = len(colours)
    for k, col in enumerate(colours):
        x = -w / 2 + (k + 0.5) * w / n
        rod((x, 0, 1.9), (x, -0.06, 1.9), 0.008, wood('#2a1a10'))
        for sx in (-1, 1):
            box((0.045, 0.012, 0.7), (x + sx * 0.03, -0.05, 1.53), cloth(col[0] if isinstance(col, tuple) else col), name='ceinture')
        if isinstance(col, tuple):
            # two-coloured belts (red and white): blocks along the belt
            for j in range(4):
                box((0.047, 0.013, 0.08), (x - 0.03, -0.051, 1.28 + j * 0.16), cloth(col[1]), name='ceinture')
                box((0.047, 0.013, 0.08), (x + 0.03, -0.051, 1.28 + j * 0.16), cloth(col[1]), name='ceinture')


def uchikomi_bands(c='#b3122a', top=1.5):
    """rubber tubes fixed to a ring on the wall, their handles hanging (uchikomi training)"""
    st = metal('#6a6c70')
    bpy.ops.mesh.primitive_torus_add(major_radius=0.04, minor_radius=0.008, location=(0, -0.03, top), rotation=(math.pi / 2, 0, 0))
    bpy.context.object.data.materials.append(st)
    for sx in (-1, 1):
        pts = [(0, -0.04, top - 0.03)]
        for k in range(1, 13):
            t = k / 12
            pts.append((sx * 0.14 * t, -0.05 - 0.06 * t, top - 0.03 - 0.95 * t + 0.18 * math.sin(t * math.pi)))
        cord(pts, 0.009, rubber(c), name='fin-elastique')
        e = pts[-1]
        box((0.12, 0.05, 0.04), (e[0], e[1], e[2] - 0.03), cloth('#141414'), bevel=0.01, name='poignee')


def tatami_stack(n, mat, w=2.0, d=1.0, t=0.05):
    for k in range(n):
        box((w, d, t), (0.01 * (k % 2), 0.01 * ((k + 1) % 2), t / 2 + k * t), mat, bevel=0.008, name='tatami-pile')


def whiteboard(path, w=1.6, h=1.0, z=1.0):
    with at(0, 0, z):
        picture(path, w, h, frame_c='#b9bcc0', frame=0.025, name='tableau', rough=0.25)
    box((w * 0.6, 0.08, 0.025), (0, -0.05, z - 0.02), metal('#b9bcc0', 0.35))
    for k, c in enumerate(('#1d3a8c', '#b3122a', '#141414')):
        cyl(0.008, 0.12, (-0.2 + k * 0.05, -0.06, z), plastic(c), rot=(0, math.pi / 2, 0))
