"""Rasterisation numpy : vue de face orthographique d'un maillage texturé, et rasterisation dans l'espace uv."""
import numpy as np


def _tri_iter(Q, T):
    for t in range(len(T)):
        q = Q[T[t]]
        x0, y0 = np.floor(q[:, :2].min(0)).astype(int)
        x1, y1 = np.ceil(q[:, :2].max(0)).astype(int)
        yield t, q, x0, y0, x1, y1


def bary(q, xs, ys):
    a, b, c = q[:, :2]
    den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
    if abs(den) < 1e-12:
        return None
    l1 = ((b[1] - c[1]) * (xs - c[0]) + (c[0] - b[0]) * (ys - c[1])) / den
    l2 = ((c[1] - a[1]) * (xs - c[0]) + (a[0] - c[0]) * (ys - c[1])) / den
    return l1, l2, 1 - l1 - l2


def front_view(P, T, UV, tex, box, px):
    """vue de face (caméra sur +Z, regarde -Z). box = (xmin, xmax, ymin, ymax) en m, px = m par pixel.
    Renvoie image RGB et carte des coordonnées 3D (pour retrouver les repères)."""
    xmin, xmax, ymin, ymax = box
    W = int((xmax - xmin) / px); H = int((ymax - ymin) / px)
    Q = np.stack([(P[:, 0] - xmin) / px, (ymax - P[:, 1]) / px, P[:, 2]], 1)
    Z = np.full((H, W), -np.inf); img = np.ones((H, W, 3)); XYZ = np.zeros((H, W, 3))
    th, tw, _ = tex.shape
    for t, q, x0, y0, x1, y1 in _tri_iter(Q, T):
        x0 = max(x0, 0); y0 = max(y0, 0); x1 = min(x1, W - 1); y1 = min(y1, H - 1)
        if x1 < x0 or y1 < y0:
            continue
        xs, ys = np.meshgrid(np.arange(x0, x1 + 1) + .5, np.arange(y0, y1 + 1) + .5)
        b = bary(q, xs, ys)
        if b is None:
            continue
        l1, l2, l3 = b
        ins = (l1 >= 0) & (l2 >= 0) & (l3 >= 0)
        if not ins.any():
            continue
        z = l1 * q[0, 2] + l2 * q[1, 2] + l3 * q[2, 2]
        sub = Z[y0:y1 + 1, x0:x1 + 1]
        m = ins & (z > sub)
        if not m.any():
            continue
        sub[m] = z[m]
        uv = UV[T[t]]
        u = l1 * uv[0, 0] + l2 * uv[1, 0] + l3 * uv[2, 0]
        v = l1 * uv[0, 1] + l2 * uv[1, 1] + l3 * uv[2, 1]
        iu = np.clip((u * tw).astype(int), 0, tw - 1); iv = np.clip((v * th).astype(int), 0, th - 1)
        img[y0:y1 + 1, x0:x1 + 1][m] = tex[iv[m], iu[m]]
        pp = P[T[t]]
        XYZ[y0:y1 + 1, x0:x1 + 1][m] = (l1[..., None] * pp[0] + l2[..., None] * pp[1] + l3[..., None] * pp[2])[m]
    return img, XYZ, Z


def uv_raster(P, N, T, UV, size):
    """pour chaque texel de la texture (size x size) : position 3D, normale, masque (glTF : v vers le bas)"""
    PM = np.zeros((size, size, 3), np.float32); NM = np.zeros((size, size, 3), np.float32); VM = np.zeros((size, size), bool)
    Q = np.stack([UV[:, 0] * size, UV[:, 1] * size, np.zeros(len(UV))], 1)
    for t, q, x0, y0, x1, y1 in _tri_iter(Q, T):
        x0 = max(x0, 0); y0 = max(y0, 0); x1 = min(x1, size - 1); y1 = min(y1, size - 1)
        if x1 < x0 or y1 < y0:
            continue
        xs, ys = np.meshgrid(np.arange(x0, x1 + 1) + .5, np.arange(y0, y1 + 1) + .5)
        b = bary(q, xs, ys)
        if b is None:
            continue
        l1, l2, l3 = b
        ins = (l1 >= -1e-3) & (l2 >= -1e-3) & (l3 >= -1e-3)
        if not ins.any():
            continue
        pp = P[T[t]]; nn = N[T[t]]
        PM[y0:y1 + 1, x0:x1 + 1][ins] = (l1[..., None] * pp[0] + l2[..., None] * pp[1] + l3[..., None] * pp[2])[ins]
        NM[y0:y1 + 1, x0:x1 + 1][ins] = (l1[..., None] * nn[0] + l2[..., None] * nn[1] + l3[..., None] * nn[2])[ins]
        VM[y0:y1 + 1, x0:x1 + 1][ins] = True
    n = np.linalg.norm(NM, axis=-1, keepdims=True); NM = NM / np.maximum(n, 1e-9)
    return PM, NM, VM
