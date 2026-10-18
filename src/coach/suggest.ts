import { TECHNIQUE_BY_ID } from '../domain/techniques';
import type { Technique } from '../domain/types';
import { askCoach, theName, type CoachAnswer, type CoachContext } from './engine';
import { knowledgeBase } from './knowledge';
import { family } from './nlu';

/**
 * Suggested questions for the technique on screen. Each candidate names what its answer must rest
 * on (a FAQ entry of the library or the technique's own sheet) and is kept only if the local engine
 * really answers it from there: nothing is suggested that the coach cannot answer usefully.
 */
interface Candidate {
  q: string;
  /** the answer must cite this library entry (faq:…) or be about this technique (tech:…) */
  expect: string;
}

/** how a learner asks about each FAQ entry, in their own words */
const FAQ_QUESTION: Record<string, string> = {
  'faq:pivot-pied-arriere': 'Comment bien pivoter mon pied arrière ?',
  'faq:rotation-hanches': 'Comment utiliser ma hanche pour frapper ?',
  'faq:garde': 'Où placer ma main avant ?',
  'faq:menton': 'Pourquoi garder le menton rentré ?',
  'faq:retour-garde': 'Comment revenir rapidement en garde ?',
  'faq:deplacements': 'Comment me déplacer sans croiser les pieds ?',
  'faq:equilibre-pieds': 'Comment garder mon équilibre sur un coup de pied ?',
  'faq:respiration': 'Comment respirer quand je frappe ?',
  'faq:jab-direct': 'Quelle est la différence entre jab et direct ?',
  'faq:crochet-uppercut': 'Quelle est la différence entre crochet et uppercut ?',
  'faq:teep': 'À quoi sert le teep ?',
  'faq:genoux': 'Comment bien donner un coup de genou ?',
  'faq:coudes': 'Comment bien porter un coup de coude ?',
  'faq:sprawl': 'Où placer mes hanches pendant le sprawl ?',
  'faq:puissance-vitesse': 'Comment frapper plus fort sans perdre en vitesse ?',
  'faq:hauteurs-kicks': 'Quelle est la différence entre low, middle et high kick ?',
  'faq:distance': 'Comment gérer la distance ?',
};

/** FAQ entries that matter for a whole family of techniques, beyond those the library links */
const BY_CATEGORY: Partial<Record<Technique['category'], string[]>> = {
  poing: ['faq:garde', 'faq:retour-garde', 'faq:respiration'],
  coude: ['faq:garde', 'faq:retour-garde'],
  pied: ['faq:equilibre-pieds', 'faq:retour-garde'],
  genou: ['faq:equilibre-pieds', 'faq:retour-garde'],
  feinte: ['faq:garde', 'faq:retour-garde'],
  deplacement: ['faq:deplacements', 'faq:garde'],
  garde: ['faq:menton'],
  defense: ['faq:garde', 'faq:retour-garde', 'faq:menton', 'faq:distance'],
  lutte: ['faq:sprawl', 'faq:distance', 'faq:retour-garde'],
  sol: [],
  projection: [],
  clinch: ['faq:genoux'],
};

/** questions a learner asks about one technique in particular (answered by its sheet or its FAQ) */
const BY_TECHNIQUE: Record<string, string[]> = {
  'descente-sol': ['Comment descendre au sol sans me faire mal ?'],
  'sortie-hanche': ['À quoi sert la sortie de hanche ?', 'Comment pousser avec mes pieds pendant le shrimp ?'],
  'releve-technique': ['Comment me relever en sécurité ?'],
  'garde-bjj': ['Où placer mes mains en posture de grappling ?', 'Comment placer mes pieds en posture de grappling ?'],
  pont: ['Pourquoi faire le pont ?', 'Où placer mes pieds pendant le pont ?'],
  'retention-garde': ['À quoi sert la rétention de garde ?', 'Comment garder mes jambes en cadre ?'],
  'changement-base': ['À quoi sert le changement de base ?', 'Où placer mes mains à quatre appuis ?'],
  'shizen-tai': ['Où placer mes mains en shizen-tai ?', 'Comment placer mes pieds en shizen-tai ?'],
  'tsugi-ashi-avant': ['Pourquoi ne pas croiser les pieds ?'],
  'tsugi-ashi-arriere': ['Pourquoi ne pas croiser les pieds ?'],
  'tsugi-ashi-lateral': ['Pourquoi ne pas croiser les pieds ?'],
  'tai-sabaki': ['Comment pivoter sur le pied avant ?', 'À quoi sert le tai-sabaki ?'],
  kuzushi: ['À quoi sert le kuzushi ?', 'Comment tirer avec tout le corps ?', 'Comment éviter de perdre l’équilibre ?'],
  'uchikomi-seoi': ['Pourquoi fléchir les genoux pendant l’uchikomi ?', 'Où placer mes pieds pendant l’uchikomi ?', 'Comment éviter de perdre l’équilibre ?'],
  sprawl: [
    'Comment lancer mes jambes en arrière pendant le sprawl ?',
    'Où placer mes hanches pendant le sprawl ?',
    'Comment garder mes appuis pendant le sprawl ?',
    'Comment remonter en garde après le sprawl ?',
    'Pourquoi faire un sprawl ?',
  ],
};

