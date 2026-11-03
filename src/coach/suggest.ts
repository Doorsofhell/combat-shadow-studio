import { EXERCISE_BY_ID } from '../domain/exercises';
import type { KbStyleChoice } from '../domain/kickboxingStyles';
import { TECHNIQUES, TECHNIQUE_BY_ID } from '../domain/techniques';
import type { DisciplineId, Technique } from '../domain/types';
import type { CoachScreen } from './appGuide';
import { askCoach, theName, type CoachAnswer, type CoachContext } from './engine';
import { knowledgeBase } from './knowledge';
import { family } from './nlu';
import {
  APP_ANYWHERE,
  BY_CATEGORY,
  BY_TECHNIQUE,
  FAQ_PHRASES,
  FAQ_RANK,
  GENERAL_GRAPPLING,
  GENERAL_STRIKING,
  SCREEN_POOL,
  STRIKING,
  TECH_TEMPLATES,
  styleLabel,
  type Names,
  type QCat,
  type ScreenQ,
  type When,
} from './questionBank';
import { hash, normalize } from './text';

/**
 * Questions suggérées par le coach IA (0.27, Youssef 2026-10-20 22:00 : « Les questions pré-programmées
 * IA doivent être diverses et variées pour que le user n’ait pas une impression de répétition »).
 *
 * 1. Candidates : une large banque (questionBank.ts) déclinée pour l’écran, la technique à l’écran, la
 *    discipline, le style de kick-boxing, le niveau, la garde, l’heure, les techniques « à revoir » et
 *    la dernière séance. Chacune dit sur quoi sa réponse doit reposer, et n’est gardée que si le moteur
 *    local y répond vraiment ainsi : rien n’est suggéré que le coach ne sait pas répondre.
 * 2. Choix : la question la plus pertinente en tête (sur la technique, ou sur l’écran), puis un mélange
 *    de catégories (2 au plus par catégorie, une seule question par réponse), en écartant celles déjà
 *    montrées récemment (liste « vues », gardée par utilisateur) et avec une graine du jour / de
 *    l’ouverture : deux ouvertures de suite sur le même écran montrent surtout des questions nouvelles.
 */

/** « vues » gardées (les plus récentes d’abord) : environ 7 ouvertures du panneau */
export const SEEN_MAX = 60;

export interface SuggestOptions {
  /** questions montrées récemment, la plus récente d’abord (useCoachAi.recentSuggestions) */
  seen?: readonly string[];
  /** graine de l’ouverture (jour + compteur) : varie l’ordre des questions de même poids */
  seed?: number;
  /** style de kick-boxing choisi dans les réglages */
  kbStyle?: KbStyleChoice;
  /** techniques marquées « à revoir » */
  toReview?: readonly string[];
  /** dernière séance enregistrée : il y a combien de jours */
  lastSessionDaysAgo?: number;
  /** heure locale (0-23) */
  hour?: number;
}

export interface Suggestion {
  q: string;
  cat: QCat;
  /** sur quoi la réponse doit reposer (faq:…, app:…, tech:id, combo:id, rules:id, legend:id, combo:*, legend:*) */
  expect: string;
  /** deux questions de même clé auraient la même réponse : une seule par série */
  key: string;
  rel: number;
  /** question du pratiquant sur la technique (gardée devant au premier affichage) */
  core?: boolean;
  /** porte sur la technique à l’écran (peut ouvrir la série) */
  about?: boolean;
  /** porte sur l’écran d’où le coach est ouvert */
  screen?: boolean;
}

type Ctx = Omit<CoachContext, 'lastTechniqueId' | 'seed'>;

// ------------------------------------------------------------------------------------ helpers

function names(t: Technique, other?: Technique): Names {
  const le = theName(t);
  const art = le.startsWith('l’') ? 'l’' : le.slice(0, 3);
  const rest = le.slice(art.length);
  const by = <T,>(m: T, f: T, v: T) => (art === 'l’' ? v : art === 'la ' ? f : m);
  return {
    le,
    Le: le.charAt(0).toUpperCase() + le.slice(1),
    du: by('du ', 'de la ', 'de l’') + rest,
    au: by('au ', 'à la ', 'à l’') + rest,
    mon: by('mon ', 'ma ', 'mon ') + rest,
    other: other ? theName(other) : undefined,
  };
}

