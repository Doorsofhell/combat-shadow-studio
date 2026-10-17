import type { ReactNode } from 'react';

/** Linear progress (0..1), with its value exposed to screen readers. */
export function ProgressBar({ value, label, tone }: { value: number; label: string; tone?: 'red' | 'gold' }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className={`progress ${tone ?? ''}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)}>
      <i style={{ width: `${v * 100}%` }} />
    </div>
  );
}

/** Circular goal progress, SVG only. Gold once the goal is reached (mastery). */
export function GoalRing({ value, size = 76, children }: { value: number; size?: number; children?: ReactNode }) {
  const v = Math.max(0, Math.min(1, value));
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const done = v >= 1;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth="6" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={done ? 'var(--gold)' : 'var(--red)'}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${c * v} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="var(--ink)" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size * 0.24 }}>
        {children ?? `${Math.round(v * 100)} %`}
      </text>
    </svg>
  );
}

export interface BarDatum {
  key: string;
  label: string;
  value: number;
  /** text shown above the bar */
  display?: string;
}

/** Sober vertical bar chart (CSS); the last bar is the current period. Includes a text summary for screen readers. */
export function BarChart({ data, label, format }: { data: BarDatum[]; label: string; format: (v: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure style={{ margin: 0 }}>
      <div className="bars" aria-hidden>
        {data.map((d, i) => (
          <div key={d.key} className={`b ${i === data.length - 1 ? 'cur' : ''}`} title={format(d.value)}>
            <small className="v">{d.value ? d.display ?? format(d.value) : ''}</small>
            <i style={{ height: `${(d.value / max) * 100}%` }} />
            <small>{d.label}</small>
          </div>
        ))}
      </div>
      <figcaption className="sr-only">
        {label} : {data.map((d) => `${d.label} ${format(d.value)}`).join(', ')}
      </figcaption>
    </figure>
  );
}

/** Horizontal bars, one row per item (time per discipline, per level…). */
export function HBarList({ rows, format }: { rows: { label: string; value: number }[]; format: (v: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="stack" style={{ gap: 6 }} role="list">
      {rows.map((r) => (
        <div key={r.label} className="hbar" role="listitem">
          <span className="lbl">{r.label}</span>
          <span className="track" aria-hidden>
            <i style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="v">{format(r.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function StatTile({ value, unit, label, tone, testId }: { value: ReactNode; unit?: string; label: string; tone?: 'gold'; testId?: string }) {
  return (
    <div className={`stat-tile ${tone ?? ''}`}>
      <div className="v" data-testid={testId}>
        {value}
        {unit && <small>{unit}</small>}
      </div>
      <div className="k">{label}</div>
    </div>
  );
}
