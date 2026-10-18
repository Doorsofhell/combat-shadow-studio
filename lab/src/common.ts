/**
 * Shared by the two lab pages: scenarios, camera, lights and the motion driver. The driver is the
 * app's own animation engine (CoachRig, MotionSampler, ComboPlayer): both versions play exactly the
 * same poses; only the renderer differs.
 */
import type { CoachRig } from '../../src/engine/rig';
import type { ResolvedPose } from '../../src/engine/pose';
import { getLibrary, getMotion } from '../../src/engine/library';
import { MotionSampler, duration } from '../../src/engine/motion';
import { ComboPlayer } from '../../src/engine/player';
import { analyseMotion } from '../../src/engine/study';

export type Coach = 'homme' | 'femme';
export type Quality = 'haute' | 'basse';

export const SCENARIOS = ['garde', 'jab', 'direct', 'crochet-avant', 'uppercut-arriere', 'pivot-droite', 'combo'] as const;
export type Scenario = (typeof SCENARIOS)[number];
const COMBO = ['jab', 'direct', 'crochet-avant'];

export interface LabParams {
  coach: Coach;
  scenario: Scenario;
  quality: Quality;
  /** fixed time in seconds; 'key' = key moment of the motion; absent = plays live */
  t: number | 'key' | null;
  look: 'realiste' | 'encre';
  width: number;
  height: number;
}

export function params(): LabParams {
  const q = new URLSearchParams(location.search);
  const t = q.get('t');
  return {
    coach: (q.get('coach') ?? 'homme') as Coach,
    scenario: (q.get('s') ?? 'garde') as Scenario,
    quality: (q.get('q') ?? 'haute') as Quality,
    t: t === null ? null : t === 'key' ? 'key' : Number(t),
    look: q.get('look') === 'encre' ? 'encre' : 'realiste',
    width: Number(q.get('w') ?? 720),
    height: Number(q.get('h') ?? 1280),
  };
}

export const modelUrl = (c: Coach) => `./models/coach_${c === 'homme' ? 'male' : 'female'}.glb`;

/** same fixed camera in both versions: 3/4 front, lead side, whole body and the space of the moves */
export const CAMERA = { fov: 30, near: 0.05, far: 50, target: [0, 0.98, 0.2] as const, az: 35, el: 7, dist: 5.4 };
export function cameraPosition(): [number, number, number] {
  const a = (CAMERA.az * Math.PI) / 180;
  const e = (CAMERA.el * Math.PI) / 180;
  const [x, y, z] = CAMERA.target;
  return [x + Math.sin(a) * Math.cos(e) * CAMERA.dist, y + Math.sin(e) * CAMERA.dist, z + Math.cos(a) * Math.cos(e) * CAMERA.dist];
}

/** the app's studio lights (src/three/StudioStage.tsx), in three.js units */
export const LIGHTS = {
  hemi: { sky: '#ffffff', ground: '#d9d4cf', intensity: 0.9 },
  dirs: [
    { pos: [2.2, 4.2, 3.2], intensity: 2.1, color: '#ffffff' },
    { pos: [-3, 2.5, 1.5], intensity: 0.75, color: '#f3f6ff' },
    { pos: [0, 3, -4], intensity: 1.1, color: '#ffffff' },
  ],
  shadow: { opacity: 0.42, color: '#3a3530' },
};

/** bones compared between the two versions */
export const PROBE_BONES = ['Hips', 'Spine2', 'Head', 'LeftHand', 'RightHand', 'LeftForeArm', 'RightForeArm', 'LeftFoot', 'RightFoot', 'LeftToeBase', 'RightToeBase'];

export interface Driver {
  /** key moments to photograph */
  keyTimes: number[];
  length: number;
  poseAt(t: number): ResolvedPose;
  live(dt: number): ResolvedPose;
}

