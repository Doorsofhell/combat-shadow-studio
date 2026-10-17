import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { askCoach, exampleQuestions, type CoachAction, type CoachAnswer, type CoachContext } from '../../coach/engine';
import { getSpeechInput, speakReply, stopReply, type SpeechInput } from '../../coach/speech';
import { useCatalog } from '../../store/catalog';
import { useCoachAi } from '../../store/coachAi';
import { IconClose } from '../icons';
import './coachAi.css';

export const COACH_HISTORY_ROUTE = '/coach-ia';

export interface CoachAskPanelProps {
  /** profil + séance en cours ; `preferences` et `catalog` sont complétés par le panneau */
  context: Omit<CoachContext, 'preferences' | 'catalog' | 'lastTechniqueId' | 'seed'>;
  /** action à exécuter par l’écran d’entraînement (démo, ralenti, répéter, lancer un exercice / une fiche) */
  onAction: (action: CoachAction) => void;
  onClose: () => void;
  /** lien vers l’historique et les réglages (par défaut /coach-ia) */
  historyHref?: string;
}

const IconSend = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 12h14M13 6l6 6-6 6" />
  </svg>
);
const IconMic = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);

/**
 * Panneau compact « Demande au coach » pour l’écran d’entraînement (thème clair). Répond en local
 * (base de connaissances validée) ; le bouton micro n’apparaît que si un moteur vocal est disponible.
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

  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    input.current?.focus({ preventScroll: true });
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

  const ask = (question: string) => {
    const text = question.trim();
    if (!text) return;
    const a = askCoach(text, { ...context, preferences: { detail: ai.detail }, catalog, lastTechniqueId: last.current.techniqueId, seed: last.current.seed });
    if (a.intent === 'suggest_combo') last.current.seed++;
    if (a.techniqueId) last.current.techniqueId = a.techniqueId;
    setAsked(text);
    setAnswer(a);
    setQ('');
    answerBox.current?.scrollTo({ top: 0 });
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
      <section className="cai-panel light-scope" aria-label="Coach IA" data-testid="coach-ask-panel">
        <div className="cai-head">
          <div className="grow">
            <h2>Coach IA</h2>
          </div>
          <button type="button" className="btn icon ghost" onClick={onClose} aria-label="Fermer">
            <IconClose />
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
    <section className="cai-panel light-scope" aria-label="Demande au coach" data-testid="coach-ask-panel">
      <div className="cai-head">
        <div className="grow">
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
        <Link to={historyHref} className="cai-hist" data-testid="coach-history-link">
          Historique
        </Link>
        <button type="button" className="btn icon ghost" onClick={onClose} aria-label="Fermer le coach">
          <IconClose />
        </button>
      </div>

      <div ref={answerBox} className={`cai-answer ${answer ? '' : 'placeholder'}`} aria-live="polite" data-testid="coach-answer" tabIndex={answer ? 0 : -1}>
        {answer ? (
          <>
            <span className="q">« {asked} »</span>
            {answer.text}
          </>
        ) : (
          'Pose ta question sur la technique en cours, l’équilibre, la respiration… Je ne te vois pas : je t’explique et je te montre.'
        )}
      </div>

      {answer && answer.actions.length > 0 && (
        <div className="cai-actions" data-testid="coach-actions">
          {answer.actions.map((a, i) => (
            <button key={`${a.type}-${i}`} type="button" className="btn secondary" onClick={() => onAction(a)}>
              {a.label}
            </button>
          ))}
        </div>
      )}

      {(!answer || answer.suggestions?.length) && (
        <div className="cai-suggest" aria-label="Exemples de questions">
          {(answer?.suggestions ?? examples).slice(0, 4).map((s) => (
            <button key={s} type="button" className="chip" onClick={() => ask(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

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
            <IconMic />
          </button>
        )}
        <button type="submit" className="btn icon send" aria-label="Envoyer" disabled={!q.trim()} data-testid="coach-send">
          <IconSend />
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
