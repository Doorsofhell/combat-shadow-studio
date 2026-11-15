"""Kadir 1.46 — forme de la tête d'après les planches 4 (profil gauche) et 5 (face), sans toucher au corps.
Constat (mesures sur le maillage de 1.45, rendu orthographique superposé à la planche 4) : le crâne et la carrure
correspondent déjà ; l'écart est dans le bas du visage et le profil : nez plus projeté et retroussé que la planche
(dos du nez creusé à la racine), arcade sourcilière sans relief, menton fuyant et court, angle de la mâchoire arrondi.

Méthode : déformation douce (fonctions radiales 3D, noyau r) entre des points de repère du visage et leurs cibles,
avec des points fixes (yeux, oreilles, crâne, cou) pour que rien d'autre ne bouge. Le même déplacement s'applique
aux 25 expressions (victor_build.mjs) : elles restent celles de Kadir. Volume des cheveux et de la barbe : poussée
le long de la normale, là où les nouvelles textures sont cheveux ou barbe (masques en paramètres).

  python3 tools/generator/kadir/forme.py pose.npz sortie.npz [masques.npz]
sortie : R2 (positions nouvelles), D (déplacements), N2 (normales), axes Blender."""
import sys, numpy as np

def vnorm(P, T):
    n = np.zeros_like(P); f = np.cross(P[T[:, 1]] - P[T[:, 0]], P[T[:, 2]] - P[T[:, 0]])
    for k in range(3): np.add.at(n, T[:, k], f)
    return n / (np.linalg.norm(n, axis=1, keepdims=True) + 1e-12)

def rbf(src, dsp, Q):
    n = len(src); K = np.linalg.norm(src[:, None] - src[None], axis=-1)
    A = np.zeros((n + 4, n + 4)); A[:n, :n] = K + 1e-9 * np.eye(n); A[:n, n] = 1; A[:n, n + 1:] = src; A[n, :n] = 1; A[n + 1:, :n] = src.T
    Y = np.zeros((n + 4, 3)); Y[:n] = dsp; c = np.linalg.solve(A, Y)
    out = np.zeros((len(Q), 3))
    for i in range(0, len(Q), 4000):
        q = Q[i:i + 4000]; out[i:i + 4000] = np.linalg.norm(q[:, None] - src[None], axis=-1) @ c[:n] + c[n] + q @ c[n + 1:]
    return out

mm = 0.001
# (point, déplacement) en mètres, axes Blender (x gauche du modèle, -y = vers l'avant, z haut)
def sym(p, d):
    return [(p, d), ((-p[0], p[1], p[2]), (-d[0], d[1], d[2]))] if p[0] else [(p, d)]
CTRL = []
CTRL += sym((0, -0.130, 1.580), (0, -4.0 * mm, -3.0 * mm))    # menton (avant)
CTRL += sym((0, -0.100, 1.556), (0, -2.0 * mm, -4.0 * mm))    # dessous du menton
CTRL += sym((0.025, -0.115, 1.565), (1.0 * mm, -3.0 * mm, -3.5 * mm))  # menton large, carré
CTRL += sym((0.045, -0.060, 1.552), (1.5 * mm, 0, -3.0 * mm))  # dessous de la mâchoire
CTRL += sym((0.056, -0.030, 1.572), (2.5 * mm, 0, -2.0 * mm))  # angle de la mâchoire
CTRL += sym((0, -0.1345, 1.600), (0, -1.0 * mm, -1.0 * mm))   # lèvre inférieure
CTRL += sym((0, -0.153, 1.648), (0, 2.0 * mm, -2.5 * mm))     # pointe du nez
CTRL += sym((0, -0.143, 1.670), (0, 0.6 * mm, 0))             # dos du nez
CTRL += sym((0, -0.128, 1.700), (0, -1.8 * mm, 0))            # racine du nez
CTRL += sym((0, -0.1275, 1.712), (0, -2.4 * mm, 0))           # glabelle
CTRL += sym((0.024, -0.120, 1.716), (0, -2.4 * mm, -0.5 * mm))  # arcade
CTRL += sym((0.045, -0.108, 1.714), (0.3 * mm, -1.8 * mm, -0.5 * mm))  # arcade externe
FIX = [(0.032, -0.105, 1.690), (0.032, -0.118, 1.683), (0.032, -0.118, 1.697),  # yeux et paupières
       (0.075, 0.0, 1.670), (0.0, 0.0, 1.805), (0.0, 0.085, 1.680), (0.0, 0.06, 1.56), (0.06, 0.03, 1.74),
       (0.0, 0.0, 1.50), (0.0, -0.07, 1.505), (0.05, 0.0, 1.505), (0.062, -0.075, 1.655), (0.05, -0.10, 1.64),
       (0.0, -0.10, 1.78), (0.04, -0.10, 1.76), (0.066, -0.04, 1.70)]
for p in FIX:
    CTRL += sym(p, (0, 0, 0))

if __name__ == '__main__':
    g = np.load(sys.argv[1]); R = g['R'].astype(float); T = g['tris']; Mt = g['mat']
    names = list(g['Wn']); W = g['W']
    hw = W[:, names.index('Head')] + (g['HW'] if 'HW' in g.files else 0)
    head = np.zeros(len(R)); head[T[Mt >= 1].ravel()] = 1
    fade = np.clip((R[:, 2] - 1.50) / 0.04, 0, 1)
    src = np.array([p for p, _ in CTRL], float); dsp = np.array([d for _, d in CTRL], float)
    D = rbf(src, dsp, R) * fade[:, None]
    if len(sys.argv) > 3:
        mk = np.load(sys.argv[3]); N0 = vnorm(R, T)
        D += N0 * mk['push'][:, None]
        print('poussée max mm', round(float(mk['push'].max() * 1000), 1))
    R2 = R + D
    print('déplacement max mm', round(float(np.abs(D).max() * 1000), 2), 'points bougés', int((np.linalg.norm(D, axis=1) > 2e-4).sum()))
    N2 = vnorm(R2, T)
    np.savez(sys.argv[2], R2=R2, D=D, N2=N2)
    # fichier de déplacements pour kadir_build.mjs : 9 nombres par point (position d'origine, déplacement, normale),
    # axes glTF (x, z, -y), mètres
    gl = lambda a: np.stack([a[:, 0], a[:, 2], -a[:, 1]], 1)
    np.concatenate([gl(R), gl(D), gl(N2)], 1).astype(np.float32).tofile(sys.argv[2].replace('.npz', '.f32'))
