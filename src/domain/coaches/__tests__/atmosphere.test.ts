import { describe, expect, it } from 'vitest';
import { ALL_COACHES } from '../catalog';
import { ATMOSPHERE_OVERRIDES, CoachAtmosphereResolver, atmosphereSignature, resolveAll, resolveCoachAtmosphere } from '../atmosphere';

/** V4 « Ton coach » (Youssef, 2026-11-18) : ambiance tirée des traits réels de chaque coach, automatique et déterministe */
describe('CoachAtmosphereResolver', () => {
  const all = resolveAll(ALL_COACHES);

  it('donne une ambiance à chacun des coachs du catalogue', () => {
    expect(all.size).toBe(ALL_COACHES.length);
    for (const c of ALL_COACHES) expect(all.get(c.id), c.id).toBeTruthy();
  });

  it('deux coachs n’ont jamais la même ambiance (emblème et couleur principale)', () => {
    const sigs = [...all.values()].map(atmosphereSignature);
    expect(new Set(sigs).size).toBe(sigs.length);
  });

  it('est déterministe : même coach, même ambiance', () => {
    for (const c of ALL_COACHES) expect(resolveCoachAtmosphere(c)).toEqual(resolveCoachAtmosphere({ ...c }));
    expect(resolveAll(ALL_COACHES)).toEqual(all);
  });

  it('tire l’emblème de l’animal du surnom, réellement présent dans les données', () => {
    const expected: Record<string, string> = { 'mma-kadir': 'aigle', nael: 'faucon', victor: 'loup', 'mma-amara': 'lion', inaya: 'panthere', kanya: 'tigre' };
    for (const c of ALL_COACHES) {
      const a = all.get(c.id)!;
      expect(a.identity.animal, c.id).toBe(expected[c.id]);
      expect(a.sources.some((s) => s.field === 'surnom' && s.value === c.nickname)).toBe(true);
    }
  });

  it('ne devine pas de discipline absente des données', () => {
    // Kanya : « Kru de muay-thaï » dans son style ; Kadir et Amara : préfixe « mma- » de leur identifiant ; les autres : rien
    expect(all.get('kanya')!.discipline).toBe('muaythai');
    expect(all.get('mma-kadir')!.discipline).toBe('mma');
    expect(all.get('mma-amara')!.discipline).toBe('mma');
    for (const id of ['nael', 'victor', 'inaya']) {
      expect(all.get(id)!.discipline, id).toBeNull();
      expect(all.get(id)!.atmosphere.floor, id).toBe('aucun');
    }
  });

  it('chaque choix cite la donnée d’où il vient', () => {
    for (const a of all.values()) for (const s of a.sources) if (s.field !== 'defaut') expect(s.value.length, `${a.coachId} ${s.rule}`).toBeGreaterThan(0);
  });

  it('la lumière principale reste presque blanche (pas de couleur saturée sur la peau)', () => {
    for (const a of all.values()) {
      const n = parseInt(a.lighting.key.color.slice(1), 16);
      const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      expect(Math.min(...ch), a.coachId).toBeGreaterThan(190);
    }
  });

  it('un futur coach sans animal ni discipline reçoit une ambiance par défaut, et un futur coach muay-thaï la sienne', () => {
    const plain = resolveCoachAtmosphere({ id: 'test', name: 'Test' });
    expect(plain.atmosphere.motif).toBe('monogramme');
    expect(plain.discipline).toBeNull();
    const judoka = resolveCoachAtmosphere({ id: 'x', name: 'X', nickname: 'Le Roc', style: 'Judoka technique', discipline: 'judo' });
    expect(judoka.discipline).toBe('judo');
    expect(judoka.atmosphere.floor).toBe('tatami');
    expect(judoka.temperament).toBe('precis');
  });

  it('départage deux coachs qui tomberaient sur la même ambiance', () => {
    const twins = resolveAll([
      { id: 'a', name: 'A', nickname: 'Le Tigre' },
      { id: 'b', name: 'B', nickname: 'La Tigresse' },
    ]);
    expect(atmosphereSignature(twins.get('a')!)).not.toBe(atmosphereSignature(twins.get('b')!));
  });

  it('accepte une surcharge manuelle', () => {
    ATMOSPHERE_OVERRIDES.test2 = { palette: { primary: '#123456' }, atmosphere: { smoke: 'none' } };
    try {
      const a = CoachAtmosphereResolver.resolve({ id: 'test2', name: 'T', nickname: 'Le Loup' });
      expect(a.palette.primary).toBe('#123456');
      expect(a.atmosphere.smoke).toBe('none');
      expect(a.atmosphere.motif).toBe('lune');
    } finally {
      delete ATMOSPHERE_OVERRIDES.test2;
    }
  });
});
