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
      version: '1.4.0',
      releaseDate: '2026-10-28',
      title: 'Un seul écran coach, partout',
      isMajor: false,
      changes: [
        { category: 'ameliorations', text: 'Le coach de l’Accueil, de la fiche technique, de la séance et de l’aperçu est maintenant le même écran : mêmes gestes, mêmes boutons, au même endroit.' },
        { category: 'fonctionnalites', text: 'Touche le coach une fois : ses commandes apparaissent dans sa zone, à droite (son, vitesse, plein écran, pause en séance) et les angles en bas. Touche-le encore une fois : elles disparaissent. Deux touchers rapides : plein écran.' },
        { category: 'ameliorations', text: 'En séance, un toucher sur le coach ne met plus en pause : il montre les commandes, dont la pause. Le gros bouton Pause reste en bas.' },
        { category: 'ameliorations', text: 'Fiche technique : la vitesse et les angles de caméra sont dans la zone du coach, il reste plus de place pour lui.' },
        { category: 'corrections', text: 'Voix coupée : un petit haut-parleur barré reste dans le coin du coach, et la séance le dit au départ, avec la façon de remettre le son.' },
      ],
      links: [{ label: 'Voix et sons', to: '/reglages/voix' }],
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
