import { useEffect, useId, useState, type ReactNode } from 'react';

/**
 * v0.39 Progrès: the ring of the reference mockups. Thick, round caps, red to orange (gold once full), on a dark
 * track. The value is always written in the centre (the colour only repeats it) and the arc grows from zero when it
 * appears (no motion when the system asks for reduced motion, see progress.css).
 *
 * `value` is a ratio 0..1 of a denominator the caller states in its text: never a bare percentage.
 */
export function Ring({ value, size = 200, stroke = 16, tone = 'red', children, label, testId }: { value: number; size?: number; stroke?: number; tone?: 'red' | 'gold' | 'orange'; children?: ReactNode; label: string; testId?: string }) {
  const v = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const r = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * r;
  const id = useId().replace(/:/g, '');
  // the arc starts empty and grows on the next frame
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = requestAnimationFrame(() => setShown(v));
    return () => cancelAnimationFrame(t);
  }, [v]);
  const full = v >= 1;
  const [a, b] = full ? ['var(--gold)', 'var(--gold)'] : tone === 'gold' ? ['var(--gold)', 'var(--c-orange, var(--gold))'] : tone === 'orange' ? ['var(--c-orange, var(--gold))', 'var(--gold)'] : ['var(--red)', 'var(--c-orange, var(--red))'];
  return (
    <span className="p-ring" style={{ width: size, height: size }} role="img" aria-label={label} data-testid={testId} data-value={Math.round(v * 1000) / 1000}>
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden focusable="false">
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={a} />
            <stop offset="1" stopColor={b} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} className="p-ring-track" strokeWidth={stroke} />
        {v > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            className="p-ring-arc"
            stroke={`url(#g${id})`}
            strokeWidth={stroke}
            strokeDasharray={`${c * shown} ${c}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </svg>
      <span className="p-ring-body" aria-hidden>
        {children}
      </span>
    </span>
  );
}
