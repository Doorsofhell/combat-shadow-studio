"""1.43.1 (Youssef, 2026-11-14 16:42 : « un tout petit peu moins brun ») : éclaircit la peau de Victor sur les deux
textures de couleur (tête, corps), du même réglage pour que le cou reste raccordé. Seule la peau change : l'effet suit
la saturation (cheveux et barbe gris, presque sans couleur, restent comme ils sont).

  python3 tools/generator/victor/eclaircir.py entree.jpg sortie.jpg [force]
"""
import sys
import numpy as np
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
k = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
a = np.asarray(Image.open(src).convert('RGB')).astype(np.float64) / 255
mx, mn = a.max(2), a.min(2)
sat = np.where(mx > 1e-4, (mx - mn) / np.maximum(mx, 1e-4), 0)
# skin weight: 0 for grey (hair, beard), 1 from a saturation of 0.25 up
w = np.clip((sat - 0.08) / 0.17, 0, 1)[..., None] * k
lin = a ** 2.2
# lighter (+16 % light) and a little less red-brown (toward a warm light tan)
lighter = np.clip(lin * np.array([1.13, 1.18, 1.22]), 0, 1)
out = lin * (1 - w) + lighter * w
out = out ** (1 / 2.2)
grey = out.mean(2, keepdims=True)
out = out * (1 - 0.06 * w) + grey * 0.06 * w
Image.fromarray(np.clip(out * 255 + 0.5, 0, 255).astype(np.uint8)).save(dst, quality=86 if 'head' in dst else 88)
print(dst, 'peau éclaircie', round(float(w.mean()), 3))
