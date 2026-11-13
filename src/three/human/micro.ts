/**
 * 1.39 Human Behavior & Facial Expression Engine — the micro-life of the face (Youssef 13/11: « le visage reste trop
 * figé, elle ne fait pas du tout naturel. Sur elle et tous les autres coachs »).
 *
 * Verified on 1.38.0 in the Lab (face=live, guard, the four coaches): the face at rest held one mask (brows down and
 * eyes narrowed near 0.54 for seconds, spread 0.05), exactly the same on the left and the right; the lips never moved
 * (lip seal fixed at 0.22, nothing else); the eyes held each fixation without the least movement. A living face is
 * never still: small, slow, uneven movements of the brows, lids, cheeks, lips and nostrils, the eyes trembling on the
 * point they hold, and now and then a brief micro-expression that comes and goes.
 *
 * This layer is added to the expressions of the face (src/three/face.ts) when the face is live, never on still images
 * (Lab captures, portraits) and it gives way to the strike's effort. Pure logic, no three.js: weights of the ARKit
 * expressions and a small offset of the eyes. The mouth stays closed: no jaw, no rounded lips (rule of
 * docs/HUMAN_CHARACTER_STANDARDS.md « bouche fermée et détendue au repos »).
 */

/** ARKit names used here (a subset of FACE_EXPRESSIONS in src/three/face.ts) */
export type MicroChannel =
  | 'BrowDownLeft'
  | 'BrowDownRight'
  | 'BrowInnerUp'
  | 'EyeBlinkLeft'
  | 'EyeBlinkRight'
  | 'EyeSquintLeft'
  | 'EyeSquintRight'
  | 'CheekSquintLeft'
  | 'CheekSquintRight'
  | 'NoseSneerLeft'
  | 'NoseSneerRight'
  | 'MouthClose'
  | 'MouthSmileLeft'
  | 'MouthSmileRight'
  | 'MouthFrownLeft'
  | 'MouthFrownRight';

/** the brief micro-expressions of the face at rest */
// 1.39 (Youssef 13/11 17:04: « il faut que ça soit naturel, pas de lèvres ni visage crispé »): no pressed lips, no
// frown held: only soft, brief movements that relax the face
export const MICRO_EVENTS = ['sourcil', 'coin', 'narines', 'lecture', 'detente'] as const;
export type MicroEvent = (typeof MICRO_EVENTS)[number];

/** what each micro-expression does at its peak (weights added to the face); `side` events act on one side only */
const EVENT_SHAPE: Record<MicroEvent, { w: Partial<Record<MicroChannel, number>>; side?: boolean; hold: [number, number] }> = {
  // the inner brows lift a moment (attention, a thought)
  sourcil: { w: { BrowInnerUp: 0.38 }, hold: [0.15, 0.45] },
  // one corner of the mouth draws up a little
  coin: { w: { MouthSmileLeft: 0.1, CheekSquintLeft: 0.06 }, side: true, hold: [0.3, 0.9] },
  // the nostrils open (a deeper breath in)
  narines: { w: { NoseSneerLeft: 0.16, NoseSneerRight: 0.16 }, hold: [0.25, 0.5] },
  // the fighter reads the opponent: eyes narrow, brows come down
  lecture: { w: { EyeSquintLeft: 0.12, EyeSquintRight: 0.12, BrowDownLeft: 0.06, BrowDownRight: 0.06 }, hold: [0.4, 0.9] },
  // the face lets go a moment: brows rise a touch off the frown, the lids open, the corners soften
  detente: { w: { BrowInnerUp: 0.12, BrowDownLeft: -0.12, BrowDownRight: -0.12, EyeSquintLeft: -0.1, EyeSquintRight: -0.1, MouthSmileLeft: 0.04, MouthSmileRight: 0.04 }, hold: [0.6, 1.4] },
};

/** amplitude of the slow continuous movement of each channel (weights, before the strength of the coach) */
const DRIFT: [MicroChannel, number][] = [
  ['BrowDownLeft', 0.09],
  ['BrowDownRight', 0.09],
  ['BrowInnerUp', 0.07],
  ['EyeBlinkLeft', 0.05],
  ['EyeBlinkRight', 0.05],
  ['EyeSquintLeft', 0.08],
  ['EyeSquintRight', 0.08],
  ['CheekSquintLeft', 0.05],
  ['CheekSquintRight', 0.05],
  // a corner: up (smile) on one half of its swing, down (frown) on the other
  ['MouthSmileLeft', 0.045],
  ['MouthSmileRight', 0.045],
];

/** the left channel and the right one of a pair share part of their movement (a face is never fully symmetric) */
const PAIRS: [MicroChannel, MicroChannel][] = [
  ['BrowDownLeft', 'BrowDownRight'],
  ['EyeBlinkLeft', 'EyeBlinkRight'],
  ['EyeSquintLeft', 'EyeSquintRight'],
  ['CheekSquintLeft', 'CheekSquintRight'],
  ['MouthSmileLeft', 'MouthSmileRight'],
];

const mirror = (c: MicroChannel) => (c.endsWith('Left') ? (c.replace(/Left$/, 'Right') as MicroChannel) : c);

/** a slow, smooth wave in -1..1: three sines of unrelated periods (about 2 to 9 s), cheap and without jumps */
interface Wave {
  f: [number, number, number];
  p: [number, number, number];
}

export interface MicroInput {
  /** 0 during a strike .. 1 at rest */
  rest: number;
  /** the breathing cycle: 0 breathed out .. 1 breathed in */
  breath: number;
  /** 0..1: how much room the behaviour state leaves (no micro-expression while preparing or striking) */
  calm: number;
  /** strength of the coach's expressions (profile traits.expressiveness) */
  strength: number;
}

