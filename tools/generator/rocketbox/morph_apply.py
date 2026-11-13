"""1.16: puts the facial expressions extracted by morph_extract.py on a shipped coach (photo.glb, in place), as glTF
morph targets (sparse: only the points that move are stored).

  python3 tools/generator/rocketbox/morph_apply.py public/coaches/<id>/photo.glb expressions.npz

Each point of the model takes the delta of the nearest point of the subdivided source (same avatar, same
subdivision as convert.py), within TOL (2 mm); points further away (moved by a later step, or not on the source)
stay still. Every primitive of the mesh gets the same targets (glTF rule), the names go in mesh.extras.targetNames
(three.js: morphTargetDictionary). Positions only: the normals of a few millimetres of motion are not stored.
"""
import sys, json, struct
import numpy as np

path, npz = sys.argv[1], sys.argv[2]
TOL = float(sys.argv[3]) if len(sys.argv) > 3 else 0.002
EPS = 2e-5  # deltas under 0.02 mm are not stored
src = np.load(npz)
names = [str(n) for n in src['names']]
base = src['base'].astype(np.float64)
D = [src[f'd{i}'] for i in range(len(names))]

raw = bytearray(open(path, 'rb').read())
jl = struct.unpack_from('<I', raw, 12)[0]
J = json.loads(raw[20:20 + jl])
bl = struct.unpack_from('<I', raw, 20 + jl)[0]
B0 = 20 + jl + 8
binbuf = bytearray(raw[B0:B0 + bl])
CT = {5126: ('f', 4), 5123: ('H', 2), 5125: ('I', 4), 5121: ('B', 1)}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


def view(i):
    a = J['accessors'][i]
    bv = J['bufferViews'][a['bufferView']]
    t, s = CT[a['componentType']]
    n = NC[a['type']]
    o = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    st = bv.get('byteStride', s * n)
    return np.ndarray((a['count'], n), dtype='<' + t, buffer=bytes(binbuf), offset=o, strides=(st, s)).copy()


# grid of the source points
CELL = 0.004
grid = {}
for i, k in enumerate(map(tuple, np.floor(base / CELL).astype(int))):
    grid.setdefault(k, []).append(i)


def nearest(p):
    c = np.floor(p / CELL).astype(int)
    best, bd = -1, TOL
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            for dz in (-1, 0, 1):
                for i in grid.get((c[0] + dx, c[1] + dy, c[2] + dz), ()):
                    d = np.linalg.norm(base[i] - p)
                    if d < bd:
                        best, bd = i, d
    return best


def add_view(data):
    while len(binbuf) % 4:
        binbuf.append(0)
    off = len(binbuf)
    binbuf.extend(data)
    J['bufferViews'].append({'buffer': 0, 'byteOffset': off, 'byteLength': len(data)})
    return len(J['bufferViews']) - 1


assert len(J['meshes']) == 1, 'one mesh expected'
mesh = J['meshes'][0]
if mesh.get('extras', {}).get('targetNames'):
    sys.exit(f'{path}: already has expressions')
done = {}
for p in mesh['primitives']:
    pa = p['attributes']['POSITION']
    if pa in done:
        p['targets'] = done[pa]
        continue
    P = view(pa).astype(np.float64)
    m = np.array([nearest(v) for v in P])
    hit = m >= 0
    targets = []
    moving = 0
    for k, name in enumerate(names):
        d = np.zeros((len(P), 3), np.float32)
        d[hit] = D[k][m[hit]]
        idx = np.where(np.linalg.norm(d, axis=1) > EPS)[0].astype(np.uint32)
        if not len(idx):
            idx = np.array([0], np.uint32)  # a sparse accessor needs one entry
        moving = max(moving, len(idx))
        vals = d[idx].astype('<f4')
        iv = add_view(idx.astype('<u4').tobytes())
        vv = add_view(vals.tobytes())
        J['accessors'].append({'componentType': 5126, 'count': len(P), 'type': 'VEC3',
                               'min': d.min(0).tolist(), 'max': d.max(0).tolist(),
                               'sparse': {'count': len(idx), 'indices': {'bufferView': iv, 'componentType': 5125},
                                          'values': {'bufferView': vv}}})
        targets.append({'POSITION': len(J['accessors']) - 1})
    p['targets'] = targets
    done[pa] = targets
    print(f'{J["materials"][p["material"]]["name"]}: {hit.sum()}/{len(P)} points matched, up to {moving} moving per expression')
mesh['weights'] = [0.0] * len(names)
mesh.setdefault('extras', {})['targetNames'] = names
J['buffers'][0]['byteLength'] = len(binbuf)
while len(binbuf) % 4:
    binbuf.append(0)
js = json.dumps(J, separators=(',', ':')).encode()
js += b' ' * ((4 - len(js) % 4) % 4)
rest = bytes(raw[B0 + bl:])
out = b'JSON'.join([struct.pack('<I', len(js)), js]) + struct.pack('<I', len(binbuf)) + b'BIN\x00' + bytes(binbuf) + rest
open(path, 'wb').write(b'glTF' + struct.pack('<II', 2, 12 + len(out)) + out)
print(f'{path}: {len(names)} expressions, {len(raw)} -> {12 + len(out)} octets')
