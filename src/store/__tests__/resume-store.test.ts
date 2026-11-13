import { beforeEach, describe, expect, it } from 'vitest';
import { useResume } from '../resume';
import { snap } from '../../domain/__tests__/resumeFixture';

// 0.33: une sauvegarde corrompue ou ancienne est lue sans plantage ; seuls les instantanés utilisables restent
describe('stockage des séances interrompues', () => {
  const merge = useResume.persist.getOptions().merge!;
  beforeEach(() => localStorage.clear());
  it('données corrompues : ignorées, rien ne plante', () => {
    const cur = useResume.getInitialState();
    for (const saved of [undefined, null, 'x', { snapshots: 'x', programs: 3 }, { snapshots: [null, { v: 1 }], programs: { a: null, b: { lastDone: 'hier', count: 1 } } }]) {
      const r = merge(saved, cur);
      expect(r.snapshots).toEqual([]);
      expect(r.programs).toEqual({});
    }
  });
  it('les instantanés valides sont gardés, les anciens formats écartés', () => {
    const r = merge({ snapshots: [snap(), { ...snap({ query: 'b' }), v: 0 }], programs: { p: { lastDone: '2026-10-20T10:00:00Z', count: 2 } } }, useResume.getInitialState());
    expect(r.snapshots.map((s) => s.query)).toEqual([snap().query]);
    expect(r.programs.p.count).toBe(2);
  });
  it('une séance par clé, la plus récente en tête, cinq au plus', () => {
    useResume.setState({ snapshots: [], programs: {} });
    for (let i = 0; i < 7; i++) useResume.getState().save(snap({ query: `q${i}` }));
    useResume.getState().save(snap({ query: 'q3', reps: 99 }));
    const s = useResume.getState().snapshots;
    expect(s).toHaveLength(5);
    expect(s[0]).toMatchObject({ query: 'q3', reps: 99 });
    expect(new Set(s.map((x) => x.query)).size).toBe(5);
    useResume.getState().drop('q3');
    expect(useResume.getState().snapshots.some((x) => x.query === 'q3')).toBe(false);
  });

  it('la copie immédiate (localStorage) l’emporte sur IndexedDB, plus lent à écrire', () => {
    useResume.setState({ snapshots: [], programs: {} });
    useResume.getState().save(snap({ sessionSec: 42, savedAt: '2026-10-22T11:05:00.000Z' }));
    // IndexedDB n’a pas fini d’écrire : il contient encore l’état d’avant la pause
    const r = merge({ snapshots: [snap({ sessionSec: 0, savedAt: '2026-10-22T11:00:00.000Z' })], programs: {} }, useResume.getInitialState());
    expect(r.snapshots[0].sessionSec).toBe(42);
    // une séance terminée ne revient pas depuis IndexedDB
    useResume.getState().drop(snap().query);
    expect(merge({ snapshots: [snap()], programs: {} }, useResume.getInitialState()).snapshots).toEqual([]);
  });
  it('copie illisible : IndexedDB sert de secours', () => {
    localStorage.setItem('css-resume-mirror:local', '{pas du json');
    expect(merge({ snapshots: [snap()], programs: {} }, useResume.getInitialState()).snapshots).toHaveLength(1);
  });
});
