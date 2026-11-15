"""Kadir 1.46 (Youssef 15/11 : « aucune trace de l'ancien visage ») — reporte sur le modèle de Kadir la forme d'une
tête greffée par rocketbox/face_transfer.py (visage d'un avatar Rocketbox MIT posé sur le corps sportif de Kadir).
  python3 tools/generator/kadir/greffe_disp.py greffe.blend Sports_Male_01_facial.fbx pose.npz sortie.npz
Le .blend garde la topologie du corps sportif : le déplacement de chaque sommet (greffe - original) est interpolé
sur les points du GLB (point le plus proche de la surface d'origine, coordonnées barycentriques), puis écrit comme
forme.py : sortie.npz (R2, D, N2) et sortie.f32 pour rocketbox/victor_build.mjs."""
import sys, numpy as np
import bpy
from mathutils.bvhtree import BVHTree
from mathutils import Vector
from mathutils.geometry import barycentric_transform

blend, fbx, posef, out = sys.argv[1:5]
bpy.ops.wm.open_mainfile(filepath=blend)
g = next(o for o in bpy.data.objects if o.type == 'MESH' and o.name.startswith('base'))
before = set(bpy.data.objects)
bpy.ops.import_scene.fbx(filepath=fbx)
o = next(x for x in bpy.data.objects if x not in before and x.type == 'MESH')
# face_transfer.py ajoute à la fin les cheveux du donneur (cartes) : seuls les premiers sommets sont le corps
assert len(g.data.vertices) >= len(o.data.vertices), (len(o.data.vertices), len(g.data.vertices))
Mo, Mg = o.matrix_world, g.matrix_world
# formes de base seulement (le .fbx facial a des clés de forme : la base est la forme au repos)
V0 = np.array([tuple(Mo @ v.co) for v in o.data.vertices])
V1 = np.array([tuple(Mg @ v.co) for v in g.data.vertices][:len(V0)])
D0 = V1 - V0
tris = []
for p in o.data.polygons:
    vs = list(p.vertices)
    for k in range(1, len(vs) - 1):
        tris.append((vs[0], vs[k], vs[k + 1]))
tris = np.array(tris)
bvh = BVHTree.FromPolygons([Vector(x) for x in V0], [tuple(t) for t in tris])

d = np.load(posef)
R, T = d['R'], d['tris']
D = np.zeros_like(R)
far = 0
for i, p in enumerate(R):
    loc, nrm, fi, dist = bvh.find_nearest(Vector(p))
    if fi is None or dist > 0.01:
        far += 1
        continue
    a, b, c = tris[fi]
    # barycentriques du point projeté dans le triangle d'origine
    pa, pb, pc = (Vector(V0[j]) for j in (a, b, c))
    w = barycentric_transform(loc, pa, pb, pc, Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1)))
    D[i] = w.x * D0[a] + w.y * D0[b] + w.z * D0[c]
# yeux : le GLB a ses propres globes (split_eyes.mjs) ; chaque globe suit en bloc le globe greffé du même côté
oa = next(x for x in bpy.data.objects if x not in before and x.type == 'ARMATURE')
ga = next(x for x in bpy.data.objects if x in before and x.type == 'ARMATURE' and x.name.startswith('base'))
em = np.zeros(len(R), bool); em[T[d['mat'] == 2].ravel()] = True
for side, s in (('L', 1), ('R', -1)):
    bn = f'Bip01 {side}Eye'
    mv = np.array(ga.matrix_world @ ga.data.bones[bn].head_local) - np.array(oa.matrix_world @ oa.data.bones[bn].head_local)
    sel = em & (np.sign(R[:, 0]) == np.sign((oa.matrix_world @ oa.data.bones[bn].head_local).x))
    D[sel] = mv
    print('oeil', side, 'points', int(sel.sum()), 'déplacement mm', np.round(mv * 1000, 1))
print('points loin de la surface', far, 'déplacement max mm', round(float(np.linalg.norm(D, axis=1).max() * 1000), 1),
      'points bougés', int((np.linalg.norm(D, axis=1) > 2e-4).sum()))


