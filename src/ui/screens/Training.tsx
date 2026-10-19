import '../training/training.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CoachStage } from '../../three/CoachStage';
import { useProfile } from '../../store/profile';
import { GROUND_MARK_LABEL, GroundMarkId, useSettings } from '../../store/settings';
import { useCustom } from '../../store/custom';
import { formatDuration } from '../../store/stats';
import { TECHNIQUE_BY_ID } from '../../domain/techniques';
import { PointPhase, instructionOf } from '../../domain/instructions';
import { DISCIPLINES, LEVELS, TrainingMode } from '../../domain/types';
import { MODE_LABEL, Plan, customPlan, exercisePlan, programPlan } from '../training/plan';
import { useSession } from '../training/useSession';
import { useCatalog } from '../../store/catalog';
import { catalogPlan } from '../../domain/catalog/plan';
import { CoachAskPanel } from '../coach-ai/CoachAskPanel';
import type { CoachAction } from '../../coach/engine';
import { useCoachAi } from '../../store/coachAi';
import { GuideCard } from '../GuideCard';
import { chooseCoach } from '../components/fighter';
import { CAMERA_MODES, CameraMode, manualView, stageAzimuth, stepViews, techniqueView, viewName } from '../../domain/camera';
import type { StageView } from '../../three/StudioStage';
import { StudyPanel, useStudy } from '../training/Study';
import { ArBridge } from '../../ar/ArBridge';
import { CoachLookPicker } from '../components/CoachLookPicker';
import { ArControls, ArIntroSheet, useArView } from '../training/ArMode';
import { AppIcon } from '../icons';

export function Training() {
  const [q] = useSearchParams();
  const profile = useProfile((s) => s.profile);
  const settings = useSettings((s) => s.settings);
  const combos = useCustom((s) => s.combos);
  const key = q.toString();
  const catId = q.get('cat');
  const { catalog, error: catalogError } = useCatalog(!!catId);
  const plan = useMemo<Plan | null>(() => {
    const mode = (q.get('mode') ?? 'libre') as TrainingMode;
    const o = {
      roundSec: Number(q.get('round') ?? settings.defaultRoundSec),
      restSec: Number(q.get('rest') ?? settings.defaultRestSec),
      rounds: Number(q.get('rounds') ?? 3),
    };
    if (catId) {
      const e = catalog?.comboById.get(catId);
      return e ? catalogPlan(e, mode, o) : null;
    }
    if (q.get('prog')) return programPlan(q.get('prog')!);
    if (q.get('perso')) {
      const c = combos.find((x) => x.id === q.get('perso'));
      return c ? customPlan(c, profile.levels[c.discipline], mode, o) : null;
    }
    if (q.get('ex')) return exercisePlan(q.get('ex')!, mode, o);
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, combos.length, catalog]);

  if (catId && !catalog && !catalogError) return <div className="loading">Chargement…</div>;

  if (!plan || !plan.items.length) {
    return (
      <div className="page">
        <h1>Exercice introuvable</h1>
        <Link className="btn" to="/">
          Retour à l’accueil
        </Link>
      </div>
    );
  }
  return <TrainingView key={key} plan={plan} />;
}

