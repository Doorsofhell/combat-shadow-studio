import { CATEGORY_LABEL, TECHNIQUE_BY_ID } from './techniques';
import { validateSequence } from './transitions';
import type { DisciplineId, Technique } from './types';

/**
 * v0.38 (Youssef, 2026-10-22, « Créateur d'enchaînements V2 »): the analysis of a user's sequence. It is computed on
 * the device from fixed, readable rules (no generative AI, no network, no hidden model): the same sequence always
 * gets the same result, and every point of the score is explained by a criterion the user can read. It judges the
 * ORDER of the moves only: it never sees how the user performs them.
 *
 * Five criteria, weighted: cohérence .25 (the checks of transitions.ts), fluidité .2 (how one move leads to the
 * next), variété .15, défense / sécurité .2 (adapted to the discipline), faisabilité .2 (length, solo practice).
 * Bump ANALYSIS_VERSION whenever a rule changes: stored analyses of an older version are shown as « à refaire ».
 */
export const ANALYSIS_VERSION = 1;

export type CriterionId = 'coherence' | 'fluidite' | 'variete' | 'defense' | 'faisabilite';

export interface Criterion {
  id: CriterionId;
  label: string;
  /** 0 to 100 */
  score: number;
  weight: number;
  /** what was measured, in plain words */
  detail: string;
}

