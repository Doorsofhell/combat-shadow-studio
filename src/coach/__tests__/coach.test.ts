import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { EXERCISE_BY_ID } from '../../domain/exercises';
import { TECHNIQUE_BY_ID } from '../../domain/techniques';
import { buildCatalog } from '../../domain/catalog/loader';
import type { CatalogFile } from '../../domain/catalog/types';
import { askCoach, type CoachAnswer, type CoachContext } from '../engine';
import { knowledgeBase } from '../knowledge';
import { acceptLlmOutput, askCoachAsync, type LlmEngine } from '../llm';
import { findTechniques, parseQuestion } from '../nlu';
import { getSpeechInput, detectSpeechCapabilities } from '../speech';
import { normalize } from '../text';
import { useCoachAi } from '../../store/coachAi';

const catalog = buildCatalog(JSON.parse(readFileSync(resolve(process.cwd(), 'public/catalog/catalog-v1.json'), 'utf8')) as CatalogFile);

const ctx = (p: Partial<CoachContext> = {}): CoachContext => ({ pseudo: 'Yasmine', discipline: 'kickboxing', level: 'debutant', guard: 'orthodoxe', goals: [], ...p });

/** toutes les actions ne référencent que des identifiants existants */
function expectValidActions(a: CoachAnswer) {
  for (const x of a.actions) {
    if (x.type === 'start-exercise') expect(EXERCISE_BY_ID.has(x.exerciseId), x.exerciseId).toBe(true);
    else if (x.type === 'start-combo') expect(catalog.comboById.has(x.comboId), x.comboId).toBe(true);
    else expect(TECHNIQUE_BY_ID.has(x.techniqueId), x.techniqueId).toBe(true);
    expect(x.label.length).toBeGreaterThan(0);
  }
  if (a.techniqueId) expect(TECHNIQUE_BY_ID.has(a.techniqueId)).toBe(true);
  for (const s of a.sources) if (!['faq', 'exercice', 'catalogue'].includes(s.source)) expect(TECHNIQUE_BY_ID.has(s.source), s.source).toBe(true);
}

/** aucune affirmation de voir l’utilisateur */
function expectNoSeeingClaim(text: string) {
  const t = normalize(text);
  for (const f of ['je te vois', 'je vois que tu', 'je t ai vu', 'tu fais bien', 'ta posture est bonne']) expect(t.includes(f), f).toBe(false);
}

describe('base de connaissances', () => {
  test('une entrée par technique et une FAQ qui ne cite que des techniques existantes', () => {
    const kb = knowledgeBase();
    expect(kb.filter((e) => e.source !== 'faq').length).toBe(TECHNIQUE_BY_ID.size);
    for (const e of kb) {
      expect(e.id && e.title && e.text).toBeTruthy();
      if (e.source !== 'faq') expect(TECHNIQUE_BY_ID.has(e.source)).toBe(true);
      for (const r of e.related) expect(TECHNIQUE_BY_ID.has(r)).toBe(true);
    }
    for (const id of ['faq:pivot-pied-arriere', 'faq:rotation-hanches', 'faq:garde', 'faq:deplacements', 'faq:equilibre-pieds', 'faq:respiration', 'faq:menton', 'faq:retour-garde', 'faq:jab-direct', 'faq:crochet-uppercut', 'faq:teep', 'faq:genoux', 'faq:coudes', 'faq:sprawl', 'faq:echauffement', 'faq:repos', 'faq:douleur'])
      expect(kb.some((e) => e.id === id), id).toBe(true);
  });
});