/** m:ss; countdowns round up, elapsed times round down */
function clock(sec: number, up = true) {
  const s = Math.max(0, up ? Math.ceil(sec) : Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function TrainingView({ plan }: { plan: Plan }) {
  const nav = useNavigate();
  const profile = useProfile((s) => s.profile);
  const updateProfile = useProfile((s) => s.update);
  const settings = useSettings((s) => s.settings);
  const setSettings = useSettings((s) => s.set);
  const { view, item, events, onPlayer, player, start, pause, resume, restart, goto, setSpeed } = useSession(plan);
  const [camMode, setCamMode] = useState<CameraMode>(settings.cameraMode ?? 'auto');
  const [closeUp, setCloseUp] = useState(false);
  const [studyRot, setStudyRot] = useState(0);
  // « Caméra » zone: manual turn around the coach and zoom, on top of the chosen angle
  const [camOpen, setCamOpen] = useState(false);
  const [camRot, setCamRot] = useState(0);
  const [camZoom, setCamZoom] = useState(1);
  const [immersive, setImmersive] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [guideId, setGuideId] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const coachAiOn = useCoachAi((s) => s.enabled);
  const pendingStudySpeed = useRef<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const arRoot = useRef<HTMLDivElement>(null);
  const ar = useMemo(() => new ArBridge(), []);
  const arView = useArView(ar);
  const arActive = arView.state !== 'off' && arView.state !== 'starting';
  const [arIntro, setArIntro] = useState(false);
  const [arCompact, setArCompact] = useState(false);
  // leaving the screen or the app closes the camera
  useEffect(() => {
    const onVis = () => document.hidden && void ar.stop();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      void ar.stop();
    };
  }, [ar]);
  const southpaw = profile.guard === 'gaucher';
  const coach = profile.coach ?? 'homme';
  const st = useStudy(southpaw);
  // the study can show the other guard for comparison
  const stageSouthpaw = st.tech ? st.southpaw : southpaw;
  const [q] = useSearchParams();
  const autoStudy = useRef(q.get('study') === '1');

  const seq = item.sequence;
  const curId = view.step >= 0 ? seq[view.step] : null;
  const cur = curId ? TECHNIQUE_BY_ID.get(curId) : null;
  const nextId = view.step >= 0 ? seq[(view.step + 1) % seq.length] : seq[0];
  const next = TECHNIQUE_BY_ID.get(nextId);
  const disc = DISCIPLINES.find((d) => d.id === item.discipline)!;
  const lvl = LEVELS.find((l) => l.id === item.level)!;

  // teaching camera: the best angle for the technique being played (close angles are shared)
  const autoViews = useMemo(() => stepViews(seq, item.discipline), [seq, item.discipline]);
  const teach = st.tech ? techniqueView(st.tech) : (autoViews[Math.max(0, view.step)] ?? autoViews[0]);
  const manual = manualView(camMode);
  const free = camMode === 'libre';
  const lastView = useRef<StageView | null>(null);
  let stageView: StageView;
  if (manual) stageView = { ...manual, closeUp: false };
  else if (free && lastView.current) stageView = lastView.current;
  else stageView = { az: stageAzimuth(teach, item.discipline, stageSouthpaw), el: teach.el, zoom: teach.zoom, focus: teach.focus, closeUp: false };
  if (closeUp && teach.closeUp && !free) stageView = { ...stageView, zoom: teach.closeUp.zoom, focus: teach.closeUp.focus, closeUp: true };
  if (st.tech && studyRot && !free) stageView = { ...stageView, az: stageView.az + studyRot };
  // floor marks need to be seen from a little above
  const anyMark = Object.values(settings.groundMarks).some(Boolean);
  if (anyMark && !free && !st.tech && stageView.el < 16) stageView = { ...stageView, el: 16 };
  if (!free && (camRot || camZoom !== 1)) stageView = { ...stageView, az: stageView.az + camRot, zoom: stageView.zoom * camZoom };
  if (!free) lastView.current = stageView;
  // a temporary close-up always returns to the whole body
  useEffect(() => {
    if (!closeUp) return;
    const id = window.setTimeout(() => setCloseUp(false), 7000);
    return () => window.clearTimeout(id);
  }, [closeUp]);
  const openStudy = (id: string) => {
    pause();
    setStudyRot(0);
    st.open(id);
  };
  // a speed asked by the coach ("au ralenti" / "montre-moi") applies once the study player exists
  useEffect(() => {
    const p = st.study.current;
    if (p && pendingStudySpeed.current !== null) {
      p.speed = pendingStudySpeed.current;
      pendingStudySpeed.current = null;
      st.bump();
    }
  });
  const askCoach = () => {
    pause();
    setAsking(true);
  };
  const onCoachAction = (a: CoachAction) => {
    if (a.type === 'demo' || a.type === 'repeat' || a.type === 'slow') {
      setAsking(false);
      pendingStudySpeed.current = a.type === 'slow' ? 0.25 : 1;
      openStudy(a.techniqueId);
    } else if (a.type === 'start-exercise') {
      nav(`/entrainement?ex=${encodeURIComponent(a.exerciseId)}&mode=technique`);
    } else if (a.type === 'start-combo') {
      nav(`/entrainement?cat=${encodeURIComponent(a.comboId)}&mode=technique`);
    }
  };
  const ANGLES = CAMERA_MODES.filter((c) => c.id !== 'auto');
  // a chosen angle is exact: any earlier rotation is dropped
  const chooseAngle = (m: CameraMode) => {
    setCamMode(m);
    setCamRot(0);
  };
  const stepAngle = (d: 1 | -1) => {
    // from « Auto », the arrows start at the first or the last angle
    const i = ANGLES.findIndex((c) => c.id === camMode);
    const j = i < 0 ? (d > 0 ? 0 : ANGLES.length - 1) : (i + d + ANGLES.length) % ANGLES.length;
    chooseAngle(ANGLES[j].id);
  };
  const turnCam = (deg: number) => {
    if (free) setCamMode('auto');
    setCamRot((r) => ((r + deg + 540) % 360) - 180);
  };
  const zoomCam = (f: number) => setCamZoom((z) => Math.round(Math.min(1.8, Math.max(0.7, z * f)) * 100) / 100);
  const resetCam = () => {
    setCamMode('auto');
    setCamRot(0);
    setCamZoom(1);
    setCloseUp(false);
  };
  // « Auto » is the full automatic camera: no rotation or zoom left from a manual adjustment
  const isAuto = camMode === 'auto' && camRot === 0 && camZoom === 1;
  const autoName = `Auto · ${viewName(teach)}`;
  const camLabel = camMode === 'auto' ? (isAuto ? autoName : 'Auto ajusté') : (CAMERA_MODES.find((c) => c.id === camMode)?.label ?? 'Auto');

  const fullscreen = () => {
    const el = root.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.().catch(() => undefined);
  };

  const running = view.phase !== 'pret' && view.phase !== 'termine';
  const phaseLabel =
    view.phase === 'decompte'
      ? 'Prépare-toi'
      : view.phase === 'repos'
        ? 'Repos'
        : view.phase === 'travail'
          ? item.work
            ? `Round ${view.round}/${item.rounds}`
            : MODE_LABEL[plan.mode]
          : view.phase === 'termine'
            ? 'Terminé'
            : 'Prêt';

  // the technique taught right now: the one studied, the one played, else the first of the sequence
  // between two repetitions the last move stays on screen, so the panel does not jump
  const lastFocus = useRef<string | null>(null);
  const focusId = st.tech ?? curId ?? (view.phase === 'travail' || view.phase === 'decompte' ? (lastFocus.current ?? seq[0]) : seq[0]);
  lastFocus.current = focusId;
  const focus = focusId ? TECHNIQUE_BY_ID.get(focusId) : undefined;
  const instr = focus ? instructionOf(focus) : null;
  let moveName = cur?.name ?? (view.phase === 'travail' ? (focus?.name ?? 'Garde') : phaseLabel);
  let cue = instr?.main ?? cur?.cues[0] ?? '';
  if (view.phase === 'pret') {
    moveName = focus?.name ?? 'En garde';
    if (!instr) cue = 'Appuie sur Démarrer quand tu es prêt.';
  } else if (view.phase === 'repos') {
    moveName = 'Repos';
    cue = view.banner ?? 'Respire, relâche les épaules, reste en mouvement léger.';
  } else if (view.phase === 'termine') {
    moveName = 'Séance terminée';
    cue = `${view.reps} répétitions, ${formatDuration(view.sessionSec)} de travail actif.`;
  } else if (view.phase === 'travail' && !cur && !instr) {
    cue = 'Retour en garde, respire.';
  }

  // key points of the taught technique (feet, pelvis, limbs, return to guard); the one matching the
  // phase being played is highlighted
  const [livePhase, setLivePhase] = useState<{ techniqueId: string; phase: PointPhase } | null>(null);
  const studyPhase = st.study.current?.phase;
  useEffect(() => {
    if (st.tech || view.phase !== 'travail') {
      setLivePhase(null);
      return;
    }
    const id = window.setInterval(() => {
      const now = player.current?.phaseNow() ?? null;
      setLivePhase((prev) => (prev?.techniqueId === now?.techniqueId && prev?.phase === now?.phase ? prev : now));
    }, 100);
    return () => window.clearInterval(id);
  }, [st.tech, view.phase, player]);
  const phaseNow: PointPhase | null = st.tech
    ? studyPhase === 'point'
      ? 'execution'
      : studyPhase === 'preparation' || studyPhase === 'execution' || studyPhase === 'retour'
        ? studyPhase
        : null
    : livePhase && livePhase.techniqueId === focusId
      ? livePhase.phase
      : null;
  const points = (view.phase === 'termine' ? [] : (instr?.points ?? [])).map((pt, i) => ({ id: `${focusId}#${i}`, ...pt, now: !!pt.phase && pt.phase === phaseNow }));
  const SLOW = 0.25;
  const slow = view.speed <= SLOW + 1e-3 && item.speed > SLOW;
  // progression of the session: rounds of timed work, else exercises of the plan
  const itemFrac =
    item.work && view.remaining !== null && view.phase === 'travail'
      ? Math.min(1, ((view.round - 1) * item.work + (item.work - view.remaining)) / (item.rounds * item.work))
      : view.phase === 'termine'
        ? 1
        : 0;
  const progress = plan.items.length > 1 || item.work ? Math.min(1, (view.itemIndex + itemFrac) / plan.items.length) : null;

  // if the text is enlarged so much that everything cannot fit, switch to an explicit scrolling layout
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const check = () => {
      const stage = el.querySelector('.tr-stage') as HTMLElement | null;
      setOverflow(!!stage && stage.clientHeight < 150);
    };
    const ro = new ResizeObserver(check);
    ro.observe(el);
    check();
    return () => ro.disconnect();
  }, []);

  return (
    <div className={`training ${immersive ? 'immersive' : ''} ${overflow ? 'overflow' : ''} ${asking ? 'asking' : ''}`} ref={root} data-testid="training">
      <header className="tr-top">
        <button className="btn icon ghost" onClick={() => nav(-1)} aria-label="Quitter l’entraînement">
          <AppIcon id="back" />
        </button>
        <div className="tr-titles">
          <div className="eyebrow">
            {disc.name} · {lvl.name} · {MODE_LABEL[plan.mode]}
          </div>
          <div className="title" data-testid="exercise-name">
            {item.label ? `${item.label} : ` : ''}
            {item.name}
          </div>
        </div>
        <button className={`ar-state ${arView.state !== 'off' ? 'on' : ''}`} onClick={() => setArIntro(true)} data-testid="ar-button" aria-label="Réalité augmentée">
          <AppIcon id="ar" size={18} />
          <span>{arView.state === 'off' ? 'AR désactivée' : arView.state === 'starting' ? 'AR…' : 'AR active'}</span>
        </button>
      </header>

      <div className="tr-stage">
        <CoachStage
          coach={coach}
          discipline={item.discipline}
          southpaw={stageSouthpaw}
          view={stageView}
          free={free}
          onUserOrbit={() => setCamMode('libre')}
          frameIds={seq}
          quality={settings.quality}
          events={events}
          onPlayer={onPlayer}
          onRigReady={(rig, lib) => {
            st.onRigReady(rig, lib);
            if (autoStudy.current) {
              autoStudy.current = false;
              openStudy(seq[0]);
            }
          }}
          study={st.study}
          studyActive={!!st.tech}
          ar={ar}
          arActive={arActive}
        />
        <div className="stage-badge">
          <span className={`phase ${view.phase}`} data-testid="phase">
            {view.paused ? 'Pause' : phaseLabel}
          </span>
          {view.remaining !== null && <span className="phase light">{clock(view.remaining)}</span>}
        </div>
        {view.phase === 'decompte' && !view.paused && !st.tech && view.remaining !== null && view.remaining <= 3.05 && <div className="countdown">{Math.max(1, Math.ceil(view.remaining))}</div>}
        <div className="stage-tools">
          <button
            className={`btn cam-btn ${camOpen ? 'on' : ''}`}
            onClick={() => setCamOpen(!camOpen)}
            aria-label={`Caméra : ${camLabel}. Ouvrir les réglages de caméra`}
            aria-expanded={camOpen}
            data-testid="cam-mode"
          >
            <AppIcon id="camera" />
            <span>{isAuto ? 'Auto' : camLabel}</span>
          </button>
          {teach.closeUp && !free && (
            <button className={`btn ${closeUp ? 'on' : ''}`} onClick={() => setCloseUp(!closeUp)} aria-label={teach.closeUp.label} aria-pressed={closeUp}>
              Zoom
            </button>
          )}
          <button
            className={`btn ${immersive ? 'on' : ''}`}
            onClick={() => {
              if (!immersive) fullscreen();
              else if (document.fullscreenElement) void document.exitFullscreen();
              setImmersive(!immersive);
            }}
            aria-label="Plein écran : masquer les commandes secondaires"
            aria-pressed={immersive}
            data-testid="fullscreen"
          >
            <AppIcon id="fullscreen" />
          </button>
        </div>
        {!st.tech && !arActive && (settings.groundMarks.avantArriere || settings.groundMarks.pivot || settings.groundMarks.trajectoire) && (
          <div className="mark-legend" aria-label="Légende des repères" data-testid="mark-legend">
            {settings.groundMarks.avantArriere && (
              <>
                <span>
                  <i className="dot red" /> Pied avant
                </span>
                <span>
                  <i className="dot blue" /> Pied arrière
                </span>
              </>
            )}
            {settings.groundMarks.trajectoire && (
              <span>
                <i className="bar red" /> Trajectoire
              </span>
            )}
            {settings.groundMarks.pivot && (
              <span>
                <i className="bar blue" /> Pivot
              </span>
            )}
          </div>
        )}
        {item.soloNote && !immersive && !asking && <div className="solo-note">{item.soloNote}</div>}
        {asking && (
          <div className="tr-ask" data-testid="coach-panel">
            <CoachAskPanel
              context={{
                pseudo: profile.coachAi.usePseudo ? profile.pseudo : undefined,
                discipline: item.discipline,
                level: item.level,
                guard: profile.guard,
                techniqueId: st.tech ?? curId ?? seq[0],
                exerciseId: item.key,
                goals: profile.goals,
              }}
              onAction={onCoachAction}
              onClose={() => setAsking(false)}
            />
          </div>
        )}
      </div>

      <section className="tr-info" aria-live="polite">
        <div className="tr-now">
          <span className="name" data-testid="current-move">
            {st.tech ? TECHNIQUE_BY_ID.get(st.tech)?.name : moveName}
          </span>
          {view.phase === 'travail' && view.step >= 0 && !st.tech && (
            <span className="badge">
              {view.step + 1}/{seq.length}
            </span>
          )}
          {view.phase === 'travail' && next && !st.tech && <span className="next">Puis : {next.name}</span>}
        </div>
        {!st.tech && (
          <p className="tr-cue" data-testid="main-instruction">
            {cue}
          </p>
        )}
        {points.length > 0 && (
          <ul className={`tr-points ${points.length > 3 ? 'cols' : ''}`} aria-label="Points clés" data-testid="key-points">
            {points.map((pt) => (
              <li key={pt.id} className={pt.now ? 'now' : ''} data-zone={pt.zone} aria-current={pt.now ? 'step' : undefined}>
                {pt.text}
              </li>
            ))}
          </ul>
        )}
        {!st.tech && (
          <div className="tr-meta" data-testid="timer-row">
            <span>
              Séance <b data-testid="session-time">{clock(view.sessionSec, false)}</b>
            </span>
            <span>
              Cumul <b data-testid="exercise-time">{formatDuration(view.exerciseSec)}</b>
            </span>
            <span>
              <b data-testid="reps">{view.reps}</b> rép.
            </span>
            {item.work ? (
              <span>
                Round <b>{view.round}</b>/{item.rounds}
              </span>
            ) : null}
            {plan.items.length > 1 && (
              <span>
                Exercice <b>{view.itemIndex + 1}</b>/{plan.items.length}
              </span>
            )}
            {progress !== null && (
              <span
                className="tr-progress"
                role="progressbar"
                aria-label="Progression de la séance"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
                data-testid="progress"
              >
                <i style={{ width: `${Math.round(progress * 100)}%` }} />
              </span>
            )}
          </div>
        )}
      </section>

      <footer className="tr-bottom">
        {st.tech ? (
          <StudyPanel
            study={st.study.current}
            tech={st.tech}
            sequence={seq}
            onPick={(id) => (setStudyRot(0), st.open(id))}
            onClose={() => st.close()}
            rotate={studyRot}
            onRotate={setStudyRot}
            southpaw={st.southpaw}
            onToggleGuard={st.toggleGuard}
          />
        ) : (
          <>
            {camOpen ? (
              <div className="tr-camera" role="group" aria-label="Caméra" data-testid="camera-panel">
                <div className="cam-row">
                  <button className={`btn sm ${isAuto ? 'on' : ''}`} aria-pressed={isAuto} onClick={resetCam} data-testid="cam-auto">
                    Auto
                  </button>
                  <div className="cam-angle">
                    <button className="btn icon sm" onClick={() => stepAngle(-1)} aria-label="Angle précédent">
                      <AppIcon id="back" size={18} />
                    </button>
                    <span aria-live="polite" data-testid="cam-angle">
                      {isAuto ? viewName(teach) : camLabel}
                    </span>
                    <button className="btn icon sm" onClick={() => stepAngle(1)} aria-label="Angle suivant" data-testid="cam-next">
                      <AppIcon id="chevron" size={18} />
                    </button>
                  </div>
                </div>
                <div className="cam-row">
                  <button className="btn icon sm" onClick={() => turnCam(-30)} aria-label="Tourner la caméra vers la gauche" data-testid="cam-left">
                    <AppIcon id="rotateLeft" size={20} />
                  </button>
                  <button className="btn icon sm" onClick={() => turnCam(30)} aria-label="Tourner la caméra vers la droite" data-testid="cam-right">
                    <AppIcon id="rotateRight" size={20} />
                  </button>
                  <button className="btn icon sm" onClick={() => zoomCam(1 / 1.15)} disabled={camZoom <= 0.7} aria-label="Dézoomer" data-testid="zoom-out">
                    <AppIcon id="zoomOut" size={20} />
                  </button>
                  <button className="btn icon sm" onClick={() => zoomCam(1.15)} disabled={camZoom >= 1.8} aria-label="Zoomer" data-testid="zoom-in">
                    <AppIcon id="zoomIn" size={20} />
                  </button>
                  <button className="btn sm" onClick={resetCam} aria-label="Recentrer la caméra" data-testid="cam-reset">
                    <AppIcon id="target" size={18} />
                    <span className="cam-reset-label">Recentrer</span>
                  </button>
                  <button className="btn icon sm" onClick={() => setCamOpen(false)} aria-label="Fermer les réglages de caméra" data-testid="cam-close">
                    <AppIcon id="close" size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="tr-secondary">
                <button className="btn sm" data-testid="decompose" aria-label="Décomposer le mouvement" onClick={() => openStudy(curId ?? seq[0])}>
                  <AppIcon id="decompose" size={18} />
                  <span className="sec-label">Décomposer</span>
                </button>
                <button
                  className="btn sm"
                  data-testid="how-to"
                  aria-label="Comment faire ?"
                  onClick={() => {
                    pause();
                    setGuideId(curId ?? seq[0]);
                  }}
                >
                  <AppIcon id="info" size={18} />
                  <span className="sec-label">Comment faire ?</span>
                </button>
                <button className={`btn sm ${slow ? 'on' : ''}`} data-testid="slow" aria-label="Ralenti" aria-pressed={slow} onClick={() => setSpeed(slow ? item.speed : SLOW)}>
                  <AppIcon id="slow" size={18} />
                  <span className="sec-label">Ralenti</span>
                </button>
                <button className="btn sm icon-only" onClick={() => setSheet(true)} aria-label="Paramètres" data-testid="options">
                  <AppIcon id="settings" size={18} />
                </button>
              </div>
            )}
            <div className={`controls ${coachAiOn ? 'with-coach' : ''}`}>
              <button className="btn icon ghost" onClick={restart} aria-label="Recommencer">
                <AppIcon id="replay" size={20} />
              </button>
              <button className="btn icon" onClick={() => goto(view.itemIndex - 1)} disabled={view.itemIndex === 0} aria-label="Exercice précédent">
                <AppIcon id="stepBack" />
              </button>
              {!running ? (
                <button className="btn primary main" onClick={start} data-testid="start">
                  <AppIcon id="play" /> {view.phase === 'termine' ? 'Recommencer' : 'Démarrer'}
                </button>
              ) : view.paused ? (
                <button className="btn primary main" onClick={resume} data-testid="resume">
                  <AppIcon id="play" /> Reprendre
                </button>
              ) : (
                <button className="btn dark main" onClick={pause} data-testid="pause">
                  <AppIcon id="pause" /> Pause
                </button>
              )}
              <button className="btn icon" onClick={() => goto(view.itemIndex + 1)} disabled={view.itemIndex >= plan.items.length - 1} aria-label="Exercice suivant">
                <AppIcon id="stepForward" />
              </button>
              {coachAiOn && (
                <button
                  className={`btn coach-btn ${asking ? 'on' : ''}`}
                  data-testid="ask-coach"
                  aria-label="Demander au coach"
                  aria-pressed={asking}
                  onClick={() => (asking ? setAsking(false) : askCoach())}
                >
                  <AppIcon id="coachAi" size={20} />
                  <span>Coach</span>
                </button>
              )}
            </div>
          </>
        )}
      </footer>

      {/* shown by the browser on top of the camera image during an AR session (WebXR DOM overlay) */}
      <div className="ar-overlay" ref={arRoot}>
        {arActive && (
          <>
            <div className="ar-top">
              <span className={`phase ${view.phase}`}>{view.paused ? 'Pause' : phaseLabel}</span>
              {view.remaining !== null && <span className="phase light">{clock(view.remaining)}</span>}
              <span className="phase light">{clock(view.sessionSec, false)}</span>
              <span className="phase light">{view.reps} rép.</span>
            </div>
            {!arCompact && (
              <div className="ar-move">
                <b>{moveName}</b>
                {view.phase === 'travail' && next && <span> · Suivant : {next.name}</span>}
              </div>
            )}
            <div className="ar-bottom">
              <ArControls bridge={ar} compact={arCompact} onToggleCompact={() => setArCompact((c) => !c)} recommendedAz={stageAzimuth(teach, item.discipline, southpaw)} />
              {!arCompact && (
                <div className="speed">
                  <span>Vitesse</span>
                  <input type="range" min={0.25} max={1.5} step={0.05} value={view.speed} onChange={(e) => setSpeed(Number(e.target.value))} aria-label="Vitesse" />
                  <b>×{view.speed.toFixed(2)}</b>
                </div>
              )}
              <div className="row nowrap" style={{ gap: 6, justifyContent: 'center' }}>
                {!arCompact && (
                  <button className="btn icon" onClick={() => goto(view.itemIndex - 1)} disabled={view.itemIndex === 0} aria-label="Exercice précédent">
                    <AppIcon id="stepBack" />
                  </button>
                )}
                {!running ? (
                  <button className="btn primary" onClick={start}>
                    <AppIcon id="play" /> Démarrer
                  </button>
                ) : view.paused ? (
                  <button className="btn primary" onClick={resume}>
                    <AppIcon id="play" /> Reprendre
                  </button>
                ) : (
                  <button className="btn dark" onClick={pause}>
                    <AppIcon id="pause" /> Pause
                  </button>
                )}
                {!arCompact && (
                  <button className="btn icon" onClick={() => goto(view.itemIndex + 1)} disabled={view.itemIndex >= plan.items.length - 1} aria-label="Exercice suivant">
                    <AppIcon id="stepForward" />
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {arIntro && <ArIntroSheet bridge={ar} overlayRoot={() => arRoot.current} onClose={() => setArIntro(false)} onBeforeStart={pause} />}

      {guideId && (
        <div className="sheet-backdrop" onClick={() => setGuideId(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Comment faire">
            <div className="row" style={{ gap: 6 }}>
              {[...new Set(seq)].map((id) => (
                <button key={id} className={`chip ${guideId === id ? 'on' : ''}`} onClick={() => setGuideId(id)}>
                  {TECHNIQUE_BY_ID.get(id)?.name ?? id}
                </button>
              ))}
            </div>
            <GuideCard id={guideId} southpaw={southpaw} title />
            <button className="btn dark block" onClick={() => setGuideId(null)}>
              Fermer
            </button>
          </div>
        </div>
      )}

      {sheet && (
        <div className="sheet-backdrop" onClick={() => setSheet(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Options d’entraînement">
            <h2>Options</h2>
            <div className="stack">
              <span className="label">Coach</span>
              <div className="row">
                <button className={`chip ${coach === 'homme' ? 'on' : ''}`} onClick={() => chooseCoach('homme')}>
                  Coach homme
                </button>
                <button className={`chip ${coach === 'femme' ? 'on' : ''}`} onClick={() => chooseCoach('femme')}>
                  Coach femme
                </button>
              </div>
            </div>
            <div className="stack">
              <span className="label">Rendu</span>
              <CoachLookPicker testId="training-coach-look" />
            </div>
            <div className="stack">
              <span className="label">Garde</span>
              <div className="row">
                <button className={`chip ${!southpaw ? 'on' : ''}`} onClick={() => updateProfile({ guard: 'orthodoxe' })}>
                  Orthodoxe (gauche devant)
                </button>
                <button className={`chip ${southpaw ? 'on' : ''}`} onClick={() => updateProfile({ guard: 'gaucher' })}>
                  Gaucher (droite devant)
                </button>
              </div>
            </div>
            <div className="stack">
              <span className="label">Caméra</span>
              <div className="row">
                {CAMERA_MODES.map((c) => (
                  <button
                    key={c.id}
                    className={`chip ${(c.id === 'auto' ? isAuto : camMode === c.id) ? 'on' : ''}`}
                    aria-pressed={c.id === 'auto' ? isAuto : camMode === c.id}
                    onClick={() => (c.id === 'auto' ? resetCam() : chooseAngle(c.id))}
                    data-testid={`cam-chip-${c.id}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              {isAuto && (
                <p className="cam-why" data-testid="cam-why">
                  {teach.why}
                </p>
              )}
              <p className="small muted">Glisse le doigt sur le coach pour passer en caméra libre à 360°.</p>
            </div>
            <div className="stack">
              <span className="label">Repères au sol</span>
              <div className="row" data-testid="ground-marks">
                {(Object.keys(GROUND_MARK_LABEL) as GroundMarkId[]).map((k) => (
                  <button
                    key={k}
                    className={`chip ${settings.groundMarks[k] ? 'on' : ''}`}
                    aria-pressed={settings.groundMarks[k]}
                    onClick={() => setSettings({ groundMarks: { ...settings.groundMarks, [k]: !settings.groundMarks[k] } })}
                    data-testid={`mark-${k}`}
                  >
                    {GROUND_MARK_LABEL[k]}
                  </button>
                ))}
              </div>
            </div>
            <div className="stack">
              <span className="label">Vitesse d’exécution</span>
              <div className="speed">
                <input type="range" min={0.25} max={1.5} step={0.05} value={view.speed} onChange={(e) => setSpeed(Number(e.target.value))} aria-label="Vitesse d’exécution" data-testid="speed-range" />
                <b data-testid="speed">×{view.speed.toFixed(2)}</b>
              </div>
            </div>
            <div className="stack">
              <span className="label">Voix et sons</span>
              <div className="row">
                <button className={`chip ${settings.voice ? 'on' : ''}`} onClick={() => setSettings({ voice: !settings.voice })}>
                  Voix {settings.voice ? 'activée' : 'coupée'}
                </button>
                <button className={`chip ${settings.announceMoves ? 'on' : ''}`} onClick={() => setSettings({ announceMoves: !settings.announceMoves })}>
                  Annonce des coups
                </button>
                <button className={`chip ${settings.impactSounds ? 'on' : ''}`} onClick={() => setSettings({ impactSounds: !settings.impactSounds })}>
                  Sons d’impact
                </button>
              </div>
            </div>
            <div className="stack">
              <span className="label">Enchaînement</span>
              <ol className="small" style={{ margin: 0, paddingLeft: 20 }}>
                {plan.items.map((it, i) => (
                  <li key={i} style={{ fontWeight: i === view.itemIndex ? 800 : 400, padding: '3px 0', cursor: 'pointer' }} onClick={() => (goto(i), setSheet(false))}>
                    {it.label ?? it.name}
                    {it.work ? ` · ${it.rounds} × ${clock(it.work)}` : ''}
                  </li>
                ))}
              </ol>
            </div>
            <button className="btn dark block" onClick={() => setSheet(false)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
