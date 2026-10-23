import { PREMIUM_BENEFITS, benefitAvailable } from '../../monetization/entitlements';
import { PREMIUM_OFFER, formatPrice } from '../../monetization/offer';
import { usePremiumStatus } from '../../monetization/rights';
import { PageHead } from '../components';
import { AppIcon } from '../icons';
import './premium.css';

/**
 * v0.40 (Youssef, 2026-10-22, « Préparation Freemium et Premium à vie » §7): the future Premium page. No payment is
 * possible: the button is disabled, nothing is simulated, no bank detail is asked, no store is called. A Premium
 * status (which nothing can grant today) replaces the purchase area.
 */
export function PremiumPage() {
  const status = usePremiumStatus();
  return (
    <div className="page" data-testid="premium-page">
      <PageHead title="Premium à vie" eyebrow="Menu" fallback="/" />
      <header className="premium-head">
        <span className="premium-gem" aria-hidden>
          <AppIcon id="diamond" size={40} tone="gold" />
        </span>
        <h1>{PREMIUM_OFFER.name}</h1>
        <p className="premium-tagline">« {PREMIUM_OFFER.tagline} »</p>
      </header>

      <ul className="premium-terms" aria-label="L’offre" data-testid="premium-terms">
        {['Achat unique', 'Accès Premium à vie', 'Aucun abonnement', 'Aucun renouvellement automatique'].map((t) => (
          <li key={t}>
            <AppIcon id="check" size={18} tone="success" /> {t}
          </li>
        ))}
      </ul>

      <section className="card">
        <h2>Ce que comprend Premium</h2>
        <ul className="premium-benefits" data-testid="premium-benefits">
          {PREMIUM_BENEFITS.map((b) => {
            const ok = benefitAvailable(b);
            return (
              <li key={b.label} data-available={ok}>
                <AppIcon id={ok ? 'check' : 'pending'} size={18} tone={ok ? 'success' : 'muted'} />
                <span>{b.label}</span>
                {!ok && <span className="premium-soon">À venir</span>}
              </li>
            );
          })}
        </ul>
        <p className="small muted">Tout ce qui est marqué d’un petit diamant doré dans l’application fait partie de Premium. Pendant la phase de préparation, tout reste accessible.</p>
      </section>

      {status === 'premium_lifetime' ? (
        <section className="card premium-active" data-testid="premium-active">
          <AppIcon id="diamond" size={28} tone="gold" />
          <b>Premium à vie activé</b>
        </section>
      ) : (
        <section className="card premium-buy" data-testid="premium-buy">
          <p className="premium-price" data-testid="premium-price">
            {formatPrice()}
            <small>{PREMIUM_OFFER.indicative ? 'Prix de lancement indicatif' : 'Paiement unique'}</small>
          </p>
          <button type="button" className="btn primary block" disabled aria-disabled="true" data-testid="premium-pay">
            Paiement bientôt disponible
          </button>
          <p className="small muted">Aucun paiement n’est possible pour le moment. Toutes les fonctionnalités restent accessibles pendant la phase de préparation.</p>
        </section>
      )}
    </div>
  );
}
