/**
 * Version B: Babylon.js renders the same GLB with the same camera, lights and animation.
 * The animation is the app's engine (CoachRig + IK) running on a skeleton rebuilt from the GLB's
 * node tree with three.js maths only (no three.js renderer is loaded); each frame the bones' local
 * position, rotation and scale are copied to the Babylon nodes. Same poses, different renderer.
 */
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { ImportMeshAsync } from '@babylonjs/core/Loading/sceneLoader';
import { ImageProcessingConfiguration } from '@babylonjs/core/Materials/imageProcessingConfiguration';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import type { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import '@babylonjs/loaders/glTF/2.0';
import { ShadowOnlyMaterial } from '@babylonjs/materials/shadowOnly/shadowOnlyMaterial';
import { CoachRig } from '../../src/engine/rig';
import { buildSkeleton } from './skeleton';
import { draws, endFrame, installDrawCounter, CAMERA, FrameStats, LIGHTS, PROBE_BONES, cameraPosition, glbTiming, heap, makeDriver, modelUrl, params, type LabWindow } from './common';

/**
 * three.js light intensities include a 1/π in the diffuse term that Babylon's PBR does not, so
 * every light is divided by π. LIGHT_GAIN is a single global factor set by measuring the mean
 * brightness of the body in both versions (see docs/COMPARATIF_THREE_BABYLON.md).
 */
const LIGHT_GAIN = Number(new URLSearchParams(location.search).get('gain') ?? 1.43);
const K = LIGHT_GAIN / Math.PI;

installDrawCounter();
const P = params();
const w = window as LabWindow;
const timings: Record<string, number> = { start: performance.now() };
const hi = P.quality === 'haute';

const canvas = document.getElementById('c') as HTMLCanvasElement;
canvas.width = P.width;
canvas.height = P.height;
canvas.style.width = `${P.width}px`;
canvas.style.height = `${P.height}px`;
const engine = new Engine(canvas, hi, { preserveDrawingBuffer: true, stencil: true, alpha: true, powerPreference: 'high-performance' }, false);
engine.setHardwareScalingLevel(1);
const scene = new Scene(engine);
scene.useRightHandedSystem = true; // same axes as glTF and three.js: positions copied as they are
scene.clearColor = new Color4(1, 1, 1, 1);
scene.imageProcessingConfiguration.toneMappingEnabled = true;
scene.imageProcessingConfiguration.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
// three.js's ACES is the same fitted curve with the exposure multiplied by 1/0.6 (tonemapping_pars_fragment)
scene.imageProcessingConfiguration.exposure = 1 / 0.6;

const cam = new FreeCamera('cam', new Vector3(...cameraPosition()), scene);
cam.setTarget(new Vector3(...CAMERA.target));
cam.fov = (CAMERA.fov * Math.PI) / 180;
cam.minZ = CAMERA.near;
cam.maxZ = CAMERA.far;

const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
hemi.diffuse = Color3.FromHexString(LIGHTS.hemi.sky);
hemi.groundColor = Color3.FromHexString(LIGHTS.hemi.ground);
hemi.specular = Color3.Black();
hemi.intensity = LIGHTS.hemi.intensity * K;
const dirs = LIGHTS.dirs.map((l, i) => {
  const d = new DirectionalLight(`dir${i}`, new Vector3(-l.pos[0], -l.pos[1], -l.pos[2]).normalize(), scene);
  d.diffuse = Color3.FromHexString(l.color);
  d.specular = Color3.FromHexString(l.color);
  d.intensity = l.intensity * K;
  return d;
});

// floor shadow: the app uses a blurred contact shadow seen from above; here a light from above
// casts a blurred shadow on an invisible floor that shows only the shadow
const shadowLight = new DirectionalLight('shadow', new Vector3(0, -1, 0), scene);
shadowLight.position = new Vector3(0, 4, 0);
shadowLight.shadowMinZ = 0.1;
shadowLight.shadowMaxZ = 6;
shadowLight.autoCalcShadowZBounds = false;
shadowLight.intensity = 0;
const ground = CreateGround('ground', { width: 6, height: 6 }, scene);
const gm = new ShadowOnlyMaterial('shadowOnly', scene);
gm.activeLight = shadowLight;
gm.shadowColor = Color3.FromHexString(LIGHTS.shadow.color);
gm.alpha = LIGHTS.shadow.opacity;
ground.material = gm;
ground.receiveShadows = true;
shadowLight.includedOnlyMeshes = [ground];
dirs.forEach((d) => (d.excludedMeshes = [ground]));
hemi.excludedMeshes = [ground];
const shadows = new ShadowGenerator(hi ? 512 : 256, shadowLight);
shadows.useBlurExponentialShadowMap = true;
shadows.blurKernel = hi ? 24 : 12;

/** same material changes as the app's upgradeMaterials (src/three/CoachModel.tsx) */
function upgradeMaterials(meshes: AbstractMesh[]) {
  for (const m of meshes) {
    m.alwaysSelectAsActiveMesh = true; // the skinned body moves out of its rest bounds
    const mat = m.material as PBRMaterial | null;
    if (!mat || !(mat instanceof PBRMaterial)) continue;
    const name = mat.name.toLowerCase();
    mat.metallic = 0;
    if (name.startsWith('skin') || name.startsWith('hair')) {
      const isHair = name.startsWith('hair');
      mat.roughness = isHair ? 0.68 : hi ? 0.5 : 0.55;
      if (hi) {
        mat.metallicF0Factor = isHair ? 0.35 : 0.45;
        mat.sheen.isEnabled = true;
        mat.sheen.intensity = isHair ? 0.4 : 0.35;
        mat.sheen.roughness = 0.55;
        mat.sheen.color = Color3.FromHexString(isHair ? '#5a4535' : '#d08870');
        if (!isHair) {
          mat.clearCoat.isEnabled = true;
          mat.clearCoat.intensity = 0.04;
          mat.clearCoat.roughness = 0.6;
        }
      }
    } else if (name.startsWith('eyes')) mat.roughness = 0.08;
  }
}

async function main() {
  const url = modelUrl(P.coach);
  const [buf, res] = await Promise.all([
    fetch(url).then((r) => r.arrayBuffer()),
    ImportMeshAsync(url, scene),
  ]);
  timings.modelLoaded = performance.now();
  upgradeMaterials(res.meshes);
  for (const m of res.meshes) if (m.getTotalVertices() > 0) shadows.addShadowCaster(m);

  // the app's rig, on a skeleton rebuilt from the same file
  const { root, nodes } = buildSkeleton(buf);
  const rig = new CoachRig(root);
  const pairs: [TransformNode, (typeof nodes)[number]['obj']][] = [];
  for (const n of nodes) {
    const tn = scene.getTransformNodeByName(n.name);
    if (tn) pairs.push([tn, n.obj]);
  }
  timings.modelReady = performance.now();
  const sync = () => {
    for (const [tn, o] of pairs) {
      tn.position.set(o.position.x, o.position.y, o.position.z);
      if (!tn.rotationQuaternion) continue;
      tn.rotationQuaternion.set(o.quaternion.x, o.quaternion.y, o.quaternion.z, o.quaternion.w);
      tn.scaling.set(o.scale.x, o.scale.y, o.scale.z);
    }
  };

  const driver = makeDriver(rig, P.scenario);
  let fixedT: number | null = P.t === 'key' ? driver.keyTimes[0] : P.t;
  let stats: FrameStats | null = null;
  let last = performance.now();
  const world = (name: string) => {
    const tn = scene.getTransformNodeByName(nodes.find((n) => n.name.replace(/^mixamorig:?/i, '') === name)!.name)!;
    tn.computeWorldMatrix(true);
    const p = tn.getAbsolutePosition();
    return [p.x, p.y, p.z] as [number, number, number];
  };

  engine.runRenderLoop(() => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    rig.apply(fixedT === null ? driver.live(dt) : driver.poseAt(fixedT));
    sync();
    endFrame();
    stats?.tick(now);
    scene.render();
    if (!timings.firstFrame) timings.firstFrame = performance.now();
  });

  w.__lab = {
    ready: true,
    engine: 'babylon',
    timings: Object.assign(timings, glbTiming(url), { linkedBones: pairs.length }),
    keyTimes: driver.keyTimes,
    setTime: (t) => void (fixedT = t),
    joints: () => Object.fromEntries(PROBE_BONES.map((b) => [b, world(b)])),
    startStats: () => void (stats = new FrameStats()),
    stats: () => ({ ...(stats ?? new FrameStats()).summary(), drawCalls: draws.lastCalls, triangles: draws.lastTris }),
    heap,
  };
}

main().catch((e) => {
  console.error(e);
  document.title = 'ERREUR ' + e;
});
