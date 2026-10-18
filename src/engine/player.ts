/**
 * Combination player: plays technique motions one after another with overlapping blends
 * (no return to a neutral pose between strikes), idles in guard between repetitions,
 * repositions the coach after footwork, and reports what is being played.
 */
import { Motion, MotionSampler, chainPoint, motionPhase } from './motion';
import { ResolvedPose, blendResolved, transformResolved } from './pose';
import type { CoachRig } from './rig';
import { MotionLibrary, getMotion } from './library';

export interface PlayerStep {
  techniqueId: string;
  motionId: string;
}

export interface PlayerEvents {
  /** a step of the sequence starts (index in the user sequence, -1 for automatic moves) */
  onStep?: (index: number, techniqueId: string, rep: number, timeToNext: number) => void;
  onImpact?: (techniqueId: string) => void;
  /** a full repetition of the sequence has been played */
  onRep?: (rep: number) => void;
  /** idle / rest phase between repetitions begins */
  onRest?: (seconds: number) => void;
}

interface Active {
  sampler: MotionSampler;
  t: number;
  origin: { x: number; z: number; yaw: number };
  index: number;
  techniqueId: string;
  impactsDone: number;
  auto: boolean;
}

const IDLE = 'garde';
const smooth = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));

export class ComboPlayer {
  speed = 1;
  private steps: PlayerStep[] = [];
  private rest = 1;
  private playing = false;
  private cur: Active;
  private next: Active | null = null;
  private blendLen = 0.12;
  private stepIndex = 0;
  private rep = 0;
  private restLeft = 0;
  private queueAuto: string[] = [];
  private samplers = new Map<string, MotionSampler>();
  private lastPose: ResolvedPose | null = null;
  origin = { x: 0, z: 0, yaw: 0 };
  /** posture held when nothing plays: the guard, or the neutral standing posture (fighter creator) */
  private idle = IDLE;

  constructor(
    private rig: CoachRig,
    private lib: MotionLibrary,
    private southpaw: boolean,
    public events: PlayerEvents = {},
  ) {
    this.cur = this.make(this.idle, -1, this.idle, true);
  }

  private sampler(motionId: string): MotionSampler {
    const key = `${motionId}${this.southpaw ? '@g' : ''}`;
    let s = this.samplers.get(key);
    if (!s) {
      const m: Motion | undefined = getMotion(this.lib, motionId, this.southpaw) ?? getMotion(this.lib, IDLE, this.southpaw);
      s = new MotionSampler(this.rig, m!);
      this.samplers.set(key, s);
    }
    return s;
  }

  private make(motionId: string, index: number, techniqueId: string, auto: boolean): Active {
    return { sampler: this.sampler(motionId), t: 0, origin: { ...this.origin }, index, techniqueId, impactsDone: 0, auto };
  }

  setSequence(steps: PlayerStep[], rest: number) {
    this.steps = steps;
    this.rest = rest;
    this.stepIndex = 0;
    this.rep = 0;
  }

  /** posture between repetitions and when there is no sequence; takes effect at once if idling */
  setIdle(motionId: string) {
    if (motionId === this.idle) return;
    this.idle = motionId;
    if (this.cur.auto && this.cur.index === -1) this.cur = this.make(this.idle, -1, this.idle, true);
  }

  setSouthpaw(v: boolean) {
    if (v === this.southpaw) return;
    this.southpaw = v;
    this.samplers.clear();
  }

  get isPlaying() {
    return this.playing;
  }

  get repetitions() {
    return this.rep;
  }

  get currentIndex() {
    return this.cur.auto ? -1 : this.cur.index;
  }

  /** the step being played (motion, time and stance origin), or null when the coach is in guard */
  activeStep(): { techniqueId: string; motion: Motion; t: number; origin: { x: number; z: number; yaw: number } } | null {
    const a = this.next ?? this.cur;
    if (a.auto) return null;
    return { techniqueId: a.techniqueId, motion: a.sampler.motion, t: a.t, origin: a.origin };
  }

  /** the step being played and its phase, or null in guard, at rest or paused */
  phaseNow(): { techniqueId: string; phase: 'preparation' | 'execution' | 'retour' } | null {
    const a = this.next ?? this.cur;
    if (!this.playing || a.auto) return null;
    return { techniqueId: a.techniqueId, phase: motionPhase(a.sampler.motion, a.t) };
  }

  play() {
    this.playing = true;
  }

  pause() {
    this.playing = false;
  }

  /** back to guard at the centre, sequence from the start */
  restart() {
    this.origin = { x: 0, z: 0, yaw: 0 };
    this.cur = this.make(this.idle, -1, this.idle, true);
    this.next = null;
    this.stepIndex = 0;
    this.rep = 0;
    this.restLeft = 0;
    this.queueAuto = [];
  }

