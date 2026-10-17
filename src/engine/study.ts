/**
 * "Décomposer" mode: one technique played as a lesson. Starting position, preparation, slow
 * execution, a hold on the key position, return to guard, short pause, and again. The user can
 * also step from key position to key position, pause on any posture and change the speed.
 */
import { Quaternion, Vector3 } from 'three';
import { Motion, MotionSampler, duration } from './motion';
import type { ResolvedPose } from './pose';
import type { CoachRig } from './rig';
import { MotionLibrary, getMotion } from './library';

export type StudyPhase = 'depart' | 'preparation' | 'execution' | 'point' | 'retour' | 'pause';

export const STUDY_PHASE_LABEL: Record<StudyPhase, string> = {
  depart: '1. Position de départ',
  preparation: '2. Préparation',
  execution: '3. Exécution lente',
  point: '4. Point technique',
  retour: '5. Retour en garde',
  pause: '6. On recommence',
};

const HOLD = { depart: 1.3, point: 1.8, pause: 0.9 };

export type Effector = 'handL' | 'handR' | 'footL' | 'footR';

export interface StudyAnalysis {
  /** motion times (speed 1) of the key positions */
  keys: number[];
  /** end of the preparation */
  prep: number;
  /** key position: impact, or the moment of largest displacement */
  peak: number;
  /** limb that does the work */
  effector: Effector;
  /** feet that stay on the floor and turn more than 10° between start and key position */
  pivots: { side: 'L' | 'R'; from: number; to: number }[];
  /** pelvis rotation between start and key position, radians */
  hipTurn: number;
}

const effPos = (p: ResolvedPose, e: Effector) => (e === 'handL' ? p.handL.pos : e === 'handR' ? p.handR.pos : e === 'footL' ? p.footL.ankle : p.footR.ankle);
const yawOf = (q: Quaternion) => {
  const f = new Vector3(0, 0, 1).applyQuaternion(q);
  return Math.atan2(f.x, f.z);
};
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

export function analyseMotion(rig: CoachRig, m: Motion): StudyAnalysis {
  const s = new MotionSampler(rig, m);
  const dur = duration(m);
  const start = s.sample(0);
  const keys = m.keys.map((k) => k.t);
  // limb that moves the most
  let effector: Effector = 'handL';
  let best = -1;
  let peakByMotion = dur / 2;
  for (const e of ['handL', 'handR', 'footL', 'footR'] as Effector[]) {
    for (let i = 1; i <= 24; i++) {
      const t = (dur * i) / 24;
      const d = effPos(s.sample(t), e).distanceTo(effPos(start, e));
      if (d > best) {
        best = d;
        effector = e;
        peakByMotion = t;
      }
    }
  }
  const peak = m.impacts.length ? m.impacts[0] : (keys.reduce((a, k) => (Math.abs(k - peakByMotion) < Math.abs(a - peakByMotion) ? k : a), keys[0]) || peakByMotion);
  const before = keys.filter((k) => k > 0.02 && k < peak - 0.02);
  const prep = before.length ? before[before.length - 1] : peak * 0.45;
  const atPeak = s.sample(peak);
  const pivots: StudyAnalysis['pivots'] = [];
  for (const side of ['L', 'R'] as const) {
    const a = side === 'L' ? start.footL : start.footR;
    const b = side === 'L' ? atPeak.footL : atPeak.footR;
    const planted = a.ankle.y < 0.2 && b.ankle.y < 0.2;
    const from = yawOf(a.rot);
    const to = yawOf(b.rot);
    if (planted && Math.abs(wrap(to - from)) > (10 * Math.PI) / 180) pivots.push({ side, from, to });
  }
  return { keys, prep, peak, effector, pivots, hipTurn: wrap(yawOf(atPeak.pelvis) - yawOf(start.pelvis)) };
}

export class StudyPlayer {
  speed = 0.25;
  playing = true;
  phase: StudyPhase = 'depart';
  /** motion time, seconds at speed 1 */
  t = 0;
  private hold = 0;
  private sampler: MotionSampler | null = null;
  analysis: StudyAnalysis | null = null;
  motion: Motion | null = null;
  onChange?: () => void;

  constructor(
    private rig: CoachRig,
    private lib: MotionLibrary,
    private southpaw: boolean,
  ) {}

  setTechnique(motionId: string) {
    const m = getMotion(this.lib, motionId, this.southpaw) ?? getMotion(this.lib, 'garde', this.southpaw)!;
    this.motion = m;
    this.sampler = new MotionSampler(this.rig, m);
    this.analysis = analyseMotion(this.rig, m);
    this.restart();
  }

  get duration() {
    return this.sampler?.duration ?? 1;
  }

  restart() {
    this.t = 0;
    this.hold = 0;
    this.phase = 'depart';
    this.onChange?.();
  }

  /** jump to the previous / next key position and stay there */
  stepKey(dir: 1 | -1) {
    const a = this.analysis;
    if (!a) return;
    const marks = [...new Set([0, ...a.keys, a.prep, a.peak])].sort((x, y) => x - y);
    const eps = 1e-3;
    const target = dir > 0 ? marks.find((k) => k > this.t + eps) ?? marks[marks.length - 1] : [...marks].reverse().find((k) => k < this.t - eps) ?? 0;
    this.seek(target);
    this.playing = false;
    this.onChange?.();
  }

  seek(t: number) {
    const a = this.analysis;
    this.t = Math.max(0, Math.min(this.duration, t));
    this.hold = 0;
    if (!a) return;
    this.phase = this.t <= 1e-3 ? 'depart' : this.t < a.prep ? 'preparation' : this.t < a.peak - 1e-3 ? 'execution' : Math.abs(this.t - a.peak) <= 1e-3 ? 'point' : 'retour';
  }

  private setPhase(p: StudyPhase) {
    if (p === this.phase) return;
    this.phase = p;
    this.hold = 0;
    this.onChange?.();
  }

  update(dt: number): ResolvedPose {
    const s = this.sampler!;
    const a = this.analysis!;
    if (this.playing) {
      const d = dt * this.speed;
      switch (this.phase) {
        case 'depart':
          this.hold += dt;
          if (this.hold >= HOLD.depart) this.setPhase('preparation');
          break;
        case 'preparation':
          this.t += d;
          if (this.t >= a.prep) this.setPhase('execution');
          break;
        case 'execution':
          this.t += d;
          if (this.t >= a.peak) {
            this.t = a.peak;
            this.setPhase('point');
          }
          break;
        case 'point':
          this.hold += dt;
          if (this.hold >= HOLD.point) this.setPhase('retour');
          break;
        case 'retour':
          this.t += d;
          if (this.t >= s.duration) {
            this.t = s.duration;
            this.setPhase('pause');
          }
          break;
        case 'pause':
          this.hold += dt;
          if (this.hold >= HOLD.pause) {
            this.t = 0;
            this.setPhase('depart');
          }
          break;
      }
    }
    return s.sample(Math.min(this.t, s.duration));
  }
}
