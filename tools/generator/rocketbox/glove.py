"""v0.43 boxing glove (Youssef, 2026-10-23, « REFONTE RÉALISTE DES ÉQUIPEMENTS 3D »: « les gants ne doivent plus
ressembler à des sphères ou à des blocs rigides »). Before: an egg (ellipsoid) for the mitt, a second egg for the
thumb, an open tube for the cuff and another for the strap: four pieces, no fist, a hollow white ring at the wrist.

Now one closed, sculpted shape, built as a signed distance field in the frame of the hand and meshed by surface nets:
- the padded fist: a box-like volume, domed over the back of the hand, full and slightly convex at the striking face,
  rolling down over the curled fingers into the palm, where the palm side is hollowed behind the finger roll;
- the thumb: a padded tube lying along the index side, its tip forward, joined to the fist by a crease;
- the cuff: tapering back from the fist over the wrist onto the forearm, slightly oval, open at its end with a
  rolled edge and a lining;
- the hook-and-loop strap wrapped round the cuff, a little thicker, with rounded edges;
- piping: a raised rolled seam round the striking face and along the thumb, as on real gloves.
Colour regions (leather, strap, lining, piping) are vertex colours of one mesh: one draw call per glove.

References (shapes, proportions): World Boxing competition rules 2024 (glove weights, « 10 oz »/« 12 oz », the
thumb attached to the glove) [boxe-S4]; manufacturers' public size charts (training gloves of 12–16 oz: about 28–30 cm
from cuff to striking face, 12–13 cm wide); no brand design or logo copied.
"""
import math
import numpy as np


def _len(x):
    return np.sqrt(np.sum(x * x, axis=-1))


def sd_round_box(p, c, half, r):
    q = np.abs(p - c) - (np.asarray(half) - r)
    return _len(np.maximum(q, 0.0)) + np.minimum(np.max(q, axis=-1), 0.0) - r


def sd_ellipsoid(p, c, rad):
    rad = np.asarray(rad)
    q = (p - c) / rad
    k0 = _len(q)
    k1 = _len(q / rad)
    return k0 * (k0 - 1.0) / np.maximum(k1, 1e-9)


def sd_capsule(p, a, b, r):
    a, b = np.asarray(a), np.asarray(b)
    pa, ba = p - a, b - a
    h = np.clip(np.sum(pa * ba, axis=-1) / np.dot(ba, ba), 0, 1)
    return _len(pa - ba * h[..., None]) - r


def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b * (1 - h) + a * h - k * h * (1 - h)


def smax(a, b, k):
    return -smin(-a, -b, k)


# strap round the cuff (centre and half width along the hand axis) and start of the visible lining, metres
STRAP_C, STRAP_HALF, LINING_X = -0.068, 0.030, -0.075


