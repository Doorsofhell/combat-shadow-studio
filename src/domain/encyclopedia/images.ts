import type { TermImage } from './types';

/**
 * Illustrations of the encyclopedia (§11, §12). Two origins only:
 * - 'rendu-3d': a capture of the app's own 3D coaches (Kadir, Amara; Microsoft Rocketbox base models, MIT licence,
 *   see docs/v029) playing the app's own animation, at three instants (start, half way, key moment). Made by
 *   scripts/visuels/generate.mjs from `RENDERS` below, laid in the dark gym of the discipline (studio visuals);
 *   files under public/encyclopedie/.
 * - 'a-produire': no illustration yet. The sheet says so and shows the brief; nothing stands in for it.
 * Several terms may share one file (§12 « ne pas multiplier les copies d'une même image »).
 */
const D = '2026-10-28';
const TOOL = 'Moteur 3D de l’application (Three.js), capture automatique, salle d’ambiance de la discipline (scripts/visuels)';

/** what to render: image id → technique of the app, coach and options of the Lab view */
export interface RenderRecipe {
  id: string;
  tech: string;
  coach: 'homme' | 'femme';
  /** discipline of the outfit and stance, when the technique belongs to several */
  d?: string;
  southpaw?: boolean;
  /** 1.3.2 a pose of the illustrations (engine/library/illustrations.ts) instead of a technique: three instants */
  illu?: string;
  /** 1.3.2 several techniques side by side, each at its key moment (e.g. the three styles of kick-boxing) */
  mix?: { tech: string; coach: 'homme' | 'femme'; d: string; az?: number }[];
  /** azimuth of the camera for illu and mix (degrees, 0 = facing the coach) */
  az?: number;
  /** 1.3.2 an engine motion shown instead of the technique's own (schemas: the neutral standing posture) */
  motion?: string;
  /** 1.3.2 a schema: the coach still seen from these sides, with marks on his bones */
  views?: { az: number; el?: number; span?: number; fy?: number }[];
  marks?: { layer?: number; bone: string | string[]; dxH?: number; dyH?: number; label?: string; kind?: 'zone' | 'arc' | 'point'; side?: 'l' | 'r'; r?: number }[];
  /** close-up of an illu: part of the body height in the frame, and the height looked at (metres) */
  span?: number;
  fy?: number;
  /** 1.4.1 a scene with two coaches (engine/library/illustrations.ts, duoScenes): Amara (A) and Kadir (B), one picture */
  duo?: string;
  /** 1.4.1 elevation of the camera for duo and illu (degrees) */
  el?: number;
  /** 1.4.1 outfit of the first coach instead of the discipline's (the referee's: arbitre, arbitre-judo) */
  tenue?: string;
  /** 1.4.1 an illu shown once, at its end, instead of three instants (a still gesture: the ippon) */
  once?: boolean;
  /** one close-up picture of the coach at rest in guard instead of three instants (equipment worn) */
  still?: { az: number; el: number; span: number; fy: number; what: string };
  alt: string;
}

