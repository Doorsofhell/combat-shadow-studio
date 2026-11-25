"""2.10.1 (Youssef 25/11 14 h 19, « donne aussi un peu de volume aux cheveux d'Amara ») : volume des cheveux peints.

Les têtes Rocketbox n'ont pas de maillage de cheveux : les cheveux sont peints sur le crâne de la tête et le chignon est
sculpté dans le même maillage. Le volume est donné en soulevant le crâne peint le long de sa normale :
- poids « cheveux » de chaque point = couleur de la texture de la tête à son uv (sombre et peu saturée = cheveux),
  fondu sur les voisins (pas de marche à la lisière du front, oreilles et peau à zéro) ;
- soulèvement plein sur le haut et l'arrière du crâne, réduit vers le front et les tempes (une coiffure tirée garde
  sa lisière), nul sous les oreilles ;
- le chignon (points de cheveux derrière la nuque, au-delà du crâne) est agrandi depuis son point d'attache.
Les points de même position (coutures uv) bougent ensemble ; les écarts des expressions, les poids, les uv et les
textures ne changent pas. Seule la primitive de la tête est touchée.

  python3 cheveux.py <entrée.glb> <sortie.glb> [--leve 0.004] [--chignon 1.12] [--cotes 0.85]
"""
import sys, os, argparse
import numpy as np
from scipy import ndimage as nd
H = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, H)
from glb import Glb, save


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('dst')
    ap.add_argument('--leve', type=float, default=0.004)
    ap.add_argument('--chignon', type=float, default=1.12)
    ap.add_argument('--cotes', type=float, default=0.85)
    a = ap.parse_args()
    g = Glb(a.src)
    ex = g.j.setdefault('asset', {}).setdefault('extras', {})
    if ex.get('cssCheveuxVolume'):
        sys.exit(f'{a.src} : volume déjà appliqué ({ex["cssCheveuxVolume"]})')
    head = None
    for m in g.j['meshes']:
        for p in m['primitives']:
            if g.j['materials'][p['material']].get('name', '').endswith('_head'):
                head = p
    at = head['attributes']
    P = g.acc(at['POSITION']).astype(np.float64)
    N = g.acc(at['NORMAL']).astype(np.float64)
    UV = g.acc(at['TEXCOORD_0']).astype(np.float64)
    T = g.acc(head['indices']).reshape(-1, 3).astype(np.int64)
    u = 100.0 if P[:, 1].max() > 10 else 1.0
    P /= u
    tex = np.asarray(g.image('head_color')).astype(np.float32) / 255
    S = tex.shape[0]
    tx = np.clip((UV[:, 0] % 1) * S, 0, S - 1).astype(int); ty = np.clip((UV[:, 1] % 1) * S, 0, S - 1).astype(int)
    blur = nd.gaussian_filter(tex, (2, 2, 0))
    c = blur[ty, tx]
    lum = c @ np.array([0.3, 0.59, 0.11]); sat = c.max(1) - c.min(1)
    # soudure par position
    key = np.round(P / 1e-5).astype(np.int64)
    _, inv = np.unique(key, axis=0, return_inverse=True); inv = inv.ravel(); n = inv.max() + 1
    Pw = np.zeros((n, 3)); Pw[inv] = P
    Nw = np.zeros((n, 3)); np.add.at(Nw, inv, N); Nw /= np.maximum(np.linalg.norm(Nw, axis=1, keepdims=True), 1e-9)
    hw = np.zeros(n); cnt = np.zeros(n)
    np.add.at(hw, inv, smooth(0.30, 0.18, lum) * smooth(0.16, 0.08, sat)); np.add.at(cnt, inv, 1); hw /= cnt
    # voisins (arêtes) pour fondre le poids
    Ti = inv[T]
    E = np.vstack([Ti[:, [0, 1]], Ti[:, [1, 2]], Ti[:, [2, 0]]])
    E = np.vstack([E, E[:, ::-1]])
    deg = np.bincount(E[:, 0], minlength=n).astype(float)
    # le crâne seulement : au-dessus du bas des oreilles, et pas le visage (devant les yeux)
    J = g.joints_world()
    ey = J['LeftEye'][1] / u; ez = J['LeftEye'][2] / u
    head_c = np.array([0.0, ey, ez - 0.075])
    w = hw * smooth(ey - 0.06, ey - 0.02, Pw[:, 1])
    for _ in range(6):
        s = np.zeros(n); np.add.at(s, E[:, 0], w[E[:, 1]]); w = 0.5 * w + 0.5 * s / np.maximum(deg, 1)
    w = np.clip(w * 1.15, 0, 1) * (hw > 0.05)
    for _ in range(3):
        s = np.zeros(n); np.add.at(s, E[:, 0], w[E[:, 1]]); w = 0.5 * w + 0.5 * s / np.maximum(deg, 1)
    # moins vers le front et les tempes (coiffure tirée) : plein sur le haut et l'arrière
    front = smooth(ez - 0.02, ez - 0.07, Pw[:, 2])  # 1 vers l'arrière
    top = smooth(ey + 0.02, ey + 0.09, Pw[:, 1])
    amount = a.leve * w * (0.45 + 0.55 * np.maximum(front, top))
    # peu sur les côtés : la largeur de la tête entre dans le volume du tronc que le moteur mesure pour les traversées
    # (rig.ts trunkCore) ; une tête plus large y déplace les mains (test intrusions)
    amount *= 1 - a.cotes * np.abs(Nw[:, 0])
    D = Nw * amount[:, None]
    # le haut de la tête ne monte pas : le moteur prend la taille du coach au sommet du maillage (rig.ts metrics.height)
    # et y proportionne les gestes ; aucun point ne dépasse le sommet d'origine (l'écart restant est gardé à l'horizontale)
    ymax = P[:, 1].max()
    D[:, 1] = np.minimum(D[:, 1], np.maximum(ymax - 0.0005 - Pw[:, 1], 0) * 0.8)
    # chignon : points de cheveux au-delà du crâne, à l'arrière ; agrandis depuis leur attache
    r = np.linalg.norm(Pw - head_c, axis=1)
    back = (Pw[:, 2] < ez - 0.13) & (w > 0.3)
    nb = 0
    if back.any() and a.chignon != 1:
        rr = np.percentile(r[(w > 0.3) & (Pw[:, 1] > ey)], 70)
        bun = back & (r > rr + 0.01)
        if bun.sum() > 30:
            cen = Pw[bun].mean(0)
            anc = head_c + (cen - head_c) / np.linalg.norm(cen - head_c) * rr
            k = smooth(rr + 0.005, rr + 0.02, r) * back
            D += (Pw - anc) * ((a.chignon - 1) * k)[:, None]
            nb = int(bun.sum())
    newP = (Pw + D)[inv] * u
    print(f'{os.path.basename(a.src)} : {int((w > 0.3).sum())} points de cheveux, soulèvement max {amount.max() * 1000:.1f} mm, chignon {nb} points')
    ex['cssCheveuxVolume'] = f'2.10.1 leve={a.leve} chignon={a.chignon} cotes={a.cotes}'
    save(g, a.dst, new_acc={at['POSITION']: newP.astype(np.float32)})


if __name__ == '__main__':
    main()
