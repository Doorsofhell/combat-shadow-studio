import { ShaderChunk, Vector3, type Material, type WebGLProgramParametersWithUniforms } from 'three';

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
   * 1.16 colour grade of the albedo (Youssef 04/11 13:52 « peux-tu la bronzer un tout petit peu ? », Inaya):
   * sat = saturation around the luminance (1 = as painted), gain = brightness of the albedo, warm = shift towards
   * red-orange (0 = none). Left out, nothing changes.
   */
  sat?: number;
  gain?: number;
  warm?: number;
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
vec3 cssShadowLift(float s) { return vec3(s) + (1.0 - s) * cssShadowLiftK * cssTint; }
vec3 cssWrapIrr(vec3 n, vec3 l, vec3 c) {
  float ndl = dot(n, l);
  vec3 w = cssWrap * cssTint;
  return clamp((vec3(ndl) + w) / (1.0 + w), 0.0, 1.0) * c;
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

export function applySkinShader(m: Material, look: SkinLook, detail: boolean) {
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
  m.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    Object.assign(shader.uniforms, uniforms);
    let f = shader.fragmentShader.replace('#include <common>', `#include <common>\n${HEADER}`);
    f = f.replace('#include <lights_physical_pars_fragment>', LIGHTS_PARS).replace('#include <lights_fragment_begin>', LIGHTS_BEGIN);
    f = f.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
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
#endif`,
    );
    f = f.replace(
      '#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>
  roughnessFactor = clamp(roughnessFactor + cssRoughVar * (cssT - 0.5) * 2.0 + cssPore * cssPores * 2.0, 0.25, 0.95);`,
    );
    shader.fragmentShader = f;
  };
  m.customProgramCacheKey = () => `css-skin-${detail ? 1 : 0}`;
}
