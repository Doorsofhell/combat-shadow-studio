/**
 * Guide de l’application pour le coach IA (base locale, sans réseau).
 *
 * Chaque entrée décrit une fonction qui existe vraiment dans l’application, écrite d’après les écrans
 * (src/ui/screens) : mots-clés, réponse courte au tutoiement, et éventuellement un lien vers l’écran.
 * L’écran où le coach est appelé (CoachScreen) départage les questions vagues (« à quoi sert cet écran ? »).
 */
import { hasAny, hasPhrase, normalize } from './text';

/** écran d’où le coach est appelé (dérivé de la route) */
export type CoachScreen =
  | 'accueil'
  | 'entrainer'
  | 'discipline'
  | 'programmes'
  | 'programme'
  | 'techniques'
  | 'technique'
  | 'partenaire'
  | 'combinaisons'
  | 'createur'
  | 'favoris'
  | 'progres'
  | 'historique'
  | 'objectifs'
  | 'legendes'
  | 'legende-fiche'
  | 'champion'
  | 'reglages'
  | 'reglages-voix'
  | 'reglages-rounds'
  | 'reglages-affichage'
  | 'reglages-donnees'
  | 'profil'
  | 'coach-choix'
  | 'coach-ia'
  | 'confidentialite'
  | 'entrainement';

export interface GuideEntry {
  id: string;
  title: string;
  /** expressions qui désignent cette fonction (normalisées au chargement) */
  keywords: string[];
  /** écrans que cette entrée décrit : la première entrée qui cite un écran est sa page d’aide */
  screens?: CoachScreen[];
  answer: string;
  /** lien vers l’écran de la fonction (route de l’application) */
  action?: { to: string; label: string };
}