/** l’autre côté du même geste (crochet gauche ↔ crochet droit), dans la discipline */
function mirrorOf(t: Technique, d: DisciplineId): Technique | undefined {
  const side = (id: string) => (/(^|-)avant(-|$)/.test(id) || id === 'jab' ? 'avant' : /(^|-)arriere(-|$)/.test(id) || id === 'direct' ? 'arriere' : '');
  const s = side(t.id);
  if (!s) return undefined;
  return TECHNIQUES.find((x) => x.id !== t.id && x.disciplines.includes(d) && family(x.id) === family(t.id) && side(x.id) && side(x.id) !== s && !!x.id.endsWith('-corps') === !!t.id.endsWith('-corps'));
}

const DISC_NAME: Record<DisciplineId, string> = { boxe: 'boxe anglaise', kickboxing: 'kick-boxing', mma: 'MMA', muaythai: 'muay-thaï', bjj: 'jiu-jitsu brésilien', judo: 'judo' };

const FALLBACK_TEXT = /pas sûr|je n’ai pas compris|reformule|pas trouvé de réponse fiable|quelle technique veux-tu voir/i;

/** the answer really rests on what the suggestion promises */
export function answersWell(a: CoachAnswer, expect: string, ctx?: Pick<CoachContext, 'catalog'>): boolean {
  if (a.confidence < 0.5 || a.intent === 'unknown' || a.intent === 'off_topic' || FALLBACK_TEXT.test(a.text)) return false;
  const [kind, id] = [expect.slice(0, expect.indexOf(':')), expect.slice(expect.indexOf(':') + 1)];
  switch (kind) {
    case 'tech':
      return a.techniqueId === id || a.sources.some((s) => s.id === expect);
    case 'combo': {
      if (a.intent !== 'suggest_combo' || !a.sources.length) return false;
      if (id === '*') return true;
      return a.sources.some((s) => {
        if (s.id.startsWith('ex:')) return !!EXERCISE_BY_ID.get(s.id.slice(3))?.sequence.includes(id);
        if (s.id.startsWith('cat:')) return !!ctx?.catalog?.combos.find((c) => c.id === s.id.slice(4))?.sequence.includes(id);
        return false;
      });
    }
    case 'rules':
      return a.intent === 'rules' && a.techniqueId === id && a.confidence >= 0.85;
    case 'legend':
      return a.intent === 'legend' && a.sources.some((s) => s.id.startsWith('champ:')) && (id === '*' || (a.techniqueId === id && !/Aucune de ses fiches/.test(a.text)));
    default:
      return a.sources.some((s) => s.id === expect);
  }
}

/** keeps a candidate only if the local engine answers it as promised (cached per context) */
const checked = new Map<string, boolean>();
function answers(c: Suggestion, ctx: Ctx, key: string): boolean {
  const k = `${key}|${c.expect}|${c.q}`;
  let ok = checked.get(k);
  if (ok === undefined) {
    // a question about a technique (or training) never depends on the screen; one about the screen never on the technique
    const askCtx = c.screen || c.expect.startsWith('app:') ? { ...ctx, techniqueId: undefined } : { ...ctx, screen: undefined };
    ok = answersWell(askCoach(c.q, { ...askCtx, preferences: { detail: 'court' } }), c.expect, ctx);
    checked.set(k, ok);
  }
  return ok;
}

const ctxKey = (ctx: Ctx) => `${ctx.discipline}|${ctx.level}|${ctx.guard}|${ctx.catalog ? 'cat' : '-'}|${ctx.goals?.join(',') ?? ''}`;

// ------------------------------------------------------------------------------------ candidates

function faqCandidates(ids: string[], rel: (id: string, i: number) => number, extra: (id: string) => Partial<Suggestion> = () => ({})): Suggestion[] {
  const out: Suggestion[] = [];
  for (const id of ids)
    (FAQ_PHRASES[id] ?? []).forEach((p, i) => out.push({ q: p.q, cat: p.cat, expect: id, key: id, rel: rel(id, i), ...extra(id) }));
  return out;
}

