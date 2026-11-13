import { beforeEach, describe, expect, it } from 'vitest';
import { useCustom } from '../../../../store/custom';
import { useGoals } from '../../../../store/goals';
import type { SessionRecord } from '../../../../store/stats';
import { analysisState } from '../../../../domain/comboAnalysis';
import { analyseSaved, deleteCombo, duplicateCombo, saveCombo, stored } from '../actions';
import { masteryKey, usageOf } from '../shared';
import { arrange } from '../CreatorList';

const T0 = '2026-10-20T10:00:00.000Z';
const T1 = '2026-10-22T18:00:00.000Z';

// 0.38 (Youssef, 2026-10-22, « Créateur d'enchaînements V2 »)
describe('créateur V2 : enregistrer, modifier, dupliquer, supprimer', () => {
  beforeEach(() => {
    useCustom.setState({ combos: [] });
    useGoals.getState().clear();
  });

  it('création : nouvel id, date de création, analyse locale enregistrée', () => {
    const c = saveCombo({ name: 'A', discipline: 'boxe', sequence: ['jab', 'direct'] }, T0);
    expect(c.id).toBeTruthy();
    expect(c.createdAt).toBe(T0);
    expect(c.updatedAt).toBeUndefined();
    expect(analysisState(c)).toBe('ok');
    expect(useCustom.getState().combos).toHaveLength(1);
  });

  it('modification : même id, « modifié le » seulement si quelque chose change, analyse recalculée', () => {
    const c = saveCombo({ name: 'A', discipline: 'boxe', sequence: ['jab', 'direct'] }, T0);
    const same = saveCombo({ id: c.id, name: 'A', discipline: 'boxe', sequence: ['jab', 'direct'] }, T1);
    expect(same.updatedAt).toBeUndefined();
    const renamed = saveCombo({ id: c.id, name: 'B', discipline: 'boxe', sequence: ['jab', 'direct'] }, T1);
    expect(renamed.id).toBe(c.id);
    expect(renamed.createdAt).toBe(T0);
    expect(renamed.updatedAt).toBe(T1);
    expect(renamed.analysis).toEqual(c.analysis); // a new name does not change the analysis
    const moved = saveCombo({ id: c.id, name: 'B', discipline: 'boxe', sequence: ['direct', 'jab', 'esquive-droite'] }, T1);
    expect(moved.analysis!.hash).not.toBe(c.analysis!.hash);
    expect(analysisState(moved)).toBe('ok');
    expect(useCustom.getState().combos).toHaveLength(1);
  });

  it('modifier garde la place dans la liste et le statut personnel', () => {
    const a = saveCombo({ name: 'A', discipline: 'boxe', sequence: ['jab'] }, T0);
    saveCombo({ name: 'B', discipline: 'boxe', sequence: ['direct'] }, T0);
    useGoals.getState().toggleMastery(masteryKey(a.id), 'acquise');
    saveCombo({ id: a.id, name: 'A2', discipline: 'boxe', sequence: ['jab', 'direct'] }, T1);
    expect(useCustom.getState().combos.map((c) => c.name)).toEqual(['A2', 'B']);
    expect(useGoals.getState().mastery[masteryKey(a.id)]).toBe('acquise');
  });

  it('duplication : nouvel id, aucune statistique, statut ni date copiés', () => {
    const a = saveCombo({ name: 'A', discipline: 'mma', sequence: ['jab', 'sprawl'] }, T0);
    useGoals.getState().toggleMastery(masteryKey(a.id), 'a-revoir');
    const b = duplicateCombo(a.id, T1)!;
    expect(b.id).not.toBe(a.id);
    expect(b.name).toBe('A (copie)');
    expect(b.sequence).toEqual(a.sequence);
    expect(b.createdAt).toBe(T1);
    expect(b.updatedAt).toBeUndefined();
    expect(useGoals.getState().mastery[masteryKey(b.id)]).toBeUndefined();
    const sessions: SessionRecord[] = [{ id: 's1', start: T0, discipline: 'mma', level: 'debutant', exerciseId: `perso-${a.id}`, exerciseName: 'A', mode: 'libre', activeSec: 60, reps: 3 }];
    expect(usageOf(b.id, sessions)).toEqual({ count: 0, last: null });
    expect(usageOf(a.id, sessions)).toEqual({ count: 1, last: T0 });
  });

  it('suppression : retire l’enchaînement et son statut, pas les autres', () => {
    const a = saveCombo({ name: 'A', discipline: 'boxe', sequence: ['jab'] }, T0);
    const b = saveCombo({ name: 'B', discipline: 'boxe', sequence: ['direct'] }, T0);
    useGoals.getState().toggleMastery(masteryKey(a.id), 'acquise');
    useGoals.getState().toggleMastery('jab', 'acquise');
    deleteCombo(a.id);
    expect(useCustom.getState().combos.map((c) => c.id)).toEqual([b.id]);
    expect(useGoals.getState().mastery).toEqual({ jab: 'acquise' });
  });

  it('un enchaînement d’avant la 0.38 reste « Non analysé » jusqu’à l’analyse, sans changer ses dates', () => {
    useCustom.setState({ combos: [{ id: 'old', name: 'Vieux', discipline: 'boxe', sequence: ['jab', 'direct'], createdAt: T0 }] });
    expect(analysisState(useCustom.getState().combos[0])).toBe('none');
    analyseSaved('old', T1);
    const c = useCustom.getState().combos[0];
    expect(analysisState(c)).toBe('ok');
    expect(c.createdAt).toBe(T0);
    expect(c.updatedAt).toBeUndefined();
  });
});

