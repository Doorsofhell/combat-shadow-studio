import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ENTITLEMENT_BY_ID, type EntitlementId } from '../../monetization/entitlements';
import { shouldShowPremiumMarker, usePremiumStatus } from '../../monetization/rights';
import { AppIcon } from '../icons';
import './premium.css';

/**
 * v0.40 (Youssef, 2026-10-22, « Préparation Freemium et Premium à vie » §5): the small gold diamond beside a feature
 * that will be Premium. Purely informative: the feature stays open. A tap opens the Premium page and never reaches
 * the card or button around it. Nothing is rendered for a Premium user (no empty space left behind).
 *
 * 2.8.2 (Youssef, 2026-11-24): besides the section titles, every Premium item carries its own diamond (PremiumTag).
 */
export function PremiumMarker({ feature, size = 16 }: { feature: EntitlementId; size?: number }) {
  usePremiumStatus();
  const nav = useNavigate();
  if (!shouldShowPremiumMarker(feature)) return null;
  const e = ENTITLEMENT_BY_ID.get(feature)!;
  const open = (ev: MouseEvent) => {
    // the marker sits in titles and cards: it must not trigger their own action
    ev.preventDefault();
    ev.stopPropagation();
    nav(`/premium?f=${feature}`);
  };
  return (
    <button type="button" className="premium-marker" onClick={open} aria-label={`Premium : ${e.name}. Voir l’offre Premium à vie`} title="Premium à vie" data-testid={`premium-${feature}`} data-premium={feature}>
      <AppIcon id="diamond" size={size} tone="gold" />
    </button>
  );
}

/**
 * 2.8.2 (Youssef, 2026-11-24, « le petit diamant sur tous les items, options, programmes »): the diamond of ONE item
 * (a programme, an exercise, a technique, a coach, a button). Not a button: it sits inside cards and buttons that keep
 * their own action, and the item stays open. Named for screen readers; nothing for a Premium user.
 */
export function PremiumTag({ feature, size = 14 }: { feature: EntitlementId; size?: number }) {
  usePremiumStatus();
  if (!shouldShowPremiumMarker(feature)) return null;
  return (
    <span className="premium-tag" role="img" aria-label="Premium" title="Premium à vie" data-testid="premium-tag" data-premium={feature}>
      <AppIcon id="diamond" size={size} tone="gold" />
    </span>
  );
}
