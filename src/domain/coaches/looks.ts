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
};
