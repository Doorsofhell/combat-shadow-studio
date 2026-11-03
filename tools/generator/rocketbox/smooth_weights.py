"""1.10 (Youssef 2026-11-03, « reliefs abrupts autour des omoplates », « raccords épaules/aisselles à contrôler en
garde », « conservation des volumes aux articulations »): smooths the skin weights of a coach's photo.glb around
chosen joints, in place, without touching the points (the outfits hide the body by its point positions).

Measured cause (src/engine/__tests__/deformation-v1100.test.ts, docs/v1100/MESURES_DEFORMATIONS.md): the weights of
the Rocketbox bodies change from the arm to the shoulder blade over one or two rows of triangles; when the arm comes
forward into the guard those rows fold into a sharp crease (the dark gash under Kadir's right shoulder blade, made
darker still by the shadow in it). Not a normal map or lighting problem: the same skin at rest is continuous.

Method: the weights of all bones are relaxed (Laplacian smoothing over the welded surface: the points split along
texture seams share their weights, or the seams would open) inside a sphere round each joint, with a falloff to the
sphere's edge so the result joins the untouched weights continuously; then the four strongest kept and normalised.

  python3 tools/generator/rocketbox/smooth_weights.py public/coaches/mma-kadir/photo.glb epaules=0.15:12 coudes=0.06:4

zones: epaules (LeftArm/RightArm), coudes (ForeArm), genoux (Leg), aines (UpLeg); value radius_m:iterations.
numpy only. Every other byte of the file is kept.
"""
import json
import struct
import sys

import numpy as np

ZONES = {'epaules': ('LeftArm', 'RightArm'), 'coudes': ('LeftForeArm', 'RightForeArm'), 'genoux': ('LeftLeg', 'RightLeg'), 'aines': ('LeftUpLeg', 'RightUpLeg')}
DT = {5126: np.float32, 5123: np.uint16, 5121: np.uint8, 5125: np.uint32}
NC = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


def main(path, specs):
    b = bytearray(open(path, 'rb').read())
    jl = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + jl])
    off0 = 20 + jl + 8

    def view(ai):
        a = j['accessors'][ai]
        bv = j['bufferViews'][a['bufferView']]
        n = NC[a['type']]
        dt = np.dtype(DT[a['componentType']])
        stride = bv.get('byteStride', dt.itemsize * n)
        start = off0 + bv.get('byteOffset', 0) + a.get('byteOffset', 0)
        return a, start, stride, n, dt

    def read(ai):
        a, start, stride, n, dt = view(ai)
        out = np.empty((a['count'], n), dt)
        for k in range(a['count']):
            out[k] = np.frombuffer(b, dt, n, start + k * stride)
        return out

    def write(ai, arr):
        a, start, stride, n, dt = view(ai)
        arr = arr.astype(dt)
        for k in range(a['count']):
            b[start + k * stride:start + k * stride + dt.itemsize * n] = arr[k].tobytes()

    node = next(nd for nd in j['nodes'] if 'mesh' in nd and 'skin' in nd)
    skin = j['skins'][node['skin']]
    names = [j['nodes'][x].get('name', '') for x in skin['joints']]
    ibm = read(skin['inverseBindMatrices']).astype(np.float64).reshape(-1, 4, 4)
    # glTF matrices are column-major: the joint's bind position is the translation of the inverse of its IBM
    bindpos = {nm: np.linalg.inv(m.T)[:3, 3] for nm, m in zip(names, ibm)}
    mesh = j['meshes'][node['mesh']]
    # the body: the primitive with the most points that is not eyes or hair
    prims = [p for p in mesh['primitives']]
    for prim in prims:
        mat = j['materials'][prim['material']]['name'] if 'material' in prim else ''
        if any(x in mat.lower() for x in ('eye', 'hair', 'lash', 'brow')):
            continue
        a_w = j['accessors'][prim['attributes']['WEIGHTS_0']]
        pos = read(prim['attributes']['POSITION']).astype(np.float64)
        J = read(prim['attributes']['JOINTS_0']).astype(np.int64)
        Wraw = read(prim['attributes']['WEIGHTS_0']).astype(np.float64)
        if a_w['componentType'] != 5126:
            Wraw /= 65535.0 if a_w['componentType'] == 5123 else 255.0
        idx = read(prim['indices']).ravel().astype(np.int64)
        n = len(pos)
        nb = len(names)
        W = np.zeros((n, nb))
        for k in range(4):
            np.add.at(W, (np.arange(n), J[:, k]), Wraw[:, k])
        # weld by position (seams)
        scale = max(1e-9, np.abs(pos).max())
        key = np.round(pos / scale * 2e5).astype(np.int64)
        _, wid, inv = np.unique(key, axis=0, return_index=True, return_inverse=True)
        inv = inv.ravel()
        m = len(wid)
        Wm = np.zeros((m, nb))
        np.add.at(Wm, inv, W)
        cnt = np.bincount(inv, minlength=m)[:, None]
        Wm /= cnt
        Pm = np.zeros((m, 3))
        np.add.at(Pm, inv, pos)
        Pm /= cnt
        tri = inv[idx].reshape(-1, 3)
        e = np.concatenate([tri[:, [0, 1]], tri[:, [1, 2]], tri[:, [2, 0]]])
        e = np.concatenate([e, e[:, ::-1]])
        e = np.unique(e, axis=0)
        deg = np.bincount(e[:, 0], minlength=m).astype(np.float64)
        # units: the Rocketbox points are in centimetres (bind positions tell: the head is above 10)
        unit = 100.0 if max(abs(v[1]) for v in bindpos.values()) > 10 else 1.0
        report = []
        for spec in specs:
            zone, val = spec.split('=')
            radius, iters = val.split(':')
            radius = float(radius) * unit
            iters = int(iters)
            for bone in ZONES[zone]:
                c = bindpos[bone]
                d = np.linalg.norm(Pm - c, axis=1)
                f = np.clip(1 - d / radius, 0, 1)
                f = f * f * (3 - 2 * f)
                sel = f > 0
                for _ in range(iters):
                    avg = np.zeros_like(Wm)
                    np.add.at(avg, e[:, 0], Wm[e[:, 1]])
                    avg /= np.maximum(deg, 1)[:, None]
                    Wm[sel] += (avg[sel] - Wm[sel]) * (0.5 * f[sel])[:, None]
                report.append(f'{bone} {int(sel.sum())} points')
        # four strongest, normalised, back to every split point
        Wn = Wm[inv]
        top = np.argsort(-Wn, axis=1)[:, :4]
        tw = np.take_along_axis(Wn, top, 1)
        tw = np.clip(tw, 0, None)
        tw /= np.maximum(tw.sum(1, keepdims=True), 1e-9)
        changed = np.abs(np.take_along_axis(W, top, 1) - tw).max(1) > 1e-4
        if a_w['componentType'] == 5126:
            outw = tw.astype(np.float32)
        else:
            mx = 65535 if a_w['componentType'] == 5123 else 255
            q = np.round(tw * mx).astype(np.int64)
            q[:, 0] += mx - q.sum(1)
            outw = q
        a_j = j['accessors'][prim['attributes']['JOINTS_0']]
        if top.max() > (255 if a_j['componentType'] == 5121 else 65535):
            raise SystemExit('joint index too large for the accessor')
        write(prim['attributes']['WEIGHTS_0'], outw)
        write(prim['attributes']['JOINTS_0'], top)
        print(path, mat, ', '.join(report), f'{int(changed.sum())} points changés sur {n}')
    open(path, 'wb').write(bytes(b))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2:])
