"""Kadir 1.46 — exporte le maillage de Kadir (repos ET posé comme les planches : bras le long du corps, jambes un peu
écartées) pour les mesures et la projection des planches.
  python3 tools/generator/kadir/pose_export.py photo.glb sortie.npz
npz : R (positions de repos, axes Blender Z haut, mètres), P (posées), N (normales posées), tris, uvs (par coin),
mat (0 corps, 1 tête, 2 yeux), J (articulations posées, json), W (poids des os principaux, json)."""
import bpy, sys, json, numpy as np
from mathutils import Vector, Matrix
glb, out = sys.argv[1:3]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
arm = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE'][0]
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
def aim(upper, hand, d):
    pb = arm.pose.bones[upper]; bpy.context.view_layer.update()
    h = arm.matrix_world @ pb.head; w = arm.matrix_world @ arm.pose.bones[hand].head
    R = (w - h).normalized().rotation_difference(Vector(d).normalized()).to_matrix().to_4x4()
    pb.matrix = arm.matrix_world.inverted() @ Matrix.Translation(h) @ R @ Matrix.Translation(-h) @ arm.matrix_world @ pb.matrix
    bpy.context.view_layer.update()
def rest_snapshot():
    out = []
    for ob in meshes:
        me = ob.data; out.append(np.array([tuple(ob.matrix_world @ v.co) for v in me.vertices]))
    return out
R = rest_snapshot()
aim('LeftArm', 'LeftHand', (0.20, 0.0, -1)); aim('RightArm', 'RightHand', (-0.20, 0.0, -1))
aim('LeftUpLeg', 'LeftFoot', (0.11, 0.0, -1)); aim('RightUpLeg', 'RightFoot', (-0.11, 0.0, -1))
dg = bpy.context.evaluated_depsgraph_get()
P, N, T, UV, M, Rr, VW = [], [], [], [], [], [], []
off = 0
names = ['Head', 'Neck', 'Spine', 'Spine1', 'Spine2', 'Hips'] + [s + b for s in ('Left', 'Right') for b in ('Shoulder', 'Arm', 'ForeArm', 'Hand', 'UpLeg', 'Leg', 'Foot', 'ToeBase')]
W = {n: [] for n in names}
for k, ob in enumerate(meshes):
    if 'hipoly' not in ob.name: continue
    sl = [s.material.name if s.material else '' for s in ob.material_slots]
    cls = [2 if 'Eye' in n else 1 if 'head' in n else 0 for n in sl]
    ev = ob.evaluated_get(dg); em = ev.to_mesh()
    P.append(np.array([tuple(ev.matrix_world @ v.co) for v in em.vertices]))
    N.append(np.array([tuple((ev.matrix_world.to_3x3() @ v.normal).normalized()) for v in em.vertices]))
    em.calc_loop_triangles(); uvl = em.uv_layers.active.data
    for lt in em.loop_triangles:
        T.append([i + off for i in lt.vertices]); UV.append([tuple(uvl[l].uv) for l in lt.loops]); M.append(cls[lt.material_index])
    gn = {g.index: g.name for g in ob.vertex_groups}
    w = {n: np.zeros(len(ob.data.vertices)) for n in names}
    for v in ob.data.vertices:
        for g in v.groups:
            nm = gn[g.group]
            if nm in w: w[nm][v.index] = g.weight
    for n in names: W[n].append(w[n])
    Rr.append(R[k]); off += len(em.vertices); ev.to_mesh_clear()
    print(ob.name, sl, len(P[-1]))
J = {b.name: tuple(arm.matrix_world @ arm.pose.bones[b.name].head) for b in arm.data.bones}
np.savez(out, R=np.vstack(Rr), P=np.vstack(P), N=np.vstack(N), tris=np.array(T), uvs=np.array(UV), mat=np.array(M),
         W=np.stack([np.concatenate(W[n]) for n in names], 1), Wn=np.array(names), J=json.dumps(J))
print('ok', out)
