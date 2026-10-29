import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCoachBubble } from '../coach-ai/coachHost';
import { RELEASES, RELEASE_CATEGORY_LABEL, releaseDateLabel } from '../../domain/releases';
import { AppIcon } from '../icons';
import { popLayer, pushLayer } from './layers';
import { NavIcon } from './NavIcon';
import { leave, useNavStore, type MenuCommand } from './store';
import { haptic, openSearch } from './BottomBar';
import { NO_TABS, PRIMARY, backInRow, dockSlots, navScreen } from './config';
import type { NavIconId } from './icons';
import { SearchSheet } from './SearchSheet';

/** the panels open now, the last one on top */
const openPanels: object[] = [];

/**
 * The mockup's bottom sheet (`.scrim` + `.sheet`, 220 ms `sheetin`): scrim that closes it, rounded top, handle and
 * title. A dialog: the focus moves into it, Tab stays inside, Échap and Back close it, and the focus goes back to
 * the button that opened it.
 */
export function NavPanel({
  title,
  onClose,
  children,
  testId,
  wide,
  closable,
  aboveBar,
  variant = 'sheet',
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  testId?: string;
  wide?: boolean;
  /** v0.45: a close cross beside the title (Premium panels) */
  closable?: boolean;
  /** v0.45: the sheet stops above the bottom bar, which stays visible and usable (Premium panels) */
  aboveBar?: boolean;
  /** 1.1.0: 'menu' = the Android menu of the ⋮ at the top right (no handle, no title); 'full' = the whole screen
   *  (search) */
  variant?: 'sheet' | 'menu' | 'full';
}) {
  const ref = useRef<HTMLElement>(null);
  const opener = useRef<Element | null>(typeof document !== 'undefined' ? document.activeElement : null);
  useEffect(() => {
    const el = ref.current;
    el?.focus();
    // 1.1.0: panels can be stacked (the ⋮ menu over a panel of Premium): only the top one answers Escape
    const me = {};
    openPanels.push(me);
    const onKey = (e: KeyboardEvent) => {
      if (openPanels[openPanels.length - 1] !== me) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'Tab' && el) {
        const f = [...el.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')];
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    const back = opener.current;
    return () => {
      openPanels.splice(openPanels.indexOf(me), 1);
      window.removeEventListener('keydown', onKey, true);
      if (back instanceof HTMLElement && back.isConnected) back.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return createPortal(
    <div className={`nav-overlay ${aboveBar ? 'above-bar' : ''} ${variant}`}>
      <div className="nav-scrim" onClick={onClose} data-testid="nav-scrim" />
      <section className={`nav-sheet ${wide ? 'wide' : ''} ${variant}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref} data-testid={testId}>
        {variant === 'sheet' && <div className="nav-handle" aria-hidden />}
        {variant === 'menu' ? null : closable ? (
          <div className="nav-sheet-head">
            <h2 className="nav-sheet-title">{title}</h2>
            <button type="button" className="nav-sheet-close" onClick={onClose} aria-label="Fermer" data-testid="panel-close">
              <NavIcon id="close" />
            </button>
          </div>
        ) : (
          <div className="nav-sheet-title">{title}</div>
        )}
        <div className="nav-sheet-body">{children}</div>
      </section>
    </div>,
    // inside the total fullscreen of the coach when it is on, else over the page
    document.fullscreenElement ?? document.body,
  );
}

/**
 * A contextual panel of a screen (filters, search, period…), opened from a button of the bar: a history layer, so
 * Back closes it first. `show()` from the button, `hide(then?)` from the panel (then runs after the history entry
 * is removed, for a page change).
 */
export function usePanel() {
  const [open, setOpen] = useState(false);
  const layer = useRef(0);
  const show = () => {
    if (layer.current) return;
    layer.current = pushLayer(() => {
      layer.current = 0;
      setOpen(false);
    });
    setOpen(true);
  };
  const hide = (then?: () => void) => {
    const id = layer.current;
    layer.current = 0;
    setOpen(false);
    if (id) popLayer(id, then);
    else then?.();
  };
  return { open, show, hide };
}

function CommandIcon({ icon }: { icon: MenuCommand['icon'] }) {
  if (typeof icon === 'string') return <NavIcon id={icon} />;
  return <AppIcon id={icon.glyph} size={21} />;
}

/**
 * « Sur cet écran », opened from « Plus » (1.0.0; formerly the Menu): the commands of the screen that have no button
 * of their own (Précédent, Suivant, Comment faire ?, Options, Coach IA…), so nothing the former buttons did is lost.
 * « Nouveautés » (section 7) opens from the tile of Réglages.
 */
export function NavSheets() {
  const nav = useNavigate();
  const loc = useLocation();
  const sheet = useNavStore((s) => s.sheet);
  const layer = useNavStore((s) => s.sheetLayer);
  const setSheet = useNavStore((s) => s.setSheet);
  const commands = useNavStore((s) => s.commands);
  const actions = useNavStore((s) => s.actions);
  const run = useNavStore((s) => s.run);
  const runCommand = useNavStore((s) => s.runCommand);
  if (!sheet) return null;
  // 1.1.0 (Youssef, 2026-10-27: « Retirer plus / coach IA … Retire-le de tous les écrans »): the Coach IA is reached
  // from Rechercher (bar) and Profil › Coach IA, no longer from here. Out of the session and the chronometer, the
  // actions of the screen other than its big button come first (the ⋮ at the top right, proposition A)
  const screen = navScreen(loc.pathname, loc.search);
  const options =
    screen && !backInRow(screen, loc.pathname)
      ? dockSlots(screen, loc.pathname)
          .filter((d) => d.slot.action !== PRIMARY[screen])
          .map(({ slot }) => {
            const a = actions[slot.action];
            const builtIn = slot.action.startsWith('nav:');
            return {
              id: `slot:${slot.action}`,
              action: slot.action,
              label: a?.label ?? slot.label,
              icon: (a?.icon ?? slot.icon) as NavIconId,
              pressed: a?.pressed,
              disabled: builtIn ? !!a?.disabled : !a || !!a.disabled,
              ariaLabel: a?.ariaLabel,
              testId: a?.testId ?? `nav-${slot.action.replace(/^nav:\//, '').replace(/[/?=&]/g, '-')}`,
            };
          })
      : [];
  // in the session the bar's places are hidden: « Rechercher » (and through it the Coach IA) stays reachable from
  // « Plus », so nothing is lost; where the places show, the magnifier of the bar is enough (1.1.1, no duplicate)
  const inRow = !!screen && backInRow(screen, loc.pathname) && NO_TABS.has(screen);
  const searchCmd = inRow ? [{ id: 'app-search', label: 'Rechercher', icon: 'search' as NavIconId, testId: 'cmd-search', pressed: undefined as boolean | undefined, disabled: false, action: undefined as string | undefined, ariaLabel: undefined as string | undefined }] : [];
  const allCommands = [...options, ...commands.map((c) => ({ ...c, action: undefined as string | undefined, ariaLabel: undefined as string | undefined })), ...searchCmd];
  const runAny = (c: (typeof allCommands)[number]) => {
    if (c.id === 'app-search') return openSearch();
    if (!c.action) return runCommand(c.id);
    if (c.action.startsWith('nav:') && !actions[c.action]) return leave(() => nav(c.action!.slice(4)));
    run(c.action);
  };
  const close = (then?: () => void) => {
    setSheet(null);
    popLayer(layer, then);
  };
  const go = (to: string) => close(() => leave(() => nav(to)));

  if (sheet === 'search') {
    return <SearchSheet onClose={() => close()} onGo={go} onAsk={(q, saved) => close(() => useCoachBubble.getState().ask(q, saved))} onApply={(then) => close(then)} />;
  }

  if (sheet === 'news') {
    return (
      <NavPanel title="Nouveautés" onClose={() => close()} testId="news-sheet" wide>
        <div className="news-list" data-testid="news-list">
          {RELEASES.map((r, i) => (
            <article key={r.version} className="nav-version" data-version={r.version} aria-labelledby={`v-${r.version}`}>
              <b id={`v-${r.version}`}>
                Version {r.version}
                {i === 0 ? ' · la plus récente' : ''}
              </b>
              <div className="nav-version-meta">
                {releaseDateLabel(r.releaseDate)} · {r.title}
              </div>
              {r.categories.map((c) => (
                <div key={c} className="nav-version-cat">
                  <span>{RELEASE_CATEGORY_LABEL[c]}</span>
                  <ul>
                    {r.changes
                      .filter((x) => x.category === c)
                      .map((x, k) => (
                        <li key={k}>{x.text}</li>
                      ))}
                  </ul>
                </div>
              ))}
              {r.links.length > 0 && (
                <div className="nav-version-links">
                  {r.links.map((l) => (
                    <button key={l.to} type="button" className="nav-action" onClick={() => go(l.to)}>
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
        <div className="nav-actions">
          <button type="button" className="nav-action primary" onClick={() => close()} data-testid="news-close">
            Fermer
          </button>
        </div>
      </NavPanel>
    );
  }

  // 1.0.0: « Plus » holds the commands of the screen; 1.1.0: drawn as the Android menu of the ⋮ at the top right
  // (out of the session and the chronometer, where « Plus » stays in the row)
  const asMenu = !!screen && !backInRow(screen, loc.pathname);
  return (
    <NavPanel title="Sur cet écran" onClose={() => close()} testId="nav-menu-sheet" variant={asMenu ? 'menu' : 'sheet'}>
      <div className="nav-commands" role="group" aria-label="Sur cet écran" data-testid="nav-commands">
        <div className={asMenu ? 'nav-menulist' : 'nav-menugrid'} role={asMenu ? 'menu' : undefined}>
          {allCommands.map((c) => (
            <button
              key={c.id}
              type="button"
              role={asMenu ? (c.pressed !== undefined ? 'menuitemcheckbox' : 'menuitem') : undefined}
              className={`nav-menuitem ${c.pressed ? 'on' : ''}`}
              aria-pressed={c.pressed === undefined || asMenu ? undefined : c.pressed}
              aria-checked={asMenu && c.pressed !== undefined ? c.pressed : undefined}
              aria-label={c.ariaLabel}
              disabled={c.disabled}
              data-action={c.action}
              data-testid={c.testId ?? `cmd-${c.id}`}
              onClick={() => {
                haptic();
                close(() => runAny(c));
              }}
            >
              <CommandIcon icon={c.icon} />
              <span>{c.label}</span>
              {asMenu && c.pressed && (
                <span className="nav-menucheck" aria-hidden>
                  <NavIcon id="check" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </NavPanel>
  );
}
