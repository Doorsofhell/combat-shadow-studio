import { CHAMPIONS } from '../../domain/coaches/catalog';
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
import { DISCIPLINES, DisciplineId, LEVELS, TrainingMode } from '../../domain/types';
import { INTENSITY_LABEL, MODE_LABEL, Plan, customPlan, exercisePlan, programPlan, techniquePlan } from '../training/plan';
import { cardioFromQuery } from '../training/TimerOptions';
import { SessionPersist, useSession } from '../training/useSession';
import { useCatalog } from '../../store/catalog';
import { catalogPlan } from '../../domain/catalog/plan';
import { useCoachBubble } from '../coach-ai/coachHost';
import { FsHint } from '../fullscreen/FullscreenStage';
import { useStageFullscreen } from '../fullscreen/useStageFullscreen';
import type { CoachAction } from '../../coach/engine';
import { GuideCard } from '../GuideCard';
import { chooseCoach } from '../components/fighter';
import { CAMERA_MODES, CameraMode, manualView, stageAzimuth, stepViews, techniqueView, viewName } from '../../domain/camera';
import type { StageView } from '../../three/StudioStage';
import { StudyPanel, useStudy } from '../training/Study';
import { MoveBand, MoveName } from '../training/MoveBand';
import { ConsigneBand } from '../training/ConsigneBand';
import { toast } from '../components/Toast';
import { CoachScreen, useCoachUi } from '../coach-screen/CoachScreen';
import { ArBridge } from '../../ar/ArBridge';
import { CoachLookPicker } from '../components/CoachLookPicker';
import { ArControls, ArIntroSheet, useArView } from '../training/ArMode';
import { AppIcon } from '../icons';
import { useNavActions } from '../nav/store';
import { useSmartBack, vibrate } from '../nav/BottomBar';
import { openLayers } from '../nav/layers';
import { ConfirmDialog } from '../components/Sheet';
import { onBackButton } from '../../platform/native';
import { useResume } from '../../store/resume';
import { ResumeSnapshot, matchesPlan, sessionQuery } from '../../domain/resume';
import { useHydrated } from '../../store/useHydrated';

/** 1.4.0: the angles at hand in the coach zone (every other one stays in the sheet « Caméra ») */
const QUICK_ANGLES: { id: CameraMode; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'face', label: 'Face' },
  { id: 'trois-quarts-droit', label: '3/4' },
  { id: 'profil-droit', label: 'Profil' },
];

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
      // v0.47: the Cardio intervals of the link (else the last ones chosen)
      cardio: cardioFromQuery(q, settings.cardio),
    };
    if (catId) {
      const e = catalog?.comboById.get(catId);
      return e ? catalogPlan(e, mode, o) : null;
    }
    if (q.get('prog')) return programPlan(q.get('prog')!, Math.max(0, Number(q.get('s') ?? 1) - 1) || 0);
    if (q.get('perso')) {
      const c = combos.find((x) => x.id === q.get('perso'));
      return c ? customPlan(c, profile.levels[c.discipline], mode, o) : null;
    }
    if (q.get('ex')) return exercisePlan(q.get('ex')!, mode, o);
    if (q.get('tech')) {
      const dq = (DISCIPLINES.some((x) => x.id === q.get('d')) ? q.get('d') : profile.mainDiscipline) as DisciplineId;
      return techniquePlan(q.get('tech')!, dq, profile.levels[dq] ?? 'debutant', mode, o);
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, combos.length, catalog]);

  // 0.33: « Reprendre » opens the session with reprise=1; the snapshot is read once the store is loaded, so a
  // resume never silently starts the session from zero
  const reprise = q.get('reprise') === '1';
  const query = sessionQuery(q);
  const resumeReady = useHydrated(useResume);
  const snapshots = useResume((s) => s.snapshots);
  const [fresh, setFresh] = useState(false);
  const snapshot = useMemo<ResumeSnapshot | null>(() => (reprise && !fresh ? snapshots.find((x) => x.query === query) ?? null : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reprise, fresh, query, resumeReady]);

  if ((catId && !catalog && !catalogError) || (reprise && !resumeReady)) return <div className="loading">Chargement…</div>;

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
  const programId = q.get('prog') ?? undefined;
  if (reprise && !fresh && (!snapshot || !matchesPlan(snapshot, plan))) {
    // the save is gone or no longer matches the exercise (an exercise changed or a combination was edited):
    // nothing is restored by guess, the user chooses to start again
    return (
      <div className="page">
        <ConfirmDialog
          title="Reprise impossible"
          message={
            snapshot
              ? 'Cette séance a changé depuis ta pause : elle ne peut pas reprendre exactement où tu l’avais laissée. Ton temps déjà fait reste dans tes progrès.'
              : 'Cette séance n’est plus enregistrée (elle est terminée ou a été remplacée). Ton temps déjà fait reste dans tes progrès.'
          }
          confirmLabel="Recommencer"
          onConfirm={() => {
            useResume.getState().drop(query);
            setFresh(true);
          }}
          onCancel={() => history.back()}
        />
      </div>
    );
  }
  return <TrainingView key={`${key}|${fresh}`} plan={plan} persist={{ query, programId, snapshot, coach: profile.coach === 'femme' ? 'femme' : 'homme' }} />;
}


