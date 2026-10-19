"""Combat Shadow Studio - coach generator (Blender bpy + MPFB2; every input asset is CC0).

Usage: python build.py -- <male|female> <out_dir> <eyes.mhclo> <eye_texture.png> [texture_size]

Pipeline: MakeHuman base mesh + modeling targets -> Mixamo-compatible rig -> clothes and hair
shells cut from the body / MakeHuman helper geometry -> skin texture painted per texel from a
baked position map (brows, hair, lips...) and multiplied by baked ambient occlusion -> GLB.
"""
import bpy, bmesh, sys, os, math
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree

argv = sys.argv[sys.argv.index("--") + 1:]
WHO, OUT, EYES, EYETEX = argv[0], argv[1], argv[2], argv[3]
TEX = int(argv[4]) if len(argv) > 4 else 2048
MALE = WHO == "male"
# "manga": taller fighter proportions for the drawn styles. Since v0.18.0 both styles keep a natural,
# harmonious musculature (Youssef, 19/10: "pas de musculature proéminente")
STYLE = os.environ.get("CSS_STYLE", "realiste")
MANGA = STYLE == "manga"
SUFFIX = "_manga" if MANGA else ""
# one fixed coach (tools/generator/coaches/recipes/<id>.json): its own body and face targets
RECIPE = None
if os.environ.get("CSS_RECIPE"):
    import json
    RECIPE = json.load(open(os.environ["CSS_RECIPE"]))
    SUFFIX += "_" + RECIPE["id"]
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(RECIPE.get("seed", 7) if RECIPE else 7 if MALE else 11)

import addon_utils
addon_utils.enable("bl_ext.user_default.mpfb", default_set=True)
from bl_ext.user_default.mpfb.services.humanservice import HumanService
from bl_ext.user_default.mpfb.services.targetservice import TargetService
from bl_ext.user_default.mpfb.services.locationservice import LocationService

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)

# ---------------------------------------------------------------- body shape
T = LocationService.get_mpfb_data("targets")
macro = TargetService.get_default_macro_info_dict()
if MALE:
    macro.update(dict(gender=1.0, age=0.5, muscle=0.58, weight=0.5, height=0.55, proportions=1.0))
    macro["race"] = dict(african=0.15, asian=0.15, caucasian=0.7)
else:
    macro.update(dict(gender=0.0, age=0.48, muscle=0.52, weight=0.45, height=0.66, proportions=0.8,
                      cupsize=0.42, firmness=0.75))
    macro["race"] = dict(african=0.1, asian=0.2, caucasian=0.7)
if MANGA:
    if MALE:
        macro.update(dict(muscle=0.6, weight=0.5, height=0.72, proportions=1.0))
    else:
        macro.update(dict(muscle=0.52, weight=0.48, height=0.62, proportions=1.0))
if RECIPE:
    macro.update(RECIPE["macro"])
    macro["race"] = RECIPE["race"]
h = HumanService.create_human(macro_detail_dict=macro)


def tgt(path, w):
    TargetService.load_target(h, os.path.join(T, path + ".target.gz"), weight=w)


def both(p, w):
    tgt(p.replace("X", "l"), w)
    tgt(p.replace("X", "r"), w)


if MALE:
    single = [("torso/torso-muscle-pectoral-incr", .2), ("torso/torso-muscle-dorsi-incr", .15),
              ("torso/torso-vshape-incr", .1), ("stomach/stomach-tone-incr", .4),
              ("neck/measure-neck-circ-incr", .15), ("neck/measure-neck-height-decr", .5),
              ("eyebrows/eyebrows-trans-down", .35), ("eyebrows/eyebrows-angle-down", .25),
              ("chin/chin-prominent-incr", .4), ("chin/chin-width-incr", .35), ("head/head-square", .35),
              ("mouth/mouth-angles-down", .12), ("forehead/forehead-trans-forward", .2)]
    paired = [("arms/X-upperarm-muscle-incr", .15), ("arms/X-upperarm-shoulder-muscle-incr", .1),
              ("arms/X-lowerarm-muscle-incr", .1), ("legs/X-upperleg-muscle-incr", .15),
              ("legs/X-lowerleg-muscle-incr", .1), ("cheek/X-cheek-bones-incr", .35),
              ("eyes/X-eye-height2-decr", .25), ("cheek/X-cheek-volume-decr", .3)]
else:
    single = [("stomach/stomach-tone-incr", .5), ("torso/torso-vshape-incr", .15),
              ("torso/torso-muscle-dorsi-incr", .3), ("neck/measure-neck-height-decr", .3),
              ("eyebrows/eyebrows-trans-down", .15), ("eyebrows/eyebrows-angle-down", .1),
              ("head/head-oval", .35), ("mouth/mouth-upperlip-volume-incr", .2)]
    paired = [("arms/X-upperarm-muscle-incr", .2), ("arms/X-upperarm-shoulder-muscle-incr", .2),
              ("arms/X-upperarm-fat-decr", .4), ("legs/X-upperleg-muscle-incr", .3),
              ("legs/X-lowerleg-muscle-incr", .3), ("cheek/X-cheek-bones-incr", .3),
              ("cheek/X-cheek-volume-decr", .25)]
