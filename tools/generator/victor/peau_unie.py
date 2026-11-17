"""1.53.1 (Youssef, 2026-11-15 : « encore des traces et des tâches sur le corps de Victor… une jonction plus claire
entre la tête et son buste ») : deuxième nettoyage de la peau de Victor, sur les textures DÉJÀ passées par
peau_propre.py (donnees/*.jpg). À ne passer qu'une fois.

Constat : 1) la texture du corps garde des plaques moyennes (10 à 40 px sur 1024) sombres ou grises, restes du fond
gris et des ombres des planches projetées ; peau_propre.py ne les resserrait qu'à moitié (bande 5-18 px).
2) La tête de Rocketbox porte aussi le cou et le haut de la poitrine ; sur Victor ce morceau est plus clair et plus
rose (183, 129, 105) que la poitrine du corps (≈ 155, 118, 98) : d'où la « jonction plus claire » sous le cou.

Méthode : séparation en trois bandes de la lumière (détail fin < 3 px gardé, relief musculaire 3-6 px gardé à 90 %,
plaques 6-45 px fortement resserrées, surtout quand elles assombrissent) et de la couleur (fond ramené au teint de la
peau, détail fin de couleur gardé : tatouages, poils). Les flous sont normalisés par un masque de peau pour que le
noir du sous-vêtement peint ne déborde pas. Pour la tête : la partie cou + poitrine (sous la mâchoire) reçoit le fond
de couleur et de lumière du corps, avec une transition progressive vers le visage, détail gardé.

  python3 tools/generator/victor/peau_unie.py corps_in.jpg corps_out.jpg tete_in.jpg tete_out.jpg
"""
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, label

body_in, body_out, head_in, head_out = sys.argv[1:5]
LUMA = np.array([0.2126, 0.7152, 0.0722])
SPLIT = 6         # limite relief musculaire / plaques (px sur 1024)
MUSCLE_LIGHT = 0.3  # part gardée des traits clairs de moins de 6 px
MUSCLE = 0.9      # part gardée du relief musculaire (3-6 px)
PATCH_DARK = 0.05  # part gardée des plaques sombres (6-45 px)
PATCH_LIGHT = 0.45  # part gardée des plaques claires
KEEP_LOW = 0.2    # part gardée des variations de fond (> 45 px)
CHROMA_KEEP = 0.15  # part gardée des taches de couleur (grises, rousses) > 8 px


def nblur(x, sigma, m):
    """flou normalisé par le masque m (pas de mélange avec le noir hors peau)"""
    if x.ndim == 3:
        return np.stack([nblur(x[..., k], sigma, m) for k in range(x.shape[2])], -1)
    return np.maximum(gaussian_filter(x * m, sigma) / np.maximum(gaussian_filter(m, sigma), 1e-4), 1e-4)


def to_u8(lin):
    return np.clip(np.clip(lin, 0, 1) ** (1 / 2.2) * 255 + 0.5, 0, 255).astype(np.uint8)


a = np.asarray(Image.open(body_in).convert('RGB')).astype(np.float64) / 255
lin = a ** 2.2
Y = lin @ LUMA + 1e-4
s = a.shape[0] / 1024
# peau = tout sauf le noir peint (sous-vêtement) ; bord adouci
m = np.clip((gaussian_filter(Y, 2 * s) - 0.01) / 0.02, 0, 1)
y3, y10, y45 = nblur(Y, 3 * s, m), nblur(Y, SPLIT * s, m), nblur(Y, 45 * s, m)
fine = Y / y3
muscle = y3 / y10
# traits clairs (reflets de la planche sur biceps et avant-bras) : resserrés ; creux musculaires gardés
muscle = np.where(muscle < 1, muscle ** MUSCLE, muscle ** MUSCLE_LIGHT)
patch = y10 / y45
patch = np.where(patch < 1, patch ** PATCH_DARK, patch ** PATCH_LIGHT)
skinY = float(np.median(y45[m > 0.99]))
low = skinY * (y45 / skinY) ** KEEP_LOW
# traits clairs fins (reflets de la planche, < 6 px) : tout ce qui dépasse le relief local est resserré
detail = np.where(Y / y10 > 1, (Y / y10) ** MUSCLE_LIGHT, muscle * fine)
newY = low * patch * detail
chroma = lin / Y[..., None]
c8 = nblur(chroma, 8 * s, m)
t_chroma = np.median(c8[m > 0.99], axis=0)
c_det = chroma / np.maximum(c8, 1e-4)
# les traits clairs sont aussi gris : leur écart de couleur est resserré (les tatouages, sombres, gardent le leur)
c_det = np.where((Y / y10 > 1)[..., None], c_det ** 0.2, c_det)
new_chroma = t_chroma * (c8 / t_chroma) ** CHROMA_KEEP * c_det
out = newY[..., None] * new_chroma
mm = m[..., None]
out = np.nan_to_num(out) * mm + lin * (1 - mm)
# pectoral gauche : la planche y laissait une ombre grise et des points sombres à la place du mamelon ;
# on y reporte le pectoral droit en miroir (axe du sternum mesuré : x = 514 sur 1024), bord fondu
# (même chose pour la tache rousse de l'oblique gauche, sous le pectoral)
MIRROR_X = 514
ZONES = [(432, 632, 50, 46), (420, 722, 42, 58)]  # centre x, centre y, demi-largeur, demi-hauteur (px sur 1024)
yy_b, xx_b = np.mgrid[0:a.shape[0], 0:a.shape[1]] / s
inside = np.zeros(a.shape[:2])
for cx, cy, rx, ry in ZONES:
    inside = np.maximum(inside, ((((xx_b - cx) / rx) ** 2 + ((yy_b - cy) / ry) ** 2) < 1).astype(np.float64))
