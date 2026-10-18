/**
 * Moteur du coach IA (base locale) : compréhension de la question → recherche dans la bibliothèque
 * validée → réponse rédigée à partir de gabarits, adaptée au niveau, à la discipline, à la garde,
 * à la technique en cours et au pseudo, + actions exécutables par l’écran d’entraînement.
 *
 * Déterministe, synchrone, sans réseau. Le coach ne voit pas l’utilisateur : il ne prétend jamais
 * analyser ou corriger un mouvement.
 */
import { EXERCISES, EXERCISE_BY_ID } from '../domain/exercises';
import { TECHNIQUES, TECHNIQUE_BY_ID } from '../domain/techniques';
import type { CatalogChampion, CatalogCombo } from '../domain/catalog/types';
import { LEVELS } from '../domain/types';
import type { DisciplineId, Exercise, Guard, LevelId, Technique } from '../domain/types';
import { CATEGORY_NUANCE, knowledgeBase, techniqueSide, type KnowledgeEntry } from './knowledge';
import { family, parseQuestion, type CoachIntent, type ParsedQuestion } from './nlu';
import { retrieve, type RetrievalHit } from './retrieval';
import { hash } from './text';

export type DetailLevel = 'court' | 'detaille';

export interface CoachContext {
  pseudo?: string;
  discipline: DisciplineId;
  level: LevelId;
  guard: Guard;
  /** technique affichée / en cours dans l’écran d’entraînement */
  techniqueId?: string;
  /** exercice en cours */
  exerciseId?: string;
  /** objectifs du profil (technique, cardio, coordination, defense, competition, forme) */
  goals?: string[];
  preferences?: { detail?: DetailLevel };
  /** bibliothèque des champions si elle est chargée (useCatalog) ; sinon seuls les exercices sont proposés */
  catalog?: { combos: CatalogCombo[]; championById?: Map<string, CatalogChampion> } | null;
  /** technique de la réponse précédente, pour « et au ralenti ? » */
  lastTechniqueId?: string;
  /** rotation des suggestions (ex. nombre de suggestions déjà faites) */
  seed?: number;
}

export type CoachAction =
  | { type: 'demo'; techniqueId: string; label: string }
  | { type: 'slow'; techniqueId: string; speed: number; label: string }
  | { type: 'repeat'; techniqueId: string; label: string }
  | { type: 'start-exercise'; exerciseId: string; label: string }
  | { type: 'start-combo'; comboId: string; label: string };

export interface CoachSource {
  id: string;
  title: string;
  /** identifiant de technique, 'faq', 'exercice' ou 'catalogue' */
  source: string;
}

export interface CoachAnswer {
  text: string;
  actions: CoachAction[];
  sources: CoachSource[];
  intent: CoachIntent;
  /** 0 à 1 : sûreté de la correspondance question → bibliothèque */
  confidence: number;
  engine: 'base-locale' | 'llm';
  /** technique principale de la réponse (à repasser en lastTechniqueId) */
  techniqueId?: string;
  /** exemples de questions à proposer quand la réponse est incertaine */
  suggestions?: string[];
}

export const SLOW_SPEED = 0.25;
const MIN_SCORE = 2.2;

// ------------------------------------------------------------------------------------ helpers

const pick = <T,>(xs: T[], key: string): T => xs[hash(key) % xs.length];
const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const uc = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const strip = (s: string) => s.replace(/[.\s]+$/, '');
const levelName = (l: LevelId) => LEVELS.find((x) => x.id === l)!.name;
const isAdvanced = (l: LevelId) => l === 'avance' || l === 'expert';

function cleanPseudo(p?: string) {
  const s = (p ?? '').replace(/\s+/g, ' ').trim().slice(0, 24);
  return s || undefined;
}

/** début de réponse avec le pseudo (déterministe) */
function opener(ctx: CoachContext, key: string, kind: 'neutral' | 'question' = 'question') {
  const p = cleanPseudo(ctx.pseudo);
  if (p) {
    // « neutral » : la suite commence en minuscule (« Yassine, je lance… »)
    if (kind === 'neutral') return `${p}, `;
    return pick([`Bonne question, ${p} !`, `OK ${p}.`, `${p}, voilà.`, `Allons-y, ${p}.`], key) + ' ';
  }
  return kind === 'question' ? pick(['Bonne question !', 'OK.', 'Voilà.', 'Allons-y.'], key) + ' ' : '';
}

/** nom avec article : « le jab », « l’uppercut gauche », « la parade », « le high kick » (h aspiré) */
function article(t: Technique) {
  const n = t.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/^[aeiouy]/.test(n)) return 'l’';
  if (/^(position|posture|retention|rotation|parade|sortie|feinte|defense|descente)/.test(n)) return 'la ';
  return 'le ';
}
const lowName = (t: Technique) => t.name.charAt(0).toLowerCase() + t.name.slice(1);
export const theName = (t: Technique) => `${article(t)}${lowName(t)}`;