  /** advance by dt real seconds; returns the pose to apply */
  update(dt: number): ResolvedPose {
    if (!this.playing) {
      // keep breathing in guard while paused, slowly
      if (!this.lastPose) this.lastPose = this.sample(this.cur);
      return this.lastPose;
    }
    const d = dt * this.speed;
    this.cur.t += d;
    if (this.next) this.next.t += d;
    if (this.restLeft > 0) this.restLeft -= dt;

    // start the next motion when the current reaches its chain point
    if (!this.next && this.cur.t >= chainPoint(this.cur.sampler.motion)) {
      this.commitTravel(this.cur);
      const n = this.pickNext();
      this.next = n;
      this.blendLen = Math.max(0.1, this.cur.sampler.duration - chainPoint(this.cur.sampler.motion));
      this.announce(n);
    }
    // finish the current one
    if (this.next && this.next.t >= this.blendLen) {
      this.cur = this.next;
      this.next = null;
    }
    this.fireImpacts(this.cur);
    if (this.next) this.fireImpacts(this.next);

    let pose = this.sample(this.cur);
    if (this.next) pose = blendResolved(pose, this.sample(this.next), smooth(this.next.t / this.blendLen));
    this.lastPose = pose;
    return pose;
  }

  private sample(a: Active) {
    return transformResolved(a.sampler.sample(Math.min(a.t, a.sampler.duration)), a.origin);
  }

  private commitTravel(a: Active) {
    const tr = a.sampler.motion.travel;
    if (!tr) return;
    const c = Math.cos(a.origin.yaw);
    const s = Math.sin(a.origin.yaw);
    this.origin = {
      x: a.origin.x + tr.x * c + tr.z * s,
      z: a.origin.z - tr.x * s + tr.z * c,
      yaw: a.origin.yaw + tr.yaw,
    };
  }

  private fireImpacts(a: Active) {
    const imp = a.sampler.motion.impacts;
    while (a.impactsDone < imp.length && a.t >= imp[a.impactsDone]) {
      a.impactsDone++;
      if (!a.auto) this.events.onImpact?.(a.techniqueId);
    }
  }

  private announce(n: Active) {
    if (n.auto) return;
    const ahead = this.steps[n.index + 1];
    const timeToNext = ahead ? chainPoint(n.sampler.motion) / Math.max(0.05, this.speed) : Infinity;
    this.events.onStep?.(n.index, n.techniqueId, this.rep, timeToNext);
  }

  /** decides what plays next: automatic repositioning, rest in guard, or the next step */
  private pickNext(): Active {
    if (this.queueAuto.length) {
      const id = this.queueAuto.shift()!;
      return this.make(id, -1, id, true);
    }
    if (!this.steps.length || this.restLeft > 0) return this.make(this.idle, -1, this.idle, true);

    if (this.stepIndex >= this.steps.length) {
      // repetition complete
      this.rep++;
      this.events.onRep?.(this.rep);
      this.stepIndex = 0;
      const auto = this.repositionMoves();
      if (auto.length) {
        this.queueAuto = auto.slice(1);
        if (this.rest > 0) this.restLeft = this.rest;
        this.events.onRest?.(this.rest);
        return this.make(auto[0], -1, auto[0], true);
      }
      if (this.rest > 0) {
        this.restLeft = this.rest;
        this.events.onRest?.(this.rest);
        return this.make(this.idle, -1, this.idle, true);
      }
    }
    const st = this.steps[this.stepIndex];
    const a = this.make(st.motionId, this.stepIndex, st.techniqueId, false);
    this.stepIndex++;
    return a;
  }

  /** steps that bring the coach back near the centre, facing forward, standing */
  private repositionMoves(): string[] {
    const moves: string[] = [];
    const last = this.steps[this.steps.length - 1];
    if (last && this.sampler(last.motionId).motion.endState === 'ground') moves.push('releve-technique');
    let { x, z, yaw } = this.origin;
    // undo rotations first with pivots
    const PIV = (60 * Math.PI) / 180;
    let guard = 0;
    while (Math.abs(yaw) > 0.3 && guard++ < 6) {
      const dir = yaw > 0 ? (this.southpaw ? 'pivot-gauche' : 'pivot-droite') : this.southpaw ? 'pivot-droite' : 'pivot-gauche';
      moves.push(dir);
      yaw += yaw > 0 ? -PIV : PIV;
    }
    // then steps (in the rotated frame the steps are approximately axis aligned)
    const STEP = 0.22 * (this.rig.metrics.height / 1.8);
    guard = 0;
    while ((Math.abs(x) > 0.2 || Math.abs(z) > 0.2) && guard++ < 10) {
      if (Math.abs(z) >= Math.abs(x)) {
        moves.push(z > 0 ? 'pas-arriere' : 'pas-avant');
        z += z > 0 ? -STEP : STEP;
      } else {
        const toLeft = x < 0;
        moves.push(toLeft ? (this.southpaw ? 'pas-droite' : 'pas-gauche') : this.southpaw ? 'pas-gauche' : 'pas-droite');
        x += toLeft ? STEP : -STEP;
      }
    }
    return moves;
  }
}