def sd_glove(p):
    """distance to the glove surface (metres) for points p (..., 3) in the hand frame of a reference hand (wrist to
    middle knuckle 9.5 cm): x along the hand toward the knuckles, y across toward the index and thumb, z out of the
    back of the hand. Returns (distance, region) with region 0 leather, 1 strap, 2 lining"""
    x, y, z = p[..., 0], p[..., 1], p[..., 2]
    # padded fist: wider and taller at the knuckles than at the wrist
    taper = np.clip((x - 0.02) / 0.12, 0, 1)
    pf = p.copy()
    pf[..., 1] = y / (0.86 + 0.14 * taper)
    pf[..., 2] = (z + 0.004) / (0.88 + 0.12 * taper)
    fist = sd_round_box(pf, (0.100, 0.0, 0.0), (0.082, 0.066, 0.055), 0.038)
    # dome over the back of the hand, full striking face
    fist = smin(fist, sd_ellipsoid(p, (0.104, 0.0, 0.020), (0.085, 0.062, 0.050)), 0.02)
    fist = smin(fist, sd_ellipsoid(p, (0.154, 0.0, 0.002), (0.036, 0.064, 0.056)), 0.02)
    # roll of the curled fingers under the padding (front, palm side)
    fist = smin(fist, sd_capsule(p, (0.140, -0.044, -0.034), (0.140, 0.044, -0.034), 0.032), 0.015)
    # palm side hollowed behind the finger roll (the grip)
    fist = smax(fist, -sd_capsule(p, (0.062, -0.07, -0.088), (0.062, 0.07, -0.088), 0.038), 0.014)
    # thumb along the index side, tip forward and a little toward the palm, joined by a crease
    thumb = sd_capsule(p, (0.046, 0.070, -0.016), (0.120, 0.068, -0.034), 0.024)
    thumb = smin(thumb, sd_ellipsoid(p, (0.124, 0.066, -0.035), (0.027, 0.025, 0.024)), 0.01)
    # the thumb stands out from the fist: a crease along its join
    d = smin(fist, thumb, 0.004)
    # cuff: tapers from the fist over the wrist to the forearm, oval, slightly flared at its open end
    u = np.clip((-x + 0.02) / 0.145, 0, 1)
    ry = 0.050 + 0.004 * u
    rz = 0.042 + 0.004 * u
    ell = np.sqrt((y / ry) ** 2 + ((z + 0.002) / rz) ** 2)
    cuff_r = (ell - 1.0) * np.minimum(ry, rz)
    cuff = np.maximum(cuff_r, np.maximum(x - 0.04, -0.125 - x))
    # a short neck between fist and cuff: the fist reads as a padded volume, not a sock
    d = smin(d, cuff, 0.016)
    # hook-and-loop strap round the cuff, rounded edges
    strap_c = STRAP_C
    sl = np.abs(x - strap_c) - STRAP_HALF
    strap = np.maximum(cuff_r - 0.004, sl)
    strap = smin(strap, cuff_r - 0.001, 0.003)
    strap_d = np.maximum(strap, sl - 0.0)
    d = np.minimum(d, strap_d)
    # open end of the cuff: the forearm goes in (inner wall 6 mm in)
    inner = np.maximum(cuff_r + 0.006, x - LINING_X + 0.005)
    d = np.maximum(d, -np.maximum(inner, -x - 0.20))
    region = np.zeros(d.shape, np.int8)
    region[(np.abs(x - strap_c) < STRAP_HALF) & (cuff_r > -0.0005) & (x < -0.03)] = 1
    region[(cuff_r < -0.003) & (x < LINING_X)] = 2
    return d, region


def piping(p):
    """raised rolled seams (metres of relief) round the striking face and along the thumb"""
    x, y, z = p[..., 0], p[..., 1], p[..., 2]
    # ring round the striking face, in a plane slanted toward the palm
    f1 = (x - 0.122) - 0.25 * (z - 0.0)
    ring = np.exp(-((f1 / 0.0018) ** 2)) * (x > 0.06)
    # seam along the top of the thumb
    f2 = (z + 0.004) - 0.0
    thumbseam = np.exp(-((f2 / 0.0016) ** 2)) * (y > 0.068) * (x > 0.045) * (x < 0.14)
    return np.maximum(ring, thumbseam)


def regions(v):
    """colour region and piping mask of points of the glove surface (hand frame)"""
    _, reg = sd_glove(v)
    return reg, piping(v) > 0.35


