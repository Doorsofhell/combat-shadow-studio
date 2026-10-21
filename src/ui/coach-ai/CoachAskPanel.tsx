import { FormEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { askCoach, exampleQuestions, type CoachAction, type CoachAnswer, type CoachContext } from '../../coach/engine';
import { getSpeechInput, speakReply, stopReply, type SpeechInput } from '../../coach/speech';
import { useCatalog } from '../../store/catalog';
import { useCoachAi } from '../../store/coachAi';
import { COACH_PANEL_SIZES, useSettings, type CoachPanelSize } from '../../store/settings';
import { AppIcon } from '../icons';
import { createDoubleTap, TAP_CONTROLS } from '../fullscreen/doubleTap';
import { SuggestRail } from './SuggestRail';
import { useKeyboardInset } from './useKeyboardInset';
import { useSuggestionMemory } from './useSuggestionMemory';
import './coachAi.css';

export const COACH_HISTORY_ROUTE = '/coach-ia';

export interface CoachAskPanelProps {
  /** profil + séance en cours ; `preferences` et `catalog` sont complétés par le panneau */
  context: Omit<CoachContext, 'preferences' | 'catalog' | 'lastTechniqueId' | 'seed'>;
  /** action à exécuter par l’écran hôte (démo, ralenti, répéter, lancer un exercice / une fiche, ouvrir un écran) */
  onAction: (action: CoachAction) => void;
  onClose: () => void;
  /** lien vers l’historique et les réglages (par défaut /coach-ia) */
  historyHref?: string;
}

/** a drag of this many pixels on the grab handle changes the size */
const GRAB_STEP = 28;

/**
 * Panneau « Demande au coach » (bulle, pilule d’actions et écran d’entraînement). Répond en local
 * (base de connaissances validée) ; le bouton micro n’apparaît que si un moteur vocal est disponible.
 * 0.27 (Youssef, 2026-10-20 21:59: « Permet d'agrandir la fenêtre ia et de la réduire. Rends la stylé »):
 * three sizes chosen by the user and remembered (réduit: the first line of the answer and the field; normal;
 * agrandi: nearly the whole screen for comfortable reading), with the header buttons or by dragging the grab
 * handle up or down; dark glass in the dark theme, frosted white in the light one, gold line of the coach.
 */
export function CoachAskPanel({ context, onAction, onClose, historyHref = COACH_HISTORY_ROUTE }: CoachAskPanelProps) {
  const ai = useCoachAi();
  const { catalog } = useCatalog(ai.enabled);
  const [q, setQ] = useState('');
  const [asked, setAsked] = useState('');
  const [answer, setAnswer] = useState<CoachAnswer | null>(null);
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState('');
  const last = useRef<{ techniqueId?: string; seed: number }>({ seed: 0 });
  const input = useRef<HTMLInputElement>(null);
  const answerBox = useRef<HTMLDivElement>(null);

  const speech: SpeechInput | null = useMemo(() => getSpeechInput({ allowOnline: ai.onlineSpeechOptIn }), [ai.onlineSpeechOptIn]);
  const examples = useMemo(() => exampleQuestions(context.discipline).slice(0, 4), [context.discipline]);
  const size = useSettings((s) => s.settings.coachPanelSize);
  const setSettings = useSettings((s) => s.set);
  const step = (d: 1 | -1) => {
    const next = COACH_PANEL_SIZES[COACH_PANEL_SIZES.indexOf(size) + d] as CoachPanelSize | undefined;
    if (next) setSettings({ coachPanelSize: next });
  };
  // 0.27 (Youssef, 2026-10-20 22:09): a double tap on the header or the grab handle switches normal and agrandi,
  // the same gesture as the fullscreen of the 3D coach
  const taps = useRef(createDoubleTap());
  const tapDown = (e: ReactPointerEvent) => {
    if ((e.target as Element).closest(TAP_CONTROLS)) return taps.current.cancel();
    taps.current.down(e.pointerId, e.clientX, e.clientY, e.timeStamp);
  };
  const tapUp = (e: ReactPointerEvent) => {
    if ((e.target as Element).closest(TAP_CONTROLS)) return taps.current.cancel(e.pointerId);
    if (taps.current.up(e.pointerId, e.clientX, e.clientY, e.timeStamp) === 'double') setSettings({ coachPanelSize: size === 'agrandi' ? 'normal' : 'agrandi' });
  };
  const grab = useRef<number | null>(null);
  const grabDown = (e: ReactPointerEvent) => {
    grab.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    tapDown(e);
  };
  const grabUp = (e: ReactPointerEvent) => {
    const y = grab.current;
    grab.current = null;
    if (y === null) return;
    const dy = e.clientY - y;
    if (dy <= -GRAB_STEP) step(1);
    else if (dy >= GRAB_STEP) step(-1);
    else return tapUp(e);
    taps.current.cancel();
  };
  const askedSet = useRef(new Set<string>());
  const lastSend = useRef({ q: '', at: 0 });
  const keyboard = useKeyboardInset();

  // questions about the screen, then about the movement being worked on, each one checked against the local engine;
  // 0.27: varied from one opening to the next (useSuggestionMemory, coach/suggest.ts)
  const memo = useSuggestionMemory();
  const forTechnique = useMemo(
    () => memo.pick({ ...context, preferences: { detail: ai.detail }, catalog }, 8),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [context.screen, context.techniqueId, context.discipline, context.level, context.guard, ai.detail, catalog, examples, memo.key],
  );
  const suggestions = useMemo(() => {
    if (!forTechnique.length) return answer?.suggestions?.length ? answer.suggestions : examples;
    const fresh = forTechnique.filter((s) => s !== asked && !askedSet.current.has(s));
    return fresh.length >= 2 ? fresh : forTechnique.filter((s) => s !== asked);
  }, [forTechnique, answer, asked, examples]);

  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    // no keyboard popping up over the coach on a phone: focus only with a mouse / trackpad
    if (window.matchMedia?.('(pointer: fine)').matches) input.current?.focus({ preventScroll: true });
    const key = (e: KeyboardEvent) => e.key === 'Escape' && close.current();
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('keydown', key);
      stopReply();
    };
  }, []);
  useEffect(() => () => speech?.stop(), [speech]);

  // une nouvelle technique à l’écran remplace la technique de la réponse précédente
  useEffect(() => {
    last.current.techniqueId = undefined;
  }, [context.techniqueId]);

  const ask = (question: string, suggested = false) => {
    const text = question.trim();
    if (!text) return;
    // a double tap sends once
    const now = performance.now();
    if (text === lastSend.current.q && now - lastSend.current.at < 800) return;
    lastSend.current = { q: text, at: now };
    // a suggestion is asked exactly as it was checked: about the movement on screen
    const lastTechniqueId = suggested ? undefined : last.current.techniqueId;
    const a = askCoach(text, { ...context, preferences: { detail: ai.detail }, catalog, lastTechniqueId, seed: last.current.seed });
    if (suggested) askedSet.current.add(text);
    if (a.intent === 'suggest_combo') last.current.seed++;
    if (a.techniqueId) last.current.techniqueId = a.techniqueId;
    setAsked(text);
    setAnswer(a);
    setQ('');
    answerBox.current?.scrollTo({ top: 0 });
    answerBox.current?.scrollIntoView?.({ block: 'nearest' });
    ai.push({ question: text, answer: a.text, intent: a.intent, techniqueId: a.techniqueId });
    if (ai.voiceReplies) speakReply(a.text);
    // les demandes de démo / ralenti / répétition s’exécutent tout de suite
    if (['demo', 'slow', 'repeat'].includes(a.intent) && a.actions[0]) onAction(a.actions[0]);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(q);
  };

  const mic = () => {
    if (!speech) return;
    if (listening) {
      speech.stop();
      setListening(false);
      return;
    }
    setMicError('');
    setListening(true);
    speech.start(
      (t) => {
        setListening(false);
        ask(t);
      },
      (m) => {
        setMicError(m);
        setListening(false);
      },
      () => setListening(false),
    );
  };

  if (!ai.enabled) {
    return (
      <section className="cai-panel size-normal" aria-label="Coach IA" data-testid="coach-ask-panel">
        <div className="cai-head">
          <div className="grow">
            <span className="cai-avatar" aria-hidden>
              <AppIcon id="coach" size={18} />
            </span>
            <h2>Coach IA</h2>
          </div>
          <button type="button" className="btn icon ghost" onClick={onClose} aria-label="Fermer">
            <AppIcon id="close" />
          </button>
        </div>
        <p className="small muted">Le coach IA est désactivé.</p>
        <div className="cai-foot">
          <Link to={historyHref}>Réactiver dans les réglages du coach</Link>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`cai-panel size-${size} ${keyboard.open ? 'kbd' : ''}`}
      data-size={size}
      style={keyboard.open ? ({ '--kb': `${keyboard.inset}px`, '--vvh': `${keyboard.height}px` } as React.CSSProperties) : undefined}
      aria-label="Demande au coach"
      data-testid="coach-ask-panel"
    >
      <div className="cai-grab" aria-hidden onPointerDown={grabDown} onPointerUp={grabUp} onPointerMove={(e) => taps.current.move(e.pointerId, e.clientX, e.clientY)} onPointerCancel={() => ((grab.current = null), taps.current.cancel())} data-testid="coach-grab">
        <i />
      </div>
      <div className="cai-head" onPointerDown={tapDown} onPointerUp={tapUp} onPointerMove={(e) => taps.current.move(e.pointerId, e.clientX, e.clientY)} data-testid="coach-head">
        <div className="grow">
          <span className="cai-avatar" aria-hidden>
            <AppIcon id="coach" size={18} />
          </span>
          <h2>Coach IA</h2>
          <span className="cai-badge" title="Réponses issues de la bibliothèque validée, calculées sur cet appareil">
            Hors ligne
          </span>
          {speech && !speech.offline && (
            <span className="cai-badge online" title="La saisie vocale du navigateur envoie l’audio à un service en ligne">
              Micro en ligne
            </span>
          )}
        </div>
        <button
          type="button"
          className="btn icon ghost cai-size"
          onClick={() => step(-1)}
          aria-label="Réduire la fenêtre du coach"
          aria-expanded={size !== 'reduit'}
          aria-disabled={size === 'reduit'}
          data-testid="coach-shrink"
        >
          <AppIcon id="panelShrink" size={20} />
        </button>
        <button
          type="button"
          className="btn icon ghost cai-size"
          onClick={() => step(1)}
          aria-label="Agrandir la fenêtre du coach"
          aria-expanded={size === 'agrandi'}
          aria-disabled={size === 'agrandi'}
          data-testid="coach-expand"
        >
          <AppIcon id="panelExpand" size={20} />
        </button>
        <Link to={historyHref} className="btn icon ghost cai-hist" aria-label="Historique et réglages du coach" title="Historique et réglages du coach" data-testid="coach-history-link">
          <AppIcon id="history" size={20} />
        </Link>
        <button type="button" className="btn icon ghost" onClick={onClose} aria-label="Fermer le coach">
          <AppIcon id="close" />
        </button>
      </div>

      <div ref={answerBox} className={`cai-answer ${answer ? '' : 'placeholder'}`} aria-live="polite" data-testid="coach-answer" tabIndex={answer ? 0 : -1}>
        {answer ? (
          <>
            <span className="q">« {asked} »</span>
            {answer.text}
          </>
        ) : (
          'Choisis ou écris ta question. Je ne te vois pas : j’explique et je montre.'
        )}
      </div>

      {size !== 'reduit' && answer && answer.actions.length > 0 && (
        <div className="cai-actions" data-testid="coach-actions">
          {answer.actions.map((a, i) => (
            <button key={`${a.type}-${i}`} type="button" className="btn secondary" onClick={() => onAction(a)}>
              {a.label}
            </button>
          ))}
        </div>
      )}

      {size !== 'reduit' && <SuggestRail questions={suggestions} onPick={(s) => ask(s, true)} label={answer ? 'Pour aller plus loin' : 'Suggestions'} />}

      <form className="cai-form" onSubmit={submit}>
        <label htmlFor="cai-q" className="sr-only">
          Ta question au coach
        </label>
        <input
          id="cai-q"
          ref={input}
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={listening ? 'Je t’écoute…' : 'Ta question…'}
          maxLength={300}
          enterKeyHint="send"
          autoComplete="off"
          data-testid="coach-input"
        />
        {speech && (
          <button type="button" className={`btn icon ${listening ? 'listening' : ''}`} onClick={mic} aria-pressed={listening} aria-label={listening ? 'Arrêter l’écoute' : 'Poser la question à voix haute (en ligne)'} title={speech.label}>
            <AppIcon id="mic" size={20} />
          </button>
        )}
        <button type="submit" className="btn icon send" aria-label="Envoyer" disabled={!q.trim()} data-testid="coach-send">
          <AppIcon id="send" size={20} />
        </button>
      </form>
      {micError && (
        <p className="small" role="alert" style={{ margin: 0, color: 'var(--red)' }}>
          {micError}
        </p>
      )}

    </section>
  );
}
