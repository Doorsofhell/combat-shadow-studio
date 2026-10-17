import { ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { IconClose } from '../icons';

/**
 * Bottom sheet (or centred modal): Escape and backdrop close it, focus moves inside on open and
 * returns to the opener on close. Short slide-in, disabled with prefers-reduced-motion.
 */
export function Sheet({ title, eyebrow, onClose, children, footer, center = false, labelledBy }: { title?: string; eyebrow?: string; onClose: () => void; children: ReactNode; footer?: ReactNode; center?: boolean; labelledBy?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close.current();
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) (last.focus(), e.preventDefault());
        else if (!e.shiftKey && document.activeElement === last) (first.focus(), e.preventDefault());
      }
    };
    document.addEventListener('keydown', key);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', key);
      document.body.style.overflow = prev;
      opener?.focus?.();
    };
  }, []);
  // portal: the sheet covers the bottom navigation whatever the stacking context of the screen
  return createPortal(
    <div className={`ds-backdrop ${center ? 'center' : ''}`} onClick={onClose}>
      <div ref={ref} tabIndex={-1} className="ds-sheet" role="dialog" aria-modal="true" aria-labelledby={labelledBy ?? (title ? id : undefined)} aria-label={title || labelledBy ? undefined : 'Fenêtre'} onClick={(e) => e.stopPropagation()}>
        {!center && <span className="grab" aria-hidden />}
        {(title || eyebrow) && (
          <div className="sheet-head">
            <div className="grow">
              {eyebrow && <div className="eyebrow">{eyebrow}</div>}
              {title && <h2 id={id}>{title}</h2>}
            </div>
            <button type="button" className="btn icon ghost" onClick={onClose} aria-label="Fermer" style={{ marginRight: -10, marginTop: -6 }}>
              <IconClose />
            </button>
          </div>
        )}
        {children}
        {footer && <div className="sticky-cta">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** Confirmation dialog (replaces window.confirm, which is unreliable inside the Android WebView). */
export function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onCancel }: { title: string; message: string; confirmLabel: string; danger?: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Sheet title={title} onClose={onCancel} center>
      <p className="muted">{message}</p>
      <div className="row nowrap">
        <button type="button" className="btn secondary" style={{ flex: 1 }} onClick={onCancel}>
          Annuler
        </button>
        <button type="button" className={`btn ${danger ? 'danger' : 'primary'}`} style={{ flex: 1 }} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Sheet>
  );
}
