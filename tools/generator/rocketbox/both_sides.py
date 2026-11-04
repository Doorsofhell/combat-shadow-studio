"""1.12: marks the body skin of a sports woman's photo.glb to be drawn from both sides (material extras, in place).

  python3 tools/generator/rocketbox/both_sides.py public/coaches/inaya/photo.glb

Verified finding (Youssef's photo of Inaya from above, 04/11, lab close-ups with the head painted green and the body
red): the halter top of Sports_Female_01 is a part of the body surface whose straps stand off the skin; the head's
skin rises under them to meet their outer edge (the seam is exact: 132 points of 132). Seen from above or behind, the
eye looks into that fold, whose inner wall faces away and is not drawn, so the background shows through: thin white
(on the phone, dark blue) slits along the straps at the neck and the shoulders. Moving the straps onto the skin turned
150 to 280 triangles over, deleting them opened real holes (both tried, dropped). Drawn from both sides
(photoMaterials.ts reads `bothSides`), the fold's inner wall closes the slit.
"""
import sys, json, struct

path = sys.argv[1]
raw = open(path, 'rb').read()
jl = struct.unpack('<I', raw[12:16])[0]
J = json.loads(raw[20:20 + jl])
n = 0
for m in J['materials']:
    if m['name'].endswith('_body'):
        m.setdefault('extras', {})['bothSides'] = True
        n += 1
js = json.dumps(J, separators=(',', ':')).encode()
js += b' ' * ((4 - len(js) % 4) % 4)
rest = raw[20 + jl:]
open(path, 'wb').write(b'glTF' + struct.pack('<II', 2, 12 + 8 + len(js) + len(rest)) + struct.pack('<I', len(js)) + b'JSON' + js + rest)
print(path, 'peau du corps dessinée des deux côtés :', n, 'matériau')
