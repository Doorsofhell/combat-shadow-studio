import { describe, expect, it } from 'vitest';
import { masteryCount } from '../mastery';
import { techniquesFor } from '../techniques';

describe('maîtrise comptée dans Progrès', () => {
  const boxe = techniquesFor('boxe');
  it('ne compte que ce que l’utilisateur a marqué', () => {
    const c = masteryCount(boxe, { jab: 'acquise', direct: 'a-revoir', 'inconnue-xyz': 'acquise' });
    expect(c).toMatchObject({ total: boxe.length, acquises: 1, aRevoir: 1, autres: boxe.length - 2 });
    expect(c.aRevoirList.map((t) => t.id)).toEqual(['direct']);
  });
  it('rien de marqué : tout est « non évalué »', () => {
    expect(masteryCount(boxe, {})).toMatchObject({ acquises: 0, aRevoir: 0, autres: boxe.length });
  });
});
