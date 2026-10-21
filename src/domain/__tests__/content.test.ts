import { describe, expect, test } from 'vitest';
import { EXERCISES, exercisesFor } from '../exercises';
import { PROGRAMS } from '../programs';
import { TECHNIQUES, TECHNIQUE_BY_ID } from '../techniques';
import { isPlayable, validateSequence } from '../transitions';
import { recommend } from '../recommend';
import { DISCIPLINES, LEVELS } from '../types';
import { EXERCISE_BY_ID } from '../exercises';
import { DEFAULT_PROFILE } from '../../store/profile';
import { SOURCE_BY_ID } from '../biomech/sources';

const GRAPPLING = ['bjj', 'judo'];

describe('contenu', () => {
  test('au moins 10 exercices par discipline de frappe et par niveau (160 minimum)', () => {
    for (const d of DISCIPLINES) {
      // BJJ and judo only offer what is really done alone (no padding with fake solo drills): at least 3 per level
      const min = GRAPPLING.includes(d.id) ? 3 : 10;
      for (const l of LEVELS) expect(exercisesFor(d.id, l.id).length, `${d.id} ${l.id}`).toBeGreaterThanOrEqual(min);
    }
    expect(EXERCISES.length).toBeGreaterThanOrEqual(160);
  });

  test('identifiants uniques', () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
    expect(new Set(TECHNIQUES.map((t) => t.id)).size).toBe(TECHNIQUES.length);
  });

  test('chaque exercice n’utilise que des techniques autorisées dans sa discipline et reste jouable', () => {
    for (const e of EXERCISES) {
      for (const id of e.sequence) {
        const t = TECHNIQUE_BY_ID.get(id);
        expect(t, `${e.id}: ${id}`).toBeDefined();
        expect(t!.disciplines, `${e.id}: ${id}`).toContain(e.discipline);
      }
      expect(isPlayable(validateSequence(e.sequence, e.discipline)), e.id).toBe(true);
    }
  });

  test('pas de coudes, genoux ni coups de pied en boxe anglaise', () => {
    for (const e of exercisesFor('boxe', 'expert').concat(exercisesFor('boxe', 'debutant'))) {
      for (const id of e.sequence) expect(['pied', 'genou', 'coude', 'lutte', 'sol', 'clinch']).not.toContain(TECHNIQUE_BY_ID.get(id)!.category);
    }
  });

  test('chaque technique est décrite en français avec consignes et points clés', () => {
    for (const t of TECHNIQUES) {
      expect(t.name.length).toBeGreaterThan(2);
      expect(t.cues.length).toBeGreaterThan(0);
      expect(t.keyPoints.length).toBeGreaterThan(0);
      expect(t.disciplines.length).toBeGreaterThan(0);
    }
  });

  test('les programmes pointent vers des exercices existants', () => {
    for (const p of PROGRAMS) for (const b of p.blocks) expect(EXERCISE_BY_ID.has(b.exercise), `${p.id}: ${b.exercise}`).toBe(true);
  });
});

describe('validation des enchaînements personnalisés', () => {
  test('refuse un relevé quand on est déjà debout et un mouvement au sol depuis debout', () => {
    const a = validateSequence(['jab', 'releve-technique'], 'mma');
    expect(isPlayable(a)).toBe(false);
    const b = validateSequence(['jab', 'sortie-hanche'], 'mma');
    expect(isPlayable(b)).toBe(false);
    const c = validateSequence(['jab', 'descente-sol', 'sortie-hanche', 'releve-technique'], 'mma');
    expect(isPlayable(c)).toBe(true);
  });

  test('refuse une technique interdite dans la discipline', () => {
    const r = validateSequence(['jab', 'coude-horizontal-avant'], 'boxe');
    expect(isPlayable(r)).toBe(false);
    expect(r.find((i) => i.level === 'erreur')!.message).toMatch(/boxe anglaise/);
  });

  test('avertit quand la séquence finit au sol et quand elle est vide', () => {
    expect(validateSequence(['descente-sol'], 'mma').some((i) => i.level === 'attention')).toBe(true);
    expect(isPlayable(validateSequence([], 'boxe'))).toBe(false);
  });
});

describe('recommandations', () => {
  test('propose des exercices de la discipline et du niveau déclarés', () => {
    const r = recommend({ ...DEFAULT_PROFILE, mainDiscipline: 'muaythai', levels: { ...DEFAULT_PROFILE.levels, muaythai: 'avance' }, goals: ['cardio'] });
    expect(r.discipline).toBe('muaythai');
    expect(r.exercises.length).toBe(4);
    for (const e of r.exercises) expect([e.discipline, e.level]).toEqual(['muaythai', 'avance']);
  });

  test('réduit la vitesse en cas de limitation physique', () => {
    const r = recommend({ ...DEFAULT_PROFILE, levels: { ...DEFAULT_PROFILE.levels, boxe: 'expert' }, limitations: 'genou' });
    expect(r.speed).toBeLessThanOrEqual(0.65);
  });
});

import { GUIDES } from '../guide';
describe('fiches pas à pas', () => {
  test('chaque technique a une fiche complète', () => {
    for (const t of TECHNIQUES) {
      const g = GUIDES[t.id];
      expect(g, t.id).toBeDefined();
      expect(g.steps.length, t.id).toBeGreaterThanOrEqual(3);
      expect(g.errors.length, t.id).toBeGreaterThanOrEqual(2);
    }
    for (const id of Object.keys(GUIDES)) expect(TECHNIQUE_BY_ID.has(id), id).toBe(true);
  });
});

describe('fiches partagées entre disciplines (0.28)', () => {
  test('une note par discipline seulement pour les disciplines de la technique, sources connues', () => {
    for (const t of TECHNIQUES) {
      for (const d of Object.keys(t.notes ?? {})) expect(t.disciplines, `${t.id} : note ${d}`).toContain(d);
      for (const id of t.sources ?? []) expect(SOURCE_BY_ID.has(id), `${t.id} : source ${id}`).toBe(true);
    }
  });
  test('les chutes : version basse, avec un encadré de sécurité', () => {
    for (const t of TECHNIQUES.filter((x) => x.category === 'chute')) {
      expect(t.safety, t.id).toMatch(/debout/);
      expect(t.soloNote, t.id).toMatch(/tapis épais/);
    }
  });
});
