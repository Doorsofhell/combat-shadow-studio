import { useEffect, useMemo, useRef, useState } from 'react';
import { searchApp, type SearchHit } from '../../domain/search';
import { NavIcon } from './NavIcon';
import { NavPanel } from './NavSheets';
import { haptic } from './BottomBar';
import { useSearchScopeStore } from './store';
import { useLocation } from 'react-router-dom';
import { navScreen, type NavScreen } from './config';

/** questions that show what the field can do, before anything is typed (they fill the field, nothing more) */
export const SEARCH_SUGGESTIONS = ['Comment corriger mon jab ?', 'Favoris', 'Voix et sons', 'Wai kru'];

/**
 * 1.1.0 (Youssef, 2026-10-27: « Que signifient les statuts, rajoute-le comme question prédéfinie dans recherche
 * quand exécuté dans certains écrans, puis supprime-le de l'écran Légendes »): the questions of a screen, asked to the
 * Coach IA in one touch (src/coach/appGuide.ts answers them)
 */
export const SCREEN_QUESTIONS: Partial<Record<NavScreen, string[]>> = {
  legendes: ['Que signifient les statuts ?'],
  'fiche-legende': ['Que signifient les statuts ?'],
  combinaison: ['Que signifient les statuts ?'],
};

/**
 * 1.0.0 (refonte ergonomique, lot 3; maquette v4, écran « Recherche »): « Rechercher ou demander au coach ». One field
 * for the whole app, which replaces the former Coach IA bubble: it finds techniques, encyclopedia terms, programmes
 * and places or settings of the app (src/domain/search.ts, local), and its first line asks the typed text to the
 * Coach IA (local too). `onGo` and `onAsk` close the sheet before leaving.
 */
export function SearchSheet({ onClose, onGo, onAsk, onApply }: { onClose: () => void; onGo: (to: string) => void; onAsk: (q: string) => void; onApply: (run: () => void) => void }) {
  const [q, setQ] = useState('');
  // the field takes the focus once the sheet has focused itself (NavPanel), so the keyboard opens at once
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const t = window.setTimeout(() => input.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, []);
  const scope = useSearchScopeStore((s) => s.scope);
  const loc = useLocation();
  const screen = navScreen(loc.pathname, loc.search);
  const questions = (screen && SCREEN_QUESTIONS[screen]) ?? [];
  const hits = useMemo(() => searchApp(q), [q]);
  const typed = q.trim();
  // 1.1.0: the screen's own results first (its former search field), at most 8
  const own = useMemo(() => (scope && typed.length >= 2 ? scope.hits(typed).slice(0, 8) : []), [scope, typed]);
  const placeholder = scope ? `Rechercher dans ${scope.label.toLowerCase()} ou demander au coach` : 'Rechercher ou demander au coach';
  const groups = useMemo(() => {
    const m = new Map<string, SearchHit[]>();
    // the screen's own results are not repeated below
    const shown = new Set(own.map((h) => h.to));
    for (const h of hits) if (!shown.has(h.to)) m.set(h.group, [...(m.get(h.group) ?? []), h]);
    return [...m];
  }, [hits, own]);

  return (
    <NavPanel title="Rechercher ou demander" onClose={onClose} testId="search-sheet" wide closable variant="full">
      <form
        className="search-field"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          // Entrée: the first result when there is one, else the question to the coach
          if (scope?.apply && typed) onApply(() => scope.apply!(typed));
          else if (own[0]) onGo(own[0].to);
          else if (hits[0]) onGo(hits[0].to);
          else if (typed) onAsk(typed);
        }}
      >
        <NavIcon id="search" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
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
          {questions.length > 0 && (
            <>
              <div className="nav-section">Sur cet écran</div>
              {questions.map((x) => (
                <button
                  key={x}
                  type="button"
                  className="search-hit"
                  data-testid="search-question"
                  onClick={() => {
                    haptic();
                    onAsk(x);
                  }}
                >
                  <NavIcon id="help" />
                  <span className="grow">
                    <b>{x}</b>
                  </span>
                  <NavIcon id="chevron" />
                </button>
              ))}
            </>
          )}
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
          {scope?.apply && (
            <button
              type="button"
              className="search-apply"
              data-testid="search-apply"
              onClick={() => {
                haptic();
                onApply(() => scope.apply!(typed));
              }}
            >
              <NavIcon id="filter" />
              <span className="grow">Filtrer {scope.label.toLowerCase()} avec « {typed} »</span>
              <NavIcon id="chevron" />
            </button>
          )}
          {own.length > 0 && (
            <section className="search-group" aria-label={scope!.label}>
              <div className="nav-section">Dans {scope!.label.toLowerCase()}</div>
              {own.map((h) => (
                <button
                  key={h.to}
                  type="button"
                  className="search-hit"
                  data-testid="search-own-hit"
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
          )}
          {groups.length === 0 && own.length === 0 && <p className="search-none">Rien de ce nom dans l’app. Le Coach IA peut quand même répondre.</p>}
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
