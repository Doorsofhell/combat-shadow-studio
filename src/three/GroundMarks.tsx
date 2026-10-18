import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { DoubleSide, Group, Mesh, MeshBasicMaterial, Shape, Vector3 } from 'three';
import type { CoachRig } from '../engine/rig';
import type { ComboPlayer } from '../engine/player';
import type { Motion } from '../engine/motion';
import { MotionSampler } from '../engine/motion';
import { analyseMotion } from '../engine/study';
import { useSettings } from '../store/settings';

const RED = '#c8102e';
const BLUE = '#2563eb';
const GREY = '#6b7280';
const END_BONE = { handL: 'LeftHand', handR: 'RightHand', footL: 'LeftToeBase', footR: 'RightToeBase' } as const;
const FOOT_W = 0.15;
const FOOT_L = 0.3;

/** arrow head shape pointing along +y, base at the origin */
const arrowShape = (() => {
  const s = new Shape();
  s.moveTo(-0.012, -0.05);
  s.lineTo(0.012, -0.05);
  s.lineTo(0.012, 0.02);
  s.lineTo(0.04, 0.02);
  s.lineTo(0, 0.08);
  s.lineTo(-0.04, 0.02);
  s.lineTo(-0.012, 0.02);
  s.closePath();
  return s;
})();

function arc(center: Vector3, radius: number, from: number, to: number) {
  const d = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  const pts: Vector3[] = [];
  for (let i = 0; i <= 20; i++) {
    const a = from + (d * i) / 20;
    pts.push(new Vector3(center.x + Math.sin(a) * radius, 0.012, center.z + Math.cos(a) * radius));
  }
  return pts;
}

function head(pts: Vector3[], size: number): Vector3[][] {
  if (pts.length < 2) return [];
  const a = pts[pts.length - 1];
  const dir = a.clone().sub(pts[Math.max(0, pts.length - 4)]).normalize();
  const side = new Vector3().crossVectors(dir, new Vector3(0, 1, 0));
  if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
  side.normalize();
  const back = a.clone().addScaledVector(dir, -size);
  return [
    [a, back.clone().addScaledVector(side, size * 0.6)],
    [a, back.clone().addScaledVector(side, -size * 0.6)],
  ];
}

interface StepGeo {
  path: Vector3[];
  back: Vector3[];
  pivots: Vector3[][];
}

/** path of the working limb and pivots of the supporting foot for one motion, in its own frame */
function stepGeometry(rig: CoachRig, m: Motion): StepGeo {
  const a = analyseMotion(rig, m);
  const s = new MotionSampler(rig, m);
  const at = (t: number, bone: string) => {
    rig.apply(s.sample(t));
    return rig.worldOf(bone)!.clone();
  };
  const end = END_BONE[a.effector];
  const path: Vector3[] = [];
  const back: Vector3[] = [];
  for (let i = 0; i <= 24; i++) path.push(at((a.peak * i) / 24, end));
  for (let i = 0; i <= 10; i++) back.push(at(a.peak + ((s.duration - a.peak) * i) / 10, end));
  const pivots = a.pivots.map((p) => arc(at(0, p.side === 'L' ? 'LeftToeBase' : 'RightToeBase'), 0.16, p.from, p.to));
  return { path, back, pivots };
}

/**
 * Optional marks on the studio floor during training, each switched on its own: where the feet
 * are, which way they point, which one is the front foot, the pivot of the supporting foot and the
 * path of the striking fist or foot. Everything is read from the animation really played.
 */
