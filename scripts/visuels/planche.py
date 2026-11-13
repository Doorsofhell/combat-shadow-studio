"""Contact sheets of the studio visuals, for checking every pose by eye (are they human and realistic?).
python3 -I scripts/visuels/planche.py <out.jpg> <file or dir>... [--cols 10] [--h 300]
Each picture is labelled with its file name; directories are taken in alphabetical order."""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

args = sys.argv[1:]
cols = int(args[args.index('--cols') + 1]) if '--cols' in args else 10
cell_h = int(args[args.index('--h') + 1]) if '--h' in args else 300
skip = {i for i, a in enumerate(args) if a in ('--cols', '--h')} | {i + 1 for i, a in enumerate(args) if a in ('--cols', '--h')}
paths = [a for i, a in enumerate(args) if i not in skip]
out, srcs = paths[0], []
for p in map(Path, paths[1:]):
    srcs += sorted(p.glob('*.webp')) + sorted(p.glob('*.png')) if p.is_dir() else [p]
ims = [Image.open(p).convert('RGB') for p in srcs]
cell_w = max(round(im.width * cell_h / im.height) for im in ims)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * cell_w, rows * (cell_h + 18)), (20, 20, 24))
d = ImageDraw.Draw(sheet)
for i, (p, im) in enumerate(zip(srcs, ims)):
    x, y = (i % cols) * cell_w, (i // cols) * (cell_h + 18)
    t = im.resize((round(im.width * cell_h / im.height), cell_h), Image.LANCZOS)
    sheet.paste(t, (x + (cell_w - t.width) // 2, y))
    d.text((x + 4, y + cell_h + 3), p.stem[:34], fill=(220, 220, 220))
sheet.save(out, quality=85)
print(out, len(ims))
