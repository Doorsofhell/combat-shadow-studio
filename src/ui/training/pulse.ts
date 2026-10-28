import { useEffect } from 'react';

/**
 * 1.4.0 (Youssef, 2026-10-28: « Toute l'interface doit pulser ou clignoter discrètement au rythme du bip du round ou
 * de l'annonce vocale des combinaisons »): the signals of the session (gong, countdown, warning, move called) ask for
 * one flash; the screen that shows them listens. Never more than 3 flashes a second (a flash asked sooner than
 * 1/3 s after the previous one is dropped), the limit of the guidelines on photosensitive seizures (WCAG 2.3.1).
 */
export type PulseKind = 'gong' | 'count' | 'warning' | 'move';

/** the shortest gap between two flashes: 3 a second at most */
export const PULSE_MIN_GAP_MS = 334;

type Listener = (kind: PulseKind) => void;
const listeners = new Set<Listener>();
let last = -Infinity;

/** asks for one flash; returns false when it is dropped (too close to the previous one) */
export function pulse(kind: PulseKind, now = performance.now()): boolean {
  if (now - last < PULSE_MIN_GAP_MS) return false;
  last = now;
  listeners.forEach((l) => l(kind));
  return true;
}

export function onPulse(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** for the tests: forget the last flash */
export function resetPulse() {
  last = -Infinity;
}

/**
 * Makes a session screen flash on each pulse: the class `pulse-on` is set again on `root` (its animation restarts)
 * and `data-pulses` counts the flashes shown. The style picks what flashes (see training.css).
 */
export function usePulseFlash(root: { current: HTMLElement | null }, style: string) {
  useEffect(() => {
    if (style === 'off') return;
    let n = 0;
    let timer = 0;
    const off = onPulse(() => {
      const el = root.current;
      if (!el) return;
      el.classList.remove('pulse-on');
      // the animation starts again from its beginning
      void el.offsetWidth;
      el.classList.add('pulse-on');
      el.dataset.pulses = String(++n);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => el.classList.remove('pulse-on'), 400);
    });
    return () => {
      off();
      window.clearTimeout(timer);
      root.current?.classList.remove('pulse-on');
    };
  }, [root, style]);
}
