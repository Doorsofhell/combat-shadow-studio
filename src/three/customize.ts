/**
 * Fighter creator, runtime layer. The generated base bodies (one per sex) are customised on the
 * device, without new 3D files:
 * - shape: every body vertex carries region weights (arms, chest, abs, jaw...) computed from its
 *   skinning and position; the vertex shader pushes it along its normal by the slider amounts,
 *   before skinning, so the shape follows every animation;
 * - skin, eyes, hair, beard, body hair and tattoos are painted in the skin shader from the rest
 *   position (tattoos are projected decals, so they stay in place on the moving body);
 * - clothes and soft gear are shells cut from the body itself: they reuse its skinning and its
 *   region weights, so they follow the animations and the body shape without separate rigging;
 * - rigid gear (boxing gloves, headgear bar, mouthguard) and hair pieces (bun, ponytail, braids)
 *   are attached to the hand or head bone.
 */
import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  LatheGeometry,
  Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  SkinnedMesh,
  SphereGeometry,
  Texture,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  Vector4,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { FighterLook, Paint, Pattern, Tattoo, TattooZone } from '../editor/look';
import { TATTOO_DESIGNS, tattooAtlas } from '../editor/tattoos';

export interface CoachMeta {
  eyeL: number[];
  eyeR: number[];
  headLow: number[];
  headTop: number[];
  neck: number[];
  pelvis: number[];
  mouth: number[];
  knee: number[];
  lipsY: number;
  nippleY: number;
  nippleX: number;
  shoulderX: number;
  faceZ: number;
  K: number;
}

const v3 = (a: number[]) => new Vector3(a[0], a[1], a[2]);
/** centre of the lips (the MakeHuman 'mouth' joint is inside the head) */
export const mouthOf = (m: CoachMeta) => new Vector3(0, m.lipsY, m.faceZ - 0.012);
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const PATTERN_ID: Record<Pattern, number> = { uni: 0, bande: 1, 'deux-tons': 2, carreaux: 3, camouflage: 4, flammes: 5 };
const MAX_TATTOOS = 8;
const BEARDS: Record<string, [number, number, number]> = { aucune: [0, 0, 0], ombre: [0.38, 0, 0], courte: [0.85, 0, 0], pleine: [1, 0, 0], bouc: [0.95, 1, 0], moustache: [0.95, 0, 1] };

type Chain = 'torso' | 'neck' | 'head' | 'armL' | 'armR' | 'handL' | 'handR' | 'legL' | 'legR' | 'footL' | 'footR';

/** per-vertex description of the base body, computed once per model */
export interface BodyMap {
  count: number;
  pos: Float32Array;
  nrm: Float32Array;
  chain: Chain[];
  /** weight of the distal finger segments (to leave fingertips out of wraps and MMA gloves) */
  fingerTip: Float32Array;
  armT: Float32Array;
  legT: Float32Array;
  /** sum of skin weights per bone name, for a few bones */
  w: Record<string, Float32Array>;
  bone: Record<string, Vector3>;
  meta: CoachMeta;
  armLen: number;
  legLen: number;
  waistY: number;
}

const boneKey = (n: string) => n.replace(/^mixamorig[:]?/i, '');

function chainOf(name: string): Chain {
  const n = boneKey(name);
  if (/^Head|HeadTop|Eye/.test(n)) return 'head';
  if (/^Neck/.test(n)) return 'neck';
  const side = n.startsWith('Left') ? 'L' : n.startsWith('Right') ? 'R' : '';
  if (!side) return 'torso';
  if (/Hand/.test(n)) return `hand${side}` as Chain;
  if (/ForeArm|Arm$/.test(n)) return `arm${side}` as Chain;
  if (/Foot|Toe/.test(n)) return `foot${side}` as Chain;
  if (/UpLeg|Leg$/.test(n)) return `leg${side}` as Chain;
  return 'torso'; // shoulders (clavicles)
}

/** bone positions in the mesh's own space, in the bind pose */
export function bindBonePositions(mesh: SkinnedMesh) {
  const out: Record<string, Vector3> = {};
  const inv = mesh.bindMatrixInverse;
  mesh.skeleton.bones.forEach((b, i) => {
    const m = new Matrix4().copy(mesh.skeleton.boneInverses[i]).invert();
    out[boneKey(b.name)] = new Vector3().setFromMatrixPosition(m).applyMatrix4(inv);
  });
  return out;
}

export function mapBody(mesh: SkinnedMesh, meta: CoachMeta): BodyMap {
  const g = mesh.geometry;
  const pos = g.getAttribute('position').array as Float32Array;
  const nrm = g.getAttribute('normal').array as Float32Array;
  const si = g.getAttribute('skinIndex');
  const sw = g.getAttribute('skinWeight');
  const count = g.getAttribute('position').count;
  const names = mesh.skeleton.bones.map((b) => boneKey(b.name));
  const bone = bindBonePositions(mesh);
  const track = [
    'LeftArm',
    'RightArm',
    'LeftForeArm',
    'RightForeArm',
    'LeftShoulder',
    'RightShoulder',
    'LeftUpLeg',
    'RightUpLeg',
    'LeftLeg',
    'RightLeg',
    'Neck',
    'Head',
    'Hips',
    'Spine',
    'Spine1',
    'Spine2',
  ];
  const w: Record<string, Float32Array> = {};
  for (const t of track) w[t] = new Float32Array(count);
  const chain: Chain[] = new Array(count);
  const fingerTip = new Float32Array(count);
  const armT = new Float32Array(count);
  const legT = new Float32Array(count);
  const A = { L: bone.LeftArm, R: bone.RightArm };
  const H = { L: bone.LeftHand, R: bone.RightHand };
  const U = { L: bone.LeftUpLeg, R: bone.RightUpLeg };
  const F = { L: bone.LeftFoot, R: bone.RightFoot };
  const armLen = A.L.distanceTo(H.L);
  const legLen = U.L.distanceTo(F.L);
  const p = new Vector3();
  for (let i = 0; i < count; i++) {
    const per = new Map<Chain, number>();
    for (let k = 0; k < 4; k++) {
      const wt = sw.getComponent(i, k);
      if (wt <= 0) continue;
      const n = names[si.getComponent(i, k)];
      if (w[n]) w[n][i] += wt;
      const c = chainOf(n);
      per.set(c, (per.get(c) ?? 0) + wt);
      if (/Hand(Thumb|Index|Middle|Ring|Pinky)[234]/.test(n)) fingerTip[i] += wt;
    }
    let best: Chain = 'torso';
    let bw = -1;
    per.forEach((v, c) => {
      if (v > bw) {
        bw = v;
        best = c;
      }
    });
    chain[i] = best;
    p.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
    const s = p.x >= 0 ? 'L' : 'R';
    const ax = H[s].clone().sub(A[s]);
    armT[i] = p.clone().sub(A[s]).dot(ax) / ax.lengthSq();
    const lx = F[s].clone().sub(U[s]);
    legT[i] = p.clone().sub(U[s]).dot(lx) / lx.lengthSq();
  }
  return { count, pos, nrm, chain, fingerTip, armT, legT, w, bone, meta, armLen, legLen, waistY: meta.pelvis[1] + 0.1 * meta.K };
}

/**
 * Region weights (0..1) packed in four vec4 attributes:
 * A = arms, shoulders, chest, abs · B = back, thighs, calves, glutes · C = neck, waist, jaw, cheeks ·
 * D = brow, nose, breast, forearms.
 */
