import { Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { StageResolution, budgetFor, stageDpr } from './resolution';
import { Group, Vector3 } from 'three';
import { CoachModel } from './CoachModel';
import { StudioEnvironment } from './StudioEnvironment';
import { useSettings } from '../store/settings';
import { StageView, StudioStage } from './StudioStage';
import { ArScene } from './ArScene';
import { StudyCues } from './StudyCues';
import { GroundMarks } from './GroundMarks';
import type { ArBridge } from '../ar/ArBridge';
import type { CoachRig } from '../engine/rig';
import { ComboPlayer, PlayerEvents } from '../engine/player';
import { MotionLibrary, getLibrary } from '../engine/library';
import { Envelope, sequenceEnvelope } from '../engine/envelope';
import type { StudyPlayer } from '../engine/study';
import type { StanceStyle } from '../engine/author';
import type { CoachId, DisciplineId } from '../domain/types';
import { TECHNIQUE_BY_ID } from '../domain/techniques';
import { useActiveFighter } from '../store/fighters';
import { championFor, championLook, championModel, championStance } from '../domain/coaches/catalog';
import { useResolvedTheme } from '../ui/theme/useTheme';
import { stabilityLevel, stepDown, stepUp, type StabilityLevel } from './safe3d';
import { log3d } from './diag3d';
import { StageGuardContext } from '../ui/components/StageGuard';
import type { FighterLook } from '../editor/look';

export const STYLE_OF: Record<DisciplineId, StanceStyle> = {
  boxe: 'boxing',
  kickboxing: 'kickboxing',
  mma: 'mma',
  muaythai: 'muaythai',
  bjj: 'bjj',
  judo: 'judo',
};

/** envelopes are computed in the model's own units; the fighter's height scales the whole model */
/** the motion envelope is computed on the skeleton: scale it to the fighter's height and leave room
 * for what sticks out of the bones (tall hair, helmet, a bulky build) */
function scaleBox(env: Envelope, look: FighterLook | null | undefined): Envelope {
  const b = env.box;
  const pts = env.pts;
  const k = look?.body.height ?? 1;
  b.min.multiplyScalar(k);
  b.max.multiplyScalar(k);
  for (let i = 0; i < pts.length; i++) pts[i] *= k;
  if (!look) return env;
  const hair = look.hair.style === 'crete' ? 0.03 + 0.06 * look.hair.length : look.hair.style === 'afro' ? 0.03 + 0.05 * look.hair.length : 0;
  const top = Math.max(hair, look.gear.head !== 'aucun' ? 0.03 : 0);
  const bulk = 0.04 * Math.max(0, look.body.muscle - 1) + 0.04 * Math.max(0, look.body.mass);
  b.max.y += top * k;
  b.min.x -= bulk;
  b.max.x += bulk;
  b.min.z -= bulk;
  b.max.z += bulk;
  // the head spheres (top of the envelope) grow with the hair or helmet, every limb with the bulk
  const headY = b.max.y - top * k - 0.3 * k;
  for (let i = 0; i < pts.length; i += 4) {
    pts[i + 3] += bulk;
    if (pts[i + 1] > headY) pts[i + 3] += top * k;
  }
  return env;
}

export interface CoachStageProps {
  coach: CoachId;
  discipline: DisciplineId;
  southpaw: boolean;
  /** legacy fixed angle (degrees) when no teaching view is given */
  cameraAngle?: number;
  /** teaching camera: angle, elevation and zoom, already oriented for the guard */
  view?: StageView;
  /** free 360° camera owned by the user */
  free?: boolean;
  onUserOrbit?: () => void;
  /** techniques the camera must keep entirely in frame (the current sequence) */
  frameIds?: string[];
  quality: 'auto' | 'haute' | 'basse';
  /** latest event handlers (read through a ref so they can change without rebuilding the player) */
  events: PlayerEvents;
  /** called whenever a new player exists (first load, coach or discipline change) */
  onPlayer: (p: ComboPlayer) => void;
  /** the rig and motion library of the coach on screen (for the "Décomposer" mode) */
  onRigReady?: (rig: CoachRig, lib: MotionLibrary) => void;
  /** when set, this player drives the coach instead of the combination player */
  study?: { current: StudyPlayer | null };
  studyActive?: boolean;
  zoom?: number;
  /** augmented reality session holder; the AR layer replaces the studio while a session runs */
  ar?: ArBridge;
  arActive?: boolean;
  /**
   * white studio (default), the dark premium stage of the menus, or (0.27, Youssef 2026-10-20 21:48 « Suit le
   * thème ») the training studio: the canvas is see-through over the stage's own background, dark in the dark
   * theme and pearl grey in the light one, with the dark lighting in the dark theme
   */
  backdrop?: 'studio' | 'dark' | 'theme';
  /** look to show instead of the active fighter (fighter creator preview) */
  look?: FighterLook;
}

/**
 * The 3D coach on the white studio set, driven by a ComboPlayer (or the study player of the
 * "Décomposer" mode). The coach stays mounted when switching to AR or to the study mode, so the
 * same model and the same animation code are used everywhere.
 */
export function CoachStage(props: CoachStageProps) {
  const menuTheme = useResolvedTheme();
  const { coach, discipline, southpaw, cameraAngle, view, free, onUserOrbit, frameIds, quality, events, onPlayer, onRigReady, study, studyActive = false, zoom, ar, arActive = false, backdrop = 'studio' } = props;
  const stageDark = backdrop !== 'studio' && menuTheme === 'dark';
  const fighter = useActiveFighter();
  const render = useSettings((s) => s.settings.coachRender);
  // 0.24: the coach is Kadir or Amara, on their own model, dressed for the discipline; the fallback
  // render ("précédent") keeps the generic coach and the custom fighter
  const champion = render === 'premium' && !props.look ? championFor(coach) : null;
  const championId = champion?.coach;
  // one look object per coach and discipline: a new object on each render would re-dress the model
  const dressed = useMemo(() => (championId ? championLook(championFor(championId), discipline) : null), [championId, discipline]);
  const look = props.look ?? dressed ?? fighter?.look ?? null;
  const shownCoach = champion ? champion.coach : (look?.sex ?? coach);
  const championRef = useRef(champion);
  championRef.current = champion;
  const ghostGear = useSettings((s) => s.settings.seeThroughGear) && studyActive;
  const lookRef = useRef<FighterLook | null | undefined>(null);
  lookRef.current = look;
  // v0.29 (Youssef's phone, 2026-10-21: the coach vanished, then « Affichage 3D indisponible » at every launch).
  // Reproduced with scripts/dev/gpucrash.mjs: after graphics resets Chrome refuses 3D to the site for a while,
  // and the former recovery created a new canvas during that time, which threw. Now three.js restores the same
  // canvas by itself; if the context does not come back, the guard (StageGuard) waits until the browser allows
  // 3D again and creates a new stage. Each incident lowers the quality one step, a calm period raises it back.
  const guard = useContext(StageGuardContext);
  const [level, setLevel] = useState<StabilityLevel>(stabilityLevel);
  // the automatic quality may also go down for this visit when the device cannot keep up (PerformanceMonitor)
  const [slow, setSlow] = useState(false);
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.visibilityState === 'hidden');
  const animAt = useRef(0);
  const onCreated = useCallback(
    ({ gl }: { gl: { domElement: HTMLCanvasElement; getContext: () => WebGLRenderingContext | WebGL2RenderingContext } }) => {
      const canvas = gl.domElement;
      const ctx = gl.getContext();
      const dbg = ctx.getExtension('WEBGL_debug_renderer_info');
      const gpu = dbg ? `${ctx.getParameter(dbg.UNMASKED_VENDOR_WEBGL)} / ${ctx.getParameter(dbg.UNMASKED_RENDERER_WEBGL)}` : 'carte graphique non communiquée';
      log3d('gpu', `${gpu} · ${typeof WebGL2RenderingContext !== 'undefined' && ctx instanceof WebGL2RenderingContext ? 'WebGL 2' : 'WebGL 1'} · textures max ${ctx.getParameter(ctx.MAX_TEXTURE_SIZE)} · ${canvas.width}×${canvas.height} px`);
      let timer: ReturnType<typeof setTimeout> | undefined;
      canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault(); // lets the browser give the context back
        const l = stepDown();
        log3d('contexte-perdu', `qualité abaissée au niveau ${l}`);
        setLevel(l);
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => guard?.lost('pas de retour après 8 s'), 8000);
      });
      canvas.addEventListener('webglcontextrestored', () => {
        if (timer) clearTimeout(timer);
        timer = undefined;
        log3d('contexte-restaure', 'même écran, le coach repart');
      });
    },
    [guard],
  );
  // a quiet period raises the quality one step (checked every minute while the coach is shown)
  useEffect(() => {
    if (level === 0) return;
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const l = stepUp();
      if (l !== level) {
        log3d('qualite', `${CALM_MIN} min sans incident : niveau ${l}`);
        setLevel(l);
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [level]);
  // no drawing while the app is in the background (screen locked, other app): nothing to show, and phones
  // reclaim the graphics memory of hidden pages first
  useEffect(() => {
    const on = () => {
      const h = document.visibilityState === 'hidden';
      setHidden(h);
      log3d('arriere-plan', h ? 'application cachée : rendu en pause' : 'application visible : rendu repris');
    };
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  const style = useSettings((s) => s.settings.coachStyle);
  // after a graphics incident, stability comes first even when the high quality was chosen (for a while)
  const q: 'haute' | 'basse' = level > 0 || slow ? 'basse' : quality === 'auto' ? 'haute' : quality;
  useEffect(() => {
    log3d('demarrage', `coach ${shownCoach} · ${discipline} · rendu ${render}/${style} · qualité ${quality} → ${q}${level ? ` (niveau de stabilité ${level})` : ''}${slow ? ' (appareil lent)' : ''}`);
  }, [shownCoach, discipline, render, style, quality, q, level, slow]);
  const player = useRef<ComboPlayer | null>(null);
  const rigRef = useRef<{ rig: CoachRig; lib: MotionLibrary } | null>(null);
  const [rigState, setRigState] = useState<CoachRig | null>(null);
  const follow = useRef(new Vector3());
  const origin = useRef<{ x: number; z: number; yaw: number } | null>({ x: 0, z: 0, yaw: 0 });
  const envelope = useRef<Envelope | null>(null);
  const coachGroup = useRef<Group>(null);
  const eventsRef = useRef(events);
  eventsRef.current = events;
  const onRigReadyRef = useRef(onRigReady);
  onRigReadyRef.current = onRigReady;
  const studyActiveRef = useRef(studyActive);
  studyActiveRef.current = studyActive;
  const proxy = useMemo<PlayerEvents>(
    () => ({
      onStep: (...a) => eventsRef.current.onStep?.(...a),
      onImpact: (...a) => eventsRef.current.onImpact?.(...a),
      onRep: (...a) => eventsRef.current.onRep?.(...a),
      onRest: (...a) => eventsRef.current.onRest?.(...a),
    }),
    [],
  );
  const southpawRef = useRef(southpaw);
  if (southpawRef.current !== southpaw) {
    southpawRef.current = southpaw;
    player.current?.setSouthpaw(southpaw);
  }

  // back to the white studio: the coach returns to the centre at natural size
  useEffect(() => {
    const g = coachGroup.current;
    if (arActive || !g) return;
    g.position.set(0, 0, 0);
    g.rotation.set(0, 0, 0);
    g.scale.setScalar(1);
    g.visible = true;
  }, [arActive]);

  // the space the whole sequence occupies, from the real animation of this coach
  const frameKey = (frameIds ?? []).join(',');
  const frameRef = useRef(frameIds);
  frameRef.current = frameIds;
  const updateEnvelope = useCallback(() => {
    const r = rigRef.current;
    if (!r) return;
    const motions = (frameRef.current ?? []).map((id) => TECHNIQUE_BY_ID.get(id)?.motion ?? id);
    envelope.current = motions.length ? scaleBox(sequenceEnvelope(r.rig, r.lib, motions, southpawRef.current), lookRef.current) : null;
  }, []);
  useEffect(updateEnvelope, [updateEnvelope, frameKey, southpaw, look?.body.height, look?.body.legLength, look?.hair.style, look?.hair.length, look?.gear.head, look?.body.muscle, look?.body.mass]);

  const onRig = useCallback(
    (rig: CoachRig) => {
      const c = championRef.current;
      const lib = getLibrary(rig, STYLE_OF[discipline], c ? championStance(c, discipline) : undefined);
      rigRef.current = { rig, lib };
      log3d('modele', `${championRef.current?.id ?? 'coach généré'} prêt`);
      setRigState(rig);
      updateEnvelope();
      const p = new ComboPlayer(rig, lib, southpawRef.current, proxy);
      player.current = p;
      onPlayer(p);
      onRigReadyRef.current?.(rig, lib);
    },
    [discipline, proxy, onPlayer, updateEnvelope],
  );

  // an error in one frame of animation is written down and the next frame goes on (it used to stop the coach)
  const animErr = useRef(0);
  const onFrame = useCallback(
    (rig: CoachRig, dt: number) => {
      try {
        const st = study?.current;
        if (studyActiveRef.current && st?.motion) {
          rig.apply(st.update(dt));
          follow.current.set(0, 0, 0);
          origin.current = { x: 0, z: 0, yaw: 0 };
        } else {
          const p = player.current;
          if (!p) return;
          rig.apply(p.update(dt));
          follow.current.set(p.origin.x, 0, p.origin.z);
          origin.current = p.origin;
        }
        animAt.current = performance.now();
      } catch (e) {
        const now = performance.now();
        if (now - animErr.current > 60_000) log3d('animation', `erreur pendant l'animation : ${(e as Error)?.message ?? e}`);
        animErr.current = now;
      }
    },
    [study],
  );

  // in study mode the camera frames the studied technique only
  const studyEnvelope = useRef<Envelope | null>(null);
  useEffect(() => {
    const r = rigRef.current;
    const m = study?.current?.motion;
    studyEnvelope.current = studyActive && r && m ? scaleBox(sequenceEnvelope(r.rig, r.lib, [m.id], southpaw), lookRef.current) : null;
  });

  // v0.29: soft self-shadows in the realistic look, high quality only (cost on phones)
  // (not on touch screens in automatic quality: phones have the least graphics memory)
  // v0.31: internal resolution on a pixel budget (src/three/resolution.ts) instead of fixed ratios
  const budget = budgetFor(q, level);
  const [startDpr] = useState(() => stageDpr(typeof innerWidth === 'number' ? innerWidth : 400, typeof innerHeight === 'number' ? innerHeight * 0.6 : 400, typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, budget));
  const onResolution = useCallback((dpr: number, w: number, h: number) => log3d('qualite', `résolution ${dpr} px par point (${Math.round(w * dpr)}×${Math.round(h * dpr)}, écran ${typeof devicePixelRatio === 'number' ? devicePixelRatio : 1})`), []);
  const realShadows = style === 'realiste' && render === 'premium' && q === 'haute' && !arActive && !(quality === 'auto' && TOUCH);
  return (
    <Canvas
      onCreated={onCreated}
      shadows={realShadows ? 'soft' : false}
      data-coach={shownCoach}
      dpr={startDpr}
      frameloop={hidden ? 'never' : 'always'}
      // v0.31: antialiasing stays on in every quality (multisampling costs little on phone graphics chips, and its
      // absence gave the staircase edges of the light quality)
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 1.1, 5], fov: 30 }}
      style={{ background: arActive || backdrop === 'theme' ? 'transparent' : backdrop === 'dark' ? 'var(--scene)' : '#fff', touchAction: 'none' }}
    >
      {quality === 'auto' && (
        <PerformanceMonitor
          onDecline={() => {
            log3d('qualite', 'images par seconde trop basses : qualité légère pour cette visite');
            setSlow(true);
          }}
          flipflops={1}
        />
      )}
      <StageResolution budget={budget} onChange={onResolution} />
      <DiagProbe animAt={animAt} />
      <Suspense fallback={null}>
        {!arActive && (
          <StudioStage
            cameraAngle={cameraAngle}
            view={view}
            free={free}
            onUserOrbit={onUserOrbit}
            quality={q}
            follow={follow}
            origin={origin}
            envelope={studyActive ? studyEnvelope : envelope}
            orbit
            zoom={zoom}
            dark={stageDark}
            shadows={realShadows}
            realistic={style === 'realiste'}
          />
        )}
        {style === 'realiste' && render === 'premium' && q === 'haute' && <StudioEnvironment intensity={0.12} />}
        {ar && <ArScene bridge={ar} active={arActive} coachGroup={coachGroup} follow={follow} />}
        {/* the coach stays mounted when switching to AR: same model, same player, same animation */}
        <group ref={coachGroup}>
          <CoachModel
            key={`${champion?.id ?? shownCoach}-${discipline}-${render}${render === 'precedent' ? `-${style}` : ''}`}
            coach={shownCoach}
            style={style}
            render={render}
            quality={q}
            look={look}
            model={champion ? championModel(champion) : undefined}
            ghostGear={ghostGear}
            onRig={onRig}
            onFrame={onFrame}
          />
          {studyActive && rigState && study && <StudyCues rig={rigState} study={study} />}
          {!studyActive && !arActive && rigState && <GroundMarks rig={rigState} player={player} southpaw={southpaw} dark={stageDark} />}
        </group>
      </Suspense>
    </Canvas>
  );
}

const CALM_MIN = 10;

/** every minute in the journal: images per second and what the graphics memory holds; and a stopped animation */
function DiagProbe({ animAt }: { animAt: { current: number } }) {
  const gl = useThree((s) => s.gl);
  const st = useRef({ frames: 0, since: performance.now(), stalled: false });
  useFrame(() => {
    const s = st.current;
    s.frames++;
    const now = performance.now();
    if (animAt.current && now - animAt.current > 3000 && !s.stalled) {
      s.stalled = true;
      log3d('animation', `l'image est dessinée mais l'animation n'avance plus depuis ${Math.round((now - animAt.current) / 1000)} s`);
    } else if (now - animAt.current < 3000) s.stalled = false;
    if (now - s.since < 60_000) return;
    const i = gl.info;
    log3d('mesure', `${Math.round((s.frames * 1000) / (now - s.since))} img/s · ${i.memory.geometries} géométries · ${i.memory.textures} textures · ${i.programs?.length ?? '?'} shaders · ${i.render.calls} appels`);
    s.frames = 0;
    s.since = now;
  });
  return null;
}

const TOUCH = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