/** questions about the technique on screen */
function techniqueCandidates(t: Technique, ctx: Ctx, o: SuggestOptions): Suggestion[] {
  const d = ctx.discipline;
  const striking = STRIKING.includes(d);
  const other = mirrorOf(t, d);
  const n = { ...names(t, other), style: o.kbStyle && o.kbStyle !== 'tous' ? styleLabel(o.kbStyle) : undefined };
  const tid = `tech:${t.id}`;
  const out: Suggestion[] = [];
  // the learner's own questions about this technique
  (BY_TECHNIQUE[t.id] ?? []).forEach((p, i) => out.push({ q: p.q, cat: p.cat, expect: tid, key: `q:${p.q}`, rel: 11 - i / 10, core: true, about: true }));
  // library entries linked to this technique or to its family (direct-corps → direct), then those of its category
  const fam = family(t.id);
  const linked = knowledgeBase()
    .filter((e) => e.source === 'faq' && FAQ_RANK[e.id] !== undefined && e.disciplines.includes(d) && e.related.some((r) => r === t.id || family(r) === fam))
    .map((e) => e.id);
  // jiu-jitsu, judo: no striking guard advice
  const byCat = (BY_CATEGORY[t.category] ?? []).filter((id) => striking || !['faq:garde', 'faq:menton', 'faq:retour-garde', 'faq:respiration'].includes(id));
  const kickBalance = [...linked, ...byCat].includes('faq:equilibre-pieds');
  const core = [...new Set([...linked, ...byCat])].filter((id) => !(d === 'judo' && id === 'faq:menton'));
  out.push(...faqCandidates(core, (id, i) => (i === 0 ? 10 - (FAQ_RANK[id] ?? 9) / 10 : linked.includes(id) ? 6 : 5), (id) => ({ core: true, about: linked.includes(id) })));
  for (const s of out) if (s.rel < 7) s.core = false;
  // one balance question is enough when the kick FAQ already covers it
  if (['poing', 'pied', 'genou', 'coude', 'deplacement', 'feinte', 'clinch'].includes(t.category) && !kickBalance)
    out.push({ q: 'Comment éviter de perdre l’équilibre ?', cat: 'equilibre', expect: tid, key: `${tid}#balance`, rel: 10 - FAQ_RANK.balance / 10, core: true, about: true });
  // the technique's sheet, said in many ways
  const w: When = { t, discipline: d, level: ctx.level, hasOther: !!other, striking, gaucher: ctx.guard === 'gaucher', kbStyle: o.kbStyle && o.kbStyle !== 'tous' ? o.kbStyle : undefined, toReview: !!o.toReview?.includes(t.id) };
  for (const tp of TECH_TEMPLATES) {
    if (tp.when && !tp.when(w)) continue;
    out.push({ q: tp.q(n), cat: tp.cat, expect: `${tp.expect}:${t.id}`, key: `${tid}#${tp.kind}`, rel: tp.rel, about: true });
  }
  return out;
}

/** questions about training in general (no technique on screen, or to vary the set) */
function generalCandidates(ctx: Ctx, o: SuggestOptions, withTechnique: boolean): Suggestion[] {
  const d = ctx.discipline;
  const striking = STRIKING.includes(d);
  const down = withTechnique ? 1.5 : 0;
  const ids = [...(striking ? GENERAL_STRIKING : GENERAL_GRAPPLING)];
  if (!withTechnique && striking) {
    ids.push('faq:jab-direct');
    if (d !== 'muaythai') ids.push('faq:crochet-uppercut');
    if (d !== 'boxe') ids.push('faq:hauteurs-kicks');
    if (d === 'muaythai' || d === 'mma') ids.push('faq:teep');
    if (d === 'muaythai') ids.push('faq:coudes');
    ids.push('faq:pivot-pied-arriere', 'faq:rotation-hanches');
  }
  if (ctx.level === 'debutant' && striking) ids.push('faq:debuter');
  if (ctx.guard === 'gaucher' && striking) ids.push('faq:gaucher');
  const out = faqCandidates(ids, (_id, i) => (i === 0 ? 6 : 5) - down);
  // « Je commence la boxe » only in boxing
  if (d !== 'boxe') out.splice(0, out.length, ...out.filter((s) => !s.q.startsWith('Je commence la boxe')));
  const sug = (q: string, cat: QCat, expect: string, rel: number, key = expect): Suggestion => ({ q, cat, expect, key, rel: rel - down });
  // exercises and combinations of the discipline
  out.push(sug('Propose-moi une combinaison adaptée à mon niveau.', 'combos', 'combo:*', 6));
  out.push(sug('Une idée d’exercice pour aujourd’hui ?', 'combos', 'combo:*', 5.5));
  const h = o.hour;
  if (h !== undefined) {
    const when = h >= 5 && h < 12 ? 'ce matin' : h >= 12 && h < 18 ? 'cet après-midi' : 'ce soir';
    out.push(sug(`Que travailler ${when} ?`, 'combos', 'combo:*', 7));
    if (h >= 21 || h < 5) out.push(sug('Comment bien récupérer avant d’aller dormir ?', 'recuperation', 'faq:repos', 6.5));
  }
  for (const g of ctx.goals ?? []) {
    if (g === 'cardio') out.push(sug('Un exercice pour travailler mon cardio ?', 'combos', 'combo:*', 6.5));
    if (g === 'defense') out.push(sug('Un exercice pour travailler ma défense ?', 'combos', 'combo:*', 6.5));
  }
  // last session
  const ago = o.lastSessionDaysAgo;
  if (ago === 0) out.push(sug('J’ai déjà fait une séance aujourd’hui : comment bien récupérer ?', 'recuperation', 'faq:repos', 7));
  else if (ago !== undefined && ago >= 3) out.push(sug('Je reprends après quelques jours : comment bien m’échauffer ?', 'securite', 'faq:echauffement', 7));
  // techniques the learner marked « à revoir »
  if (!withTechnique)
    for (const id of (o.toReview ?? []).filter((x) => TECHNIQUE_BY_ID.get(x)?.disciplines.includes(d)).slice(0, 2)) {
      const n = names(TECHNIQUE_BY_ID.get(id)!);
      out.push({ q: `Une astuce pour progresser sur ${n.le} ?`, cat: 'erreurs', expect: `tech:${id}`, key: `tech:${id}#improve`, rel: 7.5 });
      out.push({ q: `Montre-moi ${n.le} au ralenti.`, cat: 'demo', expect: `tech:${id}`, key: `tech:${id}#slow`, rel: 6 });
    }
  // kick-boxing rules
  if (d === 'kickboxing') {
    out.push(sug('Quelles sont les règles du kick-boxing ?', 'regles', 'app:kb-styles', 6));
    out.push(sug('C’est quoi le K1 ?', 'regles', 'app:kb-styles', 5.5));
    if (o.kbStyle && o.kbStyle !== 'tous') out.push(sug(`Qu’est-ce qui est permis ${styleLabel(o.kbStyle)} ?`, 'regles', 'app:kb-styles', 6.5));
  }
  // Légendes: a champion's style (champions library)
  if (striking) {
    out.push(sug(`Parle-moi du style d’une légende de ${DISC_NAME[d]}.`, 'legendes', 'legend:*', 5));
    out.push(sug('Raconte-moi le style d’un champion des Légendes.', 'legendes', 'legend:*', 4.5));
  }
  for (const a of APP_ANYWHERE) out.push({ q: a.q, cat: a.cat ?? 'app', expect: a.expect, key: a.expect, rel: 3.5 - down });
  return out;
}

