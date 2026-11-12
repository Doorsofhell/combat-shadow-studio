import { describe, expect, test } from 'vitest';
import { BehaviorEngine, CHEER_TIME, HUMAN_STATES, NEUTRAL_MOOD, STATE_MOOD, newSignals, type HumanSignals, type HumanState } from '../behavior';

/**
 * 1.34 Human Behavior & Facial Expression Engine: the states of the coach and their transitions (Youssef 11/11:
 * « Les expressions doivent être naturelles, temporaires et adaptées au contexte. Aucune expression d'effort ne doit
 * rester figée après une frappe »).
 */
const run = (b: BehaviorEngine, seconds: number, effort: number, s?: HumanSignals) => {
  let st: HumanState = b.state;
  for (let i = 0; i < seconds * 60; i++) st = b.update(1 / 60, effort, s);
  return st;
};

describe('états du comportement', () => {
  test('les 8 états demandés existent, chacun avec une humeur bornée', () => {
    expect([...HUMAN_STATES].sort()).toEqual(['concentration', 'effort', 'encouragement', 'fatigue', 'frappe', 'neutre', 'preparation', 'recuperation']);
    for (const st of HUMAN_STATES) {
      const m = STATE_MOOD[st];
      for (const [k, v] of Object.entries(m)) {
        expect(v, `${st}.${k}`).toBeGreaterThanOrEqual(0);
        expect(v, `${st}.${k}`).toBeLessThanOrEqual(k === 'focus' ? 1.5 : 1);
      }
    }
  });

  test('au repos la bouche ne respire pas par la bouche et ne sourit pas (bouche détendue)', () => {
    for (const st of ['neutre', 'concentration', 'preparation', 'effort', 'frappe'] as const) {
      expect(STATE_MOOD[st].mouthBreath, st).toBe(0);
      expect(STATE_MOOD[st].smile, st).toBe(0);
    }
  });

  test('lecture : garde = concentration, préparation, exécution = effort, frappe forte = frappe puissante', () => {
    const b = new BehaviorEngine();
    const s = { ...newSignals(), playing: true };
    expect(run(b, 1, 0, s)).toBe('concentration');
    expect(run(b, 0.2, 0, { ...s, phase: 'preparation' })).toBe('preparation');
    expect(run(b, 0.1, 0.5, { ...s, phase: 'execution' })).toBe('effort');
    expect(run(b, 0.1, 0.95, { ...s, phase: 'execution' })).toBe('frappe');
  });

  test('après une frappe puissante, le visage revient à la concentration en moins d’une seconde', () => {
    const b = new BehaviorEngine();
    const s = { ...newSignals(), playing: true };
    run(b, 0.2, 1, { ...s, phase: 'execution' });
    expect(b.state).toBe('frappe');
    const st = run(b, 0.6, 0, s);
    expect(st).toBe('concentration');
    run(b, 1.5, 0, s);
    // the mood is back to the state's own (no frozen effort)
    for (const k of Object.keys(NEUTRAL_MOOD) as (keyof typeof NEUTRAL_MOOD)[]) expect(Math.abs(b.mood[k] - STATE_MOOD.concentration[k]), k).toBeLessThan(0.05);
  });

  test('pause = neutre ; repos entre répétitions = récupération ; fatigue après un long effort, puis retour au calme', () => {
    const b = new BehaviorEngine();
    expect(run(b, 1, 0, { ...newSignals(), playing: false })).toBe('neutre');
    expect(run(b, 1, 0, { ...newSignals(), playing: true, resting: true })).toBe('recuperation');
    // 40 s of strikes
    for (let i = 0; i < 40; i++) {
      run(b, 0.3, 0.9, { ...newSignals(), playing: true, phase: 'execution' });
      run(b, 0.7, 0.1, { ...newSignals(), playing: true });
    }
    expect(b.fatigue).toBeGreaterThan(0.4);
    expect(run(b, 1, 0, { ...newSignals(), playing: true, resting: true })).toBe('fatigue');
    expect(b.mood.mouthBreath).toBeGreaterThan(0.3);
    // a minute of rest: breath back, the mouth closed again
    run(b, 60, 0, { ...newSignals(), playing: true, resting: true });
    expect(b.state).toBe('recuperation');
    run(b, 60, 0, { ...newSignals(), playing: false });
    expect(b.state).toBe('neutre');
    expect(b.mood.mouthBreath).toBeLessThan(0.02);
  });

  test('une répétition terminée donne un court encouragement, puis il disparaît', () => {
    const b = new BehaviorEngine();
    const s = { ...newSignals(), playing: true, cheer: 3 };
    run(b, 0.5, 0, s);
    expect(b.state).toBe('concentration');
    s.cheer = 4;
    expect(run(b, 0.3, 0, s)).toBe('encouragement');
    expect(b.mood.smile).toBeGreaterThan(0.2);
    run(b, CHEER_TIME + 3, 0, s);
    expect(b.state).toBe('concentration');
    expect(b.mood.smile).toBeLessThan(0.02);
    // a restart (count back to 0) is no cheer
    s.cheer = 0;
    expect(run(b, 0.3, 0, s)).toBe('concentration');
  });

  test('sans signaux (Lab, écrans de présentation) : concentration, effort selon la vitesse mesurée', () => {
    const b = new BehaviorEngine();
    expect(run(b, 1, 0)).toBe('concentration');
    expect(run(b, 0.1, 0.5)).toBe('effort');
    expect(run(b, 1, 0)).toBe('concentration');
  });

  test('un état imposé (captures de contrôle) est appliqué', () => {
    const b = new BehaviorEngine();
    expect(run(b, 0.1, 0, { ...newSignals(), forced: 'fatigue' })).toBe('fatigue');
  });

  test('les transitions sont douces : aucune valeur d’humeur ne saute de plus de 0,2 en une image', () => {
    const b = new BehaviorEngine();
    const seq: [number, HumanSignals][] = [
      [0, { ...newSignals(), playing: true }],
      [0, { ...newSignals(), playing: true, phase: 'preparation' }],
      [1, { ...newSignals(), playing: true, phase: 'execution' }],
      [0, { ...newSignals(), playing: true, resting: true }],
      [0, { ...newSignals(), playing: true, cheer: 1 }],
    ];
    let prev = { ...b.mood };
    for (const [e, s] of seq)
      for (let i = 0; i < 40; i++) {
        b.update(1 / 60, e, s);
        for (const k of Object.keys(prev) as (keyof typeof prev)[]) expect(Math.abs(b.mood[k] - prev[k]), k).toBeLessThan(0.2);
        prev = { ...b.mood };
      }
  });
});
