/**
 * Compréhension des questions en français (règles, sans réseau).
 *
 * - normalisation accents / casse / ponctuation (voir text.ts) ;
 * - repérage des techniques : noms, identifiants et appels de TECHNIQUES + synonymes courants
 *   (cross = direct = droit arrière, middle = coup de pied circulaire au corps…) ;
 * - repérage des techniques qui n’existent PAS dans la bibliothèque (pour ne rien inventer) ;
 * - détection de l’intention.
 */
import { EXERCISE_BY_ID } from '../domain/exercises';
import { TECHNIQUES, TECHNIQUE_BY_ID } from '../domain/techniques';
import { hasAny, hasPhrase, hasPrefix, normalize } from './text';

export type CoachIntent =
  | 'explain'
  | 'why'
  | 'improve'
  | 'difference'
  | 'demo'
  | 'slow'
  | 'repeat'
  | 'suggest_combo'
  | 'balance'
  | 'smalltalk'
  | 'cant_see'
  | 'safety'
  | 'off_topic'
  | 'unknown_technique'
  | 'unknown';

export interface ParsedQuestion {
  raw: string;
  text: string;
  intent: CoachIntent;
  /** techniques citées, dans l’ordre d’apparition (identifiants existants uniquement) */
  techniques: string[];
  /** technique principale : la première citée par un nom précis (sinon la première citée) */
  primary?: string;
  /** expressions de techniques absentes de la bibliothèque (ex. « spinning back fist ») */
  unknownMoves: string[];
  /** la question parle d’un domaine connu (combat, entraînement) */
  inDomain: boolean;
  /** demande dangereuse (bagarre de rue, perte de poids extrême…) */
  dangerous: boolean;
}

