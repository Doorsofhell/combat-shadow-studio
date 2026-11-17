"""Kadir 1.46.0 — les tenues suivent le corps retouché (cou, mâchoire, trapèzes, volume des cheveux), sans les
reconstruire : les tenues de Kadir sont figées sur les modèles validés en 1.37.0 (outfit-rollback-v1373.test.ts).
  python3 tools/generator/kadir/tenues_suivent.py ancien_photo.glb nouveau_photo.glb tenue.glb [...]
Pour chaque tenue :
- extras.hideBody (points de peau cachés sous la tenue) : chaque clé de l'ancien corps prend la clé du même point
  du nouveau corps, sinon la peau retouchée réapparaîtrait sous le vêtement ;
- chaque point du vêtement reçoit le déplacement du point du corps le plus proche (plein jusqu'à 1,5 cm, nul à
  4 cm) : le col et les épaules du kimono ou du rashguard suivent les trapèzes, rien ne traverse.
Un fichier dont rien ne bouge n'est pas réécrit (même octets, même empreinte).
ATTENTION : une seule passe par tenue. Les tenues judo, bjj, bjj-nogi et arbitre-judo de Kadir l'ont déjà reçue
(1.47.0) : les relancer déplacerait le vêtement une seconde fois."""
import sys, json, struct, base64
import numpy as np
from scipy.spatial import cKDTree


def read(p):
    raw = open(p, 'rb').read()
    jl = struct.unpack_from('<I', raw, 12)[0]
    J = json.loads(raw[20:20 + jl])
    bl = struct.unpack_from('<I', raw, 20 + jl)[0]
    return J, bytearray(raw[20 + jl + 8:20 + jl + 8 + bl])


def write(p, J, B):
    js = json.dumps(J, separators=(',', ':')).encode()
    js += b' ' * (-len(js) % 4)
    B = bytes(B) + b'\0' * (-len(B) % 4)
    out = struct.pack('<III', 0x46546C67, 2, 28 + len(js) + len(B)) + struct.pack('<I4s', len(js), b'JSON') + js
    out += struct.pack('<I4s', len(B), b'BIN\0') + B
    open(p, 'wb').write(out)


def view(J, B, ai):
    a = J['accessors'][ai]; bv = J['bufferViews'][a['bufferView']]
    off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    assert a['componentType'] == 5126 and a['type'] == 'VEC3' and bv.get('byteStride', 12) == 12
    return off, a['count']


def body_positions(p):
    J, B = read(p)
    out = []
    for m in J['meshes']:
        for pr in m['primitives']:
            off, n = view(J, B, pr['attributes']['POSITION'])
            out.append(np.frombuffer(bytes(B[off:off + n * 12]), np.float32).reshape(-1, 3))
    return np.concatenate(out)


old_f, new_f, outfits = sys.argv[1], sys.argv[2], sys.argv[3:]
P0, P1 = body_positions(old_f).astype(np.float64), body_positions(new_f).astype(np.float64)
assert P0.shape == P1.shape
D = P1 - P0
moved = np.linalg.norm(D, axis=1) > 1e-5
print('corps : points déplacés', int(moved.sum()), 'max mm', round(float(np.linalg.norm(D, axis=1).max() * 1000), 1))
tree = cKDTree(P0)
for f in outfits:
    J, B = read(f)
    changed = False
    # 1. clés de peau cachée
    for n in J['nodes']:
        ex = n.get('extras') or {}
        if not ex.get('hideBody'): continue
        s = float(ex['hideScale'])
        k = np.frombuffer(base64.b64decode(ex['hideBody']), np.int16).reshape(-1, 3).astype(np.int64)
        old_keys = {tuple(x): i for i, x in enumerate(np.round(P0 * s).astype(np.int64))}
        K1 = np.round(P1 * s).astype(np.int64)
        nk, remap = [], 0
        for x in k:
            i = old_keys.get(tuple(x))
            if i is not None and moved[i]:
                nk.append(K1[i]); remap += 1
            else:
                nk.append(x)
        # un point soudé (couture) a plusieurs exemplaires : on garde toutes les clés distinctes
        nk = np.unique(np.array(nk, np.int64), axis=0)
        if remap:
            ex['hideBody'] = base64.b64encode(nk.astype(np.int16).tobytes()).decode(); changed = True
        print(f, 'peau cachée : clés', len(k), 'remplacées', remap)
    # 2. le vêtement suit le corps
    done = set()
    for m in J['meshes']:
        for pr in m['primitives']:
            ai = pr['attributes']['POSITION']
            if ai in done: continue
            done.add(ai)
            off, n = view(J, B, ai)
            V = np.frombuffer(bytes(B[off:off + n * 12]), np.float32).reshape(-1, 3).astype(np.float64)
            d, j = tree.query(V, k=4)
            w = np.clip((0.04 - d) / 0.025, 0, 1)                    # plein à 1,5 cm, nul à 4 cm
            w = w / np.maximum(w.sum(1, keepdims=True), 1e-9) * np.clip((0.04 - d[:, :1]) / 0.025, 0, 1)
            dv = (D[j] * w[..., None]).sum(1)
            if np.abs(dv).max() < 1e-5: continue
            V2 = (V + dv).astype(np.float32)
            B[off:off + n * 12] = V2.tobytes()
            a = J['accessors'][ai]; a['min'] = V2.min(0).tolist(); a['max'] = V2.max(0).tolist()
            changed = True
            print(f, m.get('name'), 'points du vêtement déplacés', int((np.linalg.norm(dv, axis=1) > 1e-4).sum()),
                  'max mm', round(float(np.linalg.norm(dv, axis=1).max() * 1000), 1))
    if changed:
        write(f, J, B)
    else:
        print(f, 'inchangée')
