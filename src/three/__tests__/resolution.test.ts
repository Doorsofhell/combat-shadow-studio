import { describe, expect, test } from 'vitest';
import { PIXEL_BUDGET, budgetFor, stageDpr } from '../resolution';

// v0.31: the phone drew the coach at 38 % of its screen resolution after one incident (staircase edges) and at
// 57 % in automatic quality (soft edges). Pixel 7: 412 × 386 CSS pixels on the home screen, ratio 2.625.
describe('résolution du rendu 3D', () => {
  test('qualité haute : la résolution de l’écran du téléphone', () => {
    expect(stageDpr(412, 386, 2.625, PIXEL_BUDGET.haute)).toBe(2.62);
    expect(stageDpr(412, 700, 2.625, PIXEL_BUDGET.haute)).toBeGreaterThan(2.2);
  });
  test('qualité légère : toujours plus de 2 pixels par point sur un téléphone', () => {
    expect(stageDpr(412, 386, 2.625, budgetFor('basse', 1))).toBeGreaterThan(2);
  });
  test('après deux incidents : au moins la résolution CSS', () => {
    expect(stageDpr(412, 386, 2.625, budgetFor('basse', 2))).toBeGreaterThanOrEqual(1.5);
  });
  test('grand écran : borné par le budget, jamais au-delà de l’écran', () => {
    expect(stageDpr(1920, 1080, 1, PIXEL_BUDGET.haute)).toBe(1);
    const d = stageDpr(2560, 1440, 2, PIXEL_BUDGET.haute);
    expect(2560 * 1440 * d * d).toBeLessThanOrEqual(PIXEL_BUDGET.haute * 1.01);
  });
});
