import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { LATEST_RELEASE, RELEASES, hasUnseenRelease, releaseDateLabel } from '../../../domain/releases';
import { MENU_ENTRIES, NAV_CONFIG, NAV_PARENT, TOGGLE, navScreen, slotRole, type NavScreen } from '../config';
import { NAV_EXTRA_ICONS, NAV_ICONS, navIconPaths } from '../icons';
import { fold } from '../selection';

/**
 * v0.32 (Youssef, 2026-10-22, PROMPT MAÎTRE « Refonte intégrale de la navigation dynamique premium »): the mockup
 * docs/design/navigation-dynamique-reference.html is the contract. These tests read the mockup itself and compare.
 */
const REF = readFileSync(resolve(process.cwd(), 'docs/design/navigation-dynamique-reference.html'), 'utf8');
const REF_ICONS = JSON.parse(REF.match(/const icons=(\{.*?\});/)![1]) as Record<string, string>;
const refCase = (name: string) => {
  const m = REF.match(new RegExp(`${name === 'default' ? 'default' : `case '${name}'`}:return \\[(.*?)\\];`));
  return [...m![1].matchAll(/\[(?:playing\?'pause':)?'([a-z]+)'(?:,playing\?'Pause':'Démarrer'|,"?'?([^'"\]]+)'?"?)/g)].map((x) => x[1]);
};
/** the words of a screen; the app writes the apostrophe the French way (’), the mockup's code a straight one */
const refLabels = (name: string) => {
  const m = REF.match(new RegExp(`${name === 'default' ? 'default' : `case '${name}'`}:return \\[(.*?)\\];`));
  return [...m![1].matchAll(/,(?:'([^']+)'|"([^"]+)"|playing\?'Pause':'([^']+)'),'[a-z]+'\]/g)].map((x) => (x[1] ?? x[2] ?? x[3]).replace(/'/g, '’'));
};

describe('icônes : copie exacte du registre de la maquette', () => {
  test('mêmes 23 icônes, mêmes chemins SVG, caractère par caractère', () => {
    expect(Object.keys(NAV_ICONS).sort()).toEqual(Object.keys(REF_ICONS).sort());
    for (const [k, v] of Object.entries(REF_ICONS)) expect(NAV_ICONS[k as keyof typeof NAV_ICONS], k).toBe(v);
  });
  test('0.38 : les icônes ajoutées (créateur) ne remplacent aucune icône de la maquette et suivent son dessin', () => {
    for (const [k, v] of Object.entries(NAV_EXTRA_ICONS)) {
      expect(REF_ICONS[k], k).toBeUndefined();
      expect(v, k).toMatch(/^<(path|circle|rect) /);
      expect(v, k).not.toMatch(/fill=|stroke-width=|style=/);
    }
  });
  test('rendu : viewBox 0 0 24 24, 21 px, trait 1,8, extrémités et jonctions arrondies (CSS de la maquette)', () => {
    const tsx = readFileSync(resolve(process.cwd(), 'src/ui/nav/NavIcon.tsx'), 'utf8');
    const css = readFileSync(resolve(process.cwd(), 'src/ui/nav/nav.css'), 'utf8');
    expect(tsx).toContain('viewBox="0 0 24 24"');
    const at = css.indexOf('\n.nav-svg {');
    const svg = css.slice(at, css.indexOf('}', at));
    for (const d of ['width: 21px', 'height: 21px', 'stroke: currentColor', 'fill: none', 'stroke-width: 1.8', 'stroke-linecap: round', 'stroke-linejoin: round']) expect(svg, d).toContain(d);
  });
});

describe('barre : cinq places, mêmes icônes, libellés et ordre que la maquette', () => {
  // the mockup's screens and ours
  const pairs: [string, NavScreen][] = [
    ['home', 'accueil'],
    ['train', 'entrainement'],
    ['tech', 'techniques'],
    ['detail', 'fiche'],
    ['progress', 'progres'],
    ['legends', 'legendes'],
    ['legenddetail', 'fiche-legende'],
    ['profile', 'profil'],
    ['default', 'parametres'],
  ];
  // 0.34 (Youssef, 2026-10-22, refonte Progrès §11): on the home bar, Progrès comes right after Entraîner; the rest
  // is the mockup as drawn
  const progresAfterTrain = <T,>(xs: T[], labels: string[]) => {
    const i = labels.indexOf('Progrès');
    const j = labels.indexOf('Entraîner');
    if (i < 0 || j < 0 || i === j + 1) return xs;
    const out = [...xs];
    const [m] = out.splice(i, 1);
    out.splice(j + 1, 0, m);
    return out;
  };
  // 0.48 (Youssef, 2026-10-23: « à la place de l'icône technique »): the main place Techniques is the fight timer
  const chronoForTechniques = <T,>(xs: T[], labels: string[], chrono: T) => xs.map((x, i) => (labels[i] === 'Techniques' ? chrono : x));
  // 1.1.0 (Youssef, 2026-10-27, loupe A): « Rechercher » left the screens for a place of the bar, and « Caméra » left
  // Réglages (it opened the page already shown); the other places of the mockup keep their order
  const GONE_110 = (ref: string) => ['Rechercher', ...(ref === 'default' ? ['Caméra'] : [])];
  const keep110 = <T,>(xs: T[], labels: string[], ref: string) => xs.filter((_, i) => !GONE_110(ref).includes(labels[i]));
  test.each(pairs)('%s → %s', (ref, ours) => {
    const slots = NAV_CONFIG[ours];
    const all = refLabels(ref);
    expect(slots).toHaveLength(5 - all.filter((w) => GONE_110(ref).includes(w)).length);
    const labels = keep110(all, all, ref);
    const swap = ref === 'home';
    // 1.0.0 (refonte, lot 3, maquette v4): on the home that place (Chrono since 0.48) is the big button
    // « Reprendre »; Chrono is a tile of the page
    const icons = swap ? chronoForTechniques(refCase(ref), labels, 'play') : keep110(refCase(ref), all, ref);
    const words = swap ? chronoForTechniques(labels, labels, 'Reprendre') : labels;
    expect(slots.map((s) => s.icon)).toEqual(progresAfterTrain(icons, labels));
    expect(slots.map((s) => s.label)).toEqual(progresAfterTrain(words, labels));
  });
  test('0.48 : « Chrono » remplace la place principale Techniques, Techniques reste dans Menu', () => {
    for (const [screen, slots] of Object.entries(NAV_CONFIG)) expect(slots.some((x) => x.action === 'nav:/techniques'), screen).toBe(false);
    // 1.1.0: on Entraîner, Chrono is the 3rd choice of Séance (segments of the page), no longer a place
    for (const screen of ['programmes'] as const) {
      expect(NAV_CONFIG[screen].some((x) => x.action === 'nav:/chrono' && x.label === 'Chrono' && x.icon === 'stopwatch'), screen).toBe(true);
    }
    // 1.0.0 (lot 3): on the home, Chrono is the tile « Chrono seul » of the page
    expect(readFileSync(resolve(process.cwd(), 'src/ui/screens/Home.tsx'), 'utf8')).toMatch(/to="\/chrono"[^>]*data-testid="tile-chrono"/);
    expect(MENU_ENTRIES.some((m) => m.to === '/techniques')).toBe(true);
    expect(navScreen('/chrono')).toBe('chrono');
    expect(NAV_CONFIG.chrono.map((x) => x.action)).toEqual(['back', 'toggle', 'setup', 'nav:/chrono', 'menu']);
  });
  test('séance : la place 2 passe de Démarrer à Pause puis Reprendre, même place', () => {
    expect(NAV_CONFIG.entrainement[1].action).toBe('toggle');
    expect(TOGGLE.start).toEqual({ icon: 'play', label: 'Démarrer' });
    expect(TOGGLE.pause).toEqual({ icon: 'pause', label: 'Pause' });
    expect(TOGGLE.resume).toEqual({ icon: 'play', label: 'Reprendre' });
  });
  test('tous les écrans : 5 places, Menu toujours en 5, Retour en 1 sauf l’accueil', () => {
    // 1.1.0: 4 where « Rechercher » (now in the bar), « Caméra » (Réglages) or Chrono (Entraîner) left; Menu stays last
    const FOUR_110 = ['techniques', 'legendes', 'parametres', 'confidentialite', 'connexion', 'entrainer', 'createur'];
    for (const [screen, slots] of Object.entries(NAV_CONFIG)) {
      expect(slots, screen).toHaveLength(FOUR_110.includes(screen) ? 4 : 5);
      expect(slots[slots.length - 1], screen).toEqual({ icon: 'grid', label: 'Menu', action: 'menu' });
      if (screen !== 'accueil') expect(slots[0], screen).toEqual({ icon: 'back', label: 'Retour', action: 'back' });
      for (const s of slots) expect(navIconPaths(s.icon), `${screen} ${s.icon}`).toBeTruthy();
      // a page of the app behind every `nav:` action
      expect(NAV_PARENT[screen as NavScreen], screen).toMatch(/^\//);
    }
  });
});

describe('écran d’une route', () => {
  test.each([
    ['/', '', 'accueil'],
    ['/entrainer', '', 'entrainer'],
    ['/discipline/boxe', '', 'discipline'],
    ['/programmes', '', 'programmes'],
    ['/programmes/x', '', 'programme'],
    ['/entrainement', '?ex=boxe-debutant-01', 'entrainement'],
    ['/techniques', '?d=boxe', 'techniques'],
    ['/techniques/jab', '?d=boxe', 'fiche'],
    ['/partenaire/x', '', 'partenaire'],
    ['/createur', '', 'createur'],
    ['/createur/nouveau', '?d=mma', 'createur-editeur'],
    ['/createur/abc/modifier', '', 'createur-editeur'],
    ['/createur/abc', '', 'createur-fiche'],
    ['/stats', '', 'progres'],
    ['/stats/activite', '', 'progres-activite'],
    ['/stats/techniques', '', 'progres-detail'],
    ['/stats/enchainements', '', 'progres-detail'],
    ['/historique', '', 'historique'],
    ['/objectifs', '', 'objectifs'],
    ['/champions', '?vue=champions', 'legendes'],
    ['/champions/c/tyson', '', 'fiche-legende'],
    ['/champions/abc', '', 'combinaison'],
    ['/profil', '', 'profil'],
    ['/connexion', '', 'connexion'],
    ['/coach', '', 'coach'],
    ['/coach-ia', '', 'coach-ia'],
    ['/reglages', '', 'parametres'],
    ['/reglages/affichage', '', 'parametres'],
    ['/confidentialite', '', 'confidentialite'],
    ['/premium', '', 'premium'],
  ])('%s%s → %s', (p, q, screen) => expect(navScreen(p, q)).toBe(screen));
  test('pas de barre : accueil de bienvenue, premier choix du coach, labo', () => {
    expect(navScreen('/bienvenue')).toBeNull();
    expect(navScreen('/coach', '?first=1')).toBeNull();
    expect(navScreen('/lab')).toBeNull();
  });
  test('chaque route de App.tsx a sa barre (ou n’en a volontairement pas)', () => {
    const app = readFileSync(resolve(process.cwd(), 'src/ui/App.tsx'), 'utf8');
    const routes = [...app.matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1]).filter((p) => p !== '*' && p !== '/bienvenue');
    for (const r of routes) expect(navScreen(r.replace(/:[a-zA-Z]+/g, 'x')), r).toBeTruthy();
  });
});

describe('Navigation générale', () => {
  test('huit entrées, avec les icônes de la maquette, Progrès juste après Entraîner', () => {
    const items = REF.match(/const items=\[(.*?)\];/)![1];
    const ref = [...items.matchAll(/\['([a-z]+)','([^']+)','[a-z]+'\]/g)].map((m) => [m[1], m[2]]);
    expect(ref).toHaveLength(8);
    // 0.34 (Youssef, 2026-10-22, refonte Progrès §11): the order of the mockup, except Progrès placed right after Entraîner
    const progres = ref.findIndex((r) => r[1] === 'Progrès');
    const [moved] = ref.splice(progres, 1);
    ref.splice(ref.findIndex((r) => r[1] === 'Entraîner') + 1, 0, moved);
    // 0.40 (Youssef, « Préparation Freemium et Premium à vie » §8): « Premium à vie » added after the mockup's eight
    expect(MENU_ENTRIES.slice(0, 8).map((m) => [m.icon, m.label])).toEqual(ref);
    // 0.46 (« Encyclopédie du combat » §3): Encyclopédie added after Premium à vie
    expect(MENU_ENTRIES.slice(8).map((m) => [m.icon, m.label, m.to])).toEqual([
      ['diamond', 'Premium à vie', '/premium'],
      ['book', 'Encyclopédie', '/encyclopedie'],
    ]);
  });
});

describe('Nouveautés', () => {
  test('la version la plus récente est celle de l’application', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as { version: string };
    expect(LATEST_RELEASE.version).toBe(pkg.version.replace(/-.*$/, ''));
  });
  test('structure : version, date, titre, catégories, changements, liens ; du plus récent au plus ancien', () => {
    for (const r of RELEASES) {
      expect(r.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(r.releaseDate).toMatch(/^2026-\d\d-\d\d$/);
      expect(r.title.length).toBeGreaterThan(3);
      expect(r.changes.length).toBeGreaterThan(0);
      expect(r.categories.length).toBeGreaterThan(0);
      for (const c of r.categories) expect(r.changes.some((x) => x.category === c)).toBe(true);
      for (const l of r.links) expect(l.to).toMatch(/^\//);
      expect(typeof r.isMajor).toBe('boolean');
    }
    const order = RELEASES.map((r) => r.version.split('.').map(Number)).map(([a, b, c]) => a * 1e6 + b * 1e3 + c);
    expect([...order].sort((a, b) => b - a)).toEqual(order);
  });
  test('aucune note fictive de la maquette ni emoji', () => {
    const text = JSON.stringify(RELEASES);
    expect(text).not.toMatch(/Démonstration fictive|démo/i);
    expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
  });
  test('pastille tant que la dernière version n’a pas été ouverte', () => {
    expect(hasUnseenRelease(null)).toBe(true);
    expect(hasUnseenRelease('0.31.0')).toBe(true);
    expect(hasUnseenRelease(LATEST_RELEASE.version)).toBe(false);
  });
  test('date en français', () => expect(releaseDateLabel('2026-10-22')).toBe('22 octobre 2026'));
});

test('recherche : sans accents ni majuscules', () => {
  expect(fold('Crochet Arrière')).toBe('crochet arriere');
  expect(fold('  ÉCHAUFFEMENT ')).toBe('echauffement');
});

describe('v0.44 rôles des emplacements (teinte des actions contextuelles)', () => {
  test('Retour et Menu restent neutres sur tous les écrans', () => {
    for (const [screen, slots] of Object.entries(NAV_CONFIG)) {
      for (const s of slots) if (s.action === 'back' || s.action === 'menu') expect(slotRole(s), screen).toBe('global');
    }
  });
  test('les actions propres à l’écran sont contextuelles', () => {
    const roles = (s: keyof typeof NAV_CONFIG) => NAV_CONFIG[s].map(slotRole);
    expect(roles('techniques')).toEqual(['global', 'contextual', 'contextual', 'global']);
    expect(roles('entrainement')).toEqual(['global', 'contextual', 'contextual', 'contextual', 'global']);
    expect(roles('progres')).toEqual(['global', 'contextual', 'contextual', 'contextual', 'global']);
    // Créer opens the editor of this screen: one of its actions
    expect(roles('createur')).toEqual(['global', 'contextual', 'contextual', 'global']);
  });
  test('les liens vers les grandes rubriques ne sont jamais teintés (pas de coloration artificielle)', () => {
    // Accueil: only main places; Premium (until its own actions) and the pages without actions: Entraîner, Techniques, Progrès
    // (1.0.0: plus the big button « Reprendre », the action of the home)
    expect(NAV_CONFIG.accueil.filter((x) => x.action !== 'resume').map(slotRole).every((r) => r === 'global')).toBe(true);
    expect(NAV_CONFIG.autre.map(slotRole).every((r) => r === 'global')).toBe(true);
    // a screen with one action of its own and two links: only the action is tinted
    expect(NAV_CONFIG.programmes.map(slotRole)).toEqual(['global', 'contextual', 'global', 'global', 'global']);
  });
});
