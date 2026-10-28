import { NavIcon } from '../nav/NavIcon';
/**
 * 1.1.0: the words a list is filtered with, since its search field moved into « Rechercher » (bar); a touch clears
 * them. Shown only while there are words.
 */
export function QueryChip({ value, onClear }: { value: string; onClear: () => void }) {
  if (!value) return null;
  return (
    <button type="button" className="chip on query-chip" onClick={onClear} aria-label={`Recherche « ${value} » : effacer`} data-testid="query-clear">
      « {value} »<NavIcon id="close" />
    </button>
  );
}
