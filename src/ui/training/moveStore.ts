import { useSyncExternalStore } from 'react';
import type { PlayerMove } from '../../engine/player';

/**
 * 0.35: the move being played, as reported by the animation player (onMove). A tiny store outside React state so
 * that only the band showing the move re-renders when it changes, never the 3D stage nor the rest of the screen.
 */
/** serial: a new number for every move started, so a repeated technique is still a new move */
export type ShownMove = PlayerMove & { serial: number };

export interface MoveStore {
  get(): ShownMove | null;
  set(m: PlayerMove | null): void;
  subscribe(fn: () => void): () => void;
}

export function createMoveStore(): MoveStore {
  let cur: ShownMove | null = null;
  let serial = 0;
  const subs = new Set<() => void>();
  return {
    get: () => cur,
    set(m) {
      // the player reports only changes: each report with a move is a new move (a repetition included)
      if (!m && !cur) return;
      cur = m ? { ...m, serial: ++serial } : null;
      subs.forEach((f) => f());
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

export const useMove = (s: MoveStore) => useSyncExternalStore(s.subscribe, s.get, s.get);