describe('compréhension (NLU)', () => {
  test('synonymes et normalisation', () => {
    expect(findTechniques(normalize('Le CROSS et le Jab')).techniques).toEqual(['direct', 'jab']);
    expect(findTechniques(normalize('droit arrière')).techniques).toEqual(['direct']);
    expect(findTechniques(normalize('coup de pied circulaire au corps')).techniques).toEqual(['middle-kick-arriere']);
    expect(findTechniques(normalize('mon crochet gauche')).techniques).toEqual(['crochet-avant']);
    expect(findTechniques(normalize('Uppercut droit')).techniques).toEqual(['uppercut-arriere']);
    expect(findTechniques(normalize('garder les coudes serrés')).techniques).toEqual([]);
  });

  test('techniques inconnues repérées sans rapprochement abusif', () => {
    const r = findTechniques(normalize('un genou sauté puis un spinning back kick'));
    expect(r.unknownMoves).toEqual(expect.arrayContaining(['genou saute', 'spinning back kick']));
    expect(r.techniques).toEqual([]);
  });

  test('« cet exercice » renvoie aux techniques de l’exercice en cours', () => {
    const p = parseQuestion('Explique-moi cet exercice', { exerciseId: 'boxe-debutant-08' });
    expect(p.techniques).toEqual(EXERCISE_BY_ID.get('boxe-debutant-08')!.sequence);
  });
});

describe('les six questions d’exemple', () => {
  test('« Pourquoi dois-je pivoter le pied arrière ? »', () => {
    const a = askCoach('Pourquoi dois-je pivoter le pied arrière ?', ctx({ techniqueId: 'jab' }));
    expect(a.intent).toBe('why');
    expect(a.sources[0].id).toBe('faq:pivot-pied-arriere');
    expect(a.text).toMatch(/hanche/);
    expect(a.text).toContain('Yasmine');
    expect(a.actions.some((x) => x.type === 'demo')).toBe(true);
    expectValidActions(a);
  });

  test('« Comment améliorer mon crochet gauche ? »', () => {
    const a = askCoach('Comment améliorer mon crochet gauche ?', ctx({ discipline: 'boxe' }));
    expect(a.intent).toBe('improve');
    expect(a.techniqueId).toBe('crochet-avant');
    expect(a.actions.map((x) => x.type)).toEqual(expect.arrayContaining(['slow', 'demo', 'start-exercise']));
    const ex = a.actions.find((x) => x.type === 'start-exercise');
    expect(ex && ex.type === 'start-exercise' && EXERCISE_BY_ID.get(ex.exerciseId)!.sequence).toContain('crochet-avant');
    expect(ex && ex.type === 'start-exercise' && EXERCISE_BY_ID.get(ex.exerciseId)!.discipline).toBe('boxe');
    expect(a.text).toContain('Yasmine');
    expect(a.text).toMatch(/miroir|filme/);
    expectValidActions(a);
  });

  test('« Montre-moi le middle kick au ralenti. »', () => {
    const a = askCoach('Montre-moi le middle kick au ralenti.', ctx());
    expect(a.intent).toBe('slow');
    expect(a.actions[0]).toEqual({ type: 'slow', techniqueId: 'middle-kick-arriere', speed: 0.25, label: 'Au ralenti' });
    expect(a.text).toContain('Yasmine');
    expectValidActions(a);
  });

  test('« Quelle est la différence entre un jab et un cross ? »', () => {
    const a = askCoach('Quelle est la différence entre un jab et un cross ?', ctx());
    expect(a.intent).toBe('difference');
    expect(a.sources.map((s) => s.id)).toEqual(expect.arrayContaining(['faq:jab-direct', 'tech:jab', 'tech:direct']));
    expect(a.actions.map((x) => (x.type === 'demo' ? x.techniqueId : ''))).toEqual(['jab', 'direct']);
    expect(a.text).toMatch(/avant/);
    expect(a.text).toMatch(/arrière/);
    expectValidActions(a);
  });

  test('« Comment garder mon équilibre pendant un high kick ? »', () => {
    const a = askCoach('Comment garder mon équilibre pendant un high kick ?', ctx({ discipline: 'muaythai' }));
    expect(a.intent).toBe('balance');
    expect(a.techniqueId).toBe('high-kick-arriere');
    expect(a.text).toMatch(/souplesse/);
    expect(a.actions[0]).toMatchObject({ type: 'slow', techniqueId: 'high-kick-arriere' });
    expectValidActions(a);
  });

  test('« Propose-moi une combinaison adaptée à mon niveau. »', () => {
    for (const level of ['debutant', 'intermediaire', 'avance', 'expert'] as const)
      for (const discipline of ['boxe', 'kickboxing', 'mma', 'muaythai'] as const) {
        const a = askCoach('Propose-moi une combinaison adaptée à mon niveau.', ctx({ level, discipline, catalog }));
        expect(a.intent).toBe('suggest_combo');
        const ex = a.actions.find((x) => x.type === 'start-exercise');
        expect(ex).toBeTruthy();
        if (ex?.type === 'start-exercise') {
          const e = EXERCISE_BY_ID.get(ex.exerciseId)!;
          expect(e.level).toBe(level);
          expect(e.discipline).toBe(discipline);
        }
        const combo = a.actions.find((x) => x.type === 'start-combo');
        if (combo?.type === 'start-combo') {
          const c = catalog.comboById.get(combo.comboId)!;
          expect(c.level).toBe(level);
          expect(c.discipline).toBe(discipline);
        }
        expectValidActions(a);
      }
  });

  test('la rotation propose une autre combinaison', () => {
    const a = askCoach('Propose-moi une combinaison', ctx({ seed: 0 }));
    const b = askCoach('Propose-moi une combinaison', ctx({ seed: 1 }));
    expect(a.actions[0]).not.toEqual(b.actions[0]);
  });
});

