/**
 * v0.47 « Chronomètre intégré au coach 3D » (Youssef, 2026-10-23, §2 and §13): the single source of truth for the time
 * of a training session, used by every mode (Libre, Technique, Cardio, Rounds, programmes).
 *
 * - One monotonic clock (performance.now by default, injectable for tests); time is never counted by decrementing
 *   a counter every second, so a late tick (slow phone, throttled timer) loses nothing.
 * - Phases: pret → decompte (the preparation, the big countdown over the coach) → travail ⇄ repos → termine.
 * - Every transition happens once and is returned as an event: the session hook turns events into sounds, voice,
 *   coach moves and statistics. The timeline never touches the coach's joints (§9).
 * - A phase that ends late starts the next one at its theoretical end (no drift over a long session).
 * - Pause freezes everything; work, rest and preparation seconds exclude the paused time.
 */

export type Phase = 'pret' | 'decompte' | 'travail' | 'repos' | 'termine';

/** one block of the session: `rounds` periods of `work` seconds (null: free practice, no end), `roundRest` between them */
export interface TimelineItem {
  work: number | null;
  rounds: number;
  roundRest: number;
}

export interface TimelineConfig {
  /** preparation before the first work period (seconds, the big countdown) */
  prep: number;
  /** warning this many seconds before the end of a timed work period (0: none) */
  warnBefore: number;
  /** rest between two items of a programme (seconds) */
  betweenItems: number;
  /**
   * a programme goes on to its next item; an exercise trained in Rounds or Cardio ends after its own rounds or
   * cycles (the other exercises of the level stay reachable with « Exercice suivant »)
   */
  chain?: boolean;
}

export type TimelineEvent =
  | { type: 'prep-start'; len: number }
  /** a whole second of the preparation countdown (3, 2, 1) */
  | { type: 'prep-count'; n: number }
  | { type: 'work-start'; itemIndex: number; round: number; first: boolean }
  | { type: 'warning'; secondsLeft: number }
  /** a timed work period ended (`last`: the last period of the last item) */
  | { type: 'work-end'; itemIndex: number; round: number; last: boolean; nextItem: boolean }
  | { type: 'rest-start'; len: number; reason: 'round' | 'item'; nextItem: number | null }
  /** the last whole seconds of a rest (3, 2, 1): the call to get ready */
  | { type: 'rest-count'; n: number }
  | { type: 'done' };

export interface TimelineSeed {
  phase: Phase;
  itemIndex: number;
  round: number;
  phaseElapsed: number;
  phaseLen: number;
  workSec: number;
  restSec?: number;
}

export class SessionTimeline {
  phase: Phase = 'pret';
  paused = false;
  itemIndex: number;
  round = 1;
  /** length of the current timed phase (seconds), 0 for a free work period */
  phaseLen = 0;
  /** timed work periods fully done, all items included */
  roundsDone = 0;

  /** active milliseconds (pauses excluded) since the timeline was created */
  private acc = 0;
  private since = 0;
  private running = false;
  /** active ms at which the current phase started */
  private phaseAt = 0;
  private worked = 0;
  private rested = 0;
  private prepared = 0;
  /** last whole second announced in this phase, and whether the warning was given */
  private lastWhole = Infinity;
  private warned = false;
  /** v0.48 « Passer la phase »: the time skipped is not counted as done */
  private skippedWork = 0;
  private skippedRest = 0;
  private skippedPrep = 0;

  constructor(
    readonly items: readonly TimelineItem[],
    readonly cfg: TimelineConfig,
    private readonly now: () => number = () => performance.now(),
    start = 0,
  ) {
    this.itemIndex = Math.max(0, Math.min(start, items.length - 1));
  }

  // ------------------------------------------------------------------ clock
  private get active() {
    return this.acc + (this.running ? this.now() - this.since : 0);
  }
  private run() {
    if (this.running) return;
    this.running = true;
    this.since = this.now();
  }
  private stop() {
    if (!this.running) return;
    this.acc += this.now() - this.since;
    this.running = false;
  }