/** synonymes écrits à la main ; `generic` = expression vague, moins prioritaire qu’un nom précis */
const SYNONYMS: [id: string, phrases: string[], generic?: boolean][] = [
  ['garde', ['position de garde', 'garde de base', 'stance', 'se mettre en garde']],
  ['jab', ['jab', 'direct avant', 'direct du bras avant', 'direct gauche', 'coup droit avant']],
  ['direct', ['cross', 'direct', 'direct arriere', 'droit arriere', 'direct droit', 'direct du bras arriere', 'coup droit arriere']],
  ['crochet-avant', ['crochet gauche', 'crochet avant', 'crochet du bras avant', 'hook gauche', 'left hook', 'hook avant']],
  ['crochet-arriere', ['crochet droit', 'crochet arriere', 'crochet du bras arriere', 'hook droit', 'right hook', 'hook arriere']],
  ['crochet-avant', ['crochet', 'crochets', 'hook'], true],
  ['crochet-avant-corps', ['crochet au foie', 'crochet au corps', 'crochet gauche au corps']],
  ['uppercut-avant', ['uppercut gauche', 'uppercut avant', 'upper gauche', 'upper avant']],
  ['uppercut-arriere', ['uppercut droit', 'uppercut arriere', 'upper droit', 'upper arriere']],
  ['uppercut-arriere', ['uppercut', 'uppercuts', 'upper'], true],
  ['jab-corps', ['jab au corps', 'jab au ventre']],
  ['direct-corps', ['direct au corps', 'cross au corps']],
  ['esquive-droite', ['esquive', 'esquiver', 'esquive exterieure', 'slip'], true],
  ['roll-droite', ['roll', 'rouler sous le crochet', 'passer sous le crochet', 'rotation sous le crochet'], true],
  ['blocage-haut', ['blocage', 'bloquer', 'couverture', 'se couvrir'], true],
  ['parade', ['parade', 'parer', 'parry']],
  ['retrait', ['retrait de buste', 'retrait', 'pull back']],
  ['check-avant', ['check', 'checker', 'bloquer le low kick', 'blocage tibia', 'bloquer avec le tibia']],
  ['front-kick-avant', ['front kick', 'coup de pied de face', 'coup de pied direct', 'mae geri']],
  ['teep-avant', ['teep', 'push kick', 'coup de pied repoussant', 'teep avant']],
  ['low-kick-arriere', ['low kick', 'low', 'coup de pied bas', 'coup de pied dans les jambes', 'coup de pied a la cuisse'], true],
  ['low-kick-arriere', ['low kick droit', 'low kick arriere']],
  ['low-kick-avant', ['low kick gauche', 'low kick avant', 'low kick interieur']],
  ['middle-kick-arriere', ['middle kick', 'middle', 'mid kick', 'coup de pied circulaire au corps', 'coup de pied au corps', 'body kick'], true],
  ['middle-kick-arriere', ['middle kick droit', 'middle kick arriere']],
  ['middle-kick-avant', ['middle kick gauche', 'middle kick avant']],
  ['high-kick-arriere', ['high kick', 'high', 'head kick', 'coup de pied a la tete', 'coup de pied circulaire a la tete', 'coup de pied haut'], true],
  ['high-kick-arriere', ['high kick droit', 'high kick arriere']],
  ['high-kick-avant', ['high kick gauche', 'high kick avant']],
  ['roundhouse-arriere', ['roundhouse', 'roundhouse kick', 'coup de pied circulaire', 'circulaire', 'fouette'], true],
  ['genou-direct-arriere', ['coup de genou', 'coups de genou', 'un genou', 'knee', 'genou direct'], true],
  ['genou-circulaire-arriere', ['genou circulaire', 'genou de cote']],
  ['coude-horizontal-avant', ['coup de coude', 'coups de coude', 'un coude', 'elbow', 'coude horizontal'], true],
  ['coude-diagonal-arriere', ['coude diagonal', 'coude descendant']],
  ['coude-montant-arriere', ['coude remontant', 'coude montant']],
  ['clinch-tirage', ['clinch', 'plum', 'saisie de nuque']],
  ['overhand', ['overhand', 'over hand']],
  ['feinte-jab', ['feinte', 'feintes', 'feinter'], true],
  ['feinte-epaule', ['feinte d epaule', 'feinte de l epaule']],
  ['feinte-lutte', ['feinte de lutte', 'feinte de takedown']],
  ['changement-niveau', ['changement de niveau', 'level change', 'changer de niveau']],
  ['entree-lutte', ['double leg', 'double jambe', 'entree en lutte', 'takedown', 'amenee', 'projection']],
  ['sprawl', ['sprawl', 'sprawler']],
  ['defense-lutte', ['defense de lutte', 'defendre une amenee', 'defense contre le takedown']],
  ['descente-sol', ['descente au sol', 'aller au sol']],
  ['sortie-hanche', ['sortie de hanche', 'shrimp', 'crevette']],
  ['releve-technique', ['releve technique', 'technical stand up', 'se relever']],
  ['pas-avant', ['pas avant', 'pas en avant']],
  ['pas-arriere', ['pas arriere', 'pas en arriere']],
  ['pas-gauche', ['pas lateral gauche', 'pas a gauche']],
  ['pas-droite', ['pas lateral droit', 'pas a droite']],
  ['pivot-droite', ['le pivot', 'un pivot', 'pivot'], true],
  ['sortie-angle', ['sortie d angle', 'sortir en angle', 'changer d angle']],
];

/**
 * Gestes de sports de combat qui ne sont PAS dans la bibliothèque validée : on les reconnaît pour
 * répondre honnêtement au lieu de rapprocher la question d’une technique voisine.
 */
const UNKNOWN_MOVES = [
  'spinning back fist', 'back fist', 'backfist', 'revers de poing', 'superman punch', 'superman', 'spinning back kick', 'back kick',
  'coup de pied retourne', 'coup de pied arriere', 'retourne', 'side kick', 'coup de pied lateral', 'chasse', 'chasse frontal', 'chasse lateral',
  'tornado kick', 'coup de pied saute', 'flying knee', 'genou saute', 'genou volant', 'axe kick', 'hache', 'question mark kick',
  'crescent kick', 'coup de pied crochet', 'hook kick', 'spinning elbow', 'coude retourne', 'calf kick', 'oblique kick',
  'kimura', 'triangle', 'armbar', 'cle de bras', 'etranglement', 'guillotine', 'rear naked choke', 'rnc', 'clef de bras', 'soumission',
  'single leg', 'suplex', 'balayage', 'sweep', 'mount', 'montee', 'ground and pound', 'kesa gatame', 'mae geri keage', 'ura mawashi',
  'mawashi geri', 'yoko geri', 'ushiro geri', 'hadoken', 'coup de tete', 'headbutt', 'coup de boule', 'shovel hook', 'bolo punch', 'gazelle punch',
  'cartwheel kick', 'twister', 'teep saute', 'cobra punch', 'spinning hook kick', 'switch kick',
];