def vnorm(P, T):
    n = np.zeros_like(P); f = np.cross(P[T[:, 1]] - P[T[:, 0]], P[T[:, 2]] - P[T[:, 0]])
    for k in range(3): np.add.at(n, T[:, k], f)
    # points dédoublés aux coutures d'UV : même normale des deux côtés
    key = np.round(P * 1e5).astype(np.int64)
    _, inv = np.unique(key, axis=0, return_inverse=True)
    acc = np.zeros((inv.max() + 1, 3)); np.add.at(acc, inv.ravel(), n)
    n = acc[inv.ravel()]
    return n / (np.linalg.norm(n, axis=1, keepdims=True) + 1e-12)


# oreilles de lutteur (« chou-fleur », mission 15/11) : replis de l'oreille comblés (lissage), hélix épaissi et bosselé,
# surtout en haut ; seuls les points de l'oreille (loin du crâne) bougent
import os
if os.environ.get('OREILLES', '1') == '1':
    P1 = R + D
    ear = (np.abs(R[:, 0]) > 0.074) & (R[:, 1] > -0.03) & (R[:, 1] < 0.04) & (R[:, 2] > 1.62) & (R[:, 2] < 1.72)
    hm = np.zeros(len(R), bool); hm[T[d['mat'] >= 1].ravel()] = True; ear &= hm
    wE = np.clip((np.abs(R[:, 0]) - 0.074) / 0.006, 0, 1) * ear
    # voisinage (sommets soudés par position : les coutures d'UV dédoublent les points)
    key = np.round(R * 1e5).astype(np.int64); _, inv = np.unique(key, axis=0, return_inverse=True); inv = inv.ravel()
    nb = [set() for _ in range(inv.max() + 1)]
    for t in T:
        a, b, c = inv[t]
        nb[a] |= {b, c}; nb[b] |= {a, c}; nb[c] |= {a, b}
    Q = np.zeros((inv.max() + 1, 3)); np.add.at(Q, inv, P1); cnt = np.bincount(inv); Q /= cnt[:, None]
    wq = np.zeros(len(Q)); np.maximum.at(wq, inv, wE)
    Q0 = Q.copy()
    for it in range(14):
        Qn = Q.copy()
        for i in np.where(wq > 0)[0]:
            if nb[i]: Qn[i] = Q[list(nb[i])].mean(0)
        Q = Q + (Qn - Q) * wq[:, None] * 0.7
    Nq = np.zeros_like(Q); f = np.cross(Q[inv[T[:, 1]]] - Q[inv[T[:, 0]]], Q[inv[T[:, 2]]] - Q[inv[T[:, 0]]])
    for k in range(3): np.add.at(Nq, inv[T[:, k]], f)
    Nq /= np.linalg.norm(Nq, axis=1, keepdims=True) + 1e-12
    rng = np.random.default_rng(11)
    bumps = rng.standard_normal(len(Q))
    for it in range(4):
        b2 = bumps.copy()
        for i in np.where(wq > 0)[0]:
            if nb[i]: b2[i] = 0.5 * bumps[i] + 0.5 * bumps[list(nb[i])].mean()
        bumps = b2
    zq = np.zeros(len(Q)); np.add.at(zq, inv, R[:, 2]); zq /= cnt
    amp = 0.0032 * (0.6 + 0.4 * np.clip((zq - 1.65) / 0.04, 0, 1)) * (1 + 1.5 * bumps.clip(-0.6, 1))
    Q = Q + Nq * (amp * wq)[:, None]
    D = D + (Q - Q0)[inv]
    print('oreilles : points', int(ear.sum()), 'déplacement max mm', round(float(np.linalg.norm((Q - Q0)[inv], axis=1).max() * 1000), 1))
R2 = R + D
N2 = vnorm(R2, T)
np.savez(out, R2=R2, D=D, N2=N2)
gl = lambda a: np.stack([a[:, 0], a[:, 2], -a[:, 1]], 1)
np.concatenate([gl(R), gl(D), gl(N2)], 1).astype(np.float32).tofile(out.replace('.npz', '.f32'))
print('ok', out)
