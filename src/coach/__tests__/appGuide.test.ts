import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { APP_GUIDE, screenEntry, screenFromPath, screenOfTarget, type CoachScreen } from '../appGuide';
import { askCoach, type CoachAnswer, type CoachContext } from '../engine';
import { parseQuestion } from '../nlu';
import { SCREEN_QUESTIONS } from '../suggest';
import { normalize } from '../text';
import { MENU_ENTRIES, NAV_CONFIG, TOGGLE } from '../../ui/nav/config';

/**
 * 0.25 (Youssef, 2026-10-20): « que le coach IA réponde en fonction de la situation où il est appelé,
 * quel que soit l'écran ; on peut même lui demander comment fonctionne l'application ».
 */
const ctx = (screen?: CoachScreen, p: Partial<CoachContext> = {}): CoachContext => ({ discipline: 'boxe', level: 'debutant', guard: 'orthodoxe', screen, ...p });

const ALL_SCREENS = Object.keys(SCREEN_QUESTIONS) as CoachScreen[];

// ------------------------------------------------------------------ routes of the app (parsed from App.tsx)
const APP_SRC = readFileSync(resolve(process.cwd(), 'src/ui/App.tsx'), 'utf8');
const ROUTES = [...APP_SRC.matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1]).filter((p) => p !== '*');
const LIBRARY_SRC = readFileSync(resolve(process.cwd(), 'src/ui/screens/Library.tsx'), 'utf8');
const HUB_TABS = [...LIBRARY_SRC.slice(LIBRARY_SRC.indexOf('const HUB_TABS'), LIBRARY_SRC.indexOf('];', LIBRARY_SRC.indexOf('const HUB_TABS'))).matchAll(/id: '([a-z]+)'/g)].map((m) => m[1]);

/** a route of App.tsx matches the path (":param" matches one segment) */
function routeExists(path: string) {
  const seg = path.split('/').filter(Boolean);
  return ROUTES.some((r) => {
    const rs = r.split('/').filter(Boolean);
    return rs.length === seg.length && rs.every((x, i) => x.startsWith(':') || x === seg[i]);
  });
}

function expectValidNavigate(a: CoachAnswer) {
  for (const x of a.actions) {
    expect(x.type, JSON.stringify(x)).toBe('navigate');
    if (x.type !== 'navigate') continue;
    const [path, query = ''] = x.to.split('?');
    expect(routeExists(path), x.to).toBe(true);
    const tab = new URLSearchParams(query).get('tab');
    if (tab) expect(HUB_TABS, x.to).toContain(tab);
    expect(x.label.length).toBeGreaterThan(0);
  }
}

