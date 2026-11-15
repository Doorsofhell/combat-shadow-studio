"""Kadir 1.46 — projette les planches 3, 4 (et son miroir) et 5 dans l'espace uv de la tête.
  python3 tools/generator/kadir/tete_proj.py pose.npz forme.npz dossier_planches sortie.npz [taille=2048]"""
import sys, numpy as np
from PIL import Image
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from projection import uv_raster, project
from forme import vnorm
import reperes as rp

pose, forme, dossier, out = sys.argv[1:5]
size = int(sys.argv[5]) if len(sys.argv) > 5 else 2048
g = np.load(pose); T = g['tris']; UV = g['uvs']; M = g['mat']
P = np.load(forme)['R2'] if forme != '-' else g['R']
Nv = vnorm(P, T)
from scipy import ndimage as nd
def ld(n):
    # planche + masque du personnage (fond gris uni retiré, bord rétréci de 3 px : pas de liseré gris)
    a = np.asarray(Image.open(f'{dossier}/{n}').convert('RGB')).astype(np.float32) / 255
    bg = np.median(a[:, :30].reshape(-1, 3), 0)
    m = nd.binary_fill_holes(nd.binary_opening(np.linalg.norm(a - bg, axis=-1) > 0.07, iterations=2))
    m = nd.binary_erosion(m, iterations=3)
    al = nd.gaussian_filter(m.astype(np.float32), 1.5)
    return np.concatenate([a, al[..., None]], -1)
p3, p4, p5 = ld('planche3-tete-dessus.jpg'), ld('planche4-tete-profil.jpg'), ld('planche5-buste-7vues.jpg')
PM, NM, VM = uv_raster(P, Nv, T, UV, M, 1, size)
print('texels tête', int(VM.sum()))
_, _, VE = uv_raster(P, Nv, T, UV, M, 2, size)  # yeux : même texture, jamais touchés
res = {}
res['profil_g'] = project(P, Nv, T, UV, M, PM, NM, VM, p4, rp.VUE_PROFIL, rp.PROFIL)
res['profil_d'] = project(P, Nv, T, UV, M, PM, NM, VM, p4, rp.VUE_PROFIL_D, [((765 - a[0], a[1]), b) for a, b in rp.PROFIL])
res['dessus'] = project(P, Nv, T, UV, M, PM, NM, VM, p3, rp.VUE_DESSUS, rp.DESSUS)
res['face'] = project(P, Nv, T, UV, M, PM, NM, VM, p5, rp.VUE_FACE, rp.FACE, box=(8, 60, 196, 300))
res['dos'] = project(P, Nv, T, UV, M, PM, NM, VM, p5, rp.VUE_DOS, rp.DOS, box=(432, 60, 612, 300))
np.savez_compressed(out, VM=VM, VE=VE, PM=PM, NM=NM, **{k + '_c': v[0] for k, v in res.items()}, **{k + '_w': v[1] for k, v in res.items()})
for k, (c, w) in res.items():
    Image.fromarray((np.clip(c, 0, 1) * 255).astype(np.uint8)).resize((1024, 1024)).save(out.replace('.npz', f'-{k}.jpg'))
print('ok')