/** vocabulaire du domaine (pour distinguer « hors sujet » de « je ne sais pas ») */
const DOMAIN = [
  'garde', 'coup', 'frappe', 'frapper', 'poing', 'pied', 'pieds', 'jambe', 'jambes', 'hanche', 'hanches', 'kick', 'boxe', 'muay', 'thai', 'mma',
  'kickboxing', 'kick boxing', 'entrainement', 'entrainer', 'round', 'rounds', 'technique', 'techniques', 'combat', 'defense', 'defendre',
  'souffle', 'respiration', 'respirer', 'echauffement', 'recuperation', 'repos', 'adversaire', 'shadow', 'sac', 'gants', 'combinaison',
  'enchainement', 'serie', 'exercice', 'seance', 'equilibre', 'menton', 'epaule', 'coude', 'genou', 'tibia', 'talon', 'pivoter', 'pivot',
  'puissance', 'vitesse', 'distance', 'angle', 'deplacement', 'lutte', 'sol', 'cardio', 'niveau', 'debutant', 'expert', 'champion', 'ring',
  'cage', 'sparring', 'esquive', 'bloquer', 'uppercut', 'crochet', 'jab', 'direct', 'gaucher', 'orthodoxe', 'muscle', 'souplesse', 'mains',
  'demo', 'demonstration', 'ralenti', 'mouvement', 'geste', 'posture', 'appui', 'appuis', 'main', 'bras', 'poignet',
];

const OFF_TOPIC = [
  'meteo', 'temps qu il fait', 'recette', 'cuisine', 'football', 'film', 'serie tele', 'netflix', 'politique', 'election', 'bourse', 'bitcoin',
  'crypto', 'programmation', 'code', 'devoirs', 'maths', 'blague', 'chanson', 'musique', 'voiture', 'jeu video', 'horoscope', 'actualite',
  'capitale', 'president', 'traduis', 'traduction', 'poeme', 'histoire de france',
];

const DANGEROUS = [
  'bagarre', 'me battre dans la rue', 'se battre dans la rue', 'combat de rue', 'street fight', 'blesser quelqu un', 'faire mal a quelqu un',
  'mettre ko quelqu un', 'assommer quelqu un', 'tuer', 'arme', 'couteau', 'perdre du poids vite', 'perte de poids rapide', 'secher en',
  'deshydrat', 'diuretique', 'steroide', 'anabolisant', 'dopage', 'dopant', 'couper le poids', 'jeuner',
];

interface Alias {
  id: string;
  phrase: string;
  generic: boolean;
}

let aliasCache: Alias[] | null = null;

function aliases(): Alias[] {
  if (aliasCache) return aliasCache;
  const out = new Map<string, Alias>();
  const add = (id: string, p: string, generic: boolean) => {
    const phrase = normalize(p);
    if (!phrase || !TECHNIQUE_BY_ID.has(id)) return;
    const prev = out.get(phrase);
    // un nom précis l’emporte sur une expression générique identique
    if (!prev || (prev.generic && !generic)) out.set(phrase, { id, phrase, generic });
  };
  for (const t of TECHNIQUES) {
    add(t.id, t.name, false);
    // « garde » seul est trop courant (« garde haute ») : expression générique
    add(t.id, t.id.replace(/-/g, ' '), t.id === 'garde');
    // les appels d’un seul mot (« Genou », « Coude », « Bloque ») sont trop vagues : ignorés
    if (normalize(t.call).split(' ').length >= 2) add(t.id, t.call, false);
  }
  for (const [id, phrases, generic] of SYNONYMS) for (const p of phrases) add(id, p, !!generic);
  aliasCache = [...out.values()].sort((a, b) => b.phrase.length - a.phrase.length);
  return aliasCache;
}

/** remplace par des espaces les zones déjà reconnues (évite qu’un sous-mot soit compté deux fois) */
function blank(text: string, start: number, len: number) {
  return text.slice(0, start) + ' '.repeat(len) + text.slice(start + len);
}

function findPhrase(padded: string, phrase: string): number {
  const i = padded.indexOf(` ${phrase} `);
  return i < 0 ? -1 : i + 1;
}

