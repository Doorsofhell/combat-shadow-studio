"""Planche contact : python3 scripts/v220/planche.py <dossier> <coach> <sortie.jpg> [vues,...] [largeur vignette]"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw
d, coach, out = Path(sys.argv[1]), sys.argv[2], sys.argv[3]
views = sys.argv[4].split(',') if len(sys.argv) > 4 and sys.argv[4] else sorted({p.stem.split('__')[1] for p in d.glob(f'{coach}__*.png')})
w = int(sys.argv[5]) if len(sys.argv) > 5 else 270
h = w * 4 // 3
cols = min(5, len(views))
rows = (len(views) + cols - 1) // cols
sheet = Image.new('RGB', (w * cols, (h + 18) * rows), 'white')
dr = ImageDraw.Draw(sheet)
for i, v in enumerate(views):
    p = d / f'{coach}__{v}.png'
    x, y = (i % cols) * w, (i // cols) * (h + 18)
    if p.exists():
        sheet.paste(Image.open(p).convert('RGB').resize((w, h)), (x, y + 18))
    dr.text((x + 4, y + 3), f'{coach} · {v}', fill='black')
sheet.save(out, quality=88)
