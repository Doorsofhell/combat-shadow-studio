"""
Face paint of a champion coach, baked into the skin UV space (RGBA, same layout as the skin texture):
  R = ink (eye line, lashes, lid crease), G = shadow (eye socket, cheek contour), B = warm tint
  (lips, cheeks), A = eyebrow (drawn in the hair colour at runtime).
The features are drawn in 3D around the real eye opening of the model: the opening is found where
the eyeball is in front of the skin, seen from the front. Everything is drawn by this script: no
image is copied.

usage: python3 face_paint.py <model.glb> <model.meta.json> <recipe.json> <out.png>
"""
import json, sys, math
import numpy as np
from PIL import Image
from glbmesh import load_skin

S = 2048
CELL = 0.00025  # 0.25 mm grid around each eye


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def eye_opening(pos, tri, eye, r):
    """2D grid (front view) around one eye: True where the eyeball is in front of the skin"""
    x0, y0 = eye[0] - 0.03, eye[1] - 0.025
    W, H = int(0.06 / CELL), int(0.05 / CELL)
    zb = np.full((H, W), -1e9)
    sel = np.all(np.abs(pos[tri][:, :, 0] - eye[0]) < 0.035, axis=1) & np.all(np.abs(pos[tri][:, :, 1] - eye[1]) < 0.03, axis=1)
    sel &= np.all(pos[tri][:, :, 2] > eye[2] - 0.02, axis=1)
    for t in tri[sel]:
        P = pos[t]
        u = (P[:, 0] - x0) / CELL
        v = (P[:, 1] - y0) / CELL
        i0, i1 = max(int(np.floor(u.min())), 0), min(int(np.ceil(u.max())), W - 1)
        j0, j1 = max(int(np.floor(v.min())), 0), min(int(np.ceil(v.max())), H - 1)
        if i1 < i0 or j1 < j0:
            continue
        gx, gy = np.meshgrid(np.arange(i0, i1 + 1) + 0.5, np.arange(j0, j1 + 1) + 0.5)
        d = (v[1] - v[2]) * (u[0] - u[2]) + (u[2] - u[1]) * (v[0] - v[2])
        if abs(d) < 1e-12:
            continue
        a = ((v[1] - v[2]) * (gx - u[2]) + (u[2] - u[1]) * (gy - v[2])) / d
        b = ((v[2] - v[0]) * (gx - u[2]) + (u[0] - u[2]) * (gy - v[2])) / d
        c = 1 - a - b
        ins = (a >= -1e-3) & (b >= -1e-3) & (c >= -1e-3)
        z = a * P[0, 2] + b * P[1, 2] + c * P[2, 2]
        sub = zb[j0:j1 + 1, i0:i1 + 1]
        np.maximum(sub, np.where(ins, z, -1e9), out=sub)
    gx, gy = np.meshgrid((np.arange(W) + 0.5) * CELL + x0, (np.arange(H) + 0.5) * CELL + y0)
    dd = (gx - eye[0]) ** 2 + (gy - eye[1]) ** 2
    sphere = eye[2] + np.sqrt(np.maximum(r * r - dd, 0))
    open_ = (dd < r * r * 0.95) & (sphere > zb + 0.0003)
    # keep the main blob (the eye opening), drop stray cells
    ys, xs = np.nonzero(open_)
    return open_, x0, y0, xs * CELL + x0 + CELL / 2, ys * CELL + y0 + CELL / 2