/** m:ss; countdowns round up, elapsed times round down */
function clock(sec: number, up = true) {
  const s = Math.max(0, up ? Math.ceil(sec) : Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}


function TrainingView({ plan, persist }: { plan: Plan; persist: Omit<SessionPersist, 'camera'> }) {
  const nav = useNavigate();
  const profile = useProfile((s) => s.profile);
  const updateProfile = useProfile((s) => s.update);
  const settings = useSettings((s) => s.settings);
  const setSettings = useSettings((s) => s.set);
  const savedCam = persist.snapshot?.camera;
  const [camMode, setCamMode] = useState<CameraMode>(
    savedCam && CAMERA_MODES.some((c) => c.id === savedCam) ? (savedCam as CameraMode) : (settings.cameraMode ?? 'auto'),
  );
  const camRef = useRef(camMode);
  camRef.current = camMode;
  const { view, item, events, onPlayer, player, move, start, pause, resume, restart, goto, setSpeed } = useSession(plan, { ...persist, camera: () => camRef.current });
  const [closeUp, setCloseUp] = useState(false);
  const [studyRot, setStudyRot] = useState(0);
  // « Caméra » zone: manual turn around the coach and zoom, on top of the chosen angle
  const [camOpen, setCamOpen] = useState(false);
  const [camRot, setCamRot] = useState(0);
  const [camZoom, setCamZoom] = useState(1);
  const [sheet, setSheet] = useState(false);
  const [guideId, setGuideId] = useState<string | null>(null);
  // 0.25 (Youssef, 2026-10-20 12:30): the coach is the app's one floating bubble; this screen is its
  // host (see coachHost.ts), « asking » is the bubble's panel being open
  const asking = useCoachBubble((s) => s.open);
  const setAsking = useCoachBubble((s) => s.setOpen);
  const [coachSlot, setCoachSlot] = useState<HTMLDivElement | null>(null);
  const pendingStudySpeed = useRef<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // 0.27 (Youssef, 2026-10-20 22:09: « Un double clique sur la fenêtre du coach permet un plein écran total »): the
  // immersive mode becomes the total fullscreen: a double tap on the stage or the button turns it on; only the coach
  // is left, with the main control over it, and the controls fade after 2.5 s (a tap brings them back). The
  // session keeps running.
  // 1.4.0 (Youssef, 2026-10-28, option A: « un toucher montre les commandes sans pause, le toucher suivant les
  // cache »): a single tap on the stage shows or hides the commands of the coach zone (it paused the session in
  // 1.0.0); the pause is in the commands and in the bottom bar
  const tapStage = useRef<() => void>(() => undefined);
  const coachUi = useCoachUi();
  const fs = useStageFullscreen(root, { tapRef: stageRef, onTap: () => tapStage.current() });
  const immersive = fs.active;
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
  const disc = DISCIPLINES.find((d) => d.id === item.discipline)!;
  const lvl = LEVELS.find((l) => l.id === item.level)!;

  // teaching camera: the best angle for the technique being played (close angles are shared)
  const autoViews = useMemo(() => stepViews(seq, item.discipline), [seq, item.discipline]);
  const teach = st.tech ? techniqueView(st.tech) : autoViews[Math.max(0, view.step)] ?? autoViews[0];
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
  // 1.3.0: the instructions band covers the bottom of the stage: the coach is framed in the part above it, so the
  // text never covers a foot (the user's own free camera is left as it is)
  const [consH, setConsH] = useState(0);
  const [stageH, setStageH] = useState(0);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStageH(el.clientHeight));
    ro.observe(el);
    setStageH(el.clientHeight);
    return () => ro.disconnect();
  }, []);
  if (consH > 0 && stageH > 0 && !free && !stageView.closeUp) stageView = { ...stageView, inset: { top: 0, left: 0, right: 0, bottom: Math.min(0.4, consH / stageH) } };
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
  // opening the coach pauses the session, as the former « Coach » button did
  useEffect(() => {
    if (asking) pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asking]);
  const onCoachAction = (a: CoachAction) => {
    if (a.type === 'demo' || a.type === 'repeat' || a.type === 'slow') {
      setAsking(false);
      pendingStudySpeed.current = a.type === 'slow' ? 0.25 : 1;
      openStudy(a.techniqueId);
    } else if (a.type === 'start-exercise') {
      nav(`/entrainement?ex=${encodeURIComponent(a.exerciseId)}&mode=technique`);
    } else if (a.type === 'start-combo') {
      nav(`/entrainement?cat=${encodeURIComponent(a.comboId)}&mode=technique`);
    } else if (a.type === 'navigate') {
      // the coach does not offer it during a session; if it ever comes, the session is left on purpose
      setAsking(false);
      nav(a.to);
    }
  };
  // the session is the bubble's host: its context (the move on screen) and its actions on the player
  const coachTech = st.tech ?? curId ?? seq[0];
  const usePseudo = profile.coachAi.usePseudo;
  const coachContext = useMemo(
    () => ({
      pseudo: usePseudo ? profile.pseudo : undefined,
      discipline: item.discipline,
      level: item.level,
      guard: profile.guard,
      techniqueId: coachTech,
      exerciseId: item.key,
      screen: 'entrainement' as const,
      goals: profile.goals,
    }),
    [usePseudo, profile.pseudo, item.discipline, item.level, profile.guard, coachTech, item.key, profile.goals],
  );
  const coachAction = useRef(onCoachAction);
  coachAction.current = onCoachAction;
  useEffect(() => {
    if (coachSlot) useCoachBubble.getState().setHost({ slot: coachSlot, context: coachContext, onAction: (a) => coachAction.current(a) });
  }, [coachSlot, coachContext]);
  // leaving the session (or starting another one) closes the coach, as the former inline panel did
  useEffect(() => () => useCoachBubble.setState({ host: null, open: false }), []);
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

  const running = view.phase !== 'pret' && view.phase !== 'termine';
  // v0.47 (« Chronomètre intégré au coach 3D » §4, §7, §8): the phase in words, with its colour (amber preparation,
  // red work, teal rest, neutral pause); Cardio says Effort / Récupération and counts cycles, Rounds says Combat
  const cardio = plan.mode === 'cardio';
  const phaseLabel =
    view.phase === 'decompte'
      ? 'Prépare-toi'
      : view.phase === 'repos'
        ? cardio
          ? 'Récupération'
          : 'Repos'
        : view.phase === 'travail'
          ? item.work
            ? cardio
              ? `Effort · Cycle ${view.round}/${item.rounds}`
              : plan.mode === 'rounds'
                ? `Combat · Round ${view.round}/${item.rounds}`
                : `Round ${view.round}/${item.rounds}`
            : MODE_LABEL[plan.mode]
          : view.phase === 'termine'
            ? 'Terminé'
            : 'Prêt';
  // Libre and Technique have no end: the chronometer shows the time done
  const hudTime = view.remaining !== null ? { sec: view.remaining, up: true, label: 'Temps restant' } : running ? { sec: view.sessionSec, up: false, label: 'Temps écoulé' } : null;

  // the technique taught right now: the one studied, the one played, else the first of the sequence
  // between two repetitions the last move stays on screen, so the panel does not jump
  const lastFocus = useRef<string | null>(null);
  const focusId = st.tech ?? curId ?? (view.phase === 'travail' || view.phase === 'decompte' ? lastFocus.current ?? seq[0] : seq[0]);
  lastFocus.current = focusId;
  const focus = focusId ? TECHNIQUE_BY_ID.get(focusId) : undefined;
  const instr = focus ? instructionOf(focus) : null;
  let cue = instr?.main ?? cur?.cues[0] ?? '';
  if (view.phase === 'pret') {
    if (!instr) cue = 'Appuie sur Démarrer quand tu es prêt.';
  } else if (view.phase === 'repos') {
    cue = view.banner ?? (cardio ? 'Récupère : respire, relâche les épaules, garde les mains prêtes.' : 'Respire, relâche les épaules, reste en mouvement léger.');
  } else if (view.phase === 'termine') {
    cue = `${view.reps} répétitions, ${formatDuration(view.sessionSec)} de travail actif.`;

  } else if (view.phase === 'travail' && !cur && !instr) {
    cue = 'Retour en garde, respire.';
  }
  // the empty band says nothing, except at the end of the session (never a move name)
  const bandIdle = view.phase === 'termine' ? 'Séance terminée' : '';

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
  const points = (view.phase === 'termine' ? [] : instr?.points ?? []).map((pt, i) => ({ id: `${focusId}#${i}`, ...pt, now: !!pt.phase && pt.phase === phaseNow }));
  // 0.24 (Youssef: « que le coach soit bien visible »): while the session runs, only the point of the moment is
  // shown, since 0.35 as the subtitle of the band under the coach; the full list is shown before starting, on
  // pause, at rest and in "Comment faire ?"
  const focusOnly = view.phase === 'travail' && !view.paused && !st.tech;
  // 1.3.0: the instructions follow one another under the coach while the session works; on pause the full list is
  // back under the stage (in fullscreen, where that list is hidden, the band stays, stopped)
  const consignesOn = settings.consignes === 'enchainees' && view.phase === 'travail' && !st.tech && !arActive && (!view.paused || immersive);
  const SLOW = 0.25;
  const slow = view.speed <= SLOW + 1e-3 && item.speed > SLOW;
  // progression of the session: rounds of timed work, else exercises of the plan
  const itemFrac = item.work && view.remaining !== null && view.phase === 'travail' ? Math.min(1, ((view.round - 1) * item.work + (item.work - view.remaining)) / (item.rounds * item.work)) : view.phase === 'termine' ? 1 : 0;
  // v0.47 §4: during a timed phase (preparation, round, effort, rest) the bar shows that phase; otherwise the session
  const timedPhase = running && view.remaining !== null;
  const progress = timedPhase ? view.phaseProgress : plan.items.length > 1 || item.work ? Math.min(1, (view.itemIndex + itemFrac) / plan.items.length) : null;

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

  // v0.32 navigation dynamique (sections 5.2 and 5.3): the bottom bar holds Retour, Démarrer / Pause / Reprendre (one
  // place, driven by the session's own state), Décomposer and Caméra; the other commands of the former buttons
  // (Recommencer, Précédent, Suivant, Comment faire ?, Ralenti, Options) are under « Sur cet écran » in Menu
  const smartBack = useSmartBack();
  const [leaving, setLeaving] = useState(false);
  // a session started and not finished, running or paused: leaving it ends it
  const live = running;
  const askLeave = () => {
    // a session in progress is never left by one tap: it pauses and asks (the time done is already saved)
    if (live) {
      if (!view.paused) pause();
      setLeaving(true);
    } else smartBack('entrainement');
  };
  const askLeaveRef = useRef(askLeave);
  askLeaveRef.current = askLeave;
  const liveRef = useRef(live);
  liveRef.current = live;
  // the Android back button follows the same rule (an open sheet closes first)
  useEffect(
    () =>
      onBackButton(() => {
        if (openLayers() > 0 || !liveRef.current) return false;
        askLeaveRef.current();
        return true;
      }),
    [],
  );
  const toggleState = !running ? 'start' : view.paused ? 'resume' : 'pause';
  // hands-free (maquette v4): while the session runs, only Pause (and Retour) stay above the bottom; Décomposer,
  // Caméra and « Plus » come back with the pause. A tap on the stage shows or hides the commands of the coach (1.4.0).
  const handsFree = running && !view.paused && !st.tech && !camOpen && !asking && !sheet && !guideId;
  tapStage.current = () => {
    if (!arActive) coachUi.toggle();
  };
  useEffect(() => {
    const html = document.documentElement;
    if (handsFree) html.dataset.handsFree = '';
    else delete html.dataset.handsFree;
    return () => {
      delete html.dataset.handsFree;
    };
  }, [handsFree]);
  // 1.4.0 (Youssef, 2026-10-28: « J'ai l'impression d'avoir perdu les consignes vocales »): a session that starts
  // with the voice off says so once, and how to bring it back (a crossed speaker also stays in the coach zone)
  const saidMuted = useRef(false);
  useEffect(() => {
    if (!running || saidMuted.current) return;
    saidMuted.current = true;
    if (!settings.voice || settings.voiceVolume <= 0) toast('Voix coupée : touche le coach, puis le haut-parleur pour la remettre');
  }, [running, settings.voice, settings.voiceVolume]);
  // vibrations at the moments that count, for a phone put down in front of the user (where the device can)
  const prevBeat = useRef<{ running: boolean; paused: boolean; phase: string } | null>(null);
  useEffect(() => {
    const was = prevBeat.current;
    prevBeat.current = { running, paused: view.paused, phase: view.phase };
    if (!was) return;
    let pattern: number[] | null = null;
    if (!was.running && running) pattern = [60, 40, 90];
    else if (running && !was.paused && view.paused) pattern = [30, 40, 30];
    else if (running && was.paused && !view.paused) pattern = [20];
    else if (running && !view.paused && was.phase !== view.phase && (view.phase === 'travail' || view.phase === 'repos' || view.phase === 'termine')) pattern = [80];
    if (pattern) vibrate(pattern);
  }, [running, view.paused, view.phase]);
  useNavActions(
    {
      back: { run: askLeave, ariaLabel: 'Retour : quitter l’entraînement', testId: 'nav-back' },
      toggle: {
        run: () => (toggleState === 'start' ? start() : toggleState === 'resume' ? resume() : pause()),
        icon: toggleState === 'pause' ? 'pause' : 'play',
        label: toggleState === 'start' ? 'Démarrer' : toggleState === 'resume' ? 'Reprendre' : 'Pause',
        pressed: toggleState === 'pause',
        testId: toggleState,
      },
      decompose: { run: () => (st.tech ? st.close() : openStudy(curId ?? seq[0])), pressed: !!st.tech, ariaLabel: st.tech ? 'Décomposer : revenir à la séance' : 'Décomposer le mouvement', testId: 'decompose' },
      camera: { run: () => setCamOpen(!camOpen), pressed: camOpen, ariaLabel: `Caméra : ${camLabel}. ${camOpen ? 'Fermer' : 'Ouvrir'} les réglages de caméra`, testId: 'cam-mode' },
    },
    [
      { id: 'recommencer', label: 'Recommencer', icon: { glyph: 'replay' }, run: restart, testId: 'cmd-restart' },
      { id: 'precedent', label: 'Exercice précédent', icon: { glyph: 'stepBack' }, run: () => goto(view.itemIndex - 1), disabled: view.itemIndex === 0, testId: 'cmd-prev' },
      { id: 'suivant', label: 'Exercice suivant', icon: { glyph: 'stepForward' }, run: () => goto(view.itemIndex + 1), disabled: view.itemIndex >= plan.items.length - 1, testId: 'cmd-next' },
      {
        id: 'comment-faire',
        label: 'Comment faire ?',
        icon: { glyph: 'info' },
        run: () => {
          pause();
          setGuideId(curId ?? seq[0]);
        },
        testId: 'how-to',
      },
      { id: 'ralenti', label: 'Ralenti', icon: 'speed', pressed: slow, run: () => setSpeed(slow ? item.speed : SLOW), testId: 'slow' },
      { id: 'options', label: 'Options', icon: 'options', run: () => setSheet(true), testId: 'options' },
    ],
  );

  return (
    <div className={`training ${immersive ? 'immersive' : ''} ${fs.idle ? 'fs-idle' : ''} ${overflow ? 'overflow' : ''} ${asking ? 'asking' : ''}`} ref={root} data-testid="training">
      {/* 0.35 HUD: discipline and level, the state of the session, the round and its time left, a thin progress bar.
          The exercise (and so the full combination) is no longer shown here while it runs: see the band and tr-info */}
      <header className={`tr-top tr-hud ${view.phase} ${view.paused ? 'paused' : ''}`} data-testid="hud">
        <div className="hud-row">
          <span className="hud-disc">
            {disc.name} · {lvl.name}
          </span>
          <span className={`phase ${view.phase} ${view.paused ? 'paused' : ''}`} data-testid="phase">
            {view.paused ? 'Pause' : phaseLabel}
          </span>
          {hudTime && (
            <span className={`hud-time ${hudTime.up ? '' : 'elapsed'}`} data-testid="phase-time" aria-label={`${hudTime.label} ${clock(hudTime.sec, hudTime.up)}`}>
              {clock(hudTime.sec, hudTime.up).padStart(5, '0')}
            </span>
          )}
          <button className={`ar-state ${arView.state !== 'off' ? 'on' : ''}`} onClick={() => setArIntro(true)} data-testid="ar-button" aria-label="Réalité augmentée">
            <AppIcon id="ar" size={18} />
            {/* 0.24 (épuration) : « AR » seul quand elle est éteinte */}
            <span>{arView.state === 'off' ? 'AR' : arView.state === 'starting' ? 'AR…' : 'AR active'}</span>
          </button>
        </div>
        {progress !== null && (
          <span className={`tr-progress hud-progress ${timedPhase ? `phase-bar ${view.paused ? 'paused' : view.phase}` : ''}`} role="progressbar" aria-label={timedPhase ? `Progression : ${phaseLabel}` : 'Progression de la séance'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} data-testid="progress">
            <i style={{ width: `${Math.round(progress * 100)}%` }} />
          </span>
        )}
      </header>

      <CoachScreen
        context="seance"
        className="tr-stage"
        screenRef={stageRef}
        testId="training-stage"
        place="entraînement"
        stageClassName="tr-stage-3d"
        style={consH ? ({ '--cons-h': `${consH}px` } as React.CSSProperties) : undefined}
        fs={fs}
        ui={coachUi}
        hint={false}
        fallback={null}
        commands={{
          // 1.1.0 (Youssef: « la vitesse d'exécution plus accessible directement depuis le démarrage »)
          speed: arActive ? undefined : { value: view.speed, onChange: setSpeed },
          // 1.3.0 (Youssef: « en dessous des deux options déjà présentes… à droite de l'écran »): the speaker
          sound: !arActive,
          pause: running ? { paused: view.paused, onToggle: view.paused ? resume : pause } : undefined,
          angles: arActive || st.tech ? undefined : { value: isAuto ? 'auto' : camMode, options: QUICK_ANGLES, onChange: (id) => (id === 'auto' ? resetCam() : chooseAngle(id as CameraMode)) },
          extra:
            teach.closeUp && !free ? (
              <button className={`btn ${closeUp ? 'on' : ''}`} onClick={() => setCloseUp(!closeUp)} aria-label={teach.closeUp.label} aria-pressed={closeUp}>
                Zoom
              </button>
            ) : undefined,
        }}
        stage={
          <CoachStage
            backdrop="theme"
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
        }
      >
        {/* 1.1.0 (Youssef, 2026-10-27: « la numérotation en rouge au milieu de l'écran ne sert plus à rien car on a le
            chronomètre en haut à droite »): no big countdown over the coach; the time of the preparation is in the HUD */}
        {!st.tech && !arActive && (settings.groundMarks.avantArriere || settings.groundMarks.pivot || settings.groundMarks.trajectoire) && (
          <div className="mark-legend" aria-label="Légende des repères" data-testid="mark-legend">
            {settings.groundMarks.avantArriere && (
              <>
                <span><i className="dot red" /> Pied avant</span>
                <span><i className="dot blue" /> Pied arrière</span>
              </>
            )}
            {settings.groundMarks.trajectoire && <span><i className="bar red" /> Trajectoire</span>}
            {settings.groundMarks.pivot && <span><i className="bar blue" /> Pivot</span>}
          </div>
        )}
        {consignesOn && <ConsigneBand techniqueId={focusId ?? null} running={!view.paused} sec={settings.consigneSec} onHeight={setConsH} />}
        {item.soloNote && !immersive && !asking && !consignesOn && <div className="solo-note">{item.soloNote}</div>}
        {!immersive && !asking && !arActive && !st.tech && !coachUi.shown && <FsHint />}
        {/* the app's coach bubble and its panel are shown here (lower right corner of the stage) */}
        <div className="tr-coach-slot" ref={setCoachSlot} />
      </CoachScreen>

      <MoveBand
        store={move}
        active={view.phase === 'travail'}
        studied={st.tech}
        phase={settings.consignes === 'point' ? livePhase : null}
        total={seq.length}
        idle={bandIdle}
        onInfo={(id) => {
          pause();
          setGuideId(id);
        }}
      />

      <section className={`tr-info ${focusOnly ? 'focus' : ''}`}>
        {/* the exercise, its main instruction and every key point: before starting, on pause, at the end and in
            Décomposer; while the coach works, the band under the stage carries the move and its point of the moment */}
        {!focusOnly && !st.tech && (
          <div className="tr-now">
            <span className="name" data-testid="exercise-name">
              {item.label ? `${item.label} : ` : ''}
              {item.name}
            </span>
            <span className="next">{MODE_LABEL[plan.mode]}</span>
          </div>
        )}
        {!focusOnly && !st.tech && (
          <p className="tr-cue" data-testid="main-instruction">
            {cue}
          </p>
        )}
        {/* v0.47 §7, §8: the summary of a timed session (rounds or cycles, effort, rest, total, intensity) */}
        {view.phase === 'termine' && !st.tech && view.plannedRounds !== null && (
          <dl className="tr-summary" data-testid="session-summary">
            <div>
              <dt>{cardio ? 'Cycles' : 'Rounds'}</dt>
              <dd>
                {view.roundsDone}/{view.plannedRounds}
              </dd>
            </div>
            <div>
              <dt>{cardio ? 'Effort' : 'Travail'}</dt>
              <dd>{formatDuration(view.sessionSec)}</dd>
            </div>
            <div>
              <dt>{cardio ? 'Récupération' : 'Repos'}</dt>
              <dd>{formatDuration(view.restSec)}</dd>
            </div>
            <div>
              <dt>Durée totale</dt>
              <dd>{formatDuration(view.totalSec)}</dd>
            </div>
            {cardio && plan.intensity && (
              <div>
                <dt>Intensité</dt>
                <dd>{INTENSITY_LABEL[plan.intensity]}</dd>
              </div>
            )}
            <div>
              <dt>Discipline</dt>
              <dd>{disc.name}</dd>
            </div>
          </dl>
        )}
        {!focusOnly && points.length > 0 && (
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
            {plan.items.length > 1 && (
              <span>
                Exercice <b>{view.itemIndex + 1}</b>/{plan.items.length}
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
            ) : null}
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
                <MoveName store={move} active={view.phase === 'travail'} fallback={view.phase === 'travail' ? '' : phaseLabel} />
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

      {leaving && (
        <ConfirmDialog
          title="Quitter la séance ?"
          message="La séance est en pause. Le temps déjà fait est enregistré dans tes progrès, et tu pourras la reprendre depuis Entraîner."
          confirmLabel="Quitter"
          onConfirm={() => {
            setLeaving(false);
            smartBack('entrainement');
          }}
          onCancel={() => setLeaving(false)}
        />
      )}

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
                  {CHAMPIONS.homme.name}
                </button>
                <button className={`chip ${coach === 'femme' ? 'on' : ''}`} onClick={() => chooseCoach('femme')}>
                  {CHAMPIONS.femme.name}
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
                  <button key={c.id} className={`chip ${(c.id === 'auto' ? isAuto : camMode === c.id) ? 'on' : ''}`} aria-pressed={c.id === 'auto' ? isAuto : camMode === c.id} onClick={() => (c.id === 'auto' ? resetCam() : chooseAngle(c.id))} data-testid={`cam-chip-${c.id}`}>
                    {c.label}
                  </button>
                ))}
              </div>
              {isAuto && <p className="cam-why" data-testid="cam-why">{teach.why}</p>}
              <p className="small muted">Glisse le doigt sur le coach pour passer en caméra libre à 360°.</p>
            </div>
            <div className="stack">
              <span className="label">Repères au sol</span>
              <div className="row" data-testid="ground-marks">
                {(Object.keys(GROUND_MARK_LABEL) as GroundMarkId[]).map((k) => (
                  <button key={k} className={`chip ${settings.groundMarks[k] ? 'on' : ''}`} aria-pressed={settings.groundMarks[k]} onClick={() => setSettings({ groundMarks: { ...settings.groundMarks, [k]: !settings.groundMarks[k] } })} data-testid={`mark-${k}`}>
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

