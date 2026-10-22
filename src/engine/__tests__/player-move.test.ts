import { describe, expect, test } from 'vitest';
import { loadSkeleton } from '../../test/skeleton';
import { CoachRig } from '../rig';
import { getLibrary, getMotion } from '../library';
import { chainPoint, duration } from '../motion';
import { ComboPlayer, PlayerMove } from '../player';
import { STYLE_OF } from '../../three/CoachStage';
import { EXERCISES } from '../../domain/exercises';
import { TECHNIQUE_BY_ID } from '../../domain/techniques';
import { playerSteps } from '../../ui/training/plan';
import type { DisciplineId } from '../../domain/types';

/**
 * 0.35 (coaching HUD): the name of a move is shown from the real start of its motion to its end, as the player reports
 * it (onMove). These tests drive the player frame by frame, as the 3D stage does, and check the report against the
 * motions themselves (their duration and chain point), never against a timer.
 */
const rig = new CoachRig(loadSkeleton('homme'));
const DT = 1 / 60;

type Log = { t: number; motionT: number; move: PlayerMove | null }[];

function run(discipline: DisciplineId, seq: string[], o: { rest?: number; speed?: number; seconds: number; listen?: boolean }) {
  const lib = getLibrary(rig, STYLE_OF[discipline]);
  const log: Log = [];
  const steps: { index: number; at: number }[] = [];
  let t = 0;
  let motionT = 0;
  const p = new ComboPlayer(rig, lib, false, {
    onMove: o.listen === false ? undefined : (m) => log.push({ t, motionT, move: m }),
    onStep: (index) => steps.push({ index, at: t }),
  });
  p.speed = o.speed ?? 1;
  p.setSequence(playerSteps(seq), o.rest ?? 1);
  p.play();
  const poses = [];
  for (; t < o.seconds; t += DT) {
    poses.push(p.update(DT));
    motionT += DT * p.speed;
  }
  return { p, log, steps, poses, lib };
}

/** the moves reported, in order, with how long (motion time) each was shown */
const shown = (log: Log) =>
  log.flatMap((e, i) => (e.move ? [{ id: e.move.techniqueId, index: e.move.index, len: (log[i + 1]?.motionT ?? Infinity) - e.motionT, next: log[i + 1]?.move ?? null }] : []));

const KB = ['jab', 'direct', 'low-kick-arriere'];