const DISC_OF: Record<DisciplineId, string> = { boxe: 'de la boxe anglaise', kickboxing: 'du kick-boxing', mma: 'du MMA', muaythai: 'du muay-thaï', bjj: 'du jiu-jitsu brésilien', judo: 'du judo' };
const DISC_IN: Record<DisciplineId, string> = { boxe: 'en boxe anglaise', kickboxing: 'en kick-boxing', mma: 'en MMA', muaythai: 'en muay-thaï', bjj: 'en jiu-jitsu brésilien', judo: 'en judo' };
const DISC_LABEL: Record<DisciplineId, string> = { boxe: 'boxe anglaise', kickboxing: 'kick-boxing', mma: 'MMA', muaythai: 'muay-thaï', bjj: 'jiu-jitsu brésilien', judo: 'judo' };

function sideNote(t: Technique, guard: Guard) {
  if (guard !== 'gaucher') return '';
  const side = techniqueSide(t.id);
  if (!side) return '\nEn garde gaucher, inverse gauche et droite par rapport à la fiche.';
  const leg = ['pied', 'genou'].includes(t.category);
  const lr = side === 'avant' ? (leg ? 'droite' : 'droit') : 'gauche';
  const sideLabel = side === 'avant' ? 'avant' : 'arrière';
  return `\nEn garde gaucher, inverse gauche et droite : pour toi, ce coup part ${leg ? `de la jambe ${lr}` : `du bras ${lr}`} (${leg ? 'ta jambe' : 'ton bras'} ${sideLabel}).`;
}

function disciplineNote(t: Technique, d: DisciplineId) {
  if (t.disciplines.includes(d)) return '';
  const others = t.disciplines.map((x) => DISC_IN[x]).join(', ');
  return `\nÀ savoir : ${theName(t)} ne fait pas partie ${DISC_OF[d]} ; on le retrouve ${others}.`;
}

const demo = (t: Technique): CoachAction => ({ type: 'demo', techniqueId: t.id, label: 'Voir la démo' });
const slow = (t: Technique): CoachAction => ({ type: 'slow', techniqueId: t.id, speed: SLOW_SPEED, label: 'Au ralenti' });
const repeat = (t: Technique): CoachAction => ({ type: 'repeat', techniqueId: t.id, label: 'Répéter' });

const techSource = (t: Technique): CoachSource => ({ id: `tech:${t.id}`, title: t.name, source: t.id });
const entrySource = (e: KnowledgeEntry): CoachSource => ({ id: e.id, title: e.title, source: e.source });

function detailOf(ctx: CoachContext): DetailLevel {
  return ctx.preferences?.detail ?? 'court';
}

/** texte d’une entrée de FAQ selon le niveau et le détail demandé */
function faqBody(e: KnowledgeEntry, ctx: CoachContext): string {
  const d = detailOf(ctx);
  switch (ctx.level) {
    case 'debutant':
      return d === 'detaille' && e.simple ? `${e.simple}\n${e.text}` : (e.simple ?? e.text);
    case 'intermediaire':
      return d === 'detaille' && e.nuance ? `${e.text}\n${e.nuance}` : e.text;
    case 'avance':
      return e.nuance ? `${e.text}\nNuance : ${lc(e.nuance)}` : e.text;
    case 'expert': {
      const core = d === 'detaille' ? e.text : e.text.split(/(?<=\.)\s/).slice(0, 2).join(' ');
      return e.nuance ? `${core}\nNuance tactique : ${lc(e.nuance)}` : core;
    }
  }
}

/** explication d’une technique, adaptée au niveau */
function techniqueBody(t: Technique, ctx: CoachContext, g = guideOf(t)): string {
  const d = detailOf(ctx);
  const lines: string[] = [];
  switch (ctx.level) {
    case 'debutant': {
      lines.push(`${uc(theName(t))} : ${lc(t.description)}`);
      const steps = g?.steps ?? [];
      const n = d === 'detaille' ? steps.length : Math.min(4, steps.length);
      if (n) {
        lines.push('Étape par étape :');
        steps.slice(0, n).forEach((s, i) => lines.push(`${i + 1}. ${s}`));
      }
      if (t.keyPoints[0]) lines.push(`À retenir : ${lc(strip(t.keyPoints[0]))}.`);
      if (d === 'detaille' && g?.errors?.length) lines.push(`Évite : ${g.errors.slice(0, 2).map(lc).join(' ; ')}.`);
      break;
    }
    case 'intermediaire':
      lines.push(t.description);
      lines.push(`Points clés : ${t.keyPoints.slice(0, d === 'detaille' ? 3 : 2).map((k) => lc(strip(k))).join(' ; ')}.`);
      if (g?.errors?.[0]) lines.push(`Erreur fréquente : ${lc(strip(g.errors[0]))}.`);
      if (d === 'detaille' && g?.steps?.length) g.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
      break;
    case 'avance':
      lines.push(`${t.name} : ${t.cues.map((c) => lc(strip(c))).join(', ')}.`);
      if (g?.errors?.length) lines.push(`À éviter : ${g.errors.slice(0, d === 'detaille' ? 4 : 2).map((e) => lc(strip(e))).join(' ; ')}.`);
      lines.push(`Nuance : ${CATEGORY_NUANCE[t.category]}`);
      break;
    case 'expert':
      lines.push(`En bref : ${t.cues.map((c) => lc(strip(c))).join(', ')} — ${lc(strip(t.keyPoints[0] ?? t.description))}.`);
      if (d === 'detaille' && g?.errors?.length) lines.push(`À éviter : ${g.errors.map((e) => lc(strip(e))).join(' ; ')}.`);
      lines.push(`Tactique : ${CATEGORY_NUANCE[t.category]}`);
      break;
  }
  if (d === 'detaille' && g?.breath) lines.push(`Respiration : ${lc(g.breath)}`);
  if (t.soloNote) lines.push(t.soloNote);
  return lines.join('\n');
}

