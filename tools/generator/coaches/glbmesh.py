"""Reads the skin mesh (positions, uv, triangles) of a coach GLB, without Blender."""
import json, struct
import numpy as np

COMP = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8}
SIZE = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}


def load_skin(path):
    b = open(path, 'rb').read()
    n = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + n])
    bin0 = 20 + n + 8

    def acc(i):
        a = j['accessors'][i]
        bv = j['bufferViews'][a['bufferView']]
        off = bin0 + bv.get('byteOffset', 0) + a.get('byteOffset', 0)
        k = SIZE[a['type']]
        dt = COMP[a['componentType']]
        stride = bv.get('byteStride')
        cnt = a['count']
        if stride and stride != k * np.dtype(dt).itemsize:
            raw = np.frombuffer(b, dtype=np.uint8, count=stride * cnt, offset=off).reshape(cnt, stride)
            return raw[:, : k * np.dtype(dt).itemsize].copy().view(dt).reshape(cnt, k)
        return np.frombuffer(b, dtype=dt, count=cnt * k, offset=off).reshape(cnt, k)

    skin = next(i for i, m in enumerate(j['materials']) if m.get('name') == 'Skin')
    for mesh in j['meshes']:
        for p in mesh['primitives']:
            if p.get('material') == skin:
                pos = acc(p['attributes']['POSITION']).astype(np.float64)
                uv = acc(p['attributes']['TEXCOORD_0']).astype(np.float64)
                tri = acc(p['indices']).reshape(-1, 3).astype(np.int64)
                return pos, uv, tri
    raise RuntimeError('no skin primitive')
