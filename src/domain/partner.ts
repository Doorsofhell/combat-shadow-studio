import type { DisciplineId, LevelId, TechniqueMode } from './types';

/**
 * Partner techniques of BJJ and judo: throws, pins, guard passes, submissions and break-falls.
 * They need a real partner (and a qualified coach): the app explains them, it never turns them
 * into a solo drill and never animates them with a fake rotation. The solo preparation, when one
 * exists, is a real animated technique (`prep`).
 */
export type PartnerCategory = 'projection' | 'immobilisation' | 'passage' | 'controle' | 'soumission' | 'chute';

export interface PartnerPhase {
  /** judo: déplacement, kuzushi, tsukuri, kake; BJJ: position, transition, contrôle, sortie */
  label: string;
  text: string;
}

export interface PartnerTechnique {
  id: string;
  name: string;
  discipline: DisciplineId;
  category: PartnerCategory;
  level: LevelId;
  mode: Extract<TechniqueMode, 'partenaire'>;
  description: string;
  phases: PartnerPhase[];
  keyPoints: string[];
  safety: string[];
  /** solo technique (animated) that prepares this one */
  prep?: string;
}

export const PARTNER_CATEGORY_LABEL: Record<PartnerCategory, string> = {
  projection: 'Projection',
  immobilisation: 'Immobilisation',
  passage: 'Passage de garde',
  controle: 'Contrôle',
  soumission: 'Soumission (principes)',
  chute: 'Chute (ukemi)',
};

const DOJO = 'À travailler uniquement au club, sur tatami, avec un partenaire volontaire et sous la surveillance d’un enseignant qualifié.';
const TAP = 'Le partenaire abandonne en tapant deux fois ou plus (main, ou pied s’il n’a pas les bras libres) ou en le disant : tu relâches immédiatement, sans discuter. S’il ne peut ni taper ni parler, tu relâches aussi.';