function guideOf(t: Technique) {
  return knowledgeBase().find((e) => e.id === `tech:${t.id}`) as KnowledgeEntry | undefined;
}

function tech(id?: string): Technique | undefined {
  return id ? TECHNIQUE_BY_ID.get(id) : undefined;
}

/** technique de référence quand la question n’en cite pas : précédente, en cours, ou 1re de l’exercice */
function contextTechnique(ctx: CoachContext): Technique | undefined {
  return tech(ctx.lastTechniqueId) ?? tech(ctx.techniqueId) ?? tech(ctx.exerciseId ? EXERCISE_BY_ID.get(ctx.exerciseId)?.sequence[0] : undefined);
}

export function exampleQuestions(d: DisciplineId): string[] {
  const base = ['Comment améliorer mon crochet gauche ?', 'Pourquoi dois-je pivoter le pied arrière ?', 'Propose-moi une combinaison adaptée à mon niveau.', 'Quelle est la différence entre un jab et un cross ?'];
  if (d === 'boxe') return [...base, 'Montre-moi le direct au ralenti.'];
  if (d === 'mma') return [...base, 'Comment faire un sprawl ?', 'Montre-moi le low kick au ralenti.'];
  return [...base, 'Montre-moi le middle kick au ralenti.', 'Comment garder mon équilibre pendant un high kick ?'];
}

const GOAL_KIND: Record<string, Exercise['kind'][]> = {
  technique: ['technique', 'combinaison'],
  cardio: ['cardio', 'round'],
  coordination: ['combinaison', 'deplacement'],
  defense: ['defense'],
  competition: ['round', 'combinaison'],
  forme: ['cardio', 'technique'],
};

/** exercice existant contenant la technique, au niveau et dans la discipline de l’utilisateur si possible */
function exerciseWith(techniqueId: string, ctx: CoachContext): Exercise | undefined {
  const order: LevelId[] = ['debutant', 'intermediaire', 'avance', 'expert'];
  const li = order.indexOf(ctx.level);
  const byLevelDistance = (e: Exercise) => Math.abs(order.indexOf(e.level) - li);
  const pool = EXERCISES.filter((e) => e.sequence.includes(techniqueId) && e.id !== ctx.exerciseId);
  const sameD = pool.filter((e) => e.discipline === ctx.discipline);
  const list = (sameD.length ? sameD : pool).slice().sort((a, b) => byLevelDistance(a) - byLevelDistance(b) || a.sequence.length - b.sequence.length || (a.id < b.id ? -1 : 1));
  return list[0];
}

const seqNames = (seq: string[]) => seq.map((id) => TECHNIQUE_BY_ID.get(id)?.name ?? id).join(' → ');

// ------------------------------------------------------------------------------------ intents

function answerTechnique(p: ParsedQuestion, ctx: CoachContext, t: Technique, intent: CoachIntent): CoachAnswer {
  const g = guideOf(t);
  const text = opener(ctx, p.text) + techniqueBody(t, ctx, g) + sideNote(t, ctx.guard) + disciplineNote(t, ctx.discipline);
  return { text, actions: [demo(t), slow(t)], sources: [techSource(t)], intent, confidence: 0.9, engine: 'base-locale', techniqueId: t.id };
}

