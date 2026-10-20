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
