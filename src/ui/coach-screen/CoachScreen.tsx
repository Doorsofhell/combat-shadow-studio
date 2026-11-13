import { ReactNode, RefObject, Suspense, useCallback, useRef, useState } from 'react';
import { useSettings } from '../../store/settings';
import { AppIcon } from '../icons';
import { FsExit, FsHint } from '../fullscreen/FullscreenStage';
import { useStageFullscreen } from '../fullscreen/useStageFullscreen';
import { StageGuard } from '../components/StageGuard';
import { SoundButton, SpeakerIcon } from '../training/SoundButton';
import './coach-screen.css';

/** the screens that call the module; each one gives it its own movement and its own commands */
export type CoachContext = 'accueil' | 'fiche' | 'seance' | 'apercu';

export type FsApi = ReturnType<typeof useStageFullscreen>;

/** the speeds offered in the coach zone */
export const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5];
export const speedText = (v: number) => `×${String(Math.round(v * 100) / 100).replace('.', ',')}`;

/** the speed of the coach: its value; a touch shows the speeds next to it, one more touch picks one */
export function SpeedTool({ speed, onChange, speeds = SPEEDS }: { speed: number; onChange: (v: number) => void; speeds?: number[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`speed-tool ${open ? 'open' : ''}`}>
      <button type="button" className={`btn ${open ? 'on' : ''}`} onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`Vitesse d’exécution : ${speedText(speed)}`} data-testid="speed-tool">
        {speedText(speed)}
      </button>
      {open && (
        <div className="speed-choices" role="radiogroup" aria-label="Vitesse d’exécution" data-testid="speed-choices">
          {speeds.map((v) => {
            const on = Math.abs(v - speed) < 0.01;
            return (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={on}
                className={`btn ${on ? 'on' : ''}`}
                onClick={() => {
                  onChange(v);
                  setOpen(false);
                }}
                data-testid={`speed-${String(v).replace('.', '-')}`}
              >
                {speedText(v)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** what a screen gives to the commands of the coach zone; a command left out is not shown */
export interface CoachCommands {
  /** the speaker of the coach's voice (one tap per step) */
  sound?: boolean;
  speed?: { value: number; onChange: (v: number) => void; speeds?: number[] };
  angles?: { value: string | number; options: { id: string | number; label: string }[]; onChange: (id: string | number) => void };
  /** the pause of the session, inside the zone of the coach */
  pause?: { paused: boolean; onToggle: () => void };
  /** other buttons of the screen, shown with the others (Zoom of the séance) */
  extra?: ReactNode;
}

/** the commands of the coach zone: hidden at rest, a tap on the coach shows them, the next tap hides them */
export function useCoachUi() {
  const [shown, setShown] = useState(false);
  const toggle = useCallback(() => setShown((s) => !s), []);
  return { shown, setShown, toggle };
}
export type CoachUi = ReturnType<typeof useCoachUi>;

const NO_REF: RefObject<HTMLElement | null> = { current: null };

/**
 * 1.4.0 (Youssef, 2026-10-28: « L'écran du coach devrait être exactement le même module appelé partout et alimenté
 * différemment en fonction du contexte, il ne faut pas le réécrire systématiquement », then option A: « un toucher
 * montre les commandes sans pause, le toucher suivant les cache »): THE coach screen of the app, the same on the
 * home, the technique sheet, the session and the coach preview. Each screen gives it the coach (its 3D stage) and
 * its commands; the module brings the rest, the same everywhere:
 *   - one tap on the coach shows the commands in its zone (right column), the next tap hides them;
 *   - a double tap shows the coach alone on the whole screen (useStageFullscreen), the way out stays at hand;
 *   - when the voice is off, a small crossed speaker stays in a corner, so a muted coach never goes unnoticed;
 *   - the 3D guard (resume after a lost GPU context) and the loading placeholder;
 *   - the one-time tip of the double tap.
 * A fix made here holds for every screen. The session keeps its own fullscreen (the whole session screen goes
 * fullscreen, with the pause), so it can hand its own `fs` and `ui` to the module.
 */
export function CoachScreen({
  context,
  className,
  testId,
  place,
  stage,
  stageClassName = 'coach-3d',
  stageHidden = false,
  stageLabel,
  fallback,
  commands = {},
  children,
  fs: outerFs,
  ui: outerUi,
  hint = true,
  screenRef,
  style,
}: {
  context: CoachContext;
  /** the class of the screen's own frame (hero-stage, preview-stage, tr-stage…) */
  className: string;
  testId?: string;
  /** where the 3D guard says it is */
  place: string;
  /** the 3D coach of the screen */
  stage: ReactNode;
  stageClassName?: string;
  /** the 3D layer is only an illustration (the home): screen readers skip it */
  stageHidden?: boolean;
  /** what a screen reader says of the coach (the preview, where the coach can be turned around) */
  stageLabel?: string;
  fallback?: ReactNode;
  commands?: CoachCommands;
  /** what the screen shows over the coach (instructions, legends…) */
  children?: ReactNode;
  /** the session's own fullscreen and commands state; by default the module keeps its own */
  fs?: FsApi;
  ui?: CoachUi;
  hint?: boolean;
  screenRef?: RefObject<HTMLDivElement | null>;
  style?: React.CSSProperties;
}) {
  const ownRef = useRef<HTMLDivElement>(null);
  const ref = screenRef ?? ownRef;
  const ownUi = useCoachUi();
  const ui = outerUi ?? ownUi;
  const ownFs = useStageFullscreen(outerFs ? NO_REF : ref, { onTap: ownUi.toggle });
  const fs = outerFs ?? ownFs;
  const voice = useSettings((s) => s.settings.voice);
  const volume = useSettings((s) => s.settings.voiceVolume);
  const muted = !!commands.sound && (!voice || volume <= 0);

  const own = !outerFs;
  const c = commands;
  const tools = (
    <>
      {ui.shown && (
        <div className="coach-tools" data-testid="coach-tools" data-no-double-tap>
          {c.pause && (
            <button type="button" className="btn" onClick={c.pause.onToggle} aria-label={c.pause.paused ? 'Reprendre la séance' : 'Mettre la séance en pause'} data-testid="coach-pause">
              <AppIcon id={c.pause.paused ? 'play' : 'pause'} />
            </button>
          )}
          {c.speed && <SpeedTool speed={c.speed.value} onChange={c.speed.onChange} speeds={c.speed.speeds} />}
          {c.extra}
          {fs.active ? (
            <button type="button" className="btn on" onClick={fs.exit} aria-label="Quitter le plein écran" data-testid={own ? 'coach-fs-exit' : 'fs-exit'}>
              <AppIcon id="exitFullscreen" />
            </button>
          ) : (
            <button type="button" className="btn" onClick={fs.enter} aria-label="Plein écran : le coach seul, sur tout l’écran" data-testid="fullscreen">
              <AppIcon id="fullscreen" />
            </button>
          )}
          {c.sound && <SoundButton />}
        </div>
      )}
      {ui.shown && c.angles && (
        <div className="coach-angles" role="radiogroup" aria-label="Angle de caméra" data-testid="coach-angles" data-no-double-tap>
          {c.angles.options.map((o) => (
            <button key={o.id} type="button" role="radio" aria-checked={o.id === c.angles!.value} className={`btn ${o.id === c.angles!.value ? 'on' : ''}`} onClick={() => c.angles!.onChange(o.id)}>
              {o.label}
            </button>
          ))}
        </div>
      )}
      {muted && !ui.shown && (
        <span className="coach-muted" role="img" aria-label="Voix du coach coupée" data-testid="coach-muted">
          <SpeakerIcon level={0} size={16} />
        </span>
      )}
      {/* for the keyboard and screen readers: the same as a tap on the coach */}
      <button type="button" className="sr-only coach-ui-toggle" onClick={ui.toggle} aria-expanded={ui.shown} data-testid="coach-ui-toggle">
        {ui.shown ? 'Masquer les commandes du coach' : 'Afficher les commandes du coach'}
      </button>
    </>
  );

  return (
    <div
      ref={ref}
      className={`coach-screen ${className}${own && fs.active ? ' stage-fs' : ''}${own && fs.idle ? ' fs-idle' : ''}`}
      data-testid={testId}
      data-context={context}
      data-ui={ui.shown ? 'on' : 'off'}
      data-fullscreen={own ? fs.active : undefined}
      style={style}
    >
      <StageGuard place={place}>
        <div className={stageClassName} aria-hidden={stageHidden || undefined} role={stageLabel ? 'img' : undefined} aria-label={stageLabel}>
          <Suspense
            fallback={
              fallback ?? (
                <div className="hero-loading" role="status" aria-label="Chargement du coach">
                  <div className="stage-skeleton" />
                </div>
              )
            }
          >
            {stage}
          </Suspense>
        </div>
      </StageGuard>
      {tools}
      {children}
      {own && fs.active && <FsExit onExit={fs.exit} />}
      {/* the one-time tip leaves the room to the commands while they are shown */}
      {own && hint && !fs.active && !ui.shown && <FsHint />}
    </div>
  );
}
