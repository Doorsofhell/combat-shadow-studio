import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { FREE_COACH_IDS, FREE_PROGRAM_IDS, isPremiumCoach, isPremiumLevel, isPremiumProgram, isPremiumTechnique, techniqueFirstLevel } from '../premiumItems';
import { NO_PURCHASE_SOURCE, canAccessFeature, setRightsSource } from '../rights';
import { PROGRAMS } from '../../domain/programs';
import { programLevel } from '../../domain/programMeta';
import { ALL_COACHES } from '../../domain/coaches/catalog';
import { EXERCISES } from '../../domain/exercises';
import { TECHNIQUES } from '../../domain/techniques';
import { DISCIPLINES } from '../../domain/types';
import { PremiumTag } from '../../ui/premium/PremiumMarker';
import { ExerciseList } from '../../ui/screens/Discipline';

// 2.8.2 (Youssef, 2026-11-24): the diamond on every Premium item, after his choices of 2026-11-20
// (docs/monetisation/DECISIONS.md). Informative only: nothing is locked.

let root: Root | null = null;
let host: HTMLDivElement | null = null;
function mount(node: React.ReactNode) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(<MemoryRouter>{node}</MemoryRouter>));
  return host;
}
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  setRightsSource(NO_PURCHASE_SOURCE);
});

describe('éléments Premium, un par un', () => {
  it('niveaux : débutant et intermédiaire gratuits, avancé et expert Premium (choix 7)', () => {
    expect(isPremiumLevel('debutant')).toBe(false);
    expect(isPremiumLevel('intermediaire')).toBe(false);
    expect(isPremiumLevel('avance')).toBe(true);
    expect(isPremiumLevel('expert')).toBe(true);
  });
  it('coachs : Kadir et Amara gratuits, les autres Premium (choix 8)', () => {
    expect(FREE_COACH_IDS.every((id) => ALL_COACHES.some((c) => c.id === id))).toBe(true);
    for (const c of ALL_COACHES) expect(isPremiumCoach(c.id), c.id).toBe(!['mma-kadir', 'mma-amara'].includes(c.id));
    expect(ALL_COACHES.filter((c) => isPremiumCoach(c.id)).length).toBe(ALL_COACHES.length - 2);
  });
  it('programmes : un programme débutant gratuit par discipline, les autres Premium (choix 9)', () => {
    const free = PROGRAMS.filter((p) => FREE_PROGRAM_IDS.has(p.id));
    expect(free.length).toBe(DISCIPLINES.length);
    expect(new Set(free.map((p) => p.discipline)).size).toBe(DISCIPLINES.length);
    for (const p of free) expect(programLevel(p), p.id).toBe('debutant');
    expect(FREE_PROGRAM_IDS.has('boxe-initiation-4-semaines')).toBe(true);
    for (const p of PROGRAMS) expect(isPremiumProgram(p), p.id).toBe(!FREE_PROGRAM_IDS.has(p.id));
    // the multi-discipline programmes are Premium
    expect(PROGRAMS.filter((p) => p.discipline === 'mixte').every(isPremiumProgram)).toBe(true);
  });
  it('fiches techniques : gratuites pour les techniques des niveaux gratuits (choix 18)', () => {
    expect(isPremiumTechnique('jab')).toBe(false);
    for (const t of TECHNIQUES) {
      const levels = EXERCISES.filter((e) => e.sequence.includes(t.id)).map((e) => e.level);
      const freeSomewhere = levels.some((l) => !isPremiumLevel(l));
      expect(isPremiumTechnique(t.id), t.id).toBe(levels.length > 0 && !freeSomewhere);
    }
    // a technique no exercise uses stays free (nothing to decide it)
    const unused = TECHNIQUES.filter((t) => !techniqueFirstLevel(t.id));
    for (const t of unused) expect(isPremiumTechnique(t.id)).toBe(false);
  });
  it('rien n’est verrouillé : tout reste accessible', () => {
    for (const id of ['advanced_techniques', 'all_programs', 'all_fighters', 'advanced_timer', 'advanced_breakdown'] as const) expect(canAccessFeature(id)).toBe(true);
  });
});

describe('le petit diamant', () => {
  it('chaque exercice avancé ou expert porte le diamant, pas les autres', () => {
    const d = EXERCISES.filter((e) => e.discipline === 'boxe');
    const el = mount(<ExerciseList list={d} onOpen={() => {}} />);
    for (const e of d) {
      const card = el.querySelector(`[data-testid="ex-${e.id}"]`)!;
      expect(!!card.querySelector('[data-testid="premium-tag"]'), e.id).toBe(isPremiumLevel(e.level));
    }
  });
  it('n’est pas un bouton, est nommé, et disparaît pour un utilisateur Premium', () => {
    const el = mount(<PremiumTag feature="all_programs" />);
    const tag = el.querySelector('[data-testid="premium-tag"]')!;
    expect(tag.tagName).toBe('SPAN');
    expect(tag.getAttribute('aria-label')).toBe('Premium');
    act(() => setRightsSource({ id: 'test', status: () => 'premium_lifetime' }));
    expect(el.querySelector('[data-testid="premium-tag"]')).toBeNull();
    expect(el.innerHTML).toBe('');
  });
});
