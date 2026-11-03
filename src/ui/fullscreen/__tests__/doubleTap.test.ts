import { describe, expect, test } from 'vitest';
import { createDoubleTap } from '../doubleTap';

/** 0.27 (Youssef, 2026-10-20 22:09): double tap on the 3D coach, never confused with a drag or a pinch */
const tap = (d: ReturnType<typeof createDoubleTap>, x: number, y: number, t: number, len = 80, id = 1) => {
  d.down(id, x, y, t);
  return d.up(id, x, y, t + len);
};

describe('double tap', () => {
  test('two quick taps at the same place: a double tap', () => {
    const d = createDoubleTap();
    expect(tap(d, 100, 100, 0)).toBe('tap');
    expect(tap(d, 103, 102, 250)).toBe('double');
    // the pair is consumed: a third tap starts again
    expect(tap(d, 103, 102, 450)).toBe('tap');
  });

  test('too slow between the taps (> 300 ms): two single taps', () => {
    const d = createDoubleTap();
    expect(tap(d, 100, 100, 0)).toBe('tap');
    expect(tap(d, 100, 100, 80 + 301)).toBe('tap');
  });

  test('a drag (> 10 px) is not a tap and breaks the pair', () => {
    const d = createDoubleTap();
    expect(tap(d, 100, 100, 0)).toBe('tap');
    d.down(1, 100, 100, 150);
    d.move(1, 130, 100);
    expect(d.up(1, 100, 100, 200)).toBe('none');
    expect(tap(d, 100, 100, 260)).toBe('tap');
  });

  test('a long press is not a tap', () => {
    const d = createDoubleTap();
    expect(tap(d, 100, 100, 0, 600)).toBe('none');
  });

  test('second tap far from the first: no double tap', () => {
    const d = createDoubleTap();
    tap(d, 100, 100, 0);
    expect(tap(d, 200, 100, 150)).toBe('tap');
  });

  test('a pinch (two fingers) never toggles', () => {
    const d = createDoubleTap();
    tap(d, 100, 100, 0);
    d.down(1, 100, 100, 120);
    d.down(2, 160, 100, 125);
    expect(d.up(1, 100, 100, 180)).toBe('none');
    expect(d.up(2, 160, 100, 185)).toBe('none');
    expect(tap(d, 100, 100, 230)).toBe('tap');
  });

  test('cancel forgets the first tap', () => {
    const d = createDoubleTap();
    tap(d, 100, 100, 0);
    d.cancel();
    expect(tap(d, 100, 100, 150)).toBe('tap');
  });

  test('custom limits', () => {
    const d = createDoubleTap({ maxGap: 100 });
    tap(d, 0, 0, 0);
    expect(tap(d, 0, 0, 200)).toBe('tap');
  });
});
