/** mm:ss (or h:mm:ss) */
export function clock(sec: number) {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(r)}` : `${m}:${p(r)}`;
}

/** Big sports figure (Rajdhani, tabular digits) with its caption. */
export function TimerDisplay({ seconds, label, size = 3, testId }: { seconds: number; label?: string; size?: number; testId?: string }) {
  return (
    <div className="timer-display" style={{ fontSize: `${size}rem` }} role="timer" aria-label={label ? `${label} ${clock(seconds)}` : clock(seconds)}>
      <span data-testid={testId}>{clock(seconds)}</span>
      {label && <span className="k">{label}</span>}
    </div>
  );
}
