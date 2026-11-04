"""Transfer the face of a Rocketbox avatar (donor) onto the Rocketbox sports body (base, bare skin, face rig).

usage: python3 face_transfer.py BASE.fbx DONOR.fbx OUT.blend [BLEND_RADIUS]
The base keeps its topology, UVs, skin weights and 80-bone rig (the app's pipeline convert.py reads it).
1. donor aligned on the base by the two eye bones (uniform scale + translation, same rest orientation)
2. base head skin pulled onto the donor head surface (nearest point, normals agreeing), displacement diffused to the
   vertices that found no match (mouth inside, eyeballs follow their eye bone), faded down the neck by the head weights
3. face bones moved to the donor's positions (rest pose), so blinks and jaw pivot in the right place
4. donor head colour baked onto the base head UVs (Cycles, selected to active), composited with the base where no ray hit
5. donor hair / lashes (opacity material) copied with their weights; base body texture tinted to the donor skin tone
"""
import sys, os, math
import bpy, bmesh
import numpy as np
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

BASE, DONOR, OUT = sys.argv[1:4]
OUTDIR = os.path.dirname(OUT)
NAME = os.path.basename(OUT)[:-6]


def load(fbx, tag):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=fbx)
    new = [o for o in bpy.data.objects if o not in before]
    arm = next(o for o in new if o.type == 'ARMATURE')
    mesh = next(o for o in new if o.type == 'MESH')
    for o in new:
        if o not in (arm, mesh):
            bpy.data.objects.remove(o)
    tex = os.path.join(os.path.dirname(os.path.dirname(fbx)), 'Textures')
    for m in mesh.data.materials:
        for n in m.node_tree.nodes:
            if n.type == 'TEX_IMAGE' and n.image:
                cand = os.path.join(tex, os.path.basename(n.image.filepath))
                if os.path.exists(cand):
                    n.image.filepath = os.path.abspath(cand)
                    n.image.reload()
    # some avatars carry a second UV channel (lightmap): the textures read the first one
    uvs = mesh.data.uv_layers
    while len(uvs) > 1:
        uvs.remove(uvs[len(uvs) - 1])
    uvs[0].active = uvs[0].active_render = True
    arm.name, mesh.name = tag + '_arm', tag + '_mesh'
    return arm, mesh


bpy.ops.wm.read_factory_settings(use_empty=True)
barm, bmesh_o = load(BASE, 'base')
darm, dmesh = load(DONOR, 'donor')


def bone_w(arm, name):
    return arm.matrix_world @ arm.data.bones[name].head_local


def mat_index(o, key):
    return [i for i, m in enumerate(o.data.materials) if m and key in m.name.lower()]


def img_of(m):
    for n in m.node_tree.nodes:
        if n.type == 'TEX_IMAGE' and n.image and 'color' in os.path.basename(n.image.filepath).lower():
            return n.image


# --- 1. alignment donor -> base
be = (bone_w(barm, 'Bip01 LEye'), bone_w(barm, 'Bip01 REye'))
de = (bone_w(darm, 'Bip01 LEye'), bone_w(darm, 'Bip01 REye'))
s = (be[0] - be[1]).length / (de[0] - de[1]).length
bm_, dm_ = (be[0] + be[1]) / 2, (de[0] + de[1]) / 2
A = Matrix.Translation(bm_) @ Matrix.Scale(s, 4) @ Matrix.Translation(-dm_)
print('align scale', round(s, 3), 'offset', tuple(round(x, 3) for x in (bm_ - dm_)))

# donor head geometry in world, aligned
dme = dmesh.data
dhead = set(mat_index(dmesh, 'head'))
dW = dmesh.matrix_world
dverts = [A @ (dW @ v.co) for v in dme.vertices]
dpolys = [list(p.vertices) for p in dme.polygons if p.material_index in dhead]
dbvh = BVHTree.FromPolygons(dverts, dpolys)

