import { FighterLook, Paint, defaultLook } from '../../editor/look';

/**
 * Fixed appearance of the champion-inspired coaches. The body and face come from each coach's own
 * model (tools/generator/coaches/recipes); skin, hair, beard and outfit use the fighter look format, so
 * the clothes keep the v0.23 dressing (drape, hems, layers). Nothing here is editable by the user.
 */
const paint = (color: string, color2 = color, pattern: Paint['pattern'] = 'uni'): Paint => ({ color, color2, pattern });

function look(sex: 'homme' | 'femme', f: (l: FighterLook) => void): FighterLook {
  const l = defaultLook(sex);
  f(l);
  return l;
}

export const COACH_LOOKS: Record<string, FighterLook> = {
  'mma-kadir': look('homme', (l) => {
    l.skin = '#c4906f';
    l.eyes = '#3a281c';
    l.hair = { style: 'court', color: '#17110d', length: 0.12, meches: 1, flow: 0.25 };
    l.beard = { style: 'pleine', color: '#17110d' };
    l.bodyHair = 0.35;
    l.outfit = { ...l.outfit, bottom: 'short-mma-court', bottomPaint: paint('#141518'), top: 'aucun', shoes: 'pieds-nus' };
    l.gear = { ...l.gear, hands: 'gants-mma', handsPaint: paint('#16171a', '#2a2b30') };
  }),
  'mma-amara': look('femme', (l) => {
    l.skin = '#8a5a3c';
    l.eyes = '#2b1b12';
    l.hair = { style: 'degrade', color: '#1b130f', length: 0.45, meches: 0.65, flow: 0.3 };
    l.beard = { style: 'aucune', color: '#1b130f' };
    l.outfit = {
      ...l.outfit,
      bottom: 'short-mma-court',
      bottomPaint: paint('#141518', '#1f5d3a', 'bande'),
      top: 'brassiere',
      topPaint: paint('#141518'),
      shoes: 'pieds-nus',
    };
    l.gear = { ...l.gear, hands: 'gants-mma', handsPaint: paint('#16171a', '#2a2b30') };
  }),
  // 1.5, MakeHuman coaches (tools/generator/makehuman): tanned skin, buzz cut, tribal tattoo painted in the skin
  axel: look('homme', (l) => {
    l.skin = '#b98563';
    l.eyes = '#3a2416';
    l.hair = { style: 'rase', color: '#1c140f', length: 0.05, meches: 0.4, flow: 0.1 };
    l.beard = { style: 'aucune', color: '#1c140f' };
    l.bodyHair = 0.1;
    l.outfit = { ...l.outfit, bottom: 'short-mma-court', bottomPaint: paint('#141518', '#b3122a', 'bande'), top: 'aucun', shoes: 'pieds-nus' };
    l.gear = { ...l.gear, hands: 'gants-mma', handsPaint: paint('#16171a', '#b3122a') };
  }),
  // fair skin, blond braid pulled back tight
  kaila: look('femme', (l) => {
    l.skin = '#e2bfa3';
    l.eyes = '#4f7b78';
    l.hair = { style: 'tresses', color: '#c9a66b', length: 0.5, meches: 0.6, flow: 0.15 };
    l.beard = { style: 'aucune', color: '#c9a66b' };
    l.outfit = {
      ...l.outfit,
      bottom: 'short-mma-court',
      bottomPaint: paint('#141518', '#d4af37', 'bande'),
      top: 'brassiere',
      topPaint: paint('#141518'),
      shoes: 'pieds-nus',
    };
    l.gear = { ...l.gear, hands: 'gants-mma', handsPaint: paint('#16171a', '#d4af37') };
  }),
};
