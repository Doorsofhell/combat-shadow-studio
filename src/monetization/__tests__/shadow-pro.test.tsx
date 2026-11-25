import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import {
  FREE_PROGRAM_IDS,
  canOpenCoach,
  canOpenExercise,
  canOpenSession,
  canOpenTechnique,
  isProgramLocked,
  lockedTrainingRight,
  programProShare,
} from '../premiumItems';
import { NO_PURCHASE_SOURCE, canAccessFeature, hasPremium, isFeatureLocked, restrictionsActive, setRestrictionsSimulated, setRightsSource, type RightsSource } from '../rights';
import { ENTITLEMENTS } from '../entitlements';
import { PROGRAMS, PROGRAM_BY_ID } from '../../domain/programs';
import { EXERCISES } from '../../domain/exercises';
import type { Program } from '../../domain/types';
import { LaunchOrLock, PremiumMarker, ProBadge, ProLock, ProShield, ProgramProBadge } from '../../ui/premium/PremiumMarker';
import { TechniqueCard } from '../../ui/components/Cards';
import { pickChampion } from '../../ui/screens/CoachSelect';
import { ALL_COACHES } from '../../domain/coaches/catalog';
import { useProfile } from '../../store/profile';

/**
 * 2.9.0 (Youssef, 2026-11-25, « Shadow Studio — Identification visuelle des contenus Freemium et Premium », §9): the
 * PRO badge (catalogue membership) and the padlock (real restriction) for each kind of user, and the mixed programmes.
 * The restrictions are turned on by the test only (setRestrictionsSimulated), as the preview build does: production
 * keeps them off (MONETIZATION_ENABLED = false).
 */
const PREMIUM: RightsSource = { id: 'test-premium', status: () => 'premium_lifetime' };
/** a refunded purchase (Premium à vie never expires; a refund withdraws it): the status is free again */
const REFUNDED: RightsSource = { id: 'test-rembourse', status: () => 'free' };

let root: Root | null = null;
let host: HTMLDivElement | null = null;
function mount(node: React.ReactNode, path = '/') {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root!.render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/premium" element={<div data-testid="on-premium" />} />
          <Route path="*" element={node} />
        </Routes>
      </MemoryRouter>,
    ),
  );
  return host;
}
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  setRightsSource(NO_PURCHASE_SOURCE);
  setRestrictionsSimulated(false);
});

const proExercise = EXERCISES.find((e) => e.level === 'avance')!;
const freeExercise = EXERCISES.find((e) => e.level === 'debutant')!;
const freeProgram = PROGRAM_BY_ID.get('kick-fondamentaux-debutant')!;
const proProgram = PROGRAM_BY_ID.get('boxe-angles-avance')!;
/** a mixed programme built for the test: three free weeks, three PRO weeks (the catalogue has none) */
function mixedProgram(): Program {
  const a = freeProgram;
  const sessions = [...a.sessions!.slice(0, 3), ...proProgram.sessions!.slice(0, 3)].map((s, i) => ({ ...s, week: i + 1 }));
  return { ...a, sessions, blocks: sessions[0].blocks };
}

describe('production aujourd’hui (restrictions éteintes)', () => {
  it('rien n’est verrouillé, pour personne, mais le catalogue PRO est nommé', () => {
    expect(restrictionsActive()).toBe(false);
    for (const e of ENTITLEMENTS) expect(isFeatureLocked(e.id)).toBe(false);
    expect(canOpenExercise(proExercise)).toBe(true);
    expect(isProgramLocked(proProgram)).toBe(false);
    expect(canOpenCoach('mma-nael')).toBe(true);
    const el = mount(<ProgramProBadge share={programProShare(proProgram)} />);
    expect(el.textContent).toBe('PRO');
  });
});