/**
 * Techniques citées dans un texte normalisé : expressions les plus longues d’abord ; une expression
 * précise prime sur une générique. Les gestes inconnus sont repérés avant et masqués.
 */
export function findTechniques(text: string): { techniques: string[]; primary?: string; unknownMoves: string[] } {
  let padded = ` ${text} `;
  const unknownMoves: string[] = [];
  for (const u of [...UNKNOWN_MOVES].sort((a, b) => b.length - a.length)) {
    const i = findPhrase(padded, u);
    if (i >= 0) {
      unknownMoves.push(u);
      padded = blank(padded, i, u.length);
    }
  }
  const hits: { id: string; pos: number; generic: boolean }[] = [];
  for (const a of aliases()) {
    let i = findPhrase(padded, a.phrase);
    while (i >= 0) {
      hits.push({ id: a.id, pos: i, generic: a.generic });
      padded = blank(padded, i, a.phrase.length);
      i = findPhrase(padded, a.phrase);
    }
  }
  hits.sort((a, b) => a.pos - b.pos);
  const precise = hits.filter((h) => !h.generic);
  // une expression générique (« crochet ») n’ajoute rien si une technique précise de la même famille est déjà citée
  const out: string[] = [];
  for (const h of hits) {
    if (h.generic && precise.some((p) => family(p.id) === family(h.id))) continue;
    if (!out.includes(h.id)) out.push(h.id);
  }
  return { techniques: out, primary: precise.find((p) => out.includes(p.id))?.id ?? out[0], unknownMoves };
}

/** famille d’une technique (crochet-avant et crochet-arriere → « crochet ») */
export function family(id: string): string {
  return id.replace(/-(avant|arriere)(-corps)?$/, '').replace(/-(droite|gauche)$/, '');
}

const CANT_SEE = [
  'corrige', 'corriger', 'corrige moi', 'tu me vois', 'tu peux me voir', 'me regarder', 'regarde moi', 'tu me regardes', 'est ce que je fais bien',
  'je fais bien', 'je le fais bien', 'c est bien fait', 'je m y prends bien', 'ma technique est bonne', 'mon mouvement est bon', 'analyse mon',
  'analyse ma', 'evalue', 'evaluer', 'note ma', 'note mon', 'verifie ma', 'verifie mon', 'tu vois mon', 'tu vois ma', 'filme moi', 'ma camera',
  'avec la camera', 'detecte', 'mes erreurs', 'qu est ce que je fais mal', 'je fais mal', 'comment je m en sors', 'tu as vu',
  'points faibles', 'mon point faible', 'mes defauts', 'quel est mon niveau', 'je progresse', 'est ce que je progresse',
];
const SAFETY = ['douleur', 'douleurs', 'j ai mal', 'mal au', 'mal a la', 'mal aux', 'blesse', 'blessure', 'entorse', 'vertige', 'vertiges', 'malaise', 'saigne', 'tendinite', 'luxation', 'claquage', 'poitrine qui serre', 'je n arrive plus a respirer'];
const GREET = ['bonjour', 'salut', 'coucou', 'hello', 'bonsoir', 'hey', 'yo', 'merci', 'ca va', 'qui es tu', 'tu es qui', 'que peux tu faire', 'tu sers a quoi', 'aide', 'aide moi', 'help', 'tu sais faire quoi', 'au revoir', 'a plus'];
const SLOW = ['ralenti', 'au ralenti', 'lentement', 'doucement', 'plus lent', 'moins vite', 'slow', 'decompose', 'decomposer', 'pas a pas'];
const REPEAT = ['repete', 'repeter', 'encore', 'recommence', 'recommencer', 'refais', 'refaire', 'une autre fois', 'a nouveau', 'rejoue', 'rejouer', 'revoir', 'encore une fois', 'de nouveau'];
const DEMO = ['montre', 'montre moi', 'montrer', 'demo', 'demonstration', 'fais voir', 'fais moi voir', 'voir le', 'voir la', 'je veux voir', 'execute', 'fais le', 'fais la'];
const COMBO = ['combinaison', 'combinaisons', 'combo', 'combos', 'enchainement', 'enchainements', 'serie de coups', 'quoi travailler', 'que travailler', 'que dois je travailler', 'quel exercice', 'un exercice', 'propose', 'propose moi', 'suggere', 'suggestion', 'idee d exercice', 'programme du jour'];
const DIFF = ['difference', 'differences', 'differencier', 'different', 'differents', 'distinguer', 'compare', 'comparer', 'comparaison', 'vs', 'versus', 'par rapport'];
const BALANCE = ['equilibre', 'desequilibre', 'stabilite', 'stable', 'tomber', 'je tombe', 'tenir sur une jambe', 'vaciller', 'perdre l equilibre'];
const IMPROVE = ['ameliorer', 'ameliore', 'progresser', 'perfectionner', 'plus fort', 'plus vite', 'plus rapide', 'plus puissant', 'conseil', 'conseils', 'astuce', 'astuces', 'mieux', 'travailler mon', 'travailler ma', 'erreur', 'erreurs', 'optimiser', 'renforcer', 'gagner en', 'devenir meilleur'];
const WHY = ['pourquoi', 'a quoi sert', 'ca sert a quoi', 'sert a quoi', 'interet', 'utilite', 'quel est le but', 'pour quelle raison', 'a quoi ca sert'];
const EXPLAIN = ['comment', 'explique', 'expliquer', 'c est quoi', 'qu est ce', 'decris', 'decrire', 'que faut il', 'comment faire', 'comment on fait', 'qu est ce que', 'definition', 'details', 'detaille', 'ou placer', 'ou mettre', 'comment placer', 'comment utiliser'];

