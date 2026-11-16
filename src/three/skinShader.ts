import { ShaderChunk, Vector3, type Material, type WebGLProgramParametersWithUniforms } from 'three';
import { newFaceRenderUniforms, type FaceRenderUniforms } from './human/faceRender';

/**
 * 1.10 skin of the photo coaches (Youssef 2026-11-03, « peau assez uniforme », « diffusion approchée de la lumière si
 * elle reste compatible avec le budget mobile », « vérifiez que les ombres photographiques des textures ne
 * produisent pas un double éclairage »). Added to the skin's own standard/physical material (onBeforeCompile), no
 * extra pass, no extra texture:
 * - approached subsurface scattering: the diffuse light wraps past the shadow line, more in red than in blue
 *   (light travels further in skin for long wavelengths), so the terminator is soft and warm instead of a grey cut;
 * - shadows on the skin keep some warm light (the same scattering inside cast shadows): with the shading already
 *   painted in the photo textures, a full-strength cast shadow darkened the same fold twice (Kadir's shoulder blade);
 * - microrelief separate from the anatomy: discreet pores (roughness and a hint of colour, faded with distance so they
 *   never shimmer), roughness varying over the face and body instead of one value, and small natural variations of
 *   tint. The anatomy stays in the normal map, its depth calibrated per coach (PhotoCoach, SKIN_LOOK).
 */
export interface SkinLook {
  /** depth of the anatomy's normal map (1 = as exported) */
  relief: number;
  /** wrap of the diffuse light past the shadow line (0 = Lambert), its red channel */
  wrap: number;
  /** light kept inside cast shadows (0 = black shadow) */
  shadowLift: number;
  /** pores: colour depth (0..0.1), roughness added */
  pores: number;
  /** roughness variation (± around the base) */
  roughVar: number;
  /** tint variation */
  tintVar: number;
  /** scattering colour (per channel factor of the wrap, red first) */
  tint: [number, number, number];
  /**
   * 1.17 colour grade of the albedo (Youssef 04/11 13:52 « peux-tu la bronzer un tout petit peu ? », Inaya):
   * sat = saturation around the luminance (1 = as painted), gain = brightness of the albedo, warm = shift towards
   * red-orange (0 = none). Left out, nothing changes.
   */
  sat?: number;
  gain?: number;
  warm?: number;
  /** Victor only: local albedo cleanup on body, never on face or outfit. */
  cleanBody?: boolean;
}

export const DEFAULT_SKIN: SkinLook = { relief: 1.3, wrap: 0.5, shadowLift: 0.32, pores: 0.05, roughVar: 0.12, tintVar: 0.05, tint: [1, 0.5, 0.36] };

const HEADER = /* glsl */ `
uniform float cssWrap;
uniform vec3 cssTint;
uniform float cssShadowLiftK;
uniform float cssPores;
uniform float cssRoughVar;
uniform float cssTintVar;
uniform vec3 cssGrade;
vec3 cssGradeRgb(vec3 c) {
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, cssGrade.x) * cssGrade.y;
  return c * (1.0 + cssGrade.z * vec3(0.6, 0.05, -0.45));
}
float cssHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float cssNoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(cssHash(i), cssHash(i + vec2(1.0, 0.0)), u.x), mix(cssHash(i + vec2(0.0, 1.0)), cssHash(i + vec2(1.0, 1.0)), u.x), u.y);
}
// 1.44 light through the thin parts of the face (ears, nostrils, lips): set by the head's skin, 0 elsewhere
float cssThinK = 0.0;
vec3 cssShadowLift(float s) { return vec3(s) + (1.0 - s) * cssShadowLiftK * cssTint; }
vec3 cssWrapIrr(vec3 n, vec3 l, vec3 c) {
  float ndl = dot(n, l);
  vec3 w = (cssWrap + 0.6 * cssThinK) * cssTint;
  // 1.44 a light behind a thin part shows through it, warm (a fraction of it, only where the face is thin)
  vec3 cssBack = 0.3 * cssThinK * max(0.0, -ndl) * cssTint;
  return (clamp((vec3(ndl) + w) / (1.0 + w), 0.0, 1.0) + cssBack) * c;
}
`;

const LIGHTS_PARS = ShaderChunk.lights_physical_pars_fragment.replace(
  'reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution )',
  'reflectedLight.directDiffuse += cssWrapIrr( geometryNormal, directLight.direction, directLight.color ) * BRDF_Lambert( material.diffuseContribution )',
);
const SHADOW_RE = /directLight\.color \*= (\( directLight\.visible && receiveShadow \) \? getShadow\([^;]*\) : 1\.0);/g;
const LIGHTS_BEGIN = ShaderChunk.lights_fragment_begin.replace(SHADOW_RE, 'directLight.color *= cssShadowLift( $1 );');

/** true when the chunks of this three.js version still hold the lines the skin replaces (checked by the tests) */
export const SKIN_SHADER_OK = LIGHTS_PARS !== ShaderChunk.lights_physical_pars_fragment && LIGHTS_BEGIN !== ShaderChunk.lights_fragment_begin;

/**
 * 1.44 the face's soft zones on the head's skin (src/three/human/faceRender.ts): wide gaussian masks placed on the
 * Rocketbox head texture (u from the coach's right, v down), mirrored left and right. No line, no edge.
 */
