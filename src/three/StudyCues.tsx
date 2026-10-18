import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { Group, Mesh, Vector3 } from 'three';
import type { CoachRig } from '../engine/rig';
import { MotionSampler } from '../engine/motion';
import type { StudyPlayer } from '../engine/study';
import type { BodyFocus } from '../engine/phases';
import { useSettings } from '../store/settings';

const RED = '#c8102e';
const GREY = '#8a8f98';
const BLUE = '#2563eb';
const GOLD = '#e0a400';

/** where the body part of the current teaching phase is highlighted, and the shape used */
const FOCUS: { id: BodyFocus; bone: string; ring: boolean; r: number }[] = [
  { id: 'footL', bone: 'LeftFoot', ring: true, r: 0.12 },
  { id: 'footR', bone: 'RightFoot', ring: true, r: 0.12 },
  { id: 'hips', bone: 'Hips', ring: true, r: 0.24 },
  { id: 'shoulders', bone: 'Spine2', ring: true, r: 0.27 },
  { id: 'handL', bone: 'LeftHand', ring: false, r: 0.06 },
  { id: 'handR', bone: 'RightHand', ring: false, r: 0.06 },
];

const SKELETON: [string, string][] = [
  ['Hips', 'Spine2'],
  ['Spine2', 'Neck'],
  ['Neck', 'Head'],
  ['LeftArm', 'LeftForeArm'],
  ['LeftForeArm', 'LeftHand'],
  ['RightArm', 'RightForeArm'],
  ['RightForeArm', 'RightHand'],
  ['LeftArm', 'RightArm'],
  ['LeftUpLeg', 'RightUpLeg'],
  ['LeftUpLeg', 'LeftLeg'],
  ['LeftLeg', 'LeftFoot'],
  ['LeftFoot', 'LeftToeBase'],
  ['RightUpLeg', 'RightLeg'],
  ['RightLeg', 'RightFoot'],
  ['RightFoot', 'RightToeBase'],
];

const JOINTS = {
  handL: ['LeftArm', 'LeftForeArm', 'LeftHand'],
  handR: ['RightArm', 'RightForeArm', 'RightHand'],
  footL: ['LeftUpLeg', 'LeftLeg', 'LeftFoot'],
  footR: ['RightUpLeg', 'RightLeg', 'RightFoot'],
} as const;

const END_BONE = { handL: 'LeftHand', handR: 'RightHand', footL: 'LeftToeBase', footR: 'RightToeBase' } as const;

function arc(center: Vector3, radius: number, from: number, to: number, y: number) {
  const pts: Vector3[] = [];
  let d = to - from;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const a = from + (d * i) / n;
    pts.push(new Vector3(center.x + Math.sin(a) * radius, y, center.z + Math.cos(a) * radius));
  }
  return pts;
}

/** small arrow head: two segments at the end of a polyline */
function head(pts: Vector3[], size = 0.07): Vector3[][] {
  if (pts.length < 2) return [];
  const a = pts[pts.length - 1];
  const b = pts[Math.max(0, pts.length - 4)];
  const dir = a.clone().sub(b).normalize();
  const side = new Vector3().crossVectors(dir, new Vector3(0, 1, 0));
  if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
  side.normalize();
  const back = a.clone().addScaledVector(dir, -size);
  return [
    [a, back.clone().addScaledVector(side, size * 0.6)],
    [a, back.clone().addScaledVector(side, -size * 0.6)],
  ];
}

/**
 * Teaching marks drawn from the motion really played by the coach: the path of the striking fist
 * or foot, the hip rotation, the pivot of the supporting foot, the working joints, footprints at
 * the start and at the key position, and the starting guard as a light outline.
 */
