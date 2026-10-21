import type { GlyphId } from './glyphs';

/**
 * Central register of the icons: stable id → family and French name. The id is the contract used by
 * the screens and the tests; the drawing behind it can change without touching any screen.
 * Where each icon is used is listed in docs/icones/INVENTAIRE.md.
 */
export type IconFamily = 'navigation' | 'acces' | 'compte' | 'entrainement' | 'action' | 'statut';

export const ICON_REGISTRY = {
  // navigation
  home: { family: 'navigation', name: 'Accueil' },
  train: { family: 'navigation', name: 'Entraîner' },
  techniques: { family: 'navigation', name: 'Techniques' },
  coach: { family: 'navigation', name: 'Coach' },
  coachAi: { family: 'navigation', name: 'Coach IA' },
  progress: { family: 'navigation', name: 'Progression' },
  legends: { family: 'navigation', name: 'Légendes' },
  // quick access and secondary menus
  programs: { family: 'acces', name: 'Programmes' },
  combos: { family: 'acces', name: 'Enchaînements' },
  challenges: { family: 'acces', name: 'Défis (réservé, aucun écran)' },
  favorite: { family: 'acces', name: 'Favori' },
  favoriteOutline: { family: 'acces', name: 'Ajouter aux favoris' },
  history: { family: 'acces', name: 'Historique' },
  search: { family: 'acces', name: 'Recherche' },
  filters: { family: 'acces', name: 'Filtres' },
  collection: { family: 'acces', name: 'Collection' },
  library: { family: 'acces', name: 'Bibliothèque' },
  calendar: { family: 'acces', name: 'Séances, objectifs' },
  compose: { family: 'acces', name: 'Créer un enchaînement' },
  trophy: { family: 'acces', name: 'Légendes du combat (distinction)' },
  dumbbell: { family: 'acces', name: 'Exercice' },
  // account and settings
  profile: { family: 'compte', name: 'Profil' },
  settings: { family: 'compte', name: 'Réglages' },
  notifications: { family: 'compte', name: 'Notifications (réservé, aucun écran)' },
  download: { family: 'compte', name: 'Télécharger, exporter' },
  upload: { family: 'compte', name: 'Importer' },
  subscription: { family: 'compte', name: 'Abonnement (réservé, aucun écran)' },
  help: { family: 'compte', name: 'Aide' },
  accessibility: { family: 'compte', name: 'Accessibilité' },
  language: { family: 'compte', name: 'Langue' },
  audio: { family: 'compte', name: 'Voix et sons' },
  mute: { family: 'compte', name: 'Son coupé' },
  display: { family: 'compte', name: 'Affichage 3D' },
  theme: { family: 'compte', name: 'Apparence' },
  offline: { family: 'compte', name: 'Hors ligne' },
  privacy: { family: 'compte', name: 'Confidentialité' },
  textSize: { family: 'compte', name: 'Taille du texte' },
  signOut: { family: 'compte', name: 'Se déconnecter' },
  fighter: { family: 'compte', name: 'Mon combattant' },
  // training controls
  play: { family: 'entrainement', name: 'Lecture' },
  pause: { family: 'entrainement', name: 'Pause' },
  stop: { family: 'entrainement', name: 'Arrêt' },
  replay: { family: 'entrainement', name: 'Recommencer' },
  repeat: { family: 'entrainement', name: 'Répétition en boucle' },
  slow: { family: 'entrainement', name: 'Ralenti' },
  speed: { family: 'entrainement', name: 'Vitesse normale' },
  forward: { family: 'entrainement', name: 'Avance' },
  random: { family: 'action', name: 'Au hasard' },
  stepBack: { family: 'entrainement', name: 'Précédent' },
  stepForward: { family: 'entrainement', name: 'Suivant' },
  decompose: { family: 'entrainement', name: 'Décomposer le mouvement' },
  fullscreen: { family: 'entrainement', name: 'Plein écran' },
  exitFullscreen: { family: 'entrainement', name: 'Quitter le plein écran' },
  camera: { family: 'entrainement', name: 'Caméra' },
  rotateLeft: { family: 'entrainement', name: 'Tourner à gauche' },
  rotateRight: { family: 'entrainement', name: 'Tourner à droite' },
  zoomIn: { family: 'entrainement', name: 'Zoomer' },
  zoomOut: { family: 'entrainement', name: 'Dézoomer' },
  hideUi: { family: 'entrainement', name: 'Masquer l’interface' },
  showUi: { family: 'entrainement', name: 'Afficher l’interface' },
  ar: { family: 'entrainement', name: 'Réalité augmentée' },
  target: { family: 'entrainement', name: 'Recentrer, objectif' },
  mic: { family: 'entrainement', name: 'Dicter' },
  send: { family: 'entrainement', name: 'Envoyer' },
  // actions
  add: { family: 'action', name: 'Ajouter, créer' },
  edit: { family: 'action', name: 'Modifier' },
  duplicate: { family: 'action', name: 'Dupliquer' },
  delete: { family: 'action', name: 'Supprimer' },
  share: { family: 'action', name: 'Partager (réservé, aucune fonction)' },
  save: { family: 'action', name: 'Enregistrer' },
  sync: { family: 'action', name: 'Synchroniser' },
  link: { family: 'action', name: 'Lien' },
  details: { family: 'action', name: 'Détails' },
  info: { family: 'action', name: 'Informations, comment faire' },
  back: { family: 'action', name: 'Retour' },
  fold: { family: 'action', name: 'Replier' },
  panelExpand: { family: 'action', name: 'Agrandir la fenêtre' },
  panelShrink: { family: 'action', name: 'Réduire la fenêtre' },
  quickActions: { family: 'action', name: 'Actions rapides (pilule repliée)' },
  chevron: { family: 'action', name: 'Ouvrir' },
  chevronDown: { family: 'action', name: 'Déplier' },
  close: { family: 'action', name: 'Fermer' },
  confirm: { family: 'action', name: 'Confirmer' },
  cancel: { family: 'action', name: 'Annuler' },
  minus: { family: 'action', name: 'Retirer' },
  grid: { family: 'action', name: 'Vue grille' },
  list: { family: 'action', name: 'Vue liste' },
  compare: { family: 'action', name: 'Comparer' },
  // statuses
  verified: { family: 'statut', name: 'Vérifiée' },
  adapted: { family: 'statut', name: 'Adaptée' },
  inspired: { family: 'statut', name: 'Inspirée' },
  pending: { family: 'statut', name: 'À valider' },
  free: { family: 'statut', name: 'Gratuit (réservé)' },
  premium: { family: 'statut', name: 'Premium (réservé)' },
  locked: { family: 'statut', name: 'Verrouillé (réservé)' },
  downloaded: { family: 'statut', name: 'Téléchargé (réservé)' },
  check: { family: 'statut', name: 'Fait, sélectionné' },
  mastered: { family: 'statut', name: 'Technique assimilée' },
  struggling: { family: 'statut', name: 'Encore du mal, à revoir' },
  star: { family: 'statut', name: 'Étoile vide' },
  starFilled: { family: 'statut', name: 'Étoile pleine' },
  flame: { family: 'statut', name: 'Série' },
  bolt: { family: 'statut', name: 'Intensité' },
  shield: { family: 'statut', name: 'Protection, sécurité' },
  wrench: { family: 'statut', name: 'À corriger' },
  trend: { family: 'statut', name: 'Progression guidée' },
} as const satisfies Record<GlyphId, { family: IconFamily; name: string }>;

