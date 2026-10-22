import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionPersist, useSession } from '../useSession';
import { exercisePlan, programPlan, Plan } from '../plan';
import { useResume } from '../../../store/resume';
import { useStats } from '../../../store/stats';
import { matchesPlan } from '../../../domain/resume';

// 0.33 (Youssef, 2026-10-22, Entraîner §6 et §21): la séance est sauvegardée aux moments importants et reprend
// exactement où elle était (exercice, round, temps), jamais depuis zéro
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Api = ReturnType<typeof useSession>;
let api: Api;
function Harness({ plan, persist }: { plan: Plan; persist: SessionPersist }) {
  api = useSession(plan, persist);
  return null;
}

let root: ReturnType<typeof createRoot> | null = null;
function mount(plan: Plan, persist: SessionPersist) {
  const el = document.createElement('div');
  root = createRoot(el);
  act(() => root!.render(<Harness plan={plan} persist={persist} />));
}
function unmount() {
  act(() => root?.unmount());
  root = null;
}
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'performance', 'Date'] });
  vi.setSystemTime(new Date('2026-10-22T10:00:00Z'));
  useResume.setState({ snapshots: [], programs: {} });
  useStats.getState().clear();
});
afterEach(() => {
  if (root) unmount();
  vi.useRealTimers();
});

const query = 'ex=boxe-debutant-08&mode=rounds&rest=30&round=60&rounds=3';
const roundsPlan = () => exercisePlan('boxe-debutant-08', 'rounds', { roundSec: 60, restSec: 30, rounds: 3 })!;

describe('sauvegarde de la séance', () => {
  it('rien n’est sauvegardé tant que la séance n’a pas démarré', () => {
    mount(roundsPlan(), { query, coach: 'homme' });
    advance(20_000);
    unmount();
    expect(useResume.getState().snapshots).toHaveLength(0);
  });

  it('pause : l’instantané garde l’exercice, le round, le temps et la vitesse', () => {
    mount(roundsPlan(), { query, coach: 'femme', camera: () => 'face' });
    act(() => api.start());
    advance(4_000); // décompte
    expect(api.view.phase).toBe('travail');
    advance(20_000);
    act(() => api.setSpeed(0.5));
    act(() => api.pause());
    const s = useResume.getState().snapshots[0];
    expect(s.query).toBe(query);
    expect(s.itemKey).toBe('boxe-debutant-08');
    expect(s.phase).toBe('travail');
    expect(s.round).toBe(1);
    expect(s.phaseElapsed).toBeGreaterThan(19);
    expect(s.sessionSec).toBeGreaterThan(19);
    expect(s.speed).toBe(0.5);
    expect(s.coach).toBe('femme');
    expect(s.camera).toBe('face');
    expect(s.plannedSec).toBe(180);
    expect(s.doneSec).toBeCloseTo(s.phaseElapsed, 5);
  });

  it('le passage d’un round au suivant est sauvegardé sans attendre la pause', () => {
    mount(roundsPlan(), { query, coach: 'homme' });
    act(() => api.start());
    advance(4_000 + 61_000);
    expect(api.view.phase).toBe('repos');
    const s = useResume.getState().snapshots[0];
    expect(s.phase).toBe('repos');
    expect(s.round).toBe(2);
  });

  it('fermeture puis réouverture : la séance reprend au bon round et au bon chronomètre, en pause', () => {
    const plan = roundsPlan();
    mount(plan, { query, coach: 'homme' });
    act(() => api.start());
    advance(4_000 + 61_000 + 31_000 + 15_000); // round 1, repos, 15 s du round 2
    expect(api.view.round).toBe(2);
    const before = { remaining: api.view.remaining!, session: api.view.sessionSec };
    unmount(); // l’application est fermée : la sortie sauvegarde
    const s = useResume.getState().snapshots[0];
    expect(matchesPlan(s, plan)).toBe(true);

    mount(roundsPlan(), { query, coach: 'homme', snapshot: s });
    expect(api.view.phase).toBe('travail');
    expect(api.view.paused).toBe(true);
    expect(api.view.round).toBe(2);
    expect(api.view.remaining!).toBeCloseTo(before.remaining, 0);
    expect(api.view.sessionSec).toBeCloseTo(before.session, 0);
    // en pause, le temps ne bouge pas
    advance(10_000);
    expect(api.view.sessionSec).toBeCloseTo(before.session, 0);
    act(() => api.resume());
    advance(5_000);
    expect(api.view.sessionSec).toBeGreaterThan(before.session + 4);
    expect(api.view.remaining!).toBeLessThan(before.remaining - 4);
  });

  it('les statistiques continuent la même séance : pas de double comptage', () => {
    mount(roundsPlan(), { query, coach: 'homme' });
    act(() => api.start());
    advance(4_000 + 20_000);
    act(() => api.pause());
    const s = useResume.getState().snapshots[0];
    unmount();
    mount(roundsPlan(), { query, coach: 'homme', snapshot: s });
    act(() => api.resume());
    advance(10_000);
    act(() => api.pause());
    const sessions = useStats.getState().sessions;
    expect(new Set(sessions.map((x) => x.id.split('#')[0])).size).toBe(1);
    expect(sessions.reduce((a, x) => a + x.activeSec, 0)).toBeCloseTo(30, 0);
  });

  it('fin de séance : l’état de reprise est retiré et un programme compte une séance de plus', () => {
    const plan = programPlan('coordination-15')!;
    mount(plan, { query: 'prog=coordination-15', programId: 'coordination-15', coach: 'homme' });
    act(() => api.start());
    advance(4_000 + 5_000);
    act(() => api.pause());
    expect(useResume.getState().snapshots).toHaveLength(1);
    act(() => api.resume());
    advance(60 * 60_000); // largement plus que la séance
    expect(api.view.phase).toBe('termine');
    expect(useResume.getState().snapshots).toHaveLength(0);
    expect(useResume.getState().programs['coordination-15'].count).toBe(1);
    unmount();
    expect(useResume.getState().snapshots).toHaveLength(0);
  });
});
