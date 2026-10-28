import { beforeEach, describe, expect, it } from 'vitest';
import { PULSE_MIN_GAP_MS, onPulse, pulse, resetPulse } from '../pulse';

describe('pulsation (1.4.0)', () => {
  beforeEach(() => resetPulse());

  it('jamais plus de 3 éclairs par seconde', () => {
    const seen: string[] = [];
    const off = onPulse((k) => seen.push(k));
    // a signal every 100 ms for 2 s: only those 1/3 s apart flash
    for (let t = 0; t <= 2000; t += 100) pulse('move', 1000 + t);
    off();
    expect(PULSE_MIN_GAP_MS).toBeGreaterThanOrEqual(1000 / 3);
    expect(seen.length).toBeLessThanOrEqual(7);
    expect(seen.length).toBeGreaterThanOrEqual(5);
  });

  it('chaque signal assez espacé donne un éclair, avec son type', () => {
    const seen: string[] = [];
    const off = onPulse((k) => seen.push(k));
    expect(pulse('count', 0)).toBe(true);
    expect(pulse('count', 1000)).toBe(true);
    expect(pulse('gong', 1100)).toBe(false);
    expect(pulse('gong', 2000)).toBe(true);
    off();
    expect(seen).toEqual(['count', 'count', 'gong']);
    // no listener left: nothing breaks
    expect(pulse('move', 5000)).toBe(true);
  });
});
