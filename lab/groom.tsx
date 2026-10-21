/**
 * Development lab (not shipped): one coach, fixed camera, for before/after captures of hair, beard and
 * skin. Parameters: ?coach=homme|femme&az=0&el=0&shot=tete|buste|corps&style=realiste|encre&disc=mma
 * window.__labReady is set once the model has rendered a few frames.
 */
import { Suspense, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useThree } from '@react-three/fiber';
import { CoachModel, CoachStyle } from '../src/three/CoachModel';
import { StudioEnvironment } from '../src/three/StudioEnvironment';
import { championFor, championLook, championModel } from '../src/domain/coaches/catalog';
import type { CoachId, DisciplineId } from '../src/domain/types';
import type { CoachRig } from '../src/engine/rig';

const q = new URLSearchParams(location.search);
const coach = (q.get('coach') ?? 'homme') as CoachId;
const az = (Number(q.get('az') ?? 0) * Math.PI) / 180;
const el = (Number(q.get('el') ?? 0) * Math.PI) / 180;
const shot = q.get('shot') ?? 'tete';
const style = (q.get('style') ?? 'realiste') as CoachStyle;
const disc = (q.get('disc') ?? 'mma') as DisciplineId;
const champion = championFor(coach);
const look = championLook(champion, disc);

function Cam({ target, dist }: { target: [number, number, number]; dist: number }) {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    camera.position.set(target[0] + Math.sin(az) * Math.cos(el) * dist, target[1] + Math.sin(el) * dist, target[2] + Math.cos(az) * Math.cos(el) * dist);
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
  }, [camera, target, dist]);
  return null;
}

function App() {
  const [frames, setFrames] = useState(0);
  useEffect(() => {
    if (frames > 20) (window as unknown as { __labReady?: boolean }).__labReady = true;
  }, [frames]);
  const head: [number, number, number] = coach === 'femme' ? [0, 1.64, 0.02] : [0, 1.6, 0.03];
  const target: [number, number, number] = shot === 'tete' ? head : shot === 'buste' ? [0, 1.38, 0] : [0, 0.95, 0];
  const dist = shot === 'tete' ? 0.62 : shot === 'buste' ? 1.25 : 3.2;
  return (
    <Canvas dpr={2} gl={{ antialias: true, preserveDrawingBuffer: true }} camera={{ fov: 30, near: 0.05, far: 50 }}>
      <Cam target={target} dist={dist} />
      <hemisphereLight args={['#ffffff', '#d9d4cf', 0.9]} />
      <directionalLight position={[2.2, 4.2, 3.2]} intensity={2.1} />
      <directionalLight position={[-3, 2.5, 1.5]} intensity={0.75} color="#f3f6ff" />
      <directionalLight position={[0, 3, -4]} intensity={1.1} />
      <Suspense fallback={null}>
        {style === 'realiste' && <StudioEnvironment />}
        <CoachModel
          coach={coach}
          style={style}
          quality="haute"
          look={look}
          model={championModel(champion)}
          onRig={(r: CoachRig) => void r}
          onFrame={() => setFrames((f) => (f > 30 ? f : f + 1))}
        />
      </Suspense>
    </Canvas>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