export class MicroLife {
  /** the weights added this frame (rebuilt by update) */
  readonly w: Partial<Record<MicroChannel, number>> = {};
  /** the small trembling of the eyes on the point they hold (radians) */
  readonly eye = { yaw: 0, pitch: 0 };
  /** current micro-expression, its side (1 left, -1 right), time in it, attack/hold/release (s) */
  event: { kind: MicroEvent; side: number; t: number; hold: number } | null = null;
  private nextEvent: number;
  private t = 0;
  private waves = new Map<MicroChannel, Wave>();
  private shared = new Map<MicroChannel, Wave>();
  private tremor = { yaw: 0, pitch: 0, toYaw: 0, toPitch: 0, next: 0 };

  constructor(private rand: () => number) {
    const wave = (): Wave => ({
      f: [0.11 + 0.08 * rand(), 0.23 + 0.12 * rand(), 0.41 + 0.2 * rand()],
      p: [rand() * 6.283, rand() * 6.283, rand() * 6.283],
    });
    for (const [c] of DRIFT) this.waves.set(c, wave());
    for (const [l] of PAIRS) this.shared.set(l, wave());
    this.nextEvent = 1.5 + 2 * rand();
  }

  /** a draw of this layer's own generator (also used for the shape of each blink) */
  rand01() {
    return this.rand();
  }

  private wave(w: Wave) {
    const t = this.t;
    return (0.5 * Math.sin(w.f[0] * 6.283 * t + w.p[0]) + 0.3 * Math.sin(w.f[1] * 6.283 * t + w.p[1]) + 0.2 * Math.sin(w.f[2] * 6.283 * t + w.p[2]));
  }

  /** envelope of the current micro-expression: 0.25 s up, held, 0.45 s down (smooth steps) */
  static envelope(t: number, hold: number) {
    const up = 0.25;
    const down = 0.45;
    const s = (x: number) => x * x * (3 - 2 * x);
    if (t < 0) return 0;
    if (t < up) return s(t / up);
    if (t < up + hold) return 1;
    if (t < up + hold + down) return s(1 - (t - up - hold) / down);
    return 0;
  }

  update(dt: number, inp: MicroInput) {
    this.t += dt;
    const w = this.w;
    for (const k of Object.keys(w) as MicroChannel[]) w[k] = 0;
    const k = inp.rest * inp.strength;
    // the slow drift: half shared by the two sides of a pair, half each side's own
    for (const [c, amp] of DRIFT) {
      const own = this.wave(this.waves.get(c)!);
      const pair = PAIRS.find(([l, r]) => l === c || r === c);
      const sh = pair ? this.wave(this.shared.get(pair[0])!) : own;
      const v = (pair ? 0.5 * sh + 0.5 * own : own) * amp * k;
      if (c === 'MouthSmileLeft' || c === 'MouthSmileRight') {
        // a corner goes up, or down a little less
        if (v >= 0) w[c] = (w[c] ?? 0) + v;
        else {
          const frown = c === 'MouthSmileLeft' ? 'MouthFrownLeft' : 'MouthFrownRight';
          w[frown] = (w[frown] ?? 0) - 0.7 * v;
        }
      } else w[c] = (w[c] ?? 0) + v;
    }
    // breathing: the nostrils open on the way in (a little more on one side), the lips relax a touch
    const b = Math.max(0, Math.min(1, inp.breath));
    w.NoseSneerLeft = (w.NoseSneerLeft ?? 0) + 0.07 * b * k;
    w.NoseSneerRight = (w.NoseSneerRight ?? 0) + 0.055 * b * k;
    w.MouthClose = (w.MouthClose ?? 0) - 0.04 * b * k;

    // a brief micro-expression every 2.5 to 7 s, only when calm; it always comes back to neutral
    if (!this.event && this.t >= this.nextEvent) {
      if (inp.calm > 0.5) {
        const kind = MICRO_EVENTS[Math.floor(this.rand() * MICRO_EVENTS.length)];
        const [h0, h1] = EVENT_SHAPE[kind].hold;
        this.event = { kind, side: this.rand() < 0.5 ? 1 : -1, t: 0, hold: h0 + (h1 - h0) * this.rand() };
      }
      this.nextEvent = this.t + 2.5 + 4.5 * this.rand();
    }
    if (this.event) {
      const e = this.event;
      e.t += dt;
      // a strike cuts it short
      const env = MicroLife.envelope(e.t, e.hold) * inp.rest;
      const shape = EVENT_SHAPE[e.kind];
      for (const [c0, v] of Object.entries(shape.w) as [MicroChannel, number][]) {
        const c = shape.side && e.side < 0 ? mirror(c0) : c0;
        w[c] = (w[c] ?? 0) + v * env * inp.strength;
      }
      if (e.t > e.hold + 0.7) this.event = null;
    }

    // the eyes are never perfectly still on the point they hold: micro-saccades of a few tenths of a degree every
    // 0.3 to 1 s, reached in 30 ms, and a slow drift between them
    const tr = this.tremor;
    if (this.t >= tr.next) {
      tr.toYaw = (this.rand() - 0.5) * 0.012;
      tr.toPitch = (this.rand() - 0.5) * 0.008;
      tr.next = this.t + 0.3 + 0.7 * this.rand();
    }
    const s = Math.min(1, dt / 0.03);
    tr.yaw += (tr.toYaw - tr.yaw) * s;
    tr.pitch += (tr.toPitch - tr.pitch) * s;
    this.eye.yaw = tr.yaw + 0.002 * Math.sin(1.7 * this.t);
    this.eye.pitch = tr.pitch + 0.0015 * Math.sin(1.3 * this.t + 1);
  }
}
