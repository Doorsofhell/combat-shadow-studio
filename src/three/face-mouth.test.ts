import { describe, expect, it } from 'vitest';
import { expressionWeights, type FaceIdle } from './face';

const idle: FaceIdle = { focus: 0.6, brow: 0.3, press: 0.8, smile: 0.7, side: 0.2, breath: 0.8 };

describe('natural mouth expression', () => {
  it('keeps the mouth lightly closed at rest without showing teeth', () => {
    const w = expressionWeights(0, 0, 0, idle);
    expect(w.MouthClose).toBeGreaterThan(0);
    expect(w.JawOpen).toBe(0);
    expect(w.MouthFunnel).toBe(0);
    expect(w.MouthSmileLeft).toBeLessThan(0.25);
  });

  it('does not stack extreme lip and jaw deformations during an exhale', () => {
    const w = expressionWeights(0, 1, 1, idle);
    expect(w.JawOpen).toBeLessThanOrEqual(0.2);
    expect(w.MouthFunnel).toBeLessThanOrEqual(0.3);
    expect(w.MouthStretchLeft).toBeLessThanOrEqual(0.1);
    expect(w.MouthPressLeft).toBe(0);
  });

  it('makes the mouth return to a closed resting expression after effort', () => {
    const active = expressionWeights(0, 1, 1, idle);
    const recovered = expressionWeights(0, 0, 0, idle);
    expect(recovered.MouthClose).toBeGreaterThan(active.MouthClose ?? 0);
    expect(recovered.JawOpen).toBe(0);
  });
});
