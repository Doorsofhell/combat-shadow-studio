import type { Mastery } from '../store/goals';
import type { Technique } from './types';

/**
 * 0.24 (Youssef, 2026-10-20): the user's own rating of the techniques of a set, as counted in the
 * Progrès screen. Only what the user marked is counted: nothing is estimated from the sessions.
 */
export interface MasteryCount {
  total: number;
  acquises: number;
  aRevoir: number;
  /** not rated yet */
  autres: number;
  /** the techniques still hard, in catalogue order */
  aRevoirList: Technique[];
}

export function masteryCount(list: readonly Technique[], mastery: Readonly<Record<string, Mastery>>): MasteryCount {
  const aRevoirList = list.filter((t) => mastery[t.id] === 'a-revoir');
  const acquises = list.filter((t) => mastery[t.id] === 'acquise').length;
  return { total: list.length, acquises, aRevoir: aRevoirList.length, autres: list.length - acquises - aRevoirList.length, aRevoirList };
}
