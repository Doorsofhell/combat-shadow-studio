"""1.10 (audit 2026-11-03, « cheveux trop contrastés », « mèches trop blanches »): the alpha cards of the MakeHuman
coaches (hair, eyebrows, eyelashes) keep, under their transparent texels, the colour the asset was painted on
(white for the hair packs). The app cuts them with alpha to coverage, so the half-transparent edge of every strand
showed that white: a bright outline round the hairline and along each lock, strongest against the skin.

This rewrites those textures inside photo.glb: the colour of the opaque texels is spread into the transparent ones
(push-pull: averages of the opaque colour over growing neighbourhoods), alpha unchanged; the edge of a strand then
fades in its own colour. Optional highlight compression for a very light hair (HAIR_TONE=0.9: the brightest
strands come down by 10 %, the darker ones are kept).

  python3 tools/generator/makehuman/alpha_bleed.py public/coaches/kaila/photo.glb [HAIR_TONE]

Pillow + numpy only; same image format and size as before (WebP quality 88, or PNG).
"""
import io
import json
import struct
import sys

import numpy as np
from PIL import Image


def push_pull(rgb, a):
    """rgb (h, w, 3) float, a (h, w) in 0..1: the colour of the opaque texels spread into the transparent ones"""
    w = (a > 0.5).astype(np.float32)
    levels = []
    c, ww = rgb * w[..., None], w
    while min(c.shape[:2]) > 1:
        levels.append((c, ww))
        h2, w2 = c.shape[0] // 2, c.shape[1] // 2
        c = c[: h2 * 2, : w2 * 2].reshape(h2, 2, w2, 2, 3).sum((1, 3))
        ww = ww[: h2 * 2, : w2 * 2].reshape(h2, 2, w2, 2).sum((1, 3))
    fill = c / np.maximum(ww, 1e-6)[..., None]
    for c, ww in reversed(levels):
        up = np.repeat(np.repeat(fill, 2, 0), 2, 1)
        up = np.pad(up, ((0, c.shape[0] - up.shape[0]), (0, c.shape[1] - up.shape[1]), (0, 0)), mode='edge')
        own = c / np.maximum(ww, 1e-6)[..., None]
        k = np.minimum(ww, 1.0)[..., None]
        fill = own * k + up * (1 - k)
    # opaque texels keep their colour; the half-transparent ones blend toward the spread colour
    t = np.clip((a - 0.15) / 0.7, 0, 1)[..., None]
    return rgb * t + fill * (1 - t)


def main(path, tone=1.0):
    b = open(path, 'rb').read()
    jl = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + jl])
    bin_ = b[20 + jl + 8:]
    views = [bytes(bin_[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']]) for v in j['bufferViews']]
    done = []
    for m in j['materials']:
        name = m.get('name', '')
        if not name.endswith('_opacity') or name.startswith('Eyes'):
            continue
        t = j['textures'][m['pbrMetallicRoughness']['baseColorTexture']['index']]
        src = t.get('source', t.get('extensions', {}).get('EXT_texture_webp', {}).get('source'))
        im = j['images'][src]
        img = Image.open(io.BytesIO(views[im['bufferView']])).convert('RGBA')
        arr = np.asarray(img).astype(np.float32) / 255
        rgb = push_pull(arr[..., :3], arr[..., 3])
        if name.startswith('Hair') and tone < 1:
            lum = rgb @ np.array([0.2126, 0.7152, 0.0722])
            k = 1 - (1 - tone) * np.clip((lum - 0.45) / 0.45, 0, 1)
            rgb = rgb * k[..., None]
        out = np.concatenate([np.clip(rgb, 0, 1), arr[..., 3:]], -1)
        o = Image.fromarray((out * 255 + 0.5).astype(np.uint8), 'RGBA')
        buf = io.BytesIO()
        if im.get('mimeType') == 'image/webp':
            o.save(buf, 'WEBP', quality=88, method=6)
        else:
            o.save(buf, 'PNG', optimize=True)
        views[im['bufferView']] = buf.getvalue()
        done.append(f'{name} {img.size[0]}px')
    # rebuild the binary chunk, views 4-byte aligned
    blob = bytearray()
    for k, v in enumerate(views):
        while len(blob) % 4:
            blob.append(0)
        j['bufferViews'][k]['byteOffset'] = len(blob)
        j['bufferViews'][k]['byteLength'] = len(v)
        blob += v
    while len(blob) % 4:
        blob.append(0)
    j['buffers'][0]['byteLength'] = len(blob)
    js = json.dumps(j, separators=(',', ':')).encode()
    js += b' ' * ((4 - len(js) % 4) % 4)
    out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(blob)) + struct.pack('<I4s', len(js), b'JSON') + js + struct.pack('<I4s', len(blob), b'BIN\0') + bytes(blob)
    open(path, 'wb').write(out)
    print(path, ', '.join(done), len(b), '->', len(out), 'octets')


if __name__ == '__main__':
    main(sys.argv[1], float(sys.argv[2]) if len(sys.argv) > 2 else 1.0)
