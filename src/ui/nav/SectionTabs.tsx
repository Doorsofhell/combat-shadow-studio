import { useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProfile } from '../../store/profile';
import { useSettings } from '../../store/settings';
import { hasUnseenRelease } from '../../domain/releases';
import { isRootPath, navScreen, sectionTabsFor } from './config';
import { haptic } from './BottomBar';
import { leave } from './store';

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
