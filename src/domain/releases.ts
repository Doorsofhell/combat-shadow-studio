/**
 * v0.32 (Youssef, PROMPT MAÎTRE navigation, section 7): « Nouveautés », the versions of the app and what each one
 * brought. Only real, delivered changes (docs/JOURNAL_CORRECTIONS.md is the source); the mockup's sample notes are
 * not used. Bundled with the app, so the centre works offline. Newest first.
 *
 * To announce a new version: add an entry at the top (its `version` is the package version without the
 * « -protoN » suffix); the red dots of Menu and Nouveautés come back for everyone until it is opened.
 */
export type ReleaseCategory = 'fonctionnalites' | 'techniques' | 'disciplines' | 'coachs' | 'ameliorations' | 'corrections';

export const RELEASE_CATEGORY_LABEL: Record<ReleaseCategory, string> = {
  fonctionnalites: 'Nouvelles fonctionnalités',
  techniques: 'Nouvelles techniques',
  disciplines: 'Nouvelles disciplines',
  coachs: 'Nouveaux coachs',
  ameliorations: 'Améliorations',
  corrections: 'Corrections',
};

export interface ReleaseChange {
  category: ReleaseCategory;
  text: string;
}

export interface ReleaseLink {
  label: string;
  /** a page of the app (hash route) */
  to: string;
}

export interface Release {
  version: string;
  /** publication date, YYYY-MM-DD */
  releaseDate: string;
  title: string;
  /** the categories present, in display order (derived from `changes`, kept for readers of the data) */
  categories: ReleaseCategory[];
  changes: ReleaseChange[];
  links: ReleaseLink[];
  /** a major update (may be presented discreetly at start-up later; nothing intrusive today) */
  isMajor: boolean;
}

type Draft = Omit<Release, 'categories'>;

const ORDER: ReleaseCategory[] = ['fonctionnalites', 'techniques', 'disciplines', 'coachs', 'ameliorations', 'corrections'];
const withCategories = (r: Draft): Release => ({ ...r, categories: ORDER.filter((c) => r.changes.some((x) => x.category === c)) });

