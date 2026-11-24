import { beforeEach, describe, expect, it } from 'vitest';
import { useGoals } from '../goals';

// 0.24 (Youssef, 2026-10-20): the user marks a technique as assimilated or still hard
describe('maîtrise d’une technique', () => {
  beforeEach(() => useGoals.getState().clear());

  it('un appui marque, un second appui sur le même état annule', () => {
    useGoals.getState().toggleMastery('jab', 'acquise');
    expect(useGoals.getState().mastery.jab).toBe('acquise');
    useGoals.getState().toggleMastery('jab', 'acquise');
    expect(useGoals.getState().mastery.jab).toBeUndefined();
  });

  it('les deux états ne sont jamais actifs ensemble', () => {
    useGoals.getState().toggleMastery('jab', 'acquise');
    useGoals.getState().toggleMastery('jab', 'a-revoir');
    expect(useGoals.getState().mastery).toEqual({ jab: 'a-revoir' });
  });

  it('tout effacer vide aussi les marques, sans toucher aux autres techniques avant', () => {
    useGoals.getState().toggleMastery('jab', 'acquise');
    useGoals.getState().toggleMastery('direct', 'a-revoir');
    expect(Object.keys(useGoals.getState().mastery)).toEqual(['jab', 'direct']);
    useGoals.getState().clear();
    expect(useGoals.getState().mastery).toEqual({});
  });
});

// 2.4 (panneau « Options du coach », Youssef 2026-11-20): « Mon apprentissage » sets a state directly (no toggle),
// « En apprentissage » = no mark; the marks of other techniques are never touched, no new state is invented
describe('setMastery (panneau du coach)', () => {
  beforeEach(() => useGoals.getState().clear());

  it('pose un état, le remplace, et « En apprentissage » (null) efface la marque', () => {
    useGoals.getState().setMastery('jab', 'acquise');
    expect(useGoals.getState().mastery).toEqual({ jab: 'acquise' });
    useGoals.getState().setMastery('jab', 'acquise');
    expect(useGoals.getState().mastery.jab).toBe('acquise');
    useGoals.getState().setMastery('jab', 'a-revoir');
    expect(useGoals.getState().mastery).toEqual({ jab: 'a-revoir' });
    useGoals.getState().setMastery('jab', null);
    expect(useGoals.getState().mastery).toEqual({});
  });

  it('garde les marques anciennes des autres techniques et ne change rien si l’état est le même', () => {
    useGoals.setState({ mastery: { direct: 'acquise', 'combo:abc': 'a-revoir' } });
    const before = useGoals.getState();
    useGoals.getState().setMastery('direct', 'acquise');
    expect(useGoals.getState()).toBe(before);
    useGoals.getState().setMastery('crochet', 'a-revoir');
    expect(useGoals.getState().mastery).toEqual({ direct: 'acquise', 'combo:abc': 'a-revoir', crochet: 'a-revoir' });
    useGoals.getState().setMastery('inconnue', null);
    expect(useGoals.getState().mastery).toEqual({ direct: 'acquise', 'combo:abc': 'a-revoir', crochet: 'a-revoir' });
  });
});
