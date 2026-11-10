import { describe, expect, it } from 'vitest';
import { LIFE, stutterAt, sweepAt, swayOf } from '../life';
import { ROOMS } from '../rooms';

/**
 * 1.26 salles vivantes (Youssef, 2026-11-06: « des éléments vivants quel que soit l'angle de vue », « reste ultra
 * réaliste »): something moves in every room, gently.
 */
describe('salles vivantes', () => {
  it('chaque salle a sa vie : lampes, fenêtres ou phares selon la salle', () => {
    for (const id of Object.keys(ROOMS) as (keyof typeof LIFE)[]) {
      const l = LIFE[id];
      // 1.27: no more floating dust (Youssef: « supprime la poussière, ça fait trop »)
      expect('dust' in l, id).toBe(false);
      const moving = l.lamps.length + (l.pools?.length ?? 0) + (l.windows?.length ?? 0) + (l.sweep ? 1 : 0);
      expect(moving, id).toBeGreaterThan(0);
    }
  });

  it('une lampe hoquette de temps en temps : court, jamais éteinte, puis plusieurs secondes de calme', () => {
    let dipping = 0;
    let events = 0;
    let prev = 0;
    let maxDim = 0;
    for (let t = 0; t < 120; t += 0.02) {
      const s = stutterAt(t, 6, 3);
      expect(s.lamp).toBeGreaterThanOrEqual(0);
      expect(s.lamp).toBeLessThan(6);
      if (s.dim > 0) dipping += 0.02;
      if (s.dim > 0 && prev === 0) events++;
      maxDim = Math.max(maxDim, s.dim);
      prev = s.dim;
    }
    // about one event every 7 to 13 s, each with 2 to 4 dips
    expect(events).toBeGreaterThan(15);
    expect(events).toBeLessThan(70);
    // dimmed less than 10 % of the time, never fully off
    expect(dipping / 120).toBeLessThan(0.1);
    expect(maxDim).toBeLessThanOrEqual(0.75);
    expect(stutterAt(5, 0).lamp).toBe(-1);
  });

  it('les lampes suspendues se balancent doucement (quelques centimètres), sans jamais s’arrêter', () => {
    let max = 0;
    let moved = 0;
    let last = swayOf(0, 1.7, 0);
    for (let t = 0; t < 60; t += 0.05) {
      const s = swayOf(t, 1.7, 2);
      max = Math.max(max, Math.hypot(...s));
      moved += Math.hypot(s[0] - last[0], s[1] - last[1]);
      last = s;
    }
    expect(max).toBeGreaterThan(0.03);
    expect(max).toBeLessThan(0.1);
    expect(moved).toBeGreaterThan(1);
  });

  it('des phares passent de temps en temps : la bande traverse la salle', () => {
    let seen = 0;
    let maxK = 0;
    for (let t = 0; t < 110; t += 0.05) {
      const s = sweepAt(t);
      if (s.k > 0) {
        seen += 0.05;
        expect(s.pos).toBeGreaterThanOrEqual(0);
        expect(s.pos).toBeLessThanOrEqual(1);
      }
      maxK = Math.max(maxK, s.k);
    }
    expect(seen).toBeGreaterThan(15);
    expect(seen).toBeLessThan(60);
    expect(maxK).toBeLessThanOrEqual(1);
  });
});
