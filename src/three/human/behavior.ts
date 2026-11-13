/**
 * 1.34 Human Behavior & Facial Expression Engine — the behaviour states (Youssef 11/11: « Humanisation globale et
 * règles permanentes des personnages 3D »). Pure logic, no three.js: what the coach is living now (neutral,
 * concentration, preparation, effort, powerful strike, fatigue, recovery, encouragement) and the mood of the face
 * that goes with it, reached smoothly and always given back to neutral.
 *
 * The state comes from what the session tells (HumanSignals: playing, paused, resting between repetitions, the
 * phase of the technique being played, a repetition just completed) and from the effort measured on the body (speed
 * of the hands and feet, src/three/face.ts). Without signals (Lab, portraits, screens that only show the coach) the
 * coach lives in concentration and neutral, as before 1.34.
 *
 * Nothing here moves a bone of the body: the technique shown is never changed (rule of docs/HUMAN_CHARACTER_STANDARDS.md).
 */

export const HUMAN_STATES = ['neutre', 'concentration', 'preparation', 'effort', 'frappe', 'fatigue', 'recuperation', 'encouragement'] as const;
export type HumanState = (typeof HUMAN_STATES)[number];

/** what the session tells the coach's behaviour each frame (src/three/CoachStage.tsx fills it from the player) */
export interface HumanSignals {
  /** a sequence is playing (false: paused, or nothing started) */
  playing: boolean;
  /** rest in guard between two repetitions */
  resting: boolean;
  /** phase of the technique being played, null in guard */
  phase: 'preparation' | 'execution' | 'retour' | null;
  /** counter of completed repetitions: each increase brings a short encouragement */
  cheer: number;
  /** a state imposed (Lab ?etat=, checks of the captures) */
  forced?: HumanState | null;
}

export const newSignals = (): HumanSignals => ({ playing: false, resting: false, phase: null, cheer: 0, forced: null });

/**
 * the mood of the face, every value 0..1 except focus (a factor on the focus of the face at rest, 1 = as in 1.33):
 * - focus: brows lowered and eyes narrowed of the fighter reading the opponent;
 * - browUp: inner brows raised (fatigue, effort to breathe, encouragement);
 * - press: lips set (determination before the strike);
 * - smile: a faint smile (encouragement only, short);
 * - heavy: heavier lids (fatigue);
 * - mouthBreath: the mouth parts a little on the breath out (fatigue and recovery only, never at rest);
 * - alert: eyes a little wider (preparation);
 * - nod: a small nod of the head (encouragement).
 */
export interface Mood {
  focus: number;
  browUp: number;
  press: number;
  smile: number;
  heavy: number;
  mouthBreath: number;
  alert: number;
  nod: number;
}

export const NEUTRAL_MOOD: Mood = { focus: 1, browUp: 0, press: 0, smile: 0, heavy: 0, mouthBreath: 0, alert: 0, nod: 0 };

/** target mood of each state; kept small: a human face, not a mask nor a grimace */
export const STATE_MOOD: Record<HumanState, Mood> = {
  neutre: { ...NEUTRAL_MOOD, focus: 0.6 },
  // 1.39 (« pas de visage crispé »): 1.15 → 1, the frown of concentration was held for whole seconds
  concentration: { ...NEUTRAL_MOOD, focus: 1 },
  preparation: { ...NEUTRAL_MOOD, focus: 1.3, press: 0.35, alert: 0.4 },
  effort: { ...NEUTRAL_MOOD, focus: 1.2 },
  frappe: { ...NEUTRAL_MOOD, focus: 1.3 },
  fatigue: { ...NEUTRAL_MOOD, focus: 0.5, browUp: 0.45, heavy: 0.55, mouthBreath: 0.8 },
  recuperation: { ...NEUTRAL_MOOD, focus: 0.7, browUp: 0.15, heavy: 0.2, mouthBreath: 0.35 },
  encouragement: { ...NEUTRAL_MOOD, focus: 0.4, browUp: 0.35, smile: 0.7, nod: 1 },
};

/**
 * how each state behaves beyond the face's mood: blink rate (factor), share of glances aside (factor), time to reach
 * its mood (s)
 */
export const STATE_TEMPO: Record<HumanState, { blink: number; glance: number; ease: number }> = {
  neutre: { blink: 1, glance: 1, ease: 0.8 },
  concentration: { blink: 0.85, glance: 0.5, ease: 0.7 },
  preparation: { blink: 0.6, glance: 0, ease: 0.2 },
  effort: { blink: 0.8, glance: 0, ease: 0.12 },
  frappe: { blink: 0.8, glance: 0, ease: 0.08 },
  fatigue: { blink: 1.5, glance: 1.4, ease: 0.9 },
  recuperation: { blink: 1.2, glance: 1.2, ease: 1.2 },
  encouragement: { blink: 1, glance: 0.3, ease: 0.35 },
};

