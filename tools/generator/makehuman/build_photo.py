"""Ultra-réaliste MakeHuman coach: body, face, skin, hair, eyebrows and eyelashes from MakeHuman assets (all CC0).

usage: python3 build_photo.py -- <recipe.json> <assets_dir> <out.glb> [relief_normal.png]

assets_dir: the unzipped MakeHuman asset packs (makehuman_system_assets_cc0, skins0x_cc0, hair01_cc0, eyebrows01_cc0,
eyelashes01_cc0), downloaded from files.makehumancommunity.org (see README.md). The recipe gives the morphology
(same recipe as the Anime model built by ../build.py) and a "photo" block:

  "photo": {"skin": "skins/young_caucasian_male/young_caucasian_male.mhmat",   # relative to assets_dir/*/
            "skin_tint": [r, g, b], "hair": "hair/short02/short02.mhclo", "hair_tint": [r, g, b],
            "eyebrows": "eyebrows/eyebrow009/eyebrow009.mhclo", "eyelashes": "eyelashes/eyelashes02/eyelashes02.mhclo",
            "eyes": "eyes/materials/brown.mhmat", "scale": 1.0}

Pipeline (Blender + MPFB2, nothing of MPFB is shipped): MakeHuman human with the recipe targets -> Mixamo rig of
MPFB (the bone names our animation engine reads) -> eyes, eyebrows, eyelashes and hair fitted by MPFB on the
shaped body, weighted to the rig -> helper geometry removed, body subdivided once -> plain glTF materials (photo
skin diffuse, hair and lashes with alpha) -> GLB. assemble.py then reduces and renames it for the app.
"""
import bpy, sys, os, json, glob, re
import numpy as np

argv = sys.argv[sys.argv.index("--") + 1:]
RECIPE = json.load(open(argv[0]))
ASSETS, OUT = argv[1], argv[2]
RELIEF = argv[3] if len(argv) > 3 else None
PH = RECIPE["photo"]
MALE = RECIPE["sex"] == "male"


def asset(rel):
    hits = glob.glob(os.path.join(ASSETS, "*", rel))
    if not hits:
        raise FileNotFoundError(rel)
    return hits[0]


import addon_utils
addon_utils.enable("bl_ext.user_default.mpfb", default_set=True)
from bl_ext.user_default.mpfb.services.humanservice import HumanService
from bl_ext.user_default.mpfb.services.targetservice import TargetService
from bl_ext.user_default.mpfb.services.locationservice import LocationService

bpy.ops.wm.read_factory_settings(use_empty=True)
T = LocationService.get_mpfb_data("targets")
macro = TargetService.get_default_macro_info_dict()
macro.update(RECIPE["macro"])
macro["race"] = RECIPE["race"]
h = HumanService.create_human(macro_detail_dict=macro)
for p, w in RECIPE["single"]:
    TargetService.load_target(h, os.path.join(T, p + ".target.gz"), weight=w)
for p, w in RECIPE["paired"]:
    for s in ("l", "r"):
        TargetService.load_target(h, os.path.join(T, p.replace("X", s) + ".target.gz"), weight=w)

rig = HumanService.add_builtin_rig(h, "mixamo")
parts = {}
for kind, key in (("Eyes", "eyes_mesh"), ("Eyebrows", "eyebrows"), ("Eyelashes", "eyelashes"), ("Hair", "hair")):
    rel = PH.get(key, "eyes/high-poly/high-poly.mhclo" if kind == "Eyes" else None)
    if not rel:
        continue
    parts[kind] = HumanService.add_mhclo_asset(asset(rel), h, asset_type=kind, subdiv_levels=0, material_type="MAKESKIN")
    print("asset", kind, rel, len(parts[kind].data.vertices))

bpy.context.view_layer.objects.active = h
for o in bpy.data.objects:
    o.select_set(o == h)
bpy.ops.object.shape_key_remove(all=True, apply_mix=True)

# helper geometry (tights, skirt, joint cubes, hair helper...) is not part of the visible body
vg = {g.name: g.index for g in h.vertex_groups}
helper = {vg[n] for n in ("HelperGeometry", "JointCubes") if n in vg}
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="DESELECT")
bpy.ops.object.mode_set(mode="OBJECT")
for v in h.data.vertices:
    v.select = bool(any(g.group in helper and g.weight > 0.5 for g in v.groups))
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.delete(type="VERT")
bpy.ops.object.mode_set(mode="OBJECT")
h.name = "Body"


