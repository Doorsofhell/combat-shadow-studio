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
        if max(im.size) > maxsize: im.scale(maxsize, maxsize)
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
