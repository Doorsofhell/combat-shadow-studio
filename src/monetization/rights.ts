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

/**
 * 2.9.0 (Youssef, 2026-11-25, « Identification visuelle Freemium / Premium »): the preview build only
 * (VITE_PREMIUM_SIMULATION=1, src/monetization/simulation.ts) can turn the restrictions on to show the locks. Production
 * builds never call this: the simulation module is not even bundled there, and nothing stored by the user can reach it.
 */
let simulatedRestrictions = false;
export function setRestrictionsSimulated(on: boolean) {
  simulatedRestrictions = on;
  listeners.forEach((l) => l());
}

/** whether the free limits are really applied (payment switched on, or the preview simulation) */
export const restrictionsActive = () => MONETIZATION_ENABLED || simulatedRestrictions;

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

/**
 * the PRO badge: for a feature that exists and whose commercial choice is made. 2.9.0 (Youssef, « les micro-badges PRO
 * restent visibles » for a Premium user): it says the feature belongs to the Shadow Pro catalogue, whoever looks at it;
 * whether it opens is canAccessFeature's answer, never this one.
 */
export function shouldShowPremiumMarker(id: EntitlementId): boolean {
  return !!ENTITLEMENT_BY_ID.get(id)?.marker;
}

/** whether the feature may open. While the restrictions are off (today, in production): always. */
export function canAccessFeature(id: EntitlementId): boolean {
  if (!restrictionsActive()) return true;
  return hasPremium() || !isPremiumFeature(id);
}

/** the padlock: a real restriction for this user, now (never a mere catalogue membership) */
export const isFeatureLocked = (id: EntitlementId) => !canAccessFeature(id);

const subscribe = (l: () => void) => (listeners.add(l), () => listeners.delete(l));

/** the status, re-rendering when the source changes */
export function usePremiumStatus(): PremiumStatus {
  return useSyncExternalStore(subscribe, premiumStatus, premiumStatus);
}

const snapshot = () => `${premiumStatus()}|${restrictionsActive() ? 1 : 0}`;
/** re-renders when the status OR the restrictions change (the padlocks depend on both) */
export function useRights(): string {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
