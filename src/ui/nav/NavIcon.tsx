import { NAV_ICONS, type NavIconId } from './icons';

/**
 * An icon of the navigation, drawn exactly as in the mockup: `<svg viewBox="0 0 24 24">` with the registry's
 * paths, 21 × 21 px, stroke 1.8, round caps and joins (nav.css). The paths are constants of the app, never user text.
 */
export function NavIcon({ id, className }: { id: NavIconId; className?: string }) {
  return <svg className={`nav-svg ${className ?? ''}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false" data-nav-icon={id} dangerouslySetInnerHTML={{ __html: NAV_ICONS[id] }} />;
}
