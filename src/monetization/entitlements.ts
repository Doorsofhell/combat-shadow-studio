/**
 * v0.40 (Youssef, 2026-10-22, « Préparation Freemium et Premium à vie »): the single catalogue of the features that
 * will be Premium once payment exists. Only features that really exist in the app carry a marker; the others are
 * listed as planned so the future offer is written down in one place, and the Premium page shows them as « À venir ».
 *
 * Nothing here limits anything: see rights.ts (monetizationEnabled = false).
 */

export type EntitlementId =
  | 'unlimited_combos'
  | 'advanced_combo_builder'
  | 'advanced_techniques'
  | 'all_programs'
  | 'advanced_voice'
  | 'advanced_breakdown'
  | 'advanced_statistics'
  | 'full_history'
  | 'unlimited_favorites'
  | 'legends_collection'
  | 'all_disciplines'
  | 'all_fighters'
  | 'anime_rendering'
  | 'advanced_timer';

/** what exists in the app today */
export type Implementation = 'implemente' | 'partiel' | 'prevu';
/** how the right would be granted once payment is on */
export type RightKind = 'acces' | 'quota';
/** where the commercial decision stands */
export type Readiness = 'pret' | 'a-confirmer' | 'non-applicable';

export interface Entitlement {
  id: EntitlementId;
  name: string;
  description: string;
  /** the screens where the feature lives (routes) */
  screens: string[];
  implementation: Implementation;
  kind: RightKind;
  /** the free limit being considered, written for people; never applied while monetization is off */
  freeLimit: string;
  /** what the user gets today: always everything during the preparation phase */
  availableToday: string;
  readiness: Readiness;
  /** whether a marker is shown in the app (only for implemented features whose commercial choice is made) */
  marker: boolean;
}

const TODAY = 'Accessible à tous pendant la phase de préparation';

