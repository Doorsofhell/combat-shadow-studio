import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AppIcon, type GlyphId } from '../icons';

/** Titled group of settings rows. */
export function Panel({ title, children, id, icon }: { title?: string; children: ReactNode; id?: string; icon?: GlyphId }) {
  return (
    <section className="stack" style={{ gap: 8 }} aria-labelledby={title ? id : undefined}>
      {title && (
        <h2 className="panel-title" id={id}>
          {icon && <AppIcon id={icon} size={18} />}
          {title}
        </h2>
      )}
      <div className="panel">{children}</div>
    </section>
  );
}

export function PanelRow({ label, hint, children, column }: { label: ReactNode; hint?: ReactNode; children?: ReactNode; column?: boolean }) {
  return (
    <div className={`panel-row ${column ? 'col' : ''}`}>
      <span className="grow">
        {label}
        {hint && <span className="hint">{hint}</span>}
      </span>
      {children}
    </div>
  );
}

export function LinkRow({ to, label, hint, icon }: { to: string; label: ReactNode; hint?: ReactNode; icon?: ReactNode }) {
  return (
    <Link to={to} className="panel-row">
      {icon}
      <span className="grow">
        {label}
        {hint && <span className="hint">{hint}</span>}
      </span>
      <AppIcon id="chevron" className="muted" />
    </Link>
  );
}

/** Switch row: the whole row is the touch target, native checkbox for accessibility. */
export function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="panel-row" style={{ cursor: 'pointer' }}>
      <span className="grow">
        {label}
        {hint && <span className="hint">{hint}</span>}
      </span>
      <span className="switch">
        <input type="checkbox" role="switch" checked={on} onChange={(e) => onChange(e.target.checked)} />
        <span className="track" aria-hidden />
      </span>
    </label>
  );
}

export function SliderRow({ id, label, value, min, max, step, onChange, format }: { id: string; label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format: (v: number) => string }) {
  return (
    <div className="panel-row col">
      <label htmlFor={id} className="row between">
        <span>{label}</span>
        <b className="num-figure">{format(value)}</b>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
