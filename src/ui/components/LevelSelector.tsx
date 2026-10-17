import { LEVELS, LevelId } from '../../domain/types';

/** The four levels as a radiogroup; pips show the rank so the choice is not conveyed by colour alone. */
export function LevelSelector({ value, onChange, label = 'Niveau', testPrefix }: { value: LevelId; onChange: (l: LevelId) => void; label?: string; testPrefix?: string }) {
  return (
    <div className="level-sel" role="radiogroup" aria-label={label}>
      {LEVELS.map((l, i) => (
        <button key={l.id} type="button" role="radio" aria-checked={l.id === value} onClick={() => onChange(l.id)} data-testid={testPrefix ? `${testPrefix}${l.id}` : undefined}>
          <span className="pips" aria-hidden>
            {LEVELS.map((_, j) => (
              <i key={j} className={j <= i ? 'f' : ''} />
            ))}
          </span>
          {l.name}
        </button>
      ))}
    </div>
  );
}
