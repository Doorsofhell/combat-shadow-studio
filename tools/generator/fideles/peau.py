"""2.4.0 prototype 2 — peau du corps sans ombrage cuit (Youssef 20/11 14:30 : « pas d'ombres musculaires cuites
permanentes », Victor « supprimer les taches et marbrures »).

Les textures photo Rocketbox portent l'éclairage de leur studio : creux des muscles assombris, plaques. Le relief
des muscles est déjà dans la carte de normales (le moteur l'éclaire) ; dans la couleur on retire la basse
fréquence de la luminance (sur la peau seulement, teinte gardée), on garde les détails fins (grain, pores, poils).
Près de la couture du cou (raccord avec la texture de la tête) rien ne change.
  python3 tools/generator/fideles/peau.py config.json
config : {"glb": [entrée, sortie]..., "sigma": 28, "force": 0.75, "marbrure": 0.0, "cou": 0.07}"""
import sys, json, io
import numpy as np
from PIL import Image
import scipy.ndimage as nd
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from glb import Glb, save, prim_refs
from raster import uv_raster


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def delight(g, C):
    body = [p for p in g.prims() if p['mat'].endswith('_body')][0]
    tex = np.asarray(g.image('body_color')).astype(np.float32) / 255
    S = tex.shape[0]
    PM, NM, VM = uv_raster(body['P'].astype(np.float64), body['N'].astype(np.float64), body['T'], body['UV'], S)
    lum = tex @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    mx = tex.max(-1); mn = tex.min(-1)
    sat = (mx - mn) / np.maximum(mx, 1e-3)
    # peau : chaude (rouge au-dessus du bleu), ni noire ni grise (vêtements peints exclus)
    skin = (VM > 0) & (lum > 0.08) & (tex[..., 0] > tex[..., 2] + 0.03) & (sat > 0.15)
    skin = nd.binary_erosion(skin, iterations=2)
    m = skin.astype(np.float32)
    sig = C.get('sigma', 28) * S / 2048
    w = nd.gaussian_filter(m, sig) + 1e-4
    low = nd.gaussian_filter(lum * m, sig) / w
    big = nd.gaussian_filter(lum * m, sig * 6) / (nd.gaussian_filter(m, sig * 6) + 1e-4)
    ratio = np.clip(big / np.maximum(low, 0.03), 0.6, 1.6) ** C.get('force', 0.75)
    # muscles « dessinés » dans la couleur (Victor) : bande moyenne de la luminance (plis et creux peints, 3 à 28 px
    # sur 2048) réduite ; le grain fin (pores, poils) reste
    if C.get('bande'):
        f1 = C.get('bande_fin', 3) * S / 2048
        l1 = nd.gaussian_filter(lum * m, f1) / (nd.gaussian_filter(m, f1) + 1e-4)
        mid = l1 - low
        ratio = ratio * np.clip((l1 - C['bande'] * mid) / np.maximum(l1, 0.03), 0.6, 1.8)
    # rien près du cou (raccord de la tête) ni hors de la peau
    y = PM[..., 1]
    top = float(body['P'][:, 1].max())
    keep = smooth(top - C.get('cou', 0.07), top - C.get('cou', 0.07) - 0.06, y)
    a = nd.gaussian_filter(m, 2) * keep
    ratio = 1 + (ratio - 1) * a
    out = tex * ratio[..., None]
    if C.get('marbrure'):
        # taches de teinte (Victor) : chroma ramené vers sa moyenne locale large
        ch = out / np.maximum(out.sum(-1, keepdims=True), 1e-3)
        chl = np.stack([nd.gaussian_filter(ch[..., c] * m, sig * 4) / (nd.gaussian_filter(m, sig * 4) + 1e-4) for c in range(3)], -1)
        chs = np.stack([nd.gaussian_filter(ch[..., c] * m, sig * 0.5) / (nd.gaussian_filter(m, sig * 0.5) + 1e-4) for c in range(3)], -1)
        k = C['marbrure'] * a[..., None]
        out = out * (1 + k * (chl / np.maximum(chs, 1e-3) - 1))
    print('peau : texels', int(skin.sum()), 'rapport min/max', float(ratio.min()).__round__(2), float(ratio.max()).__round__(2))
    return np.clip(out, 0, 1)


if __name__ == '__main__':
    C = json.load(open(sys.argv[1]))
    for src, dst in C['glb']:
        g = Glb(src)
        cache = delight(g, C)
        imgs = {}
        for i, im in enumerate(g.j['images']):
            if 'body_color' in im.get('name', ''):
                b = io.BytesIO(); Image.fromarray((cache * 255 + 0.5).astype(np.uint8)).save(b, 'JPEG', quality=C.get('qualite', 92))
                imgs[i] = b.getvalue()
        save(g, dst, new_img=imgs)
        print('écrit', dst)
