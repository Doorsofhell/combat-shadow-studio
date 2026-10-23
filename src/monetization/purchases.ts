import type { PremiumStatus } from './rights';

/**
 * v0.40: the shape of the future payment integration, NOT implemented. Nothing in the app calls a store, stores a
 * receipt or simulates a validation. When payment is switched on, a provider implementing this interface (Google Play
 * Billing through Capacitor, with a server check of the purchase token) replaces the default source of rights.ts
 * (see setPurchaseSource) and docs/v040/PREMIUM.md lists each integration point.
 */
export interface PurchaseProvider {
  /** starts the one-time, non-consumable purchase of PREMIUM_OFFER.productId */
  purchase(): Promise<PurchaseResult>;
  /** restores a purchase made earlier (reinstall, new phone, same store account) */
  restore(): Promise<PremiumStatus>;
  /** asks the server to verify the purchase token; a local flag alone is never enough */
  verify(): Promise<PremiumStatus>;
  /** called when the store reports a refund or a revocation: the right is withdrawn */
  onRevoked(listener: () => void): () => void;
}

export type PurchaseResult = { kind: 'achete'; status: PremiumStatus } | { kind: 'annule' } | { kind: 'en-attente' } | { kind: 'erreur'; message: string };

/**
 * v0.45 (« Refonte page Premium à vie » §5, Restaurer): the one entry point of the restore, called by the bar's
 * Restaurer panel. No provider is registered in the app today (MONETIZATION_ENABLED is false, no store is wired),
 * so the answer is « indisponible »: no payment, no store call, no fake success. When a provider exists, its own
 * restore() answers and the status it returns is the only proof of a restored purchase.
 */
export type RestoreResult = { kind: 'indisponible' } | { kind: 'restaure' } | { kind: 'aucun-achat' } | { kind: 'erreur'; message: string };

let provider: PurchaseProvider | null = null;

/** integration point of the future store (Google Play Billing through Capacitor); only the unit tests call it today */
export function setPurchaseProvider(next: PurchaseProvider | null) {
  provider = next;
}

/** whether a real purchase system is wired: the Offre panel only offers actions that exist */
export const purchaseAvailable = () => provider !== null;

export async function restorePurchases(): Promise<RestoreResult> {
  if (!provider) return { kind: 'indisponible' };
  try {
    return (await provider.restore()) === 'premium_lifetime' ? { kind: 'restaure' } : { kind: 'aucun-achat' };
  } catch (e) {
    return { kind: 'erreur', message: e instanceof Error ? e.message : String(e) };
  }
}