wpec = gaussian_filter(inside, 6 * s)[..., None]
xm = np.clip(np.round((2 * MIRROR_X - xx_b) * s).astype(int), 0, a.shape[1] - 1)
mirrored = out[np.arange(a.shape[0])[:, None], xm]
out = mirrored * wpec + out * (1 - wpec)
Image.fromarray(to_u8(out)).save(body_out, quality=92)
body_skin = out[m > 0.99]
print('corps : teint médian', (np.median(body_skin, 0) ** (1 / 2.2) * 255).round())

# --- tête : cou + poitrine raccordés au corps
h = np.asarray(Image.open(head_in).convert('RGB')).astype(np.float64) / 255
hl = h ** 2.2
H = h.shape[0]
hs = H / 1024
hY = hl @ LUMA + 1e-4
# partie poitrine = composante connexe non noire qui contient le centre de la poitrine (512, 760 sur 1024)
nonblack = gaussian_filter(hY, 1.5 * hs) > 0.012
lab, _ = label(nonblack)
torso_id = lab[int(760 * hs), int(512 * hs)]
region = (lab == torso_id).astype(np.float64)
# rampe verticale : 0 au-dessus de la mâchoire, 1 sous le cou ; pas sur les cheveux/barbe grise (peu saturés)
yy = np.arange(H)[:, None] / hs
ramp = np.clip((yy - 470) / (600 - 470), 0, 1) * np.ones((1, H))
mx, mn = h.max(2), h.min(2)
sat = np.where(mx > 1e-4, (mx - mn) / np.maximum(mx, 1e-4), 0)
skinw = np.clip((sat - 0.12) / 0.15, 0, 1)
w = gaussian_filter(region * ramp, 6 * hs) * region
hm = region * np.clip((gaussian_filter(hY, 2 * hs) - 0.012) / 0.02, 0, 1)
h10 = nblur(hY, 10 * hs, hm)
h45 = nblur(hY, 45 * hs, hm)
hpatch = h10 / h45
hpatch = np.where(hpatch < 1, hpatch ** 0.5, hpatch ** 0.7)
bodyY = float(np.median(newY[m > 0.99]))
# vers le cou : fond de lumière égal au corps
newHY = (bodyY * (h45 / bodyY) ** KEEP_LOW) * hpatch * (hY / h10)
hch = hl / hY[..., None]
hc8 = nblur(hch, 8 * hs, hm)
newHch = t_chroma * (hc8 / t_chroma) ** CHROMA_KEEP * (hch / np.maximum(hc8, 1e-4))
target = newHY[..., None] * newHch
ww = (w * np.maximum(skinw, ramp * 0.0 + (yy > 600))).clip(0, 1)[..., None]
hout = np.nan_to_num(target) * ww + hl * (1 - ww)
Image.fromarray(to_u8(hout)).save(head_out, quality=90)
chest = (region > 0) & (yy > 650) * np.ones((1, H), bool)
print('tête : poitrine avant', (np.median(h[chest], 0) * 255).round(), 'après',
      (np.median(hout[chest], 0) ** (1 / 2.2) * 255).round())
