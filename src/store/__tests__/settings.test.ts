import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, GROUND_MARK_LABEL, useSettings } from '../settings';

describe('réglages : repères au sol', () => {
  const merge = useSettings.persist.getOptions().merge!;

  it('désactivés par défaut, un libellé pour chacun', () => {
    expect(Object.values(DEFAULT_SETTINGS.groundMarks).every((v) => v === false)).toBe(true);
    expect(Object.keys(GROUND_MARK_LABEL).sort()).toEqual(Object.keys(DEFAULT_SETTINGS.groundMarks).sort());
  });

  it('une sauvegarde ancienne reçoit les repères par défaut, une sauvegarde partielle garde ses choix', () => {
    const old = merge({ settings: { voice: false } }, useSettings.getState()) as ReturnType<typeof useSettings.getState>;
    expect(old.settings.voice).toBe(false);
    expect(old.settings.groundMarks).toEqual(DEFAULT_SETTINGS.groundMarks);
    const partial = merge({ settings: { groundMarks: { pivot: true } } }, useSettings.getState()) as ReturnType<typeof useSettings.getState>;
    expect(partial.settings.groundMarks).toEqual({ ...DEFAULT_SETTINGS.groundMarks, pivot: true });
  });
});

// 0.27 (Youssef, 2026-10-20 21:45): the action pill can be folded; the choice is a setting of the user
describe('réglages : pilule d’actions repliée', () => {
  const merge = useSettings.persist.getOptions().merge!;
  it('dépliée par défaut, y compris pour une sauvegarde d’avant 0.27, dont les autres clés sont gardées', () => {
    expect(DEFAULT_SETTINGS.actionPillCollapsed).toBe(false);
    const old = merge({ settings: { voice: false, kickboxingStyle: 'k1' } }, useSettings.getState()) as ReturnType<typeof useSettings.getState>;
    expect(old.settings.actionPillCollapsed).toBe(false);
    expect(old.settings.voice).toBe(false);
    expect(old.settings.kickboxingStyle).toBe('k1');
    const folded = merge({ settings: { actionPillCollapsed: true } }, useSettings.getState()) as ReturnType<typeof useSettings.getState>;
    expect(folded.settings.actionPillCollapsed).toBe(true);
  });
});

// 0.27 (Youssef, 2026-10-20 21:59): the Coach IA panel has three sizes, the last one is remembered
describe('réglages : taille de la fenêtre du coach IA', () => {
  const merge = useSettings.persist.getOptions().merge!;
  it('normale par défaut et pour une sauvegarde ancienne ; une valeur inconnue revient à normale', () => {
    expect(DEFAULT_SETTINGS.coachPanelSize).toBe('normal');
    const old = merge({ settings: { voice: false } }, useSettings.getState()) as ReturnType<typeof useSettings.getState>;
    expect(old.settings.coachPanelSize).toBe('normal');
    const big = merge({ settings: { coachPanelSize: 'agrandi' } }, useSettings.getState()) as ReturnType<typeof useSettings.getState>;
    expect(big.settings.coachPanelSize).toBe('agrandi');
    const bad = merge({ settings: { coachPanelSize: 'geant' } }, useSettings.getState()) as ReturnType<typeof useSettings.getState>;
    expect(bad.settings.coachPanelSize).toBe('normal');
  });
});

describe('1.3.0 consignes pendant la séance', () => {
  const merge = useSettings.persist.getOptions().merge!;
  type S = ReturnType<typeof useSettings.getState>;
  it('une sauvegarde d’avant 1.3.0 reçoit « Enchaînées, 3,5 s » et garde ses autres choix', () => {
    const old = merge({ settings: { voice: false } }, useSettings.getState()) as S;
    expect(old.settings.voice).toBe(false);
    expect(old.settings.consignes).toBe('enchainees');
    expect(old.settings.consigneSec).toBe(3.5);
  });
  it('un choix enregistré est gardé, une valeur inconnue revient au défaut', () => {
    const kept = merge({ settings: { consignes: 'point', consigneSec: 5 } }, useSettings.getState()) as S;
    expect(kept.settings.consignes).toBe('point');
    expect(kept.settings.consigneSec).toBe(5);
    const bad = merge({ settings: { consignes: 'x' as never, consigneSec: 9 } }, useSettings.getState()) as S;
    expect(bad.settings.consignes).toBe('enchainees');
    expect(bad.settings.consigneSec).toBe(3.5);
  });
});

describe('1.4.0 pulsation pendant la séance', () => {
  const merge = useSettings.persist.getOptions().merge!;
  type S = ReturnType<typeof useSettings.getState>;
  it('une sauvegarde d’avant 1.4.0 reçoit « Contour lumineux, 70 % » et garde ses autres choix', () => {
    const old = merge({ settings: { voice: false, consigneSec: 5 } }, useSettings.getState()) as S;
    expect(old.settings.voice).toBe(false);
    expect(old.settings.consigneSec).toBe(5);
    expect(old.settings.pulse).toBe('contour');
    expect(old.settings.pulseIntensity).toBe(0.7);
  });
  it('un choix enregistré est gardé, une valeur inconnue revient au défaut', () => {
    const kept = merge({ settings: { pulse: 'off', pulseIntensity: 0.4 } }, useSettings.getState()) as S;
    expect(kept.settings.pulse).toBe('off');
    expect(kept.settings.pulseIntensity).toBe(0.4);
    const bad = merge({ settings: { pulse: 'stroboscope' as never, pulseIntensity: 5 } }, useSettings.getState()) as S;
    expect(bad.settings.pulse).toBe('contour');
    expect(bad.settings.pulseIntensity).toBe(0.7);
  });
});
