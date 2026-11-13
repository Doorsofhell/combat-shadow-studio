import { analyseCombo, type StoredAnalysis } from '../../../domain/comboAnalysis';
import type { DisciplineId } from '../../../domain/types';
import { contentChanged, newComboId, useCustom, type CustomCombo } from '../../../store/custom';
import { useGoals } from '../../../store/goals';
import { masteryKey } from './shared';

/**
 * v0.38 Créateur V2: the writes of the creator, outside the screens so the rules are tested once.
 * - a new sequence gets a new id; editing keeps the id, so the history (`perso-<id>`) and the personal status follow;
 * - updatedAt moves only when the name, the discipline or the moves really change;
 * - the local analysis is stored with the hash of what it analysed (it is recomputed on every real change);
 * - duplicating makes a new id and copies no statistics, status or dates;
 * - deleting removes the sequence (the sync turns it into a tombstone on the account) and its personal status; the
 *   training history stays, as for any other exercise.
 */
export function stored(discipline: DisciplineId, sequence: string[], now: string): StoredAnalysis {
  const a = analyseCombo(discipline, sequence);
  return { hash: a.hash, version: a.version, at: now, score: a.score };
}

export function saveCombo(draft: { id?: string; name: string; discipline: DisciplineId; sequence: string[] }, now = new Date().toISOString()): CustomCombo {
  const { combos, save } = useCustom.getState();
  const old = draft.id ? combos.find((c) => c.id === draft.id) : undefined;
  let next: CustomCombo;
  if (!old) {
    next = { id: draft.id ?? newComboId(), name: draft.name, discipline: draft.discipline, sequence: draft.sequence, createdAt: now, analysis: stored(draft.discipline, draft.sequence, now) };
  } else if (contentChanged(old, draft)) {
    const movesChanged = old.discipline !== draft.discipline || old.sequence.join(',') !== draft.sequence.join(',');
    next = { ...old, name: draft.name, discipline: draft.discipline, sequence: draft.sequence, updatedAt: now, analysis: movesChanged || !old.analysis ? stored(draft.discipline, draft.sequence, now) : old.analysis };
  } else {
    return old;
  }
  save(next);
  return next;
}

/** analyses a saved sequence made before v0.38 (or with an older version of the rules), without touching its dates */
export function analyseSaved(id: string, now = new Date().toISOString()) {
  const { combos, save } = useCustom.getState();
  const c = combos.find((x) => x.id === id);
  if (c) save({ ...c, analysis: stored(c.discipline, c.sequence, now) });
}

export function duplicateCombo(id: string, now = new Date().toISOString()): CustomCombo | null {
  const { combos, save } = useCustom.getState();
  const c = combos.find((x) => x.id === id);
  if (!c) return null;
  const copy: CustomCombo = { id: newComboId(), name: `${c.name} (copie)`, discipline: c.discipline, sequence: [...c.sequence], createdAt: now, analysis: stored(c.discipline, c.sequence, now) };
  save(copy);
  return copy;
}

export function deleteCombo(id: string) {
  useCustom.getState().remove(id);
  const key = masteryKey(id);
  if (useGoals.getState().mastery[key]) {
    useGoals.setState((s) => {
      const mastery = { ...s.mastery };
      delete mastery[key];
      return { mastery };
    });
  }
}
