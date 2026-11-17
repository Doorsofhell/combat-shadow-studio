"""Kadir 1.46 — réalisme du Kadir existant (Youssef 15/11 : « propose-moi juste des améliorations physiques pour plus
de réalisme du Kadir existant »). Même visage, même forme, mêmes tenues ; seules les textures et un léger volume de
cheveux changent.
  python3 tools/generator/kadir/realisme.py k0_dir proj.npz body_uv.npz pose.npz sortie_dir
k0_dir : textures d'origine (m021_head_color.jpg, m021_head_normal.jpg, m021_body_color.jpg, m021_body_normal.jpg).
Écrit tete.jpg, normale.jpg, corps.jpg, rugosite.jpg et disp.f32 (volume des cheveux) dans sortie_dir.
Chaque amélioration a sa variable (1 par défaut) : TEINT, RELIEF, RACCORDS, CHEVEUX, CALECON, PEAU_MATE."""
import os, sys, numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, distance_transform_edt

k0, proj_f, buv_f, pose_f, out = sys.argv[1:6]
os.makedirs(out, exist_ok=True)
on = lambda k: os.environ.get(k, '1') == '1'
rd = lambda f: np.asarray(Image.open(os.path.join(k0, f)).convert('RGB'), np.float32) / 255
sm = lambda t: np.clip(t, 0, 1) ** 2 * (3 - 2 * np.clip(t, 0, 1))
LUM = np.array([0.3, 0.59, 0.11], np.float32)

H, HN, B, BN = rd('m021_head_color.jpg'), rd('m021_head_normal.jpg'), rd('m021_body_color.jpg'), rd('m021_body_normal.jpg')
pr = np.load(proj_f); PM = pr['PM']; VM = pr['VM'].astype(bool)
x, y, z = PM[..., 0], PM[..., 1], PM[..., 2]
bu = np.load(buv_f); BVM = bu['VM'].astype(bool); BZ = bu['PM'][..., 2]


def gutter(img, vm, px):
    """marge des îles : chaque texel hors île prend la couleur du texel de l'île le plus proche (filtrage des textures :
    sinon la couleur de fond des marges remonte en liseré clair aux coutures)"""
    d, (ir, ic) = distance_transform_edt(~vm, return_indices=True)
    g = (~vm) & (d <= px)
    o = img.copy(); o[g] = img[ir[g], ic[g]]
    return o


LH = H @ LUM
hair = VM & (LH < 0.32) & ((z > 1.70) | (y > -0.02))          # cheveux peints (sombres, crâne et nuque)
skinH = VM & ~hair
# 1. teint : légèrement hâlé, moins rosé ; un peu plus de rouge au nez, aux pommettes et aux oreilles
if on('TEINT'):
    g = np.array([0.95, 0.92, 0.85], np.float32)
    ax = np.abs(x)
    red = (np.exp(-(((ax - 0.042) / 0.012) ** 2 + ((z - 1.655) / 0.012) ** 2 + ((y + 0.11) / 0.03) ** 2))
           + np.exp(-((ax / 0.010) ** 2 + ((z - 1.650) / 0.010) ** 2 + ((y + 0.14) / 0.02) ** 2))
           + 0.6 * sm((ax - 0.075) / 0.008) * sm((1.72 - z) / 0.02) * sm((z - 1.63) / 0.01) * sm((0.03 - y) / 0.02))
    red = gaussian_filter(np.where(VM, red, 0), 3) * skinH
    H = np.clip(H * (1 + (g - 1) * skinH[..., None]) * (1 + 0.05 * red[..., None] * np.array([1, -0.4, -0.6])), 0, 1)
    LB = B @ LUM
    wb = np.clip((LB - 0.18) / 0.15, 0, 1)[..., None]
    B = np.clip(B * (1 + (g - 1) * wb), 0, 1)
    print('teint : gain', g)
# 2. relief musculaire lisible : ombre douce dans les creux (divergence de la carte de normales du corps)
if on('RELIEF'):
    Nm = BN * 2 - 1
    Nm = np.stack([np.asarray(Image.fromarray(((Nm[..., i] + 1) * 127.5).astype(np.uint8)).resize(B.shape[1::-1]), np.float32) / 127.5 - 1 for i in range(2)], -1)
    nx, ny = gaussian_filter(Nm[..., 0], 2), gaussian_filter(Nm[..., 1], 2)
    cav = gaussian_filter(np.gradient(nx, axis=1) - np.gradient(ny, axis=0), 4) * 25
    shade = 1 - 0.10 * np.clip(-cav, 0, 1) + 0.04 * np.clip(cav, 0, 1)
    shade = 1 + (shade - 1) * np.clip((1.40 - BZ) / 0.06, 0, 1)   # pas d'ombre au raccord du cou
    wsk = np.clip((B @ LUM - 0.18) / 0.15, 0, 1) * BVM
    shade = shade / float(shade[wsk > 0.5].mean())
    B = np.clip(B * (1 + (shade[..., None] - 1) * wsk[..., None]), 0, 1)
    print('relief musculaire : ombre des creux 10 %')