export function regionWeights(b: BodyMap) {
  const { count, pos, nrm, chain, meta, w } = b;
  const A = new Float32Array(count * 4);
  const B = new Float32Array(count * 4);
  const C = new Float32Array(count * 4);
  const D = new Float32Array(count * 4);
  const K = meta.K;
  const nipY = meta.nippleY;
  const pelvisY = meta.pelvis[1];
  const neckY = meta.neck[1];
  const mouth = mouthOf(meta);
  const eye = v3(meta.eyeL);
  const shX = meta.shoulderX;
  for (let i = 0; i < count; i++) {
    const x = pos[i * 3];
    const y = pos[i * 3 + 1];
    const z = pos[i * 3 + 2];
    const nz = nrm[i * 3 + 2];
    const nx = nrm[i * 3];
    const c = chain[i];
    const front = smooth(-0.1, 0.4, nz);
    const back = smooth(0.1, -0.4, nz);
    const isArm = c === 'armL' || c === 'armR';
    const upper = (w.LeftArm[i] + w.RightArm[i]) * (isArm ? 1 : 0.5);
    const fore = w.LeftForeArm[i] + w.RightForeArm[i];
    const torso = c === 'torso' ? 1 : 0;
    // A
    A[i * 4] = Math.min(1, upper);
    A[i * 4 + 1] = Math.min(1, (w.LeftShoulder[i] + w.RightShoulder[i]) * 0.8 + upper * smooth(0.45, 0.1, Math.abs(b.armT[i])));
    A[i * 4 + 2] = torso * front * smooth(nipY - 0.13, nipY - 0.06, y) * smooth(nipY + 0.16, nipY + 0.06, y) * smooth(shX * 1.05, shX * 0.5, Math.abs(x));
    A[i * 4 + 3] = torso * front * smooth(pelvisY - 0.02, pelvisY + 0.05, y) * smooth(nipY - 0.03, nipY - 0.1, y) * smooth(0.15 * K, 0.05 * K, Math.abs(x));
    // B
    B[i * 4] = torso * back * smooth(pelvisY + 0.05, pelvisY + 0.2, y) * smooth(neckY, neckY - 0.1, y);
    const legs = c === 'legL' || c === 'legR' ? 1 : 0;
    B[i * 4 + 1] = legs * (w.LeftUpLeg[i] + w.RightUpLeg[i]) * smooth(0.0, 0.12, b.legT[i]);
    B[i * 4 + 2] = legs * (w.LeftLeg[i] + w.RightLeg[i]) * smooth(0.5, 0.65, b.legT[i]) * smooth(0.95, 0.8, b.legT[i]) * (0.6 + 0.4 * back);
    B[i * 4 + 3] = (torso + legs * 0.6) * back * smooth(pelvisY - 0.16, pelvisY - 0.08, y) * smooth(pelvisY + 0.06, pelvisY - 0.02, y);
    // C
    C[i * 4] = Math.min(1, w.Neck[i]) * (c === 'head' ? 0 : 1);
    C[i * 4 + 1] =
      torso * smooth(0.3, 0.8, Math.abs(nx)) * smooth(pelvisY - 0.04, pelvisY + 0.03, y) * smooth(pelvisY + 0.22, pelvisY + 0.12, y) +
      torso * front * 0.6 * smooth(pelvisY - 0.02, pelvisY + 0.05, y) * smooth(nipY - 0.04, nipY - 0.12, y);
    const head = c === 'head' ? 1 : 0;
    C[i * 4 + 2] = head * smooth(0.0, 0.5, nz + 0.3) * smooth(mouth.y + 0.02 * K, mouth.y - 0.005 * K, y) * smooth(mouth.y - 0.075 * K, mouth.y - 0.04 * K, y);
    C[i * 4 + 3] = head * front * smooth(0.018 * K, 0.04 * K, Math.abs(x)) * smooth(mouth.y, mouth.y + 0.02 * K, y) * smooth(eye.y - 0.005 * K, eye.y - 0.025 * K, y);
    // D
    D[i * 4] = head * front * smooth(eye.y + 0.004 * K, eye.y + 0.016 * K, y) * smooth(eye.y + 0.045 * K, eye.y + 0.028 * K, y) * smooth(0.075 * K, 0.04 * K, Math.abs(x));
    D[i * 4 + 1] =
      head *
      front *
      smooth(0.02 * K, 0.006 * K, Math.abs(x)) *
      smooth(mouth.y + 0.012 * K, mouth.y + 0.025 * K, y) *
      smooth(eye.y, eye.y - 0.012 * K, y) *
      smooth(meta.faceZ - 0.035 * K, meta.faceZ - 0.01, z);
    D[i * 4 + 2] =
      torso * front * smooth(nipY - 0.1, nipY - 0.04, y) * smooth(nipY + 0.1, nipY + 0.03, y) * smooth(meta.nippleX + 0.08, meta.nippleX + 0.02, Math.abs(x)) * smooth(0.0, 0.03, Math.abs(x));
    D[i * 4 + 3] = Math.min(1, fore) * smooth(0.95, 0.75, b.armT[i]);
  }
  return { A, B, C, D };
}

// ----------------------------------------------------------------------------- shaders

export interface CustomUniforms {
  uShapeA: { value: Vector4 };
  uShapeB: { value: Vector4 };
  uShapeC: { value: Vector4 };
  uShapeD: { value: Vector4 };
  uDefA: { value: Vector4 };
  uDefB: { value: Vector4 };
  uSkinTone: { value: Color };
  uSkinRef: { value: Color };
  uHairColor: { value: Color };
  uHairCover: { value: number };
  uBeardColor: { value: Color };
  uBeard: { value: Vector4 };
  uBodyHair: { value: number };
  uMouth: { value: Vector3 };
  uK: { value: number };
  uMasks: { value: Texture | null };
  uTatN: { value: number };
  uTatA: { value: Vector3[] };
  uTatU: { value: Vector3[] };
  uTatV: { value: Vector3[] };
  uTatP: { value: Vector4[] };
  uTatQ: { value: Vector4[] };
  uTatC: { value: Vector4[] };
  uTatAtlas: { value: Texture | null };
  uEyeColor: { value: Color };
  uHairStyle: { value: Vector4 };
  uHairLen: { value: number };
  uHeadC: { value: Vector3 };
  uGhost: { value: number };
}

export function makeUniforms(meta: CoachMeta): CustomUniforms {
  const arr = <T>(f: () => T) => Array.from({ length: MAX_TATTOOS }, f);
  return {
    uShapeA: { value: new Vector4() },
    uShapeB: { value: new Vector4() },
    uShapeC: { value: new Vector4() },
    uShapeD: { value: new Vector4() },
    uDefA: { value: new Vector4() },
    uDefB: { value: new Vector4() },
    uSkinTone: { value: new Color(1, 1, 1) },
    uSkinRef: { value: new Color(1, 1, 1) },
    uHairColor: { value: new Color('#1c1512') },
    uHairCover: { value: 1 },
    uBeardColor: { value: new Color('#1c1512') },
    uBeard: { value: new Vector4() },
    uBodyHair: { value: 0 },
    uMouth: { value: mouthOf(meta) },
    uK: { value: meta.K },
    uMasks: { value: null },
    uTatN: { value: 0 },
    uTatA: { value: arr(() => new Vector3()) },
    uTatU: { value: arr(() => new Vector3()) },
    uTatV: { value: arr(() => new Vector3()) },
    uTatP: { value: arr(() => new Vector4()) },
    uTatQ: { value: arr(() => new Vector4()) },
    uTatC: { value: arr(() => new Vector4()) },
    uTatAtlas: { value: null },
    uEyeColor: { value: new Color('#4a2f1e') },
    uHairStyle: { value: new Vector4(1, 1, 1, 0) },
    uHairLen: { value: 0.5 },
    uHeadC: { value: v3(meta.headLow).lerp(v3(meta.headTop), 0.5) },
    uGhost: { value: 1 },
  };
}

const SHAPE_VERTEX_HEAD = /* glsl */ `
attribute vec4 aRegA;
attribute vec4 aRegB;
attribute vec4 aRegC;
attribute vec4 aRegD;
uniform vec4 uShapeA;
uniform vec4 uShapeB;
uniform vec4 uShapeC;
uniform vec4 uShapeD;
uniform vec4 uDefA;
uniform vec4 uDefB;
varying vec3 vRest;
varying vec3 vRestN;
varying float vDef;
`;

const SHAPE_VERTEX_BODY = /* glsl */ `
#include <begin_vertex>
transformed += normal * (dot(aRegA, uShapeA) + dot(aRegB, uShapeB) + dot(aRegC, uShapeC) + dot(aRegD, uShapeD));
vRest = transformed;
vRestN = normal;
vDef = clamp(dot(aRegA, uDefA) + dot(aRegB, uDefB), 0.0, 1.5);
`;

const SKIN_FRAGMENT_HEAD = /* glsl */ `
varying vec3 vRest;
varying vec3 vRestN;
varying float vDef;
uniform vec3 uSkinTone;
uniform vec3 uSkinRef;
uniform vec3 uHairColor;
uniform float uHairCover;
uniform vec3 uBeardColor;
uniform vec4 uBeard;
uniform float uBodyHair;
uniform vec3 uMouth;
uniform float uK;
uniform sampler2D uMasks;
uniform int uTatN;
uniform vec3 uTatA[${MAX_TATTOOS}];
uniform vec3 uTatU[${MAX_TATTOOS}];
uniform vec3 uTatV[${MAX_TATTOOS}];
uniform vec4 uTatP[${MAX_TATTOOS}];
uniform vec4 uTatQ[${MAX_TATTOOS}];
uniform vec4 uTatC[${MAX_TATTOOS}];
uniform sampler2D uTatAtlas;
float cssHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float beardRegion(vec3 p) {
  float r = 1.0;
  // goatee: chin and the corners of the mouth only
  if (uBeard.y > 0.5) r = smoothstep(0.04 * uK, 0.022 * uK, abs(p.x)) * step(p.y, uMouth.y + 0.02 * uK);
  // moustache: upper lip only
  if (uBeard.z > 0.5) r = smoothstep(0.034 * uK, 0.024 * uK, abs(p.x)) * step(uMouth.y + 0.002 * uK, p.y) * step(p.y, uMouth.y + 0.022 * uK);
  return r;
}
`;

const SKIN_FRAGMENT_BODY = /* glsl */ `
#include <map_fragment>
{
  const vec3 W = vec3(0.299, 0.587, 0.114);
  vec3 base = diffuseColor.rgb;
  vec3 c = base * (uSkinTone / max(uSkinRef, vec3(0.01)));
  // muscle definition: deepen the baked occlusion where the user asks for it
  float lum = dot(base, W) / max(dot(uSkinRef, W), 0.01);
  c *= max(0.35, 1.0 + (lum - 1.0) * vDef * 1.4);
  vec4 mk = texture2D(uMasks, vMapUv);
  float n = cssHash(floor(vMapUv * 2048.0));
  float hair = clamp(mk.r * uHairCover * (0.75 + 0.25 * n), 0.0, 1.0);
  c = mix(c, uHairColor * (0.7 + 0.6 * n), hair);
  float beard = mk.b * uBeard.x * beardRegion(vRest);
  c = mix(c, uBeardColor * (0.7 + 0.6 * n), clamp(beard * (0.55 + 0.45 * n), 0.0, 1.0));
  c = mix(c, uHairColor, mk.a * uBodyHair * step(0.6, n) * 0.8);
  for (int i = 0; i < ${MAX_TATTOOS}; i++) {
    if (i >= uTatN) break;
    vec3 q = vRest - uTatA[i];
    vec2 uv;
    float facing = 1.0;
    if (uTatP[i].x > 0.5) {
      // around a limb: u = arc length around its axis, v = along it
      vec3 ax = uTatV[i];
      float along = dot(q, ax);
      vec3 rad = q - ax * along;
      vec3 side = cross(ax, uTatU[i]);
      float ang = atan(dot(rad, side), dot(rad, uTatU[i]));
      uv = vec2(ang * uTatP[i].y, along);
      facing = step(length(rad), uTatP[i].y * 2.0);
    } else {
      vec3 nn = cross(uTatU[i], uTatV[i]);
      uv = vec2(dot(q, uTatU[i]), dot(q, uTatV[i]));
      facing = smoothstep(0.05, 0.35, dot(normalize(vRestN), nn)) * step(abs(dot(q, nn)), 0.12);
    }
    uv -= uTatQ[i].xy;
    uv = mat2(uTatP[i].z, -uTatP[i].w, uTatP[i].w, uTatP[i].z) * uv / max(uTatQ[i].z, 0.01) + 0.5;
    if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) {
      float cell = floor(uTatQ[i].w + 0.5);
      vec2 at = (vec2(mod(cell, 4.0), floor(cell / 4.0)) + clamp(uv, 0.01, 0.99)) / 4.0;
      float ink = texture2D(uTatAtlas, at).a * facing;
      c = mix(c, uTatC[i].rgb * mix(1.0, lum, 0.4), clamp(ink * uTatC[i].a, 0.0, 1.0));
    }
  }
  diffuseColor.rgb = c;
}
`;

