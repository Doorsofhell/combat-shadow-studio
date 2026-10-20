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

const DOJO = 'Ça se travaille uniquement au club, sur tatami, avec un partenaire volontaire et sous l’œil d’un enseignant qualifié.';
const TAP = 'Ton partenaire abandonne en tapant deux fois ou plus (main, ou pied s’il n’a pas les bras libres) ou en le disant : tu relâches tout de suite, sans discuter. S’il ne peut ni taper ni parler, tu relâches aussi.';

export const PARTNER_TECHNIQUES: PartnerTechnique[] = [
  // judo
  {
    id: 'ukemi',
    name: 'Ukemi (brise-chutes)',
    discipline: 'judo',
    category: 'chute',
    level: 'debutant',
    mode: 'partenaire',
    description: 'Au judo, on apprend à tomber avant de faire tomber : en arrière, sur le côté, en roulé avant. Au dojo, jamais seul à la maison.',
    phases: [
      { label: 'Principe', text: 'Le menton rentré protège la tête, le dos s’arrondit pour rouler, le bras frappe le tapis pour répartir le choc.' },
      { label: 'Progression', text: 'L’enseignant te fait commencer près du sol (assis, accroupi), puis debout, et seulement ensuite projeté par un partenaire.' },
    ],
    keyPoints: ['Menton sur la poitrine, la nuque ne touche jamais le sol', 'Le bras frappe le tapis à environ 45° du corps', 'On expire au contact'],
    safety: ['Pas de chutes à la maison, ni sur un sol dur ni sur un tapis fin.', DOJO],
  },
  {
    id: 'o-soto-gari',
    name: 'O-soto-gari (grand fauchage extérieur)',
    discipline: 'judo',
    category: 'projection',
    level: 'debutant',
    mode: 'partenaire',
    description: 'Tu déséquilibres ton partenaire vers l’arrière, puis ta jambe droite fauche sa jambe droite par l’extérieur.',
    phases: [
      { label: 'Déplacement', text: 'Le pied gauche avance à côté du pied droit du partenaire, en dehors.' },
      { label: 'Kuzushi', text: 'Le déséquilibre : tes mains l’emmènent vers son arrière droit, son poids passe sur son talon droit.' },
      { label: 'Tsukuri', text: 'Le placement : ta poitrine vient contre la sienne, ta jambe droite passe derrière sa jambe droite.' },
      { label: 'Kake', text: 'La projection : ta jambe droite fauche vers l’arrière pendant que ton buste descend vers l’avant. Il chute en ushiro-ukemi (chute arrière).' },
    ],
    keyPoints: ['D’abord le déséquilibre, ensuite le fauchage', 'Ta jambe d’appui reste fléchie', 'Tu gardes la manche pour retenir sa chute'],
    safety: ['Ton partenaire doit savoir chuter en arrière (ushiro-ukemi) avant d’être projeté.', 'Dans les études consultées, c’est la projection liée au plus grand nombre de blessures graves à la tête (choc de l’arrière du crâne) : jamais sans enseignant.', 'Garde sa manche en main pour accompagner sa chute : sa tête ne doit jamais heurter le sol.', DOJO],
  },
  {
    id: 'o-goshi',
    name: 'O-goshi (grande hanche)',
    discipline: 'judo',
    category: 'projection',
    level: 'debutant',
    mode: 'partenaire',
    description: 'Ta hanche se glisse sous sa ceinture, ton bras entoure sa taille, et il bascule par-dessus ta hanche.',
    phases: [
      { label: 'Déplacement', text: 'Ton pied droit entre devant son pied droit, puis tu pivotes et le pied gauche vient à côté.' },
      { label: 'Kuzushi', text: 'Le déséquilibre : ta main gauche tire sa manche vers l’avant et le haut, il passe sur la pointe des pieds.' },
      { label: 'Tsukuri', text: 'Le placement : ton bras droit entoure sa taille, ta hanche est plus basse que sa ceinture, genoux fléchis, dos contre lui.' },
      { label: 'Kake', text: 'La projection : tu tends les jambes et tu tournes les épaules, il passe par-dessus ta hanche.' },
    ],
    keyPoints: ['Tes hanches plus basses que les siennes', 'Tes deux pieds à l’intérieur des siens', 'La rotation vient des épaules et des hanches, pas des bras'],
    safety: ['Ton partenaire doit savoir chuter (ukemi) avant d’être projeté.', DOJO],
    prep: 'uchikomi-seoi',
  },
  {
    id: 'seoi-nage',
    name: 'Ippon-seoi-nage (projection d’épaule)',
    discipline: 'judo',
    category: 'projection',
    level: 'intermediaire',
    mode: 'partenaire',
    description: 'Dos à ton partenaire, tu bloques son bras sous ton aisselle, et il passe par-dessus ton épaule comme un sac qu’on charge.',
    phases: [
      { label: 'Déplacement', text: 'Ton pied droit entre devant lui, tu pivotes sur ce pied, le pied gauche vient à côté.' },
      { label: 'Kuzushi', text: 'Le déséquilibre : ta main gauche tire sa manche vers l’avant, il bascule sur l’avant de ses pieds.' },
      { label: 'Tsukuri', text: 'Le placement : ton bras droit passe sous son aisselle droite, ton dos contre sa poitrine, genoux fléchis.' },
      { label: 'Kake', text: 'La projection : tu tends les jambes en tirant vers le bas et l’avant, il passe par-dessus ton épaule.' },
    ],
    keyPoints: ['Genoux fléchis pour passer sous son centre de gravité', 'Ton coude droit reste sous son aisselle', 'Pas de chute à genoux sans l’accord de l’enseignant'],
    safety: ['Dans les études consultées, c’est la projection la plus souvent liée aux blessures graves du cou (le haut du crâne de celui qui chute heurte le sol) : partenaire expérimenté en ukemi uniquement.', 'Tomber sur les deux genoux en projetant augmente ce risque : seulement avec l’accord de l’enseignant.', DOJO],
    prep: 'uchikomi-seoi',
  },
  {
    id: 'kesa-gatame',
    name: 'Kesa-gatame (immobilisation en écharpe)',
    discipline: 'judo',
    category: 'immobilisation',
    level: 'debutant',
    mode: 'partenaire',
    description: 'Assis contre le flanc de ton partenaire au sol, tu tiens sa tête et son bras pour l’empêcher de se retourner.',
    phases: [
      { label: 'Position', text: 'Ta hanche droite contre son flanc droit, ses épaules à plat sur le tapis.' },
      { label: 'Contrôle', text: 'Ton bras droit entoure sa nuque, ton bras gauche serre son bras droit sous ton aisselle.' },
      { label: 'Base', text: 'Jambes écartées, jambe droite fléchie devant, jambe gauche loin derrière : il ne peut pas te faire rouler.' },
    ],
    keyPoints: ['Ton poids sur sa poitrine, pas sur le tapis', 'Ta tête basse, proche de la sienne', 'Tu suis ses mouvements avec les jambes'],
    safety: ['N’écrase jamais la gorge et ne tords pas la nuque.', TAP, DOJO],
  },
  // BJJ
  {
    id: 'garde-fermee',
    name: 'Garde fermée : contrôle de la posture',
    discipline: 'bjj',
    category: 'controle',
    level: 'debutant',
    mode: 'partenaire',
    description: 'Sur le dos, jambes croisées autour de sa taille, tu casses sa posture (il ne peut plus se tenir droit) : ni frappe ni passage.',
    phases: [
      { label: 'Position', text: 'Jambes croisées derrière son dos, hanches collées aux siennes.' },
      { label: 'Transition', text: 'Tu tires avec les jambes et les mains pour le faire basculer vers toi.' },
      { label: 'Contrôle', text: 'Tu tiens sa tête ou ses manches : il ne peut plus se redresser.' },
      { label: 'Sortie', text: 'Quand il se redresse, tu ouvres la garde pour le balayer (le renverser) ou tu reviens au contrôle.' },
    ],
    keyPoints: ['Ne reste pas à plat : bouge les hanches', 'D’abord la posture, ensuite l’attaque'],
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
    description: 'Debout face à sa garde ouverte, tu écartes ses jambes sur le côté comme un torero sa cape, et tu contournes jusqu’au contrôle latéral.',
    phases: [
      { label: 'Position', text: 'Debout, posture droite, tes mains tiennent son pantalon au niveau des genoux.' },
      { label: 'Transition', text: 'Tu pousses ses deux jambes d’un côté et tu fais un pas de l’autre côté.' },
      { label: 'Contrôle', text: 'Ta poitrine vient sur la sienne, en travers : c’est le contrôle latéral.' },
      { label: 'Sortie', text: 'S’il récupère sa garde, pas de panique : debout, et tu recommences de l’autre côté.' },
    ],
    keyPoints: ['Reste hors de portée de ses pieds', 'Le passage finit par un contrôle stable, pas par une course'],
    safety: [TAP, DOJO],
  },
  {
    id: 'controle-lateral',
    name: 'Contrôle latéral (side control)',
    discipline: 'bjj',
    category: 'immobilisation',
    level: 'debutant',
    mode: 'partenaire',
    description: 'En travers de ton partenaire allongé, ta poitrine sur la sienne, tu bloques ses hanches et sa tête.',
    phases: [
      { label: 'Position', text: 'Poitrine contre poitrine, en travers de lui.' },
      { label: 'Transition', text: 'Tu y arrives après un passage de garde ou un balayage.' },
      { label: 'Contrôle', text: 'Un bras tient la tête, l’autre bloque la hanche, genoux collés à son corps.' },
      { label: 'Sortie', text: 'Pour s’échapper, il a le pont ou le shrimp (sortie de hanche). Toi, tu suis ou tu passes à la montée.' },
    ],
    keyPoints: ['Ton poids passe par ta poitrine, pas par tes genoux', 'Bloquer sa hanche empêche le shrimp'],
    safety: ['N’appuie jamais sur la gorge ou le visage.', TAP, DOJO],
    prep: 'sortie-hanche',
  },
  {
    id: 'montee',
    name: 'Montée (mount)',
    discipline: 'bjj',
    category: 'immobilisation',
    level: 'intermediaire',
    mode: 'partenaire',
    description: 'Assis sur le ventre de ton partenaire allongé, genoux au sol de chaque côté, tu contrôles sa position.',
    phases: [
      { label: 'Position', text: 'Genoux au sol de chaque côté de son buste, hanches lourdes.' },
      { label: 'Transition', text: 'Depuis le contrôle latéral, le genou glisse sur son ventre puis passe de l’autre côté.' },
      { label: 'Contrôle', text: 'Tes mains se posent au sol pour la stabilité, tes pieds crochètent ses jambes.' },
      { label: 'Sortie', text: 'Pour s’échapper, il a le pont sur le côté (upa) ou le shrimp. Toi, tu élargis ta base pour ne pas rouler.' },
    ],
    keyPoints: ['Hanches lourdes, buste relevé', 'Une base large avec les mains'],
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
    description: 'Principes de la clé de bras (juji-gatame) : isoler un bras, contrôler l’épaule. Expliquée ici, jamais testée seul ni sur quelqu’un qui ne pratique pas.',
    phases: [
      { label: 'Position', text: 'En garde fermée, le bras de ton partenaire est isolé contre ta poitrine.' },
      { label: 'Transition', text: 'Tu pivotes les hanches de côté pour placer ta jambe sur sa tête.' },
      { label: 'Contrôle', text: 'Son bras est tenu pouce vers le haut, ses épaules contrôlées par tes jambes.' },
      { label: 'Sortie', text: 'Au club, la pression monte tout doucement et s’arrête au premier tapement.' },
    ],
    keyPoints: ['D’abord le contrôle, ensuite la pression', 'La pression monte lentement et progressivement'],
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
