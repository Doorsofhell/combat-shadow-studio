#!/usr/bin/env python3
"""2.10.4 : rapproche une bande (ceinture) de la peau du corps actuel d'un pas fixe, sans changer sa forme.

Chaque point de la bande avance vers le point de peau le plus proche de <pas> mètres au plus, sans descendre à moins
de 4 mm de la peau. Usage :
python3 tools/generator/rocketbox/resserre_ceinture.py <corps.glb> <tenue.glb> <sortie.glb> <nom de pièce> <pas en m>
"""
import sys, numpy as np
sys.path.insert(0, __import__('os').path.join(__import__('os').path.dirname(__file__), '..', 'fideles'))
from glb import Glb, save
body_p, tenue_in, tenue_out, mesh_sub, step = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], float(sys.argv[5])
B = Glb(body_p)
bp = None
for m in B.j['meshes']:
    for pr in m['primitives']:
        if 'body' in B.j['materials'][pr['material']]['name'].lower(): bp = B.acc(pr['attributes']['POSITION'])
if np.abs(bp).max() > 10: bp = bp / 100
G = Glb(tenue_in)
done = 0
new_acc = {}
for m in G.j['meshes']:
    if mesh_sub not in m['name']: continue
    for pr in m['primitives']:
        ai = pr['attributes']['POSITION']; P = G.acc(ai).astype(np.float64)
        near = np.empty(len(P), int)
        for s in range(0, len(P), 256):
            d = ((P[s:s+256, None, :] - bp[None, :, :]) ** 2).sum(-1); near[s:s+256] = d.argmin(1)
        v = bp[near] - P; dist = np.linalg.norm(v, axis=1)
        mv = np.where(dist > 0.004, np.minimum(step, dist - 0.004), 0)
        P2 = (P + v / np.maximum(dist, 1e-9)[:, None] * mv[:, None]).astype(np.float32)
        print(f"{m['name']}: écart médian {np.median(dist)*1000:.1f} -> {np.median(np.linalg.norm(bp[near]-P2,axis=1))*1000:.1f} mm, {int((mv>0).sum())}/{len(P)} points")
        new_acc[ai] = P2; done += 1
assert done
G.j.setdefault('asset', {}).setdefault('extras', {})['cssBandResserree'] = f'2.10.4 {mesh_sub} {step*1000:.1f} mm'
save(G, tenue_out, new_acc)
