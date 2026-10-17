/**
 * Base de connaissances du coach IA, entièrement locale.
 *
 * Deux sources seulement :
 *  1. les fiches techniques validées de l’application (src/domain/techniques.ts + src/domain/guide.ts) ;
 *  2. une FAQ générale écrite à la main, volontairement prudente (principes standard enseignés en club).
 *
 * Aucune technique n’est inventée ici : chaque entrée « technique » correspond à un identifiant de
 * TECHNIQUES, et les entrées de FAQ ne citent que des techniques existantes (champ `related`).
 * Aucune affirmation médicale : en cas de douleur, la seule consigne est d’arrêter et de consulter.
 */
import { GUIDES } from '../domain/guide';
import { CATEGORY_LABEL, TECHNIQUES, TECHNIQUE_BY_ID } from '../domain/techniques';
import type { DisciplineId, LevelId, TechniqueCategory } from '../domain/types';

export interface KnowledgeEntry {
  id: string;
  title: string;
  /** explication principale (niveau intermédiaire) */
  text: string;
  /** formulation simple pour débutant */
  simple?: string;
  /** nuance tactique pour avancé / expert */
  nuance?: string;
  steps?: string[];
  errors?: string[];
  cues?: string[];
  keyPoints?: string[];
  breath?: string;
  soloNote?: string;
  tags: string[];
  disciplines: DisciplineId[];
  /** niveaux pour lesquels l’entrée est la plus utile (indication, pas un filtre) */
  levels: LevelId[];
  /** identifiant de technique, ou 'faq' */
  source: string;
  /** techniques existantes liées (pour les actions démo / ralenti) */
  related: string[];
  category?: TechniqueCategory;
}

const ALL_D: DisciplineId[] = ['boxe', 'kickboxing', 'mma', 'muaythai'];
const KICK_D: DisciplineId[] = ['kickboxing', 'mma', 'muaythai'];
const ALL_L: LevelId[] = ['debutant', 'intermediaire', 'avance', 'expert'];

/** nuance tactique générale par catégorie (avancé / expert), formulations standard */
export const CATEGORY_NUANCE: Record<TechniqueCategory, string> = {
  garde: 'Une bonne garde n’est pas figée : reste mobile sur l’avant des pieds et ajuste la hauteur des mains à la distance.',
  poing: 'Varie les niveaux (corps puis tête), cache le départ derrière ton jab ou une feinte, et sors de la ligne après ta série au lieu de rester en face.',
  pied: 'Prépare le coup de pied avec les poings pour masquer le départ, choisis la distance avant la puissance et reviens en garde aussitôt pour ne pas te faire contrer.',
  genou: 'Le genou se place à courte distance, souvent après avoir fermé la distance avec les poings ; garde les mains en cadre pour contrôler l’espace.',
  coude: 'Le coude ne sert qu’à très courte distance : enchaîne-le après un crochet ou en sortie de clinch, jamais depuis loin.',
  defense: 'Une défense sert à créer une ouverture : esquive ou bloque juste ce qu’il faut, puis réponds immédiatement depuis la position obtenue.',
  deplacement: 'Le déplacement prépare l’attaque : change d’angle après tes séries et ne recule pas en ligne droite trop longtemps.',
  lutte: 'Masque le changement de niveau derrière une frappe haute, et remonte en garde dès que l’action est terminée.',
  sol: 'Au sol, la priorité reste de créer de l’espace puis de revenir debout en garde, à distance.',
  feinte: 'Une feinte ne marche que si elle ressemble à ton vrai coup : garde-la courte et enchaîne sans délai.',
  clinch: 'Le clinch se travaille réellement avec un partenaire ; en solo, concentre-toi sur la posture et le placement des hanches.',
};

/** côté du membre d’après l’identifiant (« -avant » = membre avant, « -arriere » = membre arrière) */
export function techniqueSide(id: string): 'avant' | 'arriere' | undefined {
  if (id === 'jab' || id === 'jab-corps' || id.endsWith('-avant') || id.includes('-avant-')) return 'avant';
  if (id === 'direct' || id === 'direct-corps' || id === 'overhand' || id.endsWith('-arriere') || id.includes('-arriere-')) return 'arriere';
  return undefined;
}

