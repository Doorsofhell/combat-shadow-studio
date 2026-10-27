import { useEffect, useMemo, useRef, useState } from 'react';
import { searchApp, type SearchHit } from '../../domain/search';
import { NavIcon } from './NavIcon';
import { NavPanel } from './NavSheets';
import { haptic } from './BottomBar';

/** questions that show what the field can do, before anything is typed (they fill the field, nothing more) */
export const SEARCH_SUGGESTIONS = ['Comment corriger mon jab ?', 'Favoris', 'Voix et sons', 'Wai kru'];

/**
 * 1.0.0 (refonte ergonomique, lot 3; maquette v4, écran « Recherche »): « Rechercher ou demander au coach ». One field
 * for the whole app, which replaces the former Coach IA bubble: it finds techniques, encyclopedia terms, programmes
 * and places or settings of the app (src/domain/search.ts, local), and its first line asks the typed text to the
 * Coach IA (local too). `onGo` and `onAsk` close the sheet before leaving.
 */
export function SearchSheet({ onClose, onGo, onAsk }: { onClose: () => void; onGo: (to: string) => void; onAsk: (q: string) => void }) {
  const [q, setQ] = useState('');
  // the field takes the focus once the sheet has focused itself (NavPanel), so the keyboard opens at once
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const t = window.setTimeout(() => input.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, []);
  const hits = useMemo(() => searchApp(q), [q]);
  const typed = q.trim();
  const groups = useMemo(() => {
    const m = new Map<string, SearchHit[]>();
    for (const h of hits) m.set(h.group, [...(m.get(h.group) ?? []), h]);
    return [...m];
  }, [hits]);

  return (
    <NavPanel title="Rechercher ou demander" onClose={onClose} testId="search-sheet" wide closable>
      <form
        className="search-field"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          // Entrée: the first result when there is one, else the question to the coach
          if (hits[0]) onGo(hits[0].to);
          else if (typed) onAsk(typed);
        }}
      >
        <NavIcon id="search" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher ou demander au coach"
          aria-label="Rechercher ou demander au coach"
          autoComplete="off"
          enterKeyHint="search"
          ref={input}
          data-testid="search-input"
        />
        {q && (
          <button
            type="button"
            className="search-clear"
            aria-label="Effacer"
            onClick={() => {
              setQ('');
              input.current?.focus();
            }}
            data-testid="search-clear"
          >
            <NavIcon id="close" />
          </button>
        )}
      </form>
      {/* the first line asks the Coach IA (the typed text, or opens it empty) */}
      <button
        type="button"
        className="search-ask"
        data-testid="search-ask"
        onClick={() => {
          haptic();
          onAsk(typed);
        }}
      >
        <NavIcon id="sparkle" />
        <span>{typed ? `Demander au Coach IA : « ${typed} »` : 'Demander au Coach IA'}</span>
      </button>
      {!typed ? (
        <div className="search-suggest">
          <div className="nav-section">Essaie</div>
          <div className="search-chips">
            {SEARCH_SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="search-chip" onClick={() => setQ(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="search-results" data-testid="search-results">
          {groups.length === 0 && <p className="search-none">Rien de ce nom dans l’app. Le Coach IA peut quand même répondre.</p>}
          {groups.map(([g, list]) => (
            <section key={g} className="search-group" aria-label={g}>
              <div className="nav-section">{g}</div>
              {list.map((h) => (
                <button
                  key={h.to}
                  type="button"
                  className="search-hit"
                  data-testid="search-hit"
                  data-to={h.to}
                  onClick={() => {
                    haptic();
                    onGo(h.to);
                  }}
                >
                  <span className="grow">
                    <b>{h.label}</b>
                    {h.hint && <small>{h.hint}</small>}
                  </span>
                  <NavIcon id="chevron" />
                </button>
              ))}
            </section>
          ))}
        </div>
      )}
    </NavPanel>
  );
}
