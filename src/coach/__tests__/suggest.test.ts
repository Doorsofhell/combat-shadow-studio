import { describe, expect, it } from 'vitest';
import { TECHNIQUES } from '../../domain/techniques';
import { askCoach } from '../engine';
import { answersWell, suggestedQuestions } from '../suggest';

const ctx = (techniqueId: string, discipline = TECHNIQUES.find((t) => t.id === techniqueId)!.disciplines[0]) => ({ discipline, level: 'debutant' as const, guard: 'orthodoxe' as const, techniqueId });

describe('questions suggérées du coach IA', () => {
  it('au moins 4 questions par technique, dans chaque discipline où elle apparaît', () => {
    for (const t of TECHNIQUES)
      for (const d of t.disciplines) expect(suggestedQuestions(ctx(t.id, d), 8).length, `${t.id} ${d}`).toBeGreaterThanOrEqual(4);
  });

  it('chaque question suggérée reçoit une vraie réponse du moteur local', () => {
    for (const t of TECHNIQUES) {
      const c = ctx(t.id);
      for (const q of suggestedQuestions(c, 8)) {
        const a = askCoach(q, c);
        expect(a.confidence, `${t.id} : ${q}`).toBeGreaterThanOrEqual(0.5);
        expect(['unknown', 'off_topic']).not.toContain(a.intent);
      }
    }
  });

  it('direct arrière en MMA : les questions du pratiquant, sur le pied, la hanche, la garde et l’équilibre', () => {
    const qs = suggestedQuestions(ctx('direct', 'mma'), 8);
    for (const q of ['Comment bien pivoter mon pied arrière ?', 'Comment utiliser ma hanche pour frapper ?', 'Où placer ma main avant ?', 'Comment éviter de perdre l’équilibre ?', 'Comment revenir rapidement en garde ?', 'Quelle est la différence entre jab et direct ?'])
      expect(qs).toContain(q);
    expect(qs[0]).toBe('Comment bien pivoter mon pied arrière ?');
    expect(qs.join(' ')).not.toMatch(/crochet gauche|cross/i);
  });

  it('sprawl : jambes, hanches, appuis et retour en garde', () => {
    const qs = suggestedQuestions(ctx('sprawl', 'mma'), 8).join(' ');
    for (const w of ['jambes', 'hanches', 'appuis', 'en garde']) expect(qs).toContain(w);
  });

  it('les questions changent avec la technique', () => {
    expect(suggestedQuestions(ctx('jab'))).not.toEqual(suggestedQuestions(ctx('middle-kick-arriere')));
  });

  it('une réponse hors sujet n’est jamais comptée comme bonne', () => {
    expect(answersWell(askCoach('Quel temps fait-il demain ?', ctx('jab')), 'tech:jab')).toBe(false);
  });

  it('les articles du moteur ignorent les accents (« la défense », pas « le défense »)', () => {
    expect(suggestedQuestions(ctx('defense-lutte', 'mma'), 8).join(' ')).not.toMatch(/le défense/);
  });
});
