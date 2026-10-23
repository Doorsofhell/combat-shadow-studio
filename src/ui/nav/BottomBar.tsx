import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { hasUnseenRelease } from '../../domain/releases';
import { useProfile } from '../../store/profile';
import { useSettings } from '../../store/settings';
import { NAV_CONFIG, NAV_PARENT, navScreen, slotRole, type NavScreen, type NavSlot } from './config';
import { pushLayer } from './layers';
import { NavIcon } from './NavIcon';
import { leave, useNavStore } from './store';
import './nav.css';

/** a short tick where the device can (Android Chrome and WebView); nothing elsewhere */
export function haptic() {
  try {
    navigator.vibrate?.(8);
  } catch {
    // not allowed: no tick
  }
}

/**
 * Smart back (section 11): the real previous page of the app, with its filters, search and scroll position (they
 * are in its URL or restored by ScrollMemory); when the screen was opened directly, its parent.
 */
export function useSmartBack() {
  const nav = useNavigate();
  return (screen: NavScreen) => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) nav(-1);
    else nav(NAV_PARENT[screen], { replace: true });
  };
}

/** opens the « Navigation générale » sheet as a history layer (Back closes it first) */
export function openMenu() {
  const st = useNavStore.getState();
  if (st.sheet) return;
  const layer = pushLayer(() => useNavStore.getState().setSheet(null));
  st.setSheet('menu', layer);
}

/**
 * v0.32 (PROMPT MAÎTRE navigation): the one bottom bar of the app, five places of equal width, as in the mockup
 * (docs/design/navigation-dynamique-reference.html: `.bottom`, `.bar`, `.navbtn`). The icons and words follow the
 * screen (NAV_CONFIG); the screen gives its own actions (useNavActions). When the screen changes, the bar plays the
 * mockup's `swap` (260 ms); a change of state on the same screen (Démarrer → Pause) only animates that icon.
 */
export function BottomBar() {
  const loc = useLocation();
  const nav = useNavigate();
  const back = useSmartBack();
  const completed = useProfile((s) => s.profile.completed);
  const seen = useSettings((s) => s.settings.newsSeenVersion);
  const actions = useNavStore((s) => s.actions);
  const run = useNavStore((s) => s.run);
  const sheet = useNavStore((s) => s.sheet);
  const screen = navScreen(loc.pathname, loc.search);
  const unseen = hasUnseenRelease(seen);
  // the total fullscreen of the coach (Fullscreen API on the training screen) hides what is outside it: the bar is
  // then drawn inside the fullscreen element, so Pause and Menu stay at hand
  const [fsRoot, setFsRoot] = useState<Element | null>(null);
  useEffect(() => {
    const onFs = () => setFsRoot(document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // the mockup's `changing` class, played again on each new screen
  const barRef = useRef<HTMLDivElement>(null);
  const [shownScreen, setShownScreen] = useState(screen);
  useEffect(() => {
    if (screen === shownScreen) return;
    setShownScreen(screen);
    const b = barRef.current;
    if (!b) return;
    b.classList.remove('changing');
    void b.offsetWidth;
    b.classList.add('changing');
  }, [screen, shownScreen]);

  if (!screen || !completed) return null;
  const slots = NAV_CONFIG[screen];

  const press = (slot: NavSlot) => {
    haptic();
    if (slot.action === 'back') {
      // a screen may take Retour first (a running session asks before leaving)
      if (actions.back) return run('back');
      return leave(() => back(screen));
    }
    if (slot.action === 'menu') return openMenu();
    if (slot.action.startsWith('nav:')) {
      const to = slot.action.slice(4);
      if (actions[slot.action]) return run(slot.action);
      return leave(() => nav(to));
    }
    run(slot.action);
  };

  const bar = (
    <nav className="nav-bottom" aria-label="Navigation contextuelle" data-testid="bottom-bar" data-screen={screen}>
      <div className="nav-bar changing" ref={barRef}>
        {slots.map((slot, i) => {
          const a = actions[slot.action];
          const builtIn = slot.action === 'back' || slot.action === 'menu' || slot.action.startsWith('nav:');
          const disabled = builtIn ? !!a?.disabled : !a || !!a.disabled;
          const icon = a?.icon ?? slot.icon;
          const label = a?.label ?? slot.label;
          const pressed = a?.pressed;
          const isMenu = slot.action === 'menu';
          // v0.44: the actions of the screen keep a light tint of the accent, Retour, Menu and the main places stay neutral
          const role = slotRole(slot);
          return (
            <button
              key={i}
              type="button"
              className={`nav-btn ${role === 'contextual' ? 'ctx' : ''} ${pressed ? 'active' : ''}`}
              onClick={() => press(slot)}
              aria-label={a?.ariaLabel ?? (isMenu && unseen ? 'Menu, nouvelle version à découvrir' : label)}
              aria-disabled={disabled || undefined}
              aria-pressed={pressed === undefined ? undefined : pressed}
              aria-haspopup={isMenu ? 'dialog' : undefined}
              aria-expanded={isMenu ? sheet !== null : undefined}
              disabled={disabled}
              data-slot={i + 1}
              data-role={role}
              data-icon={icon}
              data-action={slot.action}
              data-testid={a?.testId ?? `nav-${slot.action.replace(/^nav:\//, '').replace(/[/?=&]/g, '-')}`}
            >
              {/* keyed on the icon: a new icon at the same place plays the swap, the bar itself stays */}
              <span className="nav-ico swap" key={icon}>
                <NavIcon id={icon} />
              </span>
              <small>{label}</small>
              {isMenu && unseen && <i className="nav-dot" data-testid="menu-dot" aria-hidden />}
            </button>
          );
        })}
      </div>
    </nav>
  );
  return fsRoot ? createPortal(bar, fsRoot) : bar;
}
