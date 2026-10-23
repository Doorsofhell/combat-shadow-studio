/**
 * v0.40: the Premium offer, in one place (Youssef: « Prévoir une configuration centralisée… Ne pas le disperser dans
 * plusieurs composants »). One purchase, Premium for life, no subscription. The price stays indicative until a
 * commercial catalogue (Google Play) is switched on; then the store's own localized price replaces it.
 */
export const PREMIUM_OFFER = {
  name: 'Combat Shadow Studio Premium',
  tagline: 'Tous tes entraînements. Sans limites.',
  /** in cents, tax included */
  priceCents: 3999,
  currency: 'EUR',
  /** true while no store catalogue is active: the page says « prix indicatif » */
  indicative: true,
  /** the future product id of the non-consumable purchase (not created in any store yet) */
  productId: 'premium_lifetime',
} as const;

/** « 39,99 € TTC » */
export function formatPrice(cents: number = PREMIUM_OFFER.priceCents): string {
  return `${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100)} € TTC`;
}
