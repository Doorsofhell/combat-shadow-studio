import { Suspense, useCallback, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { CoachModel } from '../three/CoachModel';
import { StudioStage } from '../three/StudioStage';
import type { CoachRig } from '../engine/rig';
import { getLibrary, getMotion } from '../engine/library';
import { MotionSampler } from '../engine/motion';
import type { StanceStyle } from '../engine/author';
import type { CoachId } from '../domain/types';

/** Developer view: freezes a motion at a given time, used for visual checks and screenshots. */
export function Lab() {
  const q = useMemo(() => new URLSearchParams(location.hash.split('?')[1] ?? ''), []);
  const coach = (q.get('coach') ?? 'homme') as CoachId;
  const style = (q.get('style') ?? 'boxing') as StanceStyle;
  const motionId = q.get('motion') ?? 'garde';
  const t = Number(q.get('t') ?? '0');
  const cam = Number(q.get('cam') ?? '35');
  const southpaw = q.get('garde') === 'gaucher';
  const sampler = useRef<MotionSampler | null>(null);
  const onRig = useCallback(
    (rig: CoachRig) => {
      const lib = getLibrary(rig, style);
      const m = getMotion(lib, motionId, southpaw) ?? lib.get('garde')!;
      sampler.current = new MotionSampler(rig, m);
      (window as unknown as { __labReady: boolean }).__labReady = true;
    },
    [style, motionId, southpaw],
  );
  const onFrame = useCallback(
    (rig: CoachRig) => {
      if (!sampler.current) return;
      const pose = sampler.current.sample(t);
      if (q.get('fist')) pose.handL.fist = pose.handR.fist = Number(q.get('fist'));
      if (q.get('pron')) pose.handL.pron = pose.handR.pron = Number(q.get('pron'));
      if (q.get('rest')) { rig.reset(); return; }
      rig.apply(pose);
    },
    [t, q],
  );
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#fff' }}>
      <Canvas shadows dpr={[1, 2]} gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}>
        <Suspense fallback={null}>
          <StudioStage cameraAngle={cam} quality="haute" zoom={Number(q.get('zoom') ?? '1')} focusY={q.get('fy') ? Number(q.get('fy')) : undefined}>
            <CoachModel coach={coach} style={q.get('look') === 'realiste' ? 'realiste' : 'manga'} quality="haute" onRig={onRig} onFrame={onFrame} />
          </StudioStage>
        </Suspense>
      </Canvas>
    </div>
  );
}
