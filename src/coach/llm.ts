/**
 * Interface d’un moteur de langage embarqué (LLM sur l’appareil), AUCUNE implémentation activée.
 *
 * Le moteur de recherche locale (engine.ts) reste la seule source des actions et des sources.
 * Un LLM éventuel ne ferait que reformuler, à partir des passages retrouvés dans la bibliothèque
 * validée, et sa sortie est contrôlée : en cas de doute, la réponse de la base locale est gardée.
 * Voir docs/COACH_IA.md pour l’étude (LiteRT-LM sur Android, WebLLM / transformers.js sur le web).
 */
import { askCoach, groundingPassages, type CoachAnswer, type CoachContext } from './engine';
import { normalize } from './text';

export interface GroundingPassage {
  id: string;
  title: string;
  text: string;
}

export interface LlmRequest {
  system: string;
  question: string;
  passages: GroundingPassage[];
  /** réponse de la base locale, à reformuler sans rien ajouter */
  draft: string;
  maxTokens: number;
}

export interface LlmEngine {
  /** ex. 'litert-lm:gemma3-1b' ; affiché dans les réglages */
  id: string;
  /** vrai seulement si le modèle est présent sur l’appareil et chargeable hors ligne */
  available(): Promise<boolean>;
  generate(req: LlmRequest, signal?: AbortSignal): Promise<string>;
}

export const SYSTEM_PROMPT = [
  'Tu es le coach d’une application d’entraînement solo (shadow) en boxe anglaise, kick-boxing, MMA et muay-thaï.',
  'Réponds en français, en tutoyant, en 2 à 5 phrases, adaptées au niveau indiqué.',
  'Utilise UNIQUEMENT les informations des passages fournis et du brouillon. N’invente aucune technique, aucun chiffre, aucun conseil absent des passages.',
  'Tu ne vois pas l’utilisateur : ne prétends jamais observer, analyser ou corriger ses mouvements.',
  'Aucun conseil médical : en cas de douleur, dis d’arrêter et de consulter un professionnel de santé.',
  'Si les passages ne répondent pas à la question, dis-le simplement.',
].join('\n');

/** mots interdits dans une sortie de LLM (prétendre voir, conseils médicaux) */
const FORBIDDEN = ['je te vois', 'je vois que tu', 'je t ai vu', 'ta posture est', 'tu fais bien', 'tu fais mal', 'medicament', 'anti inflammatoire', 'ibuprofene', 'diagnostic'];

/** contrôle minimal d’une sortie de LLM ; false = on garde la réponse de la base locale */
export function acceptLlmOutput(out: string): boolean {
  const t = normalize(out);
  if (t.length < 20 || t.length > 1200) return false;
  return !FORBIDDEN.some((f) => ` ${t} `.includes(` ${f} `));
}

let registered: LlmEngine | null = null;

/** enregistre un moteur (aucun par défaut) */
export function registerLlm(engine: LlmEngine | null) {
  registered = engine;
}

const REPHRASE: CoachAnswer['intent'][] = ['explain', 'why', 'improve', 'balance', 'difference'];

/**
 * Variante asynchrone : base locale d’abord, reformulation par le LLM seulement si un moteur est
 * enregistré, disponible, et que la base a trouvé des sources. Actions et sources restent celles de la base.
 */
export async function askCoachAsync(question: string, context: CoachContext, engine: LlmEngine | null = registered, signal?: AbortSignal): Promise<CoachAnswer> {
  const base = askCoach(question, context);
  if (!engine || !REPHRASE.includes(base.intent) || !base.sources.length || base.confidence < 0.4) return base;
  try {
    if (!(await engine.available())) return base;
    const passages = groundingPassages(question, context).map(({ id, title, text }) => ({ id, title, text }));
    const system = `${SYSTEM_PROMPT}\nNiveau : ${context.level}. Discipline : ${context.discipline}. Garde : ${context.guard}.${context.pseudo ? ` Pseudo : ${context.pseudo}.` : ''}`;
    const out = await engine.generate({ system, question, passages, draft: base.text, maxTokens: 220 }, signal);
    return acceptLlmOutput(out) ? { ...base, text: out.trim(), engine: 'llm' } : base;
  } catch {
    return base;
  }
}
