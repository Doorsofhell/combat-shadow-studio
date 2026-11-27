import { useCallback, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import type { GLTFLoader } from 'three-stdlib';
import { BufferGeometry, Material, Mesh, MeshStandardMaterial, Object3D, Vector3, type Skeleton, type SkinnedMesh } from 'three';
import { applyBreath, Breath } from './breath';
import { applyFinish, finishKindOf } from './finish';
import { Sway } from './sway';
import { hairFadeAttribute, photoMaterial, photoPart, skinLookFor } from './photoMaterials';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { restoreReferencePose, setLegLength } from './pose';
import { dropStillMorphs, FaceAnimator, type FaceOptions } from './face';
import { applyWrinkles, WRINKLES_ON_COACHES } from './human/wrinkles';
import { newFaceRenderUniforms, shareFaceRender } from './human/faceRender';
import { bakeAmaraCleanSurface } from './amaraCleanSurface';
import type { HumanSignals } from './human/behavior';
import { humanProfileFor } from './human/profiles';
import { CoachRig } from '../engine';
import { useOutfit, type OutfitId, type OutfitStatus } from './outfit';
import { applyMorphology, morphologyFor } from './morphology';
import { ownGeometry, setTwistRig, torsionOn, twistRigOf, TwistRig } from './twist';

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
  human,
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
  /** 1.34 what the session tells the coach's behaviour (playing, paused, resting, phase): src/three/human/behavior.ts */
  human?: HumanSignals;
}) {
  const gltf = useGLTF(url, draco, true, extendLoader);
  // 1.10: breathing of the chest and belly, on the skin and on the garments (src/three/breath.ts)
  const breath = useMemo(() => new Breath(), []);
  const scene = useMemo(() => {
    // 1.10: skin calibrated per coach (relief, scattering, pores: photoMaterials.ts SKIN_LOOK)
    const look = skinLookFor(url);
    const morpho = morphologyFor(url);
    const s = cloneSkinned(gltf.scene);
    // 2.1.0: what this copy owns in graphics memory, given back when it leaves (see the cleanup below)
    const owned: BufferGeometry[] = [];
    s.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      m.frustumCulled = false;
      // 1.16: the expressions stay only on the face (src/three/face.ts)
      // Amara only: optional extra target on the body stores the old swimsuit surface
      // flattened in the actual rendered model. Bake BEFORE removing static morphs.
      // All seven existing hideBody masks still use the original unbaked vertex keys.
      const loaded = m.geometry;
      if (!bakeAmaraCleanSurface(m)) dropStillMorphs(m);
      // 2.2.0: the coach's own morphology (src/three/morphology.ts), on the body only, the garments get the same field
      if (morpho && /body/i.test((m.material as Material).name) && (m as SkinnedMesh).isSkinnedMesh) {
        if (m.geometry === loaded) m.geometry = loaded.clone();
        applyMorphology(m.geometry, morpho, (m as SkinnedMesh).skeleton);
      }
      if (m.geometry !== loaded) owned.push(m.geometry);
      // 1.10: each part classified (skin, eyes, hair, brows, lashes) and rebuilt from all its source properties
      // (src/three/photoMaterials.ts): before, « opacity » sent the eyes, brows and lashes to the hair branch
      const part = photoPart(m.material as Material);
      if (part === 'cheveux') hairFadeAttribute(m.geometry);
      m.material = photoMaterial(m.material as MeshStandardMaterial, part, quality, look);
      if (part === 'peau' && (m as SkinnedMesh).isSkinnedMesh) applyBreath(m.material as Material, breath.uniformsFor(m as SkinnedMesh));
      // 2.11.0: the edge light of the fight studio on the skin (src/three/finish.ts)
      if (part === 'peau') applyFinish(m.material as Material, 'peau', quality === 'haute');
    });
    restoreReferencePose(s);
    // 2.5.0: twist bones and half bones of the joints (src/three/twist.ts): weights redistributed on a copy of the
    // body's geometry, main bones untouched; ?torsion=0 for the comparisons
    if (torsionOn()) {
      const twist = new TwistRig(s);
      s.traverse((o) => {
        const m = o as SkinnedMesh;
        if (!m.isSkinnedMesh) return;
        const before = m.geometry;
        ownGeometry(m, m.geometry, owned);
        if (!twist.bind(m) && m.geometry !== before) {
          owned.pop()?.dispose();
          m.geometry = before;
        }
      });
      setTwistRig(s, twist);
      restoreReferencePose(s);
    }
    s.userData.cssOwnedGeometries = owned;
    return s;
  }, [gltf, quality, url, breath]);
  // 1.9: blinks, gaze and the effort of the strikes on the facial bones (src/three/face.ts); after the rig's pose
  const face = useMemo(() => {
    restoreReferencePose(scene);
    // 1.34 every coach gets the common behaviour engine, with its own profile (src/three/human/profiles.ts)
    const f = new FaceAnimator(scene, url.length, humanProfileFor(url));
    // 1.40 expression wrinkles on the skin (src/three/human/wrinkles.ts), the same for every coach; off since 1.40.1
    // (dotted marks on the faces on phones, WRINKLES_ON_COACHES)
    if (f.wrinkles && WRINKLES_ON_COACHES)
      scene.traverse((o) => {
        const m = o as Mesh;
        const mat = m.isMesh ? (m.material as Material) : null;
        if (mat?.userData.cssSkin && !mat.userData.cssWrinkles) applyWrinkles(mat, f.wrinkles!.uniforms);
      });
    return f;
  }, [scene, url]);
  // 1.44 the face's rendering (src/three/human/faceRender.ts): one set of uniforms for the head's skin and the eyes
  const faceRender = useMemo(() => {
    const u = newFaceRenderUniforms();
    shareFaceRender(scene, u);
    return u;
  }, [scene]);
  const rig = useMemo(() => {
    restoreReferencePose(scene);
    setLegLength(scene, legLength);
    scene.updateMatrixWorld(true);
    return new CoachRig(scene);
  }, [scene, legLength]);
  useEffect(() => {
    // 2.4.0 Lab ?ombres=0|cheveux : diagnostic des ombres portées sur le visage (jamais réglé par l'application)
    const lab = (globalThis as { __cssLabShadow?: string }).__cssLabShadow;
    scene.traverse((o: Object3D) => {
      o.castShadow = shadows && lab !== '0' && !(lab === 'cheveux' && /hair|lash|brow|cil|sourcil|cheveu/i.test(o.name + ((o as { material?: { name?: string } }).material?.name ?? '')));
      o.receiveShadow = shadows;
    });
  }, [scene, shadows]);
  // v0.29: the materials made for this quality are freed when the quality changes or the coach leaves
  // (they used to stay in graphics memory; the textures belong to the loaded model and stay shared)
  // 2.1.0 (Youssef, 2026-11-19 « corriger la mise en mémoire à chaque changement de coach »): the copy's own
  // skeletons (each one keeps its bone matrices in a texture) and its own geometries are given back too: about
  // thirteen textures used to stay in graphics memory at every coach change
  useEffect(
    () => () => {
      const skeletons = new Set<Skeleton>();
      scene.traverse((o) => {
        const m = o as Mesh;
        if (!m.isMesh) return;
        (m.material as MeshStandardMaterial).dispose();
        if ((m as SkinnedMesh).isSkinnedMesh && !o.name.startsWith('tenue:')) skeletons.add((m as SkinnedMesh).skeleton);
      });
      for (const k of skeletons) k.dispose();
      for (const g of (scene.userData.cssOwnedGeometries as BufferGeometry[] | undefined) ?? []) g.dispose();
    },
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
      // 2.5.0: the garment follows the twist and half bones like the body (src/three/twist.ts)
      const twist = twistRigOf(scene);
      if (twist) {
        const loaded = g.geometry;
        ownGeometry(g, loaded);
        if (twist.bind(g)) {
          // given back when the garment is taken off, or with the coach's copy when the coach leaves
          const own = g.geometry;
          (scene.userData.cssOwnedGeometries as BufferGeometry[] | undefined)?.push(own);
          g.addEventListener('removed', () => own.dispose());
        } else {
          g.geometry.dispose();
          g.geometry = loaded;
        }
      }
      applyBreath(g.material as Material, breath.uniformsFor(g));
      // 2.11.0: leather grain, satin, ribs and knit, and the edge light, on the garments and gloves (src/three/finish.ts)
      applyFinish(g.material as Material, finishKindOf(g.material as Material), quality === 'haute');
      sway.add(g, outfit === 'judo');
    },
    [breath, sway, outfit, scene, quality],
  );
  const dressed = useOutfit(scene, outfitUrl, outfit, quality, extendLoader, prepare, decorate);
  useEffect(() => onOutfit?.(dressed), [dressed, onOutfit]);
  // v0.32 (Youssef, 2026-10-22 10:33: « le combattant apparaît brièvement en sous-vêtements »): the coach is
  // drawn only once its outfit is worn, or when there is none, or when it failed (the base layer is then said)
  const expected = outfitUrl && outfit ? outfit : null;
  const ready = !expected || (dressed.outfit === expected && (dressed.state === 'portee' || dressed.state === 'erreur'));
  scene.visible = ready;
  if (import.meta.env.DEV) (globalThis as { __photoScene?: Object3D }).__photoScene = scene;
  if (import.meta.env.DEV) (globalThis as { __faceAnim?: FaceAnimator }).__faceAnim = face;
  const viewerPos = useMemo(() => new Vector3(), []);
  const twistRig = useMemo(() => twistRigOf(scene), [scene]);
  useFrame((_, dt) => {
    onFrame(rig, Math.min(dt, 0.05));
    // 2.5.0: the helper bones follow the pose of this image (main bones only, src/three/twist.ts)
    twistRig?.update();
    // fixed images (Lab, portraits) ask for a still face, or impose an expression: window.__cssFace
    const fo = (globalThis as { __cssFace?: FaceOptions }).__cssFace;
    face.setBreath(fo?.still ? null : breath.amount.value.x);
    // 1.40 the coach looks at the student (the camera) when the camera is in front of it
    face.setViewer(camera.getWorldPosition(viewerPos));
    face.update(Math.min(dt, 0.05), fo, human);
    face.updateWrinkles(camera);
    face.updateRender(faceRender, camera);
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
