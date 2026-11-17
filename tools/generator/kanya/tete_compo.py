"""Kanya 1.48 — nouvelle texture de la tête à partir des projections de la planche 2 (tete_proj.py) et de la texture
d'Inaya (grain fin de la peau). Leçons de Victor appliquées :
- plaques sombres : chaque vue de la planche est « délumée » (éclairage de studio estimé sur la peau par une
  harmonique sphérique d'ordre 1, puis divisé), le fond gris est écarté par le masque du personnage ;
- couture tête/cou plus claire : sous la mâchoire (z < 1,53 m) la peau est celle d'Inaya multipliée par le MÊME gain
  que le corps (corps.py lit ce gain dans le .json), donc les deux textures se raccordent comme chez Inaya.
Cheveux : noirs, grain des mèches de la planche (tirées vers le chignon haut) ; crâne non vu par la planche : grain
d'Inaya assombri. Iris : brun foncé (planche).
  python3 tools/generator/kanya/tete_compo.py proj.npz tete_inaya.jpg tete_sortie.jpg masques.npz"""
import sys, os, json, numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter as gf
from scipy import ndimage as nd

proj, base_f, out_f, masks_f = sys.argv[1:5]
d = np.load(proj); VM = d['VM']; PM = d['PM']; NM = d['NM']; VE = d['VE']
K = np.asarray(Image.open(base_f).convert('RGB')).astype(np.float32) / 255
S = K.shape[0]; s = S / 2048
lum = lambda c: c @ np.array([0.2126, 0.7152, 0.0722], np.float32)
def sat(c): mx = c.max(-1); return (mx - c.min(-1)) / np.maximum(mx, 1e-4)
X, Y, z = PM[..., 0], PM[..., 1], PM[..., 2]
_vm = VM.astype(np.float32)
def nb(a, sig):
    den = gf(_vm, sig) + 1e-6
    if a.ndim == 3: return np.stack([gf(a[..., i] * _vm, sig) / den for i in range(a.shape[2])], -1)
    return gf(a * _vm, sig) / den
sm = lambda a, b, v: np.clip((v - a) / (b - a), 0, 1)

def delight(c, w):
    L = lum(c) + 1e-4
    sel = (w > 0.25) & (sat(c) > 0.18) & (L > 0.10) & VM
    Xs = np.concatenate([np.ones((sel.sum(), 1)), NM[sel]], 1); y = L[sel]; ww = np.ones(len(y))
    for _ in range(3):
        coef = np.linalg.lstsq(Xs * ww[:, None], y * ww, rcond=None)[0]
        r = y / (Xs @ coef); ww = np.exp(-((np.log(np.maximum(r, 1e-3))) / 0.25) ** 2)
    sh = np.ones_like(L); sh[VM] = np.concatenate([np.ones((VM.sum(), 1)), NM[VM]], 1) @ coef
    sh = np.clip(sh / np.median(sh[sel]), 0.7, 1.6)
    print('  éclairage', np.round(coef, 3), 'peau', int(sel.sum()))
    return c / sh[..., None]

WT = {'face': 1.0, 'profil_d': 0.8, 'profil_g': 0.8, 'dos': 0.7}
C = np.zeros_like(K); W = np.zeros(K.shape[:2], np.float32)
for k, wk in WT.items():
    c = d[k + '_c']; w = d[k + '_w'] * wk
    print(k); c = delight(c, w)
    C += c * w[..., None]; W += w
C /= np.maximum(W, 1e-6)[..., None]
A = np.clip(W / 0.2, 0, 1) * sm(1.505, 1.55, z) * VM
A = np.minimum(A, nb(A, 4 * s) * 1.0)  # bords de couverture adoucis

Lc = lum(C); sc = sat(C)
skin = (A > 0.9) & (sc > 0.2) & (Lc > 0.2) & (Y < -0.02) & (z < 1.66)
hair = (A > 0.9) & (Lc < 0.12) & (z > 1.64)
skin_t = np.median(C[skin], 0); hair_t = np.median(C[hair], 0)
print('peau planche', (skin_t * 255).round(), 'cheveux planche', (hair_t * 255).round())

