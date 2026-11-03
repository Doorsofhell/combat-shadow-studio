import { describe, expect, it } from 'vitest';
import { SEARCH_GROUPS, searchApp } from '../search';

// 1.0.0 (refonte, lot 3): « Rechercher ou demander au coach »
describe('recherche dans l’application', () => {
  it('rien en dessous de deux lettres', () => {
    expect(searchApp('')).toEqual([]);
    expect(searchApp('j')).toEqual([]);
  });
  it('trouve une technique sans tenir compte des accents ni des majuscules', () => {
    const hits = searchApp('JAB');
    expect(hits[0]).toMatchObject({ group: 'Techniques', to: '/techniques/jab' });
    expect(searchApp('crochet').some((h) => h.group === 'Techniques' && /Crochet/.test(h.label))).toBe(true);
  });
  it('trouve un terme de l’encyclopédie par son nom international', () => {
    expect(searchApp('wai kru').some((h) => h.group === 'Encyclopédie')).toBe(true);
  });
  it('trouve les réglages avec les mots de tous les jours', () => {
    expect(searchApp('volume').map((h) => h.to)).toContain('/reglages/voix');
    expect(searchApp('mode nuit').map((h) => h.to)).toContain('/reglages');
    expect(searchApp('chronometre').map((h) => h.to)).toContain('/chrono');
  });
  it('groupes dans l’ordre, quatre résultats au plus par groupe, aucun doublon', () => {
    const hits = searchApp('ga');
    const groups = [...new Set(hits.map((h) => h.group))];
    expect(groups).toEqual(SEARCH_GROUPS.filter((g) => groups.includes(g)));
    for (const g of groups) expect(hits.filter((h) => h.group === g).length).toBeLessThanOrEqual(4);
    expect(new Set(hits.map((h) => h.to)).size).toBe(hits.length);
  });
  it('une phrase qui ne correspond à rien ne renvoie rien (le Coach IA peut répondre)', () => {
    expect(searchApp('comment corriger mon jab quand je fatigue')).toEqual([]);
  });
});
