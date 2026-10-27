import type { NavIconId } from './icons';

/**
 * v0.32 (Youssef, 2026-10-22, « PROMPT MAÎTRE — Refonte intégrale de la navigation dynamique premium »): one bottom
 * bar with five places whose icons and actions follow the screen, as in the validated mockup
 * docs/design/navigation-dynamique-reference.html (function `actions()`). This file holds the configuration of
 * every screen; the bar (BottomBar.tsx) draws it and the screens only give the handlers of their own actions.
 *
 * Actions:
 * - `back`: smart back (the real previous page, else the parent of the screen);
 * - `menu`: the « Navigation générale » sheet;
 * - `nav:/path`: goes to a page of the app;
 * - any other id: an action of the screen, given by the screen with useNavActions; while the screen has not
 *   given it (nothing selected yet, player not ready), the button is shown disabled, never hidden.
 */
export type NavAction = 'back' | 'menu' | `nav:${string}` | string;

export interface NavSlot {
  icon: NavIconId;
  label: string;
  action: NavAction;
  /** v0.44: only when the rule of slotRole() does not fit this place */
  role?: NavRole;
}

/**
 * v0.44 (Youssef, 2026-10-23, « AMÉLIORATION DE LA BARRE DE NAVIGATION CONTEXTUELLE »): what a place of the bar is,
 * which sets its colour (never its word or its position):
 * - `global`: permanent navigation, neutral (Retour, Menu, the main places of the app);
 * - `contextual`: an action of the screen shown, lightly tinted with the accent, more strongly when active.
 */
export type NavRole = 'global' | 'contextual';

/** the main places of the app: a link to one of them is navigation, not an action of the screen */
export const GLOBAL_PLACES = ['/', '/entrainer', '/techniques', '/chrono', '/stats', '/profil', '/programmes', '/historique', '/objectifs', '/reglages', '/coach', '/champions', '/createur'];

export function slotRole(slot: NavSlot): NavRole {
  if (slot.role) return slot.role;
  if (slot.action === 'back' || slot.action === 'menu') return 'global';
  // a link to a page of this screen (its editor, one of its sections) is one of its actions
  if (slot.action.startsWith('nav:')) return GLOBAL_PLACES.includes(slot.action.slice(4)) ? 'global' : 'contextual';
  return 'contextual';
}

export type NavScreen =
  | 'accueil'
  | 'entrainer'
  | 'discipline'
  | 'programmes'
  | 'programme'
  | 'entrainement'
  | 'techniques'
  | 'fiche'
  | 'partenaire'
  | 'createur'
  | 'createur-fiche'
  | 'createur-editeur'
  | 'progres'
  | 'progres-activite'
  | 'progres-detail'
  | 'historique'
  | 'objectifs'
  | 'legendes'
  | 'fiche-legende'
  | 'combinaison'
  | 'profil'
  | 'connexion'
  | 'coach'
  | 'coach-ia'
  | 'parametres'
  | 'confidentialite'
  | 'premium'
  | 'encyclopedie'
  | 'encyclopedie-fiche'
  | 'chrono'
  | 'autre';

const BACK: NavSlot = { icon: 'back', label: 'Retour', action: 'back' };
const MENU: NavSlot = { icon: 'grid', label: 'Menu', action: 'menu' };

/** settings and the screens that hang from it: the mockup's `default` case */
const SETTINGS: NavSlot[] = [BACK, { icon: 'user', label: 'Profil', action: 'nav:/profil' }, { icon: 'options', label: 'Affichage', action: 'nav:/reglages/affichage' }, { icon: 'camera', label: 'Caméra', action: 'nav:/reglages/affichage?focus=camera' }, MENU];

/** screens without actions of their own: the three main places of the app between Retour and Menu */
/** the encyclopedia: its three ways in (families, A–Z, favourites) between Retour and Menu */
const ENCYCLOPEDIA: NavSlot[] = [BACK, { icon: 'ranking', label: 'Classement', action: 'ency-classement' }, { icon: 'az', label: 'A–Z', action: 'ency-az' }, { icon: 'heart', label: 'Favoris', action: 'ency-favoris' }, MENU];

/**
 * v0.48 (Youssef, 2026-10-23: « accéder au chronomètre depuis la barre bas de page à la place de l'icône technique »):
 * the main place Techniques of the bar becomes the fight timer; Techniques stays in Menu and in the
 * actions of the screens that open the techniques of what they show (discipline, legend, partner work).
 */
const CHRONO: NavSlot = { icon: 'stopwatch', label: 'Chrono', action: 'nav:/chrono' };

