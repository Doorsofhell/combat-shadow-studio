import type { ReactNode } from 'react';

/** Toggle chip; the selected state shows a check mark as well as the colour. */
export function Chip({ on, onClick, children, testId, label }: { on?: boolean; onClick?: () => void; children: ReactNode; testId?: string; label?: string }) {
  return (
    <button type="button" className={`chip ${on ? 'on' : ''}`} aria-pressed={on} onClick={onClick} data-testid={testId} aria-label={label}>
      {children}
    </button>
  );
}

/** Single-choice filter row (radiogroup), scrolls horizontally on small screens. */
export function FilterChips<T extends string | number>({ options, value, onChange, label, scroll = false, testPrefix }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; label: string; scroll?: boolean; testPrefix?: string }) {
  return (
    <div className={scroll ? 'chip-scroll' : 'row'} style={scroll ? undefined : { gap: 8 }} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.id)} type="button" role="radio" aria-checked={o.id === value} className={`chip ${o.id === value ? 'on' : ''}`} onClick={() => onChange(o.id)} data-testid={testPrefix ? `${testPrefix}${o.id}` : undefined}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Compact segmented control (settings, camera presets). */
export function Segmented<T extends string | number>({ options, value, onChange, label }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.id)} type="button" role="radio" aria-checked={o.id === value} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
