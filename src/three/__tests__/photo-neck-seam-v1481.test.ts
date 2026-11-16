import { describe, expect, test } from 'vitest';
import { BufferAttribute, BufferGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import { smoothPhotoNeckSeam } from '../photoNeckSeam';

const piece = (name: string, normals: number[]) => {
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array([
    0, 1, 0, 0.1, 1, 0, 0, 1.1, 0,
  ]), 3));
  g.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
  const m = new Mesh(g, new MeshStandardMaterial());
  m.material.name = name;
  return m;
};

describe('1.48.1 Rocketbox neck continuity', () => {
  test('aligns normal direction at coincident neck-ring vertices without changing original cached geometry', () => {
    const root = new Group();
    const body = piece('m021_body', [0, 1, 0, 0, 1, 0, 0, 1, 0]);
    const head = piece('m021_head', [1, 0, 0, 1, 0, 0, 1, 0, 0]);
    const originalBody = body.geometry, originalHead = head.geometry;
    root.add(body, head);
    const report = smoothPhotoNeckSeam(root);
    expect(report.skipped).toBe(false);
    expect(report.matchingVertices).toBe(3);
    expect(report.adjustedVertices).toBe(6);
    expect(body.geometry).not.toBe(originalBody);
    expect(head.geometry).not.toBe(originalHead);
    expect(originalBody.getAttribute('normal').getX(0)).toBe(0);
    expect(originalHead.getAttribute('normal').getX(0)).toBe(1);
    const b = body.geometry.getAttribute('normal'), h = head.geometry.getAttribute('normal');
    for (let i = 0; i < 3; i++) {
      expect(b.getX(i)).toBeCloseTo(h.getX(i));
      expect(b.getY(i)).toBeCloseTo(h.getY(i));
      expect(b.getZ(i)).toBeCloseTo(h.getZ(i));
      // Positions remain bit-for-bit identical.
      expect(body.geometry.getAttribute('position').getX(i)).toBe(originalBody.getAttribute('position').getX(i));
    }
  });

  test('leaves absent head meshes unchanged', () => {
    const root = new Group();
    const body = piece('m021_body', [0, 1, 0, 0, 1, 0, 0, 1, 0]);
    root.add(body);
    const before = body.geometry;
    expect(smoothPhotoNeckSeam(root).skipped).toBe(true);
    expect(body.geometry).toBe(before);
  });

  test('never welds unrelated non-coincident points', () => {
    const root = new Group();
    const body = piece('m021_body', [0, 1, 0, 0, 1, 0, 0, 1, 0]);
    const head = piece('m021_head', [1, 0, 0, 1, 0, 0, 1, 0, 0]);
    head.geometry.translate(0, 0.2, 0);
    root.add(body, head);
    const a = body.geometry, b = head.geometry;
    expect(smoothPhotoNeckSeam(root).skipped).toBe(true);
    expect(body.geometry).toBe(a);
    expect(head.geometry).toBe(b);
  });
});
