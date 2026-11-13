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
import { StageLights } from '../src/three/StudioStage';
import { championFor, championLook, championModel } from '../src/domain/coaches/catalog';
import type { CoachId, DisciplineId } from '../src/domain/types';
import type { CoachRig } from '../src/engine/rig';
import { Mesh, MeshBasicMaterial, MeshStandardMaterial } from 'three';

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

function Probe() {
  const st = useThree();
  useEffect(() => {
    const t = setInterval(() => {
      const casters: string[] = [];
      st.scene.traverse((o) => (o as { castShadow?: boolean; isMesh?: boolean }).isMesh && (o as { castShadow: boolean }).castShadow && casters.push(o.name || o.type));
      (window as unknown as { __labProbe?: unknown }).__labProbe = { enabled: st.gl.shadowMap.enabled, type: st.gl.shadowMap.type, casters: casters.length };
      // debug: ?dbg=eyebasic,hide-<name>
      const dbg = (q.get('dbg') ?? '').split(',');
      const seen: string[] = [];
      st.scene.traverse((o) => {
        const m = o as Mesh;
        if (!m.isMesh) return;
        const mat = m.material as MeshStandardMaterial;
        seen.push(`${o.name}/${mat.name}/${o.visible}`);
        if (mat.name === 'Eyes') (window as unknown as { __labEye?: unknown }).__labEye = { nm: !!mat.normalMap, rough: mat.roughness, rm: !!mat.roughnessMap, type: mat.type, cs: mat.map?.colorSpace };
        if (dbg.includes('eyeclone') && mat.name === 'Eyes') m.material = mat.clone();
        if (dbg.includes('eyebasic') && mat.name === 'Eyes') m.material = new MeshBasicMaterial({ map: mat.map, name: 'Eyes-dbg' });
        if (dbg.some((d) => d === `hide-${o.name}` || d === `hide-${mat.name}`)) o.visible = false;
      });
      (window as unknown as { __labMeshes?: unknown }).__labMeshes = seen;
    }, 1000);
    return () => clearInterval(t);
  }, [st]);
  return null;
}

function App() {
  const [frames, setFrames] = useState(0);
  useEffect(() => {
    if (frames > 20) (window as unknown as { __labReady?: boolean }).__labReady = true;
  }, [frames]);
  const head: [number, number, number] = coach === 'femme' ? [0, 1.64, 0.02] : [0, 1.6, 0.03];
  const eyes: [number, number, number] = coach === 'femme' ? [0.0, 1.64, 0.1] : [0.0, 1.585, 0.11];
  const target: [number, number, number] = shot === 'yeux' ? eyes : shot === 'tete' ? head : shot === 'buste' ? [0, 1.38, 0] : [0, 0.95, 0];
  const dist = shot === 'yeux' ? 0.22 : shot === 'tete' ? 0.62 : shot === 'buste' ? 1.25 : 3.2;
  return (
    <Canvas shadows={q.get('shadows') === '0' ? false : 'soft'} dpr={2} gl={{ antialias: true, preserveDrawingBuffer: true }} camera={{ fov: 30, near: 0.05, far: 50 }}>
      <Cam target={target} dist={dist} />
      <Probe />
      <StageLights shadows={q.get('shadows') !== '0'} realistic={style === 'realiste'} />
      <Suspense fallback={null}>
        {style === 'realiste' && !q.get('noenv') && <StudioEnvironment intensity={Number(q.get('env') ?? 0.12)} />}
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
