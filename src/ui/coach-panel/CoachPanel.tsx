import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ALL_COACHES } from '../../domain/coaches/catalog';
import { stabilityLevel } from '../../three/safe3d';
import { useGoals, type Mastery } from '../../store/goals';
import { useProfile } from '../../store/profile';
import { GROUND_MARK_LABEL, GroundMarkId, useSettings } from '../../store/settings';
import { AppIcon } from '../icons';
import { pickChampion, useChosenCoach } from '../screens/CoachSelect';
import './coach-panel.css';

/**
 * 2.4 (Youssef, 2026-11-20, « Refonte premium du panneau d'options du coach », direction V6 Floating Glass + V7 Smart
 * Control, étape 1 validée le même jour): THE options of the coach, in one glass panel over the coach, the same on every
 * screen. A short tap on the coach opens it; every choice applies at once and the panel stays open; it closes with a
 * tap outside, a swipe down from its grip, the close button, Échap or Back (Android button, back gesture, browser).
 * While it is open nothing behind it reacts: the scrim takes every touch, and a touch outside only closes the panel.
 *
 * Each screen gives a configuration: the sections it leaves out are not shown. The panel never pauses a session, never
 * changes its exercise or its timer: it only calls the screen's own functions (speed, angle, reset…).
 */

export interface PanelOption<T extends string | number = string | number> {
  id: T;
  label: string;
}

export interface CoachPanelConfig {
  /** « Mon apprentissage »: the techniques the user can rate here (one on a sheet, those of the exercise in a session) */
  learning?: { items: { id: string; name: string }[]; current?: string | null };
  camera?: {
    value: string | number;
    options: PanelOption[];
    /** the other angles of the screen, behind « Autres angles » */
    more?: PanelOption[];
    onChange: (id: string | number) => void;
    /** a line under the angles (why the automatic angle was chosen) */
    detail?: string;
    rotate?: (deg: number) => void;
    zoom?: { canIn: boolean; canOut: boolean; onIn: () => void; onOut: () => void };
    closeUp?: { on: boolean; label: string; onToggle: () => void };
  };
  /** the speed: a range (min, max, step) or a list of steps */
  speed?: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; steps?: number[] };
  fullscreen?: { active: boolean; onToggle: () => void };
  /** back to the angle the screen starts with, without rotation or zoom */
  reset?: () => void;
  advanced?: { coach?: boolean; guard?: boolean; groundMarks?: boolean; announce?: boolean; impacts?: boolean };
}

export type PanelSection = 'camera';

export const speedLabel = (v: number) => `×${String(Math.round(v * 100) / 100).replace('.', ',')}`;

const LEARN: { id: Mastery | null; label: string; icon: 'mastered' | 'struggling' | 'pending'; testId: string }[] = [
  { id: 'acquise', label: 'Acquis', icon: 'mastered', testId: 'cp-learn-acquise' },
  { id: 'a-revoir', label: 'Encore du mal', icon: 'struggling', testId: 'cp-learn-a-revoir' },
  { id: null, label: 'En apprentissage', icon: 'pending', testId: 'cp-learn-aucun' },
];

