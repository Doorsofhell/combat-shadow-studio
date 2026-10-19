import { LEVELS, LevelId } from '../../domain/types';
import { LevelIcon } from '../icons';

/** The four levels as a radiogroup; the bars show the rank so the choice is not conveyed by colour alone. */
export function LevelSelector({ value, onChange, label = 'Niveau', testPrefix }: { value: LevelId; onChange: (l: LevelId) => void; label?: string; testPrefix?: string }) {
  return (
    <div className="level-sel" role="radiogroup" aria-label={label}>
      {LEVELS.map((l) => (
        <button key={l.id} type="button" role="radio" aria-checked={l.id === value} onClick={() => onChange(l.id)} data-testid={testPrefix ? `${testPrefix}${l.id}` : undefined}>
          <LevelIcon level={l.id} size={18} />
          {l.name}
        </button>
      ))}
    </div>
  );
}