/** one question per guide entry, asked the way a learner would (screen where it is asked) */
const ENTRY_QUESTIONS: Record<string, [string, CoachScreen?]> = {
  'app-overview': ['Comment fonctionne l’application ?', 'Par où commencer ?', 'Je débute, je commence par quoi ?'],
  'nav-tabs': ['À quoi servent les onglets de la barre du bas ?'],
  // v0.32: the buttons of the bottom bar and the commands « Sur cet écran » (former pill, navigation dynamique)
  'barre-actions': ['À quoi servent les boutons de la barre ?', 'accueil'],
  'screen-accueil': ['À quoi sert cet écran ?', 'accueil'],
  'start-session': ['Comment lancer une séance ?'],
  modes: ['Quelle est la différence entre les modes ?'],
  'screen-entrainer': ['À quoi sert cet écran ?', 'entrainer'],
  'screen-discipline': ['À quoi sert cette page ?', 'discipline'],
  'screen-entrainement': ['Comment ça marche ?', 'entrainement'],
  decomposer: ['À quoi sert le bouton Décomposer ?', 'entrainement'],
  'comment-faire': ['À quoi sert le bouton Comment faire ?', 'entrainement'],
  ralenti: ['À quoi sert le bouton Ralenti ?', 'entrainement'],
  camera: ['Comment tourner la caméra ?', 'entrainement'],
  'plein-ecran': ['Comment passer en plein écran ?', 'entrainement'],
  ar: ['C’est quoi la réalité augmentée ?', 'entrainement'],
  'options-entrainement': ['Comment afficher les repères au sol ?', 'entrainement'],
  'choose-coach': ['Comment changer de coach ?', 'accueil'],
  render: ['Comment choisir le style Anime ou Ultra-réaliste ?', 'reglages'],
  'screen-techniques': ['Comment trouver une technique ?', 'techniques'],
  'screen-technique': ['À quoi sert cet écran ?', 'technique'],
  mastery: ['Comment je marque une technique ?', 'techniques'],
  partner: ['Pourquoi travailler avec un partenaire ?', 'partenaire'],
  favoris: ['Où je trouve mes favoris ?', 'accueil'],
  'screen-combinaisons': ['Comment lancer une combinaison ?', 'combinaisons'],
  createur: ['Comment créer mon propre enchaînement ?', 'createur'],
  programmes: ['Comment fonctionnent les programmes ?', 'programmes'],
  'kb-styles': ['Quelle différence entre les styles K1 et Full contact ?', 'discipline'],
  'screen-progres': ['Comment lire mes statistiques ?', 'progres'],
  periodes: ['Comment comparer les périodes ?', 'progres'],
  maitrise: ['C’est quoi l’onglet Maîtrise ?', 'progres'],
  historique: ['Où est l’historique de mes séances ?', 'progres'],
  objectifs: ['Comment fixer un objectif ?', 'progres'],
  legendes: ['Comment fonctionne l’onglet Légendes ?', 'legendes'],
  'legendes-statuts': ['Que signifient les statuts Vérifiée, Adaptée et Inspirée ?', 'legende-fiche'],
  'screen-reglages': ['Où sont les réglages ?', 'accueil'],
  theme: ['Comment passer en mode sombre ?', 'reglages'],
  voix: ['Comment couper la voix du coach ?', 'reglages-voix'],
  rounds: ['Comment régler la durée des rounds ?', 'reglages-rounds'],
  affichage: ['Que faire si l’affichage saccade ?', 'reglages-affichage'],
  donnees: ['Comment exporter mes données ?', 'reglages-donnees'],
  confidentialite: ['Mes données sont-elles envoyées sur internet ?', 'confidentialite'],
  premium: ['C’est quoi Premium à vie ?', 'accueil'],
  encyclopedie: ['Où trouver la définition d’un mot de boxe ?', 'accueil'],
  chrono: ['Où est le chronomètre de combat ?', 'accueil'],
  compte: ['Est-ce que je dois créer un compte ?', 'profil'],
  profil: ['Comment changer mon pseudo ?', 'profil'],
  // 0.27: the IMC card of the profile (Youssef, 2026-10-20 21:45)
  imc: ['Comment est calculé mon IMC ?', 'profil'],
  offline: ['Est-ce que l’application marche sans internet ?', 'accueil'],
  'coach-ia': ['Comment tu fonctionnes, coach IA ?', 'accueil'],
};

