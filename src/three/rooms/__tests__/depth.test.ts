import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inflateSync } from 'node:zlib';
import { Vector3 } from 'three';
import { GroundedSkybox } from 'three/examples/jsm/objects/GroundedSkybox.js';
import { ROOMS, ROOM_EYE, decodeDepth, panoDir, roomMesh, type RoomDepth } from '../rooms';

/**
 * 1.25 (Youssef, 2026-11-06: « ajuster les arrière-fonds à la taille des coachs »): each room is laid at its real
 * size around the coach, from the distances rendered with its picture (profondeur.png).
 */
const PUBLIC = resolve(__dirname, '../../../../public');

/** a small reader for the 8-bit RGB PNGs written by compose.py (no interlace) */
function readPng(file: string): { w: number; h: number; rgba: Uint8Array } {
  const b = readFileSync(file);
  let o = 8;
  let w = 0, h = 0, type = 0;
  const idat: Buffer[] = [];
  while (o < b.length) {
    const len = b.readUInt32BE(o);
    const kind = b.toString('latin1', o + 4, o + 8);
    const data = b.subarray(o + 8, o + 8 + len);
    if (kind === 'IHDR') {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      type = data[9];
      expect(data[8]).toBe(8);
      expect(data[12]).toBe(0);
    } else if (kind === 'IDAT') idat.push(data);
    o += 12 + len;
  }
  const bpp = type === 2 ? 3 : type === 6 ? 4 : 1;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const px = new Uint8Array(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x];
      const a = x >= bpp ? px[y * stride + x - bpp] : 0;
      const up = y ? px[(y - 1) * stride + x] : 0;
      const c = y && x >= bpp ? px[(y - 1) * stride + x - bpp] : 0;
      let p = 0;
      if (f === 1) p = a;
      else if (f === 2) p = up;
      else if (f === 3) p = (a + up) >> 1;
      else if (f === 4) {
        const q = a + up - c, pa = Math.abs(q - a), pb = Math.abs(q - up), pc = Math.abs(q - c);
        p = pa <= pb && pa <= pc ? a : pb <= pc ? up : c;
      }
      px[y * stride + x] = (v + p) & 255;
    }
  }
  const rgba = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = px[i * bpp];
    rgba[i * 4 + 1] = px[i * bpp + Math.min(1, bpp - 1)];
    rgba[i * 4 + 2] = px[i * bpp + Math.min(2, bpp - 1)];
    rgba[i * 4 + 3] = 255;
  }
  return { w, h, rgba };
}

const depthOf = (id: string): RoomDepth => {
  const p = readPng(resolve(PUBLIC, 'salles', id, 'profondeur.png'));
  return decodeDepth(p.rgba, p.w, p.h);
};

describe('salles à l’échelle des coachs (1.25)', () => {
  it('le relief suit exactement le dôme : même direction pour chaque point de l’image', () => {
    const sky = new GroundedSkybox(null as never, ROOM_EYE, 30, 32);
    sky.rotation.y = Math.PI / 2;
    sky.updateMatrixWorld();
    const pos = sky.geometry.getAttribute('position');
    const uv = sky.geometry.getAttribute('uv');
    const v = new Vector3();
    let checked = 0;
    for (let i = 0; i < pos.count; i += 7) {
      v.fromBufferAttribute(pos, i);
      if (v.y < 1) continue; // above the horizon the dome is a plain sphere
      v.applyMatrix4(sky.matrixWorld).normalize();
      const [x, y, z] = panoDir(uv.getX(i), 1 - uv.getY(i));
      expect(Math.hypot(v.x - x, v.y - y, v.z - z), `uv ${uv.getX(i)} ${uv.getY(i)}`).toBeLessThan(1e-3);
      checked++;
    }
    expect(checked).toBeGreaterThan(50);
  });

  for (const spec of Object.values(ROOMS)) {
    it(`${spec!.name} : sol plat sous le coach, murs à leur vraie distance`, () => {
      const dp = depthOf(spec!.id);
      // straight down from the eye: the floor, eye high (± 5 cm)
      const below = dp.d[(dp.h - 2) * dp.w + dp.w / 2];
      expect(Math.abs(below - ROOM_EYE)).toBeLessThan(0.05);
      // looking 30° down: the floor at eye / sin 30°, unless something stands there
      const m = roomMesh(dp);
      let floor = 0, near = 0;
      for (let k = 0; k < m.pos.length / 3; k++) {
        const y = m.pos[k * 3 + 1];
        const r = Math.hypot(m.pos[k * 3], m.pos[k * 3 + 2]);
        if (r > 1 && r < 4 && y < 0.3) {
          near++;
          if (Math.abs(y) < 0.06) floor++;
        }
      }
      expect(floor / near).toBeGreaterThan(0.8);
      // the room is a room: every direction at the horizon meets something between 2 and 40 m
      for (let i = 0; i < dp.w; i += 16) expect(dp.d[(dp.h / 2) * dp.w + i]).toBeGreaterThan(2);
      // almost nothing is left out along the edges
      expect(m.index.length / 3).toBeGreaterThan(192 * 96 * 2 * 0.9);
    });
  }

  it('la profondeur se lit au millimètre près (16 bits dans une image 8 bits)', () => {
    const rgba = new Uint8Array([1, 2, 0, 255, 255, 255, 0, 255]);
    const d = decodeDepth(rgba, 2, 1);
    expect(d.d[0]).toBeCloseTo(((1 * 256 + 2) / 65535) * 60, 6);
    expect(d.d[1]).toBeCloseTo(60, 6);
  });
});
