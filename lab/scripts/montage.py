import sys, os
from PIL import Image, ImageDraw, ImageFont
# side-by-side sheets: one row per capture, columns A (Three.js), B (Babylon.js), A encre
d = sys.argv[1]; out = sys.argv[2]
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22) if os.path.exists('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf') else ImageFont.load_default()
tags = sorted({f.rsplit('-three', 1)[0] for f in os.listdir(d) if f.endswith('-three.png')})
crop = (100, 180, 620, 1180); W, H = 260, 500
cols = [('three', 'A · Three.js (réaliste)'), ('babylon', 'B · Babylon.js (réaliste)'), ('three-encre', 'A · Three.js (Encre)')]
for coach in ('homme', 'femme'):
    ts = [t for t in tags if t.startswith(coach)]
    sheet = Image.new('RGB', (W * 3 + 180, H * len(ts) + 40), 'white'); dr = ImageDraw.Draw(sheet)
    for j, (_, lab) in enumerate(cols): dr.text((180 + j * W + 6, 8), lab, fill='black', font=ImageFont.truetype(font.path, 15) if hasattr(font, 'path') else font)
    for i, t in enumerate(ts):
        dr.text((6, 40 + i * H + H // 2), t.replace(coach + '-', ''), fill='black', font=ImageFont.truetype(font.path, 16) if hasattr(font, 'path') else font)
        for j, (suf, _) in enumerate(cols):
            im = Image.open(f'{d}/{t}-{suf}.png').crop(crop).resize((W, H))
            sheet.paste(im, (180 + j * W, 40 + i * H))
    sheet.save(f'{out}/planche-{coach}.png')
    print(f'{out}/planche-{coach}.png', sheet.size)