# --- 2. base head deformation
me = bmesh_o.data
W = bmesh_o.matrix_world
Wi = W.inverted()
bhead = set(mat_index(bmesh_o, 'head'))
hv = sorted({v for p in me.polygons if p.material_index in bhead for v in p.vertices})
hvi = {v: i for i, v in enumerate(hv)}
gi = {g.index: g.name for g in bmesh_o.vertex_groups}
FACE = lambda n: n.startswith('Bip01 ') and n[6:] not in ('Neck', 'Spine', 'Spine1', 'Spine2', 'Pelvis') and ' ' not in n[6:]
pos = np.array([tuple(W @ me.vertices[v].co) for v in hv])
nrm = np.array([tuple((W.to_3x3() @ me.vertices[v].normal).normalized()) for v in hv])
wh = np.zeros(len(hv)); eye = np.full(len(hv), -1)
for i, v in enumerate(hv):
    for g in me.vertices[v].groups:
        n = gi[g.group]
        if FACE(n):
            wh[i] += g.weight
        if n in ('Bip01 LEye', 'Bip01 REye') and g.weight > 0.5:
            eye[i] = 0 if n == 'Bip01 LEye' else 1
wh = np.clip(wh, 0, 1)
disp = np.zeros_like(pos); fixed = np.zeros(len(hv), bool)
MAXD = 0.025
for i in range(len(hv)):
    if eye[i] >= 0:
        e = 'Bip01 LEye' if eye[i] == 0 else 'Bip01 REye'
        disp[i] = np.array(A @ bone_w(darm, e)) - np.array(bone_w(barm, e)); fixed[i] = True
        continue
    co, n, _, d = dbvh.find_nearest(Vector(pos[i]), MAXD)
    if co is not None and n.dot(Vector(nrm[i])) > 0.55:
        disp[i] = np.array(co) - pos[i]; fixed[i] = True
print('matched', int(fixed.sum()), '/', len(hv))
# graph for diffusion
nb = [[] for _ in hv]
for e in me.edges:
    a, b = e.vertices
    if a in hvi and b in hvi:
        nb[hvi[a]].append(hvi[b]); nb[hvi[b]].append(hvi[a])
for it in range(80):
    new = disp.copy()
    for i in range(len(hv)):
        if not fixed[i] and nb[i]:
            new[i] = disp[nb[i]].mean(0)
    disp = new
# smooth the matched field a little too (nearest-point jitter), keeping eyes rigid
for it in range(3):
    new = disp.copy()
    for i in range(len(hv)):
        if eye[i] < 0 and nb[i]:
            new[i] = 0.5 * disp[i] + 0.5 * disp[nb[i]].mean(0)
    disp = new
# head weight falloff (neck keeps the base shape) with a smoothstep
w = wh * wh * (3 - 2 * wh)
# the facial FBX carries 175 shape keys (visemes, expressions): the same offset goes into every key, so the
# basis takes the donor face and each expression keeps its own relative movement
W3i = Wi.to_3x3()
for i, v in enumerate(hv):
    dl = W3i @ Vector(w[i] * disp[i])
    me.vertices[v].co += dl
    if me.shape_keys:
        for kb in me.shape_keys.key_blocks:
            kb.data[v].co += dl
me.update()

# --- 3. face bones to the donor positions (rest pose)
bpy.context.view_layer.objects.active = barm
bpy.ops.object.mode_set(mode='EDIT')
bWi = barm.matrix_world.inverted()
moved = 0
for eb in barm.data.edit_bones:
    n = eb.name
    if FACE(n) and n != 'Bip01 Head':
        db = darm.data.bones.get(n)
        if db:
            eb.head = bWi @ (A @ (darm.matrix_world @ db.head_local))
            eb.tail = bWi @ (A @ (darm.matrix_world @ db.tail_local))
            moved += 1
bpy.ops.object.mode_set(mode='OBJECT')
print('face bones moved', moved)

# --- 4. bake donor colour onto base head UVs
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 1
dh_img = img_of(dme.materials[min(dhead)])
bh_mat = me.materials[min(bhead)]
bh_img = img_of(bh_mat)
SZ = bh_img.size[0]
# donor: emission of its own colour, aligned in world
dmesh.matrix_world = A @ dmesh.matrix_world
for m in dme.materials:
    nt = m.node_tree
    im = next((n for n in nt.nodes if n.type == 'TEX_IMAGE' and n.image and 'color' in os.path.basename(n.image.filepath).lower()), None)
    out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
    em = nt.nodes.new('ShaderNodeEmission')
    if im and m.name.lower().endswith('head'):
        nt.links.new(im.outputs['Color'], em.inputs['Color'])
    else:
        em.inputs['Color'].default_value = (1, 0, 1, 1)  # body / hair: marked, rejected in compositing
    nt.links.new(em.outputs[0], out.inputs['Surface'])