/** the panel's closing time; nothing behind reacts until it is over */
const CLOSE_MS = 200;

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const fsElement = () => document.fullscreenElement ?? (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement ?? null;

/** the glass needs a blur the device can afford: else a plain, nearly opaque panel */
function canBlur(quality: string): boolean {
  if (quality === 'basse' || stabilityLevel() > 0) return false;
  if (typeof CSS === 'undefined' || !CSS.supports) return false;
  return CSS.supports('backdrop-filter', 'blur(2px)') || CSS.supports('-webkit-backdrop-filter', 'blur(2px)');
}

export function CoachPanel({ open, onClose, config, section, title = 'Options du coach' }: { open: boolean; onClose: (then?: () => void) => void; config: CoachPanelConfig; section?: PanelSection; title?: string }) {
  // mounted while open and during the closing animation (the scrim keeps taking the touches until it is gone)
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const [host, setHost] = useState<Element | null>(null);
  useLayoutEffect(() => {
    if (open) {
      // in the browser's fullscreen only the fullscreen element is drawn: the panel goes inside it
      setHost(fsElement() ?? document.body);
      setMounted(true);
      setClosing(false);
      return;
    }
    if (!mounted) return;
    setClosing(true);
    const id = window.setTimeout(
      () => {
        // one more frame: the click that follows a touch on the scrim still lands on it
        requestAnimationFrame(() => {
          setMounted(false);
          setClosing(false);
        });
      },
      reducedMotion() ? 0 : CLOSE_MS,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  // the browser's fullscreen turned on or off while the panel is shown (its own « Plein écran »): it follows
  useEffect(() => {
    if (!mounted) return;
    const move = () => setHost(fsElement() ?? document.body);
    document.addEventListener('fullscreenchange', move);
    document.addEventListener('webkitfullscreenchange', move);
    return () => {
      document.removeEventListener('fullscreenchange', move);
      document.removeEventListener('webkitfullscreenchange', move);
    };
  }, [mounted]);
  if (!mounted || !host) return null;
  return createPortal(<PanelView closing={closing} onClose={onClose} config={config} section={section} title={title} />, host);
}

function PanelView({ closing, onClose, config, section, title }: { closing: boolean; onClose: (then?: () => void) => void; config: CoachPanelConfig; section?: PanelSection; title: string }) {
  const panel = useRef<HTMLElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const quality = useSettings((s) => s.settings.quality);
  const [lite] = useState(() => !canBlur(quality));
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const closingRef = useRef(closing);
  closingRef.current = closing;
  const close = useCallback((then?: () => void) => {
    if (!closingRef.current) closeRef.current(then);
  }, []);
  const nav = useNavigate();
  // a link of the panel: the panel (and its history entry) goes first, then the page changes
  const leaveTo = useCallback((to: string) => close(() => nav(to)), [close, nav]);

  // focus goes into the panel, comes back where it was; Tab stays inside; Échap closes (before any other Échap)
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    panel.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (closingRef.current) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        close();
      } else if (e.key === 'Tab' && panel.current) {
        const all = [...panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href], [tabindex="0"]')].filter((el) => el.offsetParent !== null);
        if (!all.length) return;
        const first = all[0];
        const last = all[all.length - 1];
        const at = document.activeElement;
        if (e.shiftKey && (at === first || at === panel.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && at === last) {
          e.preventDefault();
          first.focus();
        } else if (!panel.current.contains(at)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      if (before && document.contains(before)) before.focus({ preventScroll: true });
    };
  }, [close]);

  // opened on a section (the « Caméra » button of the session): that section is brought into view
  useEffect(() => {
    if (!section) return;
    body.current?.querySelector(`[data-section="${section}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [section]);

  // swipe down from the grip (or the head): the panel follows the finger, then closes or comes back
  const [drag, setDrag] = useState(0);
  const start = useRef<{ id: number; y: number; t: number } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    if ((e.target as Element).closest('button')) return;
    start.current = { id: e.pointerId, y: e.clientY, t: e.timeStamp };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    setDrag(Math.max(0, e.clientY - s.y));
  };
  const onUp = (e: React.PointerEvent) => {
    const s = start.current;
    start.current = null;
    if (!s || s.id !== e.pointerId) return;
    const dy = Math.max(0, e.clientY - s.y);
    const v = dy / Math.max(1, e.timeStamp - s.t);
    if (dy > 70 || (dy > 24 && v > 0.6)) close();
    else setDrag(0);
  };

  // the scrim: a touch outside closes the panel and nothing else (no click goes through, even while it closes)
  const swallow = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const c = config;
  return (
    <div className={`cpn-root${closing ? ' closing' : ''}${lite ? ' lite' : ''}`} data-testid="coach-panel-root" data-state={closing ? 'closing' : 'open'}>
      <div
        className="cpn-scrim"
        data-testid="coach-panel-scrim"
        onPointerDown={swallow}
        onPointerUp={swallow}
        onMouseDown={swallow}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => {
          swallow(e);
          close();
        }}
        onContextMenu={swallow}
        aria-hidden="true"
      />
      <div className="cpn-place">
        <section
          ref={panel}
          className="cpn"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          data-testid="coach-panel"
          data-no-double-tap
          style={drag ? { transform: `translateY(${drag}px)`, transition: 'none' } : undefined}
        >
          <div className="cpn-grab" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} data-testid="coach-panel-grip">
            <span className="cpn-grip" aria-hidden="true" />
            <header className="cpn-head">
              <AppIcon id="filters" size={20} className="cpn-accent" />
              <h2 id={titleId}>{title}</h2>
              <button type="button" className="cpn-x" onClick={() => close()} aria-label="Fermer les options du coach" data-testid="coach-panel-close">
                <AppIcon id="close" size={18} />
              </button>
            </header>
          </div>
          <div className="cpn-body" ref={body}>
            {c.learning && c.learning.items.length > 0 && <LearningSection items={c.learning.items} current={c.learning.current ?? null} />}
            {c.camera && <CameraSection cam={c.camera} />}
            {c.speed && <SpeedSection speed={c.speed} />}
            <AudioSection />
            {(c.fullscreen || c.reset) && (
              <div className="cpn-sec cpn-tiles">
                {c.fullscreen && (
                  <button type="button" className={`cpn-tile${c.fullscreen.active ? ' on' : ''}`} aria-pressed={c.fullscreen.active} onClick={c.fullscreen.onToggle} data-testid="cp-fullscreen">
                    <AppIcon id={c.fullscreen.active ? 'exitFullscreen' : 'fullscreen'} size={22} />
                    <span>{c.fullscreen.active ? 'Quitter le plein écran' : 'Plein écran'}</span>
                  </button>
                )}
                {c.reset && (
                  <button type="button" className="cpn-tile" onClick={c.reset} data-testid="cp-reset">
                    <AppIcon id="target" size={22} />
                    <span>Réinitialiser la vue</span>
                  </button>
                )}
              </div>
            )}
            {c.advanced && <AdvancedSection adv={c.advanced} leaveTo={leaveTo} />}
          </div>
        </section>
      </div>
    </div>
  );
}

function LearningSection({ items, current }: { items: { id: string; name: string }[]; current: string | null }) {
  const [picked, setPicked] = useState<string | null>(null);
  // the technique rated: the one picked, else the move being played, else the first one
  const id = picked && items.some((t) => t.id === picked) ? picked : current && items.some((t) => t.id === current) ? current : items[0].id;
  const value = useGoals((s) => s.mastery[id] ?? null);
  const setMastery = useGoals((s) => s.setMastery);
  const name = items.find((t) => t.id === id)?.name ?? id;
  return (
    <div className="cpn-sec" data-section="learning" data-testid="cp-learning">
      <div className="cpn-lab">
        <AppIcon id="techniques" size={18} />
        <span>Mon apprentissage{items.length === 1 ? ` · ${name}` : ''}</span>
      </div>
      {items.length > 1 && (
        <div className="cpn-chips cpn-pick" role="radiogroup" aria-label="Technique à évaluer">
          {items.map((t) => (
            <button key={t.id} type="button" role="radio" aria-checked={t.id === id} className={`cpn-chip small${t.id === id ? ' on' : ''}`} onClick={() => setPicked(t.id)} data-testid={`cp-learn-pick-${t.id}`}>
              {t.name}
              {t.id === current ? <em> · en cours</em> : null}
            </button>
          ))}
        </div>
      )}
      <div className="cpn-seg" role="radiogroup" aria-label={`Où en es-tu sur ${name} ?`}>
        {LEARN.map((o) => (
          <button key={o.testId} type="button" role="radio" aria-checked={value === o.id} className={`cpn-chip ${o.icon}${value === o.id ? ' on' : ''}`} onClick={() => setMastery(id, o.id)} data-testid={o.testId}>
            <AppIcon id={o.icon} size={16} />
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CameraSection({ cam }: { cam: NonNullable<CoachPanelConfig['camera']> }) {
  const inMore = !!cam.more?.some((o) => o.id === cam.value);
  const [more, setMore] = useState(inMore);
  const chip = (o: PanelOption) => (
    <button key={o.id} type="button" role="radio" aria-checked={o.id === cam.value} className={`cpn-chip${o.id === cam.value ? ' on' : ''}`} onClick={() => cam.onChange(o.id)} data-testid={`cp-cam-${o.id}`}>
      {o.label}
    </button>
  );
  return (
    <div className="cpn-sec" data-section="camera" data-testid="cp-camera">
      <div className="cpn-lab">
        <AppIcon id="camera" size={18} />
        <span>Angle de vue</span>
      </div>
      <div className="cpn-chips" role="radiogroup" aria-label="Angle de vue">
        {cam.options.map(chip)}
        {cam.more && cam.more.length > 0 && (
          <button type="button" className={`cpn-chip${more ? ' open' : ''}`} aria-expanded={more} onClick={() => setMore(!more)} data-testid="cp-cam-more">
            Autres angles
            <AppIcon id="chevronDown" size={14} className="cpn-turn" />
          </button>
        )}
      </div>
      {more && cam.more && (
        <div className="cpn-chips" role="radiogroup" aria-label="Autres angles">
          {cam.more.map(chip)}
        </div>
      )}
      {cam.detail && (
        <p className="cpn-note" data-testid="cp-cam-detail">
          {cam.detail}
        </p>
      )}
      {(cam.rotate || cam.zoom || cam.closeUp) && (
        <div className="cpn-chips cpn-tools">
          {cam.rotate && (
            <>
              <button type="button" className="cpn-chip icon" onClick={() => cam.rotate!(-30)} aria-label="Tourner la caméra vers la gauche" data-testid="cp-cam-left">
                <AppIcon id="rotateLeft" size={18} />
              </button>
              <button type="button" className="cpn-chip icon" onClick={() => cam.rotate!(30)} aria-label="Tourner la caméra vers la droite" data-testid="cp-cam-right">
                <AppIcon id="rotateRight" size={18} />
              </button>
            </>
          )}
          {cam.zoom && (
            <>
              <button type="button" className="cpn-chip icon" onClick={cam.zoom.onOut} disabled={!cam.zoom.canOut} aria-label="Dézoomer" data-testid="cp-zoom-out">
                <AppIcon id="zoomOut" size={18} />
              </button>
              <button type="button" className="cpn-chip icon" onClick={cam.zoom.onIn} disabled={!cam.zoom.canIn} aria-label="Zoomer" data-testid="cp-zoom-in">
                <AppIcon id="zoomIn" size={18} />
              </button>
            </>
          )}
          {cam.closeUp && (
            <button type="button" className={`cpn-chip${cam.closeUp.on ? ' on' : ''}`} aria-pressed={cam.closeUp.on} onClick={cam.closeUp.onToggle} aria-label={cam.closeUp.label} data-testid="cp-closeup">
              Gros plan
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SpeedSection({ speed }: { speed: NonNullable<CoachPanelConfig['speed']> }) {
  const id = useId();
  const steps = speed.steps;
  // a list of steps: the slider goes from step to step (the values and the limits of the screen are kept)
  const index = steps ? steps.reduce((best, v, i) => (Math.abs(v - speed.value) < Math.abs(steps[best] - speed.value) ? i : best), 0) : 0;
  const min = steps ? 0 : speed.min ?? 0.25;
  const max = steps ? steps.length - 1 : speed.max ?? 1.5;
  const step = steps ? 1 : speed.step ?? 0.05;
  const value = steps ? index : speed.value;
  const pct = ((value - min) / Math.max(1e-6, max - min)) * 100;
  return (
    <div className="cpn-sec" data-section="speed">
      <label className="cpn-lab" htmlFor={id}>
        <AppIcon id="speed" size={18} />
        <span>Vitesse d’animation</span>
        <b className="cpn-val" data-testid="cp-speed-value">
          {speedLabel(speed.value)}
        </b>
      </label>
      <input
        id={id}
        type="range"
        className="cpn-range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ ['--p' as string]: `${pct}%` }}
        onChange={(e) => {
          const n = Number(e.target.value);
          speed.onChange(steps ? steps[Math.round(n)] : Math.round(n * 100) / 100);
        }}
        aria-valuetext={speedLabel(speed.value)}
        data-testid="cp-speed"
      />
      {steps ? (
        <div className="cpn-ticks" aria-hidden="true">
          {steps.map((v) => (
            <span key={v}>{speedLabel(v)}</span>
          ))}
        </div>
      ) : (
        <div className="cpn-ticks" aria-hidden="true">
          <span>{speedLabel(min)}</span>
          <span>{speedLabel(max)}</span>
        </div>
      )}
    </div>
  );
}

const pctText = (v: number) => `${Math.round(v * 100)} %`;

/** the voice of the coach: on or off, and its volume (the same settings as Réglages › Voix et sons) */
function AudioSection() {
  const voice = useSettings((s) => s.settings.voice);
  const volume = useSettings((s) => s.settings.voiceVolume);
  const set = useSettings((s) => s.set);
  const id = useId();
  const on = voice && volume > 0;
  return (
    <div className="cpn-sec" data-section="audio">
      <div className="cpn-lab">
        <AppIcon id={on ? 'audio' : 'mute'} size={18} />
        <span>Voix du coach</span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          className={`cpn-switch${on ? ' on' : ''}`}
          onClick={() => set(on ? { voice: false } : { voice: true, voiceVolume: volume > 0 ? volume : 0.7 })}
          aria-label={on ? 'Voix du coach activée' : 'Voix du coach coupée'}
          data-testid="cp-voice"
        >
          <i />
        </button>
      </div>
      <div className="cpn-lab sub">
        <label htmlFor={id}>Volume</label>
        <input
          id={id}
          type="range"
          className="cpn-range"
          min={0}
          max={1}
          step={0.05}
          value={voice ? volume : 0}
          disabled={!voice}
          style={{ ['--p' as string]: `${(voice ? volume : 0) * 100}%` }}
          onChange={(e) => {
            const v = Number(e.target.value);
            set(v <= 0 ? { voice: false, voiceVolume: 0 } : { voice: true, voiceVolume: v });
          }}
          aria-valuetext={pctText(voice ? volume : 0)}
          data-testid="cp-volume"
        />
        <b className="cpn-val plain">{pctText(voice ? volume : 0)}</b>
      </div>
    </div>
  );
}

function AdvancedSection({ adv, leaveTo }: { adv: NonNullable<CoachPanelConfig['advanced']>; leaveTo: (to: string) => void }) {
  const [open, setOpen] = useState(false);
  const chosen = useChosenCoach();
  const guard = useProfile((s) => s.profile.guard);
  const update = useProfile((s) => s.update);
  const settings = useSettings((s) => s.settings);
  const set = useSettings((s) => s.set);
  const coach = ALL_COACHES.find((c) => c.id === chosen);
  return (
    <div className="cpn-sec" data-section="advanced">
      <button type="button" className="cpn-lab cpn-fold" aria-expanded={open} onClick={() => setOpen(!open)} data-testid="cp-advanced">
        <AppIcon id="settings" size={18} />
        <span>Options avancées</span>
        <small>
          {coach?.name ?? ''}
          {adv.guard ? ` · ${guard === 'gaucher' ? 'gaucher' : 'orthodoxe'}` : ''}
        </small>
        <AppIcon id="chevronDown" size={16} className="cpn-turn" />
      </button>
      {open && (
        <div className="cpn-adv" data-testid="cp-advanced-body">
          {adv.coach && (
            <div className="cpn-group">
              <span className="cpn-cap">Coach</span>
              <div className="cpn-chips" role="radiogroup" aria-label="Coach">
                {ALL_COACHES.map((c) => (
                  <button key={c.id} type="button" role="radio" aria-checked={chosen === c.id} className={`cpn-chip${chosen === c.id ? ' on' : ''}`} onClick={() => pickChampion(c)} data-testid={`cp-coach-${c.id}`}>
                    {c.name}
                  </button>
                ))}
              </div>
              <button type="button" className="cpn-link" onClick={() => leaveTo('/coach')} data-testid="cp-coach-gallery">
                Voir les coachs en détail
                <AppIcon id="chevron" size={14} />
              </button>
            </div>
          )}
          {adv.guard && (
            <div className="cpn-group">
              <span className="cpn-cap">Garde</span>
              <div className="cpn-seg two" role="radiogroup" aria-label="Garde">
                <button type="button" role="radio" aria-checked={guard !== 'gaucher'} className={`cpn-chip${guard !== 'gaucher' ? ' on' : ''}`} onClick={() => update({ guard: 'orthodoxe' })} data-testid="cp-guard-orthodoxe">
                  Orthodoxe
                </button>
                <button type="button" role="radio" aria-checked={guard === 'gaucher'} className={`cpn-chip${guard === 'gaucher' ? ' on' : ''}`} onClick={() => update({ guard: 'gaucher' })} data-testid="cp-guard-gaucher">
                  Gaucher
                </button>
              </div>
            </div>
          )}
          {adv.groundMarks && (
            <div className="cpn-group">
              <span className="cpn-cap">Repères au sol</span>
              <div className="cpn-chips">
                {(Object.keys(GROUND_MARK_LABEL) as GroundMarkId[]).map((k) => (
                  <button key={k} type="button" aria-pressed={settings.groundMarks[k]} className={`cpn-chip${settings.groundMarks[k] ? ' on' : ''}`} onClick={() => set({ groundMarks: { ...settings.groundMarks, [k]: !settings.groundMarks[k] } })} data-testid={`cp-mark-${k}`}>
                    {GROUND_MARK_LABEL[k]}
                  </button>
                ))}
              </div>
            </div>
          )}
          {(adv.announce || adv.impacts) && (
            <div className="cpn-group">
              <span className="cpn-cap">Voix et sons</span>
              <div className="cpn-chips">
                {adv.announce && (
                  <button type="button" aria-pressed={settings.announceMoves} className={`cpn-chip${settings.announceMoves ? ' on' : ''}`} onClick={() => set({ announceMoves: !settings.announceMoves })} data-testid="cp-announce">
                    Annonce des coups
                  </button>
                )}
                {adv.impacts && (
                  <button type="button" aria-pressed={settings.impactSounds} className={`cpn-chip${settings.impactSounds ? ' on' : ''}`} onClick={() => set({ impactSounds: !settings.impactSounds })} data-testid="cp-impacts">
                    Sons d’impact
                  </button>
                )}
              </div>
              {adv.impacts && (
                <label className="cpn-lab sub">
                  <span>Effets</span>
                  <input type="range" className="cpn-range" min={0} max={1} step={0.05} value={settings.effectsVolume} style={{ ['--p' as string]: `${settings.effectsVolume * 100}%` }} onChange={(e) => set({ effectsVolume: Number(e.target.value) })} aria-valuetext={pctText(settings.effectsVolume)} data-testid="cp-effects" />
                  <b className="cpn-val plain">{pctText(settings.effectsVolume)}</b>
                </label>
              )}
            </div>
          )}
          <button type="button" className="cpn-link" onClick={() => leaveTo('/reglages')} data-testid="cp-settings">
            Tous les réglages
            <AppIcon id="chevron" size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