const EYE_FRAGMENT = /* glsl */ `
#include <map_fragment>
{
  vec3 c = diffuseColor.rgb;
  float mx = max(c.r, max(c.g, c.b));
  float sat = mx - min(c.r, min(c.g, c.b));
  float iris = smoothstep(0.02, 0.08, sat) * step(0.02, mx);
  diffuseColor.rgb = mix(c, uEyeColor * (0.35 + 2.2 * dot(c, vec3(0.3, 0.59, 0.11))), iris);
}
`;

const HAIR_VERTEX = /* glsl */ `
#include <begin_vertex>
{
  float cover = texture2D(uMasks, uv).r;
  vec3 h = position - uHeadC;
  float top = smoothstep(-0.01, 0.07, h.y);
  float side = smoothstep(0.035, 0.075, abs(h.x));
  float back = smoothstep(0.0, 0.07, -h.z);
  float prof = max(max(top * uHairStyle.x, side * uHairStyle.y), back * uHairStyle.z);
  if (uHairStyle.w > 0.5) {
    // crest: a strip on the top of the head, the sides shaved (pushed under the scalp)
    float strip = smoothstep(0.03, 0.012, abs(h.x));
    prof = strip * (0.4 + top);
    transformed -= normal * 0.014 * (1.0 - strip);
  }
  transformed += normal * uHairLen * prof * cover;
}
`;

const PAINT_HEAD = /* glsl */ `
varying vec3 vRest;
varying vec3 vRestN;
varying float vCover;
varying float vHem;
uniform vec3 uColor;
uniform vec3 uColor2;
uniform float uPattern;
uniform float uBandY;
uniform float uHemY;
uniform float uGhost;
vec3 cssPaint(vec3 p, vec3 n) {
  int pat = int(uPattern + 0.5);
  float m = 0.0;
  if (pat == 1) {
    // side stripe, anti-aliased (the draped cloth normal is smooth, so the edge is a clean line)
    float ax = abs(normalize(n).x);
    float w = max(fwidth(ax), 1e-3);
    m = smoothstep(0.82 - w, 0.82 + w, ax);
  }
  else if (pat == 2) m = step(0.0, p.x);
  else if (pat == 3) m = mod(floor(p.x * 22.0) + floor(p.y * 22.0) + floor(p.z * 22.0), 2.0);
  else if (pat == 4) m = step(0.3, sin(p.x * 31.0 + sin(p.y * 17.0) * 2.0) * sin(p.y * 23.0 + p.z * 19.0) + 0.5 * sin(p.z * 41.0 + p.x * 13.0));
  else if (pat == 5) m = step((p.y - uHemY) / 0.16 + 0.22 * sin(p.x * 70.0 + p.z * 45.0) + 0.12 * sin(p.x * 140.0), 0.55);
  vec3 c = mix(uColor, uColor2, m);
  if (uBandY > 0.0 && p.y > uBandY) c = uColor2;
  return c;
}
`;

const PAINT_FRAGMENT = /* glsl */ `
#include <color_fragment>
if (vCover < 0.0) discard;
diffuseColor.rgb = cssPaint(vRest, vRestN) * mix(1.0, 0.7, vHem);
diffuseColor.a *= uGhost;
`;

/** composes a material's onBeforeCompile with another patch */
function chainPatch(m: Material, key: string, patch: (shader: { vertexShader: string; fragmentShader: string; uniforms: Record<string, unknown> }) => void) {
  const prev = m.onBeforeCompile.bind(m);
  m.onBeforeCompile = (shader, r) => {
    prev(shader, r);
    patch(shader as never);
  };
  const prevKey = m.customProgramCacheKey.bind(m);
  m.customProgramCacheKey = () => `${prevKey()}|${key}`;
  m.needsUpdate = true;
}

function addShape(shader: { vertexShader: string; uniforms: Record<string, unknown> }, u: CustomUniforms) {
  Object.assign(shader.uniforms, u);
  shader.vertexShader = SHAPE_VERTEX_HEAD + shader.vertexShader.replace('#include <begin_vertex>', SHAPE_VERTEX_BODY);
}

function addHide(shader: { vertexShader: string; fragmentShader: string }) {
  shader.vertexShader = 'attribute float aHide;\nvarying float vHide;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvHide = aHide;');
  shader.fragmentShader = 'varying float vHide;\n' + shader.fragmentShader.replace('void main() {', 'void main() {\nif (vHide > 0.0) discard;');
}

function setRegions(g: BufferGeometry, r: { A: Float32Array; B: Float32Array; C: Float32Array; D: Float32Array }) {
  g.setAttribute('aRegA', new BufferAttribute(r.A, 4));
  g.setAttribute('aRegB', new BufferAttribute(r.B, 4));
  g.setAttribute('aRegC', new BufferAttribute(r.C, 4));
  g.setAttribute('aRegD', new BufferAttribute(r.D, 4));
}

function zeroRegions(g: BufferGeometry) {
  const n = g.getAttribute('position').count;
  setRegions(g, { A: new Float32Array(n * 4), B: new Float32Array(n * 4), C: new Float32Array(n * 4), D: new Float32Array(n * 4) });
}

/**
 * Surface offsets (metres along the normal) of each body region for a look: the shape sliders
 * only move the skin outwards or inwards; they never move a bone or a joint.
 */
export function shapeVectors(look: FighterLook): { A: number[]; B: number[]; C: number[]; D: number[] } {
  const b = look.body;
  const dm = b.muscle - (look.sex === 'homme' ? 1 : 0.7);
  return {
    A: [
      0.009 * dm + 0.014 * b.arms + 0.005 * b.mass,
      0.008 * dm + 0.014 * b.shoulders + 0.003 * b.mass,
      0.008 * dm + 0.014 * b.chest + 0.006 * b.mass,
      0.016 * Math.max(0, b.mass) + 0.005 * b.waist - 0.003 * Math.max(0, -b.mass),
    ],
    B: [0.007 * dm + 0.006 * b.shoulders + 0.004 * b.mass, 0.009 * dm + 0.014 * b.legs + 0.006 * b.mass, 0.006 * dm + 0.01 * b.legs, 0.006 * dm + 0.01 * b.mass + 0.004 * b.legs],
    C: [0.008 * dm + 0.014 * b.neck + 0.004 * b.mass, 0.018 * b.waist + 0.012 * b.mass, 0.006 * look.face.jaw, 0.005 * look.face.cheeks],
    D: [0.004 * look.face.brow, 0.004 * look.face.nose, look.sex === 'femme' ? 0.012 * b.chest : 0, 0.008 * dm + 0.012 * b.arms + 0.003 * b.mass],
  };
}

// ----------------------------------------------------------------------------- garments

/** signed coverage of a body vertex: > 0 covered (metres from the hem), < 0 bare */
type CoverFn = (i: number) => number;

export interface GarmentSpec {
  cover: CoverFn;
  thickness: (i: number) => number;
  /** waistband above this height, in the second colour (0 = none) */
  bandY?: number;
  hemY?: number;
  /**
   * cloth that stands off the body (boxing and thai shorts, t-shirt): the surface is smoothed so it
   * bridges the hollows between the muscles instead of following each of them (0 = skin-tight)
   */
  drape?: number;
  /** hides the skin it covers (opaque clothes): the body cannot show through when a joint bends */
  hidesBody?: boolean;
  /** strip of fabric thickness along the cut (default true) */
  hem?: boolean;
}

/** distance inside the hem from which the skin under an opaque garment is not drawn (metres) */
export const HIDE_MARGIN = 0.015;

