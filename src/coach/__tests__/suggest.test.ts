import { describe, expect, it } from 'vitest';
import { TECHNIQUES } from '../../domain/techniques';
import { askCoach } from '../engine';
import type { CoachScreen } from '../appGuide';
import { SCREEN_QUESTIONS, answersWell, suggestedQuestions } from '../suggest';

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

  it('selon l’écran : d’abord 1 ou 2 questions sur l’écran, toutes bien répondues', () => {
    for (const [screen, list] of Object.entries(SCREEN_QUESTIONS) as [CoachScreen, { q: string; expect: string }[]][]) {
      expect(list.length, screen).toBeGreaterThanOrEqual(1);
      expect(list.length, screen).toBeLessThanOrEqual(2);
      const c = { discipline: 'boxe' as const, level: 'debutant' as const, guard: 'orthodoxe' as const, screen };
      const qs = suggestedQuestions(c, 8);
      expect(qs.slice(0, list.length), screen).toEqual(list.map((x) => x.q));
      for (const x of list) {
        const a = askCoach(x.q, c);
        expect(answersWell(a, x.expect), `${screen} : ${x.q} → ${a.sources.map((s) => s.id).join(',')}`).toBe(true);
        expect(a.intent).toBe('app_help');
      }
    }
  });

  it('fiche technique : la question sur l’écran, puis celles sur la technique', () => {
    const qs = suggestedQuestions({ ...ctx('jab'), screen: 'technique' }, 6);
    expect(qs[0]).toBe('Comment marquer cette technique comme assimilée ?');
    expect(qs.length).toBe(6);
    expect(qs.slice(1)).toEqual(suggestedQuestions(ctx('jab'), 5));
    for (const q of qs) {
      const a = askCoach(q, { ...ctx('jab'), screen: 'technique' });
      expect(a.confidence, q).toBeGreaterThanOrEqual(0.5);
      expect(['unknown', 'off_topic']).not.toContain(a.intent);
    }
  });

  it('entraînement : la question sur le studio n’écarte pas les questions du pratiquant', () => {
    const qs = suggestedQuestions({ ...ctx('direct', 'mma'), screen: 'entrainement' }, 8);
    expect(qs[0]).toBe('À quoi sert le bouton Décomposer ?');
    for (const q of ['Comment bien pivoter mon pied arrière ?', 'Comment utiliser ma hanche pour frapper ?', 'Où placer ma main avant ?', 'Comment éviter de perdre l’équilibre ?', 'Comment revenir rapidement en garde ?', 'Quelle est la différence entre jab et direct ?'])
      expect(qs).toContain(q);
  });

  it('les questions sur une technique ne dépendent pas de l’écran', () => {
    for (const t of TECHNIQUES.slice(0, 20))
      for (const screen of ['accueil', 'technique', 'progres', 'entrainement'] as const) {
        const c = { ...ctx(t.id), screen };
        for (const q of suggestedQuestions(ctx(t.id), 8)) expect(askCoach(q, c).intent, `${t.id} ${screen} : ${q}`).not.toBe('app_help');
      }
  });
});
