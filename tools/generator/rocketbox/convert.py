"""Rocketbox FBX -> GLB with Mixamo bone names (our rig reads those). Usage: python3 convert.py in.fbx out.glb texdir [maxsize]"""
import bpy, sys, os
src, out, texdir = sys.argv[1:4]
maxsize = int(sys.argv[4]) if len(sys.argv) > 4 else 2048
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=src)
for o in list(bpy.data.objects):
    if o.type not in ('MESH', 'ARMATURE'):
        bpy.data.objects.remove(o)
arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
mesh = [o for o in bpy.data.objects if o.type == 'MESH'][0]
M = {'Pelvis': 'Hips', 'Spine': 'Spine', 'Spine1': 'Spine1', 'Spine2': 'Spine2', 'Neck': 'Neck', 'Head': 'Head',
     'REye': 'RightEye', 'LEye': 'LeftEye'}
for s, S in (('L', 'Left'), ('R', 'Right')):
    M.update({f'{s} Clavicle': f'{S}Shoulder', f'{s} UpperArm': f'{S}Arm', f'{s} Forearm': f'{S}ForeArm', f'{s} Hand': f'{S}Hand',
              f'{s} Thigh': f'{S}UpLeg', f'{s} Calf': f'{S}Leg', f'{s} Foot': f'{S}Foot', f'{s} Toe0': f'{S}ToeBase'})
    for i, f in enumerate(['Thumb', 'Index', 'Middle', 'Ring', 'Pinky']):
        M[f'{s} Finger{i}'] = f'{S}Hand{f}1'
        M[f'{s} Finger{i}1'] = f'{S}Hand{f}2'
        M[f'{s} Finger{i}2'] = f'{S}Hand{f}3'
for b in arm.data.bones:
    k = b.name.replace('Bip01 ', '')
    new = M.get(k, 'Face_' + k.replace(' ', ''))
    vg = mesh.vertex_groups.get(b.name)
    if vg: vg.name = new
    b.name = new
arm.name = 'Armature'

# feet straight ahead at rest: the Rocketbox feet point 14° outward, our rig and its joint limits read the
# rest pose as the neutral (hip rotation measured 13° too far in the ground techniques). The pose is applied
# to the mesh and becomes the new rest pose.
from mathutils import Matrix, Vector
import math
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='POSE')
up = (arm.matrix_world.inverted().to_3x3() @ Vector((0, 0, 1))).normalized()
fwd = (arm.matrix_world.inverted().to_3x3() @ Vector((0, -1, 0))).normalized()
LEG_MODE = os.environ.get('LEG_MODE', 'foot')
for side in ('Left', 'Right'):
    thigh = arm.pose.bones[f'{side}UpLeg']
    foot, toe = arm.pose.bones[f'{side}Foot'], arm.pose.bones[f'{side}ToeBase']
    d = toe.head - foot.head
    d = d - up * d.dot(up)
    ang = math.atan2(fwd.cross(d).dot(up), fwd.dot(d))
    if LEG_MODE == 'thigh':
        # the whole leg is turned inward about the thigh's axis (the rest pose stood with the legs turned out)
        axis = (thigh.tail - thigh.head).normalized()
        def turn(t):
            thigh.matrix = Matrix.Translation(thigh.head) @ Matrix.Rotation(t, 4, axis) @ Matrix.Translation(-thigh.head) @ thigh.matrix
            bpy.context.view_layer.update()
        def yaw():
            e = toe.head - foot.head
            e = e - up * e.dot(up)
            return math.atan2(fwd.cross(e).dot(up), fwd.dot(e))
        # about the thigh's own axis, the direction that brings the toes forward
        turn(ang)
        if abs(yaw()) > abs(ang):
            turn(-2 * ang)
        # the thigh is not vertical: a second, smaller step finishes the turn
        for _ in range(3):
            y = yaw()
            turn(y)
            if abs(yaw()) > abs(y):
                turn(-2 * y)
    else:
        R = Matrix.Translation(foot.head) @ Matrix.Rotation(-ang, 4, up) @ Matrix.Translation(-foot.head)
        foot.matrix = R @ foot.matrix
    bpy.context.view_layer.update()
    d2 = toe.head - foot.head
    d2 = d2 - up * d2.dot(up)
    print('foot', side, 'was', round(math.degrees(ang), 1), 'now', round(math.degrees(math.atan2(fwd.cross(d2).dot(up), fwd.dot(d2))), 1))