describe('adaptation', () => {
  test('débutant : pas à pas ; expert : concis avec nuance tactique', () => {
    const d = askCoach('Comment faire un direct ?', ctx({ level: 'debutant' }));
    const e = askCoach('Comment faire un direct ?', ctx({ level: 'expert' }));
    expect(d.text).toMatch(/Étape par étape/);
    expect(d.text).toMatch(/\n1\. /);
    expect(e.text).not.toMatch(/Étape par étape/);
    expect(e.text).toMatch(/Tactique/);
    expect(e.text.length).toBeLessThan(d.text.length);
  });

  test('détail « detaille » plus long que « court »', () => {
    const c = askCoach('Explique le jab', ctx({ level: 'intermediaire', preferences: { detail: 'court' } }));
    const l = askCoach('Explique le jab', ctx({ level: 'intermediaire', preferences: { detail: 'detaille' } }));
    expect(l.text.length).toBeGreaterThan(c.text.length);
  });

  test('garde gaucher : inversion signalée', () => {
    const a = askCoach('Comment améliorer mon crochet gauche ?', ctx({ guard: 'gaucher' }));
    expect(a.text).toMatch(/garde gaucher/);
    expect(a.text).toMatch(/bras droit/);
  });

  test('discipline : technique hors discipline signalée', () => {
    const a = askCoach('Montre-moi le middle kick', ctx({ discipline: 'boxe' }));
    expect(a.text).toMatch(/ne fait pas partie de la boxe anglaise/);
  });

  test('sans pseudo, pas de nom inventé ; la technique en cours sert de référence', () => {
    const a = askCoach('Montre-moi au ralenti', ctx({ pseudo: undefined, techniqueId: 'teep-avant', discipline: 'muaythai' }));
    expect(a.intent).toBe('slow');
    expect(a.actions[0]).toMatchObject({ type: 'slow', techniqueId: 'teep-avant' });
    expect(a.text.startsWith('Je lance')).toBe(true);
  });

  test('suivi : « répète » reprend la technique de la réponse précédente', () => {
    const a = askCoach('Répète', ctx({ lastTechniqueId: 'sprawl', techniqueId: 'jab', discipline: 'mma' }));
    expect(a.intent).toBe('repeat');
    expect(a.actions[0]).toMatchObject({ type: 'repeat', techniqueId: 'sprawl' });
  });
});

