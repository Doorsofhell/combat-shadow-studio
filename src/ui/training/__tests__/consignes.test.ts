import { describe, expect, it } from 'vitest';
import { consigneLines, nextConsigne } from '../ConsigneBand';
import { INSTRUCTIONS } from '../../../domain/instructions';
import { DEFAULT_SETTINGS, CONSIGNE_SECS } from '../../../store/settings';

describe('1.3.0 consignes enchaînées', () => {
  it('la séquence : la consigne principale, puis chaque point clé, dans l’ordre de la fiche', () => {
    const lines = consigneLines('jab');
    expect(lines[0]).toEqual({ kind: 'Consigne', text: INSTRUCTIONS.jab.main });
    expect(lines.slice(1).map((l) => l.text)).toEqual(INSTRUCTIONS.jab.points.map((p) => p.text));
    expect(lines[1].kind).toBe('Point clé 1');
    expect(lines.length).toBe(INSTRUCTIONS.jab.points.length + 1);
  });

  it('une technique inconnue ou absente ne donne aucune consigne', () => {
    expect(consigneLines(null)).toEqual([]);
    expect(consigneLines('inconnue')).toEqual([]);
  });

  it('après la dernière ligne, on recommence au début', () => {
    const n = consigneLines('jab').length;
    const cursor = new Map<string, number>();
    let s = { id: 'jab', index: 0 };
    const seen: number[] = [];
    for (let i = 0; i < n + 2; i++) {
      seen.push(s.index);
      s = nextConsigne(s, 'jab', cursor);
    }
    expect(seen).toEqual([...Array.from({ length: n }, (_, i) => i), 0, 1]);
  });

  it('enchaînement : la technique suivante prend la bande à la fin de la ligne et chacune reprend où elle en était', () => {
    const cursor = new Map<string, number>();
    let s = nextConsigne({ id: 'jab', index: 0 }, 'direct', cursor);
    expect(s).toEqual({ id: 'direct', index: 0 });
    s = nextConsigne(s, 'jab', cursor);
    expect(s).toEqual({ id: 'jab', index: 1 });
    s = nextConsigne(s, 'direct', cursor);
    expect(s).toEqual({ id: 'direct', index: 1 });
  });

  it('réglage : enchaînées par défaut, 3,5 s, au choix 2,5 / 3,5 / 5 s', () => {
    expect(DEFAULT_SETTINGS.consignes).toBe('enchainees');
    expect(DEFAULT_SETTINGS.consigneSec).toBe(3.5);
    expect([...CONSIGNE_SECS]).toEqual([2.5, 3.5, 5]);
  });

  it('chaque technique avec des consignes a au moins 3 lignes à enchaîner', () => {
    for (const id of Object.keys(INSTRUCTIONS)) expect(consigneLines(id).length, id).toBeGreaterThanOrEqual(3);
  });
});

describe('1.3.0 haut-parleur à crans', () => {
  it('coupé, faible, moyen, fort selon les réglages de la voix', async () => {
    const { soundLevel, SOUND_STEPS } = await import('../SoundButton');
    expect(soundLevel(false, 1)).toBe(0);
    expect(soundLevel(true, 0)).toBe(0);
    expect(SOUND_STEPS.slice(1).map((v) => soundLevel(true, v))).toEqual([1, 2, 3]);
    expect(soundLevel(true, 0.6)).toBe(2);
  });
});
