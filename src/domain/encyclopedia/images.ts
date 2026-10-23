import type { TermImage } from './types';

/**
 * Illustrations of the encyclopedia (§11, §12). Two origins only:
 * - 'rendu-3d': a capture of the app's own 3D coaches (Kadir, Amara; Microsoft Rocketbox base models, MIT licence,
 *   see docs/v029) playing the app's own animation, at three instants (start, half way, key moment). Made by
 *   scripts/encyclopedie/renders.mjs from `RENDERS` below; files under public/encyclopedie/.
 * - 'a-produire': no illustration yet. The sheet says so and shows the brief; nothing stands in for it.
 * Several terms may share one file (§12 « ne pas multiplier les copies d'une même image »).
 */
const D = '2026-10-23';
const TOOL = 'Moteur 3D de l’application (Three.js), capture automatique';

/** what to render: image id → technique of the app, coach and options of the Lab view */
export interface RenderRecipe {
  id: string;
  tech: string;
  coach: 'homme' | 'femme';
  /** discipline of the outfit and stance, when the technique belongs to several */
  d?: string;
  southpaw?: boolean;
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
  { id: 'prep-shadow', tech: 'crochet-arriere', coach: 'femme', d: 'kickboxing', alt: 'La coach enchaîne dans le vide, en shadow' },
];

const TODO = (id: string, alt: string, brief: string): TermImage => ({ id, width: 720, height: 400, alt, origin: { kind: 'a-produire', brief } });