# hair_cut (metres behind the front of the eyes): the hair in front of that plane is removed (the MakeHuman braids
# come with a side fringe; a fighter's braid is pulled back tight): the scalp painted in the hair colour, with
# strands combed back, shows instead
if PH.get("hair_cut") and "Hair" in parts:
    eo = parts["Eyes"]
    ev = np.array([(eo.matrix_world @ v.co)[:] for v in eo.data.vertices])
    ez, ey = ev[:, 2].mean(), ev[:, 1].min()
    ho = parts["Hair"]
    bpy.context.view_layer.objects.active = ho
    for o in bpy.data.objects:
        o.select_set(o == ho)
    bpy.ops.object.mode_set(mode="OBJECT")
    for v in ho.data.vertices:
        w = ho.matrix_world @ v.co
        v.select = bool(w.y < ey + PH["hair_cut"])
    n = sum(v.select for v in ho.data.vertices)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.delete(type="VERT")
    bpy.ops.object.mode_set(mode="OBJECT")
    # loose pieces left by the cut (card ends sticking out above the ears): only the large pieces are kept
    import bmesh
    bm = bmesh.new()
    bm.from_mesh(ho.data)
    seen, small = set(), []
    for v0 in bm.verts:
        if v0.index in seen:
            continue
        isl, stack = [], [v0]
        seen.add(v0.index)
        while stack:
            v = stack.pop()
            isl.append(v)
            for e in v.link_edges:
                o = e.other_vert(v)
                if o.index not in seen:
                    seen.add(o.index)
                    stack.append(o)
        if len(isl) < PH.get("hair_min_piece", 60):
            small += isl
    bmesh.ops.delete(bm, geom=small, context="VERTS")
    bm.to_mesh(ho.data)
    bm.free()
    print("hair cut", n, "loose", len(small))
    bpy.context.view_layer.objects.active = h


# ------------------------------------------------------------------ painted layers (UV space of the body)
def uv_raster(values, size):
    """per-vertex values (N, C) -> texture (size, size, C), interpolated over the UV triangles"""
    me = h.data
    me.calc_loop_triangles()
    uv = me.uv_layers.active.data
    img = np.zeros((size, size, values.shape[1]), np.float32)
    for t in me.loop_triangles:
        q = np.array([uv[l].uv[:] for l in t.loops]) * size - 0.5
        x, y = q[:, 0], (size - 1) - q[:, 1]
        x0, x1 = max(0, int(np.floor(x.min()))), min(size - 1, int(np.ceil(x.max())))
        y0, y1 = max(0, int(np.floor(y.min()))), min(size - 1, int(np.ceil(y.max())))
        if x1 < x0 or y1 < y0:
            continue
        gx, gy = np.meshgrid(np.arange(x0, x1 + 1), np.arange(y0, y1 + 1))
        d = (y[1] - y[2]) * (x[0] - x[2]) + (x[2] - x[1]) * (y[0] - y[2])
        if abs(d) < 1e-12:
            continue
        a = ((y[1] - y[2]) * (gx - x[2]) + (x[2] - x[1]) * (gy - y[2])) / d
        b = ((y[2] - y[0]) * (gx - x[2]) + (x[0] - x[2]) * (gy - y[2])) / d
        c = 1 - a - b
        m = (a >= -0.03) & (b >= -0.03) & (c >= -0.03)
        v = values[list(t.vertices)]
        img[gy[m], gx[m]] = a[m, None] * v[0] + b[m, None] * v[1] + c[m, None] * v[2]
    return img


vg = {g.name: g.index for g in h.vertex_groups}
P = np.array([(h.matrix_world @ v.co)[:] for v in h.data.vertices])  # world: Blender axes, Z up, metres
W = np.zeros((len(P), 6), np.float32)  # scalp, torso, legs+hips, arms+hands, nipple, lips
groups = dict(scalp=0)
for v in h.data.vertices:
    for g in v.groups:
        n = h.vertex_groups[g.group].name
        if n == "scalp":
            W[v.index, 0] = g.weight
        elif n.startswith("mixamorig:"):
            k = n[10:]
            if k in ("Spine", "Spine1", "Spine2", "Neck"):
                W[v.index, 1] += g.weight
            if k in ("Hips",) or "UpLeg" in k:
                W[v.index, 2] += g.weight
            if "Arm" in k or "Hand" in k or "Shoulder" in k:
                W[v.index, 3] += g.weight
        elif n == "nipple":
            W[v.index, 4] = g.weight
        elif n == "lips":
            W[v.index, 5] = g.weight
