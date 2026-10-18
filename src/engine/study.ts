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
import { techniquePhases, type TechniquePhase } from './phases';
import type { TechniqueCategory } from '../domain/types';

export type StudyPhase = 'reel' | 'depart' | 'preparation' | 'execution' | 'point' | 'retour' | 'pause';

export const STUDY_PHASE_LABEL: Record<StudyPhase, string> = {
  reel: 'Vitesse réelle',
  depart: '1. Position de départ',
  preparation: '2. Préparation',
  execution: '3. Exécution lente',
  point: '4. Point technique',
  retour: '5. Retour en garde',
  pause: '6. On recommence',
};

const HOLD = { depart: 1.3, point: 1.8, pause: 0.9, step: 1.2, reel: 0.6 };

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
  /** teaching phases measured on the animation (see phases.ts) */
  phases: TechniquePhase[] = [];
  /** stop a moment at the end of each teaching phase during the slow passes */
  stopAtPhases = true;
  /** play the whole technique once at real speed before the slow lesson */
  preview = false;
  /** end of the phase being replayed alone, then the player pauses */
  private replayEnd: number | null = null;
  /** phase shown while replaying it or stopped on its end */
  private pinned: number | null = null;
  private stepHold = 0;
  onChange?: () => void;

  constructor(
    private rig: CoachRig,
    private lib: MotionLibrary,
    private southpaw: boolean,
  ) {}

  setTechnique(motionId: string, category?: TechniqueCategory, techniqueId = motionId) {
    const m = getMotion(this.lib, motionId, this.southpaw) ?? getMotion(this.lib, 'garde', this.southpaw)!;
    this.motion = m;
    this.sampler = new MotionSampler(this.rig, m);
    this.analysis = analyseMotion(this.rig, m);
    this.phases = category ? techniquePhases(this.rig, m, category, techniqueId, this.analysis) : [];
    this.restart();
  }

  /** index in `phases` of the teaching phase shown now */
  get phaseIndex() {
    const ph = this.phases;
    if (!ph.length) return -1;
    const at = (k: TechniquePhase['kind']) => ph.findIndex((p) => p.kind === k);
    if (this.phase === 'depart' || this.phase === 'reel' || this.t <= 1e-3) return at('depart');
    if (this.pinned !== null) return this.pinned;
    if (this.phase === 'point') return at('cle');
    const a = this.analysis!;
    if (this.t >= a.peak - 1e-3) return Math.abs(this.t - a.peak) <= 1e-3 || at('retour') < 0 ? at('cle') : at('retour');
    // the phase being completed next (phases overlap), else the latest one started
    const work = ph.map((p, i) => ({ p, i })).filter(({ p }) => p.kind !== 'depart' && p.kind !== 'cle' && p.kind !== 'retour');
    const running = work.filter(({ p }) => p.t0 <= this.t + 1e-3 && this.t < p.t1 - 1e-4).sort((x, y) => x.p.t1 - y.p.t1)[0];
    if (running) return running.i;
    const started = work.filter(({ p }) => p.t0 <= this.t + 1e-3);
    return started.length ? started[started.length - 1].i : at('depart');
  }

  /** replays one teaching phase at the current speed and stops on its end */
  playPhase(i: number) {
    const p = this.phases[i];
    if (!p) return;
    this.seek(p.t0);
    this.pinned = i;
    if (p.t1 > p.t0 + 1e-3) {
      this.replayEnd = p.t1;
      this.playing = true;
    } else {
      this.playing = false;
    }
    this.onChange?.();
  }

  get duration() {
    return this.sampler?.duration ?? 1;
  }

  restart() {
    this.t = 0;
    this.hold = 0;
    this.stepHold = 0;
    this.replayEnd = null;
    this.pinned = null;
    this.phase = this.preview ? 'reel' : 'depart';
    this.onChange?.();
  }

  /** jump to the previous / next key position and stay there */
  stepKey(dir: 1 | -1) {
    const a = this.analysis;
    if (!a) return;
    const marks = [...new Set([0, ...a.keys, a.prep, a.peak, ...this.phases.map((p) => p.t1)])].sort((x, y) => x - y);
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
    this.stepHold = 0;
    this.replayEnd = null;
    this.pinned = null;
    if (!a) return;
    this.phase = this.t <= 1e-3 ? 'depart' : this.t < a.prep ? 'preparation' : this.t < a.peak - 1e-3 ? 'execution' : Math.abs(this.t - a.peak) <= 1e-3 ? 'point' : 'retour';
  }

  private setPhase(p: StudyPhase) {
    if (p === this.phase) return;
    this.phase = p;
    this.hold = 0;
    this.onChange?.();
  }

  /** slow pass: advances to t + d, stopping a moment on the end of each teaching phase */
  private advance(d: number, dt: number, limit: number) {
    if (this.stepHold > 0) {
      this.stepHold -= dt;
      if (this.stepHold <= 0) {
        this.pinned = null;
        this.onChange?.();
      }
      return;
    }
    const next = this.t + d;
    const stop = this.stopAtPhases ? this.phases.find((p) => p.kind !== 'depart' && p.kind !== 'cle' && p.kind !== 'retour' && p.t1 > this.t + 1e-4 && p.t1 <= next && p.t1 < limit - 1e-3) : undefined;
    if (stop) {
      this.t = stop.t1;
      this.stepHold = HOLD.step;
      this.pinned = this.phases.indexOf(stop);
      this.onChange?.();
    } else this.t = next;
  }

  update(dt: number): ResolvedPose {
    const s = this.sampler!;
    const a = this.analysis!;
    if (this.playing && this.replayEnd !== null) {
      this.t = Math.min(this.replayEnd, this.t + dt * this.speed);
      if (this.t >= this.replayEnd - 1e-6) {
        this.replayEnd = null;
        this.playing = false;
        this.onChange?.();
      }
    } else if (this.playing) {
      // a replayed phase stays shown until the lesson moves on
      if (this.pinned !== null && this.stepHold <= 0) this.pinned = null;
      const d = dt * this.speed;
      switch (this.phase) {
        case 'reel':
          if (this.t < s.duration) {
            this.t = Math.min(s.duration, this.t + dt);
            this.hold = 0;
          } else {
            this.hold += dt;
            if (this.hold >= HOLD.reel) {
              this.t = 0;
              this.setPhase('depart');
            }
          }
          break;
        case 'depart':
          this.hold += dt;
          if (this.hold >= HOLD.depart) this.setPhase('preparation');
          break;
        case 'preparation':
          this.advance(d, dt, a.peak);
          if (this.t >= a.prep) this.setPhase('execution');
          break;
        case 'execution':
          this.advance(d, dt, a.peak);
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
