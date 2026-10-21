import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import type { GLTFLoader } from 'three-stdlib';
import { Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Object3D, SRGBColorSpace } from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { restoreReferencePose, setLegLength } from './pose';
import { CoachRig } from '../engine/rig';

/**
 * v0.29 Ultra-réaliste coach built on a photo-textured avatar of the Microsoft Rocketbox library (MIT,
 * see docs/LICENCES.md): head and body textures taken from photos, so the face, the skin and the short hair
 * read as human, which the generated models could not reach (Youssef, 2026-10-21 13:49: « les personnages ne
 * font pas du tout humain »). Converted by tools/generator/rocketbox/convert.py: same bone names as our models,
 * so the rig and every animation drive it unchanged.
 */
export function PhotoCoach({
  url,
  quality,
  legLength = 1,
  shadows,
  onRig,
  onFrame,
  draco,
  extendLoader,
}: {
  url: string;
  /** same loader set-up as the generated models (Draco, the JSON-wrapped models of the claude.ai page) */
  draco: string;
  extendLoader: (loader: GLTFLoader) => void;
  quality: 'haute' | 'basse';
  legLength?: number;
  shadows: boolean;
  onRig: (rig: CoachRig) => void;
  onFrame: (rig: CoachRig, dt: number) => void;
}) {
  const gltf = useGLTF(url, draco, true, extendLoader);
  const scene = useMemo(() => {
    const s = cloneSkinned(gltf.scene);
    s.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      m.frustumCulled = false;
      const old = m.material as MeshStandardMaterial;
      if (old.map) old.map.colorSpace = SRGBColorSpace;
      const hair = /opacity/.test(old.name);
      m.material =
        quality === 'haute' && !hair
          ? new MeshPhysicalMaterial({
              name: old.name,
              map: old.map,
              normalMap: old.normalMap,
              roughness: 0.58,
              metalness: 0,
              sheen: 0.3,
              sheenRoughness: 0.6,
              sheenColor: '#c98a72',
              specularIntensity: 0.4,
            })
          : new MeshStandardMaterial({ name: old.name, map: old.map, normalMap: old.normalMap, roughness: 0.6, metalness: 0, alphaTest: hair ? 0.4 : 0, transparent: false });
    });
    restoreReferencePose(s);
    return s;
  }, [gltf, quality]);
  const rig = useMemo(() => {
    restoreReferencePose(scene);
    setLegLength(scene, legLength);
    scene.updateMatrixWorld(true);
    return new CoachRig(scene);
  }, [scene, legLength]);
  useEffect(() => {
    scene.traverse((o: Object3D) => {
      o.castShadow = shadows;
      o.receiveShadow = shadows;
    });
  }, [scene, shadows]);
  useEffect(() => onRig(rig), [rig, onRig]);
  if (import.meta.env.DEV) (globalThis as { __photoScene?: Object3D }).__photoScene = scene;
  useFrame((_, dt) => onFrame(rig, Math.min(dt, 0.05)));
  return <primitive object={scene} />;
}