export const ENTITLEMENTS: readonly Entitlement[] = [
  {
    id: 'unlimited_combos',
    name: 'Enchaînements personnels illimités',
    description: 'Créer et garder autant d’enchaînements que tu veux.',
    screens: ['/createur', '/entrainer'],
    implementation: 'implemente',
    kind: 'quota',
    freeLimit: 'Un nombre limité d’enchaînements enregistrés (à fixer)',
    availableToday: TODAY,
    readiness: 'pret',
    marker: true,
  },
  {
    id: 'advanced_combo_builder',
    name: 'Analyse des enchaînements',
    description: 'L’analyse par critères (cohérence, fluidité, variété, défense, faisabilité) et ses recommandations.',
    screens: ['/createur/:id'],
    implementation: 'implemente',
    kind: 'acces',
    freeLimit: 'Création et exécution de base gratuites ; l’analyse détaillée réservée',
    availableToday: TODAY,
    readiness: 'pret',
    marker: true,
  },
  {
    id: 'advanced_techniques',
    name: 'Niveaux avancé et expert',
    description: 'Les exercices et combinaisons des niveaux avancé et expert de chaque discipline.',
    screens: ['/discipline/:id'],
    implementation: 'implemente',
    kind: 'acces',
    freeLimit: 'Niveaux débutant et intermédiaire gratuits',
    availableToday: TODAY,
    readiness: 'pret',
    marker: true,
  },
  {
    id: 'all_programs',
    name: 'Tous les programmes',
    description: 'Les programmes structurés sur plusieurs semaines, toutes disciplines.',
    screens: ['/programmes'],
    implementation: 'implemente',
    kind: 'acces',
    freeLimit: 'Un programme d’initiation par discipline (à fixer)',
    availableToday: TODAY,
    readiness: 'pret',
    marker: true,
  },
  {
    id: 'advanced_voice',
    name: 'Coaching vocal avancé',
    description: 'Les conseils techniques lus pendant la séance.',
    screens: ['/reglages/voix'],
    implementation: 'implemente',
    kind: 'acces',
    freeLimit: 'La voix du coach (départ, rounds, fin) gratuite',
    availableToday: TODAY,
    readiness: 'pret',
    marker: true,
  },
  {
    id: 'advanced_breakdown',
    name: 'Décomposition des mouvements',
    description: 'Le mode Décomposer : chaque technique phase par phase, au ralenti.',
    screens: ['/entrainement'],
    implementation: 'implemente',
    kind: 'acces',
    freeLimit: 'À fixer',
    availableToday: TODAY,
    readiness: 'pret',
    marker: true,
  },
  {
    id: 'advanced_statistics',
    name: 'Statistiques et comparaisons avancées',
    description: 'Le détail de l’activité et la comparaison avec la période précédente.',
    screens: ['/stats/activite'],
    implementation: 'implemente',
    kind: 'acces',
    freeLimit: 'Vue d’ensemble de Progrès gratuite',
    availableToday: TODAY,
    readiness: 'pret',
    marker: true,
  },
  {
    id: 'full_history',
    name: 'Historique complet',
    description: 'Toutes tes séances, sans limite de durée.',
    screens: ['/historique'],
    implementation: 'implemente',
    kind: 'quota',
    freeLimit: 'Les séances récentes (durée à fixer)',
    availableToday: TODAY,
    readiness: 'pret',
    marker: true,
  },
  {
    id: 'unlimited_favorites',
    name: 'Favoris illimités',
    description: 'Autant de techniques et d’exercices favoris que tu veux.',
    screens: ['/techniques'],
    implementation: 'implemente',
    kind: 'quota',
    freeLimit: 'Un nombre limité de favoris (à fixer)',
    availableToday: TODAY,
    readiness: 'pret',
    marker: true,
  },
  {
    id: 'legends_collection',
    name: 'Collection complète des légendes',
    description: 'Toutes les fiches de légendes et leurs combinaisons.',
    screens: ['/champions'],
    implementation: 'implemente',
    kind: 'acces',
    freeLimit: 'Une sélection de légendes (à fixer)',
    availableToday: TODAY,
    readiness: 'pret',
    marker: true,
  },
  {
    id: 'all_disciplines',
    name: 'Accès complet aux six disciplines',
    description: 'Les six disciplines au complet.',
    screens: ['/entrainer', '/discipline/:id'],
    implementation: 'implemente',
    kind: 'acces',
    freeLimit: 'À décider (quelles disciplines restent gratuites)',
    availableToday: TODAY,
    readiness: 'a-confirmer',
    marker: false,
  },
  {
    id: 'anime_rendering',
    name: 'Rendu Anime',
    description: 'Le rendu Anime des coachs 3D.',
    screens: ['/reglages/affichage'],
    implementation: 'implemente',
    kind: 'acces',
    freeLimit: 'Rendu Ultra-réaliste gratuit',
    availableToday: TODAY,
    readiness: 'a-confirmer',
    marker: false,
  },
  {
    id: 'all_fighters',
    name: 'Galerie complète des combattants',
    description: 'Les combattants supplémentaires, au-delà de Kadir et Amara.',
    screens: [],
    implementation: 'prevu',
    kind: 'acces',
    freeLimit: 'Kadir et Amara gratuits',
    availableToday: 'Pas encore développé',
    readiness: 'non-applicable',
    marker: false,
  },
  {
    id: 'advanced_timer',
    name: 'Réglages avancés du chronomètre',
    description: 'Des réglages au-delà de la durée des rounds et du repos.',
    screens: [],
    implementation: 'prevu',
    kind: 'acces',
    freeLimit: 'Durée des rounds et du repos gratuite',
    availableToday: 'Pas encore développé',
    readiness: 'non-applicable',
    marker: false,
  },
];

export const ENTITLEMENT_BY_ID: ReadonlyMap<EntitlementId, Entitlement> = new Map(ENTITLEMENTS.map((e) => [e.id, e]));

/**
 * The benefits listed on the Premium page, in Youssef's order (§7). A benefit is shown as available only when every
 * feature behind it exists; otherwise the page says « À venir ».
 */
export const PREMIUM_BENEFITS: readonly { label: string; features: EntitlementId[] }[] = [
  { label: 'Création illimitée d’enchaînements personnalisés', features: ['unlimited_combos', 'advanced_combo_builder'] },
  { label: 'Coaching 3D complet', features: ['advanced_breakdown', 'advanced_voice'] },
  { label: 'Toutes les disciplines et techniques', features: ['all_disciplines', 'advanced_techniques'] },
  { label: 'Tous les combattants et rendus', features: ['all_fighters', 'anime_rendering'] },
  { label: 'Tous les programmes et niveaux', features: ['all_programs', 'advanced_techniques'] },
  { label: 'Statistiques et comparaisons avancées', features: ['advanced_statistics'] },
  { label: 'Réglages avancés d’entraînement', features: ['advanced_timer'] },
  { label: 'Historique et favoris illimités', features: ['full_history', 'unlimited_favorites'] },
];

export const benefitAvailable = (b: { features: EntitlementId[] }) => b.features.every((f) => ENTITLEMENT_BY_ID.get(f)?.implementation === 'implemente');
