/**
 * The three kick-boxing rule sets (WAKO ring sports): K1, low kick and full contact. A technique is a
 * shared definition (techniques.ts); this file only says, per style, whether the rules allow it, with
 * the rule that says so. Sources: kbmt-S15 (WAKO low kick), kbmt-S16 (WAKO K1), kbmt-S45 (Ontario
 * amateur kick-boxing rules, the three disciplines). Rule numbers refer to those documents.
 */
import type { Exercise, Technique } from './types';

export type KbStyle = 'k1' | 'low-kick' | 'full-contact';
/** the user's choice: one style, or every technique of the discipline */
export type KbStyleChoice = KbStyle | 'tous';

export const KB_STYLES: { id: KbStyle; name: string; summary: string; sources: string[] }[] = [
  {
    id: 'k1',
    name: 'K1',
    summary: 'Poings, pieds et genoux. Coups de pied et genoux sur toute la jambe. Coudes interdits.',
    sources: ['kbmt-S16', 'kbmt-S45'],
  },
  {
    id: 'low-kick',
    name: 'Low kick',
    summary: 'Poings et pieds, coups de pied aux cuisses. Genoux et coudes interdits.',
    sources: ['kbmt-S15', 'kbmt-S45'],
  },
  {
    id: 'full-contact',
    name: 'Full contact',
    summary: 'Poings et pieds au-dessus de la ceinture. Pas de coup de pied aux jambes, ni genou, ni coude.',
    sources: ['kbmt-S45'],
  },
];

/** 'sans-objet': allowed by the rules but pointless in this style (a parry against a forbidden blow) */
export type KbStatus = 'autorise' | 'interdit' | 'sans-objet';

export interface KbRuling {
  status: KbStatus;
  /** what the rules say for this technique in this style */
  note?: string;
  sources: string[];
}

interface Rule {
  techniques: string[];
  styles: Record<KbStyle, KbRuling>;
}

const LOW_KICKS = ['low-kick-arriere', 'low-kick-avant'];
const CHECKS = ['check-avant', 'check-arriere'];
const KNEES = ['genou-direct-arriere', 'genou-direct-avant', 'genou-circulaire-arriere', 'genou-circulaire-avant'];
const ROUND_KICKS = ['roundhouse-arriere', 'roundhouse-avant', 'middle-kick-arriere', 'middle-kick-avant', 'high-kick-arriere', 'high-kick-avant'];
const FRONT_KICKS = ['front-kick-avant', 'front-kick-arriere'];

const RULES: Rule[] = [
  {
    techniques: LOW_KICKS,
    styles: {
      k1: {
        status: 'autorise',
        note: 'Toute la jambe, articulations comprises, selon la WAKO (art. 1). Le règlement de l’Ontario exclut les articulations (4.3, 6.3.1).',
        sources: ['kbmt-S16', 'kbmt-S45'],
      },
      'low-kick': {
        status: 'autorise',
        note: 'Cuisse seulement (intérieur, extérieur, arrière), au moins 3 cm au-dessus du genou. Bas de jambe interdit.',
        sources: ['kbmt-S15', 'kbmt-S45'],
      },
      'full-contact': { status: 'interdit', note: 'Coups de pied sous la ceinture interdits (7.1.1).', sources: ['kbmt-S45'] },
    },
  },
  {
    techniques: CHECKS,
    styles: {
      k1: { status: 'autorise', sources: ['kbmt-S16'] },
      'low-kick': { status: 'autorise', sources: ['kbmt-S15'] },
      'full-contact': { status: 'sans-objet', note: 'Parade contre les coups de pied aux jambes, interdits en full contact : non proposée dans ce style.', sources: ['kbmt-S45'] },
    },
  },
  {
    techniques: KNEES,
    styles: {
      k1: {
        status: 'autorise',
        note: 'Genoux au corps et aux jambes ; à la tête seulement chez les seniors (Ontario 3.3.3, 3.3.4). Saisir pour frapper est interdit (WAKO art. 4.3).',
        sources: ['kbmt-S16', 'kbmt-S45'],
      },
      'low-kick': { status: 'interdit', note: 'Genoux interdits (WAKO §7).', sources: ['kbmt-S15', 'kbmt-S45'] },
      'full-contact': { status: 'interdit', note: 'Genoux interdits (7.1.4).', sources: ['kbmt-S45'] },
    },
  },
  {
    techniques: ROUND_KICKS,
    styles: {
      k1: {
        status: 'autorise',
        note: 'Surface citée : pied protégé ou plante du pied (Ontario 3.3.2, 3.3.5). Le tibia n’y est pas cité.',
        sources: ['kbmt-S45'],
      },
      'low-kick': { status: 'autorise', note: 'Le tibia est une surface autorisée vers la tête, le corps et les cuisses (WAKO §6.2).', sources: ['kbmt-S15'] },
      'full-contact': { status: 'autorise', note: 'Touche avec le bas de la jambe : pied, cou-de-pied ou tibia (3.1.2). Cible au-dessus de la ceinture.', sources: ['kbmt-S45'] },
    },
  },
  {
    techniques: FRONT_KICKS,
    styles: {
      k1: { status: 'autorise', note: 'Vers le corps : un front kick sur la cuisse, le genou ou le tibia est interdit (WAKO art. 5).', sources: ['kbmt-S16'] },
      'low-kick': { status: 'autorise', note: 'Vers le corps : coup de pied poussé vers les jambes interdit (Ontario 5.2.1).', sources: ['kbmt-S45'] },
      'full-contact': { status: 'autorise', note: 'Vers le corps : coup de pied poussé vers les jambes interdit (5.1.1).', sources: ['kbmt-S45'] },
    },
  },
];

const BY_TECHNIQUE = new Map(RULES.flatMap((r) => r.techniques.map((id) => [id, r] as const)));

/** techniques of the discipline the three styles share: no rule restricts them */
const ALLOWED: KbRuling = { status: 'autorise', sources: [] };

export function kbRuling(techniqueId: string, style: KbStyle): KbRuling {
  return BY_TECHNIQUE.get(techniqueId)?.styles[style] ?? ALLOWED;
}

/** shown for this style: allowed (with 'tous', every kick-boxing technique) */
export function inKbStyle(techniqueId: string, choice: KbStyleChoice) {
  return choice === 'tous' || kbRuling(techniqueId, choice).status === 'autorise';
}

/** the styles whose rules allow a technique, when not all three do (for a badge in "Tous") */
export function kbOnlyIn(techniqueId: string): KbStyle[] | null {
  const ok = KB_STYLES.filter((s) => kbRuling(techniqueId, s.id).status === 'autorise').map((s) => s.id);
  return ok.length === KB_STYLES.length ? null : ok;
}

export const kbStyleName = (s: KbStyle) => KB_STYLES.find((x) => x.id === s)!.name;

/** filters kick-boxing techniques by style; other disciplines are not affected */
export function filterTechniques(list: Technique[], discipline: string, choice: KbStyleChoice) {
  return discipline === 'kickboxing' ? list.filter((t) => inKbStyle(t.id, choice)) : list;
}

/** a kick-boxing exercise belongs to a style when every move of it does */
export function filterExercises(list: Exercise[], choice: KbStyleChoice) {
  return list.filter((e) => e.discipline !== 'kickboxing' || e.sequence.every((id) => inKbStyle(id, choice)));
}
