"""Lecture minimale d'un photo.glb Rocketbox (numpy) : points de liaison, normales, uv, triangles, textures, os.
Utilisé par les outils « coachs fidèles aux images de référence » (2.4.0)."""
import json, struct, io
import numpy as np
from PIL import Image

CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


class Glb:
    def __init__(self, path):
        b = open(path, 'rb').read()
        n = struct.unpack('<I', b[12:16])[0]
        self.j = json.loads(b[20:20 + n])
        o = 20 + n
        ln = struct.unpack('<I', b[o:o + 4])[0]
        self.bin = b[o + 8:o + 8 + ln]

    def acc(self, i):
        a = self.j['accessors'][i]
        bv = self.j['bufferViews'][a['bufferView']]
        dt = np.dtype(CT[a['componentType']])
        nc = NC[a['type']]
        off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
        stride = bv.get('byteStride', 0)
        if stride and stride != dt.itemsize * nc:
            raw = np.frombuffer(self.bin, np.uint8, count=stride * a['count'], offset=off).reshape(a['count'], stride)
            return raw[:, :dt.itemsize * nc].copy().view(dt).reshape(a['count'], nc)
        return np.frombuffer(self.bin, dt, count=a['count'] * nc, offset=off).reshape(a['count'], nc).copy()

    def prims(self):
        out = []
        for m in self.j['meshes']:
            for p in m['primitives']:
                at = p['attributes']
                mat = self.j['materials'][p['material']].get('name', '') if 'material' in p else ''
                out.append(dict(mat=mat, P=self.acc(at['POSITION']), N=self.acc(at['NORMAL']) if 'NORMAL' in at else None,
                                UV=self.acc(at['TEXCOORD_0']) if 'TEXCOORD_0' in at else None,
                                T=self.acc(p['indices']).reshape(-1, 3).astype(np.int64)))
        return out

    def image(self, pat):
        for im in self.j['images']:
            if pat in im.get('name', ''):
                bv = self.j['bufferViews'][im['bufferView']]
                o = bv.get('byteOffset', 0)
                return Image.open(io.BytesIO(self.bin[o:o + bv['byteLength']])).convert('RGB')
        raise KeyError(pat)

    def joints_world(self):
        """positions monde des os (repos), en composant les TRS des nœuds"""
        nodes = self.j['nodes']
        par = {}
        for i, nd in enumerate(nodes):
            for c in nd.get('children', []):
                par[c] = i

        def local(nd):
            M = np.eye(4)
            if 'matrix' in nd:
                return np.array(nd['matrix']).reshape(4, 4).T
            t = nd.get('translation', [0, 0, 0]); r = nd.get('rotation', [0, 0, 0, 1]); s = nd.get('scale', [1, 1, 1])
            x, y, z, w = r
            R = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                          [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                          [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
            M[:3, :3] = R * np.array(s)
            M[:3, 3] = t
            return M
        cache = {}

        def world(i):
            if i in cache:
                return cache[i]
            M = local(nodes[i])
            if i in par:
                M = world(par[i]) @ M
            cache[i] = M
            return M
        return {nd.get('name', str(i)): world(i)[:3, 3] for i, nd in enumerate(nodes)}


def save(g, path, new_acc=None, new_img=None):
    """réécrit le glb : accesseurs remplacés (même nombre d'éléments, même type) et images remplacées (octets)"""
    import copy
    new_acc = new_acc or {}; new_img = new_img or {}
    j = copy.deepcopy(g.j)
    view_data = {}
    for ai, arr in new_acc.items():
        a = j['accessors'][ai]
        bv = j['bufferViews'][a['bufferView']]
        dt = np.dtype(CT[a['componentType']]); nc = NC[a['type']]
        arr = np.asarray(arr, dt).reshape(a['count'], nc)
        vi = a['bufferView']
        buf = bytearray(view_data.get(vi, g.bin[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]))
        stride = bv.get('byteStride', 0) or dt.itemsize * nc
        off = a.get('byteOffset', 0)
        for k in range(nc):
            pass
        raw = np.frombuffer(bytes(buf), np.uint8).copy()
        rows = raw[off:off + stride * (a['count'] - 1) + dt.itemsize * nc]
        if stride == dt.itemsize * nc:
            raw[off:off + arr.nbytes] = np.frombuffer(arr.tobytes(), np.uint8)
        else:
            for i in range(a['count']):
                raw[off + i * stride: off + i * stride + dt.itemsize * nc] = np.frombuffer(arr[i].tobytes(), np.uint8)
        view_data[vi] = raw.tobytes()
        if 'min' in a:
            a['min'] = arr.min(0).tolist(); a['max'] = arr.max(0).tolist()
    for ii, data in new_img.items():
        im = j['images'][ii]
        view_data[im['bufferView']] = data
        im['mimeType'] = 'image/png' if data[:4] == b'\x89PNG' else 'image/jpeg'
    out = bytearray()
    for vi, bv in enumerate(j['bufferViews']):
        o = bv.get('byteOffset', 0)
        data = view_data.get(vi, g.bin[o:o + bv['byteLength']])
        while len(out) % 4:
            out.append(0)
        bv['byteOffset'] = len(out); bv['byteLength'] = len(data)
        out += data
    while len(out) % 4:
        out.append(0)
    j['buffers'][0]['byteLength'] = len(out)
    js = json.dumps(j, separators=(',', ':')).encode()
    while len(js) % 4:
        js += b' '
    total = 12 + 8 + len(js) + 8 + len(out)
    with open(path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, total))
        f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack('<II', len(out), 0x004E4942)); f.write(out)


def prim_refs(g):
    """(matériau, accesseur POSITION, accesseur NORMAL, accesseur indices) de chaque primitive"""
    r = []
    for m in g.j['meshes']:
        for p in m['primitives']:
            mat = g.j['materials'][p['material']].get('name', '') if 'material' in p else ''
            r.append((mat, p['attributes']['POSITION'], p['attributes'].get('NORMAL'), p['indices']))
    return r