export const RENDERS: RenderRecipe[] = [
  // techniques
  { id: 'tech-jab', tech: 'jab', coach: 'homme', d: 'boxe', alt: 'Le coach lance un jab du bras avant, en trois instants' },
  { id: 'tech-direct', tech: 'direct', coach: 'femme', d: 'boxe', alt: 'La coach lance un direct du bras arrière, en trois instants' },
  { id: 'tech-crochet', tech: 'crochet-avant', coach: 'homme', d: 'boxe', alt: 'Le coach porte un crochet du bras avant' },
  { id: 'tech-uppercut', tech: 'uppercut-arriere', coach: 'femme', d: 'boxe', alt: 'La coach porte un uppercut du bras arrière' },
  { id: 'tech-overhand', tech: 'overhand', coach: 'homme', d: 'mma', alt: 'Le coach lance un overhand en plongeant sur le côté' },
  { id: 'tech-check-hook', tech: 'check-hook', coach: 'homme', d: 'boxe', alt: 'Le coach porte un crochet en pivotant sur le pied avant' },
  { id: 'tech-circulaire', tech: 'roundhouse-arriere', coach: 'homme', d: 'kickboxing', alt: 'Le coach porte un coup de pied circulaire' },
  { id: 'tech-low-kick', tech: 'low-kick-arriere', coach: 'femme', d: 'muaythai', alt: 'La coach porte un low kick de la jambe arrière' },
  { id: 'tech-middle-kick', tech: 'middle-kick-arriere', coach: 'homme', d: 'muaythai', alt: 'Le coach porte un middle kick au niveau du corps' },
  { id: 'tech-high-kick', tech: 'high-kick-arriere', coach: 'femme', d: 'kickboxing', alt: 'La coach porte un high kick à hauteur de tête' },
  { id: 'tech-switch-kick', tech: 'switch-kick', coach: 'homme', d: 'muaythai', alt: 'Le coach change de garde puis frappe de la jambe avant' },
  { id: 'tech-teep', tech: 'teep-avant', coach: 'femme', d: 'muaythai', alt: 'La coach repousse avec un teep de la jambe avant' },
  { id: 'tech-front-kick', tech: 'front-kick-arriere', coach: 'homme', d: 'kickboxing', alt: 'Le coach porte un front kick de la jambe arrière' },
  { id: 'tech-genou', tech: 'genou-direct-arriere', coach: 'homme', d: 'muaythai', alt: 'Le coach porte un coup de genou direct' },
  { id: 'tech-coude', tech: 'coude-horizontal-arriere', coach: 'femme', d: 'muaythai', alt: 'La coach porte un coude horizontal' },
  { id: 'tech-esquive', tech: 'esquive-droite', coach: 'homme', d: 'boxe', alt: 'Le coach esquive sur le côté' },
  { id: 'tech-roll', tech: 'roll-droite', coach: 'femme', d: 'boxe', alt: 'La coach passe sous un crochet imaginaire' },
  { id: 'tech-blocage', tech: 'blocage-haut', coach: 'homme', d: 'boxe', alt: 'Le coach bloque un coup avec la garde haute' },
  { id: 'tech-parade', tech: 'parade', coach: 'femme', d: 'boxe', alt: 'La coach dévie un coup droit de la main' },
  { id: 'tech-retrait', tech: 'retrait', coach: 'homme', d: 'boxe', alt: 'Le coach recule le buste hors de portée' },
  { id: 'tech-shoulder-roll', tech: 'shoulder-roll', coach: 'homme', d: 'boxe', alt: 'Le coach roule l’épaule avant pour se couvrir' },
  { id: 'tech-check', tech: 'check-avant', coach: 'femme', d: 'muaythai', alt: 'La coach lève le genou pour bloquer avec le tibia' },
  { id: 'tech-rattrapage', tech: 'rattrapage-middle', coach: 'homme', d: 'muaythai', alt: 'Le coach rattrape un coup de pied au corps' },
  { id: 'tech-garde-longue', tech: 'garde-longue', coach: 'femme', d: 'muaythai', alt: 'La coach tend un bras pour tenir la distance' },
  { id: 'tech-feinte', tech: 'feinte-epaule', coach: 'homme', d: 'boxe', alt: 'Le coach fait une feinte d’épaule' },
  { id: 'tech-changement-niveau', tech: 'changement-niveau', coach: 'homme', d: 'mma', alt: 'Le coach baisse les hanches avant une entrée' },
  { id: 'tech-double-leg', tech: 'entree-lutte', coach: 'homme', d: 'mma', alt: 'Le coach entre en double-leg, seul' },
  { id: 'tech-single-leg', tech: 'single-leg', coach: 'femme', d: 'mma', alt: 'La coach entre en single-leg, seule' },
  { id: 'tech-sprawl', tech: 'sprawl', coach: 'homme', d: 'mma', alt: 'Le coach jette les jambes en arrière dans un sprawl' },
  { id: 'tech-kuzushi', tech: 'kuzushi', coach: 'homme', d: 'judo', alt: 'Le judoka déséquilibre un partenaire imaginaire' },
  { id: 'tech-o-soto-gari', tech: 'uchikomi-o-soto-gari', coach: 'homme', d: 'judo', alt: 'Le judoka répète l’entrée d’o-soto-gari, seul' },
  { id: 'tech-o-uchi-gari', tech: 'uchikomi-o-uchi-gari', coach: 'femme', d: 'judo', alt: 'La judokate répète l’entrée d’o-uchi-gari, seule' },
  { id: 'tech-ko-uchi-gari', tech: 'uchikomi-ko-uchi-gari', coach: 'homme', d: 'judo', alt: 'Le judoka répète l’entrée de ko-uchi-gari, seul' },
  { id: 'tech-o-goshi', tech: 'uchikomi-o-goshi', coach: 'femme', d: 'judo', alt: 'La judokate répète l’entrée d’o-goshi, seule' },
  { id: 'tech-seoi-nage', tech: 'uchikomi-seoi', coach: 'homme', d: 'judo', alt: 'Le judoka répète l’entrée de seoi-nage, seul' },
  { id: 'tech-sortie-hanche', tech: 'sortie-hanche', coach: 'homme', d: 'bjj', alt: 'Le coach fait une sortie de hanche au sol' },
  { id: 'tech-pont', tech: 'pont', coach: 'femme', d: 'bjj', alt: 'La coach lève les hanches en pont' },
  { id: 'tech-releve-technique', tech: 'releve-technique', coach: 'homme', d: 'mma', alt: 'Le coach se relève en se protégeant' },
  { id: 'tech-sit-out', tech: 'sit-out', coach: 'femme', d: 'bjj', alt: 'La coach pivote assise depuis quatre appuis' },
  // positions
  { id: 'pos-garde', tech: 'garde', coach: 'homme', d: 'boxe', alt: 'Le coach en garde orthodoxe' },
  { id: 'pos-fausse-garde', tech: 'garde', coach: 'femme', d: 'boxe', southpaw: true, alt: 'La coach en fausse garde, pied droit devant' },
  { id: 'pos-shizen-tai', tech: 'shizen-tai', coach: 'homme', d: 'judo', alt: 'Le judoka en posture naturelle' },
  { id: 'pos-posture-grappling', tech: 'garde-bjj', coach: 'homme', d: 'bjj', alt: 'Le coach en posture debout de grappling' },
  { id: 'pos-kumi-kata', tech: 'kumikata', coach: 'femme', d: 'judo', alt: 'La judokate prend une garde imaginaire' },
  { id: 'pos-clinch', tech: 'clinch-tirage', coach: 'homme', d: 'muaythai', alt: 'Le coach simule un clinch' },
  { id: 'pos-pas', tech: 'pas-avant', coach: 'femme', d: 'boxe', alt: 'La coach avance en pas glissé' },
  { id: 'pos-pivot', tech: 'pivot-droite', coach: 'homme', d: 'boxe', alt: 'Le coach pivote sur le pied avant' },
  { id: 'pos-sortie-angle', tech: 'sortie-angle', coach: 'femme', d: 'boxe', alt: 'La coach sort de la ligne d’attaque' },
  { id: 'pos-tsugi-ashi', tech: 'tsugi-ashi-avant', coach: 'homme', d: 'judo', alt: 'Le judoka avance en pas chassés' },
  { id: 'pos-ayumi-ashi', tech: 'ayumi-ashi', coach: 'femme', d: 'judo', alt: 'La judokate avance en pas marchés' },
  { id: 'pos-tai-sabaki', tech: 'tai-sabaki', coach: 'homme', d: 'judo', alt: 'Le judoka tourne le corps' },
  { id: 'pos-changement-base', tech: 'changement-base', coach: 'homme', d: 'bjj', alt: 'Le coach change d’appuis au sol' },
  { id: 'pos-garde-ouverte', tech: 'retention-garde', coach: 'femme', d: 'bjj', alt: 'La coach garde les jambes entre elle et un adversaire imaginaire' },
  // safety, training
  { id: 'secu-ukemi', tech: 'ukemi-ushiro', coach: 'homme', d: 'judo', alt: 'Le judoka chute en arrière, version basse' },
  // equipment worn: an open glove only reads on a hand
  { id: 'eq-gants-mma', tech: 'garde', coach: 'homme', d: 'mma', still: { az: 35, el: 6, span: 0.9, fy: 1.45, what: 'Coach Kadir en garde, tenue de MMA, plan rapproché sur les gants' }, alt: 'Gants de MMA ouverts, portés en garde' },
  // 1.3.2: the coach alone, for culture, rules and preparation
  { id: 'cult-muaythai', tech: 'garde', coach: 'homme', d: 'muaythai', still: { az: 48, el: 4, span: 1.04, fy: 0.86, what: 'Coach Kadir en garde de muay-thaï, tenue de muay-thaï' }, alt: 'Nak muay en garde thaï, prêt au combat' },
  { id: 'cult-kickboxing', tech: 'garde', coach: 'femme', d: 'kickboxing', still: { az: 45, el: 4, span: 1.04, fy: 0.86, what: 'Coach Amara en garde de kick-boxing, gants et protège-tibias' }, alt: 'Combattante de kick-boxing en garde, gants et protège-tibias' },
  { id: 'regle-styles-kb', tech: 'high-kick-arriere', coach: 'femme', d: 'kickboxing', az: 70, mix: [{ tech: 'high-kick-arriere', coach: 'femme', d: 'kickboxing' }, { tech: 'low-kick-arriere', coach: 'homme', d: 'kickboxing', az: -35 }, { tech: 'genou-direct-arriere', coach: 'femme', d: 'kickboxing' }], alt: 'Trois coups côte à côte : coup de pied haut (full contact), low kick, genou (K1)' },
  { id: 'prep-echauffement', tech: 'garde', illu: 'illu-echauffement', coach: 'femme', d: 'mma', az: 20, alt: 'La coach mobilise les épaules : bras devant, au-dessus de la tête, puis ouverts' },
  { id: 'cult-wai-kru', tech: 'garde', illu: 'illu-wai-kru', coach: 'homme', d: 'muaythai', az: 70, alt: 'Le nak muay à genoux, mains jointes, puis s’incline jusqu’au tapis (wai kru)' },
  // 1.3.2: schemas drawn on the coach (zones, joints, muscles), placed on his real bones
  {
    id: 'secu-zones', tech: 'garde', motion: 'neutre', coach: 'homme', d: 'mma', views: [{ az: 0 }, { az: 180 }],
    marks: [
      { layer: 0, bone: ['LeftUpLeg', 'RightUpLeg'], dyH: 0.03, label: 'Aine', side: 'l' },
      { layer: 1, bone: 'Head', dyH: -0.045, label: 'Arrière de la tête', side: 'r' },
      { layer: 1, bone: 'Neck', label: 'Nuque', side: 'r', r: 0.026 },
      { layer: 1, bone: 'Spine', dxH: 0.045, dyH: -0.01, label: 'Reins', side: 'r', r: 0.03 },
      { layer: 1, bone: 'Spine', dxH: -0.045, dyH: -0.01, r: 0.03 },
    ],
    alt: 'Le coach de face et de dos : l’aine, l’arrière de la tête, la nuque et les reins marqués en rouge',
  },
  {
    id: 'secu-articulations', tech: 'garde', motion: 'neutre', coach: 'homme', d: 'mma', views: [{ az: 0 }],
    marks: [
      { bone: 'LeftForeArm', kind: 'arc', label: 'Coude : jamais tendu au-delà', side: 'r', r: 0.04 },
      { bone: 'LeftLeg', kind: 'arc', label: 'Genou : pas de torsion', side: 'r', r: 0.045 },
      { bone: 'Spine1', kind: 'arc', label: 'Colonne : pas de torsion forcée', side: 'l', r: 0.06 },
    ],
    alt: 'Le coach debout : flèches de torsion au coude, au genou et sur la colonne, les sens à ne pas forcer',
  },
  {
    id: 'secu-commotion', tech: 'garde', motion: 'neutre', coach: 'homme', d: 'mma', views: [{ az: 90, el: 2, span: 0.2, fy: 1.62 }],
    marks: [
      { bone: 'Head', dyH: -0.32, dxH: -0.17, label: 'Tempe', side: 'l', r: 0.06 },
      { bone: 'Head', dyH: -0.03, dxH: -0.26, label: 'Menton', side: 'l', r: 0.06 },
      { bone: 'Head', dyH: -0.3, dxH: 0.17, label: 'Arrière du crâne', side: 'r', r: 0.06 },
    ],
    alt: 'La tête du coach de profil : tempe, menton et arrière du crâne, les zones où un choc peut causer une commotion',
  },
  {
    id: 'famille-securite', tech: 'garde', motion: 'neutre', coach: 'homme', d: 'mma', views: [{ az: 0 }],
    marks: [
      { bone: 'LeftArm', kind: 'point', label: 'Épaule', side: 'r' },
      { bone: 'LeftForeArm', kind: 'point', label: 'Coude', side: 'r' },
      { bone: 'LeftHand', kind: 'point', label: 'Poignet', side: 'r' },
      { bone: 'LeftUpLeg', kind: 'point', label: 'Hanche', side: 'r' },
      { bone: 'LeftLeg', kind: 'point', label: 'Genou', side: 'r' },
      { bone: 'LeftFoot', kind: 'point', label: 'Cheville', side: 'r' },
      { bone: 'RightArm', kind: 'point', dyH: 0.02, label: 'Deltoïde', side: 'l' },
      { bone: 'Spine2', kind: 'point', dxH: -0.05, dyH: 0.01, label: 'Pectoral', side: 'l' },
      { bone: 'Spine', kind: 'point', dyH: -0.03, label: 'Abdominaux', side: 'l' },
      { bone: ['RightArm', 'RightForeArm'], kind: 'point', label: 'Biceps', side: 'l' },
      { bone: ['RightUpLeg', 'RightLeg'], kind: 'point', label: 'Quadriceps', side: 'l' },
    ],
    alt: 'Planche du coach de face : articulations (épaule, coude, poignet, hanche, genou, cheville) et muscles principaux',
  },
  { id: 'prep-shadow', tech: 'crochet-arriere', coach: 'femme', d: 'kickboxing', alt: 'La coach enchaîne dans le vide, en shadow' },
  // 1.4.1 scenes with two coaches (illustrations.ts, duoScenes): Amara and Kadir, partners for the illustration
  { id: 'pos-montee', tech: 'garde', coach: 'femme', d: 'bjj', duo: 'duo-montee', az: 70, el: 25, alt: 'Montée : assise à califourchon sur le buste du partenaire allongé, genoux au sol de chaque côté' },
  { id: 'pos-garde-fermee', tech: 'garde', coach: 'homme', d: 'bjj', duo: 'duo-garde-fermee', az: 50, el: 30, alt: 'Garde fermée : sur le dos, les jambes autour de la taille de la partenaire à genoux, chevilles croisées dans son dos' },
  { id: 'pos-demi-garde', tech: 'garde', coach: 'homme', d: 'bjj', duo: 'duo-demi-garde', az: 20, el: 35, alt: 'Demi-garde : sur le dos, il emprisonne une jambe de la partenaire entre les siennes' },
  { id: 'pos-controle-lateral', tech: 'garde', coach: 'femme', d: 'bjj', duo: 'duo-controle-lateral', az: -40, el: 30, alt: 'Contrôle latéral : en travers du partenaire allongé, poitrine contre poitrine, genoux collés à son flanc' },
  { id: 'pos-genou-ventre', tech: 'garde', coach: 'femme', d: 'bjj', duo: 'duo-genou-ventre', az: 30, el: 25, span: 1.1, fy: 0.5, alt: 'Genou sur le ventre : un genou en travers du ventre du partenaire, l’autre jambe tendue sur le côté' },
  { id: 'pos-controle-dos', tech: 'garde', coach: 'femme', d: 'bjj', duo: 'duo-controle-dos', az: 35, el: 15, alt: 'Contrôle du dos : collée au dos du partenaire assis, les talons crochetés à l’intérieur de ses cuisses' },
  { id: 'pos-nord-sud', tech: 'garde', coach: 'femme', d: 'bjj', duo: 'duo-nord-sud', az: 90, el: 70, alt: 'Nord-sud : allongée tête-bêche sur la poitrine du partenaire, vue de dessus' },
  { id: 'tech-passage-garde', tech: 'garde', coach: 'femme', d: 'bjj', duo: 'duo-passage-garde', az: 60, el: 20, alt: 'Passage de garde : debout, elle plaque les genoux du partenaire au sol sur le côté et contourne ses jambes' },
  { id: 'tech-kesa-gatame', tech: 'garde', coach: 'femme', d: 'judo', duo: 'duo-kesa-gatame', az: 40, el: 30, alt: 'Kesa-gatame : assise contre le flanc du partenaire allongé, elle entoure sa tête et bloque son bras sous l’aisselle' },
  { id: 'tech-cle-de-bras', tech: 'garde', coach: 'femme', d: 'bjj', duo: 'duo-cle-de-bras', az: 60, el: 45, alt: 'Clé de bras (juji-gatame) : jambes en travers du buste et du visage du partenaire, son bras tendu entre les cuisses, pouce vers le haut' },
  { id: 'tech-etranglement-arriere', tech: 'garde', coach: 'femme', d: 'bjj', duo: 'duo-etranglement-arriere', az: 35, el: 15, alt: 'Étranglement arrière : collée au dos du partenaire assis, un bras autour de son cou, la main sur l’autre bras' },
  { id: 'tech-triangle', tech: 'garde', coach: 'femme', d: 'bjj', duo: 'duo-triangle', az: -90, el: 25, alt: 'Triangle : sur le dos, ses jambes verrouillées autour du cou et d’un bras du partenaire à genoux' },
  { id: 'regle-soumission', tech: 'garde', coach: 'homme', d: 'bjj', duo: 'duo-tape', az: 20, el: 55, span: 0.6, fy: 0.15, alt: 'Soumission : pris en clé de bras, le partenaire tape le tapis du plat de la main' },
  { id: 'cult-jjb', tech: 'garde', coach: 'homme', d: 'bjj', duo: 'duo-garde-ouverte', az: 70, el: 18, span: 1.1, fy: 0.55, alt: 'Deux pratiquants en kimono : lui sur le dos en garde ouverte, pieds sur les hanches de la partenaire debout' },
  { id: 'famille-regles', tech: 'garde', coach: 'femme', d: 'boxe', duo: 'duo-arbitre-stop', tenue: 'arbitre', az: 20, el: 8, span: 1.2, fy: 0.95, alt: 'L’arbitre s’interpose, la main ouverte devant le boxeur : le geste qui arrête l’échange' },
  { id: 'regle-ko', tech: 'garde', coach: 'femme', d: 'boxe', duo: 'duo-arbitre-compte', tenue: 'arbitre', az: 0, el: 8, span: 1.2, fy: 0.95, alt: 'Le boxeur un genou au tapis, l’arbitre compte au-dessus de lui, la main ouverte' },
  { id: 'regle-decision', tech: 'garde', coach: 'femme', d: 'boxe', duo: 'duo-arbitre-vainqueur', tenue: 'arbitre', az: 0, el: 6, span: 1.2, fy: 0.95, alt: 'L’arbitre lève le bras du vainqueur' },
  { id: 'regle-penalite', tech: 'garde', coach: 'femme', d: 'boxe', duo: 'duo-arbitre-avertit', tenue: 'arbitre', az: 20, el: 8, span: 1.2, fy: 0.95, alt: 'L’arbitre avertit le boxeur : bras tendu vers lui, l’autre main sur la ceinture pour montrer un coup bas' },
  { id: 'prep-sparring', tech: 'garde', coach: 'femme', d: 'boxe', duo: 'duo-sparring', az: 80, el: 8, span: 1.2, fy: 0.95, alt: 'Sparring : deux partenaires gantés en échange léger, le jab retenu arrive sur la garde' },
  { id: 'regle-ippon', tech: 'garde', coach: 'homme', d: 'judo', illu: 'illu-ippon', once: true, tenue: 'arbitre-judo', az: 20, el: 8, alt: 'Arbitre de judo en costume, le bras levé à la verticale : ippon' },
];