/** builds the shell geometry of a garment from the body vertices it covers */
export function buildShell(body: BufferGeometry, map: BodyMap, spec: GarmentSpec): BufferGeometry | null {
  const index = body.getIndex();
  const n = map.count;
  const cov = new Float32Array(n);
  for (let i = 0; i < n; i++) cov[i] = spec.cover(i);
  const tris: number[] = [];
  const idx = index ? (index.array as ArrayLike<number>) : Array.from({ length: n }, (_, i) => i);
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t];
    const b = idx[t + 1];
    const c = idx[t + 2];
    if (cov[a] > 0 || cov[b] > 0 || cov[c] > 0) tris.push(a, b, c);
  }
  if (!tris.length) return null;
  const remap = new Map<number, number>();
  const used: number[] = [];
  for (const v of tris) if (!remap.has(v)) (remap.set(v, used.length), used.push(v));
  const m = used.length;
  const P = new Float32Array(m * 3);
  const N = new Float32Array(m * 3);
  const TH = new Float32Array(m);
  used.forEach((v, j) => {
    const th = spec.thickness(v);
    TH[j] = th;
    for (let k = 0; k < 3; k++) {
      N[j * 3 + k] = map.nrm[v * 3 + k];
      P[j * 3 + k] = map.pos[v * 3 + k] + map.nrm[v * 3 + k] * th;
    }
  });
  if (spec.drape)
    drapeShell(
      P,
      N,
      TH,
      used,
      tris.map((v) => remap.get(v)!),
      map,
      spec.drape,
    );

  // hem: a strip from the cloth surface down to the skin along the cut (cover = 0), so the edge has
  // the thickness of the fabric instead of a paper-thin cut
  const hem: { p: number[]; q: number[]; nrm: number[]; src: number }[] = [];
  const local = (v: number) => remap.get(v)!;
  for (let t = 0; spec.hem !== false && t < tris.length; t += 3) {
    const vs = [tris[t], tris[t + 1], tris[t + 2]];
    const cuts: { j0: number; j1: number; f: number }[] = [];
    for (let e = 0; e < 3; e++) {
      const a = vs[e];
      const b = vs[(e + 1) % 3];
      if (cov[a] > 0 !== cov[b] > 0) cuts.push({ j0: local(a), j1: local(b), f: cov[a] / (cov[a] - cov[b]) });
    }
    if (cuts.length !== 2) continue;
    const at = (c: { j0: number; j1: number; f: number }, arr: Float32Array) => [0, 1, 2].map((k) => arr[c.j0 * 3 + k] * (1 - c.f) + arr[c.j1 * 3 + k] * c.f);
    const ends = cuts.map((c) => {
      const outer = at(c, P);
      const nn = at(c, N);
      const th = TH[c.j0] * (1 - c.f) + TH[c.j1] * c.f;
      const off = [0, 1, 2].map((k) => outer[k] - (map.pos[used[c.j0] * 3 + k] * (1 - c.f) + map.pos[used[c.j1] * 3 + k] * c.f));
      const depth = Math.hypot(off[0], off[1], off[2]) || th;
      const nl = Math.hypot(nn[0], nn[1], nn[2]) || 1;
      // the inner edge sits just under the skin, so no gap shows between the hem and the body
      const inner = outer.map((x, k) => x - (nn[k] / nl) * (depth + 0.0015));
      return { outer, inner, nrm: nn.map((x) => x / nl), src: c.f < 0.5 ? c.j0 : c.j1 };
    });
    // the strip keeps the normal of the cloth: lit like the fabric next to it (a normal along the cut
    // caught the rim light and drew a pale sawtooth along every hem)
    for (const e of ends) hem.push({ p: e.outer, q: e.inner, nrm: e.nrm, src: e.src });
  }

  const extra = hem.length * 2;
  const total = m + extra;
  const g = new BufferGeometry();
  const PP = new Float32Array(total * 3);
  const NN = new Float32Array(total * 3);
  const cover = new Float32Array(total);
  PP.set(P);
  NN.set(N);
  used.forEach((v, j) => (cover[j] = cov[v]));
  const hemSrc: number[] = [];
  hem.forEach((h, i) => {
    const o = m + i * 2;
    PP.set(h.p, o * 3);
    PP.set(h.q, (o + 1) * 3);
    NN.set(h.nrm, o * 3);
    NN.set(h.nrm, (o + 1) * 3);
    cover[o] = cover[o + 1] = 0.001;
    hemSrc.push(h.src, h.src);
  });
  g.setAttribute('position', new BufferAttribute(PP, 3));
  g.setAttribute('normal', new BufferAttribute(NN, 3));
  g.setAttribute('aCover', new BufferAttribute(cover, 1));
  // 1 on the hem strip: the inside of the fabric, in its own shadow
  const hemFlag = new Float32Array(total);
  hemFlag.fill(1, m);
  g.setAttribute('aHem', new BufferAttribute(hemFlag, 1));
  const copy = (name: string) => {
    const src = body.getAttribute(name);
    if (!src) return;
    const it = src.itemSize;
    const out = new (src.array.constructor as Float32ArrayConstructor)(total * it);
    const from = (j: number) => (j < m ? used[j] : used[hemSrc[j - m]]);
    for (let j = 0; j < total; j++) {
      const v = from(j);
      for (let k = 0; k < it; k++) out[j * it + k] = (src.array as ArrayLike<number>)[v * it + k];
    }
    g.setAttribute(name, new BufferAttribute(out, it, src.normalized));
  };
  for (const a of ['uv', 'skinIndex', 'skinWeight', 'aRegA', 'aRegB', 'aRegC', 'aRegD']) copy(a);
  // body vertex under each shell vertex, and the part hidden by a garment worn over this one
  const src = new Int32Array(total);
  for (let j = 0; j < total; j++) src[j] = j < m ? used[j] : used[hemSrc[j - m]];
  g.userData.src = src;
  g.setAttribute('aHide', new BufferAttribute(new Float32Array(total), 1));
  const faces = tris.map((v) => remap.get(v)!);
  // two triangles per hem segment, both sides (the strip is seen from above and from below)
  for (let i = 0; i < hem.length; i += 2) {
    const a = m + i * 2;
    const b = a + 2;
    faces.push(a, a + 1, b + 1, a, b + 1, b, a, b + 1, a + 1, a, b, b + 1);
  }
  g.setIndex(faces);
  return g;
}

/**
 * Smooths a garment that stands off the body: a few passes of neighbour averaging over the welded
 * surface (vertices split along texture seams move together), then every point is pushed back out
 * to at least `minFrac` of its thickness above the skin, so the cloth never sinks into the body.
 */
function drapeShell(P: Float32Array, N: Float32Array, TH: Float32Array, used: number[], faces: number[], map: BodyMap, strength: number) {
  const m = used.length;
  // weld by rest position
  const key = (j: number) => `${Math.round(map.pos[used[j] * 3] * 2e4)},${Math.round(map.pos[used[j] * 3 + 1] * 2e4)},${Math.round(map.pos[used[j] * 3 + 2] * 2e4)}`;
  const ids = new Map<string, number>();
  const weld = new Int32Array(m);
  for (let j = 0; j < m; j++) {
    const k = key(j);
    if (!ids.has(k)) ids.set(k, ids.size);
    weld[j] = ids.get(k)!;
  }
  const W = ids.size;
  const nb: Set<number>[] = Array.from({ length: W }, () => new Set<number>());
  for (let t = 0; t < faces.length; t += 3)
    for (let e = 0; e < 3; e++) {
      const a = weld[faces[t + e]];
      const b = weld[faces[t + ((e + 1) % 3)]];
      if (a !== b) (nb[a].add(b), nb[b].add(a));
    }
  const pos = new Float32Array(W * 3);
  const cnt = new Float32Array(W);
  for (let j = 0; j < m; j++) {
    const w = weld[j];
    if (cnt[w]++ === 0) for (let k = 0; k < 3; k++) pos[w * 3 + k] = P[j * 3 + k];
  }
  const passes = Math.round(2 + 6 * strength);
  const next = new Float32Array(W * 3);
  for (let it = 0; it < passes; it++) {
    for (let w = 0; w < W; w++) {
      const ns = nb[w];
      if (!ns.size) {
        for (let k = 0; k < 3; k++) next[w * 3 + k] = pos[w * 3 + k];
        continue;
      }
      const avg = [0, 0, 0];
      ns.forEach((o) => {
        for (let k = 0; k < 3; k++) avg[k] += pos[o * 3 + k];
      });
      for (let k = 0; k < 3; k++) next[w * 3 + k] = pos[w * 3 + k] * 0.5 + (avg[k] / ns.size) * 0.5;
    }
    pos.set(next);
  }
  for (let j = 0; j < m; j++) {
    const w = weld[j];
    const v = used[j];
    let d = 0;
    for (let k = 0; k < 3; k++) d += (pos[w * 3 + k] - map.pos[v * 3 + k]) * N[j * 3 + k];
    // between 0.75 and 1.6 times the thickness above the skin: the cloth bridges the hollows a little,
    // never sinks into the body and never floats away from it (a top worn over it stays above it)
    const min = TH[j] * 0.75;
    const max = TH[j] * 1.6;
    const push = d < min ? min - d : d > max ? max - d : 0;
    for (let k = 0; k < 3; k++) P[j * 3 + k] = pos[w * 3 + k] + push * N[j * 3 + k];
  }
  // normals of the draped cloth, shared across the texture seams: the side stripes and the light
  // follow the cloth, not the muscles underneath
  const acc = new Float32Array(W * 3);
  const e1 = new Vector3();
  const e2 = new Vector3();
  const fn = new Vector3();
  for (let t = 0; t < faces.length; t += 3) {
    const [a, b, c] = [faces[t], faces[t + 1], faces[t + 2]];
    e1.set(P[b * 3] - P[a * 3], P[b * 3 + 1] - P[a * 3 + 1], P[b * 3 + 2] - P[a * 3 + 2]);
    e2.set(P[c * 3] - P[a * 3], P[c * 3 + 1] - P[a * 3 + 1], P[c * 3 + 2] - P[a * 3 + 2]);
    fn.crossVectors(e1, e2);
    for (const v of [a, b, c]) for (let k = 0; k < 3; k++) acc[weld[v] * 3 + k] += fn.getComponent(k);
  }
  for (let j = 0; j < m; j++) {
    const w = weld[j];
    fn.set(acc[w * 3], acc[w * 3 + 1], acc[w * 3 + 2]);
    // keep the body normal where the cloth surface is degenerate, or flipped against the body
    if (fn.lengthSq() < 1e-14 || fn.x * N[j * 3] + fn.y * N[j * 3 + 1] + fn.z * N[j * 3 + 2] <= 0) continue;
    fn.normalize();
    N[j * 3] = fn.x;
    N[j * 3 + 1] = fn.y;
    N[j * 3 + 2] = fn.z;
  }
}

/** garments worn over another one: at least 9 mm above it where both cover the body (the drape of the shorts can stand a few millimetres off) */
function layered(specs: Record<string, GarmentSpec>, under: GarmentSpec): Record<string, GarmentSpec> {
  const out: Record<string, GarmentSpec> = {};
  // eased in over 6 cm above the waistband, so the drape of the top does not pull it back under the edge;
  // the drape lets the cloth underneath stand up to 1.6 times its thickness off the skin
  const ease = (i: number) => Math.min(1, Math.max(0, (under.cover(i) + 0.06) / 0.06));
  for (const [k, sp] of Object.entries(specs)) out[k] = { ...sp, thickness: (i) => Math.max(sp.thickness(i), (under.thickness(i) * (under.drape ? 1.6 : 1) + 0.005) * ease(i)) };
  return out;
}

