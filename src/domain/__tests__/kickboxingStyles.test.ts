import { describe, expect, it } from 'vitest';
import { KB_STYLES, filterExercises, filterTechniques, inKbStyle, kbOnlyIn, kbRuling } from '../kickboxingStyles';
import { SOURCE_BY_ID } from '../biomech/sources';
import { TECHNIQUES, TECHNIQUE_BY_ID, techniquesFor } from '../techniques';
import { EXERCISES, exercisesFor } from '../exercises';
import { LEVELS } from '../types';

const kb = techniquesFor('kickboxing');
const ids = (style: Parameters<typeof inKbStyle>[1]) => kb.filter((t) => inKbStyle(t.id, style)).map((t) => t.id);

describe('styles de kick-boxing : règles sourcées', () => {
  it('chaque règle cite des sources du registre et des techniques du kick-boxing', () => {
    for (const s of KB_STYLES) for (const src of s.sources) expect(SOURCE_BY_ID.get(src), src).toBeDefined();
    for (const t of TECHNIQUES)
      for (const s of KB_STYLES) {
        const r = kbRuling(t.id, s.id);
        for (const src of r.sources) expect(SOURCE_BY_ID.get(src), `${t.id} ${src}`).toBeDefined();
        if (r.status !== 'autorise' || r.note) expect(t.disciplines, t.id).toContain('kickboxing');
      }
  });

  it('full contact : ni low kick, ni genou, ni check ; coups de pied hauts et poings gardés', () => {
    const fc = ids('full-contact');
    for (const x of ['low-kick-arriere', 'low-kick-avant', 'genou-direct-arriere', 'genou-circulaire-avant', 'check-avant']) expect(fc).not.toContain(x);
    for (const x of ['jab', 'direct', 'crochet-avant', 'middle-kick-arriere', 'high-kick-arriere', 'front-kick-avant']) expect(fc).toContain(x);
  });

  it('low kick : low kicks et check, pas de genou', () => {
    const lk = ids('low-kick');
    for (const x of ['low-kick-arriere', 'low-kick-avant', 'check-avant']) expect(lk).toContain(x);
    for (const x of ['genou-direct-arriere', 'genou-direct-avant', 'genou-circulaire-arriere', 'genou-circulaire-avant']) expect(lk).not.toContain(x);
  });

  it('K1 : genoux en plus des low kicks', () => {
    const k1 = ids('k1');
    for (const x of ['genou-direct-arriere', 'genou-circulaire-arriere', 'low-kick-arriere', 'check-avant']) expect(k1).toContain(x);
    expect(kbOnlyIn('genou-direct-arriere')).toEqual(['k1']);
    expect(kbOnlyIn('jab')).toBeNull();
  });

  it('aucun style de kick-boxing ne propose de coude ni de clinch', () => {
    expect(kb.filter((t) => t.category === 'coude' || t.category === 'clinch').map((t) => t.id)).toEqual([]);
  });

  it('« Tous les styles » montre tout, et le filtre ne touche pas les autres disciplines', () => {
    expect(ids('tous')).toEqual(kb.map((t) => t.id));
    expect(filterTechniques(techniquesFor('muaythai'), 'muaythai', 'full-contact')).toEqual(techniquesFor('muaythai'));
    expect(filterExercises(EXERCISES.filter((e) => e.discipline === 'muaythai'), 'full-contact')).toHaveLength(EXERCISES.filter((e) => e.discipline === 'muaythai').length);
  });

  it('chaque style garde au moins 5 exercices à chaque niveau, et un exercice n’y figure que si tous ses mouvements sont permis', () => {
    for (const s of KB_STYLES)
      for (const l of LEVELS) {
        const list = filterExercises(exercisesFor('kickboxing', l.id), s.id);
        expect(list.length, `${s.id} ${l.id}`).toBeGreaterThanOrEqual(5);
        for (const e of list) for (const id of e.sequence) expect(kbRuling(id, s.id).status, `${e.id} ${id}`).toBe('autorise');
      }
    expect(TECHNIQUE_BY_ID.get('genou-direct-arriere')!.disciplines).toContain('kickboxing');
  });
});
