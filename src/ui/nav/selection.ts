import { useSyncExternalStore } from 'react';

/**
 * v0.32 (section 5.4 / 5.7: « La quatrième action doit correspondre à une véritable sélection »): the technique or the
 * legend selected in a list is the last one opened from it during this visit. The bar's « Technique » / « Légende »
 * button reopens it; with nothing selected it is disabled (never a technique picked at random). Kept for the session
 * only (sessionStorage), wrapped so a blocked storage only loses the selection.
 */
export type SelectionList = 'technique' | 'legende';

const listeners = new Set<() => void>();
const memory: Partial<Record<SelectionList, string>> = {};
const key = (l: SelectionList) => `css-selection-${l}`;

export function getSelection(list: SelectionList): string | null {
  if (memory[list]) return memory[list]!;
  try {
    return sessionStorage.getItem(key(list));
  } catch {
    return null;
  }
}

export function setSelection(list: SelectionList, id: string) {
  if (memory[list] === id) return;
  memory[list] = id;
  try {
    sessionStorage.setItem(key(list), id);
  } catch {
    // storage blocked: kept in memory for this page
  }
  listeners.forEach((f) => f());
}

export function useSelection(list: SelectionList): string | null {
  return useSyncExternalStore(
    (f) => {
      listeners.add(f);
      return () => listeners.delete(f);
    },
    () => getSelection(list),
    () => null,
  );
}

/** case and accents ignored: « crochet » finds « Crochet », « genou » finds « Genou » */
export const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
