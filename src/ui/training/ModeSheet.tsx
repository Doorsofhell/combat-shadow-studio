import { useState } from 'react';
import type { TrainingMode } from '../../domain/types';
import { useSettings } from '../../store/settings';
import { Sheet, SheetLeaveButton } from '../components/Sheet';
import { RoundOptions } from '../screens/Discipline';
import { AppIcon } from '../icons';
import { MODE_HELP, MODE_LABEL } from './plan';
import { CardioOptionsPicker, ChronoOptions, cardioParams } from './TimerOptions';

/** the four modes a single exercise can be played in (the same as the exercise sheet) */
export const SESSION_MODES: TrainingMode[] = ['libre', 'technique', 'cardio', 'rounds'];

/** the keys of the address that belong to the mode (the rest, the exercise itself, is kept) */
const MODE_KEYS = ['mode', 'round', 'rest', 'rounds', 'cw', 'cr', 'cc', 'ci', 'reprise'];

/**
 * the address of the same session in another mode: the exercise stays, the mode and its settings change (the Cardio
 * intervals and the rounds chosen go with it, like from the exercise sheet)
 */
export function withMode(q: URLSearchParams, mode: TrainingMode, o: { round: number; rest: number; rounds: number; cardio: Record<string, string> }) {
  const p = new URLSearchParams(q);
  for (const k of MODE_KEYS) p.delete(k);
  p.set('mode', mode);
  if (mode === 'cardio') for (const [k, v] of Object.entries(o.cardio)) p.set(k, v);
  if (mode === 'rounds') {
    p.set('round', String(o.round));
    p.set('rest', String(o.rest));
    p.set('rounds', String(o.rounds));
  }
  return p;
}

/**
 * 2.10.8 (Youssef, 2026-11-27, « Parcours des écrans », conseil 1): « Commencer » on the home opens the session ready to
 * start, in the last mode used; the mode is chosen here, in the session's « Plus » menu, before pressing « Démarrer ».
 * The same choices as the exercise sheet: Libre, Technique, Cardio (its intervals), Rounds (duration, rest, number).
 */
export function ModeSheet({ current, onApply, onClose }: { current: TrainingMode; onApply: (mode: TrainingMode, o: { round: number; rest: number; rounds: number; cardio: Record<string, string> }) => void; onClose: () => void }) {
  const settings = useSettings((s) => s.settings);
  const [mode, setMode] = useState<TrainingMode>(SESSION_MODES.includes(current) ? current : 'libre');
  const [round, setRound] = useState(settings.defaultRoundSec);
  const [rest, setRest] = useState(settings.defaultRestSec);
  const [rounds, setRounds] = useState(3);
  return (
    <Sheet
      title="Mode de la séance"
      onClose={onClose}
      testId="mode-sheet"
      footer={
        <SheetLeaveButton className="btn primary block lg" onLeave={() => onApply(mode, { round, rest, rounds, cardio: cardioParams(settings.cardio) })} data-testid="mode-apply">
          <AppIcon id="check" /> {mode === current ? 'Garder ce mode' : `Passer en ${MODE_LABEL[mode]}`}
        </SheetLeaveButton>
      }
    >
      <div className="stack">
        <span className="label" id="session-mode-label">
          Mode
        </span>
        <div className="row" role="radiogroup" aria-labelledby="session-mode-label" style={{ gap: 8 }}>
          {SESSION_MODES.map((m) => (
            <button key={m} type="button" role="radio" aria-checked={mode === m} className={`chip ${mode === m ? 'on' : ''}`} onClick={() => setMode(m)} data-testid={`session-mode-${m}`}>
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>
        <p className="small muted">{MODE_HELP[mode]}</p>
      </div>
      {mode === 'rounds' && <RoundOptions round={round} rest={rest} rounds={rounds} setRound={setRound} setRest={setRest} setRounds={setRounds} />}
      {mode === 'cardio' && <CardioOptionsPicker />}
      {(mode === 'rounds' || mode === 'cardio') && <ChronoOptions />}
    </Sheet>
  );
}