const PLACES: NavSlot[] = [BACK, { icon: 'dumbbell', label: 'Entraîner', action: 'nav:/entrainer' }, CHRONO, { icon: 'chart', label: 'Progrès', action: 'nav:/stats' }, MENU];

export const NAV_CONFIG: Record<NavScreen, NavSlot[]> = {
  // 5.1 — the mockup's `home`
  accueil: [
    { icon: 'dumbbell', label: 'Entraîner', action: 'nav:/entrainer' },
    // 0.34 (Youssef, 2026-10-22): Progrès right after Entraîner
    { icon: 'chart', label: 'Progrès', action: 'nav:/stats' },
    CHRONO,
    { icon: 'user', label: 'Profil', action: 'nav:/profil' },
    MENU,
  ],
  // 5.2 / 5.3 — the mockup's `train`; place 2 is drawn from the session state (see TOGGLE)
  entrainement: [BACK, { icon: 'play', label: 'Démarrer', action: 'toggle' }, { icon: 'scan', label: 'Décomposer', action: 'decompose' }, { icon: 'camera', label: 'Caméra', action: 'camera' }, MENU],
  // 5.4 — the mockup's `tech`
  techniques: [BACK, { icon: 'search', label: 'Rechercher', action: 'search' }, { icon: 'filter', label: 'Filtres', action: 'filters' }, { icon: 'play', label: 'Technique', action: 'open-selected' }, MENU],
  // 5.5 — the mockup's `detail`
  fiche: [BACK, { icon: 'play', label: 'S’entraîner', action: 'train' }, { icon: 'speed', label: 'Ralenti', action: 'slow' }, { icon: 'check', label: 'Maîtrise', action: 'mastery' }, MENU],
  // 5.6 — the mockup's `progress`
  progres: [BACK, { icon: 'calendar', label: 'Période', action: 'period' }, { icon: 'chart', label: 'Statistiques', action: 'stats' }, { icon: 'history', label: 'Historique', action: 'history' }, MENU],
  // 0.39 (refonte Progrès): « Activité » keeps the v0.34 dashboard and its bar; the other detail screens lead back to
  // the overview and to the history
  'progres-activite': [BACK, { icon: 'calendar', label: 'Période', action: 'period' }, { icon: 'chart', label: 'Statistiques', action: 'stats' }, { icon: 'history', label: 'Historique', action: 'history' }, MENU],
  'progres-detail': [BACK, { icon: 'calendar', label: 'Période', action: 'period' }, { icon: 'chart', label: 'Vue d’ensemble', action: 'nav:/stats' }, { icon: 'history', label: 'Historique', action: 'nav:/historique' }, MENU],
  // 5.7 — the mockup's `legends`
  legendes: [BACK, { icon: 'search', label: 'Rechercher', action: 'search' }, { icon: 'filter', label: 'Disciplines', action: 'filters' }, { icon: 'star', label: 'Légende', action: 'open-selected' }, MENU],
  // 5.8 — the mockup's `legenddetail`
  'fiche-legende': [BACK, { icon: 'history', label: 'Parcours', action: 'career' }, { icon: 'dumbbell', label: 'Techniques', action: 'techniques' }, { icon: 'heart', label: 'Favoris', action: 'favorite' }, MENU],
  // 5.9 — the mockup's `profile`
  profil: [BACK, { icon: 'chart', label: 'Activité', action: 'nav:/stats' }, { icon: 'coach', label: 'Coach', action: 'nav:/coach' }, { icon: 'settings', label: 'Réglages', action: 'nav:/reglages' }, MENU],
  // 5.10 — the mockup's `default` (settings)
  parametres: SETTINGS,
  confidentialite: SETTINGS,
  // 0.40 (Youssef, « Préparation Freemium et Premium à vie » §8): reached from Menu and the markers, not from the bar.
  // 0.45 (« Refonte page Premium à vie » §4): its own three panels between Retour and Menu
  premium: [BACK, { icon: 'checklist', label: 'Avantages', action: 'benefits' }, { icon: 'help', label: 'FAQ', action: 'faq' }, { icon: 'restore', label: 'Restaurer', action: 'restore' }, MENU],
  connexion: SETTINGS,
  // 0.46 (« Encyclopédie du combat » §9): Retour | Classement | A–Z | Favoris | Menu, on every screen of the encyclopedia
  encyclopedie: ENCYCLOPEDIA,
  'encyclopedie-fiche': ENCYCLOPEDIA,
  // 0.48 (« Chrono de combat », maquette B): Démarrer / Pause / Reprendre follows the session, Réglages opens the
  // chronometer options (or leads back to the setup), Chrono is the place shown
  chrono: [BACK, { icon: 'play', label: 'Démarrer', action: 'toggle' }, { icon: 'options', label: 'Réglages', action: 'setup' }, CHRONO, MENU],
  // 5.11 — the other screens, built on the same rules (Retour first, Menu last, the main action second)
  entrainer: [BACK, { icon: 'play', label: 'Démarrer', action: 'start' }, { icon: 'calendar', label: 'Programmes', action: 'nav:/programmes' }, CHRONO, MENU],
  discipline: [BACK, { icon: 'play', label: 'Démarrer', action: 'start' }, { icon: 'layers', label: 'Techniques', action: 'techniques' }, { icon: 'chart', label: 'Progrès', action: 'nav:/stats' }, MENU],
  // 0.41 (Youssef, « Enrichissement des programmes » §6): the programme filters are in the bar, as in the Créateur
  programmes: [BACK, { icon: 'filter', label: 'Filtrer', action: 'filters' }, CHRONO, { icon: 'chart', label: 'Progrès', action: 'nav:/stats' }, MENU],
  programme: [BACK, { icon: 'play', label: 'Démarrer', action: 'start' }, { icon: 'calendar', label: 'Programmes', action: 'nav:/programmes' }, { icon: 'chart', label: 'Progrès', action: 'nav:/stats' }, MENU],
  partenaire: [BACK, { icon: 'layers', label: 'Techniques', action: 'techniques' }, { icon: 'dumbbell', label: 'Entraîner', action: 'nav:/entrainer' }, { icon: 'chart', label: 'Progrès', action: 'nav:/stats' }, MENU],
  // 0.38 (Youssef, « Créateur d'enchaînements V2 »): the list, the sheet and the editor of the user's sequences
  createur: [BACK, { icon: 'search', label: 'Rechercher', action: 'search' }, { icon: 'filter', label: 'Filtrer', action: 'filters' }, { icon: 'plus', label: 'Créer', action: 'nav:/createur/nouveau' }, MENU],
  'createur-fiche': [BACK, { icon: 'play', label: 'Exécuter', action: 'run' }, { icon: 'edit', label: 'Modifier', action: 'edit' }, { icon: 'trash', label: 'Supprimer', action: 'delete' }, MENU],
  'createur-editeur': [BACK, { icon: 'plus', label: 'Ajouter', action: 'add' }, { icon: 'save', label: 'Enregistrer', action: 'save' }, { icon: 'close', label: 'Annuler', action: 'cancel' }, MENU],
  historique: [BACK, { icon: 'chart', label: 'Statistiques', action: 'nav:/stats' }, { icon: 'dumbbell', label: 'Entraîner', action: 'nav:/entrainer' }, { icon: 'calendar', label: 'Objectifs', action: 'nav:/objectifs' }, MENU],
  objectifs: [BACK, { icon: 'chart', label: 'Statistiques', action: 'nav:/stats' }, { icon: 'history', label: 'Historique', action: 'nav:/historique' }, { icon: 'dumbbell', label: 'Entraîner', action: 'nav:/entrainer' }, MENU],
  combinaison: [BACK, { icon: 'play', label: 'S’entraîner', action: 'train' }, { icon: 'scan', label: 'Décomposer', action: 'decompose' }, { icon: 'heart', label: 'Favoris', action: 'favorite' }, MENU],
  coach: [BACK, { icon: 'user', label: 'Profil', action: 'nav:/profil' }, { icon: 'dumbbell', label: 'Entraîner', action: 'nav:/entrainer' }, { icon: 'settings', label: 'Réglages', action: 'nav:/reglages' }, MENU],
  'coach-ia': PLACES,
  autre: PLACES,
};

