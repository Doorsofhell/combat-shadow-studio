import { useEffect, useMemo, useRef, useState } from 'react';
import { askCoach, type CoachAnswer } from '../../coach/engine';
import { speakReply, stopReply } from '../../coach/speech';
import { searchApp, type SearchHit } from '../../domain/search';
import { useCatalog } from '../../store/catalog';
import { useCoachAi } from '../../store/coachAi';
import { useCoachContext } from '../coach-ai/useCoachContext';
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
 * 1.7.0: a question (a « ? », or a sentence that starts like one) gets the coach's answer at the top of the search,
 * without asking; a plain word gets only the results, with « Demander au coach » as the first line
 */
export const looksLikeQuestion = (s: string) =>
  /\?/.test(s) || /^(comment|pourquoi|quand|quel|quelle|quels|quelles|combien|est-ce|c'est quoi|c’est quoi|qu'est|qu’est|que |quoi|explique|aide|montre|dois-je|peux-tu|donne)/i.test(s.trim());

/** the routes where the Coach IA acts on the screen itself (as in CoachBubble) */
const HOSTED = ['/entrainement'];

/**
 * 1.0.0 (refonte ergonomique, lot 3; maquette v4, écran « Recherche »): « Rechercher ou demander au coach ». One field
 * for the whole app, which replaces the former Coach IA bubble: it finds techniques, encyclopedia terms, programmes
 * and places or settings of the app (src/domain/search.ts, local), and its first line asks the typed text to the
 * Coach IA (local too). `onGo` and `onAsk` close the sheet before leaving.
 * 1.7.0 (Youssef, 2026-10-28 11:30, proposition A « Réponse du coach en tête », maquette 9Bm1j9XWeRYAWtittrjn5q): one
 * bar with the IA icon ✦ inside, no big black « Demander au Coach IA » button any more. The coach's answer (local
 * engine, coach/engine.ts) shows at the top of the same sheet, short with « Lire la suite », its actions below it,
 * and the app's results under it. « Continuer avec le Coach IA » opens the full panel on the same question; the ✦
 * with an empty field opens the panel as before.
 */
export function SearchSheet({ onClose, onGo, onAsk, onApply }: { onClose: () => void; onGo: (to: string) => void; onAsk: (q: string, saved?: boolean) => void; onApply: (run: () => void) => void }) {
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
  const ai = useCoachAi();
  const { catalog } = useCatalog(ai.enabled);
  const { context, act } = useCoachContext(HOSTED.some((p) => loc.pathname === p || loc.pathname.startsWith(`${p}/`)));
  // the question the coach answers at the top: asked (✦, Entrée, « Demander au coach », a question of the screen),
  // or the typed text itself when it reads as a question
  const [asked, setAsked] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const question = asked ?? (ai.enabled && looksLikeQuestion(typed) ? typed : null);
  const answer: CoachAnswer | null = useMemo(
    () => (question && ai.enabled ? askCoach(question, { ...context, preferences: { detail: ai.detail }, catalog }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [question, ai.enabled, ai.detail, catalog, context.screen, context.techniqueId, context.discipline, context.level],
  );
  // what was asked on purpose goes to the history and is read aloud when the coach speaks, as in the panel
  const saved = useRef(new Set<string>());
  const askHere = (text: string) => {
    const t = text.trim();
    if (!t) return;
    if (!ai.enabled) return onAsk(t);
    setAsked(t);
    setMore(false);
    if (saved.current.has(t)) return;
    saved.current.add(t);
    const a = askCoach(t, { ...context, preferences: { detail: ai.detail }, catalog });
    ai.push({ question: t, answer: a.text, intent: a.intent, techniqueId: a.techniqueId });
    if (ai.voiceReplies) speakReply(a.text);
  };
  useEffect(() => () => stopReply(), []);
  const long = !!answer && answer.text.length > 160;
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
          // Entrée: a question goes to the coach (answer at the top); otherwise the first result when there is one,
          // else the coach
          if (typed && looksLikeQuestion(typed)) askHere(typed);
          else if (scope?.apply && typed) onApply(() => scope.apply!(typed));
          else if (own[0]) onGo(own[0].to);
          else if (hits[0]) onGo(hits[0].to);
          else if (typed) askHere(typed);
        }}
      >
        <NavIcon id="search" />
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setAsked(null);
            setMore(false);
          }}
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
              setAsked(null);
              input.current?.focus();
            }}
            data-testid="search-clear"
          >
            <NavIcon id="close" />
          </button>
        )}
        {/* ✦: the typed text to the coach, here; empty, the Coach IA panel */}
        <button
          type="button"
          className={`search-ai${answer ? ' on' : ''}`}
          aria-label={typed ? `Demander au Coach IA : ${typed}` : 'Ouvrir le Coach IA'}
          title="Demander au Coach IA"
          data-testid="search-ai"
          onClick={() => {
            haptic();
            if (typed) askHere(typed);
            else onAsk('');
          }}
        >
          <NavIcon id="sparkle" />
        </button>
      </form>
      {answer && question && (
        <section className={`search-coach${more ? ' more' : ''}`} aria-label="Réponse du Coach IA" aria-live="polite" data-testid="search-coach">
          <div className="search-coach-head">
            <NavIcon id="sparkle" />
            <span>Coach IA</span>
          </div>
          <p className={long && !more ? 'clamped' : undefined} data-testid="search-coach-text">
            {answer.text}
          </p>
          {long && !more && (
            <button type="button" className="search-coach-more" data-testid="search-coach-more" onClick={() => setMore(true)}>
              Lire la suite
            </button>
          )}
          <div className="search-coach-acts">
            {answer.actions.slice(0, 3).map((a, i) => (
              <button
                key={i}
                type="button"
                data-testid="search-coach-action"
                onClick={() => {
                  haptic();
                  onApply(() => act(a));
                }}
              >
                {a.label}
              </button>
            ))}
            <button
              type="button"
              data-testid="search-coach-open"
              onClick={() => {
                haptic();
                // the panel asks it again: already in the history when it was asked on purpose
                onAsk(question, saved.current.has(question));
              }}
            >
              Continuer avec le Coach IA
            </button>
          </div>
        </section>
      )}
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
                    setQ(x);
                    askHere(x);
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
              <button
                key={s}
                type="button"
                className="search-chip"
                onClick={() => {
                  setQ(s);
                  setAsked(null);
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="search-results" data-testid="search-results">
          {!answer && (
            <button
              type="button"
              className="search-ask"
              data-testid="search-ask"
              onClick={() => {
                haptic();
                askHere(typed);
              }}
            >
              <NavIcon id="sparkle" />
              <span>Demander au coach : « {typed} »</span>
            </button>
          )}
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
