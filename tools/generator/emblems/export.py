"""
Exports the detailed discipline emblems (variant A) for the app.

    python3 tools/generator/emblems/export.py RENDER_DIR

RENDER_DIR holds the 512 px transparent PNGs written by render.py. Each one is cropped to its object (the soft
contact shadow kept), centred on a square with a small margin, then saved as WebP with alpha in public/emblems/:
<id>-256.webp (128 px on 2x screens), <id>-128.webp, <id>-64.webp. Below 64 px the app uses the vector variants.
"""
import sys
from pathlib import Path

from PIL import Image

IDS = ['boxe', 'kickboxing', 'mma', 'muaythai', 'bjj', 'judo']
SIZES = (256, 128, 64)
OUT = Path(__file__).resolve().parents[3] / 'public' / 'emblems'


def square(im, margin=0.06):
    a = im.getchannel('A').point(lambda v: 255 if v > 40 else 0)
    box = a.getbbox()
    im = im.crop(box)
    side = int(max(im.size) * (1 + 2 * margin))
    sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    sq.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
    return sq


def main():
    src = Path(sys.argv[1])
    OUT.mkdir(parents=True, exist_ok=True)
    for d in IDS:
        sq = square(Image.open(src / f'{d}.png').convert('RGBA'))
        for n in SIZES:
            p = OUT / f'{d}-{n}.webp'
            sq.resize((n, n), Image.LANCZOS).save(p, 'WEBP', quality=88, method=6)
            print(p.name, p.stat().st_size)


if __name__ == '__main__':
    main()