if MANGA and MALE:
    single = [("torso/torso-muscle-pectoral-incr", .25), ("torso/torso-muscle-dorsi-incr", .2),
              ("torso/torso-vshape-incr", .2), ("stomach/stomach-tone-incr", .45),
              ("torso/measure-shoulder-dist-incr", .15), ("torso/measure-waist-circ-decr", .15),
              ("neck/measure-neck-circ-incr", .2), ("neck/measure-neck-height-decr", .35),
              ("eyebrows/eyebrows-trans-down", .6), ("eyebrows/eyebrows-angle-down", .45),
              ("chin/chin-prominent-incr", .7), ("chin/chin-width-incr", .6), ("head/head-square", .7),
              ("mouth/mouth-angles-down", .2), ("forehead/forehead-trans-forward", .3)]
    paired = [("arms/X-upperarm-muscle-incr", .2), ("arms/X-upperarm-shoulder-muscle-incr", .15),
              ("arms/X-lowerarm-muscle-incr", .15), ("legs/X-upperleg-muscle-incr", .2),
              ("legs/X-lowerleg-muscle-incr", .15), ("cheek/X-cheek-bones-incr", .6),
              ("eyes/X-eye-height2-decr", .3), ("cheek/X-cheek-volume-decr", .5)]
elif MANGA:
    single = [("stomach/stomach-tone-incr", .55), ("torso/torso-vshape-incr", .25),
              ("torso/torso-muscle-dorsi-incr", .3), ("neck/measure-neck-height-decr", .3),
              ("eyebrows/eyebrows-trans-down", .2), ("eyebrows/eyebrows-angle-down", .25),
              ("head/head-oval", .35), ("torso/measure-waist-circ-decr", .3)]
    paired = [("arms/X-upperarm-muscle-incr", .15), ("arms/X-upperarm-shoulder-muscle-incr", .15),
              ("arms/X-upperarm-fat-decr", .4), ("arms/X-lowerarm-muscle-incr", .1),
              ("legs/X-upperleg-muscle-incr", .2), ("legs/X-lowerleg-muscle-incr", .15),
              ("cheek/X-cheek-bones-incr", .5), ("cheek/X-cheek-volume-decr", .4)]
if RECIPE:
    single = [tuple(x) for x in RECIPE["single"]]
    paired = [tuple(x) for x in RECIPE["paired"]]
for p, w in single:
    tgt(p, w)
for p, w in paired:
    both(p, w)

rig = HumanService.add_builtin_rig(h, "mixamo")
eyes = HumanService.add_mhclo_asset(EYES, h, asset_type="Eyes", subdiv_levels=0, material_type="MAKESKIN")

bpy.context.view_layer.objects.active = h
for o in bpy.data.objects:
    o.select_set(o == h)
bpy.ops.object.shape_key_remove(all=True, apply_mix=True)

# --------------------------------------------------------------- landmarks
vg = {g.name: g.index for g in h.vertex_groups}


def members(name, thr=0.5):
    gi = vg[name]
    return [v for v in h.data.vertices if any(g.group == gi and g.weight > thr for g in v.groups)]


def center(name):
    vs = [v.co for v in members(name, 0.0)]
    return sum(vs, Vector()) / len(vs)


EYE_L, EYE_R = center("joint-l-eye"), center("joint-r-eye")
HEAD_LO, HEAD_TOP = center("joint-head"), center("joint-head-2")
NECK, PELVIS = center("joint-neck"), center("joint-pelvis")
KNEE = center("joint-l-knee")
MOUTH = center("joint-mouth")
K = (HEAD_TOP.z - HEAD_LO.z) / 0.162  # head scale relative to the male reference
nip = members("nipple")
NIP_Z = sum(v.co.z for v in nip) / len(nip)
NIP_X = sum(abs(v.co.x) for v in nip) / len(nip)
SH_X = abs(center("joint-l-shoulder").x)
# landmarks for the anatomical relief (left side; the right side is mirrored)
J_ANAT = {k: np.array(center(v)[:]) for k, v in dict(shoulder="joint-l-shoulder", elbow="joint-l-elbow", wrist="joint-l-hand",
          hip="joint-l-upper-leg", knee="joint-l-knee", ankle="joint-l-ankle", neck="joint-neck", pelvis="joint-pelvis").items()}
EAR_TOP = max(v.co.z for v in members("ears"))
EZ = EYE_L.z
lips_v = members("lips", 0.2)
LIPS_Z = sum(v.co.z for v in lips_v) / len(lips_v)
FACE_Y = min(v.co.y for v in members("body") if v.co.z > EZ - 0.02 and abs(v.co.x) < 0.01)
print("LANDMARKS eye", EYE_L, "head", HEAD_TOP, "K", K, "faceY", FACE_Y)