# 6. caleçon mat (la carte de rugosité ci-dessous) et un peu moins noir d'encre : anthracite
LB = B @ LUM
boxer = BVM & (LB < 0.16)
rough = np.full(B.shape[:2], 0.62 if on('PEAU_MATE') else 0.58, np.float32)
if on('CALECON'):
    rough[gaussian_filter(boxer.astype(np.float32), 1) > 0.5] = 0.92
    wbx = gaussian_filter(boxer.astype(np.float32), 1)[..., None]
    B = B * (1 - wbx) + np.clip(B * 1.25 + 0.025, 0, 1) * wbx
# 4. raccords : marges des îles remplies (liseré clair sur le côté du cou), couture du milieu du crâne et du front
#    adoucie dans la carte de normales (les deux moitiés en miroir n'ont pas le même relief au bord)
if on('RACCORDS'):
    # 1.50.1 trait clair au milieu du crâne : la texture d'origine est entourée de bandes étirées plus claires, et la
    # compression JPEG les fait baver sur les 2 derniers texels de l'île. Sur le crâne et le front (îles coupées au
    # milieu), ces texels du bord sont refaits depuis l'intérieur de l'île, avant de remplir la marge
    from scipy.ndimage import binary_erosion
    crane = (z > 1.66) & (y > -0.11)
    VMc = VM & (binary_erosion(VM, iterations=int(os.environ.get('BORD_PX', '3'))) | ~crane)
    H = gutter(H, VMc, 4)
    H = gutter(H, VM, 32)
    B = gutter(B, BVM, 12)
    mid = VM & (np.abs(x) < 0.006) & (z > 1.69)
    wm = gaussian_filter(np.where(VM, (1 - np.abs(x) / 0.006) * mid, 0), 1.5)[..., None]
    # 1.50.1 : la normale n'est plus aplatie au milieu (MILIEU=1 pour l'ancien réglage) : la bande lisse accrochait la
    # lumière comme un trait ; le bord de l'île est refait comme pour la couleur
    if os.environ.get('MILIEU', '0') == '1':
        HN = HN * (1 - wm) + np.array([0.5, 0.5, 1.0], np.float32) * wm
    HN = gutter(HN, VMc, 4)
    HN = gutter(HN, VM, 32)
# 5. cheveux : grain plus fin (détail fin renforcé dans les cheveux peints), volume dans disp.f32
if on('CHEVEUX'):
    wh = gaussian_filter(hair.astype(np.float32), 2)[..., None]
    hp = H - gaussian_filter(H, (1.2, 1.2, 0))
    H = np.clip(H + 0.8 * hp * wh, 0, 1)
# couture du milieu du crâne et du front dans la couleur (1.50.1) : les deux moitiés n'ont pas tout à fait le même ton.
# Près de x = 0, chaque texel prend le ton moyen (basses fréquences) de lui-même et de son symétrique ; le grain des
# cheveux et de la peau n'est pas touché (l'ancienne moyenne simple, MILIEU=1, laissait une bande lisse)
if on('RACCORDS'):
    from scipy.spatial import cKDTree
    hz = VM & (z > 1.69)
    idx = np.argwhere(hz); tree = cKDTree(PM[hz])
    LARG = 0.015
    near = hz & (np.abs(x) < LARG)
    Hb = gaussian_filter(H, (6, 6, 0))
    qq = PM[near].copy(); qq[:, 0] *= -1
    _, j = tree.query(qq); rr, cc = idx[j].T
    w = sm(1 - np.abs(x[near]) / LARG)[:, None]
    H[near] = np.clip(H[near] + w * (0.5 * (Hb[near] + Hb[rr, cc]) - Hb[near]), 0, 1)
    H = gutter(H, VMc, 4)
    H = gutter(H, VM, 32)
