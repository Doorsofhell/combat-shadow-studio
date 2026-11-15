"""1.45.2 (Youssef, 2026-11-14 23:43 : « des taches sombres sur son corps… moins brun comme sur la palette source ») :
nettoie la texture du corps de Victor et ramène son teint à celui de sa planche.

Constat : la texture du corps vient de la projection des planches ; elle garde de grandes plaques sombres et grises
(fond gris de la planche, ombres projetées) et sa couleur moyenne (132, 90, 70 sur le torse) est plus sombre et plus
rousse que la peau de la planche (environ 165, 130, 115).

Méthode (séparation de fréquences) : la lumière et la couleur sont coupées en deux, le fond (flou de grand rayon) et le
détail (rapport à ce fond). Le détail (muscles, poils, tatouages, pores) est gardé tel quel ; le fond est resserré vers
le teint de la planche, ce qui efface les plaques sans lisser la peau. La tête reçoit le même gain de couleur moyen,
pondéré par la saturation (cheveux et barbe gris inchangés), pour que le cou reste raccordé.

  python3 tools/generator/victor/peau_propre.py corps_in.jpg corps_out.jpg tete_in.jpg tete_out.jpg
"""
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

body_in, body_out, head_in, head_out = sys.argv[1:5]
TARGET = np.array([168.0, 132.0, 114.0]) / 255  # peau de la planche (pectoraux, abdominaux, dos), sRGB
MID_DARK, MID_LIGHT = 0.45, 0.8  # bande moyenne gardée (assombrissements, éclaircissements)
KEEP_LOW = 0.3  # part des variations de fond gardée (0 = teint uni, 1 = inchangé)

a = np.asarray(Image.open(body_in).convert('RGB')).astype(np.float64) / 255
lin = a ** 2.2
t_lin = TARGET ** 2.2
Y = lin @ np.array([0.2126, 0.7152, 0.0722]) + 1e-4
tY = float(t_lin @ np.array([0.2126, 0.7152, 0.0722]))
s = a.shape[0] / 1024
low = gaussian_filter(Y, 18 * s)
mid = gaussian_filter(Y, 5 * s)
fine = Y / mid  # pores, poils, tatouages : gardés
band = mid / low  # plaques moyennes (taches sombres) : resserrées, surtout quand elles assombrissent
band = np.where(band < 1, band ** MID_DARK, band ** MID_LIGHT)
detail = fine * band
chroma = lin / Y[..., None]
c_low = np.stack([gaussian_filter(chroma[..., k], 28 * s) for k in range(3)], -1)
c_detail = chroma / np.maximum(c_low, 1e-4)
t_chroma = t_lin / tY
new_low = tY * (low / tY) ** KEEP_LOW
new_chroma = t_chroma * (c_low / t_chroma) ** KEEP_LOW * c_detail
out = (new_low * detail)[..., None] * new_chroma
# zones noires (sous-vêtement peint, sous les shorts) et bords très sombres : inchangés
keep = np.clip((gaussian_filter(Y, 3 * s) - 0.01) / 0.02, 0, 1)[..., None]
out = out * keep + lin * (1 - keep)
res = np.clip(out, 0, 1) ** (1 / 2.2)
Image.fromarray(np.clip(res * 255 + 0.5, 0, 255).astype(np.uint8)).save(body_out, quality=90)

# gain moyen sur la peau du corps, appliqué à la tête
skin = (keep[..., 0] > 0.99)
gain = (res[skin].mean(0) / a[skin].mean(0))
h = np.asarray(Image.open(head_in).convert('RGB')).astype(np.float64) / 255
mx, mn = h.max(2), h.min(2)
sat = np.where(mx > 1e-4, (mx - mn) / np.maximum(mx, 1e-4), 0)
w = np.clip((sat - 0.08) / 0.17, 0, 1)[..., None]
h2 = h * (1 - w) + np.clip(h * gain, 0, 1) * w
Image.fromarray(np.clip(h2 * 255 + 0.5, 0, 255).astype(np.uint8)).save(head_out, quality=86)
print('gain', gain.round(3), 'torse avant', (a[620:700, 460:560].reshape(-1, 3).mean(0) * 255).round(),
      'après', (res[620:700, 460:560].reshape(-1, 3).mean(0) * 255).round())
