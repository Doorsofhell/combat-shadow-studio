import type { MouseEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ENTITLEMENT_BY_ID, type EntitlementId } from '../../monetization/entitlements';
import { hasPremium, isFeatureLocked, shouldShowPremiumMarker, useRights } from '../../monetization/rights';
import type { ProgramShare } from '../../monetization/premiumItems';
import { AppIcon } from '../icons';
import './premium.css';

/**
 * 2.9.0 (Youssef, 2026-11-25, « Shadow Studio — Identification visuelle des contenus Freemium et Premium »): the ONE
 * set of Premium marks of the app, all drawn by premium.css.
 * - ProBadge: the « PRO » micro-badge, right after a title; the only recurring sign of the Shadow Pro catalogue, shown to
 *   everyone (a Premium user keeps it: it names what the purchase brings);
 * - ProLock: the small gold padlock, ONLY for a real restriction of this user (never for a mere catalogue membership);
 * - ProShield: the gold shield of a Premium user, in the profile.
 * Which item is PRO and whether it opens is decided in src/monetization (premiumItems.ts, rights.ts), never here.
 *
 * History: v0.40 diamond on screen titles (PremiumMarker), 2.8.2 one diamond per item (PremiumTag), then the gold corner
 * (option C); both replaced by the PRO badge, same component names so every screen kept its single call.
 */
export function ProBadge({ label = 'PRO', title = 'Contenu Shadow Pro', testid = 'pro-badge', feature }: { label?: string; title?: string; testid?: string; feature?: string }) {
  return (
    <span className="pro-badge" role="img" aria-label={title} title={title} data-testid={testid} data-premium={feature}>
      {label}
    </span>
  );
}

/**
 * the badge of a screen or a section title (a Premium feature). For a free user it opens the Shadow Pro page without
 * reaching the title or the card around it; for a Premium user it is a plain badge (no sales prompt).
 */
export function PremiumMarker({ feature }: { feature: EntitlementId; size?: number }) {
  useRights();
  const nav = useNavigate();
  if (!shouldShowPremiumMarker(feature)) return null;
  const e = ENTITLEMENT_BY_ID.get(feature)!;
  if (hasPremium()) return <ProBadge feature={feature} testid={`premium-${feature}`} title={`${e.name} : inclus dans Shadow Pro`} />;
  const open = (ev: MouseEvent) => {
    // the badge sits in titles and cards: it must not trigger their own action
    ev.preventDefault();
    ev.stopPropagation();
    nav(`/premium?f=${feature}`);
  };
  return (
    <button type="button" className="premium-marker" onClick={open} aria-label={`Shadow Pro : ${e.name}. Voir l’offre`} title="Shadow Pro" data-testid={`premium-${feature}`} data-premium={feature}>
      <span className="pro-badge" aria-hidden>
        PRO
      </span>
    </button>
  );
}

/** the badge of ONE item (programme, session, exercise, technique, coach, option): not a button, the item keeps its action */
export function PremiumTag({ feature }: { feature: EntitlementId; size?: number }) {
  useRights();
  if (!shouldShowPremiumMarker(feature)) return null;
  return <ProBadge feature={feature} testid="premium-tag" />;
}

/** a programme: nothing when free, « PRO » when every session is, « 3/6 PRO » when mixed (computed, never stored) */
export function ProgramProBadge({ share }: { share: ProgramShare }) {
  useRights();
  if (share.kind === 'gratuit' || !shouldShowPremiumMarker('all_programs')) return null;
  if (share.kind === 'pro') return <ProBadge feature="all_programs" testid="premium-tag" />;
  return <ProBadge feature="all_programs" testid="premium-tag" label={`${share.pro}/${share.total} PRO`} title={`${share.pro} séance${share.pro > 1 ? 's' : ''} sur ${share.total} dans Shadow Pro`} />;
}

/** the gold padlock of a locked item; `size` follows the icon it replaces */
export function ProLock({ size = 16 }: { size?: number }) {
  return (
    <span className="pro-lock" role="img" aria-label="Verrouillé : Shadow Pro" title="Verrouillé : Shadow Pro" data-testid="pro-lock">
      <AppIcon id="locked" size={size} />
    </span>
  );
}

/** the launch icon of an item, or the padlock in its place when the item is locked for this user */
export function LaunchOrLock({ locked, size, children }: { locked: boolean; size?: number; children: ReactNode }) {
  return locked ? <ProLock size={size} /> : <>{children}</>;
}

/** the status of a Premium user, in the profile (nothing for a free user: no « FREE » badge) */
export function ProShield({ compact = false }: { compact?: boolean }) {
  useRights();
  if (!hasPremium()) return null;
  return (
    <span className={`pro-shield${compact ? ' compact' : ''}`} role="img" aria-label="Membre Shadow Pro" title="Membre Shadow Pro" data-testid="pro-shield">
      <AppIcon id="shield" size={compact ? 12 : 14} />
      <span aria-hidden>PRO</span>
    </span>
  );
}

/**
 * the tap on a locked item: opens the Shadow Pro page instead of the item. Returns a click handler for the item, which
 * does nothing when the item is open. The screens that start an item check again (guards), so a hidden button or a
 * typed address is never the only barrier.
 */
export function useProGate() {
  useRights();
  const nav = useNavigate();
  return (feature: EntitlementId, locked: boolean) => (ev: MouseEvent) => {
    if (!locked) return;
    ev.preventDefault();
    ev.stopPropagation();
    nav(`/premium?f=${feature}`);
  };
}

export { isFeatureLocked };