function answerEntry(p: ParsedQuestion, ctx: CoachContext, hit: RetrievalHit, intent: CoachIntent, t?: Technique): CoachAnswer {
  const e = hit.entry;
  const et = tech(e.source);
  if (et) return { ...answerTechnique(p, ctx, et, intent), confidence: confidenceOf(hit.score) };
  // technique d’illustration : celle citée, sinon celle en cours si elle est liée, sinon la 1re liée de la discipline
  const rel = e.related.map((id) => TECHNIQUE_BY_ID.get(id)!).filter(Boolean);
  const illus =
    (t && (e.related.includes(t.id) || e.related.some((r) => family(r) === family(t.id))) ? t : undefined) ??
    rel.find((r) => r.id === ctx.techniqueId) ??
    rel.find((r) => r.disciplines.includes(ctx.discipline)) ??
    rel[0];
  let text = opener(ctx, p.text) + faqBody(e, ctx);
  if (GENERAL_FAQ.has(e.id)) return { text, actions: [], sources: [entrySource(e)], intent, confidence: confidenceOf(hit.score), engine: 'base-locale' };
  if (illus && illus.id === ctx.techniqueId && e.related.includes(illus.id)) text += `\nTu peux l’observer sur ${theName(illus)} que tu travailles en ce moment.`;
  else if (illus && t && illus.id === t.id) text += `\nSur ${theName(illus)} : ${illus.cues.map((c) => lc(strip(c))).join(', ')}.`;
  else if (illus && intent === 'why') text += `\nTu le retrouves par exemple sur ${theName(illus)} : ${illus.cues.map((c) => lc(strip(c))).join(', ')}.`;
  return {
    text,
    actions: illus ? [demo(illus), slow(illus)] : [],
    sources: [entrySource(e)],
    intent,
    confidence: confidenceOf(hit.score),
    engine: 'base-locale',
    techniqueId: illus?.id,
  };
}

/** entrées générales : pas de démo associée (échauffement, repos…) */
const GENERAL_FAQ = new Set(['faq:echauffement', 'faq:repos', 'faq:douleur', 'faq:shadow', 'faq:debuter', 'faq:gaucher', 'faq:articulations-shadow']);

function confidenceOf(score: number) {
  return Math.round(Math.min(0.95, score / (score + 4)) * 100) / 100;
}

function fallback(p: ParsedQuestion, ctx: CoachContext, intent: CoachIntent = 'unknown'): CoachAnswer {
  const ex = exampleQuestions(ctx.discipline);
  const body = p.text ? 'je n’ai pas trouvé de réponse fiable à cette question dans ma bibliothèque, et je préfère ne pas improviser.' : 'pose-moi une question sur ta séance.';
  const text = opener(ctx, p.text, 'neutral') + body + ` Tu peux me demander par exemple :\n• ${ex.slice(0, 3).join('\n• ')}`;
  return { text: uc(text.trim()), actions: [], sources: [], intent, confidence: 0.1, engine: 'base-locale', suggestions: ex };
}

function explain(p: ParsedQuestion, ctx: CoachContext, intent: CoachIntent = 'explain'): CoachAnswer {
  const t = tech(p.primary);
  const hits = retrieve(p.raw, { discipline: ctx.discipline, currentTechnique: ctx.techniqueId, mentioned: p.techniques });
  const top = hits[0];
  // une entrée de FAQ précise (ex. « garde haute », « respiration ») peut mieux répondre qu’une fiche
  if (top && top.entry.source === 'faq' && top.score >= MIN_SCORE * 1.6 && (!t || top.entry.related.includes(t.id))) return answerEntry(p, ctx, top, intent, t);
  if (t) return answerTechnique(p, ctx, t, intent);
  if (top && top.score >= MIN_SCORE) return answerEntry(p, ctx, top, intent);
  return fallback(p, ctx);
}

function why(p: ParsedQuestion, ctx: CoachContext): CoachAnswer {
  const t = tech(p.primary);
  const hits = retrieve(p.raw, { discipline: ctx.discipline, currentTechnique: ctx.techniqueId, mentioned: p.techniques, faqOnly: true });
  const top = hits[0];
  // une technique citée l’emporte sur une FAQ qui ne la concerne pas
  const relevant = top && (!t || top.entry.related.some((r) => family(r) === family(t.id)));
  if (top && relevant && top.score >= MIN_SCORE) return answerEntry(p, ctx, top, 'why', t ?? tech(ctx.techniqueId));
  if (t) {
    const text =
      opener(ctx, p.text) +
      `Sur ${theName(t)}, chaque point a un rôle : ${t.keyPoints.map((k) => lc(strip(k))).join(' ; ')}.\n` +
      `${t.description}` +
      sideNote(t, ctx.guard);
    return { text, actions: [demo(t), slow(t)], sources: [techSource(t)], intent: 'why', confidence: 0.6, engine: 'base-locale', techniqueId: t.id };
  }
  return explain(p, ctx, 'why');
}

