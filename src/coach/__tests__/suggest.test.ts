import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildCatalog } from '../../domain/catalog/loader';
import type { CatalogFile } from '../../domain/catalog/types';
import { TECHNIQUES, TECHNIQUE_BY_ID } from '../../domain/techniques';
import type { DisciplineId } from '../../domain/types';
import { COACH_SEEN_MAX, useCoachAi } from '../../store/coachAi';
import type { CoachScreen } from '../appGuide';
import { askCoach, type CoachContext } from '../engine';
import { knowledgeBase } from '../knowledge';
import { family } from '../nlu';
import { SCREEN_POOL, type QCat } from '../questionBank';
import { SEEN_MAX, answersWell, candidatesFor, pickSuggestions, rememberShown, suggestedQuestions, type SuggestOptions } from '../suggest';
import { normalize } from '../text';

const catalog = buildCatalog(JSON.parse(readFileSync(resolve(process.cwd(), 'public/catalog/catalog-v1.json'), 'utf8')) as CatalogFile);
const ctx = (techniqueId: string, discipline = TECHNIQUES.find((t) => t.id === techniqueId)!.disciplines[0]) => ({ discipline, level: 'debutant' as const, guard: 'orthodoxe' as const, techniqueId });
const SCREENS = Object.keys(SCREEN_POOL) as CoachScreen[];
const LEARNER_SIX = ['Comment bien pivoter mon pied arrière ?', 'Comment utiliser ma hanche pour frapper ?', 'Où placer ma main avant ?', 'Comment éviter de perdre l’équilibre ?', 'Comment revenir rapidement en garde ?', 'Quelle est la différence entre jab et direct ?'];
const FALLBACK = /pas sûr|je n’ai pas compris|reformule|pas trouvé de réponse fiable|quelle technique veux-tu voir/i;

/** ten openings in a row, each one remembering what the previous ones showed (as the panel does) */
function openings(c: Omit<CoachContext, 'lastTechniqueId' | 'seed'>, n = 10, extra: SuggestOptions = {}, start: string[] = []) {
  let seen = start;
  const sets: string[][] = [];
  for (let i = 0; i < n; i++) {
    const qs = suggestedQuestions(c, 8, { ...extra, seen, seed: 1000 + i });
    sets.push(qs);
    seen = rememberShown(seen, qs);
  }
  return sets;
}

