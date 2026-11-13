/**
 * 1.34 Human Behavior & Facial Expression Engine — what a model can do with its face, read from the names of its
 * bones and of its morph targets. The same function reads a loaded three.js model (FaceAnimator) and the JSON of a
 * GLB file (contract tests, src/three/human/__tests__/contract.test.ts), so the test checks exactly what the app uses.
 *
 * Levels:
 * - complet: the 25 expressions (ARKit names) on the face, both eyes, head and neck: every behaviour of the standard;
 * - os: no expressions, but facial bones (lids, brows, mouth corners, jaw) and both eyes: degraded face, documented;
 * - minimal: eyes or head only (gaze and head life, no expressions);
 * - aucun: no head bone at all (the generated fallback models): the body behaviour of the motion engine only.
 */
import { FACE_EXPRESSIONS } from '../face';

export type FaceLevel = 'complet' | 'os' | 'minimal' | 'aucun';

export interface FaceCapabilities {
  level: FaceLevel;
  /** ARKit expressions present among the 25 the engine uses */
  expressions: string[];
  /** missing ones (empty at level complet) */
  missingExpressions: string[];
  eyes: boolean;
  head: boolean;
  neck: boolean;
  jaw: boolean;
  lids: boolean;
  brows: boolean;
  mouthCorners: boolean;
}

/** bone names as the engine reads them: without a « mixamorig » prefix and without « : » */
export const cleanBoneName = (n: string) => n.replace(/:/g, '').replace(/^mixamorig/i, '');
/** expression names without their ARKit number (AK_12_JawOpen -> JawOpen) */
export const cleanMorphName = (n: string) => n.replace(/^AK_\d+_/, '');

export function faceCapabilities(boneNames: Iterable<string>, morphNames: Iterable<string>): FaceCapabilities {
  const bones = new Set([...boneNames].map(cleanBoneName));
  const morphs = new Set([...morphNames].map(cleanMorphName));
  const expressions = FACE_EXPRESSIONS.filter((e) => morphs.has(e));
  const missingExpressions = FACE_EXPRESSIONS.filter((e) => !morphs.has(e));
  const both = (f: (s: 'L' | 'R') => string) => bones.has(f('L')) && bones.has(f('R'));
  const caps = {
    expressions,
    missingExpressions,
    eyes: bones.has('LeftEye') && bones.has('RightEye'),
    head: bones.has('Head'),
    neck: bones.has('Neck'),
    jaw: bones.has('Face_MJaw'),
    lids: both((s) => `Face_${s}EyeBlinkTop`) && both((s) => `Face_${s}EyeBlinkBottom`),
    brows: both((s) => `Face_${s}InnerEyebrow`),
    mouthCorners: both((s) => `Face_${s}MouthCorner`),
  };
  const level: FaceLevel =
    !missingExpressions.length && caps.eyes && caps.head && caps.neck
      ? 'complet'
      : caps.eyes && caps.head && caps.lids && caps.brows && caps.mouthCorners && caps.jaw
        ? 'os'
        : caps.eyes || caps.head
          ? 'minimal'
          : 'aucun';
  return { level, ...caps };
}

/** the names of a GLB file's nodes and morph targets (its JSON chunk only: works in Node, no WebGL) */
export function glbNames(buf: Uint8Array): { bones: string[]; morphs: string[] } {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const len = view.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(buf.subarray(20, 20 + len))) as {
    nodes?: { name?: string }[];
    meshes?: { extras?: { targetNames?: string[] } }[];
  };
  const morphs = new Set<string>();
  for (const m of json.meshes ?? []) for (const t of m.extras?.targetNames ?? []) morphs.add(t);
  return { bones: (json.nodes ?? []).map((n) => n.name ?? ''), morphs: [...morphs] };
}
