import { useEffect, useMemo, useState } from 'react';
import { useLoader } from '@react-three/fiber';
import { NoColorSpace, TextureLoader } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import type { GLTFLoader } from 'three-stdlib';
import { Color, Material, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, Object3D, SRGBColorSpace, Texture } from 'three';
import { restoreReferencePose, setLegLength } from './pose';
import { PhotoCoach } from './PhotoCoach';
import type { OutfitId, OutfitStatus } from './outfit';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { CoachRig } from '../engine/rig';
import { applyManga, outlineMaterial, toonMaterial } from './manga';
import { CoachMeta, Customizer } from './customize';
import type { AtlasRects } from './groom';
import HAIR_RECTS from './hair_atlas.json';
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

/** knitted or woven clothes (the rest is padded gear: gloves, shin guards, helmets...) */
const CLOTH = /^css-(short|legging|rashguard|compression|tshirt|debardeur|brassiere|bandes|sous-gants)/;

/**
 * fabric and gear of the realistic look: matte, physically based, with a soft sheen for the cloth; the
 * clothes get the fabric detail of the paint shader (CSS_FABRIC: folds, knit, seams, topstitching)
 */
function fabricMaterial(name: string, color: Color) {
  const gear = /^css-(glove|bar|mouth|hairpiece)/.test(name);
  const cloth = CLOTH.test(name);
  const m = new MeshPhysicalMaterial({
    name,
    color,
    roughness: gear ? 0.42 : cloth ? 0.82 : 0.9,
    metalness: 0,
    // the fabric sheen follows the paint colour (patterns are painted in the shader, see FABRIC_LIGHT):
    // a white sheen turned black shorts grey
    sheen: gear ? 0 : cloth ? 1 : 0.35,
    sheenRoughness: cloth ? 0.7 : 0.8,
    sheenColor: new Color(0.25, 0.25, 0.25),
    clearcoat: gear ? 0.3 : 0,
    clearcoatRoughness: 0.4,
    // cloth: a weak, broad reflection; the broad highlight of a stronger one read as plastic
    specularIntensity: gear ? 0.6 : cloth ? 0.14 : 0.25,
  });
  if (cloth) m.defines = { ...m.defines, CSS_FABRIC: '' };
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
function upgradeMaterials(root: Object3D, quality: 'haute' | 'basse', shadows = false) {
  root.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    mesh.frustumCulled = false;
    // v0.29: soft self-shadows (PCF soft, normal bias) in the realistic look, high quality; before, the
    // hard shadow map drew crescents on the torso and was turned off
    mesh.castShadow = shadows;
    mesh.receiveShadow = shadows;
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
      // v0.29: wet but not a mirror: at 0.08 the studio room reflected as grey blotches on the whites
      if (name.startsWith('eyes')) {
        old.roughness = 0.2;
        old.envMapIntensity = 0.35;
      }
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
  /** a champion-inspired coach's own model (path without extension, e.g. ./coaches/mma-kadir/model) */
  model?: string;
  onRig: (rig: CoachRig) => void;
  /** called every frame before rendering; returns nothing, drives the rig */
  onFrame: (rig: CoachRig, dt: number) => void;
  /** v0.31: discipline outfit of the Ultra-réaliste coaches (null: none) and its loading state */
  outfit?: OutfitId | null;
  onOutfit?: (s: OutfitStatus) => void;
}

interface TexEntry {
  tex: Texture | null;
  failed: boolean;
  waiting: ((t: Texture | null) => void)[];
}
const texCache = new Map<string, TexEntry>();

/**
 * an optional texture of the realistic look (hair cards, skin detail), loaded once on the side: null while
 * loading and if it fails, the coach is drawn without it (painted hair, plain skin) meanwhile
 */
function useOptionalTexture(url: string, wanted: boolean, what: string) {
  const e0 = texCache.get(url);
  const [tex, setTex] = useState<Texture | null>(e0?.tex ?? null);
  useEffect(() => {
    let e = texCache.get(url);
    if (!e) texCache.set(url, (e = { tex: null, failed: false, waiting: [] }));
    if (!wanted || e.tex || e.failed) {
      if (e.tex) setTex(e.tex);
      return;
    }
    let live = true;
    const entry = e;
    entry.waiting.push((t) => live && setTex(t));
    if (entry.waiting.length === 1)
      new TextureLoader().load(
        url,
        (t) => {
          t.colorSpace = NoColorSpace;
          t.anisotropy = 4;
          entry.tex = t;
          entry.waiting.splice(0).forEach((f) => f(t));
        },
        undefined,
        (err) => {
          console.warn(`${what} indisponible, rendu de secours utilisé`, err);
          entry.failed = true;
          entry.waiting.splice(0).forEach((f) => f(null));
        },
      );
    return () => {
      live = false;
    };
  }, [url, wanted, what]);
  return wanted ? tex : null;
}

export function CoachModel(props: CoachModelProps) {
  // v0.29: the Ultra-réaliste look of the champion coaches is a photo-textured avatar (PhotoCoach); the
  // generated model stays for the Anime look and as the fallback (?photo=0 in development)
  const { model, style, render = 'premium', quality } = props;
  // VITE_PHOTO_COACH=0 at build time: the generated models everywhere (comparisons, fallback build)
  const noPhoto = import.meta.env.VITE_PHOTO_COACH === '0' || (import.meta.env.DEV && typeof location !== 'undefined' && /[?&]photo=0/.test(location.search + location.hash));
  if (model && style === 'realiste' && render === 'premium' && !noPhoto)
    return (
      <PhotoCoach
        url={`${model.replace(/model$/, 'photo')}.${EXT}`}
        outfitUrl={props.outfit ? `${model.replace(/model$/, `tenues/${props.outfit}`)}.${EXT}` : null}
        outfit={props.outfit ?? null}
        onOutfit={props.onOutfit}
        quality={quality}
        legLength={props.look?.body.legLength ?? 1}
        shadows={quality === 'haute'}
        onRig={props.onRig}
        onFrame={props.onFrame}
        draco={DRACO}
        extendLoader={patchJsonModels}
      />
    );
  return <GeneratedCoach {...props} />;
}

function GeneratedCoach({ coach, style, quality, look, render = 'premium', ghostGear = false, model, onRig, onFrame }: CoachModelProps) {
  const own = model && render === 'premium' ? model : null;
  const gltf = useGLTF(own ? `${own}.${EXT}` : coachUrl(coach, style, render), DRACO, true, patchJsonModels);
  const premium = render === 'premium';
  const custom = style !== 'realiste' || premium;
  const meta = useMeta(own ? `${own}.meta.json` : `./models/coach_${who(coach)}_manga.meta.json`);
  const maskUrl = own ? `${own}_masks.png` : `./models/coach_${who(coach)}_manga_masks.png`;
  const masks = useLoader(TextureLoader, maskUrl);
  // face paint: champion coaches only (the hook always loads something; the masks are already cached)
  const face = useLoader(TextureLoader, own ? `${own}_face.png` : maskUrl);
  // hair cards of the realistic look (v0.29): champion coaches only. Loaded on the side: until it is
  // there (or if it cannot be loaded) the coach keeps the painted hair
  // (?groom=0 in development: the painted hair of v0.28, for before/after captures)
  const noGroom = import.meta.env.DEV && typeof location !== 'undefined' && new URLSearchParams(location.search).get('groom') === '0';
  const hairAtlas = useOptionalTexture('./groom/hair_atlas.png', !!own && style === 'realiste' && !noGroom, 'Cheveux réalistes');
  const skinDetail = useOptionalTexture('./skin/skin_detail.png', style === 'realiste' && premium, 'Grain de peau');
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
    upgradeMaterials(s, quality, style === 'realiste' && premium && quality === 'haute');
    // premium: Encre and the older Manga choice are both drawn with the clean cel shading
    // premium: Encre (labelled Anime) and the older Manga choice are both drawn in the anime look
    const ink = premium ? 'anime' : style === 'encre' ? 'encre' : 'manga';
    if (style !== 'realiste') applyManga(s, ink);
    let c: Customizer | null = null;
    if (custom) {
      masks.flipY = false;
      masks.colorSpace = NoColorSpace;
      face.flipY = false;
      face.colorSpace = NoColorSpace;
      try {
        const opts =
          style === 'realiste'
            ? { toon: (n: string, col: Color) => (quality === 'haute' ? fabricMaterial(n, col) : new MeshStandardMaterial({ name: n, color: col, roughness: 0.8, metalness: 0 })), outline: noOutline }
            : { toon: (n: string, col: Color) => toonMaterial(n, null, col, ink), outline: (w: number) => (ink !== 'manga' ? outlineMaterial(w * 1.25, '#1b1d22') : outlineMaterial(w)) };
        const groom =
          own && style === 'realiste' && hairAtlas
            ? { atlas: hairAtlas, rects: HAIR_RECTS as AtlasRects, style: own.includes('amara') ? 'degrade' : 'court-barbe', density: quality === 'basse' ? 0.55 : 1 }
            : null;
        const realSkin = style === 'realiste' && skinDetail ? { detail: skinDetail, scatter: quality === 'haute' ? 0.32 : 0.25 } : null;
        c = new Customizer(s, meta, masks, { ...opts, legacy: !premium, face: own ? face : null, flat: ink === 'anime' ? 0.9 : 0, groom, realSkin });
        // development hook for the screenshot scripts
        if (import.meta.env.DEV) ((window as unknown as { __cssCustomizers?: Customizer[] }).__cssCustomizers ??= []).push(c);
      } catch (e) {
        console.error(e);
      }
    }
    return c;
  }, [base, quality, style, custom, premium, meta, masks, face, own, hairAtlas, skinDetail]);
  const legLength = look?.body.legLength ?? 1;
  const rig = useMemo(() => {
    restoreReferencePose(scene);
    setLegLength(scene, legLength);
    scene.updateMatrixWorld(true);
    return new CoachRig(scene);
  }, [scene, legLength]);

  const selfShadows = style === 'realiste' && premium && quality === 'haute';
  useEffect(() => {
    customizer?.apply(look ?? defaultLook(coach));
    // clothes and gear added by the look cast and receive the soft shadows too; hair cards only receive
    // them (their cut-out strands would cast solid card shapes)
    scene.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      const groom = m.name.startsWith('css-groom');
      m.castShadow = selfShadows && !groom;
      m.receiveShadow = selfShadows;
    });
  }, [customizer, look, coach, scene, selfShadows]);
  useEffect(() => customizer?.setGhost(ghostGear), [customizer, ghostGear]);

  useEffect(() => {
    onRig(rig);
  }, [rig, onRig]);

  useFrame((_, dt) => onFrame(rig, Math.min(dt, 0.05)));

  return <primitive object={scene} />;
}