describe('guide de l’application : contenu', () => {
  test('au moins 40 entrées, identifiants uniques, chacune atteinte par une question de pratiquant', () => {
    expect(APP_GUIDE.length).toBeGreaterThanOrEqual(40);
    expect(new Set(APP_GUIDE.map((e) => e.id)).size).toBe(APP_GUIDE.length);
    expect(Object.keys(ENTRY_QUESTIONS).sort()).toEqual(APP_GUIDE.map((e) => e.id).sort());
    for (const [id, [q, screen]] of Object.entries(ENTRY_QUESTIONS)) {
      const a = askCoach(q, ctx(screen));
      expect(a.intent, `${id} : ${q}`).toBe('app_help');
      expect(a.sources.map((s) => s.id), `${id} : ${q}`).toEqual([`app:${id}`]);
      expect(a.confidence).toBeGreaterThanOrEqual(0.5);
      expect(a.engine).toBe('base-locale');
    }
  });

  test('ton : tutoiement, sans emoji ni tiret long, sans prétendre voir l’utilisateur', () => {
    for (const e of APP_GUIDE) {
      expect(e.answer, e.id).not.toMatch(/[—–]/);
      expect(e.answer, e.id).not.toMatch(/\p{Extended_Pictographic}/u);
      expect(e.answer, e.id).not.toMatch(/\bvous\b|\bvotre\b|\bvos\b/i);
      expect(e.answer, e.id).toMatch(/\b(tu|ton|ta|tes|te|toi)\b|\bt’/i);
      const t = normalize(e.answer);
      for (const f of ['je te vois', 'je vois que tu', 'tu fais bien', 'ta posture est bonne']) expect(t.includes(f), `${e.id} ${f}`).toBe(false);
      expect(e.title.length).toBeGreaterThan(3);
    }
  });

  test('le guide décrit ce que fait l’application, sans fonction inventée', () => {
    const by = (id: string) => APP_GUIDE.find((e) => e.id === id)!.answer;
    // the account is optional and sync is off by default (Privacy.tsx, Profile.tsx)
    expect(by('compte')).toMatch(/facultatif/);
    expect(by('compte')).toMatch(/désactivée par défaut/);
    expect(by('confidentialite')).toMatch(/Tout reste sur ton appareil/);
    // the coach does not see the user, it runs on the device
    expect(by('coach-ia')).toMatch(/ne te vois pas/);
    expect(by('coach-ia')).toMatch(/sans internet/);
    // the mastery switch: two icons next to the playback bar, coloured edge, "À revoir", Progrès > Maîtrise
    for (const w of ['Assimilée', 'Encore du mal', 'barre de lecture', 'liseré', 'À revoir', 'Maîtrise']) expect(by('mastery')).toContain(w);
    // the two coaches and the two renders really offered
    expect(by('choose-coach')).toMatch(/Kadir/);
    expect(by('choose-coach')).toMatch(/Amara/);
    expect(by('render')).toMatch(/Anime/);
    expect(by('render')).toMatch(/Ultra-réaliste/);
    // the five tabs of the bottom bar, as App.tsx names them
    // v0.32 navigation dynamique: the places of « Navigation générale » are named in the answer about the bar
    for (const m of MENU_ENTRIES) expect(by('nav-tabs'), m.label).toContain(m.label);
    // the study panel's speeds and the period presets
    expect(by('decomposer')).toMatch(/×0,25, ×0,5 et ×1/);
    for (const p of ['7 jours', '30 jours', '90 jours', '12 mois', 'Perso']) expect(by('screen-progres')).toContain(p);
    // every button named by the guide is a real word of the bar (NAV_CONFIG, the session's states) or a real command
    // « Sur cet écran » of a screen (labels read from the screens)
    const barLabels = [...Object.values(NAV_CONFIG).flat().map((x) => x.label), ...Object.values(TOGGLE).map((x) => x.label)];
    const screenSrc = ['src/ui/screens/Home.tsx', 'src/ui/screens/Library.tsx', 'src/ui/screens/Training.tsx', 'src/ui/screens/Champions.tsx', 'src/ui/screens/progress/Dashboard.tsx'].map((f) => readFileSync(resolve(process.cwd(), f), 'utf8')).join('\n');
    const commandLabels = [...screenSrc.matchAll(/label: [`']([^`'(]+?)[\s(]*[`'$]/g)].map((m) => m[1].trim());
    for (const w of ['Démarrer', 'Pause', 'Reprendre', 'Décomposer', 'Caméra', 'Rechercher', 'Filtres', 'Technique', 'S’entraîner', 'Ralenti', 'Maîtrise', 'Période', 'Statistiques', 'Historique', 'Disciplines', 'Légende', 'Parcours', 'Techniques', 'Favoris']) {
      expect(barLabels, w).toContain(w);
      expect(by('barre-actions'), w).toContain(`« ${w} »`);
    }
    for (const w of ['Séance rapide', 'Reprendre', 'Technique du jour', 'Au hasard', 'À revoir', 'Exercice suivant', 'Comment faire ?', 'Options']) {
      expect(commandLabels, w).toContain(w);
      expect(by('barre-actions'), w).toContain(`« ${w} »`);
    }
    expect(askCoach('C’est quoi les boutons du bas ?', ctx('techniques')).sources[0]?.id).toBe('app:barre-actions');
    // the Coach IA opens from Menu on every screen; the floating pill and bubble are gone
    expect(by('barre-actions')).toContain('« Coach IA »');
    expect(askCoach('Où est la pilule ?', ctx('accueil')).sources[0]?.id).toBe('app:barre-actions');
    // the IMC card: formula, adult WHO scale, its limits, nothing leaves the device
    for (const w of ['taille', 'poids', 'au carré', 'OMS', 'muscle', '18 ans', 'grossesse', 'médecin', 'sur ton appareil']) expect(by('imc'), w).toContain(w);
    // 0.27 (Youssef, 2026-10-20 22:09): double tap on the 3D coach for a total fullscreen, and the ways out
    for (const w of ['Touche deux fois', 'Quitter le plein écran', 'Échap', 'retour d’Android', 'continue']) expect(by('plein-ecran'), w).toContain(w);
    expect(askCoach('Comment mettre le coach en plein écran avec un double tap ?', ctx('accueil')).sources[0]?.id).toBe('app:plein-ecran');
    // 0.36 (Youssef, 2026-10-22 18:47, replaces the 0.27 rule): Techniques = Techniques, Combinaisons, Légendes,
    // Favoris; the Créateur and the Programmes live in Entraîner
    expect(by('screen-techniques')).toContain('Techniques, Combinaisons, Légendes et Favoris');
    expect(by('screen-techniques')).not.toMatch(/Créateur, Favoris|Favoris et Programmes/);
    expect(by('screen-entrainer')).toContain('créer tes propres enchaînements');
  });

  test('chaque écran a sa page d’aide', () => {
    for (const s of ALL_SCREENS) expect(screenEntry(s), s).toBeTruthy();
  });
});

