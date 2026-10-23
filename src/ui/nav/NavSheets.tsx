import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCoachBubble } from '../coach-ai/coachHost';
import { LATEST_RELEASE, RELEASES, RELEASE_CATEGORY_LABEL, hasUnseenRelease, releaseDateLabel } from '../../domain/releases';
import { useSettings } from '../../store/settings';
import { AppIcon } from '../icons';
import { MENU_ENTRIES } from './config';
import { popLayer, pushLayer } from './layers';
import { NavIcon } from './NavIcon';
import { leave, useNavStore, type MenuCommand } from './store';
import { haptic } from './BottomBar';

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
}) {
  const ref = useRef<HTMLElement>(null);
  const opener = useRef<Element | null>(typeof document !== 'undefined' ? document.activeElement : null);
  useEffect(() => {
    const el = ref.current;
    el?.focus();
    const onKey = (e: KeyboardEvent) => {
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
      window.removeEventListener('keydown', onKey, true);
      if (back instanceof HTMLElement && back.isConnected) back.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return createPortal(
    <div className={`nav-overlay ${aboveBar ? 'above-bar' : ''}`}>
      <div className="nav-scrim" onClick={onClose} data-testid="nav-scrim" />
      <section className={`nav-sheet ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref} data-testid={testId}>
        <div className="nav-handle" aria-hidden />
        {closable ? (
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
 * « Navigation générale » (section 6) and « Nouveautés » (section 7), opened from Menu, place 5 of the bar. The eight
 * places in the mockup's order; above them, under « Sur cet écran », the commands of the screen that have no place in
 * the bar (Précédent, Suivant, Comment faire ?, Options, Coach IA…), so nothing the former buttons did is lost.
 */
export function NavSheets() {
  const nav = useNavigate();
  const loc = useLocation();
  const sheet = useNavStore((s) => s.sheet);
  const layer = useNavStore((s) => s.sheetLayer);
  const setSheet = useNavStore((s) => s.setSheet);
  const commands = useNavStore((s) => s.commands);
  const runCommand = useNavStore((s) => s.runCommand);
  const seen = useSettings((s) => s.settings.newsSeenVersion);
  const setSettings = useSettings((s) => s.set);
  if (!sheet) return null;
  // the Coach IA keeps one way in on every screen (former bubble): last command of « Sur cet écran »
  const withCoach = !loc.pathname.startsWith('/coach-ia');
  const allCommands = [...commands, ...(withCoach ? [{ id: 'coach-ia', label: 'Coach IA', icon: 'coach' as const, testId: 'cmd-coach-ia' }] : [])];
  const runAny = (id: string) => (id === 'coach-ia' ? useCoachBubble.getState().setOpen(true) : runCommand(id));
  const unseen = hasUnseenRelease(seen);
  const close = (then?: () => void) => {
    setSheet(null);
    popLayer(layer, then);
  };
  const go = (to: string) => close(() => leave(() => nav(to)));

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

  return (
    <NavPanel title="Navigation générale" onClose={() => close()} testId="nav-menu-sheet">
      {allCommands.length > 0 && (
        <div className="nav-commands" role="group" aria-label="Sur cet écran" data-testid="nav-commands">
          <div className="nav-section">Sur cet écran</div>
          <div className="nav-menugrid">
            {allCommands.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`nav-menuitem ${c.pressed ? 'on' : ''}`}
                aria-pressed={c.pressed === undefined ? undefined : c.pressed}
                disabled={c.disabled}
                data-testid={c.testId ?? `cmd-${c.id}`}
                onClick={() => {
                  haptic();
                  close(() => runAny(c.id));
                }}
              >
                <CommandIcon icon={c.icon} />
                <span>{c.label}</span>
              </button>
            ))}
          </div>
          <div className="nav-section">Navigation générale</div>
        </div>
      )}
      <div className="nav-menugrid" data-testid="nav-menu-grid">
        {MENU_ENTRIES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`nav-menuitem ${m.id === 'nouveautes' ? 'highlight' : ''} ${m.hint ? 'wide' : ''}`}
            data-go={m.id}
            data-testid={`menu-${m.id}`}
            aria-label={m.id === 'nouveautes' && unseen ? 'Nouveautés, nouvelle version' : m.label}
            onClick={() => {
              haptic();
              if (m.id === 'nouveautes') {
                // as in the mockup: the same sheet shows the news, and they count as seen
                setSettings({ newsSeenVersion: LATEST_RELEASE.version });
                setSheet('news');
              } else go(m.to);
            }}
          >
            <NavIcon id={m.icon} />
            {m.hint ? (
              <span className="nav-menuitem-text">
                <span>{m.label}</span>
                <small>{m.hint}</small>
              </span>
            ) : (
              <span>{m.label}</span>
            )}
            {m.id === 'nouveautes' && unseen && <i className="nav-dot" data-testid="news-dot" aria-hidden />}
          </button>
        ))}
      </div>
    </NavPanel>
  );
}