/** place 2 of the session: the same button, its icon and word follow the player (5.3) */
export type ToggleState = 'start' | 'pause' | 'resume';
export const TOGGLE: Record<ToggleState, Pick<NavSlot, 'icon' | 'label'>> = {
  start: { icon: 'play', label: 'Démarrer' },
  pause: { icon: 'pause', label: 'Pause' },
  resume: { icon: 'play', label: 'Reprendre' },
};

/** where Retour goes when the screen was opened directly (no previous page in the app) */
export const NAV_PARENT: Record<NavScreen, string> = {
  accueil: '/',
  entrainer: '/',
  discipline: '/entrainer',
  programmes: '/entrainer',
  programme: '/programmes',
  entrainement: '/entrainer',
  techniques: '/',
  fiche: '/techniques',
  partenaire: '/techniques',
  createur: '/entrainer',
  'createur-fiche': '/createur',
  'createur-editeur': '/createur',
  progres: '/',
  'progres-activite': '/stats',
  'progres-detail': '/stats',
  historique: '/stats',
  objectifs: '/stats',
  legendes: '/',
  'fiche-legende': '/champions',
  combinaison: '/champions',
  profil: '/',
  connexion: '/profil',
  coach: '/profil',
  'coach-ia': '/',
  parametres: '/',
  confidentialite: '/reglages',
  premium: '/',
  encyclopedie: '/',
  'encyclopedie-fiche': '/encyclopedie',
  chrono: '/',
  autre: '/',
};