def smooth(e0, e1, x):
    t = np.clip((np.asarray(x, dtype=float) - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def hair_limit(x, y):
    """z of the hairline for a point at (x, y) on the head (vectorised)."""
    x, y = np.abs(np.asarray(x, float)), np.asarray(y, float)
    front = smooth(0.05 * K, -0.10 * K, y)  # 1 on the forehead, 0 at the back of the head
    back_z = EZ - (0.072 if MALE else 0.09) * K
    lim = (EZ + (0.058 if MALE else 0.052) * K) * front + back_z * (1 - front)
    # temples recede a little; above the ears on the sides; sideburns down to mid ear
    lim = lim + 0.012 * K * smooth(0.03 * K, 0.055 * K, x) * front
    side = smooth(0.055 * K, 0.07 * K, x) * smooth(0.04 * K, -0.0, y)
    lim = np.maximum(lim, (EAR_TOP + 0.003) * side + (lim) * (1 - side))
    burn = smooth(0.064 * K, 0.07 * K, x) * smooth(-0.075 * K, -0.06 * K, y) * smooth(-0.03 * K, -0.045 * K, y)
    return lim - (EAR_TOP - (EZ - 0.012 * K)) * burn * (0.9 if MALE else 0.4)


# ---------------------------------------------------------- helper meshes
def sub_object(name, face_pred, src):
    bpy.ops.object.select_all(action="DESELECT")
    src.select_set(True)
    bpy.context.view_layer.objects.active = src
    bpy.ops.object.duplicate()
    o = bpy.context.object
    o.name = name
    o.modifiers.clear()
    bm = bmesh.new()
    bm.from_mesh(o.data)
    kill = [f for f in bm.faces if not face_pred([v.co for v in f.verts], f)]
    bmesh.ops.delete(bm, geom=kill, context="FACES")
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
    bm.to_mesh(o.data)
    bm.free()
    return o


def cut_object(name, planes, keep, src):
    """Duplicate src, slice it with planes (co, normal) for clean edges, keep faces whose centroid
    satisfies keep(c) and whose vertices all belong to the visible body."""
    bpy.ops.object.select_all(action="DESELECT")
    src.select_set(True)
    bpy.context.view_layer.objects.active = src
    bpy.ops.object.duplicate()
    o = bpy.context.object
    o.name = name
    o.modifiers.clear()
    bm = bmesh.new()
    bm.from_mesh(o.data)
    for co, no in planes:
        geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
        bmesh.ops.bisect_plane(bm, geom=geom, plane_co=Vector(co), plane_no=Vector(no))
    dl = bm.verts.layers.deform.active
    gi = vg["body"]
    def visible(f):
        return all(v[dl].get(gi, 0.0) > 0.5 for v in f.verts)
    kill = [f for f in bm.faces if not (visible(f) and keep(f.calc_center_median()))]
    bmesh.ops.delete(bm, geom=kill, context="FACES")
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
    bm.to_mesh(o.data)
    bm.free()
    return o


body_idx = set(v.index for v in members("body"))
body = sub_object("Body", lambda cs, f: all(v.index in body_idx for v in f.verts), h)
tree = BVHTree.FromObject(body, bpy.context.evaluated_depsgraph_get())


def project_shell(o, thickness_fn):
    for v in o.data.vertices:
        loc, nrm, _, _ = tree.find_nearest(v.co)
        if loc is not None:
            v.co = loc + nrm.normalized() * thickness_fn(loc)


# Hair volume: a shell over the scalp that tapers to nothing at the hairline, so the painted
# hairline on the skin texture and the shell meet without a visible edge.
def on_head(c):
    return c.z > EZ - 0.11 * K and abs(c.y - HEAD_LO.y) < 0.14 * K and abs(c.x) < 0.11 * K


hair = sub_object("Hair", lambda cs, f: all(on_head(c) for c in cs) and any(c.z > hair_limit(c.x, c.y) - 0.012 * K for c in cs), body)
HAIR_T = (0.0042 if MALE else 0.009) * K
project_shell(hair, lambda p: 0.0003 + HAIR_T * float(smooth(-0.002 * K, 0.035 * K, p.z - hair_limit(p.x, p.y)))
              * (1 - 0.6 * float(smooth(0.05 * K, 0.075 * K, abs(p.x)))) if MALE else
              0.0003 + HAIR_T * float(smooth(-0.002 * K, 0.02 * K, p.z - hair_limit(p.x, p.y))))

# Shorts: body between mid thigh and the waist (arms excluded), sliced for clean hems
HEM = KNEE.z + (0.42 if MALE else 0.62) * (PELVIS.z - KNEE.z)
WAIST = PELVIS.z + (0.085 if MALE else 0.055) * K
HIP_W = 0.26 * K
shorts = cut_object("Shorts", [((0, 0, HEM), (0, 0, 1)), ((0, 0, WAIST), (0, 0, 1))],
                    lambda c: HEM < c.z < WAIST and abs(c.x) < HIP_W, h)
if MALE:
    project_shell(shorts, lambda p: 0.006 + 0.011 * (1 - float(smooth(HEM, HEM + 0.25 * K, p.z))))
else:
    project_shell(shorts, lambda p: 0.0035)

top = None
if not MALE:
    UNDER = NIP_Z - 0.075 * K
    TOP_F = NIP_Z + 0.07 * K
    ARM = SH_X - 0.035 * K
    S1, S2 = NIP_X * 0.55, NIP_X * 0.55 + 0.034 * K
    planes = [((0, 0, UNDER), (0, 0, 1)), ((0, 0, TOP_F), (0, 0, 1))]
    for sx in (1, -1):
        planes += [((sx * ARM, 0, 0), (1, 0, 0)), ((sx * S1, 0, 0), (1, 0, 0)), ((sx * S2, 0, 0), (1, 0, 0))]

    def bra_keep(c):
        ax = abs(c.x)
        if UNDER < c.z < TOP_F:
            return ax < ARM
        return TOP_F <= c.z < NECK.z + 0.03 and S1 < ax < S2

    top = cut_object("Top", planes, bra_keep, h)
    project_shell(top, lambda p: 0.0035)

# --------------------------------------------------------------- materials
def principled(name, color, rough=0.6):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    return m


# Eyes: recolor the MakeHuman iris to a dark brown, simple glossy material
from PIL import Image
eimg = np.asarray(Image.open(EYETEX).convert("RGBA")).astype(np.float32) / 255
r, g, b_ = eimg[..., 0], eimg[..., 1], eimg[..., 2]
iris = np.clip((r - g) * 4 - 0.2, 0, 1)[..., None]  # reddish pixels are the iris
lum = (0.3 * r + 0.59 * g + 0.11 * b_)[..., None]
brown = np.concatenate([lum * 1.15, lum * 0.78, lum * 0.5], -1)
eimg[..., :3] = eimg[..., :3] * (1 - iris) + brown * iris
eye_png = os.path.join(OUT, WHO + SUFFIX + "_eye.png")
Image.fromarray((np.clip(eimg, 0, 1) * 255).astype(np.uint8)).save(eye_png)
em = bpy.data.materials.new("Eyes")
em.use_nodes = True
tn = em.node_tree.nodes.new("ShaderNodeTexImage")
tn.image = bpy.data.images.load(eye_png)
em.node_tree.links.new(tn.outputs["Color"], em.node_tree.nodes["Principled BSDF"].inputs["Base Color"])
em.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.06
eyes.data.materials.clear()
eyes.data.materials.append(em)
_bm = bmesh.new(); _bm.from_mesh(eyes.data); _uv = _bm.loops.layers.uv.active
_kill = [f for f in _bm.faces if all(l[_uv].uv.x > 0.85 and l[_uv].uv.y < 0.15 for l in f.loops)]
print("CORNEA faces removed", len(_kill))
bmesh.ops.delete(_bm, geom=_kill, context="FACES"); _bm.to_mesh(eyes.data); _bm.free()
eyes.modifiers.clear()

shorts.data.materials.append(principled("Shorts", (0.80, 0.79, 0.76) if MALE else (0.03, 0.03, 0.035), 0.8))
if top:
    top.data.materials.append(principled("Top", (0.03, 0.03, 0.035), 0.75))

# region masks (vertex colors) for the texture painter: lips, areola, nails
lips_w = {v.index: max(g.weight for g in v.groups if g.group == vg["lips"]) for v in members("lips", 0.0)}
nip_w = {v.index: 1.0 for v in members("nipple", 0.0)}
nail_w = {v.index: 1.0 for v in members("fingernails", 0.3) + members("toenails", 0.3)}
kd = KDTree(len(h.data.vertices))
for v in h.data.vertices:
    kd.insert(v.co, v.index)
kd.balance()
ca = body.data.color_attributes.new("regions", "FLOAT_COLOR", "POINT")
for v in body.data.vertices:
    _, oi, _ = kd.find(v.co)
    ca.data[v.index].color = (lips_w.get(oi, 0.0), nip_w.get(oi, 0.0), nail_w.get(oi, 0.0), 1)

# ------------------------------------------------- subdivide + rebind to rig
parts = [o for o in (body, hair, shorts, top) if o]
for o in parts:
    o.modifiers.clear()
    bpy.context.view_layer.objects.active = o
    for x in bpy.data.objects:
        x.select_set(x == o)
    bpy.ops.object.shade_smooth()
    sub = o.modifiers.new("Sub", "SUBSURF")
    sub.levels = 1
    bpy.ops.object.modifier_apply(modifier="Sub")
    if o in (shorts, top):
        so = o.modifiers.new("Solid", "SOLIDIFY")
        so.thickness = 0.003
        so.offset = -1
        bpy.ops.object.modifier_apply(modifier="Solid")
    for gr in list(o.vertex_groups):
        if not gr.name.startswith("mixamorig:"):
            o.vertex_groups.remove(gr)
    o.parent = rig
    am = o.modifiers.new("Armature", "ARMATURE")
    am.object = rig

eyes.parent = rig
for gr in list(eyes.vertex_groups):
    eyes.vertex_groups.remove(gr)
gh = eyes.vertex_groups.new(name="mixamorig:Head")
gh.add([v.index for v in eyes.data.vertices], 1.0, "REPLACE")
am = eyes.modifiers.new("Armature", "ARMATURE")
am.object = rig

if not MALE:
    # bun at the back of the head, rigid on the head bone
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, radius=1,
                                         location=(0, HEAD_LO.y + 0.112 * K, EZ + 0.04 * K))
    bun = bpy.context.object
    bun.name = "Bun"
    bun.scale = (0.046 * K, 0.04 * K, 0.042 * K)
    bpy.ops.object.transform_apply(scale=True)
    bpy.ops.object.shade_smooth()
    gb = bun.vertex_groups.new(name="mixamorig:Head")
    gb.add([v.index for v in bun.data.vertices], 1.0, "REPLACE")
    bun.parent = rig
    am = bun.modifiers.new("Armature", "ARMATURE")
    am.object = rig
    bun.data.materials.append(principled("BunHair", (0.03, 0.02, 0.014), 0.6))
    parts.append(bun)

bpy.data.objects.remove(h)

# ------------------------------------------------------------ texture bake
sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.device = "CPU"
sc.render.bake.margin = 6
for x in bpy.data.objects:
    x.select_set(x == body)
bpy.context.view_layer.objects.active = body

bake_mat = bpy.data.materials.new("BakeTmp")
bake_mat.use_nodes = True
body.data.materials.clear()
body.data.materials.append(bake_mat)
N, L = bake_mat.node_tree.nodes, bake_mat.node_tree.links
for n in list(N):
    N.remove(n)
out = N.new("ShaderNodeOutputMaterial")
emi = N.new("ShaderNodeEmission")
L.new(emi.outputs[0], out.inputs["Surface"])
img_node = N.new("ShaderNodeTexImage")
N.active = img_node


def bake_emit(src_socket, name):
    img = bpy.data.images.new(name, TEX, TEX, float_buffer=True, alpha=False)
    img.colorspace_settings.name = "Non-Color"
    img_node.image = img
    L.new(src_socket, emi.inputs["Color"])
    sc.cycles.samples = 1
    bpy.ops.object.bake(type="EMIT")
    return np.array(img.pixels[:], dtype=np.float32).reshape(TEX, TEX, 4)[..., :3]


geo = N.new("ShaderNodeNewGeometry")
attr = N.new("ShaderNodeVertexColor")
attr.layer_name = "regions"
P = bake_emit(geo.outputs["Position"], "pos")
NRM = bake_emit(geo.outputs["Normal"], "nrm")
REG = bake_emit(attr.outputs["Color"], "reg")
# coverage mask (texels that belong to the mesh): the bake leaves unused texels at 0
cover = np.linalg.norm(P, axis=-1) > 1e-5

# bake in a T-pose so the arms do not occlude the torso (they move freely at runtime)
rig.data.pose_position = "POSE"
for nm, ang in (("mixamorig:LeftArm", 1), ("mixamorig:RightArm", -1)):
    pb = rig.pose.bones[nm]
    pb.rotation_mode = "XYZ"
for side, sgn in (("Left", 1), ("Right", -1)):
    pb = rig.pose.bones[f"mixamorig:{side}Arm"]
    # rotate the upper arm up toward horizontal around the body's forward axis, in pose space
    import mathutils
    mw = rig.matrix_world
    axis_world = mathutils.Vector((0, 1, 0))  # Blender: -Y is forward, rotate about Y
    rest = pb.bone.matrix_local.to_3x3()
    axis_local = (rest.inverted() @ axis_world).normalized()
    pb.rotation_mode = "QUATERNION"
    pb.rotation_quaternion = mathutils.Quaternion(axis_local, -sgn * math.radians(38))
    fb = rig.pose.bones[f"mixamorig:{side}ForeArm"]
    rest_f = fb.bone.matrix_local.to_3x3()
    fb.rotation_mode = "QUATERNION"
    fb.rotation_quaternion = mathutils.Quaternion((rest_f.inverted() @ mathutils.Vector((0, 0, 1))).normalized(), sgn * math.radians(25))
bpy.context.view_layer.update()

# fixed coaches wear their outfit as a runtime layer: occlusion of the generator's own clothes and hair
# would leave dark bands on the skin where the coach's garments differ (a strap, the back of a top)
baked_hidden = [o for o in bpy.data.objects if RECIPE and o.type == "MESH" and o.name in ("Hair", "Shorts", "Top", "Bun")]
for o in baked_hidden:
    o.hide_render = True
img_ao = bpy.data.images.new("ao", TEX, TEX, float_buffer=True, alpha=False)
img_ao.colorspace_settings.name = "Non-Color"
img_node.image = img_ao
diff = N.new("ShaderNodeBsdfDiffuse")
L.new(diff.outputs[0], out.inputs["Surface"])
sc.world = bpy.data.worlds.new("W")
sc.world.light_settings.distance = 0.10 * K
sc.cycles.samples = 48
bpy.ops.object.bake(type="AO")
AO = np.array(img_ao.pixels[:], dtype=np.float32).reshape(TEX, TEX, 4)[..., 0]
sc.world.light_settings.distance = 0.025 * K
bpy.ops.object.bake(type="AO")
AO_FINE = np.array(img_ao.pixels[:], dtype=np.float32).reshape(TEX, TEX, 4)[..., 0]
for o in baked_hidden:
    o.hide_render = False

for pb in rig.pose.bones:
    pb.rotation_quaternion = (1, 0, 0, 0)
bpy.context.view_layer.update()
X, Y, Z = P[..., 0], P[..., 1], P[..., 2]
NY = NRM[..., 1]
# anatomical relief: furrows between the muscles (height map -> normal map, see anatomy.py)
RELIEF = os.environ.get("CSS_RELIEF", "1") == "1"
if RELIEF:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from anatomy import anatomy_height
    J_ANAT.update(nip_z=NIP_Z, nip_x=NIP_X, sh_x=SH_X)
    HGT = anatomy_height(P, NRM, J_ANAT, MALE, K)


def lin(c):
    return np.array(c, dtype=np.float32)


# skin base (linear rgb), with blotchy low frequency variation and fine pores
SKIN = lin((0.50, 0.265, 0.17) if MALE else (0.58, 0.33, 0.22))


def value_noise(scale, octaves=3):
    """cheap 3D value noise evaluated on the position map"""
    acc = np.zeros(X.shape, np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        s = scale * (2 ** o)
        f = np.sin(X * s * 1.7 + 1.3 * o) * np.sin(Y * s * 2.3 + 0.7) * np.sin(Z * s * 1.1 + 2.1 * o)
        f += np.sin((X + Z) * s * 0.9 + o) * np.cos((Y - X) * s * 1.3)
        acc += amp * f
        tot += amp
        amp *= 0.5
    return acc / tot * 0.5 + 0.5


blotch = value_noise(9.0)
col = SKIN[None, None, :] * (0.92 + 0.16 * blotch[..., None])
col *= (0.96 + 0.08 * rng.random(X.shape, dtype=np.float32))[..., None]  # pores
# redder extremities: hands, knees, elbows, cheeks, nose, ears
red = lin((1.06, 0.88, 0.86))
cheek = np.zeros_like(X)
for E in (EYE_L, EYE_R):
    d = np.sqrt(((X - E.x * 1.4) / K) ** 2 + ((Z - (E.z - 0.03 * K)) / K) ** 2)
    cheek = np.maximum(cheek, 1 - smooth(0.0, 0.03, d)) * (NY < -0.3)
nose = (1 - smooth(0.0, 0.012, np.abs(X) / K)) * smooth(EZ - 0.045 * K, EZ - 0.02 * K, Z) * (1 - smooth(EZ - 0.0, EZ + 0.01, Z)) * (Y < FACE_Y + 0.03)
knee = (1 - smooth(0.0, 0.07 * K, np.abs(Z - KNEE.z))) * (NY < -0.3)
hands = smooth(0.5 * SH_X * 2.2, 0.6 * SH_X * 2.2, np.abs(X)) * (Z < NECK.z)
extra = np.clip(0.5 * cheek + 0.5 * nose + 0.45 * knee + 0.4 * hands, 0, 1)[..., None]
col = col * (1 - extra) + col * red * extra

lips = REG[..., 0:1]
col = col * (1 - 0.8 * lips) + lin((0.42, 0.17, 0.15) if MALE else (0.5, 0.18, 0.17)) * 0.8 * lips
areola = REG[..., 1:2]
col = col * (1 - 0.85 * areola) + SKIN * lin((0.62, 0.5, 0.46)) * 0.85 * areola
nails = REG[..., 2:3]
col = col * (1 - 0.6 * nails) + lin((0.72, 0.5, 0.44)) * 0.6 * nails

# eyebrows: an arc above each eye, denser near the nose, painted with strand noise
strand = rng.random(X.shape, dtype=np.float32)
brow = np.zeros_like(X)
for E in (EYE_L, EYE_R):
    same = (X * E.x) > 0
    dx = (np.abs(X) - abs(E.x)) / K
    t = np.clip((dx + 0.016) / 0.05, 0, 1)
    zc = 0.017 + 0.0085 * np.sin(np.pi * np.clip(t * 1.3, 0, 1)) - 0.005 * t
    half = (0.0056 if MALE else 0.0036) * (1.15 - 0.6 * t)
    dz = (Z - E.z) / K - zc
    inside = (dx > -0.017) & (dx < 0.035) & same & (NY < -0.2)
    m = (1 - smooth(half * 0.5, half, np.abs(dz))) * (1 - smooth(0.028, 0.035, dx)) * smooth(-0.017, -0.012, dx)
    brow = np.maximum(brow, np.where(inside, m, 0))
brow = brow * (0.55 + 0.45 * strand)
BROWC = lin((0.035, 0.025, 0.02))
col = col * (1 - 0.9 * brow[..., None]) + BROWC * 0.9 * brow[..., None]

# lash line (no separate eyelash geometry): thin dark line on the upper lid
lash = np.zeros_like(X)
for E in (EYE_L, EYE_R):
    same = (X * E.x) > 0
    dx = (np.abs(X) - abs(E.x)) / K
    dz = (Z - E.z) / K
    curve = 0.0098 - 0.012 * (dx ** 2) / 0.016 ** 2 * 0.25
    m = (1 - smooth(0.0, 0.0018, np.abs(dz - curve))) * (1 - smooth(0.013, 0.017, np.abs(dx + 0.001)))
    lash = np.maximum(lash, np.where(same & (NY < -0.2), m, 0))
col = col * (1 - 0.85 * lash[..., None]) + lin((0.02, 0.015, 0.012)) * 0.85 * lash[..., None]

# fighter creator: hair, beard and body hair are painted at runtime (any colour, any style),
# so the skin is exported clean and their areas go into a separate mask texture
EDITOR = os.environ.get("CSS_EDITOR") == "1"
jaw_all = (Z < EZ - 0.045 * K) & (Z > MOUTH.z - 0.07 * K) & (Y < HEAD_LO.y + 0.02 * K)
jawm_all = smooth(EZ - 0.04 * K, EZ - 0.06 * K, Z) * smooth(HEAD_LO.y + 0.03 * K, HEAD_LO.y - 0.0, Y) * (1 - lips[..., 0])
jawm_all *= 1 - smooth(0.03 * K, 0.0, np.abs(X)) * smooth(EZ - 0.05 * K, EZ - 0.04 * K, Z)
beard_mask = np.where(jaw_all, jawm_all * smooth(LIPS_Z - 0.09 * K, LIPS_Z - 0.06 * K, Z), 0)
# body hair: centre of the chest and the belly line, forearms
chest_c = (1 - smooth(0.02 * K, 0.09 * K, np.abs(X))) * smooth(PELVIS.z + 0.02, PELVIS.z + 0.12, Z) * (1 - smooth(NIP_Z + 0.02, NIP_Z + 0.08, Z)) * (NY < -0.2)
belly = (1 - smooth(0.004 * K, 0.02 * K, np.abs(X))) * smooth(PELVIS.z - 0.02, PELVIS.z + 0.05, Z) * (1 - smooth(NIP_Z - 0.1, NIP_Z - 0.04, Z)) * (NY < -0.2)
body_hair = np.clip(np.maximum(chest_c * 0.9, belly), 0, 1) * (np.abs(X) < SH_X * 0.9) * (Z < NECK.z - 0.04)

# stubble / beard shadow (male) on the jaw and upper lip
if MALE and not EDITOR:
    jaw = (Z < EZ - 0.045 * K) & (Z > MOUTH.z - 0.07 * K) & (Y < HEAD_LO.y + 0.02 * K)
    jawm = smooth(EZ - 0.04 * K, EZ - 0.06 * K, Z) * (1 - smooth(MOUTH.z - 0.06 * K, MOUTH.z - 0.085 * K, Z) * 0)
    jawm *= smooth(HEAD_LO.y + 0.03 * K, HEAD_LO.y - 0.0, Y) * (1 - lips[..., 0])
    jawm *= 1 - smooth(0.03 * K, 0.0, np.abs(X)) * smooth(EZ - 0.05 * K, EZ - 0.04 * K, Z)  # keep cheeks clean near the nose
    neck_cut = smooth(LIPS_Z - 0.09 * K, LIPS_Z - 0.06 * K, Z)
    st = np.where(jaw, jawm * neck_cut, 0) * (0.5 + 0.5 * strand)
    col = col * (1 - 0.35 * st[..., None]) + lin((0.12, 0.08, 0.065)) * 0.35 * st[..., None]

# hair painted on the scalp; the hair shell uses the same texture
on_head_t = (Z > EZ - 0.12 * K) & (np.abs(Y - HEAD_LO.y) < 0.15 * K) & (np.abs(X) < 0.12 * K)
above = Z - hair_limit(X, Y)
HAIRC = lin((0.028, 0.019, 0.014) if MALE else (0.04, 0.024, 0.016))
hairm = np.where(on_head_t, smooth(-0.006 * K, 0.004 * K, above), 0)
hs = 0.65 + 0.7 * strand * value_noise(140.0, 1)
hair_rgb = HAIRC * hs[..., None]
hm = (hairm * (0.75 + 0.25 * strand))[..., None]
if not EDITOR:
    col = col * (1 - hm) + hair_rgb * hm
else:
    from PIL import Image as _I
    masks = np.stack([hairm, np.clip(brow, 0, 1), beard_mask, body_hair], -1).astype(np.float32)
    masks = np.where(cover[..., None], masks, 0)
    _I.fromarray((np.flipud(np.clip(masks, 0, 1)) * 255).astype(np.uint8), "RGBA").save(os.path.join(OUT, f"coach_{WHO}{SUFFIX}_masks.png"))
    import json as _json
    def gl(v):  # Blender (x, y, z) -> glTF (x, z, -y)
        return [round(v.x, 5), round(v.z, 5), round(-v.y, 5)]
    _json.dump(dict(eyeL=gl(EYE_L), eyeR=gl(EYE_R), headLow=gl(HEAD_LO), headTop=gl(HEAD_TOP), neck=gl(NECK), pelvis=gl(PELVIS),
                    mouth=gl(MOUTH), knee=gl(KNEE), lipsY=round(LIPS_Z, 5), nippleY=round(NIP_Z, 5), nippleX=round(NIP_X, 5),
                    shoulderX=round(SH_X, 5), faceZ=round(-FACE_Y, 5), K=round(K, 5)),
               open(os.path.join(OUT, f"coach_{WHO}{SUFFIX}.meta.json"), "w"), indent=1)

# light from AO: broad occlusion for volume, fine occlusion for muscle separation ("definition")
shade = (0.55 + 0.45 * np.clip(AO, 0, 1) ** 1.2) * (0.8 + 0.2 * np.clip(AO_FINE, 0, 1) ** 1.5)
col = col * shade[..., None]
if RELIEF:
    col = col * (1 + 0.08 * HGT)[..., None]  # a touch of shadow in the furrows
col = np.where(cover[..., None], col, SKIN * 0.9)

# linear -> sRGB, write
srgb = np.where(col <= 0.0031308, col * 12.92, 1.055 * np.power(np.clip(col, 0, None), 1 / 2.4) - 0.055)
rgba = np.concatenate([np.clip(srgb, 0, 1), np.ones(X.shape + (1,), np.float32)], -1)
skin_png = os.path.join(OUT, WHO + SUFFIX + "_skin.png")
Image.fromarray((np.flipud(rgba) * 255).astype(np.uint8)).save(skin_png)

# bake the relief into a tangent-space normal map (Bump node on the height map)
normal_png = None
if RELIEF:
    hsm = HGT.copy()
    for _ in range(2):  # light blur (3x3 box, twice) so the bump has no texel steps
        hp_ = np.pad(hsm, 1, mode="edge")
        hsm = sum(hp_[1 + dy:1 + dy + TEX, 1 + dx:1 + dx + TEX] for dy in (-1, 0, 1) for dx in (-1, 0, 1)) / 9.0
    himg = bpy.data.images.new("height", TEX, TEX, float_buffer=True, alpha=False)
    himg.colorspace_settings.name = "Non-Color"
    hp = np.ones((TEX, TEX, 4), np.float32)
    hp[..., 0] = hp[..., 1] = hp[..., 2] = hsm + 1.0
    himg.pixels[:] = hp.ravel()
    for n in list(N):
        N.remove(n)
    out = N.new("ShaderNodeOutputMaterial")
    bs = N.new("ShaderNodeBsdfDiffuse")
    ht = N.new("ShaderNodeTexImage")
    ht.image = himg
    bump = N.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 1.0
    bump.inputs["Distance"].default_value = float(os.environ.get("CSS_RELIEF_DEPTH", "0.002")) * K
    L.new(ht.outputs["Color"], bump.inputs["Height"])
    L.new(bump.outputs["Normal"], bs.inputs["Normal"])
    L.new(bs.outputs[0], out.inputs["Surface"])
    nimg = bpy.data.images.new("nrmmap", TEX, TEX, float_buffer=False, alpha=False)
    nimg.colorspace_settings.name = "Non-Color"
    target = N.new("ShaderNodeTexImage")
    target.image = nimg
    N.active = target
    sc.render.bake.normal_space = "TANGENT"
    sc.cycles.samples = 1
    bpy.ops.object.bake(type="NORMAL")
    normal_png = os.path.join(OUT, WHO + SUFFIX + "_normal.png")
    nimg.filepath_raw = normal_png
    nimg.file_format = "PNG"
    nimg.save()
    hv = (np.flipud(np.clip(-hsm, 0, 1)) * 255).astype(np.uint8)
    Image.fromarray(hv).save(os.path.join(OUT, WHO + SUFFIX + "_relief_preview.png"))

# final export materials
for o in (body, hair):
    o.data.materials.clear()
skin_img = bpy.data.images.load(skin_png)


def textured(name, rough):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    t = m.node_tree.nodes.new("ShaderNodeTexImage")
    t.image = skin_img
    bsdf = m.node_tree.nodes["Principled BSDF"]
    m.node_tree.links.new(t.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = rough
    return m


skin_m = textured("Skin", 0.5)
if normal_png:
    nt = skin_m.node_tree
    ni = nt.nodes.new("ShaderNodeTexImage")
    ni.image = bpy.data.images.load(normal_png)
    ni.image.colorspace_settings.name = "Non-Color"
    nm = nt.nodes.new("ShaderNodeNormalMap")
    nt.links.new(ni.outputs["Color"], nm.inputs["Color"])
    nt.links.new(nm.outputs["Normal"], nt.nodes["Principled BSDF"].inputs["Normal"])
body.data.materials.append(skin_m)
hair.data.materials.append(textured("Hair", 0.62))
for o in (body,):
    if o.data.color_attributes.get("regions"):
        o.data.color_attributes.remove(o.data.color_attributes["regions"])
for o in [hair, shorts] + ([top] if top else []):
    for c in list(o.data.color_attributes):
        o.data.color_attributes.remove(c)

rig.name = "Coach"
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, WHO + SUFFIX + ".blend"))

bpy.ops.object.select_all(action="DESELECT")
for o in [rig, eyes] + parts:
    o.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=os.path.join(OUT, f"coach_{WHO}{SUFFIX}.glb"),
    use_selection=True, export_format="GLB", export_animations=False,
    export_image_format="JPEG", export_jpeg_quality=86,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
    export_skins=True, export_def_bones=False, export_apply=False, export_vertex_color="NONE")
print("DONE", WHO, [(o.name, len(o.data.vertices)) for o in parts + [eyes]])
