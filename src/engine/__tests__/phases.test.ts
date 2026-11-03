import { describe, expect, test } from 'vitest';
import { loadSkeleton } from '../../test/skeleton';
import { CoachRig } from '../rig';
import { getLibrary, getMotion } from '../library';
import { duration } from '../motion';
import { techniquePhases } from '../phases';
import { StudyPlayer } from '../study';
import { TECHNIQUES, TECHNIQUE_BY_ID } from '../../domain/techniques';
import { STYLE_OF } from '../../three/CoachStage';

const rig = new CoachRig(loadSkeleton('homme'));
const phasesOf = (id: string, southpaw = false) => {
  const t = TECHNIQUE_BY_ID.get(id)!;
  const m = getMotion(getLibrary(rig, STYLE_OF[t.disciplines[0]]), t.motion, southpaw)!;
  return { m, ph: techniquePhases(rig, m, t.category, t.id) };
};

describe('phases pédagogiques mesurées sur l’animation', () => {
  test('direct arrière : pied arrière, hanches et épaules, bras arrière, impact, retour', () => {
    const labels = phasesOf('direct').ph.map((p) => p.label);
    expect(labels[0]).toBe('Position de départ');
    expect(labels).toContain('Impulsion du pied arrière');
    expect(labels).toContain('Rotation des hanches et des épaules');
    expect(labels).toContain('Extension du bras arrière');
    expect(labels.slice(-2)).toEqual(['Impact', 'Retour et rééquilibrage']);
  });

  test('uppercut arrière : le bras qui frappe est le bras arrière, même si la main avant bouge avec le buste', () => {
    expect(phasesOf('uppercut-arriere').ph.map((p) => p.label)).toContain('Trajectoire du bras arrière');
  });

  test('un coup de pied a sa phase de jambe, une projection n’a pas d’« impact »', () => {
    expect(phasesOf('middle-kick-arriere').ph.map((p) => p.label)).toContain('Frappe de la jambe arrière');
    const judo = phasesOf('uchikomi-seoi').ph.map((p) => p.label);
    expect(judo).not.toContain('Impact');
    expect(judo).toContain('Position clé');
  });

  test.each(TECHNIQUES.filter((t) => t.mode !== 'partenaire').map((t) => t.id))('%s : phases cohérentes, identiques dans les deux gardes pour un coup', (id) => {
    const { m, ph } = phasesOf(id);
    const dur = duration(m);
    expect(ph[0].kind).toBe('depart');
    expect(ph.some((p) => p.kind === 'cle')).toBe(true);
    const work = ph.filter((p) => !['depart', 'cle', 'retour'].includes(p.kind));
    expect(work.length).toBeLessThanOrEqual(4);
    const key = ph.find((p) => p.kind === 'cle')!.t1;
    for (const p of ph) {
      expect(p.label.length).toBeGreaterThan(3);
      expect(p.t0).toBeGreaterThanOrEqual(0);
      expect(p.t1).toBeGreaterThanOrEqual(p.t0);
      expect(p.t1).toBeLessThanOrEqual(dur + 1e-6);
    }
    for (const p of work) expect(p.t1).toBeLessThanOrEqual(key + 1e-6);
    // a strike is the mirror image in the other guard; a step to one side is not (the lead foot changes)
    if (TECHNIQUE_BY_ID.get(id)!.category !== 'deplacement') expect(phasesOf(id, true).ph.map((p) => p.label)).toEqual(ph.map((p) => p.label));
  });
});

describe('mode Analyse technique', () => {
  const player = () => {
    const p = new StudyPlayer(rig, getLibrary(rig, 'boxing'), false);
    p.setTechnique('direct', 'poing', 'direct');
    return p;
  };

  test('vitesse réelle d’abord, puis la leçon au ralenti', () => {
    const p = new StudyPlayer(rig, getLibrary(rig, 'boxing'), false);
    p.preview = true;
    p.setTechnique('direct', 'poing', 'direct');
    expect(p.phase).toBe('reel');
    let n = 0;
    while (p.phase === 'reel' && n++ < 200) p.update(1 / 30);
    // the whole motion at speed 1 (0.4 s) plus a short hold
    expect(n).toBeGreaterThan(Math.floor(0.4 * 30));
    expect(n).toBeLessThan(40);
    expect(p.phase).toBe('depart');
  });

  test('au ralenti, le coach s’arrête sur la fin de chaque phase', () => {
    const p = player();
    const ends = p.phases.filter((x) => !['depart', 'cle', 'retour'].includes(x.kind)).map((x) => x.t1);
    const stops = new Set<number>();
    let last = -1;
    for (let i = 0; i < 4000 && p.phase !== 'point'; i++) {
      p.update(1 / 60);
      if (p.t === last) stops.add(Number(p.t.toFixed(4)));
      last = p.t;
    }
    for (const e of ends) expect([...stops].some((s) => Math.abs(s - e) < 1e-3)).toBe(true);
  });

  test('rejouer une phase précise : de son début à sa fin, puis pause', () => {
    const p = player();
    const i = p.phases.findIndex((x) => x.kind === 'hanches');
    p.playPhase(i);
    expect(p.t).toBeCloseTo(p.phases[i].t0, 5);
    expect(p.playing).toBe(true);
    for (let k = 0; k < 600 && p.playing; k++) p.update(1 / 30);
    expect(p.playing).toBe(false);
    expect(p.t).toBeCloseTo(p.phases[i].t1, 5);
    expect(p.phaseIndex).toBe(i);
  });

  test('la phase affichée suit le mouvement', () => {
    const p = player();
    expect(p.phases[p.phaseIndex].kind).toBe('depart');
    p.seek(p.analysis!.peak);
    expect(p.phases[p.phaseIndex].kind).toBe('cle');
    p.seek(p.duration);
    expect(p.phases[p.phaseIndex].kind).toBe('retour');
  });
});
