"""Kadir 1.46 — compose la nouvelle texture de la tête à partir des projections (tete_proj.py) et de la texture de 1.45.
Contre les plaques sombres (leçon de Victor) : chaque planche est « délumée » avant d'être utilisée. Son éclairage de
studio est estimé sur la peau par une harmonique sphérique d'ordre 1 (luminance = a + g . normale), puis divisé :
il ne reste que la couleur propre (barbe, cheveux, carnation), sans les ombres de la planche. Le fond gris est déjà
écarté par le masque du personnage (tete_proj.py).
Peau : couleur de la planche (basse fréquence) x détail fin de la texture d'origine (pores) ; cheveux et barbe :
la planche entière (le grain des poils vient d'elle). Zones sans planche (arrière du crâne, nuque) : texture d'origine
recolorée aux teintes de la planche.
  python3 tools/generator/kadir/tete_compo.py proj.npz tete_1.45.jpg tete_sortie.jpg masques.npz"""
import sys, numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter as gf

proj, base_f, out_f, masks_f = sys.argv[1:5]
d = np.load(proj); VM = d['VM']; PM = d['PM']; NM = d['NM']
K = np.asarray(Image.open(base_f).convert('RGB')).astype(np.float32) / 255
S = K.shape[0]; s = S / 2048
lum = lambda c: c @ np.array([0.2126, 0.7152, 0.0722], np.float32)
def sat(c): mx = c.max(-1); return (mx - c.min(-1)) / np.maximum(mx, 1e-4)
z = PM[..., 2]
_vm = VM.astype(np.float32)
def nb(a, sig):
    """flou normalisé dans les îlots uv (le noir hors îlots n'assombrit pas les bords : pas de couture sombre)"""
    den = gf(_vm, sig) + 1e-6
    if a.ndim == 3: return np.stack([gf(a[..., i] * _vm, sig) / den for i in range(a.shape[2])], -1)
    return gf(a * _vm, sig) / den

def delight(c, w):
    """divise l'éclairage de la planche, estimé sur la peau (texels assez saturés, bien vus)"""
    L = lum(c) + 1e-4
    sel = (w > 0.25) & (sat(c) > 0.22) & (L > 0.08) & VM
    X = np.concatenate([np.ones((sel.sum(), 1)), NM[sel]], 1); y = L[sel]; ww = np.ones(len(y))
    for _ in range(3):
        coef = np.linalg.lstsq(X * ww[:, None], y * ww, rcond=None)[0]
        r = y / (X @ coef); ww = np.exp(-((np.log(np.maximum(r, 1e-3))) / 0.25) ** 2)  # écarte poils et reflets
    sh = np.ones_like(L); sh[VM] = np.concatenate([np.ones((VM.sum(), 1)), NM[VM]], 1) @ coef
    m = np.median(sh[sel]); sh = np.clip(sh / m, float(__import__('os').environ.get('SH_MIN', '0.7')), 1.6)  # creux (orbites) pas trop éclaircis
    print('  éclairage', np.round(coef, 3), 'peau', int(sel.sum()))
    return c / sh[..., None]

# poids par vue : le dessus ne sert que pour le crâne et le front (paupières fermées sur la planche 3)
WT = {'profil_g': 1.0, 'profil_d': 1.0, 'dessus': 0.9, 'face': 0.45, 'dos': 0.6}
C = np.zeros_like(K); W = np.zeros(K.shape[:2], np.float32)
for k, wk in WT.items():
    c = d[k + '_c']; w = d[k + '_w'] * wk
    if k == 'dessus': w = w * np.clip((z - 1.705) / 0.02, 0, 1)
    print(k); c = delight(c, w)
    C += c * w[..., None]; W += w
C /= np.maximum(W, 1e-6)[..., None]
A = np.clip(W / 0.25, 0, 1) * np.clip((z - 1.50) / 0.07, 0, 1) * VM  # couverture des planches

# carnation et cheveux visés (moyennes de la planche, délumée)
Lc = lum(C); sc = sat(C)
skin = (A > 0.9) & (sc > 0.25) & (Lc > 0.25)
hair = (A > 0.9) & (sc < 0.22) & (Lc < 0.16) & (z > 1.74)
skin_t = np.median(C[skin], 0); hair_t = np.median(C[hair], 0)
print('peau planche', (skin_t * 255).round(), 'cheveux planche', (hair_t * 255).round())