  get item(): TimelineItem | undefined {
    return this.items[this.itemIndex];
  }
  /** seconds since the current phase started (pauses excluded) */
  get phaseElapsed() {
    return (this.active - this.phaseAt) / 1000;
  }
  /** is the current phase counted down (preparation, rest, timed work)? */
  get timed() {
    return this.phase === 'decompte' || this.phase === 'repos' || (this.phase === 'travail' && !!this.item?.work);
  }
  /** seconds left in the current timed phase, null when the phase has no end */
  get remaining(): number | null {
    return this.timed ? Math.max(0, this.phaseLen - this.phaseElapsed) : null;
  }
  /** seconds of work, rest and preparation done (pauses excluded) */
  get workSec() {
    return (this.worked - this.skippedWork + (this.phase === 'travail' ? this.active - this.phaseAt : 0)) / 1000;
  }
  get restSec() {
    return (this.rested - this.skippedRest + (this.phase === 'repos' ? this.active - this.phaseAt : 0)) / 1000;
  }
  get prepSec() {
    return (this.prepared - this.skippedPrep + (this.phase === 'decompte' ? this.active - this.phaseAt : 0)) / 1000;
  }
  /** the whole session, preparation, work and rest, pauses excluded */
  get totalSec() {
    return this.workSec + this.restSec + this.prepSec;
  }
  /** timed periods planned in the session (null when a period is free) */
  get plannedRounds(): number | null {
    // outside a programme, the session is the current exercise only
    const items = this.cfg.chain === false ? (this.item ? [this.item] : []) : this.items;
    return items.length && items.every((i) => i.work) ? items.reduce((a, i) => a + i.rounds, 0) : null;
  }
  /** progress of the current phase, 0 → 1 (0 for a free work period) */
  get phaseProgress() {
    return this.timed && this.phaseLen > 0 ? Math.min(1, this.phaseElapsed / this.phaseLen) : 0;
  }

  // ------------------------------------------------------------------ phases
  /** closes the current phase at active time `at` and opens the next one there */
  private enter(phase: Phase, len: number, at: number) {
    const spent = at - this.phaseAt;
    if (this.phase === 'travail') this.worked += spent;
    else if (this.phase === 'repos') this.rested += spent;
    else if (this.phase === 'decompte') this.prepared += spent;
    this.phase = phase;
    this.phaseLen = len;
    this.phaseAt = at;
    this.lastWhole = Infinity;
    this.warned = false;
  }

  /** the preparation; « Démarrer » (from Prêt or after the end: the session starts again) */
  start(): TimelineEvent[] {
    if (this.phase === 'termine') {
      this.itemIndex = 0;
      this.round = 1;
      this.roundsDone = 0;
    }
    this.paused = false;
    this.run();
    this.enter('decompte', this.cfg.prep, this.active);
    return [{ type: 'prep-start', len: this.cfg.prep }];
  }

  /** same item from its first round, through the preparation */
  restart(): TimelineEvent[] {
    this.round = 1;
    this.paused = false;
    this.run();
    this.enter('decompte', this.cfg.prep, this.active);
    return [{ type: 'prep-start', len: this.cfg.prep }];
  }

  /** another item: the session waits for « Démarrer » (nothing counted meanwhile) */
  goto(i: number) {
    if (i < 0 || i >= this.items.length) return false;
    this.enter('pret', 0, this.active);
    this.stop();
    this.paused = false;
    this.itemIndex = i;
    this.round = 1;
    // outside a programme, another exercise is another session: its rounds count from zero
    if (this.cfg.chain === false) this.roundsDone = 0;
    return true;
  }

  pause() {
    if (this.paused || this.phase === 'pret' || this.phase === 'termine') return false;
    this.paused = true;
    this.stop();
    return true;
  }

  resume() {
    if (!this.paused) return false;
    this.paused = false;
    this.run();
    return true;
  }

  /** a resumed session (« Reprendre »): the exact moment it was left, paused */
  seed(s: TimelineSeed) {
    this.itemIndex = Math.max(0, Math.min(s.itemIndex, this.items.length - 1));
    this.round = s.round;
    this.phase = s.phase;
    this.phaseLen = s.phaseLen;
    this.worked = Math.max(0, s.workSec * 1000 - (s.phase === 'travail' ? s.phaseElapsed * 1000 : 0));
    this.rested = Math.max(0, (s.restSec ?? 0) * 1000 - (s.phase === 'repos' ? s.phaseElapsed * 1000 : 0));
    this.acc = this.worked + this.rested + s.phaseElapsed * 1000;
    this.phaseAt = this.acc - s.phaseElapsed * 1000;
    this.running = false;
    this.paused = s.phase !== 'pret';
    const before = this.cfg.chain === false ? 0 : this.items.slice(0, this.itemIndex).reduce((a, i) => a + (i.work ? i.rounds : 0), 0);
    this.roundsDone = before + (this.item?.work ? s.round - 1 : 0);
  }

