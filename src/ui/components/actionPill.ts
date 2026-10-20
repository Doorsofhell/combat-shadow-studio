import type { GlyphId } from '../icons';

/**
 * 0.26 (Youssef, 2026-10-20 12:34 and 17:45, mockup C « Pilule d'actions »): a floating pill at the bottom
 * left, above the navigation, with the most common actions of the screen on display. Each screen declares
 * its actions (useActionPill); the pill draws them. This file holds the pure rules of the list.
 */
export interface PillAction {
  /** stable id of the action on its screen (also `data-pill-action`) */
  id: string;
  /** the short word shown under the icon */
  label: string;
  icon: GlyphId;
  onSelect: () => void;
  /** the most useful action of the screen: drawn filled red, always first */
  primary?: boolean;
  /** longer spoken name; it must start with the visible label (WCAG « label in name ») */
  ariaLabel?: string;
  /** for an on / off action (a filter, a state): drawn highlighted and announced as pressed */
  pressed?: boolean;
  /** test id when a screen keeps an existing one (default `pill-<id>`) */
  testId?: string;
}

/** at most four buttons (three on most screens): beyond that the pill is no longer a shortcut */
export const PILL_MAX = 4;

/**
 * The buttons the pill shows: absent actions removed (a screen writes `cond && {...}`), duplicates of an
 * id dropped, the primary one first (the first action when none is marked), at most PILL_MAX, and exactly
 * one primary.
 */
export function pillItems(actions: readonly (PillAction | false | null | undefined)[] | null | undefined): PillAction[] {
  if (!actions) return [];
  const seen = new Set<string>();
  const list: PillAction[] = [];
  for (const a of actions) {
    if (!a || seen.has(a.id)) continue;
    seen.add(a.id);
    list.push(a);
  }
  const p = list.findIndex((a) => a.primary);
  const ordered = p > 0 ? [list[p], ...list.slice(0, p), ...list.slice(p + 1)] : list;
  return ordered.slice(0, PILL_MAX).map((a, i) => ({ ...a, primary: i === 0 }));
}