/**
 * The screen shown at a route, or null where the app has no bar: onboarding, the first choice of the coach (the
 * app is not set up yet), the dev lab.
 */
export function navScreen(pathname: string, search = ''): NavScreen | null {
  const p = pathname.replace(/\/+$/, '') || '/';
  const q = new URLSearchParams(search);
  if (p === '/') return 'accueil';
  if (p.startsWith('/bienvenue') || p.startsWith('/lab')) return null;
  if (p === '/coach') return q.get('first') === '1' ? null : 'coach';
  if (p === '/entrainer') return 'entrainer';
  if (p.startsWith('/discipline/')) return 'discipline';
  if (p === '/programmes') return 'programmes';
  if (p.startsWith('/programmes/')) return 'programme';
  if (p === '/entrainement') return 'entrainement';
  if (p === '/techniques') return 'techniques';
  if (p.startsWith('/techniques/')) return 'fiche';
  if (p.startsWith('/partenaire/')) return 'partenaire';
  if (p === '/createur') return 'createur';
  if (p === '/createur/nouveau' || (p.startsWith('/createur/') && p.endsWith('/modifier'))) return 'createur-editeur';
  if (p.startsWith('/createur/')) return 'createur-fiche';
  if (p === '/stats') return 'progres';
  if (p === '/stats/activite') return 'progres-activite';
  if (p.startsWith('/stats/')) return 'progres-detail';
  if (p === '/historique') return 'historique';
  if (p === '/objectifs') return 'objectifs';
  if (p === '/champions') return 'legendes';
  if (p.startsWith('/champions/c/')) return 'fiche-legende';
  if (p.startsWith('/champions/')) return 'combinaison';
  if (p === '/profil') return 'profil';
  if (p === '/connexion') return 'connexion';
  if (p.startsWith('/coach-ia')) return 'coach-ia';
  if (p === '/reglages' || p.startsWith('/reglages/')) return 'parametres';
  if (p === '/confidentialite') return 'confidentialite';
  if (p === '/premium') return 'premium';
  if (p === '/chrono') return 'chrono';
  if (p.startsWith('/encyclopedie/terme/')) return 'encyclopedie-fiche';
  if (p === '/encyclopedie' || p.startsWith('/encyclopedie/')) return 'encyclopedie';
  // a page the bar does not know yet still gets Retour and Menu
  return 'autre';
}

/** the eight places of « Navigation générale », in the mockup's order (section 6), then « Premium à vie » (0.40) */
export interface MenuEntry {
  id: string;
  icon: NavIconId;
  label: string;
  to: string;
  /** a line under the label: the entry then takes a whole row of the grid (0.46, Encyclopédie) */
  hint?: string;
}
export const MENU_ENTRIES: readonly MenuEntry[] = [
  { id: 'accueil', icon: 'home', label: 'Accueil', to: '/' },
  { id: 'entrainer', icon: 'dumbbell', label: 'Entraîner', to: '/entrainer' },
  // 0.34 (Youssef, 2026-10-22): Progrès right after Entraîner
  { id: 'progres', icon: 'chart', label: 'Progrès', to: '/stats' },
  { id: 'techniques', icon: 'layers', label: 'Techniques', to: '/techniques' },
  { id: 'legendes', icon: 'star', label: 'Légendes', to: '/champions' },
  { id: 'profil', icon: 'user', label: 'Profil', to: '/profil' },
  { id: 'parametres', icon: 'settings', label: 'Paramètres', to: '/reglages' },
  // as in the mockup, Nouveautés opens in the same sheet (no page change)
  { id: 'nouveautes', icon: 'sparkle', label: 'Nouveautés', to: '' },
  // 0.40 (Youssef, « Préparation Freemium et Premium à vie » §8): a permanent way in, never a tab of the bar
  { id: 'premium', icon: 'diamond', label: 'Premium à vie', to: '/premium' },
  // 0.46 (« Encyclopédie du combat » §3): with the general resources, next to Profil and Premium; a full row with
  // its description keeps the 3 × 3 grid above it intact
  { id: 'encyclopedie', icon: 'book', label: 'Encyclopédie', to: '/encyclopedie', hint: 'Dictionnaire illustré des 6 disciplines' },
];
