/**
 * Banque des questions suggérées par le coach IA (0.27, Youssef 2026-10-20 22:00 : « Les questions
 * pré-programmées IA doivent être diverses et variées pour que le user n’ait pas une impression de
 * répétition »).
 *
 * Chaque question dit sur quoi sa réponse doit reposer (`expect`) : une entrée de la FAQ (faq:…), du
 * guide de l’application (app:…), la fiche de la technique (tech:…), un exercice qui la contient
 * (combo:…), les règlements du kick-boxing (rules:…) ou la bibliothèque des champions (legend:…).
 * suggest.ts ne garde que celles que le moteur local sait vraiment répondre de cette façon.
 *
 * Ton : tutoiement, léger, varié (pas seulement « Comment… ? »).
 */
import type { CoachScreen } from './appGuide';
import type { DisciplineId, LevelId, Technique, TechniqueCategory } from '../domain/types';

export type QCat =
  | 'forme'
  | 'erreurs'
  | 'pourquoi'
  | 'respiration'
  | 'garde'
  | 'deplacement'
  | 'puissance'
  | 'vitesse'
  | 'equilibre'
  | 'combos'
  | 'demo'
  | 'comparaison'
  | 'securite'
  | 'recuperation'
  | 'mental'
  | 'progres'
  | 'regles'
  | 'legendes'
  | 'app';

/** noms d’une technique, déclinés pour les gabarits (« le jab », « du jab », « au jab », « mon jab ») */
export interface Names {
  le: string;
  Le: string;
  du: string;
  au: string;
  mon: string;
  /** autre technique de la même famille, de l’autre côté (« le crochet droit ») */
  other?: string;
  /** style de kick-boxing choisi (« en K1 ») */
  style?: string;
}

/** une question sur la technique à l’écran */
export interface TechTemplate {
  cat: QCat;
  q: (n: Names) => string;
  /** tech | combo | rules | legend : sur quoi la réponse repose, pour cette technique */
  expect: 'tech' | 'combo' | 'rules' | 'legend';
  /** famille de réponse : deux questions de même famille donnent la même réponse, une seule par série */
  kind: string;
  rel: number;
  when?: (w: When) => boolean;
}

export interface When {
  t: Technique;
  discipline: DisciplineId;
  level: LevelId;
  hasOther: boolean;
  striking: boolean;
  gaucher: boolean;
  /** style de kick-boxing choisi (hors « tous ») */
  kbStyle?: 'k1' | 'low-kick' | 'full-contact';
  toReview: boolean;
}

export const STRIKING: DisciplineId[] = ['boxe', 'kickboxing', 'mma', 'muaythai'];
const STRIKE_CATS: TechniqueCategory[] = ['poing', 'pied', 'genou', 'coude', 'feinte', 'clinch'];
const strikes = (w: When) => STRIKE_CATS.includes(w.t.category);
const KB_STYLE_LABEL = { k1: 'en K1', 'low-kick': 'en style low kick', 'full-contact': 'en full contact' } as const;

