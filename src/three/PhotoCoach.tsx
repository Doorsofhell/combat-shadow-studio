import { useCallback, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import type { GLTFLoader } from 'three-stdlib';
import { Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Object3D, SRGBColorSpace } from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { restoreReferencePose, setLegLength } from './pose';
import { CoachRig } from '../engine';
import { useOutfit, type OutfitId, type OutfitStatus } from './outfit';

/**
 * v0.29 Ultra-réaliste coach built on a photo-textured avatar of the Microsoft Rocketbox library (MIT,
 * see docs/LICENCES.md): head and body textures taken from photos, so the face, the skin and the short hair
 * read as human, which the generated models could not reach (Youssef, 2026-10-21 13:49: « les personnages ne
 * font pas du tout humain »). Converted by tools/generator/rocketbox/convert.py: same bone names as our models,
 * so the rig and every animation drive it unchanged.
 */
export function PhotoCoach({
  url,
  outfitUrl = null,
  outfit = null,
  onOutfit,
  quality,
  legLength = 1,
  shadows,
  onRig,
  onFrame,
  draco,
  extendLoader,
}: {
  url: string;
  /** v0.31: the discipline outfit (src/three/outfit.ts) */
  outfitUrl?: string | null;
  outfit?: OutfitId | null;
  onOutfit?: (s: OutfitStatus) => void;
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
      // v0.31 (« flou ou halo », Youssef 2026-10-22): skin seen at a grazing angle (arms, flanks) was blurred by
      // plain mipmapping; anisotropic filtering keeps its detail (4 samples: cheap on phone graphics chips)
      for (const t of [old.map, old.normalMap]) if (t) t.anisotropy = 4;
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
          : new MeshStandardMaterial({ name: old.name, map: old.map, normalMap: old.normalMap, roughness: 0.6, metalness: 0, alphaTest: hair ? 0.4 : 0, alphaToCoverage: hair, transparent: false });
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
  // v0.29: the materials made for this quality are freed when the quality changes or the coach leaves
  // (they used to stay in graphics memory; the textures belong to the loaded model and stay shared)
  useEffect(
    () => () =>
      scene.traverse((o) => {
        const m = o as Mesh;
        if (m.isMesh) (m.material as MeshStandardMaterial).dispose();
      }),
    [scene],
  );
  useEffect(() => onRig(rig), [rig, onRig]);
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const prepare = useCallback(
    async (garments: Object3D[]) => {
      for (const g of garments) {
        const m = (g as Mesh).material as MeshStandardMaterial;
        for (const t of [m.map, m.normalMap, m.roughnessMap]) if (t) gl.initTexture(t);
      }
      await gl.compileAsync(scene, camera);
    },
    [gl, camera, scene],
  );
  const dressed = useOutfit(scene, outfitUrl, outfit, quality, extendLoader, prepare);
  useEffect(() => onOutfit?.(dressed), [dressed, onOutfit]);
  // v0.32 (Youssef, 2026-10-22 10:33: « le combattant apparaît brièvement en sous-vêtements »): the coach is
  // drawn only once its outfit is worn, or when there is none, or when it failed (the base layer is then said)
  const expected = outfitUrl && outfit ? outfit : null;
  const ready = !expected || (dressed.outfit === expected && (dressed.state === 'portee' || dressed.state === 'erreur'));
  scene.visible = ready;
  if (import.meta.env.DEV) (globalThis as { __photoScene?: Object3D }).__photoScene = scene;
  useFrame((_, dt) => {
    onFrame(rig, Math.min(dt, 0.05));
    // garments are taken off in an effect cleanup (quality or outfit change) before the new state is rendered:
    // an image is never drawn with the coach shown without them
    if (scene.visible && expected && dressed.state === 'portee' && !hasGarment(scene)) scene.visible = false;
    // probe of the loading tests (tests/e2e/outfit-loading.spec.ts): images drawn with the coach visible but
    // the expected outfit not on its body
    const w = globalThis as { __cssDress?: { shown: number; undressed: number; outfit: string | null } };
    const d = (w.__cssDress ??= { shown: 0, undressed: 0, outfit: null });
    d.outfit = expected;
    if (!scene.visible) return;
    d.shown++;
    if (expected && dressed.state !== 'erreur' && !hasGarment(scene)) d.undressed++;
  });
  return <primitive object={scene} />;
}

const hasGarment = (scene: Object3D) => {
  let found = false;
  scene.traverse((o) => {
    if (o.name.startsWith('tenue:')) found = true;
  });
  return found;
};
