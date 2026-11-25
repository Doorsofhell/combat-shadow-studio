#!/usr/bin/env python3
"""2.4.0 prototype 2 (Youssef 25/11, « juste correction amélioration tenue, pas de refonte ») : poids de peau des
shorts lissés (couture d'entrejambe, puis hanches et cuisses).

Constat vérifié (shorts-v1442.test.ts, diagnostic des arêtes) : au high kick, le short MMA d'Amara s'étire 6,1 fois
(limite 6 ; 3,5 à 5,2 chez les autres coachs). Les arêtes étirées sont toutes au creux de l'entrejambe (|x| < 12 mm,
hauteur 0,80 à 0,84 m), longues de 1 à 5 mm : à cet endroit, les parts des cuisses changent brutalement d'un point à
son voisin (0,65 cuisse gauche, puis 0,63 cuisse droite) ; quand une jambe monte, les voisins partent chacun de leur
côté.

Correction : dans cette zone seulement, les poids de peau du short sont lissés sur la surface (moyenne des voisins,
points soudés par leur place), avec deux garde-fous : un point qui tient aux deux cuisses ne dépasse jamais 0,49 pour
l'une d'elles (aucun triangle tenu par la jambe gauche et la jambe droite : pas de membrane, test 1.44.2), et le
bord de la zone se fond sur 6 mm. Points, UV, textures et peau masquée inchangés.

Second constat (captures du moteur et mesure des triangles retournés, diagnostic) : au coup de pied et au genou,
2 à 4 % des triangles des shorts se retournent (plis du tissu qui passent l'un à travers l'autre : taches sombres,
« trous », tissu froissé à l'aine). Le même lissage, sur tout le short sauf ses 11,5 cm du haut (la ceinture et le
bassin, inchangés), répartit la flexion de la hanche sur la cuisse. Mesuré sur le short thaï de Naël : 2,09 -> 1,18 %
au high kick, 2,94 -> 2,01 % au genou, tests 1.44.2 réussis. Option --auto : zone prise sur le short lui-même (2 cm
sous l'ourlet le plus bas jusqu'à 11,5 cm sous le haut), toute la largeur.

Usage : python3 tools/generator/rocketbox/short_poids.py <tenue.glb> [--x 0.012] [--y0 0.79] [--y1 0.845] [--iter 12]
        python3 tools/generator/rocketbox/short_poids.py <tenue.glb> --auto [--iter 8]
"""
import os
import sys
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'fideles'))
from glb import Glb, save  # noqa: E402


def opt(k, d):
    return float(sys.argv[sys.argv.index(k) + 1]) if k in sys.argv else d