# Inaya : cheveux blonds (jaunes, peu de bleu) sur le crâne
LK = lum(K); BR = K[..., 2] / np.maximum(K[..., 0], 1e-3)
face_front = sm(-0.02, -0.035, Y) * sm(1.675, 1.66, z)
kh = (VM & (BR < 0.62) & (z > 1.555)).astype(np.float32) * (1 - face_front)
kh = np.clip(gf(kh, 2 * s) * 1.3, 0, 1) * VM
ks = VM & (kh < 0.05) & (Y < -0.02) & (z > 1.53) & (z < 1.66) & (LK > 0.25)
kmed = np.median(K[ks], 0)
DARK = float(os.environ.get('SKIN_DARK', '0.80')); SAT = float(os.environ.get('SKIN_SAT', '1.15'))
ch = skin_t / lum(skin_t); ch = 1 + (ch - 1) * SAT
skin_goal = ch * lum(kmed) * DARK
gain_s = skin_goal / kmed
print('peau Inaya', (kmed * 255).round(), '-> Kanya', (skin_goal * 255).round(), 'gain', gain_s.round(3))
json.dump({'gain_peau': gain_s.tolist(), 'peau_visee': skin_goal.tolist()}, open(masks_f.replace('.npz', '.json'), 'w'))

HAIR = np.array([0.035, 0.030, 0.027], np.float32) * float(os.environ.get('HAIR_L', '1.0'))  # noir chaud (sRGB 0..1)
# base : Inaya recolorée (peau -> teinte de Kanya, cheveux -> noir avec le grain d'Inaya adouci)
fineK = K / np.maximum(nb(K, 3 * s), 1e-3)
gK = np.clip(lum(fineK), 0.4, 2.0)[..., None] ** 0.8
K2 = K * gain_s * (1 - kh[..., None]) + HAIR * (0.75 + 0.5 * gK) * kh[..., None]
K2 = np.where(VM[..., None], K2, K)

# planche ramenée à la teinte visée
Cs = C * (skin_goal / skin_t)
skin_px = nb(Cs, 2.5 * s) * np.clip(fineK, 0.6, 1.6)
# cheveux de la planche : sombres et peu saturés
hairy = np.clip((lum(skin_goal) * 0.55 - nb(lum(Cs), 1.5 * s)) / (lum(skin_goal) * 0.3), 0, 1) * np.clip((0.45 - gf(sat(Cs), 2 * s)) / 0.2, 0, 1)
# lisière : sur la nuque les cheveux descendent jusqu'à 1,53 m (planche, vue de dos) ; devant, rien sous 1,555 m (narines
# et coins de la bouche sombres ne sont pas des cheveux)
hairy = np.clip(gf(hairy, 2 * s) * 1.3, 0, 1) * np.where(Y > 0.03, sm(1.522, 1.542, z), sm(1.555, 1.585, z))
grainP = np.clip(lum(C) / np.maximum(nb(lum(C), 2 * s), 1e-3), 0.4, 2.2)[..., None]
CH = HAIR * (0.55 + 0.45 * nb(np.clip(lum(Cs) / max(float(lum(hair_t * skin_goal / skin_t)), 1e-3), 0.3, 3), 4 * s)[..., None]) * grainP ** 0.7 * gK ** 0.35
# Victor : plaques plus sombres ou plus claires venues de l'éclairage de la planche. Ici la luminance très basse
# fréquence de la peau projetée (flou de 40 px) est ramenée vers celle de la peau visée : il reste les traits
# (sourcils, lèvres, plis), plus de plaques ni de front blanchi
# (moyenne prise sur la peau seulement : les cheveux sombres n'y entrent pas, sinon la lisière s'éclaircit et verdit)
sk_w = np.clip(1 - hairy * 1.5, 0, 1) * _vm
Ls = lum(skin_px); SIG = float(os.environ.get('SKIN_EQ_SIG', '30')) * s
Llow = gf(Ls * sk_w, SIG) / (gf(sk_w, SIG) + 1e-4)
EQ = float(os.environ.get('SKIN_EQ', '0.9'))
skin_px = skin_px * np.clip((lum(skin_goal) / np.maximum(Llow, 1e-3)) ** EQ, 0.75, 1.35)[..., None]
# teinte : même idée pour la chrominance (front grisé, joues rougies par la planche) ramenée vers celle de la peau visée
CQ = float(os.environ.get('SKIN_CQ', '0.6'))
lowc = np.stack([gf(skin_px[..., i] * sk_w, SIG) for i in range(3)], -1) / (gf(sk_w, SIG) + 1e-4)[..., None]
chl = lowc / np.maximum(lum(lowc), 1e-3)[..., None]; chg = skin_goal / lum(skin_goal)
skin_px = skin_px * np.clip((chg / np.maximum(chl, 1e-3)) ** CQ, 0.8, 1.25)
CH = np.minimum(CH, HAIR * 1.6)  # pas de reflets blancs étirés (planche) dans les cheveux
out = K2 * (1 - A[..., None]) + skin_px * A[..., None]
hA = hairy * A
out = out * (1 - hA[..., None]) + CH * hA[..., None]
# ancien chignon d'Inaya : cheveux unis (grain fin seulement)
if 'VB' in d.files:
    VB = gf(d['VB'].astype(np.float32), 2 * s)
    flat = HAIR * (0.85 + 0.3 * np.clip(gK, 0.5, 1.5) ** 0.5)
    out = out * (1 - VB[..., None]) + flat * VB[..., None]
