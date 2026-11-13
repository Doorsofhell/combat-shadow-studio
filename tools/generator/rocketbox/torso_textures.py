"""1.38: the textures of Amara's torso after torso_from_clean.py (photo.glb, in place).

  python3 tools/generator/rocketbox/torso_textures.py amara.glb amara.glb.zone.npz public/coaches/inaya/photo.glb

Verified finding (12/11, textures read from the two photo.glb): Amara's body colour still draws the bikini (dark
shadows of its edges on the chest and the back, roughly painted islands, black between the islands, which the phone's
mipmaps read as dark lines) and her normal map still holds its relief. Inaya's two body textures were cleaned in 1.19
(skin_paint.py): same photo, same layout.

Method: the texels of the cleaned zone (its triangles in the texture, widened by RING px for the photo's shadows) and
every texel outside the islands take Inaya's cleaned texture, brought to Amara's skin tone: one curve per channel,
fitted on the texels that are plain skin in both (same photo under two colour treatments: quantile matching). The
normal map takes Inaya's flat relief on the same texels. Soft edge of FEATHER px. Everything else is Amara's own texel.
"""
import sys, json, struct, io, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
PATH, ZONE, INAYA = sys.argv[1:4]
RING = int(os.environ.get('RING', '14'))
FEATHER = int(os.environ.get('FEATHER', '4'))
Q = int(os.environ.get('JPEG_Q', '93'))
QN = int(os.environ.get('JPEG_QN', '82'))  # normal maps (the shipped ones are JPEG already)


def read(path):
    b = open(path, 'rb').read()
    jl = struct.unpack_from('<I', b, 12)[0]
    j = json.loads(b[20:20 + jl])
    bl = struct.unpack_from('<I', b, 20 + jl)[0]
    return j, bytearray(b[20 + jl + 8:20 + jl + 8 + bl])


def image(j, binb, name):
    for i, im in enumerate(j['images']):
        if im.get('name') == name:
            bv = j['bufferViews'][im['bufferView']]
            o = bv.get('byteOffset', 0)
            return i, Image.open(io.BytesIO(bytes(binb[o:o + bv['byteLength']]))).convert('RGB')
    raise SystemExit('no image ' + name)


def arr(j, binb, i, dt, n):
    a = j['accessors'][i]
    bv = j['bufferViews'][a['bufferView']]
    o = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    return np.frombuffer(bytes(binb[o:o + a['count'] * n * np.dtype(dt).itemsize]), dtype=dt).reshape(-1, n)


def prim(j, suffix):
    for m in j['meshes']:
        for p in m['primitives']:
            if j['materials'][p['material']]['name'].endswith(suffix):
                return p


def raster(uv, tris, size, sel=None):
    im = Image.new('L', (size, size), 0)
    d = ImageDraw.Draw(im)
    for t in (tris if sel is None else tris[sel]):
        d.polygon([(float(uv[k, 0]) * size, float(uv[k, 1]) * size) for k in t], fill=255, outline=255)
    return im


ja, ba = read(PATH)
ji, bi = read(INAYA)
z = np.load(ZONE)
out_imgs = {}
LUT = None
for part, zkey in (('body', 'body'), ('head', 'head')):
    p = prim(ja, part)
    uv = arr(ja, ba, p['attributes']['TEXCOORD_0'], '<f4', 2)
    ct = {5123: '<u2', 5125: '<u4'}[ja['accessors'][p['indices']]['componentType']]
    tris = arr(ja, ba, p['indices'], ct, 1)[:, 0].reshape(-1, 3)
    zv = z[zkey] | z['bikini'] if part == 'body' else z[zkey]
    for kind in ('color', 'normal'):
        name = f'f021_{part}_{kind}'
        ia, A = image(ja, ba, name)
        _, I = image(ji, bi, name)
        S = A.size[0]
        I = I.resize(A.size, Image.LANCZOS)
        isl = np.asarray(raster(uv, tris, S)) > 0
        zm = raster(uv, tris, S, zv[tris].any(1)).filter(ImageFilter.MaxFilter(2 * (RING * S // 1024) + 1))
        # the head: only its neck zone (the strap is drawn there too), with the body's tone curve (Inaya's neck was
        # painted to her body's colour: it lands on Amara's body colour); its padding is left as it is
        mask = (np.asarray(zm) > 0) | (~isl if part == 'body' else False)
        a, i_ = np.asarray(A).astype(np.float32), np.asarray(I).astype(np.float32)
        if kind == 'color' and part == 'head':
            t = np.stack([LUT[i_[..., c].astype(np.uint8), c] for c in range(3)], -1)
        elif kind == 'color':
            # plain skin in both: inside the islands, away from the zone, not the black of the briefs
            ok = isl & ~mask & (a.sum(2) > 120) & (i_.sum(2) > 120)
            lut = np.zeros((256, 3), np.float32)
            qs = np.linspace(0, 100, 101)
            for c in range(3):
                lut[:, c] = np.interp(np.arange(256), np.percentile(i_[..., c][ok], qs), np.percentile(a[..., c][ok], qs))
            dark = i_.sum(2) <= 120  # the briefs stay black
            t = np.stack([lut[i_[..., c].astype(np.uint8), c] for c in range(3)], -1)
            t[dark] = i_[dark]
            err = np.abs(t[ok] - a[ok]).mean()
            LUT = lut
            print(name, 'tone curve fitted on', int(ok.sum()), 'texels, mean difference after', round(float(err), 1), '/ 255')
        else:
            t = i_
        m = np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(FEATHER * S / 1024))).astype(np.float32)[..., None] / 255
        if part == 'body':
            m = np.maximum(m, (~isl)[..., None].astype(np.float32))
        res = Image.fromarray(np.clip(a * (1 - m) + t * m, 0, 255).astype(np.uint8))
        buf = io.BytesIO()
        res.save(buf, 'JPEG', quality=Q if kind == 'color' else QN, subsampling=0 if kind == 'color' else 2)
        out_imgs[ia] = buf.getvalue()
        print(name, 'texels replaced', int(mask.sum()), 'of', S * S, '->', len(buf.getvalue()), 'bytes jpeg')

# rewrite the buffer with the new images (every other view copied as it is)
views, blobs = ja['bufferViews'], []
img_view = {im['bufferView']: k for k, im in enumerate(ja['images'])}
off = 0
for vi, bv in enumerate(views):
    o = bv.get('byteOffset', 0)
    data = bytes(ba[o:o + bv['byteLength']])
    if vi in img_view and img_view[vi] in out_imgs:
        data = out_imgs[img_view[vi]]
        ja['images'][img_view[vi]]['mimeType'] = 'image/jpeg'
    bv['byteOffset'], bv['byteLength'] = off, len(data)
    data += b'\0' * ((-len(data)) % 4)
    blobs.append(data)
    off += len(data)
data = b''.join(blobs)
ja['buffers'] = [{'byteLength': len(data)}]
js = json.dumps(ja, separators=(',', ':')).encode()
js += b' ' * ((-len(js)) % 4)
with open(PATH, 'wb') as f:
    f.write(struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(js) + 8 + len(data)))
    f.write(struct.pack('<I4s', len(js), b'JSON') + js)
    f.write(struct.pack('<I4s', len(data), b'BIN\0') + data)
print('written', PATH, os.path.getsize(PATH))