function improve(p: ParsedQuestion, ctx: CoachContext): CoachAnswer {
  if (!p.primary) {
    // question générale (« plus puissant », « plus rapide ») : la FAQ d’abord, illustrée par la technique en cours
    const hits = retrieve(p.raw, { discipline: ctx.discipline, faqOnly: true });
    if (hits[0] && hits[0].score >= MIN_SCORE * 1.4) return answerEntry(p, ctx, hits[0], 'improve', tech(ctx.techniqueId));
  }
  const t = tech(p.primary) ?? tech(ctx.techniqueId);
  if (!t) {
    const hits = retrieve(p.raw, { discipline: ctx.discipline, faqOnly: true });
    if (hits[0] && hits[0].score >= MIN_SCORE) return answerEntry(p, ctx, hits[0], 'improve');
    return fallback(p, ctx, 'improve');
  }
  const g = guideOf(t);
  const d = detailOf(ctx);
  const lines: string[] = [];
  lines.push(opener(ctx, p.text) + `Pour progresser sur ${theName(t)} :`);
  const kps = t.keyPoints.slice(0, ctx.level === 'expert' ? 1 : d === 'detaille' ? 3 : 2);
  kps.forEach((k) => lines.push(`• ${strip(k)}.`));
  const errs = g?.errors?.slice(0, ctx.level === 'debutant' ? 1 : 2) ?? [];
  if (errs.length) lines.push(`• Évite : ${errs.map((e) => lc(strip(e))).join(' ; ')}.`);
  if (ctx.level === 'debutant') lines.push('Méthode : regarde la démo au ralenti, répète lentement en revenant en garde à chaque fois, puis accélère seulement quand le geste est propre.');
  else if (ctx.level === 'intermediaire') lines.push('Méthode : séries courtes et propres, d’abord lentes puis à vitesse réelle, et intègre-le dans une combinaison.');
  else lines.push(`Méthode : travaille-le en combinaison et sous fatigue, sans perdre la forme. ${CATEGORY_NUANCE[t.category]}`);
  lines.push('Pour te vérifier, utilise un miroir ou filme-toi : je ne peux pas voir ton geste.');
  const ex = exerciseWith(t.id, ctx);
  const actions: CoachAction[] = [slow(t), demo(t)];
  const sources = [techSource(t)];
  if (ex) {
    lines.push(`Exercice conseillé : « ${ex.name} » (${levelName(ex.level).toLowerCase()}).`);
    actions.push({ type: 'start-exercise', exerciseId: ex.id, label: 'Lancer l’exercice' });
    sources.push({ id: `ex:${ex.id}`, title: ex.name, source: 'exercice' });
  }
  const text = lines.join('\n') + sideNote(t, ctx.guard) + disciplineNote(t, ctx.discipline);
  return { text, actions, sources, intent: 'improve', confidence: 0.9, engine: 'base-locale', techniqueId: t.id };
}

function difference(p: ParsedQuestion, ctx: CoachContext): CoachAnswer {
  const ts = p.techniques.map((id) => TECHNIQUE_BY_ID.get(id)!).filter(Boolean);
  if (ts.length < 2) {
    const hits = retrieve(p.raw, { discipline: ctx.discipline, faqOnly: true, mentioned: p.techniques });
    if (hits[0] && hits[0].score >= MIN_SCORE && hits[0].entry.tags.includes('difference')) return answerEntry(p, ctx, hits[0], 'difference', ts[0]);
    if (ts[0]) {
      const a = answerTechnique(p, ctx, ts[0], 'difference');
      return { ...a, text: `${a.text}\nAvec quelle autre technique veux-tu le comparer ?`, confidence: 0.5 };
    }
    return fallback(p, ctx, 'difference');
  }
  const [a, b] = ts;
  const fa = family(a.id);
  const fb = family(b.id);
  const faq = knowledgeBase().find((e) => e.source === 'faq' && e.tags.includes('difference') && e.related.some((r) => family(r) === fa) && e.related.some((r) => family(r) === fb) && fa !== fb);
  const actions = [demo(a), { ...demo(b), label: `Démo : ${b.name}` }];
  actions[0] = { ...actions[0], label: `Démo : ${a.name}` };
  let text: string;
  const sources: CoachSource[] = [techSource(a), techSource(b)];
  if (faq) {
    text = opener(ctx, p.text) + faqBody(faq, ctx);
    sources.unshift(entrySource(faq));
  } else {
    const sa = techniqueSide(a.id);
    const sb = techniqueSide(b.id);
    const lines = [
      opener(ctx, p.text) + `${uc(theName(a))} : ${lc(a.description)}`,
      `${uc(theName(b))} : ${lc(b.description)}`,
    ];
    if (fa === fb && sa && sb && sa !== sb) lines.push(`C’est le même geste : l’un part du membre avant (plus rapide, plus court), l’autre du membre arrière (plus de distance et de puissance grâce au pivot et à la hanche).`);
    else if (a.category !== b.category) lines.push(`Ce ne sont pas des techniques de la même famille : ${lc(catLabel(a))} d’un côté, ${lc(catLabel(b))} de l’autre.`);
    if (isAdvanced(ctx.level)) lines.push(`Point commun à garder en tête : ${lc(strip(a.keyPoints[0] ?? ''))} ; ${lc(strip(b.keyPoints[0] ?? ''))}.`);
    text = lines.join('\n');
  }
  text += ctx.guard === 'gaucher' ? '\nEn garde gaucher, inverse gauche et droite par rapport aux fiches.' : '';
  return { text, actions, sources, intent: 'difference', confidence: faq ? 0.9 : 0.75, engine: 'base-locale', techniqueId: a.id };
}

function catLabel(t: Technique) {
  return { garde: 'Une position de garde', poing: 'Un coup de poing', pied: 'Un coup de pied', genou: 'Un coup de genou', coude: 'Un coup de coude', defense: 'Une défense', deplacement: 'Un déplacement', lutte: 'Une action de lutte', sol: 'Un mouvement au sol', feinte: 'Une feinte', clinch: 'Une action de clinch', projection: 'Une entrée de projection' }[t.category];
}