describe('utilisateur gratuit, non connecté (profil invité) ou remboursé', () => {
  for (const [name, src] of [
    ['gratuit / invité', NO_PURCHASE_SOURCE],
    ['achat remboursé (« expiré »)', REFUNDED],
  ] as const) {
    it(`${name} : les contenus PRO sont visibles et verrouillés, les gratuits ouverts`, () => {
      setRestrictionsSimulated(true);
      setRightsSource(src);
      expect(hasPremium()).toBe(false);
      expect(canOpenExercise(proExercise)).toBe(false);
      expect(canOpenExercise(freeExercise)).toBe(true);
      expect(canOpenCoach('mma-kadir')).toBe(true);
      expect(canOpenCoach('mma-amara')).toBe(true);
      for (const c of ALL_COACHES.filter((x) => !['mma-kadir', 'mma-amara'].includes(x.id))) expect(canOpenCoach(c.id), c.id).toBe(false);
      expect(isProgramLocked(freeProgram)).toBe(false);
      expect(isProgramLocked(proProgram)).toBe(true);
      expect(canAccessFeature('ai_coach' as never)).toBe(true);
    });
  }
});

describe('utilisateur Premium', () => {
  it('tout s’ouvre, aucun cadenas, les badges PRO restent', () => {
    setRestrictionsSimulated(true);
    setRightsSource(PREMIUM);
    for (const e of ENTITLEMENTS) expect(isFeatureLocked(e.id)).toBe(false);
    expect(canOpenExercise(proExercise)).toBe(true);
    for (const p of PROGRAMS) expect(isProgramLocked(p), p.id).toBe(false);
    for (const c of ALL_COACHES) expect(canOpenCoach(c.id)).toBe(true);
    const el = mount(
      <>
        <ProgramProBadge share={programProShare(proProgram)} />
        <LaunchOrLock locked={isProgramLocked(proProgram)}>
          <i data-testid="launch" />
        </LaunchOrLock>
        <ProShield />
      </>,
    );
    expect(el.querySelector('.pro-badge')!.textContent).toBe('PRO');
    expect(el.querySelector('[data-testid="pro-lock"]')).toBeNull();
    expect(el.querySelector('[data-testid="launch"]')).not.toBeNull();
    expect(el.querySelector('[data-testid="pro-shield"]')!.getAttribute('aria-label')).toBe('Membre Shadow Pro');
  });
  it('le bouclier n’existe pas pour un utilisateur gratuit (pas de badge FREE)', () => {
    const el = mount(<ProShield />);
    expect(el.innerHTML).toBe('');
    expect(el.textContent).not.toMatch(/free/i);
  });
});

describe('programmes : gratuit, entièrement PRO, mixte (calculé)', () => {
  it('programme gratuit : aucun indicateur ; entièrement PRO : « PRO »', () => {
    expect(programProShare(freeProgram)).toEqual({ pro: 0, total: 4, kind: 'gratuit' });
    expect(programProShare(proProgram)).toEqual({ pro: 4, total: 4, kind: 'pro' });
    expect(mount(<ProgramProBadge share={programProShare(freeProgram)} />).innerHTML).toBe('');
  });
  it('le catalogue actuel n’a aucun programme mixte (répartition inchangée)', () => {
    expect(PROGRAMS.filter((p) => programProShare(p).kind === 'mixte').map((p) => p.id)).toEqual([]);
    expect(FREE_PROGRAM_IDS.size).toBe(6);
    expect(PROGRAMS.filter((p) => programProShare(p).kind === 'pro')).toHaveLength(43);
  });
  it('programme mixte : « 3/6 PRO », ses séances gratuites restent ouvertes, jamais affiché tout verrouillé', () => {
    const p = mixedProgram();
    expect(programProShare(p)).toEqual({ pro: 3, total: 6, kind: 'mixte' });
    const el = mount(<ProgramProBadge share={programProShare(p)} />);
    expect(el.textContent).toBe('3/6 PRO');
    expect(el.querySelector('.pro-badge')!.getAttribute('aria-label')).toBe('3 séances sur 6 dans Shadow Pro');
    setRestrictionsSimulated(true);
    expect([0, 1, 2, 3, 4, 5].map((i) => canOpenSession(p, i))).toEqual([true, true, true, false, false, false]);
    expect(isProgramLocked(p)).toBe(false);
  });
  it('séance mixte (exercices PRO dans une séance) : la séance entière est PRO', () => {
    const p = mixedProgram();
    const s = p.sessions![1];
    const mixedSession = { ...p, sessions: [{ ...s, blocks: [...s.blocks, proProgram.sessions![0].blocks[1]] }] };
    expect(programProShare(mixedSession)).toEqual({ pro: 1, total: 1, kind: 'pro' });
  });
});

