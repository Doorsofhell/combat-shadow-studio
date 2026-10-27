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
  it('aucune action d’écran ne disparaît : elle est au-dessus de la barre, ou c’est une des cinq places, ou l’écran lui-même', () => {
    const tabRoots = TABS.map((t) => t.to);
    for (const s of screens) {
      const shown = dockSlots(s).map((d) => d.slot.action);
      for (const slot of NAV_CONFIG[s]) {
        if (slot.action === 'back' || slot.action === 'menu' || shown.includes(slot.action)) continue;
        const to = slot.action.slice(4);
        expect(slot.action.startsWith('nav:') && (tabRoots.includes(to) || navScreen(to) === s), `${s} → ${slot.action}`).toBe(true);
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
  it('Profil mène à Mon coach, Coach IA et Réglages', () => {
    for (const to of ['/coach', '/coach-ia', '/reglages']) expect(profile).toContain(`to="${to}"`);
  });
  it('les onglets ne s’affichent que sur les premiers écrans de l’espace', () => {
    expect(sectionTabsFor('techniques')?.map((t) => t.label)).toEqual(['Techniques', 'Légendes', 'Encyclopédie']);
    expect(sectionTabsFor('progres')?.map((t) => t.label)).toEqual(['Tableau', 'Historique', 'Objectifs']);
    expect(sectionTabsFor('fiche')).toBeNull();
    expect(sectionTabsFor('entrainement')).toBeNull();
  });
});
