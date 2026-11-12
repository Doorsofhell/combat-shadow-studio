import type { BeardStyle, BottomType, FeetGearType, HairStyle, HandsType, HeadType, Pattern, ShinsType, ShoesType, TattooZone, TopType } from '../../../editor/look';
import { BEARD_STYLES, BOTTOMS, FEET_GEAR, HAIR_STYLES, HANDS, HEADS, PATTERNS, SHINS, SHOES, TATTOO_ZONES, TOPS } from '../../../editor/normalize';
import type { OptionItem } from '../../components';

/** French labels of every option (Record: the compiler flags a missing one) */
export const PATTERN_LABEL: Record<Pattern, string> = {
  uni: 'Uni',
  bande: 'Bande',
  'deux-tons': 'Deux tons',
  carreaux: 'Carreaux',
  camouflage: 'Camouflage',
  flammes: 'Flammes',
};
export const ZONE_LABEL: Record<TattooZone, string> = {
  'bras-gauche': 'Bras gauche',
  'bras-droit': 'Bras droit',
  'avant-bras-gauche': 'Avant-bras gauche',
  'avant-bras-droit': 'Avant-bras droit',
  'epaule-gauche': 'Épaule gauche',
  'epaule-droite': 'Épaule droite',
  poitrine: 'Poitrine',
  ventre: 'Ventre',
  dos: 'Dos',
  'cuisse-gauche': 'Cuisse gauche',
  'cuisse-droite': 'Cuisse droite',
  'mollet-gauche': 'Mollet gauche',
  'mollet-droit': 'Mollet droit',
};
export const BOTTOM_LABEL: Record<BottomType, string> = {
  'short-boxe': 'Short de boxe',
  'short-mma': 'Short MMA',
  'short-mma-court': 'Short MMA court',
  'short-thai': 'Short thaï',
  'short-compression': 'Cuissard',
  legging: 'Legging',
  aucun: 'Aucun',
};
export const TOP_LABEL: Record<TopType, string> = {
  aucun: 'Torse nu',
  'rashguard-court': 'Rashguard courte',
  'rashguard-long': 'Rashguard longue',
  tshirt: 'T-shirt',
  debardeur: 'Débardeur',
  brassiere: 'Brassière',
  compression: 'Compression',
};
export const SHOES_LABEL: Record<ShoesType, string> = {
  'pieds-nus': 'Pieds nus',
  'chaussures-boxe': 'Chaussures de boxe',
  'chaussons-mma': 'Chaussons MMA',
};
export const HANDS_LABEL: Record<HandsType, string> = {
  aucun: 'Mains nues',
  bandes: 'Bandes',
  'sous-gants': 'Sous-gants',
  'gants-boxe': 'Gants de boxe',
  'gants-mma': 'Gants MMA',
};
export const SHINS_LABEL: Record<ShinsType, string> = {
  aucun: 'Aucun',
  'tibias-thai': 'Protège-tibias thaï',
  'tibias-mma': 'Protège-tibias MMA',
};
export const FEET_LABEL: Record<FeetGearType, string> = {
  aucun: 'Aucun',
  chevillères: 'Chevillères',
  'protege-pieds': 'Protège-pieds',
};
export const HEAD_LABEL: Record<HeadType, string> = {
  aucun: 'Aucun',
  'casque-ouvert': 'Casque ouvert',
  'casque-joues': 'Casque à joues',
  'casque-barre': 'Casque à barre',
};
export const HAIR_LABEL: Record<HairStyle, string> = {
  rase: 'Rasé',
  court: 'Court',
  degrade: 'Dégradé',
  crete: 'Crête',
  chignon: 'Chignon',
  queue: 'Queue-de-cheval',
  tresses: 'Tresses',
  afro: 'Afro',
};
export const BEARD_LABEL: Record<BeardStyle, string> = {
  aucune: 'Aucune',
  ombre: 'Ombre',
  courte: 'Courte',
  pleine: 'Pleine',
  bouc: 'Bouc',
  moustache: 'Moustache',
};

const opts = <T extends string>(ids: readonly T[], labels: Record<T, string>): OptionItem<T>[] => ids.map((id) => ({ id, label: labels[id] }));

export const PATTERN_OPTS = opts(PATTERNS, PATTERN_LABEL);
export const ZONE_OPTS = opts(TATTOO_ZONES, ZONE_LABEL);
export const BOTTOM_OPTS = opts(BOTTOMS, BOTTOM_LABEL);
export const TOP_OPTS = opts(TOPS, TOP_LABEL);
export const SHOES_OPTS = opts(SHOES, SHOES_LABEL);
export const HANDS_OPTS = opts(HANDS, HANDS_LABEL);
export const SHINS_OPTS = opts(SHINS, SHINS_LABEL);
export const FEET_OPTS = opts(FEET_GEAR, FEET_LABEL);
export const HEAD_OPTS = opts(HEADS, HEAD_LABEL);
export const HAIR_OPTS = opts(HAIR_STYLES, HAIR_LABEL);
export const BEARD_OPTS = opts(BEARD_STYLES, BEARD_LABEL);
