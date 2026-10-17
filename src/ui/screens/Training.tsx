import '../training/training.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CoachStage } from '../../three/CoachStage';
import { useProfile } from '../../store/profile';
import { useSettings } from '../../store/settings';
import { useCustom } from '../../store/custom';
import { formatDuration } from '../../store/stats';
import { TECHNIQUE_BY_ID } from '../../domain/techniques';
import { DISCIPLINES, LEVELS, TrainingMode } from '../../domain/types';
import { MODE_LABEL, Plan, customPlan, exercisePlan, programPlan } from '../training/plan';
import { useSession } from '../training/useSession';
import { useCatalog } from '../../store/catalog';
import { catalogPlan } from '../../domain/catalog/plan';
import { CoachAskPanel } from '../coach-ai/CoachAskPanel';
import type { CoachAction } from '../../coach/engine';
import { useCoachAi } from '../../store/coachAi';
import { GuideCard } from '../GuideCard';
import { CAMERA_MODES, CameraMode, manualView, oriented, sequenceView, techniqueView } from '../../domain/camera';
import type { StageView } from '../../three/StudioStage';
import { StudyPanel, useStudy } from '../training/Study';
import { ArBridge } from '../../ar/ArBridge';
import { ArControls, ArIntroSheet, useArView } from '../training/ArMode';
import { IconAr, IconBack, IconCamera, IconChat, IconExpand, IconInfo, IconLayers, IconNext, IconPause, IconPlay, IconPrev, IconRestart, IconSliders } from '../icons';

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
  const setCoach = useProfile((s) => s.setCoach);
  const updateProfile = useProfile((s) => s.update);
  const settings = useSettings((s) => s.settings);
  const setSettings = useSettings((s) => s.set);
  const { view, item, events, onPlayer, start, pause, resume, restart, goto, setSpeed } = useSession(plan);
  const [camMode, setCamMode] = useState<CameraMode>(settings.cameraMode ?? 'auto');
  const [closeUp, setCloseUp] = useState(false);
  const [studyRot, setStudyRot] = useState(0);
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
  const [q] = useSearchParams();
  const autoStudy = useRef(q.get('study') === '1');

  const seq = item.sequence;
  const curId = view.step >= 0 ? seq[view.step] : null;
  const cur = curId ? TECHNIQUE_BY_ID.get(curId) : null;
  const nextId = view.step >= 0 ? seq[(view.step + 1) % seq.length] : seq[0];
  const next = TECHNIQUE_BY_ID.get(nextId);
  const disc = DISCIPLINES.find((d) => d.id === item.discipline)!;
  const lvl = LEVELS.find((l) => l.id === item.level)!;

  // teaching camera: best angle for the technique (or one stable angle for the whole combination)
  const teach = st.tech ? techniqueView(st.tech) : sequenceView(seq);
  const manual = manualView(camMode);
  const free = camMode === 'libre';
  const lastView = useRef<StageView | null>(null);
  let stageView: StageView;
  if (manual) stageView = { ...manual, closeUp: false };
  else if (free && lastView.current) stageView = lastView.current;
  else stageView = { az: oriented(teach, southpaw), el: teach.el, zoom: teach.zoom, focus: teach.focus, closeUp: false };
  if (closeUp && teach.closeUp && !free) stageView = { ...stageView, zoom: teach.closeUp.zoom, focus: teach.closeUp.focus, closeUp: true };
  if (st.tech && studyRot && !free) stageView = { ...stageView, az: stageView.az + studyRot };
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
  const cycleCam = () => {
    const i = CAMERA_MODES.findIndex((c) => c.id === camMode);
    setCamMode(CAMERA_MODES[(i + 1) % CAMERA_MODES.length].id);
  };
  const camLabel = CAMERA_MODES.find((c) => c.id === camMode)?.label ?? 'Auto';

  const fullscreen = () => {
    const el = root.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.().catch(() => undefined);
  };

  const running = view.phase !== 'pret' && view.phase !== 'termine';
  const phaseLabel =
    view.phase === 'decompte' ? 'Prépare-toi' : view.phase === 'repos' ? 'Repos' : view.phase === 'travail' ? (item.work ? `Round ${view.round}/${item.rounds}` : MODE_LABEL[plan.mode]) : view.phase === 'termine' ? 'Terminé' : 'Prêt';

  let moveName = cur?.name ?? (view.phase === 'travail' ? 'Garde' : phaseLabel);
  let cue = cur?.cues[0] ?? '';
  if (view.phase === 'pret') {
    moveName = 'En garde';
    cue = 'Appuie sur Démarrer quand tu es prêt.';
  } else if (view.phase === 'repos') {
    moveName = 'Repos';
    cue = view.banner ?? 'Respire, relâche les épaules, reste en mouvement léger.';
  } else if (view.phase === 'termine') {
    moveName = 'Séance terminée';
    cue = `${view.reps} répétitions, ${formatDuration(view.sessionSec)} de travail actif.`;
  } else if (view.phase === 'travail' && !cur) {
    cue = 'Retour en garde, respire.';
  }

  // essential points always on screen: every key point of a single technique, or one line per
  // move of a combination (the current move highlighted), condensed for the training screen
  const uniq = [...new Set(seq)];
  const focusId = st.tech ?? curId ?? (view.phase === 'travail' ? null : seq[0]);
  const points: { id: string; label?: string; text: string }[] =
    uniq.length === 1
      ? (TECHNIQUE_BY_ID.get(uniq[0])?.keyPoints ?? []).map((k, i) => ({ id: `${uniq[0]}#${i}`, text: k }))
      : uniq.map((id) => {
          const t = TECHNIQUE_BY_ID.get(id);
          return { id, label: t?.name ?? id, text: t?.keyPoints[0] ?? t?.cues[0] ?? '' };
        });
  const stepSpeed = (d: number) => setSpeed(Math.round(Math.min(1.5, Math.max(0.25, view.speed + d)) * 100) / 100);

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
    <div className={`training ${immersive ? 'immersive' : ''} ${overflow ? 'overflow' : ''}`} ref={root} data-testid="training">
      <header className="tr-top">
        <button className="btn icon ghost" onClick={() => nav(-1)} aria-label="Quitter l’entraînement">
          <IconBack />
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
          <IconAr width={18} height={18} />
          <span>{arView.state === 'off' ? 'AR désactivée' : arView.state === 'starting' ? 'AR…' : 'AR active'}</span>
        </button>
      </header>

      <div className="tr-stage">
        <CoachStage
          coach={coach}
          discipline={item.discipline}
          southpaw={southpaw}
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
          <button className="btn cam-btn" onClick={cycleCam} aria-label={`Angle de caméra : ${camLabel}. Toucher pour changer`} data-testid="cam-mode">
            <IconCamera />
            <span>{camLabel}</span>
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
            aria-label="Mode immersif : masquer les commandes secondaires"
            aria-pressed={immersive}
          >
            <IconExpand />
          </button>
          <div className="speed-step" role="group" aria-label="Vitesse d’exécution">
            <button className="btn icon" onClick={() => stepSpeed(0.05)} aria-label="Accélérer">
              +
            </button>
            <b aria-live="polite" data-testid="speed">×{view.speed.toFixed(2)}</b>
            <button className="btn icon" onClick={() => stepSpeed(-0.05)} aria-label="Ralentir">
              −
            </button>
          </div>
        </div>
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
        {!st.tech && <p className="tr-cue">{cue}</p>}
        <ul className={`tr-points ${points.length > 2 ? 'cols' : ''}`} aria-label="Points clés">
          {points.map((pt) => (
            <li key={pt.id} className={pt.label && pt.id === focusId ? 'now' : ''}>
              {pt.label && <b>{pt.label} : </b>}
              {pt.text}
            </li>
          ))}
        </ul>
        {!st.tech && (
          <div className="tr-meta">
            <span>
              Séance <b data-testid="session-time">{clock(view.sessionSec, false)}</b>
            </span>
            <span>
              Cumul <b data-testid="exercise-time">{formatDuration(view.exerciseSec)}</b>
            </span>
            <span>
              <b>{view.reps}</b> rép.
            </span>
            {item.work ? (
              <span>
                Round <b>{view.round}</b>/{item.rounds}
              </span>
            ) : null}
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
          />
        ) : (
          <>
            <div className="tr-secondary">
              <button className="btn sm" data-testid="decompose" aria-label="Décomposer le mouvement" onClick={() => openStudy(curId ?? seq[0])}>
                <IconLayers width={18} />
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
                <IconInfo width={18} />
                <span className="sec-label">Comment faire ?</span>
              </button>
              {coachAiOn && (
                <button className={`btn sm ${asking ? 'on' : ''}`} data-testid="ask-coach" aria-label="Demander au coach" aria-pressed={asking} onClick={() => (asking ? setAsking(false) : askCoach())}>
                  <IconChat width={18} />
                  <span className="sec-label">Demander au coach</span>
                </button>
              )}
            </div>
            <div className="controls">
              <button className="btn icon" onClick={() => goto(view.itemIndex - 1)} disabled={view.itemIndex === 0} aria-label="Exercice précédent">
                <IconPrev />
              </button>
              <button className="btn icon" onClick={restart} aria-label="Recommencer">
                <IconRestart />
              </button>
              {!running ? (
                <button className="btn primary main" onClick={start} data-testid="start">
                  <IconPlay /> {view.phase === 'termine' ? 'Recommencer' : 'Démarrer'}
                </button>
              ) : view.paused ? (
                <button className="btn primary main" onClick={resume} data-testid="resume">
                  <IconPlay /> Reprendre
                </button>
              ) : (
                <button className="btn dark main" onClick={pause} data-testid="pause">
                  <IconPause /> Pause
                </button>
              )}
              <button className="btn icon" onClick={() => goto(view.itemIndex + 1)} disabled={view.itemIndex >= plan.items.length - 1} aria-label="Exercice suivant">
                <IconNext />
              </button>
              <button className="btn icon" onClick={() => setSheet(true)} aria-label="Options">
                <IconSliders />
              </button>
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
              <ArControls bridge={ar} compact={arCompact} onToggleCompact={() => setArCompact((c) => !c)} recommendedAz={oriented(teach, southpaw)} />
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
                    <IconPrev />
                  </button>
                )}
                {!running ? (
                  <button className="btn primary" onClick={start}>
                    <IconPlay /> Démarrer
                  </button>
                ) : view.paused ? (
                  <button className="btn primary" onClick={resume}>
                    <IconPlay /> Reprendre
                  </button>
                ) : (
                  <button className="btn dark" onClick={pause}>
                    <IconPause /> Stop
                  </button>
                )}
                {!arCompact && (
                  <button className="btn icon" onClick={() => goto(view.itemIndex + 1)} disabled={view.itemIndex >= plan.items.length - 1} aria-label="Exercice suivant">
                    <IconNext />
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
                <button className={`chip ${coach === 'homme' ? 'on' : ''}`} onClick={() => setCoach('homme')}>
                  Coach homme
                </button>
                <button className={`chip ${coach === 'femme' ? 'on' : ''}`} onClick={() => setCoach('femme')}>
                  Coach femme
                </button>
              </div>
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
                  <button key={c.id} className={`chip ${camMode === c.id ? 'on' : ''}`} onClick={() => setCamMode(c.id)}>
                    {c.label}
                  </button>
                ))}
              </div>
              {camMode === 'auto' && <p className="cam-why">{teach.why}</p>}
              <p className="small muted">Glisse le doigt sur le coach pour passer en caméra libre à 360°.</p>
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
