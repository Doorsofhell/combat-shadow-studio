import { describe, expect, it } from 'vitest';
import { SkinnedMesh, SphereGeometry, Vector3 } from 'three';
import { GROOM_STYLES, beardShape, groomFace, scalpCards } from '../groom';
import RECTS from '../hair_atlas.json';
import type { AtlasRects } from '../groom';

// a head: sphere of 9 cm around (0, 1.6, 0.03), face towards +z
const C = new Vector3(0, 1.6, 0.03);
const R = 0.09;
function head() {
  const g = new SphereGeometry(R, 64, 48);
  g.translate(C.x, C.y, C.z);
  return new SkinnedMesh(g);
}
const face = { eyeL: new Vector3(0.03, 1.6, 0.11), lipsY: 1.53 };

describe('cheveux en hair cards (v0.29)', () => {
  it('les mèches du crâne restent au-dessus de la peau, sans pointe qui dépasse', () => {
    const src = {
      body: head(),
      scalp: (_u: number, v: number) => (v > 0.55 ? 1 : 0),
      beard: null,
      brow: null,
      headLow: new Vector3(0, 1.54, 0.03),
      headTop: new Vector3(0, 1.69, 0.03),
      eyeL: face.eyeL,
      eyeR: new Vector3(-0.03, 1.6, 0.11),
      lipsY: face.lipsY,
      faceZ: 0.12,
    };
    const g = scalpCards(src, { ...GROOM_STYLES['court-barbe'], scalpCards: 800 }, RECTS as AtlasRects)!;
    const P = g.getAttribute('position');
    const T = g.getAttribute('aHairT');
    expect(P.count).toBeGreaterThan(800 * 4);
    const p = new Vector3();
    let maxOut = 0;
    for (let i = 0; i < P.count; i++) {
      p.fromBufferAttribute(P, i);
      expect(Number.isFinite(p.x + p.y + p.z)).toBe(true);
      const d = p.distanceTo(C) - R;
      // the card edges (half width) may dip a little under a sphere this small, never into the skull
      expect(d).toBeGreaterThan(-0.004);
      maxOut = Math.max(maxOut, d);
      expect(Math.abs(new Vector3().fromBufferAttribute(T, i).length() - 1)).toBeLessThan(1e-3);
    }
    // the hair volume of a short cut stays within about 1.5 cm of the scalp
    expect(maxOut).toBeLessThan(0.015);
  });

  it('la barbe pousse sur les joues, le menton et sous la mâchoire, pas sur le front ni derrière les oreilles', () => {
    const f = groomFace(face);
    const at = (x: number, y: number, z: number) => beardShape(new Vector3(x, y, z), f);
    expect(at(0, face.lipsY - 0.03, 0.12)).toBeGreaterThan(0.9); // menton
    expect(at(0.05, face.lipsY, 0.09)).toBeGreaterThan(0.9); // joue
    expect(at(0, face.eyeL.y + 0.04, 0.12)).toBe(0); // front
    expect(at(0.07, face.lipsY + 0.02, f.earZ - 0.03)).toBe(0); // derrière l'oreille
    expect(at(0, face.lipsY - 0.1, 0.08)).toBe(0); // bas du cou
  });
});