function demoLike(p: ParsedQuestion, ctx: CoachContext, intent: 'demo' | 'slow' | 'repeat'): CoachAnswer {
  const t = tech(p.primary) ?? contextTechnique(ctx);
  if (!t) {
    const text = opener(ctx, p.text, 'neutral') + 'Quelle technique veux-tu voir ? Par exemple : « Montre-moi le jab » ou « Le direct au ralenti ».';
    return { text: uc(text), actions: [], sources: [], intent, confidence: 0.3, engine: 'base-locale', suggestions: ['Montre-moi le jab.', 'Le direct au ralenti.'] };
  }
  const cues = t.cues.slice(0, 3).map((c) => lc(strip(c))).join(', ');
  let text: string;
  let actions: CoachAction[];
  if (intent === 'slow') {
    text = opener(ctx, p.text, 'neutral') + `je lance ${theName(t)} au ralenti (×${String(SLOW_SPEED).replace('.', ',')}). Observe : ${cues}.`;
    actions = [slow(t), demo(t)];
  } else if (intent === 'repeat') {
    text = opener(ctx, p.text, 'neutral') + `je relance ${theName(t)}. Concentre-toi sur : ${cues}.`;
    actions = [repeat(t), slow(t)];
  } else {
    text = opener(ctx, p.text, 'neutral') + `regarde bien ${theName(t)} : ${cues}.`;
    actions = [demo(t), slow(t)];
  }
  if (ctx.level === 'debutant' && t.keyPoints[0]) text += ` Vérifie surtout : ${lc(strip(t.keyPoints[0]))}.`;
  text += sideNote(t, ctx.guard) + disciplineNote(t, ctx.discipline);
  return { text: uc(text.trim()), actions, sources: [techSource(t)], intent, confidence: p.primary ? 0.95 : 0.7, engine: 'base-locale', techniqueId: t.id };
}

function suggestCombo(p: ParsedQuestion, ctx: CoachContext): CoachAnswer {
  const wanted = p.primary;
  const kinds = new Set((ctx.goals ?? []).flatMap((g) => GOAL_KIND[g] ?? []));
  const seed = ctx.seed ?? 0;
  const pool = EXERCISES.filter((e) => e.discipline === ctx.discipline && e.level === ctx.level && e.sequence.length >= 2 && e.id !== ctx.exerciseId);
  const score = (e: Exercise) => (wanted && e.sequence.includes(wanted) ? 4 : 0) + (kinds.has(e.kind) ? 2 : 0) + (e.kind === 'combinaison' ? 1 : 0) + (ctx.techniqueId && e.sequence.includes(ctx.techniqueId) ? 1 : 0);
  const ranked = pool.slice().sort((a, b) => score(b) - score(a) || (a.id < b.id ? -1 : 1));
  const best = ranked.filter((e) => score(e) === score(ranked[0] ?? pool[0]));
  const ex = best.length ? best[seed % best.length] : undefined;

  const combos = (ctx.catalog?.combos ?? []).filter(
    (c) => c.discipline === ctx.discipline && c.level === ctx.level && (c.guard === 'les-deux' || c.guard === ctx.guard) && (!wanted || c.sequence.includes(wanted)) && c.sequence.every((id) => TECHNIQUE_BY_ID.has(id)),
  );
  const combo = combos.length ? combos.slice().sort((a, b) => (a.id < b.id ? -1 : 1))[(hash(`${ctx.discipline}${ctx.level}`) + seed) % combos.length] : undefined;

  const lines: string[] = [];
  const actions: CoachAction[] = [];
  const sources: CoachSource[] = [];
  lines.push(opener(ctx, p.text) + `Pour ton niveau (${levelName(ctx.level).toLowerCase()}, ${DISC_LABEL[ctx.discipline]}) :`);
  if (ex) {
    lines.push(ex.name === seqNames(ex.sequence) ? `• ${ex.name}.` : `• « ${ex.name} » : ${seqNames(ex.sequence)}.`);
    if (ex.instructions[0]) lines.push(`  Consigne : ${lc(strip(ex.instructions[0]))}.`);
    actions.push({ type: 'start-exercise', exerciseId: ex.id, label: 'Lancer l’exercice' });
    sources.push({ id: `ex:${ex.id}`, title: ex.name, source: 'exercice' });
  }
  if (combo) {
    const champ = ctx.catalog?.championById?.get(combo.champion)?.name;
    const status =
      combo.status === 'verifiee'
        ? `séquence relevée en combat${champ ? ` (${champ})` : ''}`
        : combo.status === 'adaptee'
          ? `adaptée d’une séquence documentée${champ ? ` (${champ})` : ''}`
          : `inspirée du style${champ ? ` de ${champ}` : ''}, pas une séquence réellement exécutée en combat`;
    lines.push(`• Bibliothèque des champions : « ${combo.name} » — ${status}.`);
    actions.push({ type: 'start-combo', comboId: combo.id, label: 'Lancer la fiche' });
    sources.push({ id: `cat:${combo.id}`, title: combo.name, source: 'catalogue' });
  }
  if (!ex && !combo) {
    const t = tech(wanted);
    const anyEx = t ? exerciseWith(t.id, ctx) : undefined;
    if (anyEx) {
      lines.push(`• « ${anyEx.name} » (${levelName(anyEx.level).toLowerCase()}) : ${seqNames(anyEx.sequence)}.`);
      actions.push({ type: 'start-exercise', exerciseId: anyEx.id, label: 'Lancer l’exercice' });
      sources.push({ id: `ex:${anyEx.id}`, title: anyEx.name, source: 'exercice' });
    } else return fallback(p, ctx, 'suggest_combo');
  }
  lines.push(ctx.level === 'debutant' ? 'Commence lentement et reviens en garde après chaque coup.' : isAdvanced(ctx.level) ? 'Travaille-la à vitesse réelle, puis en round, sans perdre la forme.' : 'D’abord propre et lent, puis accélère.');
  return { text: lines.join('\n'), actions, sources, intent: 'suggest_combo', confidence: 0.85, engine: 'base-locale', techniqueId: ex?.sequence[0] ?? combo?.sequence[0] };
}

