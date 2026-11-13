import type { GLTFLoader } from 'three-stdlib';
import { useGLTF } from '@react-three/drei';
import { PhotoCoach } from './PhotoCoach';
import { preloadOutfit, type OutfitId, type OutfitStatus } from './outfit';
import type { HumanSignals } from './human/behavior';
import type { CoachRig } from '../engine';
import type { FighterLook } from '../editor/look';
import type { CoachId } from '../domain/types';

/**
 * Hosts that do not serve .glb files (the claude.ai preview) get the same GLB wrapped in a JSON file
 * (build with VITE_COACH_FORMAT=json, see scripts/glb-to-json.mjs).
 */
const JSON_MODELS = import.meta.env.VITE_COACH_FORMAT === 'json';
const EXT = JSON_MODELS ? 'json' : 'glb';

/**
 * 1.37.9: keep Amara's original sports-underwear avatar for the "no outfit"
 * selection and during basic preview; wear her true cleaned skin ONLY while a
 * discipline outfit is selected. No other coach ever loads photo-clean.
 * The cleaned mesh retains exact original POSITION for all seven hideBody masks.
 */
export function photoAssetPath(coachId: string, outfit: OutfitId | null, extension = 'glb'): string {
  const variant = coachId === 'mma-amara' && outfit ? 'photo-clean' : 'photo';
  return `./coaches/${coachId}/${variant}.${extension}`;
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

/**
 * 1.25 chargement au démarrage: the coach's photo avatar is read once while the start screen shows (« Pesée
 * officielle »), so the first 3D screen draws it at once. Same cache key as PhotoCoach (url, Draco, loader set-up).
 */
export function preloadPhotoCoach(coachId: string, outfit: OutfitId | null = null) {
  useGLTF.preload(photoAssetPath(coachId, outfit, EXT), DRACO, true, patchJsonModels);
}

/**
 * 1.34 (Youssef, 2026-11-11: « que ça ne mette pas de temps à s'afficher lorsqu'on change de coach »): a coach and the
 * outfit of the discipline read ahead of time, while the coach screen shows another one; choosing it is then
 * immediate (no reading or decoding left, only the first image).
 */
export function prewarmCoach(coachId: string, outfit: OutfitId | null) {
  preloadPhotoCoach(coachId, outfit);
  if (outfit) preloadOutfit(`./coaches/${coachId}/tenues/${outfit}.${EXT}`, patchJsonModels);
}

export interface CoachModelProps {
  coach: CoachId;
  quality: 'haute' | 'basse';
  /** the coach's look for the discipline (the photo avatar reads its leg length) */
  look?: FighterLook | null;
  /** the champion coach's files, without extension (e.g. ./coaches/mma-kadir/model: photo.glb and tenues/ next to it) */
  model: string;
  onRig: (rig: CoachRig) => void;
  /** called every frame before rendering; returns nothing, drives the rig */
  onFrame: (rig: CoachRig, dt: number) => void;
  /** v0.31: discipline outfit of the Ultra-réaliste coaches (null: none) and its loading state */
  outfit?: OutfitId | null;
  onOutfit?: (s: OutfitStatus) => void;
  /** 1.34 signals of the session for the coach's behaviour (src/three/human/behavior.ts) */
  human?: HumanSignals;
}

/**
 * The 3D coach: the champion's photo-textured avatar (PhotoCoach), the Ultra-réaliste look. 1.37 (Youssef,
 * 2026-11-12 « ne garder que les coachs ultra-réalistes »): the only render; the generated coach (creator, render
 * « Précédente », VITE_PHOTO_COACH=0 builds) is removed and kept in « backup CS/ »
 */
export function CoachModel(props: CoachModelProps) {
  const { model, quality } = props;
  const coachId = model.match(/\/coaches\/([^/]+)\/model$/)?.[1] ?? '';
  const photoUrl = coachId
    ? photoAssetPath(coachId, props.outfit ?? null, EXT)
    : `${model.replace(/model$/, 'photo')}.${EXT}`;
  return (
    <PhotoCoach
      url={photoUrl}
      outfitUrl={props.outfit ? `${model.replace(/model$/, `tenues/${props.outfit}`)}.${EXT}` : null}
      outfit={props.outfit ?? null}
      onOutfit={props.onOutfit}
      quality={quality}
      legLength={props.look?.body.legLength ?? 1}
      shadows={quality === 'haute'}
      onRig={props.onRig}
      onFrame={props.onFrame}
      human={props.human}
      draco={DRACO}
      extendLoader={patchJsonModels}
    />
  );
}