export const APP_GUIDE: GuideEntry[] = [
  // ------------------------------------------------------------------ vue d’ensemble
  {
    id: 'app-overview',
    title: 'Comment fonctionne l’application',
    keywords: [
      'comment fonctionne l application', 'comment marche l application', 'comment fonctionne l appli', 'comment marche l appli', 'fonctionnement de l application',
      'explique moi l application', 'explique l application', 'presente l application', 'mode d emploi', 'tutoriel', 'guide de l application',
      'a quoi sert l application', 'application', 'appli', 'app',
      // 0.24: the first question of a beginner
      'par ou commencer', 'par ou je commence', 'je commence par quoi', 'comment commencer', 'je debute', 'premiere fois',
    ],
    answer:
      'Combat Shadow Studio t’aide à t’entraîner seul, en shadow : ton coach en 3D (Kadir ou Amara) montre chaque mouvement et tu le fais en même temps, face à l’écran.\n' +
      'La barre du bas a cinq onglets : Accueil (ton coach, la séance recommandée et ta semaine), Entraîner (disciplines, programmes et tes enchaînements), Techniques (les fiches de chaque mouvement), Progrès (tes statistiques) et Légendes (des combinaisons inspirées de grands champions).\n' +
      'Pour te lancer, touche « Commencer l’entraînement » sur l’accueil. Et si tu as une question, technique ou sur l’application, ouvre-moi avec le bouton « Coach » de la pilule en bas à gauche (ou la bulle en bas à droite sur les écrans sans pilule).',
    action: { to: '/entrainer', label: 'Aller à Entraîner' },
  },
  {
    id: 'nav-tabs',
    title: 'Les onglets de la barre du bas',
    keywords: ['barre du bas', 'barre de navigation', 'navigation', 'onglets', 'les onglets', 'menu principal', 'menu', 'changer d ecran', 'revenir a l accueil'],
    answer:
      'La barre du bas te suit partout, sauf pendant une séance :\n' +
      '• Accueil : ton coach, le bouton pour commencer et ta progression de la semaine.\n' +
      '• Entraîner : démarrage rapide, les six disciplines, les programmes et tes enchaînements.\n' +
      '• Techniques : la bibliothèque, avec les combinaisons, le créateur, tes favoris et les programmes.\n' +
      '• Progrès : tes statistiques, tes objectifs et ton historique.\n' +
      '• Légendes : les combinaisons inspirées de grands champions.\n' +
      'Ton profil et les réglages sont en haut à droite de l’accueil.',
  },
  {
    // 0.26 (Youssef, 2026-10-20, mockup C « Pilule d'actions »)
    id: 'pilule-actions',
    title: 'La pilule d’actions en bas à gauche',
    keywords: [
      'pilule', 'pilule d actions', 'la pilule', 'actions rapides', 'icones flottantes', 'boutons flottants', 'icones en bas a gauche', 'boutons en bas a gauche',
      'bouton en bas a gauche', 'en bas a gauche', 'bouton rouge en bas', 'raccourcis', 'seance rapide', 'technique du jour', 'je la maitrise',
      // 0.27: the Coach IA inside the pill, and folding it (Youssef, 2026-10-20 21:45)
      'replier la pilule', 'deplier la pilule', 'enrouler la pilule', 'derouler la pilule', 'cacher la pilule', 'masquer la pilule', 'reduire la pilule', 'bouton rond en bas a gauche',
    ],
    answer:
      'En bas à gauche, juste au-dessus de la barre du bas, la pilule d’actions te donne les gestes les plus courants de l’écran où tu es. Chaque bouton a une icône et un mot, et le rouge, toujours en premier, est le plus utile.\n' +
      'Les boutons changent selon l’écran :\n' +
      '• Accueil : « Séance rapide » lance la séance recommandée, « Reprendre » ta dernière séance, « Technique du jour » ouvre une technique différente chaque jour.\n' +
      '• Techniques : « Au hasard » ouvre une technique de la liste affichée, « À revoir » ne garde que celles où tu as encore du mal.\n' +
      '• Fiche d’une technique : « S’entraîner » lance l’exercice de cette technique, « Ralenti » la montre au quart de sa vitesse, « Je la maîtrise » la marque comme assimilée (touche encore pour retirer la marque).\n' +
      '• Légendes : « S’entraîner » lance la combinaison de la carte du haut, « Combo du jour » y remet celle du jour, « Au hasard » en tire une autre ; sur la fiche d’une combinaison, « S’entraîner » et « Décomposer ».\n' +
      '• Progrès : « Nouvelle séance », « Objectifs » et « Période » (choisir tes propres dates).\n' +
      'Le dernier bouton, « Coach », en doré, m’ouvre : je te réponds en sachant sur quel écran tu es.\n' +
      'La petite flèche au bout de la pilule la replie en un bouton rond, pour libérer l’écran ; touche ce bouton rond pour la déplier. L’application se souvient de ton choix.\n' +
      'Pendant une séance, dans les réglages et sur ton profil, il n’y a pas de pilule : ces écrans ont leurs propres boutons, et tu me trouves dans la bulle en bas à droite.',
  },
  {
    id: 'screen-accueil',
    title: 'L’écran d’accueil',
    keywords: ['accueil', 'ecran d accueil', 'page d accueil', 'bouton reprendre', 'reprendre ma seance', 'reprendre ma derniere seance', 'derniere seance', 'pour toi aujourd hui'],
    screens: ['accueil'],
    answer:
      'L’accueil, c’est ton point de départ. En haut, ton coach t’attend en garde ; « Changer de coach » permet de passer de Kadir à Amara.\n' +
      '« Commencer l’entraînement » ouvre l’exercice recommandé pour ton niveau. « Reprendre » relance ta dernière séance.\n' +
      'Plus bas : ton temps de la semaine, ton objectif s’il est défini, tes favoris, un programme recommandé et des idées « Pour toi aujourd’hui ».\n' +
      'Les icônes en haut à droite ouvrent ton profil et les réglages.',
  },

  // ------------------------------------------------------------------ s’entraîner
  {
    id: 'start-session',
    title: 'Commencer une séance',
    keywords: [
      'commencer une seance', 'lancer une seance', 'demarrer une seance', 'faire une seance', 'commencer l entrainement', 'demarrer l entrainement', 'lancer l entrainement',
      'commencer un entrainement', 'lancer un exercice', 'commencer un exercice', 'demarrer un exercice', 'bouton demarrer', 'bouton s entrainer',
    ],
    answer:
      'Le plus simple : sur l’accueil, touche « Commencer l’entraînement ». La fiche de l’exercice recommandé s’ouvre.\n' +
      'Tu peux aussi aller dans l’onglet Entraîner, choisir une discipline puis un exercice.\n' +
      'Sur la fiche, choisis un mode (Libre, Technique, Cardio ou Rounds) puis touche « S’entraîner ». Dans le studio, touche « Démarrer » : après un court décompte, le coach enchaîne les mouvements et tu les fais avec lui.\n' +
      'Si tu débutes, prends le mode Technique : c’est plus lent et commenté.',
    action: { to: '/entrainer', label: 'Ouvrir Entraîner' },
  },
  {
    id: 'modes',
    title: 'Les modes d’entraînement',
    keywords: ['mode', 'modes', 'les modes', 'quel mode', 'mode libre', 'mode technique', 'mode cardio', 'mode rounds', 'mode programme', 'difference entre les modes'],
    answer:
      'Sur la fiche d’un exercice, tu choisis le mode avant de lancer :\n' +
      '• Libre : l’enchaînement tourne en boucle, sans limite de temps.\n' +
      '• Technique : vitesse lente, consignes vocales et points clés entre les répétitions. Idéal pour apprendre.\n' +
      '• Cardio : rythme soutenu, 5 blocs de 60 s avec 20 s de récupération.\n' +
      '• Rounds : des rounds chronométrés avec la cloche ; tu règles la durée, le repos et le nombre de rounds (1 à 12).\n' +
      'Les programmes et tes propres enchaînements ont aussi leur mode, réglé pour toi.',
  },
  {
    id: 'screen-entrainer',
    title: 'L’onglet Entraîner',
    keywords: ['onglet entrainer', 'ecran entrainer', 'demarrage rapide', 'mes enchainements', 'choisir une discipline', 'disciplines'],
    screens: ['entrainer'],
    answer:
      'Ici, tu choisis ta séance.\n' +
      '• Démarrage rapide : deux exercices conseillés pour toi, prêts à lancer.\n' +
      '• Disciplines : boxe anglaise, kick-boxing, MMA, muay-thaï, jiu-jitsu brésilien et judo. Touche-en une pour voir ses exercices par niveau.\n' +
      '• Programmes : des séances complètes, avec un filtre par discipline.\n' +
      '• Mes enchaînements : ceux que tu as créés dans le Créateur.',
    action: { to: '/entrainer', label: 'Ouvrir Entraîner' },
  },
  {
    id: 'screen-discipline',
    title: 'La page d’une discipline',
    keywords: ['page discipline', 'page de la discipline', 'liste des exercices', 'choisir mon niveau', 'type d exercice', 'fiche de l exercice', 'fiche d exercice'],
    screens: ['discipline'],
    answer:
      'Cette page liste les exercices de la discipline.\n' +
      'Choisis d’abord ton niveau, puis filtre par type d’exercice si tu veux (technique, combinaison, déplacement…). En kick-boxing, tu peux aussi choisir le style (K1, Low kick, Full contact).\n' +
      'Touche un exercice pour ouvrir sa fiche : les mouvements (touche-en un pour voir sa fiche technique), les consignes, « Ajouter aux favoris », le choix du mode, puis « S’entraîner ».\n' +
      'En bas, « Créer » ouvre le créateur et « Techniques » la bibliothèque de cette discipline.',
  },
  {
    id: 'screen-entrainement',
    title: 'Le studio d’entraînement',
    keywords: ['studio', 'ecran d entrainement', 'pendant la seance', 'pendant l entrainement', 'compteur', 'compteurs', 'compteur de repetitions', 'mettre en pause', 'mettre la seance en pause', 'exercice suivant', 'exercice precedent', 'quitter la seance'],
    screens: ['entrainement'],
    answer:
      'Dans le studio, ton coach exécute les mouvements et tu les fais en même temps.\n' +
      '• En bas : « Démarrer », puis « Pause » et « Reprendre » ; les flèches passent à l’exercice précédent ou suivant ; la flèche ronde recommence.\n' +
      '• Sous le coach : le mouvement en cours, la consigne et le point clé du moment, puis le temps de séance, le cumul et les répétitions. Seul le temps de travail actif est compté.\n' +
      '• Les boutons « Décomposer », « Comment faire ? », « Ralenti » et la roue (paramètres) t’aident à apprendre.\n' +
      '• Sur le coach : « Caméra », le plein écran et, en haut, « AR » pour la réalité augmentée.\n' +
      '• « Coach » m’ouvre et met la séance en pause.',
  },
  {
    id: 'decomposer',
    title: 'Le bouton Décomposer',
    keywords: ['decomposer', 'bouton decomposer', 'decomposition', 'etude du mouvement', 'phase par phase', 'etapes cles', 'reperes visuels'],
    screens: ['entrainement'],
    answer:
      '« Décomposer » met la séance en pause et ouvre l’étude du mouvement en cours.\n' +
      'Tu y trouves les phases numérotées (touche-en une pour la rejouer), un curseur pour avancer dans le geste, les flèches pour sauter d’une étape clé à l’autre, et trois vitesses : ×0,25, ×0,5 et ×1.\n' +
      '« Repères » affiche des aides visuelles sur le coach, « Gaucher » montre le geste dans l’autre garde pour comparer, et en pause tu peux tourner autour du coach.\n' +
      '« Terminer » te ramène à la séance.',
  },
  {
    id: 'comment-faire',
    title: 'Le bouton Comment faire ?',
    keywords: ['bouton comment faire', 'sert comment faire', 'le bouton info', 'bouton i', 'fiche guidee'],
    screens: ['entrainement'],
    answer:
      '« Comment faire ? » met la séance en pause et ouvre la fiche guidée du mouvement en cours : les étapes, la respiration, les erreurs fréquentes et les points clés.\n' +
      'Les boutons en haut de la fiche passent aux autres mouvements de l’enchaînement. « Fermer » te ramène au studio ; touche « Reprendre » pour continuer.',
  },
  {
    id: 'ralenti',
    title: 'Le ralenti et la vitesse',
    keywords: ['bouton ralenti', 'le ralenti', 'vitesse d execution', 'changer la vitesse', 'regler la vitesse', 'la vitesse du coach', 'vitesse du coach'],
    screens: ['entrainement'],
    answer:
      'Le bouton « Ralenti » fait passer le coach à un quart de sa vitesse : tu vois ainsi chaque détail du geste. Touche-le encore pour revenir à la vitesse normale.\n' +
      'Pour régler finement, ouvre la roue (paramètres) : le curseur « Vitesse d’exécution » va de ×0,25 à ×1,5.\n' +
      'Sur la fiche d’une technique, la barre de lecture a aussi son réglage de vitesse.',
  },
  {
    id: 'camera',
    title: 'La caméra et les angles de vue',
    keywords: ['camera', 'la camera', 'bouton camera', 'angle de vue', 'angles de vue', 'angle de camera', 'changer l angle de vue', 'tourner la camera', 'tourner autour du coach', 'zoom', 'zoomer', 'recentrer', 'vue de profil', 'vue de face', 'camera libre', '360'],
    screens: ['entrainement'],
    answer:
      'Dans le studio, le bouton « Caméra » ouvre les réglages de vue. « Auto » choisit le meilleur angle pour chaque technique.\n' +
      'Les flèches changent d’angle (face, 3/4, profil, arrière, surélevée), tu peux tourner à gauche ou à droite, zoomer, et « Recentrer » revient à la vue automatique.\n' +
      'Tu peux aussi glisser le doigt sur le coach pour une caméra libre à 360°. Sur certaines techniques, un bouton « Zoom » montre un gros plan quelques secondes.\n' +
      'La caméra par défaut des fiches se règle dans Réglages, Affichage 3D. Et rassure-toi : cette caméra est virtuelle, elle ne filme pas.',
  },
  {
    id: 'plein-ecran',
    title: 'Le plein écran',
    keywords: ['plein ecran', 'fullscreen', 'mode immersif', 'masquer les commandes', 'agrandir le coach', 'double tap', 'double clic', 'toucher deux fois', 'touche deux fois', 'tout l ecran'],
    screens: ['entrainement'],
    answer:
      'Touche deux fois le coach en 3D, rapidement : il passe en plein écran total, seul sur tout l’écran. Ça marche à l’entraînement, sur l’accueil, sur la fiche d’une technique et dans l’atelier de ton combattant. Dans le studio, le bouton plein écran (sous « Caméra », à droite du coach) fait la même chose.\n' +
      'Pendant la séance, elle continue : le bouton principal reste en bas, et les commandes s’effacent au bout de quelques secondes ; touche l’écran une fois pour les faire revenir.\n' +
      'Pour sortir : touche deux fois de nouveau, le bouton « Quitter le plein écran » en haut à droite, Échap sur un clavier, ou le bouton retour d’Android.\n' +
      'Glisser pour tourner autour du coach ou pincer pour zoomer ne déclenche jamais le plein écran.',
  },
  {
    id: 'ar',
    title: 'La réalité augmentée',
    keywords: ['realite augmentee', 'ar', 'mode ar', 'bouton ar', 'coach dans ma piece', 'coach dans mon salon', 'webxr'],
    screens: ['entrainement'],
    answer:
      'Le bouton « AR », en haut à droite du studio, pose ton coach dans ta pièce, sur le sol, à travers la caméra arrière du téléphone. Il fait les mêmes mouvements, avec les mêmes compteurs.\n' +
      'La caméra ne s’ouvre qu’après ton accord, les images restent sur ton téléphone et rien n’est envoyé.\n' +
      'Dégage au moins 2 m × 2 m et pose ton téléphone sur un support avant les grands mouvements. Selon ton appareil et ton navigateur, la réalité augmentée peut ne pas être disponible : l’écran te le dit.',
  },
  {
    id: 'options-entrainement',
    title: 'Les paramètres du studio',
    keywords: ['roue', 'parametres de la seance', 'options d entrainement', 'options', 'reperes au sol', 'marques au sol', 'les reperes', 'enchainement en cours', 'annonce des coups'],
    screens: ['entrainement'],
    answer:
      'Dans le studio, la roue ouvre les options de la séance :\n' +
      '• le coach (Kadir ou Amara) et le rendu ;\n' +
      '• ta garde : orthodoxe (gauche devant) ou gaucher (droite devant) ;\n' +
      '• l’angle de caméra ;\n' +
      '• les repères au sol : position et orientation des pieds, pied avant ou arrière, direction du pivot, trajectoires ;\n' +
      '• la vitesse d’exécution, la voix, l’annonce des coups et les sons d’impact ;\n' +
      '• la liste de l’enchaînement : touche un exercice pour y aller.',
  },

  // ------------------------------------------------------------------ coachs et rendu
  {
    id: 'choose-coach',
    title: 'Choisir son coach',
    keywords: ['changer de coach', 'choisir mon coach', 'choisir un coach', 'choix du coach', 'autre coach', 'mon coach', 'kadir', 'amara', 'coach homme', 'coach femme'],
    screens: ['coach-choix'],
    answer:
      'Tu as deux coachs : Kadir « L’Aigle », un lutteur patient qui met une pression constante, et Amara « La Lionne », une frappeuse puissante à la garde haute. Les deux montrent les mêmes techniques.\n' +
      'Pour changer : « Changer de coach » sur l’accueil, Réglages puis « Mon coach », ou la roue pendant une séance. Tes statistiques sont conservées.',
    action: { to: '/coach', label: 'Choisir mon coach' },
  },
  {
    id: 'render',
    title: 'Le rendu des combattants',
    keywords: ['rendu', 'rendu des combattants', 'style anime', 'anime', 'ultra realiste', 'realiste', 'look du coach', 'apparence du coach', 'graphismes', 'style graphique', 'manga', 'encre'],
    answer:
      'Dans Réglages, rubrique Apparence, « Rendu des combattants » propose deux looks : Anime ou Ultra-réaliste. C’est le même coach, avec les mêmes mouvements : seul l’aspect change.\n' +
      'Tu retrouves ce choix dans Réglages, Affichage 3D, et dans la roue du studio. Si tu utilises l’ancienne version du rendu 3D (secours), les choix sont Encre, Manga et Réaliste.',
    action: { to: '/reglages', label: 'Ouvrir les réglages' },
  },

  // ------------------------------------------------------------------ techniques
  {
    id: 'screen-techniques',
    title: 'L’onglet Techniques',
    keywords: ['catalogue', 'bibliotheque', 'liste des techniques', 'trouver une technique', 'chercher une technique', 'onglet techniques', 'categories', 'filtre par categorie', 'vignette', 'vignettes', 'tuile', 'tuiles'],
    screens: ['techniques'],
    answer:
      'L’onglet Techniques est ta bibliothèque. En haut, cinq sections : Techniques, Combinaisons, Créateur, Favoris et Programmes. Les Légendes ont leur propre onglet dans la barre du bas.\n' +
      'Dans Techniques, choisis la discipline, puis une catégorie si tu veux (poings, pieds, défenses…). Touche une vignette pour ouvrir la fiche.\n' +
      'L’étoile signale un favori, et un liseré coloré en bas de la vignette montre ta marque : vert pour « Assimilée », orange pour « Encore du mal ». Le filtre « À revoir » les regroupe.\n' +
      'Dans certaines disciplines, une section « Avec un partenaire réel » explique des techniques à faire au club.',
    action: { to: '/techniques', label: 'Ouvrir Techniques' },
  },
  {
    id: 'screen-technique',
    title: 'La fiche d’une technique',
    keywords: ['fiche', 'fiche technique', 'cette fiche', 'page de la technique', 'consignes du coach', 'barre de lecture'],
    screens: ['technique'],
    answer:
      'Sur une fiche, le coach montre la technique en boucle. La barre de lecture met en pause ou relance et règle la vitesse ; juste à côté, deux icônes te servent à marquer où tu en es.\n' +
      'Dessous : les angles de caméra, la description, le guide pas à pas (étapes, erreurs fréquentes, points clés) et les « Consignes du coach ». En kick-boxing, une carte indique ce que chaque style autorise.\n' +
      'L’étoile en haut à droite ajoute la technique à tes favoris.',
  },
  {
    id: 'mastery',
    title: 'Marquer une technique : Assimilée ou Encore du mal',
    keywords: [
      'marquer', 'marque', 'marquer une technique', 'marque une technique', 'je marque', 'marquer cette technique', 'assimilee', 'assimile', 'assimiler', 'encore du mal', 'j ai du mal', 'a revoir', 'filtre a revoir',
      'technique acquise', 'acquise', 'icone verte', 'icone orange', 'coche verte', 'liseré', 'lisere', 'bord colore', 'bande coloree',
    ],
    screens: ['technique'],
    answer:
      'Sur la fiche d’une technique, à côté de la barre de lecture, il y a deux petites icônes : la coche verte veut dire « Assimilée », la flèche orange « Encore du mal ». Touche celle qui te correspond ; touche-la encore pour retirer la marque.\n' +
      'Ensuite, dans le catalogue, la vignette porte un liseré coloré en bas (vert ou orange), le filtre « À revoir » regroupe les techniques où tu as encore du mal, et l’onglet Maîtrise de Progrès fait le bilan.\n' +
      'C’est toi qui décides : je ne te vois pas, donc je ne note rien à ta place.',
    action: { to: '/techniques', label: 'Ouvrir Techniques' },
  },
  {
    id: 'partner',
    title: 'Les techniques avec partenaire',
    keywords: ['avec un partenaire', 'avec partenaire', 'partenaire reel', 'technique a deux', 'techniques a deux', 'pas d animation'],
    screens: ['partenaire'],
    answer:
      'Certaines techniques (projections, contrôles, soumissions) demandent un vrai partenaire. Leur fiche explique les étapes, les points clés et surtout la sécurité, mais il n’y a pas d’animation ni d’exercice solo pour l’instant.\n' +
      'Pratique-les uniquement au club, avec un enseignant. Quand c’est possible, la fiche te propose une préparation à faire seul, animée sur ton coach.',
  },
  {
    id: 'favoris',
    title: 'Les favoris',
    keywords: ['favori', 'favoris', 'mes favoris', 'favorite', 'favorites', 'etoile', 'ajouter aux favoris', 'mettre en favori', 'retrouver mes favoris'],
    screens: ['favoris'],
    answer:
      'Pour garder une technique sous la main, touche l’étoile en haut à droite de sa fiche. Pour un exercice, c’est « Ajouter aux favoris » sur sa fiche ; pour une combinaison des Légendes, l’étoile de sa fiche.\n' +
      'Tu les retrouves dans Techniques, section Favoris, et sur l’accueil. Les combinaisons des Légendes ont aussi leur section Favoris dans l’onglet Légendes.',
    action: { to: '/techniques?tab=favoris', label: 'Voir mes favoris' },
  },
  {
    id: 'screen-combinaisons',
    title: 'Les combinaisons de la bibliothèque',
    keywords: ['onglet combinaisons', 'section combinaisons', 'lancer une combinaison', 'liste des combinaisons', 'trouver une combinaison'],
    screens: ['combinaisons'],
    answer:
      'La section Combinaisons regroupe les enchaînements de la discipline choisie, pour un niveau. Tu changes la discipline ou le niveau en haut.\n' +
      'Touche une combinaison pour ouvrir sa fiche, choisis le mode, puis « S’entraîner ».',
  },
  {
    id: 'createur',
    title: 'Le créateur d’enchaînements',
    keywords: [
      'createur', 'le createur', 'creer un enchainement', 'creer mon enchainement', 'creer mon propre enchainement', 'mon propre enchainement', 'ma propre combinaison',
      'creer une combinaison', 'creer ma combinaison', 'enchainement personnalise', 'composer un enchainement', 'composer ma combinaison',
    ],
    screens: ['createur'],
    answer:
      'Dans le Créateur (Techniques, section Créateur, ou le bouton « Créer ») :\n' +
      '1. Choisis la discipline.\n' +
      '2. Touche les mouvements pour les ajouter dans l’ordre. Touche un mouvement ajouté pour le retirer, ou « Annuler le dernier ».\n' +
      '3. L’application vérifie que l’enchaînement est réalisable et te signale ce qui coince.\n' +
      '4. Donne-lui un nom, choisis le mode (En boucle, Lent et commenté ou Rounds), puis « Enregistrer » ou « Lancer ».\n' +
      'Tes créations apparaissent dans « Mes enchaînements ».',
    action: { to: '/createur', label: 'Ouvrir le Créateur' },
  },
  {
    id: 'programmes',
    title: 'Les programmes',
    keywords: ['programme', 'programmes', 'programme guide', 'programmes guides', 'seance guidee', 'seances guidees', 'lancer le programme', 'blocs'],
    screens: ['programmes', 'programme'],
    answer:
      'Un programme, c’est une séance complète, de l’échauffement au retour au calme, découpée en blocs : échauffement, technique, combinaisons, cardio, récupération.\n' +
      'Sa page indique le temps de travail effectif, le nombre de blocs et de rounds, la fréquence conseillée, les objectifs et la progression. Touche « Lancer le programme » : les blocs s’enchaînent tout seuls.\n' +
      'Les durées sont indicatives, adapte-les à ta forme.',
    action: { to: '/programmes', label: 'Voir les programmes' },
  },
  {
    id: 'kb-styles',
    title: 'Les styles de kick-boxing',
    keywords: ['style de kick boxing', 'styles de kick boxing', 'style de kickboxing', 'k1', 'full contact', 'style low kick', 'tous les styles', 'reglement', 'regles du kick boxing', 'k1 seulement'],
    answer:
      'En kick-boxing, tu choisis ton style en haut des listes (page de la discipline, Techniques, Créateur) :\n' +
      '• K1 : poings, pieds et genoux, coudes interdits.\n' +
      '• Low kick : poings et pieds, coups de pied aux cuisses, genoux et coudes interdits.\n' +
      '• Full contact : poings et pieds au-dessus de la ceinture.\n' +
      'Les listes s’adaptent au style. Avec « Tous les styles », un badge comme « K1 seulement » signale ce qui n’est pas permis partout, et la fiche d’une technique résume ce que dit chaque règlement. Vérifie toujours celui de ta fédération.',
  },

  // ------------------------------------------------------------------ progrès
  {
    id: 'screen-progres',
    title: 'Lire ses statistiques',
    keywords: ['progres', 'onglet progres', 'statistiques', 'stats', 'mes statistiques', 'mes stats', 'lire mes statistiques', 'tableau de bord', 'parcours', 'jauge', 'temps actif', 'temps compte', 'kpi'],
    screens: ['progres'],
    answer:
      'En haut de Progrès, choisis la discipline (ou Toutes) et la période : 7 jours, 30 jours, 90 jours, 12 mois ou Perso.\n' +
      'La jauge « Parcours » compte les techniques étudiées sur le total de la discipline : une technique compte dès qu’elle fait partie d’un exercice que tu as pratiqué.\n' +
      'À côté : ton temps actif, tes séances et tes répétitions. La petite flèche compare avec la période précédente de même durée.\n' +
      'Dessous, les onglets Activité, Niveaux, Catégories, Exercices, Historique et Maîtrise détaillent tout ça. Seul le temps d’entraînement actif est compté, et la qualité du geste n’est pas mesurée.',
    action: { to: '/stats', label: 'Ouvrir Progrès' },
  },
  {
    id: 'periodes',
    title: 'Périodes et comparaison',
    keywords: ['periode', 'periodes', 'comparaison', 'comparer les periodes', 'periode precedente', 'periode personnalisee', 'evolution', 'fleche', 'filtres', 'filtrer mes stats'],
    screens: ['progres'],
    answer:
      'Chaque chiffre de Progrès est comparé à la période précédente de même durée : sur 30 jours, ce sont les 30 jours d’avant.\n' +
      'Dans l’onglet Activité, le lien de comparaison ouvre un tableau : temps actif, séances, répétitions, exercices distincts, jours actifs et plus longue pause, avec l’évolution.\n' +
      '« Perso » te laisse choisir une date de début et de fin. Le bouton de filtres ajoute un niveau ou une catégorie d’exercice.',
    action: { to: '/stats', label: 'Ouvrir Progrès' },
  },
  {
    id: 'maitrise',
    title: 'L’onglet Maîtrise',
    keywords: ['onglet maitrise', 'maitrise', 'bilan des techniques', 'techniques assimilees', 'combien de techniques'],
    screens: ['progres'],
    answer:
      'Dans Progrès, l’onglet Maîtrise fait le bilan de tes marques pour la discipline choisie : combien de techniques sont « Assimilées », combien sont « À revoir » et combien ne sont pas encore évaluées, avec une barre verte et orange.\n' +
      'Les techniques à revoir sont listées, avec un lien vers leur fiche. Cet onglet ne dépend pas de la période : une marque n’a pas de date.\n' +
      'Pour marquer une technique, va sur sa fiche et touche la coche verte ou la flèche orange à côté de la barre de lecture.',
    action: { to: '/stats', label: 'Ouvrir Progrès' },
  },
  {
    id: 'historique',
    title: 'L’historique des séances',
    keywords: ['historique', 'historique des seances', 'mes seances', 'seances passees', 'anciennes seances', 'liste des seances'],
    screens: ['historique'],
    answer:
      'L’historique liste tes séances jour par jour : l’exercice, la discipline, le niveau, le mode, l’heure, le temps actif et les répétitions.\n' +
      'Tu l’ouvres avec l’icône d’historique en haut de Progrès. L’onglet Historique de Progrès montre, lui, les séances de la période choisie.\n' +
      'Seul le temps de travail actif est enregistré : les pauses ne comptent pas.',
    action: { to: '/historique', label: 'Voir l’historique' },
  },
  {
    id: 'objectifs',
    title: 'Les objectifs personnels',
    keywords: ['mon objectif', 'mes objectifs', 'objectif de la semaine', 'objectif hebdomadaire', 'objectifs personnels', 'fixer un objectif', 'definir un objectif', 'modifier mon objectif', 'anneau'],
    screens: ['objectifs'],
    answer:
      'Ouvre Objectifs avec l’icône en haut de Progrès, puis « Définir » (ou « Modifier »). Tu peux te fixer un temps actif par semaine (de 30 à 240 minutes) et un nombre de jours d’entraînement par semaine (de 1 à 7).\n' +
      'L’anneau et la barre se remplissent au fil de la semaine, et ton objectif de temps s’affiche aussi sur l’accueil. Cette page liste aussi tes techniques favorites.',
    action: { to: '/objectifs', label: 'Ouvrir mes objectifs' },
  },

  // ------------------------------------------------------------------ légendes
  {
    id: 'legendes',
    title: 'L’onglet Légendes',
    keywords: ['legendes', 'onglet legendes', 'legende', 'champions', 'combinaisons des legendes', 'bibliotheque des champions', 'collections', 'collection', 'dupliquer dans le createur'],
    screens: ['legendes', 'legende-fiche', 'champion'],
    answer:
      'Les Légendes, ce sont des combinaisons inspirées du style de grands champions, exécutées par ton coach.\n' +
      'Tout en haut, la carte montre ton combo du jour : « S’entraîner », dans la pilule en bas à gauche, le lance d’un appui, et « Au hasard » en tire un autre. Chaque fiche de la liste a aussi son bouton lecture rouge.\n' +
      'Juste dessous, choisis une discipline pour voir ses champions. Les sections Explorer, Favoris, Historique, Récents, Collections et Champions t’aident à t’y retrouver.\n' +
      'Sur la fiche d’une combinaison : « S’entraîner » tout en haut (mode Libre, touche « Changer » pour un autre mode) et toujours dans la pilule en bas à gauche, la séquence, « Décomposer », « Dupliquer dans le créateur » et « Ajouter à une collection ».',
    action: { to: '/champions', label: 'Ouvrir Légendes' },
  },
  {
    id: 'legendes-statuts',
    title: 'Vérifiée, Adaptée, Inspirée',
    keywords: ['statut', 'statuts', 'verifiee', 'adaptee', 'inspiree', 'que signifient les statuts', 'sequence reelle', 'vraiment fait en combat'],
    screens: ['legendes', 'legende-fiche'],
    answer:
      'Chaque combinaison des Légendes a un statut :\n' +
      '• Vérifiée : séquence observée dans un combat réel, avec la référence du combat et le moment exact.\n' +
      '• Adaptée : dérivée d’un enchaînement documenté, adaptée au travail solo.\n' +
      '• Inspirée : une combinaison originale qui reprend des traits connus du style du champion, pas une séquence qu’il a réellement faite en combat.\n' +
      'Les fiches livrées avec l’application sont toutes « Inspirées » : tu travailles un style, pas la copie d’un combat.',
    action: { to: '/champions', label: 'Ouvrir Légendes' },
  },

  // ------------------------------------------------------------------ réglages
  {
    id: 'screen-reglages',
    title: 'Les réglages',
    keywords: ['reglages', 'reglage', 'parametres de l application', 'parametres', 'configuration', 'ou sont les reglages'],
    screens: ['reglages'],
    answer:
      'Les réglages s’ouvrent avec la roue en haut à droite de l’accueil.\n' +
      '• Ton profil : un résumé et le lien pour le modifier.\n' +
      '• Apparence : le thème des menus et le rendu des combattants.\n' +
      '• Personnalisation : ton coach, Voix et sons, Rounds par défaut, Affichage 3D, et « Questionnaire et niveaux » pour refaire l’évaluation.\n' +
      '• Données : exporter, importer, tout effacer, et la confidentialité.',
    action: { to: '/reglages', label: 'Ouvrir les réglages' },
  },
  {
    id: 'theme',
    title: 'Le thème clair ou sombre',
    keywords: ['theme', 'mode sombre', 'mode clair', 'theme sombre', 'theme clair', 'fond noir', 'fond blanc', 'couleurs de l application'],
    screens: ['reglages'],
    answer:
      'Dans Réglages, rubrique Apparence, « Thème des menus » propose Clair, Sombre ou Automatique (il suit ton téléphone).\n' +
      'Le studio d’entraînement, lui, reste toujours blanc pour bien voir le coach.',
    action: { to: '/reglages', label: 'Ouvrir les réglages' },
  },
  {
    id: 'voix',
    title: 'Voix et sons',
    keywords: ['voix', 'voix du coach', 'couper la voix', 'le son', 'les sons', 'couper le son', 'volume', 'cloche', 'bip', 'bips', 'sons d impact', 'muet', 'annoncer chaque mouvement', 'conseils techniques'],
    screens: ['reglages-voix'],
    answer:
      'Dans Réglages, « Voix et sons » : la voix du coach, l’annonce de chaque mouvement, les conseils techniques (en mode Technique), les sons d’impact, le volume de la voix et celui des effets (cloche, bips). « Tester la voix » et « Tester la cloche » te permettent d’essayer.\n' +
      'La voix utilise celles installées sur ton appareil. Pendant une séance, la roue du studio permet aussi de couper la voix ou les sons.',
    action: { to: '/reglages/voix', label: 'Ouvrir Voix et sons' },
  },
  {
    id: 'rounds',
    title: 'La durée des rounds',
    keywords: ['rounds par defaut', 'duree des rounds', 'duree d un round', 'duree du round', 'nombre de rounds', 'regler les rounds', 'regler le repos', 'changer le temps de repos', 'chrono', 'chronometre', 'minuteur'],
    screens: ['reglages-rounds'],
    answer:
      'Dans Réglages, « Rounds par défaut » : la durée d’un round (1, 2, 3 ou 5 min) et le repos (30, 45, 60 ou 90 s).\n' +
      'Pour une séance précise, choisis le mode Rounds sur la fiche de l’exercice : tu règles la durée (ou un nombre de secondes), le repos et le nombre de rounds, de 1 à 12.',
    action: { to: '/reglages/rounds', label: 'Ouvrir Rounds par défaut' },
  },
  {
    id: 'affichage',
    title: 'L’affichage 3D',
    keywords: ['affichage 3d', 'affichage', 'qualite graphique', 'qualite d affichage', 'qualite 3d', 'mode economie', 'saccade', 'saccades', 'rame', 'lag', 'batterie', 'version du rendu', 'camera par defaut', 'ca ralentit'],
    screens: ['reglages-affichage'],
    answer:
      'Dans Réglages, « Affichage 3D », tu règles :\n' +
      '• Rendu des combattants : Anime ou Ultra-réaliste.\n' +
      '• Qualité : Auto, Haute ou Économie. En Auto, la qualité baisse d’elle-même si l’appareil n’arrive pas à suivre ; si ça saccade, choisis Économie.\n' +
      '• Version du rendu 3D : la nouvelle, ou la précédente en secours.\n' +
      '• Caméra par défaut : 3/4, Face ou Profil.',
    action: { to: '/reglages/affichage', label: 'Ouvrir Affichage 3D' },
  },
  {
    id: 'donnees',
    title: 'Exporter, importer, effacer',
    keywords: ['exporter', 'export', 'importer', 'import', 'exporter mes donnees', 'importer mes donnees', 'exporter mes stats', 'sauvegarde', 'sauvegarder mes donnees', 'changer de telephone', 'nouveau telephone', 'transferer mes donnees', 'tout effacer', 'effacer mes donnees', 'supprimer mes donnees', 'reinitialiser', 'remettre a zero'],
    screens: ['reglages-donnees'],
    answer:
      'Dans Réglages, « Exporter, importer, effacer » :\n' +
      '• Exporter crée un fichier (JSON) avec tes données : garde-le, ou réimporte-le sur un autre appareil.\n' +
      '• Importer lit un fichier que tu choisis.\n' +
      '• Tout effacer supprime de cet appareil tes statistiques, enchaînements, objectifs, favoris et réponses au questionnaire. C’est définitif, une confirmation est demandée.',
    action: { to: '/reglages/donnees', label: 'Ouvrir Données' },
  },
  {
    id: 'confidentialite',
    title: 'Tes données et ta vie privée',
    keywords: ['confidentialite', 'vie privee', 'mes donnees', 'donnees personnelles', 'envoye', 'envoyees', 'serveur', 'internet', 'traceur', 'publicite', 'pub', 'qui voit mes donnees', 'espionne', 'rgpd'],
    screens: ['confidentialite'],
    answer:
      'Tout reste sur ton appareil : profil, statistiques, enchaînements, favoris. Aucune mesure d’audience, aucune publicité, aucun traceur.\n' +
      'Rien n’est envoyé, sauf si tu actives toi-même la synchronisation d’un compte ou la saisie vocale en ligne du coach (ta voix passe alors par le service du navigateur).\n' +
      'Mes réponses sont calculées sur ton téléphone, et la caméra de la réalité augmentée ne s’ouvre qu’avec ton accord, sans rien enregistrer.',
    action: { to: '/confidentialite', label: 'Lire la confidentialité' },
  },
  {
    id: 'compte',
    title: 'Le compte et la synchronisation',
    keywords: ['un compte', 'le compte', 'creer un compte', 'mon compte', 'se connecter', 'me connecter', 'connexion', 'synchronisation', 'synchroniser', 'sync', 'mot de passe', 'mode invite'],
    answer:
      'Le compte est facultatif : en mode invité, tu as accès à toute l’application, hors ligne, et tout reste sur cet appareil.\n' +
      'Quand les comptes en ligne sont activés dans ta version, l’écran Profil propose « Créer un compte ou se connecter » ; sinon il l’indique. La synchronisation est désactivée par défaut et ne démarre que si tu l’actives.\n' +
      'Pour passer sur un autre téléphone sans compte, utilise l’export dans les réglages.',
    action: { to: '/profil', label: 'Ouvrir mon profil' },
  },
  {
    id: 'profil',
    title: 'Ton profil',
    keywords: ['mon profil', 'le profil', 'page profil', 'modifier mon profil', 'pseudo', 'changer mon pseudo', 'changer de niveau', 'modifier mon niveau', 'discipline principale', 'changer ma garde', 'taille du texte', 'texte plus grand', 'agrandir le texte', 'reduire les animations', 'questionnaire', 'refaire le questionnaire', 'm appeler par mon pseudo'],
    screens: ['profil'],
    answer:
      'Ton profil s’ouvre avec l’icône en haut à droite de l’accueil (ou Réglages, « Modifier mon profil et mon compte »).\n' +
      'Tu y changes ton pseudo (je t’appelle comme ça si « M’appeler par mon pseudo » est activé), tes disciplines et ta discipline principale, ta garde, ton rythme, tes objectifs, la taille du texte et la réduction des animations.\n' +
      'Ton niveau se choisit aussi sur la page de chaque discipline, et « Questionnaire et niveaux » dans les réglages refait l’évaluation de départ.',
    action: { to: '/profil', label: 'Ouvrir mon profil' },
  },
  {
    // 0.27 (Youssef, 2026-10-20 21:45: « un calcul imc auto avec recommandation et jauge dans le profil »)
    id: 'imc',
    title: 'Ton IMC dans le profil',
    keywords: ['imc', 'mon imc', 'l imc', 'indice de masse corporelle', 'masse corporelle', 'calcul imc', 'calculer mon imc', 'calcul de l imc', 'corpulence', 'surpoids', 'obesite', 'jauge imc', 'jauge', 'taille et poids', 'ma taille et mon poids'],
    answer:
      'Dans ton profil, section Informations personnelles, la carte « Ton IMC » se calcule toute seule dès que tu indiques ta taille et ton poids : le poids en kilos divisé par la taille en mètres au carré, arrondi à une décimale.\n' +
      'Une jauge de 15 à 40 montre où tu te situes sur l’échelle adulte de l’OMS (insuffisance pondérale, corpulence normale, surpoids, obésité), avec le chiffre et le nom de la zone, et un conseil d’entraînement adapté.\n' +
      'C’est un simple repère : l’IMC ne fait pas la différence entre le muscle et la graisse (beaucoup de combattants musclés sont classés « surpoids »), il ne s’applique pas avant 18 ans ni pendant une grossesse, et il ne remplace pas l’avis d’un médecin. Tes mesures restent sur ton appareil.',
    action: { to: '/profil', label: 'Ouvrir mon profil' },
  },
  {
    id: 'offline',
    title: 'Utiliser l’application hors ligne',
    keywords: ['hors ligne', 'hors connexion', 'sans internet', 'sans connexion', 'sans reseau', 'offline', 'mode avion', 'wifi', '4g', 'installer l application', 'installer'],
    answer:
      'Oui, ça marche sans internet. Une fois l’application ouverte une première fois, elle garde ses fichiers sur ton appareil (tu peux aussi l’installer sur ton écran d’accueil).\n' +
      'Tes séances, tes statistiques et mes réponses fonctionnent hors ligne. Seules la synchronisation d’un compte et la saisie vocale en ligne ont besoin du réseau, et seulement si tu les actives.',
  },
  {
    id: 'coach-ia',
    title: 'Le coach IA',
    keywords: [
      'coach ia', 'l ia', 'ia', 'intelligence artificielle', 'assistant', 'la bulle', 'bulle', 'historique du coach', 'reduire le coach', 'agrandir la fenetre', 'reduire la fenetre', 'taille de la fenetre', 'reponses courtes', 'reponses detaillees', 'longueur des reponses',
      'voix haute', 'lire les reponses', 'saisie vocale', 'micro', 'dicter', 'reglages du coach', 'comment tu marches', 'comment tu fonctionnes', 'tu fonctionnes comment',
    ],
    screens: ['coach-ia'],
    answer:
      'Je suis le coach IA de l’application. Je réponds directement sur ton appareil, à partir de la bibliothèque validée, même sans internet.\n' +
      'Je ne te vois pas : je ne corrige pas ton geste, mais j’explique, je montre une démo ou un ralenti, je propose des exercices et je t’explique l’application. Je sais aussi sur quel écran tu m’appelles.\n' +
      'Tu me trouves avec le bouton « Coach » de la pilule en bas à gauche sur les écrans qui en ont une, sinon dans la bulle en bas à droite ; pendant une séance, la bulle est dans le coin de la scène et m’ouvrir met la séance en pause.\n' +
      'Les deux boutons en haut de mon panneau le réduisent (la première ligne de ma réponse et ta question) ou l’agrandissent (presque tout l’écran, pour lire confortablement) ; tu peux aussi glisser la petite barre du haut. Je garde la taille que tu as choisie.\n' +
      'Mes réglages (icône Historique, l’horloge en haut de mon panneau) : réponses courtes ou détaillées, lecture à voix haute, historique (désactivé par défaut) et saisie vocale du navigateur, qui passe en ligne et reste désactivée tant que tu ne l’actives pas.',
    action: { to: '/coach-ia', label: 'Réglages du coach' },
  },
];

