"""Kadir 1.46 — projection des planches dans l'espace des textures (uv).
Pour chaque texel : sa position 3D et sa normale (rastérisation du maillage dans l'espace uv), puis pour chaque vue
(rendu orthographique de Kadir sous l'angle de la planche) : position à l'écran, test de visibilité (tampon de
profondeur), correspondance écran -> planche par plaque mince (points de repère choisis à la main), échantillon
de la planche. Poids = orientation vers la caméra (au carré)."""
import numpy as np
from rendu import render

def tps(src, dst):
    def U(r): return np.where(r > 0, r * r * np.log(r + 1e-12), 0)
    src = np.asarray(src, float); dst = np.asarray(dst, float); n = len(src)
    K = U(np.linalg.norm(src[:, None] - src[None], axis=-1)); Pm = np.hstack([np.ones((n, 1)), src])
    L = np.zeros((n + 3, n + 3)); L[:n, :n] = K + 1e-6 * np.eye(n); L[:n, n:] = Pm; L[n:, :n] = Pm.T
    Y = np.zeros((n + 3, 2)); Y[:n] = dst; c = np.linalg.solve(L, Y)
    def f(q):
        q = np.asarray(q, float); out = np.zeros((len(q), 2))
        for i in range(0, len(q), 20000):
            qq = q[i:i + 20000]
            out[i:i + 20000] = U(np.linalg.norm(qq[:, None] - src[None], axis=-1)) @ c[:n] + np.hstack([np.ones((len(qq), 1)), qq]) @ c[n:]
        return out
    return f

def uv_raster(P, Nv, T, UV, M, mat, size):
    """position et normale de chaque texel de la matière `mat` (texture carrée size x size)"""
    PM = np.zeros((size, size, 3), np.float32); NM = np.zeros((size, size, 3), np.float32); VM = np.zeros((size, size), bool)
    for t in np.where(M == mat)[0]:
        uv = UV[t] * size; uv = np.stack([uv[:, 0], size - uv[:, 1]], 1)
        x0, y0 = np.maximum(np.floor(uv.min(0)).astype(int), 0); x1, y1 = np.minimum(np.ceil(uv.max(0)).astype(int), size - 1)
        if x1 < x0 or y1 < y0: continue
        xs, ys = np.meshgrid(np.arange(x0, x1 + 1) + .5, np.arange(y0, y1 + 1) + .5)
        a, b, c = uv; den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
        if abs(den) < 1e-12: continue
        l1 = ((b[1] - c[1]) * (xs - c[0]) + (c[0] - b[0]) * (ys - c[1])) / den
        l2 = ((c[1] - a[1]) * (xs - c[0]) + (a[0] - c[0]) * (ys - c[1])) / den; l3 = 1 - l1 - l2
        ins = (l1 >= -.01) & (l2 >= -.01) & (l3 >= -.01)
        if not ins.any(): continue
        vi = T[t]; sl = (slice(y0, y1 + 1), slice(x0, x1 + 1))
        PM[sl][ins] = (l1[..., None] * P[vi[0]] + l2[..., None] * P[vi[1]] + l3[..., None] * P[vi[2]])[ins]
        NM[sl][ins] = (l1[..., None] * Nv[vi[0]] + l2[..., None] * Nv[vi[1]] + l3[..., None] * Nv[vi[2]])[ins]; VM[sl][ins] = True
    NM /= np.linalg.norm(NM, axis=-1, keepdims=True) + 1e-9
    return PM, NM, VM

def sample(img, px, py):
    h, w, _ = img.shape
    px = np.clip(px, 0, w - 1.001); py = np.clip(py, 0, h - 1.001)
    ix = px.astype(int); iy = py.astype(int); fx = (px - ix)[:, None]; fy = (py - iy)[:, None]
    return (img[iy, ix] * (1 - fx) + img[iy, ix + 1] * fx) * (1 - fy) + (img[iy + 1, ix] * (1 - fx) + img[iy + 1, ix + 1] * fx) * fy

def project(P, Nv, T, UV, M, PM, NM, VM, photo, view, pairs, flip=False, mats=(0, 1, 2), box=None):
    """photo: planche (float rgb) ; view: dict(az, el, center, half, size) ; pairs: [(écran x,y), (planche x,y)]
    flip: planche retournée (profil droit à partir du profil gauche). Renvoie couleur (h,w,3) et poids (h,w)."""
    _, buf = render(P, Nv, T, UV, M, None, mats=mats, **view)
    R = buf['R']; c = buf['c']; half = buf['half']; size = buf['size']; Z = buf['Z']
    idx = np.where(VM); p = PM[idx]; n = NM[idx]
    q = p @ R.T; nq = n @ R.T
    sx = (q[:, 0] - c[0]) / half * size / 2 + size / 2; sy = (c[1] - q[:, 2]) / half * size / 2 + size / 2
    ok = (sx >= 0) & (sx < size) & (sy >= 0) & (sy < size)
    zz = np.full(len(p), -np.inf); zz[ok] = Z[sy[ok].astype(int), sx[ok].astype(int)]
    vis = ok & (q[:, 1] <= zz + 0.004)
    face = np.clip(-nq[:, 1], 0, 1)
    src = [a for a, _ in pairs]; dst = [b for _, b in pairs]
    f = tps(src, dst)
    pp = f(np.stack([sx, sy], 1))
    if flip: pp[:, 0] = photo.shape[1] - 1 - pp[:, 0]
    col = np.zeros(PM.shape[:2] + (3,), np.float32); w = np.zeros(PM.shape[:2], np.float32)
    x0, y0, x1, y1 = box if box else (0, 0, photo.shape[1] - 1, photo.shape[0] - 1)  # une seule tête de la planche
    inside = vis & (pp[:, 0] >= x0) & (pp[:, 0] < x1) & (pp[:, 1] >= y0) & (pp[:, 1] < y1)
    sm = sample(photo, pp[inside, 0], pp[inside, 1])
    a = sm[:, 3] if photo.shape[2] > 3 else 1  # planche RGBA : alpha = personnage (0 sur le fond gris)
    col[idx[0][inside], idx[1][inside]] = sm[:, :3]
    w[idx[0][inside], idx[1][inside]] = face[inside] ** 2 * a
    return col, w