describe('guide de l’application : liens vers les écrans', () => {
  test('les routes de App.tsx sont lues', () => {
    expect(ROUTES).toEqual(expect.arrayContaining(['/', '/stats', '/techniques/:id', '/reglages/:section']));
    // 0.36: Créateur and Programmes moved to Entraîner, Légendes is a section of the library again
    expect(HUB_TABS).toEqual(['techniques', 'combinaisons', 'legendes', 'favoris']);
  });

  test('chaque lien du guide mène à une route existante, et à l’écran qu’il annonce', () => {
    for (const e of APP_GUIDE.filter((x) => x.action)) {
      const [path, query = ''] = e.action!.to.split('?');
      expect(routeExists(path), `${e.id} ${e.action!.to}`).toBe(true);
      const tab = new URLSearchParams(query).get('tab');
      if (tab) expect(HUB_TABS, e.id).toContain(tab);
      expect(screenOfTarget(e.action!.to), `${e.id} ${e.action!.to}`).toBeTruthy();
      if (e.action!.to.startsWith('/reglages/')) expect(['voix', 'rounds', 'affichage', 'donnees']).toContain(path.split('/')[2]);
    }
  });

  test('les réponses proposent un lien valide, jamais vers l’écran où l’on est', () => {
    for (const [id, [q]] of Object.entries(ENTRY_QUESTIONS))
      for (const s of [undefined, ...ALL_SCREENS.filter((x) => x !== 'entrainement')]) {
        const a = askCoach(q, ctx(s));
        if (a.intent !== 'app_help') continue;
        expectValidNavigate(a);
        for (const x of a.actions) if (x.type === 'navigate' && s) expect(screenOfTarget(x.to), `${id} sur ${s}`).not.toBe(s);
      }
    const a = askCoach('Comment changer de coach ?', ctx('accueil'));
    expect(a.actions).toEqual([{ type: 'navigate', to: '/coach', label: 'Choisir mon coach' }]);
    expect(askCoach('Comment lire mes statistiques ?', ctx('progres')).actions).toEqual([]);
    expect(askCoach('Comment lire mes statistiques ?', ctx('accueil')).actions).toEqual([{ type: 'navigate', to: '/stats', label: 'Ouvrir Progrès' }]);
  });

  test('pendant une séance, aucun lien qui la quitterait', () => {
    for (const [q] of Object.values(ENTRY_QUESTIONS)) expect(askCoach(q, ctx('entrainement', { techniqueId: 'jab', exerciseId: 'boxe-debutant-01' })).actions.filter((x) => x.type === 'navigate'), q).toEqual([]);
  });
});

