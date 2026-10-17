import { useEffect, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { NoColorSpace, TextureLoader } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import type { GLTFLoader } from 'three-stdlib';
import { Color, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Object3D, SRGBColorSpace, Texture } from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { CoachRig } from '../engine/rig';
import { applyManga, outlineMaterial, toonMaterial } from './manga';
import { CoachMeta, Customizer } from './customize';
import { FighterLook, defaultLook } from '../editor/look';
import type { CoachId } from '../domain/types';

/**
 * Hosts that do not serve .glb files (the claude.ai preview) get the same GLB wrapped in a JSON file
 * (build with VITE_COACH_FORMAT=json, see scripts/glb-to-json.mjs).
 */
const JSON_MODELS = import.meta.env.VITE_COACH_FORMAT === 'json';
const EXT = JSON_MODELS ? 'json' : 'glb';

export type CoachStyle = 'manga' | 'realiste';

export function coachUrl(coach: CoachId, style: CoachStyle) {
  const who = coach === 'homme' ? 'male' : 'female';
  return `./models/coach_${who}${style === 'manga' ? '_manga' : ''}.${EXT}`;
}

function base64ToBuffer(b64: string) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

/** Loads ".json" models ({ glb: base64 }) and parses them as GLB; plain .glb files load normally. */
function patchJsonModels(loader: GLTFLoader) {
  if (!JSON_MODELS) return;
  const load = loader.load.bind(loader);
  loader.load = (url, onLoad, onProgress, onError) => {
    if (!url.endsWith('.json')) return load(url, onLoad, onProgress, onError);
    fetch(url)
      .then((r) => r.json() as Promise<{ glb: string }>)
      .then((j) => loader.parse(base64ToBuffer(j.glb), '', onLoad, onError))
      .catch((e) => onError?.(e));
  };
}

const DRACO = './draco/';

export function preloadCoaches() {
  for (const c of ['homme', 'femme'] as const) useGLTF.preload(coachUrl(c, 'manga'), DRACO, true, patchJsonModels);
}

/** Upgrade the exported materials: physically based skin with a soft sheen, matte fabrics. */
function upgradeMaterials(root: Object3D, quality: 'haute' | 'basse') {
  root.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    mesh.frustumCulled = false;
    mesh.castShadow = false;
    // self-shadowing from the shadow map draws hard crescents on the torso; the baked AO and the contact shadow look better
    mesh.receiveShadow = false;
    const old = mesh.material as MeshStandardMaterial;
    const name = (old.name || '').toLowerCase();
    if (name.startsWith('skin') || name.startsWith('hair')) {
      const map = old.map as Texture | null;
      if (map) map.colorSpace = SRGBColorSpace;
      const isHair = name.startsWith('hair');
      const mat =
        quality === 'haute'
          ? new MeshPhysicalMaterial({
              name: old.name,
              map,
              roughness: isHair ? 0.68 : 0.5,
              metalness: 0,
              sheen: isHair ? 0.4 : 0.35,
              sheenRoughness: 0.55,
              sheenColor: new Color(isHair ? '#5a4535' : '#d08870'),
              specularIntensity: isHair ? 0.35 : 0.45,
              clearcoat: isHair ? 0 : 0.04,
              clearcoatRoughness: 0.6,
            })
          : new MeshStandardMaterial({ name: old.name, map, roughness: 0.55, metalness: 0 });
      mesh.material = mat;
    } else if (old.isMeshStandardMaterial) {
      old.metalness = 0;
      if (name.startsWith('eyes')) old.roughness = 0.08;
    }
  });
}

const metaCache = new Map<string, { promise: Promise<void>; value?: CoachMeta; error?: unknown }>();

/** landmarks of the generated body (lips, eyes, pelvis...), loaded with suspense */
function useMeta(url: string): CoachMeta {
  let e = metaCache.get(url);
  if (!e) {
    const entry: { promise: Promise<void>; value?: CoachMeta; error?: unknown } = { promise: Promise.resolve() };
    entry.promise = fetch(url)
      .then((r) => r.json())
      .then((v) => void (entry.value = v as CoachMeta))
      .catch((err) => void (entry.error = err));
    metaCache.set(url, entry);
    e = entry;
  }
  if (e.error) throw e.error;
  if (!e.value) throw e.promise;
  return e.value;
}

const who = (c: CoachId) => (c === 'homme' ? 'male' : 'female');

/** move the knees and ankles along their bones: longer or shorter legs, same skinning */
function setLegLength(root: Object3D, f: number) {
  root.traverse((o) => {
    if (!/(Left|Right)(Leg|Foot)$/.test(o.name.replace(/^mixamorig[:]?/i, ''))) return;
    const base = (o.userData.cssBase ??= o.position.clone()) as typeof o.position;
    o.position.copy(base).multiplyScalar(f);
  });
}

export interface CoachModelProps {
  coach: CoachId;
  style: CoachStyle;
  quality: 'haute' | 'basse';
  /** fighter creator look (manga style only) */
  look?: FighterLook | null;
  /** gear drawn see-through ("Décomposer" mode) */
  ghostGear?: boolean;
  onRig: (rig: CoachRig) => void;
  /** called every frame before rendering; returns nothing, drives the rig */
  onFrame: (rig: CoachRig, dt: number) => void;
}

export function CoachModel({ coach, style, quality, look, ghostGear = false, onRig, onFrame }: CoachModelProps) {
  const gltf = useGLTF(coachUrl(coach, style), DRACO, true, patchJsonModels);
  const custom = style === 'manga';
  const meta = useMeta(`./models/coach_${who(coach)}_manga.meta.json`);
  const masks = useLoader(TextureLoader, `./models/coach_${who(coach)}_manga_masks.png`);
  const { scene, customizer } = useMemo(() => {
    const s = cloneSkinned(gltf.scene);
    upgradeMaterials(s, quality);
    if (style === 'manga') applyManga(s);
    let c: Customizer | null = null;
    if (custom) {
      masks.flipY = false;
      masks.colorSpace = NoColorSpace;
      try {
        c = new Customizer(s, meta, masks, { toon: (n, col) => toonMaterial(n, null, col), outline: outlineMaterial });
        // development hook for the screenshot scripts
        if (import.meta.env.DEV) ((window as unknown as { __cssCustomizers?: Customizer[] }).__cssCustomizers ??= []).push(c);
      } catch (e) {
        console.error(e);
      }
    }
    return { scene: s, customizer: c };
  }, [gltf, quality, style, custom, meta, masks]);
  const legLength = look?.body.legLength ?? 1;
  const rig = useMemo(() => {
    setLegLength(scene, legLength);
    scene.updateMatrixWorld(true);
    return new CoachRig(scene);
  }, [scene, legLength]);

  useEffect(() => {
    customizer?.apply(look ?? defaultLook(coach));
  }, [customizer, look, coach]);
  useEffect(() => customizer?.setGhost(ghostGear), [customizer, ghostGear]);

  useEffect(() => {
    onRig(rig);
  }, [rig, onRig]);

  useFrame((_, dt) => onFrame(rig, Math.min(dt, 0.05)));

  return <primitive object={scene} />;
}
