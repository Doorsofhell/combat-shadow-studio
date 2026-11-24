"""2.7 (option A « Un seul sélecteur »): the faces of the coach row, cut from each coach's portrait.

The portraits (public/coaches/<id>/portrait.webp, 900 x 1200, full length) are drawn at 50 px in the row: the browser
scaled a 900 x 1200 image down at every frame under the glass panel. Each face is cut once here, at 200 x 250
(the 4:5 card), from the same region the row showed (head about 43 % across, 16 % down).
Run again after a portrait changes:  python3 tools/generator/visages/visages.py
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3] / 'public' / 'coaches'
BOX = (247, 70, 527, 420)  # in the 900 x 1200 portrait

for portrait in sorted(ROOT.glob('*/portrait.webp')):
    im = Image.open(portrait).convert('RGB')
    assert im.size == (900, 1200), (portrait, im.size)
    face = im.crop(BOX).resize((200, 250), Image.LANCZOS)
    out = portrait.with_name('visage.webp')
    face.save(out, 'WEBP', quality=82, method=6)
    print(out.relative_to(ROOT.parent.parent), out.stat().st_size, 'octets')