B = {b.name[10:]: (rig.matrix_world @ b.head_local) for b in rig.data.bones}
hips_z, thigh_z, knee_z = B["Hips"].z, B["LeftUpLeg"].z, B["LeftLeg"].z
# underwear (the base layer when no discipline outfit is worn, as the Rocketbox coaches): boxer briefs, and a
# sports bra for women, painted in anthracite
# kept small: every discipline outfit covers them, so their edges never show past a garment hem
low = thigh_z - 0.12 * (thigh_z - knee_z)
top = hips_z + 0.03 * (B["Head"].z - hips_z) / 0.8
nip = P[W[:, 4] > 0.3]
nz = nip[:, 2].mean() if len(nip) else B["Spine2"].z
# per texel (sharp hems): scalp weight, body-part weights and the 3D position, rasterised in UV space
R = uv_raster(np.concatenate([W[:, :4], P, W[:, 5:6]], 1), 2048)
Zt, region_t = R[..., 6], np.clip(R[..., 1] + R[..., 2] - R[..., 3], 0, 1)
edge = lambda d: np.clip(d / 0.0025, 0, 1)
shorts = edge(Zt - low) * edge(top - Zt) * (R[..., 3] < 0.5)
bra = np.zeros_like(shorts)
if not MALE:
    bra = edge(Zt - (nz - 0.06)) * edge((nz + 0.035) - Zt) * (R[..., 3] < 0.35)
Xt, Yt = R[..., 4], R[..., 5]
shorts *= np.abs(Xt) < 0.24
bra *= np.abs(Xt) < 0.22
# tribal tattoo (recipe "tattoo": true): rows of shark teeth between two solid rings around the left upper arm,
# and three curved blades down the left ribs
ink = np.zeros_like(shorts)
if PH.get("tattoo"):
    sh, el = np.array(B["LeftArm"]), np.array(B["LeftForeArm"])
    L = np.linalg.norm(el - sh)
    ax = (el - sh) / L
    rel = np.stack([Xt, Yt, Zt], -1) - sh
    t = rel @ ax / L
    radial = rel - (rel @ ax)[..., None] * ax
    ref = np.cross(ax, [0, 0, 1.0])
    ref /= np.linalg.norm(ref)
    ang = np.arctan2(radial @ np.cross(ax, ref), radial @ ref)
    arm = (np.linalg.norm(radial, axis=-1) < 0.08) & (R[..., 3] > 0.5) & (np.sign(Xt) == np.sign(sh[0]))
    rings = ((t > 0.2) & (t < 0.24)) | ((t > 0.76) & (t < 0.8))
    u = (ang / (2 * np.pi) * 12) % 1
    teeth = np.zeros_like(rings)
    for k, t0 in enumerate((0.27, 0.43, 0.59)):
        v = (t - t0) / 0.13
        uu = (u + 0.5 * k) % 1
        teeth |= (v > 0) & (v < 1) & (v < 1 - np.abs(2 * uu - 1)) if k % 2 == 0 else (v > 0) & (v < 1) & (1 - v < 1 - np.abs(2 * uu - 1))
    ink = (arm & (rings | teeth)).astype(np.float32)
    side = np.sign(sh[0])
    sp = np.array(B["Spine1"])
    fx = Xt * side
    for k in range(3):
        zc = sp[2] + 0.02 - 0.045 * k
        # a blade along the ribs: thick at the back, pointed toward the front
        fy = sp[1] - Yt  # toward the front (the face looks to -Y)
        along = np.clip((fy + 0.06) / 0.14, 0, 1)
        curve = zc + 0.05 * along - 0.03 * (1 - along) ** 2
        w = 0.011 * along
        blade = (fx > 0.07) & (np.abs(Zt - curve) < w) & (fy > -0.06) & (fy < 0.08) & (R[..., 3] < 0.3)
        ink = np.maximum(ink, blade.astype(np.float32))
