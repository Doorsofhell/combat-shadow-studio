#!/usr/bin/env python3
"""2.4.0 prototype 2 (Youssef 25/11, « juste correction amélioration tenue, pas de refonte ») : peau sous les shorts.

Constat vérifié (shorts-v1442.test.ts) : sous le short thaï d'Amara, 6,3 % des points de peau qui sont à moins de 6 mm
du tissu restent dessinés (limite 6 %) ; en mouvement, cette peau peut traverser le tissu.

Correction : les points du corps qui sont sous le tissu d'un short (à moins de 6 mm d'un point du short, du côté de la
peau par rapport à la normale du tissu, et à plus de 3 cm au-dessus de l'ourlet le plus bas) sont ajoutés à la liste de
peau masquée de la tenue (extras.hideBody, clés en millimètres sur la position du fichier, comme l'application les
calcule). Rien d'autre ne change : maillages, poids, textures, os. Un triangle de peau n'est retiré que si ses trois
coins sont masqués, comme avant.

Usage : python3 tools/generator/rocketbox/hide_under.py <corps.glb> <tenue.glb>... [--check]
"""
import base64
import os
import struct
import sys
import numpy as np
from scipy.spatial import cKDTree

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'fideles'))
from glb import Glb, save  # noqa: E402

NEAR = 0.006
ABOVE_HEM = 0.03
BELOW_TOP = 0.03


def body_points(path):
    g = Glb(path)
    pts = []
    for m in g.j['meshes']:
        for p in m['primitives']:
            if 'body' in g.j['materials'][p['material']].get('name', '').lower():
                pts.append(g.acc(p['attributes']['POSITION']))
    return np.vstack(pts)


def process(body_path, path, check):
    B = body_points(body_path)
    ub = 100.0 if B[:, 1].max() > 10 else 1.0
    g = Glb(path)
    carrier = next(n for n in g.j['nodes'] if n.get('extras', {}).get('hideBody'))
    ex = carrier['extras']
    scale = float(ex.get('hideScale', 1000))
    raw = base64.b64decode(ex['hideBody'])
    keys = {struct.unpack_from('<hhh', raw, o) for o in range(0, len(raw) - 5, 6)}
    bkeys = [tuple(int(round(float(c) * scale)) for c in q) for q in B]
    add = set()
    band = []
    for m in g.j['meshes']:
        for p in m['primitives']:
            if m.get('name', '').startswith('ceinture-short') or g.j['materials'][p['material']].get('name', '').startswith('ceinture-'):
                bp = g.acc(p['attributes']['POSITION'])
                band.append(bp / (100.0 if bp[:, 1].max() > 10 else 1.0))
    for m in g.j['meshes']:
        if not m.get('name', '').startswith('short-'):
            continue
        P = np.vstack([g.acc(p['attributes']['POSITION']) for p in m['primitives']])
        N = np.vstack([g.acc(p['attributes']['NORMAL']) for p in m['primitives']])
        us = 100.0 if P[:, 1].max() > 10 else 1.0
        P = P / us
        tree = cKDTree(P)
        Bm = B / ub
        d, i = tree.query(Bm)
        inside = ((Bm - P[i]) * N[i]).sum(1) < 0
        # dehors mais à moins de 6 mm : peau qui affleure ou traverse le tissu (le tissu est derrière elle) ; jamais
        # près du haut du short (la peau au-dessus de la ceinture reste dessinée)
        ok = (d < NEAR) & (Bm[:, 1] > P[:, 1].min() + ABOVE_HEM) & (inside | (Bm[:, 1] < P[:, 1].max() - BELOW_TOP))
        # le haut du short est recouvert par la ceinture (maillage à part) : la peau sous la ceinture, à plus de 6 mm de
        # son bord haut, est masquée aussi
        for bp in band:
            db, _ = cKDTree(bp).query(Bm)
            ok |= (d < NEAR) & (db < 0.015) & (Bm[:, 1] < bp[:, 1].max() - 0.006) & (Bm[:, 1] > bp[:, 1].min())
        for k in np.nonzero(ok)[0]:
            if bkeys[k] not in keys:
                add.add(bkeys[k])
    name = f'{os.path.basename(os.path.dirname(os.path.dirname(path)))}/{os.path.basename(path)}'
    print(f'{name} : {len(keys)} points masqués, {len(add)} ajoutés')
    if check or not add:
        return
    q = bytearray(raw)
    for k in sorted(add):
        q += struct.pack('<hhh', *k)
    ex['hideBody'] = base64.b64encode(bytes(q)).decode()
    ex['cssHideUnder'] = '2.4.0'
    save(g, path)


if __name__ == '__main__':
    a = [x for x in sys.argv[1:] if x != '--check']
    for f in a[1:]:
        process(a[0], f, '--check' in sys.argv)