describe('écran courant', () => {
  test('chaque route de App.tsx où la bulle peut s’ouvrir a son écran', () => {
    const noBubble = ['/bienvenue', '/combattant', '/connexion', '/coach-ia/historique'];
    for (const r of ROUTES.filter((x) => !noBubble.includes(x))) expect(screenFromPath(r.replace(/:[a-zA-Z]+/g, 'x')), r).toBeTruthy();
  });

  test('routes, sous-pages et onglets', () => {
    const cases: [string, string, CoachScreen][] = [
      ['/', '', 'accueil'],
      ['/entrainer', '', 'entrainer'],
      ['/discipline/boxe', '?niveau=debutant&ex=boxe-debutant-01', 'discipline'],
      ['/programmes', '', 'programmes'],
      ['/programmes/debutant-boxe', '', 'programme'],
      ['/techniques', '', 'techniques'],
      ['/techniques', '?tab=combinaisons&d=mma', 'combinaisons'],
      ['/techniques', '?tab=favoris', 'favoris'],
      ['/techniques', '?tab=createur', 'createur'],
      ['/techniques', '?tab=legendes', 'legendes'],
      ['/techniques', '?tab=programmes', 'programmes'],
      ['/techniques/jab', '?d=boxe', 'technique'],
      ['/partenaire/osoto-gari', '', 'partenaire'],
      ['/createur', '?d=boxe', 'createur'],
      ['/stats', '', 'progres'],
      ['/historique', '', 'historique'],
      ['/objectifs', '', 'objectifs'],
      ['/champions', '?vue=favoris', 'legendes'],
      ['/champions/c/ali', '', 'champion'],
      ['/champions/combo-1', '', 'legende-fiche'],
      ['/reglages', '', 'reglages'],
      ['/reglages/voix', '', 'reglages-voix'],
      ['/reglages/rounds', '', 'reglages-rounds'],
      ['/reglages/affichage', '', 'reglages-affichage'],
      ['/reglages/donnees', '', 'reglages-donnees'],
      ['/profil', '', 'profil'],
      ['/coach', '', 'coach-choix'],
      ['/confidentialite', '', 'confidentialite'],
      ['/entrainement', '?ex=boxe-debutant-01&mode=technique', 'entrainement'],
    ];
    for (const [p, s, want] of cases) expect(screenFromPath(p, s), `${p}${s}`).toBe(want);
    expect(screenFromPath('/inconnu')).toBeUndefined();
  });
});

