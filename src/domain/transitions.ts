import { TECHNIQUE_BY_ID } from './techniques';
import type { DisciplineId, Technique } from './types';

export type BodyState = 'stand' | 'ground';
export type Range = 'long' | 'moyenne' | 'courte' | 'neutre';

/** Body state before / after each technique that leaves the standing position. */
const STATES: Record<string, [BodyState, BodyState]> = {
  'descente-sol': ['stand', 'ground'],
  'sortie-hanche': ['ground', 'ground'],
  'releve-technique': ['ground', 'stand'],
};

export function statesOf(id: string): [BodyState, BodyState] {
  return STATES[id] ?? ['stand', 'stand'];
}

/** Fighting distance of a technique, used to flag sequences that need a step in between. */
export function rangeOf(t: Technique): Range {
  if (['coude', 'genou', 'clinch'].includes(t.category)) return 'courte';
  if (t.id.startsWith('uppercut')) return 'courte';
  if (t.category === 'pied') return 'long';
  if (t.id === 'jab' || t.id === 'direct' || t.id === 'entree-lutte') return 'long';
  if (t.category === 'poing') return 'moyenne';
  return 'neutre';
}

export interface Issue {
  level: 'erreur' | 'attention' | 'info';
  index?: number;
  message: string;
}

const DISC_NAME: Record<DisciplineId, string> = { boxe: 'la boxe anglaise', kickboxing: 'le kick-boxing', mma: 'le MMA', muaythai: 'le muay-thaï' };

/**
 * Checks a user-built sequence: unknown or forbidden techniques for the discipline, impossible body
 * states (standing up when already standing...), distance jumps that need a step, and whether the
 * coach will need to reposition between repetitions.
 */
export function validateSequence(seq: string[], discipline: DisciplineId): Issue[] {
  const issues: Issue[] = [];
  if (seq.length === 0) return [{ level: 'erreur', message: 'Ajoute au moins un mouvement.' }];
  if (seq.length > 12) issues.push({ level: 'attention', message: 'Plus de 12 mouvements : difficile à mémoriser, pense à découper l’enchaînement.' });
  let state = 'stand' as BodyState;
  let prev: Technique | undefined;
  let travel = 0;
  seq.forEach((id, i) => {
    const t = TECHNIQUE_BY_ID.get(id);
    if (!t) {
      issues.push({ level: 'erreur', index: i, message: `Mouvement inconnu : ${id}.` });
      return;
    }
    if (!t.disciplines.includes(discipline)) {
      issues.push({ level: 'erreur', index: i, message: `${t.name} n’est pas autorisé dans ${DISC_NAME[discipline]}.` });
    }
    const [from, to] = statesOf(id);
    if (from !== state) {
      issues.push({
        level: 'erreur',
        index: i,
        message: from === 'ground' ? `${t.name} se fait au sol : ajoute d’abord « Descente contrôlée au sol ».` : `${t.name} se fait debout : ajoute d’abord « Relevé technique ».`,
      });
    }
    state = to;
    if (prev && state === 'stand') {
      const a = rangeOf(prev);
      const b = rangeOf(t);
      if (a === 'long' && b === 'courte' && prev.category === 'pied') {
        issues.push({ level: 'attention', index: i, message: `${prev.name} puis ${t.name} : la distance change beaucoup, un pas d’avancée est nécessaire.` });
      }
      if (a === 'courte' && b === 'long' && t.category === 'pied' && !t.id.startsWith('teep')) {
        issues.push({ level: 'attention', index: i, message: `${prev.name} puis ${t.name} : il faut reprendre de la distance avant le coup de pied.` });
      }
      if (prev.category === 'pied' && t.category === 'pied' && prev.motion === t.motion) {
        issues.push({ level: 'info', index: i, message: `Deux ${t.name} de suite : le pied repose en garde entre les deux.` });
      }
    }
    if (t.category === 'deplacement') travel++;
    if (t.soloNote) issues.push({ level: 'info', index: i, message: t.soloNote });
    prev = t;
  });
  if (state === 'ground') issues.push({ level: 'attention', message: 'L’enchaînement finit au sol : le coach ajoutera un relevé technique avant de recommencer.' });
  if (travel > 0) issues.push({ level: 'info', message: 'Les déplacements font bouger le coach : il se repositionne automatiquement entre deux répétitions.' });
  return dedupe(issues);
}

function dedupe(list: Issue[]) {
  const seen = new Set<string>();
  return list.filter((i) => (seen.has(i.message) ? false : (seen.add(i.message), true)));
}

export const isPlayable = (issues: Issue[]) => !issues.some((i) => i.level === 'erreur');