/** illustrations still to make, with their brief (§11 B: « signaler précisément les illustrations restant à produire ») */
const TO_PRODUCE: TermImage[] = [
  TODO('tech-passage-garde', 'Passage de garde', 'Deux pratiquants en kimono : l’un sur le dos, jambes ouvertes ; l’autre contourne les jambes en les écartant (toreando). Trois instants.'),
  TODO('tech-kesa-gatame', 'Kesa-gatame', 'Judoka assis sur le côté du partenaire allongé, bras du partenaire bloqué sous l’aisselle, tête entourée. Vue de trois quarts.'),
  TODO('tech-cle-de-bras', 'Clé de bras', 'Depuis la garde, bras du partenaire tendu le long du buste, hanches levées ; coude dans l’axe. Pas de douleur exagérée.'),
  TODO('tech-etranglement-arriere', 'Étranglement arrière', 'Pratiquant collé au dos du partenaire assis, un bras autour du cou verrouillé par l’autre, crochets des jambes. Vue de côté.'),
  TODO('tech-triangle', 'Triangle', 'Pratiquant sur le dos, jambes en triangle autour du cou et d’un bras du partenaire. Vue de côté.'),
  TODO('pos-garde-fermee', 'Garde fermée', 'Pratiquant sur le dos, chevilles croisées derrière le dos du partenaire à genoux.'),
  TODO('pos-demi-garde', 'Demi-garde', 'Pratiquant sur le dos, une jambe du partenaire prise entre ses jambes.'),
  TODO('pos-montee', 'Montée', 'Pratiquant assis à califourchon sur le buste du partenaire allongé, genoux au sol.'),
  TODO('pos-controle-lateral', 'Contrôle latéral', 'Pratiquant en travers du buste du partenaire allongé, poitrine contre poitrine.'),
  TODO('pos-genou-ventre', 'Genou sur le ventre', 'Un genou en travers du buste du partenaire, l’autre jambe tendue sur le côté.'),
  TODO('pos-controle-dos', 'Contrôle du dos', 'Pratiquant accroché au dos du partenaire assis, crochets des jambes devant.'),
  TODO('pos-nord-sud', 'Nord-sud', 'Pratiquant allongé tête-bêche sur la poitrine du partenaire. Vue de dessus.'),
  TODO('eq-bandes', 'Bandes de protection', 'Main bandée vue de dos et de paume : poignet, base du pouce, phalanges ; bande enroulée à côté.'),
  TODO('eq-protege-dents', 'Protège-dents', 'Protège-dents thermoformable posé, vue de trois quarts, à côté d’un étui.'),
  TODO('eq-casque', 'Casque', 'Casque de boxe amateur sans protège-joues, de face et de profil.'),
  TODO('eq-coquille', 'Coquille', 'Coquille de protection seule, vue de face, sobre.'),
  TODO('eq-protege-poitrine', 'Protège-poitrine', 'Protection de poitrine pour combattante, posée à plat.'),
  TODO('eq-sac', 'Sac de frappe', 'Sac lourd suspendu par des chaînes dans une salle, et à côté un sac « banane » plus long.'),
  TODO('eq-pattes-ours', 'Pattes d’ours', 'Paire de pattes d’ours, face de frappe et poignée.'),
  TODO('eq-paos', 'Paos', 'Paire de paos thaïs, sangles d’avant-bras visibles.'),
  TODO('lieu-dojo', 'Dojo', 'Salle de judo traditionnelle avec tatamis, vue générale.'),
  TODO('famille-regles', 'Règles et arbitrage', 'Arbitre de boxe qui sépare deux boxeurs, geste clair. Personnages fictifs.'),
  TODO('regle-round', 'Round', 'Chronomètre de round et cloche, ou combattants qui regagnent leur coin à la fin du round.'),
  TODO('regle-styles-kb', 'Styles de kick-boxing', 'Trois silhouettes côte à côte : poings et pieds au-dessus de la ceinture (full contact), low kick, genou (K1).'),
  TODO('regle-pesee', 'Pesée', 'Combattant sur une balance, officiel qui lit le poids.'),
  TODO('regle-ko', 'KO et arrêt de l’arbitre', 'Arbitre qui compte au-dessus d’un boxeur au tapis, sans blessure visible.'),
  TODO('regle-decision', 'Décision', 'Arbitre qui lève le bras du vainqueur au centre du ring.'),
  TODO('regle-soumission', 'Soumission', 'Gros plan d’une main qui tape trois fois sur le tapis.'),
  TODO('regle-penalite', 'Fautes et pénalités', 'Arbitre qui donne un avertissement, bras tendu vers un combattant.'),
  TODO('regle-ippon', 'Ippon', 'Arbitre de judo, bras levé à la verticale.'),
  TODO('regle-points-jjb', 'Points en JJB', 'Tableau de points de JJB : points, avantages, pénalités, pour deux athlètes.'),
  TODO('regle-arbitre', 'Arbitre et juges', 'Arbitre dans l’aire et trois juges à leur table autour du ring.'),
  TODO('prep-sparring', 'Sparring', 'Deux partenaires casqués et gantés en échange léger, entraîneur à côté.'),
  TODO('prep-echauffement', 'Échauffement', 'Pratiquant qui saute à la corde, puis mobilisation des épaules.'),
  TODO('secu-commotion', 'Commotion cérébrale', 'Illustration sobre d’une tête de profil avec les zones d’alerte, sans image choquante.'),
  TODO('secu-articulations', 'Précautions articulaires', 'Schéma du coude, du genou et de la colonne avec les sens de torsion dangereux.'),
  TODO('secu-zones', 'Zones interdites', 'Silhouette de face et de dos avec la nuque, l’arrière de la tête, l’aine et les reins marqués.'),
  TODO('famille-securite', 'Anatomie et sécurité', 'Planche anatomique pédagogique d’un combattant : muscles principaux et articulations.'),
  TODO('cult-wai-kru', 'Wai kru', 'Combattant agenouillé sur le ring, mongkon sur la tête, en prosternation.'),
  TODO('cult-mongkon', 'Mongkon', 'Mongkon posé sur une table, et deux pra jiad.'),
  TODO('cult-muaythai', 'Muay-thaï', 'Nak muay en garde thaï dans un ring, ambiance de stade, personnage fictif.'),
  TODO('cult-jjb', 'Jiu-jitsu brésilien', 'Deux pratiquants en kimono sur un tatami, un en garde.'),
  TODO('cult-boxe', 'Histoire de la boxe', 'Gants de cuir anciens et réglement imprimé, ambiance XIXe siècle.'),
  TODO('cult-kickboxing', 'Histoire du kick-boxing', 'Combattant de kick-boxing en short et gants, pieds nus, dans un ring.'),
  TODO('cult-federations', 'Fédérations', 'Six pictogrammes de disciplines autour d’un livre de règles, sans logo de fédération.'),
];

/** the files made from 3D renders and Blender scenes of the repository */
const rendered = (r: RenderRecipe): TermImage => ({
  id: r.id,
  file: r.id,
  width: 720,
  height: 400,
  alt: r.alt,
  frames: r.still ? undefined : 3,
  origin: { kind: 'rendu-3d', what: r.still ? r.still.what : `Coach ${r.coach === 'homme' ? 'Kadir' : 'Amara'}, technique « ${r.tech} » de l’application, début, mi-chemin et moment clé`, tool: TOOL, date: D },
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
];

const scened = (s: SceneRecipe): TermImage => ({
  id: s.id,
  file: s.id,
  width: 720,
  height: 400,
  alt: s.alt,
  origin: { kind: 'rendu-3d', what: s.what, tool: 'Blender 5.2 (bpy), scène du dépôt, rendu Cycles', date: D },
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
