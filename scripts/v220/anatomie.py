"""v2.2.0 Phase A — mesures anatomiques de chaque coach dans Blender (bpy), en position de repos, espace monde.

python3 scripts/v220/anatomie.py [sortie.json]

Pour chaque public/coaches/<id>/photo.glb : hauteur réelle (sommets), repères osseux (hauteurs relatives), largeur
des épaules (acromions = os Arm), largeur de hanches, tranches horizontales du tronc (largeur, profondeur, périmètre de
l'enveloppe convexe des sommets du corps dont l'os dominant est le bassin, la colonne ou les clavicules), et le profil
de tour de taille / bassin / poitrine. Les tranches excluent les bras par leur os dominant. Rien n'est modifié.
"""
import json
import math
import sys
from pathlib import Path

import bpy
import numpy as np

ROOT = Path('public/coaches')
OUT = Path(sys.argv[1] if len(sys.argv) > 1 else 'docs/v220/audit/anatomie.json')
TORSO = ('Hips', 'Spine', 'Spine1', 'Spine2', 'LeftShoulder', 'RightShoulder')


def hull_perimeter(pts):
    if len(pts) < 3:
        return 0.0
    p = sorted(map(tuple, pts))
    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lo, up = [], []
    for q in p:
        while len(lo) >= 2 and cross(lo[-2], lo[-1], q) <= 0:
            lo.pop()
        lo.append(q)
    for q in reversed(p):
        while len(up) >= 2 and cross(up[-2], up[-1], q) <= 0:
            up.pop()
        up.append(q)
    h = lo[:-1] + up[:-1]
    return sum(math.dist(h[i], h[(i + 1) % len(h)]) for i in range(len(h)))


def measure(glb):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(glb))
    arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
    bones = {b.name: (arm.matrix_world @ b.head_local) for b in arm.data.bones}
    body = None
    for o in bpy.context.scene.objects:
        if o.type == 'MESH' and any('body' in (m.name or '').lower() for m in o.data.materials):
            body = o
    # le corps et la tête peuvent être deux objets : les sommets de tous les maillages skinnés pour la hauteur
    allz = []
    for o in bpy.context.scene.objects:
        if o.type == 'MESH' and any(m.type == 'ARMATURE' for m in o.modifiers):
            mw = o.matrix_world
            allz += [(mw @ v.co).z for v in o.data.vertices]
    zmin, zmax = min(allz), max(allz)
    H = zmax - zmin
    mw = body.matrix_world
    names = {g.index: g.name for g in body.vertex_groups}
    pts = []  # x, y(profondeur), z, os dominant
    for v in body.data.vertices:
        if not v.groups:
            continue
        g = max(v.groups, key=lambda g: g.weight)
        c = mw @ v.co
        pts.append((c.x, c.y, c.z, names.get(g.group, '')))
    torso = np.array([(x, y, z) for x, y, z, n in pts if n in TORSO])
    upleg = np.array([(x, y, z) for x, y, z, n in pts if n in TORSO or 'UpLeg' in n])
    legs = {side: np.array([(x, y, z) for x, y, z, n in pts if n == f'{side}UpLeg']) for side in ('Left', 'Right')}
    calf = {side: np.array([(x, y, z) for x, y, z, n in pts if n == f'{side}Leg']) for side in ('Left', 'Right')}
    uarm = {side: np.array([(x, y, z) for x, y, z, n in pts if n == f'{side}Arm']) for side in ('Left', 'Right')}

    def sl(arr, z, band=0.01):
        s = arr[np.abs(arr[:, 2] - z) < band]
        if len(s) < 6:
            return None
        return dict(z=round((z - zmin) / H, 3), width=round(float(np.ptp(s[:, 0])), 3), depth=round(float(np.ptp(s[:, 1])), 3),
                    perimeter=round(hull_perimeter(s[:, [0, 1]]), 3))

    zh = bones['Hips'].z
    zn = bones['Neck'].z
    prof = []
    z = zh - 0.16
    while z < zn - 0.03:
        s = sl(upleg if z < zh else torso, z)
        if s:
            prof.append(s)
        z += 0.015
    # repères anatomiques mesurés sur le profil (en fractions de la hauteur)
    def best(lo, hi, key, mx):
        c = [s for s in prof if lo <= s['z'] <= hi]
        return (max if mx else min)(c, key=lambda s: s[key]) if c else None
    hipf = (zh - zmin) / H
    neckf = (zn - zmin) / H
    waist = best(hipf + 0.02, hipf + 0.6 * (neckf - hipf), 'perimeter', False)
    hips = best(hipf - 0.1, hipf + 0.01, 'perimeter', True)
    chest = best(hipf + 0.55 * (neckf - hipf), neckf - 0.02, 'perimeter', True)

    def girth(arr, frac):
        if arr is None or len(arr) == 0:
            return None
        zs = arr[:, 2]
        z0 = zs.min() + frac * np.ptp(zs)
        s = arr[np.abs(zs - z0) < 0.012]
        return round(hull_perimeter(s[:, [0, 1]]), 3) if len(s) > 5 else None
    r3 = lambda x: round(float(x), 3)
    sw = (bones['LeftArm'] - bones['RightArm']).length
    return dict(
        height_m=r3(H),
        landmarks={k: r3((bones[k].z - zmin) / H) for k in ('Hips', 'Spine1', 'Spine2', 'Neck', 'Head', 'LeftArm', 'LeftLeg', 'LeftFoot') if k in bones},
        shoulder_joint_width=r3(sw), shoulder_to_height=r3(sw / H),
        hip_joint_width=r3((bones['LeftUpLeg'] - bones['RightUpLeg']).length),
        leg_to_height=r3(((bones['LeftUpLeg'] - bones['LeftLeg']).length + (bones['LeftLeg'] - bones['LeftFoot']).length) / H),
        arm_to_height=r3(((bones['LeftArm'] - bones['LeftForeArm']).length + (bones['LeftForeArm'] - bones['LeftHand']).length) / H),
        chest=chest, waist=waist, hips=hips,
        waist_to_hip=r3(waist['perimeter'] / hips['perimeter']) if waist and hips else None,
        chest_to_waist=r3(chest['perimeter'] / waist['perimeter']) if waist and chest else None,
        shoulder_width_to_hip_width=r3(max(s['width'] for s in prof if s['z'] > chest['z'] - 0.02) / hips['width']) if chest and hips else None,
        thigh_girth=girth(legs['Left'], 0.75), calf_girth=girth(calf['Left'], 0.7), upper_arm_girth=None,
        profile=prof,
    )


if __name__ == '__main__':
    res = {}
    for d in sorted(ROOT.iterdir()):
        f = d / 'photo.glb'
        if f.exists():
            res[d.name] = measure(f)
            m = res[d.name]
            print(d.name, m['height_m'], 'W/H', m['waist_to_hip'], 'C/W', m['chest_to_waist'], 'S/H', m['shoulder_width_to_hip_width'], 'waist', m['waist'], 'hips', m['hips'], 'chest', m['chest'])
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(res, indent=1))
