/** Version A: the app's current Three.js system (React Three Fiber, CoachModel, studio lights, contact shadow). */
import { Suspense, useCallback, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { CoachModel } from '../../src/three/CoachModel';
import type { CoachRig } from '../../src/engine/rig';
import { draws, endFrame, installDrawCounter, CAMERA, FrameStats, LIGHTS, PROBE_BONES, cameraPosition, glbTiming, heap, makeDriver, modelUrl, params, type Driver, type LabWindow } from './common';

installDrawCounter();
const P = params();
const w = window as LabWindow;
const timings: Record<string, number> = { start: performance.now() };
let fixedT: number | null = null;
let liveStats: FrameStats | null = null;

function Camera() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(...cameraPosition());
    camera.lookAt(...CAMERA.target);
  }, [camera]);
  return null;
}

function Probe() {
  // runs after the scene is drawn: counts frames and records what the renderer did
  useFrame(() => {
    // runs before this frame's drawing: the counters hold the whole previous frame
    endFrame();
    liveStats?.tick(performance.now());
    if (!timings.firstFrame && w.__lab?.ready) timings.firstFrame = performance.now();
  });
  return null;
}

function App() {
  const driver = useRef<Driver | null>(null);
  const rigRef = useRef<CoachRig | null>(null);
  const onRig = useCallback((rig: CoachRig) => {
    rigRef.current = rig;
    timings.modelReady = performance.now();
    driver.current = makeDriver(rig, P.scenario);
    fixedT = P.t === 'key' ? driver.current.keyTimes[0] : P.t;
    w.__lab = {
      ready: true,
      engine: 'three',
      timings: Object.assign(timings, glbTiming(modelUrl(P.coach))),
      keyTimes: driver.current.keyTimes,
      setTime: (t) => void (fixedT = t),
      joints: () => Object.fromEntries(PROBE_BONES.map((b) => [b, rig.worldOf(b)!.toArray() as [number, number, number]])),
      startStats: () => void (liveStats = new FrameStats()),
      stats: () => ({ ...(liveStats ?? new FrameStats()).summary(), drawCalls: draws.lastCalls, triangles: draws.lastTris }),
      heap,
    };
  }, []);
  const onFrame = useCallback((rig: CoachRig, dt: number) => {
    const d = driver.current;
    if (!d) return;
    rig.apply(fixedT === null ? d.live(dt) : d.poseAt(fixedT));
  }, []);
  const hi = P.quality === 'haute';
  return (
    <div style={{ width: P.width, height: P.height }}>
      <Canvas
        dpr={1}
        shadows={false}
        gl={{ antialias: hi, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
        camera={{ fov: CAMERA.fov, near: CAMERA.near, far: CAMERA.far, position: cameraPosition() }}
        style={{ background: '#fff' }}
      >
        <Camera />
        <hemisphereLight args={[LIGHTS.hemi.sky, LIGHTS.hemi.ground, LIGHTS.hemi.intensity]} />
        {LIGHTS.dirs.map((l, i) => (
          <directionalLight key={i} position={l.pos as [number, number, number]} intensity={l.intensity} color={l.color} />
        ))}
        <Suspense fallback={null}>
          <CoachModel coach={P.coach} style={P.look} quality={P.quality} onRig={onRig} onFrame={onFrame} />
        </Suspense>
        {!new URLSearchParams(location.search).get('noshadow') && <ContactShadows position={[0, 0.001, 0]} opacity={LIGHTS.shadow.opacity} scale={6} blur={2.4} far={1.6} resolution={hi ? 512 : 256} color={LIGHTS.shadow.color} />}
        <Probe />
      </Canvas>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