def surface_nets(sdf, origin, step):
    """naive surface nets on a sampled field: one vertex per cell crossing the surface (mean of its edge
    crossings), one quad per crossing edge. Returns vertices (n, 3) and quads (m, 4)"""
    nx, ny, nz = sdf.shape
    inside = sdf < 0
    # cells with a sign change
    c = inside[:-1, :-1, :-1].astype(np.int8)
    tot = np.zeros(c.shape, np.int16)
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                tot += inside[dx:nx - 1 + dx, dy:ny - 1 + dy, dz:nz - 1 + dz]
    active = (tot > 0) & (tot < 8)
    idx = -np.ones(active.shape, np.int64)
    ai = np.argwhere(active)
    idx[active] = np.arange(len(ai))
    # vertex position: mean of the zero crossings on the 12 cell edges
    acc = np.zeros((len(ai), 3))
    cnt = np.zeros(len(ai))
    corners = [(0, 0, 0), (1, 0, 0), (0, 1, 0), (1, 1, 0), (0, 0, 1), (1, 0, 1), (0, 1, 1), (1, 1, 1)]
    edges = [(0, 1), (2, 3), (4, 5), (6, 7), (0, 2), (1, 3), (4, 6), (5, 7), (0, 4), (1, 5), (2, 6), (3, 7)]
    i, j, k = ai[:, 0], ai[:, 1], ai[:, 2]
    vals = [sdf[i + a, j + b, k + cc] for (a, b, cc) in corners]
    for (e0, e1) in edges:
        v0, v1 = vals[e0], vals[e1]
        m = (v0 < 0) != (v1 < 0)
        t = np.where(m, v0 / np.where(m, v0 - v1, 1), 0)
        p0 = np.array(corners[e0], float)
        p1 = np.array(corners[e1], float)
        pos = p0[None] + (p1 - p0)[None] * t[:, None]
        acc[m] += pos[m]
        cnt[m] += 1
    verts = origin + (ai + acc / cnt[:, None]) * step
    quads = []
    # x edges: shared by cells (i, j-1..j, k-1..k)
    for axis in range(3):
        s0 = [slice(None)] * 3
        a = inside
        if axis == 0:
            e = a[:-1, 1:-1, 1:-1] != a[1:, 1:-1, 1:-1]
            pts = np.argwhere(e)
            flip = a[:-1, 1:-1, 1:-1][e]
            ii, jj, kk = pts[:, 0], pts[:, 1] + 1, pts[:, 2] + 1
            q = np.stack([idx[ii, jj - 1, kk - 1], idx[ii, jj, kk - 1], idx[ii, jj, kk], idx[ii, jj - 1, kk]], 1)
        elif axis == 1:
            e = a[1:-1, :-1, 1:-1] != a[1:-1, 1:, 1:-1]
            pts = np.argwhere(e)
            flip = a[1:-1, :-1, 1:-1][e]
            ii, jj, kk = pts[:, 0] + 1, pts[:, 1], pts[:, 2] + 1
            q = np.stack([idx[ii - 1, jj, kk - 1], idx[ii - 1, jj, kk], idx[ii, jj, kk], idx[ii, jj, kk - 1]], 1)
        else:
            e = a[1:-1, 1:-1, :-1] != a[1:-1, 1:-1, 1:]
            pts = np.argwhere(e)
            flip = a[1:-1, 1:-1, :-1][e]
            ii, jj, kk = pts[:, 0] + 1, pts[:, 1] + 1, pts[:, 2]
            q = np.stack([idx[ii - 1, jj - 1, kk], idx[ii, jj - 1, kk], idx[ii, jj, kk], idx[ii - 1, jj, kk]], 1)
        q = np.where(flip[:, None], q[:, ::-1], q)
        quads.append(q)
    quads = np.concatenate(quads)
    quads = quads[(quads >= 0).all(1)]
    return verts, quads


def glove_mesh(step=0.0016):
    """reference glove in the hand frame: vertices, quads, region per vertex"""
    lo = np.array([-0.135, -0.090, -0.085])
    hi = np.array([0.205, 0.095, 0.080])
    n = np.ceil((hi - lo) / step).astype(int) + 1
    g = np.stack(np.meshgrid(*[lo[a] + np.arange(n[a]) * step for a in range(3)], indexing='ij'), -1)
    d, _ = sd_glove(g)
    d = d - piping(g) * 0.0016
    v, q = surface_nets(d, lo, step)
    # project the vertices onto the surface (two Newton steps on the field), for a smooth result
    for _ in range(2):
        e = 1e-4
        dv, _ = sd_glove(v)
        dv = dv - piping(v) * 0.0016
        grad = np.stack([(sd_glove(v + np.eye(3)[a] * e)[0] - piping(v + np.eye(3)[a] * e) * 0.0016 - dv) / e for a in range(3)], -1)
        gl = np.maximum(_len(grad), 1e-6)
        v = v - (dv / gl)[:, None] * (grad / gl[:, None])
    reg, pip = regions(v)
    return v, q, reg, pip
