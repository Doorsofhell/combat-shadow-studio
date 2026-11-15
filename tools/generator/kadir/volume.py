"""Kadir 1.46 — volume des cheveux et de la barbe (planches 3 et 4 : coupe courte avec du volume sur le dessus et
vers l'avant, dégradé sur les tempes et la nuque ; barbe de quelques jours qui épaissit un peu le menton).
Épaisseur par point, lue dans le masque des poils de la nouvelle texture (tete_compo.py), poussée le long de la
normale par forme.py.
  python3 tools/generator/kadir/volume.py pose.npz masques.npz sortie_volume.npz"""
import sys, numpy as np
pose, mk, out = sys.argv[1:4]
g = np.load(pose); R = g['R']; T = g['tris']; UV = g['uvs']; M = g['mat']
m = np.load(mk); hairy = m['hairy'].astype(np.float32); S = hairy.shape[0]
vu = np.zeros((len(R), 2)); c = np.zeros(len(R))
for k in range(3):
    s = M == 1; np.add.at(vu, T[s, k], UV[s, k]); np.add.at(c, T[s, k], 1)
h = c > 0; vu[h] /= c[h, None]
px = np.clip((vu[:, 0] * S).astype(int), 0, S - 1); py = np.clip(((1 - vu[:, 1]) * S).astype(int), 0, S - 1)
hv = np.where(h, hairy[py, px], 0)
x, y, z = R[:, 0], R[:, 1], R[:, 2]
sm = lambda a, b, v: np.clip((v - a) / (b - a), 0, 1)
crane = sm(1.70, 1.74, z)
top = 0.004 + 0.007 * sm(1.72, 1.79, z) + 0.003 * sm(-0.02, -0.08, y) * sm(1.74, 1.78, z)  # dessus, mèche avant
top *= 1 - 0.55 * sm(0.055, 0.075, np.abs(x)) * sm(1.76, 1.70, z)  # tempes : dégradé court
top *= 1 - 0.6 * sm(1.70, 1.62, z)  # nuque : dégradé
beard = 0.0018 * sm(1.70, 1.66, z) * sm(-0.03, -0.07, y)
th = np.where(z > 1.66, top * np.maximum(crane, 0.3), beard) * hv
# lissage sur les voisins (pas de marche au bord du masque)
E = np.concatenate([T[:, [0, 1]], T[:, [1, 2]], T[:, [2, 0]]])
for _ in range(8):
    acc = np.zeros(len(R)); n = np.zeros(len(R)); np.add.at(acc, E[:, 0], th[E[:, 1]]); np.add.at(acc, E[:, 1], th[E[:, 0]])
    np.add.at(n, E[:, 0], 1); np.add.at(n, E[:, 1], 1); th = (th + acc) / (1 + n)
print('épaisseur max mm', round(float(th.max() * 1000), 1), 'points', int((th > 2e-4).sum()))
np.savez(out, push=th)