bpy.ops.object.mode_set(mode='OBJECT')
mod = next(m for m in mesh.modifiers if m.type == 'ARMATURE')
bpy.context.view_layer.objects.active = mesh
bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='POSE')
bpy.ops.pose.armature_apply(selected=False)
bpy.ops.object.mode_set(mode='OBJECT')
# athletic shape (v0.29, Youssef 2026-10-21: « le corps n'est pas harmonieux et humain »): the Rocketbox
# sports bodies are thin and untrained. Each region swells along the surface normal where the skin follows
# the bone (its skin weight), most in the middle of the muscle, without big muscles (SHAPE=0 to skip,
# SHAPE_SCALE to tune). v0.29 biomeca lot (Youssef 2026-10-21 21:00, « plus athlétique, pas culturiste »):
# SHAPE_SCALE=1.6 for Kadir (max 28 mm), 1.0 for Amara (max 18 mm); the shipped GLBs use these values.
SHAPE_SCALE = float(os.environ.get('SHAPE_SCALE', '1'))
if os.environ.get('SHAPE', '1') != '0':
    mw = mesh.matrix_world
    nmat = mw.to_3x3().inverted().transposed()
    aw = arm.matrix_world
    head = lambda n: aw @ arm.data.bones[n].head_local
    FWD = Vector((0, -1, 0))
    UP = Vector((0, 0, 1))
    # (group, from bone, to bone, peak along the bone 0..1, width, metres, side filter)
    # v0.29 (Youssef, 2026-10-21 21:00: « véritables athlètes… musculature naturellement développée, pas de
    # culturistes »): each muscle group on its own side of the limb (quadriceps in front, hamstrings and calves
    # behind, upper back behind, pectorals in front), a few millimetres to two centimetres at most
    R = []
    for S in ('Left', 'Right'):
        R += [
            (f'{S}Arm', f'{S}Arm', f'{S}ForeArm', 0.55, 0.45, 0.016, None),        # biceps, triceps
            (f'{S}Arm', f'{S}Arm', f'{S}ForeArm', 0.05, 0.3, 0.019, None),        # deltoid
            (f'{S}Shoulder', f'{S}Arm', f'{S}ForeArm', 0.0, 0.3, 0.014, None),     # deltoid, top
            (f'{S}ForeArm', f'{S}ForeArm', f'{S}Hand', 0.25, 0.35, 0.011, None),   # forearm, near the elbow
            (f'{S}UpLeg', f'{S}UpLeg', f'{S}Leg', 0.4, 0.5, 0.012, None),           # thigh
            (f'{S}UpLeg', f'{S}UpLeg', f'{S}Leg', 0.5, 0.45, 0.012, 'front'),      # quadriceps
            (f'{S}UpLeg', f'{S}UpLeg', f'{S}Leg', 0.45, 0.4, 0.008, 'back'),       # hamstrings
            (f'{S}Leg', f'{S}Leg', f'{S}Foot', 0.3, 0.3, 0.018, 'back'),           # calf
        ]
    R += [
        ('Spine2', 'Spine2', 'Neck', 0.45, 0.6, 0.017, 'front'),   # chest
        ('Spine2', 'Spine2', 'Neck', 0.35, 0.6, 0.02, 'side'),     # lats
        ('Spine1', 'Spine1', 'Spine2', 0.8, 0.6, 0.012, 'side'),   # lats, lower part
        ('Spine2', 'Spine2', 'Neck', 0.55, 0.5, 0.012, 'back'),    # upper back
        ('Neck', 'Neck', 'Head', 0.1, 0.4, 0.013, 'back'),         # trapezius
        ('Hips', 'Hips', 'Spine', 0.0, 0.8, 0.014, 'back'),        # glutes
    ]
    import math as _m
    groups = {g.name: g.index for g in mesh.vertex_groups}
    me = mesh.data
    offs = [0.0] * len(me.vertices)
    for (g, b0, b1, peak, width, amount, side) in R:
        gi = groups.get(g)
        if gi is None: continue
        h0, h1 = head(b0), head(b1)
        axis = h1 - h0
        L2 = axis.length_squared
        for v in me.vertices:
            w = next((x.weight for x in v.groups if x.group == gi), 0.0)
            if w <= 0.01: continue
            p = mw @ v.co
            u = (p - h0).dot(axis) / L2
            prof = _m.exp(-((u - peak) / width) ** 2 * 2)
            n = (nmat @ v.normal).normalized()
            if side == 'front': prof *= max(0.0, n.dot(FWD)) ** 0.7
            elif side == 'back': prof *= max(0.0, -n.dot(FWD)) ** 0.7
            elif side == 'side':
                prof *= abs(n.dot(FWD.cross(UP))) ** 1.5
            offs[v.index] += w * prof * amount * SHAPE_SCALE
    # smooth the offsets over the surface (a few passes) so no seam or step shows between regions
    nb = [[] for _ in me.vertices]
    for e in me.edges:
        a, b = e.vertices
        nb[a].append(b); nb[b].append(a)
    for _ in range(2):
        offs = [0.5 * offs[i] + 0.5 * (sum(offs[j] for j in nb[i]) / len(nb[i]) if nb[i] else offs[i]) for i in range(len(offs))]
    inv = mw.inverted()
    for v in me.vertices:
        if offs[v.index]:
            n = (nmat @ v.normal).normalized()
            v.co = inv @ ((mw @ v.co) + n * offs[v.index])
    print('shape: max offset', round(max(offs) * 1000, 1), 'mm')
