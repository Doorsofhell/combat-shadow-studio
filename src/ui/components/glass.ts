import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type * as React from 'react';
import { stabilityLevel } from '../../three/safe3d';
import { useSettings } from '../../store/settings';
import { popLayer, pushLayer } from '../nav/layers';

/**
 * 2.7 (Youssef, 2026-11-24: « je veux ce type de panneau partout dans l'application quand on ouvre des options »): the
 * glass of the « Options du coach » panel (2.6.0) shared by every options sheet of the app: the same glass, grip and
 * closing rules (tap outside without anything behind reacting, swipe down from the grip, the close button, Échap,
 * Back).
 */

/** the glass needs a blur the device can afford: else a plain, nearly opaque panel */
export function canBlur(quality: string): boolean {
  if (quality === 'basse' || stabilityLevel() > 0) return false;
  if (typeof CSS === 'undefined' || !CSS.supports) return false;
  return CSS.supports('backdrop-filter', 'blur(2px)') || CSS.supports('-webkit-backdrop-filter', 'blur(2px)');
}

/** true when the sheet must be drawn without blur (low quality, 3D in safe mode, no backdrop-filter) */
export function useGlassLite(): boolean {
  const quality = useSettings((s) => s.settings.quality);
  const [lite] = useState(() => !canBlur(quality));
  return lite;
}

/** where an overlay goes: inside the browser's fullscreen element when there is one (only it is drawn), else the page */
export function overlayHost(): Element {
  const d = document as Document & { webkitFullscreenElement?: Element | null };
  return d.fullscreenElement ?? d.webkitFullscreenElement ?? document.body;
}

/**
 * Swipe down from the grip (or the head): the panel follows the finger, then closes (more than 70 px, or a quick flick)
 * or comes back. A touch that starts on a button is left to the button.
 */
export function useSwipeDown(onClose: () => void) {
  const [drag, setDrag] = useState(0);
  const start = useRef<{ id: number; y: number; t: number } | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as Element).closest('button, a, input, select, textarea')) return;
    start.current = { id: e.pointerId, y: e.clientY, t: e.timeStamp };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    setDrag(Math.max(0, e.clientY - s.y));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const s = start.current;
    start.current = null;
    if (!s || s.id !== e.pointerId) return;
    const dy = Math.max(0, e.clientY - s.y);
    const v = dy / Math.max(1, e.timeStamp - s.t);
    setDrag(0);
    if (dy > 70 || (dy > 24 && v > 0.6)) closeRef.current();
  };
  return {
    drag,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
    style: drag
      ? ({
          transform: `translateY(${drag}px)`,
          transition: 'none',
        } as React.CSSProperties)
      : undefined,
  };
}

/**
 * Back (Android button, back gesture, browser) closes the sheet first: while it is shown it is a history layer. The
 * entry is pushed a moment after the mount (React mounts twice in development; the first one is gone by then) and
 * removed when the sheet goes. `dismiss(then)` closes the sheet and runs `then` once its history entry is gone: a
 * sheet's action that changes the page goes through it, so Back from the new page never comes back to the sheet's
 * own entry.
 */
export function useBackLayer(active: boolean, onClose: () => void) {
  const id = useRef(0);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!active) return;
    let href = '';
    const push = () => {
      href = window.location.href;
      id.current = pushLayer(() => {
        id.current = 0;
        closeRef.current();
      });
    };
    const t = window.setTimeout(push, 0);
    // the sheet is still shown when Back comes back to its page (its action changed the page, and Back was pressed
    // before the new page replaced this one): it takes a history entry again, so the next Back closes it first
    let again = 0;
    const onPop = () => {
      window.clearTimeout(again);
      again = window.setTimeout(() => {
        const st = window.history.state as { cssLayer?: number } | null;
        if (!id.current && href && window.location.href === href && !st?.cssLayer) push();
      }, 120);
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(again);
      window.removeEventListener('popstate', onPop);
      const mine = id.current;
      id.current = 0;
      // popLayer only steps back when the sheet's entry is still the current one (no page change since)
      if (mine) popLayer(mine);
    };
  }, [active]);
  /** `close` false: only the history entry goes, `then` closes the sheet itself (a confirmation's choice) */
  return useCallback((then?: () => void, close = true) => {
    const mine = id.current;
    id.current = 0;
    if (close) closeRef.current();
    if (mine) popLayer(mine, then);
    else then?.();
  }, []);
}

/** the scrim of a sheet: a touch outside closes it and nothing else (nothing behind receives the touch or the click) */
export function scrimHandlers(onClose: () => void) {
  const swallow = (e: React.SyntheticEvent) => {
    if (e.target !== e.currentTarget) return;
    e.preventDefault();
    e.stopPropagation();
  };
  return {
    onPointerDown: swallow,
    onMouseDown: swallow,
    onContextMenu: swallow,
    onClick: (e: React.MouseEvent) => {
      if (e.target !== e.currentTarget) return;
      e.preventDefault();
      e.stopPropagation();
      onClose();
    },
  };
}

/**
 * inside a Sheet: runs `then` once the sheet's history entry is gone (`then` closes the sheet or changes the page); with
 * `close` the sheet is closed first
 */
export const SheetDismiss = createContext<(then?: () => void, close?: boolean) => void>((then) => then?.());
export const useSheetDismiss = () => useContext(SheetDismiss);