# drop donor armature modifier influence: bake on rest shape (already rest), keep modifier off
for md in dmesh.modifiers:
    md.show_render = md.show_viewport = False
for md in bmesh_o.modifiers:
    md.show_render = md.show_viewport = False
bake = bpy.data.images.new('bake', SZ, SZ, alpha=True, float_buffer=False)
bake.generated_color = (0, 0, 0, 0)
nt = bh_mat.node_tree
bn = nt.nodes.new('ShaderNodeTexImage'); bn.image = bake
for n in nt.nodes: n.select = False
bn.select = True; nt.nodes.active = bn
# only the head polys of the base take part: other materials get a dummy active image too
for m in me.materials:
    if m is bh_mat:
        continue
    d = m.node_tree.nodes.new('ShaderNodeTexImage'); d.image = bpy.data.images.new('dummy', 8, 8)
    for n in m.node_tree.nodes: n.select = False
    d.select = True; m.node_tree.nodes.active = d
# bake source: a copy of the donor with only its outer head skin (no body, hair, mouth inside, teeth, eyeballs:
# those sit in the lower-left of the Rocketbox head UVs), so a ray can only pick up face skin
dbk = dmesh.copy(); dbk.data = dmesh.data.copy(); sc.collection.objects.link(dbk)
bmk = bmesh.new(); bmk.from_mesh(dbk.data)
# interior faces (mouth inside, teeth, tongue, hidden eyeball parts): a ray leaving the face along its normal hits
# the head again (the UV layouts differ between avatars, so this is decided on the geometry)
# some donors have flipped faces (normals inward): made consistent first, else rays and the test below fail
bmesh.ops.recalc_face_normals(bmk, faces=[f for f in bmk.faces if f.material_index in dhead])
bmk.normal_update(); KU = 1.0 / dmesh.matrix_world.to_scale()[0]
hb = BVHTree.FromPolygons([tuple(v.co) for v in bmk.verts], [[v.index for v in f.verts] for f in bmk.faces if f.material_index in dhead])
def inner(f):
    c = f.calc_center_median(); n = f.normal
    # seen from 30 cm outside along its own normal: is it the first surface the ray meets?
    o = c + n * 0.3 * KU
    hit = hb.ray_cast(o, -n, 0.4 * KU)
    return hit[0] is None or (hit[0] - c).length > 0.0015 * KU
drop = [f for f in bmk.faces if f.material_index not in dhead or inner(f)]
print('bake source: inner faces dropped', sum(1 for f in drop if f.material_index in dhead))
bmesh.ops.delete(bmk, geom=drop, context='FACES')
bmk.to_mesh(dbk.data); bmk.free()
dbk.matrix_world = dmesh.matrix_world
bpy.ops.object.select_all(action='DESELECT')
dbk.select_set(True); bmesh_o.select_set(True)
bpy.context.view_layer.objects.active = bmesh_o
sc.render.bake.use_selected_to_active = True
# these distances are in the active object's space (the Rocketbox meshes are in cm under a 0.01 scale)
BK = 1.0 / bmesh_o.matrix_world.to_scale()[0]
sc.render.bake.cage_extrusion = 0.012 * BK
sc.render.bake.max_ray_distance = 0.03 * BK
sc.render.bake.margin = 0
sc.render.bake.use_clear = True
bpy.ops.object.bake(type='EMIT')
B = np.array(bake.pixels[:]).reshape(SZ, SZ, 4)
O = np.array(bh_img.pixels[:]).reshape(SZ, SZ, 4)
bake.filepath_raw = os.path.join(OUTDIR, NAME + '_raw.png'); bake.file_format = 'PNG'; bake.save()
mag = (B[..., 0] > 0.5) & (B[..., 2] > 0.5) & (B[..., 1] < 0.5 * np.minimum(B[..., 0], B[..., 2]))
hit = (B[..., :3].sum(-1) > 0.03) & ~mag
# erode 2 px: the island borders mix with the background
for _ in range(2):
    hit = hit & np.roll(hit, 1, 0) & np.roll(hit, -1, 0) & np.roll(hit, 1, 1) & np.roll(hit, -1, 1)
