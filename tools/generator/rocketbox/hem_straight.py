#!/usr/bin/env python3
"""2.4.0 prototype 2 (Youssef 25/11, « juste correction amélioration tenue, pas de refonte ») : ourlets réguliers.

Constat vérifié (captures du moteur, 6 coachs) : le bas des shorts sort du générateur en dents de scie. Les points de
l'ourlet (le rebord épaissi du bas de chaque jambe) sont à des hauteurs qui varient de 1 à 3 mm d'un point au voisin ;
sur un ourlet de quelques millimètres, ça se lit comme un tissu déchiré.

Correction : sur chaque jambe de chaque maillage « short-* », les points de la rangée du bas (à moins de 4 mm de la
ligne basse locale) sont posés sur une ligne lisse : minimum local (fenêtre de ±0,2 rad autour de l'axe de la jambe)
puis moyenne glissante circulaire. Seule la hauteur change (jamais vers la peau : pas de mouvement horizontal), et le
même point garde la même place dans toutes les primitives (couleur, panneau, liseré). Coupe, poids, os, UV, textures,
peau masquée : inchangés. Un fichier déjà traité (asset.extras.cssHemStraight) est laissé tel quel.

Usage : python3 tools/generator/rocketbox/hem_straight.py <tenue.glb>... [--check]  (--check : mesure sans écrire)
"""
import os
import sys
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'fideles'))
from glb import Glb, save  # noqa: E402

VERSION = '2.4.0'
ROW = 0.004        # hauteur de la rangée du bas, au-dessus de la ligne basse locale (m)
WIN = 0.2          # fenêtre du minimum local (rad)
SMOOTH = 0.12      # écart type de la moyenne glissante (rad)


def roughness(y, row_env):
    return float(np.percentile(np.abs(y - row_env), 95)) if len(y) else 0.0


def straighten(P, u, check):
    """P : points (n, 3) en unités du fichier (u = 1 m). Renvoie (nouveaux points, mesure avant, après, points bougés)"""
    Q = P.copy()
    before = after = 0.0
    moved = 0
    for side in (1, -1):
        sel = np.nonzero(side * P[:, 0] > 0.02 * u)[0]
        if len(sel) < 20:
            continue
        y = P[sel, 1]
        low = sel[y < y.min() + 0.05 * u]
        if len(low) < 20:
            continue
        c = P[low][:, [0, 2]].mean(0)
        ang = np.arctan2(P[low, 2] - c[1], P[low, 0] - c[0])
        yl = P[low, 1]
        # minimum local autour de l'axe de la jambe
        d = np.abs(((ang[:, None] - ang[None, :]) + np.pi) % (2 * np.pi) - np.pi)
        near = d < WIN
        env0 = np.where(near, yl[None, :], np.inf).min(1)
        row = (yl - env0) < ROW * u
        if row.sum() < 10:
            continue
        ar, yr = ang[row], env0[row]
        # moyenne glissante circulaire du minimum local, sur les points de la rangée
        dr = np.abs(((ar[:, None] - ar[None, :]) + np.pi) % (2 * np.pi) - np.pi)
        w = np.exp(-0.5 * (dr / SMOOTH) ** 2)
        env = (w * yr[None, :]).sum(1) / w.sum(1)
        idx = low[row]
        before = max(before, roughness(P[idx, 1], env) / u)
        Q[idx, 1] = env
        after = max(after, roughness(Q[idx, 1], env) / u)
        moved += int((np.abs(Q[idx, 1] - P[idx, 1]) > 1e-6 * u).sum())
    return Q, before, after, moved


def process(path, check=False):
    g = Glb(path)
    ex = g.j.setdefault('asset', {}).setdefault('extras', {})
    if ex.get('cssHemStraight') and not check:
        print(f'{path} : ourlets déjà redressés ({ex["cssHemStraight"]})')
        return
    new_acc = {}
    report = []
    for m in g.j['meshes']:
        name = m.get('name', '')
        if not name.startswith('short-'):
            continue
        prims = m['primitives']
        pos = [g.acc(p['attributes']['POSITION']).astype(np.float64) for p in prims]
        # points soudés par leur place sur tout le short (une même place = un même déplacement)
        allp = np.vstack(pos)
        u = 100.0 if allp[:, 1].max() > 10 else 1.0
        keys, inv = np.unique(np.round(allp * (2e4 / u)).astype(np.int64), axis=0, return_inverse=True)
        inv = inv.reshape(-1)
        uniq = np.zeros((len(keys), 3))
        uniq[inv] = allp
        Q, b, a, n = straighten(uniq, u, check)
        report.append(f'{name} : écart de l\'ourlet {b * 1000:.2f} -> {a * 1000:.2f} mm (95e centile), {n} points')
        o = 0
        for p, P in zip(prims, pos):
            k = len(P)
            NP = Q[inv[o:o + k]]
            o += k
            if np.abs(NP - P).max() > 0:
                new_acc[p['attributes']['POSITION']] = NP.astype(np.float32)
    for r in report:
        print(f'{os.path.basename(os.path.dirname(os.path.dirname(path)))}/{os.path.basename(path)} {r}')
    if check or not new_acc:
        return
    ex['cssHemStraight'] = VERSION
    save(g, path, new_acc=new_acc)


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if a != '--check']
    for f in args:
        process(f, check='--check' in sys.argv)
