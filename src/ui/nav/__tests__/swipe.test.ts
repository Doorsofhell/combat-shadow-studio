import { describe, expect, it } from 'vitest';
import { SECTION_TABS } from '../config';
import { swipeDirection, swipeTab } from '../swipe';

// 1.0.0 (refonte, lot 4): a horizontal swipe on a page with tabs opens the next or previous tab
describe('glisser pour changer d’onglet', () => {
  it('un glissement court, lent ou plutôt vertical n’est pas un geste', () => {
    expect(swipeDirection(-40, 0, 200)).toBe(0);
    expect(swipeDirection(-120, 0, 900)).toBe(0);
    expect(swipeDirection(-100, 90, 200)).toBe(0);
  });
  it('doigt vers la gauche : onglet suivant ; vers la droite : onglet précédent', () => {
    expect(swipeDirection(-120, 10, 250)).toBe(1);
    expect(swipeDirection(120, -10, 250)).toBe(-1);
  });
  it('suit l’ordre des onglets et s’arrête aux bouts', () => {
    const tabs = SECTION_TABS.entrainer!;
    expect(swipeTab(tabs, 'seance', 1)?.id).toBe('programmes');
    expect(swipeTab(tabs, 'favoris', 1)?.id).toBe('chrono');
    expect(swipeTab(tabs, 'seance', -1)).toBeNull();
    expect(swipeTab(tabs, 'chrono', 1)).toBeNull();
    expect(swipeTab(tabs, 'programmes', 0)).toBeNull();
  });
});
