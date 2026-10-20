import { useLayoutEffect, useRef } from 'react';
import { create } from 'zustand';
import { useProfile } from '../../store/profile';
import { useCoachBubble } from '../coach-ai/coachHost';
import { AppIcon } from '../icons';
import { pillItems, type PillAction } from './actionPill';

export type { PillAction } from './actionPill';

/**
 * 0.26 (Youssef, 2026-10-20 12:34: « un système d'icônes flottantes […] qui permettrait de lancer les actions
 * les plus courantes. Les icônes changent en fonction du contexte de l'écran », mockup C chosen at 17:45):
 * one floating pill for the whole app, at the bottom left above the navigation; the Coach IA bubble stays
 * alone at the bottom right. A screen declares its actions with useActionPill (like coachHost for the
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

/** the pill itself, drawn once in App next to the Coach IA bubble */
export function ActionPill() {
  const items = useActionPillStore((s) => s.items);
  const run = useActionPillStore((s) => s.run);
  const completed = useProfile((s) => s.profile.completed);
  // while the Coach IA panel is open, the screen is in the background: one thing at a time
  const coachOpen = useCoachBubble((s) => s.open);
  if (!items.length || !completed || coachOpen) return null;
  return (
    <div className="action-pill" role="group" aria-label="Actions rapides de l’écran" data-testid="action-pill">
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
    </div>
  );
}