describe('liste : filtres et tris', () => {
  const combos = [
    { id: 'a', name: 'Jab direct', discipline: 'boxe' as const, sequence: ['jab', 'direct'], createdAt: '2026-10-01T00:00:00Z', analysis: undefined },
    { id: 'b', name: 'Low kick', discipline: 'kickboxing' as const, sequence: ['low-kick-arriere'], createdAt: '2026-10-05T00:00:00Z' },
    { id: 'c', name: 'Crochet', discipline: 'boxe' as const, sequence: ['crochet-avant'], createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-10-10T00:00:00Z' },
  ];
  const usage = (id: string) => ({ count: id === 'b' ? 5 : id === 'a' ? 2 : 0, last: null });
  const base = { d: 'toutes' as const, sort: 'recents' as const, status: 'tous' as const, text: '', usage, mastery: {} };
  it('plus récents : par date de modification, sinon de création', () => {
    expect(arrange(combos, base).map((c) => c.id)).toEqual(['c', 'b', 'a']);
  });
  it('plus utilisés, discipline, statut, recherche', () => {
    expect(arrange(combos, { ...base, sort: 'utilises' }).map((c) => c.id)).toEqual(['b', 'a', 'c']);
    expect(arrange(combos, { ...base, d: 'boxe' }).map((c) => c.id)).toEqual(['c', 'a']);
    expect(arrange(combos, { ...base, status: 'acquise', mastery: { 'combo:a': 'acquise' } }).map((c) => c.id)).toEqual(['a']);
    expect(arrange(combos, { ...base, status: 'a-revoir', mastery: { 'combo:a': 'acquise' } })).toEqual([]);
    expect(arrange(combos, { ...base, text: 'jab' }).map((c) => c.id)).toEqual(['a']);
  });
  it('meilleures évaluations : les non analysés en dernier, jamais une note inventée', () => {
    const scored = [...combos];
    // only « b » has a valid stored analysis; « c » has one that no longer matches its moves
    scored[1] = { ...scored[1], analysis: stored('kickboxing', ['low-kick-arriere'], T0) };
    scored[2] = { ...scored[2], analysis: { ...stored('boxe', ['jab'], T0), score: 99 } };
    const ids = arrange(scored, { ...base, sort: 'evaluations' }).map((c) => c.id);
    expect(ids[0]).toBe('b');
    expect(ids.slice(1).sort()).toEqual(['a', 'c']);
  });
});
