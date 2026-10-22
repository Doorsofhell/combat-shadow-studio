import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORY_LABEL, TECHNIQUES, techniquesFor } from '../../domain/techniques';
import { DISCIPLINES, type DisciplineId } from '../../domain/types';
import { filterTechniques } from '../../domain/kickboxingStyles';
import { useGoals } from '../../store/goals';
import { useKbStyle } from '../components';
import { NavPanel, usePanel } from '../nav/NavSheets';
import { fold, getSelection, useSelection } from '../nav/selection';
import { useNavActions } from '../nav/store';
import { TECHNIQUE_BY_ID } from '../../domain/techniques';
import { sheetQuery, type TechniqueFilter } from './techniqueOrder';

const DISC_SHORT = Object.fromEntries(DISCIPLINES.map((d) => [d.id, d.short])) as Record<DisciplineId, string>;

/**
 * v0.32 bar of the catalogue (section 5.4): Rechercher (search by name in every discipline), Filtres (discipline,
 * category, the techniques to review: the same filters as on the page, kept in the URL) and Technique (the technique
 * selected in the list, see nav/selection.ts).
 */
export function LibraryPanels({ d, setD, cat, setCat, tab }: { d: DisciplineId; setD: (d: DisciplineId) => void; cat: TechniqueFilter; setCat: (c: TechniqueFilter) => void; tab: string }) {
  const nav = useNavigate();
  const search = usePanel();
  const filters = usePanel();
  const selected = useSelection('technique');
  const sel = selected ? TECHNIQUE_BY_ID.get(selected) : undefined;
  useNavActions({
    search: { run: search.show, testId: 'nav-search' },
    filters: { run: filters.show, testId: 'nav-filters', ariaLabel: `Filtres : ${DISC_SHORT[d]}${cat !== 'tout' ? `, ${cat === 'a-revoir' ? 'à revoir' : CATEGORY_LABEL[cat as keyof typeof CATEGORY_LABEL]}` : ''}` },
    'open-selected': {
      run: () => {
        const id = getSelection('technique');
        if (id && TECHNIQUE_BY_ID.has(id)) nav(`/techniques/${id}${sheetQuery(d, cat)}`);
      },
      disabled: !sel,
      ariaLabel: sel ? `Technique : ouvrir ${sel.name}` : 'Technique : aucune technique sélectionnée',
      testId: 'nav-open-selected',
    },
  });
  return (
    <>
      {search.open && <TechniqueSearch onClose={search.hide} onPick={(id, disc) => search.hide(() => nav(`/techniques/${id}?d=${disc}`))} />}
      {filters.open && <TechniqueFilters d={d} cat={cat} tab={tab} onClose={() => filters.hide()} setD={setD} setCat={setCat} />}
    </>
  );
}

function TechniqueSearch({ onClose, onPick }: { onClose: () => void; onPick: (id: string, d: DisciplineId) => void }) {
  const [text, setText] = useState('');
  const q = fold(text);
  const found = q.length < 2 ? [] : TECHNIQUES.filter((t) => fold(t.name).includes(q)).slice(0, 40);
  return (
    <NavPanel title="Rechercher une technique" onClose={onClose} testId="search-panel">
      <input className="nav-search" type="search" autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Nom de la technique (ex. crochet)" aria-label="Nom de la technique" data-testid="search-input" />
      {q.length >= 2 && (
        <ul className="nav-results" aria-label="Résultats" data-testid="search-results">
          {found.length === 0 && <li className="small muted">Aucune technique ne porte ce nom.</li>}
          {found.map((t) => (
            <li key={t.id}>
              <button type="button" className="nav-result" onClick={() => onPick(t.id, t.disciplines[0])}>
                <span>{t.name}</span>
                <small>
                  {t.disciplines.map((x) => DISC_SHORT[x]).join(', ')} · {CATEGORY_LABEL[t.category]}
                </small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </NavPanel>
  );
}

function TechniqueFilters({ d, cat, tab, setD, setCat, onClose }: { d: DisciplineId; cat: TechniqueFilter; tab: string; setD: (d: DisciplineId) => void; setCat: (c: TechniqueFilter) => void; onClose: () => void }) {
  const mastery = useGoals((s) => s.mastery);
  const [kbStyle] = useKbStyle();
  const list = filterTechniques(techniquesFor(d), d, kbStyle);
  const cats = [...new Set(list.map((t) => t.category))];
  const review = list.filter((t) => mastery[t.id] === 'a-revoir').length;
  return (
    <NavPanel title="Filtres" onClose={onClose} testId="filters-panel">
      <div className="nav-field" role="group" aria-label="Discipline">
        <span>Discipline</span>
        <div className="nav-chips">
          {DISCIPLINES.map((x) => (
            <button key={x.id} type="button" className={`chip ${x.id === d ? 'on' : ''}`} aria-pressed={x.id === d} onClick={() => setD(x.id)} data-testid={`filter-d-${x.id}`}>
              {x.short}
            </button>
          ))}
        </div>
      </div>
      {tab === 'techniques' && (
        <div className="nav-field" role="group" aria-label="Catégorie">
          <span>Catégorie</span>
          <div className="nav-chips">
            <button type="button" className={`chip ${cat === 'tout' ? 'on' : ''}`} aria-pressed={cat === 'tout'} onClick={() => setCat('tout')}>
              Tout ({list.length})
            </button>
            {review > 0 && (
              <button type="button" className={`chip ${cat === 'a-revoir' ? 'on' : ''}`} aria-pressed={cat === 'a-revoir'} onClick={() => setCat('a-revoir')}>
                À revoir ({review})
              </button>
            )}
            {cats.map((c) => (
              <button key={c} type="button" className={`chip ${cat === c ? 'on' : ''}`} aria-pressed={cat === c} onClick={() => setCat(c)} data-testid={`filter-cat-${c}`}>
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="nav-actions">
        <button type="button" className="nav-action primary" onClick={onClose} data-testid="filters-close">
          Voir les résultats
        </button>
      </div>
    </NavPanel>
  );
}
