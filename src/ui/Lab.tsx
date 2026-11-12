import { championById, championFor, championLook, championStance } from '../domain/coaches/catalog';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Raycaster, Vector2, Vector3, type Material, type Mesh, type SkinnedMesh } from 'three';
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
import type { FighterLook } from '../editor/look';
import type { StageView } from '../three/StudioStage';
import { COACH_LOOKS } from '../domain/coaches/looks';
import { coachProfile } from '../domain/coaches/motion';

/** Developer view: freezes a motion at a given time, used for visual checks and screenshots. */
export function Lab() {
  const q = useMemo(() => new URLSearchParams(location.hash.split('?')[1] ?? ''), []);
  // champion=<coach id>: a champion-inspired coach, its own model and its fixed look
  // 1.37: always a champion coach (the generated coach of coach=homme|femme is removed): coach= picks Kadir or Amara
  const asked = q.get('champion') && COACH_LOOKS[q.get('champion')!] ? q.get('champion')! : null;
  const champion = asked ?? championFor((q.get('coach') ?? 'homme') as CoachId).id;
  const coach = COACH_LOOKS[champion].sex as CoachId;
  // tech=<technique id>&d=<discipline>: the technique at its key moment, from its teaching angle
  const tech = q.get('tech') ? TECHNIQUE_BY_ID.get(q.get('tech')!) : undefined;
  const disc = (q.get('d') ?? tech?.disciplines[0] ?? 'boxe') as DisciplineId;
  const style = tech ? STYLE_OF[disc] : ((q.get('style') ?? 'boxing') as StanceStyle);
  const motionId = tech?.motion ?? q.get('motion') ?? 'garde';
  const tRef = useRef(Number(q.get('t') ?? '0'));
  // 1.9 the face of a fixed image: still (no blink, eyes ahead), or an imposed expression: effort=0..1, blink=0..1;
  // face=live animates it as in the app; 1.16 expr=JawOpen:1,MouthSmileLeft:0.5 imposes expressions (face.ts)
  useMemo(() => {
    const num = (k: string) => (q.get(k) !== null ? Number(q.get(k)) : undefined);
    const expr = q.get('expr') ? Object.fromEntries(q.get('expr')!.split(',').map((kv) => [kv.split(':')[0], Number(kv.split(':')[1] ?? 1)])) : undefined;
    // 1.34 etat=<state>: the face of a behaviour state (neutre, concentration, preparation, effort, frappe, fatigue,
    // recuperation, encouragement), src/three/human/behavior.ts
    const state = q.get('etat') ?? undefined;
    (globalThis as { __cssFace?: object }).__cssFace = q.get('face') === 'live' ? { state } : { still: true, effort: num('effort'), blink: num('blink'), expr, state };
  }, [q]);
  useMemo(() => {
    // 1.33 cou=ancien: the neck of 1.32 and before (src/engine/rig.ts), for before/after captures
    (globalThis as { __cssOldNeck?: boolean }).__cssOldNeck = q.get('cou') === 'ancien';
  }, [q]);
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
  // 1.4.1 duo=<scene id>&champion2=<coach id>[&tenue2=<outfit>]: a scene with two coaches (illustrations.ts)
  const duoId = q.get('duo');
  const champion2 = duoId && q.get('champion2') && COACH_LOOKS[q.get('champion2')!] ? q.get('champion2')! : null;
  const coach2 = (champion2 ? COACH_LOOKS[champion2].sex : 'femme') as CoachId;
  const outfit2 = q.get('tenue2') === '0' ? null : ((q.get('tenue2') as OutfitId | null) ?? outfitFor(disc, true, 'gi'));
  const look2 = useMemo(() => (champion2 ? championLook(championById(champion2) ?? championFor(coach2), disc) : null), [champion2, coach2, disc]);
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
  // with d=<discipline> or a technique: the coach dressed for that discipline, as in the app (1.37: the art=, top= and
  // bottom= looks of the generated coach are removed with it)
  const look = useMemo<FighterLook>(
    () => (q.get('d') || tech ? championLook(championById(champion) ?? championFor(coach), disc) : COACH_LOOKS[champion]),
    [q, tech, coach, disc, champion],
  );
  // mood=1: lights of the studio visuals (scripts/visuels), with alpha=1 for a transparent picture
  // 1.10 light=app|vive|sombre: the lights of the training stage in high quality (CoachStage: realistic studio with
  // soft shadows and the room reflections at 0.12; « Lumière vive » at 0.7; the dark stage), for before/after
  // captures under the real lighting; without it the Lab keeps its own studio light (1.37: the even light of the drawn
  // looks is removed)
  const light = (['app', 'vive', 'sombre'] as const).find((l) => l === q.get('light')) ?? null;
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
      const profile = champion && (q.get('d') || tech) ? championStance(championById(champion) ?? championFor(coach), disc) : coachProfile(champion);
      const lib = getLibrary(rig, style, profile);
      // illu=<id>: a pose of the encyclopedia illustrations (engine/library/illustrations.ts), not a technique
      const illu = q.get('illu') ? getIllustration(rig, style, q.get('illu')!, profile) : undefined;
      const m = illu ?? getMotion(lib, motionId, southpaw) ?? lib.get('garde')!;
      sampler.current = new MotionSampler(rig, m);
      // 1.10 frame=1: a pose without technique (garde, neutre) framed on its own space like a technique
      if (!tech && q.get('frame')) envelope.current = sequenceEnvelope(rig, lib, [m.id], southpaw);
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
    <div style={{ position: 'fixed', inset: 0, background: q.get('alpha') ? 'transparent' : light === 'vive' ? '#1d2733' : light === 'sombre' ? '#15171c' : '#fff' }}>
      <Canvas shadows={light ? 'soft' : true} dpr={[1, 2]} gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}>
        <Suspense fallback={null}>
          <StudioStage
            view={view}
            envelope={tech || q.get('frame') ? envelope : undefined}
            origin={tech || q.get('frame') ? origin : undefined}
            cameraAngle={cam}
            quality="haute"
            zoom={Number(q.get('zoom') ?? '1')}
            focusY={q.get('fy') ? Number(q.get('fy')) : undefined}
            mood={!!q.get('mood')}
            vive={light === 'vive'}
            dark={light === 'sombre' || light === 'vive'}
            shadows={!!light}
          >
            <group position={places ? [places[0].x, 0, places[0].z] : undefined} rotation={places ? [0, places[0].yaw, 0] : undefined}>
              <CoachModel coach={coach} quality="haute" look={look} model={`./coaches/${champion}/model`} onRig={onRig} onFrame={onFrame} outfit={outfit} onOutfit={onOutfit} />
            </group>
            {champion2 && (
              <group position={places ? [places[1].x, 0, places[1].z] : undefined} rotation={places ? [0, places[1].yaw, 0] : undefined} visible={!!places}>
                <CoachModel coach={coach2} quality="haute" look={look2} model={`./coaches/${champion2}/model`} onRig={onRig2} onFrame={onFrame2} outfit={outfit2} onOutfit={onOutfit2} />
              </group>
            )}
            <LabProbe rig={rigRef} />
            <StudioEnvironment intensity={q.get('mood') ? 0.06 : light === 'vive' ? 0.7 : light ? 0.12 : 0.35} />
          </StudioStage>
        </Suspense>
      </Canvas>
    </div>
  );
}

