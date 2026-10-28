import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { LATEST_RELEASE, hasUnseenRelease } from '../../domain/releases';
import { usePhoto } from '../../store/photo';
import { initials, useProfile } from '../../store/profile';
import { useSettings } from '../../store/settings';
import { backInRow, BAR_PLACES, sectionTabsFor, NAV_CONFIG, NAV_PARENT, NO_TABS, PRIMARY, ROOT_SCREENS, SECTION, TABS, dockSlots, isRootPath, navScreen, slotRole, type NavScreen, type NavSlot, type Tab } from './config';
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

/** 1.0.0 (lot 4): a pattern of the session (start, pause, round) where the device can; nothing elsewhere */
export function vibrate(pattern: number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // not allowed: nothing
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

/** 1.0.0 (lot 3): « Rechercher ou demander au coach », a history layer like the other sheets */
export function openSearch() {
  const st = useNavStore.getState();
  if (st.sheet) return;
  const layer = pushLayer(() => useNavStore.getState().setSheet(null));
  st.setSheet('search', layer);
}

/** 1.0.0: « Nouveautés » (tile of Réglages) opens the news sheet as a history layer; they count as seen */
export function openNews() {
  const st = useNavStore.getState();
  if (st.sheet) return;
  useSettings.getState().set({ newsSeenVersion: LATEST_RELEASE.version });
  const layer = pushLayer(() => useNavStore.getState().setSheet(null));
  st.setSheet('news', layer);
}

/**
 * 1.0.0 (refonte ergonomique, maquette v4 validée par Youssef le 2026-10-27): the bottom of every screen.
 * - the five places of the app (TABS), fixed, the same on every screen except the session; Profil shows the
 *   user's photo or initials;
 * - just above, the actions of the screen (NAV_CONFIG, given by the screen with useNavActions): the main one as one
 *   big button (PRIMARY), the others smaller next to it, and « Plus » for the commands of the screen;
 * - Retour as a chip at the top left, except on the five places and their tabs.
 * The height of the whole is measured and given to the pages as --nav-h, so nothing hides behind it.
 */
export function BottomBar() {
  const loc = useLocation();
  const nav = useNavigate();
  const back = useSmartBack();
  const profile = useProfile((s) => s.profile);
  const photo = usePhoto((s) => s.photo);
  const seen = useSettings((s) => s.settings.newsSeenVersion);
  const actions = useNavStore((s) => s.actions);
  const commands = useNavStore((s) => s.commands);
  const run = useNavStore((s) => s.run);
  const sheet = useNavStore((s) => s.sheet);
  const screen = navScreen(loc.pathname, loc.search);
  const unseen = hasUnseenRelease(seen);
  // the total fullscreen of the coach (Fullscreen API on the training screen) hides what is outside it: the bar is
  // then drawn inside the fullscreen element, so Pause stays at hand
  const [fsRoot, setFsRoot] = useState<Element | null>(null);
  useEffect(() => {
    const onFs = () => setFsRoot(document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // the mockup's `changing` class, played again on each new screen (on the actions only: the places stay still)
  const dockRef = useRef<HTMLDivElement>(null);
  const [shownScreen, setShownScreen] = useState(screen);
  useEffect(() => {
    if (screen === shownScreen) return;
    setShownScreen(screen);
    const b = dockRef.current;
    if (!b) return;
    b.classList.remove('changing');
    void b.offsetWidth;
    b.classList.add('changing');
  }, [screen, shownScreen]);

  // the real height of the bottom (without the safe area, which the pages add themselves) → --nav-h
  const rootRef = useRef<HTMLDivElement>(null);
  const shown = !!screen && profile.completed;
  useLayoutEffect(() => {
    const el = rootRef.current;
    const html = document.documentElement;
    if (!el) {
      html.style.removeProperty('--nav-h');
      return;
    }
    const measure = () => {
      const cs = getComputedStyle(el);
      const h = el.getBoundingClientRect().height - parseFloat(cs.paddingBottom || '0') + parseFloat(cs.getPropertyValue('--nav-pad-b') || '0');
      html.style.setProperty('--nav-h', `${Math.round(h)}px`);
    };
    measure();
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
    // fsRoot: going in or out of the total fullscreen moves the bar to another parent, a new element to observe
  }, [shown, screen, fsRoot]);
  // the main discipline lights the big buttons (styles.css --disc)
  useEffect(() => {
    document.documentElement.dataset.disc = profile.mainDiscipline;
  }, [profile.mainDiscipline]);
  // Retour at the top left: the pages leave room for it
  const backChip = shown && !(ROOT_SCREENS.has(screen!) && isRootPath(loc.pathname)) && !backInRow(screen!, loc.pathname);
  useEffect(() => {
    const html = document.documentElement;
    if (backChip) html.dataset.backChip = '';
    else delete html.dataset.backChip;
  }, [backChip]);

  if (!screen || !profile.completed) return null;
  const slots = NAV_CONFIG[screen];
  const primary = PRIMARY[screen];
  const dock = dockSlots(screen, loc.pathname);
  const tabs = !NO_TABS.has(screen);
  const section = SECTION[screen];
  const inRow = backInRow(screen, loc.pathname);
  // 1.1.0 (Youssef, 2026-10-27: « Retirer plus / coach IA car désormais il est dans la barre de recherche », then the
  // magnifier as a place of the bar, proposition A): the Coach IA is reached from Rechercher; « Plus » (or the ⋮ at
  // the top right) holds only what the screen gives
  const tabsShown = !!sectionTabsFor(screen) && isRootPath(loc.pathname);
  // in the session and the chronometer « Plus » always holds « Rechercher » (the bar's places are hidden there)
  const hasMore = commands.length > 0 || inRow;

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

  const goTab = (t: Tab) => {
    haptic();
    const p = loc.pathname.replace(/\/+$/, '') || '/';
    if (p === t.to) return;
    leave(() => nav(t.to));
  };

  const button = (slot: NavSlot, place: number, kind: 'primary' | 'secondary' | 'back' | 'more') => {
    const a = actions[slot.action];
    const builtIn = slot.action === 'back' || slot.action === 'menu' || slot.action.startsWith('nav:');
    const disabled = builtIn ? !!a?.disabled : !a || !!a.disabled;
    const icon = a?.icon ?? slot.icon;
    const label = kind === 'more' ? 'Plus' : (a?.label ?? slot.label);
    const pressed = a?.pressed;
    const isMenu = slot.action === 'menu';
    const role = slotRole(slot);
    return (
      <button
        key={slot.action}
        type="button"
        className={`nav-btn nav-${kind} ${role === 'contextual' ? 'ctx' : ''} ${pressed ? 'active' : ''}`}
        onClick={() => press(slot)}
        aria-label={a?.ariaLabel ?? (isMenu ? 'Plus d’actions sur cet écran' : label)}
        aria-disabled={disabled || undefined}
        aria-pressed={pressed === undefined ? undefined : pressed}
        aria-haspopup={isMenu ? 'dialog' : undefined}
        aria-expanded={isMenu ? sheet !== null : undefined}
        disabled={disabled}
        data-slot={place}
        data-role={role}
        data-icon={icon}
        data-action={slot.action}
        data-testid={a?.testId ?? `nav-${slot.action.replace(/^nav:\//, '').replace(/[/?=&]/g, '-')}`}
      >
        {/* keyed on the icon: a new icon at the same place plays the swap */}
        <span className="nav-ico swap" key={icon}>
          <NavIcon id={icon} />
        </span>
        <small>{label}</small>
      </button>
    );
  };

  const backSlot = slots.find((s) => s.action === 'back');
  const menuSlot = slots.find((s) => s.action === 'menu');
  const primaryItem = primary ? dock.find((d) => d.slot.action === primary) : undefined;
  const secondary = dock.filter((d) => d !== primaryItem);
  const me = initials(profile);
  // 1.1.0 (proposition A « Android »): out of the session and the chronometer, the actions of the screen other than
  // its big button go into the ⋮ at the top right (with the commands of the former « Plus »), next to the photo of
  // the profile; the bar keeps its five places, Rechercher in place of Profil
  const options = inRow ? [] : secondary;
  const hasOptions = options.length > 0 || (!inRow && hasMore);
  const searchOn = sheet === 'search';
  const profileOn = section === 'profil';
  // not on the full-screen tools (session, chronometer, fighter studio): their own buttons sit at the top right
  const topRight = tabs && !inRow && (
    <div className={`nav-topright ${tabsShown ? 'in-tabs' : ''}`} data-testid="nav-topright">
      {hasOptions && menuSlot && (
        <button
          type="button"
          className="nav-kebab"
          onClick={() => {
            haptic();
            openMenu();
          }}
          aria-label="Options de l’écran"
          aria-haspopup="menu"
          aria-expanded={sheet === 'menu'}
          data-action="menu"
          data-testid="nav-menu"
        >
          <NavIcon id="more" />
        </button>
      )}
      <button
        type="button"
        className={`nav-avatar ${profileOn ? 'on' : ''}`}
        aria-current={profileOn ? 'page' : undefined}
        aria-label={unseen ? 'Profil, nouvelle version à découvrir' : 'Profil'}
        data-tab="profil"
        data-testid="nav-profil"
        onClick={() => goTab(TABS.find((t) => t.id === 'profil')!)}
      >
        <span className="nav-me" data-testid="nav-me">
          {photo ? <img src={photo} alt="" /> : me}
        </span>
        {unseen && <i className="nav-dot" data-testid="menu-dot" aria-hidden />}
      </button>
    </div>
  );

  const bar = (
    <div className={`nav-bottom ${inRow && primaryItem ? 'compact' : ''} ${tabs ? '' : 'no-tabs'}`} ref={rootRef} data-testid="bottom-bar" data-screen={screen}>
      {backChip && backSlot && <div className="nav-backchip">{button(backSlot, 1, 'back')}</div>}
      {topRight}
      <div className="nav-dock changing" ref={dockRef} role="toolbar" aria-label="Actions de l’écran">
        {inRow && (secondary.length > 0 || backSlot || (hasMore && menuSlot)) && (
          <div className={`nav-row ${secondary.length >= 3 ? 'many' : ''}`}>
            {backSlot && button(backSlot, 1, 'back')}
            {secondary.map(({ slot, place }) => button(slot, place, 'secondary'))}
            {primaryItem && button(primaryItem.slot, primaryItem.place, 'primary')}
            {hasMore && menuSlot && button(menuSlot, slots.indexOf(menuSlot) + 1, 'more')}
          </div>
        )}
        {!inRow && primaryItem && <div className="nav-primary-row">{button(primaryItem.slot, primaryItem.place, 'primary')}</div>}
      </div>
      {tabs && (
        <nav className="nav-tabs" aria-label="Navigation principale">
          {BAR_PLACES.map((t) => {
            if (t.id === 'recherche') {
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`nav-tab ${searchOn ? 'on' : ''}`}
                  aria-label="Rechercher ou demander au coach"
                  aria-haspopup="dialog"
                  aria-expanded={searchOn}
                  data-tab="recherche"
                  data-testid="app-search"
                  onClick={() => {
                    haptic();
                    openSearch();
                  }}
                >
                  <span className="nav-ico">
                    <NavIcon id="search" />
                  </span>
                  <small>{t.label}</small>
                </button>
              );
            }
            const on = section === t.id && !searchOn;
            return (
              <button
                key={t.id}
                type="button"
                className={`nav-tab ${on ? 'on' : ''}`}
                aria-current={on ? 'page' : undefined}
                aria-label={t.label}
                data-tab={t.id}
                data-testid={`nav-${t.to === '/' ? 'accueil' : t.to.slice(1)}`}
                onClick={() => goTab(t as Tab)}
              >
                <span className="nav-ico">
                  <NavIcon id={t.icon} />
                </span>
                <small>{t.label}</small>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
  return fsRoot ? createPortal(bar, fsRoot) : bar;
}
