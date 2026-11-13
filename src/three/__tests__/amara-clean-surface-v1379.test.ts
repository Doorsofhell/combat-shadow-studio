import { describe, expect, it } from 'vitest';
import { BufferAttribute, BufferGeometry, Mesh, MeshStandardMaterial } from 'three';
import { bakeAmaraCleanSurface } from '../amaraCleanSurface';
import { maskedIndex } from '../outfit';

function photoMesh(withCleanMorph: boolean) {
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array([
    0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0,
  ]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const count = withCleanMorph ? 26 : 25;
  g.morphTargetsRelative = true;
  g.morphAttributes.position = Array.from({ length: count }, (_, k) =>
    new BufferAttribute(new Float32Array(k === 25
      ? [0, 0, 0.02, 0, 0, 0.02, 0, 0, 0.02, 0, 0, 0.02]
      : new Array(12).fill(0)), 3));
  const mesh = new Mesh(g, new MeshStandardMaterial());
  mesh.morphTargetDictionary = Object.fromEntries(Array.from({ length: count }, (_, k) => [
    k === 25 ? 'CSS_CleanBikini' : 'Face_' + k, k,
  ]));
  mesh.morphTargetInfluences = Array.from({ length: count }, (_, k) => k === 25 ? 1 : 0);
  return mesh;
}

describe('Amara cleaned swimsuit skin, original outfit masks preserved', () => {
  it('bakes ONLY the extra clean morph into a clone, retaining original positions for masks', () => {
    const m = photoMesh(true);
    const baseline = m.geometry;
    expect(bakeAmaraCleanSurface(m)).toBe(true);
    expect(m.geometry).not.toBe(baseline);
    expect(m.geometry.getAttribute('position').getZ(0)).toBeCloseTo(0.02);
    expect(baseline.getAttribute('position').getZ(0)).toBe(0);
    expect(m.geometry.morphAttributes.position).toBeUndefined();
    const saved = m.geometry.userData.cssOriginalMaskPositions as Float32Array;
    expect(Array.from(saved)).toEqual(Array.from(baseline.getAttribute('position').array));
    const visible = maskedIndex(saved, [0, 1, 2, 0, 2, 3], new Set(['0,0,0', '1000,0,0', '1000,1000,0']), 1000);
    expect(visible.index).toEqual([0, 2, 3]);
    expect(visible.matched).toBe(3);
  });

  it('is a no-op for all coaches without the marked clean morph', () => {
    const m = photoMesh(false);
    const original = m.geometry;
    expect(bakeAmaraCleanSurface(m)).toBe(false);
    expect(m.geometry).toBe(original);
    expect(m.morphTargetInfluences).toHaveLength(25);
  });

  it('does not bake body changes into facial target primitives', () => {
    const m = photoMesh(true);
    m.geometry.morphAttributes.position[0].setXYZ(0, 0.01, 0, 0);
    const original = m.geometry;
    expect(bakeAmaraCleanSurface(m)).toBe(false);
    expect(m.geometry).toBe(original);
    expect(m.morphTargetInfluences?.[25]).toBe(1);
  });
});
