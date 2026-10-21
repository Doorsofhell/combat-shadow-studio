import { TECHNIQUE_BY_ID } from '../domain/techniques';
import type { Technique } from '../domain/types';
import type { CoachScreen } from './appGuide';
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
  chute: [],
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
  // 0.28
  'sit-out': ['À quoi sert le sit-out ?', 'Où placer ma main pendant le sit-out ?'],
  'releve-genoux': ['Comment me relever depuis les genoux ?', 'Comment poser les genoux sans me faire mal ?'],
  'ukemi-ushiro': ['Comment chuter en arrière sans me faire mal ?', 'Où placer mes bras pendant la chute arrière ?'],
  'ukemi-yoko': ['Comment chuter sur le côté ?', 'Où placer mon bras pendant la chute de côté ?'],
  'ayumi-ashi': ['À quoi sert ayumi-ashi ?', 'Comment marcher sans croiser les pieds ?'],
  kumikata: ['À quoi sert le kumi-kata ?', 'Où placer mes mains pour le kumi-kata ?'],
  'uchikomi-o-goshi': ['À quoi sert o-goshi ?', 'Où placer mes hanches pour o-goshi ?'],
  'uchikomi-o-soto-gari': ['À quoi sert o-soto-gari ?', 'Comment garder l’équilibre pendant o-soto-gari ?'],
  'uchikomi-o-uchi-gari': ['À quoi sert o-uchi-gari ?', 'Comment faucher pendant o-uchi-gari ?'],
  'uchikomi-ko-uchi-gari': ['À quoi sert ko-uchi-gari ?', 'Avec quelle partie du pied balayer en ko-uchi-gari ?'],
  'single-leg': ['À quoi sert le single-leg ?', 'Où placer ma tête pendant le single-leg ?'],
  'check-hook': ['À quoi sert le check hook ?', 'Comment pivoter pendant le check hook ?'],
  'shoulder-roll': ['À quoi sert le shoulder roll ?', 'Où placer mon menton pendant le shoulder roll ?'],
  'switch-kick': ['À quoi sert le switch kick ?', 'Comment changer de pied pour le switch kick ?'],
  'garde-longue': ['À quoi sert la garde longue ?', 'Où placer ma main avant en garde longue ?'],
  'rattrapage-middle': ['Comment attraper un middle kick ?', 'Comment protéger mes côtes avant d’attraper la jambe ?'],
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

/**
 * 1 or 2 questions about the screen the coach is opened from, each answered by its guide entry
 * (app:…). They come first: the learner may not know what the screen does.
 */