# texture d'origine recolorée (zones sans planche) : peau -> teinte de la planche ; cheveux -> châtain de la planche
LK = lum(K); sk = sat(K)
Y = PM[..., 1]
scalp = np.clip((z - 1.735) / 0.02, 0, 1) + np.clip((Y - 0.0) / 0.03, 0, 1) * np.clip((z - 1.60) / 0.03, 0, 1)  # crâne, arrière de la tête
kh = np.clip(np.maximum(np.clip((0.20 - LK) / 0.08, 0, 1) * np.clip((z - 1.70) / 0.03, 0, 1), np.clip(scalp, 0, 1)), 0, 1) * VM  # cheveux d'origine
ks = (VM & (kh < 0.1) & (sk > 0.2) & (LK > 0.2))
kmed = np.median(K[ks], 0)
# teinte visée : luminance de la peau d'origine (réglée pour l'éclairage de l'application) x couleur de la planche,
# un peu plus soutenue (la planche délumée est grisée par la lumière de studio)
SAT, DARK = float(__import__('os').environ.get('SKIN_SAT', '1.25')), float(__import__('os').environ.get('SKIN_DARK', '0.93'))
ch = skin_t / lum(skin_t); ch = 1 + (ch - 1) * SAT
skin_goal = ch * lum(kmed) * DARK
gain_s = skin_goal / kmed
kh2 = (VM & (kh > 0.9)); hmed = np.median(K[kh2], 0)
# cheveux d'origine (arrière du crâne) : châtain de la planche, contraste adouci (sinon motif de pelage)
Kh = hair_t * (np.maximum(K, 1e-3) / hmed) ** 0.55
K2 = K * gain_s * (1 - kh[..., None]) + Kh * kh[..., None]
K2 = np.where(VM[..., None], K2, K)
import json; json.dump({'gain_peau': gain_s.tolist(), 'peau_visee': skin_goal.tolist()}, open(masks_f.replace('.npz', '.json'), 'w'))
print('gain peau', gain_s.round(3))
# la planche aussi, ramenée à cette teinte (sa basse fréquence garde barbe, cheveux et rougeurs)
C = C * (skin_goal / skin_t)