export function StudyCues({ rig, study }: { rig: CoachRig; study: { current: StudyPlayer | null } }) {
  const cues = useSettings((s) => s.settings.cues);
  const motion = study.current?.motion;
  const a = study.current?.analysis;
  const joints = useRef<Group>(null);
  const focus = useRef<Group>(null);

  const geo = useMemo(() => {
    if (!motion || !a) return null;
    const s = new MotionSampler(rig, motion);
    const at = (t: number) => {
      rig.apply(s.sample(t));
      const out: Record<string, Vector3> = {};
      for (const [x, y] of SKELETON) {
        out[x] = rig.worldOf(x)!.clone();
        out[y] = rig.worldOf(y)!.clone();
      }
      return out;
    };
    const path: Vector3[] = [];
    const back: Vector3[] = [];
    const n = 28;
    for (let i = 0; i <= n; i++) path.push(at((a.peak * i) / n)[END_BONE[a.effector]]);
    for (let i = 0; i <= 12; i++) back.push(at(a.peak + ((s.duration - a.peak) * i) / 12)[END_BONE[a.effector]]);
    const start = at(0);
    const peak = at(a.peak);
    const hips = start.Hips.clone();
    const hipArc = Math.abs(a.hipTurn) > 0.14 ? arc(hips, 0.34, 0, a.hipTurn, hips.y) : null;
    const pivots = a.pivots.map((p) => {
      const toe = start[p.side === 'L' ? 'LeftToeBase' : 'RightToeBase'];
      return arc(toe, 0.16, p.from, p.to, 0.012);
    });
    const feet = (pose: Record<string, Vector3>) =>
      (['Left', 'Right'] as const).map((side) => {
        const heel = pose[`${side}Foot`].clone().setY(0.006);
        const toe = pose[`${side}ToeBase`].clone().setY(0.006);
        const dir = toe.clone().sub(heel);
        const tip = toe.clone().addScaledVector(dir.normalize(), 0.07);
        const side2 = new Vector3(-dir.z, 0, dir.x).multiplyScalar(0.045);
        return [heel.clone().add(side2), tip.clone().add(side2), tip.clone().sub(side2), heel.clone().sub(side2), heel.clone().add(side2)];
      });
    const bones = (pose: Record<string, Vector3>) => SKELETON.map(([x, y]) => [pose[x], pose[y]]);
    return { path, back, hipArc, pivots, feetStart: feet(start), feetPeak: feet(peak), guard: bones(start), peakBones: bones(peak) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rig, motion]);

  // the body part of the current teaching phase is circled in gold, pulsing gently
  useFrame(({ clock }) => {
    const g = focus.current;
    const st = study.current;
    if (!g || !st) return;
    const on = st.phases[st.phaseIndex]?.focus ?? [];
    const pulse = 1 + 0.08 * Math.sin(clock.elapsedTime * 5);
    FOCUS.forEach((f, i) => {
      const m = g.children[i] as Mesh | undefined;
      if (!m) return;
      m.visible = on.includes(f.id);
      const w = m.visible ? rig.worldOf(f.bone) : null;
      if (!w) return;
      m.position.copy(w);
      if (f.bone.endsWith('Foot')) m.position.y = 0.015;
      m.scale.setScalar(pulse);
    });
  });

  // the working joints follow the live pose
  useFrame(() => {
    const g = joints.current;
    if (!g || !a) return;
    JOINTS[a.effector].forEach((b, i) => {
      const m = g.children[i] as Mesh | undefined;
      const w = rig.worldOf(b);
      if (m && w) m.position.copy(w);
    });
  });

  if (!geo || !a) return null;
  return (
    <group>
      <group ref={focus} name="phase-focus">
        {FOCUS.map((f) => (
          <mesh key={f.id} visible={false} rotation={f.ring ? [-Math.PI / 2, 0, 0] : [0, 0, 0]} renderOrder={11}>
            {f.ring ? <torusGeometry args={[f.r, 0.012, 8, 48]} /> : <sphereGeometry args={[f.r, 16, 12]} />}
            <meshBasicMaterial color={GOLD} transparent opacity={f.ring ? 0.95 : 0.55} depthTest={false} />
          </mesh>
        ))}
      </group>
      {cues.trajectoire && (
        <>
          <Line points={geo.path} color={RED} lineWidth={3} depthTest={false} renderOrder={9} />
          {head(geo.path).map((h, i) => (
            <Line key={i} points={h} color={RED} lineWidth={3} depthTest={false} renderOrder={9} />
          ))}
          <Line points={geo.back} color={RED} lineWidth={1.5} dashed dashSize={0.04} gapSize={0.03} transparent opacity={0.6} />
        </>
      )}
      {cues.hanches && geo.hipArc && (
        <>
          <Line points={geo.hipArc} color={BLUE} lineWidth={2.5} depthTest={false} renderOrder={9} />
          {head(geo.hipArc, 0.06).map((h, i) => (
            <Line key={i} points={h} color={BLUE} lineWidth={2.5} depthTest={false} renderOrder={9} />
          ))}
        </>
      )}
      {cues.pivot &&
        geo.pivots.map((p, k) => (
          <group key={k}>
            <Line points={p} color={BLUE} lineWidth={2.5} depthTest={false} renderOrder={9} />
            {head(p, 0.05).map((h, i) => (
              <Line key={i} points={h} color={BLUE} lineWidth={2.5} depthTest={false} renderOrder={9} />
            ))}
          </group>
        ))}
      {cues.pieds && (
        <>
          {geo.feetStart.map((f, i) => (
            <Line key={`s${i}`} points={f} color={GREY} lineWidth={2} />
          ))}
          {geo.feetPeak.map((f, i) => (
            <Line key={`p${i}`} points={f} color={RED} lineWidth={2} />
          ))}
        </>
      )}
      {cues.garde && geo.guard.map((b, i) => <Line key={`g${i}`} points={b} color={GREY} lineWidth={2} transparent opacity={0.55} />)}
      {cues.comparaison && geo.peakBones.map((b, i) => <Line key={`k${i}`} points={b} color={RED} lineWidth={1.5} transparent opacity={0.45} />)}
      {cues.articulations && (
        <group ref={joints}>
          {JOINTS[a.effector].map((b) => (
            <mesh key={b} renderOrder={10}>
              <sphereGeometry args={[0.035, 16, 12]} />
              <meshBasicMaterial color={RED} transparent opacity={0.85} depthTest={false} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}
