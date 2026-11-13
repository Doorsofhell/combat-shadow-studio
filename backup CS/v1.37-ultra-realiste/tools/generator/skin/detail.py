"""
Tileable skin micro-detail for the realistic coaches (v0.29 lot 2).

A height field of pores (small dimples scattered with a minimum spacing), fine crossing wrinkles
(the skin's diamond micro-relief) and soft bumps, turned into a tangent-space normal map. Everything is
periodic (FFT noise, wrapped distances), so the texture tiles without seams.

Output public/skin/skin_detail.png: RG = normal xy (0.5 = flat), B = cavity (1 in pores and wrinkles,
for the roughness and a slight darkening), A = 255.
Usage: python3 tools/generator/skin/detail.py [size]
"""
import os
import sys

import numpy as np
from PIL import Image

N = int(sys.argv[1]) if len(sys.argv) > 1 else 1024
rng = np.random.default_rng(292)
OUT = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'public', 'skin')


def fft_noise(scale, aniso=(1.0, 1.0), angle=0.0):
    """periodic noise with a gaussian spectrum around `scale` texels, optionally stretched and rotated"""
    f = np.fft.fftfreq(N)
    fx, fy = np.meshgrid(f, f)
    c, s = np.cos(angle), np.sin(angle)
    u = (c * fx + s * fy) * aniso[0]
    v = (-s * fx + c * fy) * aniso[1]
    r = np.sqrt(u * u + v * v) * scale
    amp = np.exp(-((r - 1.0) ** 2) * 2.0)
    ph = rng.random((N, N)) * 2 * np.pi
    z = np.real(np.fft.ifft2(amp * np.exp(1j * ph)))
    return z / (np.abs(z).max() + 1e-9)


h = np.zeros((N, N), np.float32)
# soft bumps
h += 0.35 * fft_noise(N / 24)
h += 0.2 * fft_noise(N / 60)
# fine wrinkles in two crossing directions (diamond pattern of the skin surface)
for ang in (0.6, -0.55, 1.7):
    w = fft_noise(N / 90, aniso=(0.25, 1.0), angle=ang)
    h -= 0.22 * np.clip(-w, 0, None) ** 1.5
# pores: dimples with a minimum spacing
yy, xx = np.mgrid[0:N, 0:N].astype(np.float32)
pores = np.zeros((N, N), np.float32)
count = int(N * N / 260)
px = rng.random(count) * N
py = rng.random(count) * N
rad = 1.1 + rng.random(count) * 1.4
depth = 0.5 + rng.random(count) * 0.5
R = 5
for x0, y0, r0, d0 in zip(px, py, rad, depth):
    xi, yi = int(x0), int(y0)
    xs = np.arange(xi - R, xi + R + 1) % N
    ys = np.arange(yi - R, yi + R + 1) % N
    dx = (np.arange(xi - R, xi + R + 1) - x0)[None, :]
    dy = (np.arange(yi - R, yi + R + 1) - y0)[:, None]
    g = d0 * np.exp(-(dx * dx + dy * dy) / (2 * r0 * r0))
    pores[np.ix_(ys, xs)] = np.maximum(pores[np.ix_(ys, xs)], g)
h -= 0.9 * pores

# normal from the periodic gradient
k = 2.2
gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5 * k
gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 0.5 * k
nz = 1.0 / np.sqrt(1 + gx * gx + gy * gy)
nx = -gx * nz
ny = gy * nz  # image rows go down, texture v goes up
cav = np.clip(pores * 1.2 + np.clip(-h, 0, None) * 0.4, 0, 1)
img = np.stack([(nx * 0.5 + 0.5) * 255, (ny * 0.5 + 0.5) * 255, cav * 255, np.full_like(nx, 255)], -1)
os.makedirs(OUT, exist_ok=True)
Image.fromarray(img.clip(0, 255).astype(np.uint8), 'RGBA').save(os.path.join(OUT, 'skin_detail.png'), optimize=True)
print('skin detail', N, os.path.join(OUT, 'skin_detail.png'))
