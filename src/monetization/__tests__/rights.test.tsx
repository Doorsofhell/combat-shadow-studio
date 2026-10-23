import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { ENTITLEMENTS, PREMIUM_BENEFITS, PREMIUM_CATEGORIES, benefitAvailable, type EntitlementId } from '../entitlements';
import { restorePurchases, setPurchaseProvider, type PurchaseProvider } from '../purchases';
import { formatPrice, PREMIUM_OFFER } from '../offer';
import { MONETIZATION_ENABLED, NO_PURCHASE_SOURCE, canAccessFeature, hasPremium, isPremiumFeature, premiumStatus, setRightsSource, shouldShowPremiumMarker } from '../rights';
import { PremiumMarker } from '../../ui/premium/PremiumMarker';
import { PremiumPage } from '../../ui/premium/PremiumPage';

// v0.40 (Youssef, 2026-10-22, « Préparation Freemium et Premium à vie » §11). The Premium status below is injected
// here only, through the source of the rights: nothing in the app can grant it.
const PREMIUM = { id: 'test-premium', status: () => 'premium_lifetime' as const };
const ids = ENTITLEMENTS.map((e) => e.id);

let root: Root | null = null;
let host: HTMLDivElement | null = null;
function mount(node: React.ReactNode, path = '/') {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root!.render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={node} />
          <Route path="/premium" element={<div data-testid="on-premium" />} />
        </Routes>
      </MemoryRouter>,
    ),
  );
  return host;
}
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  setRightsSource(NO_PURCHASE_SOURCE);
});

describe('catalogue des droits', () => {
  it('identifiants uniques, chaque entrée complète', () => {
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of ENTITLEMENTS) {
      expect(e.name.length, e.id).toBeGreaterThan(3);
      expect(e.description.length, e.id).toBeGreaterThan(10);
      expect(e.freeLimit.length, e.id).toBeGreaterThan(2);
      // a marker only on a feature that exists and whose commercial choice is made
      if (e.marker) expect([e.implementation, e.readiness], e.id).toEqual(['implemente', 'pret']);
      if (e.implementation === 'prevu') expect(e.screens, e.id).toEqual([]);
    }
  });
  it('la page n’annonce comme disponible que ce qui existe', () => {
    expect(PREMIUM_BENEFITS).toHaveLength(8);
    expect(PREMIUM_BENEFITS[0].label).toBe('Création illimitée d’enchaînements personnalisés');
    expect(PREMIUM_BENEFITS.filter((b) => !benefitAvailable(b)).map((b) => b.label)).toEqual(['Tous les combattants et rendus', 'Réglages avancés d’entraînement']);
  });
  it('prix centralisé, indicatif', () => {
    expect(formatPrice()).toBe('39,99 € TTC');
    expect(PREMIUM_OFFER.indicative).toBe(true);
  });
});

describe('statut Free (préparation)', () => {
  it('monétisation désactivée : tout est accessible, marqueurs visibles', () => {
    expect(MONETIZATION_ENABLED).toBe(false);
    expect(premiumStatus()).toBe('free');
    expect(hasPremium()).toBe(false);
    for (const id of ids) {
      expect(isPremiumFeature(id)).toBe(true);
      expect(canAccessFeature(id), id).toBe(true);
    }
    expect(shouldShowPremiumMarker('unlimited_combos')).toBe(true);
    // undecided or not built: no marker
    expect(shouldShowPremiumMarker('anime_rendering')).toBe(false);
    expect(shouldShowPremiumMarker('all_fighters')).toBe(false);
  });
  it('le marqueur ouvre la page Premium sans déclencher l’action autour de lui', () => {
    let cardClicks = 0;
    const el = mount(
      <button type="button" onClick={() => cardClicks++}>
        Carte <PremiumMarker feature="unlimited_combos" />
      </button>,
    );
    const m = el.querySelector('[data-testid="premium-unlimited_combos"]') as HTMLButtonElement;
    expect(m.getAttribute('aria-label')).toBe('Premium : Enchaînements personnels illimités. Voir l’offre Premium à vie');
    act(() => m.click());
    expect(cardClicks).toBe(0);
    expect(el.querySelector('[data-testid="on-premium"]')).not.toBeNull();
  });
  // v0.45 (Youssef, 2026-10-23, « Refonte page Premium à vie »): one line of terms instead of four cards, the six
  // categories in a 2 × 3 grid, the price and the purchase only in the « Offre Premium » panel
  it('page v0.45 : une seule mention commerciale, six catégories, une bande « à venir », un seul bouton', () => {
    const el = mount(<PremiumPage />);
    expect(el.querySelector('[data-testid="premium-terms"]')!.textContent).toBe('Un paiement. À vie. Sans abonnement.');
    expect([...el.querySelectorAll('.premium-grid li')].map((l) => l.textContent)).toEqual(['Enchaînements', 'Coaching 3D', '6 disciplines', 'Programmes', 'Statistiques', 'Historique']);
    expect(el.querySelector('[data-testid="premium-soon"]')!.textContent).toBe('Combattants et réglages avancés : à venir');
    // the band names exactly the benefits that do not exist yet
    expect(PREMIUM_BENEFITS.filter((b) => !benefitAvailable(b)).map((b) => b.label)).toEqual(['Tous les combattants et rendus', 'Réglages avancés d’entraînement']);
    // every category is backed by features that exist
    for (const c of PREMIUM_CATEGORIES) expect(benefitAvailable(c), c.id).toBe(true);
    expect(el.querySelectorAll('button')).toHaveLength(1);
    expect(el.querySelector('[data-testid="premium-discover"]')!.textContent).toContain('Découvrir l’offre');
    // no price on the page itself, no Premium status
    expect(el.querySelector('[data-testid="premium-price"]')).toBeNull();
    expect(el.textContent).not.toContain('€');
    expect(el.querySelector('[data-testid="premium-active"]')).toBeNull();
  });
  it('panneau Offre : prix indicatif seulement, aucune option d’achat, aucun statut Premium', () => {
    const el = mount(<PremiumPage />);
    act(() => (el.querySelector('[data-testid="premium-discover"]') as HTMLButtonElement).click());
    const panel = document.querySelector('[data-testid="premium-panel-offer"]')!;
    expect(panel.querySelector('[data-testid="premium-price"]')!.textContent).toBe('39,99 € TTC');
    expect(panel.textContent).toContain('Prix de lancement indicatif');
    act(() => (panel.querySelector('[data-testid="premium-pay"]') as HTMLButtonElement).click());
    expect(panel.querySelector('[data-testid="offer-result"]')!.textContent).toContain('Aucune option d’achat n’est disponible pour le moment');
    expect(premiumStatus()).toBe('free');
    // the six benefits are not listed again in the offer
    for (const c of PREMIUM_CATEGORIES) expect(panel.textContent).not.toContain(c.detail);
  });
});

