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

describe('rendu 3D : troisième moteur expérimental', () => {
  const merge = useSettings.persist.getOptions().merge!;

  it('ne change pas la version activée par défaut ni une sélection précédente', () => {
    expect(DEFAULT_SETTINGS.coachRender).toBe('premium');
    for (const render of ['premium', 'precedent', 'biomeca'] as const) {
      const saved = merge({ settings: { coachRender: render } }, useSettings.getState()) as ReturnType<typeof useSettings.getState>;
      expect(saved.settings.coachRender).toBe(render);
    }
  });

  it('reste compatible avec les sauvegardes anciennes ou inconnues', () => {
    const old = merge({ settings: { quality: 'basse' } }, useSettings.getState()) as ReturnType<typeof useSettings.getState>;
    expect(old.settings.coachRender).toBe('premium');
    expect(old.settings.quality).toBe('basse');
    const invalid = merge({ settings: { coachRender: 'absent' } }, useSettings.getState()) as ReturnType<typeof useSettings.getState>;
    expect(invalid.settings.coachRender).toBe('premium');
  });
});