  private startWork(at: number, out: TimelineEvent[]) {
    const it = this.item;
    const first = this.itemIndex === 0 && this.round === 1;
    this.enter('travail', it?.work ?? 0, at);
    out.push({ type: 'work-start', itemIndex: this.itemIndex, round: this.round, first });
  }

  /**
   * Advances the session to now and returns what happened, in order, each transition once. A tick that comes
   * late catches up: every phase that ended in between is closed at its exact end.
   */
  tick(): TimelineEvent[] {
    const out: TimelineEvent[] = [];
    if (this.paused || this.phase === 'pret' || this.phase === 'termine') return out;
    for (let guard = 0; guard < 64; guard++) {
      const now = this.active;
      const elapsed = (now - this.phaseAt) / 1000;
      const it = this.item;
      if (this.phase === 'decompte') {
        const whole = Math.ceil(this.phaseLen - elapsed);
        if (whole < this.lastWhole && whole > 0) out.push({ type: 'prep-count', n: whole });
        this.lastWhole = Math.min(this.lastWhole, whole);
        if (elapsed < this.phaseLen) break;
        this.startWork(this.phaseAt + this.phaseLen * 1000, out);
        continue;
      }
      if (this.phase === 'travail') {
        if (!it || !it.work) break;
        const left = it.work - elapsed;
        const w = this.cfg.warnBefore;
        // a warning only makes sense when the period is clearly longer than it
        if (w > 0 && !this.warned && it.work >= 2 * w && left <= w && left > 0) {
          this.warned = true;
          out.push({ type: 'warning', secondsLeft: w });
        }
        if (left > 0) break;
        const end = this.phaseAt + it.work * 1000;
        this.roundsDone++;
        const moreRounds = this.round < it.rounds;
        const nextItem = !moreRounds && this.cfg.chain !== false && this.itemIndex < this.items.length - 1;
        out.push({ type: 'work-end', itemIndex: this.itemIndex, round: this.round, last: !moreRounds && !nextItem, nextItem });
        if (moreRounds) {
          this.round++;
          if (it.roundRest > 0) {
            this.enter('repos', it.roundRest, end);
            out.push({ type: 'rest-start', len: it.roundRest, reason: 'round', nextItem: null });
          } else this.startWork(end, out);
        } else if (nextItem) {
          const len = Math.max(this.cfg.betweenItems, it.roundRest ? Math.min(it.roundRest, 30) : 0);
          this.itemIndex++;
          this.round = 1;
          this.enter('repos', len, end);
          out.push({ type: 'rest-start', len, reason: 'item', nextItem: this.itemIndex });
        } else {
          // no rest after the last round
          this.enter('termine', 0, end);
          this.stop();
          out.push({ type: 'done' });
          break;
        }
        continue;
      }
      if (this.phase === 'repos') {
        const whole = Math.ceil(this.phaseLen - elapsed);
        if (whole < this.lastWhole && whole > 0 && whole <= 3) out.push({ type: 'rest-count', n: whole });
        this.lastWhole = Math.min(this.lastWhole, whole);
        if (elapsed < this.phaseLen) break;
        this.startWork(this.phaseAt + this.phaseLen * 1000, out);
        continue;
      }
      break;
    }
    return out;
  }

  /**
   * v0.48 (chrono de combat seul, « Passer la phase »): ends the current timed phase now and opens the next one,
   * exactly as if its time had run out, with the same events. The time skipped is not counted, and a skipped round
   * is not counted as done. A paused session stays paused.
   */
  skip(): TimelineEvent[] {
    if (!this.timed || this.phase === 'pret' || this.phase === 'termine') return [];
    const left = Math.max(0, this.phaseLen * 1000 - (this.active - this.phaseAt));
    const was = this.phase;
    if (was === 'travail') this.skippedWork += left;
    else if (was === 'repos') this.skippedRest += left;
    else this.skippedPrep += left;
    this.phaseAt -= left;
    const paused = this.paused;
    this.paused = false;
    const out = this.tick();
    if (was === 'travail' && out.some((e) => e.type === 'work-end')) this.roundsDone--;
    if (paused && (this.phase as Phase) !== 'termine') this.paused = true;
    return out;
  }

  /** ends a free session by hand (Libre, Technique): the work done is kept */
  finish(): TimelineEvent[] {
    if (this.phase === 'pret' || this.phase === 'termine') return [];
    this.enter('termine', 0, this.active);
    this.stop();
    this.paused = false;
    return [{ type: 'done' }];
  }
}