function balance(p: ParsedQuestion, ctx: CoachContext): CoachAnswer {
  const t = tech(p.primary) ?? tech(ctx.techniqueId);
  const kb = knowledgeBase();
  const kicky = t && ['pied', 'genou'].includes(t.category);
  const entry = kb.find((e) => e.id === (kicky || !t ? 'faq:equilibre-pieds' : 'faq:garde'))!;
  let text = opener(ctx, p.text) + faqBody(entry, ctx);
  const actions: CoachAction[] = [];
  const sources: CoachSource[] = [entrySource(entry)];
  if (t) {
    const specific = [...t.keyPoints, ...t.cues].filter((k) => /equilib|équilib|appui|pointe|pivot|garde/i.test(k)).slice(0, 3);
    if (specific.length) text += `\nSur ${theName(t)} : ${specific.map((k) => lc(strip(k))).join(' ; ')}.`;
    text += sideNote(t, ctx.guard) + disciplineNote(t, ctx.discipline);
    actions.push(slow(t), demo(t));
    sources.push(techSource(t));
  }
  return { text, actions, sources, intent: 'balance', confidence: t ? 0.9 : 0.7, engine: 'base-locale', techniqueId: t?.id };
}

function cantSee(p: ParsedQuestion, ctx: CoachContext): CoachAnswer {
  const t = tech(p.primary) ?? contextTechnique(ctx);
  const lines = [
    opener(ctx, p.text, 'neutral') +
      'je ne peux pas te voir : l’application n’utilise pas la caméra pour analyser tes mouvements, donc je ne peux ni te corriger ni juger ton geste.',
  ];
  const actions: CoachAction[] = [];
  const sources: CoachSource[] = [];
  if (t) {
    const g = guideOf(t);
    lines.push(`Voici quoi vérifier toi-même sur ${theName(t)}, devant un miroir ou en te filmant :`);
    t.keyPoints.slice(0, 3).forEach((k) => lines.push(`• ${strip(k)}.`));
    if (g?.errors?.[0]) lines.push(`• Erreur fréquente : ${lc(strip(g.errors[0]))}.`);
    lines.push('Compare ensuite avec la démo au ralenti.');
    actions.push(slow(t), demo(t));
    sources.push(techSource(t));
  } else lines.push('Je peux en revanche t’expliquer les points clés d’une technique et te la montrer au ralenti pour que tu compares toi-même.');
  return { text: uc(lines.join('\n')), actions, sources, intent: 'cant_see', confidence: 1, engine: 'base-locale', techniqueId: t?.id };
}

function safety(_p: ParsedQuestion, ctx: CoachContext): CoachAnswer {
  const e = knowledgeBase().find((x) => x.id === 'faq:douleur')!;
  const p0 = cleanPseudo(ctx.pseudo);
  const text = `${p0 ? `${p0}, ` : ''}${p0 ? lc(e.text) : e.text}\nJe ne peux pas évaluer une douleur : seul un professionnel de santé peut le faire.`;
  return { text, actions: [], sources: [entrySource(e)], intent: 'safety', confidence: 1, engine: 'base-locale' };
}