export const SCREEN_QUESTIONS: Record<CoachScreen, Candidate[]> = {
  accueil: [
    { q: 'Comment fonctionne l’application ?', expect: 'app:app-overview' },
    { q: 'Comment commencer une séance ?', expect: 'app:start-session' },
  ],
  entrainer: [
    { q: 'À quoi sert cet écran ?', expect: 'app:screen-entrainer' },
    { q: 'Quelle est la différence entre les modes ?', expect: 'app:modes' },
  ],
  discipline: [
    { q: 'Comment lancer un exercice ?', expect: 'app:start-session' },
    { q: 'Quelle est la différence entre les modes ?', expect: 'app:modes' },
  ],
  programmes: [{ q: 'Comment fonctionnent les programmes ?', expect: 'app:programmes' }],
  programme: [{ q: 'Comment fonctionnent les programmes ?', expect: 'app:programmes' }],
  techniques: [
    { q: 'Comment trouver une technique ?', expect: 'app:screen-techniques' },
    { q: 'Comment marquer une technique comme assimilée ?', expect: 'app:mastery' },
  ],
  technique: [
    { q: 'Comment marquer cette technique comme assimilée ?', expect: 'app:mastery' },
    { q: 'Comment ajouter cette technique aux favoris ?', expect: 'app:favoris' },
  ],
  partenaire: [{ q: 'Pourquoi travailler avec un partenaire ?', expect: 'app:partner' }],
  combinaisons: [{ q: 'Comment lancer une combinaison ?', expect: 'app:screen-combinaisons' }],
  createur: [{ q: 'Comment créer mon propre enchaînement ?', expect: 'app:createur' }],
  favoris: [{ q: 'Comment ajouter une technique aux favoris ?', expect: 'app:favoris' }],
  progres: [
    { q: 'Comment lire mes statistiques ?', expect: 'app:screen-progres' },
    { q: 'C’est quoi l’onglet Maîtrise ?', expect: 'app:maitrise' },
  ],
  historique: [{ q: 'Que montre l’historique des séances ?', expect: 'app:historique' }],
  objectifs: [{ q: 'Comment fixer mes objectifs personnels ?', expect: 'app:objectifs' }],
  legendes: [
    { q: 'Comment fonctionne l’onglet Légendes ?', expect: 'app:legendes' },
    { q: 'Que signifient les statuts Vérifiée, Adaptée et Inspirée ?', expect: 'app:legendes-statuts' },
  ],
  'legende-fiche': [{ q: 'Que signifient les statuts Vérifiée, Adaptée et Inspirée ?', expect: 'app:legendes-statuts' }],
  champion: [{ q: 'Comment fonctionne l’onglet Légendes ?', expect: 'app:legendes' }],
  reglages: [
    { q: 'Comment passer en mode sombre ?', expect: 'app:theme' },
    { q: 'Comment changer le rendu des combattants ?', expect: 'app:render' },
  ],
  'reglages-voix': [{ q: 'Comment couper la voix du coach ?', expect: 'app:voix' }],
  'reglages-rounds': [{ q: 'Comment régler la durée des rounds ?', expect: 'app:rounds' }],
  'reglages-affichage': [{ q: 'Que faire si l’affichage saccade ?', expect: 'app:affichage' }],
  'reglages-donnees': [{ q: 'Comment exporter mes données ?', expect: 'app:donnees' }],
  profil: [{ q: 'Comment changer mon pseudo ?', expect: 'app:profil' }],
  'coach-choix': [{ q: 'Quelle différence entre Kadir et Amara ?', expect: 'app:choose-coach' }],
  'coach-ia': [{ q: 'Comment tu fonctionnes, coach IA ?', expect: 'app:coach-ia' }],
  confidentialite: [{ q: 'Mes données sont-elles envoyées sur internet ?', expect: 'app:confidentialite' }],
  entrainement: [{ q: 'À quoi sert le bouton Décomposer ?', expect: 'app:decomposer' }],
};

const cache = new Map<string, string[]>();

/** questions about the screen, each one checked against the engine */
export function screenQuestions(ctx: Omit<CoachContext, 'lastTechniqueId' | 'seed'>): string[] {
  const list = ctx.screen ? SCREEN_QUESTIONS[ctx.screen] : undefined;
  if (!list) return [];
  const key = `screen|${ctx.screen}|${ctx.discipline}|${ctx.level}|${ctx.guard}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const kept = list.filter((c) => answersWell(askCoach(c.q, { ...ctx, techniqueId: undefined, preferences: { detail: 'court' } }), c.expect)).map((c) => c.q);
  cache.set(key, kept);
  return kept;
}

/** questions about the technique on screen, each one checked against the engine */
function techniqueQuestions(ctx: Omit<CoachContext, 'lastTechniqueId' | 'seed'>): string[] {
  const t = ctx.techniqueId ? TECHNIQUE_BY_ID.get(ctx.techniqueId) : undefined;
  if (!t) return [];
  const key = `${t.id}|${ctx.discipline}|${ctx.level}|${ctx.guard}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const kept = candidates(t)
    // judo: the chin FAQ is about punches, it does not fit a standing grip posture
    .filter((c, i, all) => !(ctx.discipline === 'judo' && c.expect === 'faq:menton') && all.findIndex((x) => x.q === c.q) === i)
    .filter((c) => answersWell(askCoach(c.q, { ...ctx, screen: undefined, preferences: { detail: 'court' } }), c.expect))
    .map((c) => c.q);
  cache.set(key, kept);
  return kept;
}

/**
 * Up to `max` suggested questions: first 1 or 2 about the screen the coach is opened from (when it is
 * known), then the questions about the technique on screen. Each one is checked against the engine.
 */
export function suggestedQuestions(ctx: Omit<CoachContext, 'lastTechniqueId' | 'seed'>, max = 6): string[] {
  const screen = screenQuestions(ctx);
  const tech = techniqueQuestions(ctx);
  // with a technique to talk about, one screen question is enough
  const head = tech.length ? screen.slice(0, 1) : screen;
  return [...head, ...tech.filter((q) => !head.includes(q))].slice(0, max);
}