# per-channel tone ratio donor/base on hit pixels (skin of the face area)
# skin pixels only (the painted hair and the eyebrows would darken the ratio): bright enough, r > g > b, in both
lb = B[..., :3] @ np.array([0.3, 0.59, 0.11]); lo_ = O[..., :3] @ np.array([0.3, 0.59, 0.11])
skin = hit & (lb > 0.28) & (lo_ > 0.28) & (B[..., 0] > B[..., 1]) & (B[..., 1] > B[..., 2]) & (O[..., 0] > O[..., 1]) & (O[..., 1] > O[..., 2])
ratio = (B[skin][:, :3].mean(0) + 1e-4) / (O[skin][:, :3].mean(0) + 1e-4)
print('hit px', int(hit.sum()), 'tone ratio', np.round(ratio, 3))
Ot = O.copy(); Ot[..., :3] = np.clip(O[..., :3] * ratio, 0, 1)
# holes (no ray hit) surrounded by hits: filled by diffusion of the donor colour (pull-push), not with the base skin
F = np.where(hit[..., None], B[..., :3], 0.0); K = hit.astype(float)
near = hit.copy()
for _ in range(40):
    Fs = sum(np.roll(np.roll(F, dy, 0), dx, 1) for dy in (-1, 0, 1) for dx in (-1, 0, 1))
    Ks = sum(np.roll(np.roll(K, dy, 0), dx, 1) for dy in (-1, 0, 1) for dx in (-1, 0, 1))
    grow = (Ks > 0) & ~hit
    F = np.where(hit[..., None], B[..., :3], np.where(grow[..., None], Fs / np.maximum(Ks, 1e-6)[..., None], 0))
    K = np.where(hit | grow, 1.0, 0.0)
filled = (K > 0) & ~hit
# only small holes (within 24 px of hits on all sides is approximated by: inside the hit region's closing)
B[..., :3] = np.where(filled[..., None], F, B[..., :3])
hit = hit | filled
# soft mask: blur the hit mask a few px so the seam fades
mk = hit.astype(float)
for _ in range(6):
    mk = (mk + np.roll(mk, 1, 0) + np.roll(mk, -1, 0) + np.roll(mk, 1, 1) + np.roll(mk, -1, 1)) / 5
mk = np.where(hit, np.maximum(mk, 0.0), 0) ** 0.5
# the donors' head textures are not painted under the collar (hidden by clothes): the donor colour is taken only
# where the base skin follows the head (its head weight, rasterised in UV space), the neck and chest keep the
# base skin tinted to the donor tone
from PIL import Image as PImage, ImageDraw, ImageFilter
wmap = PImage.new('L', (SZ, SZ), 0); dr = ImageDraw.Draw(wmap)
uvd = me.uv_layers[0].data
wv = {v: float(w[i]) for i, v in enumerate(hv)}
for p in me.polygons:
    if p.material_index not in bhead:
        continue
    val = sum(wv.get(v, 0) for v in p.vertices) / len(p.vertices)
    val = min(1.0, max(0.0, (val - 0.55) / 0.35))
    dr.polygon([(uvd[li].uv[0] * SZ, (1 - uvd[li].uv[1]) * SZ) for li in p.loop_indices], fill=int(val * 255))
