#!/usr/bin/env python3
"""Audit real GLB head/body geometry: no mutation of model files.
v1.52.0 second pass — identify whether the visible neck seam stems from
geometric gaps, normals, skin weights, UV islands or different textures.
Usage: python tools/generator/rocketbox/audit_neck_v1520.py GLB [GLB ...]
"""
import json
import struct
import sys
from pathlib import Path
import numpy as np
from scipy.spatial import cKDTree

COMP = {5120: 'i1', 5121: 'u1', 5122: '<i2', 5123: '<u2',
        5125: '<u4', 5126: '<f4'}
COUNT = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}

def inspect(path):
    data = Path(path).read_bytes()
    magic, version, length = struct.unpack_from('<III', data)
    if magic != 0x46546c67 or version != 2 or length != len(data):
        raise ValueError('Not a GLB2 file: ' + str(path))
    offset = 12
    document = binary = None
    while offset < length:
        size, kind = struct.unpack_from('<I4s', data, offset)
        chunk = memoryview(data)[offset+8:offset+8+size]
        if kind == b'JSON':
            document = json.loads(bytes(chunk))
        elif kind == b'BIN\\x00':
            binary = chunk
        offset += 8 + size
    if document is None or binary is None:
        raise ValueError('Missing GLB chunks')
    def read(idx):
        a = document['accessors'][idx]
        if 'sparse' in a:
            raise ValueError('sparse accessor unsupported: ' + str(idx))
        bv = document['bufferViews'][a['bufferView']]
        dtype = np.dtype(COMP[a['componentType']])
        width = COUNT[a['type']]
        stride = bv.get('byteStride', dtype.itemsize * width)
        offset = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
        arr = np.ndarray(shape=(a['count'], width), dtype=dtype,
                         buffer=binary, offset=offset,
                         strides=(stride, dtype.itemsize))
        return np.asarray(arr, dtype=np.float64)
    candidates = []
    for mesh in document['meshes']:
        for prim in mesh['primitives']:
            mat = document.get('materials', [{}])[prim.get('material', 0)]
            name = mat.get('name', '')
            kind = 'head' if name.lower().endswith('_head') else (
                'body' if name.lower().endswith('_body') else None)
            if kind and 'POSITION' in prim['attributes']:
                candidates.append((kind, name, prim, mat))
    heads = [x for x in candidates if x[0] == 'head']
    bodies = [x for x in candidates if x[0] == 'body']
    if not heads or not bodies:
        return {'file': str(path), 'error': 'head/body primitives missing',
                'materials': [x[1] for x in candidates]}
    _, headname, head, hm = heads[0]
    _, bodyname, body, bm = bodies[0]
    h = read(head['attributes']['POSITION'])
    b = read(body['attributes']['POSITION'])
    bbox_h = [h.min(axis=0).tolist(), h.max(axis=0).tolist()]
    bbox_b = [b.min(axis=0).tolist(), b.max(axis=0).tolist()]
    span = np.ptp(b[:, 1])
    unit = 100 if span > 10 else 1
    threshold = 0.0002 * unit
    # Query the closest possible body vertex to each head vertex.
    tree = cKDTree(b)
    distance, idx = tree.query(h, workers=1)
    close = distance < threshold
    # Focus neck candidates near the lowest 18% of the head,
    # excluding coincident unrelated areas on lips/ears/shoulders.
    low = np.quantile(h[:, 1], 0.02)
    high = np.quantile(h[:, 1], 0.20)
    neck_mask = (h[:, 1] >= low) & (h[:, 1] <= high)
    d = distance[neck_mask]
    close_neck = neck_mask & close
    def angles():
        if not np.any(close_neck) or 'NORMAL' not in head['attributes'] or 'NORMAL' not in body['attributes']:
            return None
        hn = read(head['attributes']['NORMAL'])[close_neck]
        bn = read(body['attributes']['NORMAL'])[idx[close_neck]]
        hn /= np.maximum(np.linalg.norm(hn, axis=1, keepdims=True), 1e-12)
        bn /= np.maximum(np.linalg.norm(bn, axis=1, keepdims=True), 1e-12)
        deg = np.rad2deg(np.arccos(np.clip((hn*bn).sum(axis=1), -1, 1)))
        return {'max': round(float(deg.max()), 4),
                'median': round(float(np.median(deg)), 4),
                'over_1deg': int((deg > 1).sum()),
                'over_5deg': int((deg > 5).sum())}
    def texture_info(mat):
        pbr = mat.get('pbrMetallicRoughness', {})
        tx = pbr.get('baseColorTexture', {})
        tid = tx.get('index')
        if tid is None:
            return None
        tex = document['textures'][tid]
        image_id = tex.get('source')
        im = document.get('images', [])[image_id] if image_id is not None else {}
        return {'textureIndex': tid, 'texCoord': tx.get('texCoord', 0),
                'imageMime': im.get('mimeType'), 'imageName': im.get('name')}
    report = {
        'file': str(path), 'headMaterial': headname, 'bodyMaterial': bodyname,
        'headVertices': len(h), 'bodyVertices': len(b),
        'headBBox': bbox_h, 'bodyBBox': bbox_b,
        'headBottom20RangeY': [float(low), float(high)],
        'unitFactor': unit, 'distanceTolerance': threshold,
        'headVerticesInNeckRegion': int(neck_mask.sum()),
        'nearCoincidentNeckVertices': int(close_neck.sum()),
        'closeVertexCountAllHead': int(close.sum()),
        'neckMinNearestDistance': round(float(d.min()), 8) if len(d) else None,
        'neckMedianNearestDistance': round(float(np.median(d)), 8) if len(d) else None,
        'neckP90NearestDistance': round(float(np.quantile(d, .9)), 8) if len(d) else None,
        'neckMaxNearestDistance': round(float(d.max()), 8) if len(d) else None,
        'normalAngleAtNeckShared': angles(),
        'headUVPresent': 'TEXCOORD_0' in head['attributes'],
        'bodyUVPresent': 'TEXCOORD_0' in body['attributes'],
        'headTexture': texture_info(hm), 'bodyTexture': texture_info(bm),
        'headHasWeights': 'WEIGHTS_0' in head['attributes'],
        'bodyHasWeights': 'WEIGHTS_0' in body['attributes'],
    }
    return report

def main():
    if len(sys.argv) < 2:
        raise SystemExit('Pass one or more GLB paths')
    result = [inspect(p) for p in sys.argv[1:]]
    for item in result:
        print(json.dumps(item, indent=2))
    output = Path('captures/v1520/neck-glb-audit.json')
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2) + '\\n', encoding='utf-8')
    print('WROTE', output)
if __name__ == '__main__':
    main()
