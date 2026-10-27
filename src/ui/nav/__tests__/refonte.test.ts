import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MENU_ENTRIES, NAV_CONFIG, PRIMARY, ROOT_SCREENS, SECTION, SECTION_TABS, TABS, dockSlots, navScreen, sectionTabsFor, type NavScreen } from '../config';

// 1.0.0 (refonte ergonomique, Youssef 2026-10-27): « Aucune perte de contenu. Réorganisation, logique et intelligente »
const screens = Object.keys(NAV_CONFIG) as NavScreen[];
const read = (f: string) => readFileSync(f, 'utf8');

describe('refonte 1.0.0 : barre fixe et gros bouton', () => {
  it('cinq places fixes : Accueil, Entraîner, Apprendre, Progrès, Profil', () => {
    expect(TABS.map((t) => t.label)).toEqual(['Accueil', 'Entraîner', 'Apprendre', 'Progrès', 'Profil']);
    for (const t of TABS) expect(navScreen(t.to), t.id).not.toBeNull();
  });
  it('chaque écran appartient à un espace, sauf une page inconnue', () => {
    for (const s of screens) if (s !== 'autre') expect(SECTION[s], s).not.toBeNull();
  });
  it('le gros bouton de chaque écran est une action de cet écran', () => {
    for (const [s, a] of Object.entries(PRIMARY)) expect(dockSlots(s as NavScreen).map((d) => d.slot.action), s).toContain(a);
  });
  it('un lien vers la page affichée n’est pas répété (Chrono sur le chrono), un lien vers une autre page du même écran reste', () => {
    expect(dockSlots('chrono', '/chrono').map((d) => d.slot.action)).not.toContain('nav:/chrono');
    expect(dockSlots('parametres', '/reglages').map((d) => d.slot.action)).toEqual(['nav:/reglages/affichage', 'nav:/reglages/affichage?focus=camera']);
  });
  it('aucune action d’écran ne disparaît : elle est au-dessus de la barre, ou c’est une des cinq places', () => {
    const tabRoots = TABS.map((t) => t.to);
    for (const s of screens) {
      const shown = dockSlots(s).map((d) => d.slot.action);
      for (const slot of NAV_CONFIG[s]) {
        if (slot.action === 'back' || slot.action === 'menu' || shown.includes(slot.action)) continue;
        const to = slot.action.slice(4);
        expect(slot.action.startsWith('nav:') && tabRoots.includes(to), `${s} → ${slot.action}`).toBe(true);
      }
    }
  });
  it('Retour reste sur tous les écrans de détail', () => {
    for (const s of screens) if (!ROOT_SCREENS.has(s)) expect(NAV_CONFIG[s].some((x) => x.action === 'back'), s).toBe(true);
  });
});

describe('refonte 1.0.0 : le contenu de l’ancien Menu est redistribué, rien n’est perdu', () => {
  const profile = read('src/ui/screens/account/Profile.tsx');
  const settings = read('src/ui/screens/Settings.tsx');
  const reach = (to: string): string | null => {
    if (TABS.some((t) => t.to === to)) return 'barre';
    for (const tabs of Object.values(SECTION_TABS)) if (tabs!.some((t) => t.to === to)) return 'onglets';
    if (profile.includes(`to="${to}"`)) return 'Profil';
    if (settings.includes(`to="${to}"`)) return 'Réglages';
    return null;
  };
  it.each(MENU_ENTRIES.map((m) => [m.label, m] as const))('%s', (_label, m) => {
    if (m.id === 'nouveautes') {
      expect(settings).toContain('data-testid="reglages-nouveautes"');
      expect(settings).toContain('onClick={openNews}');
      return;
    }
    expect(reach(m.to), m.to).not.toBeNull();
  });
  it('Profil : Mes infos, Mon coach, Coach IA et Réglages en onglets (lot 2)', () => {
    expect(sectionTabsFor('profil')?.map((t) => [t.label, t.to])).toEqual([
      ['Mes infos', '/profil'],
      ['Mon coach', '/coach'],
      ['Coach IA', '/coach-ia'],
      ['Réglages', '/reglages'],
    ]);
    for (const t of sectionTabsFor('profil')!) expect(t.screens.map((x) => navScreen(t.to) === x)).toContain(true);
  });
  it('Entraîner : Séance, Programmes, Enchaînements, Favoris, Chrono en onglets (lot 2)', () => {
    expect(sectionTabsFor('entrainer')?.map((t) => [t.label, t.to])).toEqual([
      ['Séance', '/entrainer'],
      ['Programmes', '/programmes'],
      ['Enchaînements', '/createur'],
      ['Favoris', '/favoris'],
      ['Chrono', '/chrono'],
    ]);
    for (const t of sectionTabsFor('entrainer')!) expect(t.screens.map((x) => navScreen(t.to) === x)).toContain(true);
  });
  it('sur le premier écran d’un onglet, un lien vers un autre onglet n’est pas répété au-dessus de la barre', () => {
    expect(dockSlots('entrainer', '/entrainer').map((d) => d.slot.action)).toEqual(['start']);
    expect(dockSlots('profil', '/profil').map((d) => d.slot.action)).toEqual([]);
    for (const s of screens)
      for (const t of sectionTabsFor(s) ?? [])
        if (t.screens.includes(s)) {
          const hidden = NAV_CONFIG[s].filter((x) => x.action.startsWith('nav:') && !dockSlots(s, t.to).some((d) => d.slot === x));
          const tabs = (sectionTabsFor(s) ?? []).map((x) => x.to);
          for (const x of hidden) expect(TABS.some((b) => b.to === x.action.slice(4)) || tabs.includes(x.action.slice(4)) || x.action.slice(4) === t.to, `${s} → ${x.action}`).toBe(true);
        }
  });
  it('les onglets ne s’affichent que sur les premiers écrans de l’espace', () => {
    expect(sectionTabsFor('techniques')?.map((t) => t.label)).toEqual(['Techniques', 'Légendes', 'Encyclopédie']);
    expect(sectionTabsFor('progres')?.map((t) => t.label)).toEqual(['Tableau', 'Historique', 'Objectifs']);
    expect(sectionTabsFor('programme')).toBeNull();
    expect(sectionTabsFor('createur-fiche')).toBeNull();
    expect(sectionTabsFor('fiche')).toBeNull();
    expect(sectionTabsFor('entrainement')).toBeNull();
  });
});
