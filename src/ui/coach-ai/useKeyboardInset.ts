import { useEffect, useState } from 'react';

export interface KeyboardInset {
  open: boolean;
  /** height hidden at the bottom by the on-screen keyboard, in CSS px */
  inset: number;
  /** visible viewport height */
  height: number;
}

const CLOSED: KeyboardInset = { open: false, inset: 0, height: 0 };

/**
 * On-screen keyboard seen through the visual viewport (Chrome on Android keeps the layout viewport
 * and only shrinks the visual one). In a WebView that resizes itself the inset stays 0 and nothing
 * moves, which is right as well.
 */
export function useKeyboardInset(): KeyboardInset {
  const [state, setState] = useState<KeyboardInset>(CLOSED);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      const editing = document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement;
      const open = editing && inset > 80;
      setState((s) => (s.open === open && s.inset === inset && s.height === Math.round(vv.height) ? s : open ? { open, inset, height: Math.round(vv.height) } : CLOSED));
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', update);
    };
  }, []);
  return state;
}
