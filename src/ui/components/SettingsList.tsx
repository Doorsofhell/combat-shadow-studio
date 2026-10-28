import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { popLayer, pushLayer } from '../nav/layers';
import { AppIcon, type GlyphId } from '../icons';

/**
 * 1.2.0 (Youssef, 2026-10-28: « une page avec toutes les options en liste bien présentées qui se déploient quand on
 * clique dessus », proposition B « Groupes Android »): Mes infos and Réglages are one list each, rows grouped under a
 * small title in rounded blocks, like the settings of a Pixel. A row shows its name and its current value; a tap
 * opens it in place. One row is open at a time, and the open row is a history layer: Android's back closes it first.
 */
interface ListState {
  open: string | null;
  toggle: (id: string) => void;
  /** closes the open row (and its history entry), then goes to `to` */
  go: (to: string) => void;
}
const Ctx = createContext<ListState | null>(null);

export function SettingsList({ initial, children, testId }: { initial?: string | null; children: ReactNode; testId?: string }) {
  const [open, setOpen] = useState<string | null>(initial ?? null);
  const layer = useRef<number | null>(null);
  const nav = useNavigate();
  // a row opened from the address (/reglages/voix) is the page itself: Back leaves it, no layer of its own
  useEffect(() => setOpen(initial ?? null), [initial]);
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => document.querySelector(`[data-set-item="${open}"]`)?.scrollIntoView({ block: 'nearest' }));
    return () => cancelAnimationFrame(id);
  }, [open]);
  const toggle = (id: string) => {
    if (open === id) {
      setOpen(null);
      if (layer.current !== null) popLayer(layer.current);
      layer.current = null;
      return;
    }
    if (layer.current === null)
      layer.current = pushLayer(() => {
        layer.current = null;
        setOpen(null);
      });
    setOpen(id);
  };
  const go = (to: string) => {
    if (layer.current === null) return nav(to);
    const id = layer.current;
    layer.current = null;
    popLayer(id, () => nav(to));
  };
  return (
    <Ctx.Provider value={{ open, toggle, go }}>
      <div className="set-list" data-testid={testId}>
        {children}
      </div>
    </Ctx.Provider>
  );
}

export function SetGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="set-group" aria-label={title}>
      <h2 className="set-group-t">{title}</h2>
      <div className="set-card">{children}</div>
    </section>
  );
}

/** a row of the list; `children` is what it shows once opened (rendered only while open) */
export function SetItem({ id, icon, title, summary, dot, tone, children }: { id: string; icon: GlyphId; title: string; summary?: ReactNode; dot?: boolean; tone?: 'premium'; children: ReactNode }) {
  const s = useContext(Ctx)!;
  const on = s.open === id;
  return (
    <div className={`set-item ${tone ?? ''}`} data-set-item={id} data-open={on}>
      <button type="button" className="set-row" aria-expanded={on} aria-controls={`set-b-${id}`} onClick={() => s.toggle(id)} data-testid={`set-${id}`}>
        <span className="set-ic">
          <AppIcon id={icon} size={22} />
        </span>
        <span className="set-tx">
          <b>
            {title}
            {dot && <i className="me-dot" aria-label="nouveau" />}
          </b>
          {summary && <span>{summary}</span>}
        </span>
        <AppIcon id="chevronDown" size={22} className="set-chev" />
      </button>
      {on && (
        <div className="set-body" id={`set-b-${id}`} role="region" aria-label={title}>
          {children}
        </div>
      )}
    </div>
  );
}

/** a row that opens another page or a sheet instead of opening in place (Premium, Nouveautés) */
export function SetAction({ icon, title, summary, dot, tone, onClick, to, testId, ariaLabel }: { icon: GlyphId; title: string; summary?: ReactNode; dot?: boolean; tone?: 'premium'; onClick?: () => void; to?: string; testId?: string; ariaLabel?: string }) {
  const s = useContext(Ctx)!;
  return (
    <div className={`set-item ${tone ?? ''}`}>
      <button type="button" className="set-row" onClick={() => (to ? s.go(to) : onClick?.())} data-testid={testId} aria-label={ariaLabel}>
        <span className="set-ic">
          <AppIcon id={icon} size={22} />
        </span>
        <span className="set-tx">
          <b>
            {title}
            {dot && <i className="me-dot" aria-hidden />}
          </b>
          {summary && <span>{summary}</span>}
        </span>
        <AppIcon id="chevron" size={22} className="set-chev side" />
      </button>
    </div>
  );
}

/** a link inside an open row: the row's history entry is removed before leaving */
export function SetLink({ to, label, hint, testId }: { to: string; label: string; hint?: string; testId?: string }) {
  const s = useContext(Ctx)!;
  // a real link (role link, address on long press), the row's history entry removed before leaving
  return (
    <a
      href={`#${to}`}
      className="set-link"
      onClick={(e) => {
        e.preventDefault();
        s.go(to);
      }}
      data-testid={testId}
    >
      <span className="grow">
        {label}
        {hint && <span className="hint">{hint}</span>}
      </span>
      <AppIcon id="chevron" size={20} className="muted" />
    </a>
  );
}
