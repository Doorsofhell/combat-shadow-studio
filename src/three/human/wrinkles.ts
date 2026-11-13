import { Matrix4, Vector3, Vector4, type Bone, type Camera, type Material, type Object3D, type WebGLProgramParametersWithUniforms } from 'three';

/**
 * 1.40 Human Behavior & Facial Expression Engine — expression wrinkles (Youssef 13/11, lot validé 17:13: « des rides
 * qui apparaissent avec l'expression »). Before, the skin stayed smooth whatever the face did: a brow raised on a
 * smooth forehead reads as a mask. Now, on the skin of every coach:
 * - forehead: horizontal lines when the inner brows rise (BrowInnerUp);
 * - between the brows: two short vertical creases when they come down (BrowDown);
 * - corner of each eye: crow's feet when the eye narrows or the cheek rises (EyeSquint, CheekSquint, smile).
 *
 * Drawn in the skin's shader (no texture, no file): a shallow relief (under a millimetre) and a slight shading of the
 * crease, in a frame tied to the face (origin between the eyes, unit = distance between the eyes), so the same
 * values suit the four coaches and the wrinkles follow the head. Only on the face: the masks end within the forehead,
 * the brows and the temples. Weights come from the face's own expressions each frame (FaceAnimator), so the wrinkles
 * come and go with them and are gone on a neutral face.
 */

export interface WrinkleUniforms {
  /** view space → face frame (unit: the distance between the eyes) */
  cssWrView: { value: Matrix4 };
  /** strength: x forehead, y between the brows, z crow's feet left, w crow's feet right (0..1) */
  cssWrA: { value: Vector4 };
}

/**
 * 1.40.1 (Youssef 13/11 22:36, captures téléphone : « des trucs qui apparaissent sur les visages », « humaniser ne veut
 * pas dire rajouter des traits visibles »): on the phones the procedural lines read as dotted dark marks on the
 * forehead and around the eyes. The coaches' skin no longer gets this shader; the expressions, the gaze and the
 * micro-life of 1.39/1.40 stay. Kept here (off) so the work is not lost; turn back on only with close-up captures
 * on a phone validated by Youssef.
 */
export const WRINKLES_ON_COACHES = false;

/** depth of a full crease, in metres, and how much darker its bottom is */
export const WRINKLE_LOOK = { depth: 0.0006, shade: 0.14 } as const;

const HEAD = /* glsl */ `
uniform mat4 cssWrView;
uniform vec4 cssWrA;
float cssWrinkle(vec3 p) {
  float h = 0.0;
  float ax = abs(p.x);
  // forehead: lines about 7 mm apart, slightly arched, broken here and there
  float yb = p.y - 0.12 * p.x * p.x;
  float mF = smoothstep(0.44, 0.56, yb) * (1.0 - smoothstep(0.88, 1.05, yb)) * (1.0 - smoothstep(0.5, 0.72, ax)) * step(-0.45, p.z);
  float yw = yb + 0.018 * sin(p.x * 6.5 + yb * 4.0);
  float lF = pow(0.5 + 0.5 * cos(yw * 6.2831853 / 0.115), 4.0) * (0.55 + 0.45 * sin(p.x * 3.1 + floor(yw / 0.115 + 0.5) * 2.1));
  // lines closer than a few pixels fade out instead of shimmering (a face far away on the screen)
  float cssFar = smoothstep(0.25, 0.6, fwidth(yw) / 0.115);
  lF *= 1.0 - cssFar;
  h += cssWrA.x * mF * lF;
  // between the brows: two short vertical creases
  float mG = smoothstep(0.12, 0.2, p.y) * (1.0 - smoothstep(0.4, 0.5, p.y)) * step(-0.2, p.z);
  h += cssWrA.y * mG * exp(-pow((ax - 0.06) / 0.018, 2.0));
  // crow's feet: rays from the outer corner of each eye, outward
  for (int i = 0; i < 2; i++) {
    float s = i == 0 ? 1.0 : -1.0;
    vec2 d = vec2((p.x - s * 0.8) * s, p.y + 0.02);
    float r = length(d);
    float mC = smoothstep(0.08, 0.14, r) * (1.0 - smoothstep(0.2, 0.32, r)) * smoothstep(0.0, 0.35, d.x / (r + 1e-4));
    float rays = pow(0.5 + 0.5 * cos(atan(d.y, d.x) * 10.0 + 0.6), 5.0) * (1.0 - cssFar);
    h += (i == 0 ? cssWrA.z : cssWrA.w) * mC * rays;
  }
  return h;
}
vec3 cssWrBump(vec3 pos, vec3 n, float h) {
  vec3 sx = dFdx(pos);
  vec3 sy = dFdy(pos);
  vec3 r1 = cross(sy, n);
  vec3 r2 = cross(n, sx);
  float det = dot(sx, r1);
  vec3 grad = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2);
  return normalize(abs(det) * n - grad);
}
`;