export const TECH_TEMPLATES: TechTemplate[] = [
  // forme : la fiche, dite autrement à chaque fois
  { cat: 'forme', kind: 'explain', rel: 8, expect: 'tech', q: (n) => `Explique-moi ${n.le}.` },
  { cat: 'forme', kind: 'explain', rel: 6, expect: 'tech', q: (n) => `C’est quoi, ${n.le}, en deux mots ?` },
  { cat: 'forme', kind: 'explain', rel: 6, expect: 'tech', q: (n) => `${n.Le}, étape par étape, ça donne quoi ?` },
  { cat: 'forme', kind: 'explain', rel: 6, expect: 'tech', q: (n) => `Décris-moi ${n.le} simplement.` },
  { cat: 'forme', kind: 'explain', rel: 5, expect: 'tech', q: (n) => `Qu’est-ce qu’il faut retenir sur ${n.le} ?` },
  // erreurs et conseils
  { cat: 'erreurs', kind: 'improve', rel: 8, expect: 'tech', q: (n) => `Quelles erreurs éviter sur ${n.le} ?` },
  { cat: 'erreurs', kind: 'improve', rel: 6, expect: 'tech', q: (n) => `Quelle est l’erreur la plus fréquente sur ${n.le} ?` },
  { cat: 'erreurs', kind: 'improve', rel: 6, expect: 'tech', q: (n) => `Un conseil pour réussir ${n.le} ?` },
  { cat: 'erreurs', kind: 'improve', rel: 6, expect: 'tech', q: (n) => `Une astuce pour progresser sur ${n.le} ?` },
  { cat: 'erreurs', kind: 'improve', rel: 6, expect: 'tech', q: (n) => `Comment améliorer ${n.mon} ?` },
  { cat: 'erreurs', kind: 'improve', rel: 10.5, expect: 'tech', q: (n) => `${n.Le} me pose encore problème : une astuce ?`, when: (w) => w.toReview },
  // pourquoi
  { cat: 'pourquoi', kind: 'why', rel: 5.5, expect: 'tech', q: (n) => `À quoi sert ${n.le} ?` },
  { cat: 'pourquoi', kind: 'why', rel: 5, expect: 'tech', q: (n) => `Pourquoi travailler ${n.le} ?` },
  // équilibre
  { cat: 'equilibre', kind: 'balance', rel: 5.5, expect: 'tech', q: (n) => `Comment rester stable sur ${n.le} ?` },
  { cat: 'equilibre', kind: 'balance', rel: 5, expect: 'tech', q: (n) => `Je perds l’équilibre sur ${n.le}, que faire ?` },
  // démo : commencent toutes par « Montre-moi » (l’écran d’entraînement les joue aussitôt)
  { cat: 'demo', kind: 'slow', rel: 7, expect: 'tech', q: (n) => `Montre-moi ${n.le} au ralenti.` },
  { cat: 'demo', kind: 'slow', rel: 6, expect: 'tech', q: (n) => `Montre-moi ${n.le} lentement, pas à pas.` },
  { cat: 'demo', kind: 'demo', rel: 6, expect: 'tech', q: (n) => `Montre-moi ${n.le} en démo.` },
  { cat: 'demo', kind: 'demo', rel: 5.5, expect: 'tech', q: (n) => `Montre-moi encore ${n.le}, à vitesse réelle.` },
  // combinaisons et exercices qui contiennent la technique
  { cat: 'combos', kind: 'combo', rel: 6, expect: 'combo', q: (n) => `Propose-moi un enchaînement avec ${n.le}.` },
  { cat: 'combos', kind: 'combo', rel: 5.5, expect: 'combo', q: (n) => `Quel exercice pour travailler ${n.le} ?` },
  { cat: 'combos', kind: 'combo', rel: 5.5, expect: 'combo', q: (n) => `Une combinaison avec ${n.le}, tu as ça ?` },
  { cat: 'combos', kind: 'combo', rel: 5, expect: 'combo', q: (n) => `Un exercice simple avec ${n.le}, pour commencer ?`, when: (w) => w.level === 'debutant' },
  { cat: 'combos', kind: 'combo', rel: 5, expect: 'combo', q: (n) => `Comment glisser ${n.le} dans mes enchaînements ?`, when: (w) => w.level !== 'debutant' },
  // même geste, de l’autre côté
  { cat: 'comparaison', kind: 'mirror', rel: 5.5, expect: 'tech', q: (n) => `Quelle différence entre ${n.le} et ${n.other} ?`, when: (w) => w.hasOther },
  { cat: 'comparaison', kind: 'mirror', rel: 5, expect: 'tech', q: (n) => `${n.Le} ou ${n.other} : qu’est-ce qui change ?`, when: (w) => w.hasOther },
  // garde gaucher
  { cat: 'forme', kind: 'explain', rel: 6.5, expect: 'tech', q: (n) => `Je suis gaucher : comment faire ${n.le} ?`, when: (w) => w.gaucher },
  // règlements du kick-boxing (src/domain/kickboxingStyles.ts)
  { cat: 'regles', kind: 'rules', rel: 6, expect: 'rules', q: (n) => `Que disent les règlements du kick-boxing sur ${n.le} ?`, when: (w) => w.discipline === 'kickboxing' },
  { cat: 'regles', kind: 'rules', rel: 6.5, expect: 'rules', q: (n) => `${n.Le}, c’est permis ${n.style} ?`, when: (w) => w.discipline === 'kickboxing' && !!w.kbStyle },
  // Légendes : le champion dont les fiches utilisent le plus la technique (bibliothèque des champions)
  { cat: 'legendes', kind: 'legend', rel: 5, expect: 'legend', q: (n) => `Quelle légende utilise souvent ${n.le} ?`, when: (w) => w.striking && strikes(w) },
  { cat: 'legendes', kind: 'legend', rel: 4.5, expect: 'legend', q: (n) => `Quel champion des Légendes aime ${n.le} ?`, when: (w) => w.striking && strikes(w) },
];

