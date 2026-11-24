import type * as React from 'react';
import { ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AppIcon } from '../icons';
import { SheetDismiss, overlayHost, scrimHandlers, useBackLayer, useGlassLite, useSheetDismiss, useSwipeDown } from './glass';

/**
 * Bottom sheet (or centred modal), 2.7: drawn in the glass of the « Options du coach » panel and closed by the same
 * rules: a tap outside (nothing behind reacts), a swipe down from the grip or the title, the close button, Échap and
 * Back (Android button, back gesture, browser), which closes the sheet and stays on the page. The focus moves inside on
 * open and returns to the opener on close. Short rise, disabled with prefers-reduced-motion.
 * An action of the sheet that changes the page closes it first with useSheetDismiss() (a link inside does it by itself).
 */
export function Sheet({
  title,
  eyebrow,
  onClose,
  children,
  footer,
  center = false,
  labelledBy,
  testId,
}: {
  title?: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  center?: boolean;
  labelledBy?: string;
  testId?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const close = useRef(onClose);
  close.current = onClose;
  const dismiss = useBackLayer(true, () => close.current());
  const lite = useGlassLite();
  const swipe = useSwipeDown(() => dismiss());
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    ref.current?.focus({ preventScroll: true });
    const key = (e: KeyboardEvent) => {
      // the sheet on top answers alone (a confirmation over a sheet)
      if (ref.current && ref.current.closest('.ds-backdrop') !== [...document.querySelectorAll('.ds-backdrop')].pop()) return;
      if (e.key === 'Escape') dismiss();
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
      opener?.focus?.({ preventScroll: true });
    };
  }, [dismiss]);
  // a link of the sheet: the sheet and its history entry go first, then the link is followed
  const onLink = (e: React.MouseEvent) => {
    const a = (e.target as Element).closest('a[href]') as HTMLAnchorElement | null;
    if (!a || a.target === '_blank' || a.hasAttribute('download') || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const href = a.getAttribute('href') ?? '';
    if (!href.startsWith('#/') && !href.startsWith('/')) return;
    e.preventDefault();
    e.stopPropagation();
    dismiss(() => {
      window.location.hash = href.startsWith('#') ? href.slice(1) : href;
    });
  };
  const draggable = !center;
  // portal: the sheet covers the bottom navigation whatever the stacking context of the screen (and shows in fullscreen)
  return createPortal(
    <div className={`ds-backdrop glass ${center ? 'center' : ''}${lite ? ' lite' : ''}`} {...scrimHandlers(() => dismiss())} data-testid="sheet-scrim">
      <div
        ref={ref}
        tabIndex={-1}
        className="ds-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy ?? (title ? id : undefined)}
        aria-label={title || labelledBy ? undefined : 'Fenêtre'}
        onClickCapture={onLink}
        data-testid={testId}
        data-no-double-tap
        style={swipe.style}
      >
        {(draggable || title || eyebrow) && (
          <div className="ds-top" {...(draggable ? swipe.handlers : {})} data-testid="sheet-grip">
            {draggable && <span className="grab" aria-hidden />}
            {(title || eyebrow) && (
              <div className="sheet-head">
                <div className="grow">
                  {eyebrow && <div className="eyebrow">{eyebrow}</div>}
                  {title && <h2 id={id}>{title}</h2>}
                </div>
                <button type="button" className="glass-x" onClick={() => dismiss()} aria-label="Fermer" data-testid="sheet-close">
                  <AppIcon id="close" size={18} />
                </button>
              </div>
            )}
          </div>
        )}
        <div className="ds-body">
          <SheetDismiss.Provider value={dismiss}>
            {children}
            {footer && <div className="sticky-cta">{footer}</div>}
          </SheetDismiss.Provider>
        </div>
      </div>
    </div>,
    overlayHost(),
  );
}

/** 2.7: a button of a sheet whose action closes it or changes the page: the sheet's history entry goes first, then the action runs */
export function SheetLeaveButton({
  onLeave,
  ...rest
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & {
  onLeave: () => void;
  'data-testid'?: string;
}) {
  const dismiss = useSheetDismiss();
  return <button type="button" {...rest} onClick={() => dismiss(onLeave, false)} />;
}

/** Confirmation dialog (replaces window.confirm, which is unreliable inside the Android WebView). */
/** `keep` (1.42.0, « Quitter la séance ? »): staying is the highlighted choice, on the right under the thumb; leaving is the quiet one */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Annuler',
  danger,
  keep,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  keep?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // 2.7: the dialog's history entry goes first, then the choice runs (a choice may leave the page)
  const cancel = (
    <SheetLeaveButton key="cancel" className={`btn ${keep ? 'primary' : 'secondary'}`} style={{ flex: 1 }} onLeave={onCancel} data-testid="confirm-cancel">
      {cancelLabel}
    </SheetLeaveButton>
  );
  const confirm = (
    <SheetLeaveButton key="confirm" className={`btn ${keep ? 'secondary' : danger ? 'danger' : 'primary'}`} style={{ flex: 1 }} onLeave={onConfirm} data-testid="confirm-ok">
      {confirmLabel}
    </SheetLeaveButton>
  );
  return (
    <Sheet title={title} onClose={onCancel} center>
      <p className="muted">{message}</p>
      <div className="row nowrap">{keep ? [confirm, cancel] : [cancel, confirm]}</div>
    </Sheet>
  );
}
