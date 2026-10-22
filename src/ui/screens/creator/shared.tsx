import { useMemo } from 'react';
import { TECHNIQUE_BY_ID } from '../../../domain/techniques';
import { analysisState, type AnalysisState } from '../../../domain/comboAnalysis';
import type { Mastery } from '../../../store/goals';
import { useGoals } from '../../../store/goals';
import { sessionCount, useStats, type SessionRecord } from '../../../store/stats';
import type { CustomCombo } from '../../../store/custom';
import { TechniquePicto } from '../../pictos/TechniquePicto';

/**
 * v0.38 Créateur V2: what the list, the sheet and the editor share. Usage comes from the real history (sessions
 * recorded under `perso-<id>`, as the player has always done); the personal status reuses the technique mastery
 * store (goals.mastery) under the key `combo:<id>`; the score is only the stored local analysis, never a guess.
 */
export const masteryKey = (id: string) => `combo:${id}`;

export function useComboMastery(id: string): Mastery | undefined {
  return useGoals((s) => s.mastery[masteryKey(id)]);
}

export interface ComboUsage {
  /** training sessions (one per session, as in Progrès) */
  count: number;
  /** ISO date of the last start, or null when never used */
  last: string | null;
}

export function usageOf(id: string, sessions: readonly SessionRecord[]): ComboUsage {
  const mine = sessions.filter((s) => s.exerciseId === `perso-${id}`);
  let last: string | null = null;
  for (const s of mine) if (!last || s.start > last) last = s.start;
  return { count: sessionCount(mine), last };
}

export function useUsage(): (id: string) => ComboUsage {
  const sessions = useStats((s) => s.sessions);
  return useMemo(() => {
    const by = new Map<string, SessionRecord[]>();
    for (const s of sessions) if (s.exerciseId.startsWith('perso-')) by.set(s.exerciseId, [...(by.get(s.exerciseId) ?? []), s]);
    return (id: string) => usageOf(id, by.get(`perso-${id}`) ?? []);
  }, [sessions]);
}

export const dateFr = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

export const comboName = (c: Pick<CustomCombo, 'name' | 'sequence'>) => c.name.trim() || c.sequence.map((x) => TECHNIQUE_BY_ID.get(x)?.name ?? x).join(' → ');

/** the ring of the analysis score; « Non analysé » / « À refaire » when there is no valid stored analysis */
export function ScoreRing({ combo, size = 56, score }: { combo?: CustomCombo; size?: number; score?: number }) {
  const state: AnalysisState = score !== undefined ? 'ok' : combo ? analysisState(combo) : 'none';
  const value = score ?? (state === 'ok' ? combo!.analysis!.score : null);
  if (value === null) {
    return (
      <span className="score-ring none" style={{ width: size, height: size }} data-testid="score-ring" data-state={state} role="img" aria-label={state === 'stale' ? 'Analyse à refaire : l’enchaînement a changé' : 'Non analysé'}>
        <span>{state === 'stale' ? 'À refaire' : 'Non analysé'}</span>
      </span>
    );
  }
  const r = 42;
  const c = 2 * Math.PI * r;
  const tone = value >= 80 ? 'good' : value >= 60 ? 'mid' : 'low';
  return (
    <span className={`score-ring ${tone}`} style={{ width: size, height: size }} data-testid="score-ring" data-state="ok" role="img" aria-label={`Score de l’analyse : ${value} sur 100`}>
      <svg viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r={r} className="track" />
        <circle cx="50" cy="50" r={r} className="arc" strokeDasharray={`${(c * value) / 100} ${c}`} transform="rotate(-90 50 50)" />
      </svg>
      <b>{value}</b>
    </span>
  );
}

/** the first moves as pictograms, then « +N » */
export function PictoStrip({ sequence, max = 4, size = 30 }: { sequence: readonly string[]; max?: number; size?: number }) {
  const shown = sequence.length > max ? sequence.slice(0, max - 1) : sequence;
  const more = sequence.length - shown.length;
  return (
    <span className="picto-strip" aria-hidden>
      {shown.map((id, i) => (
        <span key={i} className="picto-cell">
          <TechniquePicto id={id} size={size} />
        </span>
      ))}
      {more > 0 && <span className="picto-cell more">+{more}</span>}
    </span>
  );
}

export function MasteryBadge({ m }: { m: Mastery | undefined }) {
  if (!m) return null;
  return (
    <span className={`mastery-badge ${m}`} data-testid="combo-mastery">
      {m === 'acquise' ? 'Acquis' : 'Encore du mal'}
    </span>
  );
}