# tatouage de nuque (tatouages.py), partie dans la texture de la tête
TAT = os.environ.get('TATOUAGES')
if TAT:
    ta = np.asarray(Image.open(TAT).convert('LA').resize((S, S))).astype(np.float32)[..., 1:2] / 255 * 0.85
    inkc = np.array([0.10, 0.11, 0.14], np.float32)
    out = out * (1 - ta) + (out * 0.35 + inkc * 0.65) * ta
# yeux : iris brun foncé (planche). L'iris d'Inaya est un disque (centre et rayon mesurés sur la texture, 2048 px) ;
# le reflet peint et la pupille gardent leur luminance
ey, ex = np.mgrid[0:S, 0:S]; rr = np.hypot(ex - 540 * s, ey - 1908 * s) / s
irisM = np.clip((40 - rr) / 3, 0, 1) * VE
rel = np.clip(LK / max(float(np.median(LK[(rr > 14) & (rr < 36)])), 1e-3), 0.2, 3.0)[..., None]
brown = np.array([0.16, 0.095, 0.055], np.float32) * rel ** 1.1
spec = np.clip((LK - 0.75) / 0.15, 0, 1)[..., None]  # reflet peint gardé
brown = brown * (1 - spec) + K * spec
out = np.where(VE[..., None], K * (1 - irisM[..., None]) + brown * irisM[..., None], out)
# marges des îlots uv prolongées depuis l'intérieur (pas de liseré aux coutures)
inside = VM | VE
dist, (iy, ix) = nd.distance_transform_edt(~inside, return_indices=True)
grow = (~inside) & (dist < 16 * s)
out[grow] = out[iy[grow], ix[grow]]
Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)).save(out_f, quality=88)
# carte de relief de la tête : l'ancien chignon aplati (son relief en rosace se voyait encore)
NRM = os.environ.get('NORMALE_SRC')
if NRM and 'VB' in d.files:
    nm_ = np.asarray(Image.open(NRM).convert('RGB')).astype(np.float32)
    vb = gf(d['VB'].astype(np.float32), 3 * s)[..., None]
    nm_ = nm_ * (1 - vb) + np.array([128, 128, 255], np.float32) * vb
    Image.fromarray(nm_.clip(0, 255).astype(np.uint8)).save(out_f.replace('.jpg', '-normale.jpg'), quality=82)
np.savez_compressed(masks_f, hairy=hairy.astype(np.float16), A=A.astype(np.float16), kh=kh.astype(np.float16))
Image.fromarray((np.stack([hairy, A, kh], -1) * 255).astype(np.uint8)).resize((1024, 1024)).save(out_f.replace('.jpg', '-masques.png'))
print('ok')