describe('statut Premium (injecté par le test)', () => {
  it('marqueurs masqués sans espace résiduel, tout reste accessible', () => {
    setRightsSource(PREMIUM);
    expect(hasPremium()).toBe(true);
    for (const id of ids as EntitlementId[]) {
      expect(shouldShowPremiumMarker(id)).toBe(false);
      expect(canAccessFeature(id)).toBe(true);
    }
    const el = mount(
      <h2>
        Mes enchaînements<PremiumMarker feature="unlimited_combos" />
      </h2>,
    );
    expect(el.querySelector('h2')!.innerHTML).toBe('Mes enchaînements');
  });
  it('page : « Premium à vie activé », ni prix ni bouton de paiement', () => {
    setRightsSource(PREMIUM);
    const el = mount(<PremiumPage />);
    expect(el.querySelector('[data-testid="premium-active"]')!.textContent).toContain('Premium à vie activé');
    expect(el.querySelector('[data-testid="premium-discover"]')).toBeNull();
    expect(el.querySelector('[data-testid="premium-pay"]')).toBeNull();
    expect(el.querySelector('[data-testid="premium-price"]')).toBeNull();
  });
  it('le marqueur disparaît dès que le statut change', () => {
    const el = mount(<PremiumMarker feature="full_history" />);
    expect(el.querySelector('[data-premium="full_history"]')).not.toBeNull();
    act(() => setRightsSource(PREMIUM));
    expect(el.querySelector('[data-premium="full_history"]')).toBeNull();
  });
});

// v0.45 « Restaurer »: the real entry point; without a store wired it says so and never reports a success
describe('restauration des achats', () => {
  afterEach(() => setPurchaseProvider(null));
  const fake = (restore: PurchaseProvider['restore']): PurchaseProvider => ({ purchase: async () => ({ kind: 'annule' }), restore, verify: async () => 'free', onRevoked: () => () => {} });
  it('sans système d’achat : « indisponible », statut inchangé', async () => {
    expect(await restorePurchases()).toEqual({ kind: 'indisponible' });
    expect(premiumStatus()).toBe('free');
  });
  it('avec un fournisseur (injecté par le test) : restauré, aucun achat ou erreur selon sa réponse', async () => {
    setPurchaseProvider(fake(async () => 'premium_lifetime'));
    expect(await restorePurchases()).toEqual({ kind: 'restaure' });
    setPurchaseProvider(fake(async () => 'free'));
    expect(await restorePurchases()).toEqual({ kind: 'aucun-achat' });
    setPurchaseProvider(
      fake(async () => {
        throw new Error('réseau');
      }),
    );
    expect(await restorePurchases()).toEqual({ kind: 'erreur', message: 'réseau' });
  });
  it('panneau Restaurer : message clair, aucune fausse réussite', async () => {
    const el = mount(<PremiumPage />);
    expect(el).toBeTruthy();
    // the panel is opened from the bar; here through the page's own action
    const { useNavStore } = await import('../../ui/nav/store');
    act(() => useNavStore.getState().run('restore'));
    const panel = document.querySelector('[data-testid="premium-panel-restore"]')!;
    await act(async () => (panel.querySelector('[data-testid="restore-now"]') as HTMLButtonElement).click());
    const r = panel.querySelector('[data-testid="restore-result"]')!;
    expect(r.getAttribute('data-kind')).toBe('indisponible');
    expect(r.textContent).toContain('pas encore disponible');
    expect(r.getAttribute('role')).toBe('status');
    expect(premiumStatus()).toBe('free');
  });
});
