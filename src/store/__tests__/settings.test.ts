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
