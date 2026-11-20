import { useEffect, useRef, useState } from 'react';
import { popLayer, pushGuard } from './layers';
import { setLeaveGuard } from './store';

/**
 * Unsaved-changes guard of a screen with a draft (the sequence editor). The HashRouter has no data router, so no
 * useBlocker: every way out goes through `attempt`, which asks while the draft is `dirty`.
 * - in-app links (cards, technique links…) are intercepted by a click listener;
 * - the bottom bar, the Menu and the tabs ask through `leave()` (src/ui/nav/store.ts, v0.32);
 * - 2.3.5 (Youssef, 2026-11-20, P1 « Risque lié au bouton Retour Android »): the Back of the phone (Android button,
 *   back gesture, installed app) and the browser's Back go through a guard of the history layers (pushGuard,
 *   1.42.0, rule « un Retour = un seul pas en arrière »), the same as the session: Back closes an open panel first
 *   (it is a layer above the guard), then asks; a second Back closes the question and keeps the draft; only the
 *   confirmation leaves. Without changes Back leaves at once. Before 2.3.5 the system Back left the editor at once
 *   and the changes were lost;
 * - a reload or a tab close asks the browser (beforeunload).
 *
 * The screen renders its own question while `asking` and calls `confirm` / `dismiss`; it leaves by itself (save,
 * cancel) through `release(then)`, so the guard's history entry is removed before the page changes and Back from
 * the next page never lands on a stale copy of the editor.
 */
export function useLeaveGuard(dirty: boolean, back: () => void) {
  const [ask, setAsk] = useState<null | { go: () => void }>(null);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const askRef = useRef(ask);
  askRef.current = ask;
  const backRef = useRef(back);
  backRef.current = back;
  const guard = useRef<number | null>(null);

  /** removes the guard and its history entry, then runs `then` (the page change waits for it) */
  const release = (then?: () => void) => {
    const id = guard.current;
    guard.current = null;
    if (id !== null) popLayer(id, then);
    else then?.();
  };
  const releaseRef = useRef(release);
  releaseRef.current = release;
  /** a way out: asks while there are unsaved changes, else leaves at once */
  const attempt = (go: () => void) => {
    if (dirtyRef.current) setAsk({ go });
    else releaseRef.current(go);
  };
  const attemptRef = useRef(attempt);
  attemptRef.current = attempt;

  useEffect(() => {
    // pushed once the page is shown: the App's page-change effect (which runs after this one) forgets the layers of
    // the page left, and React runs the effects twice in development
    const t = window.setTimeout(() => {
      guard.current = pushGuard(() => {
        if (askRef.current) setAsk(null);
        else attemptRef.current(() => backRef.current());
      });
    }, 0);
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || a.target === '_blank') return;
      const href = a.getAttribute('href') ?? '';
      if (!href.startsWith('#/') || href === window.location.hash) return;
      e.preventDefault();
      e.stopPropagation();
      attemptRef.current(() => {
        window.location.hash = href.slice(1);
      });
    };
    const onUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    document.addEventListener('click', onClick, true);
    window.addEventListener('beforeunload', onUnload);
    // v0.32: the bottom bar and the Menu are buttons, not links: they ask through the same confirmation
    setLeaveGuard((go) => attemptRef.current(go));
    return () => {
      window.clearTimeout(t);
      setLeaveGuard(null);
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('beforeunload', onUnload);
      releaseRef.current();
    };
  }, []);

  return {
    /** the question « Abandonner les modifications ? » is shown */
    asking: ask !== null,
    /** the screen's own way out (Annuler): asks while dirty */
    attempt,
    /** the user abandons the changes: the guard goes first, then the way out that was asked */
    confirm: () => {
      const go = ask?.go;
      setAsk(null);
      if (go) release(go);
    },
    /** the user keeps the draft */
    dismiss: () => setAsk(null),
    release,
  };
}
