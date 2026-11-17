"""Kanya 1.48 — forme de la tête (copie du modèle d'Inaya, Inaya inchangée).
1. Chignon bas d'Inaya effacé : ses points (derrière le crâne, z 1,59-1,70) sont ramenés sur l'ellipsoïde du crâne
   ajusté sur l'arrière de la tête autour ; leur normale devient celle de l'ellipsoïde (pas d'ombre des plis).
   Le nouveau chignon haut de la planche 2 est un maillage à part (chignon.py, kanya_build.mjs).
2. Visage d'après la planche 2 (face et profil) : pommettes hautes un peu plus saillantes, mâchoire plus ferme
   (angle marqué), menton un peu plus court ; déformation douce par fonctions radiales, points fixes autour
   (yeux, bouche, oreilles, cou).
  python3 tools/generator/kanya/forme_tete.py pose.npz sortie.npz
sortie : R2, D, N2 (axes Blender) + sortie.f32 pour kanya_build.mjs (9 nombres par point, axes glTF)."""
import sys, os, numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'kadir'))
from forme import vnorm, rbf, sym

mm = 0.001
g = np.load(sys.argv[1]); R = g['R'].astype(float); T = g['tris']; Mt = g['mat']
names = list(g['Wn']); W = g['W']; hw = W[:, names.index('Head')]
D = np.zeros_like(R)

# 1. chignon bas
backz = (R[:, 2] > 1.575) & (R[:, 2] < 1.735) & (hw > 0.3)
zone = (np.abs(R[:, 0]) < 0.07) & (R[:, 2] > 1.580) & (R[:, 2] < 1.712) & (R[:, 1] > 0.090)
fit = backz & ~zone & (R[:, 1] > 0.02)
# ellipsoïde axes alignés (x-cx)^2/a^2 + ... = 1, moindres carrés linéaires sur (x^2, y^2, z^2, x, y, z)
X = R[fit]; Aq = np.stack([X[:, 0]**2, X[:, 1]**2, X[:, 2]**2, X[:, 0], X[:, 1], X[:, 2]], 1)
co = np.linalg.lstsq(Aq, np.ones(len(X)), rcond=None)[0]
c = -co[3:] / (2 * co[:3]); k = 1 + (co[3:]**2 / (4 * co[:3])).sum(); ax = np.sqrt(k / co[:3])
print('crâne : centre', c.round(4), 'demi-axes', ax.round(4))
def on_ell(p):
    d = p - c; t = 1 / np.sqrt(((d / ax) ** 2).sum(1)); return c + d * t[:, None]
q = R[zone]; inside = (((q - c) / ax) ** 2).sum(1)
out = inside > 1.0
bun = np.where(zone)[0][out]
D[bun] = on_ell(R[bun]) - R[bun]
# bord du chignon : fondu sur 6 mm pour ne pas laisser de marche
print('points du chignon ramenés', len(bun), 'écart max mm', round(float(np.linalg.norm(D[bun], axis=1).max() * 1000), 1))

# 2. visage (planche 2) : pommettes hautes, mâchoire ferme
CTRL = []
CTRL += sym((0.058, -0.035, 1.598), (1.8 * mm, -1.0 * mm, 0.5 * mm))   # pommette haute (saillante)
CTRL += sym((0.042, -0.050, 1.590), (0.8 * mm, -1.0 * mm, 0.3 * mm))   # avant de la pommette
CTRL += sym((0.050, -0.002, 1.530), (1.5 * mm, 0, -0.8 * mm))          # angle de la mâchoire, net
CTRL += sym((0.035, -0.040, 1.512), (0.7 * mm, -0.3 * mm, -0.5 * mm))  # bord de la mâchoire
CTRL += sym((0.045, -0.040, 1.560), (-0.7 * mm, 0, 0))                 # joue sous la pommette, un peu creusée
FIX = [(0.030, -0.040, 1.612), (0.030, -0.045, 1.605), (0.030, -0.045, 1.620),   # yeux et paupières
       (0.0, -0.060, 1.5475), (0.020, -0.055, 1.5475), (0.0, -0.074, 1.578), (0.0, -0.060, 1.505),  # bouche, nez, menton
       (0.075, 0.040, 1.600), (0.0, 0.040, 1.470), (0.0, -0.030, 1.460), (0.050, 0.0, 1.460),          # oreilles, cou
       (0.0, 0.040, 1.735), (0.065, 0.0, 1.665), (0.0, -0.060, 1.690), (0.040, -0.050, 1.665), (0.0, 0.150, 1.620)]
for p in FIX: CTRL += sym(p, (0, 0, 0))
src = np.array([p for p, _ in CTRL], float); dsp = np.array([d for _, d in CTRL], float)
face = (Mt >= 1)
hv = np.zeros(len(R)); hv[T[face].ravel()] = 1
fade = np.clip((R[:, 2] - 1.47) / 0.04, 0, 1) * np.clip(hw * 1.5, 0, 1)
DF = rbf(src, dsp, R) * fade[:, None]
DF[bun] = 0
D += DF
R2 = R + D
N2 = vnorm(R2, T)
dd = R2[bun] - c; nb = dd / ax**2; nb /= np.linalg.norm(nb, axis=1, keepdims=True); N2[bun] = nb
print('visage : déplacement max mm', round(float(np.abs(DF).max() * 1000), 2))
np.savez(sys.argv[2], R2=R2, D=D, N2=N2, bun=bun, crane_c=c, crane_ax=ax)
gl = lambda a: np.stack([a[:, 0], a[:, 2], -a[:, 1]], 1)
np.concatenate([gl(R), gl(D), gl(N2)], 1).astype(np.float32).tofile(sys.argv[2].replace('.npz', '.f32'))