# poils (cheveux + barbe) dans la planche : plus sombres que la peau et peu saturés
ref_L = lum(skin_goal); Lc = lum(C)
hairy = np.clip((ref_L * 0.82 - nb(Lc, 1.5 * s)) / (ref_L * 0.35), 0, 1) * np.clip((0.42 - gf(sc, 2 * s)) / 0.2, 0, 1)
# crâne sûr (hors front et tempes, où la ligne d'implantation vient de la planche) : cheveux partout
front = np.clip((-Y - 0.05) / 0.03, 0, 1) * np.clip((1.79 - z) / 0.03, 0, 1)
crane = np.clip(scalp, 0, 1) * (1 - front) * np.clip((z - 1.62) / 0.03, 0, 1)
hairy = np.maximum(np.clip(gf(hairy, 3 * s) * 1.25, 0, 1), crane) * A
# peau : couleur de la planche lissée x grain fin d'origine
fine = K2 / np.maximum(nb(K2, 3 * s), 1e-3)
lowC = nb(C, 3 * s)
skin_px = lowC * fine
# cheveux et barbe : le grain de la planche, contraste local adouci (reflets de studio étirés par la projection,
# lus comme un motif de pelage sous la lumière de l'application) et ramené au châtain de la planche
HC = float(__import__('os').environ.get('HAIR_CONTRAST', '0.5'))
lowH = nb(C, 8 * s)
Lh = lum(lowH)[..., None]; hg = hair_t * (skin_goal / skin_t)
lowH = lowH * 0.5 + (hg / lum(hg)) * Lh * 0.5  # teinte
lowH = np.minimum(lowH, hg * 2.2)  # pas de plaques claires dans les cheveux
CH = lowH * np.clip(C / np.maximum(nb(C, 1.5 * s), 1e-3), 0.3, 3) ** HC  # seulement le grain fin des poils (pas les touffes)
bar = np.clip((Y + 0.02) / -0.05, 0, 1) * np.clip((1.70 - z) / 0.02, 0, 1)  # barbe : contraste un peu plus franc
CH = CH * (1 - bar[..., None]) + (lowH * np.clip(C / np.maximum(lowH, 1e-3), 0.2, 3) ** 0.8) * bar[..., None]
# cheveux du crâne : grain fin de mèches pris sur la planche 3 (dessus, haute définition, mèches vers l'avant), répété en
# miroir dans l'espace uv, sur le châtain de la planche ; la ligne d'implantation et le dégradé restent ceux du masque
GR = __import__('os').environ.get('HAIR_GRAIN')
if GR:
    from PIL import Image as _I
    p3 = np.asarray(_I.open(GR).convert('L')).astype(np.float32) / 255
    patch = p3[160:420, 250:510]
    grain = patch / np.maximum(gf(patch, 6), 1e-3)
    grain = np.clip(grain, 0.3, 2.2) ** 0.85
    big = np.concatenate([grain, grain[:, ::-1]], 1); big = np.concatenate([big, big[::-1]], 0)
    reps = (S // big.shape[0] + 1, S // big.shape[1] + 1)
    G = np.tile(big, reps)[:S, :S]
    G = np.asarray(_I.fromarray(G).resize((S, S))) if G.shape[0] != S else G
    Lb = lum(lowH)[..., None]
    hair_col = hg * np.clip(Lb / lum(hg), 0.75, 1.25)  # garde un peu les variations douces de la planche
    CH2 = hair_col * G[..., None]
    k_sc = crane[..., None]  # le crâne seulement (la barbe garde la projection)
    CH = CH * (1 - k_sc) + CH2 * k_sc
# cou sous la mâchoire : la peau d'origine (la planche y a des ombres grises et vertes), la barbe de la planche par-dessus
skA = A * np.clip((z - 1.555) / 0.04, 0, 1)
out = K2 * (1 - skA[..., None]) + skin_px * skA[..., None]
hA = hairy * np.clip((z - 1.515) / 0.025, 0, 1)
out = out * (1 - hA[..., None]) + CH * hA[..., None]
# sourcils : épais et sombres sur les planches (ceux de 1.45, châtain clair, se lisaient roux) ; la forme reste celle des
# sourcils d'origine (poils plus sombres que la peau autour), recolorés au châtain foncé de la planche
sm_ = lambda a, b, v: np.clip((v - a) / (b - a), 0, 1)
X = PM[..., 0]
zone = sm_(1.692, 1.697, z) * sm_(1.714, 1.708, z) * sm_(0.008, 0.016, np.abs(X)) * sm_(0.062, 0.052, np.abs(X)) * sm_(-0.08, -0.095, Y) * VM
LK0 = lum(K); rel = LK0 / np.maximum(nb(LK0, 6 * s), 1e-3)
brow = np.clip((0.97 - rel) / 0.12, 0, 1) * zone
brow = np.clip(gf(brow, 1.0 * s) * 1.4 + 0.35 * gf(zone, 3 * s) * (gf(brow, 6 * s) > 0.05), 0, 1)
bcol = hg * 0.85 * np.clip(rel, 0.6, 1.3)[..., None] ** 1.5
out = out * (1 - 0.9 * brow[..., None]) + bcol * 0.9 * brow[..., None]
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from poils import torse
out = torse(out, PM, VM, S)
# marges des îlots uv (sinon liserés orange aux coutures et autour des oreilles) : prolongées depuis l'intérieur
from scipy import ndimage as nd
inside = VM.copy()
dist, (iy, ix) = nd.distance_transform_edt(~inside, return_indices=True)
prot = nd.binary_dilation(d['VE'], iterations=int(6 * s))  # texture des yeux protégée
grow = (~inside) & (dist < 16 * s) & (z == 0) & ~prot
out[grow] = out[iy[grow], ix[grow]]
Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)).save(out_f, quality=90)
np.savez_compressed(masks_f, hairy=hairy.astype(np.float16), A=A.astype(np.float16), kh=kh.astype(np.float16))
Image.fromarray((np.stack([hairy, A, kh], -1) * 255).astype(np.uint8)).resize((1024, 1024)).save(out_f.replace('.jpg', '-masques.png'))
print('ok')