const ENTRY_BY_ID = new Map(APP_GUIDE.map((e) => [e.id, e]));
export const guideEntry = (id: string) => ENTRY_BY_ID.get(id);

/** page d’aide de chaque écran : la première entrée qui le cite */
export function screenEntry(screen?: CoachScreen): GuideEntry | undefined {
  return screen ? APP_GUIDE.find((e) => e.screens?.includes(screen)) : undefined;
}

let normCache: { e: GuideEntry; kw: string[] }[] | null = null;
function normalized() {
  return (normCache ??= APP_GUIDE.map((e) => ({ e, kw: [...new Set(e.keywords.map(normalize).filter(Boolean))] })));
}

/** points d’une entrée pour un texte normalisé : chaque expression trouvée vaut son nombre de mots */
function scoreOf(text: string, kw: string[]) {
  let s = 0;
  for (const k of kw) if (hasPhrase(text, k)) s += k.split(' ').length;
  return s;
}

/** la question désigne l’écran lui-même (« à quoi sert cet écran ? », « comment ça marche ici ? ») */
const DEICTIC = ['cet ecran', 'cette page', 'ce menu', 'cet onglet', 'cette section', 'ce bouton', 'ces boutons', 'cette icone', 'ces icones', 'a quoi sert ici', 'ca sert a quoi ici', 'ou suis je', 'je suis ou', 'je suis sur quel ecran', 'comment ca marche', 'comment ca fonctionne', 'je fais quoi ici', 'que faire ici', 'quoi faire ici', 'on fait quoi ici'];

