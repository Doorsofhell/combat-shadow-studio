import { championFor, championLook, championStance } from '../domain/coaches/catalog';
import { Suspense, useCallback, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { CoachModel } from '../three/CoachModel';
import { StudioStage } from '../three/StudioStage';
import { StudioEnvironment } from '../three/StudioEnvironment';
import type { CoachRig } from '../engine/rig';
import { getLibrary, getMotion } from '../engine/library';
import { MotionSampler, duration } from '../engine/motion';
import type { StanceStyle } from '../engine/author';
import type { CoachId, DisciplineId } from '../domain/types';
import { TECHNIQUE_BY_ID } from '../domain/techniques';
import { stageAzimuth, techniqueView } from '../domain/camera';
import { analyseMotion } from '../engine/study';
import { sequenceEnvelope, type Envelope } from '../engine/envelope';
import { STYLE_OF } from '../three/CoachStage';
import { defaultLook, recommendedGear, type FighterLook } from '../editor/look';
import type { StageView } from '../three/StudioStage';
import { COACH_LOOKS } from '../domain/coaches/looks';
import { coachProfile } from '../domain/coaches/motion';

/** Developer view: freezes a motion at a given time, used for visual checks and screenshots. */
export function Lab() {
  const q = useMemo(() => new URLSearchParams(location.hash.split('?')[1] ?? ''), []);
  // champion=<coach id>: a champion-inspired coach, its own model and its fixed look
  const champion = q.get('champion') && COACH_LOOKS[q.get('champion')!] ? q.get('champion')! : null;
  const coach = (champion ? COACH_LOOKS[champion].sex : (q.get('coach') ?? 'homme')) as CoachId;
  // tech=<technique id>&d=<discipline>: the technique at its key moment, from its teaching angle
  const tech = q.get('tech') ? TECHNIQUE_BY_ID.get(q.get('tech')!) : undefined;
  const disc = (q.get('d') ?? tech?.disciplines[0] ?? 'boxe') as DisciplineId;
  const style = tech ? STYLE_OF[disc] : ((q.get('style') ?? 'boxing') as StanceStyle);
  const motionId = tech?.motion ?? q.get('motion') ?? 'garde';
  const tRef = useRef(Number(q.get('t') ?? '0'));
  const envelope = useRef<Envelope | null>(null);
  const origin = useRef({ x: 0, z: 0, yaw: 0 });
  const view = useMemo<StageView | undefined>(() => {
    if (!tech) {
      if (!q.get('az')) return undefined;
      // span=<part of the body height>&fy=<metres>: close-up of a body part (face 0.16, bust 0.45…)
      const span = q.get('span') ? Number(q.get('span')) : undefined;
      return { az: Number(q.get('az')), el: Number(q.get('el') ?? '12'), zoom: 1, focus: q.get('fy') ? Number(q.get('fy')) / 1.85 : 0.5, closeUp: !!span, span };
    }
    const v = techniqueView(tech.id);
    // thumbnails (thumb=1): punches and elbows read better from the lead side than nearly face-on
    if (q.get('thumb') && ['poing', 'coude', 'feinte'].includes(tech.category)) return { az: 65, el: 8, zoom: 1, focus: v.focus };
    return { az: q.get('az') ? Number(q.get('az')) : stageAzimuth(v, disc, false), el: v.el, zoom: Math.min(1, v.zoom), focus: v.focus };
  }, [tech, disc]);
  const cam = Number(q.get('cam') ?? '35');
  const southpaw = q.get('garde') === 'gaucher';
  // art=1: official discipline artwork (discipline gear, collection palette: anthracite, red, gold)
  const look = useMemo<FighterLook | null>(() => {
    // with d=<discipline> or a technique: the coach dressed for that discipline, as in the app
    if (champion) return q.get('d') || tech ? championLook(championFor(coach), disc) : COACH_LOOKS[champion];
    if (!q.get('art')) {
      // top=<garment>&bottom=<garment>: clothing checks on the default look
      if (!q.get('top') && !q.get('bottom')) return null;
      const l = defaultLook(coach);
      return { ...l, outfit: { ...l.outfit, top: (q.get('top') ?? l.outfit.top) as never, bottom: (q.get('bottom') ?? l.outfit.bottom) as never } };
    }
    const l = defaultLook(coach);
    const g = recommendedGear(disc);
    const red = '#a3121f';
    const gold = '#b8932f';
    const ink = '#1b1d22';
    return {
      ...l,
      outfit: { ...l.outfit, bottom: g.bottom, shoes: g.shoes, bottomPaint: { color: disc === 'muaythai' ? red : ink, color2: gold, pattern: 'bande' } },
      gear: {
        ...l.gear,
        hands: g.hands,
        shins: g.shins,
        feet: g.feet,
        handsPaint: { color: red, color2: gold, pattern: 'uni' },
        shinsPaint: { color: '#f2efe6', color2: red, pattern: 'uni' },
        feetPaint: { color: '#f2efe6', color2: red, pattern: 'uni' },
      },
    };
  }, [q, coach, disc, champion]);
  // look=realiste|manga|encre, render=precedent: the v0.22 render (fallback), for before/after captures
  const labStyle = q.get('look') === 'realiste' ? 'realiste' : q.get('look') === 'manga' ? 'manga' : 'encre';
  const render = q.get('render') === 'precedent' ? 'precedent' : 'premium';
  const sampler = useRef<MotionSampler | null>(null);
  const onRig = useCallback(
    (rig: CoachRig) => {
      const lib = getLibrary(rig, style, champion && (q.get('d') || tech) ? championStance(championFor(coach), disc) : coachProfile(champion));
      const m = getMotion(lib, motionId, southpaw) ?? lib.get('garde')!;
      sampler.current = new MotionSampler(rig, m);
      if (tech) {
        // at=<fraction>: an instant before the key moment (0.5 = half way to it), for sequences of captures
        tRef.current = analyseMotion(rig, m).peak * Number(q.get('at') ?? '1');
        envelope.current = sequenceEnvelope(rig, lib, [m.id], southpaw);
      }
      // strips of a whole motion in one page load (scripts/dev/shot-strip.mjs)
      Object.assign(window, { __labDur: duration(m), __labPeak: m.impacts[0] ?? duration(m) / 2, __labT: (t: number) => (tRef.current = t) });
      (window as unknown as { __labReady: boolean }).__labReady = true;
    },
    [style, motionId, southpaw, tech, q],
  );
  const onFrame = useCallback(
    (rig: CoachRig) => {
      if (!sampler.current) return;
      const pose = sampler.current.sample(tRef.current);
      if (q.get('fist')) pose.handL.fist = pose.handR.fist = Number(q.get('fist'));
      if (q.get('pron')) pose.handL.pron = pose.handR.pron = Number(q.get('pron'));
      if (q.get('rest')) {
        rig.reset();
        return;
      }
      rig.apply(pose);
    },
    [q],
  );
  return (
    <div style={{ position: 'fixed', inset: 0, background: q.get('alpha') ? 'transparent' : '#fff' }}>
      <Canvas shadows dpr={[1, 2]} gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}>
        <Suspense fallback={null}>
          <StudioStage
            view={view}
            envelope={tech ? envelope : undefined}
            origin={tech ? origin : undefined}
            cameraAngle={cam}
            quality="haute"
            zoom={Number(q.get('zoom') ?? '1')}
            focusY={q.get('fy') ? Number(q.get('fy')) : undefined}
          >
            <CoachModel coach={coach} style={labStyle} render={render} quality="haute" look={look} model={champion ? `./coaches/${champion}/model` : undefined} onRig={onRig} onFrame={onFrame} />
            {labStyle === 'realiste' && render === 'premium' && <StudioEnvironment />}
          </StudioStage>
        </Suspense>
      </Canvas>
    </div>
  );
}
