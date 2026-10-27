import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { MotionSmoother } from '../smoothing';

// v0.49: the velocity-aware smoother taken from the CME-3D lab (PR #25)
describe('lissage selon la vitesse (repris de CME-3D)', () => {
  const dt = 1 / 60;
  it('le premier point passe tel quel', () => {
    const s = new MotionSmoother();
    expect(s.sample(new Vector3(1, 2, 3), dt).toArray()).toEqual([1, 2, 3]);
  });

  it('un tremblement lent est fortement atténué', () => {
    const s = new MotionSmoother();
    s.sample(new Vector3(), dt);
    let worst = 0;
    for (let i = 1; i <= 240; i++) {
      const jitter = new Vector3(i % 2 ? 0.004 : -0.004, 0, 0);
      worst = Math.max(worst, Math.abs(s.sample(jitter, dt).x));
    }
    expect(worst).toBeLessThan(0.002);
  });

  it('un coup rapide passe avec peu de retard', () => {
    const s = new MotionSmoother();
    s.sample(new Vector3(), dt);
    // a hand that travels 0.5 m in 0.1 s (5 m/s), then holds
    let p = new Vector3();
    for (let i = 1; i <= 6; i++) p = s.sample(new Vector3(Math.min(0.5, (i / 6) * 0.5), 0, 0), dt);
    for (let i = 0; i < 6; i++) p = s.sample(new Vector3(0.5, 0, 0), dt);
    expect(p.x).toBeGreaterThan(0.45);
  });

  it('une image figée ou un onglet en pause ne fait pas de saut', () => {
    const s = new MotionSmoother();
    s.sample(new Vector3(), dt);
    const p = s.sample(new Vector3(1, 0, 0), 5);
    expect(p.x).toBeGreaterThan(0);
    expect(p.x).toBeLessThan(1);
    s.reset();
    expect(s.sample(new Vector3(2, 0, 0), dt).x).toBe(2);
  });
});
