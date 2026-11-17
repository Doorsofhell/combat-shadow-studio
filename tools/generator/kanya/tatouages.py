"""Kanya 1.48 — tatouages Sak Yant de la planche 3 (dos) en calques d'encre pour les textures du corps et de la tête.
Encre extraite de la planche : plus sombre que la peau autour (flou large) et peu saturée (les petites taches de la
peau, rougeâtres, sont écartées). Chaque motif est posé comme une décalcomanie (projection plane, vue de dos) à la
place mesurée sur la planche (échelle : largeur des épaules de la planche = celle du modèle) :
  - nuque : motif géométrique (yantra à flèches) ;
  - omoplate gauche : cinq colonnes d'écritures sacrées (Ha Taew) ;
  - omoplate droite : double tigre (Suea Koo) ;
  - épaules (deltoïdes, arrière) : deux colonnes d'écritures, comme sur les planches 1 et 4.
  python3 tools/generator/kanya/tatouages.py pose.npz forme.npz planche3.jpg corps.png tete.png [taille=2048]"""
import sys, os, numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter as gf
H = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(H, '..', 'kadir'))
from projection import uv_raster, sample
from forme import vnorm

pose, forme, planche, out_body, out_head = sys.argv[1:6]
size = int(sys.argv[6]) if len(sys.argv) > 6 else 2048
g = np.load(pose); T = g['tris']; UV = g['uvs']; M = g['mat']; names = list(g['Wn']); W = g['W']
P = np.load(forme)['R2']; Nv = vnorm(P, T)

a = np.asarray(Image.open(planche).convert('RGB')).astype(np.float32) / 255
L = a @ np.array([0.2126, 0.7152, 0.0722], np.float32)
mx = a.max(-1); sat = (mx - a.min(-1)) / np.maximum(mx, 1e-3)
ref = gf(L, 9)
ink = np.clip((ref - L) / np.maximum(ref, 1e-3) / 0.22, 0, 1) * np.clip((0.40 - sat) / 0.15, 0, 1)
ink = np.clip(gf(ink, 0.7) * 1.25, 0, 1)
ink[:345] = 0  # cheveux au-dessus de la nuque

MPX = float(os.environ.get('MPX', '0.000417'))  # mètres par pixel de la planche 3 (épaules 0,40 m = 960 px)

def patch(x0, y0, x1, y1):
    p = ink[y0:y1, x0:x1].copy(); h, w = p.shape
    fx = np.minimum(np.arange(w), w - 1 - np.arange(w)) / 6; fy = np.minimum(np.arange(h), h - 1 - np.arange(h)) / 6
    return p * np.clip(fx, 0, 1)[None] * np.clip(fy, 0, 1)[:, None]

# motifs (cadres en pixels de la planche) et leur centre sur la planche
MOTIFS = {
    'nuque': ((420, 350, 620, 545), (520, 450)),
    'omoplate_g': ((225, 515, 385, 840), (305, 678)),
    'omoplate_d': ((635, 525, 860, 840), (747, 683)),
}
NAPE_Z = float(os.environ.get('NAPE_Z', '1.487'))   # centre du motif de nuque sur le modèle (z, mètres)

def decal(PM, NM, VM, img, centre, u, v, n, w, h, depth=0.06):
    """img (h,w) posée sur le plan (centre, u à droite, v en haut), vue le long de -n ; renvoie l'alpha par texel"""
    idx = np.where(VM); q = PM[idx] - centre; nn = NM[idx]
    a_ = (q @ u) / w + 0.5; b_ = 0.5 - (q @ v) / h
    ok = (a_ >= 0) & (a_ < 1) & (b_ >= 0) & (b_ < 1) & ((nn @ n) > 0.25) & (np.abs(q @ n) < depth)
    out = np.zeros(VM.shape, np.float32)
    ph, pw = img.shape
    s_ = sample(img[..., None], a_[ok] * (pw - 1), b_[ok] * (ph - 1))[:, 0]
    out[idx[0][ok], idx[1][ok]] = s_ * np.clip(((nn[ok] @ n) - 0.25) / 0.3, 0, 1)
    return out

def back_y(x, z):
    s = (np.abs(P[:, 0] - x) < 0.01) & (np.abs(P[:, 2] - z) < 0.01) & (P[:, 1] > 0)
    return P[s, 1].max()

layers = {}
for mat, outf in ((0, out_body), (1, out_head)):
    PM, NM, VM = uv_raster(P, Nv, T, UV, M, mat, size)
    acc = np.zeros(VM.shape, np.float32)
    nx, ny = MOTIFS['nuque'][1]
    for k, ((x0, y0, x1, y1), (cx, cy)) in MOTIFS.items():
        img = patch(x0, y0, x1, y1)
        # position sur le dos : x à droite de l'image = gauche du modèle vu de dos -> -x (axes Blender, x = gauche du modèle)
        dx = (cx - nx) * MPX; dz = (ny - cy) * MPX
        X = -dx; Z = NAPE_Z + dz
        c = np.array([X, back_y(X, Z), Z])
        acc = np.maximum(acc, decal(PM, NM, VM, img, c, np.array([-1.0, 0, 0]), np.array([0, 0, 1.0]), np.array([0, 1.0, 0]),
                                    (x1 - x0) * MPX, (y1 - y0) * MPX))
    # épaules : deux colonnes de l'omoplate gauche, sur l'arrière des deltoïdes, dans l'axe du bras
    cols = patch(240, 515, 300, 840)
    for side, sg in (('Left', 1), ('Right', -1)):
        wa = W[:, names.index(side + 'Arm')]
        sel = wa > 0.6
        A = P[sel]; mu = A.mean(0); _, _, vt = np.linalg.svd(A - mu); axd = vt[0] * np.sign(vt[0][0] * sg)  # vers la main
        top = mu - axd * 0.06                        # haut du bras (deltoïde)
        out_dir = np.array([sg * 0.55, 0.85, 0.15]); out_dir /= np.linalg.norm(out_dir)
        cand = sel & (((P - top) @ axd) > -0.04) & (((P - top) @ axd) < 0.04)
        pt = P[cand][np.argmax(P[cand] @ out_dir)]
        vv = -axd; uu = np.cross(vv, out_dir); uu /= np.linalg.norm(uu); nn_ = np.cross(uu, vv)
        acc = np.maximum(acc, decal(PM, NM, VM, cols, pt - vv * 0.01, uu, vv, nn_, 60 * MPX * 0.9, 325 * MPX * 0.9, depth=0.03))
    layers[mat] = acc
    im = np.zeros(VM.shape + (2,), np.uint8); im[..., 1] = (np.clip(acc, 0, 1) * 255).astype(np.uint8)
    Image.fromarray(im, 'LA').save(outf)
    print(outf, 'texels encrés', int((acc > 0.3).sum()))
