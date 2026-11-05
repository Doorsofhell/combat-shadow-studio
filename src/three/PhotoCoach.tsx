import { useCallback, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import type { GLTFLoader } from 'three-stdlib';
import { Material, Mesh, MeshStandardMaterial, Object3D, type SkinnedMesh } from 'three';
import { applyBreath, Breath } from './breath';
import { Sway } from './sway';
import { hairFadeAttribute, photoMaterial, photoPart, skinLookFor } from './photoMaterials';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { restoreReferencePose, setLegLength } from './pose';
import { dropStillMorphs, FaceAnimator, type FaceOptions } from './face';
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
  // 1.10: breathing of the chest and belly, on the skin and on the garments (src/three/breath.ts)
  const breath = useMemo(() => new Breath(), []);
  const scene = useMemo(() => {
    // 1.10: skin calibrated per coach (relief, scattering, pores: photoMaterials.ts SKIN_LOOK)
    const look = skinLookFor(url);
    const s = cloneSkinned(gltf.scene);
    s.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      m.frustumCulled = false;
      // 1.16: the expressions stay only on the face (src/three/face.ts)
      dropStillMorphs(m);
      // 1.10: each part classified (skin, eyes, hair, brows, lashes) and rebuilt from all its source properties
      // (src/three/photoMaterials.ts): before, « opacity » sent the eyes, brows and lashes to the hair branch
      const part = photoPart(m.material as Material);
      if (part === 'cheveux') hairFadeAttribute(m.geometry);
      m.material = photoMaterial(m.material as MeshStandardMaterial, part, quality, look);
      if (part === 'peau' && (m as SkinnedMesh).isSkinnedMesh) applyBreath(m.material as Material, breath.uniformsFor(m as SkinnedMesh));
    });
    restoreReferencePose(s);
    return s;
  }, [gltf, quality, url, breath]);
  // 1.9: blinks, gaze and the effort of the strikes on the facial bones (src/three/face.ts); after the rig's pose
  const face = useMemo(() => {
    restoreReferencePose(scene);
    return new FaceAnimator(scene, url.length);
  }, [scene, url]);
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
  // 1.10: the skirt of the gi and the belt tails swing a little (src/three/sway.ts)
  const sway = useMemo(() => new Sway(), []);
  const decorate = useCallback(
    (g: SkinnedMesh) => {
      applyBreath(g.material as Material, breath.uniformsFor(g));
      sway.add(g, outfit === 'judo');
    },
    [breath, sway, outfit],
  );
  const dressed = useOutfit(scene, outfitUrl, outfit, quality, extendLoader, prepare, decorate);
  useEffect(() => onOutfit?.(dressed), [dressed, onOutfit]);
  // v0.32 (Youssef, 2026-10-22 10:33: « le combattant apparaît brièvement en sous-vêtements »): the coach is
  // drawn only once its outfit is worn, or when there is none, or when it failed (the base layer is then said)
  const expected = outfitUrl && outfit ? outfit : null;
  const ready = !expected || (dressed.outfit === expected && (dressed.state === 'portee' || dressed.state === 'erreur'));
  scene.visible = ready;
  if (import.meta.env.DEV) (globalThis as { __photoScene?: Object3D }).__photoScene = scene;
  useFrame((_, dt) => {
    onFrame(rig, Math.min(dt, 0.05));
    // fixed images (Lab, portraits) ask for a still face, or impose an expression: window.__cssFace
    const fo = (globalThis as { __cssFace?: FaceOptions }).__cssFace;
    face.setBreath(fo?.still ? null : breath.amount.value.x);
    face.update(Math.min(dt, 0.05), fo);
    // still images (Lab, portraits): the chest at rest, so two captures of the same instant are the same
    breath.update(fo?.still ? 0 : dt, face.state.effort);
    if (fo?.still) breath.amount.value.set(0, 0, 0, 0);
    sway.update(fo?.still ? 0 : Math.min(dt, 0.05));
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
