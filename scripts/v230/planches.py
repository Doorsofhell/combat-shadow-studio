# 2.3.0 Lot 2 : planches avant/après à partir des captures WebGL réelles (scripts/v230/captures.mjs).
# python3 scripts/v230/planches.py [docs/v230/captures/raw] [docs/v230/captures]
# Une planche par coach et par technique : ligne du haut = avant (moteur 2.2.0, ?v230=0), ligne du bas = après,
# sept colonnes = garde, anticipation, début, accélération, impact, décélération, retour. Images non retouchées.
import json, sys, os
from PIL import Image, ImageDraw, ImageFont

RAW = sys.argv[1] if len(sys.argv) > 1 else 'docs/v230/captures/raw'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'docs/v230/captures'
PHASES = ['1-garde', '2-anticipation', '3-debut', '4-acceleration', '5-impact', '6-deceleration', '7-retour']
LABEL = ['garde', 'anticipation', 'début', 'accélération', 'impact', 'décélération', 'retour']
NAME = {'mma-kadir': 'Kadir', 'mma-amara': 'Amara', 'nael': 'Naël', 'victor': 'Victor', 'inaya': 'Inaya', 'kanya': 'Kanya'}
shots = json.load(open(f'{RAW}/manifest.json'))['shots']
font = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
f = ImageFont.truetype(font, 15) if os.path.exists(font) else ImageFont.load_default()
fb = ImageFont.truetype(font.replace('Sans.ttf', 'Sans-Bold.ttf'), 18) if os.path.exists(font) else f
done = []
for coach, tech in sorted({(s['coach'], s['tech']) for s in shots}):
    rows = []
    for ver in ['avant', 'apres']:
        row = []
        for ph in PHASES:
            s = next((x for x in shots if x['coach'] == coach and x['tech'] == tech and x['version'] == ver and x['phase'] == ph), None)
            row.append((Image.open(s['file']).convert('RGB'), s['t']) if s else None)
        rows.append(row)
    if any(c is None for r in rows for c in r):
        continue
    # crop the empty margins identically on every image (union of the coach's extent)
    w, h = rows[0][0][0].size
    box = [w, h, 0, 0]
    for r in rows:
        for im, _ in r:
            g = im.convert('L').point(lambda v: 255 if v < 245 else 0)
            bb = g.getbbox()
            if bb:
                box = [min(box[0], bb[0]), min(box[1], bb[1]), max(box[2], bb[2]), max(box[3], bb[3])]
    box = [max(0, box[0] - 8), max(0, box[1] - 8), min(w, box[2] + 8), min(h, box[3] + 8)]
    cw, ch = box[2] - box[0], box[3] - box[1]
    left, top = 92, 54
    sheet = Image.new('RGB', (left + 7 * cw, top + 2 * (ch + 22)), 'white')
    d = ImageDraw.Draw(sheet)
    d.text((8, 8), f'{NAME.get(coach, coach)} · {tech} · haut : {os.environ.get('AVANT_LABEL', 'avant (2.2.0)')} · bas : {os.environ.get('APRES_LABEL', 'après (2.3.0)')} · rendus WebGL réels', fill='black', font=fb)
    for i, lab in enumerate(LABEL):
        d.text((left + i * cw + 6, 32), lab, fill='black', font=f)
    for r, (ver, row) in enumerate(zip(['avant', 'après'], rows)):
        y = top + r * (ch + 22)
        d.text((8, y + ch // 2), ver, fill='black', font=fb)
        for i, (im, t) in enumerate(row):
            sheet.paste(im.crop(box), (left + i * cw, y))
            d.text((left + i * cw + 6, y + ch + 2), f't = {t:.2f} s', fill='#555', font=f)
    path = f'{OUT}/{coach}_{tech}.jpg'
    sheet.save(path, quality=88)
    done.append(path)
print('\n'.join(done))
