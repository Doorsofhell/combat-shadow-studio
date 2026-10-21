import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { onBackButton } from '../../platform/native';
import { useSettings } from '../../store/settings';
import { createDoubleTap, NO_DOUBLE_TAP } from './doubleTap';

/** the controls over the stage fade out after this long without a tap */
export const FS_IDLE_MS = 2500;

type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FsDocument = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> | void };

const fsElement = () => document.fullscreenElement ?? (document as FsDocument).webkitFullscreenElement ?? null;

function requestFs(el: FsElement): Promise<boolean> {
  try {
    const r = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : el.webkitRequestFullscreen?.();
    return Promise.resolve(r).then(
      () => !!fsElement(),
      () => false,
    );
  } catch {
    return Promise.resolve(false);
  }
}

function exitFs() {
  if (!fsElement()) return;
  const d = document as FsDocument;
  try {
    void Promise.resolve(d.exitFullscreen ? d.exitFullscreen() : d.webkitExitFullscreen?.()).catch(() => undefined);
  } catch {
    /* already out */
  }
}

/**
 * 0.27 (Youssef, 2026-10-20 22:09: « Un double clique sur la fenêtre du coach permet un plein écran total, étudie et
 * fait le intelligemment et de manière user friendly »): a quick double tap on a 3D coach view (never on its
 * buttons, never during a drag or a pinch) shows that view alone on the whole screen. The Fullscreen API is used
 * where it exists; elsewhere (iPhone Safari) the view covers the page as a fixed layer (class `stage-fs`), which
 * hides the navigation and the pill. Out: the exit button, Échap, a new double tap, or Android's back button. The
 * controls over the view fade out after 2.5 s and come back with a single tap. A double tap marks the one-time
 * tip as seen.
 */
export function useStageFullscreen(ref: RefObject<HTMLElement | null>, opts: { onChange?: (on: boolean) => void; tapRef?: RefObject<HTMLElement | null> } = {}) {
  const tapRef = opts.tapRef ?? ref;
  const [active, setActive] = useState(false);
  const [idle, setIdle] = useState(false);
  const activeRef = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const onChange = useRef(opts.onChange);
  onChange.current = opts.onChange;

  const wake = useCallback(() => {
    setIdle(false);
    window.clearTimeout(timer.current);
    if (activeRef.current) timer.current = window.setTimeout(() => setIdle(true), FS_IDLE_MS);
  }, []);

  const set = useCallback(
    (on: boolean) => {
      if (activeRef.current === on) return;
      activeRef.current = on;
      setActive(on);
      onChange.current?.(on);
      document.documentElement.classList.toggle('stage-fs-open', on);
      if (on) {
        wake();
        const el = ref.current as FsElement | null;
        // a quick on / off: the request may end after the view was already turned off
        if (el && !fsElement()) void requestFs(el).then(() => !activeRef.current && exitFs());
        if (!useSettings.getState().settings.stageFsHintSeen) useSettings.getState().set({ stageFsHintSeen: true });
      } else {
        window.clearTimeout(timer.current);
        setIdle(false);
        exitFs();
      }
    },
    [ref, wake],
  );
  const enter = useCallback(() => set(true), [set]);
  const exit = useCallback(() => set(false), [set]);
  const toggle = useCallback(() => set(!activeRef.current), [set]);

  // double tap on the view; a single tap brings the controls back
  useEffect(() => {
    const el = tapRef.current;
    if (!el) return;
    const d = createDoubleTap();
    const ignore = (e: PointerEvent) => !!(e.target as Element | null)?.closest?.(NO_DOUBLE_TAP);
    const down = (e: PointerEvent) => {
      if (ignore(e)) return d.cancel();
      d.down(e.pointerId, e.clientX, e.clientY, e.timeStamp);
    };
    const move = (e: PointerEvent) => d.move(e.pointerId, e.clientX, e.clientY);
    const up = (e: PointerEvent) => {
      if (ignore(e)) return d.cancel(e.pointerId);
      const r = d.up(e.pointerId, e.clientX, e.clientY, e.timeStamp);
      if (r === 'double') toggle();
      else if (r === 'tap' && activeRef.current) wake();
    };
    const cancel = (e: PointerEvent) => d.cancel(e.pointerId);
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', cancel);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', cancel);
    };
  }, [tapRef, toggle, wake]);

  // ways out while it is on: Échap, the system leaving fullscreen, Android's back button
  useEffect(() => {
    if (!active) return;
    let wasNative = false;
    const onFs = () => {
      if (fsElement()) wasNative = true;
      else if (wasNative) set(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('.cai-panel')) set(false);
      else wake();
    };
    const el = ref.current;
    const onFocus = () => wake();
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('webkitfullscreenchange', onFs);
    window.addEventListener('keydown', onKey);
    el?.addEventListener('focusin', onFocus);
    const offBack = onBackButton(() => (set(false), true));
    return () => {
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('webkitfullscreenchange', onFs);
      window.removeEventListener('keydown', onKey);
      el?.removeEventListener('focusin', onFocus);
      offBack();
    };
  }, [active, ref, set, wake]);

  // leaving the screen while it is on
  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      if (activeRef.current) {
        document.documentElement.classList.remove('stage-fs-open');
        exitFs();
      }
    },
    [],
  );

  return { active, idle, enter, exit, toggle, wake };
}