const clampN = (v: number) => (Number.isFinite(v) ? v : -1);

/** coverage rules of every garment and soft gear, from the body map */
export function garmentSpecs(m: BodyMap) {
  const { pos, nrm, chain, armT, legT, w, meta, armLen, legLen } = m;
  const K = meta.K;
  const pelvisY = meta.pelvis[1];
  const nipY = meta.nippleY;
  const neckY = meta.neck[1];
  const eyeY = meta.eyeL[1];
  const mouthY = meta.lipsY;
  const ankleZ = m.bone.LeftFoot.z;
  const y = (i: number) => pos[i * 3 + 1];
  const x = (i: number) => pos[i * 3];
  const z = (i: number) => pos[i * 3 + 2];
  const nz = (i: number) => nrm[i * 3 + 2];
  const ny = (i: number) => nrm[i * 3 + 1];
  const isLeg = (i: number) => chain[i] === 'legL' || chain[i] === 'legR';
  const isArm = (i: number) => chain[i] === 'armL' || chain[i] === 'armR';
  const isHand = (i: number) => chain[i] === 'handL' || chain[i] === 'handR';
  const isFoot = (i: number) => chain[i] === 'footL' || chain[i] === 'footR';
  const isTorso = (i: number) => chain[i] === 'torso';
  const toes = (i: number) => isFoot(i) && z(i) > ankleZ + 0.1 * (K / 1);
  const armW = (i: number) => w.LeftArm[i] + w.RightArm[i];

  const shorts =
    (waistTop: number, tMax: number): CoverFn =>
    (i) =>
      isTorso(i) ? Math.min(waistTop - y(i), 0.2) : isLeg(i) ? Math.min((tMax - legT[i]) * legLen, waistTop - y(i)) : -1;
  const neckZ = meta.neck[2];
  const top =
    (sleeve: number | null, low = pelvisY + 0.04): CoverFn =>
    (i) => {
      // the neckline dips in front: from the position around the neck (a normal-based dip followed
      // every bump of the mesh and gave a jagged collar)
      const front = Math.min(1, Math.max(0, (z(i) - neckZ) / 0.07));
      const collar = neckY - 0.035 - 0.04 * front;
      if (isTorso(i)) {
        let c = Math.min(y(i) - low, collar - y(i));
        if (sleeve === null) c = Math.min(c, (0.18 - armW(i)) * 0.4, meta.shoulderX * 0.95 - Math.abs(x(i)) + (nipY + 0.02 - y(i) > 0 ? 0.2 : 0));
        return c;
      }
      if (chain[i] === 'neck') return collar - y(i);
      if (isArm(i)) return sleeve === null ? -1 : (sleeve - armT[i]) * armLen;
      // the buttocks and the top of the thighs belong to the leg bones: same hem height, so the cut stays
      // a clean line instead of following the skinning boundary (jagged teeth at the lower back)
      if (isLeg(i)) return y(i) - low;
      return -1;
    };
  const sportsBra: CoverFn = (i) => {
    if (!isTorso(i)) return -1;
    const band = Math.min(y(i) - (nipY - 0.1), nipY + (nz(i) > 0 ? 0.1 : 0.02) - y(i));
    const ax = Math.abs(x(i));
    const strap = Math.min(ax - 0.045, 0.11 - ax, neckY - 0.02 - y(i), y(i) - nipY);
    return Math.max(band, strap);
  };
  const wraps =
    (thumb = true): CoverFn =>
    (i) => {
      if (isHand(i)) return m.fingerTip[i] < 0.3 || !thumb ? 0.03 - m.fingerTip[i] * 0.05 : -1;
      if (isArm(i)) return (armT[i] - 0.9) * armLen;
      return -1;
    };
  const shin =
    (t0: number, t1: number, frontOnly: boolean, instep: boolean): CoverFn =>
    (i) => {
      if (isLeg(i)) {
        const c = Math.min(legT[i] - t0, t1 - legT[i]) * legLen;
        return frontOnly ? Math.min(c, (nz(i) + 0.35) * 0.08) : c;
      }
      if (instep && isFoot(i)) return !toes(i) && ny(i) > 0.15 ? 0.02 : -1;
      return -1;
    };
  const face = (i: number, narrow: boolean) => {
    const wFace = narrow ? 0.04 : 0.066;
    return nz(i) > 0.15 && Math.abs(x(i)) < wFace * (K / 1) && y(i) < eyeY + 0.03 && y(i) > mouthY - (narrow ? 0.02 : 0.06);
  };
  const head =
    (narrow: boolean): CoverFn =>
    (i) =>
      chain[i] === 'head' && !face(i, narrow) && y(i) > mouthY - 0.05 * K ? 0.02 : -1;

  return {
    bottom: {
      'short-boxe': { cover: shorts(pelvisY + 0.12, 0.42), thickness: (i: number) => 0.01 + 0.012 * Math.max(0, legT[i]) * (isLeg(i) ? 1 : 0), bandY: pelvisY + 0.07, drape: 0.6, hidesBody: true },
      'short-mma': { cover: shorts(pelvisY + 0.07, 0.52), thickness: (i: number) => 0.009 + 0.01 * Math.max(0, legT[i]) * (isLeg(i) ? 1 : 0), bandY: pelvisY + 0.04, drape: 0.5, hidesBody: true },
      'short-thai': { cover: shorts(pelvisY + 0.13, 0.3), thickness: (i: number) => 0.009 + 0.035 * Math.max(0, legT[i]) * (isLeg(i) ? 1 : 0), bandY: pelvisY + 0.06, drape: 0.7, hidesBody: true },
      'short-compression': { cover: shorts(pelvisY + 0.06, 0.38), thickness: () => 0.0035, bandY: pelvisY + 0.035, hidesBody: true },
      legging: { cover: shorts(pelvisY + 0.07, 0.96), thickness: () => 0.0035, bandY: pelvisY + 0.04, hidesBody: true },
    } as Record<string, GarmentSpec>,
    top: {
      'rashguard-court': { cover: top(0.42), thickness: () => 0.004, hidesBody: true },
      'rashguard-long': { cover: top(0.97), thickness: () => 0.004, hidesBody: true },
      compression: { cover: top(0.97), thickness: () => 0.003, hidesBody: true },
      tshirt: { cover: top(0.3, pelvisY - 0.02), thickness: (i: number) => (isArm(i) ? 0.012 : 0.009), drape: 0.5, hidesBody: true },
      debardeur: { cover: top(null, pelvisY - 0.0), thickness: () => 0.007, drape: 0.35, hidesBody: true },
      brassiere: { cover: sportsBra, thickness: () => 0.004, hidesBody: true },
    } as Record<string, GarmentSpec>,
    shoes: {
      'chaussures-boxe': { cover: (i: number) => (isFoot(i) ? 0.05 : isLeg(i) ? (legT[i] - 0.8) * legLen : -1), thickness: () => 0.007, bandY: 0 },
      'chaussons-mma': { cover: (i: number) => (isFoot(i) && !toes(i) ? 0.02 : isLeg(i) ? (legT[i] - 0.95) * legLen : -1), thickness: () => 0.004 },
    } as Record<string, GarmentSpec>,
    hands: {
      bandes: { cover: wraps(), thickness: () => 0.004 },
      'sous-gants': { cover: wraps(), thickness: () => 0.0065 },
      'gants-mma': { cover: wraps(), thickness: (i: number) => (isHand(i) ? 0.009 : 0.011) },
    } as Record<string, GarmentSpec>,
    shins: {
      'tibias-thai': { cover: shin(0.5, 0.97, true, true), thickness: () => 0.017 },
      'tibias-mma': { cover: shin(0.48, 1.0, false, true), thickness: () => 0.008 },
    } as Record<string, GarmentSpec>,
    feet: {
      chevillères: { cover: (i: number) => (isLeg(i) ? Math.min(legT[i] - 0.86, 0.03) * legLen : isFoot(i) && !toes(i) && z(i) < ankleZ + 0.05 ? 0.02 : -1), thickness: () => 0.004 },
      'protege-pieds': { cover: (i: number) => (isFoot(i) && !toes(i) ? 0.02 : isLeg(i) ? (legT[i] - 0.92) * legLen : -1), thickness: () => 0.008 },
    } as Record<string, GarmentSpec>,
    head: {
      'casque-ouvert': { cover: head(false), thickness: () => 0.016 },
      'casque-joues': { cover: head(true), thickness: () => 0.017 },
      'casque-barre': { cover: head(false), thickness: () => 0.016 },
    } as Record<string, GarmentSpec>,
    body: {
      plastron: { cover: (i: number) => (isTorso(i) ? Math.min(y(i) - (pelvisY + 0.02), nipY + 0.12 - y(i)) : -1), thickness: () => 0.022 },
    } as Record<string, GarmentSpec>,
    clamp: clampN,
  };
}

// ----------------------------------------------------------------------------- rigid pieces

/** a mesh built in the body's bind space, attached rigidly to one bone */
function attachToBone(body: SkinnedMesh, boneName: string, geo: BufferGeometry, mat: Material) {
  const i = body.skeleton.bones.findIndex((b) => boneKey(b.name) === boneName);
  if (i < 0) return null;
  const bone = body.skeleton.bones[i];
  const mesh = new Mesh(geo, mat);
  mesh.matrixAutoUpdate = false;
  mesh.matrix.copy(body.skeleton.boneInverses[i]).multiply(body.bindMatrix);
  mesh.frustumCulled = false;
  bone.add(mesh);
  return mesh;
}

