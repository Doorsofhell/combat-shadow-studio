import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { overlayHost, scrimHandlers, useGlassLite, useSwipeDown } from '../components/glass';
import { NavIcon } from './NavIcon';

/* 2.10.2: moved out of NavSheets.tsx so that SearchSheet.tsx and NavSheets.tsx no longer import each other. */

/** the panels open now, the last one on top */
const openPanels: object[] = [];

/**
 * The mockup's bottom sheet (`.scrim` + `.sheet`, 220 ms `sheetin`): scrim that closes it, rounded top, handle and
 * title. A dialog: the focus moves into it, Tab stays inside, Échap and Back close it, and the focus goes back to
 * the button that opened it.
 */
export function NavPanel({
  title,
  onClose,
  children,
  testId,
  wide,
  closable,
  aboveBar,
  variant = 'sheet',
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  testId?: string;
  wide?: boolean;
  /** v0.45: a close cross beside the title (Premium panels) */
  closable?: boolean;
  /** v0.45: the sheet stops above the bottom bar, which stays visible and usable (Premium panels) */
  aboveBar?: boolean;
  /** 1.1.0: 'menu' = the Android menu of the ⋮ at the top right (no handle, no title); 'full' = the whole screen
   *  (search) */
  variant?: 'sheet' | 'menu' | 'full';
}) {
  const ref = useRef<HTMLElement>(null);
  const opener = useRef<Element | null>(typeof document !== 'undefined' ? document.activeElement : null);
  useEffect(() => {
    const el = ref.current;
    el?.focus();
    // 1.1.0: panels can be stacked (the ⋮ menu over a panel of Premium): only the top one answers Escape
    const me = {};
    openPanels.push(me);
    const onKey = (e: KeyboardEvent) => {
      if (openPanels[openPanels.length - 1] !== me) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'Tab' && el) {
        const f = [...el.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')];
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    const back = opener.current;
    return () => {
      openPanels.splice(openPanels.indexOf(me), 1);
      window.removeEventListener('keydown', onKey, true);
      if (back instanceof HTMLElement && back.isConnected) back.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // 2.7: the glass of the « Options du coach » panel; a swipe down from the grip or the title closes a bottom sheet
  const lite = useGlassLite();
  const swipe = useSwipeDown(onClose);
  const grab = variant === 'sheet';
  return createPortal(
    <div className={`nav-overlay glass ${aboveBar ? 'above-bar' : ''} ${variant}${lite ? ' lite' : ''}`}>
      <div className="nav-scrim" {...scrimHandlers(onClose)} data-testid="nav-scrim" />
      <section className={`nav-sheet ${wide ? 'wide' : ''} ${variant}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref} data-testid={testId} data-no-double-tap style={swipe.style}>
        {variant !== 'menu' && (
          <div className="nav-grab" {...(grab ? swipe.handlers : {})} data-testid="nav-sheet-grip">
            {grab && <div className="nav-handle" aria-hidden />}
            {closable || grab ? (
              <div className="nav-sheet-head">
                <h2 className="nav-sheet-title">{title}</h2>
                <button type="button" className="glass-x" onClick={onClose} aria-label="Fermer" data-testid="panel-close">
                  <NavIcon id="close" />
                </button>
              </div>
            ) : (
              <div className="nav-sheet-title">{title}</div>
            )}
          </div>
        )}
        <div className="nav-sheet-body">{children}</div>
      </section>
    </div>,
    // inside the total fullscreen of the coach when it is on, else over the page
    overlayHost(),
  );
}
