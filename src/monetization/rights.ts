import { useSyncExternalStore } from 'react';
import { ENTITLEMENT_BY_ID, type EntitlementId } from './entitlements';

/**
 * v0.40 (Youssef, 2026-10-22, « Préparation Freemium et Premium à vie »): the rights of the user, kept apart from the
 * screens. Three layers:
 * - display: shouldShowPremiumMarker (the small diamond), read by PremiumMarker;
 * - check: canAccessFeature, the only question a screen will ever ask before opening a Premium feature;
 * - source: where the status comes from. Today a source that always answers « free »: there is no purchase, no
 *   receipt and nothing the user can switch on. Later a verified store purchase (purchases.ts).
 *
 * While MONETIZATION_ENABLED is false, canAccessFeature answers yes to everything: no limit, no paywall, no payment
 * call, sessions unchanged.
 */
export const MONETIZATION_ENABLED = false;

export type PremiumStatus = 'free' | 'premium_lifetime';

export interface RightsSource {
  id: string;
  status(): PremiumStatus;
}

/** today's only source: no purchase can exist, so everyone is « free » (and still has everything) */
export const NO_PURCHASE_SOURCE: RightsSource = { id: 'aucun-achat', status: () => 'free' };

let source: RightsSource = NO_PURCHASE_SOURCE;
const listeners = new Set<() => void>();

/**
 * Replaces the source of the status. Integration point of the future verified purchase; today only the unit tests
 * call it (nothing in the app, no route, no setting, no global exposes it).
 */
export function setRightsSource(next: RightsSource) {
  source = next;
  listeners.forEach((l) => l());
}

export function premiumStatus(): PremiumStatus {
  return source.status();
}

export function hasPremium(): boolean {
  return premiumStatus() === 'premium_lifetime';
}

export function isPremiumFeature(id: EntitlementId): boolean {
  return ENTITLEMENT_BY_ID.has(id);
}

/** the diamond: for a feature that exists and whose commercial choice is made, hidden for a Premium user */
export function shouldShowPremiumMarker(id: EntitlementId): boolean {
  return !!ENTITLEMENT_BY_ID.get(id)?.marker && !hasPremium();
}

/** whether the feature may open. During the preparation phase: always. */
export function canAccessFeature(id: EntitlementId): boolean {
  if (!MONETIZATION_ENABLED) return true;
  return hasPremium() || !isPremiumFeature(id);
}

const subscribe = (l: () => void) => (listeners.add(l), () => listeners.delete(l));

/** the status, re-rendering when the source changes */
export function usePremiumStatus(): PremiumStatus {
  return useSyncExternalStore(subscribe, premiumStatus, premiumStatus);
}