const BODY = /* glsl */ `
  {
    float cssWr = cssWrinkle((cssWrView * vec4(-vViewPosition, 1.0)).xyz);
    if (cssWr > 0.0005) {
      normal = cssWrBump(-vViewPosition, normal, -cssWr * ${WRINKLE_LOOK.depth.toFixed(5)});
      diffuseColor.rgb *= 1.0 - ${WRINKLE_LOOK.shade.toFixed(3)} * min(cssWr, 1.0);
    }
  }
`;

/** the wrinkles on a skin material (chained after the skin's and the breath's own shader changes) */
export function applyWrinkles(m: Material, u: WrinkleUniforms) {
  const prev = m.onBeforeCompile;
  const prevKey = m.customProgramCacheKey.bind(m);
  m.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms, r) => {
    prev.call(m, shader, r);
    Object.assign(shader.uniforms, u);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${HEAD}`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${BODY}`);
  };
  m.customProgramCacheKey = () => `${prevKey()}|css-wrinkles-v140`;
  m.userData.cssWrinkles = u;
}

/** weights of the expressions → strength of each wrinkle (0..1) */
export function wrinkleStrength(w: Partial<Record<string, number>>): [number, number, number, number] {
  const g = (k: string) => w[k] ?? 0;
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  // 1.40 (Youssef 13/11 19:03, correction proposée sur la page de comparaison): the forehead lines only on a real
  // raise of the brows (from 0.2); the small drifts of the brows at rest left the forehead lined nearly all the time
  const brow = clamp(1.15 * (g('BrowInnerUp') - 0.2));
  const frown = clamp(0.5 * (g('BrowDownLeft') + g('BrowDownRight')) * 1.1 - 0.15);
  const crow = (s: 'Left' | 'Right') => clamp(0.7 * g(`EyeSquint${s}`) + 0.6 * g(`CheekSquint${s}`) + 0.5 * g(`MouthSmile${s}`) - 0.12);
  return [brow, frown, crow('Left'), crow('Right')];
}

/**
 * the frame of the face, kept in the head bone: built once in the rest pose from the two eyes (origin between them,
 * x toward the coach's left eye, y up, z the way the face looks, unit the distance between the eyes)
 */
export class FaceWrinkles {
  readonly uniforms: WrinkleUniforms = { cssWrView: { value: new Matrix4() }, cssWrA: { value: new Vector4() } };
  private inHead = new Matrix4();
  private tmp = new Matrix4();

  constructor(
    private head: Bone,
    le: Object3D,
    re: Object3D,
  ) {
    const l = le.getWorldPosition(new Vector3());
    const r = re.getWorldPosition(new Vector3());
    const ipd = l.distanceTo(r);
    const x = l.clone().sub(r).normalize();
    const z = new Vector3().crossVectors(x, new Vector3(0, 1, 0)).normalize();
    const y = new Vector3().crossVectors(z, x).normalize();
    const face = new Matrix4().makeBasis(x.multiplyScalar(ipd), y.multiplyScalar(ipd), z.multiplyScalar(ipd)).setPosition(l.add(r).multiplyScalar(0.5));
    this.inHead.copy(head.matrixWorld).invert().multiply(face);
  }

  /** each frame, after the face: where the camera sees the face from, and the strength of the wrinkles */
  update(camera: Camera, weights: Partial<Record<string, number>>) {
    this.head.updateWorldMatrix(true, false);
    const face = this.tmp.copy(this.head.matrixWorld).multiply(this.inHead);
    this.uniforms.cssWrView.value.copy(face).invert().multiply(camera.matrixWorld);
    this.uniforms.cssWrA.value.set(...wrinkleStrength(weights));
  }
}
