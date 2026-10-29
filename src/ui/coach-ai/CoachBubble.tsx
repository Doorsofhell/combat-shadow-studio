import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import type { CoachAction } from '../../coach/engine';
import { useProfile } from '../../store/profile';
import { useSettings } from '../../store/settings';
import { CoachAskPanel } from './CoachAskPanel';
import { useCoachBubble } from './coachHost';
import { useCoachContext } from './useCoachContext';

/**
 * Screens without the bubble: onboarding (the profile is not made yet, and its buttons sit at the
 * bottom of the screen), the full coach page (the coach is already open there) and the dev lab.
 */
const HIDDEN = ['/bienvenue', '/lab', '/coach-ia'];
/** screens whose bubble lives in the screen itself (registered as host), never fixed over its controls */
const HOSTED = ['/entrainement'];

const under = (pathname: string, p: string) => pathname === p || pathname.startsWith(`${p}/`);

/**
 * The AI coach's question panel, the same on every screen (0.25 « identique sur tous les écrans »). v0.32
 * (navigation dynamique: « aucun bouton flottant ») the floating bubble is gone: the panel opens from « Coach IA »
 * in the Menu sheet of the bottom bar, and closes with its own button or Échap.
 * The coach knows the screen it is opened from and what is on it when the route says so: the technique
 * of a sheet, the discipline, the open exercise, the programme or the legend combination. On the
 * training screen, the session registers as host (see coachHost.ts): the bubble sits in the lower right
 * corner of the coach's stage, opening it pauses the session, and demo / slow motion / repeat act on
 * the player.
 */
export function CoachBubble() {
  const loc = useLocation();
  const profile = useProfile((s) => s.profile);
  const open = useCoachBubble((s) => s.open);
  const setOpen = useCoachBubble((s) => s.setOpen);
  const host = useCoachBubble((s) => s.host);
  // 0.27 (Youssef, 2026-10-20 21:59): réduit / normal / agrandi, chosen in the panel and remembered
  const size = useSettings((s) => s.settings.coachPanelSize);
  const hidden = HIDDEN.some((p) => under(loc.pathname, p));
  const hosted = HOSTED.some((p) => under(loc.pathname, p));
  const { context, act } = useCoachContext(hosted);

  // a new screen starts with the bubble closed
  useEffect(() => setOpen(false), [loc.pathname, setOpen]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  if (hidden || !profile.completed) return null;
  // the training screen shows it once the session is ready (its stage is the bubble's place)
  if (hosted && !host) return null;
  const inHost = hosted ? host : null;

  const onAction = (a: CoachAction) => {
    if (!inHost) setOpen(false);
    act(a);
  };

  if (!open) return null;
  const panel = (
    <div className={inHost ? `tr-ask size-${size}` : `coach-bubble-panel size-${size} from-pill`} role="dialog" aria-label="Coach IA" data-testid="coach-bubble-panel">
      <CoachAskPanel context={context} onAction={onAction} onClose={() => setOpen(false)} />
    </div>
  );
  // in the training stage the open panel takes the lower part of the stage
  if (inHost) return createPortal(panel, inHost.slot);
  return panel;
}