type Of<F extends IconFamily> = { [K in GlyphId]: (typeof ICON_REGISTRY)[K]['family'] extends F ? K : never }[GlyphId];
export type NavigationIconId = Of<'navigation'> | Of<'acces'>;
export type ActionIconId = Of<'action'> | Of<'compte'> | Of<'acces'>;
export type TrainingControlIconId = Of<'entrainement'> | 'back' | 'close' | 'info' | 'minus' | 'add' | 'chevron' | 'settings' | 'filters';
export type StatusIconId = Of<'statut'> | 'favorite' | 'history' | 'offline';

/**
 * Colour role of each icon, after Youssef's icon sheet v2 (2026-10-20): red for training and the
 * actions that start or remove something, gold for distinctions and saved things, green for what is
 * done or added, blue for adapted or synchronised, orange for what waits. An icon not listed is
 * neutral (white on dark, ink on light). The role colours an icon in menus, tiles, panel titles and
 * the navigation; buttons keep the colour of the button (tone `current`). The colour never carries
 * the meaning alone: the label next to the icon does.
 */
export type IconRole = 'accent' | 'gold' | 'success' | 'info' | 'orange' | 'purple';

export const ICON_ROLE: Partial<Record<GlyphId, IconRole>> = {
  train: 'accent',
  progress: 'accent',
  programs: 'accent',
  combos: 'accent',
  favorite: 'accent',
  calendar: 'accent',
  compose: 'accent',
  notifications: 'accent',
  delete: 'accent',
  close: 'accent',
  cancel: 'accent',
  locked: 'accent',
  play: 'accent',
  signOut: 'accent',
  legends: 'gold',
  challenges: 'gold',
  trophy: 'gold',
  collection: 'gold',
  save: 'gold',
  premium: 'gold',
  subscription: 'gold',
  starFilled: 'gold',
  inspired: 'gold',
  add: 'success',
  confirm: 'success',
  verified: 'success',
  downloaded: 'success',
  check: 'success',
  mastered: 'success',
  struggling: 'orange',
  adapted: 'info',
  sync: 'info',
  trend: 'info',
  pending: 'orange',
  flame: 'orange',
};

export const iconRole = (id: GlyphId): IconRole | 'neutral' => ICON_ROLE[id] ?? 'neutral';