describe('bandeau du mouvement : synchronisé sur le moteur d’animation', () => {
  test('Jab → Direct arrière → Low kick : chaque nom au début réel de son mouvement, dans l’ordre, un seul à la fois', () => {
    const { log, steps } = run('kickboxing', KB, { seconds: 12 });
    const s = shown(log);
    expect(s.length).toBeGreaterThanOrEqual(6);
    // the order of the sequence, repeated
    expect(s.slice(0, 6).map((x) => x.id)).toEqual([...KB, ...KB]);
    // each name appears in the very frame the player starts the move (the frame its call is announced)
    const starts = log.filter((e) => e.move).map((e) => e.t);
    for (let i = 0; i < 6; i++) expect(starts[i]).toBe(steps[i].at);
  });

  test('un nom dure exactement son mouvement : jusqu’au coup suivant (point d’enchaînement) ou jusqu’à la fin du retour', () => {
    const { log, lib } = run('kickboxing', KB, { seconds: 12 });
    for (const x of shown(log).slice(0, 6)) {
      const m = getMotion(lib, TECHNIQUE_BY_ID.get(x.id)!.motion, false)!;
      // chained to the next technique: shown until that one starts; last of the sequence: until its motion ends
      const expected = x.next ? chainPoint(m) : duration(m);
      expect(Math.abs(x.len - expected), x.id).toBeLessThanOrEqual(DT + 1e-9);
    }
  });

  test('en garde entre deux répétitions : aucun nom, puis le cycle reprend', () => {
    const { log } = run('kickboxing', KB, { rest: 1.6, seconds: 12 });
    const gaps = log.filter((e) => !e.move);
    // after each repetition the band is empty (the low kick is gone), then the jab comes back
    expect(gaps.length).toBeGreaterThanOrEqual(2);
    for (const g of gaps.slice(1)) {
      const i = log.indexOf(g);
      expect(log[i - 1].move?.techniqueId).toBe('low-kick-arriere');
      if (log[i + 1]) expect(log[i + 1].move?.techniqueId).toBe('jab');
      // a real pause in guard (the rest is counted from the call of the next move, so a little less than 1.6 s)
      if (log[i + 1]) expect(log[i + 1].t - g.t).toBeGreaterThan(1);
    }
  });

  test('aucun nom avant le démarrage ni sans séquence', () => {
    const lib = getLibrary(rig, 'boxing');
    const moves: (PlayerMove | null)[] = [];
    const p = new ComboPlayer(rig, lib, false, { onMove: (m) => moves.push(m) });
    p.play();
    for (let i = 0; i < 300; i++) p.update(DT);
    expect(p.moveNow()).toBeNull();
    expect(moves.every((m) => m === null)).toBe(true);
  });

  test('Jab seul, Direct seul, Low kick seul : le nom revient à chaque répétition et ne reste jamais pendant la garde', () => {
    for (const id of ['jab', 'direct', 'low-kick-arriere']) {
      const { log, lib } = run('kickboxing', [id], { rest: 1, seconds: 8 });
      const s = shown(log);
      expect(s.length, id).toBeGreaterThanOrEqual(2);
      const d = duration(getMotion(lib, TECHNIQUE_BY_ID.get(id)!.motion, false)!);
      for (const x of s.slice(0, -1)) {
        expect(x.id).toBe(id);
        expect(Math.abs(x.len - d), id).toBeLessThanOrEqual(DT + 1e-9);
        expect(x.next, `${id}: la garde suit`).toBeNull();
      }
    }
  });

  test('vitesse ×2 : mêmes mouvements, deux fois moins de temps réel, toujours calé sur l’animation', () => {
    const a = shown(run('kickboxing', KB, { seconds: 10 }).log).slice(0, 3);
    const b = run('kickboxing', KB, { seconds: 10, speed: 2 });
    const sb = b.log.filter((e) => e.move).slice(0, 3);
    expect(sb.map((e) => e.move!.techniqueId)).toEqual(KB);
    const realLen = (i: number) => b.log[b.log.indexOf(sb[i]) + 1].t - sb[i].t;
    for (let i = 0; i < 3; i++) expect(Math.abs(realLen(i) - a[i].len / 2), KB[i]).toBeLessThanOrEqual(DT + 1e-9);
  });

  test('pause au milieu d’un mouvement : le nom reste figé avec la pose ; reprise : le même mouvement finit au bon moment', () => {
    const lib = getLibrary(rig, STYLE_OF.kickboxing);
    const moves: { t: number; m: PlayerMove | null }[] = [];
    let t = 0;
    const p = new ComboPlayer(rig, lib, false, { onMove: (m) => moves.push({ t, m }) });
    p.setSequence(playerSteps(['low-kick-arriere']), 1);
    p.play();
    while (!p.moveNow()) p.update(DT), (t += DT);
    const startT = t;
    for (let i = 0; i < 20; i++) p.update(DT), (t += DT);
    const during = p.moveNow();
    const pose = p.update(DT);
    t += DT;
    p.pause();
    const n = moves.length;
    for (let i = 0; i < 180; i++) {
      // 3 s of pause: nothing changes, nothing is reported
      expect(p.update(DT)).toBe(pose);
      t += DT;
    }
    expect(moves.length).toBe(n);
    expect(p.moveNow()).toEqual(during);
    p.play();
    while (p.moveNow()) p.update(DT), (t += DT);
    const d = duration(getMotion(lib, 'low-kick-arriere', false)!);
    // shown for its motion time plus the pause, no more, no less
    expect(Math.abs(t - startT - 3 - d)).toBeLessThanOrEqual(2 * DT + 1e-9);
  });

  test('recommencer efface le nom à l’instant', () => {
    const lib = getLibrary(rig, 'boxing');
    const moves: (PlayerMove | null)[] = [];
    const p = new ComboPlayer(rig, lib, false, { onMove: (m) => moves.push(m) });
    p.setSequence(playerSteps(['jab', 'direct']), 1);
    p.play();
    while (!p.moveNow()) p.update(DT);
    p.restart();
    expect(p.moveNow()).toBeNull();
    expect(moves[moves.length - 1]).toBeNull();
  });

  test('les déplacements automatiques de recentrage et la garde ne sont jamais affichés', () => {
    // three steps forward: after each repetition the coach walks back to the centre on his own
    const { log, p } = run('boxe', ['pas-avant', 'pas-avant', 'pas-avant'], { rest: 0.5, seconds: 14 });
    expect(p.repetitions).toBeGreaterThanOrEqual(1);
    for (const e of log) if (e.move) expect(e.move.index, 'un mouvement de la séquence').toBeGreaterThanOrEqual(0);
    expect(log.some((e) => e.move === null)).toBe(true);
  });

  test.each(['boxe', 'kickboxing', 'mma', 'muaythai', 'bjj', 'judo'] as DisciplineId[])(
    '%s : les noms officiels de la séquence, dans l’ordre, frappes, défenses, projections et sol compris',
    (d) => {
      const ex = EXERCISES.filter((e) => e.discipline === d && e.sequence.length >= 3).slice(0, 4);
      expect(ex.length).toBeGreaterThan(0);
      for (const e of ex) {
        const { log } = run(d, e.sequence, { rest: 0.8, seconds: 30 });
        const ids = shown(log).map((x) => x.id);
        expect(ids.slice(0, e.sequence.length), e.id).toEqual(e.sequence);
        for (const id of ids) expect(TECHNIQUE_BY_ID.get(id)?.name, id).toBeTruthy();
      }
    },
  );

  test('l’observation ne change aucune pose : animations identiques avec et sans écouteur', () => {
    const a = run('kickboxing', KB, { seconds: 8 }).poses;
    const b = run('kickboxing', KB, { seconds: 8, listen: false }).poses;
    expect(a.length).toBe(b.length);
    for (let i = 0; i < a.length; i++) {
      expect(a[i].hips.distanceTo(b[i].hips)).toBe(0);
      expect(a[i].handR.pos.distanceTo(b[i].handR.pos)).toBe(0);
      expect(a[i].footR.ankle.distanceTo(b[i].footR.ankle)).toBe(0);
      expect(a[i].chest.equals(b[i].chest)).toBe(true);
      expect(a[i].pelvis.equals(b[i].pelvis)).toBe(true);
    }
  });
});