export const PARTNER_TECHNIQUES: PartnerTechnique[] = [
  // judo
  {
    id: 'ukemi',
    name: 'Ukemi (brise-chutes)',
    discipline: 'judo',
    category: 'chute',
    level: 'debutant',
    mode: 'partenaire',
    description: 'Savoir tomber est la première chose qu’on apprend au judo : arrière, côté, avant roulé. On l’apprend au dojo, jamais seul à la maison.',
    phases: [
      { label: 'Principe', text: 'Le menton rentré protège la tête, le dos s’arrondit pour rouler, le bras frappe le tapis pour répartir le choc.' },
      { label: 'Progression', text: 'L’enseignant fait commencer très bas (assis, accroupi), puis debout, puis seulement ensuite projeté par un partenaire.' },
    ],
    keyPoints: ['Menton sur la poitrine, la nuque ne touche jamais le sol', 'Le bras frappe le tapis à environ 45° du corps', 'On expire au contact'],
    safety: ['Ne pas pratiquer les chutes à la maison sur un sol dur ou un tapis fin.', DOJO],
  },
  {
    id: 'o-soto-gari',
    name: 'O-soto-gari (grand fauchage extérieur)',
    discipline: 'judo',
    category: 'projection',
    level: 'debutant',
    mode: 'partenaire',
    description: 'Tu déséquilibres le partenaire vers son arrière, puis ta jambe droite fauche sa jambe droite par l’extérieur.',
    phases: [
      { label: 'Déplacement', text: 'Le pied gauche avance à côté du pied droit du partenaire, en dehors.' },
      { label: 'Kuzushi', text: 'Les mains déséquilibrent le partenaire vers son arrière droit : son poids passe sur son talon droit.' },
      { label: 'Tsukuri', text: 'La poitrine vient contre la sienne, la jambe droite passe derrière sa jambe droite.' },
      { label: 'Kake', text: 'La jambe droite fauche vers l’arrière pendant que le buste descend vers l’avant. Le partenaire chute en ushiro-ukemi.' },
    ],
    keyPoints: ['Déséquilibre d’abord, fauchage ensuite', 'Ta jambe d’appui reste fléchie', 'Tu gardes la manche pour retenir sa chute'],
    safety: ['Le partenaire doit maîtriser la chute arrière (ushiro-ukemi) avant d’être projeté.', 'Dans les études consultées, c’est la projection liée au plus grand nombre de blessures graves à la tête (choc de l’arrière du crâne) : jamais sans enseignant.', 'Garder la manche du partenaire pour accompagner sa chute : sa tête ne doit pas heurter le sol.', DOJO],
  },
  {
    id: 'o-goshi',
    name: 'O-goshi (grande hanche)',
    discipline: 'judo',
    category: 'projection',
    level: 'debutant',
    mode: 'partenaire',
    description: 'Ta hanche passe sous la ceinture du partenaire, ton bras entoure sa taille, et il bascule par-dessus ta hanche.',
    phases: [
      { label: 'Déplacement', text: 'Le pied droit entre devant son pied droit, puis tu pivotes et le pied gauche vient à côté.' },
      { label: 'Kuzushi', text: 'La main gauche tire sa manche vers l’avant et le haut : il passe sur la pointe des pieds.' },
      { label: 'Tsukuri', text: 'Le bras droit entoure sa taille, ta hanche est plus basse que sa ceinture, genoux fléchis, dos contre lui.' },
      { label: 'Kake', text: 'Tu tends les jambes et tournes les épaules : il passe par-dessus ta hanche.' },
    ],
    keyPoints: ['Les hanches plus basses que les siennes', 'Les deux pieds à l’intérieur des siens', 'La rotation vient des épaules et des hanches, pas des bras'],
    safety: ['Le partenaire doit maîtriser la chute (ukemi) avant d’être projeté.', DOJO],
    prep: 'uchikomi-seoi',
  },
  {
    id: 'seoi-nage',
    name: 'Ippon-seoi-nage (projection d’épaule)',
    discipline: 'judo',
    category: 'projection',
    level: 'intermediaire',
    mode: 'partenaire',
    description: 'Tu tournes le dos au partenaire, ton bras bloque son bras sous ton aisselle, et il passe par-dessus ton épaule.',
    phases: [
      { label: 'Déplacement', text: 'Le pied droit entre devant lui, tu pivotes sur ce pied, le pied gauche vient à côté.' },
      { label: 'Kuzushi', text: 'La main gauche tire sa manche vers l’avant : il bascule sur l’avant de ses pieds.' },
      { label: 'Tsukuri', text: 'Le bras droit passe sous son aisselle droite, ton dos contre sa poitrine, genoux fléchis.' },
      { label: 'Kake', text: 'Tu tends les jambes en tirant vers le bas et l’avant : il passe par-dessus ton épaule.' },
    ],
    keyPoints: ['Les genoux fléchis pour passer sous son centre de gravité', 'Le coude droit reste sous son aisselle', 'Ne pas tomber à genoux sans l’accord de l’enseignant'],
    safety: ['Dans les études consultées, c’est la projection la plus souvent liée aux blessures graves du cou (le haut du crâne de celui qui chute heurte le sol) : partenaire expérimenté en ukemi uniquement.', 'Tomber sur les deux genoux en projetant augmente ce risque : ne le faire qu’avec l’accord de l’enseignant.', DOJO],
    prep: 'uchikomi-seoi',
  },
  {
    id: 'kesa-gatame',
    name: 'Kesa-gatame (immobilisation en écharpe)',
    discipline: 'judo',
    category: 'immobilisation',
    level: 'debutant',
    mode: 'partenaire',
    description: 'Assis contre le flanc du partenaire au sol, tu contrôles sa tête et son bras pour l’empêcher de se retourner.',
    phases: [
      { label: 'Position', text: 'Ta hanche droite contre son flanc droit, ses épaules à plat sur le tapis.' },
      { label: 'Contrôle', text: 'Le bras droit entoure sa nuque, le bras gauche serre son bras droit sous ton aisselle.' },
      { label: 'Base', text: 'Jambes écartées, jambe droite fléchie devant, jambe gauche loin derrière : il ne peut pas te faire rouler.' },
    ],
    keyPoints: ['Le poids sur sa poitrine, pas sur le tapis', 'La tête basse, proche de la sienne', 'Tu suis ses mouvements avec les jambes'],
    safety: ['Ne pas écraser la gorge ni tordre la nuque.', TAP, DOJO],
  },
  // BJJ
  {
    id: 'garde-fermee',
    name: 'Garde fermée : contrôle de la posture',
    discipline: 'bjj',
    category: 'controle',
    level: 'debutant',
    mode: 'partenaire',
    description: 'Sur le dos, tes jambes croisées autour de la taille du partenaire, tu casses sa posture pour l’empêcher de frapper ou de passer.',
    phases: [
      { label: 'Position', text: 'Jambes croisées derrière son dos, hanches collées aux siennes.' },
      { label: 'Transition', text: 'Tu tires avec les jambes et les mains pour le faire basculer vers toi.' },
      { label: 'Contrôle', text: 'Tu contrôles sa tête ou ses manches : il ne peut plus se redresser.' },
      { label: 'Sortie', text: 'Quand il se redresse, tu ouvres la garde pour un balayage ou tu reviens au contrôle.' },
    ],
    keyPoints: ['Ne pas rester à plat : tu bouges les hanches', 'Contrôler la posture avant toute attaque'],
    safety: [TAP, DOJO],
    prep: 'retention-garde',
  },
  {
    id: 'passage-toreando',
    name: 'Passage de garde toreando',
    discipline: 'bjj',
    category: 'passage',
    level: 'intermediaire',
    mode: 'partenaire',
    description: 'Debout face au partenaire en garde ouverte, tu écartes ses jambes sur le côté pour contourner sa garde jusqu’au contrôle latéral.',
    phases: [
      { label: 'Position', text: 'Debout, posture droite, les mains tiennent son pantalon au niveau des genoux.' },
      { label: 'Transition', text: 'Tu pousses ses deux jambes d’un côté et tu fais un pas de l’autre côté.' },
      { label: 'Contrôle', text: 'Ta poitrine vient sur la sienne, en travers : contrôle latéral.' },
      { label: 'Sortie', text: 'S’il récupère la garde, tu reviens debout et recommences de l’autre côté.' },
    ],
    keyPoints: ['Rester hors de portée de ses pieds', 'Le passage se termine par un contrôle stable, pas par une course'],
    safety: [TAP, DOJO],
  },
  {
    id: 'controle-lateral',
    name: 'Contrôle latéral (side control)',
    discipline: 'bjj',
    category: 'immobilisation',
    level: 'debutant',
    mode: 'partenaire',
    description: 'En travers du partenaire allongé, ta poitrine sur la sienne, tu bloques ses hanches et sa tête.',
    phases: [
      { label: 'Position', text: 'Poitrine contre poitrine, en travers de lui.' },
      { label: 'Transition', text: 'Tu y arrives après un passage de garde ou un balayage.' },
      { label: 'Contrôle', text: 'Un bras contrôle la tête, l’autre bloque la hanche, genoux collés à son corps.' },
      { label: 'Sortie', text: 'Ses sorties : pont et shrimp. Toi, tu suis ou tu passes à la montée.' },
    ],
    keyPoints: ['Le poids passe par ta poitrine, pas par tes genoux', 'Bloquer la hanche empêche le shrimp'],
    safety: ['Ne pas appuyer sur la gorge ou le visage.', TAP, DOJO],
    prep: 'sortie-hanche',
  },
  {
    id: 'montee',
    name: 'Montée (mount)',
    discipline: 'bjj',
    category: 'immobilisation',
    level: 'intermediaire',
    mode: 'partenaire',
    description: 'Assis sur le ventre du partenaire allongé, genoux au sol de part et d’autre, tu contrôles sa position.',
    phases: [
      { label: 'Position', text: 'Genoux au sol de chaque côté de son buste, hanches lourdes.' },
      { label: 'Transition', text: 'Depuis le contrôle latéral, le genou glisse sur son ventre puis passe de l’autre côté.' },
      { label: 'Contrôle', text: 'Les mains se posent au sol pour la base, les pieds crochètent ses jambes.' },
      { label: 'Sortie', text: 'Ses sorties : pont sur le côté (upa) et shrimp. Tu élargis ta base pour ne pas rouler.' },
    ],
    keyPoints: ['Les hanches lourdes, le buste relevé', 'Une base large avec les mains'],
    safety: [TAP, DOJO],
    prep: 'pont',
  },
  {
    id: 'cle-de-bras-garde',
    name: 'Clé de bras depuis la garde : principes',
    discipline: 'bjj',
    category: 'soumission',
    level: 'avance',
    mode: 'partenaire',
    description: 'Principes de la clé de bras (juji-gatame) : isoler un bras et contrôler l’épaule. Expliquée ici, jamais à tester seul ni sur une personne non pratiquante.',
    phases: [
      { label: 'Position', text: 'Garde fermée, le bras du partenaire est isolé contre ta poitrine.' },
      { label: 'Transition', text: 'Tu pivotes les hanches de côté pour placer ta jambe sur sa tête.' },
      { label: 'Contrôle', text: 'Son bras est tenu le pouce vers le haut, ses épaules contrôlées par tes jambes.' },
      { label: 'Sortie', text: 'Au club, la pression monte lentement et s’arrête au premier tapement.' },
    ],
    keyPoints: ['Contrôle d’abord, pression ensuite', 'La pression est lente et progressive'],
    safety: [
      'Une clé de bras peut blesser le coude ou l’épaule en une fraction de seconde.',
      'Jamais sans un enseignant qualifié, jamais sur une personne qui ne pratique pas, jamais en jeu.',
      TAP,
      DOJO,
    ],
  },
];

export const PARTNER_BY_ID = new Map(PARTNER_TECHNIQUES.map((p) => [p.id, p]));

export const partnerFor = (d: DisciplineId) => PARTNER_TECHNIQUES.filter((p) => p.discipline === d);

/** sequence labels per discipline, in order (judo: the four phases of a throw) */
export const JUDO_PHASES = ['Déplacement', 'Kuzushi', 'Tsukuri', 'Kake'];

export const MODE_LABEL: Record<TechniqueMode, string> = {
  solo: 'Solo',
  duo: 'Démonstration à deux',
  partenaire: 'Partenaire réel requis',
};
