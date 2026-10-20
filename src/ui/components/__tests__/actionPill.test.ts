import { describe, expect, it } from 'vitest';
import { PILL_MAX, pillItems, type PillAction } from '../actionPill';

const a = (id: string, extra: Partial<PillAction> = {}): PillAction => ({ id, label: id, icon: 'play', onSelect: () => undefined, ...extra });

describe('pilule d’actions : règles de la liste (0.26, maquette C)', () => {
  it('retire les actions absentes (cond && {...}) et garde l’ordre', () => {
    expect(pillItems([a('x'), false, null, undefined, a('y')]).map((x) => x.id)).toEqual(['x', 'y']);
    expect(pillItems(null)).toEqual([]);
    expect(pillItems([false, null])).toEqual([]);
  });

  it('l’action principale passe en premier ; sans marque, c’est la première ; une seule est principale', () => {
    const l = pillItems([a('x'), a('y', { primary: true }), a('z')]);
    expect(l.map((x) => x.id)).toEqual(['y', 'x', 'z']);
    expect(l.map((x) => x.primary)).toEqual([true, false, false]);
    expect(pillItems([a('x'), a('y')]).map((x) => x.primary)).toEqual([true, false]);
    expect(pillItems([a('x', { primary: true }), a('y', { primary: true })]).map((x) => x.primary)).toEqual([true, false]);
    // the primary one absent: the next action becomes the red one
    expect(pillItems([false, a('y'), a('z')]).map((x) => [x.id, x.primary])).toEqual([
      ['y', true],
      ['z', false],
    ]);
  });

  it('quatre boutons au plus, sans doublon d’identifiant', () => {
    expect(PILL_MAX).toBe(4);
    expect(pillItems(['a', 'b', 'c', 'd', 'e'].map((x) => a(x))).map((x) => x.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(pillItems([a('x'), a('x', { label: 'autre' }), a('y')]).map((x) => x.label)).toEqual(['x', 'y']);
  });

  it('les rappels ne font pas partie de ce que la pilule dessine (clé JSON stable)', () => {
    const one = JSON.stringify(pillItems([a('x', { onSelect: () => 1 })]));
    const two = JSON.stringify(pillItems([a('x', { onSelect: () => 2 })]));
    expect(one).toBe(two);
  });
});