/** illustrations still to make, with their brief (§11 B: « signaler précisément les illustrations restant à produire »).
 * None left since 1.4.1: the kind 'a-produire' stays for the next terms. */
const TO_PRODUCE: TermImage[] = [];

/** the files made from 3D renders and Blender scenes of the repository */
const rendered = (r: RenderRecipe): TermImage => ({
  id: r.id,
  file: r.id,
  width: 720,
  height: 400,
  alt: r.alt,
  // the three captions (start, half way, key moment) only for a sequence of three instants
  frames: r.still || r.mix || r.views || r.duo || r.once ? undefined : 3,
  origin: {
    kind: 'rendu-3d',
    what: r.still
      ? r.still.what
      : r.mix
        ? `Coachs de l’application, chacun au moment clé de sa technique : ${r.mix.map((m) => `« ${m.tech} »`).join(', ')}`
        : r.duo
          ? `Coachs Amara et Kadir ensemble, scène « ${r.duo} » posée avec le moteur de l’application`
        : r.views
          ? `Coach ${r.coach === 'homme' ? 'Kadir' : 'Amara'} immobile, repères posés sur les os de son squelette 3D (moteur de l’application)`
          : r.illu
          ? `Coach ${r.coach === 'homme' ? 'Kadir' : 'Amara'}, pose d’illustration « ${r.illu} » du moteur de l’application${r.once ? '' : ', en trois instants'}`
          : `Coach ${r.coach === 'homme' ? 'Kadir' : 'Amara'}, technique « ${r.tech} » de l’application, début, mi-chemin et moment clé`,
    tool: TOOL,
    date: D,
  },
});