export function GroundMarks({ rig, player, southpaw }: { rig: CoachRig; player: { current: ComboPlayer | null }; southpaw: boolean }) {
  const marks = useSettings((s) => s.settings.groundMarks);
  const feet = useRef<Group>(null);
  const [step, setStep] = useState<{ motion: Motion; origin: { x: number; z: number; yaw: number } } | null>(null);
  const cache = useRef(new Map<string, StepGeo>());
  const live = marks.pieds || marks.orientation || marks.avantArriere;
  const perStep = marks.pivot || marks.trajectoire;

  // the last technique played stays drawn until the next one starts
  useFrame(() => {
    if (perStep) {
      const a = player.current?.activeStep();
      if (a && (a.motion !== step?.motion || a.origin !== step?.origin)) setStep({ motion: a.motion, origin: a.origin });
    }
    const g = feet.current;
    if (!g || !live) return;
    (['Left', 'Right'] as const).forEach((side, i) => {
      const foot = g.children[i] as Group;
      const heel = rig.worldOf(`${side}Foot`);
      const toe = rig.worldOf(`${side}ToeBase`);
      if (!heel || !toe) return;
      const dx = toe.x - heel.x;
      const dz = toe.z - heel.z;
      // the print is a little larger than the foot, so it shows around it
      const len = Math.max(0.2, Math.hypot(dx, dz) + 0.16);
      foot.position.set((heel.x + toe.x) / 2 + (dx / Math.hypot(dx, dz || 1e-6)) * 0.03, 0, (heel.z + toe.z) / 2 + (dz / Math.hypot(dx, dz || 1e-6)) * 0.03);
      foot.rotation.y = Math.atan2(dx, dz);
      const print = foot.children[0] as Mesh;
      print.scale.set(1, len / FOOT_L, 1);
      // a lifted foot leaves a fainter mark
      const lifted = Math.min(1, Math.max(0, (Math.min(heel.y, toe.y) - 0.06) / 0.25));
      (print.material as MeshBasicMaterial).opacity = 0.42 * (1 - lifted * 0.7);
      const arrow = foot.children[1] as Mesh;
      arrow.position.z = len / 2 + 0.06;
    });
  });

  const geo = useMemo(() => {
    if (!step || !perStep) return null;
    let g = cache.current.get(step.motion.id);
    if (!g) {
      g = stepGeometry(rig, step.motion);
      cache.current.set(step.motion.id, g);
    }
    return g;
  }, [rig, step, perStep]);
  // a new rig (other coach or discipline) has other proportions
  useEffect(() => cache.current.clear(), [rig]);

  if (!live && !geo) return null;
  const front = southpaw ? 1 : 0;
  return (
    <group>
      {live && (
        <group ref={feet}>
          {[0, 1].map((i) => {
            const color = marks.avantArriere ? (i === front ? RED : BLUE) : GREY;
            return (
              <group key={i}>
                <mesh rotation-x={-Math.PI / 2} position-y={0.004} renderOrder={8} visible={marks.pieds || marks.avantArriere}>
                  <planeGeometry args={[FOOT_W, FOOT_L]} />
                  <meshBasicMaterial color={color} transparent opacity={0.42} depthWrite={false} side={DoubleSide} />
                </mesh>
                <mesh rotation-x={-Math.PI / 2} position-y={0.006} renderOrder={9} visible={marks.orientation}>
                  <shapeGeometry args={[arrowShape]} />
                  <meshBasicMaterial color={marks.avantArriere ? color : '#111318'} transparent opacity={0.85} depthWrite={false} depthTest={false} side={DoubleSide} />
                </mesh>
              </group>
            );
          })}
        </group>
      )}
      {geo && step && (
        <group position={[step.origin.x, 0, step.origin.z]} rotation-y={step.origin.yaw}>
          {marks.trajectoire && geo.path.length > 1 && (
            <>
              <Line points={geo.path} color={RED} lineWidth={3} depthTest={false} renderOrder={9} />
              {head(geo.path, 0.07).map((h, i) => (
                <Line key={i} points={h} color={RED} lineWidth={3} depthTest={false} renderOrder={9} />
              ))}
              <Line points={geo.back} color={RED} lineWidth={1.5} dashed dashSize={0.04} gapSize={0.03} transparent opacity={0.6} />
            </>
          )}
          {marks.pivot &&
            geo.pivots.map((p, k) => (
              <group key={k}>
                <Line points={p} color={BLUE} lineWidth={2.5} depthTest={false} renderOrder={9} />
                {head(p, 0.05).map((h, i) => (
                  <Line key={i} points={h} color={BLUE} lineWidth={2.5} depthTest={false} renderOrder={9} />
                ))}
              </group>
            ))}
        </group>
      )}
    </group>
  );
}
