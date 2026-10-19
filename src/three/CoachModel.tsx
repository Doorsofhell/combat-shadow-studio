import { useEffect, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { NoColorSpace, TextureLoader } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import type { GLTFLoader } from 'three-stdlib';
import { Color, Material, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, Object3D, SRGBColorSpace, Texture } from 'three';
import { restoreReferencePose, setLegLength } from './pose';
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

export type CoachStyle = 'manga' | 'encre' | 'realiste';

/**
 * premium (v0.23): both looks share one model (geometry, skeleton, clothes, customisation), only the
 * materials change; precedent: the v0.22 render, kept as a fallback (separate realistic model, without
 * the fighter's customisation)
 */
export type CoachRender = 'premium' | 'precedent';

export function coachUrl(coach: CoachId, style: CoachStyle, render: CoachRender = 'premium') {
  const who = coach === 'homme' ? 'male' : 'female';
  return `./models/coach_${who}${style !== 'realiste' || render === 'premium' ? '_manga' : ''}.${EXT}`;
}

/** fabric and gear of the realistic look: matte, physically based, with a soft sheen for the cloth */
function fabricMaterial(name: string, color: Color) {
  const gear = /^css-(glove|bar|mouth|hairpiece)/.test(name);
  const m = new MeshPhysicalMaterial({
    name,
    color,
    roughness: gear ? 0.42 : 0.9,
    metalness: 0,
    // the fabric sheen follows the paint colour (patterns are painted in the shader): a white sheen
    // turned black shorts grey
    sheen: gear ? 0 : 0.35,
    sheenRoughness: 0.8,
    sheenColor: new Color(0.25, 0.25, 0.25),
    clearcoat: gear ? 0.3 : 0,
    clearcoatRoughness: 0.4,
    specularIntensity: gear ? 0.6 : 0.25,
  });
  return m;
}

/** no outline in the realistic look (the customiser still builds one per layer) */
const noOutline = () => {
  const m = new MeshBasicMaterial();
  m.visible = false;
  return m;
};

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
              // anatomical relief (furrows between the muscles) baked by the generator, skin only
              normalMap: old.normalMap,
              normalScale: old.normalScale,
              roughness: isHair ? 0.68 : 0.5,
              metalness: 0,
              sheen: isHair ? 0.4 : 0.35,
              sheenRoughness: 0.55,
              sheenColor: new Color(isHair ? '#5a4535' : '#d08870'),
              specularIntensity: isHair ? 0.35 : 0.45,
              clearcoat: isHair ? 0 : 0.04,
              clearcoatRoughness: 0.6,
            })
          : new MeshStandardMaterial({ name: old.name, map, normalMap: old.normalMap, normalScale: old.normalScale, roughness: 0.55, metalness: 0 });
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

export interface CoachModelProps {
  coach: CoachId;
  style: CoachStyle;
  quality: 'haute' | 'basse';
  /** v0.23 render or the previous one (fallback) */
  render?: CoachRender;
  /** fighter creator look (every style of the premium render; ink styles only in the previous one) */
  look?: FighterLook | null;
  /** gear drawn see-through ("Décomposer" mode) */
  ghostGear?: boolean;
  onRig: (rig: CoachRig) => void;
  /** called every frame before rendering; returns nothing, drives the rig */
  onFrame: (rig: CoachRig, dt: number) => void;
}

export function CoachModel({ coach, style, quality, look, render = 'premium', ghostGear = false, onRig, onFrame }: CoachModelProps) {
  const gltf = useGLTF(coachUrl(coach, style, render), DRACO, true, patchJsonModels);
  const premium = render === 'premium';
  const custom = style !== 'realiste' || premium;
  const meta = useMeta(`./models/coach_${who(coach)}_manga.meta.json`);
  const masks = useLoader(TextureLoader, `./models/coach_${who(coach)}_manga_masks.png`);
  // one skeleton per model: changing the look swaps the materials only, so the rig, the player and the
  // animation in progress are kept (no remount, the session goes on)
  const base = useMemo(() => {
    const s = cloneSkinned(gltf.scene);
    const own = new Set<Object3D>();
    const materials = new Map<Mesh, Material>();
    s.traverse((o) => {
      own.add(o);
      if ((o as Mesh).isMesh) materials.set(o as Mesh, (o as Mesh).material as Material);
    });
    restoreReferencePose(s); // records the reference pose before any animation
    return { scene: s, own, materials };
  }, [gltf]);
  const scene = base.scene;
  const customizer = useMemo(() => {
    const s = base.scene;
    // back to the loaded materials: outlines, clothes and gear of the previous look are removed
    const added: Object3D[] = [];
    s.traverse((o) => void (!base.own.has(o) && added.push(o)));
    for (const o of added) {
      o.removeFromParent();
      o.traverse((c) => {
        const m = (c as Mesh).material as Material | undefined;
        if (m) m.dispose();
      });
    }
    base.materials.forEach((m, mesh) => {
      mesh.material = m.clone();
      mesh.visible = true;
    });
    upgradeMaterials(s, quality);
    // premium: Encre and the older Manga choice are both drawn with the clean cel shading
    const ink = premium ? 'cel' : style === 'encre' ? 'encre' : 'manga';
    if (style !== 'realiste') applyManga(s, ink);
    let c: Customizer | null = null;
    if (custom) {
      masks.flipY = false;
      masks.colorSpace = NoColorSpace;
      try {
        const opts =
          style === 'realiste'
            ? { toon: (n: string, col: Color) => (quality === 'haute' ? fabricMaterial(n, col) : new MeshStandardMaterial({ name: n, color: col, roughness: 0.8, metalness: 0 })), outline: noOutline }
            : { toon: (n: string, col: Color) => toonMaterial(n, null, col, ink), outline: (w: number) => (ink !== 'manga' ? outlineMaterial(w * 1.25, '#1b1d22') : outlineMaterial(w)) };
        c = new Customizer(s, meta, masks, { ...opts, legacy: !premium });
        // development hook for the screenshot scripts
        if (import.meta.env.DEV) ((window as unknown as { __cssCustomizers?: Customizer[] }).__cssCustomizers ??= []).push(c);
      } catch (e) {
        console.error(e);
      }
    }
    return c;
  }, [base, quality, style, custom, premium, meta, masks]);
  const legLength = look?.body.legLength ?? 1;
  const rig = useMemo(() => {
    restoreReferencePose(scene);
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
