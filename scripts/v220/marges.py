"""Mesure des coutures : part des texels NOIRS dans la bande de 4 texels juste hors des îlots UV (ce que le filtrage
mélange à la peau le long des coutures), avant (textures 2.1.0) et après (2.2.0).
python3 scripts/v220/marges.py <dossier dump avant> <dossier textures après> <coach> <préfixe m021|f021>"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
D, A, coach, pre = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3], sys.argv[4]
def mask(names, size):
    im = Image.new('L', size, 0); dr = ImageDraw.Draw(im)
    for n in names:
        f = D / f'{n}.uv.bin'
        if not f.exists(): continue
        for t in np.fromfile(f, dtype=np.float32).reshape(-1, 3, 2):
            dr.polygon([(float(u * size[0]), float(v * size[1])) for u, v in t], fill=255, outline=255)
    return np.asarray(im) > 0
for part, names in (('body', [f'{pre}_body']), ('head', [f'{pre}_head', 'Eyes_opacity'])):
    src = next(p for p in D.iterdir() if p.name.startswith(f'{pre}_{part}_color.') and '.new' not in p.name)
    aft = next(p for p in A.iterdir() if p.name.startswith(f'{coach}__{pre}_{part}_color'))
    a0 = np.asarray(Image.open(src).convert('L'), np.float32); a1 = np.asarray(Image.open(aft).convert('L'), np.float32)
    m = mask(names, (a0.shape[1], a0.shape[0]))
    ring = (np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(int(sys.argv[5]) if len(sys.argv) > 5 else 9))) > 0) & ~m
    print(f'{coach} {part}: noir le long des coutures {100 * (a0[ring] < 10).mean():.1f} % → {100 * (a1[ring] < 10).mean():.1f} %')
