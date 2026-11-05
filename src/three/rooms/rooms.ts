import type { DisciplineId } from '../../domain/types';

/**
 * 1.23 Salles immersives (Youssef, 2026-11-05: « que le coaching se fasse chacun dans une salle distincte par rapport à
 * sa discipline… adapter l'ambiance et l'éclairage pour mettre en valeur le coach », then « une ambiance réaliste pas
 * 3D… avec des éléments naturels de type mouvement, balancement, lumière »).
 *
 * Each discipline trains in its own room: a photo-like 360° picture rendered with Blender from where the coach stands
 * (scripts/salles), laid on a ground-projected dome so the floor stays right when the camera turns; the same picture
 * lights and reflects on the coach. What hangs (heavy bags) is drawn apart and swings; the lamps breathe a little.
 * The coach gets the room's own key and rim lights, chosen so he always stands out of the background.
 */

export interface RoomLight {
  pos: [number, number, number];
  color: string;
  intensity: number;
}

export interface RoomSpec {
  id: DisciplineId;
  /** shown in the settings and read by the tests */
  name: string;
  /** colour of the canvas while the picture loads (close to the picture's mean, no flash) */
  background: string;
  /** the picture's reflections on the coach (scene.environmentIntensity) */
  env: number;
  hemi: [string, string, number];
  ambient: number;
  key: RoomLight;
  fill: RoomLight;
  rim: RoomLight;
  rim2?: RoomLight;
  /** how much the lamps of the picture breathe (0: still) */
  flicker: number;
}

/** height of the panorama camera above the floor (scripts/salles/salles.py EYE) */
export const ROOM_EYE = 1.4;
/** radius of the dome the picture is laid on: larger than any camera distance (OrbitControls max 12) */
export const ROOM_RADIUS = 30;

export const ROOMS: Partial<Record<DisciplineId, RoomSpec>> = {
  boxe: {
    id: 'boxe',
    name: 'Salle de boxe à l’ancienne',
    background: '#120e0b',
    env: 0.55,
    hemi: ['#ffe9d0', '#1a120c', 0.55],
    ambient: 0.35,
    key: { pos: [1.2, 4.6, 3], color: '#ffe4c4', intensity: 2.8 },
    fill: { pos: [-3, 1.6, 2.5], color: '#c8d4ff', intensity: 0.35 },
    rim: { pos: [-1.8, 2.6, -3.4], color: '#ffd2a0', intensity: 1.9 },
    rim2: { pos: [2.6, 2.2, -3], color: '#9db8ff', intensity: 0.9 },
    flicker: 1,
  },
  mma: {
    id: 'mma',
    name: 'Académie de MMA',
    background: '#0c0d10',
    env: 0.5,
    hemi: ['#dfe8ff', '#0c0e12', 0.6],
    ambient: 0.35,
    key: { pos: [1, 4.8, 2.8], color: '#f2f6ff', intensity: 2.9 },
    fill: { pos: [-3, 1.6, 2.5], color: '#dfe6ff', intensity: 0.35 },
    rim: { pos: [-2, 2.4, -3.4], color: '#7ea6ff', intensity: 2.0 },
    rim2: { pos: [2.6, 2.0, -3], color: '#ffb4b4', intensity: 0.6 },
    flicker: 0.5,
  },
  kickboxing: {
    id: 'kickboxing',
    name: 'Salle de kick-boxing de nuit',
    background: '#0d0b0c',
    env: 0.5,
    hemi: ['#f3eee8', '#140b0c', 0.55],
    ambient: 0.35,
    key: { pos: [1.3, 4.6, 3], color: '#f6f2ea', intensity: 2.8 },
    fill: { pos: [-3, 1.6, 2.5], color: '#cfdaff', intensity: 0.35 },
    rim: { pos: [-2.2, 2.3, -3.2], color: '#ff6b5e', intensity: 1.7 },
    rim2: { pos: [2.6, 2.2, -3], color: '#9cc0ff', intensity: 1.2 },
    flicker: 0.6,
  },
  muaythai: {
    id: 'muaythai',
    name: 'Camp de muay-thaï',
    background: '#120c08',
    env: 0.55,
    hemi: ['#f4e6d6', '#1a0f08', 0.55],
    ambient: 0.35,
    key: { pos: [1.2, 4.4, 3], color: '#ffe6cc', intensity: 2.8 },
    fill: { pos: [-3, 1.6, 2.5], color: '#ffe6cc', intensity: 0.35 },
    rim: { pos: [-2.4, 2.2, -3], color: '#ffc27a', intensity: 1.8 },
    rim2: { pos: [2.6, 2.0, -3], color: '#8fa6d8', intensity: 0.8 },
    flicker: 1.2,
  },
  judo: {
    id: 'judo',
    name: 'Dojo traditionnel',
    background: '#2a2219',
    env: 0.7,
    hemi: ['#f3efe6', '#3a2c1e', 0.9],
    ambient: 0.4,
    key: { pos: [2.5, 4, 2.5], color: '#fff6ea', intensity: 2.6 },
    fill: { pos: [-3, 2, 2], color: '#e2ebff', intensity: 0.5 },
    rim: { pos: [-1.5, 2.6, -3.5], color: '#ffe0b8', intensity: 1.6 },
    flicker: 0,
  },
  bjj: {
    id: 'bjj',
    name: 'Académie de jiu-jitsu',
    background: '#0f1115',
    env: 0.55,
    hemi: ['#e6eeff', '#0f1218', 0.65],
    ambient: 0.35,
    key: { pos: [1.6, 4.4, 3], color: '#ffffff', intensity: 2.7 },
    fill: { pos: [-3, 1.6, 2.5], color: '#e6eeff', intensity: 0.4 },
    rim: { pos: [-2.2, 2.4, -3.2], color: '#7fb0ff', intensity: 1.8 },
    rim2: { pos: [2.6, 2.0, -3], color: '#cfe0ff', intensity: 0.9 },
    flicker: 0.3,
  },
};

export function roomFor(d: DisciplineId): RoomSpec | null {
  return ROOMS[d] ?? null;
}

/** a heavy bag (or any hanging prop) drawn apart from the picture: it swings around its top */
export interface RoomProp {
  sprite: string;
  /** centre of the picture, in metres (three.js axes, floor at y = 0) */
  at: [number, number, number];
  w: number;
  h: number;
}

export interface RoomData {
  room: string;
  eye: number;
  props: RoomProp[];
  sprites: string[];
}

export const roomDir = (id: DisciplineId) => `./salles/${id}/`;

/**
 * Swing of a hanging bag: a pendulum of the bag's length (period 2π√(L/g)), with an amplitude that slowly grows and
 * fades as if someone had just hit it, different for each bag. Returns the angle in radians, in the picture's plane.
 */
export function swingAngle(t: number, length: number, seed: number): number {
  const w = Math.sqrt(9.81 / Math.max(0.3, length));
  const phase = seed * 2.399;
  // amplitude between about 0.5° and 3°, changing over 20 to 40 s
  const amp = (0.5 + 2.5 * (0.5 + 0.5 * Math.sin(t * (0.16 + 0.05 * (seed % 3)) + phase * 1.7)) ** 2) * (Math.PI / 180);
  return amp * Math.sin(w * t + phase);
}
