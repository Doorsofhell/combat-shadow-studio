import { ReactNode, useId } from 'react';
import type { Paint, Pattern } from '../../../editor/look';
import type { Range } from '../../../editor/normalize';
import { CLOTH_COLORS } from '../../../editor/random';
import { PATTERN_OPTS } from './options';

export const fmt = {
  /** -1..1 offset shown as a signed figure: −40, 0, +25 */
  signed: (v: number) => {
    const n = Math.round(v * 100);
    return n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0';
  },
  /** 0..1 (or 0..1.5) shown as a percentage */
  pct: (v: number) => `${Math.round(v * 100)} %`,
  /** scale factor around 1 */
  scale: (v: number) => `${Math.round(v * 100)} %`,
  cm: (v: number) => `${Math.round(v * 100)} cm`,
  deg: (v: number) => `${Math.round(v)}°`,
};

/** Labelled range input with its value; the whole row is at least 48 px high. */
export function Slider({
  id,
  label,
  value,
  range,
  step = 0.01,
  onChange,
  format = fmt.signed,
  hint,
}: {
  id: string;
  label: string;
  value: number;
  range: Range;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  hint?: string;
}) {
  const inputId = `cs-${id}`;
  return (
    <div className="cs-slider">
      <label htmlFor={inputId} className="cs-slider-head">
        <span>{label}</span>
        <b className="num-figure" data-testid={`value-${id}`}>
          {format(value)}
        </b>
      </label>
      <input
        id={inputId}
        type="range"
        min={range[0]}
        max={range[1]}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={format(value)}
        data-testid={`slider-${id}`}
      />
      {hint && <span className="cs-hint">{hint}</span>}
    </div>
  );
}

/** Colour presets as round swatches (radiogroup) plus a free colour picker. */
export function ColorField({ label, value, onChange, swatches, testId }: { label: string; value: string; onChange: (c: string) => void; swatches: readonly string[]; testId?: string }) {
  const id = useId();
  const v = value.toLowerCase();
  const custom = !swatches.includes(v);
  return (
    <div className="cs-color">
      <span className="cs-label" id={id}>
        {label}
      </span>
      <div className="cs-swatches" role="radiogroup" aria-labelledby={id}>
        {swatches.map((c, i) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={c === v}
            aria-label={`${label}, teinte ${i + 1}`}
            title={c}
            className="cs-swatch"
            style={{ background: c }}
            onClick={() => onChange(c)}
          />
        ))}
        <label className={`cs-swatch cs-custom ${custom ? 'on' : ''}`} title="Couleur personnalisée" style={custom ? { background: v } : undefined}>
          <span className="sr-only">{label}, couleur personnalisée</span>
          <input type="color" value={v} onChange={(e) => onChange(e.target.value.toLowerCase())} data-testid={testId} />
          <span aria-hidden className="cs-custom-ico">
            +
          </span>
        </label>
      </div>
    </div>
  );
}

/** Colour, second colour and pattern of a garment or a piece of gear. */
export function PaintEditor({ label, paint, onChange, testId, colorOnly }: { label: string; paint: Paint; onChange: (p: Paint) => void; testId?: string; colorOnly?: boolean }) {
  const id = useId();
  return (
    <div className="cs-paint">
      <ColorField label={`${label} : couleur`} value={paint.color} swatches={CLOTH_COLORS} onChange={(color) => onChange({ ...paint, color })} testId={testId ? `${testId}-color` : undefined} />
      {!colorOnly && (
        <>
          <div className="cs-field">
            <span className="cs-label" id={id}>
              {label} : motif
            </span>
            <div className="cs-chips" role="radiogroup" aria-labelledby={id}>
              {PATTERN_OPTS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={paint.pattern === o.id}
                  className="chip"
                  onClick={() => onChange({ ...paint, pattern: o.id as Pattern })}
                  data-testid={testId ? `${testId}-pattern-${o.id}` : undefined}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          {paint.pattern !== 'uni' && (
            <ColorField
              label={`${label} : deuxième couleur`}
              value={paint.color2}
              swatches={CLOTH_COLORS}
              onChange={(color2) => onChange({ ...paint, color2 })}
              testId={testId ? `${testId}-color2` : undefined}
            />
          )}
        </>
      )}
    </div>
  );
}

export function Group({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  const id = useId();
  return (
    <section className="cs-group" aria-labelledby={id}>
      <div className="cs-group-head">
        <h3 id={id}>{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