/** boxing glove around a hand in the bind pose: padded fist, thumb, cuff */
export function gloveGeometry(b: Record<string, Vector3>, side: 'Left' | 'Right') {
  const wrist = b[`${side}Hand`];
  const mid = b[`${side}HandMiddle1`] ?? wrist;
  const idx = b[`${side}HandIndex1`] ?? mid;
  const pinky = b[`${side}HandPinky1`] ?? mid;
  const axis = mid.clone().sub(wrist).normalize();
  const lateral = idx.clone().sub(pinky);
  lateral.addScaledVector(axis, -lateral.dot(axis)).normalize();
  // right-handed basis (a mirrored one turns the faces inside out and only the black outline shows)
  const palm = new Vector3().crossVectors(lateral, axis).normalize();
  const handLen = wrist.distanceTo(mid) * 2.1;
  const basis = new Matrix4().makeBasis(lateral, axis, palm);
  // about 12-14 oz: fist ~17 cm long, 13 cm wide, 12 cm deep on an adult hand
  const fist = new SphereGeometry(1, 28, 20);
  fist.scale(handLen * 0.33, handLen * 0.42, handLen * 0.3);
  fist.applyMatrix4(basis);
  fist.translate(
    ...wrist
      .clone()
      .addScaledVector(axis, handLen * 0.42)
      .toArray(),
  );
  const thumb = new SphereGeometry(1, 16, 12);
  thumb.scale(handLen * 0.11, handLen * 0.22, handLen * 0.11);
  thumb.rotateZ(0.5);
  thumb.applyMatrix4(basis);
  thumb.translate(
    ...wrist
      .clone()
      .addScaledVector(axis, handLen * 0.3)
      .addScaledVector(lateral, handLen * 0.29)
      .addScaledVector(palm, -handLen * 0.08)
      .toArray(),
  );
  const cuffPts = [new Vector2(handLen * 0.24, 0), new Vector2(handLen * 0.26, handLen * 0.22), new Vector2(handLen * 0.25, handLen * 0.5)];
  const cuff = new LatheGeometry(cuffPts, 24);
  cuff.applyMatrix4(basis);
  cuff.translate(
    ...wrist
      .clone()
      .addScaledVector(axis, -handLen * 0.3)
      .toArray(),
  );
  const parts = [fist, thumb, cuff].map((g) => {
    const ng = g.toNonIndexed();
    ng.deleteAttribute('uv');
    return ng;
  });
  return mergeGeometries(parts)!;
}

function tubeGeometry(points: Vector3[], radius: number, taper = 0.4) {
  const curve = new CatmullRomCurve3(points);
  const g = new TubeGeometry(curve, 24, radius, 10, false);
  // taper towards the tip
  const p = g.getAttribute('position');
  const c = new Vector3();
  for (let i = 0; i < p.count; i++) {
    const u = Math.floor(i / 11) / 24;
    curve.getPointAt(Math.min(1, u), c);
    const k = 1 - taper * u;
    p.setXYZ(i, c.x + (p.getX(i) - c.x) * k, c.y + (p.getY(i) - c.y) * k, c.z + (p.getZ(i) - c.z) * k);
  }
  g.computeVertexNormals();
  return g;
}

function rigidOutline(mesh: Mesh, width = 0.004) {
  const g = mesh.geometry.clone();
  const p = g.getAttribute('position');
  const nn = g.getAttribute('normal');
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + nn.getX(i) * width, p.getY(i) + nn.getY(i) * width, p.getZ(i) + nn.getZ(i) * width);
  const o = new Mesh(g, new MeshBasicMaterial({ color: '#141212', side: BackSide }));
  o.matrixAutoUpdate = false;
  o.frustumCulled = false;
  mesh.add(o);
  return o;
}

// ----------------------------------------------------------------------------- customiser

export interface CustomizerOptions {
  toon: (name: string, color: Color) => Material;
  outline: (width: number) => Material;
  /** v0.22 clothes (fallback render): no drape, no hem strip, skin drawn under the clothes */
  legacy?: boolean;
}

interface Layer {
  key: string;
  objects: Object3D[];
  uniforms: Record<string, { value: unknown }>;
}

const lin = (hex: string) => new Color(hex);

/**
 * Owns the customisation of one coach instance: shared uniforms, region attributes, garment and
 * gear layers. apply() is cheap for colours and sliders (uniforms only) and rebuilds a layer only
 * when its type changes.
 */
export class Customizer {
  readonly body: SkinnedMesh;
  readonly map: BodyMap;
  readonly u: CustomUniforms;
  private hair: SkinnedMesh | null;
  private bun: Object3D | null;
  private layers = new Map<string, Layer>();
  private specs: ReturnType<typeof garmentSpecs>;
  private hairPieces: Object3D[] = [];
  private hairPieceKey = '';
  private ghost = { value: 1 };
  private atlas: Texture | null = null;
  /** per slot: how deep each body vertex is under that slot's opaque garment (metres, > 0 hidden) */
  private hidden = new Map<string, Float32Array>();

  constructor(
    readonly root: Object3D,
    meta: CoachMeta,
    masks: Texture,
    private opt: CustomizerOptions,
  ) {
    const found: { body: SkinnedMesh | null; hair: SkinnedMesh | null; bun: Object3D | null; eyes: Mesh | null } = { body: null, hair: null, bun: null, eyes: null };
    const builtIn: Object3D[] = [];
    root.traverse((o) => {
      const m = o as SkinnedMesh;
      if (!m.isMesh) return;
      const name = ((m.material as Material).name || '').toLowerCase();
      const outline = (m.material as Material & { side?: number }).side === BackSide;
      if (outline) return;
      if (name === 'skin') found.body = m;
      else if (name === 'hair') found.hair = m;
      else if (name === 'bunhair') found.bun = m;
      else if (name.startsWith('eye')) found.eyes = m;
      else if (name === 'shorts' || name === 'top') builtIn.push(m);
    });
    const { body, hair, bun, eyes } = found;
    if (!body) throw new Error('Corps introuvable dans le modèle 3D');
    this.body = body;
    this.hair = hair;
    this.bun = bun;
    this.map = mapBody(body, meta);
    this.specs = garmentSpecs(this.map);
    this.u = makeUniforms(meta);
    this.u.uMasks.value = masks;
    this.u.uGhost = this.ghost;
    setRegions(body.geometry, regionWeights(this.map));
    // the built-in clothes of the generated model are replaced by the creator's layers
    for (const o of builtIn) this.setVisible(o, false);
    this.u.uSkinRef.value = averageSkin((body.material as MeshLambertMaterial).map);

    const u = this.u;
    // skin under opaque clothes is not drawn (> 0: hidden), see HIDE_MARGIN
    body.geometry.setAttribute('aHide', new BufferAttribute(new Float32Array(this.map.count), 1));
    chainPatch(body.material as Material, 'css-skin', (sh) => {
      addShape(sh, u);
      addHide(sh);
      sh.fragmentShader = SKIN_FRAGMENT_HEAD + sh.fragmentShader.replace('#include <map_fragment>', SKIN_FRAGMENT_BODY);
    });
    // outlines share the body geometry: same shape, same hidden parts
    root.traverse((o) => {
      const m = o as SkinnedMesh;
      if (m.isSkinnedMesh && m.geometry === body.geometry && m !== body)
        chainPatch(m.material as Material, 'css-shape', (sh) => {
          addShape(sh, u);
          addHide(sh);
        });
    });
    if (hair) {
      zeroRegions(hair.geometry);
      const hm = hair.material as MeshLambertMaterial;
      hm.map = null;
      hm.color = u.uHairColor.value;
      const patchHair = (mat: Material) =>
        chainPatch(mat, 'css-hair', (sh) => {
          addShape(sh, u);
          sh.vertexShader =
            'uniform sampler2D uMasks;\nuniform vec4 uHairStyle;\nuniform float uHairLen;\nuniform vec3 uHeadC;\n' +
            sh.vertexShader.replace('vRest = transformed;', 'vRest = transformed;').replace('#include <begin_vertex>', HAIR_VERTEX);
        });
      patchHair(hm);
      root.traverse((o) => {
        const m = o as SkinnedMesh;
        if (m.isSkinnedMesh && m.geometry === hair.geometry && m !== hair) patchHair(m.material as Material);
      });
    }
    if (eyes) {
      chainPatch(eyes.material as Material, 'css-eyes', (sh) => {
        Object.assign(sh.uniforms, { uEyeColor: u.uEyeColor });
        sh.fragmentShader = 'uniform vec3 uEyeColor;\n' + sh.fragmentShader.replace('#include <map_fragment>', EYE_FRAGMENT);
      });
    }
  }

  private setVisible(o: Object3D, v: boolean) {
    o.visible = v;
    // the outline of a skinned mesh is a sibling sharing its geometry
    o.parent?.children.forEach((c) => {
      if ((c as Mesh).geometry && (c as Mesh).geometry === (o as Mesh).geometry) c.visible = v;
    });
  }

  /** see-through gear for the "Décomposer" mode (the saved look is unchanged) */
  setGhost(on: boolean) {
    this.ghost.value = on ? 0.35 : 1;
    this.layers.forEach((l) => {
      if (!/^(hands|shins|feet|head|body|mouth)/.test(l.key)) return;
      l.objects.forEach((o) =>
        o.traverse((c) => {
          const m = (c as Mesh).material as Material | undefined;
          if (!m || (m as Material & { side?: number }).side === BackSide) {
            if (m) c.visible = !on;
            return;
          }
          m.transparent = on;
          m.depthWrite = !on;
          (m as MeshLambertMaterial).opacity = on ? 0.35 : 1;
        }),
      );
    });
  }