/** illustrations of objects and places, rendered with Blender from the outfits of the coaches or from simple scenes */
export interface SceneRecipe {
  id: string;
  /** scene of scripts/encyclopedie/scenes.py */
  scene: string;
  alt: string;
  what: string;
}

export const SCENES: SceneRecipe[] = [
  { id: 'eq-gants-boxe', scene: 'gants-boxe', alt: 'Paire de gants de boxe rouges', what: 'Gants de boxe de la tenue de boxe du coach Kadir' },
  { id: 'eq-protege-tibias', scene: 'protege-tibias', alt: 'Protège-tibias et pieds', what: 'Protège-tibias de la tenue de kick-boxing du coach Kadir' },
  { id: 'eq-rashguard', scene: 'rashguard', alt: 'Rashguard et short de grappling', what: 'Tenue no-gi du coach Kadir' },
  { id: 'eq-short-combat', scene: 'short-combat', alt: 'Short de MMA', what: 'Short de la tenue MMA du coach Kadir' },
  { id: 'eq-short-muaythai', scene: 'short-muaythai', alt: 'Short de muay-thaï', what: 'Short de la tenue de muay-thaï du coach Kadir' },
  { id: 'eq-judogi', scene: 'judogi', alt: 'Judogi blanc et sa ceinture', what: 'Judogi de la tenue de judo du coach Kadir' },
  { id: 'eq-kimono-jjb', scene: 'kimono-jjb', alt: 'Kimono de jiu-jitsu brésilien', what: 'Kimono de la tenue de JJB du coach Kadir' },
  { id: 'lieu-ring', scene: 'ring', alt: 'Ring de boxe avec quatre cordes, coins rouge et bleu', what: 'Ring modélisé pour l’encyclopédie (4 cordes, coins rouge et bleu)' },
  { id: 'lieu-cage', scene: 'cage', alt: 'Cage octogonale grillagée', what: 'Cage à huit côtés modélisée pour l’encyclopédie' },
  { id: 'lieu-tatami', scene: 'tatami', alt: 'Aire de judo : zone de combat et zone de sécurité', what: 'Aire de tatamis modélisée pour l’encyclopédie (zone de combat et zone de sécurité de couleurs différentes)' },
  { id: 'cult-ceintures', scene: 'ceintures', alt: 'Ceintures de couleur roulées', what: 'Ceintures modélisées pour l’encyclopédie : blanche, bleue, violette, marron, noire' },
  // 1.3.2: equipment and places modelled in scenes.py (no outfit of the coaches holds them)
  { id: 'eq-bandes', scene: 'bandes', alt: 'Deux bandes de protection, une roulée, une déroulée avec sa boucle de pouce', what: 'Bandes modélisées pour l’encyclopédie' },
  { id: 'eq-protege-dents', scene: 'protege-dents', alt: 'Protège-dents bleu à côté de son étui ouvert', what: 'Protège-dents et étui modélisés pour l’encyclopédie' },
  { id: 'eq-casque', scene: 'casque', alt: 'Casque de boxe amateur rouge, de face et de profil', what: 'Casque modélisé pour l’encyclopédie (sans protège-joues)' },
  { id: 'eq-coquille', scene: 'coquille', alt: 'Coquille de protection avec sa ceinture élastique', what: 'Coquille modélisée pour l’encyclopédie' },
  { id: 'eq-protege-poitrine', scene: 'protege-poitrine', alt: 'Protège-poitrine moulé à deux coques, bord en mousse', what: 'Protège-poitrine modélisé pour l’encyclopédie' },
  { id: 'eq-sac', scene: 'sac', alt: 'Sac lourd et sac « banane » suspendus par leurs chaînes', what: 'Sacs de frappe modélisés pour l’encyclopédie' },
  { id: 'eq-pattes-ours', scene: 'pattes-ours', alt: 'Paire de pattes d’ours : face de frappe et poignée', what: 'Pattes d’ours modélisées pour l’encyclopédie' },
  { id: 'eq-paos', scene: 'paos', alt: 'Paire de paos thaïs : face de frappe, sangles d’avant-bras et poignée', what: 'Paos modélisés pour l’encyclopédie' },
  { id: 'lieu-dojo', scene: 'dojo', alt: 'Dojo traditionnel : tatamis, cloisons shoji, alcôve en bois', what: 'Dojo modélisé pour l’encyclopédie (tatamis, shoji, tokonoma)' },
  { id: 'regle-round', scene: 'round', alt: 'Chronomètre de round (round 3, 2:47) et cloche avec son marteau', what: 'Chronomètre et cloche modélisés pour l’encyclopédie' },
  { id: 'cult-mongkon', scene: 'mongkon', alt: 'Mongkon blanc et rouge et deux pra jiad posés sur une planche', what: 'Mongkon et pra jiad modélisés pour l’encyclopédie' },
  { id: 'cult-federations', scene: 'livre-regles', alt: 'Un livre de règles entouré des emblèmes des six disciplines de l’application', what: 'Livre modélisé pour l’encyclopédie, entouré des emblèmes des disciplines de l’application (aucun logo de fédération)' },
  { id: 'regle-points-jjb', scene: 'tableau-jjb', alt: 'Tableau de score de JJB : points, avantages en vert, pénalités en rouge, temps restant', what: 'Tableau de score modélisé pour l’encyclopédie' },
  { id: 'regle-pesee', scene: 'pesee', alt: 'La balance de la pesée officielle, son affichage en kilogrammes et la fiche de pesée', what: 'Balance et fiche modélisées pour l’encyclopédie (fiche illisible)' },
  { id: 'regle-arbitre', scene: 'juges', alt: 'La table des trois juges au bord du ring : feuilles de pointage, chronomètre, et le coin du ring derrière', what: 'Table des juges et coin de ring modélisés pour l’encyclopédie' },
  { id: 'cult-boxe', scene: 'boxe-ancienne', alt: 'Gants de cuir anciens à côté d’un règlement imprimé', what: 'Gants anciens et feuille de règlement modélisés pour l’encyclopédie (texte illisible, rien de copié)' },
];

