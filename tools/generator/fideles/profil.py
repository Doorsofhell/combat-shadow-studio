"""2.10.1 (Youssef 25/11 14 h 38, « revoir la morphologie du visage pour que ça ressemble à la maquette », Amara et Kanya) :
profil du visage calé sur la vue de profil de la planche « Focus visage ».

visage.py ne cale la forme que sur la vue de face (largeurs et hauteurs) : la profondeur (avancée du nez, des lèvres,
du menton, pente du front) n'est pas vue. Ici :
1. profil de la planche : pour chaque ligne de l'image, le point de peau le plus en avant (fond bleu nuit, peau orangée) ;
2. profil du modèle : pour chaque hauteur, le point le plus en avant de la tête sur l'axe du visage (|x| < 4 mm) ;
3. les deux profils sont posés l'un sur l'autre par deux repères pris sur chacun : la racine du nez (point le plus en
   retrait entre le front et le bout du nez) et le bas du menton (dernière ligne avant le retour vers le cou) ;
4. l'écart d'avancée, ligne par ligne, lissé et borné, est appliqué aux points de la tête : en profondeur seulement,
   plein sur l'axe et fondu sur les côtés (étroit pour le nez, large pour le menton et le front), nul autour des yeux
   (os des yeux inchangés), sur les côtés du crâne et à l'arrière. Les points de même position bougent ensemble ;
   écarts des expressions, poids, uv et textures inchangés.

  python3 profil.py config.json   (clés : ref, ref_box, sens 'droite'|'gauche', fichiers [[entrée, sortie]...],
                                   max (m, défaut 0.006), force (défaut 1))
"""
import sys, os, json
import numpy as np
from PIL import Image
from scipy import ndimage as nd
H = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, H)
from glb import Glb, save


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def vertex_normals(P, T):
    key = np.round(P / 1e-5).astype(np.int64)
    _, inv = np.unique(key, axis=0, return_inverse=True); inv = inv.ravel()
    fn = np.cross(P[T[:, 1]] - P[T[:, 0]], P[T[:, 2]] - P[T[:, 0]])
    acc = np.zeros((inv.max() + 1, 3))
    for k in range(3):
        np.add.at(acc, inv[T[:, k]], fn)
    n = acc[inv]
    return n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-12)


def slice_profile(P, T, cx, ys, ez, sgn):
    """coupe des triangles par le plan x = cx : pour chaque hauteur ys, avancée maximale (sgn*(z-ez)) + 0,05 ; -1 si rien"""
    A, B, Cc = P[T[:, 0]], P[T[:, 1]], P[T[:, 2]]
    out = np.full(len(ys), -1.0)
    segs = []
    for U, V in ((A, B), (B, Cc), (Cc, A)):
        du, dv = U[:, 0] - cx, V[:, 0] - cx
        cross = (du * dv) < 0
        t = du[cross] / (du[cross] - dv[cross])
        segs.append((np.nonzero(cross)[0], U[cross] + (V[cross] - U[cross]) * t[:, None]))
    # chaque triangle coupé donne deux points : on relie les points d'un même triangle
    idx = np.concatenate([s_[0] for s_ in segs]); pts = np.concatenate([s_[1] for s_ in segs])
    order = np.argsort(idx, kind='stable'); idx = idx[order]; pts = pts[order]
    pair = np.nonzero(idx[:-1] == idx[1:])[0]
    p1, p2 = pts[pair], pts[pair + 1]
    z1, z2 = sgn * (p1[:, 2] - ez), sgn * (p2[:, 2] - ez)
    keep = (z1 > -0.01) | (z2 > -0.01)  # avant du visage seulement
    p1, p2, z1, z2 = p1[keep], p2[keep], z1[keep], z2[keep]
    y1, y2 = p1[:, 1], p2[:, 1]
    for i, y in enumerate(ys):
        c = (np.minimum(y1, y2) <= y) & (np.maximum(y1, y2) >= y)
        if not c.any():
            continue
        t = (y - y1[c]) / np.where(np.abs(y2[c] - y1[c]) < 1e-9, 1, y2[c] - y1[c])
        out[i] = (z1[c] + (z2[c] - z1[c]) * t).max() + 0.05
    return out


