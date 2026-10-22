import { describe, expect, it } from 'vitest';
import { ANALYSIS_VERSION, WEIGHTS, analyseCombo, analysisState, comboHash, sideOf } from '../comboAnalysis';
import { TECHNIQUE_BY_ID } from '../techniques';

// 0.38 (Youssef, 2026-10-22, « Créateur d'enchaînements V2 »): a local, explainable, deterministic analysis
describe('analyse locale d’un enchaînement', () => {
  it('déterministe : le même enchaînement donne toujours le même résultat', () => {
    const a = analyseCombo('boxe', ['jab', 'direct', 'crochet-avant']);
    const b = analyseCombo('boxe', ['jab', 'direct', 'crochet-avant']);
    expect(a).toEqual(b);
  });

  it('la note est la moyenne pondérée des cinq critères, poids 25/20/15/20/20', () => {
    expect(Object.values(WEIGHTS).reduce((x, y) => x + y, 0)).toBeCloseTo(1);
    for (const [d, seq] of [
      ['boxe', ['jab', 'direct', 'crochet-avant', 'esquive-droite']],
      ['mma', ['jab', 'sprawl']],
      ['judo', ['kuzushi', 'uchikomi-seoi']],
      ['bjj', ['descente-sol', 'sortie-hanche', 'releve-technique']],
    ] as const) {
      const a = analyseCombo(d, [...seq]);
      expect(a.criteria.map((c) => c.id)).toEqual(['coherence', 'fluidite', 'variete', 'defense', 'faisabilite']);
      expect(a.score).toBe(Math.round(a.criteria.reduce((s, c) => s + c.score * c.weight, 0)));
      for (const c of a.criteria) {
        expect(c.score).toBeGreaterThanOrEqual(0);
        expect(c.score).toBeLessThanOrEqual(100);
        expect(c.detail.length).toBeGreaterThan(10);
      }
    }
  });

  it('dit qu’elle n’est pas générative et donne ses limites', () => {
    const a = analyseCombo('boxe', ['jab']);
    expect(a.explanation).toMatch(/pas par une intelligence artificielle générative/);
    expect(a.explanation).toMatch(/règles fixes/);
    expect(a.limits.length).toBeGreaterThanOrEqual(2);
    expect(a.limits.join(' ')).toMatch(/ne te voit pas/);
    expect(a.version).toBe(ANALYSIS_VERSION);
  });

  it('un enchaînement impossible perd des points de cohérence et l’explique', () => {
    const ok = analyseCombo('mma', ['descente-sol', 'releve-technique']);
    const ko = analyseCombo('mma', ['jab', 'releve-technique']);
    expect(ok.criteria[0].score).toBe(100);
    expect(ko.criteria[0].score).toBeLessThanOrEqual(60);
    expect(ko.recommendations.join(' ')).toMatch(/Mouvement 2/);
    expect(ko.score).toBeLessThan(ok.score + 40);
  });

  it('frappe : finir par une défense ou un déplacement vaut mieux que rester exposé', () => {
    const exposed = analyseCombo('boxe', ['jab', 'direct', 'crochet-avant']);
    const covered = analyseCombo('boxe', ['jab', 'direct', 'crochet-avant', 'esquive-droite']);
    const d = (a: typeof exposed) => a.criteria.find((c) => c.id === 'defense')!;
    expect(d(exposed).label).toBe('Défense et sortie');
    expect(d(covered).score).toBe(100);
    expect(d(exposed).score).toBeLessThan(d(covered).score);
    // the recommendation names a real technique of the discipline
    expect(exposed.recommendations.join(' ')).toMatch(/« Esquive|« Retrait|« Pas/);
  });

  it('adaptée à la discipline : judo (équilibre, déséquilibre avant projection), JJB (protection au sol)', () => {
    const judo = analyseCombo('judo', ['uchikomi-seoi']);
    expect(judo.criteria[3].label).toBe('Équilibre et sécurité');
    const prepared = analyseCombo('judo', ['kuzushi', 'uchikomi-seoi', 'tsugi-ashi-arriere']);
    const unprepared = analyseCombo('judo', ['tsugi-ashi-avant', 'uchikomi-o-goshi', 'uchikomi-seoi', 'tsugi-ashi-arriere']);
    expect(prepared.criteria[1].score).toBeGreaterThan(unprepared.criteria[1].score);
    expect(unprepared.recommendations.join(' ')).toMatch(/déséquilibre/);
    const bjj = analyseCombo('bjj', ['descente-sol', 'sortie-hanche', 'releve-technique']);
    expect(bjj.criteria[3].label).toBe('Protection au sol');
    expect(bjj.criteria[3].score).toBe(100);
  });

  it('fluidité : alterner avant / arrière est plus fluide que deux frappes arrière de suite', () => {
    const alt = analyseCombo('boxe', ['jab', 'direct', 'crochet-avant']);
    const rear = analyseCombo('boxe', ['direct', 'crochet-arriere', 'uppercut-arriere']);
    expect(alt.criteria[1].score).toBe(100);
    expect(rear.criteria[1].score).toBeLessThan(alt.criteria[1].score);
    expect(sideOf(TECHNIQUE_BY_ID.get('jab')!)).toBe('avant');
    expect(sideOf(TECHNIQUE_BY_ID.get('direct')!)).toBe('arriere');
    expect(sideOf(TECHNIQUE_BY_ID.get('low-kick-arriere')!)).toBe('arriere');
    expect(sideOf(TECHNIQUE_BY_ID.get('pas-avant')!)).toBeNull();
  });

  it('variété et longueur sont mesurées, pas devinées', () => {
    const same = analyseCombo('boxe', ['jab', 'jab', 'jab', 'jab']);
    const varied = analyseCombo('boxe', ['jab', 'direct', 'esquive-droite', 'pas-arriere']);
    expect(same.criteria[2].score).toBeLessThan(varied.criteria[2].score);
    expect(analyseCombo('boxe', ['jab']).criteria[4].score).toBeLessThan(varied.criteria[4].score);
    const long = analyseCombo('boxe', Array.from({ length: 10 }, (_, i) => (i % 2 ? 'direct' : 'jab')));
    expect(long.recommendations.join(' ')).toMatch(/Découpe/);
  });
});

describe('validité d’une analyse enregistrée', () => {
  it('le hash change avec la discipline, l’ordre ou les mouvements', () => {
    const h = comboHash('boxe', ['jab', 'direct']);
    expect(comboHash('boxe', ['jab', 'direct'])).toBe(h);
    expect(comboHash('boxe', ['direct', 'jab'])).not.toBe(h);
    expect(comboHash('mma', ['jab', 'direct'])).not.toBe(h);
    expect(comboHash('boxe', ['jab'])).not.toBe(h);
  });
  it('« Non analysé » sans analyse, « à refaire » si les mouvements ou les règles ont changé', () => {
    const a = analyseCombo('boxe', ['jab', 'direct']);
    const stored = { hash: a.hash, version: a.version, at: '2026-10-22T20:00:00Z', score: a.score };
    expect(analysisState({ discipline: 'boxe', sequence: ['jab', 'direct'] })).toBe('none');
    expect(analysisState({ discipline: 'boxe', sequence: ['jab', 'direct'], analysis: stored })).toBe('ok');
    expect(analysisState({ discipline: 'boxe', sequence: ['jab', 'direct', 'jab'], analysis: stored })).toBe('stale');
    expect(analysisState({ discipline: 'boxe', sequence: ['jab', 'direct'], analysis: { ...stored, version: 0 } })).toBe('stale');
  });
});