/** 1.3.2 window.__labJoints(names): where bones of the coach fall on the canvas (CSS pixels), for the marks drawn on
 * the illustrations (scripts/visuels: zones to protect, joints, muscles) */
function LabProbe({ rig }: { rig: MutableRefObject<CoachRig | null> }) {
  const { camera, size, scene } = useThree();
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
    // 1.14 window.__labPick(x, y): what is drawn at a canvas point (mesh, material, texture coordinates, height), to
    // find which part of a model a defect seen on a capture belongs to
    (window as unknown as { __labPick?: unknown }).__labPick = (x: number, y: number) => {
      const r = new Raycaster();
      r.setFromCamera(new Vector2((x / size.width) * 2 - 1, 1 - (y / size.height) * 2), camera);
      return r.intersectObject(scene, true).slice(0, 4).map((h) => ({
        mesh: h.object.name,
        material: ((h.object as Mesh).material as Material | undefined)?.name,
        uv: h.uv ? [+h.uv.x.toFixed(4), +h.uv.y.toFixed(4)] : null,
        point: h.point.toArray().map((v) => +v.toFixed(3)),
        face: h.faceIndex ?? null,
      }));
    };
    // 1.37.7 window.__labStretch(ratio, min): the garment triangles the current pose stretches (posed longest edge
    // over rest longest edge > ratio and > min metres), with their rest points, to find a strand seen on a capture
    (window as unknown as { __labStretch?: unknown }).__labStretch = (ratio = 3, min = 0.04) => {
      const out: object[] = [];
      scene.updateMatrixWorld(true);
      scene.traverse((o) => {
        const sm = o as SkinnedMesh;
        if (!o.name.startsWith('tenue:') || !sm.isSkinnedMesh) return;
        const g = sm.geometry;
        const pos = g.getAttribute('position');
        const idx = g.getIndex();
        const n = idx ? idx.count : pos.count;
        const posed: Vector3[] = [];
        const rest: Vector3[] = [];
        for (let i = 0; i < pos.count; i++) {
          rest.push(new Vector3().fromBufferAttribute(pos, i));
          posed.push(sm.getVertexPosition(i, new Vector3()).applyMatrix4(sm.matrixWorld));
        }
        const restW = rest.map((v) => v.clone().applyMatrix4(sm.matrixWorld));
        for (let f = 0; f < n; f += 3) {
          const ids = [0, 1, 2].map((k) => (idx ? idx.getX(f + k) : f + k));
          const le = (a: Vector3[]) => Math.max(...[0, 1, 2].map((k) => a[ids[k]].distanceTo(a[ids[(k + 1) % 3]])));
          const lp = le(posed);
          const lr = le(restW);
          if (lp > min && lp > ratio * lr) out.push({ mesh: o.name, face: f / 3, posed: +lp.toFixed(3), rest: +lr.toFixed(4), points: ids.map((i) => rest[i].toArray().map((v) => +v.toFixed(4))) });
        }
      });
      return out;
    };
    // 1.26 window.__labMats(): the garments' materials (point colours used, colour), to check the baked shadows
    (window as unknown as { __labMats?: unknown }).__labMats = () => {
      const out: object[] = [];
      scene.traverse((o) => {
        if (!o.name.startsWith('tenue:')) return;
        const m = (o as Mesh).material as Material & { vertexColors?: boolean; type: string };
        out.push({ mesh: o.name, type: m.type, vertexColors: m.vertexColors, color: !!(o as Mesh).geometry.getAttribute('color') });
      });
      return out;
    };
  }, [camera, size, rig, scene]);
  return null;
}