def ref_profile(C):
    a = np.asarray(Image.open(C['ref']).convert('RGB')).astype(int)
    x0, y0, x1, y1 = C['ref_box']
    a = a[y0:y1, x0:x1]
    if C.get('sens', 'droite') == 'gauche':
        a = a[:, ::-1]
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    skin = (R > B + 40) & (R > 90)
    prof = np.array([np.nonzero(r)[0].max() if r.any() else -1 for r in skin], float)
    return prof


def landmarks(y, z, saut=True):
    """y croissant vers le bas (indices), z avancée. Renvoie (racine du nez, bout du nez, bas du menton) en indices"""
    # plus longue suite de lignes valides (mèches isolées au-dessus du front écartées)
    v = np.concatenate([[0], (z >= 0).astype(int), [0]])
    st = np.nonzero(np.diff(v) == 1)[0]; en = np.nonzero(np.diff(v) == -1)[0]
    b = int(np.argmax(en - st))
    ok = np.arange(st[b], en[b])
    zz = np.full(len(z), np.nan); zz[ok] = z[ok]
    # bas du menton : la première chute de plus de 15 % de la hauteur visible, sous le bout du nez
    tip = None
    n = len(z)
    span = ok[-1] - ok[0]
    # bout du nez : maximum dans le tiers du milieu
    mid = slice(ok[0] + span // 4, ok[0] + 3 * span // 4)
    tip = mid.start + int(np.nanargmax(zz[mid]))
    # racine du nez : minimum juste au-dessus du bout du nez (moitié basse du segment front -> bout du nez)
    up = slice(tip - int(0.55 * (tip - ok[0])), tip - 3)
    nas = up.start + int(np.nanargmin(zz[up]))
    # bas du menton : sous le bout du nez, avant le saut vers le cou
    zr = zz[tip:]
    dz = np.diff(zr)
    jump = np.nonzero(dz < -0.2 * (np.nanmax(zz) - np.nanmin(zz)))[0]
    men = tip + (int(jump[0]) if (len(jump) and saut) else ok[-1] - tip)
    men = min(men, ok[-1])
    return nas, tip, men


def main(cfg):
    C = json.load(open(cfg))
    # profil de la planche (pixels, y vers le bas, avancée vers la droite)
    pr = ref_profile(C)
    nas_r, tip_r, men_r = landmarks(np.arange(len(pr)), pr)
    print('planche : racine du nez', nas_r, 'bout du nez', tip_r, 'bas du menton', men_r)
    files = C['fichiers']
    g = Glb(files[0][0])
    J = g.joints_world()
    def head_prim(g):
        for m in g.j['meshes']:
            for p in m['primitives']:
                if g.j['materials'][p['material']].get('name', '').endswith('_head'):
                    return p
    p0 = head_prim(g)
    P = g.acc(p0['attributes']['POSITION']).astype(np.float64)
    u = 100.0 if P[:, 1].max() > 10 else 1.0
    Pm = P / u
    eL = np.array(J['LeftEye']) / u; eR = np.array(J['RightEye']) / u
    ez = (eL[2] + eR[2]) / 2; ey = (eL[1] + eR[1]) / 2; cx = (eL[0] + eR[0]) / 2
    sgn = 1.0 if ez > Pm[:, 2].mean() else -1.0  # le visage regarde du côté des yeux
    # profil du modèle : coupe de la tête par le plan médian (x = milieu des yeux), avancée maximale par hauteur
    T0 = g.acc(p0['indices']).reshape(-1, 3).astype(np.int64)
    ys = np.arange(ey + 0.045, ey - 0.13, -0.0005)
    zm = slice_profile(Pm, T0, cx, ys, ez, sgn)
    # trous courts (fente de la bouche, au plus 4 mm) bouchés par interpolation
    bad = zm < 0; lab, nl = nd.label(bad)
    for k_ in range(1, nl + 1):
        r_ = np.nonzero(lab == k_)[0]
        if len(r_) <= 8 and r_[0] > 0 and r_[-1] < len(zm) - 1:
            zm[r_] = np.interp(r_, [r_[0] - 1, r_[-1] + 1], [zm[r_[0] - 1], zm[r_[-1] + 1]])
    # modèle : la coupe s'arrête au bas du menton (le cou est derrière l'avant du visage) ; pas de recherche de saut
    # (la fente de la bouche en ferait un)
    nas_m, tip_m, men_m = landmarks(np.arange(len(ys)), zm, saut=False)
    print('modèle : racine du nez %.1f mm, bout du nez %.1f mm, bas du menton %.1f mm (sous les yeux)' % tuple(
        (ey - ys[k]) * 1000 for k in (nas_m, tip_m, men_m)))
    # mise à l'échelle : racine du nez -> bas du menton ; origine de profondeur : racine du nez
    k = (ys[nas_m] - ys[men_m]) / (men_r - nas_r)  # m par pixel
    yr = ys[nas_m] - (np.arange(len(pr)) - nas_r) * k
    zr = (pr - pr[nas_r]) * k + zm[nas_m]
    zr[pr < 0] = np.nan
    # écart, sur les hauteurs du modèle, entre un peu au-dessus de la racine du nez et le bas du menton
    zr_m = np.interp(ys[::-1], yr[::-1], zr[::-1])[::-1]
    lo, hi = ys[men_m] - 0.002, ys[nas_m] + 0.025
    # zone corrigée réglable (mm sous les yeux) : Amara, nez de la planche plus bas que celui du modèle, seulement lèvres
    # et menton (un écart ligne à ligne sur le nez creuserait l'arête et pousserait le front)
    if C.get('de_mm') is not None:
        hi = min(hi, ey - C['de_mm'] / 1000)
    use = (ys >= lo) & (ys <= hi) & (zm > 0) & np.isfinite(zr_m)
    d = np.where(use, zr_m - zm, 0.0)
    d = nd.gaussian_filter1d(d, 3) * C.get('force', 1.0)
    mx = C.get('max', 0.006)
    fo = C.get('fondu_mm', 10) / 1000
    d = np.clip(d, -mx, mx) * smooth(lo - 0.004, lo + 0.002, ys) * smooth(hi + fo, hi, ys)
    if C.get('trace'):
        import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
        f, ax = plt.subplots(figsize=(4, 6))
        okm = zm > 0
        ax.plot(zm[okm] * 1000, ys[okm] * 1000, label='modèle'); ax.plot(zr * 1000, yr * 1000, label='planche')
        ax.plot((zm + d)[okm] * 1000, ys[okm] * 1000, '--', label='corrigé')
        ax.set_aspect('equal'); ax.legend(); f.savefig(C['trace'], dpi=110)
    for name, kk in (('front', nas_m - 20), ('racine du nez', nas_m), ('bout du nez', tip_m), ('lèvres', (tip_m + men_m) // 2),
                     ('menton', men_m - 8)):
        print(f'  {name:14s} écart {d[kk] * 1000:+.1f} mm')
    # largeur du fondu sur les côtés selon la hauteur : étroit au nez, large au menton et au front
    def sigma(y):
        t_n = smooth(ys[nas_m] + 0.005, ys[nas_m] - 0.005, y) * smooth(ys[tip_m] - 0.012, ys[tip_m] - 0.004, y)
        return 0.028 - 0.016 * t_n
    for src, dst in files:
        g2 = Glb(src)
        p = head_prim(g2)
        at = p['attributes']
        Q = g2.acc(at['POSITION']).astype(np.float64)
        Qm = Q / u
        dd = np.interp(-Qm[:, 1], -ys, d)
        sx = sigma(Qm[:, 1])
        w = np.exp(-0.5 * ((Qm[:, 0] - cx) / sx) ** 2)
        w *= smooth(-0.04, -0.005, sgn * (Qm[:, 2] - ez))  # seulement l'avant du visage
        for e in (eL, eR):
            w *= smooth(0.016, 0.026, np.linalg.norm(Qm - e, axis=1))
        Q2 = Qm.copy(); Q2[:, 2] += sgn * dd * w
        mv = np.abs(dd * w)
        print(f'{os.path.basename(dst)} : {int((mv > 0.0005).sum())} points bougés, max {mv.max() * 1000:.1f} mm')
        # normales : même rotation que la surface (méthode de visage.py)
        T = g2.acc(p['indices']).reshape(-1, 3).astype(np.int64)
        N = g2.acc(at['NORMAL']).astype(np.float64)
        N1 = N + (vertex_normals(Q2, T) - vertex_normals(Qm, T))
        N1 /= np.maximum(np.linalg.norm(N1, axis=1, keepdims=True), 1e-12)
        N1[mv < 1e-7] = N[mv < 1e-7]
        ex = g2.j.setdefault('asset', {}).setdefault('extras', {})
        ex['cssProfil'] = '2.10.1'
        save(g2, dst, new_acc={at['POSITION']: (Q2 * u).astype(np.float32), at['NORMAL']: N1.astype(np.float32)})


if __name__ == '__main__':
    main(sys.argv[1])