/** per-coach character of the behaviour (src/three/human/profiles.ts): scales, never a separate engine */
export interface BehaviorTraits {
  /** strength of the expressions (1 = the standard) */
  expressiveness: number;
  /** strength of the encouragement's smile (a reserved coach smiles less) */
  warmth: number;
  /** how fast fatigue builds (1 = standard) */
  stamina: number;
}

export const DEFAULT_TRAITS: BehaviorTraits = { expressiveness: 1, warmth: 1, stamina: 1 };

/** effort measured above which a strike counts as powerful */
export const POWER = 0.82;
/** encouragement duration after a repetition (s) */
export const CHEER_TIME = 1.8;

export class BehaviorEngine {
  state: HumanState = 'concentration';
  readonly mood: Mood = { ...NEUTRAL_MOOD };
  /** 0..1: builds up with sustained effort, comes back down at rest */
  fatigue = 0;
  /** seconds spent in the current state */
  age = 0;
  /** last repetition count read (-1: none read yet) */
  private cheerSeen = -1;
  private cheerLeft = 0;
  private powerHold = 0;

  constructor(private traits: BehaviorTraits = DEFAULT_TRAITS) {}

  /** the state for this frame, from the signals and the measured effort (0..1) */
  decide(effort: number, s?: HumanSignals): HumanState {
    if (s?.forced) return s.forced;
    if (!s) {
      // no session (Lab, portraits, coach screens): concentration, the effort when the body moves fast
      if (effort > POWER || this.powerHold > 0) return 'frappe';
      if (effort > 0.3) return 'effort';
      return this.fatigue > 0.55 ? 'recuperation' : 'concentration';
    }
    if (this.cheerLeft > 0 && effort < 0.3) return 'encouragement';
    if (effort > POWER || this.powerHold > 0) return 'frappe';
    if (s.playing && s.phase === 'execution') return effort > 0.25 ? 'effort' : 'preparation';
    if (effort > 0.3) return 'effort';
    if (s.playing && s.phase === 'preparation') return 'preparation';
    if (s.resting) return this.fatigue > 0.4 ? 'fatigue' : 'recuperation';
    if (!s.playing) return this.fatigue > 0.4 ? 'recuperation' : 'neutre';
    return this.fatigue > 0.65 ? 'fatigue' : 'concentration';
  }

  update(dt: number, effort: number, s?: HumanSignals): HumanState {
    const d = Math.min(Math.max(dt, 0), 0.1);
    if (s && s.cheer !== this.cheerSeen) {
      // the first count read is the current one, not a new repetition; a restart (count back to 0) is no cheer
      if (this.cheerSeen >= 0 && s.cheer > this.cheerSeen) this.cheerLeft = CHEER_TIME;
      this.cheerSeen = s.cheer;
    }
    this.cheerLeft = Math.max(0, this.cheerLeft - d);
    // a powerful strike keeps its face a little after the peak (0.25 s), then lets go
    this.powerHold = effort > POWER ? 0.25 : Math.max(0, this.powerHold - d);
    // fatigue: builds with the strikes (about 30 strikes in a row bring it near 1), comes back down in about 20 s of
    // rest between repetitions, 40 s paused, two minutes while the coach keeps working in guard
    const work = Math.max(0, effort - 0.2);
    if (work > 0) this.fatigue += (work * d) / (8 * this.traits.stamina);
    else if (effort < 0.15) this.fatigue -= d / (s?.resting ? 20 : s?.playing ? 120 : 40);
    this.fatigue = Math.min(1, Math.max(0, this.fatigue));
    const next = this.decide(effort, s);
    if (next !== this.state) {
      this.state = next;
      this.age = 0;
    } else this.age += d;
    const target = STATE_MOOD[this.state];
    const k = Math.min(1, d / STATE_TEMPO[this.state].ease);
    const x = this.traits.expressiveness;
    for (const key of Object.keys(this.mood) as (keyof Mood)[]) {
      let goal = target[key];
      if (key === 'smile') goal *= this.traits.warmth;
      else if (key !== 'focus' && key !== 'nod') goal *= x;
      this.mood[key] += (goal - this.mood[key]) * k;
    }
    return this.state;
  }

  get tempo() {
    return STATE_TEMPO[this.state];
  }
}
