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
