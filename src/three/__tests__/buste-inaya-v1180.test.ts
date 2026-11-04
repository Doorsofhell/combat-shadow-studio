import { describe, expect, test } from 'vitest';
import { Vector3 } from 'three';
import { readGlb, type SkinnedPart } from '../../test/glbRead';

/**
 * 1.18 (correctif n° 4, docs/coachs-3d/CORRECTIFS_IDENTIFIES.md). Verified finding: after the 1.15 smoothing, the
 * pieces of the bikini sculpted in Inaya's body (Sports_Female_01) still drew the garment: a cord round the neck, a
 * ridge across the back, the outline of the cups, and their borders folded under like hems (triangles facing the
 * inside of the body: 305 on the chest and back in 1.17). tools/generator/rocketbox/fair_bikini.py rebuilds that
 * surface from the skin around it and removes the folded triangles.
 */
function body(parts: SkinnedPart[]) {
  return parts.find((p) => p.material.endsWith('_body'))!;
}

/** triangles of the trunk (1.15 to 1.40 m, |x| < 13 cm) facing the vertical axis of the chest */
function inward(b: SkinnedPart) {
  const P = b.positions;
  const band = P.filter((v) => v.y > 1.15 && v.y < 1.35 && Math.abs(v.x) < 0.12);
  const ax = band.reduce((s, v) => s.add(new Vector3(v.x, 0, v.z)), new Vector3()).multiplyScalar(1 / band.length);
  let n = 0;
  for (let t = 0; t < b.index.length; t += 3) {
    const [a, c, d] = [P[b.index[t]], P[b.index[t + 1]], P[b.index[t + 2]]];
    const cen = a.clone().add(c).add(d).multiplyScalar(1 / 3);
    if (cen.y <= 1.15 || cen.y >= 1.4 || Math.abs(cen.x) >= 0.13) continue;
    const fn = c.clone().sub(a).cross(d.clone().sub(a)).normalize();
    const r = new Vector3(cen.x - ax.x, 0, cen.z - ax.z).normalize();
    if (fn.dot(r) < -0.3) n++;
  }
  return n;
}

/** depth of the back (most backward point) 7 cm right and left of the spine, every 2 cm from 1.16 to 1.26 m (band) */
function backProfiles(b: SkinnedPart) {
  return [-0.07, 0.07].map((x0) => {
    const rows: number[] = [];
    for (let k = 0; k <= 5; k++) {
      const y = 1.16 + 0.02 * k;
      const z = b.positions.filter((v) => Math.abs(v.x - x0) < 0.012 && Math.abs(v.y - y) < 0.01 && v.z < -0.02).map((v) => v.z);
      rows.push(Math.min(...z));
    }
    return rows;
  });
}

describe('Inaya : maillot sculpté retiré du buste (1.18)', () => {
  const { parts } = readGlb('public/coaches/inaya/photo.glb');
  const b = body(parts);

  test('bords repliés du maillot retirés du torse (305 triangles tournés vers l’intérieur en 1.17)', () => {
    // 20 in 1.18: 17 at the ends of the strap, within 15 cm of the shoulder joints (kept as they are, see ARM_KEEP in
    // fair_bikini.py) and 3 deep in the cleavage (skin)
    expect(inward(b)).toBeLessThanOrEqual(25);
  });

  test('le dos n’a plus de bourrelet à la bande : bosse sous 2 mm (3,7 mm en 1.17)', () => {
    for (const r of backProfiles(b)) {
      // a ridge stands further back than the mean of the two rows round it
      let worst = 0;
      for (let i = 1; i < r.length - 1; i++) worst = Math.max(worst, (r[i - 1] + r[i + 1]) / 2 - r[i]);
      expect(worst * 1000).toBeLessThan(2);
    }
  });

  test('la poitrine garde son volume (bonnets tenus au centre)', () => {
    const front = b.positions.filter((v) => v.y > 1.2 && v.y < 1.32 && Math.abs(v.x) < 0.12);
    const zmax = Math.max(...front.map((v) => v.z));
    // 1.17: 0.1083 m (measured on the shipped model); the middle of the cups is held, only their outline moves
    expect(zmax).toBeGreaterThan(0.105);
  });
});
