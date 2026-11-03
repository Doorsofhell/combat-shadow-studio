import { describe, expect, it } from 'vitest';
import { askCoach } from '../../../coach/engine';
import { looksLikeQuestion } from '../SearchSheet';

// 1.7.0 (proposition A « Réponse du coach en tête »): a question gets the coach's answer at the top of the search
describe('recherche : réponse du coach en tête', () => {
  it('reconnaît une question', () => {
    for (const q of ['Comment corriger mon jab ?', 'comment corriger mon jab quand je fatigue', 'Pourquoi tourner le pied', 'quel exercice pour le cardio', 'c’est quoi un teep', 'Que signifient les statuts ?', 'montre-moi le crochet', 'garde ?'])
      expect(looksLikeQuestion(q), q).toBe(true);
  });
  it('un simple mot ne déclenche pas le coach tout seul', () => {
    for (const q of ['garde', 'Favoris', 'Voix et sons', 'Wai kru', 'low kick', 'jab']) expect(looksLikeQuestion(q), q).toBe(false);
  });
  it('le coach local répond à la question d’exemple, avec une fiche à ouvrir', () => {
    const a = askCoach('Comment corriger mon jab ?', { discipline: 'boxe', level: 'debutant', guard: 'orthodoxe' } as Parameters<typeof askCoach>[1]);
    expect(a.text.length).toBeGreaterThan(40);
    expect(a.engine).toBe('base-locale');
    expect(a.actions.length).toBeGreaterThan(0);
  });
});