const FACE_HEADER = /* glsl */ `
uniform vec4 cssFace;
float cssBlob(vec2 uv, vec2 c, vec2 r) { vec2 d = (uv - c) / r; return exp(-dot(d, d)); }
float cssPair(vec2 uv, vec2 c, vec2 r) { return max(cssBlob(uv, c, r), cssBlob(uv, vec2(1.0 - c.x, c.y), r)); }
`;
const FACE_BODY = /* glsl */ `
#ifdef USE_MAP
  float cssCheek = cssPair(vMapUv, vec2(0.405, 0.36), vec2(0.045, 0.035));
  float cssEar = cssPair(vMapUv, vec2(0.245, 0.36), vec2(0.03, 0.05));
  float cssNose = cssBlob(vMapUv, vec2(0.5, 0.335), vec2(0.028, 0.03));
  float cssNostril = cssPair(vMapUv, vec2(0.478, 0.355), vec2(0.014, 0.009));
  float cssLip = cssBlob(vMapUv, vec2(0.5, 0.407), vec2(0.045, 0.016));
  float cssBrow = cssBlob(vMapUv, vec2(0.5, 0.235), vec2(0.11, 0.05));
  float cssRim = cssPair(vMapUv, vec2(0.43, 0.3), vec2(0.026, 0.007));
  // flush of the effort: cheeks, ears, a little on the nose
  float cssFlushM = max(cssCheek, 0.8 * cssEar) + 0.4 * cssNose;
  diffuseColor.rgb *= mix(vec3(1.0), vec3(1.0, 0.8, 0.78), clamp(cssFace.x * cssFlushM, 0.0, 1.0));
  cssThinK = cssFace.z * max(cssEar, max(cssNostril, 0.6 * cssLip));
  float cssGloss = cssFace.y * max(cssBrow, cssNose) * 0.14 + cssFace.w * cssRim * 0.32;
#else
  float cssGloss = 0.0;
#endif
`;

export function applySkinShader(m: Material, look: SkinLook, detail: boolean, face = false) {
  if (!SKIN_SHADER_OK) return;
  const uniforms = {
    cssWrap: { value: look.wrap },
    cssTint: { value: new Vector3(...look.tint) },
    cssShadowLiftK: { value: look.shadowLift },
    cssPores: { value: detail ? look.pores : 0 },
    cssRoughVar: { value: look.roughVar },
    cssTintVar: { value: look.tintVar },
    cssGrade: { value: new Vector3(look.sat ?? 1, look.gain ?? 1, look.warm ?? 0) },
  };
  m.userData.cssSkin = uniforms;
  if (face) m.userData.cssFaceSkin = true;
  if (look.cleanBody && !face) m.userData.cssVictorBodyClean = true;
  m.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    Object.assign(shader.uniforms, uniforms);
    let f = shader.fragmentShader.replace('#include <common>', `#include <common>\n${HEADER}${face ? FACE_HEADER : ''}`);
    if (face) {
      const fr: FaceRenderUniforms = m.userData.cssFaceRender ?? newFaceRenderUniforms();
      shader.uniforms.cssFace = fr.cssFace;
    }
    f = f.replace('#include <lights_physical_pars_fragment>', LIGHTS_PARS).replace('#include <lights_fragment_begin>', LIGHTS_BEGIN);
    f = f.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
  // 1.48.0 Victor BODY only: attenuate small baked-in spots in the photographic albedo.
  // Filter RGB locally, preserving coarse muscle illumination and leaving head/eyes untouched.
  // The body texture is unchanged on disk; the shader is reversible.
#ifdef USE_MAP
${look.cleanBody && !face ? `
  vec2 cssD = vec2(0.004, 0.006);
  vec3 cssNeighbour = (
    texture2D(map, vMapUv + vec2(cssD.x, 0.0)).rgb +
    texture2D(map, vMapUv - vec2(cssD.x, 0.0)).rgb +
    texture2D(map, vMapUv + vec2(0.0, cssD.y)).rgb +
    texture2D(map, vMapUv - vec2(0.0, cssD.y)).rgb
  ) * 0.25;
  // A gentle neighbour mix only where albedo visibly differs locally;
  // original shading/skin colour dominates in stable areas.
  float cssSpot = smoothstep(0.035, 0.13, length(diffuseColor.rgb - cssNeighbour));
  diffuseColor.rgb = mix(diffuseColor.rgb, cssNeighbour, 0.72 * cssSpot);
` : ''}
#endif
  diffuseColor.rgb = cssGradeRgb(diffuseColor.rgb);
#ifdef USE_MAP
  // tint: slow variations (blotches a few centimetres wide), warmer or cooler
  float cssT = cssNoise(vMapUv * 38.0) * 0.65 + cssNoise(vMapUv * 97.0) * 0.35;
  diffuseColor.rgb *= 1.0 + cssTintVar * (cssT - 0.5) * vec3(0.8, -0.1, -0.5);
  // pores: dark points about 0.6 mm apart on a 2048 texture, gone when a texel is smaller than a pixel apart
  vec2 cssP = vMapUv * 1300.0;
  float cssFade = 1.0 - smoothstep(0.35, 0.9, length(fwidth(cssP)));
  float cssPore = smoothstep(0.62, 0.92, cssNoise(cssP)) * cssFade;
  diffuseColor.rgb *= 1.0 - cssPore * cssPores;
#else
  float cssT = 0.5; float cssPore = 0.0;
#endif${face ? FACE_BODY : '\n  float cssGloss = 0.0;'}`,
    );
    f = f.replace(
      '#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>
  roughnessFactor = clamp(roughnessFactor + cssRoughVar * (cssT - 0.5) * 2.0 + cssPore * cssPores * 2.0 - cssGloss, 0.2, 0.95);`,
    );
    shader.fragmentShader = f;
  };
  m.customProgramCacheKey = () => `css-skin-${detail ? 1 : 0}${face ? '-face144' : ''}`;
}