function smalltalk(p: ParsedQuestion, ctx: CoachContext): CoachAnswer {
  const name = cleanPseudo(ctx.pseudo);
  const ex = exampleQuestions(ctx.discipline);
  let text: string;
  if (/\bmerci\b/.test(p.text)) text = `Avec plaisir${name ? `, ${name}` : ''} ! Continue comme ça, et reviens en garde après chaque coup.`;
  else if (/au revoir|a plus/.test(p.text)) text = `À bientôt${name ? `, ${name}` : ''} ! Pense à t’hydrater et à récupérer.`;
  else
    text =
      `Salut${name ? ` ${name}` : ''} ! Je suis ton coach : je réponds à tes questions sur les techniques, la garde, l’équilibre, la respiration et je peux te montrer un mouvement en démo ou au ralenti. ` +
      `Je ne te vois pas, donc je ne corrige pas ton geste.\nEssaie : « ${ex[0]} » ou « ${ex[2]} »`;
  return { text, actions: [], sources: [], intent: 'smalltalk', confidence: 0.9, engine: 'base-locale', suggestions: ex.slice(0, 3) };
}

function offTopic(p: ParsedQuestion, ctx: CoachContext): CoachAnswer {
  const name = cleanPseudo(ctx.pseudo);
  const ex = exampleQuestions(ctx.discipline);
  let text: string;
  if (p.dangerous) {
    text =
      `${name ? `${name}, je` : 'Je'} ne donne pas de conseils sur ce sujet. Je suis là pour t’aider à t’entraîner en sécurité, en shadow. ` +
      'Pour tout ce qui touche au poids, à l’alimentation ou à la santé, adresse-toi à un professionnel (médecin, diététicien).';
  } else {
    text = `${name ? `${name}, je` : 'Je'} suis ton coach d’entraînement : je réponds seulement aux questions sur les techniques, la séance et la préparation. Essaie par exemple : « ${ex[0]} »`;
  }
  return { text, actions: [], sources: [], intent: 'off_topic', confidence: 0.9, engine: 'base-locale', suggestions: ex.slice(0, 3) };
}

function unknownTechnique(p: ParsedQuestion, ctx: CoachContext): CoachAnswer {
  const name = cleanPseudo(ctx.pseudo);
  const move = p.unknownMoves[0];
  const kickish = /kick|pied|genou|knee|chasse|retourne|geri/.test(move);
  const groundish = /kimura|triangle|armbar|cle|clef|etranglement|guillotine|choke|rnc|soumission|mount|montee|ground|sweep|balayage|single|suplex|kesa/.test(move);
  const cat = groundish ? ['lutte', 'sol'] : kickish ? ['pied', 'genou'] : ['poing'];
  const known = TECHNIQUES.filter((t) => cat.includes(t.category) && t.disciplines.includes(ctx.discipline)).slice(0, 5);
  const list = (known.length ? known : TECHNIQUES.filter((t) => cat.includes(t.category)).slice(0, 5)).map((t) => t.name);
  const text =
    `${name ? `${name}, le` : 'Le'} « ${move} » ne fait pas partie de ma bibliothèque validée. Je préfère ne pas t’expliquer un geste que je n’ai pas en fiche plutôt que de risquer un conseil faux.` +
    (list.length ? `\nDans la même famille, je peux te parler de : ${list.join(', ')}.` : '');
  return { text, actions: [], sources: [], intent: 'unknown_technique', confidence: 0.9, engine: 'base-locale' };
}

function unknown(p: ParsedQuestion, ctx: CoachContext): CoachAnswer {
  const hits = retrieve(p.raw, { discipline: ctx.discipline, currentTechnique: ctx.techniqueId, mentioned: p.techniques });
  if (hits[0] && hits[0].score >= MIN_SCORE) return answerEntry(p, ctx, hits[0], 'explain');
  return fallback(p, ctx);
}

// ------------------------------------------------------------------------------------ entry point

/** répond à une question, entièrement en local (< 20 ms) */
export function askCoach(question: string, context: CoachContext): CoachAnswer {
  const q = question.slice(0, 400);
  const p = parseQuestion(q, { exerciseId: context.exerciseId });
  switch (p.intent) {
    case 'explain':
      return explain(p, context);
    case 'why':
      return why(p, context);
    case 'improve':
      return improve(p, context);
    case 'difference':
      return difference(p, context);
    case 'demo':
    case 'slow':
    case 'repeat':
      return demoLike(p, context, p.intent);
    case 'suggest_combo':
      return suggestCombo(p, context);
    case 'balance':
      return balance(p, context);
    case 'smalltalk':
      return smalltalk(p, context);
    case 'cant_see':
      return cantSee(p, context);
    case 'safety':
      return safety(p, context);
    case 'off_topic':
      return offTopic(p, context);
    case 'unknown_technique':
      return unknownTechnique(p, context);
    default:
      return unknown(p, context);
  }
}

/** passages de la bibliothèque utilisés comme ancrage (pour un moteur LLM éventuel) */
export function groundingPassages(question: string, context: CoachContext, k = 4) {
  const p = parseQuestion(question, { exerciseId: context.exerciseId });
  return retrieve(question, { discipline: context.discipline, currentTechnique: context.techniqueId, mentioned: p.techniques, k }).map((h) => ({
    id: h.entry.id,
    title: h.entry.title,
    text: [h.entry.text, ...(h.entry.keyPoints ?? []), ...(h.entry.errors ?? []).map((e) => `Erreur : ${e}`)].join(' '),
    score: h.score,
  }));
}