export const styleLabel = (style: 'k1' | 'low-kick' | 'full-contact') => KB_STYLE_LABEL[style];

/** une question qui repose sur une entrée de la FAQ ou du guide */
export interface Phrase {
  q: string;
  cat: QCat;
  /** la 1re formulation d’une entrée liée à la technique reste prioritaire (questions du pratiquant) */
  rel?: number;
}

/**
 * Formulations de chaque entrée de la FAQ (knowledge.ts, faqMore.ts). La première est celle que les
 * pratiquants ont demandée (gardée en tête de liste quand l’entrée concerne la technique à l’écran).
 */
export const FAQ_PHRASES: Record<string, Phrase[]> = {
  'faq:pivot-pied-arriere': [
    { q: 'Comment bien pivoter mon pied arrière ?', cat: 'deplacement' },
    { q: 'Pourquoi tourner le talon arrière quand je frappe ?', cat: 'deplacement' },
    { q: 'Mon pied arrière doit-il pivoter sur la pointe ?', cat: 'deplacement' },
  ],
  'faq:rotation-hanches': [
    { q: 'Comment utiliser ma hanche pour frapper ?', cat: 'puissance' },
    { q: 'Pourquoi la hanche donne-t-elle de la force au coup ?', cat: 'puissance' },
    { q: 'Comment tourner les hanches sur un coup ?', cat: 'puissance' },
  ],
  'faq:garde': [
    { q: 'Où placer ma main avant ?', cat: 'garde' },
    { q: 'Où placer ma main arrière ?', cat: 'garde' },
    { q: 'Où placer mes coudes ?', cat: 'garde' },
  ],
  'faq:menton': [
    { q: 'Pourquoi garder le menton rentré ?', cat: 'garde' },
    { q: 'Le menton rentré, ça protège de quoi ?', cat: 'garde' },
  ],
  'faq:retour-garde': [
    { q: 'Comment revenir rapidement en garde ?', cat: 'garde' },
    { q: 'Pourquoi ramener la main aussi vite qu’elle part ?', cat: 'garde' },
    { q: 'Après un coup, je reviens en garde comment ?', cat: 'garde' },
  ],
  'faq:deplacements': [
    { q: 'Comment me déplacer sans croiser les pieds ?', cat: 'deplacement' },
    { q: 'Pourquoi ne jamais croiser les pieds en me déplaçant ?', cat: 'deplacement' },
    { q: 'Des conseils pour mon jeu de jambes ?', cat: 'deplacement' },
  ],
  'faq:equilibre-pieds': [
    { q: 'Comment garder mon équilibre sur un coup de pied ?', cat: 'equilibre' },
    { q: 'Comment tenir sur une jambe pendant un coup de pied ?', cat: 'equilibre' },
    { q: 'Le pied d’appui, il fait quoi pendant un kick ?', cat: 'equilibre' },
  ],
  'faq:respiration': [
    { q: 'Comment respirer quand je frappe ?', cat: 'respiration' },
    { q: 'Je dois souffler à chaque coup ?', cat: 'respiration' },
    { q: 'Faut-il retenir son souffle pendant une série ?', cat: 'respiration' },
    { q: 'Expirer sur la frappe, ça aide vraiment ?', cat: 'respiration' },
  ],
  'faq:jab-direct': [
    { q: 'Quelle est la différence entre jab et direct ?', cat: 'comparaison' },
    { q: 'Jab ou direct : lequel est le plus puissant ?', cat: 'comparaison' },
  ],
  'faq:crochet-uppercut': [
    { q: 'Quelle est la différence entre crochet et uppercut ?', cat: 'comparaison' },
    { q: 'Crochet ou uppercut : quand choisir lequel ?', cat: 'comparaison' },
  ],
  'faq:teep': [
    { q: 'À quoi sert le teep ?', cat: 'pourquoi' },
  ],
  'faq:genoux': [
    { q: 'Comment bien donner un coup de genou ?', cat: 'forme' },
    { q: 'Pour un coup de genou, je pousse avec la hanche ?', cat: 'puissance' },
  ],
  'faq:coudes': [
    { q: 'Comment bien porter un coup de coude ?', cat: 'forme' },
  ],
  'faq:sprawl': [{ q: 'Où placer mes hanches pendant le sprawl ?', cat: 'equilibre' }],
  'faq:puissance-vitesse': [
    { q: 'Comment frapper plus fort sans perdre en vitesse ?', cat: 'puissance' },
    { q: 'Comment être plus rapide sur mes coups ?', cat: 'vitesse' },
    { q: 'Pourquoi rester relâché pour frapper vite ?', cat: 'vitesse' },
    { q: 'D’où vient la puissance d’un coup ?', cat: 'puissance' },
  ],
  'faq:hauteurs-kicks': [
    { q: 'Quelle est la différence entre low, middle et high kick ?', cat: 'comparaison' },
    { q: 'Low, middle ou high kick : qu’est-ce qui change ?', cat: 'comparaison' },
  ],
  'faq:distance': [
    { q: 'Comment gérer la distance ?', cat: 'deplacement' },
    { q: 'Comment se placer à la bonne distance ?', cat: 'deplacement' },
  ],
  'faq:echauffement': [
    { q: 'Comment bien m’échauffer avant de frapper ?', cat: 'securite' },
    { q: 'L’échauffement, ça dure combien de temps ?', cat: 'securite' },
    { q: 'Un petit échauffement rapide, ça donne quoi ?', cat: 'securite' },
  ],
  'faq:articulations-shadow': [
    { q: 'Pourquoi ne pas tendre le bras à fond en shadow ?', cat: 'securite' },
    { q: 'Comment protéger mes articulations en shadow ?', cat: 'securite' },
  ],
  'faq:repos': [
    { q: 'Comment bien récupérer après la séance ?', cat: 'recuperation' },
    { q: 'Le repos, ça fait vraiment partie de l’entraînement ?', cat: 'recuperation' },
    { q: 'Comment faire un bon retour au calme après la séance ?', cat: 'recuperation' },
  ],
  'faq:shadow': [
    { q: 'Comment bien faire du shadow tout seul ?', cat: 'forme' },
    { q: 'En shadow, j’imagine quoi devant moi ?', cat: 'mental' },
  ],
  'faq:debuter': [
    { q: 'Quelles techniques apprendre en premier ?', cat: 'progres' },
    { q: 'Je commence la boxe : quoi apprendre d’abord ?', cat: 'progres' },
  ],
  'faq:gaucher': [{ q: 'Comment adapter les fiches à ma garde de gaucher ?', cat: 'garde' }],
  'faq:motivation': [
    { q: 'Comment rester motivé sur la durée ?', cat: 'mental' },
    { q: 'Pas trop envie de m’entraîner aujourd’hui : une idée ?', cat: 'mental' },
  ],
  'faq:regularite': [
    { q: 'Mieux vaut des séances courtes et régulières ?', cat: 'progres' },
    { q: 'Comment garder une routine d’entraînement ?', cat: 'progres' },
  ],
  'faq:plateau': [
    { q: 'J’ai l’impression de stagner à l’entraînement, que faire ?', cat: 'mental' },
    { q: 'Comment passer un palier quand je stagne ?', cat: 'mental' },
  ],
  'faq:objectif-seance': [
    { q: 'Quel objectif me fixer pour une séance ?', cat: 'progres' },
    { q: 'Un bon objectif de séance, c’est quoi ?', cat: 'progres' },
  ],
};