describe('compréhension : questions sur l’application', () => {
  test('les questions de Youssef sont reconnues', () => {
    const qs = [
      'Explique-moi comment fonctionne l’application',
      'Comment ça marche ?',
      'Où je trouve mes favoris ?',
      'À quoi sert ce bouton ?',
      'Comment je marque une technique ?',
      'C’est quoi l’onglet Maîtrise ?',
      'Comment marquer le jab comme assimilé ?',
      'À quoi sert cet écran ?',
      'Où sont les réglages ?',
      'Comment changer de coach ?',
    ];
    for (const q of qs) expect(parseQuestion(q).intent, q).toBe('app_help');
  });

  test('l’écran départage les questions vagues', () => {
    const where: [CoachScreen, string][] = [
      ['accueil', 'app:screen-accueil'],
      ['progres', 'app:screen-progres'],
      ['technique', 'app:screen-technique'],
      ['entrainement', 'app:screen-entrainement'],
      ['reglages-donnees', 'app:donnees'],
      ['legendes', 'app:legendes'],
    ];
    for (const q of ['À quoi sert cet écran ?', 'Comment ça marche ?', 'À quoi sert ce bouton ?'])
      for (const [s, id] of where) expect(askCoach(q, ctx(s, { techniqueId: s === 'technique' ? 'jab' : undefined })).sources[0]?.id, `${q} sur ${s}`).toBe(id);
    // nowhere in particular: the overview
    expect(askCoach('À quoi sert cet écran ?', ctx()).sources[0].id).toBe('app:app-overview');
    // a named feature wins over the screen
    expect(askCoach('Comment marquer cette technique comme assimilée ?', ctx('technique', { techniqueId: 'jab' })).sources[0].id).toBe('app:mastery');
    expect(askCoach('Comment fonctionne l’application ?', ctx('progres')).sources[0].id).toBe('app:app-overview');
  });

  test('à égalité de mots-clés, l’entrée de l’écran courant l’emporte', () => {
    // "le ralenti" (studio) and "la vitesse du coach" are both about speed: the studio's entry answers in training
    expect(askCoach('Comment marche le ralenti ?', ctx('entrainement', { techniqueId: 'jab' })).sources[0].id).toBe('app:ralenti');
    // "thème" (Apparence) and "volume" (Voix et sons) weigh the same: the page the learner is on decides
    expect(askCoach('Comment régler le thème et le volume ?', ctx('reglages')).sources[0].id).toBe('app:theme');
    expect(askCoach('Comment régler le thème et le volume ?', ctx('reglages-voix')).sources[0].id).toBe('app:voix');
  });

  test('les questions de technique restent des questions de technique', () => {
    const keep: [string, string][] = [
      ['Comment faire un sprawl ?', 'explain'],
      ['Montre-moi le jab au ralenti', 'slow'],
      ['Montre-moi au ralenti', 'slow'],
      ['Comment voir au ralenti ?', 'slow'],
      ['Propose-moi une combinaison', 'suggest_combo'],
      ['Propose-moi un programme', 'suggest_combo'],
      ['Comment améliorer mon crochet gauche ?', 'improve'],
      ['Quelle est la différence entre un jab et un cross ?', 'difference'],
      ['Comment garder mon équilibre pendant un high kick ?', 'balance'],
      ['Pourquoi dois-je pivoter le pied arrière ?', 'why'],
      ['Corrige ma garde', 'cant_see'],
      ['Tu me vois avec la caméra ?', 'cant_see'],
      ['J’ai mal à l’épaule', 'safety'],
      ['Salut', 'smalltalk'],
      ['Aide-moi', 'smalltalk'],
      ['Quel temps fera-t-il demain ?', 'off_topic'],
      ['Comment débuter ?', 'explain'],
      ['Comment s’entraîner seul ?', 'explain'],
      ['Comment respirer pendant un round ?', 'explain'],
      ['Comment frapper plus fort sans perdre en vitesse ?', 'improve'],
      ['Où placer ma main avant ?', 'explain'],
      ['Comment revenir rapidement en garde ?', 'explain'],
      ['Comment me relever en sécurité ?', 'explain'],
      ['Explique-moi cet exercice', 'explain'],
    ];
    for (const [q, intent] of keep) expect(parseQuestion(q, { exerciseId: 'boxe-debutant-08' }).intent, q).toBe(intent);
    for (const s of ALL_SCREENS) expect(askCoach('Comment faire un sprawl ?', ctx(s, { discipline: 'mma' })).intent, s).toBe('explain');
  });

  test('le coach se présente aussi comme guide de l’application', () => {
    expect(askCoach('Salut', ctx()).text).toMatch(/comment marche l’application/);
  });
});
