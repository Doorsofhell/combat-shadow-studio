import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { WRINKLES_ON_COACHES } from '../wrinkles';

// 1.40.1 (Youssef 13/11 22:36): no procedural lines on the coaches' faces (dotted marks on phones)
describe('1.40.1 visages nets', () => {
  test('les rides procédurales ne sont plus posées sur la peau des coachs', () => {
    expect(WRINKLES_ON_COACHES).toBe(false);
    const src = readFileSync('src/three/PhotoCoach.tsx', 'utf8');
    // the only call that puts the wrinkle shader on a skin is guarded by the switch
    expect(src).toMatch(/if \(f\.wrinkles && WRINKLES_ON_COACHES\)/);
    expect(src.match(/applyWrinkles\(/g)?.length).toBe(1);
  });
});