describe('honnêteté et sécurité', () => {
  test('« Corrige ma garde » : le coach dit qu’il ne voit pas', () => {
    for (const q of ['Corrige ma garde', 'Tu me vois ?', 'Est-ce que je fais bien mon jab ?', 'Corrige-moi']) {
      const a = askCoach(q, ctx({ techniqueId: 'jab' }));
      expect(a.intent, q).toBe('cant_see');
      expect(a.text).toMatch(/ne peux pas te voir/);
      expect(a.text).toContain('Yasmine');
      expectNoSeeingClaim(a.text);
      expectValidActions(a);
    }
    expect(askCoach('Corrige ma garde', ctx()).techniqueId).toBe('garde');
  });

  test('hors sujet', () => {
    for (const q of ['Quel temps fera-t-il demain ?', 'Donne-moi une recette de crêpes', 'Qui a gagné le match de football ?']) {
      const a = askCoach(q, ctx());
      expect(a.intent, q).toBe('off_topic');
      expect(a.actions).toEqual([]);
      expect(a.text).toMatch(/coach d’entraînement/);
    }
  });

  test('demande dangereuse refusée', () => {
    const a = askCoach('Comment perdre du poids vite avant un combat en me déshydratant ?', ctx());
    expect(a.intent).toBe('off_topic');
    expect(a.text).toMatch(/professionnel/);
  });

  test('technique inconnue : pas d’invention', () => {
    for (const q of ['Comment faire un spinning back fist ?', 'Explique-moi le superman punch', 'Montre-moi un tornado kick']) {
      const a = askCoach(q, ctx());
      expect(a.intent, q).toBe('unknown_technique');
      expect(a.actions).toEqual([]);
      expect(a.text).toMatch(/ne fait pas partie de ma bibliothèque/);
    }
  });

  test('douleur : arrêter et consulter', () => {
    const a = askCoach('J’ai mal à l’épaule quand je fais un crochet', ctx());
    expect(a.intent).toBe('safety');
    expect(a.text).toMatch(/arrête/);
    expect(a.text).toMatch(/professionnel de santé/);
    expect(a.actions).toEqual([]);
  });

  test('question incompréhensible : réponse honnête et exemples', () => {
    const a = askCoach('Et le truc du machin dans le round ?', ctx());
    expect(['unknown', 'explain']).toContain(a.intent);
    if (a.intent === 'unknown') {
      expect(a.text).toMatch(/pas trouvé de réponse fiable/);
      expect(a.suggestions?.length).toBeGreaterThan(0);
    }
  });

  test('aucune réponse ne cite un identifiant de technique inexistant', () => {
    const qs = ['Comment faire un low kick ?', 'Pourquoi rentrer le menton ?', 'Comment respirer pendant un round ?', 'Différence entre crochet et uppercut', 'C’est quoi un teep ?', 'Comment faire un sprawl ?', 'Comment bien s’échauffer ?', 'Comment me déplacer sans croiser les pieds ?', 'Salut', 'Merci coach', ''];
    for (const discipline of ['boxe', 'kickboxing', 'mma', 'muaythai'] as const)
      for (const level of ['debutant', 'expert'] as const)
        for (const q of qs) {
          const a = askCoach(q, ctx({ discipline, level, catalog }));
          expectValidActions(a);
          expectNoSeeingClaim(a.text);
          expect(a.engine).toBe('base-locale');
          expect(a.text.length).toBeGreaterThan(10);
        }
  });
});

