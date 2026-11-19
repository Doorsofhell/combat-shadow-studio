"""v2.2.0 Phase E — comparatifs avant/après à partir des captures WebGL réelles (scripts/v220/captures.mjs).

python3 scripts/v220/comparatifs.py <dossier avant> <dossier après> <dossier sortie>

Pour chaque coach et chaque vue : une image « 2.1.0 | 2.2.0 » côte à côte, mêmes pixels de capture (aucune
retouche), en JPEG. Plus une planche par coach (toutes les vues) et une planche de groupe (les six coachs de face,
de profil et en garde, avant puis après) pour juger la cohérence de la collection.
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)

A, B, O = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
COACHES = ['mma-kadir', 'nael', 'victor', 'mma-amara', 'inaya', 'kanya']
NAMES = {'mma-kadir': 'Kadir', 'nael': 'Naël', 'victor': 'Victor', 'mma-amara': 'Amara', 'inaya': 'Inaya', 'kanya': 'Kanya'}
views = sorted({p.stem.split('__')[1] for p in A.glob('*.png') if p.stem.count('__') == 1})


def pair(c, v, w=540):
    a, b = Image.open(A / f'{c}__{v}.png').convert('RGB'), Image.open(B / f'{c}__{v}.png').convert('RGB')
    h = a.height * w // a.width
    im = Image.new('RGB', (2 * w + 6, h + 26), 'white')
    im.paste(a.resize((w, h)), (0, 26))
    im.paste(b.resize((w, h)), (w + 6, 26))
    d = ImageDraw.Draw(im)
    d.text((6, 7), f'{NAMES[c]} · {v} · AVANT 2.1.0', fill='black', font=FONT)
    d.text((w + 12, 7), f'{NAMES[c]} · {v} · APRÈS 2.2.0', fill='black', font=FONT)
    return im


for c in COACHES:
    (O / c).mkdir(parents=True, exist_ok=True)
    tiles = []
    for v in views:
        if not (A / f'{c}__{v}.png').exists() or not (B / f'{c}__{v}.png').exists():
            continue
        p = pair(c, v)
        p.save(O / c / f'{v}.jpg', quality=84)
        tiles.append(p.resize((p.width // 2, p.height // 2)))
    cols = 3
    w, h = tiles[0].size
    sheet = Image.new('RGB', (w * cols, h * ((len(tiles) + cols - 1) // cols)), 'white')
    for i, t in enumerate(tiles):
        sheet.paste(t, ((i % cols) * w, (i // cols) * h))
    sheet.save(O / f'planche-{c}.jpg', quality=82)

for v in ('01-face', '02-profil-gauche', '04-dos', '09-garde'):
    w, h = 270, 360
    g = Image.new('RGB', (w * 6, (h + 22) * 2 + 4), 'white')
    d = ImageDraw.Draw(g)
    for r, (src, lab) in enumerate(((A, '2.1.0'), (B, '2.2.0'))):
        for i, c in enumerate(COACHES):
            g.paste(Image.open(src / f'{c}__{v}.png').convert('RGB').resize((w, h)), (i * w, r * (h + 24) + 22))
            d.text((i * w + 5, r * (h + 24) + 5), f'{NAMES[c]} · {lab}', fill='black', font=FONT)
    g.save(O / f'groupe-{v}.jpg', quality=84)
print('ok', len(views), 'vues')
