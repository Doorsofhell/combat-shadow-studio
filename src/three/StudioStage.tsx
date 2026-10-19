import { ReactNode, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import { Box3, PerspectiveCamera, Vector3 } from 'three';
import { FOV, centerOnSpheres, fitDistance, fitSpheres } from './framing';
import type { Envelope } from '../engine/envelope';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

/** where the camera should look from, in scene terms (azimuth already oriented for the guard) */
export interface StageView {
  /** degrees, relative to the direction the coach faces: 0 = facing the coach, positive = towards the coach's left side */
  az: number;
  /** degrees above horizontal */
  el: number;
  /** 1 = whole body with margin, <1 wider, >1 closer (crops the body) */
  zoom: number;
  /** height of the point looked at, as a fraction of the body height (used for close-ups) */
  focus: number;
  closeUp?: boolean;
}

export interface StudioStageProps {
  children?: ReactNode;
  /** legacy: horizontal angle in degrees when no view is given */
  cameraAngle?: number;
  view?: StageView;
  quality: 'haute' | 'basse';
  zoom?: number;
  focusY?: number;
  /** follow this point (the coach's hips) horizontally */
  follow?: { current: Vector3 };
  /** space the whole sequence occupies, in the coach's local frame (see motionEnvelope) */
  envelope?: { current: Envelope | null };
  /** coach origin, to place the envelope (x, z, yaw) */
  origin?: { current: { x: number; z: number; yaw: number } | null };
  orbit?: boolean;
  /** the user owns the camera (free 360° mode): no automatic movement */
  free?: boolean;
  /** the user started dragging the view */
  onUserOrbit?: () => void;
  /** dark menu stage: deeper floor shadow, rim light */
  dark?: boolean;
}

/** camera state read by the end-to-end tests (degrees): where it looks from, relative to the coach */
function probe(s: { az: number; el: number; dist: number }, o: { yaw: number }, free: boolean) {
  const w = window as unknown as { __cssCamera?: object };
  w.__cssCamera = { az: (s.az * 180) / Math.PI, el: (s.el * 180) / Math.PI, dist: s.dist, coachYaw: (o.yaw * 180) / Math.PI, free };
}

const DEFAULT_BOX = new Box3(new Vector3(-0.55, 0, -0.6), new Vector3(0.55, 1.95, 0.7));
const deg = Math.PI / 180;
const tmpBox = new Box3();
const corner = new Vector3();

/**
 * White studio with a teaching camera: it frames the whole space the current sequence occupies
 * (computed from the real animation), from the requested angle, and glides to a new angle
 * instead of cutting. In free mode the user turns around the coach with a finger.
 */
export function StudioStage({ children, cameraAngle = 35, view, quality, zoom = 1, focusY, follow, envelope, origin, orbit = false, free = false, onUserOrbit, dark = false }: StudioStageProps) {
  const { camera, size } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const cur = useRef<{ az: number; el: number; dist: number; target: Vector3 } | null>(null);
  const v: StageView = view ?? { az: cameraAngle, el: 7, zoom, focus: focusY ? focusY / 1.85 : 0.52, closeUp: !!focusY };
  const viewRef = useRef(v);
  viewRef.current = v;
  const freeRef = useRef(free);
  freeRef.current = free;

  useEffect(() => {
    const cam = camera as PerspectiveCamera;
    cam.fov = FOV;
    cam.near = 0.05;
    cam.far = 50;
    cam.updateProjectionMatrix();
  }, [camera]);

  // a drag hands the camera to the user
  useEffect(() => {
    const c = controls.current;
    if (!c || !onUserOrbit) return;
    const onStart = () => onUserOrbit();
    c.addEventListener('start', onStart);
    return () => c.removeEventListener('start', onStart);
  }, [onUserOrbit]);

  useFrame((_s, dt) => {
    const cam = camera as PerspectiveCamera;
    const vv = viewRef.current;
    const aspect = size.width / Math.max(1, size.height);

    // space to frame, placed at the coach's current origin
    const env = envelope?.current;
    const local = env?.box ?? DEFAULT_BOX;
    const o = origin?.current ?? { x: follow?.current.x ?? 0, z: follow?.current.z ?? 0, yaw: 0 };
    tmpBox.makeEmpty();
    const c = Math.cos(o.yaw);
    const sn = Math.sin(o.yaw);
    for (let i = 0; i < 8; i++) {
      const x = i & 1 ? local.max.x : local.min.x;
      const y = i & 2 ? local.max.y : local.min.y;
      const z = i & 4 ? local.max.z : local.min.z;
      tmpBox.expandByPoint(corner.set(o.x + x * c + z * sn, y, o.z - x * sn + z * c));
    }
    const target = tmpBox.getCenter(new Vector3());
    const height = Math.max(1, local.max.y);
    // the angle is the one asked relative to the coach: after a pivot the camera turns with him
    const az = vv.az * deg + o.yaw;
    const el = vv.el * deg;
    if (vv.closeUp) target.y = vv.focus * height;
    else if (env?.pts.length) centerOnSpheres(env.pts, o, target, az, el);
    let dist = (env?.pts.length ? fitSpheres(env.pts, o, target, az, el, aspect) : fitDistance(tmpBox, target, az, el, aspect)) / Math.max(0.3, vv.zoom);
    dist = Math.min(14, Math.max(1.2, dist));

    if (!cur.current) cur.current = { az, el, dist, target: target.clone() };
    const k = 1 - Math.exp(-dt * 3.2); // about 0.7 s to settle: smooth, never a cut
    const s = cur.current;

    if (freeRef.current && controls.current) {
      // the user drives the angle; we only keep the coach centred
      const delta = target.clone().sub(s.target).multiplyScalar(k);
      s.target.add(delta);
      cam.position.add(delta);
      controls.current.target.copy(s.target);
      const off = cam.position.clone().sub(s.target);
      s.dist = off.length();
      s.az = Math.atan2(off.x, off.z);
      s.el = Math.asin(Math.max(-1, Math.min(1, off.y / Math.max(1e-6, s.dist))));
      probe(s, o, true);
      return;
    }
    let dAz = az - s.az;
    dAz = Math.atan2(Math.sin(dAz), Math.cos(dAz));
    s.az += dAz * k;
    s.el += (el - s.el) * k;
    // grow fast (never crop a limb), shrink slowly (no pumping)
    s.dist += (dist - s.dist) * (dist > s.dist ? Math.min(1, k * 3) : k * 0.5);
    s.target.lerp(target, k);
    cam.position.set(s.target.x + Math.sin(s.az) * Math.cos(s.el) * s.dist, s.target.y + Math.sin(s.el) * s.dist, s.target.z + Math.cos(s.az) * Math.cos(s.el) * s.dist);
    cam.lookAt(s.target);
    if (controls.current) controls.current.target.copy(s.target);
    probe(s, o, false);
  });

  const hi = quality === 'haute';
  return (
    <>
      <hemisphereLight args={['#ffffff', '#d9d4cf', 0.9]} />
      <directionalLight position={[2.2, 4.2, 3.2]} intensity={2.1} />
      <directionalLight position={[-3, 2.5, 1.5]} intensity={0.75} color="#f3f6ff" />
      <directionalLight position={[0, 3, -4]} intensity={dark ? 2.2 : 1.1} color={dark ? '#ffd9c7' : '#ffffff'} />
      {children}
      <ContactShadows position={[0, 0.001, 0]} opacity={dark ? 0.75 : 0.42} scale={6} blur={2.4} far={1.6} resolution={hi ? 512 : 256} color={dark ? '#000000' : '#3a3530'} />
      {orbit && <OrbitControls ref={controls} enablePan={false} enableDamping={false} minDistance={1.2} maxDistance={12} minPolarAngle={0.15} maxPolarAngle={1.75} />}
    </>
  );
}
