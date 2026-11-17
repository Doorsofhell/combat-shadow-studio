"""Kanya 1.48 — chignon haut et serré de la planche 2 : maillage à part (le chignon bas d'Inaya est effacé par
forme_tete.py), lié à l'os Head (kanya_build.mjs), avec sa texture de mèches enroulées.
Placement : sur l'ellipsoïde du crâne ajustée par forme_tete.py, dans la direction mesurée sur la planche (profil :
32° de la verticale vers l'arrière ; face : dans l'axe), sa base enfoncée dans les cheveux (pas de jour).
Forme : sphère aplatie (hauteur 4,4 cm, diamètre 6,2 x 5,8 cm), sillons en spirale (mèches enroulées).
  python3 tools/generator/kanya/chignon.py forme.npz chignon.npz chignon.jpg"""
import sys, os, numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter as gf

f = np.load(sys.argv[1]); c = f['crane_c']; ax = f['crane_ax']
TH = np.radians(float(os.environ.get('BUN_ANGLE', '32')))
d = np.array([0, np.sin(TH), np.cos(TH)])          # axes Blender : +y = arrière, z = haut
t = 1 / np.sqrt(((d / ax) ** 2).sum()); surf = c + d * t
H, RX, RY = 0.022, 0.031, 0.029                    # demi-hauteur (le long de d), demi-diamètres
centre = surf + d * (0.45 * H)                     # base enfoncée d'1 cm dans les cheveux : pas de jour au contact
e1 = np.array([1.0, 0, 0]); e2 = np.cross(d, e1); e2 /= np.linalg.norm(e2)
NU, NV = 64, 32  # 1.51.0 : allégé (le fichier doit rester sous 3,5 Mo)
u = np.linspace(0, 1, NU + 1); v = np.linspace(0, 1, NV + 1)
U, V = np.meshgrid(u, v)                            # v : 0 = sommet, 1 = base
ph = 2 * np.pi * U; th = np.pi * V
# sillons en spirale : 5 tours de mèche de la base au sommet
groove = 1 - 0.07 * (0.5 + 0.5 * np.cos(2 * np.pi * (3 * U + 5 * V))) ** 2 * np.sin(th)
r = groove
x = RX * r * np.sin(th) * np.cos(ph); y = RY * r * np.sin(th) * np.sin(ph)
h = H * np.cos(th) * (1 - 0.15 * np.clip(np.cos(th), 0, 1) ** 2)   # sommet un peu aplati
h = np.where(np.cos(th) < 0, h * 0.8, h)
Pg = centre + x[..., None] * e1 + y[..., None] * e2 + h[..., None] * d
P = Pg.reshape(-1, 3); UVa = np.stack([U.ravel(), 1 - V.ravel()], 1)
idx = lambda i, j: i * (NU + 1) + j
T = []
for i in range(NV):
    for j in range(NU):
        a, b, cc, dd = idx(i, j), idx(i, j + 1), idx(i + 1, j + 1), idx(i + 1, j)
        T += [(a, dd, b), (b, dd, cc)]
T = np.array(T)
# normales sur la forme soudée (couture u=0/1 et pôles : mêmes points)
key = np.round(P / 1e-6).astype(np.int64); _, inv = np.unique(key, axis=0, return_inverse=True); inv = inv.ravel()
n = np.zeros((inv.max() + 1, 3)); fn = np.cross(P[T[:, 1]] - P[T[:, 0]], P[T[:, 2]] - P[T[:, 0]])
for k in range(3): np.add.at(n, inv[T[:, k]], fn)
N = n[inv]; N /= np.linalg.norm(N, axis=1, keepdims=True) + 1e-12
if (N * (P - centre)).sum(1).mean() < 0: T = T[:, ::-1]; N = -N
gl = lambda a: np.stack([a[:, 0], a[:, 2], -a[:, 1]], 1)
np.savez(sys.argv[2], P=gl(P).astype(np.float32), N=gl(N).astype(np.float32), UV=UVa.astype(np.float32), T=T.astype(np.uint32))
print('chignon : centre', centre.round(4), 'points', len(P), 'triangles', len(T))
# texture : mèches noires le long de la spirale, reflets doux
S = 512; rng = np.random.default_rng(7)
yy, xx = np.mgrid[0:S, 0:S] / S                    # x = u, y = 1 - v
vv = 1 - yy
phase = 3 * xx + 5 * vv
strands = np.zeros((S, S))
for k, (freq, amp) in enumerate([(60, 0.5), (140, 0.3), (310, 0.2)]):
    nz = gf(rng.standard_normal((S, S)), 2 + 3 * (2 - k), mode='wrap')
    strands += amp * np.sin(2 * np.pi * (freq * (xx * 5 - vv * 3) / 5.83 + 3 * nz))
lane = 0.5 + 0.5 * np.cos(2 * np.pi * phase)        # haut de chaque tour plus clair, creux plus sombre
L = 0.75 + 0.18 * strands + 0.35 * lane ** 3
HAIR = np.array([0.035, 0.030, 0.027]) * float(os.environ.get('HAIR_L', '1.0'))
img = np.clip(HAIR[None, None] * L[..., None] * 1.15, 0, 1)
Image.fromarray((img * 255 + 0.5).astype(np.uint8)).save(sys.argv[3], quality=92)