/** entrées de la FAQ utiles à toute une famille de techniques, en plus de celles que la bibliothèque relie */
export const BY_CATEGORY: Partial<Record<TechniqueCategory, string[]>> = {
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

/** reading order of the technique's own FAQ entries: body mechanics first, then balance and guard, comparisons */
export const FAQ_RANK: Record<string, number> = {
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
  'faq:puissance-vitesse': 10,
  'faq:distance': 11,
  'faq:respiration': 12,
};

/** entrées générales proposées partout (sports de frappe), loin derrière celles de la technique */
export const GENERAL_STRIKING = ['faq:respiration', 'faq:puissance-vitesse', 'faq:distance', 'faq:echauffement', 'faq:articulations-shadow', 'faq:repos', 'faq:shadow', 'faq:motivation', 'faq:regularite', 'faq:plateau', 'faq:objectif-seance', 'faq:garde', 'faq:retour-garde', 'faq:deplacements', 'faq:menton'];
/** jiu-jitsu, judo : pas de conseils de frappe */
export const GENERAL_GRAPPLING = ['faq:echauffement', 'faq:repos', 'faq:motivation', 'faq:regularite', 'faq:plateau', 'faq:objectif-seance'];

/** questions sur une technique en particulier (réponse : sa fiche), chacune avec sa catégorie */
export const BY_TECHNIQUE: Record<string, Phrase[]> = {
  // 0.28 : nouvelles techniques (enrichissement des disciplines)
  'sit-out': [
    { q: 'À quoi sert le sit-out ?', cat: 'pourquoi' },
    { q: 'Où placer ma main pendant le sit-out ?', cat: 'forme' },
  ],
  'releve-genoux': [
    { q: 'Comment me relever depuis les genoux ?', cat: 'forme' },
    { q: 'Comment poser les genoux sans me faire mal ?', cat: 'securite' },
  ],
  'ukemi-ushiro': [
    { q: 'Comment chuter en arrière sans me faire mal ?', cat: 'securite' },
    { q: 'Où placer mes bras pendant la chute arrière ?', cat: 'forme' },
  ],
  'ukemi-yoko': [
    { q: 'Comment chuter sur le côté ?', cat: 'securite' },
    { q: 'Où placer mon bras pendant la chute de côté ?', cat: 'forme' },
  ],
  'ayumi-ashi': [
    { q: 'À quoi sert ayumi-ashi ?', cat: 'pourquoi' },
    { q: 'Comment marcher sans croiser les pieds ?', cat: 'deplacement' },
  ],
  'kumikata': [
    { q: 'À quoi sert le kumi-kata ?', cat: 'pourquoi' },
    { q: 'Où placer mes mains pour le kumi-kata ?', cat: 'garde' },
  ],
  'uchikomi-o-goshi': [
    { q: 'À quoi sert o-goshi ?', cat: 'pourquoi' },
    { q: 'Où placer mes hanches pour o-goshi ?', cat: 'forme' },
  ],
  'uchikomi-o-soto-gari': [
    { q: 'À quoi sert o-soto-gari ?', cat: 'pourquoi' },
    { q: 'Comment garder l’équilibre pendant o-soto-gari ?', cat: 'equilibre' },
  ],
  'uchikomi-o-uchi-gari': [
    { q: 'À quoi sert o-uchi-gari ?', cat: 'pourquoi' },
    { q: 'Comment faucher pendant o-uchi-gari ?', cat: 'forme' },
  ],
  'uchikomi-ko-uchi-gari': [
    { q: 'À quoi sert ko-uchi-gari ?', cat: 'pourquoi' },
    { q: 'Avec quelle partie du pied balayer en ko-uchi-gari ?', cat: 'forme' },
  ],
  'single-leg': [
    { q: 'À quoi sert le single-leg ?', cat: 'pourquoi' },
    { q: 'Où placer ma tête pendant le single-leg ?', cat: 'forme' },
  ],
  'check-hook': [
    { q: 'À quoi sert le check hook ?', cat: 'pourquoi' },
    { q: 'Comment pivoter pendant le check hook ?', cat: 'deplacement' },
  ],
  'shoulder-roll': [
    { q: 'À quoi sert le shoulder roll ?', cat: 'pourquoi' },
    { q: 'Où placer mon menton pendant le shoulder roll ?', cat: 'garde' },
  ],
  'switch-kick': [
    { q: 'À quoi sert le switch kick ?', cat: 'pourquoi' },
    { q: 'Comment changer de pied pour le switch kick ?', cat: 'deplacement' },
  ],
  'garde-longue': [
    { q: 'À quoi sert la garde longue ?', cat: 'pourquoi' },
    { q: 'Où placer ma main avant en garde longue ?', cat: 'garde' },
  ],
  'rattrapage-middle': [
    { q: 'Comment attraper un middle kick ?', cat: 'forme' },
    { q: 'Comment protéger mes côtes avant d’attraper la jambe ?', cat: 'securite' },
  ],
  'descente-sol': [{ q: 'Comment descendre au sol sans me faire mal ?', cat: 'securite' }],
  'sortie-hanche': [
    { q: 'À quoi sert la sortie de hanche ?', cat: 'pourquoi' },
    { q: 'Comment pousser avec mes pieds pendant le shrimp ?', cat: 'forme' },
  ],
  'releve-technique': [{ q: 'Comment me relever en sécurité ?', cat: 'securite' }],
  'garde-bjj': [
    { q: 'Où placer mes mains en posture de grappling ?', cat: 'garde' },
    { q: 'Comment placer mes pieds en posture de grappling ?', cat: 'deplacement' },
  ],
  pont: [
    { q: 'Pourquoi faire le pont ?', cat: 'pourquoi' },
    { q: 'Où placer mes pieds pendant le pont ?', cat: 'forme' },
  ],
  'retention-garde': [
    { q: 'À quoi sert la rétention de garde ?', cat: 'pourquoi' },
    { q: 'Comment garder mes jambes en cadre ?', cat: 'forme' },
  ],
  'changement-base': [
    { q: 'À quoi sert le changement de base ?', cat: 'pourquoi' },
    { q: 'Où placer mes mains à quatre appuis ?', cat: 'forme' },
  ],
  'shizen-tai': [
    { q: 'Où placer mes mains en shizen-tai ?', cat: 'garde' },
    { q: 'Comment placer mes pieds en shizen-tai ?', cat: 'deplacement' },
  ],
  'tsugi-ashi-avant': [{ q: 'Pourquoi ne pas croiser les pieds en tsugi-ashi ?', cat: 'deplacement' }],
  'tsugi-ashi-arriere': [{ q: 'Pourquoi ne pas croiser les pieds en tsugi-ashi arrière ?', cat: 'deplacement' }],
  'tsugi-ashi-lateral': [{ q: 'Pourquoi ne pas croiser les pieds en tsugi-ashi latéral ?', cat: 'deplacement' }],
  'tai-sabaki': [
    { q: 'Sur le tai-sabaki, comment pivoter sur le pied avant ?', cat: 'deplacement' },
    { q: 'À quoi sert le tai-sabaki ?', cat: 'pourquoi' },
  ],
  kuzushi: [
    { q: 'À quoi sert le kuzushi ?', cat: 'pourquoi' },
    { q: 'Comment tirer avec tout le corps ?', cat: 'puissance' },
    { q: 'Comment éviter de perdre l’équilibre ?', cat: 'equilibre' },
  ],
  'uchikomi-seoi': [
    { q: 'Pourquoi fléchir les genoux pendant l’uchikomi ?', cat: 'forme' },
    { q: 'Où placer mes pieds pendant l’uchikomi ?', cat: 'deplacement' },
    { q: 'Comment éviter de perdre l’équilibre ?', cat: 'equilibre' },
  ],
  sprawl: [
    { q: 'Comment lancer mes jambes en arrière pendant le sprawl ?', cat: 'forme' },
    { q: 'Où placer mes hanches pendant le sprawl ?', cat: 'equilibre' },
    { q: 'Comment garder mes appuis pendant le sprawl ?', cat: 'deplacement' },
    { q: 'Après le sprawl, comment remonter en garde ?', cat: 'garde' },
    { q: 'Pourquoi faire un sprawl ?', cat: 'pourquoi' },
  ],
};

/** une question sur l’écran ou sur l’entraînement en général */
export interface ScreenQ {
  q: string;
  expect: string;
  cat?: QCat;
  rel?: number;
}

/**
 * Questions sur l’écran d’où le coach est ouvert, chacune répondue par son entrée du guide (app:…).
 * Les deux premières gardent leur place en tête au premier affichage ; les autres tournent.
 */
export const SCREEN_POOL: Record<CoachScreen, ScreenQ[]> = {
  accueil: [
    { q: 'Comment fonctionne l’application ?', expect: 'app:app-overview' },
    { q: 'Comment commencer une séance ?', expect: 'app:start-session' },
    { q: 'Que proposent les cinq onglets du bas ?', expect: 'app:nav-tabs' },
    { q: 'Explique-moi l’écran d’accueil.', expect: 'app:screen-accueil' },
    { q: 'Est-ce que l’application marche hors ligne ?', expect: 'app:offline' },
  ],
  entrainer: [
    { q: 'À quoi sert cet écran ?', expect: 'app:screen-entrainer' },
    { q: 'Quelle est la différence entre les modes ?', expect: 'app:modes' },
    { q: 'Comment commencer une séance ?', expect: 'app:start-session' },
  ],
  discipline: [
    { q: 'Comment lancer un exercice ?', expect: 'app:start-session' },
    { q: 'Quelle est la différence entre les modes ?', expect: 'app:modes' },
    { q: 'Que montre la page d’une discipline ?', expect: 'app:screen-discipline' },
  ],
  programmes: [
    { q: 'Comment fonctionnent les programmes ?', expect: 'app:programmes' },
    { q: 'Un programme, c’est quoi exactement ?', expect: 'app:programmes' },
  ],
  programme: [
    { q: 'Comment fonctionnent les programmes ?', expect: 'app:programmes' },
    { q: 'Comment lancer ce programme ?', expect: 'app:programmes' },
  ],
  techniques: [
    { q: 'Comment trouver une technique ?', expect: 'app:screen-techniques' },
    { q: 'Comment marquer une technique comme assimilée ?', expect: 'app:mastery' },
    { q: 'Comment ajouter une technique aux favoris ?', expect: 'app:favoris' },
  ],
  technique: [
    { q: 'Comment marquer cette technique comme assimilée ?', expect: 'app:mastery' },
    { q: 'Comment ajouter cette technique aux favoris ?', expect: 'app:favoris' },
    { q: 'Que montre cette fiche ?', expect: 'app:screen-technique' },
  ],
  partenaire: [
    { q: 'Pourquoi travailler avec un partenaire ?', expect: 'app:partner' },
  ],
  combinaisons: [
    { q: 'Comment lancer une combinaison ?', expect: 'app:screen-combinaisons' },
    { q: 'Comment créer mon propre enchaînement ?', expect: 'app:createur' },
  ],
  createur: [
    { q: 'Comment créer mon propre enchaînement ?', expect: 'app:createur' },
  ],
  favoris: [
    { q: 'Comment ajouter une technique aux favoris ?', expect: 'app:favoris' },
  ],
  progres: [
    { q: 'Comment lire mes statistiques ?', expect: 'app:screen-progres' },
    { q: 'C’est quoi l’onglet Maîtrise ?', expect: 'app:maitrise' },
    { q: 'Que montre l’historique des séances ?', expect: 'app:historique' },
    { q: 'Comment fixer mes objectifs personnels ?', expect: 'app:objectifs' },
  ],
  historique: [
    { q: 'Que montre l’historique des séances ?', expect: 'app:historique' },
    { q: 'Comment lire mes statistiques ?', expect: 'app:screen-progres' },
  ],
  objectifs: [
    { q: 'Comment fixer mes objectifs personnels ?', expect: 'app:objectifs' },
    { q: 'Comment lire mes statistiques ?', expect: 'app:screen-progres' },
  ],
  legendes: [
    { q: 'Comment fonctionne l’onglet Légendes ?', expect: 'app:legendes' },
    { q: 'Que signifient les statuts Vérifiée, Adaptée et Inspirée ?', expect: 'app:legendes-statuts' },
  ],
  'legende-fiche': [
    { q: 'Que signifient les statuts Vérifiée, Adaptée et Inspirée ?', expect: 'app:legendes-statuts' },
    { q: 'Comment fonctionne l’onglet Légendes ?', expect: 'app:legendes' },
  ],
  champion: [
    { q: 'Comment fonctionne l’onglet Légendes ?', expect: 'app:legendes' },
    { q: 'Que signifient les statuts Vérifiée, Adaptée et Inspirée ?', expect: 'app:legendes-statuts' },
  ],
  reglages: [
    { q: 'Comment passer en mode sombre ?', expect: 'app:theme' },
    { q: 'Comment changer le rendu des combattants ?', expect: 'app:render' },
    { q: 'Comment couper la voix du coach ?', expect: 'app:voix' },
    { q: 'Comment régler la durée des rounds ?', expect: 'app:rounds' },
    { q: 'Comment exporter mes données ?', expect: 'app:donnees' },
  ],
  'reglages-voix': [
    { q: 'Comment couper la voix du coach ?', expect: 'app:voix' },
  ],
  'reglages-rounds': [
    { q: 'Comment régler la durée des rounds ?', expect: 'app:rounds' },
  ],
  'reglages-affichage': [
    { q: 'Que faire si l’affichage saccade ?', expect: 'app:affichage' },
    { q: 'Comment passer en mode sombre ?', expect: 'app:theme' },
  ],
  'reglages-donnees': [
    { q: 'Comment exporter mes données ?', expect: 'app:donnees' },
    { q: 'Mes données sont-elles envoyées sur internet ?', expect: 'app:confidentialite' },
  ],
  profil: [
    { q: 'Comment changer mon pseudo ?', expect: 'app:profil' },
  ],
  'coach-choix': [
    { q: 'Quelle différence entre Kadir et Amara ?', expect: 'app:choose-coach' },
  ],
  'coach-ia': [
    { q: 'Comment tu fonctionnes, coach IA ?', expect: 'app:coach-ia' },
    { q: 'Comment avoir des réponses détaillées ?', expect: 'app:coach-ia' },
    { q: 'L’application marche-t-elle hors ligne ?', expect: 'app:offline' },
  ],
  confidentialite: [
    { q: 'Mes données sont-elles envoyées sur internet ?', expect: 'app:confidentialite' },
    { q: 'Comment exporter mes données ?', expect: 'app:donnees' },
  ],
  premium: [
    { q: 'Est-ce que je dois payer pour utiliser l’application ?', expect: 'app:premium' },
    { q: 'Que veut dire le petit diamant doré ?', expect: 'app:premium' },
  ],
  encyclopedie: [
    { q: 'Comment trouver la définition d’un mot ?', expect: 'app:encyclopedie' },
    { q: 'À quoi sert l’Encyclopédie ?', expect: 'app:encyclopedie' },
  ],
  chrono: [
    { q: 'Comment marche le chrono de combat ?', expect: 'app:chrono' },
    { q: 'Comment mettre le chrono en pause ?', expect: 'app:chrono' },
    { q: 'Comment régler le minuteur de combat ?', expect: 'app:chrono' },
  ],
  entrainement: [
    { q: 'À quoi sert le bouton Décomposer ?', expect: 'app:decomposer' },
    { q: 'À quoi sert le bouton Ralenti ?', expect: 'app:ralenti' },
    { q: 'Comment changer l’angle de la caméra ?', expect: 'app:camera' },
    { q: 'Comment passer en plein écran ?', expect: 'app:plein-ecran' },
  ],
};

/** questions générales sur l’application et la progression, valables depuis n’importe quel écran */
export const APP_ANYWHERE: ScreenQ[] = [
  { q: 'Comment suivre mes progrès ?', expect: 'app:screen-progres', cat: 'progres' },
  { q: 'Comment fixer mes objectifs personnels ?', expect: 'app:objectifs', cat: 'progres' },
  { q: 'C’est quoi l’onglet Maîtrise ?', expect: 'app:maitrise', cat: 'progres' },
  { q: 'Comment marquer une technique comme assimilée ?', expect: 'app:mastery', cat: 'progres' },
];
