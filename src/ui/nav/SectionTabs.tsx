import { useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProfile } from '../../store/profile';
import { navScreen, sectionTabsFor } from './config';
import { haptic } from './BottomBar';
import { leave } from './store';

/**
 * 1.0.0 (refonte ergonomique, maquette v4): the tabs at the top of a space (Apprendre: Techniques / Légendes /
 * Encyclopédie; Progrès: Tableau / Historique / Objectifs), where the former Menu places went. Sticky under the top
 * of the screen; its height is given to the pages as --tabs-h (the dashboards that fill the screen subtract it).
 */
export function SectionTabs() {
  const loc = useLocation();
  const nav = useNavigate();
  const completed = useProfile((s) => s.profile.completed);
  const screen = navScreen(loc.pathname, loc.search);
  const tabs = screen && completed ? sectionTabsFor(screen) : null;
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
            </button>
          );
        })}
      </div>
    </nav>
  );
}