function techniqueEntries(): KnowledgeEntry[] {
  return TECHNIQUES.map((t) => {
    const g = GUIDES[t.id];
    return {
      id: `tech:${t.id}`,
      title: t.name,
      text: t.description,
      steps: g?.steps,
      errors: g?.errors,
      cues: t.cues,
      keyPoints: t.keyPoints,
      breath: g?.breath,
      soloNote: t.soloNote,
      nuance: CATEGORY_NUANCE[t.category],
      tags: [t.category, CATEGORY_LABEL[t.category], t.call, t.id.replace(/-/g, ' ')],
      disciplines: t.disciplines,
      levels: ALL_L,
      source: t.id,
      related: [t.id],
      category: t.category,
    } satisfies KnowledgeEntry;
  });
}

type Faq = Omit<KnowledgeEntry, 'source' | 'disciplines' | 'levels'> & { disciplines?: DisciplineId[]; levels?: LevelId[] };

/** FAQ générale : principes standard, aucune technique en dehors de la bibliothèque */
const FAQ: Faq[] = [
  {
    id: 'faq:pivot-pied-arriere',
    title: 'Pivoter le pied arrière',
    text: 'Pivoter le pied arrière (appui sur l’avant du pied, talon qui tourne vers l’extérieur) libère la hanche : elle peut tourner complètement et la force part du sol, passe par la jambe, la hanche puis l’épaule jusqu’au poing. Sans pivot, le coup ne part que du bras : il est moins puissant, et le genou travaille en torsion au lieu de tourner avec la hanche.',
    simple: 'Quand tu frappes avec le bras arrière, ton pied arrière tourne sur sa pointe, talon vers l’extérieur, comme si tu écrasais quelque chose sous l’avant du pied. Ça permet à ta hanche de tourner et à tout ton corps de pousser le coup, pas seulement le bras.',
    nuance: 'Le pivot accompagne la rotation de hanche, il ne la précède pas : un pivot trop tôt annonce le coup. Retrouve un appui stable dès la fin du geste pour enchaîner ou défendre.',
    tags: ['pivot', 'pivoter', 'pivoter le pied', 'pied arrière', 'pied', 'talon', 'tourner le pied', 'rotation', 'hanche', 'puissance', 'direct', 'appui'],
    related: ['direct', 'crochet-arriere', 'uppercut-arriere', 'low-kick-arriere'],
  },
  {
    id: 'faq:rotation-hanches',
    title: 'La rotation des hanches',
    text: 'La hanche est le moteur des coups circulaires et des directs arrière : elle tourne vers la cible, entraîne les épaules, et le bras ou la jambe ne fait que transmettre. Le pied d’appui pivote pour qu’elle puisse tourner librement.',
    simple: 'Imagine que ta ceinture tourne vers la cible à chaque coup : c’est elle qui donne la force, ton bras suit.',
    nuance: 'Une rotation complète donne de la puissance mais te met de profil plus longtemps : dose-la selon la distance et garde toujours la main libre en protection.',
    tags: ['hanche', 'hanches', 'rotation', 'tourner', 'puissance', 'force', 'moteur'],
    related: ['direct', 'crochet-avant', 'middle-kick-arriere', 'low-kick-arriere'],
  },
  {
    id: 'faq:garde',
    title: 'Garder une bonne garde',
    text: 'En garde : pieds décalés de la largeur des épaules, genoux souples, poids réparti, main arrière contre la joue, main avant devant le menton, coudes près du corps, menton rentré. Après chaque coup, les mains reviennent à cette position par le même chemin.',
    simple: 'Mains hautes contre le visage, coudes serrés, menton baissé, genoux un peu pliés : c’est ta position de base, tu y reviens après chaque coup.',
    nuance: 'Une garde efficace reste détendue : épaules relâchées, mains qui bougent légèrement. Une garde crispée fatigue et ralentit tes départs.',
    tags: ['garde', 'mains', 'protection', 'coudes', 'position', 'menton', 'base'],
    related: ['garde', 'blocage-haut'],
  },
  {
    id: 'faq:menton',
    title: 'Le menton rentré',
    text: 'Rentrer le menton, c’est baisser légèrement la tête et la garder derrière l’épaule avant et les poings. Le menton est moins exposé et tu continues à regarder devant toi, à travers tes gants.',
    simple: 'Baisse un peu le menton, comme pour tenir une balle de tennis contre ta poitrine, et regarde devant toi par-dessus tes poings.',
    tags: ['menton', 'tete', 'rentré', 'regard', 'protection'],
    related: ['garde', 'jab'],
  },
  {
    id: 'faq:retour-garde',
    title: 'Revenir en garde',
    text: 'Chaque coup se termine par un retour en garde, par le même chemin qu’à l’aller : le poing ou la jambe revient aussi vite qu’il est parti. C’est ce qui te protège pendant l’enchaînement et prépare le coup suivant.',
    simple: 'Frappe, puis ramène tout de suite ta main (ou ta jambe) à sa place : l’aller et le retour vont à la même vitesse.',
    nuance: 'Le retour en garde est aussi un moment d’attaque : un bon retour te remet en position pour enchaîner sans temps mort.',
    tags: ['retour', 'garde', 'ramener', 'revenir', 'après', 'protection'],
    related: ['jab', 'direct', 'garde'],
  },
  {
    id: 'faq:deplacements',
    title: 'Déplacements et angles',
    text: 'Pour te déplacer, le pied le plus proche de la direction part en premier et l’autre suit de la même distance : les pieds ne se croisent jamais et l’écartement de la garde reste le même. Les pas sont courts et rasants. Pour changer d’angle, utilise le pivot sur le pied avant ou une sortie en diagonale.',
    simple: 'Pour avancer, le pied avant part d’abord ; pour reculer, le pied arrière part d’abord. Petits pas, pieds jamais croisés, garde haute.',
    nuance: 'Les angles se prennent après une série, pas avant : frappe, sors de la ligne, puis repars depuis le nouvel angle.',
    tags: ['deplacement', 'déplacements', 'pas', 'pieds', 'jeu de jambes', 'angle', 'angles', 'pivot', 'croiser', 'footwork', 'mobilité'],
    related: ['pas-avant', 'pas-arriere', 'pas-gauche', 'pas-droite', 'pivot-droite', 'sortie-angle'],
  },
  {
    id: 'faq:equilibre-pieds',
    title: 'L’équilibre sur les coups de pied',
    text: 'Pour rester équilibré sur un coup de pied : le pied d’appui tourne sur sa pointe, le genou d’appui reste légèrement fléchi, le buste s’incline juste ce qu’il faut pour contrebalancer la jambe, et la garde reste haute. Le regard reste sur la cible. Monte seulement à la hauteur que ta souplesse permet, et reviens en garde par le même chemin.',
    simple: 'Commence lentement et bas. Tourne bien le pied qui reste au sol, garde ce genou un peu plié, regarde la cible et garde les mains hautes. La hauteur viendra avec la souplesse : ne force pas.',
    nuance: 'L’équilibre se joue surtout au retour : un coup de pied qui « traverse » sans réarmer te laisse dos à l’adversaire. Travaille aussi le réarmé et la reprise d’appui en garde.',
    tags: ['equilibre', 'équilibre', 'stabilité', 'tomber', 'appui', 'pied d appui', 'kick', 'high kick', 'souplesse', 'jambe'],
    related: ['high-kick-arriere', 'middle-kick-arriere', 'roundhouse-arriere', 'teep-avant', 'front-kick-avant'],
    disciplines: KICK_D,
  },
  {
    id: 'faq:respiration',
    title: 'La respiration',
    text: 'Expire brièvement au moment de chaque coup (un souffle court par le nez ou la bouche) et respire calmement entre les séries. Ne bloque pas ta respiration pendant un enchaînement : tu te fatigues plus vite et tu te crispes.',
    simple: 'Souffle un petit coup à chaque frappe, comme un « tss », et respire normalement entre les séries.',
    nuance: 'Une expiration courte aide à gainer le tronc à l’impact ; sur une longue série, garde un rythme de souffle régulier plutôt qu’une expiration par coup très appuyée.',
    tags: ['respiration', 'respirer', 'souffle', 'souffler', 'expirer', 'expiration', 'essoufflé', 'cardio'],
    related: ['jab', 'direct'],
  },
  {
    id: 'faq:jab-direct',
    title: 'Jab et direct (cross)',
    text: 'Le jab est le direct du bras avant : court, rapide, il sert à mesurer la distance, gêner et préparer. Le direct (appelé aussi cross ou direct arrière) part du bras arrière : il parcourt plus de distance et gagne en puissance grâce au pivot du pied arrière et à la rotation des hanches. Les deux vont en ligne droite et reviennent en garde par le même chemin.',
    simple: 'Le jab, c’est ta main avant : rapide et léger. Le direct, c’est ta main arrière : il part de plus loin, ton pied arrière pivote et ta hanche tourne, donc il est plus puissant.',
    nuance: 'Le jab ouvre et cache ; le direct conclut ou ouvre le crochet. Varier la vitesse du jab rend le direct plus difficile à lire.',
    tags: ['jab', 'direct', 'cross', 'difference', 'différence', 'bras avant', 'bras arrière', 'droit'],
    related: ['jab', 'direct'],
  },
  {
    id: 'faq:crochet-uppercut',
    title: 'Crochet et uppercut',
    text: 'Le crochet suit une trajectoire horizontale : coude à hauteur du poing, avant-bras parallèle au sol, rotation des hanches et pivot. L’uppercut suit une trajectoire verticale, de bas en haut, porté par une légère flexion puis la poussée des jambes. Les deux se portent à courte ou moyenne distance.',
    simple: 'Le crochet tourne sur le côté, le bras plié comme un crochet. L’uppercut monte de bas en haut, en poussant avec les jambes.',
    nuance: 'L’uppercut passe au centre quand la garde se resserre ; le crochet contourne une garde ouverte. Les alterner oblige l’adversaire à changer sa défense.',
    tags: ['crochet', 'uppercut', 'difference', 'différence', 'horizontal', 'vertical', 'hook'],
    related: ['crochet-avant', 'uppercut-arriere'],
  },
  {
    id: 'faq:teep',
    title: 'Le teep',
    text: 'Le teep est un coup de pied repoussant : genou levé, hanche projetée vers l’avant, poussée avec la plante du pied. Il sert surtout à gérer la distance et à casser l’avancée de l’adversaire. Le front kick lui ressemble mais cherche davantage à frapper avec l’avant du pied qu’à repousser.',
    simple: 'Le teep, c’est comme repousser une porte avec le pied : tu montes le genou, puis tu pousses avec la plante du pied et la hanche.',
    nuance: 'Le teep règle la distance : utilise-le pour couper l’élan adverse ou ouvrir une attaque, puis enchaîne pendant qu’il revient.',
    tags: ['teep', 'push kick', 'repousser', 'front kick', 'distance', 'coup de pied de face'],
    related: ['teep-avant', 'front-kick-avant'],
    disciplines: ['muaythai', 'mma', 'kickboxing'],
  },
  {
    id: 'faq:genoux',
    title: 'Les genoux',
    text: 'Le genou se porte à courte distance : la hanche pousse vers l’avant, le pied d’appui monte sur la pointe et les mains restent en cadre devant toi. Le genou direct monte droit devant ; le genou circulaire arrive par le côté avec une rotation de hanche.',
    simple: 'Pousse la hanche vers l’avant, monte sur la pointe du pied d’appui et garde les mains devant toi.',
    nuance: 'Le genou devient dangereux après avoir fermé la distance ; en solo, travaille la poussée de hanche et l’équilibre plutôt que la vitesse.',
    tags: ['genou', 'genoux', 'knee', 'muay', 'hanche'],
    related: ['genou-direct-arriere', 'genou-circulaire-arriere'],
    disciplines: ['muaythai', 'mma'],
  },
  {
    id: 'faq:coudes',
    title: 'Les coudes',
    text: 'Le coude se porte à très courte distance : rotation du corps, coude à hauteur d’épaule ou du menton, l’autre main reste en protection. Il existe des trajectoires horizontales, diagonales descendantes et remontantes.',
    simple: 'Le coude, c’est pour quand tu es tout près : tourne tout le corps, l’autre main reste contre ta tête.',
    nuance: 'Enchaîne le coude derrière un crochet ou en sortie de clinch ; depuis loin, il ne touche pas.',
    tags: ['coude', 'coudes', 'elbow', 'muay', 'courte distance'],
    related: ['coude-horizontal-avant', 'coude-diagonal-arriere', 'coude-montant-arriere'],
    disciplines: ['muaythai'],
  },
  {
    id: 'faq:sprawl',
    title: 'Le sprawl',
    text: 'Le sprawl défend une entrée en lutte : les jambes partent en arrière d’un coup, les hanches descendent lourdement vers le sol, la tête reste haute, puis tu reviens en garde le plus vite possible.',
    simple: 'Jette tes jambes en arrière, pose tes hanches vers le sol, garde la tête haute, puis remonte vite en garde.',
    nuance: 'L’important est le retour : un sprawl réussi doit te remettre debout, en garde et prêt à frapper.',
    tags: ['sprawl', 'lutte', 'défense', 'takedown', 'amenée'],
    related: ['sprawl', 'defense-lutte'],
    disciplines: ['mma'],
  },
  {
    id: 'faq:echauffement',
    title: 'L’échauffement',
    text: 'Avant de frapper, prends environ 5 à 10 minutes pour t’échauffer progressivement : mobilise les articulations (chevilles, genoux, hanches, épaules, poignets, nuque), fais monter le cardio doucement (petits sautillements, pas de garde), puis fais du shadow lent avant d’accélérer. Commence les coups de pied bas et lents.',
    simple: 'Commence doucement : fais tourner tes articulations, sautille un peu, puis fais quelques coups lents avant d’aller plus vite.',
    tags: ['echauffement', 'échauffement', 'échauffer', 'mobilité', 'articulations', 'avant la séance', 'préparation'],
    related: ['garde', 'pas-avant', 'jab'],
  },
  {
    id: 'faq:repos',
    title: 'Repos et récupération',
    text: 'Le repos fait partie de l’entraînement : garde au moins un jour plus léger entre deux séances intenses, dors suffisamment et bois de l’eau pendant et après la séance. Termine par quelques minutes de retour au calme (marche, respiration lente, mobilité douce).',
    simple: 'Après une grosse séance, laisse ton corps récupérer : une journée plus calme, du sommeil et de l’eau.',
    tags: ['repos', 'récupération', 'recuperation', 'fatigue', 'sommeil', 'pause', 'retour au calme', 'courbatures', 'récupérer'],
    related: [],
  },
  {
    id: 'faq:douleur',
    title: 'Douleur ou malaise',
    text: 'Si tu ressens une douleur, une gêne articulaire, un vertige ou un malaise, arrête l’exercice. Ne force pas à travers la douleur. Si elle persiste, consulte un professionnel de santé (médecin, kinésithérapeute). En cas de douleur dans la poitrine, de difficulté à respirer ou de malaise important, appelle les secours (15 ou 112).',
    tags: ['douleur', 'mal', 'blessure', 'blessé', 'vertige', 'malaise', 'santé', 'articulation', 'genou', 'épaule'],
    related: [],
  },
  {
    id: 'faq:articulations-shadow',
    title: 'Protéger ses articulations en shadow',
    text: 'En shadow, il n’y a pas de cible pour arrêter le coup : garde un léger contrôle en fin de geste plutôt que de verrouiller brutalement le coude ou le genou. Augmente la vitesse progressivement, après l’échauffement.',
    simple: 'Sans sac, ne lance pas tes coups jusqu’au blocage complet du bras ou de la jambe : garde un peu de contrôle à la fin.',
    tags: ['articulations', 'coude', 'genou', 'verrouiller', 'shadow', 'tendu', 'hyperextension', 'contrôle'],
    related: ['jab', 'direct', 'front-kick-avant'],
  },
  {
    id: 'faq:puissance-vitesse',
    title: 'Puissance et vitesse',
    text: 'La puissance vient des jambes et de la rotation des hanches, pas des épaules. La vitesse vient du relâchement : reste détendu, et ne contracte qu’au moment de l’impact. Commence lentement avec une technique propre, puis accélère sans perdre la forme.',
    simple: 'D’abord bien faire, ensuite aller vite. Reste détendu : un bras crispé est plus lent.',
    nuance: 'Travaille la vitesse sur des séries courtes et propres ; la puissance se construit avec la mécanique (appuis, hanche, retour), pas en forçant avec les bras.',
    tags: ['puissance', 'vitesse', 'rapide', 'fort', 'force', 'relâchement', 'détendu', 'explosivité', 'rapidité'],
    related: ['direct', 'crochet-avant'],
  },
  {
    id: 'faq:hauteurs-kicks',
    title: 'Low, middle et high kick',
    text: 'Les trois sont des coups de pied circulaires avec le tibia ; seule la hauteur change. Le low kick vise la cuisse avec une trajectoire légèrement descendante, le middle kick vise le corps en traversant la cible, le high kick vise la tête et demande le pivot le plus ample et plus de souplesse.',
    simple: 'Même famille de coups de pied, trois hauteurs : jambes (low), corps (middle), tête (high). Plus c’est haut, plus il faut pivoter et être souple.',
    nuance: 'Alterner les hauteurs depuis le même départ rend tes coups de pied difficiles à lire.',
    tags: ['low kick', 'middle kick', 'high kick', 'hauteur', 'difference', 'circulaire', 'tibia'],
    related: ['low-kick-arriere', 'middle-kick-arriere', 'high-kick-arriere'],
    disciplines: KICK_D,
  },
  {
    id: 'faq:shadow',
    title: 'Bien faire du shadow',
    text: 'En shadow, imagine un adversaire devant toi : garde haute, menton rentré, déplace-toi entre les séries et reviens en garde après chaque coup. Privilégie la précision du geste à la vitesse, puis accélère quand le geste est propre. Tu peux te filmer ou utiliser un miroir pour vérifier toi-même tes points clés.',
    simple: 'Imagine un adversaire, garde les mains hautes, bouge tes pieds et fais chaque coup proprement avant d’aller vite. Un miroir t’aide à vérifier ta garde.',
    tags: ['shadow', 'shadow boxing', 'seul', 'solo', 'miroir', 'adversaire imaginaire', 'entraînement'],
    related: ['garde', 'jab', 'pas-avant'],
  },
  {
    id: 'faq:debuter',
    title: 'Par où commencer',
    text: 'Pour débuter : la garde, les déplacements de base (pas avant, arrière, latéraux), puis le jab et le direct. Quand ces bases sont propres et que tu reviens toujours en garde, ajoute le crochet et les premières combinaisons courtes.',
    simple: 'Commence par la garde et les pas, puis le jab et le direct. Le reste viendra quand ces bases seront naturelles.',
    tags: ['débuter', 'commencer', 'débutant', 'bases', 'premier', 'apprendre'],
    related: ['garde', 'pas-avant', 'jab', 'direct'],
    levels: ['debutant'],
  },
  {
    id: 'faq:gaucher',
    title: 'Garde gaucher',
    text: 'Les fiches sont écrites pour la garde orthodoxe (pied gauche devant). En garde gaucher (pied droit devant), inverse gauche et droite : ton jab part du bras droit et ton direct du bras gauche. L’animation du coach est automatiquement inversée quand ton profil est en garde gaucher.',
    tags: ['gaucher', 'southpaw', 'garde gaucher', 'inverser', 'gauche', 'droite'],
    related: ['garde', 'jab', 'direct'],
  },
  {
    id: 'faq:distance',
    title: 'Gérer la distance',
    text: 'La distance décide de tes armes : les directs et les coups de pied se portent de loin, les crochets et uppercuts à moyenne ou courte distance, les genoux et les coudes au contact. Avance ou recule par petits pas pour te placer à la bonne distance avant de frapper.',
    simple: 'Loin : jab, direct, coups de pied. Plus près : crochets, uppercuts. Tout près : genoux et coudes.',
    nuance: 'Rentrer et sortir de distance au bon moment compte autant que le coup lui-même : entre avec une attaque, sors avec un angle.',
    tags: ['distance', 'portée', 'loin', 'près', 'allonge'],
    related: ['jab', 'crochet-avant', 'teep-avant'],
  },
];

let cache: KnowledgeEntry[] | null = null;

/** toutes les entrées (fiches techniques + FAQ), construites une seule fois */
export function knowledgeBase(): KnowledgeEntry[] {
  if (!cache) {
    const faq = FAQ.map((f) => ({ ...f, source: 'faq', disciplines: f.disciplines ?? ALL_D, levels: f.levels ?? ALL_L }) satisfies KnowledgeEntry);
    for (const f of faq) for (const r of f.related) if (!TECHNIQUE_BY_ID.has(r)) throw new Error(`FAQ ${f.id} : technique inconnue ${r}`);
    cache = [...techniqueEntries(), ...faq];
  }
  return cache;
}

export const ENTRY_BY_ID = () => new Map(knowledgeBase().map((e) => [e.id, e]));
