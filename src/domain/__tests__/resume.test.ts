import { describe, expect, it } from 'vitest';
import { matchesPlan, pickCard, progressRatio, sessionQuery, validSnapshot, workProgress } from '../resume';
import { snap } from './resumeFixture';

// 0.33 (Youssef, 2026-10-22, Entraîner §5-6 et §21): carte de reprise, sauvegarde et restauration réelles
const now = new Date('2026-10-22T12:00:00Z');
const base = { programs: {}, hasHistory: true, available: () => true, programExists: () => true, now };

describe('instantané de reprise', () => {
  it('un instantané complet est accepté tel quel', () => {
    expect(validSnapshot(snap())).toEqual(snap());
  });

  it('données corrompues ou ancienne sauvegarde : refusées sans plantage', () => {
    for (const bad of [null, 42, 'texte', {}, { ...snap(), v: 0 }, { ...snap(), itemIndex: 12 }, { ...snap(), round: 0 }, { ...snap(), phase: 'termine' }, { ...snap(), sessionSec: -1 }, { ...snap(), sessionSec: Number.NaN }, { ...snap(), savedAt: 'hier' }, { ...snap(), plannedSec: 0 }, { ...snap(), coach: 'robot' }, { ...snap(), query: '' }]) {
      expect(validSnapshot(bad)).toBeNull();
    }
  });

  it('la clé de séance ignore le marqueur de reprise et l’ordre des paramètres', () => {
    expect(sessionQuery(new URLSearchParams('ex=a&mode=libre&reprise=1'))).toBe(sessionQuery(new URLSearchParams('mode=libre&ex=a')));
  });

  it('la reprise exige le même exercice à la même place du plan', () => {
    const items = Array.from({ length: 12 }, (_, i) => ({ key: `boxe-debutant-${String(i + 1).padStart(2, '0')}`, work: null, rounds: 1 }));
    expect(matchesPlan(snap(), { items })).toBe(true);
    expect(matchesPlan(snap(), { items: items.slice(0, 11) })).toBe(false);
    expect(matchesPlan(snap({ itemKey: 'autre' }), { items })).toBe(false);
  });
});

describe('progression réelle', () => {
  const prog = { mode: 'programme' as const, items: [{ key: 'a', work: 60, rounds: 2 }, { key: 'b', work: 120, rounds: 3 }] };
  it('programme : blocs terminés + rounds faits + temps du round en cours', () => {
    expect(workProgress(prog, { itemIndex: 1, round: 2, phase: 'travail', phaseElapsed: 30 })).toEqual({ plannedSec: 480, doneSec: 120 + 120 + 30 });
    // le temps de repos n’est pas du travail
    expect(workProgress(prog, { itemIndex: 1, round: 2, phase: 'repos', phaseElapsed: 30 }).doneSec).toBe(240);
  });
  it('pratique libre : pas de durée prévue, donc aucun pourcentage inventé', () => {
    const p = workProgress({ mode: 'libre', items: [{ key: 'a', work: null, rounds: 1 }] }, { itemIndex: 0, round: 1, phase: 'travail', phaseElapsed: 90 });
    expect(p.plannedSec).toBeNull();
    expect(progressRatio({ ...p })).toBeNull();
  });
  it('exercice chronométré : le bloc en cours seulement', () => {
    expect(workProgress({ mode: 'rounds', items: [{ key: 'a', work: 180, rounds: 3 }, { key: 'b', work: 180, rounds: 3 }] }, { itemIndex: 0, round: 3, phase: 'travail', phaseElapsed: 90 })).toEqual({ plannedSec: 540, doneSec: 450 });
  });
});

describe('carte de reprise : priorité', () => {
  it('nouvel utilisateur : état D', () => {
    expect(pickCard({ ...base, snapshots: [], hasHistory: false }).kind).toBe('premiere');
  });
  it('historique sans séance interrompue ni programme : état C', () => {
    expect(pickCard({ ...base, snapshots: [] }).kind).toBe('nouvelle');
  });
  it('programme fait récemment : état B, avant la simple suggestion', () => {
    const c = pickCard({ ...base, snapshots: [], programs: { 'judo-bases-solo': { lastDone: '2026-10-20T10:00:00Z', count: 2 } } });
    expect(c).toEqual({ kind: 'programme', programId: 'judo-bases-solo', run: { lastDone: '2026-10-20T10:00:00Z', count: 2 } });
    // trop ancien : plus « actif »
    expect(pickCard({ ...base, snapshots: [], programs: { x: { lastDone: '2026-09-01T10:00:00Z', count: 1 } } }).kind).toBe('nouvelle');
  });
  it('séance interrompue : état A, prioritaire ; la plus récente parmi les valides', () => {
    const older = snap({ query: 'a', savedAt: '2026-10-21T10:00:00Z' });
    const newer = snap({ query: 'b', savedAt: '2026-10-22T10:00:00Z' });
    const broken = { ...snap({ query: 'c', savedAt: '2026-10-22T11:59:00Z' }), v: 9 };
    const gone = snap({ query: 'd', savedAt: '2026-10-22T11:58:00Z' });
    const c = pickCard({ ...base, snapshots: [older, broken, gone, newer], programs: { x: { lastDone: '2026-10-22T09:00:00Z', count: 1 } }, available: (s) => s.query !== 'd' });
    expect(c.kind === 'reprendre' && c.snapshot.query).toBe('b');
  });
  it('une séance interrompue trop ancienne n’est plus proposée', () => {
    expect(pickCard({ ...base, snapshots: [snap({ savedAt: '2026-08-01T10:00:00Z' })] }).kind).toBe('nouvelle');
  });
});
