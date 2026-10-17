import { beforeEach, describe, expect, test } from 'vitest';
import { ActiveTimer } from '../timer';
import { exportData, formatDuration, sessionCount, useStats, weekKey } from '../stats';

describe('chronomètre actif', () => {
  test('ne compte pas pendant la pause et reprend ensuite', () => {
    let now = 0;
    const t = new ActiveTimer(() => now);
    t.start();
    now = 10_000;
    t.pause();
    now = 70_000; // one minute paused
    expect(t.elapsed).toBe(10_000);
    t.start();
    now = 75_000;
    expect(t.elapsed).toBe(15_000);
    expect(t.drain()).toBe(15_000);
    now = 77_000;
    expect(t.elapsed).toBe(2_000);
    t.reset();
    expect(t.elapsed).toBe(0);
  });
});

const base = { start: '2026-10-12T10:00:00.000Z', discipline: 'boxe' as const, level: 'debutant' as const, exerciseName: 'Jab', mode: 'libre' as const };

describe('statistiques', () => {
  beforeEach(() => useStats.getState().clear());

  test('cumule le temps par séance et par exercice', () => {
    const { record } = useStats.getState();
    record({ ...base, id: 's1#boxe-debutant-02', exerciseId: 'boxe-debutant-02' }, 30, 0);
    record({ ...base, id: 's1#boxe-debutant-02', exerciseId: 'boxe-debutant-02' }, 15, 3);
    record({ ...base, id: 's2#boxe-debutant-02', exerciseId: 'boxe-debutant-02' }, 20, 1);
    const s = useStats.getState();
    expect(s.sessions).toHaveLength(2);
    expect(s.sessions[0].activeSec).toBe(45);
    expect(s.sessions[0].reps).toBe(3);
    expect(s.perExercise['boxe-debutant-02']).toBe(65);
    expect(sessionCount(s.sessions)).toBe(2);
  });

  test('export puis import JSON sans doublons, et refus d’un fichier étranger', () => {
    const { record } = useStats.getState();
    record({ ...base, id: 's1#a', exerciseId: 'a' }, 30, 2);
    const json = exportData(useStats.getState(), { profile: {} });
    useStats.getState().clear();
    expect(useStats.getState().importData(JSON.parse(json)).ok).toBe(true);
    expect(useStats.getState().sessions).toHaveLength(1);
    // second import: nothing duplicated
    useStats.getState().importData(JSON.parse(json));
    expect(useStats.getState().sessions).toHaveLength(1);
    expect(useStats.getState().perExercise.a).toBe(30);
    expect(useStats.getState().importData({ hello: 1 }).ok).toBe(false);
  });

  test('semaines commençant le lundi et durées lisibles', () => {
    expect(weekKey('2026-10-14T12:00:00')).toBe('2026-10-12');
    expect(weekKey('2026-10-18T12:00:00')).toBe('2026-10-12');
    expect(formatDuration(42)).toBe('42 s');
    expect(formatDuration(125)).toBe('2 min 05');
    expect(formatDuration(3720)).toBe('1 h 02');
  });
});