describe('performance', () => {
  test('moins de 20 ms par question en moyenne', () => {
    askCoach('échauffement', ctx());
    const qs = ['Pourquoi dois-je pivoter le pied arrière ?', 'Comment améliorer mon crochet gauche ?', 'Montre-moi le middle kick au ralenti.', 'Quelle est la différence entre un jab et un cross ?', 'Comment garder mon équilibre pendant un high kick ?', 'Propose-moi une combinaison adaptée à mon niveau.'];
    const t0 = performance.now();
    for (let i = 0; i < 20; i++) for (const q of qs) askCoach(q, ctx({ catalog }));
    const per = (performance.now() - t0) / (20 * qs.length);
    expect(per).toBeLessThan(20);
  });

  test('déterministe', () => {
    const q = 'Comment améliorer mon crochet gauche ?';
    expect(askCoach(q, ctx())).toEqual(askCoach(q, ctx()));
  });
});

describe('LLM (interface seulement)', () => {
  test('sans moteur enregistré, la base locale répond', async () => {
    const a = await askCoachAsync('Pourquoi dois-je pivoter le pied arrière ?', ctx());
    expect(a.engine).toBe('base-locale');
  });

  test('une sortie de LLM qui prétend voir l’utilisateur est rejetée', async () => {
    const fake: LlmEngine = { id: 'faux', available: async () => true, generate: async () => 'Je te vois : ta posture est parfaite, continue comme ça.' };
    const a = await askCoachAsync('Pourquoi dois-je pivoter le pied arrière ?', ctx(), fake);
    expect(a.engine).toBe('base-locale');
    expect(acceptLlmOutput('Pivote le pied arrière pour libérer la hanche et transmettre la force du sol.')).toBe(true);
    const ok: LlmEngine = { id: 'ok', available: async () => true, generate: async () => 'Pivote le pied arrière pour libérer la hanche et transmettre la force du sol.' };
    const b = await askCoachAsync('Pourquoi dois-je pivoter le pied arrière ?', ctx(), ok);
    expect(b.engine).toBe('llm');
    expect(b.actions).toEqual(a.actions);
  });
});

describe('voix', () => {
  test('pas de saisie vocale sans moteur hors ligne ni accord explicite pour le mode en ligne', () => {
    expect(detectSpeechCapabilities().offlineRecognition).toBe(false);
    expect(getSpeechInput({ allowOnline: false })).toBeNull();
    // jsdom n’a pas de Web Speech API : même avec l’accord, rien n’est proposé
    expect(getSpeechInput({ allowOnline: true })).toBeNull();
  });

  test('Web Speech API en ligne seulement avec accord explicite', () => {
    class FakeRec {
      lang = '';
      start() {}
      stop() {}
    }
    (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition = FakeRec;
    try {
      expect(getSpeechInput({ allowOnline: false })).toBeNull();
      const s = getSpeechInput({ allowOnline: true });
      expect(s?.offline).toBe(false);
      expect(s?.id).toBe('web-speech-en-ligne');
    } finally {
      delete (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    }
  });
});

describe('store coachAi', () => {
  test('valeurs par défaut, historique désactivé par défaut et plafonné', () => {
    const s = useCoachAi.getState();
    expect(s.enabled).toBe(true);
    expect(s.voiceReplies).toBe(false);
    expect(s.keepHistory).toBe(false);
    expect(s.onlineSpeechOptIn).toBe(false);
    s.push({ question: 'q', answer: 'a', intent: 'explain' });
    expect(useCoachAi.getState().history).toEqual([]);
    s.set({ keepHistory: true });
    for (let i = 0; i < 130; i++) useCoachAi.getState().push({ question: `q${i}`, answer: 'a', intent: 'explain' });
    expect(useCoachAi.getState().history.length).toBe(100);
    expect(useCoachAi.getState().history[0].question).toBe('q129');
    useCoachAi.getState().clearHistory();
    expect(useCoachAi.getState().history).toEqual([]);
    useCoachAi.getState().push({ question: 'x', answer: 'a', intent: 'explain' });
    useCoachAi.getState().set({ keepHistory: false });
    expect(useCoachAi.getState().history).toEqual([]);
  });
});
