"""Kanya 1.48 — projette la planche 2 (face, profil et son miroir, dos) dans l'espace uv de la tête, sur la forme
de forme.py. Même méthode que Kadir 1.46 (tools/generator/kadir/projection.py).
  python3 tools/generator/kanya/tete_proj.py pose.npz forme.npz planche2.jpg sortie.npz [taille=2048]"""
import sys, os, numpy as np
from PIL import Image
from scipy import ndimage as nd
H = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(H, '..', 'kadir')); sys.path.insert(0, H)
from projection import uv_raster, project
from forme import vnorm  # tools/generator/kadir/forme.py
import reperes as rp

pose, forme, planche, out = sys.argv[1:5]
size = int(sys.argv[5]) if len(sys.argv) > 5 else 2048
g = np.load(pose); T = g['tris']; UV = g['uvs']; M = g['mat']
P = np.load(forme)['R2']; Nv = vnorm(P, T)
a = np.asarray(Image.open(planche).convert('RGB')).astype(np.float32) / 255
bg = np.median(a[540:, :].reshape(-1, 3), 0)   # fond gris uni (bas de la planche)
m = nd.binary_fill_holes(nd.binary_opening(np.linalg.norm(a - bg, axis=-1) > 0.06, iterations=2))
m = nd.binary_erosion(m, iterations=2)
al = nd.gaussian_filter(m.astype(np.float32), 1.0)
p2 = np.concatenate([a, al[..., None]], -1)
PM, NM, VM = uv_raster(P, Nv, T, UV, M, 1, size)
_, _, VE = uv_raster(P, Nv, T, UV, M, 2, size)
# texels de l'ancien chignon d'Inaya (triangles dont les trois points ont été ramenés sur le crâne) : repeints en
# cheveux unis par tete_compo.py (sinon son dessin en rosace reste visible à l'arrière de la tête)
bun = np.load(forme)['bun']; inb = np.zeros(len(P), bool); inb[bun] = True
Mb = np.where(inb[T].sum(1) >= 2, 9, M)
_, _, VB = uv_raster(P, Nv, T, UV, Mb, 9, size)
print('texels tête', int(VM.sum()))
res = {}
res['face'] = project(P, Nv, T, UV, M, PM, NM, VM, p2, rp.VUE_FACE, rp.FACE, box=rp.BOX_FACE)
res['profil_d'] = project(P, Nv, T, UV, M, PM, NM, VM, p2, rp.VUE_PROFIL, rp.PROFIL, box=rp.BOX_PROFIL)
# profil gauche : le profil droit en miroir (visage symétrique ; pas de tatouage sur la tête)
S = rp.VUE_PROFIL['size']; x0, _, x1, _ = rp.BOX_PROFIL
res['profil_g'] = project(P, Nv, T, UV, M, PM, NM, VM, p2[:, ::-1], rp.VUE_PROFIL_G,
                          [((S - s[0], s[1]), (a.shape[1] - 1 - d[0], d[1])) for s, d in rp.PROFIL],
                          box=(a.shape[1] - 1 - x1, rp.BOX_PROFIL[1], a.shape[1] - 1 - x0, rp.BOX_PROFIL[3]))
res['dos'] = project(P, Nv, T, UV, M, PM, NM, VM, p2, rp.VUE_DOS, rp.DOS, box=rp.BOX_DOS)
np.savez_compressed(out, VM=VM, VE=VE, VB=VB, PM=PM, NM=NM, **{k + '_c': v[0] for k, v in res.items()}, **{k + '_w': v[1] for k, v in res.items()})
for k, (c, w) in res.items():
    Image.fromarray((np.clip(c * np.clip(w, 0, 1)[..., None] ** 0.3, 0, 1) * 255).astype(np.uint8)).resize((1024, 1024)).save(out.replace('.npz', f'-{k}.jpg'))
print('ok')
