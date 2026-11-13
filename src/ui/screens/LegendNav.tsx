import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Catalog } from '../../domain/catalog/types';
import { DISCIPLINES, type DisciplineId } from '../../domain/types';
import { NavPanel, usePanel } from '../nav/NavSheets';
import { fold, getSelection, useSelection } from '../nav/selection';
import { useNavActions, useSearchScope } from '../nav/store';
import { searchCombos } from '../../domain/catalog/search';

const DISC_SHORT = Object.fromEntries(DISCIPLINES.map((d) => [d.id, d.short])) as Record<DisciplineId, string>;

/**
 * v0.32 bar of Légendes (section 5.7): Disciplines (the legends of one discipline,
 * the same `vue=champions&d=` list as the discipline cards of the page) and Légende (the legend last opened, see
 * nav/selection.ts). The search of the combination sheets (Explorer) stays on the page.
 */
export function LegendPanels({ catalog }: { catalog: Catalog | null }) {
  const nav = useNavigate();
  const [q] = useSearchParams();
  const filters = usePanel();
  // 1.1.0: « Rechercher » of the bar, scoped to the legends (by name) and their combinations (the former field of
  // « Explorer », which keeps the words as its filter)
  useSearchScope(
    catalog
      ? {
          label: 'Légendes',
          hits: (text) => {
            const f = fold(text);
            const champs = catalog.champions.filter((c) => fold(c.name).includes(f)).map((c) => ({ label: c.name, hint: c.disciplines.map((x) => DISC_SHORT[x]).join(', '), to: `/champions/c/${c.id}` }));
            const combos = searchCombos(catalog, { text })
              .slice(0, 8)
              .map((c) => ({ label: c.name, hint: `Combinaison · ${catalog.championById.get(c.champion)?.name ?? ''}`, to: `/champions/${c.id}` }));
            return [...champs, ...combos];
          },
          apply: (text) => nav(`/champions?vue=explorer&q=${encodeURIComponent(text)}`),
          current: q.get('vue') === 'explorer' ? (q.get('q') ?? '') : '',
        }
      : null,
  );
  const selected = useSelection('legende');
  const sel = selected && catalog ? catalog.championById.get(selected) : undefined;
  const d = q.get('vue') === 'champions' ? (q.get('d') as DisciplineId | null) : null;
  useNavActions({
    filters: { run: filters.show, disabled: !catalog, ariaLabel: `Disciplines${d ? ` : ${DISC_SHORT[d]}` : ''}`, testId: 'nav-filters' },
    'open-selected': {
      run: () => {
        const id = getSelection('legende');
        if (id) nav(`/champions/c/${id}`);
      },
      disabled: !sel,
      ariaLabel: sel ? `Légende : ouvrir ${sel.name}` : 'Légende : aucune légende sélectionnée',
      testId: 'nav-open-selected',
    },
  });
  if (!catalog) return null;
  return (
    <>
      {filters.open && (
        <NavPanel title="Disciplines" onClose={() => filters.hide()} testId="filters-panel">
          <div className="nav-menugrid" role="group" aria-label="Légendes par discipline">
            <button type="button" className={`nav-menuitem ${q.get('vue') === 'champions' && !d ? 'on' : ''}`} onClick={() => filters.hide(() => nav('/champions?vue=champions', { replace: true }))}>
              <span>Toutes</span>
              <small className="muted">{catalog.champions.length} légendes</small>
            </button>
            {DISCIPLINES.map((x) => (
              <button
                key={x.id}
                type="button"
                className={`nav-menuitem ${d === x.id ? 'on' : ''}`}
                aria-pressed={d === x.id}
                data-testid={`filter-d-${x.id}`}
                onClick={() => filters.hide(() => nav(`/champions?vue=champions&d=${x.id}`, { replace: true }))}
              >
                <span>{x.short}</span>
                <small className="muted">{catalog.champions.filter((c) => c.disciplines.includes(x.id)).length} légendes</small>
              </button>
            ))}
          </div>
        </NavPanel>
      )}
    </>
  );
}
