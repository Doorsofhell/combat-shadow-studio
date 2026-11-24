"""2.4.0 « coachs fidèles aux images de référence » : rapproche la tête d'un coach Rocketbox d'une image de visage.
1. repères MediaPipe sur un rendu de face du modèle et sur l'image (reperes.py) ;
2. caméra affine ajustée sur les 478 paires ;
3. FORME : écart des repères (nez, bouche, sourcils, ovale, menton) converti en mètres et appliqué aux points de la
   tête par un champ lisse (plaque mince) : fonction de la position seule, donc les points dupliqués des coutures uv
   bougent ensemble ; yeux fixes (os des yeux inchangés), nuque, crâne et cou à zéro ; expressions gardées (deltas) ;
4. TEXTURE : l'image est projetée sur la texture de la tête (texels de face, dans l'ovale du visage) en basses
   fréquences, le grain de peau du modèle gardé en hautes fréquences ; le teint de la tête et du corps est ramené à
   celui de l'image par le même gain (pas de raccord au cou).
  python3 visage.py config.json   (voir fideles/<coach>.json)"""
import sys, os, json, io
import numpy as np
from PIL import Image
from scipy import ndimage as nd
from scipy.interpolate import RBFInterpolator
from matplotlib.path import Path as MPath
H = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, H)
from glb import Glb, save, prim_refs
from raster import front_view, uv_raster
from reperes import detect

OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149,
        150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
EYES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 263, 249, 390, 373, 374, 380,
        381, 382, 362, 398, 384, 385, 386, 387, 388, 466] + list(range(468, 478))
SHAPE = [1, 4, 5, 6, 197, 195, 2, 98, 327, 129, 358, 48, 278, 61, 291, 0, 17, 13, 14, 37, 267, 84, 314, 152, 148, 377,
         176, 400, 172, 397, 136, 365, 58, 288, 132, 361, 93, 323, 234, 454, 70, 63, 105, 66, 107, 336, 296, 334, 293,
         300, 151, 9, 8, 168, 50, 280, 205, 425, 187, 411, 207, 427, 116, 345, 123, 352]
EYE_ANCHOR = [33, 133, 159, 145, 263, 362, 386, 374]


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def fit_affine(X, u):
    A = np.hstack([X, np.ones((len(X), 1))])
    M, *_ = np.linalg.lstsq(A, u, rcond=None)
    return M.T  # 2x4


def proj(M, X):
    return X @ M[:, :3].T + M[:, 3]


def vertex_normals(P, T):
    # normales lissées en soudant les points de même position (coutures uv)
    key = np.round(P / 1e-5).astype(np.int64)
    _, inv = np.unique(key, axis=0, return_inverse=True)
    inv = inv.ravel()
    fn = np.cross(P[T[:, 1]] - P[T[:, 0]], P[T[:, 2]] - P[T[:, 0]])
    acc = np.zeros((inv.max() + 1, 3))
    for k in range(3):
        np.add.at(acc, inv[T[:, k]], fn)
    n = acc[inv]
    return n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-12)