describe('les gardes : un cadenas n’est jamais la seule barrière', () => {
  it('adresse d’entraînement d’un contenu verrouillé : refusée (exercice, séance, technique)', () => {
    setRestrictionsSimulated(true);
    expect(lockedTrainingRight(new URLSearchParams(`ex=${proExercise.id}`))).toBe('advanced_techniques');
    expect(lockedTrainingRight(new URLSearchParams(`ex=${freeExercise.id}`))).toBeNull();
    expect(lockedTrainingRight(new URLSearchParams(`prog=${proProgram.id}&s=2`))).toBe('all_programs');
    expect(lockedTrainingRight(new URLSearchParams(`prog=${freeProgram.id}&s=2`))).toBeNull();
    expect(canOpenTechnique('crochet-arriere')).toBe(false);
    expect(lockedTrainingRight(new URLSearchParams('tech=crochet-arriere'))).toBe('advanced_techniques');
    setRightsSource(PREMIUM);
    expect(lockedTrainingRight(new URLSearchParams(`prog=${proProgram.id}&s=2`))).toBeNull();
  });
  it('un coach verrouillé n’est jamais enregistré', () => {
    setRestrictionsSimulated(true);
    const before = useProfile.getState().profile.champion;
    const nael = ALL_COACHES.find((c) => !['mma-kadir', 'mma-amara'].includes(c.id))!;
    expect(pickChampion(nael)).toBe(false);
    expect(useProfile.getState().profile.champion).toBe(before);
  });
  it('carte verrouillée : le cadenas remplace la flèche, le toucher ouvre Shadow Pro', () => {
    setRestrictionsSimulated(true);
    const el = mount(<TechniqueCard to="/techniques/crochet-arriere" title="Crochet droit avec un titre très long pour vérifier" premium="advanced_techniques" locked testId="card" />);
    const card = el.querySelector('[data-testid="card"]') as HTMLAnchorElement;
    expect(card.querySelector('[data-testid="pro-lock"]')).not.toBeNull();
    expect(card.querySelectorAll('[data-testid="pro-lock"]')).toHaveLength(1);
    expect(card.querySelector('.pro-badge')!.textContent).toBe('PRO');
    act(() => card.click());
    expect(el.querySelector('[data-testid="on-premium"]')).not.toBeNull();
  });
});

describe('composants', () => {
  it('badge : texte PRO (pas seulement une couleur), nommé, jamais un bouton dans une carte', () => {
    const el = mount(<ProBadge />);
    const b = el.querySelector('.pro-badge')!;
    expect(b.tagName).toBe('SPAN');
    expect(b.textContent).toBe('PRO');
    expect(b.getAttribute('role')).toBe('img');
  });
  it('cadenas : nommé « Verrouillé : Shadow Pro »', () => {
    const el = mount(<ProLock />);
    expect(el.querySelector('[data-testid="pro-lock"]')!.getAttribute('aria-label')).toBe('Verrouillé : Shadow Pro');
  });
  it('titre d’écran pour un gratuit : un bouton PRO qui mène à l’offre', () => {
    const el = mount(<PremiumMarker feature="all_programs" />);
    const b = el.querySelector('button')!;
    expect(b.textContent).toBe('PRO');
    act(() => b.click());
    expect(el.querySelector('[data-testid="on-premium"]')).not.toBeNull();
  });
});
