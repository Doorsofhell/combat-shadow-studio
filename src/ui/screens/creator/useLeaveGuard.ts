import { useEffect, useRef } from 'react';
import { setLeaveGuard } from '../../nav/store';

/**
 * Unsaved-changes guard for the HashRouter (no data router, so no useBlocker): intercepts clicks
 * on in-app links (bottom navigation, cards…) while `dirty`, and asks the browser to confirm a
 * reload or a tab close. The system back gesture is not intercepted.
 */
export function useLeaveGuard(dirty: boolean, onAttempt: (go: () => void) => void) {
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const attemptRef = useRef(onAttempt);
  attemptRef.current = onAttempt;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!dirtyRef.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
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
    setLeaveGuard((go) => (dirtyRef.current ? attemptRef.current(go) : go()));
    return () => {
      setLeaveGuard(null);
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, []);
}
