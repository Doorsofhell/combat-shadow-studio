import { KeyboardEvent, ReactNode, useEffect, useRef } from 'react';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  /** shown before the label (e.g. the discipline's official badge) */
  icon?: ReactNode;
  testId?: string;
  /** 2.13.0: a small red dot after the label (something to fill in that tab) */
  dot?: boolean;
  dotTestId?: string;
}

/**
 * Accessible tabs (role tablist, arrow keys, Home / End). `variant="pill"` for filters inside a
 * screen, `"underline"` for the sections of a screen, `"section"` for the big tabs inside a screen (the pills of
 * the tabs of a space).
 */
export function Tabs<T extends string>({ items, value, onChange, label, variant = 'pill', testId }: { items: TabItem<T>[]; value: T; onChange: (v: T) => void; label: string; variant?: 'pill' | 'underline' | 'section'; testId?: string }) {
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
  // 0.36: on a narrow screen the row scrolls; the selected tab is brought into view (only the row scrolls)
  useEffect(() => {
    const row = ref.current;
    const tab = row?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!row || !tab || row.scrollWidth <= row.clientWidth) return;
    const left = tab.offsetLeft - row.offsetLeft;
    if (left < row.scrollLeft || left + tab.offsetWidth > row.scrollLeft + row.clientWidth) row.scrollLeft = Math.max(0, left - 16);
  }, [value]);
  const u = variant === 'underline';
  // 2.13.0: `"section"` draws the pills of the tabs of a space (Progrès: Tableau / Historique / Objectifs,
  // SectionTabs.tsx) for the tabs inside one screen (Compte: Moi / Ma pratique / Mon compte)
  const sec = variant === 'section';
  const cls = (on: boolean) => (sec ? `sec-tab ${on ? 'on' : ''}` : u ? 'utab' : `tab ${on ? 'on' : ''}`);
  return (
    <div ref={ref} className={sec ? 'sec-tabs-in' : u ? 'utabs' : 'tabs'} role="tablist" aria-label={label} onKeyDown={onKey} data-testid={testId}>
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.id === value}
          tabIndex={t.id === value ? 0 : -1}
          className={cls(t.id === value)}
          onClick={() => onChange(t.id)}
          data-testid={t.testId}
        >
          {t.icon}
          {t.label}
          {t.dot && <i className="me-dot" aria-label="à compléter" data-testid={t.dotTestId} />}
        </button>
      ))}
    </div>
  );
}
