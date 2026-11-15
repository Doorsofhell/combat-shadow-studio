"""Kadir 1.46 — texture de tête d'un visage greffé : le visage et le cou viennent du donneur (rocketbox/face_transfer.py),
le cuir chevelu (coupe très courte, dégradé tempes et nuque) et les oreilles viennent de la tête peinte d'après les
planches (tete_compo.py), accordés au teint du donneur.
  python3 tools/generator/kadir/greffe_tete.py donneur_head.png tete_planches.jpg masques.npz proj.npz sortie.jpg
proj.npz : PM (position 3D de repos de chaque texel, axes Blender, -y vers l'avant), VM (texels de la tête)."""
import sys, numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

don_f, pl_f, mk_f, proj_f, out_f = sys.argv[1:6]
D = np.asarray(Image.open(don_f).convert('RGB'), np.float32) / 255
P = np.asarray(Image.open(pl_f).convert('RGB').resize(D.shape[1::-1]), np.float32) / 255
mk = np.load(mk_f); hairy = mk['hairy'].astype(np.float32)
pr = np.load(proj_f); PM = pr['PM']; VM = pr['VM'].astype(bool)
x, y, z = PM[..., 0], PM[..., 1], PM[..., 2]
sm = lambda t: np.clip(t, 0, 1) ** 2 * (3 - 2 * np.clip(t, 0, 1))
# ligne d'implantation : front droit, tempes dégagées, pattes jusqu'au haut de l'oreille, nuque
HY = [-0.16, -0.10, -0.075, -0.045, -0.025, 0.0, 0.10]
HZ = [1.752, 1.750, 1.738, 1.700, 1.640, 1.600, 1.575]
zh = np.interp(y, HY, HZ)
rng = np.random.default_rng(7)
jit = gaussian_filter(rng.standard_normal(z.shape), 6) * 0.04  # ligne d'implantation un peu irrégulière
S = sm((z - zh) / 0.012 + 0.5 + jit)
# cou côté et nuque, torse : peau des planches accordée au teint (le donneur y a des traînées et des raccords)
S = np.maximum(S, sm((y + 0.02) / 0.01) * (z < 1.64))
S = np.maximum(S, sm((1.545 - z) / 0.03))
S = np.maximum(S, sm((1.585 - z) / 0.02) * sm((y + 0.07) / 0.02))  # côtés et arrière du cou : une seule source
S = np.where(VM, S, 0)
S = gaussian_filter(S, 2)
# marge autour de l'île de la tête (filtrage des textures) : même source que le bord
from scipy.ndimage import maximum_filter
S = np.where(VM, S, maximum_filter(np.where(VM, S, 0), 13))
# teint : bande du cou (sous la mâchoire, côtés) vue dans les deux textures, peau seulement
band = VM & (z > 1.54) & (z < 1.58) & (y > -0.06) & (y < 0.0) & (hairy < 0.1)
gain = np.median(D[band], 0) / np.maximum(np.median(P[band], 0), 1e-3)
print('gain teint planche -> donneur', np.round(gain, 3), 'texels', int(band.sum()))
Pg = np.clip(P * (gain * (1 - hairy[..., None]) + hairy[..., None]), 0, 1)
O = D * (1 - S[..., None]) + Pg * S[..., None]
# couture du milieu du crâne (deux îles d'UV) : près du plan x = 0, la couleur est la moyenne des deux côtés pris à
# 12 mm du milieu, la même des deux côtés de la couture
from scipy.spatial import cKDTree
hz = VM & (z > 1.70)
idx = np.argwhere(hz); tree = cKDTree(PM[hz])
near = hz & (np.abs(x) < 0.012)
q = PM[near]
cols = []
for sx in (0.012, -0.012):
    qq = q.copy(); qq[:, 0] = sx
    _, j = tree.query(qq)
    rr, cc = idx[j].T
    cols.append(gaussian_filter(O, (3, 3, 0))[rr, cc])
w = (1 - np.abs(x[near]) / 0.012)[:, None]
O[near] = O[near] * (1 - w) + 0.5 * (cols[0] + cols[1]) * w
print('couture du crâne : texels', int(near.sum()))

