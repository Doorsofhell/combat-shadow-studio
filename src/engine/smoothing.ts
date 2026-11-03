/**
 * Velocity-aware smoothing of a stream of 3D positions, taken from the CME-3D lab (Youssef's PR #25,
 * `cme-3d/src/core/temporal.ts`, 2026-10-23) and adapted to the engine's three.js vectors.
 *
 * Slow movement (a guard that breathes, a tracked point that shakes) is strongly filtered; fast movement
 * (a strike) passes with almost no delay, because the cut-off frequency rises with the measured speed
 * (the idea of the « 1€ filter », Casiez et al., CHI 2012). One instance per tracked point.
 *
 * For streams that are not authored keyframes: a camera target, a point followed on the coach, or later a
 * pose stream from a video or motion capture. The authored motions themselves are never filtered (their
 * timing is checked by the engine tests).
 */
import { Vector3 } from 'three';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export class MotionSmoother {
  private value: Vector3 | null = null;
  private speed = 0;
  /**
   * @param minHz cut-off when still (lower = smoother)
   * @param gain extra cut-off per metre per second of measured speed (higher = less lag on fast moves)
   */
  constructor(
    private readonly minHz = 2.5,
    private readonly gain = 0.09,
  ) {}

  /** the smoothed position after `next`, `seconds` after the previous sample (written into `out` when given) */
  sample(next: Vector3, seconds: number, out = new Vector3()): Vector3 {
    if (!this.value) {
      this.value = next.clone();
      return out.copy(next);
    }
    // one frame between 1/240 s and 1/15 s: a paused tab or a frozen frame never makes a jump
    const dt = clamp(seconds, 1 / 240, 1 / 15);
    const instant = this.value.distanceTo(next) / dt;
    this.speed += (instant - this.speed) * clamp(dt * 12, 0, 1);
    const fc = this.minHz + this.gain * this.speed;
    const alpha = 1 - Math.exp(-2 * Math.PI * fc * dt);
    this.value.lerp(next, alpha);
    return out.copy(this.value);
  }

  /** forget the past (a new motion, a cut of the camera) */
  reset(): void {
    this.value = null;
    this.speed = 0;
  }
}