def main(glb, metaf, recipef, out):
    meta = json.load(open(metaf))
    rec = json.load(open(recipef))
    male = rec['macro'].get('gender', 1) > 0.5
    fp = {
        'liner': 0.0009 if male else 0.0012,  # upper lid line width (m)
        'wing': 0.0 if male else 0.0035,  # flick past the outer corner
        'crease': 0.2,
        'brow': 0.0058 if male else 0.0045,  # brow thickness at its head
        'browGap': 0.0085,
        'browArch': 0.0018 if male else 0.0032,
        'browAngle': -0.0006 if male else 0.0,  # outer end lower (frown) for negative values
        'socket': 0.45 if male else 0.35,
        'contour': 0.3 if male else 0.12,
        'lips': 0.25 if male else 0.45,
        'blush': 0.0 if male else 0.1,
    }
    fp.update(rec.get('face', {}))
    K = meta['K']
    pos, uv, tri = load_skin(glb)
    # eyeball radius from the model (both eyes are one mesh): half of one eye's height
    r = 0.0152 * K
    eyes = []
    for side, key in ((1, 'eyeL'), (-1, 'eyeR')):
        e = np.array(meta[key])
        op, x0, y0, ox, oy = eye_opening(pos, tri, e, r)
        if len(ox) < 20:
            raise RuntimeError(f'eye opening not found ({key})')
        # rim: top and bottom of the opening per column
        cols = {}
        for x, y in zip(ox, oy):
            k = int(round((x - x0) / CELL))
            lo, hi = cols.get(k, (1e9, -1e9))
            cols[k] = (min(lo, y), max(hi, y))
        ks = np.array(sorted(cols))
        top = np.array([cols[k][1] for k in ks])
        bot = np.array([cols[k][0] for k in ks])
        xs = ks * CELL + x0
        inner = xs.min() if side > 0 else xs.max()
        outer = xs.max() if side > 0 else xs.min()
        eyes.append(dict(side=side, e=e, ox=ox, oy=oy, xs=xs, top=top, bot=bot, inner=inner, outer=outer, ymid=(top.max() + bot.min()) / 2, ytop=top.max()))
        print(key, 'opening', len(ox), 'cells, width %.1f mm, height %.1f mm' % ((xs.max() - xs.min()) * 1000, (top.max() - bot.min()) * 1000))

    img = np.zeros((S, S, 4), np.float32)
    lipsY = meta['lipsY']
    faceZ = meta['faceZ']
    # face triangles only
    P = pos[tri]
    sel = np.all(np.abs(P[:, :, 0]) < 0.09, axis=1) & np.all(P[:, :, 1] > lipsY - 0.07, axis=1) & np.all(P[:, :, 1] < meta['eyeL'][1] + 0.06, axis=1) & np.all(P[:, :, 2] > faceZ - 0.08, axis=1)
    fn = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0])
    fn /= np.linalg.norm(fn, axis=1, keepdims=True) + 1e-12
    sel &= fn[:, 2] > 0.05
    print('face triangles', sel.sum())

    def paint(p, n):
        """p: (N,3) points, n: (N,3) normals -> (N,4)"""
        x, y, z = p[:, 0], p[:, 1], p[:, 2]
        out = np.zeros((len(p), 4))
        front = smooth(0.15, 0.45, n[:, 2])
        for E in eyes:
            s = E['side']
            near = (np.abs(x - E['e'][0]) < 0.035) & (np.abs(y - E['e'][1]) < 0.03)
            if not near.any():
                continue
            q = np.nonzero(near)[0]
            px, py = x[q], y[q]
            # 2D distance to the opening
            d = np.full(len(q), 1.0)
            for c0 in range(0, len(E['ox']), 2000):
                ox, oy = E['ox'][c0:c0 + 2000], E['oy'][c0:c0 + 2000]
                dd = np.sqrt((px[:, None] - ox[None]) ** 2 + (py[:, None] - oy[None]) ** 2).min(1)
                d = np.minimum(d, dd)
            ytop = np.interp(px, E['xs'], E['top'], left=np.nan, right=np.nan)
            ybot = np.interp(px, E['xs'], E['bot'], left=np.nan, right=np.nan)
            mid = np.where(np.isnan(ytop), E['ymid'], (ytop + ybot) / 2)
            upper = py > mid
            # outer fraction along the eye (0 inner corner, 1 outer corner)
            t = np.clip((px - E['inner']) / (E['outer'] - E['inner']), -0.5, 1.6)
            w = fp['liner'] * (0.6 + 0.8 * np.clip(t, 0, 1))
            liner = upper * (1 - smooth(w * 0.7, w * 1.25, d))
            # lower lid: a thin, light line on the outer half
            low = (~upper) * (1 - smooth(0.0003, 0.0007, d)) * 0.45 * smooth(0.3, 0.8, t)
            # wing past the outer corner, rising
            wing = np.zeros(len(q))
            if fp['wing'] > 0:
                ex = (px - E['outer']) * s
                wy = E['ymid'] + 0.0012 + ex * 0.45
                ww = 0.0008 * np.clip(1 - ex / fp['wing'], 0, 1) + 0.0002
                wing = (ex > -0.001) * (ex < fp['wing']) * (1 - smooth(ww * 0.5, ww, np.abs(py - wy)))
            # lid crease above the line
            crease = upper * (1 - smooth(0.0003, 0.0006, np.abs(d - 0.0042 * K))) * fp['crease'] * smooth(0.1, 0.4, t) * (1 - smooth(0.9, 1.15, t))
            ink = np.clip(np.maximum.reduce([liner, low, wing, crease]), 0, 1)
            # socket shadow above the upper lid, toward the outer corner
            sock = upper * smooth(0.0015, 0.003, d) * (1 - smooth(0.006, 0.011, d)) * fp['socket'] * smooth(0.0, 0.8, t)
            # eyebrow: an arc above the opening, thick at its head, thin at its tail
            bi = E['inner'] - s * 0.0015
            bo = E['outer'] + s * 0.006
            bt = (px - bi) / (bo - bi)
            cy = E['ytop'] + fp['browGap'] * K + fp['browArch'] * np.sin(np.pi * np.clip(bt * 1.15, 0, 1)) + fp['browAngle'] * bt
            th = fp['brow'] * (1 - 0.65 * np.clip(bt, 0, 1)) * K
            brow = (bt > -0.02) * (bt < 1.0) * (1 - smooth(th * 0.4, th * 0.55, np.abs(py - cy)))
            brow *= smooth(-0.02, 0.06, bt) * (1 - smooth(0.85, 1.0, bt))
            # a few hair strokes inside the brow, so it reads as hair rather than a painted band
            brow *= 0.88 + 0.12 * np.sin(px * s * 2600 + py * 900)
            f = front[q]
            out[q, 0] = np.maximum(out[q, 0], ink * f)
            out[q, 1] = np.maximum(out[q, 1], sock * f)
            out[q, 3] = np.maximum(out[q, 3], brow * f)
        # cheek contour: under the cheekbone, on the side of the face
        ax = np.abs(x)
        ey = meta['eyeL'][1]
        cheek = smooth(0.028, 0.045, ax) * (1 - smooth(0.06, 0.075, ax)) * smooth(lipsY - 0.005, lipsY + 0.012, y) * (1 - smooth(ey - 0.032, ey - 0.02, y))
        cheek *= smooth(0.2, 0.6, np.abs(n[:, 0]))
        out[:, 1] = np.maximum(out[:, 1], cheek * fp['contour'])
        # lips: warm tint on the lips (in front, around the lips line)
        lips = (1 - smooth(0.018, 0.026, ax)) * (1 - smooth(0.006, 0.011, np.abs(y - lipsY))) * smooth(faceZ - 0.03, faceZ - 0.015, z)
        out[:, 2] = np.maximum(out[:, 2], lips * fp['lips'])
        # blush on the cheekbones
        bl = np.exp(-(((ax - 0.045) / 0.012) ** 2 + ((y - (ey - 0.03)) / 0.01) ** 2))
        out[:, 2] = np.maximum(out[:, 2], bl * fp['blush'] * front)
        return out

    T = tri[sel]
    UVt = uv[T] * S
    for k in range(len(T)):
        t = T[k]
        U = UVt[k]
        i0, i1 = int(np.floor(U[:, 0].min())), int(np.ceil(U[:, 0].max()))
        j0, j1 = int(np.floor(U[:, 1].min())), int(np.ceil(U[:, 1].max()))
        gx, gy = np.meshgrid(np.arange(i0, i1 + 1) + 0.5, np.arange(j0, j1 + 1) + 0.5)
        d = (U[1, 1] - U[2, 1]) * (U[0, 0] - U[2, 0]) + (U[2, 0] - U[1, 0]) * (U[0, 1] - U[2, 1])
        if abs(d) < 1e-9:
            continue
        a = ((U[1, 1] - U[2, 1]) * (gx - U[2, 0]) + (U[2, 0] - U[1, 0]) * (gy - U[2, 1])) / d
        b = ((U[2, 1] - U[0, 1]) * (gx - U[2, 0]) + (U[0, 0] - U[2, 0]) * (gy - U[2, 1])) / d
        c = 1 - a - b
        # one texel of margin, so the paint has no gaps along the UV seams
        ins = (a >= -0.15) & (b >= -0.15) & (c >= -0.15)
        if not ins.any():
            continue
        A, B, C = a[ins], b[ins], c[ins]
        p = A[:, None] * pos[t[0]] + B[:, None] * pos[t[1]] + C[:, None] * pos[t[2]]
        n = np.repeat(fn[sel][k][None], len(p), 0)
        v = paint(p, n)
        X = np.clip(gx[ins].astype(int), 0, S - 1)
        Y = np.clip(gy[ins].astype(int), 0, S - 1)
        img[Y, X] = np.maximum(img[Y, X], v)
    Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8), 'RGBA').save(out, optimize=True)
    print('written', out)


if __name__ == '__main__':
    main(*sys.argv[1:5])
