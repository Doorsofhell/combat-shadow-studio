import { describe, expect, test } from 'vitest';
import { Vector3 } from 'three';
import { readGlb, type SkinnedPart } from '../../test/glbRead';

/**
 * 1.15 (Youssef, 04/11 12:07: « corrige Inaya, son haut du corps, on dirait qu'il est emboîté, il y a des traces »).
 * Verified finding: the bikini top of her Rocketbox sports body is modelled in the body surface itself (cups, under
 * band, a halter strap round the neck), its edges standing off the skin. tools/generator/rocketbox/flatten_halter.py
 * smooths those pieces into the skin; measured on the shipped model, the local relief of the bikini's points (distance
 * of a point to the plane of its neighbours) reached 4.8 mm in 1.14 (the raised edges), 1.9 mm after.
 * The pieces are the body's texture islands at the bottom middle of its atlas (v > 0.78) above the waist.
 */
const key = (v: Vector3) => `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`;

function relief(parts: SkinnedPart[]) {
  const body = parts.find((p) => p.material.endsWith('_body'))!;
  const surf = parts.filter((p) => p.material.endsWith('_body') || p.material.endsWith('_head'));
  // points merged by position over the body and the head (the strap meets the head's skin)
  const id = new Map<string, number>();
  const pos: Vector3[] = [];
  const nb = new Map<number, Set<number>>();
  const g = (v: Vector3) => {
    const k = key(v);
    let i = id.get(k);
    if (i === undefined) {
      i = pos.length;
      id.set(k, i);
      pos.push(v);
    }
    return i;
  };
  for (const p of surf) {
    const gi = p.positions.map(g);
    for (let t = 0; t < p.index.length; t += 3)
      for (const [a, b] of [
        [0, 1],
        [1, 2],
        [2, 0],
      ]) {
        const x = gi[p.index[t + a]];
        const y = gi[p.index[t + b]];
        if (!nb.has(x)) nb.set(x, new Set());
        if (!nb.has(y)) nb.set(y, new Set());
        nb.get(x)!.add(y);
        nb.get(y)!.add(x);
      }
  }
  const bik = new Set<number>();
  body.positions.forEach((v, i) => {
    if (body.uvs[i][1] > 0.78 && v.y > 1.15) bik.add(id.get(key(v))!);
  });
  let max = 0;
  for (const i of bik) {
    const ns = [...(nb.get(i) ?? [])].filter((j) => j !== i).map((j) => pos[j]);
    if (ns.length < 3) continue;
    const c = ns.reduce((s, v) => s.add(v), new Vector3()).multiplyScalar(1 / ns.length);
    // normal of the neighbours' plane: sum of the cross products round the centre (Newell)
    const n = new Vector3();
    for (let k = 0; k < ns.length; k++) {
      const a = ns[k].clone().sub(c);
      for (let m = k + 1; m < ns.length; m++) {
        const cr = a.clone().cross(ns[m].clone().sub(c));
        if (cr.dot(n) < 0) cr.negate();
        n.add(cr);
      }
    }
    if (n.lengthSq() < 1e-16) continue;
    n.normalize();
    max = Math.max(max, Math.abs(pos[i].clone().sub(c).dot(n)));
  }
  return { count: bik.size, max };
}

describe('Inaya : buste sans le relief du bikini d’origine', () => {
  test('le relief local des points de l’ancien bikini reste sous 2,5 mm (4,8 mm en 1.14)', () => {
    const { parts } = readGlb('public/coaches/inaya/photo.glb');
    const r = relief(parts);
    expect(r.count, 'points de l’ancien bikini trouvés').toBeGreaterThan(2000);
    expect(r.max * 1000, `relief max ${(r.max * 1000).toFixed(2)} mm`).toBeLessThan(2.5);
  });
});