# smoother silhouette: one level of subdivision (skin weights and UVs follow), the low-poly outline was angular
if os.environ.get('SUBDIV', '1') != '0':
    sub = mesh.modifiers.new('Subdiv', 'SUBSURF')
    sub.levels = 1
    sub.render_levels = 1
    sub.uv_smooth = 'PRESERVE_BOUNDARIES'
    bpy.context.view_layer.objects.active = mesh
    bpy.ops.object.modifier_apply(modifier=sub.name)
    print('subdivided:', len(mesh.data.vertices), 'vertices')
for p_ in mesh.data.polygons:
    p_.use_smooth = True
m2 = mesh.modifiers.new('Armature', 'ARMATURE')
m2.object = arm
# materials: colour + normal from the Rocketbox textures, matte skin
for mat in mesh.data.materials:
    base = mat.name  # e.g. m021_body
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    outn = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(bsdf.outputs[0], outn.inputs[0])
    def img(suffix):
        p = next((q for q in (os.path.join(texdir, f'{base}_{suffix}.{e}') for e in ('png', 'tga')) if os.path.exists(q)), None)
        if not p: return None
        im = bpy.data.images.load(p)
        # graphics memory on phones (v0.29: Youssef's phone lost its 3D): only the face colour keeps the full
        # size, the body and the relief maps are halved (a quarter of the memory)
        lim = maxsize if (suffix == 'color' and base.endswith('head')) else min(maxsize, 1024)
        if max(im.size) > lim: im.scale(lim, lim)
        n = nt.nodes.new('ShaderNodeTexImage'); n.image = im
        return n
    c = img('color')
    if c: nt.links.new(c.outputs['Color'], bsdf.inputs['Base Color'])
    if base.endswith('opacity') and c:
        nt.links.new(c.outputs['Alpha'], bsdf.inputs['Alpha'])
        mat.blend_method = 'HASHED' if hasattr(mat, 'blend_method') else None
    n = img('normal')
    if n:
        n.image.colorspace_settings.name = 'Non-Color'
        nm = nt.nodes.new('ShaderNodeNormalMap')
        nt.links.new(n.outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
    bsdf.inputs['Roughness'].default_value = 0.6
    bsdf.inputs['Metallic'].default_value = 0.0
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_image_format='JPEG', export_jpeg_quality=88,
                          export_animations=False, export_skins=True, export_yup=True, use_selection=True)
print('wrote', out, os.path.getsize(out))