export function makeDriver(rig: CoachRig, scenario: Scenario): Driver {
  const lib = getLibrary(rig, 'boxing');
  if (scenario === 'combo') {
    const make = () => {
      const p = new ComboPlayer(rig, lib, false);
      p.setSequence(COMBO.map((id) => ({ techniqueId: id, motionId: id })), 0.6);
      p.play();
      return p;
    };
    let live = make();
    const impacts: number[] = [];
    {
      // impact times measured by playing the combo once
      const p = new ComboPlayer(rig, lib, false, { onImpact: () => impacts.push(clock) });
      p.setSequence(COMBO.map((id) => ({ techniqueId: id, motionId: id })), 0.6);
      p.play();
      let clock = 0;
      while (clock < 3 && impacts.length < 3) {
        clock += 1 / 120;
        p.update(1 / 120);
      }
    }
    return {
      keyTimes: impacts.map((x) => Math.round(x * 120) / 120),
      length: 3,
      poseAt(t) {
        const p = make();
        let pose = p.update(0);
        for (let x = 0; x < t - 1e-9; x += 1 / 120) pose = p.update(Math.min(1 / 120, t - x));
        return pose;
      },
      live(dt) {
        return live.update(dt);
      },
    };
  }
  const m = getMotion(lib, scenario, false)!;
  const s = new MotionSampler(rig, m);
  const len = duration(m) + 0.5;
  const peak = scenario === 'garde' ? 0 : analyseMotion(rig, m).peak;
  let clock = 0;
  return {
    keyTimes: [peak],
    length: len,
    poseAt: (t) => s.sample(Math.min(t, duration(m))),
    live(dt) {
      clock = (clock + dt) % len;
      return s.sample(Math.min(clock, duration(m)));
    },
  };
}

/**
 * Counts WebGL draw calls and triangles per frame the same way for both engines, by wrapping the
 * WebGL draw functions before the engine creates its context.
 */
export const draws = { calls: 0, tris: 0, lastCalls: 0, lastTris: 0 };
export function installDrawCounter() {
  for (const C of [WebGL2RenderingContext, WebGLRenderingContext]) {
    const proto = C.prototype as unknown as Record<string, (...a: number[]) => void>;
    for (const name of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
      const orig = proto[name];
      if (!orig) continue;
      const countArg = name.startsWith('drawElements') ? 1 : 2;
      const inst = name.endsWith('Instanced') ? (name.startsWith('drawElements') ? 4 : 3) : -1;
      proto[name] = function (this: unknown, ...a: number[]) {
        draws.calls++;
        if (a[0] === 4) draws.tris += (a[countArg] / 3) * (inst >= 0 ? a[inst] : 1);
        return orig.apply(this, a);
      };
    }
  }
}
/** call once per displayed frame */
export function endFrame() {
  draws.lastCalls = draws.calls;
  draws.lastTris = draws.tris;
  draws.calls = 0;
  draws.tris = 0;
}

/** frame timing collected the same way in both versions */
export class FrameStats {
  private last = 0;
  readonly dts: number[] = [];
  tick(now: number) {
    if (this.last) this.dts.push(now - this.last);
    this.last = now;
  }
  summary() {
    const d = [...this.dts].sort((a, b) => a - b);
    const mean = d.reduce((a, b) => a + b, 0) / Math.max(1, d.length);
    const sd = Math.sqrt(d.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, d.length));
    const p99 = d[Math.floor(d.length * 0.99)] ?? 0;
    return { frames: d.length, fpsMean: 1000 / mean, fpsMin: 1000 / (d[d.length - 1] ?? 1), fps1Low: 1000 / p99, frameMsMean: mean, frameMsSd: sd };
  }
}

export interface LabWindow {
  __lab?: {
    ready: boolean;
    engine: 'three' | 'babylon';
    timings: Record<string, number>;
    keyTimes: number[];
    setTime(t: number): void;
    joints(): Record<string, [number, number, number]>;
    startStats(): void;
    stats(): ReturnType<FrameStats['summary']> & { drawCalls: number; triangles: number };
    heap(): number | null;
  };
}

export function heap(): number | null {
  const m = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
  return m ? m.usedJSHeapSize : null;
}

/** GLB download time from resource timing */
export function glbTiming(url: string) {
  const e = performance.getEntriesByType('resource').find((r) => r.name.includes(url.replace('./', '/'))) as PerformanceResourceTiming | undefined;
  return e ? { glbFetchMs: e.responseEnd - e.startTime, glbBytes: e.encodedBodySize || e.transferSize } : {};
}