def smooth(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def process(path, X, Y0, Y1, IT):
    g = Glb(path)
    ex = g.j.setdefault('asset', {}).setdefault('extras', {})
    new_acc = {}
    for n in g.j['nodes']:
        if 'mesh' not in n or 'skin' not in n:
            continue
        m = g.j['meshes'][n['mesh']]
        if not m.get('name', '').startswith('short-'):
            continue
        names = [g.j['nodes'][j].get('name', '').replace('mixamorig:', '') for j in g.j['skins'][n['skin']]['joints']]
        L, R = names.index('LeftUpLeg'), names.index('RightUpLeg')
        nb = len(names)
        prims = m['primitives']
        data = []
        for p in prims:
            a = p['attributes']
            if g.j['accessors'][a['WEIGHTS_0']]['componentType'] != 5126:
                raise SystemExit(f'{path} : poids non flottants, non pris en charge')
            P = g.acc(a['POSITION']).astype(np.float64)
            J = g.acc(a['JOINTS_0']).astype(np.int64)
            W = g.acc(a['WEIGHTS_0']).astype(np.float64)
            T = g.acc(p['indices']).astype(np.int64).reshape(-1, 3)
            data.append((p, P, J, W, T))
        allP = np.vstack([d[1] for d in data])
        u = 100.0 if allP[:, 1].max() > 10 else 1.0
        keys, inv = np.unique(np.round(allP * (2e4 / u)).astype(np.int64), axis=0, return_inverse=True)
        inv = inv.reshape(-1)
        nu = len(keys)
        Pu = np.zeros((nu, 3)); Pu[inv] = allP / u
        Wd = np.zeros((nu, nb))
        off = 0
        for (_, P, J, W, _) in data:
            k = len(P)
            dense = np.zeros((k, nb))
            for s in range(4):
                np.add.at(dense, (np.arange(k), J[:, s]), W[:, s])
            Wd[inv[off:off + k]] = dense
            off += k
        # voisins sur la surface soudée
        edges = set()
        off = 0
        for (_, P, _, _, T) in data:
            t = inv[off + T]
            for a_, b_ in ((0, 1), (1, 2), (2, 0)):
                for e in zip(t[:, a_], t[:, b_]):
                    if e[0] != e[1]:
                        edges.add((min(e), max(e)))
            off += len(P)
        E = np.array(sorted(edges))
        if '--auto' in sys.argv:
            X, Y0, Y1 = 0.25, Pu[:, 1].min() - 0.02, Pu[:, 1].max() - 0.115
        # zone et fondu de son bord
        zx = 1 - smooth((np.abs(Pu[:, 0]) - (X - 0.006)) / 0.006)
        zy = smooth((Pu[:, 1] - Y0) / 0.006) * (1 - smooth((Pu[:, 1] - (Y1 - 0.006)) / 0.006))
        z = zx * zy
        zone = z > 0
        W0 = Wd.copy()
        for _ in range(int(IT)):
            acc = np.zeros_like(Wd); cnt = np.zeros(nu)
            np.add.at(acc, E[:, 0], Wd[E[:, 1]]); np.add.at(acc, E[:, 1], Wd[E[:, 0]])
            np.add.at(cnt, E[:, 0], 1); np.add.at(cnt, E[:, 1], 1)
            avg = acc / np.maximum(cnt, 1)[:, None]
            Wd = np.where(zone[:, None], W0 * (1 - z[:, None]) + avg * z[:, None], W0)
            # garde-fou : jamais plus de 0,49 pour une cuisse quand l'autre tient aussi le point (l'excédent va au bassin)
            both = (Wd[:, L] > 0.02) & (Wd[:, R] > 0.02)
            for b in (L, R):
                over = both & (Wd[:, b] > 0.49)
                exc = np.where(over, Wd[:, b] - 0.49, 0)
                Wd[:, b] -= exc
                Wd[:, names.index('Hips')] += exc
            Wd /= Wd.sum(1, keepdims=True)
        # 4 os au plus par point : les 4 plus forts, renormalisés
        top = np.argsort(-Wd, 1)[:, :4]
        tw = np.take_along_axis(Wd, top, 1)
        tw /= tw.sum(1, keepdims=True)
        changed = int((np.abs(Wd - W0).max(1) > 1e-4).sum())
        off = 0
        for (p, P, J, W, _) in data:
            k = len(P)
            ids = inv[off:off + k]
            mv = np.abs(Wd[ids] - W0[ids]).max(1) > 1e-4
            if mv.any():
                J2 = J.copy(); W2 = W.copy()
                J2[mv] = top[ids[mv]]; W2[mv] = tw[ids[mv]]
                W2[mv] = np.where(W2[mv] < 1e-4, 0, W2[mv])
                ct = g.j['accessors'][p['attributes']['JOINTS_0']]['componentType']
                new_acc[p['attributes']['JOINTS_0']] = J2.astype(np.uint8 if ct == 5121 else np.uint16)
                new_acc[p['attributes']['WEIGHTS_0']] = W2.astype(np.float32)
            off += k
        print(f'{os.path.basename(os.path.dirname(os.path.dirname(path)))}/{os.path.basename(path)} {m["name"]} : {changed} points lissés')
    if '--check' in sys.argv or not new_acc:
        return
    ex['cssShortPoids'] = '2.4.0' + (' auto' if '--auto' in sys.argv else '')
    save(g, path, new_acc=new_acc)


if __name__ == '__main__':
    files = [a for i, a in enumerate(sys.argv[1:], 1) if a.endswith('.glb')]
    for f in files:
        process(f, opt('--x', 0.012), opt('--y0', 0.79), opt('--y1', 0.845), opt('--iter', 8 if '--auto' in sys.argv else 12))
