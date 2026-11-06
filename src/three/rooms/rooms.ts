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
/** 1.26 layer of what belongs to the room: drawn by the camera, left out of the coach's floor shadow (ContactShadows) */
export const ROOM_LAYER = 1;

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

/** farthest distance of the depth picture (scripts/salles/salles.py DMAX) */
export const DEPTH_MAX = 60;
/** what is farther than this is drawn at this distance (inside the camera's far plane) */
export const ROOM_FAR = 40;

/** depth picture of a room: distance in metres per pixel, rows from the top */
export interface RoomDepth {
  w: number;
  h: number;
  d: Float32Array;
}

/** the 8-bit PNG keeps 16 bits per pixel: high byte in red, low byte in green (compose.py) */
export function decodeDepth(rgba: Uint8ClampedArray | Uint8Array, w: number, h: number): RoomDepth {
  const d = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) d[i] = ((rgba[i * 4] * 256 + rgba[i * 4 + 1]) / 65535) * DEPTH_MAX;
  return { w, h, d };
}

/**
 * direction of a pixel of the panorama (u from the left, r from the top, both 0 to 1), as the dome shows it
 * (GroundedSkybox: sphere mirrored in z, turned a quarter around y in RoomScene): the centre of the picture is -z
 */
export function panoDir(u: number, r: number): [number, number, number] {
  const th = Math.PI * r;
  const ph = 2 * Math.PI * u;
  return [-Math.sin(ph) * Math.sin(th), Math.cos(th), Math.cos(ph) * Math.sin(th)];
}

function sample(dp: RoomDepth, u: number, r: number) {
  const x = ((u * dp.w - 0.5) % dp.w + dp.w) % dp.w;
  const y = Math.min(dp.h - 1, Math.max(0, r * dp.h - 0.5));
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const x1 = (x0 + 1) % dp.w, y1 = Math.min(dp.h - 1, y0 + 1);
  const fx = x - x0, fy = y - y0;
  const at = (xx: number, yy: number) => dp.d[yy * dp.w + xx];
  // nearest across an edge (a post in front of a far wall): no point floating half way between them
  const v = [at(x0, y0), at(x1, y0), at(x0, y1), at(x1, y1)];
  const lo = Math.min(...v), hi = Math.max(...v);
  if (hi > lo * 1.15) return v[(fx < 0.5 ? 0 : 1) + (fy < 0.5 ? 0 : 2)];
  return (v[0] * (1 - fx) + v[1] * fx) * (1 - fy) + (v[2] * (1 - fx) + v[3] * fx) * fy;
}

/**
 * 1.25 (Youssef, 2026-11-06: « ajuster les arrière-fonds à la taille des coachs »): the panorama is laid on a mesh
 * pushed out to the real distance of what each pixel shows, from where it was taken (the coach's place, eye high).
 * Seen from the training camera, 5 m in front of the coach, the ring at the back is then as small as it should be,
 * instead of the size it has from the coach's place. Triangles across an edge (a post in front of a far wall) are
 * left out: they would stretch; the dome behind fills those small gaps.
 */
export function roomMesh(dp: RoomDepth, eye = ROOM_EYE, cols = 192, rows = 96) {
  const pos = new Float32Array((cols + 1) * (rows + 1) * 3);
  const uv = new Float32Array((cols + 1) * (rows + 1) * 2);
  const dist = new Float32Array((cols + 1) * (rows + 1));
  for (let j = 0; j <= rows; j++)
    for (let i = 0; i <= cols; i++) {
      const k = j * (cols + 1) + i;
      const u = i / cols, r = j / rows;
      const dd = Math.min(ROOM_FAR, Math.max(0.05, sample(dp, u, r)));
      const [x, y, z] = panoDir(u, r);
      pos.set([x * dd, eye + y * dd, z * dd], k * 3);
      uv.set([u, 1 - r], k * 2);
      dist[k] = dd;
    }
  const index: number[] = [];
  const ok = (a: number, b: number, c: number) => {
    const hi = Math.max(dist[a], dist[b], dist[c]);
    const lo = Math.min(dist[a], dist[b], dist[c]);
    return hi < lo * 2.2;
  };
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const a = j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1;
      if (ok(a, c, b)) index.push(a, c, b);
      if (ok(b, c, d)) index.push(b, c, d);
    }
  return { pos, uv, index };
}
