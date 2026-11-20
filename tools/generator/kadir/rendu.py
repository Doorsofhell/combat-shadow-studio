"""Kadir 1.46 — petit rendu logiciel orthographique (numpy) du maillage exporté par pose_export.py : sert à
mesurer le modèle contre les planches et à projeter les planches dans les textures (tampons uv/matière par pixel).
  from rendu import render
  img, buf = render(P, N, tris, uvs, mat, tex={0: corps, 1: tete}, az=0, el=0, center=(x,z), half=0.15, size=800)
az : 0 = face, 90 = profil gauche (on voit son côté gauche), 180 = dos ; el : vue plongeante en degrés."""
import numpy as np

def view_matrix(az, el):
    a, e = np.radians(az), np.radians(el)
    # camera looks along +Y (Kadir faces -Y) at az=0; rotate the model by -az around Z, then tilt by el
    Rz = np.array([[np.cos(a), -np.sin(a), 0], [np.sin(a), np.cos(a), 0], [0, 0, 1]])
    Rx = np.array([[1, 0, 0], [0, np.cos(e), -np.sin(e)], [0, np.sin(e), np.cos(e)]])
    return Rx @ Rz

def render(P, N, T, UV, M, tex=None, az=0, el=0, center=(0, 1.65), half=0.15, size=800, light=(0.3, -1, 0.5), mats=(0, 1, 2)):
    R = view_matrix(az, el)
    Q = P @ R.T; Nn = N @ R.T
    c = np.array(center, float)
    if len(c) == 3: c = (R @ c)[[0, 2]]  # a 3D point (model space) at the centre of the picture
    sx = (Q[:, 0] - c[0]) / half * size / 2 + size / 2
    sy = (c[1] - Q[:, 2]) / half * size / 2 + size / 2
    dep = Q[:, 1]
    Z = np.full((size, size), np.inf); TRI = np.full((size, size), -1, np.int64)
    L1 = np.zeros((size, size)); L2 = np.zeros((size, size))
    keep = np.isin(M, mats)
    for t in np.where(keep)[0]:
        i = T[t]; x = sx[i]; y = sy[i]
        x0, x1 = int(max(np.floor(x.min()), 0)), int(min(np.ceil(x.max()), size - 1))
        y0, y1 = int(max(np.floor(y.min()), 0)), int(min(np.ceil(y.max()), size - 1))
        if x1 < x0 or y1 < y0: continue
        xs, ys = np.meshgrid(np.arange(x0, x1 + 1) + .5, np.arange(y0, y1 + 1) + .5)
        den = (y[1] - y[2]) * (x[0] - x[2]) + (x[2] - x[1]) * (y[0] - y[2])
        if abs(den) < 1e-12: continue
        l1 = ((y[1] - y[2]) * (xs - x[2]) + (x[2] - x[1]) * (ys - y[2])) / den
        l2 = ((y[2] - y[0]) * (xs - x[2]) + (x[0] - x[2]) * (ys - y[2])) / den
        l3 = 1 - l1 - l2
        ins = (l1 >= 0) & (l2 >= 0) & (l3 >= 0)
        if not ins.any(): continue
        d = l1 * dep[i[0]] + l2 * dep[i[1]] + l3 * dep[i[2]]
        sl = (slice(y0, y1 + 1), slice(x0, x1 + 1))
        zs = Z[sl]; better = ins & (d < zs)
        zs[better] = d[better]; TRI[sl][better] = t; L1[sl][better] = l1[better]; L2[sl][better] = l2[better]
    hit = TRI >= 0
    t = TRI[hit]; l1 = L1[hit]; l2 = L2[hit]; l3 = 1 - l1 - l2
    uv = UV[t, 0] * l1[:, None] + UV[t, 1] * l2[:, None] + UV[t, 2] * l3[:, None]
    nn = Nn[T[t, 0]] * l1[:, None] + Nn[T[t, 1]] * l2[:, None] + Nn[T[t, 2]] * l3[:, None]
    nn /= np.linalg.norm(nn, axis=1, keepdims=True) + 1e-9
    pos = P[T[t, 0]] * l1[:, None] + P[T[t, 1]] * l2[:, None] + P[T[t, 2]] * l3[:, None]
    shade = 0.4 + 0.6 * np.clip(nn @ np.array([0.25, -0.9, 0.35]), 0, 1)
    img = np.full((size, size, 3), 0.5)
    col = np.full((len(t), 3), 0.75)
    if tex:
        for m, im in tex.items():
            s = M[t] == m
            if not s.any(): continue
            h, w, _ = im.shape
            px = np.clip((uv[s, 0] % 1) * w, 0, w - 1).astype(int); py = np.clip((1 - uv[s, 1] % 1) * h, 0, h - 1).astype(int)
            col[s] = im[py, px]
    img[hit] = col * shade[:, None]
    buf = dict(Z=Z, R=R, c=c, half=half, size=size, hit=hit, tri=TRI, uv=np.zeros((size, size, 2)), mat=np.full((size, size), -1), pos=np.zeros((size, size, 3)), nrm=np.zeros((size, size, 3)))
    buf['uv'][hit] = uv; buf['mat'][hit] = M[t]; buf['pos'][hit] = pos; buf['nrm'][hit] = nn @ R  # normals back in model space
    buf['nview'] = np.zeros((size, size, 3)); buf['nview'][hit] = nn
    return img, buf
