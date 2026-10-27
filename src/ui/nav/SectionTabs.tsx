import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProfile } from '../../store/profile';
import { useSettings } from '../../store/settings';
import { hasUnseenRelease } from '../../domain/releases';
import { isRootPath, navScreen, sectionTabsFor } from './config';
import { haptic } from './BottomBar';
import { leave, useNavStore } from './store';
import { swipeBlocked, swipeDirection, swipeTab } from './swipe';

/**
 * 1.0.0 (refonte ergonomique, maquette v4): the tabs at the top of a space (Entraîner: Séance / Programmes /
 * Enchaînements / Favoris / Chrono; Apprendre: Techniques / Légendes / Encyclopédie; Progrès: Tableau / Historique /
 * Objectifs; Profil: Mes infos / Mon coach / Coach IA / Réglages), where the former Menu places went. Only on the
 * first page of each tab, not on a deeper page. Sticky under the top of the screen; its height is given to the pages
 * as --tabs-h (the dashboards that fill the screen subtract it). A new version lights a dot on Réglages.
 */
export function SectionTabs() {
  const loc = useLocation();
  const nav = useNavigate();
  const completed = useProfile((s) => s.profile.completed);
  const screen = navScreen(loc.pathname, loc.search);
  const tabs = screen && completed && isRootPath(loc.pathname) ? sectionTabsFor(screen) : null;
  const unseen = hasUnseenRelease(useSettings((s) => s.settings.newsSeenVersion));
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const html = document.documentElement;
    const el = ref.current;
    if (!el) {
      html.style.removeProperty('--tabs-h');
      return;
    }
    const measure = () => html.style.setProperty('--tabs-h', `${Math.round(el.getBoundingClientRect().height)}px`);
    measure();
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => {
      ro?.disconnect();
      html.style.removeProperty('--tabs-h');
    };
  }, [!!tabs]);
  // five tabs (Entraîner) may not all fit a phone: the open one is scrolled into view
  useLayoutEffect(() => {
    const on = ref.current?.querySelector<HTMLElement>('.sec-tab.on');
    const row = on?.parentElement;
    if (on && row && row.scrollWidth > row.clientWidth) row.scrollLeft = on.offsetLeft - (row.clientWidth - on.offsetWidth) / 2;
  }, [screen, !!tabs]);
  // a horizontal swipe of the finger on the page opens the next or previous tab (swipe.ts)
  const current = tabs?.find((t) => screen && t.screens.includes(screen))?.id;
  useEffect(() => {
    if (!tabs || !current) return;
    // touch events, not pointer events: the browser cancels a pointer as soon as it may pan the page
    let start: { x: number; y: number; t: number } | null = null;
    const down = (e: TouchEvent) => {
      const f = e.touches[0];
      start = e.touches.length === 1 && !swipeBlocked(e.target as Element) ? { x: f.clientX, y: f.clientY, t: e.timeStamp } : null;
    };
    const up = (e: TouchEvent) => {
      const s = start;
      start = null;
      const f = e.changedTouches[0];
      // never while a sheet or a dialog is open, nor over the running chronometer (its tabs are hidden)
      if (!s || !f || e.touches.length > 0 || useNavStore.getState().sheet || document.querySelector('[role="dialog"]') || 'chronoRun' in document.documentElement.dataset) return;
      const to = swipeTab(tabs, current, swipeDirection(f.clientX - s.x, f.clientY - s.y, e.timeStamp - s.t));
      if (!to) return;
      haptic();
      leave(() => nav(to.to));
    };
    const cancel = () => (start = null);
    window.addEventListener('touchstart', down, { passive: true });
    window.addEventListener('touchend', up, { passive: true });
    window.addEventListener('touchcancel', cancel, { passive: true });
    return () => {
      window.removeEventListener('touchstart', down);
      window.removeEventListener('touchend', up);
      window.removeEventListener('touchcancel', cancel);
    };
  }, [tabs, current, nav]);
  if (!tabs || !screen) return null;
  return (
    <nav className="sec-tabs" aria-label="Rubriques" data-testid="section-tabs" ref={ref}>
      <div className="sec-tabs-in">
        {tabs.map((t) => {
          const on = t.screens.includes(screen);
          return (
            <button
              key={t.id}
              type="button"
              className={`sec-tab ${on ? 'on' : ''}`}
              aria-current={on ? 'page' : undefined}
              data-testid={`tab-${t.id}`}
              onClick={() => {
                if (on) return;
                haptic();
                leave(() => nav(t.to));
              }}
            >
              {t.label}
              {t.id === 'reglages' && unseen && <i className="me-dot" data-testid="reglages-dot" aria-label="nouvelle version" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