/** reading order: body mechanics first, then balance and guard, comparisons, the sheet, the rest */
const RANK: Record<string, number> = {
  'faq:pivot-pied-arriere': 0,
  'faq:rotation-hanches': 1,
  'faq:garde': 2,
  'faq:genoux': 2,
  'faq:coudes': 2,
  'faq:teep': 2,
  'faq:sprawl': 2,
  'faq:deplacements': 2,
  balance: 3,
  'faq:equilibre-pieds': 3,
  'faq:retour-garde': 4,
  'faq:jab-direct': 5,
  'faq:crochet-uppercut': 5,
  'faq:hauteurs-kicks': 5,
  'faq:menton': 6,
  errors: 7,
  slow: 8,
  explain: 9,
  'faq:puissance-vitesse': 10,
  'faq:distance': 11,
  'faq:respiration': 12,
};

function candidates(t: Technique): Candidate[] {
  const out: (Candidate & { rank: number })[] = [];
  const name = theName(t);
  const tid = `tech:${t.id}`;
  (BY_TECHNIQUE[t.id] ?? []).forEach((q, i) => out.push({ q, expect: tid, rank: -1 + i / 10 }));
  const fam = family(t.id);
  // library entries linked to this technique or to its family (direct-corps → direct)
  const linked = knowledgeBase()
    .filter((e) => e.source === 'faq' && FAQ_QUESTION[e.id] && e.related.some((r) => r === t.id || family(r) === fam))
    .map((e) => e.id);
  for (const id of [...linked, ...(BY_CATEGORY[t.category] ?? [])]) if (!out.some((c) => c.expect === id)) out.push({ q: FAQ_QUESTION[id], expect: id, rank: RANK[id] ?? 9 });
  // the technique's own sheet
  out.push({ q: `Quelles erreurs éviter sur ${name} ?`, expect: tid, rank: RANK.errors });
  if (['poing', 'pied', 'genou', 'coude', 'deplacement', 'feinte', 'clinch'].includes(t.category)) out.push({ q: 'Comment éviter de perdre l’équilibre ?', expect: tid, rank: RANK.balance });
  out.push({ q: `Explique-moi ${name}.`, expect: tid, rank: RANK.explain });
  out.push({ q: `Montre-moi ${name} au ralenti.`, expect: tid, rank: RANK.slow });
  // the kick FAQ already covers balance on kicks: one balance question is enough
  const kickBalance = out.some((c) => c.expect === 'faq:equilibre-pieds');
  return out.filter((c) => !(kickBalance && c.q.startsWith('Comment éviter de perdre'))).sort((a, b) => a.rank - b.rank);
}

/** the answer really rests on what the suggestion promises */
export function answersWell(a: CoachAnswer, expect: string): boolean {
  if (a.confidence < 0.5 || a.intent === 'unknown' || a.intent === 'off_topic') return false;
  if (expect.startsWith('tech:')) return a.techniqueId === expect.slice(5) || a.sources.some((s) => s.id === expect);
  return a.sources.some((s) => s.id === expect);
}

const cache = new Map<string, string[]>();

/** up to `max` questions about the technique on screen, each one checked against the engine */
export function suggestedQuestions(ctx: Omit<CoachContext, 'lastTechniqueId' | 'seed'>, max = 6): string[] {
  const t = ctx.techniqueId ? TECHNIQUE_BY_ID.get(ctx.techniqueId) : undefined;
  if (!t) return [];
  const key = `${t.id}|${ctx.discipline}|${ctx.level}|${ctx.guard}`;
  const hit = cache.get(key);
  if (hit) return hit.slice(0, max);
  const kept = candidates(t)
    // judo: the chin FAQ is about punches, it does not fit a standing grip posture
    .filter((c, i, all) => !(ctx.discipline === 'judo' && c.expect === 'faq:menton') && all.findIndex((x) => x.q === c.q) === i)
    .filter((c) => answersWell(askCoach(c.q, { ...ctx, preferences: { detail: 'court' } }), c.expect))
    .map((c) => c.q);
  cache.set(key, kept);
  return kept.slice(0, max);
}