  apply(look: FighterLook) {
    const b = look.body;
    const u = this.u;
    const sh = shapeVectors(look);
    u.uShapeA.value.fromArray(sh.A);
    u.uShapeB.value.fromArray(sh.B);
    u.uShapeC.value.fromArray(sh.C);
    u.uShapeD.value.fromArray(sh.D);
    u.uDefA.value.set(b.defArms, b.defShoulders, (b.defAbs + b.defShoulders) / 2, b.defAbs);
    u.uDefB.value.set(b.defShoulders * 0.6, b.defLegs, b.defLegs, b.defLegs * 0.5);
    u.uSkinTone.value.copy(lin(look.skin));
    u.uEyeColor.value.copy(lin(look.eyes));
    u.uHairColor.value.copy(lin(look.hair.color));
    u.uBeardColor.value.copy(lin(look.beard.color));
    u.uBodyHair.value = look.bodyHair;
    // unknown values (older saves) fall back to none instead of breaking the coach
    const beard = BEARDS[look.beard.style] ?? BEARDS.aucune;
    u.uBeard.value.set(beard[0], beard[1], beard[2], 0);
    this.applyHair(look);
    this.applyTattoos(look.tattoos);
    this.root.scale.setScalar(b.height);

    const o = look.outfit;
    const g = look.gear;
    this.layer('bottom', o.bottom === 'aucun' ? null : o.bottom, this.specs.bottom, o.bottomPaint);
    // a top worn over shorts lies over their waistband instead of crossing it
    const under = o.bottom === 'aucun' || this.opt.legacy ? null : this.specs.bottom[o.bottom];
    this.layer('top', o.top === 'aucun' ? null : o.top, under ? layered(this.specs.top, under) : this.specs.top, o.topPaint, this.opt.legacy ? '' : o.bottom);
    if (!this.opt.legacy) this.hideUnder('bottom', o.top === 'aucun' ? null : (this.specs.top[o.top] ?? null));
    this.layer('shoes', o.shoes === 'pieds-nus' ? null : o.shoes, this.specs.shoes, o.shoesPaint);
    if (g.hands === 'gants-boxe') {
      this.layer('hands', null, this.specs.hands, g.handsPaint);
      this.rigidLayer('handsBox', 'gants-boxe', g.handsPaint, () => this.boxingGloves());
    } else {
      this.rigidLayer('handsBox', null, g.handsPaint, () => []);
      this.layer('hands', g.hands === 'aucun' ? null : g.hands, this.specs.hands, g.handsPaint);
    }
    this.layer('shins', g.shins === 'aucun' ? null : g.shins, this.specs.shins, g.shinsPaint);
    this.layer('feet', g.feet === 'aucun' ? null : g.feet, this.specs.feet, g.feetPaint);
    this.layer('head', g.head === 'aucun' ? null : g.head, this.specs.head, g.headPaint);
    this.rigidLayer('headBar', g.head === 'casque-barre' ? 'barre' : null, g.headPaint, () => this.faceBar());
    this.layer('body', g.bodyProtector ? 'plastron' : null, this.specs.body, g.bodyPaint);
    this.rigidLayer('mouth', g.mouthguard ? 'protege-dents' : null, g.mouthPaint, () => this.mouthguard());
  }

  private paintUniforms(p: Paint, spec?: GarmentSpec) {
    return {
      uColor: { value: lin(p.color) },
      uColor2: { value: lin(p.color2) },
      uPattern: { value: PATTERN_ID[p.pattern] ?? 0 },
      uBandY: { value: spec?.bandY ?? 0 },
      uHemY: { value: 0 },
    };
  }

  private layer(slot: string, type: string | null, specs: Record<string, GarmentSpec>, paint: Paint, over = '') {
    const prev = this.layers.get(slot);
    const key = type ? `${slot}:${type}${over ? `/${over}` : ''}` : '';
    if (prev && prev.key === key) {
      // colours and pattern: uniforms only
      const pu = this.paintUniforms(paint, type ? specs[type] : undefined);
      (prev.uniforms.uColor.value as Color).copy(pu.uColor.value);
      (prev.uniforms.uColor2.value as Color).copy(pu.uColor2.value);
      prev.uniforms.uPattern.value = pu.uPattern.value;
      return;
    }
    if (prev) {
      prev.objects.forEach((o) => o.removeFromParent());
      this.layers.delete(slot);
    }
    if (this.hidden.delete(slot)) this.updateHidden();
    if (!type || !specs[type]) return;
    const spec = specs[type];
    if (spec.hidesBody && !this.opt.legacy) {
      const h = new Float32Array(this.map.count);
      for (let i = 0; i < h.length; i++) h[i] = spec.cover(i) - HIDE_MARGIN;
      this.hidden.set(slot, h);
      this.updateHidden();
    }
    const geo = buildShell(this.body.geometry, this.map, this.opt.legacy ? { ...spec, drape: 0, hem: false } : spec);
    if (!geo) return;
    const uniforms = this.paintUniforms(paint, spec);
    let minY = Infinity;
    const P = geo.getAttribute('position');
    for (let i = 0; i < P.count; i++) minY = Math.min(minY, P.getY(i));
    uniforms.uHemY.value = minY;
    const mat = this.opt.toon(`css-${type}`, new Color(1, 1, 1));
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = -1;
    mat.polygonOffsetUnits = -2;
    const u = this.u;
    const ghost = this.ghost;
    chainPatch(mat, 'css-paint', (sh) => {
      addShape(sh, u);
      Object.assign(sh.uniforms, uniforms, { uGhost: ghost });
      sh.vertexShader =
        'attribute float aCover;\nvarying float vCover;\nattribute float aHem;\nvarying float vHem;\n' +
        sh.vertexShader.replace('vRest = transformed;', 'vRest = transformed;\nvCover = aCover;\nvHem = aHem;');
      sh.fragmentShader = PAINT_HEAD + sh.fragmentShader.replace('#include <color_fragment>', PAINT_FRAGMENT);
      addHide(sh);
    });
    const mesh = new SkinnedMesh(geo, mat);
    mesh.bind(this.body.skeleton, this.body.bindMatrix);
    mesh.frustumCulled = false;
    const outline = new SkinnedMesh(geo, this.opt.outline(0.004));
    chainPatch(outline.material as Material, 'css-shape-cover', (sh) => {
      addShape(sh, u);
      sh.vertexShader = 'attribute float aCover;\nvarying float vCover;\n' + sh.vertexShader.replace('vRest = transformed;', 'vRest = transformed;\nvCover = aCover;');
      sh.fragmentShader = 'varying float vCover;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\nif (vCover < 0.0) discard;');
      addHide(sh);
    });
    outline.bind(this.body.skeleton, this.body.bindMatrix);
    outline.frustumCulled = false;
    const parent = this.body.parent!;
    for (const m of [mesh, outline]) {
      m.position.copy(this.body.position);
      m.quaternion.copy(this.body.quaternion);
      m.scale.copy(this.body.scale);
      parent.add(m);
    }
    this.layers.set(slot, { key, objects: [mesh, outline], uniforms });
  }

  /** the part of a garment covered by the one worn over it is not drawn (nor its outline) */
  private hideUnder(slot: string, over: GarmentSpec | null) {
    const l = this.layers.get(slot);
    const mesh = l?.objects[0] as SkinnedMesh | undefined;
    const src = mesh?.geometry.userData.src as Int32Array | undefined;
    if (!mesh || !src) return;
    const a = mesh.geometry.getAttribute('aHide') as BufferAttribute;
    const out = a.array as Float32Array;
    for (let j = 0; j < out.length; j++) out[j] = over ? over.cover(src[j]) - 0.025 : -1;
    a.needsUpdate = true;
  }

  private updateHidden() {
    const a = this.body.geometry.getAttribute('aHide') as BufferAttribute;
    const out = a.array as Float32Array;
    out.fill(-1);
    this.hidden.forEach((h) => {
      for (let i = 0; i < out.length; i++) if (h[i] > out[i]) out[i] = h[i];
    });
    a.needsUpdate = true;
  }

  /** body vertices hidden under the clothes (tests) */
  hiddenCount() {
    const a = this.body.geometry.getAttribute('aHide').array as Float32Array;
    let n = 0;
    for (const v of a) if (v > 0) n++;
    return n;
  }

  private rigidLayer(slot: string, type: string | null, paint: Paint, build: () => Mesh[]) {
    const prev = this.layers.get(slot);
    const key = type ? `${slot}:${type}` : '';
    if (prev && prev.key === key) {
      prev.objects.forEach((o) => ((o as Mesh).material as MeshLambertMaterial).color?.copy(lin(paint.color)));
      return;
    }
    if (prev) {
      prev.objects.forEach((o) => o.removeFromParent());
      this.layers.delete(slot);
    }
    if (!type) return;
    const meshes = build();
    meshes.forEach((m) => {
      ((m.material as MeshLambertMaterial).color as Color).copy(lin(paint.color));
      rigidOutline(m);
    });
    this.layers.set(slot, { key, objects: meshes, uniforms: {} });
  }

  private boxingGloves() {
    const out: Mesh[] = [];
    for (const side of ['Left', 'Right'] as const) {
      const m = attachToBone(this.body, `${side}Hand`, gloveGeometry(this.map.bone, side), this.opt.toon('css-glove', new Color(1, 1, 1)));
      if (m) out.push(m);
    }
    return out;
  }

  private faceBar() {
    const meta = this.map.meta;
    const g = new TorusGeometry(0.075 * meta.K, 0.009, 8, 24, Math.PI * 0.8);
    g.rotateZ(Math.PI * 0.1);
    g.rotateX(Math.PI / 2);
    g.rotateY(Math.PI);
    g.translate(0, meta.lipsY + 0.02, meta.faceZ + 0.03);
    const m = attachToBone(this.body, 'Head', g, this.opt.toon('css-bar', new Color(1, 1, 1)));
    return m ? [m] : [];
  }

  private mouthguard() {
    const meta = this.map.meta;
    const g = new TorusGeometry(0.024, 0.0045, 6, 16, Math.PI);
    g.rotateX(Math.PI / 2);
    g.rotateY(Math.PI);
    g.translate(0, meta.lipsY, meta.faceZ - 0.022);
    const m = attachToBone(this.body, 'Head', g, this.opt.toon('css-mouth', new Color(1, 1, 1)));
    return m ? [m] : [];
  }

  private applyHair(look: FighterLook) {
    const u = this.u;
    const st = look.hair.style;
    const L = look.hair.length;
    const style: Record<string, [number, number, number, number, number, number]> = {
      // top, side, back, mohawk, extra thickness (m), painted scalp cover
      rase: [0, 0, 0, 0, 0, 0.35],
      court: [1, 0.8, 0.8, 0, 0.004 + 0.01 * L, 1],
      degrade: [1, 0.12, 0.35, 0, 0.006 + 0.012 * L, 0.75],
      crete: [1, 0, 0, 1, 0.02 + 0.04 * L, 0.45],
      chignon: [0.4, 0.4, 0.4, 0, 0.002, 1],
      queue: [0.4, 0.4, 0.4, 0, 0.002, 1],
      tresses: [0.5, 0.5, 0.5, 0, 0.003, 1],
      afro: [1, 1, 1, 0, 0.03 + 0.04 * L, 1],
    };
    const s = style[st] ?? style.court;
    u.uHairStyle.value.set(s[0], s[1], s[2], s[3]);
    u.uHairLen.value = s[4];
    u.uHairCover.value = s[5];
    if (this.hair) this.setVisible(this.hair, st !== 'rase');
    if (this.bun) this.setVisible(this.bun, st === 'chignon' && look.sex === 'femme');
    if (this.bun) ((this.bun as Mesh).material as MeshLambertMaterial).color?.copy(u.uHairColor.value);
    const key = `${st}:${L.toFixed(2)}:${look.sex}`;
    if (key !== this.hairPieceKey) {
      this.hairPieces.forEach((o) => o.removeFromParent());
      this.hairPieces = this.buildHairPieces(st, L, look.sex);
      this.hairPieceKey = key;
    }
    this.hairPieces.forEach((o) => ((o as Mesh).material as MeshLambertMaterial).color?.copy(u.uHairColor.value));
  }

  private buildHairPieces(st: string, L: number, sex: string): Object3D[] {
    const meta = this.map.meta;
    const c = v3(meta.headLow).lerp(v3(meta.headTop), 0.5);
    const top = v3(meta.headTop);
    const r = top.y - c.y;
    const mat = () => this.opt.toon('css-hairpiece', new Color(1, 1, 1));
    const out: Mesh[] = [];
    const add = (g: BufferGeometry) => {
      const m = attachToBone(this.body, 'Head', g, mat());
      if (m) {
        rigidOutline(m, 0.003);
        out.push(m);
      }
    };
    if (st === 'chignon' && sex !== 'femme') {
      const g = new SphereGeometry(0.045 + 0.02 * L, 16, 12);
      g.translate(c.x, top.y - 0.01, c.z - r * 0.75);
      add(g);
    }
    if (st === 'queue') {
      const s0 = new Vector3(c.x, c.y + r * 0.35, c.z - r * 1.05);
      add(tubeGeometry([s0, s0.clone().add(new Vector3(0, -0.06, -0.05)), s0.clone().add(new Vector3(0, -0.12 - 0.22 * L, -0.07)), s0.clone().add(new Vector3(0, -0.2 - 0.3 * L, -0.06))], 0.024, 0.6));
    }
    if (st === 'tresses') {
      for (const sx of [-1, 1]) {
        const s0 = new Vector3(c.x + sx * r * 0.55, c.y - r * 0.1, c.z - r * 0.75);
        add(
          tubeGeometry(
            [s0, s0.clone().add(new Vector3(sx * 0.02, -0.08, -0.03)), s0.clone().add(new Vector3(sx * 0.03, -0.16 - 0.18 * L, -0.02)), s0.clone().add(new Vector3(sx * 0.03, -0.22 - 0.26 * L, 0.0))],
            0.016,
            0.5,
          ),
        );
      }
    }
    return out;
  }

  private applyTattoos(list: Tattoo[]) {
    const u = this.u;
    const n = Math.min(MAX_TATTOOS, list.length);
    u.uTatN.value = n;
    if (n && !this.atlas) {
      this.atlas = tattooAtlas();
      u.uTatAtlas.value = this.atlas;
    }
    for (let i = 0; i < n; i++) {
      const t = list[i];
      const f = zoneFrame(this.map, t.zone);
      const rot = (t.rotation * Math.PI) / 180;
      u.uTatA.value[i].copy(f.origin);
      u.uTatU.value[i].copy(f.u);
      u.uTatV.value[i].copy(f.v);
      u.uTatP.value[i].set(f.cylinder ? 1 : 0, f.radius, Math.cos(rot), Math.sin(rot));
      u.uTatQ.value[i].set(
        t.u * f.half[0],
        t.v * f.half[1],
        t.size,
        Math.max(
          0,
          TATTOO_DESIGNS.findIndex((d) => d.id === t.design),
        ),
      );
      const col = lin(t.color);
      u.uTatC.value[i].set(col.r, col.g, col.b, t.intensity);
    }
  }
}

