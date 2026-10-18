"""Crops the rendered technique pictures around the coach (4:5 frame) and saves them as webp.
Usage: python3 scripts/dev/thumbs-webp.py <png dir with homme/ femme/> public/thumbs"""
import sys
from pathlib import Path
from PIL import Image, ImageChops

src, dst = Path(sys.argv[1]), Path(sys.argv[2])
W, H = 192, 240
for coach in ('homme', 'femme'):
    (dst / coach).mkdir(parents=True, exist_ok=True)
    for f in sorted((src / coach).glob('*.png')):
        im = Image.open(f).convert('RGB')
        diff = ImageChops.difference(im, Image.new('RGB', im.size, (255, 255, 255))).convert('L').point(lambda v: 255 if v > 12 else 0)
        box = diff.getbbox() or (0, 0, *im.size)
        x0, y0, x1, y1 = box
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        h = max((y1 - y0) * 1.1, (x1 - x0) * 1.1 * H / W)
        w = h * W / H
        crop = (int(cx - w / 2), int(cy - h / 2), int(cx + w / 2), int(cy + h / 2))
        out = Image.new('RGB', (crop[2] - crop[0], crop[3] - crop[1]), (255, 255, 255))
        out.paste(im.crop((max(0, crop[0]), max(0, crop[1]), min(im.width, crop[2]), min(im.height, crop[3]))), (max(0, -crop[0]), max(0, -crop[1])))
        out.resize((W, H), Image.LANCZOS).save(dst / coach / f'{f.stem}.webp', 'WEBP', quality=80, method=6)
        print(coach, f.stem)
