import { championFor, championLook, championStance } from '../domain/coaches/catalog';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { CoachModel } from '../three/CoachModel';
import { outfitFor, type OutfitId, type OutfitStatus } from '../three/outfit';
import { StudioStage } from '../three/StudioStage';
import { StudioEnvironment } from '../three/StudioEnvironment';
import type { CoachRig } from '../engine';
import { getDuo, getIllustration, getLibrary, getMotion, type Place } from '../engine';
import { MotionSampler, duration } from '../engine';
import type { StanceStyle } from '../engine';
import type { CoachId, DisciplineId } from '../domain/types';
import { TECHNIQUE_BY_ID } from '../domain/techniques';
import { stageAzimuth, techniqueView } from '../domain/camera';
import { analyseMotion } from '../engine';
import { sequenceEnvelope, type Envelope } from '../engine';
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
  // v0.31 tenue=<outfit id> or tenue=0: the discipline outfit, as in the app by default
  const outfit = q.get('tenue') === '0' ? null : ((q.get('tenue') as OutfitId | null) ?? outfitFor(disc, true, 'gi'));
  // 1.3.3 duo=<scene id>&champion2=<coach id>[&tenue2=<outfit>]: a scene with two coaches (illustrations.ts)
  const duoId = q.get('duo');
  const champion2 = duoId && q.get('champion2') && COACH_LOOKS[q.get('champion2')!] ? q.get('champion2')! : null;
  const coach2 = (champion2 ? COACH_LOOKS[champion2].sex : 'femme') as CoachId;
  const outfit2 = q.get('tenue2') === '0' ? null : ((q.get('tenue2') as OutfitId | null) ?? outfitFor(disc, true, 'gi'));
  const look2 = useMemo(() => (champion2 ? championLook(championFor(coach2), disc) : null), [champion2, coach2, disc]);
  // with two coaches, the outfit state reported is the one of both (worn only when both are)
  const outfits = useRef<string[]>([]);
  const report = useCallback(
    (i: number, st: OutfitStatus) => {
      outfits.current[i] = st.state;
      const all = champion2 ? [outfits.current[0], outfits.current[1]] : [outfits.current[0]];
      const final = (x?: string) => x === 'portee' || x === 'aucune' || x === 'erreur';
      (window as unknown as { __labOutfit?: string }).__labOutfit = all.includes('erreur') ? 'erreur' : all.every(final) ? (all.includes('portee') ? 'portee' : 'aucune') : 'chargement';
    },
    [champion2],
  );
  const onOutfit = useCallback((st: OutfitStatus) => report(0, st), [report]);
  const onOutfit2 = useCallback((st: OutfitStatus) => report(1, st), [report]);
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
  // mood=1: lights of the studio visuals (scripts/visuels), with alpha=1 for a transparent picture
  // look=realiste|manga|encre, render=precedent: the v0.22 render (fallback), for before/after captures
  const labStyle = q.get('look') === 'realiste' ? 'realiste' : q.get('look') === 'manga' ? 'manga' : 'encre';
  const render = q.get('render') === 'precedent' ? 'precedent' : 'premium';
  const sampler = useRef<MotionSampler | null>(null);
  const sampler2 = useRef<MotionSampler | null>(null);
  const rigRef = useRef<CoachRig | null>(null);
  const rig2Ref = useRef<CoachRig | null>(null);
  const [places, setPlaces] = useState<[Place, Place] | null>(null);
  const startDuo = useCallback(() => {
    const ra = rigRef.current;
    const rb = rig2Ref.current;
    if (!ra || !rb || !duoId) return;
    const d = getDuo(ra, rb, style, duoId);
    if (!d) return;
    sampler.current = new MotionSampler(ra, d.a);
    sampler2.current = new MotionSampler(rb, d.b);
    setPlaces([d.placeA, d.placeB]);
    Object.assign(window, { __labDur: duration(d.a), __labPeak: d.a.impacts[0] ?? duration(d.a) / 2, __labT: (t: number) => (tRef.current = t) });
    (window as unknown as { __labReady: boolean }).__labReady = true;
  }, [duoId, style]);
  const onRig2 = useCallback(
    (rig: CoachRig) => {
      rig2Ref.current = rig;
      startDuo();
    },
    [startDuo],
  );
  const onFrame2 = useCallback((rig: CoachRig) => {
    if (sampler2.current) rig.apply(sampler2.current.sample(tRef.current));
  }, []);
  const onRig = useCallback(
    (rig: CoachRig) => {
      rigRef.current = rig;
      if (duoId) {
        startDuo();
        return;
      }
      const profile = champion && (q.get('d') || tech) ? championStance(championFor(coach), disc) : coachProfile(champion);
      const lib = getLibrary(rig, style, profile);
      // illu=<id>: a pose of the encyclopedia illustrations (engine/library/illustrations.ts), not a technique
      const illu = q.get('illu') ? getIllustration(rig, style, q.get('illu')!, profile) : undefined;
      const m = illu ?? getMotion(lib, motionId, southpaw) ?? lib.get('garde')!;
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
    [style, motionId, southpaw, tech, q, duoId, startDuo],
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
            mood={!!q.get('mood')}
          >
            <group position={places ? [places[0].x, 0, places[0].z] : undefined} rotation={places ? [0, places[0].yaw, 0] : undefined}>
              <CoachModel coach={coach} style={labStyle} render={render} quality="haute" look={look} model={champion ? `./coaches/${champion}/model` : undefined} onRig={onRig} onFrame={onFrame} outfit={outfit} onOutfit={onOutfit} />
            </group>
            {champion2 && (
              <group position={places ? [places[1].x, 0, places[1].z] : undefined} rotation={places ? [0, places[1].yaw, 0] : undefined} visible={!!places}>
                <CoachModel coach={coach2} style={labStyle} render={render} quality="haute" look={look2} model={`./coaches/${champion2}/model`} onRig={onRig2} onFrame={onFrame2} outfit={outfit2} onOutfit={onOutfit2} />
              </group>
            )}
            <LabProbe rig={rigRef} />
            {labStyle === 'realiste' && render === 'premium' && <StudioEnvironment intensity={q.get('mood') ? 0.06 : 0.35} />}
          </StudioStage>
        </Suspense>
      </Canvas>
    </div>
  );
}

/** 1.3.2 window.__labJoints(names): where bones of the coach fall on the canvas (CSS pixels), for the marks drawn on
 * the illustrations (scripts/visuels: zones to protect, joints, muscles) */
function LabProbe({ rig }: { rig: MutableRefObject<CoachRig | null> }) {
  const { camera, size } = useThree();
  useEffect(() => {
    (window as unknown as { __labJoints?: unknown }).__labJoints = (names: string[]) =>
      Object.fromEntries(
        names.map((n) => {
          const p = rig.current?.sceneOf(n);
          if (!p) return [n, null];
          p.project(camera);
          return [n, [((p.x + 1) / 2) * size.width, ((1 - p.y) / 2) * size.height]];
        }),
      );
  }, [camera, size, rig]);
  return null;
}
