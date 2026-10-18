import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { Group, Vector3 } from 'three';
import { CoachModel } from './CoachModel';
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
import { useResolvedTheme } from '../ui/theme/useTheme';
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
  /** white training studio (default) or the dark premium stage of the menus */
  backdrop?: 'studio' | 'dark';
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
  const fighter = useActiveFighter();
  const look = props.look ?? fighter?.look ?? null;
  const shownCoach = look?.sex ?? coach;
  const ghostGear = useSettings((s) => s.settings.seeThroughGear) && studyActive;
  const lookRef = useRef<FighterLook | null | undefined>(null);
  lookRef.current = look;
  const [degraded, setDegraded] = useState(false);
  const style = useSettings((s) => s.settings.coachStyle);
  const q: 'haute' | 'basse' = quality === 'auto' ? (degraded ? 'basse' : 'haute') : quality;
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
      const lib = getLibrary(rig, STYLE_OF[discipline]);
      rigRef.current = { rig, lib };
      setRigState(rig);
      updateEnvelope();
      const p = new ComboPlayer(rig, lib, southpawRef.current, proxy);
      player.current = p;
      onPlayer(p);
      onRigReadyRef.current?.(rig, lib);
    },
    [discipline, proxy, onPlayer, updateEnvelope],
  );

  const onFrame = useCallback(
    (rig: CoachRig, dt: number) => {
      const st = study?.current;
      if (studyActiveRef.current && st?.motion) {
        rig.apply(st.update(dt));
        follow.current.set(0, 0, 0);
        origin.current = { x: 0, z: 0, yaw: 0 };
        return;
      }
      const p = player.current;
      if (!p) return;
      rig.apply(p.update(dt));
      follow.current.set(p.origin.x, 0, p.origin.z);
      origin.current = p.origin;
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

  return (
    <Canvas
      shadows={false}
      data-coach={shownCoach}
      dpr={q === 'haute' ? [1, 2] : 1}
      gl={{ antialias: q === 'haute', alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 1.1, 5], fov: 30 }}
      style={{ background: arActive ? 'transparent' : backdrop === 'dark' ? 'var(--scene)' : '#fff', touchAction: 'none' }}
    >
      {quality === 'auto' && <PerformanceMonitor onDecline={() => setDegraded(true)} flipflops={1} />}
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
            dark={backdrop === 'dark' && menuTheme === 'dark'}
          />
        )}
        {ar && <ArScene bridge={ar} active={arActive} coachGroup={coachGroup} follow={follow} />}
        {/* the coach stays mounted when switching to AR: same model, same player, same animation */}
        <group ref={coachGroup}>
          <CoachModel key={`${shownCoach}-${discipline}-${style}`} coach={shownCoach} style={style} quality={q} look={look} ghostGear={ghostGear} onRig={onRig} onFrame={onFrame} />
          {studyActive && rigState && study && <StudyCues rig={rigState} study={study} />}
          {!studyActive && !arActive && rigState && <GroundMarks rig={rigState} player={player} southpaw={southpaw} />}
        </group>
      </Suspense>
    </Canvas>
  );
}
