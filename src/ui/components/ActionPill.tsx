import { useEffect, useLayoutEffect, useRef } from 'react';
import { create } from 'zustand';
import { useProfile } from '../../store/profile';
import { useSettings } from '../../store/settings';
import { useCoachBubble } from '../coach-ai/coachHost';
import { AppIcon } from '../icons';
import { pillItems, type PillAction } from './actionPill';

export type { PillAction } from './actionPill';

/**
 * 0.26 (Youssef, 2026-10-20 12:34: « un système d'icônes flottantes […] qui permettrait de lancer les actions
 * les plus courantes. Les icônes changent en fonction du contexte de l'écran », mockup C chosen at 17:45):
 * one floating pill for the whole app, at the bottom left above the navigation; the Coach IA bubble stays
 * alone at the bottom right (0.27: inside the pill, last button, where there is a pill). A screen declares its actions with useActionPill (like coachHost for the
 * bubble); a screen that declares nothing has no pill (settings, profile, onboarding, coach page, lab,
 * training studio).
 */
type PillView = Omit<PillAction, 'onSelect'>;

interface PillState {
  /** the screen that owns the pill right now (an object of its own, so a late cleanup never clears another screen) */
  owner: object | null;
  items: PillView[];
  run: (id: string) => void;
}

const idle = () => undefined;

export const useActionPillStore = create<PillState>(() => ({ owner: null, items: [], run: idle }));

/**
 * Declares the pill of a screen while it is shown. The list is read on every render (so the actions always
 * act on the screen's current state) but the pill only redraws when what it shows changes.
 */
export function useActionPill(actions: readonly (PillAction | false | null | undefined)[] | null) {
  const items = pillItems(actions);
  const ref = useRef(items);
  ref.current = items;
  // the callbacks are left out of the key (JSON drops functions)
  const key = JSON.stringify(items);
  // a layout effect: React cleans it up when the screen is hidden behind the loading fallback of the next
  // (lazy) screen, so a screen never leaves its pill over another one
  useLayoutEffect(() => {
    const views = JSON.parse(key) as PillView[];
    if (!views.length) return;
    const owner = {};
    useActionPillStore.setState({ owner, items: views, run: (id) => ref.current.find((a) => a.id === id)?.onSelect() });
    return () => {
      if (useActionPillStore.getState().owner === owner) useActionPillStore.setState({ owner: null, items: [], run: idle });
    };
  }, [key]);
}

/** the pill's Coach button opened the panel: focus goes back to it when the panel closes */
let coachFromPill = false;

/**
 * The pill itself, drawn once in App next to the Coach IA bubble.
 * 0.27 (Youssef, 2026-10-20 21:45: « intégrer le coach IA dans la barre d'icône dynamique. Il faut prévoir une
 * option pour enrouler / dérouler »): the Coach IA is the last button of the pill (the bubble is not drawn where
 * the pill is, see CoachBubble), and the chevron at the right end folds the pill into a round handle. The choice
 * is a setting of the user (settings store, kept after a reload).
 */
export function ActionPill() {
  const items = useActionPillStore((s) => s.items);
  const run = useActionPillStore((s) => s.run);
  const completed = useProfile((s) => s.profile.completed);
  // while the Coach IA panel is open, the screen is in the background: one thing at a time
  const coachOpen = useCoachBubble((s) => s.open);
  const setCoachOpen = useCoachBubble((s) => s.setOpen);
  const collapsed = useSettings((s) => s.settings.actionPillCollapsed);
  const setSettings = useSettings((s) => s.set);
  const coachBtn = useRef<HTMLButtonElement>(null);
  const shown = items.length > 0 && completed && !coachOpen;

  useEffect(() => {
    if (!shown || !coachFromPill) return;
    coachFromPill = false;
    coachBtn.current?.focus({ preventScroll: true });
  }, [shown]);

  if (!shown) return null;
  const fold = (
    <button
      key="fold"
      type="button"
      className="ap-fold"
      aria-expanded={!collapsed}
      aria-label={collapsed ? 'Déplier les actions' : 'Replier les actions'}
      onClick={() => setSettings({ actionPillCollapsed: !collapsed })}
      data-testid="pill-fold"
    >
      <AppIcon id={collapsed ? 'quickActions' : 'fold'} size={collapsed ? 24 : 18} />
    </button>
  );
  return (
    <div className={`action-pill${collapsed ? ' folded' : ''}`} role="group" aria-label="Actions rapides de l’écran" data-testid="action-pill" data-collapsed={collapsed}>
      {!collapsed && (
        <>
          {items.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`ap-btn${a.primary ? ' primary' : ''}${a.pressed ? ' on' : ''}`}
              aria-label={a.ariaLabel}
              aria-pressed={a.pressed === undefined ? undefined : a.pressed}
              onClick={() => run(a.id)}
              data-testid={a.testId ?? `pill-${a.id}`}
              data-pill-action={a.id}
            >
              <AppIcon id={a.icon} size={22} />
              <span className="ap-label">{a.label}</span>
            </button>
          ))}
          <button
            key="coach"
            ref={coachBtn}
            type="button"
            className="ap-btn coach"
            aria-label="Coach IA"
            aria-haspopup="dialog"
            aria-expanded={false}
            onClick={() => {
              coachFromPill = true;
              setCoachOpen(true);
            }}
            data-testid="pill-coach"
          >
            <AppIcon id="coach" size={22} />
            <span className="ap-label">Coach</span>
          </button>
        </>
      )}
      {fold}
    </div>
  );
}
