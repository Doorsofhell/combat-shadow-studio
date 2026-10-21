import { Material, RepeatWrapping, Texture, Vector4 } from 'three';

/**
 * Realistic skin (v0.29 lot 2), added to the coach's skin material in the Ultra-réaliste look.
 *
 * - micro-relief: pores and fine wrinkles from a tiling normal map (public/skin/skin_detail.png, drawn by
 *   tools/generator/skin/detail.py), on top of the generator's anatomical relief
 * - colour: soft mottling (the skin is never one flat tone), warmer nose, cheeks and ears
 * - shine: oilier forehead and nose, matte in the pores
 * - light through the skin: a red glow where light turns into shade (subsurface scattering, approximated
 *   with wrapped lighting: cheap enough for phones), stronger in the thin ears
 *
 * The code reads `vRest` (rest position) from the customised skin shader (customize.ts).
 */
export interface SkinUniforms {
  uSkinDetail: { value: Texture | null };
  /** x: tiling, y: relief strength, z: scattering strength, w: 1 when on */
  uSkinReal: { value: Vector4 };
  /** x: eye height, y: front of the face (z), z: nose tip height, w: lips height */
  uFaceRef: { value: Vector4 };
}

export function makeSkinUniforms(): SkinUniforms {
  return { uSkinDetail: { value: null }, uSkinReal: { value: new Vector4(0, 0, 0, 0) }, uFaceRef: { value: new Vector4() } };
}

const HEAD = /* glsl */ `
uniform sampler2D uSkinDetail;
uniform vec4 uSkinReal;
uniform vec4 uFaceRef;
float cssVnoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = fract(sin(dot(i, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  float b = fract(sin(dot(i + vec3(1, 0, 0), vec3(127.1, 311.7, 74.7))) * 43758.5453);
  float c = fract(sin(dot(i + vec3(0, 1, 0), vec3(127.1, 311.7, 74.7))) * 43758.5453);
  float d = fract(sin(dot(i + vec3(1, 1, 0), vec3(127.1, 311.7, 74.7))) * 43758.5453);
  float e = fract(sin(dot(i + vec3(0, 0, 1), vec3(127.1, 311.7, 74.7))) * 43758.5453);
  float g = fract(sin(dot(i + vec3(1, 0, 1), vec3(127.1, 311.7, 74.7))) * 43758.5453);
  float h = fract(sin(dot(i + vec3(0, 1, 1), vec3(127.1, 311.7, 74.7))) * 43758.5453);
  float k = fract(sin(dot(i + vec3(1, 1, 1), vec3(127.1, 311.7, 74.7))) * 43758.5453);
  return mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y), mix(mix(e, g, f.x), mix(h, k, f.x), f.y), f.z);
}
float cssBlob(vec3 p, vec3 c, vec3 r) { vec3 q = (p - c) / r; return clamp(1.0 - dot(q, q), 0.0, 1.0); }
// warm areas of the face: nose, cheeks, ears
float cssFlush(vec3 p) {
  float ax = abs(p.x);
  vec3 q = vec3(ax, p.y, p.z);
  float nose = cssBlob(q, vec3(0.0, uFaceRef.z, uFaceRef.y), vec3(0.016, 0.02, 0.02));
  float cheek = cssBlob(q, vec3(0.042, uFaceRef.x - 0.03, uFaceRef.y - 0.025), vec3(0.022, 0.02, 0.03));
  float ear = cssBlob(q, vec3(0.075, uFaceRef.x - 0.012, uFaceRef.y - 0.1), vec3(0.02, 0.035, 0.03));
  return clamp(nose * 0.9 + cheek * 0.6 + ear * 0.8, 0.0, 1.0);
}
`;

/** colour (inside the customised skin shader, after the paint): mottling and flush */
export const SKIN_REAL_COLOR = /* glsl */ `
if (uSkinReal.w > 0.5) {
  float mot = cssVnoise(vRest * 38.0) * 0.6 + cssVnoise(vRest * 110.0) * 0.4;
  c *= 0.95 + 0.1 * mot;
  c = mix(c, c * vec3(1.1, 0.86, 0.84), cssFlush(vRest) * 0.55);
}
`;

/** patch of the lit part of the skin material: relief, shine, scattering */
export function patchRealSkin(m: Material, u: SkinUniforms) {
  const prev = m.onBeforeCompile.bind(m);
  m.onBeforeCompile = (sh, r) => {
    prev(sh, r);
    Object.assign(sh.uniforms, u);
    sh.fragmentShader = HEAD + sh.fragmentShader.replace('// CSS_REAL_SKIN_COLOR', SKIN_REAL_COLOR);
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
#ifdef USE_NORMALMAP_TANGENTSPACE
if (uSkinReal.w > 0.5) {
  vec2 dn = (skinD.xy * 2.0 - 1.0) * uSkinReal.y;
  normal = normalize(normal + tbn[0] * dn.x + tbn[1] * dn.y);
}
#endif`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
// (the roughness comes before the normals in the shader: the detail is read here for both)
vec4 skinD = texture2D(uSkinDetail, vMapUv * uSkinReal.x);
if (uSkinReal.w > 0.5) {
  // forehead and nose a little oily, pores matte
  vec3 q = vec3(abs(vRest.x), vRest.y, vRest.z);
  float tz = max(cssBlob(q, vec3(0.0, uFaceRef.x + 0.035, uFaceRef.y - 0.012), vec3(0.05, 0.03, 0.04)), cssBlob(q, vec3(0.0, uFaceRef.z + 0.008, uFaceRef.y), vec3(0.014, 0.03, 0.025)));
  roughnessFactor = clamp(roughnessFactor - 0.12 * tz + 0.22 * skinD.b, 0.25, 1.0);
}`,
      )
      .replace(
        '#include <opaque_fragment>',
        `if (uSkinReal.w > 0.5) {
  // light through the skin: red glow along the shadow line, more in the ears (thin)
  vec3 sss = vec3(0.0);
  float thin = cssBlob(vec3(abs(vRest.x), vRest.y, vRest.z), vec3(0.075, uFaceRef.x - 0.012, uFaceRef.y - 0.1), vec3(0.02, 0.035, 0.03));
  #if NUM_DIR_LIGHTS > 0
  for (int i = 0; i < NUM_DIR_LIGHTS; i++) {
    vec3 L = directionalLights[i].direction;
    float ndl = dot(normal, L);
    float wrap = max(0.0, (ndl + 0.45) / 1.45) - max(0.0, ndl);
    float back = max(0.0, -ndl) * thin;
    sss += directionalLights[i].color * (wrap + back * 0.8);
  }
  #endif
  outgoingLight += sss * diffuseColor.rgb * vec3(0.85, 0.3, 0.2) * uSkinReal.z;
  // pores and creases catch a little less light
  outgoingLight *= 1.0 - 0.12 * skinD.b * uSkinReal.y;
}
#include <opaque_fragment>`,
      );
  };
  const prevKey = m.customProgramCacheKey.bind(m);
  m.customProgramCacheKey = () => `${prevKey()}|css-real-skin`;
  m.needsUpdate = true;
}

export function prepareDetail(t: Texture) {
  t.wrapS = t.wrapT = RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
