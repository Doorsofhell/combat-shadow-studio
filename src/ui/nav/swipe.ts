import { RefObject, useEffect, useRef } from 'react';
import type { SectionTab } from './config';

/**
 * 1.0.0 (refonte, lot 4; Youssef 2026-10-27: « gestes, glissements latéraux »): a quick horizontal swipe of the
 * finger on a page with tabs opens the next tab (finger to the left) or the previous one (to the right). Pure logic.
 */
export const SWIPE_MIN = 70;
export const SWIPE_MAX_MS = 600;

/** -1 previous tab, 1 next tab, 0 not a swipe (too short, too slow, or more vertical than horizontal) */
export function swipeDirection(dx: number, dy: number, ms: number): -1 | 0 | 1 {
  if (ms > SWIPE_MAX_MS || Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy) * 1.5) return 0;
  return dx < 0 ? 1 : -1;
}

/** the tab a swipe leads to, or null at the ends (no wrap: the user knows where the row stops) */
export function swipeTab(tabs: readonly SectionTab[], currentId: string, dir: -1 | 0 | 1): SectionTab | null {
  if (!dir) return null;
  const i = tabs.findIndex((t) => t.id === currentId);
  if (i < 0) return null;
  return tabs[i + dir] ?? null;
}

/** a swipe never starts on something that already moves sideways or takes the finger (rows that scroll, sliders,
 * fields, the 3D stage, sheets) */
export function swipeBlocked(target: Element | null): boolean {
  for (let el: Element | null = target; el && el !== document.body; el = el.parentElement) {
    if (el.matches('input, textarea, select, canvas, [role="slider"], [role="dialog"], [data-no-swipe], .nav-bottom')) return true;
    if (el instanceof HTMLElement && el.scrollWidth > el.clientWidth + 1) {
      const ox = getComputedStyle(el).overflowX;
      if (ox === 'auto' || ox === 'scroll') return true;
    }
  }
  return false;
}

/**
 * 2.13.0 (Youssef 2026-11-27, Compte « en onglets, je bascule par swipe comme sur Progrès »): the same quick sideways
 * swipe, inside one screen, on one element (its tabs are not the tabs of a space). `onSwipe(1)` = next, -1 = previous.
 * Never while a dialog is open, never from a field, a slider or a row that scrolls sideways (swipeBlocked). The element
 * must stay mounted (put the ref on a wrapper that does not change with the tab).
 */
export function useSwipeSteps(ref: RefObject<HTMLElement | null>, onSwipe: (dir: -1 | 1) => void): void {
  const cb = useRef(onSwipe);
  cb.current = onSwipe;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let start: { x: number; y: number; t: number } | null = null;
    const down = (e: TouchEvent) => {
      const f = e.touches[0];
      start = e.touches.length === 1 && !swipeBlocked(e.target as Element) ? { x: f.clientX, y: f.clientY, t: e.timeStamp } : null;
    };
    const up = (e: TouchEvent) => {
      const s = start;
      start = null;
      const f = e.changedTouches[0];
      if (!s || !f || e.touches.length > 0 || document.querySelector('[role="dialog"]')) return;
      const dir = swipeDirection(f.clientX - s.x, f.clientY - s.y, e.timeStamp - s.t);
      if (dir) cb.current(dir);
    };
    const cancel = () => (start = null);
    el.addEventListener('touchstart', down, { passive: true });
    el.addEventListener('touchend', up, { passive: true });
    el.addEventListener('touchcancel', cancel, { passive: true });
    return () => {
      el.removeEventListener('touchstart', down);
      el.removeEventListener('touchend', up);
      el.removeEventListener('touchcancel', cancel);
    };
  }, [ref]);
}