describe('questions suggérées du coach IA', () => {
  it('au moins 4 questions par technique, dans chaque discipline où elle apparaît', () => {
    for (const t of TECHNIQUES)
      for (const d of t.disciplines) expect(suggestedQuestions(ctx(t.id, d), 8).length, `${t.id} ${d}`).toBeGreaterThanOrEqual(4);
  });

  it('direct arrière en MMA : les questions du pratiquant, sur le pied, la hanche, la garde et l’équilibre', () => {
    const qs = suggestedQuestions(ctx('direct', 'mma'), 8);
    for (const q of LEARNER_SIX) expect(qs).toContain(q);
    expect(qs[0]).toBe('Comment bien pivoter mon pied arrière ?');
    expect(qs.join(' ')).not.toMatch(/crochet gauche|cross/i);
  });

  it('premier affichage : les questions du pratiquant restent, quelle que soit la graine du jour', () => {
    for (let seed = 0; seed < 400; seed += 7) {
      const qs = suggestedQuestions({ ...ctx('direct', 'mma'), screen: 'entrainement', catalog }, 8, { seed, hour: seed % 24, kbStyle: 'tous' });
      for (const q of LEARNER_SIX) expect(qs, `graine ${seed}`).toContain(q);
      expect(qs[0]).toBe('Comment bien pivoter mon pied arrière ?');
      const sprawl = suggestedQuestions({ ...ctx('sprawl', 'mma'), screen: 'entrainement', catalog }, 8, { seed }).join(' ');
      for (const w of ['jambes', 'hanches', 'appuis', 'en garde']) expect(sprawl, `graine ${seed}`).toContain(w);
    }
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

  it('selon l’écran : d’abord 2 questions sur l’écran (1 s’il n’y en a qu’une), toutes bien répondues', () => {
    for (const screen of SCREENS) {
      const list = SCREEN_POOL[screen];
      expect(list.length, screen).toBeGreaterThanOrEqual(1);
      const c = { discipline: 'boxe' as const, level: 'debutant' as const, guard: 'orthodoxe' as const, screen };
      const qs = suggestedQuestions(c, 8);
      // the first two of the pool that have different answers
      const lead = list.filter((x, i) => list.findIndex((y) => y.expect === x.expect) === i).slice(0, 2);
      expect(qs.slice(0, lead.length), screen).toEqual(lead.map((x) => x.q));
      for (const x of list) {
        const a = askCoach(x.q, c);
        expect(answersWell(a, x.expect), `${screen} : ${x.q} → ${a.sources.map((s) => s.id).join(',')}`).toBe(true);
        expect(a.intent).toBe('app_help');
      }
    }
  });

  it('fiche technique : la question sur l’écran, puis une question sur la technique', () => {
    const c = { ...ctx('jab'), screen: 'technique' as const };
    const s = pickSuggestions(c, 6);
    expect(s[0].q).toBe('Comment marquer cette technique comme assimilée ?');
    expect(s[1].about).toBe(true);
    expect(s.length).toBe(6);
    for (const x of s) expect(answersWell(askCoach(x.q, c), x.expect, c), x.q).toBe(true);
  });

  it('entraînement : la technique d’abord, puis le studio, et les questions du pratiquant', () => {
    const qs = suggestedQuestions({ ...ctx('direct', 'mma'), screen: 'entrainement' }, 8);
    expect(qs[0]).toBe('Comment bien pivoter mon pied arrière ?');
    expect(qs[1]).toBe('À quoi sert le bouton Décomposer ?');
    for (const q of LEARNER_SIX) expect(qs).toContain(q);
    expect(qs.some((q) => q.startsWith('Montre-moi'))).toBe(true);
  });

  it('les questions sur une technique ne dépendent pas de l’écran', () => {
    for (const t of TECHNIQUES.slice(0, 20))
      for (const screen of ['accueil', 'technique', 'progres', 'entrainement'] as const) {
        const c = { ...ctx(t.id), screen };
        for (const s of pickSuggestions(ctx(t.id), 8).filter((x) => !x.expect.startsWith('app:'))) expect(askCoach(s.q, c).intent, `${t.id} ${screen} : ${s.q}`).not.toBe('app_help');
      }
  });
});

describe('questions suggérées : toutes répondues, sur tous les écrans et toutes les techniques', () => {
  it('écrans × techniques × graines : chaque question a une vraie réponse, sur son sujet', () => {
    const asked = new Map<string, string>();
    let sets = 0;
    let checks = 0;
    const variants: SuggestOptions[] = [
      { seed: 0 },
      { seed: 3, kbStyle: 'k1', toReview: ['jab', 'low-kick-arriere', 'sprawl', 'pont'], hour: 21, lastSessionDaysAgo: 0 },
      { seed: 11, kbStyle: 'full-contact', hour: 8, lastSessionDaysAgo: 5 },
    ];
    const techs: (string | undefined)[] = [undefined, ...TECHNIQUES.map((t) => t.id)];
    for (const tid of techs) {
      const disciplines: DisciplineId[] = tid ? TECHNIQUE_BY_ID.get(tid)!.disciplines : ['boxe', 'kickboxing', 'mma', 'muaythai', 'bjj', 'judo'];
      for (const d of disciplines)
        for (const screen of [undefined, ...SCREENS]) {
          for (const [vi, v] of variants.entries()) {
            // one discipline per technique on most screens, all of them on the training screen and without screen
            if (tid && d !== disciplines[0] && screen && screen !== 'entrainement') continue;
            // every screen with the first seed; the other seeds and contexts on the screens where techniques are worked
            if (vi && tid && screen && !['entrainement', 'technique'].includes(screen)) continue;
            const c: Omit<CoachContext, 'lastTechniqueId' | 'seed'> = { discipline: d, level: vi === 2 ? 'avance' : 'debutant', guard: vi === 1 ? 'gaucher' : 'orthodoxe', techniqueId: tid, screen, catalog, goals: vi === 1 ? ['cardio', 'defense'] : [] };
            // the 2nd and 3rd openings follow a first one: other questions come up
            const first = suggestedQuestions(c, 8, variants[0]);
            const s = pickSuggestions(c, 8, { ...v, seen: vi ? first : [] });
            sets++;
            for (const x of s) {
              const key = `${x.expect.startsWith('app:') ? screen : ''}|${tid}|${d}|${c.level}|${c.guard}|${x.q}`;
              if (asked.has(key)) continue;
              const a = askCoach(x.q, { ...c, preferences: { detail: 'court' } });
              checks++;
              const why = `${screen ?? '-'} ${tid ?? '-'} ${d} : ${x.q} → ${a.intent} ${a.confidence} ${a.sources.map((y) => y.id).join(',')}`;
              expect(['unknown', 'off_topic', 'unknown_technique'], why).not.toContain(a.intent);
              expect(a.confidence, why).toBeGreaterThanOrEqual(0.5);
              expect(a.text, why).not.toMatch(FALLBACK);
              expect(answersWell(a, x.expect, c), why).toBe(true);
              // the answer speaks about the subject: the technique named, or the library / guide entry promised
              if (x.expect.startsWith('tech:')) {
                const t = TECHNIQUE_BY_ID.get(x.expect.slice(5))!;
                const named = normalize(a.text).includes(normalize(t.name.replace(/\s*\(.*\)$/, '')));
                expect(named || a.techniqueId === t.id, why).toBe(true);
              }
              asked.set(key, a.intent);
            }
          }
        }
    }
    expect(sets).toBeGreaterThan(3000);
    expect(checks).toBeGreaterThan(1000);
  }, 240_000);
});

describe('questions suggérées : variété', () => {
  const CONTEXTS: [string, Omit<CoachContext, 'lastTechniqueId' | 'seed'>][] = [
    ['MMA direct (entraînement)', { ...ctx('direct', 'mma'), screen: 'entrainement', catalog }],
    ['boxe jab', { ...ctx('jab', 'boxe'), screen: 'entrainement', catalog }],
    ['kick-boxing middle kick', { ...ctx('middle-kick-arriere', 'kickboxing'), screen: 'entrainement', catalog }],
    ['muay-thaï genou', { ...ctx('genou-direct-arriere', 'muaythai'), screen: 'entrainement', catalog }],
    ['MMA sprawl', { ...ctx('sprawl', 'mma'), screen: 'entrainement', catalog }],
    ['fiche du teep', { ...ctx('teep-avant', 'muaythai'), screen: 'technique', catalog }],
    ['accueil', { discipline: 'boxe', level: 'debutant', guard: 'orthodoxe', screen: 'accueil', catalog }],
    ['progrès', { discipline: 'kickboxing', level: 'intermediaire', guard: 'orthodoxe', screen: 'progres', catalog }],
    ['réglages', { discipline: 'muaythai', level: 'debutant', guard: 'gaucher', screen: 'reglages', catalog }],
  ];

  it('10 ouvertures de suite sur le même écran : au moins 60 % de questions différentes', () => {
    for (const [label, c] of CONTEXTS) {
      const sets = openings(c);
      const all = sets.flat();
      const distinct = new Set(all).size;
      expect(distinct / all.length, `${label} : ${distinct}/${all.length}`).toBeGreaterThanOrEqual(0.6);
    }
  });

  it('jiu-jitsu et judo aussi : au moins 50 % de questions différentes sur 10 ouvertures', () => {
    for (const c of [{ ...ctx('sortie-hanche', 'bjj'), screen: 'entrainement' as const }, { ...ctx('tai-sabaki', 'judo'), screen: 'entrainement' as const }]) {
      const all = openings(c).flat();
      expect(new Set(all).size / all.length, c.techniqueId).toBeGreaterThanOrEqual(0.5);
    }
  });

  it('deux ouvertures de suite : au moins la moitié des questions sont nouvelles, la plus pertinente reste devant', () => {
    for (const [label, c] of CONTEXTS) {
      const [a, b] = openings(c, 2);
      const fresh = b.filter((q) => !a.includes(q)).length;
      expect(fresh / b.length, `${label} : ${a.join(' / ')} ⇒ ${b.join(' / ')}`).toBeGreaterThanOrEqual(0.5);
    }
  });

  it('dans une série : 2 questions au plus par catégorie, aucune formulation ni réponse en double, une démo avec une technique', () => {
    for (const [label, c] of CONTEXTS) {
      let seen: string[] = [];
      for (let i = 0; i < 12; i++) {
        const set = pickSuggestions(c, 8, { seen, seed: i });
        const cats = new Map<QCat, number>();
        for (const x of set) cats.set(x.cat, (cats.get(x.cat) ?? 0) + 1);
        expect(Math.max(...cats.values()), `${label} #${i}`).toBeLessThanOrEqual(2);
        expect(new Set(set.map((x) => normalize(x.q))).size, `${label} #${i}`).toBe(set.length);
        expect(new Set(set.map((x) => x.key)).size, `${label} #${i}`).toBe(set.length);
        expect(set.length, `${label} #${i}`).toBe(8);
        if (c.techniqueId) expect(set.some((x) => x.q.startsWith('Montre-moi')), `${label} #${i}`).toBe(true);
        seen = rememberShown(seen, set.map((x) => x.q));
      }
    }
  });

  it('pertinence : la première question porte sur la technique à l’écran, même après rotation', () => {
    for (const t of TECHNIQUES.filter((_, i) => i % 3 === 0)) {
      const c = { ...ctx(t.id), screen: 'entrainement' as const, catalog };
      let seen: string[] = [];
      for (let i = 0; i < 6; i++) {
        const s = pickSuggestions(c, 8, { seen, seed: i });
        const first = s[0];
        expect(first.about, `${t.id} #${i} : ${first.q}`).toBe(true);
        const a = askCoach(first.q, c);
        // its answer rests on the technique: its sheet, an exercise with it, or a library entry linked to it
        const linked = a.sources.some((x) => knowledgeBase().find((e) => e.id === x.id)?.related.some((r) => family(r) === family(t.id)));
        expect(linked || (first.expect.endsWith(`:${t.id}`) && answersWell(a, first.expect, c)), `${t.id} #${i} : ${first.q} → ${a.sources.map((x) => x.id)}`).toBe(true);
        seen = rememberShown(seen, s.map((x) => x.q));
      }
    }
  });

  it('contexte : technique « à revoir », style de kick-boxing, heure, dernière séance, garde gaucher', () => {
    const jab = candidatesFor({ ...ctx('jab', 'kickboxing'), guard: 'gaucher', catalog }, { toReview: ['jab'], kbStyle: 'k1' }).map((x) => x.q);
    expect(jab).toContain('Le jab me pose encore problème : une astuce ?');
    expect(jab).toContain('Le jab, c’est permis en K1 ?');
    expect(jab).toContain('Je suis gaucher : comment faire le jab ?');
    expect(suggestedQuestions(ctx('jab', 'kickboxing'), 8, { toReview: ['jab'] })[0]).toBe('Le jab me pose encore problème : une astuce ?');
    const home = candidatesFor({ discipline: 'kickboxing', level: 'debutant', guard: 'orthodoxe', screen: 'accueil', catalog }, { hour: 21, lastSessionDaysAgo: 0, toReview: ['low-kick-arriere'], kbStyle: 'full-contact' }).map((x) => x.q);
    for (const q of ['Que travailler ce soir ?', 'J’ai déjà fait une séance aujourd’hui : comment bien récupérer ?', 'Une astuce pour progresser sur le low kick droit ?', 'Qu’est-ce qui est permis en full contact ?', 'Parle-moi du style d’une légende de kick-boxing.'])
      expect(home, q).toContain(q);
    expect(candidatesFor({ discipline: 'boxe', level: 'debutant', guard: 'orthodoxe', catalog }, { hour: 8, lastSessionDaysAgo: 4 }).map((x) => x.q)).toEqual(expect.arrayContaining(['Que travailler ce matin ?', 'Je reprends après quelques jours : comment bien m’échauffer ?']));
  });

  it('banque : au moins 10 catégories proposées pour une technique de frappe, et de quoi tourner', () => {
    const c = { ...ctx('direct', 'mma'), screen: 'entrainement' as const, catalog };
    const pool = candidatesFor(c, { hour: 19, kbStyle: 'k1' });
    expect(new Set(pool.map((x) => x.cat)).size).toBeGreaterThanOrEqual(12);
    expect(pool.length).toBeGreaterThanOrEqual(48);
  });
});

describe('moteur : règlements du kick-boxing et Légendes', () => {
  const kb = { discipline: 'kickboxing' as const, level: 'debutant' as const, guard: 'orthodoxe' as const, catalog };
  it('ce que disent les règlements, d’après les styles de kick-boxing', () => {
    const a = askCoach('Le low kick droit, c’est permis en full contact ?', kb);
    expect(a.intent).toBe('rules');
    expect(a.text).toMatch(/Full contact : interdit/);
    const g = askCoach('Que disent les règlements du kick-boxing sur le genou direct ?', kb);
    expect(g.text).toMatch(/K1 : permis/);
    expect(g.text).toMatch(/Low kick : interdit/);
    // the styles themselves stay a question about the app
    expect(askCoach('Quelles sont les règles du kick-boxing ?', kb).intent).toBe('app_help');
  });

  it('le style d’une légende, d’après la bibliothèque des champions', () => {
    const a = askCoach('Quelle légende utilise souvent le jab ?', { ...kb, discipline: 'boxe' });
    expect(a.intent).toBe('legend');
    expect(a.sources[0].id).toMatch(/^champ:/);
    expect(a.text).toMatch(/Dans les Légendes/);
    expect(a.actions[0]?.type).toBe('start-combo');
    // the tab itself stays a question about the app; without the library, the guide answers
    expect(askCoach('Comment fonctionne l’onglet Légendes ?', kb).intent).toBe('app_help');
    expect(askCoach('Quelle légende utilise souvent le jab ?', { ...kb, catalog: undefined }).intent).toBe('app_help');
  });
});

describe('questions vues : mémoire par utilisateur', () => {
  it('liste glissante, sans doublon, plafonnée', () => {
    let seen: string[] = [];
    for (let i = 0; i < 20; i++) seen = rememberShown(seen, [`q${i}a`, `q${i}b`, `q${i}c`, `q${i}d`, 'toujours']);
    expect(seen.length).toBe(SEEN_MAX);
    expect(seen[0]).toBe('q19a');
    expect(seen.filter((q) => q === 'toujours').length).toBe(1);
    expect(COACH_SEEN_MAX).toBe(SEEN_MAX);
  });

  it('le magasin du coach : champ par défaut vide (anciennes sauvegardes), ajout en tête', async () => {
    await useCoachAi.persist.rehydrate();
    expect(useCoachAi.getState().recentSuggestions).toEqual([]);
    useCoachAi.getState().noteSuggestions(['A ?', 'B ?']);
    useCoachAi.getState().noteSuggestions(['C ?', 'A ?']);
    expect(useCoachAi.getState().recentSuggestions).toEqual(['C ?', 'A ?', 'B ?']);
    // an old save without the field
    const merge = useCoachAi.persist.getOptions().merge!;
    const merged = merge({ enabled: true, detail: 'court', keepHistory: false }, useCoachAi.getState()) as { recentSuggestions: string[] };
    expect(merged.recentSuggestions).toEqual([]);
    const bad = merge({ recentSuggestions: ['ok', 3, null] }, useCoachAi.getState()) as { recentSuggestions: string[] };
    expect(bad.recentSuggestions).toEqual(['ok']);
  });
});
