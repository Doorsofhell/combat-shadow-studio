import { KeyboardEvent, useRef } from 'react';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  testId?: string;
}

/**
 * Accessible tabs (role tablist, arrow keys, Home / End). `variant="pill"` for filters inside a
 * screen, `"underline"` for the sections of a screen.
 */
export function Tabs<T extends string>({ items, value, onChange, label, variant = 'pill' }: { items: TabItem<T>[]; value: T; onChange: (v: T) => void; label: string; variant?: 'pill' | 'underline' }) {
  const ref = useRef<HTMLDivElement>(null);
  const onKey = (e: KeyboardEvent) => {
    const i = items.findIndex((x) => x.id === value);
    let n = -1;
    if (e.key === 'ArrowRight') n = (i + 1) % items.length;
    if (e.key === 'ArrowLeft') n = (i - 1 + items.length) % items.length;
    if (e.key === 'Home') n = 0;
    if (e.key === 'End') n = items.length - 1;
    if (n < 0) return;
    e.preventDefault();
    onChange(items[n].id);
    ref.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[n]?.focus();
  };
  const u = variant === 'underline';
  return (
    <div ref={ref} className={u ? 'utabs' : 'tabs'} role="tablist" aria-label={label} onKeyDown={onKey}>
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.id === value}
          tabIndex={t.id === value ? 0 : -1}
          className={u ? 'utab' : `tab ${t.id === value ? 'on' : ''}`}
          onClick={() => onChange(t.id)}
          data-testid={t.testId}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
