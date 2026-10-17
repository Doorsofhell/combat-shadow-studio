/**
 * Active practice time: accumulates only while running and while the page is visible.
 * The clock is injectable for tests.
 */
export class ActiveTimer {
  private running = false;
  private since = 0;
  private acc = 0;

  constructor(private now: () => number = () => performance.now()) {}

  start() {
    if (this.running) return;
    this.running = true;
    this.since = this.now();
  }

  pause() {
    if (!this.running) return;
    this.acc += this.now() - this.since;
    this.running = false;
  }

  reset() {
    this.running = false;
    this.acc = 0;
  }

  get isRunning() {
    return this.running;
  }

  /** milliseconds of active time */
  get elapsed() {
    return this.acc + (this.running ? this.now() - this.since : 0);
  }

  /** returns and clears the active time accumulated so far (keeps running) */
  drain() {
    const e = this.elapsed;
    this.acc = 0;
    if (this.running) this.since = this.now();
    return e;
  }
}
