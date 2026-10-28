import { LEVELS, LevelId } from '../../domain/types';

/**
 * 1.1.0 (Youssef, 2026-10-27: « le niveau soit une espèce de barre avec un moins à gauche et un plus à droite »,
 * proposition A chosen, « doit juste remplacer les 4 rectangles »): − on the left, the level's name over four bars,
 * + on the right. The four bars stay a radiogroup (a bar can be touched directly) and the name is written out, so
 * the choice is never told by colour alone.
 */
export function LevelSelector({ value, onChange, label = 'Niveau', testPrefix }: { value: LevelId; onChange: (l: LevelId) => void; label?: string; testPrefix?: string }) {
  const i = Math.max(0, LEVELS.findIndex((l) => l.id === value));
  const step = (d: number) => {
    const j = i + d;
    if (j < 0 || j >= LEVELS.length) return;
    try {
      navigator.vibrate?.(8);
    } catch {
      // not allowed: no tick
    }
    onChange(LEVELS[j].id);
  };
  return (
    <div className="level-sel" role="group" aria-label={label} data-testid="level-sel">
      <button type="button" className="level-pm" onClick={() => step(-1)} disabled={i === 0} aria-label={`${label} : moins`} data-testid="level-minus">
        −
      </button>
      <div className="level-mid">
        <span className="level-name" aria-live="polite" data-testid="level-name">
          {LEVELS[i].name}
        </span>
        <div className="level-bars" role="radiogroup" aria-label={label}>
          {LEVELS.map((l, k) => (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={l.id === value}
              aria-label={l.name}
              className={k <= i ? 'f' : ''}
              onClick={() => onChange(l.id)}
              data-testid={testPrefix ? `${testPrefix}${l.id}` : undefined}
            />
          ))}
        </div>
      </div>
      <button type="button" className="level-pm" onClick={() => step(1)} disabled={i === LEVELS.length - 1} aria-label={`${label} : plus`} data-testid="level-plus">
        +
      </button>
    </div>
  );
}
