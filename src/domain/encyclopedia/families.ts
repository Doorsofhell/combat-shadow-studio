import type { Family, FamilyId } from './types';

/** the eight families of §4, in the order of the mockup; a term belongs to exactly one */
export const FAMILIES: readonly Family[] = [
  {
    id: 'techniques',
    label: 'Techniques',
    short: 'Coups, défenses, projections, soumissions',
    image: 'famille-techniques',
    subfamilies: [
      { id: 'poings', label: 'Coups de poing' },
      { id: 'pieds', label: 'Coups de pied' },
      { id: 'genoux', label: 'Coups de genou' },
      { id: 'coudes', label: 'Coups de coude' },
      { id: 'defenses', label: 'Parades, blocages et esquives' },
      { id: 'feintes', label: 'Feintes' },
      { id: 'amenees', label: 'Amenées au sol et défenses' },
      { id: 'projections', label: 'Projections' },
      { id: 'sol', label: 'Travail au sol et échappements' },
      { id: 'soumissions', label: 'Immobilisations et soumissions' },
    ],
  },
  {
    id: 'positions',
    label: 'Positions et déplacements',
    short: 'Gardes, postures, déplacements',
    image: 'famille-positions',
    subfamilies: [
      { id: 'gardes', label: 'Gardes et postures debout' },
      { id: 'deplacements', label: 'Déplacements et pivots' },
      { id: 'clinch', label: 'Clinch et saisies' },
      { id: 'sol', label: 'Positions au sol' },
    ],
  },
  {
    id: 'equipements',
    label: 'Équipements',
    short: 'Protections, tenues, matériel',
    image: 'famille-equipements',
    subfamilies: [
      { id: 'mains', label: 'Gants et bandes' },
      { id: 'protections', label: 'Protections' },
      { id: 'tenues', label: 'Tenues' },
      { id: 'materiel', label: 'Matériel d’entraînement' },
    ],
  },
  {
    id: 'lieux',
    label: 'Lieux et surfaces',
    short: 'Ring, cage, tatami, dojo',
    image: 'famille-lieux',
    subfamilies: [
      { id: 'aires', label: 'Aires de combat' },
      { id: 'elements', label: 'Éléments et zones' },
      { id: 'salles', label: 'Salles d’entraînement' },
    ],
  },
  {
    id: 'regles',
    label: 'Règles et arbitrage',
    short: 'Points, pénalités, compétitions',
    image: 'famille-regles',
    subfamilies: [
      { id: 'deroulement', label: 'Déroulement et formats' },
      { id: 'victoires', label: 'Manières de gagner' },
      { id: 'notation', label: 'Notation et points' },
      { id: 'penalites', label: 'Fautes et pénalités' },
      { id: 'officiels', label: 'Officiels' },
    ],
  },
  {
    id: 'preparation',
    label: 'Préparation physique',
    short: 'Entraînement, conditionnement',
    image: 'famille-preparation',
    subfamilies: [
      { id: 'methodes', label: 'Méthodes d’entraînement' },
      { id: 'seance', label: 'Organisation de la séance' },
    ],
  },
  {
    id: 'securite',
    label: 'Anatomie et sécurité',
    short: 'Zones du corps, prévention',
    image: 'famille-securite',
    subfamilies: [
      { id: 'chutes', label: 'Chutes et abandon' },
      { id: 'prevention', label: 'Prévention' },
      { id: 'corps', label: 'Zones du corps' },
    ],
  },
  {
    id: 'culture',
    label: 'Culture et vocabulaire',
    short: 'Grades, traditions, termes et histoire',
    image: 'famille-culture',
    subfamilies: [
      { id: 'grades', label: 'Grades et ceintures' },
      { id: 'traditions', label: 'Saluts et traditions' },
      { id: 'roles', label: 'Pratiquants et enseignants' },
      { id: 'histoire', label: 'Histoire et organisations' },
    ],
  },
];

export const FAMILY_BY_ID = new Map<FamilyId, Family>(FAMILIES.map((f) => [f.id, f]));

export const subfamilyLabel = (family: FamilyId, sub: string): string =>
  FAMILY_BY_ID.get(family)?.subfamilies.find((s) => s.id === sub)?.label ?? sub;