# short beard ("stubble" in the recipe): chin, jaw, upper lip and the top of the neck, lips left bare, around the
# mouth measured on the lips of the mesh; soft edges so it fades into the skin as a real two-day beard
beard = np.zeros_like(shorts)
lipv = P[W[:, 5] > 0.3]
if PH.get("stubble") and len(lipv):
    soft = lambda d, w: np.clip(d / w, 0, 1)
    lz, ly, ex = lipv[:, 2].mean(), lipv[:, 1].min(), np.abs(lipv[:, 0]).max()
    dz, ax_ = Zt - lz, np.abs(Xt)
    hy = B["Head"].y
    front = soft(hy + 0.01 - Yt, 0.02)  # the front of the head (the face looks to -Y)
    chin = soft(dz + 0.075, 0.02) * soft(0.0 - dz, 0.012)
    lip = soft(dz - 0.004, 0.004) * soft(0.024 - dz, 0.006) * soft(ex + 0.006 - ax_, 0.008)
    # jaw line up to the sideburns, along the side of the face, below the cheekbones
    side = soft(ax_ - ex, 0.01) * soft(dz + 0.06, 0.02) * soft(0.045 - dz - 0.4 * (Yt - ly), 0.03)
    beard = np.maximum(chin, np.maximum(lip, side)) * front * (1 - np.clip(R[..., 7] * 3, 0, 1)) * (R[..., 0] < 0.5)
LAYERS = np.stack([R[..., 0], shorts, bra, Xt, Yt, Zt, ink, beard], -1)
print("layers: scalp %.0f shorts %.0f bra %.0f texels" % tuple((LAYERS[..., i] > 0.5).sum() for i in range(3)))

# the MakeHuman base mesh as it is (regular quads, ~26 000 triangles): the garments of outfits.py are cut along its
# edges, so their hems stay clean (a reduced subdivided mesh gave torn hems). "subdiv": 1 + "decimate" < 1 in the
# recipe: one subdivision then a reduction (smoother outline, irregular triangles)
mods = [m for m in h.modifiers if m.type != "ARMATURE"]
for m in mods:
    h.modifiers.remove(m)
if PH.get("subdiv", 0):
    sub = h.modifiers.new("Sub", "SUBSURF")
    sub.levels = 1
    while h.modifiers[0].name != "Sub":
        bpy.ops.object.modifier_move_up(modifier="Sub")
    bpy.ops.object.modifier_apply(modifier="Sub")
for gr in list(h.vertex_groups):
    if not gr.name.startswith("mixamorig:"):
        h.vertex_groups.remove(gr)
for o in parts.values():
    for m in [m for m in o.modifiers if m.type != "ARMATURE"]:
        o.modifiers.remove(m)
    for gr in list(o.vertex_groups):
        if not gr.name.startswith("mixamorig:"):
            o.vertex_groups.remove(gr)
    if not o.vertex_groups:  # rigid on the head (eyes)
        g = o.vertex_groups.new(name="mixamorig:Head")
        g.add([v.index for v in o.data.vertices], 1.0, "REPLACE")
    if not any(m.type == "ARMATURE" for m in o.modifiers):
        o.modifiers.new("Armature", "ARMATURE").object = rig
    o.parent = rig
    for p_ in o.data.polygons:
        p_.use_smooth = True
for p_ in h.data.polygons:
    p_.use_smooth = True


# ------------------------------------------------------------------ plain glTF materials
def mhmat_texture(path, key="diffuseTexture"):
    t = open(path, errors="ignore").read()
    m = re.search(r"^%s\s+(\S+)" % key, t, re.M)
    return os.path.join(os.path.dirname(path), os.path.basename(m.group(1))) if m else None


def tinted(src, tint, name):
    """the asset texture multiplied by a tint (skin tone), or recoloured (hair: "tint" with 4 values = colour +
    strength, the strand shading of the asset kept as luminance so a dark asset can become blond), alpha kept"""
    from PIL import Image
    im = Image.open(src).convert("RGBA")
    a = np.asarray(im, np.float32) / 255
    if tint and len(tint) == 4:
        lum = a[..., :3].mean(-1)
        vis = a[..., 3] > 0.3
        lum = lum / max(np.percentile(lum[vis], 95), 1e-3) if vis.any() else lum
        a[..., :3] = np.clip(np.array(tint[:3], np.float32) * (1 - tint[3] + tint[3] * 1.3 * lum[..., None]), 0, 1)
    elif tint:
        a[..., :3] = np.clip(a[..., :3] * np.array(tint, np.float32), 0, 1)
    # the hidden texels (often white in the assets) take the mean colour of the visible ones: mipmaps and alpha to
    # coverage blend them in at the edges of the hair cards, where they showed as white specks
    vis = a[..., 3] > 0.5
    if vis.any() and not vis.all():
        a[~vis, :3] = a[vis, :3].mean(0)
    out = os.path.join(os.path.dirname(OUT), name + ".png")
    Image.fromarray((a * 255).astype(np.uint8)).save(out)
    return out