/** projection frame of a tattoo zone, from the bind-pose skeleton */
export function zoneFrame(m: BodyMap, zone: TattooZone) {
  const b = m.bone;
  const meta = m.meta;
  const limb = (a: Vector3, c: Vector3, front: Vector3, t0: number, t1: number) => {
    const ax = c.clone().sub(a).normalize();
    const len = a.distanceTo(c);
    const origin = a.clone().addScaledVector(ax, len * (t0 + t1) * 0.5);
    const u = front
      .clone()
      .sub(ax.clone().multiplyScalar(front.dot(ax)))
      .normalize();
    // radius: mean distance of the zone's vertices to the axis
    let sum = 0;
    let k = 0;
    const p = new Vector3();
    for (let i = 0; i < m.count; i += 7) {
      p.set(m.pos[i * 3], m.pos[i * 3 + 1], m.pos[i * 3 + 2]).sub(a);
      const t = p.dot(ax) / len;
      if (t < t0 || t > t1) continue;
      const r = p
        .clone()
        .sub(ax.clone().multiplyScalar(p.dot(ax)))
        .length();
      if (r < 0.12) {
        sum += r;
        k++;
      }
    }
    const radius = k ? sum / k : 0.05;
    return { origin, u, v: ax.negate(), cylinder: true, radius, half: [Math.PI * radius, len * (t1 - t0) * 0.5] as [number, number] };
  };
  const plane = (origin: Vector3, normal: Vector3, half: [number, number]) => {
    const nn = normal.clone().normalize();
    const up = new Vector3(0, 1, 0);
    const u = new Vector3().crossVectors(up, nn).normalize();
    const v = new Vector3().crossVectors(nn, u).normalize();
    return { origin, u, v, cylinder: false, radius: 0, half };
  };
  const FRONT = new Vector3(0, 0, 1);
  const nipY = meta.nippleY;
  const pelvisY = meta.pelvis[1];
  const neckY = meta.neck[1];
  switch (zone) {
    case 'bras-gauche':
      return limb(b.LeftArm, b.LeftForeArm, FRONT, 0.15, 0.9);
    case 'bras-droit':
      return limb(b.RightArm, b.RightForeArm, FRONT, 0.15, 0.9);
    case 'avant-bras-gauche':
      return limb(b.LeftForeArm, b.LeftHand, FRONT, 0.1, 0.9);
    case 'avant-bras-droit':
      return limb(b.RightForeArm, b.RightHand, FRONT, 0.1, 0.9);
    case 'cuisse-gauche':
      return limb(b.LeftUpLeg, b.LeftLeg, FRONT, 0.2, 0.85);
    case 'cuisse-droite':
      return limb(b.RightUpLeg, b.RightLeg, FRONT, 0.2, 0.85);
    case 'mollet-gauche':
      return limb(b.LeftLeg, b.LeftFoot, FRONT.clone().negate(), 0.1, 0.8);
    case 'mollet-droit':
      return limb(b.RightLeg, b.RightFoot, FRONT.clone().negate(), 0.1, 0.8);
    case 'epaule-gauche':
      return plane(b.LeftArm.clone().add(new Vector3(0.02, 0.02, 0)), new Vector3(1, 0.5, 0.2), [0.06, 0.06]);
    case 'epaule-droite':
      return plane(b.RightArm.clone().add(new Vector3(-0.02, 0.02, 0)), new Vector3(-1, 0.5, 0.2), [0.06, 0.06]);
    case 'poitrine':
      return plane(new Vector3(0, nipY + 0.06, meta.faceZ), FRONT, [0.14, 0.07]);
    case 'ventre':
      return plane(new Vector3(0, (pelvisY + nipY) / 2, meta.faceZ), FRONT, [0.1, 0.1]);
    case 'dos':
      return plane(new Vector3(0, (neckY + nipY) / 2, -0.2), FRONT.clone().negate(), [0.15, 0.18]);
  }
}

/** average colour of the painted skin (the reference the chosen tone replaces) */
function averageSkin(map: Texture | null): Color {
  const out = new Color(0.45, 0.25, 0.17);
  const img = map?.image as CanvasImageSource | undefined;
  if (!img || typeof document === 'undefined') return out;
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const g = c.getContext('2d', { willReadFrequently: true })!;
    g.drawImage(img, 0, 0, 32, 32);
    const d = g.getImageData(0, 0, 32, 32).data;
    const px: [number, number, number][] = [];
    for (let i = 0; i < d.length; i += 4) px.push([d[i], d[i + 1], d[i + 2]]);
    px.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
    // upper middle of the luminance range: lit skin, not hair, lips or occluded creases
    const s = px.slice(Math.floor(px.length * 0.55), Math.floor(px.length * 0.8));
    const avg = s.reduce((a, p) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]], [0, 0, 0]).map((v) => v / s.length / 255);
    out.setRGB(avg[0], avg[1], avg[2], 'srgb');
  } catch {
    // tainted canvas or no 2D context: keep the default
  }
  return out;
}
