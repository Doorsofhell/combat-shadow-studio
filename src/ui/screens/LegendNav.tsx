import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Catalog } from '../../domain/catalog/types';
import { DISCIPLINES, type DisciplineId } from '../../domain/types';
import { NavPanel, usePanel } from '../nav/NavSheets';
import { fold, getSelection, useSelection } from '../nav/selection';
import { useNavActions } from '../nav/store';

const DISC_SHORT = Object.fromEntries(DISCIPLINES.map((d) => [d.id, d.short])) as Record<DisciplineId, string>;

/**
 * v0.32 bar of Légendes (section 5.7): Rechercher (a legend by its name), Disciplines (the legends of one discipline,
 * the same `vue=champions&d=` list as the discipline cards of the page) and Légende (the legend last opened, see
 * nav/selection.ts). The search of the combination sheets (Explorer) stays on the page.
 */
export function LegendPanels({ catalog }: { catalog: Catalog | null }) {
  const nav = useNavigate();
  const [q] = useSearchParams();
  const search = usePanel();
  const filters = usePanel();
  const selected = useSelection('legende');
  const sel = selected && catalog ? catalog.championById.get(selected) : undefined;
  const d = q.get('vue') === 'champions' ? (q.get('d') as DisciplineId | null) : null;
  useNavActions({
    search: { run: search.show, disabled: !catalog, testId: 'nav-search' },
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
      {search.open && <LegendSearch catalog={catalog} onClose={() => search.hide()} onPick={(id) => search.hide(() => nav(`/champions/c/${id}`))} />}
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

function LegendSearch({ catalog, onClose, onPick }: { catalog: Catalog; onClose: () => void; onPick: (id: string) => void }) {
  const [text, setText] = useState('');
  const q = fold(text);
  const found = q.length < 2 ? [] : catalog.champions.filter((c) => fold(c.name).includes(q)).slice(0, 40);
  return (
    <NavPanel title="Rechercher une légende" onClose={onClose} testId="search-panel">
      <input className="nav-search" type="search" autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Nom de la légende" aria-label="Nom de la légende" data-testid="search-input" />
      {q.length >= 2 && (
        <ul className="nav-results" aria-label="Résultats" data-testid="search-results">
          {found.length === 0 && <li className="small muted">Aucune légende ne porte ce nom.</li>}
          {found.map((c) => (
            <li key={c.id}>
              <button type="button" className="nav-result" onClick={() => onPick(c.id)}>
                <span>{c.name}</span>
                <small>{c.disciplines.map((x) => DISC_SHORT[x]).join(', ')}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </NavPanel>
  );
}
