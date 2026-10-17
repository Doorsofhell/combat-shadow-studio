import type { DisciplineId, LevelId } from '../types';

/**
 * Bibliothèque des combinaisons de champions : format des données (schéma 1).
 * Les données vivent dans public/catalog/catalog-v1.json, séparées du moteur d’animation : une
 * fiche ne référence que des identifiants de techniques (src/domain/techniques.ts).
 */
export const CATALOG_SCHEMA = 1;

/**
 * verifiee : observée dans un combat réel, avec référence et horodatage ;
 * adaptee : dérivée d’une séquence documentée (référence obligatoire) ;
 * inspiree : combinaison originale qui reprend des traits généraux du style du champion.
 */
export type CatalogStatus = 'verifiee' | 'adaptee' | 'inspiree';
export type CatalogGuard = 'orthodoxe' | 'gaucher' | 'les-deux';
export type CatalogDistance = 'longue' | 'moyenne' | 'courte' | 'corps-a-corps' | 'sol';
export type CatalogGoal = 'technique' | 'cardio' | 'puissance' | 'defense' | 'deplacement';

export interface CatalogSource {
  /** profil-style : traits généraux ; combat : séquence relevée dans un combat ; document : livre, vidéo pédagogique… */
  kind: 'profil-style' | 'combat' | 'document';
  note: string;
  /** combat ou document identifié (ex. « Titre du combat, date, organisation ») */
  reference?: string;
  /** moment dans la vidéo ou le round (ex. « R2 1:47 ») — obligatoire pour une fiche vérifiée */
  timestamp?: string;
  url?: string;
}

export interface CatalogVariant {
  label: string;
  /** séquence alternative facultative, validée comme la séquence principale */
  sequence?: string[];
}

export interface CatalogChampion {
  id: string;
  name: string;
  disciplines: DisciplineId[];
  /** garde habituelle, seulement lorsqu’elle est largement connue */
  stance?: 'orthodoxe' | 'gaucher' | 'alterne';
  /** description courte et générale du style */
  style: string;
  traits: string[];
  source: string;
}

export interface CatalogCombo {
  id: string;
  name: string;
  discipline: DisciplineId;
  champion: string;
  status: CatalogStatus;
  source: CatalogSource;
  guard: CatalogGuard;
  level: LevelId;
  distance: CatalogDistance;
  sequence: string[];
  objective: string;
  keyPoints: string[];
  errors: string[];
  /** durée d’une répétition à vitesse réelle, en secondes */
  estimatedSec: number;
  variants: CatalogVariant[];
  goal: CatalogGoal;
  tags: string[];
  /** date de version (AAAA-MM-JJ) */
  addedAt: string;
}

export interface CatalogFile {
  schema: number;
  version: string;
  updatedAt: string;
  champions: CatalogChampion[];
  combos: CatalogCombo[];
}

/** catalogue prêt à l’emploi : base + fiches importées, avec index */
export interface Catalog extends CatalogFile {
  comboById: Map<string, CatalogCombo>;
  championById: Map<string, CatalogChampion>;
  /** identifiants des fiches venant d’un import utilisateur */
  imported: Set<string>;
}

export const STATUS_LABEL: Record<CatalogStatus, string> = {
  verifiee: 'Vérifiée',
  adaptee: 'Adaptée',
  inspiree: 'Inspirée',
};

export const STATUS_HELP: Record<CatalogStatus, string> = {
  verifiee: 'Séquence observée dans un combat réel : la référence du combat et le moment exact sont indiqués.',
  adaptee: 'Séquence dérivée d’un enchaînement documenté (combat ou source pédagogique citée), adaptée au travail solo.',
  inspiree:
    'Combinaison originale qui reprend des traits généraux et largement connus du style du champion. Ce n’est pas une séquence qu’il a réellement exécutée en combat.',
};

export const GUARD_LABEL: Record<CatalogGuard, string> = { orthodoxe: 'Orthodoxe', gaucher: 'Gaucher', 'les-deux': 'Les deux gardes' };
export const STANCE_LABEL: Record<NonNullable<CatalogChampion['stance']>, string> = { orthodoxe: 'Orthodoxe', gaucher: 'Gaucher', alterne: 'Change de garde' };
export const DISTANCE_LABEL: Record<CatalogDistance, string> = { longue: 'Longue', moyenne: 'Moyenne', courte: 'Courte', 'corps-a-corps': 'Corps à corps', sol: 'Sol' };
export const GOAL_LABEL: Record<CatalogGoal, string> = { technique: 'Technique', cardio: 'Cardio', puissance: 'Puissance', defense: 'Défense', deplacement: 'Déplacement' };

export const TAG_LABEL: Record<string, string> = {
  offensif: 'Attaque',
  'defense-contre': 'Défense et contre',
  angle: 'Changement d’angle',
  deplacement: 'Déplacement',
  corps: 'Travail au corps',
  feinte: 'Feinte',
  'poings-pieds': 'Poings-pieds',
  pieds: 'Coups de pied',
  genoux: 'Genoux',
  coudes: 'Coudes',
  clinch: 'Clinch',
  'changement-niveau': 'Changement de niveau',
  'defense-lutte': 'Défense de lutte',
  sol: 'Transition sol',
  cardio: 'Cardio',
  uppercut: 'Uppercuts',
  'low-kick': 'Low kick',
  'middle-kick': 'Middle kick',
  'high-kick': 'High kick',
  teep: 'Teep / front kick',
  check: 'Check',
};

export const tagLabel = (t: string) => TAG_LABEL[t] ?? t;