export const RELEASES: readonly Release[] = (
  [
    {
      version: '1.38.0',
      releaseDate: '2026-11-12',
      title: 'Amara : un buste sans l’ancien bikini',
      isMajor: false,
      changes: [
        { category: 'corrections', text: 'Amara : le bikini sculpté dans le corps d’origine est retiré du buste lui-même (cordon du cou, bande et nœuds du dos, contour des bonnets), comme pour Inaya. Visage, coiffure et silhouette inchangés.' },
        { category: 'corrections', text: 'Hauts d’Amara (boxe, kick-boxing, muay-thaï, MMA, haut de JJB, kimonos) : plus de nœud ni de bande visibles au milieu de la poitrine et dans le dos.' },
        { category: 'corrections', text: 'Short MMA d’Amara : plus de pièce visible à l’intérieur de la cuisse.' },
      ],
      links: [{ label: 'Voir les coachs', to: '/coach' }],
    },
    {
      version: '1.37.8',
      releaseDate: '2026-11-12',
      title: 'Amara : relief musculaire affiné',
      isMajor: false,
      changes: [
        { category: 'ameliorations', text: 'Amara : relief de la peau et contraste des volumes musculaires légèrement accentués, sans changement du corps, des animations ni des tenues.' },
        { category: 'ameliorations', text: 'Réglage de rendu limité à Amara ; Kadir, Naël et Inaya conservent exactement leur apparence et leurs paramètres.' },
      ],
      links: [{ label: 'Voir les coachs', to: '/coach' }],
    },
    {
      version: '1.37.7',
      releaseDate: '2026-11-12',
      title: 'Amara : tenues propres dans les six disciplines',
      isMajor: false,
      changes: [
        { category: 'corrections', text: 'Amara : l’ancien bikini resté sculpté dans son corps ne se voit plus à travers ses vêtements (bande et nœud dans le dos du haut de JJB et des kimonos, bords des hauts de sport).' },
        { category: 'corrections', text: 'Hauts de boxe, kick-boxing, muay-thaï et MMA d’Amara : plus de trous ni de bords déchirés, décolleté remonté conservé.' },
        { category: 'corrections', text: 'Short MMA d’Amara : plus de pièce sombre entre les cuisses ni de fil tendu pendant le high kick.' },
        { category: 'corrections', text: 'Ceintures des shorts : la limite entre la couleur de la ceinture et celle du short est nette (plus de petites dents).' },
      ],
      links: [{ label: 'Voir les coachs', to: '/coach' }],
    },
    {
      version: '1.37.6',
      releaseDate: '2026-11-12',
      title: 'Amara : brassière plus couvrante et short MMA sans filet',
      isMajor: false,
      changes: [
        { category: 'corrections', text: 'Amara : décolleté des tenues de boxe, kick-boxing, muay-thaï et MMA remonté, poitrine mieux couverte et bretelles élargies tout en conservant sa morphologie.' },
        { category: 'corrections', text: 'Short MMA d’Amara : suppression de la petite jonction géométrique entre les cuisses par une découpe indépendante des deux couches (surshort et cuissard intérieur).' },
        { category: 'ameliorations', text: 'Nouveaux contrôles de maillage : vérification dans Blender de la couverture centrale de la poitrine et de la séparation des jambes, au-delà de la simple présence des fichiers.' },
        { category: 'ameliorations', text: 'Inaya reste la référence féminine et conserve ses tenues ; Naël et Kadir restent inchangés. Le corps et les animations d’Amara sont conservés.' },
      ],
      links: [{ label: 'Voir les coachs', to: '/coach' }],
    },
    {
      version: '1.37.5',
      releaseDate: '2026-11-12',
      title: 'Amara : décolleté et finitions des vêtements',
      isMajor: false,
      changes: [
        { category: 'corrections', text: 'Retouche ciblée de l’ancienne couleur de bikini incrustée dans la texture corporelle d’Amara : décolleté, poitrine et nuque. Sa couleur de peau reste préservée.' },
        { category: 'corrections', text: 'Haut de sport : bretelles et décolleté moins irréguliers, tissu éloigné des anciennes coutures 3D pour réduire les taches et traversées pendant les frappes.' },
        { category: 'corrections', text: 'Shorts : séparation de la ceinture jaune recalée sur un plan géométrique pour un bord plus net, notamment dans le dos.' },
        { category: 'ameliorations', text: 'Corps et animations : squelette, données de maillage et expressions faciales conservés à l’identique ; les sept tenues d’Amara sont reconstruites et contrôlées.' },
      ],
      links: [{ label: 'Voir les coachs', to: '/coach' }],
    },
    {
      version: '1.37.4',
      releaseDate: '2026-11-12',
      title: 'Amara : les sept tenues harmonisées sur Inaya',
      isMajor: false,
      changes: [
        { category: 'ameliorations', text: 'Inaya devient la référence officielle des patrons féminins. Ses sept tenues originales sont préservées à l’identique.' },
        { category: 'coachs', text: 'Amara porte désormais les mêmes styles et coupes de hauts qu’Inaya, dont le crop-top à encolure carrée en boxe, kick-boxing, muay-thaï et MMA, ajusté à ses épaules et à son buste.' },
        { category: 'corrections', text: 'Les sept tenues d’Amara sont reconstruites sur sa propre morphologie et son squelette ; sa palette noir et or reste conservée.' },
        { category: 'ameliorations', text: 'Contrôles : sept modèles féminins générés, métadonnées de référence et d’adaptation, et non-régression des tenues d’Inaya, Naël et Kadir.' },
      ],
      links: [{ label: 'Voir les coachs', to: '/coach' }],
    },
    {
      version: '1.37.3',
      releaseDate: '2026-11-12',
      title: 'Kadir : retour aux tenues stables, correction de régression',
      isMajor: false,
      changes: [
        { category: 'corrections', text: 'Kadir : restauration de ses sept tenues 3D de la v1.37.0 pour éliminer la régression des triangles et pointes à l’entrejambe apparue après leur régénération.' },
        { category: 'ameliorations', text: 'Contrôles de non-régression : chaque tenue de Kadir est comparée aux fichiers validés, sans modifier son corps, les autres coachs ni leurs vêtements.' },
        { category: 'ameliorations', text: 'Cache et chargement : les empreintes des modèles restaurés sont recalculées lors de la publication afin de télécharger les bons vêtements après mise à jour.' },
      ],
      links: [{ label: 'Voir les coachs', to: '/coach' }],
    },
    {
      version: '1.37.2',
      releaseDate: '2026-11-12',
      title: 'Tenues MMA : découpes et superpositions revues',
      isMajor: false,
      changes: [
        { category: 'corrections', text: 'Brassières et hauts MMA féminins : davantage de géométrie conservée sur les bretelles et emmanchures pour réduire les déchirures et les bordures irrégulières.' },
        { category: 'corrections', text: 'Shorts MMA à deux couches : surshort moins évasé, ceinture rapprochée du bassin et bordures latérales simplifiées pour supprimer les pans pointus.' },
        { category: 'ameliorations', text: 'Validation des 28 tenues reconstruites avant publication : la version 1.37.2 n’est publiée qu’avec des fichiers 3D effectivement régénérés et testés.' },
        { category: 'corrections', text: 'Shorts MMA harmonisés : Naël sert de référence pour les hommes et Inaya pour les femmes. Chaque tenue est ajustée aux proportions et au squelette du coach.' },
        { category: 'ameliorations', text: 'Coupe féminine sportive : taille et hanches bien ajustées, cuissard intérieur près du corps et surshort souple. Les deux modèles de référence sont conservés sans modification.' },
      ],
      links: [{ label: 'Voir les coachs', to: '/coach' }],
    },
    {
      version: '1.37.1',
      releaseDate: '2026-11-12',
      title: 'Tenues : textile plus mat et nouvelles coupes préparées',
      isMajor: false,
      changes: [
        { category: 'ameliorations', text: 'Rashguards, leggings et shorts de compression : aspect moins plastique et lumière plus douce dans les deux qualités graphiques.' },
        { category: 'corrections', text: 'Chargement des vêtements sécurisé : un squelette incompatible est signalé plutôt que de déformer silencieusement la tenue.' },
        { category: 'ameliorations', text: 'Générateur Blender préparé pour des ourlets de rashguard plus réguliers, des shorts mieux découpés et des pans de kimono plus souples ; les nouveaux modèles GLB nécessitent une régénération avant d’être visibles.' },
      ],
      links: [{ label: 'Voir les coachs', to: '/coach' }],
    },
    {
      version: '1.37.0',
      releaseDate: '2026-11-12',
      title: 'Uniquement des coachs ultra-réalistes',
      isMajor: false,
      changes: [
        { category: 'coachs', text: 'Quatre coachs, tous ultra-réalistes : Kadir, Naël, Amara et Inaya. Axel et Kaila sont retirés ; si tu les avais choisis, tu retrouves Kadir ou Amara, le reste de ton profil est gardé.' },
        { category: 'ameliorations', text: 'Choix du coach : les vignettes se partagent toute la largeur de l’écran sur une seule ligne, et le coach en grand ne tourne plus que vers la gauche et la droite.' },
        { category: 'ameliorations', text: 'Un seul rendu 3D : le réglage « Version du rendu 3D » et l’ancien écran « Mon combattant » disparaissent. Le premier téléchargement des coachs est plus léger (environ 62 Mo au lieu de 100).' },
      ],
      links: [{ label: 'Voir les coachs', to: '/coach' }],
    },
    {
      version: '1.36.0',
      releaseDate: '2026-11-12',
      title: 'Kadir : la bouche se lit mieux',
      isMajor: false,
      changes: [
        { category: 'coachs', text: 'La moustache et la petite touffe sous la lèvre de Kadir sont allégées : son sourire et l’expiration de la frappe se voient mieux. Sa barbe du menton, ses narines et ses lèvres ne changent pas.' },
      ],
      links: [{ label: 'Voir les coachs', to: '/coach' }],
    },
    {
      version: '1.35.0',
      releaseDate: '2026-11-12',
      title: 'Coachs plus humains : regard, bouche et comportement',
      isMajor: false,
      changes: [
        { category: 'corrections', text: 'Les coachs regardent enfin leur adversaire : en garde, leurs yeux ne fixent plus le sol mais le regard en face, et la paupière suit l’œil.' },
        { category: 'corrections', text: 'Plus de grimace d’effort à l’apparition du coach : le passage de la pose de départ à la garde n’est plus pris pour une frappe.' },
        { category: 'ameliorations', text: 'Huit états naturels et passagers : neutre, concentration, préparation, effort, frappe puissante, fatigue, récupération et encouragement après chaque répétition (léger sourire, petit hochement de tête).' },
        { category: 'ameliorations', text: 'Clignements irréguliers (parfois doubles, avec les coups d’œil), bouche fermée et détendue au repos qui ne s’entrouvre qu’à l’expiration ou quand le coach est essoufflé.' },
        { category: 'ameliorations', text: 'Un seul moteur de comportement pour les six coachs, avec des règles obligatoires et des tests pour tous les futurs personnages.' },
      ],
      links: [{ label: 'Voir les coachs', to: '/coach' }],
    },
    {
      version: '1.34.0',
      releaseDate: '2026-11-11',
      title: 'Démarrage rapide',
      isMajor: false,
      changes: [
        { category: 'corrections', text: 'Le chrono « Round 1 » ne retélécharge plus les coachs à chaque ouverture : une fois tout chargé, l’appli s’ouvre en moins d’une seconde.' },
        { category: 'ameliorations', text: 'Les modèles 3D des coachs sont compressés sans aucune perte : le premier chargement passe de 96 à 66 Mo.' },
        { category: 'ameliorations', text: 'Sur l’écran Coach, les autres coachs et leur tenue sont préparés à l’avance : ils s’affichent plus vite quand tu changes.' },
      ],
      links: [{ label: 'Voir les coachs', to: '/coach' }],
    },
    {
      version: '1.33.2',
      releaseDate: '2026-11-12',
      title: 'Frappes plus vivantes : anticipation et recul',
      isMajor: false,
      changes: [
        { category: 'ameliorations', text: 'Coups de poing plus naturels : le bassin prend une légère avance environ 2 à 3 images avant l’impact, puis le corps accompagne le retour en garde avec un petit recul.' },
        { category: 'ameliorations', text: 'Le poids se reporte discrètement vers l’arrière avant la frappe ; les pieds restent en appui et les enchaînements conservent leurs fondus fluides.' },
        { category: 'corrections', text: 'Les nouveaux mouvements s’effacent exactement à l’impact et avant la transition vers le coup suivant : même cible, même timing, sans toucher au solveur.' },
      ],
      links: [{ label: 'Voir les techniques', to: '/entrainer' }],
    },
    {
      version: '1.33.1',
      releaseDate: '2026-11-11',
      title: 'Crochets et uppercuts : le bassin entraîne le buste',
      isMajor: false,
      changes: [
        { category: 'ameliorations', text: 'Crochets et uppercuts plus naturels : les pieds et le bassin amorcent la rotation, puis les épaules et la poitrine rattrapent le mouvement juste avant la frappe. Le poing accélère en dernier.' },
        { category: 'corrections', text: 'Rotation du tronc mieux répartie dans le temps, sans changer la cible du coup, la posture à l’impact ni les limites articulaires.' },
      ],
      links: [{ label: 'Voir les techniques', to: '/entrainer' }],
    },
    {
      version: '1.33.0',
      releaseDate: '2026-11-11',
      title: 'Visages plus expressifs, cou plus naturel',
      isMajor: false,
      changes: [
        { category: 'coachs', text: 'Les visages des coachs se lisent mieux : regard concentré entre deux coups, sourcils froncés et yeux plissés à la frappe, souffle visible à l’impact.' },
        { category: 'coachs', text: 'En garde, le cou reste droit et le menton rentré : la tête est au-dessus des épaules au lieu de partir vers l’avant. Les bras et la garde ne changent pas.' },
      ],
      links: [{ label: 'Voir les coachs', to: '/coach' }],
    },
    {
      version: '1.32.0',
      releaseDate: '2026-11-11',
      title: 'Choix du coach en grand',
      isMajor: false,
      changes: [
        { category: 'ameliorations', text: 'Choix du coach : le coach est en grand et en 3D, dans la tenue de ta discipline. Fais-le tourner du doigt.' },
        { category: 'ameliorations', text: 'Passe d’un coach à l’autre avec les flèches, les six vignettes ou en balayant sa fiche. L’icône ronde de lecture le fait bouger.' },
        { category: 'ameliorations', text: 'Rien ne change tant que tu n’as pas touché « Choisir ». Les barres « sur 10 », qui étaient des estimations, sont remplacées par sa garde et ses points forts.' },
      ],
      links: [{ label: 'Voir les coachs', to: '/coach' }],
    },
    {
      version: '1.31.0',
      releaseDate: '2026-11-11',
      title: 'Nouvelle page Compte',
      isMajor: false,
      changes: [
        { category: 'ameliorations', text: 'Compte : ton nom en grand, ta photo à droite, ta discipline et ton niveau dessous.' },
        { category: 'ameliorations', text: 'Quatre accès rapides : « Mon coach », « Réglages », « Coach IA » et « Nouveautés », puis Premium et ton objectif de la semaine avec tes vrais chiffres.' },
        { category: 'ameliorations', text: 'Tout ton profil reste dessous, dans la même liste. Les onglets « Mes infos » et « Réglages » restent sur la page Réglages.' },
      ],
      links: [{ label: 'Voir Compte', to: '/profil' }],
    },
    {
      version: '1.30.0',
      releaseDate: '2026-11-11',
      title: 'Nouvel accueil',
      isMajor: true,
      changes: [
        { category: 'ameliorations', text: 'Accueil sur un seul écran : tes six disciplines en onglets tout en haut, puis la grande barre « Que veux-tu travailler ? » avec le chrono à côté.' },
        { category: 'ameliorations', text: 'Deux raccourcis, « Reprendre ta séance » et « Technique du jour », puis ton coach dans sa carte avec le bouton « Commencer ».' },
        { category: 'ameliorations', text: '« Pour toi » : des pastilles rondes vers ton objectif de la semaine, un programme, une autre idée de séance, tes techniques à revoir, le créateur et le Coach IA.' },
      ],
      links: [{ label: "Voir l'accueil", to: '/' }],
    },
    {
      version: '1.29.0',
      releaseDate: '2026-11-11',
      title: 'Nouvelle barre et Entraîner en tuiles',
      isMajor: true,
      changes: [
        { category: 'ameliorations', text: 'La barre du bas flotte au-dessus de la page et passe à quatre places : Accueil, Entraîner, Progrès et Compte (ton profil et les réglages).' },
        { category: 'ameliorations', text: "Entraîner tient sur un seul écran de tuiles : tes six disciplines, « Apprends » (Techniques, Légendes, Encyclopédie) et « Tes outils » (Créateur, Programmes, Chrono, Favoris). « Mes séances » ouvre la reprise, le démarrage rapide et tes enchaînements." },
        { category: 'ameliorations', text: 'La loupe « Rechercher ou demander au coach » est en haut à droite de chaque écran.' },
      ],
      links: [{ label: 'Voir Entraîner', to: '/entrainer' }],
    },
    {
      version: '1.28.0',
      releaseDate: '2026-11-10',
      title: 'Combinaisons des fédérations',
      isMajor: false,
      changes: [
        { category: 'fonctionnalites', text: "30 combinaisons tirées des programmes officiels de passage de grade : 23 en boxe anglaise (FFBoxe, gants blanc à rouge) et 7 en muay-thaï (FFKMDA, prajeets jaune à vert). Chaque fiche dit d'où elle vient : document, page, exercice et enchaînement tel qu'il est écrit." },
        { category: 'ameliorations', text: "Légendes : la carte « Programmes des fédérations », les fiches validées en tête de liste et le bouton « Validées ». Les autres fiches restent, marquées « Inspirée »." },
      ],
      links: [{ label: 'Voir les combinaisons validées', to: '/champions?vue=explorer&valide=1' }],
    },
    {
      version: '1.27.0',
      releaseDate: '2026-11-06',
      title: 'De vraies salles d’entraînement',
      isMajor: true,
      changes: [
        { category: 'ameliorations', text: "Chaque salle est équipée comme une vraie salle de sa discipline : gants, casques et protections sur des étagères, paos et boucliers, mannequins de grappling et de projection, kettlebells, cordes ondulatoires, chronos muraux, affiches, ceintures de champion, judogis suspendus, calligraphies au dojo… Tout est rangé le long des murs : l'espace autour du coach reste libre." },
        { category: 'ameliorations', text: "Des sols de vraies salles : caoutchouc sportif en boxe anglaise, tatamis de combat en MMA, kick-boxing et JJB, tapis épais au camp de muay-thaï. Fini l'effet carrelage." },
        { category: 'corrections', text: "Le ring de muay-thaï et la cage de MMA sont plus loin derrière le coach et restent droits quand tu tournes la caméra : plus de cordes géantes et floues ni d'éclats autour." },
        { category: 'coachs', text: "En MMA, les coachs portent des protège-tibias qui couvrent aussi le dessus du pied, talon libre, aux couleurs de leurs gants, avec des bords nets." },
        { category: 'ameliorations', text: 'La poussière qui flottait dans les salles est retirée.' },
      ],
      links: [],
    },
    {
      version: '1.26.0',
      releaseDate: '2026-11-06',
      title: 'Tenues nettes, salles vivantes',
      isMajor: false,
      changes: [
        { category: 'ameliorations', text: "Les vêtements ont leurs ombres : plis, dessous de la ceinture et du col, taille, manches. Le kimono blanc n'est plus tout plat, même sur téléphone." },
        { category: 'corrections', text: "Ceintures et cols nets (plus de hachures), bottes de boxe sans trous, brassières sans logo, et la petite fente sur le côté des shorts de MMA. Chez Axel et Kaila, la peau ne traverse plus leurs tenues pendant les mouvements." },
        { category: 'ameliorations', text: "Les salles vivent sous tous les angles : poussière qui flotte dans la lumière, une lampe qui hoquette de temps en temps, lampes suspendues qui se balancent, ombres de branches sur les fenêtres et les shoji du dojo, phares de voitures la nuit en kick-boxing." },
        { category: 'corrections', text: "Le coach apparaît avec sa salle et non plus avant elle ; la cage MMA est droite, et le coach a de nouveau son ombre au sol quand tu tournes la caméra." },
      ],
      links: [],
    },
    {
      version: '1.25.0',
      releaseDate: '2026-11-06',
      title: 'Tout est prêt dès l’ouverture',
      isMajor: false,
      changes: [
        { category: 'fonctionnalites', text: "À l'ouverture, le chrono du round se remplit pendant que l'app prépare tout : les 6 coachs, toutes leurs tenues et les 6 salles. Les messages suivent ce qui se prépare (ouverture des salles, laçage des gants…) et la cloche sonne quand tout est prêt." },
        { category: 'ameliorations', text: "Changer de coach ou de discipline ne fait plus attendre : tout est déjà sur le téléphone. La première ouverture télécharge environ 100 Mo, les suivantes ne reprennent que ce qu'une mise à jour a changé." },
        { category: 'ameliorations', text: 'Sans réseau, l’app s’ouvre quand même avec ce qui est déjà sur le téléphone. Si la connexion est très lente, « Entrer sans attendre » apparaît.' },
        { category: 'ameliorations', text: "Les salles sont à la bonne échelle à côté du coach : le ring, la cage et les murs sont à leur vraie distance, au lieu de paraître trop grands et flous derrière lui." },
      ],
      links: [],
    },
    {
      version: '1.24.0',
      releaseDate: '2026-11-05',
      title: 'Une salle pour chaque discipline',
      isMajor: true,
      changes: [
        { category: 'fonctionnalites', text: "Pendant l'entraînement, le coach s'entraîne dans une salle propre à sa discipline : salle de boxe à l'ancienne avec son ring, académie de MMA avec sa cage, salle de kick-boxing de nuit, camp de muay-thaï en bois, dojo traditionnel pour le judo et académie de jiu-jitsu." },
        { category: 'ameliorations', text: 'Chaque salle a sa propre lumière sur le coach et ses reflets ; les sacs suspendus se balancent doucement et les lampes respirent.' },
        { category: 'ameliorations', text: 'Réglages › Affichage 3D › « Salle immersive » ramène le fond uni si tu le préfères.' },
      ],
      links: [{ label: 'Réglages de l’affichage 3D', to: '/reglages/affichage' }],
    },
    {
      version: '1.23.0',
      releaseDate: '2026-11-05',
      title: 'Visages plus vivants et respiration visible',
      isMajor: false,
      changes: [
        { category: 'coachs', text: "Entre deux coups, la tête des coachs bouge un peu et suit leurs coups d'œil, au lieu de rester figée." },
        { category: 'coachs', text: "La respiration se voit : la poitrine et le ventre se gonflent davantage, les épaules montent à l'inspiration, et le souffle est plus profond après une série de coups." },
      ],
      links: [{ label: 'Changer de coach', to: '/coach' }],
    },
    {
      version: '1.22.1',
      releaseDate: '2026-11-05',
      title: 'Short MMA des coachs femmes au high kick',
      isMajor: false,
      changes: [
        { category: 'coachs', text: "Au high kick, le short d'Amara, Inaya et Kaila ne se froisse plus à l'aine : le short de dessus est ajusté à l'entrejambe." },
      ],
      links: [{ label: 'Changer de coach', to: '/coach' }],
    },
    {
      version: '1.22.0',
      releaseDate: '2026-11-05',
      title: 'Nouvelle tenue MMA des coachs femmes',
      isMajor: false,
      changes: [
        { category: 'coachs', text: 'Amara, Inaya et Kaila ont une nouvelle tenue MMA : short 2-en-1 (cuissard et surshort à ceinture froncée) et brassière à large bande élastique. Amara en noir et or, Inaya en rose et noir, Kaila en dégradé rose et turquoise.' },
      ],
      links: [{ label: 'Changer de coach', to: '/coach' }],
    },
    {
      version: '1.21.0',
      releaseDate: '2026-11-05',
      title: 'Les améliorations d’Inaya pour tous',
      isMajor: false,
      changes: [
        { category: 'ameliorations', text: 'Toutes les tenues des coachs profitent des finitions d’Inaya : ourlets nets, rash-guard qui ne laisse plus voir le legging, ceinture élastique plus lisse, kimonos plus cintrés, et le logo CS sur la poitrine, le dos et la cuisse.' },
        { category: 'coachs', text: 'Axel et Kaila ont eux aussi un visage vivant au repos : sourcils, paupières, coins de la bouche et respiration bougent doucement.' },
        { category: 'coachs', text: 'Les muscles de Naël sont éclairés comme ceux de Kadir, les ombres entre les muscles se lisent mieux.' },
      ],
      links: [{ label: 'Changer de coach', to: '/coach' }],
    },
    {
      version: '1.20.0',
      releaseDate: '2026-11-05',
      title: 'Inaya : cou naturel, visage vivant',
      isMajor: false,
      changes: [
        { category: 'coachs', text: 'Le cou d’Inaya est refait : plus large à la base, avec ses muscles et ses clavicules, et la peau du corps a la même teinte que le visage.' },
        { category: 'coachs', text: 'Les muscles d’Inaya sont mieux dessinés (abdos, bras, jambes, dos), avec le même relief que ceux d’Amara.' },
        { category: 'coachs', text: 'Les visages des coachs vivent entre deux coups : regard, sourcils, lèvres et respiration bougent doucement, et l’effort se lit davantage pendant les frappes.' },
        { category: 'corrections', text: 'Le logo CS du haut d’Inaya ne disparaît plus pendant les mouvements.' },
      ],
      links: [{ label: 'Changer de coach', to: '/coach' }],
    },
    {
      version: '1.19.0',
      releaseDate: '2026-11-05',
      title: 'Inaya refaite, tenues roses CS',
      isMajor: false,
      changes: [
        { category: 'coachs', text: 'Inaya est refaite à partir d’un corps propre : plus aucune trace de l’ancien maillot (cou, dos, poitrine), plus de fine ligne claire entre la tête et les épaules, et une musculature marquée de coach sportive.' },
        { category: 'ameliorations', text: 'Les tenues d’Inaya passent en rose et noir, avec le logo CS de l’appli comme marque, sur la poitrine, dans le dos et sur la cuisse. Les bretelles du haut sont posées sur les trapèzes.' },
      ],
      links: [{ label: 'Changer de coach', to: '/coach' }],
    },
    {
      version: '1.18.0',
      releaseDate: '2026-11-04',
      title: 'Buste d’Inaya plus naturel',
      isMajor: false,
      changes: [
        { category: 'coachs', text: 'Le haut du corps d’Inaya n’a plus la forme de l’ancien maillot : plus de cordon autour du cou, plus de bourrelet dans le dos, plus de contour autour de la poitrine. Sa poitrine garde son volume.' },
      ],
      links: [{ label: 'Changer de coach', to: '/coach' }],
    },
    {
      version: '1.17.0',
      releaseDate: '2026-11-04',
      title: 'Inaya légèrement bronzée',
      isMajor: false,
      changes: [
        { category: 'coachs', text: 'La peau d’Inaya est un peu plus dorée, sur le visage comme sur le corps. Ses cheveux et ses tenues ne changent pas.' },
      ],
      links: [{ label: 'Changer de coach', to: '/coach' }],
    },
    {
      version: '1.16.0',
      releaseDate: '2026-11-04',
      title: 'Visages plus vivants',
      isMajor: false,
      changes: [
        { category: 'coachs', text: 'Kadir, Amara, Naël et Inaya ont de vraies expressions du visage : les paupières se ferment entièrement quand ils clignent des yeux, et pendant une frappe les sourcils se froncent, les yeux se plissent, les joues remontent et les lèvres soufflent.' },
      ],
      links: [{ label: 'Changer de coach', to: '/coach' }],
    },
    {
      version: '1.15.0',
      releaseDate: '2026-11-04',
      title: 'Buste d’Inaya corrigé',
      isMajor: false,
      changes: [
        { category: 'corrections', text: 'Le haut du corps d’Inaya ne paraît plus emboîté : les contours et les traces de l’ancien maillot de bain sur sa poitrine, son cou et son dos ont disparu.' },
        { category: 'corrections', text: 'Sa nuque, sous le chignon, n’a plus de taches claires ni de marques : ses cheveux y sont tirés d’un seul tenant.' },
      ],
      links: [{ label: 'Changer de coach', to: '/coach' }],
    },
    {
      version: '1.14.0',
      releaseDate: '2026-11-04',
      title: 'Nouvelle tenue d’Inaya',
      isMajor: false,
      changes: [
        { category: 'coachs', text: 'Inaya porte un crop top moulant en boxe, kick-boxing, muay-thaï et MMA : plus de bretelles déchirées au cou, et les abdominaux restent visibles.' },
        { category: 'coachs', text: 'Les bords de ses shorts et de son haut sont nets, et la tache claire sous son chignon a disparu.' },
      ],
      links: [{ label: 'Changer de coach', to: '/coach' }],
    },
    {
      version: '1.13.0',
      releaseDate: '2026-11-04',
      title: 'Nouvel écran de choix du coach',
      isMajor: false,
      changes: [
        { category: 'coachs', text: 'Choisis ton coach comme dans un jeu de combat : les six en haut, et la fiche du coach choisi avec sa taille, son poids et sept barres (poings, pieds, lutte, sol, vitesse, défense, endurance).' },
        { category: 'coachs', text: 'La taille et le poids sont mesurés sur le modèle 3D. Les barres sont un profil de style indicatif, tiré du style de chaque coach.' },
      ],
      links: [{ label: 'Changer de coach', to: '/coach' }],
    },
    {
      version: '1.12.0',
      releaseDate: '2026-11-04',
      title: 'Inaya plus nette au cou et aux cheveux',
      isMajor: false,
      changes: [
        { category: 'corrections', text: 'Inaya : plus de lambeaux noirs ni de fentes claires au cou et aux épaules, son chignon est blond comme ses cheveux et les mèches raides qui en sortaient ont disparu.' },
        { category: 'coachs', text: 'Inaya porte maintenant une brassière bandeau en boxe et en kick-boxing.' },
        { category: 'corrections', text: 'Naël et Inaya : les bords de leur peau ne bavent plus en noir quand on les voit de loin sur téléphone.' },
      ],
      links: [{ label: 'Changer de coach', to: '/coach' }],
    },
    {
      version: '1.11.0',
      releaseDate: '2026-11-03',
      title: 'Deux nouveaux coachs : Naël et Inaya',
      isMajor: false,
      changes: [
        { category: 'coachs', text: 'Naël « Le Faucon », contreur rapide toujours en mouvement, et Inaya « La Panthère », explosive et redoutable des jambes, rejoignent Kadir, Axel, Amara et Kaila : six coachs au choix.' },
        { category: 'coachs', text: 'Leurs tenues ont leurs propres couleurs : bleu roi, blanc et émeraude pour Naël, prune et orange pour Inaya, judogi bleu pour les deux.' },
      ],
      links: [{ label: 'Changer de coach', to: '/coach' }],
    },
    {
      version: '1.10.1',
      releaseDate: '2026-11-03',
      title: 'Mises à jour plus rapides',
      isMajor: false,
      changes: [
        { category: 'corrections', text: 'Une nouvelle version s’installe en quelques secondes : l’appli ne télécharge plus d’avance tous les coachs et toutes les tenues (plus de 100 Mo), chacun est gardé sur ton téléphone dès que tu l’utilises.' },
      ],
      links: [],
    },
    {
      version: '1.10.0',
      releaseDate: '2026-11-03',
      title: 'Coachs plus réalistes, tenues mieux ajustées',
      isMajor: false,
      changes: [
        { category: 'corrections', text: 'Gants de boxe : le poing suit enfin la main et la manchette l’avant-bras (ils se déformaient à l’envers). Les gants de muay-thaï ont leur vraie coupe, plus courte et plus ronde.' },
        { category: 'corrections', text: 'Les yeux, les sourcils et les cils gardent leur propre matière (ils étaient traités comme des cheveux) ; les cheveux se voient des deux côtés, sans effet de casque.' },
        { category: 'ameliorations', text: 'Épaules et aisselles plus naturelles en garde : plus de pli marqué sous l’omoplate de Kadir, peau moins étirée sous les bras de Kaila.' },
        { category: 'ameliorations', text: 'Peau plus vivante : la lumière la traverse un peu, les ombres sont moins dures, pores et petites variations de teinte, réglés pour chaque coach.' },
        { category: 'ameliorations', text: 'Les coachs respirent, plus vite pendant l’effort ; la veste du gi et les pans de la ceinture bougent un peu avec les hanches.' },
        { category: 'ameliorations', text: 'Tenues refaites : brassière dos nageur ajustée, shorts aux ourlets fins, sous-vêtements dessinés sur la peau enfin couverts, chaussures de boxe mieux taillées (bout, col, talon).' },
      ],
      links: [{ label: 'Changer de coach', to: '/coach' }],
    },
    {
      version: '1.9.0',
      releaseDate: '2026-10-29',
      title: 'Coachs plus vivants, rendu Anime retiré',
      isMajor: false,
      changes: [
        { category: 'ameliorations', text: 'Les visages des coachs vivent : ils clignent des yeux, le regard bouge un peu, les sourcils se froncent et les yeux se plissent au moment des frappes.' },
        { category: 'ameliorations', text: 'Nouvelle tenue de MMA pour les quatre coachs : short de compression à mi-cuisse, brassière noire dos nageur, gants ouverts noirs (sangle et paume blanches pour Kadir et Axel).' },
        { category: 'ameliorations', text: 'Muscles mieux dessinés sur la peau, Kaila plus sèche ; les yeux de Kadir et Amara brillent comme ceux d’Axel et Kaila.' },
        { category: 'corrections', text: 'Le relief de la peau était éclairé par en dessous ; il suit maintenant la lumière.' },
        { category: 'fonctionnalites', text: 'Le rendu Anime est retiré : les coachs s’affichent toujours en Ultra-réaliste, tes autres réglages sont gardés.' },
      ],
      links: [{ label: 'Changer de coach', to: '/coach' }],
    },
    {
      version: '1.8.0',
      releaseDate: '2026-10-29',
      title: 'Des mouvements au sol plus vrais',
      isMajor: false,
      changes: [
        { category: 'corrections', text: 'Plus aucune partie du corps des coachs ne passe sous le tapis : cuisses dans le sprawl, doigts des mains posées au sol, dos et épaules dans les chutes, orteils et genoux dans les relevés.' },
        { category: 'ameliorations', text: 'Sprawl : les jambes partent tendues loin derrière, les cuisses se posent sur le tapis et les tibias restent levés, puis les pieds reviennent sous le bassin d’un geste moins brusque.' },
        { category: 'ameliorations', text: 'Mains en appui (sit-out, relevé technique, pont, sortie de hanche) : la main se pose à plat sur le tapis, comme dans une pompe, au lieu de s’y enfoncer.' },
      ],
      links: [],
    },
    {
      version: '1.7.0',
      releaseDate: '2026-10-29',
      title: 'Rechercher et demander au coach, dans la même fenêtre',
      isMajor: false,
      changes: [
        { category: 'fonctionnalites', text: 'Quand tu poses une question dans « Rechercher » (« Comment corriger mon jab ? »), la réponse du Coach IA s’affiche en haut, en court avec « Lire la suite », et les résultats de l’application juste en dessous.' },
        { category: 'ameliorations', text: 'L’étoile ✦ est dans la barre de recherche : elle envoie ce que tu as tapé au coach, ou ouvre le Coach IA en grand quand la barre est vide. Le gros bouton noir « Demander au Coach IA » est retiré.' },
        { category: 'ameliorations', text: 'Pour un simple mot (« garde »), la première ligne « Demander au coach » donne aussi sa réponse sans changer de fenêtre ; « Continuer avec le Coach IA » ouvre la conversation sur la même question.' },
      ],
      links: [],
    },
    {
      version: '1.6.1',
      releaseDate: '2026-10-29',
      title: 'Axel et Kaila plus réalistes',
      isMajor: false,
      changes: [
        { category: 'ameliorations', text: 'Vrais cheveux en Ultra-réaliste : coupe courte brun foncé pour Axel, queue de cheval plaquée pour Kaila (avant : cheveux peints sur le crâne).' },
        { category: 'ameliorations', text: 'Peau plus vivante : pores et petits plis, barbe de deux jours pour Axel, taches de rousseur pour Kaila.' },
        { category: 'ameliorations', text: 'Les yeux d’Axel et Kaila brillent sous la lumière, comme de vrais yeux.' },
        { category: 'corrections', text: 'Gants de MMA d’Axel et Kaila : le bout des doigts est net, il n’y a plus de pointes noires comme des griffes.' },
      ],
      links: [{ label: 'Changer de coach', to: '/coach' }],
    },
    {
      version: '1.6.0',
      releaseDate: '2026-10-28',
      title: 'Deux nouveaux coachs : Axel et Kaila',
      isMajor: true,
      changes: [
        { category: 'coachs', text: 'Axel « Aura-Stone » : grand frappeur sec (1,94 m), visage carré, regard de pierre, tatouage tribal au bras gauche et aux côtes, posture droite et bras relâchés.' },
        { category: 'coachs', text: 'Kaila « La Valkyrie » : compacte et puissante (1,65 m), tresse blonde plaquée, garde basse et mains ouvertes prêtes à saisir.' },
        { category: 'ameliorations', text: 'Changer de coach ouvre maintenant un écran avec seulement la liste des quatre coachs : Kadir, Axel, Amara et Kaila.' },
        { category: 'ameliorations', text: 'Les deux nouveaux coachs ont leur tenue dans les six disciplines, en Ultra-réaliste et en Anime, et des modèles plus légers que Kadir et Amara.' },
      ],
      links: [{ label: 'Changer de coach', to: '/coach' }],
    },
    {
      version: '1.4.1',
      releaseDate: '2026-10-28',
      title: 'Encyclopédie complète',
      isMajor: false,
      changes: [
        { category: 'ameliorations', text: 'Toutes les fiches de l’Encyclopédie ont leur illustration : les 22 dernières montrent les deux coachs ensemble au sol (montée, gardes, contrôles, nord-sud, dos, passage de garde) et les soumissions (clé de bras, triangle, étranglement arrière, kesa-gatame).' },
        { category: 'ameliorations', text: 'Règles et arbitrage illustrés : l’arbitre qui s’interpose, qui compte, qui avertit, qui lève le bras du vainqueur, l’ippon, la pesée, la table des juges, et le sparring.' },
        { category: 'corrections', text: 'Les légendes « Début, Mi-chemin, Moment clé » n’apparaissent plus sous les images qui ne sont pas une suite de trois instants (schémas, styles de kick-boxing).' },
      ],
      links: [{ label: 'Encyclopédie', to: '/encyclopedie' }],
    },
    {
      version: '1.4.0',
      releaseDate: '2026-10-28',
      title: 'Un seul écran coach, et la pulsation',
      isMajor: false,
      changes: [
        { category: 'ameliorations', text: 'Le coach de l’Accueil, de la fiche technique, de la séance et de l’aperçu est maintenant le même écran : mêmes gestes, mêmes boutons, au même endroit.' },
        { category: 'fonctionnalites', text: 'Touche le coach une fois : ses commandes apparaissent dans sa zone, à droite (son, vitesse, plein écran, pause en séance) et les angles en haut à gauche. Touche-le encore une fois : elles disparaissent. Deux touchers rapides : plein écran.' },
        { category: 'ameliorations', text: 'En séance, un toucher sur le coach ne met plus en pause : il montre les commandes, dont la pause. Le gros bouton Pause reste en bas.' },
        { category: 'ameliorations', text: 'Fiche technique : la vitesse et les angles de caméra sont dans la zone du coach, il reste plus de place pour lui.' },
        { category: 'corrections', text: 'Voix coupée : un petit haut-parleur barré reste dans le coin du coach, pour ne jamais l’oublier.' },
        { category: 'fonctionnalites', text: 'Pulsation : pendant la séance, le contour de l’écran s’éclaire brièvement au gong, au décompte et à chaque coup annoncé, dans la couleur du moment. Jamais plus de 3 éclairs par seconde. Style, intensité ou coupure dans Réglages › Pulsation pendant la séance.' },
      ],
      links: [
        { label: 'Pulsation pendant la séance', to: '/reglages/pulsation' },
        { label: 'Voix et sons', to: '/reglages/voix' },
      ],
    },
    {
      version: '1.3.2',
      releaseDate: '2026-10-28',
      title: 'Illustrations de l’Encyclopédie',
      isMajor: false,
      changes: [
        { category: 'ameliorations', text: '24 fiches de l’Encyclopédie ont enfin leur illustration, dans la même ambiance de salle que les autres : bandes, protège-dents, casque, coquille, protège-poitrine, sacs, pattes d’ours, paos, mongkon, dojo, chrono et cloche du round, gants anciens, tableau de score du JJB, fédérations.' },
        { category: 'ameliorations', text: 'Le coach montre aussi l’échauffement, le wai kru, les trois styles de kick-boxing, la garde du muay-thaï et du kick-boxing.' },
        { category: 'ameliorations', text: 'Sécurité : zones interdites, articulations à ne pas forcer, zones de choc à la tête et planche des muscles, repérés sur le corps du coach.' },
      ],
      links: [{ label: 'Encyclopédie', to: '/encyclopedie' }],
    },
    {
      version: '1.3.1',
      releaseDate: '2026-10-28',
      title: 'Visuels studio',
      isMajor: false,
      changes: [
        { category: 'ameliorations', text: 'Toutes les images des coachs ont l’allure de photos de salle de boxe : Kadir et Amara, éclairés comme en studio dans une salle sombre, avec une ambiance par discipline (bleu nuit pour la boxe, ambre pour le kick-boxing, rouge pour le muay-thaï, acier pour le MMA, bois chaud pour le judo, indigo pour le JJB).' },
        { category: 'ameliorations', text: 'C’est le cas partout : vignettes des techniques et des programmes, illustrations de l’Encyclopédie (objets et lieux compris), visuels des disciplines et portraits de « Choisis ton coach ».' },
        { category: 'disciplines', text: 'Le judo et le jiu-jitsu brésilien ont enfin leur visuel, comme les quatre autres disciplines.' },
        { category: 'ameliorations', text: 'Kimonos de judo et de JJB plus naturels : un tissu de coton, sans l’effet tricot, sur le coach animé comme sur les images.' },
      ],
      links: [
        { label: 'Techniques', to: '/techniques' },
        { label: 'Encyclopédie', to: '/encyclopedie' },
      ],
    },
    {
      version: '1.3.0',
      releaseDate: '2026-10-28',
      title: 'Consignes enchaînées sous le coach',
      isMajor: false,
      changes: [
        { category: 'fonctionnalites', text: 'Pendant la séance, les consignes défilent une à une sous les pieds du coach : la consigne principale, puis chaque point clé, puis on recommence. Des petits traits montrent où tu en es.' },
        { category: 'fonctionnalites', text: 'Elles restent en plein écran, la pause les arrête, et le coach est cadré au-dessus : le texte ne le couvre jamais.' },
        { category: 'fonctionnalites', text: 'Un haut-parleur sous la vitesse et le plein écran, à droite du coach : chaque toucher passe au cran suivant (coupé, faible, moyen, fort), et ses ondes montrent le volume.' },
        { category: 'ameliorations', text: 'Réglages › Consignes pendant la séance : 2,5, 3,5 ou 5 secondes par consigne, ou « Point du moment » pour garder l’affichage d’avant.' },
        { category: 'corrections', text: 'Accueil : le numéro de version suit le titre de l’application au lieu de passer sous ta photo.' },
        { category: 'ameliorations', text: 'Mes infos et Réglages n’ont plus de ⋮ en haut à droite : tout ce qu’il proposait est déjà sur ces deux pages ou dans la barre du bas.' },
        { category: 'corrections', text: 'Fiche technique : « S’entraîner » n’est plus jamais grisé (une technique sans exercice se travaille seule), et les angles de caméra restent visibles au-dessus du bouton.' },
      ],
      links: [{ label: 'Consignes pendant la séance', to: '/reglages/consignes' }],
    },
    {
      version: '1.2.0',
      releaseDate: '2026-10-28',
      title: 'Profil et réglages en listes',
      isMajor: false,
      changes: [
        { category: 'fonctionnalites', text: 'Ta photo en haut à droite ouvre deux onglets : Mes infos et Réglages. Mon coach et Coach IA sont maintenant des lignes de Réglages.' },
        { category: 'fonctionnalites', text: 'Mes infos et Réglages sont chacun une seule liste rangée en groupes, comme les réglages d’un téléphone Android. Chaque ligne montre sa valeur actuelle et s’ouvre sur place quand tu la touches ; Retour la referme.' },
        { category: 'ameliorations', text: 'Taille du texte, animations et « M’appeler par mon pseudo » passent dans Réglages (Apparence et Coach IA) ; l’export et l’effacement de tes données sont regroupés dans « Données et confidentialité ». Rien n’a été retiré.' },
      ],
      links: [
        { label: 'Mes infos', to: '/profil' },
        { label: 'Réglages', to: '/reglages' },
      ],
    },
    {
      version: '1.1.1',
      releaseDate: '2026-10-28',
      title: 'Plus de doublon de la recherche',
      isMajor: false,
      changes: [
        { category: 'corrections', text: 'Chrono de combat : le bouton « Plus », qui ne contenait que « Rechercher », est retiré : la loupe est déjà dans la barre du bas. Pendant la séance, où la barre est cachée, « Rechercher » reste dans « Plus ».' },
        { category: 'corrections', text: 'Le créateur d’enchaînement garde ses icônes de mouvements et sa recherche dans « Ajouter un mouvement ».' },
      ],
      links: [
        { label: 'Chrono de combat', to: '/chrono' },
        { label: 'Mes enchaînements', to: '/createur' },
      ],
    },
    {
      version: '1.1.0',
      releaseDate: '2026-10-28',
      title: 'Recherche dans la barre et écrans allégés',
      isMajor: false,
      changes: [
        { category: 'fonctionnalites', text: '« Rechercher » prend la cinquième place de la barre du bas : il cherche d’abord sur l’écran où tu es (les équipements de l’encyclopédie, tes enchaînements, les légendes…), puis dans toute l’application, et pose ta question au Coach IA. Il remplace les champs de recherche des écrans.' },
        { category: 'fonctionnalites', text: 'Ton profil est ta photo en haut à droite de chaque écran. À côté, le ⋮ ouvre les options de l’écran dans un menu Android.' },
        { category: 'fonctionnalites', text: 'Page d’une discipline : le niveau, le style et le type d’exercice tiennent sur une seule ligne de menus. Les explications (à quoi sert un niveau, les règles d’un style) sont dans les menus.' },
        { category: 'fonctionnalites', text: 'Pendant la séance, la vitesse (×1) est en haut à droite du coach dès le départ : touche-la pour choisir de ×0,25 à ×1,5.' },
        { category: 'fonctionnalites', text: 'Objectifs : choisis tes jours d’entraînement sur une ligne de 7 jours, comme un agenda.' },
        { category: 'ameliorations', text: 'Chrono de combat : troisième choix de Séance (Séances, Disciplines, Chrono), sur une seule page sans défilement. Les 6 disciplines tiennent aussi sur un seul écran.' },
        { category: 'ameliorations', text: 'Le grand compte à rebours rouge au milieu du coach est retiré : le temps reste affiché au-dessus du coach.' },
        { category: 'ameliorations', text: '« Que signifient les statuts ? » devient une question toute prête de la recherche sur les écrans des légendes. L’ADN de la bibliothèque est allégé.' },
        { category: 'corrections', text: 'Réglages : le bouton « Caméra », qui ouvrait la même page qu’« Affichage », est retiré.' },
      ],
      links: [{ label: 'Objectifs', to: '/objectifs' }],
    },
    {
      version: '1.0.0',
      releaseDate: '2026-10-27',
      title: 'Nouvelle organisation de l’application',
      isMajor: true,
      changes: [
        { category: 'fonctionnalites', text: 'Une barre du bas qui ne change plus : Accueil, Entraîner, Apprendre, Progrès et Profil, toujours à la même place. Chaque espace a ses onglets en haut de l’écran, et on passe de l’un à l’autre en glissant le doigt.' },
        { category: 'fonctionnalites', text: 'Un accueil pour démarrer tout de suite : « Reprendre » relance ta dernière séance, avec trois raccourcis (Séance rapide, Technique du jour, Chrono seul) et ton objectif de la semaine.' },
        { category: 'fonctionnalites', text: '« Rechercher ou demander au coach » : un seul champ pour trouver une technique, un terme de l’encyclopédie, un programme ou un réglage, ou poser la question au Coach IA.' },
        { category: 'fonctionnalites', text: 'Séance mains libres : pose ton téléphone, seuls Retour et Pause restent à l’écran. Touche le coach pour mettre en pause ; Décomposer, Caméra et « Plus » reviennent pendant la pause. Le téléphone vibre au départ, à la pause et à chaque round.' },
        { category: 'fonctionnalites', text: 'Un écran Favoris dans Entraîner : tes techniques favorites et tes combinaisons favorites des légendes au même endroit.' },
        { category: 'ameliorations', text: 'Rien n’a disparu : chaque écran de la version précédente a sa place dans la nouvelle organisation (Légendes et Encyclopédie dans Apprendre, Mon coach, Coach IA, Réglages, Premium et Nouveautés dans Profil).' },
        { category: 'ameliorations', text: 'Thème Nuit par défaut pour une nouvelle installation, et lumière « Vive » par défaut pour les coachs réalistes. Les choix déjà enregistrés sont gardés.' },
        { category: 'ameliorations', text: 'Le gros bouton prend la couleur de ta discipline principale.' },
      ],
      links: [
        { label: 'Accueil', to: '/' },
        { label: 'Favoris', to: '/favoris' },
      ],
    },
    {
      version: '0.49.0',
      releaseDate: '2026-10-27',
      title: 'Moteur à part et lumière vive',
      isMajor: false,
      changes: [
        { category: 'ameliorations', text: 'Le moteur qui anime les coachs devient un module à part, avec son propre numéro de version (1.0.0) : il pourra évoluer étape par étape sans toucher au reste de l’application. Les mouvements ne changent pas.' },
        { category: 'fonctionnalites', text: 'Nouvelle option « Lumière du coach » dans Réglages > Affichage, pour le rendu Ultra-réaliste : « Vive » reprend l’éclairage du labo CME, plus clair, avec un contour bleuté et un fond sombre pendant l’entraînement. « Studio » reste la lumière par défaut.' },
      ],
      links: [{ label: 'Affichage', to: '/reglages/affichage' }],
    },
    {
      version: '0.48.0',
      releaseDate: '2026-10-27',
      title: 'Chrono de combat',
      isMajor: true,
      changes: [
        { category: 'fonctionnalites', text: 'Nouveau chrono de combat, seul, sans le coach 3D : « Chrono » remplace « Techniques » dans la barre du bas (les techniques restent dans le Menu).' },
        { category: 'fonctionnalites', text: 'Formats prêts (boxe, kick-boxing, MMA, muay-thaï, JJB, judo, intervalles) ou réglage libre du round, du repos et du nombre de rounds avec + et −. La durée totale s’affiche avant de démarrer.' },
        { category: 'ameliorations', text: 'Pendant la séance, tout l’écran prend la couleur de la phase (ambre préparation, rouge combat, bleu-vert repos, gris pause) avec un très grand temps lisible de loin. Touche l’écran n’importe où pour mettre en pause ; en pause, tu peux arrêter ou passer la phase.' },
        { category: 'ameliorations', text: 'Mêmes gongs, voix, préparation et alerte avant la fin que l’entraînement, aucun repos après le dernier round, un bilan à la fin et la séance enregistrée dans ton historique (terminée ou interrompue).' },
      ],
      links: [{ label: 'Chrono', to: '/chrono' }],
    },
    {
      version: '0.47.0',
      releaseDate: '2026-10-23',
      title: 'Chronomètre intégré au coach',
      isMajor: true,
      changes: [
        { category: 'fonctionnalites', text: 'Cardio devient un vrai entraînement par intervalles : durée d’effort, de récupération, nombre de cycles et trois intensités (Modérée, Soutenue, Intense). L’intensité rapproche les enchaînements sans accélérer les mouvements ; au sol et pour les projections, le coach garde le temps de se relever.' },
        { category: 'ameliorations', text: 'Un seul chronomètre pour toute la séance : préparation en ambre, combat ou effort en rouge, repos en turquoise, pause en gris, toujours avec le mot. En Libre et Technique, le temps écoulé s’affiche.' },
        { category: 'ameliorations', text: 'Rounds et Cardio : préparation, alerte avant la fin, gongs et annonces vocales réglables, aucun repos après le dernier round, et un bilan à la fin (rounds ou cycles, effort, repos, durée totale).' },
        { category: 'ameliorations', text: 'L’historique distingue les séances terminées des séances interrompues, sans compter deux fois le même temps.' },
      ],
      links: [{ label: 'Entraîner', to: '/entrainer' }],
    },
    {
      version: '0.46.0',
      releaseDate: '2026-10-23',
      title: 'Encyclopédie du combat',
      isMajor: true,
      changes: [
        { category: 'fonctionnalites', text: 'Nouvelle Encyclopédie du combat, dans le Menu : 136 termes des 6 disciplines classés en 8 familles (techniques, positions, équipements, lieux, règles, préparation, sécurité, culture), avec recherche, index A–Z et favoris. Chaque fiche cite ses sources ; la relecture par un expert de chaque discipline est à venir.' },
        { category: 'ameliorations', text: 'Sur une fiche technique, « Comprendre ce terme » ouvre la définition dans l’Encyclopédie, et l’Encyclopédie renvoie vers la technique.' },
      ],
      links: [{ label: 'Encyclopédie', to: '/encyclopedie' }],
    },
    {
      version: '0.45.1',
      releaseDate: '2026-10-23',
      title: 'Barre du bas plus sobre',
      isMajor: false,
      changes: [
        { category: 'ameliorations', text: 'Barre du bas en gris, de jour comme de nuit : plus aucun fond coloré derrière les boutons. Les actions de l’écran sont un peu plus foncées que Retour et Menu, et celle qui est active ressort davantage, en caractères un peu plus gras.' },
      ],
      links: [{ label: 'Techniques', to: '/techniques' }],
    },
    {
      version: '0.45.0',
      releaseDate: '2026-10-23',
      title: 'Nouvelle page Premium',
      isMajor: false,
      changes: [
        { category: 'ameliorations', text: 'Page Premium à vie sur un seul écran : ce qui est inclus en un coup d’œil ; la barre du bas ouvre les détails des avantages, les questions fréquentes, la restauration d’un achat et l’offre. Aucun paiement n’est encore possible, et la page le dit clairement.' },
      ],
      links: [{ label: 'Premium', to: '/premium' }],
    },
    {
      version: '0.44.0',
      releaseDate: '2026-10-23',
      title: 'Barre du bas plus lisible',
      isMajor: false,
      changes: [
        { category: 'ameliorations', text: 'Barre du bas : les actions propres à l’écran (Ralenti, Filtres, Période…) gardent une légère teinte rouge, plus soutenue quand elles sont actives. Retour, Menu et les grandes rubriques restent neutres.' },
      ],
      links: [{ label: 'Techniques', to: '/techniques' }],
    },
    {
      version: '0.43.0',
      releaseDate: '2026-10-23',
      title: 'Équipements plus réalistes',
      isMajor: false,
      changes: [
        { category: 'ameliorations', text: 'Gants de boxe refaits : un vrai poing rembourré, un pouce soudé, une manchette ouverte et une sangle, avec un grain de cuir. Même forme en rendu Anime.' },
        { category: 'ameliorations', text: 'Chaussures de boxe faites sur mesure pour le pied du coach : semelle épaisse, tige montante, col rembourré et bandes nettes.' },
        { category: 'ameliorations', text: 'Muay-thaï : les prajioud sont maintenant des cordons tressés, noués, avec deux pans. Kick-boxing : protège-tibias matelassés avec deux sangles. MMA : sangle de poignet sur les gants.' },
        { category: 'corrections', text: 'Ourlets et bandes de couleur bien droits sur toutes les tenues (plus de bords en dents de scie).' },
        { category: 'ameliorations', text: 'Plus léger pour le téléphone : la tenue de boxe passe de 12 à 6 objets à dessiner.' },
      ],
      links: [{ label: 'Voir le coach', to: '/coach' }],
    },
    {
      version: '0.42.0',
      releaseDate: '2026-10-23',
      title: 'Crochets plus naturels',
      isMajor: false,
      changes: [
        { category: 'corrections', text: 'Crochets : le bras du coach ne se tord plus. Le coude reste sur le côté, à hauteur d’épaule, au lieu de partir derrière l’épaule.' },
        { category: 'corrections', text: 'Crochets : plus d’armé. Le poing part de la garde par un chemin court et va le plus vite juste avant l’impact ; le corps tourne avec le bras.' },
        { category: 'ameliorations', text: 'Crochets : chaque discipline a le sien. En boxe, les genoux plient dans le coup ; en kick-boxing, le coach reste plus droit ; en MMA, il reste bas, menton rentré ; en muay-thaï, il reste grand, le poids sur la jambe arrière.' },
      ],
      links: [{ label: 'Crochet gauche', to: '/techniques/crochet-avant' }],
    },
    {
      version: '0.41.0',
      releaseDate: '2026-10-23',
      title: 'Programmes enrichis',
      isMajor: true,
      changes: [
        { category: 'fonctionnalites', text: '49 programmes au lieu de 10 : jusqu’à 8 par discipline, du niveau débutant à expert. Les 10 programmes existants sont toujours là.' },
        { category: 'fonctionnalites', text: 'Les nouveaux programmes durent 4 semaines, avec une séance différente chaque semaine. La fiche montre le planning, les exercices, le matériel, les prérequis, la sécurité et les sources.' },
        { category: 'fonctionnalites', text: 'Ta progression : séances faites, séances restantes, et « Continuer » lance directement la séance de ta semaine.' },
        { category: 'ameliorations', text: '« Filtrer » est maintenant dans la barre du bas : discipline, niveau, durée, objectif et matériel, avec le nombre de résultats. Tes filtres restent en place quand tu changes d’écran.' },
        { category: 'ameliorations', text: 'Les durées sont calculées à partir des exercices, des repos et des transitions. Trois noms qui annonçaient une durée inexacte ont été corrigés.' },
      ],
      links: [{ label: 'Programmes', to: '/entrainer?espace=programmes' }],
    },
    {
      version: '0.40.0',
      releaseDate: '2026-10-22',
      title: 'Premium à vie, présentation',
      isMajor: true,
      changes: [
        { category: 'fonctionnalites', text: 'Une page « Premium à vie » dans le Menu : un achat unique, sans abonnement, au prix indicatif de 39,99 € TTC. Le paiement n’est pas encore disponible.' },
        { category: 'ameliorations', text: 'Un petit diamant doré signale les fonctions qui feront partie de Premium. Touche-le pour voir l’offre.' },
        { category: 'ameliorations', text: 'Rien n’est bloqué : tu gardes accès à toutes les fonctions, comme avant.' },
      ],
      links: [{ label: 'Premium à vie', to: '/premium' }],
    },
    {
      version: '0.39.0',
      releaseDate: '2026-10-22',
      title: 'Progrès, l’essentiel en un coup d’œil',
      isMajor: true,
      changes: [
        { category: 'ameliorations', text: 'Progrès s’ouvre sur un grand anneau (ton objectif de la semaine, ou ton parcours de techniques), ton temps actif, tes séances et ta série en cours.' },
        { category: 'fonctionnalites', text: 'Un écran par détail : Activité, Techniques, Disciplines et Enchaînements, chacun avec son anneau et son total écrit en clair.' },
        { category: 'ameliorations', text: '« Reprendre l’entraînement » apparaît dans Progrès seulement quand une séance peut vraiment reprendre.' },
        { category: 'ameliorations', text: 'La période choisie (7 jours, 30 jours, 90 jours, 12 mois ou Perso) s’applique à tous les écrans de Progrès. Seules tes séances enregistrées sont comptées.' },
      ],
      links: [
        { label: 'Progrès', to: '/stats' },
        { label: 'Disciplines', to: '/stats/disciplines' },
      ],
    },
    {
      version: '0.38.0',
      releaseDate: '2026-10-22',
      title: 'Créateur d’enchaînements V2',
      isMajor: true,
      changes: [
        { category: 'fonctionnalites', text: 'Tes enchaînements en tuiles : mouvements en pictogrammes, dates de création, de modification et de dernière utilisation, nombre d’entraînements et statut Acquis ou Encore du mal.' },
        { category: 'fonctionnalites', text: 'Une fiche par enchaînement : tous les mouvements dans l’ordre (touche-les pour ouvrir la technique), Exécuter, Modifier, Dupliquer et Supprimer.' },
        { category: 'fonctionnalites', text: 'Analyse de l’enchaînement calculée sur ton appareil, sans intelligence artificielle générative : note sur 100, cinq critères expliqués, points forts, points faibles, conseils et limites.' },
        { category: 'ameliorations', text: 'Éditeur : ajouter depuis une grille de pictogrammes, réordonner, retirer, renommer, sans perdre l’historique ni le statut.' },
        { category: 'ameliorations', text: 'Un pictogramme neutre par technique, le même partout, sans image du coach.' },
      ],
      links: [
        { label: 'Mes enchaînements', to: '/createur' },
        { label: 'Créer un enchaînement', to: '/createur/nouveau' },
      ],
    },
    {
      version: '0.37.0',
      releaseDate: '2026-10-22',
      title: 'Comptes et sauvegarde en ligne',
      isMajor: true,
      changes: [
        { category: 'fonctionnalites', text: 'Crée ton compte par e-mail ou avec Google pour sauvegarder et retrouver tes données sur un autre appareil. Le compte reste facultatif.' },
        { category: 'fonctionnalites', text: 'Photo de profil : ta photo Google, ou une photo prise ou choisie dans ta galerie, recadrée et gardée sur ton appareil.' },
        { category: 'fonctionnalites', text: 'Modifier ton adresse e-mail ou ton mot de passe depuis ton profil.' },
        { category: 'ameliorations', text: 'État de la sauvegarde clair : synchronisé, en cours, en attente de connexion ou erreur, avec « Réessayer ».' },
      ],
      links: [
        { label: 'Mon profil', to: '/profil' },
        { label: 'Se connecter', to: '/connexion' },
      ],
    },
    {
      version: '0.36.0',
      releaseDate: '2026-10-22',
      title: 'Créer tes enchaînements depuis Entraîner',
      isMajor: false,
      changes: [
        { category: 'ameliorations', text: 'Entraîner, Séances : une carte « Crée tes propres enchaînements » ouvre le Créateur, et tes enchaînements sont juste en dessous.' },
        { category: 'ameliorations', text: 'Techniques se concentre sur l’apprentissage : Techniques, Combinaisons, Légendes et Favoris.' },
        { category: 'ameliorations', text: 'Les anciens liens vers le Créateur et les Programmes mènent toujours au bon endroit.' },
      ],
      links: [
        { label: 'Créer un enchaînement', to: '/createur' },
        { label: 'Ouvrir Entraîner', to: '/entrainer' },
      ],
    },
    {
      version: '0.35.0',
      releaseDate: '2026-10-22',
      title: 'Coaching 3D plus lisible',
      isMajor: false,
      changes: [
        { category: 'ameliorations', text: 'Pendant la séance, le nom du coup s’affiche sous le coach au moment exact où il le fait, puis disparaît quand le coup est fini.' },
        { category: 'ameliorations', text: 'Chrono compact en haut : discipline, niveau, round et temps restant sur une seule ligne, avec une barre fine.' },
        { category: 'ameliorations', text: 'L’enchaînement complet ne reste plus en haut pendant l’effort ; consignes et points clés restent à portée du bouton « i ».' },
      ],
      links: [{ label: 'M’entraîner', to: '/entrainer' }],
    },
    {
      version: '0.34.0',
      releaseDate: '2026-10-22',
      title: 'Progrès plus clair',
      isMajor: false,
      changes: [
        { category: 'ameliorations', text: 'Progrès repensé : ton parcours en grand, tes quatre chiffres clés côte à côte, les deux périodes comparées juste au-dessus du graphique.' },
        { category: 'ameliorations', text: 'Jours actifs et plus longue pause restent visibles sur toutes les vues de Progrès.' },
        { category: 'ameliorations', text: 'Dans le Menu, Progrès vient juste après Entraîner.' },
      ],
      links: [{ label: 'Voir mes progrès', to: '/stats' }],
    },
    {
      version: '0.33.0',
      releaseDate: '2026-10-22',
      title: 'Entraîner repensé et emblèmes des disciplines',
      isMajor: true,
      changes: [
        { category: 'fonctionnalites', text: 'Entraîner en trois espaces : Séances, Disciplines et Programmes. Le dernier espace choisi est retenu.' },
        { category: 'fonctionnalites', text: 'Reprendre une séance interrompue, même après avoir fermé l’application : même exercice, même round, même chrono.' },
        { category: 'fonctionnalites', text: 'Les dix programmes avec des filtres par discipline, niveau, durée et objectif, et leur avancement.' },
        { category: 'disciplines', text: 'Nouveaux emblèmes 3D des six disciplines, avec des versions simplifiées pour les petites tailles.' },
        { category: 'ameliorations', text: 'Cartes des disciplines plus compactes, avec ton niveau et ta progression réelle.' },
        { category: 'ameliorations', text: 'Barre du bas plus opaque : le contenu ne transparaît plus.' },
      ],
      links: [
        { label: 'Ouvrir Entraîner', to: '/entrainer' },
        { label: 'Voir les programmes', to: '/entrainer?espace=programmes' },
      ],
    },
    {
      version: '0.32.0',
      releaseDate: '2026-10-22',
      title: 'Nouvelle navigation et tenues premium',
      isMajor: true,
      changes: [
        { category: 'fonctionnalites', text: 'Une seule barre en bas de l’écran : ses cinq boutons changent selon l’écran, Menu ouvre la navigation générale.' },
        { category: 'fonctionnalites', text: 'Nouveautés : l’historique des versions, avec un point rouge quand une version n’a pas été consultée.' },
        { category: 'fonctionnalites', text: 'Recherche de techniques et de légendes par leur nom.' },
        { category: 'ameliorations', text: 'Uppercut, coude horizontal, middle et high kick et genou direct : les hanches lancent le coup, sans chute à l’arrivée.' },
        { category: 'ameliorations', text: 'Judogis et gis de jiu-jitsu refaits : tissage fin, col renforcé, ceinture plate nouée.' },
        { category: 'ameliorations', text: 'Shorts mats, gants moins ronds, protège-tibias à bords droits.' },
        { category: 'ameliorations', text: '« Choisis ton coach » montre les vrais coachs 3D.' },
        { category: 'corrections', text: 'Le coach n’apparaît plus quelques instants sans sa tenue.' },
      ],
      links: [
        { label: 'Voir les techniques', to: '/techniques' },
        { label: 'Choisir mon coach', to: '/coach' },
      ],
    },
    {
      version: '0.31.0',
      releaseDate: '2026-10-22',
      title: 'Moteur 3D plus net et tenues par discipline',
      isMajor: true,
      changes: [
        { category: 'fonctionnalites', text: 'Chaque coach porte la tenue de la discipline (7 tenues), avec le choix kimono ou sans kimono en jiu-jitsu.' },
        { category: 'ameliorations', text: 'Image plus nette sur téléphone et contours sans escaliers.' },
        { category: 'ameliorations', text: 'Musculature plus naturelle ; jab, direct et low kick refaits.' },
      ],
      links: [{ label: 'Réglages d’affichage', to: '/reglages/affichage' }],
    },
    {
      version: '0.30.0',
      releaseDate: '2026-10-22',
      title: 'Coachs photo-réalistes',
      isMajor: true,
      changes: [
        { category: 'coachs', text: 'Kadir et Amara en rendu Ultra-réaliste (modèles photo-réalistes).' },
        { category: 'ameliorations', text: 'Mouvements en chaîne : les hanches partent avant les bras ; garde vivante.' },
        { category: 'corrections', text: 'Le coach 3D ne disparaît plus sur certains téléphones Android.' },
      ],
      links: [],
    },
    {
      version: '0.28.0',
      releaseDate: '2026-10-21',
      title: 'Disciplines enrichies et Coach IA',
      isMajor: false,
      changes: [
        { category: 'techniques', text: '16 nouvelles techniques en judo et en jiu-jitsu brésilien, dont les chutes.' },
        { category: 'fonctionnalites', text: 'Fenêtre du Coach IA réduite, normale ou agrandie ; questions plus variées.' },
        { category: 'fonctionnalites', text: 'Carte IMC dans le profil ; plein écran du coach par un double appui.' },
        { category: 'ameliorations', text: '107 légendes et 1 496 combinaisons, avec leur « fleur de style ».' },
      ],
      links: [{ label: 'Voir les légendes', to: '/champions' }],
    },
    {
      version: '0.26.0',
      releaseDate: '2026-10-20',
      title: 'Actions rapides',
      isMajor: false,
      changes: [{ category: 'fonctionnalites', text: 'Les actions les plus courantes de chaque écran à portée de pouce.' }],
      links: [],
    },
    {
      version: '0.25.0',
      releaseDate: '2026-10-20',
      title: 'Coach IA sur tous les écrans',
      isMajor: false,
      changes: [
        { category: 'fonctionnalites', text: 'Le Coach IA répond selon l’écran ouvert.' },
        { category: 'fonctionnalites', text: 'Technique précédente et suivante sur chaque fiche.' },
      ],
      links: [],
    },
    {
      version: '0.24.0',
      releaseDate: '2026-10-20',
      title: 'Kadir et Amara, vos coachs',
      isMajor: true,
      changes: [
        { category: 'coachs', text: 'Kadir et Amara deviennent les coachs de l’application.' },
        { category: 'fonctionnalites', text: 'Marque de maîtrise sur chaque technique et filtre « À revoir ».' },
        { category: 'ameliorations', text: 'Écrans épurés, textes pensés pour les débutants.' },
      ],
      links: [],
    },
  ] satisfies Draft[]
).map(withCategories);

export const LATEST_RELEASE = RELEASES[0];

/** a version the user has not opened yet: the red dots of Menu and Nouveautés */
export const hasUnseenRelease = (seen: string | null | undefined) => seen !== LATEST_RELEASE.version;

/** 2026-10-22 → « 22 octobre 2026 » */
export function releaseDateLabel(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  return `${d} ${months[m - 1]} ${y}`;
}
