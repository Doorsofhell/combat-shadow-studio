import { ReactNode, RefObject, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSettings } from '../../store/settings';
import { FsExit, FsHint } from '../fullscreen/FullscreenStage';
import { useStageFullscreen } from '../fullscreen/useStageFullscreen';
import { StageGuard } from '../components/StageGuard';
import { SpeakerIcon } from '../training/SoundButton';
import { CoachPanel, type CoachPanelConfig, type PanelSection } from '../coach-panel/CoachPanel';
import { dropLayer, popLayer, pushLayer } from '../nav/layers';
import './coach-screen.css';

/** the screens that call the module; each one gives it its own movement and its own options */
export type CoachContext = 'accueil' | 'fiche' | 'seance' | 'apercu';

export type FsApi = ReturnType<typeof useStageFullscreen>;

/**
 * The « Options du coach » panel of the coach zone (2.4; it replaced the buttons that a tap showed over the coach in
 * 1.4.0). A tap on the coach opens it. It is a history layer: Back (Android button, back gesture, browser) closes it
 * and nothing else. `open` is called from event handlers only (a tap, a button), as the layers ask.
 */
export function useCoachUi() {
  const [shown, setShownState] = useState(false);
  const [section, setSection] = useState<PanelSection | undefined>(undefined);
  const shownRef = useRef(false);
  const layer = useRef<number | null>(null);
  const open = useCallback((sec?: PanelSection) => {
    setSection(sec);
    if (shownRef.current) return;
    shownRef.current = true;
    setShownState(true);
    layer.current = pushLayer(() => {
      // Back pressed: the layer is already gone, only the panel closes
      layer.current = null;
      shownRef.current = false;
      setShownState(false);
    });
  }, []);
  const close = useCallback((then?: () => void) => {
    if (!shownRef.current) return then?.();
    shownRef.current = false;
    setShownState(false);
    const id = layer.current;
    layer.current = null;
    if (id !== null) popLayer(id, then);
    else then?.();
  }, []);
  const toggle = useCallback(() => (shownRef.current ? close() : open()), [open, close]);
  const setShown = useCallback((on: boolean) => (on ? open() : close()), [open, close]);
  // a screen left while its panel is open: the layer goes with it
  useEffect(
    () => () => {
      if (layer.current !== null) dropLayer(layer.current);
    },
    [],
  );
  return { shown, section, open, close, toggle, setShown };
}
export type CoachUi = ReturnType<typeof useCoachUi>;

const NO_REF: RefObject<HTMLElement | null> = { current: null };

/**
 * 1.4.0 (Youssef, 2026-10-28: « L'écran du coach devrait être exactement le même module appelé partout et alimenté
 * différemment en fonction du contexte, il ne faut pas le réécrire systématiquement », then option A: « un toucher
 * montre les commandes sans pause, le toucher suivant les cache »): THE coach screen of the app, the same on the
 * home, the technique sheet, the session and the coach preview. Each screen gives it the coach (its 3D stage) and
 * its commands; the module brings the rest, the same everywhere:
 *   - one tap on the coach opens the « Options du coach » panel (2.4, CoachPanel; it replaced the buttons of 1.4.0);
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
  panel = {},
  children,
  fs: outerFs,
  ui: outerUi,
  hint = true,
  sound = true,
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
  /** what the panel offers on this screen (2.4): the sections left out are not shown */
  panel?: CoachPanelConfig;
  /** the voice can be heard on this screen: a crossed speaker shows when it is off */
  sound?: boolean;
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
  const muted = sound && (!voice || volume <= 0);

  const own = !outerFs;
  // the panel gives the plein écran of this screen (its own, or the session's)
  const config: CoachPanelConfig = { ...panel, fullscreen: { active: fs.active, onToggle: fs.active ? fs.exit : fs.enter } };
  const tools = (
    <>
      <CoachPanel open={ui.shown} onClose={ui.close} config={config} section={ui.section} />
      {muted && !ui.shown && (
        <span className="coach-muted" role="img" aria-label="Voix du coach coupée" data-testid="coach-muted">
          <SpeakerIcon level={0} size={16} />
        </span>
      )}
      {/* for the keyboard and screen readers: the same as a tap on the coach */}
      <button type="button" className="sr-only coach-ui-toggle" onClick={ui.toggle} aria-expanded={ui.shown} data-testid="coach-ui-toggle">
        Options du coach
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