# 1 bis. peau mate de la tête : rugosité 0.62 (front et nez 0.52, un peu luisants), cheveux 0.8
if on('PEAU_MATE'):
    ax = np.abs(x)
    rh = np.full(H.shape[:2], 0.62, np.float32)
    tz = np.exp(-((ax / 0.025) ** 2 + ((z - 1.715) / 0.015) ** 2)) + np.exp(-((ax / 0.010) ** 2 + ((z - 1.655) / 0.02) ** 2))
    rh -= 0.10 * np.clip(tz, 0, 1) * (y < -0.08)
    rh = np.where(hair, 0.8, rh)
    rh = gaussian_filter(rh, 2)
    rgh = (np.stack([np.zeros_like(rh), rh, np.zeros_like(rh)], -1) * 255 + 0.5).astype(np.uint8)
    Image.fromarray(rgh).resize((512, 512)).save(os.path.join(out, 'rugosite_tete.jpg'), quality=90)
Image.fromarray((H * 255 + 0.5).astype(np.uint8)).save(os.path.join(out, 'tete.jpg'), quality=88)
Image.fromarray((np.clip(HN, 0, 1) * 255 + 0.5).astype(np.uint8)).save(os.path.join(out, 'normale.jpg'), quality=88)
Image.fromarray((B * 255 + 0.5).astype(np.uint8)).save(os.path.join(out, 'corps.jpg'), quality=90)
# rugosité glTF : canal vert
rg = (np.stack([np.zeros_like(rough), rough, np.zeros_like(rough)], -1) * 255 + 0.5).astype(np.uint8)
Image.fromarray(rg).resize((512, 512)).save(os.path.join(out, 'rugosite.jpg'), quality=90)

# volume des cheveux : points de la tête dont la texture est « cheveux », poussés le long de la normale (6 mm sur le
# dessus, moins aux tempes et à la nuque), lissé ; le reste ne bouge pas (déplacement nul)
d = np.load(pose_f); R, T, UV, Mt = d['R'], d['tris'], d['uvs'], d['mat']
Dd = np.zeros_like(R)
if on('CHEVEUX'):
    Hh = hair.astype(np.float32)
    S = Hh.shape[0]
    hv = np.zeros(len(R)); cnt = np.zeros(len(R))
    for t, uvt, m in zip(T, UV, Mt):
        if m != 1: continue
        for v, (u, w) in zip(t, uvt):
            hv[v] += Hh[min(S - 1, int((1 - w) * S)), min(S - 1, int(u * S))]; cnt[v] += 1
    hv = np.where(cnt > 0, hv / np.maximum(cnt, 1), 0)
    key = np.round(R * 1e5).astype(np.int64); _, inv = np.unique(key, axis=0, return_inverse=True); inv = inv.ravel()
    q = np.zeros(inv.max() + 1); np.maximum.at(q, inv, hv)
    nb = [set() for _ in range(len(q))]
    for t in T:
        a, b, c = inv[t]; nb[a] |= {b, c}; nb[b] |= {a, c}; nb[c] |= {a, b}
    for it in range(6):
        q = np.array([0.5 * q[i] + 0.5 * np.mean(q[list(nb[i])]) if nb[i] else q[i] for i in range(len(q))])
    zq = np.zeros(len(q)); np.add.at(zq, inv, R[:, 2]); zq /= np.bincount(inv)
    th = 0.006 * np.clip((zq - 1.62) / 0.12, 0.25, 1)
    n = np.zeros_like(R); f = np.cross(R[T[:, 1]] - R[T[:, 0]], R[T[:, 2]] - R[T[:, 0]])
    for k in range(3): np.add.at(n, T[:, k], f)
    nq = np.zeros((len(q), 3)); np.add.at(nq, inv, n); nq /= np.linalg.norm(nq, axis=1, keepdims=True) + 1e-12
    Dd = (nq * (q * th)[:, None])[inv]
    print('cheveux : volume max mm', round(float(np.linalg.norm(Dd, axis=1).max() * 1000), 1))