wmap = wmap.filter(ImageFilter.GaussianBlur(SZ / 256))
WM = np.flipud(np.asarray(wmap, dtype=float) / 255.0)
mk = mk * WM
# tone ratio again, on the face skin only (inside the head weight map)
skin2 = skin & (WM > 0.6)
ratio = (B[skin2][:, :3].mean(0) + 1e-4) / (O[skin2][:, :3].mean(0) + 1e-4)
print('tone ratio (face skin)', np.round(ratio, 3), int(skin2.sum()))
Ot = O.copy(); Ot[..., :3] = np.clip(O[..., :3] * ratio, 0, 1)
R = Ot.copy(); R[..., :3] = mk[..., None] * B[..., :3] + (1 - mk[..., None]) * Ot[..., :3]; R[..., 3] = 1
# the inner parts (eyeballs, teeth, mouth inside: lower-left of the UVs) keep the base texture untouched
yy, xx = np.mgrid[0:SZ, 0:SZ]
inner_px = (xx < 0.3 * SZ) & (yy < 0.4 * SZ)
R[inner_px] = O[inner_px]
head_png = os.path.join(OUTDIR, NAME + '_head_color.png')
ri = bpy.data.images.new(NAME + '_head', SZ, SZ); ri.pixels = R.ravel(); ri.filepath_raw = head_png; ri.file_format = 'PNG'; ri.save(); ri = bpy.data.images.load(os.path.abspath(head_png))
# body tinted to the same tone
bb_img = img_of(me.materials[[i for i in range(len(me.materials)) if i not in bhead][0]])
BS = bb_img.size
Bb = np.array(bb_img.pixels[:]).reshape(BS[1], BS[0], 4); Bb[..., :3] = np.clip(Bb[..., :3] * ratio, 0, 1)
body_png = os.path.join(OUTDIR, NAME + '_body_color.png')
rb = bpy.data.images.new(NAME + '_body', BS[0], BS[1]); rb.pixels = Bb.ravel(); rb.filepath_raw = body_png; rb.file_format = 'PNG'; rb.save(); rb = bpy.data.images.load(os.path.abspath(body_png))

# reassign: base materials read the new textures
for m in me.materials:
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type == 'TEX_IMAGE' and n.image and n.image.name in ('bake', 'dummy') or (n.type == 'TEX_IMAGE' and n.image and n.image.name.startswith('dummy')):
            nt.nodes.remove(n)
    im = next((n for n in nt.nodes if n.type == 'TEX_IMAGE' and n.image and 'color' in os.path.basename(n.image.filepath).lower()), None)
    if im:
        im.image = ri if m is bh_mat else rb

# --- 5. donor hair / lashes (opacity material) into the base mesh
dop = set(mat_index(dmesh, 'opacity'))
# NO_HAIR_CARDS=1: the short hair painted in the donor's head texture is enough (Naël: its hair cards drew dark
# jagged patches on the top of the head in the app)
if os.environ.get('NO_HAIR_CARDS') == '1':
    dop = set()
if dop:
    for md in bmesh_o.modifiers:
        md.show_render = md.show_viewport = True
    dmesh.matrix_world = A @ dW  # already set; keep
    bpy.ops.object.select_all(action='DESELECT')
    dup = dmesh.copy(); dup.data = dmesh.data.copy(); sc.collection.objects.link(dup)
    bm = bmesh.new(); bm.from_mesh(dup.data)
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.material_index not in dop], context='FACES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    bm.to_mesh(dup.data); bm.free()
    # restore donor opacity material (emission was injected): rebuild a principled with alpha
    om = dup.data.materials[min(dop)]
    # the app names its parts by material (src/three/photoMaterials.ts): the donor's hair, brows and lashes cards
    om.name = 'Hair_opacity'
    nt = om.node_tree
    im = next((n for n in nt.nodes if n.type == 'TEX_IMAGE' and n.image and 'color' in os.path.basename(n.image.filepath).lower()), None)
    bs = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None) or nt.nodes.new('ShaderNodeBsdfPrincipled')
    out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
    nt.links.new(im.outputs['Color'], bs.inputs['Base Color']); nt.links.new(im.outputs['Alpha'], bs.inputs['Alpha'])
    nt.links.new(bs.outputs[0], out.inputs['Surface'])
    for md in dup.modifiers:
        dup.modifiers.remove(md)
    dup.parent = None
    dup.matrix_world = A @ dW
    # hair moves with the base face shape around it: re-parent to base armature space by joining
    dup.select_set(True); bmesh_o.select_set(True); bpy.context.view_layer.objects.active = bmesh_o
    bpy.ops.object.join()
    print('hair faces copied', sum(1 for p in bmesh_o.data.polygons if bmesh_o.data.materials[p.material_index] is om))
for md in bmesh_o.modifiers:
    md.show_render = md.show_viewport = True
bpy.data.objects.remove(dbk); bpy.data.objects.remove(dmesh); bpy.data.objects.remove(darm)
bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('SAVED', OUT)
