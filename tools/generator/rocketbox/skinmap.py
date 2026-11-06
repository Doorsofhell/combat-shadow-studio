# 1.26 used by outfits.py (file_key): which stored body point each point of the Blender body is
import json, struct, numpy as np
from mathutils import Quaternion, Matrix, Vector

def skinned_points(src):
    """raw body points of a skinned glTF and the same points posed by the skeleton at rest (as three draws them and as
    Blender imports a body whose bind pose differs from its rest pose), both in glTF axes"""
    raw = open(src, 'rb').read()
    jl = struct.unpack('<I', raw[12:16])[0]
    J = json.loads(raw[20:20 + jl])
    b0 = 20 + jl + 8
    def acc(i):
        a = J['accessors'][i]; v = J['bufferViews'][a['bufferView']]
        dt = {5126: '<f4', 5123: '<u2', 5121: 'u1'}[a['componentType']]
        nc = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}[a['type']]
        stride = v.get('byteStride')
        off = b0 + v.get('byteOffset', 0) + a.get('byteOffset', 0)
        isz = np.dtype(dt).itemsize
        if stride and stride != nc * isz:
            out = np.stack([np.frombuffer(raw, dtype=dt, count=nc, offset=off + k * stride) for k in range(a['count'])])
        else:
            out = np.frombuffer(raw, dtype=dt, count=a['count'] * nc, offset=off).reshape(a['count'], nc)
        out = out.astype(np.float64)
        if a.get('normalized'):
            out /= {5123: 65535.0, 5121: 255.0}[a['componentType']]
        return out
    nodes = J['nodes']
    parent = {}
    for i, n in enumerate(nodes):
        for c in n.get('children', []):
            parent[c] = i
    def local(n):
        if 'matrix' in n:
            return np.array(n['matrix']).reshape(4, 4).T
        t = n.get('translation', [0, 0, 0]); r = n.get('rotation', [0, 0, 0, 1]); s = n.get('scale', [1, 1, 1])
        q = Quaternion((r[3], r[0], r[1], r[2]))
        m = (Matrix.Translation(t) @ q.to_matrix().to_4x4() @ Matrix.Diagonal((*s, 1)))
        return np.array(m)
    cache = {}
    def world(i):
        if i not in cache:
            m = local(nodes[i])
            cache[i] = world(parent[i]) @ m if i in parent else m
        return cache[i]
    out_raw, out_pose = [], []
    for ni, n in enumerate(nodes):
        if 'mesh' not in n:
            continue
        m = J['meshes'][n['mesh']]
        for pr in m['primitives']:
            P = acc(pr['attributes']['POSITION'])
            if 'skin' in n and 'JOINTS_0' in pr['attributes']:
                sk = J['skins'][n['skin']]
                ib = acc(sk['inverseBindMatrices']).reshape(-1, 4, 4).transpose(0, 2, 1)
                M = np.stack([world(j) @ ib[k] for k, j in enumerate(sk['joints'])])
                Jt = acc(pr['attributes']['JOINTS_0']).astype(int)
                W = acc(pr['attributes']['WEIGHTS_0'])
                W = W / np.maximum(W.sum(1, keepdims=True), 1e-9)
                ph = np.c_[P, np.ones(len(P))]
                Q = np.zeros((len(P), 3))
                for k in range(4):
                    Q += W[:, k:k + 1] * np.einsum('nij,nj->ni', M[Jt[:, k]], ph)[:, :3]
            else:
                Q = (np.c_[P, np.ones(len(P))] @ world(ni).T)[:, :3]
            out_raw.append(P); out_pose.append(Q)
    return np.concatenate(out_raw), np.concatenate(out_pose)