/** analyse complète d’une question */
export function parseQuestion(raw: string, opts: { exerciseId?: string } = {}): ParsedQuestion {
  const text = normalize(raw);
  const found = findTechniques(text);
  const { techniques, unknownMoves } = found;
  // « cet exercice », « l’exercice » : les techniques de l’exercice en cours
  if (!techniques.length && opts.exerciseId && hasAny(text, ['cet exercice', 'l exercice', 'cette combinaison', 'cet enchainement'])) {
    const ex = EXERCISE_BY_ID.get(opts.exerciseId);
    if (ex) for (const id of ex.sequence) if (!techniques.includes(id)) techniques.push(id);
  }
  const inDomain = techniques.length > 0 || unknownMoves.length > 0 || hasAny(text, DOMAIN) || hasPrefix(text, ['frapp', 'entrain', 'combat', 'boxe', 'kick', 'pivot', 'esquiv', 'respir', 'echauff', 'deplac']);
  const dangerous = hasAny(text, DANGEROUS) || hasPrefix(text, ['deshydrat', 'steroid', 'anabolis', 'dopa']);
  const base = { raw, text, techniques, primary: found.primary ?? techniques[0], unknownMoves, inDomain, dangerous };
  const r = (intent: CoachIntent): ParsedQuestion => ({ ...base, intent });

  if (!text) return r('unknown');
  if (dangerous) return r('off_topic');
  if (hasAny(text, SAFETY)) return r('safety');
  if (hasAny(text, CANT_SEE) || hasPrefix(text, ['corrig'])) return r('cant_see');
  if (unknownMoves.length && !techniques.length) return r('unknown_technique');
  const actionWords = hasAny(text, SLOW) || hasAny(text, REPEAT) || hasAny(text, DEMO);
  if (hasAny(text, GREET) && !techniques.length && !actionWords && text.split(' ').length <= 6 && !hasAny(text, COMBO)) return r('smalltalk');
  const asksWhy = hasAny(text, WHY);
  const asksOther = asksWhy || hasAny(text, IMPROVE) || hasAny(text, EXPLAIN) || hasAny(text, COMBO);
  if (hasAny(text, SLOW) && !asksWhy) return r('slow');
  if (hasAny(text, DEMO) && !asksWhy) return r('demo');
  if (hasAny(text, REPEAT) && !asksOther) return r('repeat');
  if (hasAny(text, DIFF) || (techniques.length >= 2 && hasPhrase(text, 'ou'))) return r('difference');
  if (hasAny(text, COMBO) && !asksWhy) return r('suggest_combo');
  if (hasAny(text, BALANCE) || hasPrefix(text, ['equilib', 'desequilib'])) return r('balance');
  if (hasAny(text, IMPROVE) || hasPrefix(text, ['amelior', 'progress', 'perfection'])) return r('improve');
  if (asksWhy) return r('why');
  if (hasAny(text, EXPLAIN) || techniques.length) return r('explain');
  if (hasAny(text, OFF_TOPIC) || !inDomain) return r('off_topic');
  return r('unknown');
}
