"""1.38.0 neck seam of a Rocketbox photo.glb (Youssef 13/11: « une ligne artificielle reste visible à la base de la
nuque »). The head and the body are two primitives that meet along a ring of points stored in both. Where a point of
the head sits exactly on a point of the body, both must be lit and moved the same way, or the ring shows: as a line
of light (two different normals) or as a slit when the head turns (two different sets of skin weights).

    python neck_seam.py photo.glb            # report only
    python neck_seam.py photo.glb --fix      # in place: one normal and one set of weights per shared place

Normal: the normalised sum of the normals stored at that place on both sides (a place the body stores twice along one
of its own texture seams keeps one normal too). Weights: the mean of both sides, four strongest kept, normalised.
Nothing else in the file changes (positions, textures, expressions, other points)."""
import json
import struct
import sys
import numpy as np

path = sys.argv[1]
fix = '--fix' in sys.argv
data = bytearray(open(path, 'rb').read())
jl = struct.unpack_from('<I', data, 12)[0]
doc = json.loads(bytes(data[20:20 + jl]))
b0 = 20 + jl + 8
CT = {5126: 'f4', 5125: 'u4', 5123: 'u2', 5121: 'u1'}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}


def view(i):
    a = doc['accessors'][i]
    bv = doc['bufferViews'][a['bufferView']]
    assert not bv.get('byteStride') or bv['byteStride'] == np.dtype(CT[a['componentType']]).itemsize * NC[a['type']], 'interleaved'
    off = b0 + bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    return np.frombuffer(data, CT[a['componentType']], a['count'] * NC[a['type']], off).reshape(-1, NC[a['type']])


prims = {doc['materials'][p['material']]['name']: p for m in doc['meshes'] for p in m['primitives']}
body = next(p for n, p in prims.items() if 'body' in n)
head = next(p for n, p in prims.items() if 'head' in n)
P = [view(p['attributes']['POSITION']) for p in (body, head)]
N = [view(p['attributes']['NORMAL']) for p in (body, head)]
J = [view(p['attributes']['JOINTS_0']) for p in (body, head)]
W = [view(p['attributes']['WEIGHTS_0']) for p in (body, head)]
nj = max(int(J[0].max()), int(J[1].max())) + 1
unit = 100.0 if P[0][:, 1].max() > 10 else 1.0   # centimetres under a 0.01 scale, or metres
tol = 0.0002 * unit

place = {}
for s in (0, 1):
    for i, q in enumerate(np.round(P[s] / tol).astype(np.int64)):
        place.setdefault(tuple(q), []).append((s, i))
shared = [v for v in place.values() if {s for s, _ in v} == {0, 1}]
worst_n = worst_w = 0.0
for grp in shared:
    ns = np.array([N[s][i] for s, i in grp], dtype=np.float64)
    ns /= np.linalg.norm(ns, axis=1, keepdims=True)
    worst_n = max(worst_n, float(np.degrees(np.arccos(np.clip((ns @ ns.T).min(), -1, 1)))))
    full = np.zeros((len(grp), nj))
    for k, (s, i) in enumerate(grp):
        np.add.at(full[k], J[s][i].astype(int), W[s][i])
    worst_w = max(worst_w, float(np.abs(full - full.mean(0)).max()))
    if fix:
        n = ns.sum(0)
        n /= np.linalg.norm(n)
        w = full.mean(0)
        top = np.argsort(-w)[:4]
        ww = w[top] / w[top].sum()
        for s, i in grp:
            N[s][i] = n
            J[s][i] = top
            W[s][i] = ww
print(path, 'shared places', len(shared), 'worst normal gap %.2f deg' % worst_n, 'worst weight gap %.3f' % worst_w, '(fixed)' if fix else '')
if fix:
    doc['asset'].setdefault('extras', {})['css_neck_seam'] = '1.38.0'
    js = json.dumps(doc, separators=(',', ':')).encode()
    js += b' ' * (-len(js) % 4)
    out = bytearray(data[:12]) + struct.pack('<I', len(js)) + b'JSON' + js + data[20 + jl:]
    struct.pack_into('<I', out, 8, len(out))
    open(path, 'wb').write(out)