export interface GuideMatch {
  entry: GuideEntry;
  score: number;
  /** la réponse décrit l’écran courant faute d’expression plus précise */
  byScreen: boolean;
}

/** meilleure entrée du guide pour une question (texte normalisé), l’écran départageant les égalités */
export function matchGuide(text: string, screen?: CoachScreen): GuideMatch | undefined {
  let best: GuideMatch | undefined;
  let bestRank = 0;
  for (const { e, kw } of normalized()) {
    const score = scoreOf(text, kw);
    if (!score) continue;
    const rank = score + (screen && e.screens?.includes(screen) ? 0.5 : 0);
    if (rank > bestRank) {
      bestRank = rank;
      best = { entry: e, score, byScreen: false };
    }
  }
  const here = screenEntry(screen);
  // « à quoi sert cet écran ? » : la page d’aide de l’écran, sauf si une fonction précise est nommée
  if (here && hasAny(text, DEICTIC) && (!best || best.score < 2)) return { entry: here, score: 1, byScreen: true };
  if (best) return best;
  if (hasAny(text, DEICTIC)) return { entry: here ?? ENTRY_BY_ID.get('app-overview')!, score: 1, byScreen: !!here };
  return undefined;
}

/** noms qui désignent l’interface : une question qui les contient parle de l’application */
const APP_NOUNS = ['application', 'appli', 'app', 'ecran', 'cet ecran', 'cette page', 'page', 'onglet', 'onglets', 'bouton', 'boutons', 'icone', 'icones', 'menu', 'barre du bas', 'reglages', 'parametres', 'fonctionnalite', 'fonctionnalites'];
/** fonctions de l’application assez précises pour l’emporter même si une technique est citée */
const STRONG = ['par ou commencer', 'par ou je commence', 'je commence par quoi', 'comment commencer', 'je debute', 'premiere fois', 'reperes au sol', 'marques au sol', 'marquer', 'je marque', 'marque une technique', 'assimilee', 'assimile', 'encore du mal', 'a revoir', 'favori', 'favoris', 'favorite', 'maitrise', 'fiche', 'cette fiche', 'createur', 'onglet maitrise', 'legendes'];
/** mots d’une question sur l’usage */
const HOW = [
  'comment', 'ou est', 'ou sont', 'ou trouver', 'ou se trouve', 'ou je trouve', 'ou puis je', 'ou on', 'ou je peux', 'a quoi sert', 'a quoi servent', 'sert a quoi', 'servent a quoi', 'ca sert a quoi',
  'c est quoi', 'qu est ce', 'quoi', 'que', 'sont elles', 'est elle', 'est il', 'quel', 'quelle', 'quels', 'quelles', 'difference', 'explique', 'expliquer', 'fonctionne', 'marche', 'utiliser', 'activer', 'desactiver', 'changer', 'modifier',
  'regler', 'choisir', 'ajouter', 'retirer', 'enlever', 'supprimer', 'effacer', 'lire', 'signifie', 'signifient', 'veut dire', 'je peux', 'on peut', 'peut on', 'est ce que', 'possible', 'trouver', 'aide', 'pourquoi',
];

