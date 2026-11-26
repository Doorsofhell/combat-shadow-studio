#!/usr/bin/env python3
"""2.10.4 (Youssef 26/11, « les shorts de MMA & kick sont déchirés pour Amara ») : poids de peau des shorts rendus.

Constat vérifié (captures WebGL du Lab en garde) : le lissage des poids de `short_poids.py --auto` (2.10.0, marque
`cssShortPoids`) décolle le tissu de la cuisse quand la jambe plie : la peau passe devant le short par plaques, comme
une déchirure. Amara (MMA, kickboxing) en est le cas le plus visible ; Kanya (muay-thaï) et Naël (kickboxing) ont les
mêmes plaques, plus petites.

Correction : pour un short dont le fichier d'avant le lissage a le même maillage (mêmes points, même ordre, mêmes os),
les poids de peau du short (JOINTS_0, WEIGHTS_0) sont repris de ce fichier. Les points (ourlets redressés), UV,
textures, couleurs et masque de peau restent ceux du fichier actuel. La marque `cssShortPoids` est retirée, remplacée
par `cssPoidsAvant`.

Usage : python3 tools/generator/rocketbox/poids_avant.py <tenue d'avant.glb> <tenue.glb>
"""
import os
import sys
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'fideles'))
from glb import Glb, save  # noqa: E402

VERSION = '2.10.4'


def skin_names(g, mi):
    for n in g.j['nodes']:
        if n.get('mesh') == mi and 'skin' in n:
            return [g.j['nodes'][j].get('name') for j in g.j['skins'][n['skin']]['joints']]
    return None


def process(old_path, path):
    g0, g = Glb(old_path), Glb(path)
    by_name = {m['name']: i for i, m in enumerate(g0.j['meshes'])}
    new_acc = {}
    for mi, m in enumerate(g.j['meshes']):
        if not m['name'].startswith('short-'):
            continue
        oi = by_name.get(m['name'])
        assert oi is not None, f'{m["name"]} absent de {old_path}'
        assert skin_names(g, mi) == skin_names(g0, oi), f'{m["name"]} : os différents'
        P0s = g0.j['meshes'][oi]['primitives']
        assert len(P0s) == len(m['primitives']), f'{m["name"]} : primitives différentes'
        moved = 0.0
        for p, p0 in zip(m['primitives'], P0s):
            a, a0 = p['attributes'], p0['attributes']
            P, P0 = g.acc(a['POSITION']), g0.acc(a0['POSITION'])
            assert P.shape == P0.shape, f'{m["name"]} : nombre de points différent'
            # seuls les ourlets ont bougé, en hauteur
            assert np.abs(P[:, [0, 2]] - P0[:, [0, 2]]).max() < 1e-6, f'{m["name"]} : points déplacés'
            moved = max(moved, float(np.abs(P - P0).max()))
            for k in ('JOINTS_0', 'WEIGHTS_0'):
                assert g.j['accessors'][a[k]]['componentType'] == g0.j['accessors'][a0[k]]['componentType']
                new_acc[a[k]] = g0.acc(a0[k])
        print(f'{os.path.basename(os.path.dirname(os.path.dirname(path)))}/{os.path.basename(path)} {m["name"]} : '
              f'poids repris, écart de position max {moved * 1000 / (100 if P[:, 1].max() > 10 else 1):.1f} mm')
    ex = g.j['asset'].setdefault('extras', {})
    ex.pop('cssShortPoids', None)
    ex['cssPoidsAvant'] = VERSION
    save(g, path, new_acc=new_acc)


if __name__ == '__main__':
    process(sys.argv[1], sys.argv[2])
