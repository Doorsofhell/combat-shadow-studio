import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { LATEST_RELEASE, RELEASES, hasUnseenRelease, releaseDateLabel } from '../../../domain/releases';
import { MENU_ENTRIES, NAV_CONFIG, NAV_PARENT, TOGGLE, navScreen, type NavScreen } from '../config';
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
  test.each(pairs)('%s → %s', (ref, ours) => {
    const slots = NAV_CONFIG[ours];
    expect(slots).toHaveLength(5);
    const labels = refLabels(ref);
    expect(slots.map((s) => s.icon)).toEqual(progresAfterTrain(refCase(ref), labels));
    expect(slots.map((s) => s.label)).toEqual(progresAfterTrain(labels, labels));
  });
  test('séance : la place 2 passe de Démarrer à Pause puis Reprendre, même place', () => {
    expect(NAV_CONFIG.entrainement[1].action).toBe('toggle');
    expect(TOGGLE.start).toEqual({ icon: 'play', label: 'Démarrer' });
    expect(TOGGLE.pause).toEqual({ icon: 'pause', label: 'Pause' });
    expect(TOGGLE.resume).toEqual({ icon: 'play', label: 'Reprendre' });
  });
  test('tous les écrans : 5 places, Menu toujours en 5, Retour en 1 sauf l’accueil', () => {
    for (const [screen, slots] of Object.entries(NAV_CONFIG)) {
      expect(slots, screen).toHaveLength(5);
      expect(slots[4], screen).toEqual({ icon: 'grid', label: 'Menu', action: 'menu' });
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
    expect(MENU_ENTRIES.map((m) => [m.icon, m.label])).toEqual(ref);
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