export interface ComboAnalysis {
  version: number;
  /** of the discipline and the moves: a stored analysis is valid only while it matches */
  hash: string;
  /** 0 to 100, weighted mean of the criteria */
  score: number;
  verdict: string;
  criteria: Criterion[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  explanation: string;
  limits: string[];
}

/** what a saved sequence keeps of its last analysis */
export interface StoredAnalysis {
  hash: string;
  version: number;
  at: string;
  score: number;
}

/** FNV-1a 32 bits of the discipline and the ordered moves */
export function comboHash(discipline: DisciplineId, sequence: readonly string[]): string {
  let h = 0x811c9dc5;
  const s = `${discipline}|${sequence.join(',')}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export type AnalysisState = 'ok' | 'none' | 'stale';

/** whether the stored analysis still describes this sequence */
export function analysisState(c: { discipline: DisciplineId; sequence: readonly string[]; analysis?: StoredAnalysis }): AnalysisState {
  if (!c.analysis) return 'none';
  return c.analysis.version === ANALYSIS_VERSION && c.analysis.hash === comboHash(c.discipline, c.sequence) ? 'ok' : 'stale';
}

export const WEIGHTS: Record<CriterionId, number> = { coherence: 0.25, fluidite: 0.2, variete: 0.15, defense: 0.2, faisabilite: 0.2 };

const STRIKES = new Set(['poing', 'pied', 'genou', 'coude', 'clinch']);
const COVER = new Set(['defense', 'deplacement']);
const GRAPPLING: DisciplineId[] = ['bjj', 'judo'];

/** the side a strike comes from: lead (avant) or rear (arrière); null when it has none */
export function sideOf(t: Technique): 'avant' | 'arriere' | null {
  if (!STRIKES.has(t.category) && t.category !== 'feinte') return null;
  if (/(^|-)avant($|-)/.test(t.id) || t.id.startsWith('jab') || t.id === 'check-hook' || t.id === 'feinte-jab') return 'avant';
  if (/(^|-)arriere($|-)/.test(t.id) || t.id.startsWith('direct') || t.id === 'overhand') return 'arriere';
  return null;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function verdictOf(score: number): string {
  return score >= 80 ? 'Très bon' : score >= 60 ? 'Bon' : score >= 40 ? 'À travailler' : 'À revoir';
}

/** a real technique of the discipline to name in a recommendation, first that exists */
function pick(d: DisciplineId, ids: string[]): string | null {
  for (const id of ids) {
    const t = TECHNIQUE_BY_ID.get(id);
    if (t && t.disciplines.includes(d)) return `« ${t.name} »`;
  }
  return null;
}

export function analyseCombo(discipline: DisciplineId, sequence: readonly string[]): ComboAnalysis {
  const seq = [...sequence];
  const moves = seq.map((id) => TECHNIQUE_BY_ID.get(id)).filter((t): t is Technique => !!t);
  const issues = validateSequence(seq, discipline);
  const errors = issues.filter((i) => i.level === 'erreur');
  const warnings = issues.filter((i) => i.level === 'attention');
  const grappling = GRAPPLING.includes(discipline);
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recos: string[] = [];

  // 1. cohérence: the checks the creator already shows (body state, discipline, distance)
  const coherence = clamp(100 - 40 * errors.length - 12 * warnings.length);
  const cohDetail = errors.length
    ? `${errors.length} erreur${errors.length > 1 ? 's' : ''} bloquante${errors.length > 1 ? 's' : ''}${warnings.length ? ` et ${warnings.length} point${warnings.length > 1 ? 's' : ''} d’attention` : ''}.`
    : warnings.length
      ? `${warnings.length} point${warnings.length > 1 ? 's' : ''} d’attention (distance, fin au sol, longueur).`
      : 'Chaque mouvement est autorisé dans la discipline et part de la bonne position.';
  if (errors.length) for (const e of errors) recos.push(e.index !== undefined ? `Mouvement ${e.index + 1} : ${e.message}` : e.message);

  // 2. fluidité: how each move leads to the next
  const marks: number[] = [];
  let rearTwice = 0;
  let rangeJumps = 0;
  let throwsUnprepared = 0;
  let pauses = 0;
  for (let i = 1; i < moves.length; i++) {
    const a = moves[i - 1];
    const b = moves[i];
    const jump = warnings.some((w) => w.index === i && /distance|reprendre de la distance|pas d’avancée/.test(w.message));
    if (jump) {
      rangeJumps++;
      marks.push(0);
      continue;
    }
    if (b.category === 'projection' && b.id !== 'kuzushi' && !['kuzushi', 'kumikata', 'deplacement'].some((k) => a.id === k || a.category === k)) {
      throwsUnprepared++;
      marks.push(0.6);
      continue;
    }
    if (b.category === 'garde' && i < moves.length - 1) {
      pauses++;
      marks.push(0.75);
      continue;
    }
    const sa = sideOf(a);
    const sb = sideOf(b);
    if (sa === 'arriere' && sb === 'arriere' && STRIKES.has(a.category) && STRIKES.has(b.category)) {
      rearTwice++;
      marks.push(a.motion === b.motion && a.category === 'pied' ? 0.4 : 0.5);
      continue;
    }
    marks.push(1);
  }
  const fluidite = marks.length ? clamp((100 * marks.reduce((x, y) => x + y, 0)) / marks.length) : 70;
  const fluParts: string[] = [];
  if (!marks.length) fluParts.push('Un seul mouvement : aucune transition à évaluer.');
  else {
    const natural = marks.filter((m) => m === 1).length;
    fluParts.push(`${natural} transition${natural > 1 ? 's' : ''} naturelle${natural > 1 ? 's' : ''} sur ${marks.length}.`);
  }
  if (rearTwice) fluParts.push(`${rearTwice} fois deux frappes du bras ou de la jambe arrière de suite.`);
  if (rangeJumps) fluParts.push(`${rangeJumps} changement${rangeJumps > 1 ? 's' : ''} de distance sans pas.`);
  if (throwsUnprepared) fluParts.push(`${throwsUnprepared} entrée${throwsUnprepared > 1 ? 's' : ''} de projection sans déséquilibre avant.`);
  if (pauses) fluParts.push(`${pauses} retour${pauses > 1 ? 's' : ''} en garde au milieu.`);
  if (rearTwice) recos.push('Alterne avant et arrière : après une frappe arrière, la suivante part plus vite du côté avant (le corps est déjà tourné).');
  if (rangeJumps) recos.push('Ajoute un pas (avant ou arrière) là où la distance change entre deux coups.');
  if (throwsUnprepared) recos.push(`Prépare chaque projection par un déséquilibre${pick(discipline, ['kuzushi']) ? ` (${pick(discipline, ['kuzushi'])})` : ''} : en judo, on déséquilibre avant de placer la projection.`);

  // 3. variété
  const distinct = new Set(seq).size;
  const cats = new Set(moves.map((t) => t.category));
  const variete = moves.length ? clamp(100 * (0.6 * (distinct / moves.length) + 0.4 * (Math.min(cats.size, 3) / 3))) : 0;
  const varDetail = `${distinct} mouvement${distinct > 1 ? 's' : ''} différent${distinct > 1 ? 's' : ''} sur ${moves.length}, ${cats.size} famille${cats.size > 1 ? 's' : ''} (${[...cats].map((c) => CATEGORY_LABEL[c].toLowerCase()).join(', ')}).`;
  if (moves.length >= 3 && distinct / moves.length < 0.6) recos.push('Plusieurs mouvements se répètent : remplace un doublon par une autre technique de la même famille.');

  // 4. défense / sécurité, adapted to the discipline
  let defense: number;
  let defLabel: string;
  let defDetail: string;
  const last = moves[moves.length - 1];
  if (discipline === 'judo') {
    defLabel = 'Équilibre et sécurité';
    const balancedEnd = !!last && (['garde', 'deplacement', 'chute'].includes(last.category) || last.id === 'kuzushi');
    defense = balancedEnd ? 100 : 70;
    defDetail = balancedEnd ? 'L’enchaînement se termine en position stable.' : 'L’enchaînement se termine sur une entrée de projection, sans retour en garde.';
    if (!balancedEnd) recos.push(`Termine par un retour en garde ou un déplacement${pick(discipline, ['tsugi-ashi-arriere', 'shizen-tai']) ? ` (${pick(discipline, ['tsugi-ashi-arriere', 'shizen-tai'])})` : ''} pour retrouver l’équilibre.`);
  } else if (discipline === 'bjj') {
    defLabel = 'Protection au sol';
    const protect = moves.some((t) => ['retention-garde', 'sortie-hanche', 'pont', 'releve-technique', 'releve-genoux', 'garde-bjj'].includes(t.id));
    const endsGround = warnings.some((w) => /finit au sol/.test(w.message));
    defense = clamp((protect ? 100 : 55) - (endsGround ? 15 : 0));
    defDetail = `${protect ? 'Contient un mouvement de protection (garde, sortie de hanche, pont ou relevé).' : 'Aucun mouvement de protection.'}${endsGround ? ' Finit au sol.' : ''}`;
    if (!protect) recos.push(`Ajoute un mouvement de protection${pick(discipline, ['sortie-hanche', 'retention-garde']) ? ` comme ${pick(discipline, ['sortie-hanche', 'retention-garde'])}` : ''}.`);
  } else {
    defLabel = 'Défense et sortie';
    const covers = moves.filter((t) => COVER.has(t.category) || t.id === 'sprawl' || t.id === 'defense-lutte');
    const endsCovered = !!last && (COVER.has(last.category) || last.id === 'sprawl' || last.category === 'garde');
    defense = endsCovered ? 100 : covers.length ? 75 : moves.length <= 2 ? 50 : 30;
    defDetail = endsCovered ? 'Se termine par une défense ou un déplacement : tu ne restes pas exposé après l’attaque.' : covers.length ? `${covers.length} défense${covers.length > 1 ? 's' : ''} ou déplacement${covers.length > 1 ? 's' : ''}, mais la fin reste exposée.` : 'Aucune défense ni déplacement.';
    if (!endsCovered) {
      const name = pick(discipline, discipline === 'mma' ? ['sprawl', 'retrait'] : discipline === 'boxe' ? ['esquive-droite', 'retrait'] : ['check-avant', 'retrait']);
      recos.push(`Termine par une défense ou une sortie${name ? `, par exemple ${name}` : ''}, pour ne pas rester à portée après la dernière frappe.`);
    }
  }

  // 5. faisabilité: length for memory and solo practice
  const n = moves.length;
  let feas = n === 0 ? 0 : n === 1 ? 50 : n === 2 ? 80 : n <= 6 ? 100 : n <= 8 ? 85 : n <= 12 ? 65 : 40;
  const kicks = moves.filter((t) => t.category === 'pied').length;
  if (kicks >= 4) feas -= 10;
  const partner = moves.filter((t) => t.mode === 'partenaire').length;
  feas -= 15 * partner;
  const faisabilite = clamp(feas);
  const feaDetail = `${n} mouvement${n > 1 ? 's' : ''}${n >= 3 && n <= 6 ? ' : longueur idéale pour mémoriser' : n > 6 ? ' : long à mémoriser' : ' : court'}${kicks >= 4 ? `, ${kicks} coups de pied (équilibre et fatigue)` : ''}${partner ? `, ${partner} demandant un partenaire` : ''}.`;
  if (n > 0 && n < 3) recos.push('Ajoute un ou deux mouvements : 3 à 6 mouvements donnent un enchaînement complet et facile à retenir.');
  if (n > 8) recos.push('Découpe l’enchaînement en deux plus courts : au-delà de 8 mouvements, il devient difficile à mémoriser.');

  const criteria: Criterion[] = [
    { id: 'coherence', label: 'Cohérence', score: coherence, weight: WEIGHTS.coherence, detail: cohDetail },
    { id: 'fluidite', label: 'Fluidité', score: fluidite, weight: WEIGHTS.fluidite, detail: fluParts.join(' ') },
    { id: 'variete', label: 'Variété', score: variete, weight: WEIGHTS.variete, detail: varDetail },
    { id: 'defense', label: defLabel, score: defense, weight: WEIGHTS.defense, detail: defDetail },
    { id: 'faisabilite', label: 'Faisabilité', score: faisabilite, weight: WEIGHTS.faisabilite, detail: feaDetail },
  ];
  const score = clamp(criteria.reduce((s, c) => s + c.score * c.weight, 0));

  const STRONG: Record<CriterionId, string> = {
    coherence: 'Enchaînement cohérent : chaque mouvement part de la bonne position.',
    fluidite: 'Transitions naturelles : les mouvements s’enchaînent sans temps mort.',
    variete: 'Bonne variété de mouvements et de familles.',
    defense: grappling ? (discipline === 'judo' ? 'Tu finis équilibré.' : 'Tu gardes une protection au sol.') : 'Tu ne restes pas exposé après l’attaque.',
    faisabilite: 'Longueur adaptée pour mémoriser et répéter seul.',
  };
  const WEAK: Record<CriterionId, string> = {
    coherence: 'Des mouvements ne s’enchaînent pas correctement (position ou discipline).',
    fluidite: 'Certaines transitions cassent le rythme.',
    variete: 'Peu de variété : mêmes mouvements ou une seule famille.',
    defense: grappling ? (discipline === 'judo' ? 'La fin laisse en déséquilibre.' : 'Peu de protection au sol.') : 'Pas de défense ni de sortie : tu restes exposé.',
    faisabilite: n > 6 ? 'Long à mémoriser.' : 'Très court.',
  };
  for (const c of criteria) {
    if (c.score >= 80) strengths.push(STRONG[c.id]);
    else if (c.score < 60) weaknesses.push(WEAK[c.id]);
  }
  if (!recos.length) recos.push('Rien à corriger selon les règles de l’analyse : travaille la vitesse et la précision, puis ajoute une variante.');

  return {
    version: ANALYSIS_VERSION,
    hash: comboHash(discipline, seq),
    score,
    verdict: verdictOf(score),
    criteria,
    strengths,
    weaknesses,
    recommendations: [...new Set(recos)],
    explanation:
      'Analyse calculée sur ton appareil à partir de règles fixes et lisibles, pas par une intelligence artificielle générative. Chaque critère reçoit une note sur 100, puis la note globale est leur moyenne pondérée : cohérence 25 %, fluidité 20 %, variété 15 %, défense ou sécurité 20 %, faisabilité 20 %. Le même enchaînement donne toujours le même résultat.',
    limits: [
      'L’analyse juge l’ordre des mouvements, pas ton exécution : elle ne te voit pas.',
      'Les règles sont générales ; un entraîneur peut avoir de bonnes raisons de faire autrement.',
      'Elle ne tient pas compte de ton adversaire, de ta morphologie ni de ta condition physique.',
    ],
  };
}

