import type { DisciplineId } from '../../domain/types';

/**
 * 1.26 Salles vivantes (Youssef, 2026-11-06: « il n'y a rien de vivant dans les scènes … des lumières qui clignotent
 * légèrement, des sacs de frappe qui se balancent, sur les fenêtres des ombres qui se déplacent ; sois créatif mais
 * reste ultra réaliste », then « il faut des éléments vivants quel que soit l'angle de vue »).
 *
 * What moves in each room, placed where it is in the room built by scripts/salles/salles.py (three.js axes: x, y up,
 * z = −y of Blender; the coach stands at the origin):
 * - lamps: a lamp of the room now and then stutters like an old tube (two to four quick dips), and the coach's own
 *   lights dip with it when it is close to him;
 * - pools: the light a hanging lamp throws on the floor sways with it (a pendulum on its cable);
 * - windows: soft shadows of branches swaying and of clouds passing over the windows or the paper screens;
 * - sweep: at night, the headlights of a passing car run across the ceiling and through the windows;
 * (1.27: the floating dust of 1.26 is gone, Youssef 2026-11-06: « supprime la poussière, ça fait trop ».)
 * The functions below are pure (time in seconds): the tests check their range, the shader and the lights use them.
 */
export type V3 = [number, number, number];

export interface RoomLife {
  /** lamps that can stutter (centre of the glowing part) */
  lamps: V3[];
  /** hanging lamps whose pool of light sways on the floor: lamp centre and cable length (m) */
  pools?: { at: V3; cable: number }[];
  /** boxes (min, max) where shadows of branches pass: windows, shoji screens */
  windows?: { min: V3; max: V3 }[];
  /** ceiling height crossed by passing headlights, and the plane of the windows they come through (z) */
  sweep?: { ceiling: number; windowZ: number };
}

export const LIFE: Record<DisciplineId, RoomLife> = {
  boxe: {
    lamps: [
      [-3.2, 3.5, 1.5],
      [3.2, 3.5, 1.5],
      [-3.2, 3.5, -2.5],
      [3.2, 3.5, -2.5],
      [-3.5, 3.5, 7],
      [3.5, 3.5, 7],
    ],
    pools: [
      { at: [-3.2, 3.5, 1.5], cable: 1.7 },
      { at: [3.2, 3.5, 1.5], cable: 1.7 },
      { at: [-3.2, 3.5, -2.5], cable: 1.7 },
      { at: [3.2, 3.5, -2.5], cable: 1.7 },
    ],
    windows: [{ min: [-9.2, 2.85, -5.4], max: [-8.7, 4.35, 5.4] }],
  },
  kickboxing: {
    lamps: [
      [-2.5, 4.75, 0],
      [2.5, 4.75, 0],
      [-2.5, 4.75, -6],
      [2.5, 4.75, -6],
      [-2.5, 4.75, 6],
      [2.5, 4.75, 6],
    ],
    windows: [{ min: [-7, 1.2, -17], max: [7, 4, -11.9] }],
    sweep: { ceiling: 4.8, windowZ: -12 },
  },
  muaythai: {
    lamps: [
      [-3, 3.1, 3],
      [3, 3.1, 3],
      [-3, 3.1, -2],
      [3, 3.1, -2],
      [-1.5, 3.1, -9.6],
      [1.5, 3.1, -9.6],
    ],
    pools: [
      { at: [-3, 3.1, 3], cable: 1.35 },
      { at: [3, 3.1, 3], cable: 1.35 },
      { at: [-3, 3.1, -2], cable: 1.35 },
      { at: [3, 3.1, -2], cable: 1.35 },
      { at: [-1.5, 3.1, -9.6], cable: 1.35 },
      { at: [1.5, 3.1, -9.6], cable: 1.35 },
    ],
  },
  mma: {
    lamps: [
      [-2.4, 5.4, 0],
      [2.4, 5.4, 0],
      [-3, 5.4, 5],
      [0, 5.4, 5],
      [3, 5.4, 5],
      [-1.6, 5.4, -8.6],
      [1.6, 5.4, -8.6],
      [0, 5.4, -10.2],
      [-1.6, 5.4, -11.8],
      [1.6, 5.4, -11.8],
    ],
  },
  judo: {
    lamps: [],
    windows: [
      { min: [-7.3, 0.95, -8], max: [-6.7, 3.3, 8] },
      { min: [6.7, 0.95, -8], max: [7.3, 3.3, 8] },
      { min: [-7, 0.95, -8.3], max: [7, 3.3, -7.7] },
      { min: [-7, 0.95, 7.7], max: [7, 3.3, 8.3] },
    ],
  },
  bjj: {
    lamps: [
      [-4.5, 4.15, 7],
      [0, 4.15, 7],
      [4.5, 4.15, 7],
      [-4.5, 4.15, 2.5],
      [0, 4.15, 2.5],
      [4.5, 4.15, 2.5],
      [-4.5, 4.15, -2],
      [0, 4.15, -2],
      [4.5, 4.15, -2],
      [-4.5, 4.15, -6.5],
      [0, 4.15, -6.5],
      [4.5, 4.15, -6.5],
    ],
  },
};

const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/**
 * A lamp stutters now and then: every 7 to 13 s one lamp (the same for the whole event) dips two to four times in
 * about 0.7 s, like a tired tube or a loose bulb. Returns the lamp and how much of its light is missing (0 to 0.75).
 */
export function stutterAt(t: number, lamps: number, seed = 1): { lamp: number; dim: number } {
  if (lamps <= 0) return { lamp: -1, dim: 0 };
  // events every 7 to 13 s
  let start = 2.5;
  let k = 0;
  while (start + 7 + 6 * hash(seed * 31 + k) <= t) {
    start += 7 + 6 * hash(seed * 31 + k);
    k++;
  }
  const lamp = Math.floor(hash(seed * 17 + k * 3.1) * lamps) % lamps;
  const u = t - start;
  if (u < 0 || u > 0.75) return { lamp, dim: 0 };
  const dips = 2 + Math.floor(hash(seed * 7 + k) * 3);
  const phase = (u / 0.75) * dips;
  const inDip = phase - Math.floor(phase) < 0.45;
  return { lamp, dim: inDip ? 0.55 + 0.2 * hash(seed + k * 13 + Math.floor(phase)) : 0 };
}

/** how far a hanging lamp is out of its rest place (m, along x and z): a slow pendulum on its cable, never at rest */
export function swayOf(t: number, cable: number, i: number): [number, number] {
  const w = Math.sqrt(9.81 / Math.max(0.4, cable));
  const amp = 0.04 + 0.03 * (0.5 + 0.5 * Math.sin(t * 0.13 + i * 1.7));
  return [amp * Math.sin(w * t + i * 2.1), amp * 0.6 * Math.sin(w * 0.93 * t + i * 0.7 + 1.2)];
}

/** the headlights of a passing car: where the band of light is along the room (0 at the windows, 1 at the far end), and how bright (0 when no car) */
export function sweepAt(t: number, seed = 3): { pos: number; k: number } {
  const period = 11;
  const n = Math.floor(t / period);
  const u = t - n * period - 2 * hash(seed + n);
  const dur = 2.4 + 1.2 * hash(seed * 5 + n);
  if (u < 0 || u > dur) return { pos: 0, k: 0 };
  const x = u / dur;
  return { pos: x, k: Math.sin(Math.PI * x) * (0.6 + 0.4 * hash(seed * 9 + n)) };
}