def material(o, name, tex, alpha=False, rough=0.55):
    """plain glTF material: colour texture (alpha cut out when asked)"""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(b.outputs[0], out.inputs[0])
    n = nt.nodes.new("ShaderNodeTexImage")
    n.image = bpy.data.images.load(tex)
    nt.links.new(n.outputs["Color"], b.inputs["Base Color"])
    if alpha:
        nt.links.new(n.outputs["Alpha"], b.inputs["Alpha"])
        mat.blend_method = "CLIP" if hasattr(mat, "blend_method") else None
    b.inputs["Roughness"].default_value = rough
    o.data.materials.clear()
    o.data.materials.append(mat)


def paint_skin(path):
    """scalp (hair colour, or a dark buzz cut), underwear; the skin's own photo shading shows through"""
    from PIL import Image
    a = np.asarray(Image.open(path).convert("RGB").resize((2048, 2048)), np.float32) / 255
    rng = np.random.default_rng(RECIPE.get("seed", 1))
    grain = rng.random((2048, 2048)).astype(np.float32)
    lum = a.mean(-1, keepdims=True) / max(a.mean(), 1e-3)
    sc = LAYERS[..., 0:1]
    if PH.get("scalp"):
        col, k = np.array(PH["scalp"][:3], np.float32), PH["scalp"][3]
        # strands combed back: lanes 1.2 mm wide across the head, each with its own shade, slowly varying along
        X, Yh = LAYERS[..., 3], LAYERS[..., 4]
        lane = np.floor((X + 0.003 * np.sin(Yh * 60)) / 0.0012).astype(np.int64)
        shade = (np.sin(lane * 12.9898 + 78.233) * 43758.5453) % 1.0
        shade = 0.7 + 0.45 * shade + 0.12 * np.sin(Yh * 140 + lane)
        hair = col * shade[..., None] * (0.85 + 0.3 * grain[..., None])
        a = a * (1 - k * sc) + hair * k * sc
    cloth = np.array([0.085, 0.09, 0.1], np.float32) * (0.85 + 0.3 * grain[..., None]) * (0.6 + 0.4 * lum)
    for i in ((1, 2) if not os.environ.get("NO_UNDERWEAR") else ()):
        m = LAYERS[..., i:i + 1]
        # a darker hem band along the edges of the garment
        hem = np.clip(1 - np.abs(m - 0.5) * 2, 0, 1) * 0.35
        a = a * (1 - m) + cloth * (1 - hem) * m
    if PH.get("stubble"):
        # shaved beard: a cool grey shadow of the roots under the skin, with a fine grain of hair tips
        col, k = np.array(PH["stubble"][:3], np.float32), PH["stubble"][3]
        m = LAYERS[..., 7:8]
        dots = 0.75 + 0.25 * (grain[..., None] > 0.6)
        a = a * (1 - k * m * dots) + col * a.mean(-1, keepdims=True) / max(a.mean(), 1e-3) * k * m * dots
    ink = LAYERS[..., 6:7] * 0.85
    a = a * (1 - ink) + np.array([0.05, 0.06, 0.07], np.float32) * ink
    Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).save(path)
    return path


skin_mhmat = asset(PH["skin"])
material(h, "Skin", paint_skin(tinted(mhmat_texture(skin_mhmat), PH.get("skin_tint"), RECIPE["id"] + "_skin")))
eyes_mat = asset(PH.get("eyes", "eyes/materials/brown.mhmat"))
material(parts["Eyes"], "Eyes_opacity", mhmat_texture(eyes_mat), alpha=True, rough=0.2)
for kind, tint_key, rough in (("Eyebrows", "hair_tint", 0.8), ("Eyelashes", None, 0.7), ("Hair", "hair_tint", 0.8)):
    o = parts.get(kind)
    if not o:
        continue
    mh = glob.glob(os.path.join(os.path.dirname(asset(PH[kind.lower()])), "*.mhmat"))[0]
    tex = mhmat_texture(mh)
    # "opacity" in the name: the app draws these with alpha test (PhotoCoach.tsx, as the Rocketbox hair cards)
    material(o, kind + "_opacity", tinted(tex, PH.get(tint_key) if tint_key else None, RECIPE["id"] + "_" + kind.lower()), alpha=True, rough=rough)
    o.name = kind

