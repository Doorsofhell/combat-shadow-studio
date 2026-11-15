"""Kadir 1.46 — carte de normales de la tête greffée : le relief fin du visage (pores, rides, barbe) vient du donneur,
pour qu'il ne reste rien du relief de l'ancien visage ; cuir chevelu, oreilles et cou gardent la carte de la tête
peinte d'après les planches (tete_normale.py).
  python3 tools/generator/kadir/greffe_normale.py Sports_Male_01_facial.fbx DONNEUR.fbx donneur_normal.tga \
      proj.npz tete-S.npy normale_planches.jpg sortie.jpg
Chaque texel du visage : sa position de repos (proj.npz) + le déplacement de la greffe (même interpolation que
greffe_disp.py) donne un point de la tête du donneur (alignée par les yeux comme face_transfer.py) ; on y lit la
normale du donneur dans ses UV. Les têtes Rocketbox ont des UV de visage orientées de la même façon : la normale en
espace tangent se transporte telle quelle."""
import sys, numpy as np
import bpy
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
from mathutils.geometry import barycentric_transform
from PIL import Image

base_f, don_f, don_n, proj_f, S_f, pl_n, out_f = sys.argv[1:8]


def load(fbx):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=fbx)
    new = [o for o in bpy.data.objects if o not in before]
    return next(o for o in new if o.type == 'ARMATURE'), next(o for o in new if o.type == 'MESH')


def tris_of(o, mats=None):
    out = []
    for p in o.data.polygons:
        if mats is not None and p.material_index not in mats: continue
        vs = list(p.vertices); ls = list(p.loop_indices)
        for k in range(1, len(vs) - 1):
            out.append(((vs[0], vs[k], vs[k + 1]), (ls[0], ls[k], ls[k + 1])))
    return out


bpy.ops.wm.read_factory_settings(use_empty=True)
barm, bm = load(base_f)
darm, dm = load(don_f)
bw = lambda a, n: a.matrix_world @ a.data.bones[n].head_local
be = (bw(barm, 'Bip01 LEye'), bw(barm, 'Bip01 REye')); de = (bw(darm, 'Bip01 LEye'), bw(darm, 'Bip01 REye'))
s = (be[0] - be[1]).length / (de[0] - de[1]).length
A = Matrix.Translation((be[0] + be[1]) / 2) @ Matrix.Scale(s, 4) @ Matrix.Translation(-(de[0] + de[1]) / 2)
# donneur : peau de la tête seulement
dh = [i for i, m in enumerate(dm.data.materials) if m and 'head' in m.name.lower()]
DV = [A @ (dm.matrix_world @ v.co) for v in dm.data.vertices]
dt = tris_of(dm, set(dh))
dbvh = BVHTree.FromPolygons(DV, [t for t, _ in dt])
duv = dm.data.uv_layers[0].data
# base d'origine et greffe : déplacement de chaque sommet (le .blend de la greffe n'est pas nécessaire : on
# projette directement sur la tête du donneur, le point le plus proche dans la direction de la normale)
BV = [bm.matrix_world @ v.co for v in bm.data.vertices]
bt = tris_of(bm)
bbvh = BVHTree.FromPolygons(BV, [t for t, _ in bt])

pr = np.load(proj_f); PM = pr['PM']; VM = pr['VM'].astype(bool); NM = pr['NM']
S = np.load(S_f).astype(np.float32)
N0 = np.asarray(Image.open(pl_n).convert('RGB'), np.float32) / 255
Dn = np.asarray(Image.open(don_n).convert('RGB'), np.float32) / 255
H, W = Dn.shape[:2]
out = N0.copy()
# peau extérieure du visage seulement (l'intérieur de la bouche, les dents et les globes gardent leur carte)
C = np.array([0.0, -0.02, 1.66])
out_ = ((PM - C) * NM).sum(-1) / (np.linalg.norm(PM - C, axis=-1) + 1e-9)
sel = np.argwhere(VM & (S < 0.98) & (PM[..., 2] > 1.50) & (out_ > 0.3))
hit = 0
for (r, c) in sel:
    p = Vector(PM[r, c]); n = Vector(NM[r, c])
    # tête du donneur : rayon le long de la normale (dans les deux sens), sinon point le plus proche
    best = None
    for sgn in (1, -1):
        loc, nn, fi, d = dbvh.ray_cast(p - n * 0.03 * sgn, n * sgn, 0.06)
        if fi is not None and (best is None or abs(d - 0.03) < best[1]): best = (fi, abs(d - 0.03), loc)
    if best is None or best[1] > 0.025:
        loc, nn, fi, d = dbvh.find_nearest(p, 0.03)
        if fi is None: continue
        best = (fi, d, loc)
    fi, _, loc = best
    (a, b, cc), (la, lb, lc) = dt[fi]
    w = barycentric_transform(loc, DV[a], DV[b], DV[cc], Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1)))
    uv = w.x * Vector(duv[la].uv) + w.y * Vector(duv[lb].uv) + w.z * Vector(duv[lc].uv)
    x = int(uv.x % 1 * (W - 1)); y = int((1 - uv.y % 1) * (H - 1))
    k = 1 - S[r, c]
    out[r, c] = N0[r, c] * (1 - k) + Dn[y, x] * k
    hit += 1
print('texels du visage', len(sel), 'lus chez le donneur', hit)
Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)).save(out_f, quality=86)
print('ok', out_f)
