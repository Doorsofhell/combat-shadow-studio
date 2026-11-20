"""1.40.3 (Youssef 13/11 23:24, « Met en place les options conseillées »): light sporty makeup on the women coaches,
painted into the head colour texture (`f021_head_color`) of their GLBs, in place.

  python3 tools/generator/rocketbox/makeup.py public/coaches/mma-amara/photo.glb amara B
  python3 tools/generator/rocketbox/makeup.py public/coaches/mma-amara/photo-clean.glb amara B
  python3 tools/generator/rocketbox/makeup.py public/coaches/inaya/photo.glb inaya A

Chosen on the proposals page (3 looks per coach rendered by the engine): Amara B « Frais d'entraînement » (cheeks
terracotta, lips rosewood, lids soft brown), Inaya A « Bonne mine » (cheeks peach pink, rosy balm). Amara shows
photo-clean.glb as soon as she wears an outfit (CoachModel.tsx) and photo.glb otherwise: both files take the makeup.

Rule (Youssef 13/11, 1.40.1): never a drawn line on a face. So every zone is a wide gaussian (cheeks, lids) or the
lips' own shape found by their redness and blurred 4 px; the photo is multiplied by a tint, so its grain, pores and
the coach's identity stay. Re-run after any rebuild of these GLBs (after morph_apply.py). Refuses a file already made
up (asset.extras.cssMakeup), so it is never applied twice.
"""
import io, json, struct, sys
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

H = W = 2048
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

# landmarks on the 2048 px head texture (same Rocketbox f021 UV layout for both), measured on the textures
L = {
    'amara': dict(eyes=[(883, 580), (1168, 580)], lips=(1022, 830, 98, 34), cheeks=[(858, 712), (1190, 712)]),
    'inaya': dict(eyes=[(880, 580), (1165, 580)], lips=(1022, 822, 95, 36), cheeks=[(858, 708), (1188, 708)]),
}
# per-channel multipliers, per skin: Amara deep warm skin, Inaya fair skin
SH = {
    'amara': dict(blush=(1.16, 0.95, 0.88), lip1=(1.10, 0.94, 0.94), lip2=(1.20, 0.88, 0.90), lid=(0.80, 0.72, 0.70)),
    'inaya': dict(blush=(1.08, 0.88, 0.90), lip1=(1.05, 0.94, 0.96), lip2=(1.10, 0.86, 0.92), lid=(0.90, 0.84, 0.84)),
}
LOOKS = {
    'A': [('cheek', 0.45, 'blush'), ('lip', 0.8, 'lip1')],
    'B': [('cheek', 0.70, 'blush'), ('lip', 1.0, 'lip2'), ('lid', 0.7, 'lid')],
}


def ell(cx, cy, rx, ry, soft=1.0):
    return np.exp(-(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2) * 2.2 * soft)


def zones(img, c):
    l = L[c]
    cx, cy, rx, ry = l['lips']
    e = ell(cx, cy, rx * 1.15, ry * 1.25, soft=0.6)
    r, g = img[..., 0], img[..., 1]
    red = (r - g) / (r + 1e-3)
    base = np.median(red[(e > 0.02) & (e < 0.15)])  # the skin around the lips
    lip = gaussian_filter(np.clip((red - base) / 0.08, 0, 1) * (e > 0.01), 4)
    return {
        'cheek': sum(ell(x, y, 80, 58) for x, y in l['cheeks']),
        'lid': sum(ell(x, y - 26, 78, 30) for x, y in l['eyes']),
        'lip': np.clip(lip * 1.2, 0, 1) * np.clip(e * 3, 0, 1),
    }


def load(p):
    b = open(p, 'rb').read()
    n = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + n])
    o = 20 + n
    return j, b[o + 8:o + 8 + struct.unpack('<I', b[o:o + 4])[0]]


def save(p, j, views):
    new = bytearray()
    for bv, chunk in zip(j['bufferViews'], views):
        while len(new) % 4:
            new += b'\0'
        bv['byteOffset'] = len(new)
        bv['byteLength'] = len(chunk)
        new += chunk
    while len(new) % 4:
        new += b'\0'
    j['buffers'][0]['byteLength'] = len(new)
    js = json.dumps(j, separators=(',', ':')).encode()
    while len(js) % 4:
        js += b' '
    with open(p, 'wb') as f:
        f.write(struct.pack('<4sII', b'glTF', 2, 28 + len(js) + len(new)))
        f.write(struct.pack('<I4s', len(js), b'JSON') + js)
        f.write(struct.pack('<I4s', len(new), b'BIN\0') + new)


def main(path, coach, look):
    j, binary = load(path)
    extras = j.setdefault('asset', {}).setdefault('extras', {})
    if 'cssMakeup' in extras:
        sys.exit(f'{path}: already made up ({extras["cssMakeup"]})')
    views = [binary[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']] for bv in j['bufferViews']]
    im = next(i for i in j['images'] if i.get('name') == 'f021_head_color')
    src = Image.open(io.BytesIO(views[im['bufferView']]))
    img = np.asarray(src.convert('RGB'), np.float32) / 255
    Z = zones(img, coach)
    for part, a, tint in LOOKS[look]:
        k = (Z[part] * a)[..., None]
        img = img * (1 + k * (np.array(SH[coach][tint], np.float32) - 1))
    out = Image.fromarray((np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8))
    buf = io.BytesIO()
    if im['mimeType'] == 'image/png':
        if src.mode == 'RGBA':
            out.putalpha(src.getchannel('A'))
        out.save(buf, 'PNG', optimize=True)
    else:
        # JPEG: the best quality that keeps the texture within 15 % of its former weight (mobile download)
        for q in (95, 93, 91, 89, 87, 85):
            buf = io.BytesIO()
            out.save(buf, 'JPEG', quality=q)
            if buf.tell() <= 1.15 * len(views[im['bufferView']]):
                break
    views[im['bufferView']] = buf.getvalue()
    extras['cssMakeup'] = {'coach': coach, 'look': look, 'version': '1.40.3'}
    save(path, j, views)
    print(path, coach, look, 'ok', len(buf.getvalue()))


if __name__ == '__main__':
    main(*sys.argv[1:4])