def skin_relief():
    """the normal map of the skin: the anatomical relief of the generator and/or the fine detail of a skin asset's
    normal map (pores, fine wrinkles), blended by adding their slopes. "relief_size" in the recipe: its resolution
    (1024)"""
    from PIL import Image
    size = PH.get("relief_size", 1024)
    # "skin_normal_from": take the normal map of another skin asset (its colours may not suit: scars, bruises)
    src = asset(PH["skin_normal_from"]) if PH.get("skin_normal_from") else skin_mhmat
    maps = [p for p in (RELIEF, mhmat_texture(src, "normalmapTexture")) if p and os.path.exists(p)]
    if not maps:
        return None
    if len(maps) == 1 and size == 1024 and maps[0] == RELIEF:
        return RELIEF
    xy = np.zeros((size, size, 2), np.float32)
    for k, p in enumerate(maps):
        n = np.asarray(Image.open(p).convert("RGB").resize((size, size), Image.LANCZOS), np.float32) / 127.5 - 1
        d = n[..., :2] / np.maximum(n[..., 2:3], 0.2)
        if k:
            # only the fine detail of the skin asset (pores, small folds): its muscles, scars and body shape are
            # taken out by a high-pass filter (the coach keeps the anatomy of his own relief)
            from scipy.ndimage import gaussian_filter
            d = (d - gaussian_filter(d, (PH.get("skin_normal_blur", 4) * size / 2048,) * 2 + (0,))) * PH.get("skin_normal", 1.0)
        xy += d
    n = np.concatenate([xy, np.ones_like(xy[..., :1])], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    out = os.path.join(os.path.dirname(OUT), RECIPE["id"] + "_relief.png")
    Image.fromarray(((n + 1) * 127.5).clip(0, 255).astype(np.uint8)).save(out)
    return out


# ------------------------------------------------------------------ phone budget
RELIEF = skin_relief()
if RELIEF:
    nt = h.data.materials[0].node_tree
    bsdf = [n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"][0]
    n = nt.nodes.new("ShaderNodeTexImage")
    n.image = bpy.data.images.load(RELIEF)
    n.image.colorspace_settings.name = "Non-Color"
    if max(n.image.size) > PH.get("relief_size", 1024):
        n.image.scale(PH.get("relief_size", 1024), PH.get("relief_size", 1024))
    nm = nt.nodes.new("ShaderNodeNormalMap")
    nm.inputs["Strength"].default_value = 0.6
    nt.links.new(n.outputs["Color"], nm.inputs["Color"])
    nt.links.new(nm.outputs["Normal"], bsdf.inputs["Normal"])
bpy.context.view_layer.objects.active = h
dec = h.modifiers.new("Decimate", "DECIMATE") if PH.get("decimate", 1.0) < 1 else None
if dec:
    dec.ratio = PH["decimate"]
    dec.use_collapse_triangulate = True
    while h.modifiers[0].name != "Decimate":
        bpy.ops.object.modifier_move_up(modifier="Decimate")
    bpy.ops.object.modifier_apply(modifier="Decimate")
for o in [h] + list(parts.values()):
    for g in o.vertex_groups:
        g.name = g.name.replace("mixamorig:", "")
    for p_ in o.data.polygons:
        p_.use_smooth = True
for b in rig.data.bones:
    b.name = b.name.replace("mixamorig:", "")
if PH.get("scale", 1.0) != 1.0:
    rig.scale = [c * PH["scale"] for c in rig.scale]
    bpy.ops.object.select_all(action="DESELECT")
    for o in [rig, h] + list(parts.values()):
        o.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.transform_apply(scale=True)

rig.name = "Armature"
bpy.ops.object.select_all(action="DESELECT")
for o in [rig, h] + list(parts.values()):
    o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, use_selection=True, export_format="GLB", export_animations=False,
                          export_image_format="AUTO", export_skins=True, export_def_bones=False, export_apply=False,
                          export_vertex_color="NONE")
print("DONE", [(o.name, len(o.data.polygons)) for o in [h] + list(parts.values())])
