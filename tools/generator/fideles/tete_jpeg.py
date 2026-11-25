"""tete_jpeg.py modele.glb [qualite]
2.10.2 : réenregistre la texture couleur de la tête en JPEG quand elle est en PNG (même image, 2048 px).
Cause corrigée : visage.py gardait le PNG d'origine d'Amara (2 Mo), d'où un photo.glb de 5,0 Mo pour 3,5 Mo au plus.
Affiche l'écart (PSNR) entre l'image d'avant et celle d'après. Ne touche à rien d'autre (géométrie, os, expressions)."""
import io, sys
import numpy as np
from PIL import Image
sys.path.insert(0, __import__('os').path.dirname(__file__))
from glb import Glb, save

path = sys.argv[1]; q = int(sys.argv[2]) if len(sys.argv) > 2 else 92
g = Glb(path); new = {}
for i, im in enumerate(g.j['images']):
    if 'head_color' not in im.get('name', '') or im.get('mimeType') != 'image/png':
        continue
    src = g.image('head_color')
    b = io.BytesIO(); src.save(b, 'JPEG', quality=q, subsampling=0); new[i] = b.getvalue()
    a = np.asarray(src, np.float64); c = np.asarray(Image.open(io.BytesIO(new[i])).convert('RGB'), np.float64)
    mse = ((a - c) ** 2).mean(); psnr = 10 * np.log10(255 ** 2 / mse) if mse else float('inf')
    print(f"{im['name']} : PNG -> JPEG q{q}, PSNR {psnr:.1f} dB, écart max {np.abs(a - c).max():.0f}/255")
if new:
    save(g, path, new_img=new)
print(path, 'inchangé' if not new else 'écrit')
