/**
 * 0.27 (Youssef, 2026-10-20 22:09: « Un double clique sur la fenêtre du coach permet un plein écran total »): a
 * double tap is two quick taps at the same place. It must never be confused with the gestures of the 3D view: a
 * drag that turns the camera, a pinch that zooms, or a long press. Pure logic, fed with pointer events.
 */
export interface DoubleTapOptions {
  /** largest move of the finger during a tap, and between the two taps (px) */
  maxMove?: number;
  /** longest gap between the end of the first tap and the start of the second (ms) */
  maxGap?: number;
  /** longest press that still counts as a tap (ms) */
  maxPress?: number;
}

export type TapResult = 'none' | 'tap' | 'double';

interface Press {
  id: number;
  x: number;
  y: number;
  t: number;
}

export function createDoubleTap({ maxMove = 10, maxGap = 300, maxPress = 280 }: DoubleTapOptions = {}) {
  const down = new Map<number, Press>();
  /** a second finger came down during this gesture: it is a pinch, never a tap */
  let multi = false;
  let lastTap: { x: number; y: number; t: number } | null = null;

  return {
    down(id: number, x: number, y: number, t: number) {
      down.set(id, { id, x, y, t });
      if (down.size > 1) {
        multi = true;
        lastTap = null;
      }
    },
    /** a move beyond the slop turns the press into a drag */
    move(id: number, x: number, y: number) {
      const p = down.get(id);
      if (p && Math.hypot(x - p.x, y - p.y) > maxMove) p.t = Number.NEGATIVE_INFINITY;
    },
    /** 'double' on the second tap of a pair, 'tap' on a single tap, 'none' for anything else */
    up(id: number, x: number, y: number, t: number): TapResult {
      const p = down.get(id);
      down.delete(id);
      if (!p) return 'none';
      const wasMulti = multi;
      if (down.size === 0) multi = false;
      if (wasMulti || t - p.t > maxPress || Math.hypot(x - p.x, y - p.y) > maxMove) {
        lastTap = null;
        return 'none';
      }
      if (lastTap && p.t - lastTap.t <= maxGap && Math.hypot(x - lastTap.x, y - lastTap.y) <= maxMove * 3) {
        lastTap = null;
        return 'double';
      }
      lastTap = { x, y, t };
      return 'tap';
    },
    cancel(id?: number) {
      if (id === undefined) down.clear();
      else down.delete(id);
      lastTap = null;
      if (down.size === 0) multi = false;
    },
  };
}

export type DoubleTap = ReturnType<typeof createDoubleTap>;

/** controls keep their single meaning: a tap on them never counts toward a double tap */
export const TAP_CONTROLS = 'button, a, input, textarea, select, label, [role="button"], [data-no-double-tap]';
/** on a 3D view: its controls, and the Coach IA panel shown over it */
export const NO_DOUBLE_TAP = `${TAP_CONTROLS}, [role="dialog"], .cai-panel`;
