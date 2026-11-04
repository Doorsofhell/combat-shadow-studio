"""1.16: writes the facial expressions (shape keys) of a Rocketbox facial avatar to an .npz, at the resolution of
our coaches (one level of subdivision, like convert.py).

  python3 -I tools/generator/rocketbox/morph_extract.py <Sports_*_01_facial.fbx | coach.blend> out.npz

Verified finding (Youssef 04/11 14:09, the Headbox / Rocketbox repositories): every Rocketbox facial avatar carries
175 expressions (15 visemes, 52 ARKit, 48 FACS, 42 VIVE) as shape keys, MIT like the avatars; convert.py drops them
(its modifiers cannot be applied with shape keys) and the faces of the coaches only move their facial bones, a few
millimetres. This script keeps a chosen subset: for each key the mesh is evaluated with that key alone at 1, through
a subdivision modifier (Catmull-Clark is linear: the subdivided delta is the delta of the subdivided shape), and
stored as world positions (metres, glTF axes: y up) of the basis and their deltas. morph_apply.mjs puts them on the
shipped photo.glb by position, so the coach is not rebuilt.
"""
import bpy, sys, os
import numpy as np

src, out = sys.argv[-2], sys.argv[-1]
KEEP = os.environ.get('KEYS', ','.join([
    'AK_01_BrowDownLeft', 'AK_02_BrowDownRight', 'AK_03_BrowInnerUp', 'AK_06_CheekPuff', 'AK_07_CheekSquintLeft',
    'AK_08_CheekSquintRight', 'AK_09_EyeBlinkLeft', 'AK_10_EyeBlinkRight', 'AK_19_EyeSquintLeft', 'AK_20_EyeSquintRight',
    'AK_21_EyeWideLeft', 'AK_22_EyeWideRight', 'AK_25_JawOpen', 'AK_27_MouthClose', 'AK_30_MouthFrownLeft',
    'AK_31_MouthFrownRight', 'AK_32_MouthFunnel', 'AK_36_MouthPressLeft', 'AK_37_MouthPressRight', 'AK_44_MouthSmileLeft',
    'AK_45_MouthSmileRight', 'AK_46_MouthStretchLeft', 'AK_47_MouthStretchRight', 'AK_50_NoseSneerLeft', 'AK_51_NoseSneerRight',
])).split(',')
if src.endswith('.blend'):
    bpy.ops.wm.open_mainfile(filepath=src)
else:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=src)
mesh = next(o for o in bpy.data.objects if o.type == 'MESH' and o.data.shape_keys)
kb = mesh.data.shape_keys.key_blocks
for o in bpy.data.objects:
    if o.type == 'MESH' and o is not mesh:
        o.hide_viewport = True
sub = mesh.modifiers.new('Subdiv', 'SUBSURF')
sub.levels = 1
sub.uv_smooth = 'PRESERVE_BOUNDARIES'
# no posed armature: the rest pose only
for m in mesh.modifiers:
    if m.type == 'ARMATURE':
        m.show_viewport = False


def world():
    dg = bpy.context.evaluated_depsgraph_get()
    ev = mesh.evaluated_get(dg)
    me = ev.to_mesh()
    co = np.empty(len(me.vertices) * 3)
    me.vertices.foreach_get('co', co)
    co = co.reshape(-1, 3)
    ev.to_mesh_clear()
    M = np.array(mesh.matrix_world)
    p = co @ M[:3, :3].T + M[:3, 3]
    return np.stack([p[:, 0], p[:, 2], -p[:, 1]], 1)  # Blender z up -> glTF y up


for k in kb:
    k.value = 0
base = world()
deltas = {}
for name in KEEP:
    k = kb.get(name)
    if k is None:
        print('missing', name)
        continue
    k.value = 1
    d = world() - base
    k.value = 0
    deltas[name] = d.astype(np.float32)
    n = (np.linalg.norm(d, axis=1) > 1e-5).sum()
    print(f'{name}: {n} points, max {np.linalg.norm(d, axis=1).max() * 1000:.1f} mm')
np.savez_compressed(out, base=base.astype(np.float32), names=np.array(list(deltas)), **{f'd{i}': deltas[k] for i, k in enumerate(deltas)})
print('wrote', out, len(base), 'points')