# visage et cou plus épais (Youssef 15/11 10:36) : mêmes traits, joues et mâchoire un peu plus larges, cou plus épais.
# Le déplacement ne dépend que de la position : les points dédoublés (coutures, raccord tête-corps) bougent ensemble.
if os.environ.get('EPAIS', '0') == '1':
    # dosage « humainement réaliste » (10:41) : tour de cou ~44 → ~46 cm (combattant), mâchoire ~10,7 → ~11,5 cm,
    # joues un peu, pommettes presque pas ; la hauteur de tête (24 cm, 7,5 têtes pour 1,80 m) ne change pas
    FX, FN = float(os.environ.get('EPAIS_VISAGE', '0.07')), float(os.environ.get('EPAIS_COU', '0.05'))
    zz, yy, rr = R[:, 2], R[:, 1], np.hypot(R[:, 0], R[:, 1])
    em = np.zeros(len(R), bool); em[T[Mt == 2].ravel()] = True
    # cou : agrandi autour de l'axe (x = 0, y = 0) ; ni épaules, ni mâchoire, ni menton
    machoire = sm((-0.03 - yy) / 0.02) * sm((zz - 1.55) / 0.02)
    wn = sm((zz - 1.47) / 0.05) * sm((1.60 - zz) / 0.03) * sm((0.11 - rr) / 0.03) * (1 - machoire)
    Dd[:, 0] += R[:, 0] * FN * wn
    Dd[:, 1] += R[:, 1] * FN * wn
    # visage : élargi en x, surtout à la mâchoire, de moins en moins vers les pommettes, rien aux yeux
    wf = sm((zz - 1.55) / 0.025) * sm((1.67 - zz) / 0.04) * (1 - 0.6 * sm((zz - 1.585) / 0.07)) * ~em
    Dd[:, 0] += R[:, 0] * FX * wf
    print('épaisseur : visage', FX, 'cou', FN, 'max mm', round(float(np.linalg.norm(Dd, axis=1).max() * 1000), 1))
# trapèzes de combattant (Youssef 15/11 10:52) : le haut des trapèzes monte d'environ 1,5 cm sur les côtés du cou et
# comble l'angle cou-épaule ; le squelette, le visage et l'avant du cou (clavicules) ne bougent pas.
if os.environ.get('TRAPEZES', '0') == '1':
    TH = float(os.environ.get('TRAPEZES_MM', '15')) / 1000
    ax, yy, zz = np.abs(R[:, 0]), R[:, 1], R[:, 2]
    key = np.round(R * 1e5).astype(np.int64); _, inv = np.unique(key, axis=0, return_inverse=True); inv = inv.ravel()
    nf = np.cross(R[T[:, 1]] - R[T[:, 0]], R[T[:, 2]] - R[T[:, 0]])
    nq = np.zeros((inv.max() + 1, 3))
    for k in range(3): np.add.at(nq, inv[T[:, k]], nf)
    nq /= np.linalg.norm(nq, axis=1, keepdims=True) + 1e-12
    m = (sm((0.17 - ax) / 0.06) * sm((ax - float(os.environ.get('TRAPEZES_X0', '0.045'))) / 0.02) * sm((zz - 1.44) / 0.04) * sm((1.585 - zz) / 0.03)
         * sm((yy - float(os.environ.get('TRAPEZES_Y0', '-0.045'))) / 0.035))
    mq = np.zeros(len(nq)); np.maximum.at(mq, inv, m)
    nb = [set() for _ in range(len(mq))]
    for t in T:
        a, b, c = inv[t]; nb[a] |= {b, c}; nb[b] |= {a, c}; nb[c] |= {a, b}
    for it in range(8):
        mq = np.array([0.5 * mq[i] + 0.5 * np.mean(mq[list(nb[i])]) if nb[i] else mq[i] for i in range(len(mq))])
    up = nq.copy(); up[:, 2] = np.maximum(up[:, 2], 0)       # jamais vers le bas
    up /= np.linalg.norm(up, axis=1, keepdims=True) + 1e-12
    Dd += (up * (mq * TH)[:, None])[inv]
    print('trapèzes : max mm', round(float(mq.max() * TH * 1000), 1))
R2 = R + Dd
n2 = np.zeros_like(R2); f = np.cross(R2[T[:, 1]] - R2[T[:, 0]], R2[T[:, 2]] - R2[T[:, 0]])
for k in range(3): np.add.at(n2, T[:, k], f)
key = np.round(R * 1e5).astype(np.int64); _, inv = np.unique(key, axis=0, return_inverse=True); inv = inv.ravel()
acc = np.zeros((inv.max() + 1, 3)); np.add.at(acc, inv, n2); n2 = acc[inv]
n2 /= np.linalg.norm(n2, axis=1, keepdims=True) + 1e-12
gl = lambda a: np.stack([a[:, 0], a[:, 2], -a[:, 1]], 1)
np.concatenate([gl(R), gl(Dd), gl(n2)], 1).astype(np.float32).tofile(os.path.join(out, 'disp.f32'))
print('ok', out)