def main(cfg):
    C = json.load(open(cfg))
    task = C['task']
    g = Glb(C['src'])
    refs = prim_refs(g)
    head = [r for r in refs if r[0].endswith('_head')][0]
    Pacc, Nacc, Iacc = head[1], head[2], head[3]
    P0 = g.acc(Pacc).astype(np.float64); N0 = g.acc(Nacc).astype(np.float64)
    T = g.acc(Iacc).reshape(-1, 3).astype(np.int64)
    UV = [p['UV'] for p in g.prims() if p['mat'].endswith('_head')][0].astype(np.float64)
    eye_prim = [r for r in refs if r[0].startswith('Eyes')]
    TE = g.acc(eye_prim[0][3]).reshape(-1, 3).astype(np.int64) if eye_prim else np.zeros((0, 3), np.int64)
    J = g.joints_world(); ey = J['LeftEye'][1]; ez = J['LeftEye'][2]
    tex = np.asarray(g.image('head_color')).astype(np.float32) / 255
    px = 0.0004
    img, XYZ, Z = front_view(P0, T, UV, tex, (-0.11, 0.11, ey - 0.14, ey + 0.11), px)
    Image.fromarray((img * 255).astype(np.uint8)).save(C['work'] + '-face-avant.png')
    Lm = detect(Image.open(C['work'] + '-face-avant.png'), task)
    ref = Image.open(C['ref']).convert('RGB')
    x0, y0, x1, y1 = C['ref_box']
    Lr = detect(ref.crop((x0, y0, x1, y1)), task)
    if Lm is None or Lr is None:
        raise SystemExit('visage non détecté')
    Lr[:, 0] += x0; Lr[:, 1] += y0
    ix = np.clip(Lm[:, 0].astype(int), 0, XYZ.shape[1] - 1); iy = np.clip(Lm[:, 1].astype(int), 0, XYZ.shape[0] - 1)
    X3 = XYZ[iy, ix]; ok = np.isfinite(Z[iy, ix])
    # caméra : ajustée sur les points de l'ovale, du nez et des yeux (structure), pas sur la bouche/expression
    base_idx = np.array([i for i in OVAL + EYES[:32] + [1, 4, 6, 168, 197, 195, 5, 98, 327] if ok[i]])
    M = fit_affine(X3[base_idx], Lr[base_idx, :2])
    res0 = np.linalg.norm(proj(M, X3[base_idx]) - Lr[base_idx, :2], axis=1).mean()
    print('écart moyen avant forme (px image)', round(float(res0), 2))
    # ----- forme
    alpha = C.get('shape', 0.8)
    A2 = M[:, :2]; A2i = np.linalg.pinv(A2)
    sh = np.array([i for i in SHAPE if ok[i]])
    r = Lr[sh, :2] - proj(M, X3[sh])
    dxy = (A2i @ r.T).T * alpha
    lim = C.get('shape_max', 0.006)
    nrm = np.linalg.norm(dxy, axis=1, keepdims=True); dxy = dxy * np.minimum(1, lim / np.maximum(nrm, 1e-9))
    # 2.4.0 (Youssef 24/11 « adoucis son visage ») : coins de la bouche remontés (61, 291 et leurs voisins de la
    # commissure, lèvre du haut et du bas ensemble : la bouche ne s'ouvre pas) au lieu de reprendre leur chute sur la
    # planche ; en mètres, vers le haut
    # lèvres un peu plus pleines (Youssef 24/11 « au goût du jour ») : contour extérieur du haut vers le haut, du bas vers
    # le bas, et les deux un peu en avant ; la ligne entre les lèvres (13, 14) ne bouge pas, la bouche ne s'ouvre pas
    full = C.get('levres', 0.0)
    if full:
        for k, i in enumerate(sh):
            up = {0: 1.0, 37: 0.8, 267: 0.8}.get(int(i), 0.0)
            down = {17: 1.0, 84: 0.8, 314: 0.8}.get(int(i), 0.0)
            if up or down:
                dxy[k, 1] += full * (up - down)
    # 24/11 (Youssef « des visages plus doux et moins crispés, humains et homogènes ») : les planches ont un air sévère
    # (sourcils bas et rapprochés). La forme des sourcils n'est reprise que vers le haut, à moitié, jamais vers le bas ni
    # vers le milieu : on garde l'ossature du visage, pas le froncement
    if C.get('sourcils_neutres'):
        for k, i in enumerate(sh):
            if int(i) in (70, 63, 105, 66, 107, 336, 296, 334, 293, 300):
                dxy[k, 0] = 0.0
                dxy[k, 1] = max(dxy[k, 1], 0.0) * 0.5
    lift = C.get('coins_bouche', 0.0)
    if lift:
        for k, i in enumerate(sh):
            w = {61: 1.0, 291: 1.0, 146: 0.8, 375: 0.8, 185: 0.8, 409: 0.8, 78: 1.0, 308: 1.0, 95: 0.8, 324: 0.8, 191: 0.8, 415: 0.8}.get(int(i), 0.0)
            if w:
                dxy[k, 1] = max(dxy[k, 1], 0.0) + lift * w
    anc = np.array([i for i in EYE_ANCHOR if ok[i]])
    # profondeur (prototype 2) : même estimateur MediaPipe sur le rendu du modèle et sur l'image, ramené en mètres et
    # centré sur les yeux ; le modèle regarde vers +Z, MediaPipe compte la profondeur vers la caméra en négatif
    az = C.get('profondeur', 0.0)
    if az:
        sref = np.sqrt(abs(np.linalg.det(A2)))
        zr = Lr[:, 2] / sref; zm = Lm[:, 2] * px
        zr = zr - zr[anc].mean(); zm = zm - zm[anc].mean()
        dz = -(zr[sh] - zm[sh]) * az
        dz = np.clip(dz, -lim, lim)
        print('profondeur : écart moyen (mm)', round(float(np.abs(dz).mean() * 1000), 2), 'max', round(float(np.abs(dz).max() * 1000), 2))
    else:
        dz = np.zeros(len(sh))
    if full:
        for k, i in enumerate(sh):
            dz[k] += full * 0.8 * {0: 1.0, 37: 0.8, 267: 0.8, 17: 1.0, 84: 0.8, 314: 0.8}.get(int(i), 0.0)
    dxy = np.hstack([dxy, dz[:, None]])
    src = np.vstack([X3[sh, :2], X3[anc, :2]])
    dst = np.vstack([dxy, np.zeros((len(anc), 3))])
    # anneau de points fixes autour du visage (crâne, oreilles, cou)
    cx = 0.0; cy = ey - 0.035
    ring = np.array([[cx + 0.11 * np.cos(t), cy + 0.14 * np.sin(t)] for t in np.linspace(0, 2 * np.pi, 24, endpoint=False)])
    src = np.vstack([src, ring]); dst = np.vstack([dst, np.zeros((len(ring), 3))])
    tps = RBFInterpolator(src, dst, kernel='thin_plate_spline', smoothing=C.get('shape_smooth', 2e-5))
    chin_y = X3[152, 1]
    def field(P, N):
        wv = smooth(-0.1, 0.45, N[:, 2]) * smooth(chin_y - 0.025, chin_y - 0.002, P[:, 1]) * smooth(ez - 0.06, ez - 0.02, P[:, 2])
        # 2.4.0 (Youssef 24/11 « petits points au coin des lèvres ») : l'intérieur de la bouche (normales de côté ou vers
        # l'arrière) restait en place quand la profondeur reculait les commissures de 6 à 8 mm ; il ressortait devant
        # elles en deux points sombres. Tout ce qui est dans l'ellipse de la bouche suit le même champ que les lèvres
        if C.get('bouche_suit', True):
            mc = (X3[61] + X3[291]) / 2; rx = np.linalg.norm(X3[61, :2] - X3[291, :2]) / 2 + 0.008
            e = ((P[:, 0] - mc[0]) / rx) ** 2 + ((P[:, 1] - mc[1]) / 0.016) ** 2
            wv = np.maximum(wv, smooth(1.0, 0.6, e) * smooth(mc[2] - 0.05, mc[2] - 0.035, P[:, 2]))
        D = tps(P[:, :2]) * wv[:, None]
        # garde-fou : les globes et le pourtour immédiat des yeux ne bougent pas (os LeftEye/RightEye inchangés)
        for e in ('LeftEye', 'RightEye'):
            D *= smooth(*C.get('oeil', (0.016, 0.026)), np.linalg.norm(P - J[e], axis=1))[:, None]
        P1 = P + D
        # 24/11 (Youssef « les yeux ok » : yeux un peu plus grands, comme sur son image) : globe, paupières et pourtour
        # agrandis ensemble autour de l'os de l'œil (inchangé : le regard tourne pareil), plein jusqu'à 20 mm, nul à 30 mm ;
        # les écarts des expressions (clignement…) sont agrandis du même facteur à l'écriture
        sv = np.ones(len(P))
        if C.get('yeux'):
            for e in ('LeftEye', 'RightEye'):
                k = 1 + C['yeux'] * smooth(0.03, 0.02, np.linalg.norm(P1 - J[e], axis=1))
                P1 = J[e] + (P1 - J[e]) * k[:, None]
                sv = sv * k
            D = P1 - P
        field.sv = sv
        gn0 = vertex_normals(P, T); gn1 = vertex_normals(P1, T)
        N1 = N + (gn1 - gn0); N1 /= np.maximum(np.linalg.norm(N1, axis=1, keepdims=True), 1e-12)
        moved = np.linalg.norm(D, axis=1) > 1e-7
        N1[~moved] = N[~moved]
        return P1, N1, D
    P1, N1, D = field(P0, N0)
    print('déplacement max (mm)', round(float(np.abs(D).max() * 1000), 2), 'points bougés', int((np.linalg.norm(D, axis=1) > 1e-5).sum()))
    # repères déplacés par le même champ, caméra réajustée
    X3b = X3.copy(); X3b += tps(X3[:, :2]) * smooth(chin_y - 0.025, chin_y - 0.002, X3[:, 1])[:, None]
    M = fit_affine(X3b[base_idx], Lr[base_idx, :2])
    sh_res = np.linalg.norm(proj(M, X3b[sh]) - Lr[sh, :2], axis=1).mean()
    print('écart des repères de forme après (px)', round(float(sh_res), 2), 'avant', round(float(np.linalg.norm(r, axis=1).mean()), 2))
    # ----- texture
    S = tex.shape[0]
    PM, NM, VM = uv_raster(P1, N1, T, UV, S)
    _, _, VE = uv_raster(P1, N1, TE, UV, S) if len(TE) else (None, None, np.zeros((S, S), bool))
    cam = np.cross(M[0, :3], M[1, :3]); cam /= np.linalg.norm(cam)
    if cam[2] < 0: cam = -cam
    facing = (NM @ cam)
    uvp = proj(M, PM.reshape(-1, 3)).reshape(S, S, 2)
    R = np.asarray(ref).astype(np.float32) / 255
    # masque de l'ovale dans l'image, rentré pour ne pas prendre de cheveux ni de fond
    poly = MPath(Lr[OVAL, :2])
    hh, ww = R.shape[:2]
    yy, xx = np.mgrid[y0:y1, x0:x1]
    inside = np.zeros((hh, ww), np.float32)
    inside[y0:y1, x0:x1] = poly.contains_points(np.stack([xx.ravel() + .5, yy.ravel() + .5], 1)).reshape(yy.shape)
    ero = C.get('mask_erode', 6)
    inside = nd.gaussian_filter(nd.binary_erosion(inside > 0.5, iterations=ero).astype(np.float32), ero * 0.6)
    # délumage partiel de l'image (grandes ombres) : luminance basse fréquence dans l'ovale
    lum = R @ np.array([0.3, 0.59, 0.11], np.float32)
    w8 = nd.gaussian_filter(inside, 18) + 1e-4
    low = nd.gaussian_filter(lum * inside, 18) / w8
    mean_l = float((lum * inside).sum() / inside.sum())
    dl = C.get('delight', 0.5)
    Rd = R * (np.clip(mean_l / np.maximum(low, 0.05), 0.6, 1.7) ** dl)[..., None]
    Rd = np.clip(Rd, 0, 1)
    u = uvp[..., 0]; v = uvp[..., 1]
    from scipy.ndimage import map_coordinates
    samp = np.stack([map_coordinates(Rd[..., c], [v.ravel(), u.ravel()], order=1, mode='nearest').reshape(S, S) for c in range(3)], -1)
    win = map_coordinates(inside, [v.ravel(), u.ravel()], order=1, mode='constant').reshape(S, S)
    W = win * smooth(*C.get('facing', (0.25, 0.6)), facing) * VM * (~VE)
    W = np.clip(W * C.get('strength', 1.0), 0, 1)
    # teint : gain par canal qui amène la peau du modèle (même zone) sur celle de l'image
    sel = W > 0.6
    base_mean = tex[sel].mean(0); ref_mean = samp[sel].mean(0)
    gain = np.clip(ref_mean / base_mean, 0.5, 2.0) if C.get('tone', True) else np.ones(3)
    gain = 1 + (gain - 1) * C.get('tone_amount', 1.0)
    print('gain de teint', gain.round(3))
    t2 = np.clip(tex * gain, 0, 1)
    sig = C.get('detail_sigma', 5)
    hi = t2 - nd.gaussian_filter(t2, (sig, sig, 0))
    # teint du visage projeté ramené exactement sur celui de la tête et du corps (même moyenne) : pas de raccord
    samp = samp * (t2[sel].mean(0) / np.maximum(samp[sel].mean(0), 1e-4))
    lo = nd.gaussian_filter(samp, (sig * 0.5, sig * 0.5, 0))
    # le shader de peau de l'application ajoute déjà contraste, saturation et chaleur : l'image est adoucie d'autant
    m0 = t2[sel].mean(0)
    lo = m0 + (lo - m0) * C.get('contraste', 0.8)
    g0 = lo @ np.array([0.3, 0.59, 0.11]); lo = g0[..., None] + (lo - g0[..., None]) * C.get('saturation', 0.85)
    if C.get('bande'):
        # prototype 2 : de l'image on ne prend que les traits (bande de fréquences moyennes : sourcils, cils, lèvres,
        # plis) et la couleur locale ; l'ombrage d'ensemble vient de la peau du modèle, elle-même aplatie (pas d'ombres
        # cuites autour des yeux ni de visage « durci »)
        s2 = C.get('bande_large', 36)
        bl = nd.gaussian_filter(t2, (s2, s2, 0))
        bl = m0 + (bl - m0) * C.get('aplat', 0.55)
        band = lo - nd.gaussian_filter(lo, (s2, s2, 0))
        face = np.clip(bl + band * C.get('bande', 1.0) + hi * C.get('detail', 1.0), 0, 1)
    else:
        face = np.clip(lo + hi * C.get('detail', 1.0), 0, 1)
    outt = t2 * (1 - W[..., None]) + face * W[..., None]
    if C.get('poivre_sel'):
        # cheveux et barbe poivre et sel (planche de Victor) : texels sombres hors du visage projeté, plus clairs sur
        # les tempes et la barbe que sur le dessus du crâne
        ps = C['poivre_sel']
        l = outt @ np.array([0.3, 0.59, 0.11])
        dark = smooth(0.30, 0.16, l) * VM * (~VE)
        y = PM[..., 1]; x = np.abs(PM[..., 0]); zf = PM[..., 2]
        top = smooth(ey + 0.07, ey + 0.11, y)
        side = smooth(0.035, 0.07, x) * smooth(ey - 0.06, ey - 0.02, y) * smooth(ey + 0.075, ey + 0.045, y)
        beard = smooth(ey - 0.04, ey - 0.07, y)
        amt = dark * np.clip(ps.get('tempes', 0.75) * side + ps.get('dessus', 0.35) * top + ps.get('barbe', 0.6) * beard * (1 - W), 0, 1)
        rng = np.random.default_rng(7)
        nz = nd.gaussian_filter(rng.random((S, S)), 0.8); nz = (nz - nz.min()) / (nz.max() - nz.min())
        amt = amt * (0.55 + 0.9 * nz)
        grey = np.clip(l * 1.6 + 0.30, 0, 0.85)[..., None] * np.array([1.0, 0.99, 0.97])
        outt = outt * (1 - amt[..., None]) + grey * amt[..., None]
    if C.get('barbe_courte'):
        # barbe courte poivre et sel sur la mâchoire et les joues basses (planche de Victor), lèvres épargnées
        bc = C['barbe_courte']
        y = PM[..., 1]; x = PM[..., 0]; zf = PM[..., 2]
        mouth = X3b[13]; nose = X3b[2]
        top = nose[1] - 0.007 - 0.006 * smooth(0.015, 0.03, np.abs(x)) + 0.008 * smooth(0.035, 0.06, np.abs(x))
        zone = smooth(top + 0.006, top - 0.006, y) * smooth(chin_y - 0.016, chin_y - 0.006, y) * smooth(ez - 0.075, ez - 0.05, zf)
        lips = np.hypot((x - mouth[0]) / 0.026, (y - mouth[1]) / 0.011)
        zone = nd.gaussian_filter(zone * smooth(0.9, 1.3, lips) * VM * (~VE), 6)
        rng = np.random.default_rng(11)
        nz = rng.random((S, S)); nz = nd.gaussian_filter(nz, 1.1); nz = (nz - nz.min()) / (nz.max() - nz.min())
        hair = smooth(0.45, 0.65, nz)
        poivre = np.where(nd.gaussian_filter(rng.random((S, S)), 0.6) > 0.55, 0.50, 0.20)[..., None] * np.array([1, 0.96, 0.92])
        if bc.get('couleur'):
            # barbe d'une couleur (Kadir : brun très foncé) : deux teintes proches au lieu du poivre et sel
            h = bc['couleur']; tgt = np.array([int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)])
            poivre = np.where(nd.gaussian_filter(rng.random((S, S)), 0.6) > 0.55, 1.35, 0.8)[..., None] * tgt
        a = (zone * (bc.get('ombre', 0.35) + bc.get('poils', 0.55) * hair))[..., None]
        outt = outt * (1 - a) + poivre * a
    if C.get('iris'):
        # couleur de l'iris (planche) : texels des globes dont la teinte est marquée, luminance gardée
        h = C['iris']; tgt = np.array([int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)])
        # iris bleu-vert des modèles Rocketbox : bleu au-dessus du rouge (le pourtour rougeâtre du globe n'est pas touché)
        chroma = (np.maximum(outt[..., 1], outt[..., 2]) - outt[..., 0]) * VE
        a = smooth(0.01, 0.05, chroma)[..., None]
        l = (outt @ np.array([0.3, 0.59, 0.11]))[..., None]
        col = np.clip(l / (tgt @ np.array([0.3, 0.59, 0.11])) * tgt, 0, 1)
        outt = outt * (1 - a) + col * a
    if C.get('raccord_cou'):
        # 2.4.0 prototype 2 : le visage (et le crâne) ramenés sur le teint du cou, lui-même raccordé au corps ; le gain
        # par canal retire aussi la dominante rouge-orange du visage (Youssef 20/11 14:30) ; il s'efface vers le cou
        y = PM[..., 1]
        neck = VM * (~VE) * smooth(chin_y - 0.075, chin_y - 0.06, y) * smooth(chin_y - 0.025, chin_y - 0.04, y)
        lum0 = outt @ np.array([0.3, 0.59, 0.11])
        neck = (neck > 0.5) & (lum0 > 0.12)
        fsel = (W > 0.6) & (lum0 > 0.12)
        gn = outt[neck].mean(0) / np.maximum(outt[fsel].mean(0), 1e-4)
        # le visage, tourné un peu vers le bas, reçoit moins la lumière haute de la scène que le cou et le buste : un
        # supplément mesuré à l'écran (captures du Lab) le ramène au teint du buste
        # part de la correction de teinte (1 : teinte du cou ; 0 : seulement sa luminance, la teinte du visage gardée)
        tk = C.get('raccord_teinte', 1.0)
        gl = float(outt[neck].mean(0) @ np.array([0.3, 0.59, 0.11])) / max(float(outt[fsel].mean(0) @ np.array([0.3, 0.59, 0.11])), 1e-4)
        gn = gl + (gn - gl) * tk
        gn = 1 + (np.clip(gn, 0.7, 1.6) - 1) * C['raccord_cou']
        print('raccord du cou', gn.round(3))
        ramp = smooth(chin_y - 0.03, chin_y + 0.01, y)[..., None] * (~VE)[..., None]
        outt = np.clip(outt * (1 + (gn - 1) * ramp), 0, 1)
        # le supplément de lumière ne vaut que pour le bas du visage (joues, bouche, menton, tournés vers le bas) : le
        # front et le crâne, tournés vers la lumière haute, le recevaient en trop (Youssef 24/11 : visage d'Amara plus
        # clair que sa peau). Plein sous les yeux, nul au-dessus des sourcils
        rp = C.get('raccord_plus', 1.0)
        if rp != 1.0:
            low = smooth(ey + 0.035, ey - 0.01, y) * ramp[..., 0]
            outt = np.clip(outt * (1 + (rp - 1) * low)[..., None], 0, 1)
    np.save(C['work'] + '-poids.npy', W.astype(np.float16))
    if C.get('levres_modele'):
        # 2.4.0 (Youssef 24/11 : « petits points au coin des lèvres », lèvres trop fines) : la bande de la planche
        # dessinait un trait sombre fin entre les lèvres, terminé par deux points aux commissures, et des taches rouges
        # vives sur la lèvre du haut. Sur les lèvres du modèle (rouges : rouge moins vert au-dessus de celui de la peau,
        # autour de la bouche) on reprend la couleur du modèle, au teint du visage, et on adoucit le trait. Fait après les raccords
        # de teint : les texels de la jonction des lèvres (cachés de face, VE) n'y sont pas éclaircis et redessinaient le trait
        rr = tex[..., 0] - tex[..., 1]
        Sx = tex.shape[0] / 2048
        yy, xx = np.mgrid[0:tex.shape[0], 0:tex.shape[1]] / Sx
        zone = smooth(905, 935, xx) * smooth(1140, 1110, xx) * smooth(770, 795, yy) * smooth(900, 878, yy)
        lm = nd.gaussian_filter(smooth(0.25, 0.31, rr) * zone, 3 * Sx)
        lm = np.clip(lm * 1.4, 0, 1) * C['levres_modele']
        flou = nd.gaussian_filter(outt, (2.5 * Sx, 2.5 * Sx, 0))
        outt = outt * (1 - lm[..., None]) + (0.5 * t2 * (outt.mean((0, 1)) / np.maximum(t2.mean((0, 1)), 1e-4)) + 0.5 * flou) * lm[..., None]
        # trait fin et sombre (et ses points aux commissures) : bouché par une fermeture morphologique (un trait plus
        # fin que 9 texels disparaît, les formes plus larges restent), puis fondu ; la jonction des lèvres reste dans
        # l'ombrage du modèle
        k = max(3, int(round(9 * Sx)) | 1)
        ferme = np.stack([nd.grey_closing(outt[..., c], size=(k, k)) for c in range(3)], -1)
        ferme = nd.gaussian_filter(ferme, (1.0 * Sx, 1.0 * Sx, 0))
        trait = nd.gaussian_filter(zone * smooth(0.2, 0.6, lm / max(C['levres_modele'], 1e-6) + 0.3), 2 * Sx) * 0.9
        outt = outt * (1 - trait[..., None]) + ferme * trait[..., None]
    if C.get('maquillage'):
        # 24/11 (Youssef, image « voici ce que je voudrais pour les femmes ») : maquillage soigné des coachs femmes, placé
        # par les repères du visage (même méthode pour Amara, Inaya et Kanya) : peau lissée, sourcils plus denses,
        # ombre à paupières, ras des cils assombri (bande floue, jamais un trait net), blush, lèvres rosées un peu
        # brillantes. Chaque zone est un flou large mesuré en millimètres sur le visage ; la teinte multiplie la photo
        mq = C['maquillage']
        vis = VM & (~VE) & (facing > -0.2)
        def dist_poly(ids):
            pts = X3b[list(ids)]
            d = np.full((S, S), np.inf, np.float32)
            for a, b in zip(pts[:-1], pts[1:]):
                ab = b - a; t = np.clip(((PM - a) @ ab) / max(float(ab @ ab), 1e-12), 0, 1)
                d = np.minimum(d, np.linalg.norm(PM - (a + t[..., None] * ab), axis=-1))
            return np.where(vis, d, np.inf)
        def teinte(zone, rgb):
            nonlocal outt
            outt = np.clip(outt * (1 + zone[..., None] * (np.array(rgb, np.float32) - 1)), 0, 1)
        gs = lambda d, sig: np.exp(-0.5 * (d / sig) ** 2)
        # peau lissée : grain gardé à moitié sur le visage, hors sourcils, yeux et lèvres
        if mq.get('lisse'):
            keep = np.zeros((S, S), np.float32)
            for ids in ((70, 63, 105, 66, 107), (300, 293, 334, 296, 336)):
                keep = np.maximum(keep, gs(dist_poly(ids), 0.006))
            for ids in ((33, 160, 158, 133, 153, 144, 33), (263, 387, 385, 362, 380, 373, 263), (61, 0, 291, 17, 61)):
                keep = np.maximum(keep, gs(dist_poly(ids), 0.007))
            flou = nd.gaussian_filter(outt, (6 * S / 2048, 6 * S / 2048, 0))
            a = (W * (1 - keep) * mq['lisse'])[..., None]
            outt = outt * (1 - a) + flou * a
        # sourcils dessinés sans le bout intérieur (107, 336) : un sourcil foncé jusqu'au nez donne un air froncé
        brows = [(70, 63, 105, 66), (300, 293, 334, 296)]
        lids = [(33, 246, 161, 160, 159, 158, 157, 173, 133), (263, 466, 388, 387, 386, 385, 384, 398, 362)]
        if mq.get('sourcils'):
            z = sum(gs(dist_poly(ids), 0.0024) for ids in brows)
            teinte(np.clip(z, 0, 1) * mq['sourcils'], mq.get('sourcils_teinte', (0.62, 0.56, 0.54)))
        if mq.get('paupieres'):
            z = sum(gs(dist_poly(ids), 0.0055) for ids in lids) * (PM[..., 1] > X3b[159, 1] - 0.002)
            teinte(np.clip(z, 0, 1) * mq['paupieres'], mq.get('paupieres_teinte', (0.86, 0.76, 0.72)))
        if mq.get('cils'):
            # ras des cils du haut, épaissi vers le coin extérieur (petite aile douce)
            z = np.zeros((S, S), np.float32)
            for ids in lids:
                d = dist_poly(ids)
                z = np.maximum(z, gs(d, 0.0015))
                z = np.maximum(z, gs(dist_poly((ids[2], ids[1], ids[0])), 0.0018) * 0.8)
            teinte(np.clip(z, 0, 1) * mq['cils'], (0.2, 0.17, 0.17))
        if mq.get('blush'):
            z = gs(np.minimum(dist_poly((50, 50)), dist_poly((280, 280))), 0.012)
            teinte(z * mq['blush'], mq.get('blush_teinte', (1.08, 0.93, 0.92)))
        if mq.get('levres'):
            rr2 = outt[..., 0] - outt[..., 1]
            around = gs(dist_poly((61, 0, 291, 17, 61)), 0.006)
            base = np.median(rr2[(around > 0.05) & (around < 0.3)])
            lm2 = nd.gaussian_filter(np.clip((rr2 - base) / 0.06, 0, 1) * (around > 0.3), 3 * S / 2048)
            teinte(lm2 * mq['levres'], mq.get('levres_teinte', (1.12, 0.9, 0.9)))
            # reflet doux au milieu de la lèvre du bas
            hl = gs(dist_poly((14, 17)), 0.0025) * lm2
            outt = np.clip(outt + (hl * mq.get('brillance', 0.0))[..., None] * 0.25, 0, 1)
    Image.fromarray((outt * 255).astype(np.uint8)).save(C['work'] + '-tete.png')
    # corps : même gain (raccord du cou)
    new_img = {}
    for i, im in enumerate(g.j['images']):
        nm = im.get('name', '')
        if 'head_color' in nm:
            b = io.BytesIO(); Image.fromarray((outt * 255).astype(np.uint8)).save(b, 'JPEG', quality=C.get('qualite', 92)); new_img[i] = b.getvalue()
        if 'body_color' in nm and C.get('tone', True):
            body = np.asarray(g.image('body_color')).astype(np.float32) / 255
            b = io.BytesIO(); Image.fromarray((np.clip(body * gain, 0, 1) * 255).astype(np.uint8)).save(b, 'JPEG', quality=C.get('qualite', 92)); new_img[i] = b.getvalue()
    for out in C['out']:
        gg = Glb(out['from']) if 'from' in out else g
        imgs = {}
        for i, im in enumerate(gg.j['images']):
            nm = im.get('name', '')
            if 'head_color' in nm:
                # même format que l'image d'origine (test maquillage-v1403)
                b = io.BytesIO(); hi8 = Image.fromarray((outt * 255).astype(np.uint8))
                hi8.save(b, 'PNG', optimize=True) if im.get('mimeType') == 'image/png' else hi8.save(b, 'JPEG', quality=C.get('qualite', 92))
                imgs[i] = b.getvalue()
            if 'body_color' in nm and C.get('tone', True):
                body = np.asarray(gg.image('body_color')).astype(np.float32) / 255
                b = io.BytesIO(); Image.fromarray((np.clip(body * gain, 0, 1) * 255).astype(np.uint8)).save(b, 'JPEG', quality=C.get('qualite', 92)); imgs[i] = b.getvalue()
        hr = [r for r in prim_refs(gg) if r[0].endswith('_head')][0]
        Pv, Nv, _ = field(gg.acc(hr[1]).astype(np.float64), gg.acc(hr[2]).astype(np.float64))
        if out.get('textures'):
            os.makedirs(out['textures'], exist_ok=True)
            for i, im in enumerate(gg.j['images']):
                for k in ('head_color', 'body_color'):
                    if k in im.get('name', '') and i in imgs:
                        open(os.path.join(out['textures'], k + ('.png' if imgs[i][:4] == b'\x89PNG' else '.jpg')), 'wb').write(imgs[i])
        views = {}
        if C.get('yeux'):
            sv = field.sv
            for m in gg.j['meshes']:
                for pr in m['primitives']:
                    if pr['attributes']['POSITION'] != hr[1]:
                        continue
                    for t in pr.get('targets', []):
                        a = gg.j['accessors'][t['POSITION']]
                        sp = a.get('sparse')
                        if not sp or sp['values']['bufferView'] in views:
                            continue
                        bi = gg.j['bufferViews'][sp['indices']['bufferView']]; bvv = gg.j['bufferViews'][sp['values']['bufferView']]
                        idx = np.frombuffer(gg.bin, np.uint32 if sp['indices']['componentType'] == 5125 else np.uint16, sp['count'], bi.get('byteOffset', 0) + sp['indices'].get('byteOffset', 0))
                        off = bvv.get('byteOffset', 0) + sp['values'].get('byteOffset', 0)
                        val = np.frombuffer(gg.bin, np.float32, sp['count'] * 3, off).reshape(-1, 3) * sv[idx.astype(np.int64)][:, None]
                        raw = bytearray(gg.bin[bvv.get('byteOffset', 0):bvv.get('byteOffset', 0) + bvv['byteLength']])
                        o2 = sp['values'].get('byteOffset', 0)
                        raw[o2:o2 + val.astype(np.float32).nbytes] = val.astype(np.float32).tobytes()
                        views[sp['values']['bufferView']] = bytes(raw)
        save(gg, out['path'], {hr[1]: Pv.astype(np.float32), hr[2]: Nv.astype(np.float32)}, imgs, new_views=views)
        print('écrit', out['path'])
    # contrôle : rendu de face après
    img2, _, _ = front_view(P1, T, UV, outt, (-0.11, 0.11, ey - 0.14, ey + 0.11), px)
    Image.fromarray((img2 * 255).astype(np.uint8)).save(C['work'] + '-face-apres.png')
    Image.fromarray((img * 255).astype(np.uint8)).save(C['work'] + '-face-avant.png')


if __name__ == '__main__':
    main(sys.argv[1])
