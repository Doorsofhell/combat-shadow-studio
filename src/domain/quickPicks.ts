import { hash, dayKey } from './catalog/search';
import type { Exercise, LevelId, Technique } from './types';
import { LEVELS } from './types';

/**
 * Picks behind the shortcuts of the action pill (0.26). They only choose among what the app already has:
 * a technique of the catalogue, an exercise of the programme. Nothing is generated.
 */

/**
 * « Technique du jour »: one technique of the list for a given day, the same all day long and whatever the
 * order of the list. Techniques that need a real partner are never proposed (no solo drill for them).
 */
export function techniqueOfTheDay(list: readonly Technique[], date: Date = new Date()): Technique | undefined {
  const pool = list.filter((t) => t.mode !== 'partenaire').sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  if (!pool.length) return undefined;
  return pool[hash(`css-technique-du-jour:${dayKey(date)}`) % pool.length];
}

/**
 * « S'entraîner » from a technique sheet: the exercise of the programme that works this technique the most
 * directly. Fewest different moves first (the technique alone, with its way down and up for the ground
 * work), then the closest level to the user's, then a « technique » exercise, then the id. Undefined when no
 * exercise of the list contains the technique: the sheet then has no « S'entraîner » shortcut.
 */
export function exerciseForTechnique(list: readonly Exercise[], techniqueId: string, level: LevelId): Exercise | undefined {
  const li = (l: LevelId) => LEVELS.findIndex((x) => x.id === l);
  const user = li(level);
  const score = (e: Exercise) => [new Set(e.sequence).size, Math.abs(li(e.level) - user), e.kind === 'technique' ? 0 : 1] as const;
  const cands = list.filter((e) => e.sequence.includes(techniqueId));
  cands.sort((a, b) => {
    const x = score(a);
    const y = score(b);
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i];
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  return cands[0];
}
