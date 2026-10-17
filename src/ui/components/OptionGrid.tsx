import type { ReactNode } from 'react';

export interface OptionItem<T extends string> {
  id: T;
  label: string;
  /** colour swatch (skin tone, hair colour…) */
  swatch?: string;
  icon?: ReactNode;
}

/** Generic option grid (gear, outfit, hair style, colour presets): a radiogroup of tiles. */
export function OptionGrid<T extends string>({ options, value, onChange, label, min = 92, testPrefix }: { options: OptionItem<T>[]; value: T | null; onChange: (v: T) => void; label: string; min?: number; testPrefix?: string }) {
  return (
    <div className="opt-grid" role="radiogroup" aria-label={label} style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))` }}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={o.id === value} className="opt" onClick={() => onChange(o.id)} aria-label={o.label} data-testid={testPrefix ? `${testPrefix}${o.id}` : undefined}>
          {o.swatch && <span className="swatch" style={{ background: o.swatch }} aria-hidden />}
          {o.icon}
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}
