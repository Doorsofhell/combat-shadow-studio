import { describe, expect, it } from 'vitest';
import { mainRing } from '../Overview';
import { streak } from '../data';

// 0.39 (Youssef, 2026-10-22, « Refonte premium de l'espace Progrès »)
describe('anneau principal : toujours un dénominateur défini', () => {
  const base = { weeklySessions: 0, weeklyMinutes: 0, weekDays: 2, weekMin: 45, studied: 12, total: 40 };
  it('sans objectif : le parcours (techniques étudiées sur le total)', () => {
    const r = mainRing(base);
    expect(r.kind).toBe('parcours');
    expect(r.big).toBe('12 / 40');
    expect(r.value).toBeCloseTo(0.3);
  });
  it('objectif de jours par semaine en priorité, puis de minutes', () => {
    expect(mainRing({ ...base, weeklySessions: 4, weeklyMinutes: 120 })).toMatchObject({ kind: 'objectif', big: '2 / 4', caption: 'jours d’entraînement', value: 0.5 });
    expect(mainRing({ ...base, weeklyMinutes: 120 })).toMatchObject({ kind: 'objectif', big: '45 / 120', caption: 'minutes actives' });
  });
  it('parcours vide : 0, jamais une division par zéro', () => {
    expect(mainRing({ ...base, studied: 0, total: 0 }).value).toBe(0);
  });
});

describe('série en cours : jours consécutifs réellement enregistrés', () => {
  const at = (day: string, h = 18) => ({ start: new Date(`${day}T${String(h).padStart(2, '0')}:00:00`).toISOString() });
  it('compte jusqu’à aujourd’hui, ou jusqu’à hier si la journée n’est pas finie', () => {
    expect(streak([at('2026-10-20'), at('2026-10-21'), at('2026-10-22')], '2026-10-22')).toBe(3);
    expect(streak([at('2026-10-20'), at('2026-10-21')], '2026-10-22')).toBe(2);
  });
  it('une journée sans séance casse la série ; plusieurs séances le même jour comptent une fois', () => {
    expect(streak([at('2026-10-18'), at('2026-10-20'), at('2026-10-21'), at('2026-10-21', 20)], '2026-10-21')).toBe(2);
    expect(streak([at('2026-10-18')], '2026-10-22')).toBe(0);
    expect(streak([], '2026-10-22')).toBe(0);
  });
});
