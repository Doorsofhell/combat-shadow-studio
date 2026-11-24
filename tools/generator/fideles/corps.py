"""2.4.0 prototype 2 — sculpture du corps d'un coach sur son propre photo.glb (Youssef 20/11 14:30 : « volumes
anatomiques réels », « athlétique mais pas hypertrophié », taille de la planche).

Ce qui change : les points (et leurs normales) du corps et du cou, la taille. Ce qui ne change pas : le nombre de
points, les triangles, les UV, les poids, le nom et la hiérarchie des os, les 25 expressions ARKit (leurs écarts sont
seulement mis à l'échelle avec la taille). Le moteur lit les os par leur nom : rien à changer côté moteur.

Deux outils, réglés par coach dans un .json :
- « segments » : un volume autour de l'axe d'un os (de l'os A vers l'os B), gonflé ou affiné en proportion de la
  distance à l'axe, avec un profil le long de l'os (centre, largeur) et une orientation (devant, côtés, dos) ; seuls
  les points dont le poids sur les os listés est fort bougent, en proportion de ce poids (pas de pli à la jointure) ;
- « bosses » : un muscle posé en un point (relatif à un os), poussé le long de la normale avec une enveloppe en
  gaussienne (pectoraux, deltoïdes, trapèzes, fessiers...).
La taille est faite ensuite par taille.mjs (gltf-transform, même méthode que Kanya).

Les points de même position (coutures du corps et de la tête, tête et yeux) bougent ensemble : le déplacement est
calculé une fois par position.
  python3 tools/generator/fideles/corps.py config.json"""
import sys, json, copy
import numpy as np
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from glb import Glb, save


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def joint_index(g):
    sk = g.j['skins'][0]
    return [g.j['nodes'][i]['name'] for i in sk['joints']]


def welded_normals(P, T, key):
    fn = np.cross(P[T[:, 1]] - P[T[:, 0]], P[T[:, 2]] - P[T[:, 0]])
    u, inv = np.unique(key, axis=0, return_inverse=True)
    inv = inv.ravel()
    vn = np.zeros((len(u), 3))
    for k in range(3):
        np.add.at(vn, inv[T[:, k]], fn)
    vn = vn[inv]
    return vn / (np.linalg.norm(vn, axis=1, keepdims=True) + 1e-12)