# barbe en collier sans moustache (mission 15/11) : lèvre supérieure et joues rasées, la barbe suit la mâchoire et
# le menton. Repères = os du visage du corps sportif (la greffe a posé les traits du donneur sur ces sommets).
import os
if os.environ.get('COLLIER', '1') == '1':
    ax = np.abs(x)
    front = sm((-0.085 - y) / 0.015)
    # moustache : du nez à la lèvre, et ses retombées aux coins de la bouche
    must = sm((z - 1.6245) / 0.0025) * sm((1.641 - z) / 0.004) * sm((0.036 - ax) / 0.006)
    corner = sm((ax - 0.026) / 0.004) * sm((0.042 - ax) / 0.006) * sm((z - 1.598) / 0.004) * sm((1.641 - z) / 0.004)
    # joues : au-dessus d'une ligne qui monte du coin de la bouche jusqu'à la patte
    zc = np.interp(y, [-0.14, -0.11, -0.08, -0.05, -0.03], [1.610, 1.608, 1.612, 1.622, 1.640])
    cheek = sm((z - zc) / 0.006) * sm((1.675 - z) / 0.006) * sm((ax - 0.022) / 0.008) * sm((-0.045 - y) / 0.008)
    R_ = np.clip(np.maximum(np.maximum(must, corner) * front, cheek), 0, 1) * VM * (1 - S)
    R_ = gaussian_filter(R_, 1.5)
    L = O @ np.array([0.3, 0.59, 0.11], np.float32)
    # peau rasée : teinte de la peau voisine (moyenne pondérée sans poils), ombre de barbe rasée très légère
    skin = VM & (S < 0.1) & (L > np.percentile(L[VM & (S < 0.1) & (z > 1.60) & (z < 1.70) & (y < -0.09)], 35)) & (z > 1.58)
    wsk = gaussian_filter(skin.astype(np.float32), 22)
    tone = gaussian_filter(O * skin[..., None], (22, 22, 0)) / np.maximum(wsk, 1e-4)[..., None]
    rng2 = np.random.default_rng(3)
    grain = gaussian_filter(rng2.standard_normal(L.shape), 0.7)
    # grain de peau : détail fin (pores) du front du donneur, recopié en miroir sur toute la texture
    fz = VM & (S < 0.05) & (z > 1.708) & (z < 1.735) & (ax < 0.03) & (y < -0.10)
    rr, cc = np.where(fz); r0, r1, c0, c1 = rr.min(), rr.max(), cc.min(), cc.max()
    Lf = L[r0:r1, c0:c1]
    hp = np.clip((Lf - gaussian_filter(Lf, 2)) / max(float(Lf.mean()), 1e-3), -0.05, 0.05)  # pores seulement, pas les rides
    tile = np.concatenate([hp, hp[:, ::-1]], 1); tile = np.concatenate([tile, tile[::-1]], 0)
    reps = (L.shape[0] // tile.shape[0] + 1, L.shape[1] // tile.shape[1] + 1)
    det = np.tile(tile, reps)[:L.shape[0], :L.shape[1]]
    shaved = tone * np.array([0.93, 0.92, 0.95], np.float32) * (1 + 1.8 * det + 0.03 * grain)[..., None]
    # bord de la lèvre : seul le poil (sombre) est retiré, le rouge de la lèvre reste
    lipband = sm((1.629 - z) / 0.004) * sm((0.032 - ax) / 0.004)
    dark = sm((np.median(L[skin]) - 0.04 - L) / 0.06)
    w = R_ * (1 - lipband * (1 - dark))
    O = O * (1 - w[..., None]) + shaved * w[..., None]
    np.save(out_f.replace('.jpg', '-rase.npy'), w.astype(np.float16))
    print('barbe en collier : texels rasés', int((w > 0.5).sum()))
# yeux bruns (iris des planches) à la place des yeux gris du corps sportif
# oreilles : la peau de l'oreille vient de la texture d'origine du corps sportif (OREILLE_SRC, oreille nette ; la
# planche y a des poils et le donneur des traînées), accordée au teint, un peu plus sombre et violacée (lutteur)
if os.environ.get('OREILLE_SRC'):
    K = np.asarray(Image.open(os.environ['OREILLE_SRC']).convert('RGB').resize(D.shape[1::-1]), np.float32) / 255
    Lk = K @ np.array([0.3, 0.59, 0.11], np.float32)
    eW = (np.abs(x) > 0.070) & (y > -0.03) & (y < 0.04) & (z > 1.62) & (z < 1.72) & VM & (Lk > 0.33)
    from scipy.ndimage import binary_opening, binary_fill_holes
    eW = binary_fill_holes(binary_opening(eW, iterations=2))
    eW = gaussian_filter(eW.astype(np.float32), 3)
    skK = VM & (z > 1.55) & (z < 1.60) & (y > -0.06) & (y < 0.0) & (hairy < 0.1)
    gk = np.median(O[skK], 0) / np.maximum(np.median(K[skK], 0), 1e-3)
    Ke = np.clip(K * gk * np.array([0.95, 0.9, 0.92], np.float32), 0, 1)
    O = O * (1 - eW[..., None]) + Ke * eW[..., None]
    print('oreilles : texels', int((eW > 0.5).sum()), 'gain', np.round(gk, 3))
H_ = O.shape[0]
O[int(H_ * 0.73):, :int(H_ * 0.34)] = P[int(H_ * 0.73):, :int(H_ * 0.34)]
Image.fromarray((O * 255 + 0.5).astype(np.uint8)).save(out_f, quality=86)
Image.fromarray((S * 255).astype(np.uint8)).resize((512, 512)).save(out_f.replace('.jpg', '-masque.png'))
import json
np.save(out_f.replace('.jpg', '-S.npy'), S.astype(np.float16))
json.dump({'gain': [float(g) for g in gain]}, open(out_f.replace('.jpg', '.json'), 'w'))
print('ok', out_f)