/** questions about the screen the coach is opened from: the first two lead, the others rotate */
function screenCandidates(screen: CoachScreen): Suggestion[] {
  return (SCREEN_POOL[screen] ?? []).map((s: ScreenQ, i) => ({ q: s.q, cat: 'app', expect: s.expect, key: s.expect, rel: i === 0 ? 12 : i === 1 ? 11 : 7, screen: true }));
}

/** every candidate for a context, before the engine check */
export function rawCandidates(ctx: Ctx, o: SuggestOptions = {}): Suggestion[] {
  const t = ctx.techniqueId ? TECHNIQUE_BY_ID.get(ctx.techniqueId) : undefined;
  return [...(ctx.screen ? screenCandidates(ctx.screen) : []), ...(t ? techniqueCandidates(t, ctx, o) : []), ...generalCandidates(ctx, o, !!t)];
}

/** raw candidates without duplicate phrasing, and a check against the engine done on demand (cached) */
function prepared(ctx: Ctx, o: SuggestOptions) {
  const key = `${ctxKey(ctx)}|${ctx.techniqueId ?? ''}|${o.kbStyle ?? ''}`;
  const seenQ = new Set<string>();
  const cands = rawCandidates(ctx, o).filter((c) => {
    const n = normalize(c.q);
    if (seenQ.has(n)) return false;
    seenQ.add(n);
    return true;
  });
  const ok = (c: Suggestion) => answers(c, ctx, c.screen ? `${key}|${ctx.screen}` : key);
  return { cands, ok };
}

/** every candidate for a context, each one checked against the engine */
export function candidatesFor(ctx: Ctx, o: SuggestOptions = {}): Suggestion[] {
  const { cands, ok } = prepared(ctx, o);
  return cands.filter(ok);
}

// ------------------------------------------------------------------------------------ choice

/** lowest weight of the learner's own questions about a technique */
const CORE_FLOOR = 8.7;

/** order-preserving jitter in [0, 1) from the seed and the question */
const jitter = (seed: number, q: string) => (hash(`${seed}|${q}`) % 1000) / 1000;

/** shown recently: the more recent, the further back */
function seenPenalty(q: string, seen: readonly string[]) {
  const i = seen.indexOf(q);
  return i < 0 ? 0 : 6 + 4 * (1 - i / SEEN_MAX);
}