/**
 * La question porte-t-elle sur l’application plutôt que sur un geste ? (texte normalisé)
 * `mentionsTechnique` : une technique de la bibliothèque est citée, il faut alors un nom d’interface ou une fonction précise.
 */
export function isAppQuestion(text: string, mentionsTechnique: boolean): boolean {
  if (hasAny(text, APP_NOUNS) || hasAny(text, STRONG)) return true;
  if (mentionsTechnique) return false;
  if (hasAny(text, DEICTIC)) return true;
  const m = matchGuide(text);
  // une expression longue et précise (« mes données » + « envoyées ») suffit, sinon il faut une tournure de question
  return !!m && !m.byScreen && (m.score >= 3 || hasAny(text, HOW));
}

// ------------------------------------------------------------------ écran courant

/** écran correspondant à une route (chemin et paramètres de recherche de HashRouter) */
export function screenFromPath(pathname: string, search = ''): CoachScreen | undefined {
  const path = pathname.replace(/\/+$/, '') || '/';
  const seg = path.split('/').filter(Boolean);
  const q = new URLSearchParams(search);
  switch (seg[0]) {
    case undefined:
      return 'accueil';
    case 'entrainer':
      return 'entrainer';
    case 'discipline':
      return 'discipline';
    case 'entrainement':
      return 'entrainement';
    case 'programmes':
      return seg[1] ? 'programme' : 'programmes';
    case 'techniques': {
      if (seg[1]) return 'technique';
      const tab = q.get('tab');
      return tab === 'combinaisons' || tab === 'createur' || tab === 'favoris' || tab === 'programmes' ? tab : tab === 'legendes' ? 'legendes' : 'techniques';
    }
    case 'partenaire':
      return 'partenaire';
    case 'createur':
      return 'createur';
    case 'champions':
      return seg[1] === 'c' ? 'champion' : seg[1] ? 'legende-fiche' : 'legendes';
    case 'stats':
      return 'progres';
    case 'historique':
      return 'historique';
    case 'objectifs':
      return 'objectifs';
    case 'reglages':
      return seg[1] === 'voix' ? 'reglages-voix' : seg[1] === 'rounds' ? 'reglages-rounds' : seg[1] === 'affichage' ? 'reglages-affichage' : seg[1] === 'donnees' ? 'reglages-donnees' : 'reglages';
    case 'profil':
      return 'profil';
    case 'coach':
      return 'coach-choix';
    case 'coach-ia':
      return 'coach-ia';
    case 'confidentialite':
      return 'confidentialite';
    default:
      return undefined;
  }
}

/** même écran pour une cible « /chemin?requête » */
export function screenOfTarget(to: string): CoachScreen | undefined {
  const [p, s = ''] = to.split('?');
  return screenFromPath(p, s);
}
