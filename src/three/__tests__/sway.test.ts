import { describe, expect, test } from 'vitest';
import { Bone, BufferGeometry, Float32BufferAttribute, MeshStandardMaterial, Object3D, Skeleton, SkinnedMesh, Uint16BufferAttribute } from 'three';
import { Sway, swingKind } from '../sway';

/** 1.10 secondary motion (src/three/sway.ts): gi skirt and belt tails lag and settle; the knot stays put */
function tail(name: string) {
  const root = new Object3D();
  const hips = new Bone();
  hips.name = 'Hips';
  hips.position.set(0, 1, 0);
  root.add(hips);
  const g = new BufferGeometry();
  // a 30 cm tail hanging from the belt (y 1.0) down to y 0.7
  const P: number[] = [];
  for (let i = 0; i <= 10; i++) P.push(0, 1 - i * 0.03, 0.1, 0.02, 1 - i * 0.03, 0.1);
  g.setAttribute('position', new Float32BufferAttribute(P, 3));
  g.setAttribute('skinIndex', new Uint16BufferAttribute(new Array((P.length / 3) * 4).fill(0), 4));
  g.setAttribute('skinWeight', new Float32BufferAttribute(Array.from({ length: P.length / 3 }, () => [1, 0, 0, 0]).flat(), 4));
  const m = new SkinnedMesh(g, new MeshStandardMaterial());
  m.name = name;
  root.add(m);
  root.updateMatrixWorld(true);
  m.bind(new Skeleton([hips]));
  return { root, hips, m };
}

describe('pans et ceinture : mouvement secondaire', () => {
  test('pièces concernées', () => {
    expect(swingKind('tenue:pan-1.001')).toBe('pan');
    expect(swingKind('tenue:jupe-veste.002')).toBe('jupe');
    expect(swingKind('tenue:veste-judo')).toBeNull();
    expect(swingKind('tenue:noeud.001')).toBeNull();
  });
  test('le pan traîne derrière le mouvement, borné, puis revient au repos ; le haut (nœud) ne bouge pas', () => {
    const { root, hips, m } = tail('tenue:pan-1');
    const s = new Sway();
    expect(s.add(m, false)).toBe(true);
    const w = m.geometry.getAttribute('cssSwayW');
    expect(w.getX(0)).toBe(0);
    expect(w.getX(w.count - 1)).toBeCloseTo(1);
    const u = () => (m.material as MeshStandardMaterial & { userData: unknown }) && (s as unknown as { list: { u: { cssSway: { value: { x: number; y: number; z: number } } } }[] }).list[0].u.cssSway.value;
    // the hips move forward (+x) at 2 m/s for 0.2 s
    let maxBack = 0;
    for (let i = 0; i < 12; i++) {
      hips.position.x += 2 / 60;
      root.updateMatrixWorld(true);
      s.update(1 / 60);
      maxBack = Math.min(maxBack, u().x);
    }
    expect(maxBack).toBeLessThan(-0.01);
    expect(maxBack).toBeGreaterThan(-0.08);
    // still for 2 s: back to rest
    for (let i = 0; i < 120; i++) s.update(1 / 60);
    expect(Math.abs(u().x)).toBeLessThan(0.002);
    // a 3 s frozen frame does not throw the cloth
    hips.position.x += 0.5;
    root.updateMatrixWorld(true);
    s.update(3);
    expect(Math.hypot(u().x, u().y, u().z)).toBeLessThan(0.02);
    // still images: at rest
    s.update(0);
    expect(Math.hypot(u().x, u().y, u().z)).toBe(0);
  });
});