/**
 * Up to `max` suggested questions for the context. In front: the most relevant one (about the technique
 * on screen, or about the screen itself), then one about the screen; the rest mixes categories (at most
 * two per category, one question per answer), leaving out what was shown recently. Candidates are
 * checked against the engine in the order they are considered, so only a few questions are asked.
 */
export function pickSuggestions(ctx: Ctx, max = 6, o: SuggestOptions = {}): Suggestion[] {
  const { cands, ok } = prepared(ctx, o);
  const seen = o.seen ?? [];
  const seed = o.seed ?? 0;
  // core questions keep their order on a first display; the others are shuffled by the seed
  // (the shuffle never lifts another question above the learner's own ones, which start at 8.8)
  const base = (c: Suggestion) => {
    const j = jitter(seed, `${ctx.screen}|${ctx.techniqueId}|${c.q}`);
    if (c.core) return c.rel + j * 0.05;
    if (c.screen) return c.rel + j * 0.4;
    return c.rel < CORE_FLOOR ? Math.min(c.rel + j * 2.5, CORE_FLOOR - 0.1) : c.rel + j * 0.05;
  };
  const score = new Map(cands.map((c) => [c, base(c) - seenPenalty(c.q, seen)]));
  const picked: Suggestion[] = [];
  const count = new Map<QCat, number>();
  const keys = new Set<string>();
  const free = (c: Suggestion) => !picked.includes(c) && !keys.has(c.key) && (count.get(c.cat) ?? 0) < 2;
  /** the best free candidate of a list that the engine answers well */
  const best = (xs: Suggestion[], adj: (c: Suggestion) => number = (c) => score.get(c)!) =>
    xs
      .filter(free)
      .sort((a, b) => adj(b) - adj(a))
      .find(ok);
  const take = (c?: Suggestion) => {
    if (!c) return;
    picked.push(c);
    keys.add(c.key);
    count.set(c.cat, (count.get(c.cat) ?? 0) + 1);
  };
  const about = cands.filter((c) => c.about);
  const screenQs = cands.filter((c) => c.screen);
  const hasTech = !!ctx.techniqueId && about.some(ok);
  // 1. the lead: on a technique sheet, its screen question; with a technique, the best question about it; else the screen's
  if (hasTech && ctx.screen !== 'technique') take(best(about));
  else take(best(screenQs.length ? screenQs : cands));
  // 2. one question about the screen (two without a technique), right after, as long as it was not shown lately
  for (let i = picked.filter((c) => c.screen).length; i < (hasTech ? 1 : 2); i++) take(best(screenQs.filter((c) => !seen.includes(c.q))));
  if (hasTech && ctx.screen === 'technique') take(best(about));
  // 3. the rest: best score, other categories first; with a technique, one « Montre-moi » is always offered
  const adj = (c: Suggestion) => score.get(c)! - (c.core ? 0 : 1.5 * (count.get(c.cat) ?? 0));
  while (picked.length < max) {
    const needDemo = hasTech && picked.length === max - 1 && !picked.some((c) => c.cat === 'demo');
    // with a technique, one question about the screen is enough
    const rest = hasTech ? cands.filter((x) => !x.screen) : cands;
    const c = (needDemo && best(rest.filter((x) => x.cat === 'demo'), adj)) || best(rest, adj);
    if (!c) break;
    take(c);
  }
  return picked;
}

/**
 * Up to `max` suggested questions (texts), each one checked against the engine. Without options, the
 * first display: the most relevant questions, in a stable order.
 */
export function suggestedQuestions(ctx: Ctx, max = 6, o: SuggestOptions = {}): string[] {
  return pickSuggestions(ctx, max, o).map((c) => c.q);
}

/** questions about the screen, each one checked against the engine (in order of the pool) */
export function screenQuestions(ctx: Ctx): string[] {
  return ctx.screen ? candidatesFor({ ...ctx, techniqueId: undefined }).filter((c) => c.screen).map((c) => c.q) : [];
}

/** the « seen » list after a display: newest first, without duplicates, at most SEEN_MAX */
export function rememberShown(seen: readonly string[], shown: readonly string[]): string[] {
  const fresh = shown.filter((q, i) => q && shown.indexOf(q) === i);
  return [...fresh, ...seen.filter((q) => !fresh.includes(q))].slice(0, SEEN_MAX);
}

/** questions de chaque écran (rétro-compatibilité des tests : la banque complète est SCREEN_POOL) */
export const SCREEN_QUESTIONS = SCREEN_POOL;
