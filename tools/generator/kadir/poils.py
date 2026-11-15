"""Kadir 1.46 — pilosité discrète du torse (planches 1 et 5), commune aux textures de la tête (haut de la poitrine)
et du corps, pour qu'elle passe la couture sans marche. Densité douce entre les pectoraux et sur la ligne du ventre,
grain de poils pris sur la planche 3 (mèches fines), assombrissement léger : jamais de traits dessinés."""
import os, numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter as gf

def torse(o, PM, VM, S):
    GR = os.environ.get('HAIR_GRAIN')
    if not GR or os.environ.get('POILS', '1') != '1': return o
    x, y, z = PM[..., 0], PM[..., 1], PM[..., 2]
    sm = lambda a, b, v: np.clip((v - a) / (b - a), 0, 1)
    front = sm(-0.02, -0.08, y) * VM
    chest = np.exp(-((x / 0.085) ** 2) - ((z - 1.31) / 0.07) ** 2) + 0.55 * np.exp(-((np.abs(x) - 0.07) / 0.05) ** 2 - ((z - 1.33) / 0.05) ** 2)
    line = np.exp(-(x / 0.018) ** 2) * sm(0.98, 1.05, z) * sm(1.26, 1.18, z)
    dens = np.clip((chest + 0.7 * line) * front * sm(1.47, 1.40, z), 0, 1) * float(os.environ.get('POILS_FORCE', '0.55'))
    p3 = np.asarray(Image.open(GR).convert('L')).astype(np.float32) / 255
    # grain en coordonnées du corps (projection de face, 1 px de la planche 3 ≈ 0,25 mm) : même taille de poils sur les
    # deux textures, quelle que soit leur résolution
    patch = p3[160:420, 250:510]
    gr = patch / np.maximum(gf(patch, 5), 1e-3)
    big = np.concatenate([gr, gr[:, ::-1]], 1); big = np.concatenate([big, big[::-1]], 0)
    H = big.shape[0]
    u = (x / 0.00025).astype(int) % H; v = ((1.6 - z) / 0.00025).astype(int) % H
    G = big[v, u]
    hairs = np.clip(1 - G, 0, 1) ** 1.2
    dark = 1 - dens * (0.25 + 0.55 * hairs)
    return o * dark[..., None] + (np.array([60, 45, 36], np.float32) / 255) * (1 - dark[..., None]) * 0.35