def sculpt(g, C):
    J = g.joints_world()
    names = joint_index(g)
    prims = [p for m in g.j['meshes'] for p in m['primitives']]
    pos_ids = []
    for p in prims:
        a = p['attributes']['POSITION']
        if a not in pos_ids:
            pos_ids.append(a)
    # toutes les positions du modèle, avec leurs poids (première occurrence)
    allP, allW, allN = [], [], []
    owner = []
    for p in prims:
        a = p['attributes']['POSITION']
        if a in [o[0] for o in owner]:
            continue
        P = g.acc(a).astype(np.float64)
        Jt = g.acc(p['attributes']['JOINTS_0']).astype(np.int64)
        Wt = g.acc(p['attributes']['WEIGHTS_0']).astype(np.float64)
        if Wt.max() > 1.5:
            Wt = Wt / 255.0
        W = np.zeros((len(P), len(names)))
        for k in range(4):
            np.add.at(W, (np.arange(len(P)), Jt[:, k]), Wt[:, k])
        owner.append((a, sum(len(x) for x in allP)))
        allP.append(P); allW.append(W); allN.append(g.acc(p['attributes']['NORMAL']).astype(np.float64))
    off = np.cumsum([0] + [len(x) for x in allP])
    P = np.concatenate(allP); W = np.concatenate(allW); N = np.concatenate(allN)
    key = np.round(P / 1e-5).astype(np.int64)
    u, first, inv = np.unique(key, axis=0, return_index=True, return_inverse=True)
    inv = inv.ravel()
    Pu = P[first]; Wu = W[first]
    Nu = np.zeros_like(Pu); np.add.at(Nu, inv, N); Nu /= np.linalg.norm(Nu, axis=1, keepdims=True) + 1e-12
    D = np.zeros_like(Pu)
    wof = lambda bones: sum(Wu[:, names.index(b)] for b in bones if b in names)

    for s in C.get('segments', []):
        for side in (['Left', 'Right'] if s.get('sym', True) and 'Left' in s['a'] else ['']):
            a = s['a'].replace('Left', side) if side else s['a']
            b = s['b'].replace('Left', side) if side else s['b']
            A = J[a]; B = J[b]
            ax = B - A; L = np.linalg.norm(ax); ax = ax / L
            rel = Pu - A
            t = rel @ ax / L
            radial = rel - np.outer(rel @ ax, ax)
            c, w = s.get('centre', 0.5), s.get('largeur', 0.6)
            prof = np.exp(-((t - c) / (w / 2)) ** 2 * 2)
            # orientation : devant (+z), côté (vers l'extérieur), dos (-z)
            r = np.linalg.norm(radial, axis=1) + 1e-9
            dirn = radial / r[:, None]
            fz = dirn[:, 2]
            sx = np.sign(A[0]) if abs(A[0]) > 0.02 else 0
            fx = dirn[:, 0] * sx if sx else np.abs(dirn[:, 0])
            o = s.get('orient', [1, 1, 1])  # devant, côté, dos
            ang = o[0] * np.clip(fz, 0, 1) + o[2] * np.clip(-fz, 0, 1) + o[1] * (1 - np.abs(fz))
            if not sx:
                ang = o[0] * np.clip(fz, 0, 1) + o[2] * np.clip(-fz, 0, 1) + o[1] * np.abs(dirn[:, 0])
            bones = [x.replace('Left', side) if side else x for x in s['os']]
            wm = smooth(s.get('poids', [0.2, 0.6])[0], s.get('poids', [0.2, 0.6])[1], wof(bones))
            D += radial * (s['gain'] * prof * ang * wm)[:, None]

    for bz in C.get('bosses', []):
        c0 = J[bz['os']] + np.array(bz['pos'], float)
        for side in ([1, -1] if bz.get('sym', True) else [1]):
            cc = c0 * np.array([side, 1, 1])
            d = (Pu - cc) / np.array(bz['rayon'], float)
            env = np.exp(-(d ** 2).sum(1) * 2)
            wm = 1.0
            if bz.get('os_poids'):
                bl = [x.replace('Left', 'Right') if side == -1 else x for x in bz['os_poids']]
                wm = smooth(0.1, 0.5, wof(bl))
            # seulement les points tournés du côté du muscle (pas la face opposée d'un bras fin)
            if bz.get('dir'):
                dv = np.array(bz['dir'], float) * np.array([side, 1, 1]); dv /= np.linalg.norm(dv)
                wm = wm * smooth(-0.2, 0.4, Nu @ dv)
            D += Nu * (bz['h'] * env * wm)[:, None]

    # pas de déplacement de la tête au-dessus du cou (visage du prototype gardé) ni des mains et des pieds
    keep = wof(['Head'] + [n for n in names if n.startswith('Face_') or n.endswith('Eye')])
    keep = keep + wof([n for n in names if 'Hand' in n and n not in ('LeftHand', 'RightHand')]) + wof(['LeftToeBase', 'RightToeBase'])
    D *= (1 - np.clip(keep, 0, 1))[:, None]

    # lissage du champ sur la surface (voisins par arêtes), quelques passes
    T_all = []
    for p in prims:
        a = p['attributes']['POSITION']
        base = dict(owner)[a]
        T = g.acc(p['indices']).reshape(-1, 3).astype(np.int64) + base
        T_all.append(inv[T])
    Tu = np.concatenate(T_all)
    e = np.concatenate([Tu[:, [0, 1]], Tu[:, [1, 2]], Tu[:, [2, 0]]])
    e = np.concatenate([e, e[:, ::-1]])
    deg = np.bincount(e[:, 0], minlength=len(Pu)).astype(float)
    for _ in range(C.get('lissage', 4)):
        acc = np.zeros_like(D); np.add.at(acc, e[:, 0], D[e[:, 1]])
        D = 0.5 * D + 0.5 * acc / np.maximum(deg, 1)[:, None]

    newPu = Pu + D
    print('déplacement max (mm)', round(float(np.abs(D).max() * 1000), 1), 'moyen', round(float(np.linalg.norm(D, axis=1).mean() * 1000), 2))
    return owner, off, inv, Pu, newPu, Tu


def build(src, out, C, owner_ref=None):
    g = Glb(src)
    owner, off, inv, Pu, newPu, Tu = sculpt(g, C)
    vn0 = welded_normals(Pu, Tu, np.arange(len(Pu))[:, None])
    vn1 = welded_normals(newPu, Tu, np.arange(len(Pu))[:, None])
    # la taille (Amara 1,70 m, Victor 1,88 m) est faite ensuite par taille.mjs (gltf-transform, comme Kanya)
    new_acc = {}
    prims = [p for m in g.j['meshes'] for p in m['primitives']]
    for a, o in owner:
        n = g.acc(a).shape[0]
        idx = inv[o:o + n]
        new_acc[a] = newPu[idx].astype(np.float32)
        p = next(p for p in prims if p['attributes']['POSITION'] == a)
        na = p['attributes']['NORMAL']
        N0 = g.acc(na).astype(np.float64)
        N1 = N0 + (vn1[idx] - vn0[idx])
        N1 /= np.linalg.norm(N1, axis=1, keepdims=True) + 1e-12
        new_acc[na] = N1.astype(np.float32)
    g.j.setdefault('asset', {}).setdefault('extras', {})['cssCorps240'] = {'note': C.get('note', '')}
    save(g, out, new_acc)
    print('écrit', out)


if __name__ == '__main__':
    C = json.load(open(sys.argv[1]))
    for o in C['out']:
        build(o['src'], o['path'], C)
