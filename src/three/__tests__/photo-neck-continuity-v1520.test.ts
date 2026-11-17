import { describe, expect, test } from 'vitest';
import { BufferAttribute, BufferGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import { harmonizePhotoNeckNormals } from '../photoNeckContinuity';

function surface(name: string, normals: number[], offset = 0) {
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array([
    0 + offset, 1, 0, 0.1 + offset, 1, 0, 0 + offset, 1.1, 0,
  ]), 3));
  g.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
  const m = new Mesh(g, new MeshStandardMaterial());
  m.material.name = name;
  return m;
}

describe('1.52 conservative neck normal continuity', () => {
  test('smooths coincident normals only and preserves cached original geometry', () => {
    const group = new Group();
    const body = surface('m021_body', [0, 1, 0, 0, 1, 0, 0, 1, 0]);
    const head = surface('m021_head', [0.4, 0.916515, 0, 0.4, 0.916515, 0, 0.4, 0.916515, 0]);
    const b0 = body.geometry, h0 = head.geometry;
    group.add(body, head);
    const report = harmonizePhotoNeckNormals(group);
    expect(report.skipped).toBe(false);
    expect(report.matched).toBe(3);
    expect(body.geometry).not.toBe(b0);
    expect(head.geometry).not.toBe(h0);
    for (let i = 0; i < 3; i++) {
      const n = body.geometry.getAttribute('normal'), h = head.geometry.getAttribute('normal');
      expect(n.getX(i)).toBeCloseTo(h.getX(i), 5);
      expect(n.getY(i)).toBeCloseTo(h.getY(i), 5);
      expect(body.geometry.getAttribute('position').getX(i)).toBe(b0.getAttribute('position').getX(i));
    }
    expect(b0.getAttribute('normal').getX(0)).toBe(0);
    expect(h0.getAttribute('normal').getX(0)).toBeCloseTo(0.4);
  });

  test('does not mutate unrelated or noncoincident surfaces', () => {
    const group = new Group();
    const body = surface('m021_body', [0, 1, 0, 0, 1, 0, 0, 1, 0]);
    const head = surface('m021_head', [0.4, 0.916515, 0, 0.4, 0.916515, 0, 0.4, 0.916515, 0], 0.04);
    group.add(body, head);
    expect(harmonizePhotoNeckNormals(group).skipped).toBe(true);
    expect(head.geometry.userData.cssNeck152Clone).toBeUndefined();
  });

  test('does not reverse extreme hard creases', () => {
    const group = new Group();
    const body = surface('m021_body', [0, 1, 0, 0, 1, 0, 0, 1, 0]);
    const head = surface('m021_head', [1, 0, 0, 1, 0, 0, 1, 0, 0]);
    group.add(body, head);
    expect(harmonizePhotoNeckNormals(group).skipped).toBe(true);
  });
});