const scened = (s: SceneRecipe): TermImage => ({
  id: s.id,
  file: s.id,
  width: 720,
  height: 400,
  alt: s.alt,
  origin: { kind: 'rendu-3d', what: s.what, tool: 'Blender 5.2 (bpy), scène du dépôt, rendu Cycles, salle d’ambiance de la discipline (scripts/visuels)', date: D },
});

const ALIASES: [string, string][] = [
  // family cards reuse an illustration of the family
  ['famille-techniques', 'tech-jab'],
  ['famille-positions', 'pos-posture-grappling'],
  ['famille-equipements', 'eq-gants-boxe'],
  ['famille-lieux', 'lieu-ring'],
  ['famille-preparation', 'prep-shadow'],
  ['famille-culture', 'cult-ceintures'],
];

const BASE: TermImage[] = [...RENDERS.map(rendered), ...SCENES.map(scened), ...TO_PRODUCE];
const BY_ID = new Map(BASE.map((i) => [i.id, i]));
for (const [id, to] of ALIASES) BY_ID.set(id, { ...BY_ID.get(to)!, id });

export const IMAGES: ReadonlyMap<string, TermImage> = BY_ID;
export const imageOf = (id: string | undefined): TermImage | undefined => (id ? BY_ID.get(id) : undefined);
