import { describe, expect, test } from 'vitest';
import { SessionTimeline, type TimelineEvent, type TimelineItem } from '../timeline';

// v0.47 (« Chronomètre intégré au coach 3D » §13, §16): every transition with a simulated clock

function clock() {
  let t = 1000;
  const now = () => t;
  const at = (s: number) => (t += s * 1000);
  return { now, at };
}

const cfg = { prep: 3, warnBefore: 10, betweenItems: 15 };
const rounds = (n: number, work: number, rest: number): TimelineItem => ({ work, rounds: n, roundRest: rest });
const types = (es: TimelineEvent[]) => es.map((e) => e.type);

/** runs the timeline with ticks every `step` seconds for `sec` seconds, collecting events */
function run(tl: SessionTimeline, c: ReturnType<typeof clock>, sec: number, step = 0.1) {
  const out: TimelineEvent[] = [];
  for (let s = 0; s < sec - 1e-9; s += step) {
    c.at(step);
    out.push(...tl.tick());
  }
  return out;
}

describe('moteur temporel de séance', () => {
  test('préparation : 3, 2, 1 une seule fois chacun, puis le travail démarre à zéro, un seul départ', () => {
    const c = clock();
    const tl = new SessionTimeline([rounds(1, 60, 0)], cfg, c.now);
    expect(types(tl.start())).toEqual(['prep-start']);
    expect(tl.phase).toBe('decompte');
    const ev = run(tl, c, 3.05);
    expect(ev.filter((e) => e.type === 'prep-count').map((e) => (e as { n: number }).n)).toEqual([3, 2, 1]);
    expect(ev.filter((e) => e.type === 'work-start')).toHaveLength(1);
    expect(tl.phase).toBe('travail');
    // the work started at the end of the preparation, not at the tick that noticed it
    expect(tl.remaining).toBeCloseTo(60 - (3.1 - 3), 3);
  });

  test('Rounds : préparation → R1 → repos → R2 → repos → R3 → fin, aucun repos après le dernier round', () => {
    const c = clock();
    const tl = new SessionTimeline([rounds(3, 30, 15)], cfg, c.now);
    tl.start();
    const ev = run(tl, c, 3 + 30 + 15 + 30 + 15 + 30 + 5);
    const seq = ev.filter((e) => e.type !== 'prep-count' && e.type !== 'rest-count' && e.type !== 'warning').map((e) => (e.type === 'work-start' ? `R${e.round}` : e.type));
    expect(seq).toEqual(['R1', 'work-end', 'rest-start', 'R2', 'work-end', 'rest-start', 'R3', 'work-end', 'done']);
    expect(tl.phase).toBe('termine');
    expect(tl.roundsDone).toBe(3);
    expect(tl.workSec).toBeCloseTo(90, 1);
    expect(tl.restSec).toBeCloseTo(30, 1);
    expect(tl.prepSec).toBeCloseTo(3, 1);
    // the last work-end says it is the last
    expect(ev.filter((e) => e.type === 'work-end').map((e) => (e as { last: boolean }).last)).toEqual([false, false, true]);
  });

  test('avertissement avant la fin : une fois par round, seulement si le round est assez long', () => {
    const c = clock();
    const tl = new SessionTimeline([rounds(2, 60, 10)], cfg, c.now);
    tl.start();
    const ev = run(tl, c, 3 + 60 + 10 + 60 + 1);
    expect(ev.filter((e) => e.type === 'warning')).toHaveLength(2);
    const c2 = clock();
    const short = new SessionTimeline([rounds(1, 15, 0)], cfg, c2.now);
    short.start();
    expect(run(short, c2, 20).filter((e) => e.type === 'warning')).toHaveLength(0);
    const c3 = clock();
    const off = new SessionTimeline([rounds(1, 60, 0)], { ...cfg, warnBefore: 0 }, c3.now);
    off.start();
    expect(run(off, c3, 65).filter((e) => e.type === 'warning')).toHaveLength(0);
  });

  test('repos : 3, 2, 1 avant la reprise, une seule fois', () => {
    const c = clock();
    const tl = new SessionTimeline([rounds(2, 20, 10)], cfg, c.now);
    tl.start();
    const ev = run(tl, c, 3 + 20 + 10 + 1);
    expect(ev.filter((e) => e.type === 'rest-count').map((e) => (e as { n: number }).n)).toEqual([3, 2, 1]);
  });

  test('pause exacte : le temps, le travail et la transition sont figés, la reprise repart sans décalage', () => {
    const c = clock();
    const tl = new SessionTimeline([rounds(1, 30, 0)], cfg, c.now);
    tl.start();
    run(tl, c, 13); // 10 s of work
    expect(tl.workSec).toBeCloseTo(10, 1);
    expect(tl.pause()).toBe(true);
    c.at(120); // two minutes paused
    expect(tl.tick()).toEqual([]);
    expect(tl.workSec).toBeCloseTo(10, 1);
    expect(tl.remaining).toBeCloseTo(20, 1);
    tl.resume();
    const ev = run(tl, c, 20.05);
    expect(types(ev)).toContain('done');
    expect(tl.workSec).toBeCloseTo(30, 1);
    expect(tl.totalSec).toBeCloseTo(33, 1);
  });

  test('un tick en retard (téléphone lent) rattrape chaque transition à son heure exacte, sans doublon', () => {
    const c = clock();
    const tl = new SessionTimeline([rounds(3, 20, 10)], cfg, c.now);
    tl.start();
    c.at(3 + 20 + 10 + 5); // one tick 38 s late: in round 2 since 5 s
    const ev = tl.tick();
    expect(ev.filter((e) => e.type === 'work-start').map((e) => (e as { round: number }).round)).toEqual([1, 2]);
    expect(tl.round).toBe(2);
    expect(tl.remaining).toBeCloseTo(15, 3);
    expect(tl.workSec).toBeCloseTo(25, 3);
    expect(tl.restSec).toBeCloseTo(10, 3);
  });

  test('Libre : pas de fin, pas de repos, le temps écoulé compte', () => {
    const c = clock();
    const tl = new SessionTimeline([{ work: null, rounds: 1, roundRest: 0 }], cfg, c.now);
    tl.start();
    const ev = run(tl, c, 3 + 600, 0.5);
    expect(types(ev).filter((t) => t !== 'prep-count')).toEqual(['work-start']);
    expect(tl.remaining).toBeNull();
    expect(tl.workSec).toBeCloseTo(600, 0);
    expect(tl.plannedRounds).toBeNull();
    expect(types(tl.finish())).toEqual(['done']);
    expect(tl.workSec).toBeCloseTo(600, 0);
  });

  test('programme : repos entre deux exercices, puis le suivant au round 1', () => {
    const c = clock();
    const tl = new SessionTimeline([rounds(1, 20, 0), rounds(2, 20, 10)], cfg, c.now);
    tl.start();
    const ev = run(tl, c, 3 + 20 + 15 + 20 + 10 + 20 + 1);
    const rest = ev.filter((e) => e.type === 'rest-start') as Extract<TimelineEvent, { type: 'rest-start' }>[];
    expect(rest.map((r) => [r.reason, r.len, r.nextItem])).toEqual([
      ['item', 15, 1],
      ['round', 10, null],
    ]);
    expect(tl.phase).toBe('termine');
    expect(tl.roundsDone).toBe(3);
    expect(tl.plannedRounds).toBe(3);
  });

  test('hors programme : un exercice en Rounds ou Cardio se termine après ses propres rounds, sans passer au suivant', () => {
    const c = clock();
    const tl = new SessionTimeline([rounds(2, 20, 10), rounds(2, 20, 10)], { ...cfg, chain: false }, c.now);
    tl.start();
    const ev = run(tl, c, 3 + 20 + 10 + 20 + 1);
    expect(types(ev).filter((t) => t === 'rest-start')).toHaveLength(1);
    expect(ev.filter((e) => e.type === 'work-end').map((e) => (e as { last: boolean }).last)).toEqual([false, true]);
    expect(tl.phase).toBe('termine');
    expect(tl.itemIndex).toBe(0);
    expect(tl.plannedRounds).toBe(2);
    expect(tl.roundsDone).toBe(2);
  });

  test('changer d’exercice attend « Démarrer » et ne compte rien ; Recommencer repasse par la préparation', () => {
    const c = clock();
    const tl = new SessionTimeline([rounds(1, 20, 0), rounds(1, 20, 0)], cfg, c.now);
    tl.start();
    run(tl, c, 8);
    tl.goto(1);
    expect(tl.phase).toBe('pret');
    const w = tl.workSec;
    c.at(60);
    expect(tl.tick()).toEqual([]);
    expect(tl.workSec).toBe(w);
    expect(types(tl.restart())).toEqual(['prep-start']);
    expect(tl.phase).toBe('decompte');
    expect(tl.itemIndex).toBe(1);
  });

  test('reprise d’une séance enregistrée : même instant, en pause, et la suite se déroule', () => {
    const c = clock();
    const tl = new SessionTimeline([rounds(3, 30, 10)], cfg, c.now);
    tl.seed({ phase: 'travail', itemIndex: 0, round: 2, phaseElapsed: 12, phaseLen: 30, workSec: 42, restSec: 10 });
    expect(tl.paused).toBe(true);
    expect(tl.remaining).toBeCloseTo(18, 3);
    expect(tl.workSec).toBeCloseTo(42, 3);
    expect(tl.roundsDone).toBe(1);
    c.at(30);
    expect(tl.tick()).toEqual([]);
    tl.resume();
    const ev = run(tl, c, 18.05);
    expect(types(ev)).toEqual(['warning', 'work-end', 'rest-start']);
    expect(tl.roundsDone).toBe(2);
  });
});
