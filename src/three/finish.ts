import { Color, Vector3, type Material, type MeshStandardMaterial, type WebGLProgramParametersWithUniforms } from 'three';

/**
 * 2.11.0 « Humaniser les coachs et leurs tenues » (Youssef 26/11 23:39 : « rendu… niveau Street Fighter 6 », « gants de
 * boxe, accessoires et habits les plus naturels et réalistes possible » ; choix 27/11 08:00 « A b c »). Street Fighter 6
 * is only a quality bar here: nothing of the game is copied.
 *
 * Shader-only finish of the coach and of what it wears, added on top of each material's own changes (skin, breath, sway):
 * no model, texture, UV, skinning or garment geometry changes, so every locked outfit and validated face stays as it is.
 *
 * A. Edge light (rim): a light from behind the coach that outlines its silhouette (shoulders, arms, gloves, legs), as in a
 *    fight studio. Drawn in the coach's own shaders, so it lights the coach only (never the room) and costs no shadow
 *    map: a few operations per pixel, also on phones. Its direction is fixed in the camera's frame (upper left behind,
 *    a weaker warm one upper right), so the outline stays where the eye expects it whatever the angle.
 * B. Leather of the gloves, shin guards and shoes: fine pebbled grain (about 1 mm) and gloss that varies over the
 *    surface, instead of the blotchy white highlights of the old normal map (scaled down), a softer coat.
 * C. Fabrics: satin shorts with gloss that varies with the folds, knitted ribs on the waistbands, fine knit on jerseys.
 *
 * The patterns are computed from the garment's rest position (its points before skinning), so they stick to the cloth
 * when it moves; they fade out when a pattern cell gets smaller than a pixel (no shimmer on a phone seen from afar).
 */
export type FinishKind = 'peau' | 'cuir' | 'satin' | 'elastique' | 'tricot' | 'tissu' | 'aucun';

/** shared by every coach material, set by the stage that shows the coach (setCoachRim) */
export const COACH_RIM = {
  cssRimColor: { value: new Color('#dfe9ff') },
  cssRim2Color: { value: new Color('#ffe2c6') },
  /** strength of the main and of the second edge light */
  cssRimK: { value: new Vector3(0.9, 0.35, 0) },
  /** directions in the camera's frame (x right, y up, z towards the viewer) */
  cssRimDir: { value: new Vector3(-0.78, 0.5, -0.38).normalize() },
  cssRim2Dir: { value: new Vector3(0.82, 0.35, -0.45).normalize() },
};

if (import.meta.env.DEV) (globalThis as { __cssCoachRim?: typeof COACH_RIM }).__cssCoachRim = COACH_RIM;

/** ?rim=0 in the Lab (before/after captures): the edge light off; ?matiere=0: the material patterns off */
const flag = (k: string) => (globalThis as Record<string, unknown>)[k] !== false;
export const rimOn = () => flag('__cssRim2110');
export const patternsOn = () => flag('__cssMatiere2110');

/** the edge light of a stage: colour of the main light, its strength (0 = none) and those of the warm one */
export function setCoachRim(color: string, k: number, color2 = '#ffe2c6', k2 = k * 0.4) {
  COACH_RIM.cssRimColor.value.set(color);
  COACH_RIM.cssRim2Color.value.set(color2);
  COACH_RIM.cssRimK.value.set(k, k2, 0);
}
/** the studio's default edge light */
export const DEFAULT_RIM = { color: '#dfe9ff', k: 0.9 } as const;

/** strength of the edge light per kind of surface (skin catches it most, matte cloth least) */
const RIM_SCALE: Record<FinishKind, number> = { peau: 1, cuir: 0.9, satin: 0.8, elastique: 0.55, tricot: 0.5, tissu: 0.55, aucun: 0 };

/** the kind of a garment's material, from its fabric tag written by the generator (outfits.py css_fabric) or its name */
export function finishKindOf(m: Pick<Material, 'name' | 'userData'>): FinishKind {
  const f = String(m.userData?.css_fabric ?? '').toLowerCase();
  const n = (m.name ?? '').toLowerCase();
  if (/logo|print/.test(n)) return 'aucun';
  if (f === 'cuir' || f === 'grain' || /gant|glove|chaussure|protege|tibia|cuir/.test(n)) return 'cuir';
  if (f === 'satin') return 'satin';
  if (f === 'elastique' || /^ceinture-/.test(n)) return 'elastique';
  if (f === 'jersey' || /haut-rash|compression|vale-tudo|legging|brassiere|crop|debardeur/.test(n)) return 'tricot';
  return 'tissu';
}

const HEAD = /* glsl */ `
uniform vec3 cssRimColor;
uniform vec3 cssRim2Color;
uniform vec3 cssRimK;
uniform vec3 cssRimDir;
uniform vec3 cssRim2Dir;
varying vec3 cssRest;
float cssFHash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float cssFNoise(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); vec3 u = f * f * (3.0 - 2.0 * f);
  float a = mix(mix(cssFHash(i), cssFHash(i + vec3(1, 0, 0)), u.x), mix(cssFHash(i + vec3(0, 1, 0)), cssFHash(i + vec3(1, 1, 0)), u.x), u.y);
  float b = mix(mix(cssFHash(i + vec3(0, 0, 1)), cssFHash(i + vec3(1, 0, 1)), u.x), mix(cssFHash(i + vec3(0, 1, 1)), cssFHash(i + vec3(1, 1, 1)), u.x), u.y);
  return mix(a, b, u.z);
}
// bump from a height computed per pixel (same method as three.js' bump map, without a texture)
vec3 cssBump(vec3 surfPos, vec3 n, float h, float k) {
  vec2 dH = vec2(dFdx(h), dFdy(h)) * k;
  vec3 sx = dFdx(surfPos); vec3 sy = dFdy(surfPos);
  vec3 r1 = cross(sy, n); vec3 r2 = cross(n, sx);
  float det = dot(sx, r1);
  if (abs(det) < 1e-12) return n;
  vec3 g = sign(det) * (dH.x * r1 + dH.y * r2);
  return normalize(abs(det) * n - g);
}
`;

const VERT_HEAD = /* glsl */ `varying vec3 cssRest;\n`;
// the rest position, before morphs and skinning: the pattern sticks to the cloth
const VERT_BODY = /* glsl */ `cssRest = position;\n`;

/** grain, ribs and gloss of each material, in metres of the rest pose */
function patternGlsl(kind: FinishKind): string {
  switch (kind) {
    case 'cuir':
      // pebbled leather: two octaves of cells about 1.2 mm and 0.5 mm, gloss a little lower in the grain's hollows
      return `
  float cssCell = 1.0 / 0.0012;
  float cssFade = 1.0 - smoothstep(0.15, 0.45, length(fwidth(cssRest * cssCell)));
  float cssH = (cssFNoise(cssRest * cssCell) * 0.7 + cssFNoise(cssRest * cssCell * 2.3) * 0.3) * cssFade;
  normal = cssBump(-vViewPosition, normal, cssH, 0.0014);
  float cssSlow = cssFNoise(cssRest * 60.0);
  cssRough = (cssSlow - 0.5) * 0.16 + (cssH - 0.35) * 0.12;`;
    case 'satin':
      // satin: smooth, its gloss varies over a few centimetres (where the cloth folds and catches the light)
      return `
  float cssSlow = cssFNoise(cssRest * 28.0) * 0.6 + cssFNoise(cssRest * 71.0) * 0.4;
  cssRough = (cssSlow - 0.5) * 0.22;`;
    case 'elastique':
      // knitted elastic: vertical ribs about 4 mm apart round the waist; gone well before a rib gets as thin as a
      // pixel (at 2.5 mm and a looser fade the ribs beat into chevrons on the screen: moiré)
      return `
  float cssA = atan(cssRest.x, cssRest.z) * length(cssRest.xz);
  float cssRib = cssA / 0.004;
  float cssFade = 1.0 - smoothstep(0.12, 0.3, fwidth(cssRib));
  float cssH = (0.5 + 0.5 * sin(6.2831853 * cssRib)) * cssFade;
  normal = cssBump(-vViewPosition, normal, cssH, 0.0012);
  cssRough = (cssH - 0.5) * 0.08;`;
    case 'tricot':
      // jersey: very fine knit, gives the light a soft grain instead of a smooth plastic gloss
      return `
  float cssCell = 1.0 / 0.0009;
  float cssFade = 1.0 - smoothstep(0.15, 0.45, length(fwidth(cssRest * cssCell)));
  float cssH = cssFNoise(cssRest * vec3(cssCell, cssCell * 0.55, cssCell)) * cssFade;
  normal = cssBump(-vViewPosition, normal, cssH, 0.0006);
  cssRough = (cssH - 0.5) * 0.1;`;
    case 'tissu':
      return `
  float cssCell = 1.0 / 0.0011;
  float cssFade = 1.0 - smoothstep(0.15, 0.45, length(fwidth(cssRest * cssCell)));
  float cssH = cssFNoise(cssRest * cssCell) * cssFade;
  normal = cssBump(-vViewPosition, normal, cssH, 0.0005);
  cssRough = (cssH - 0.5) * 0.08;`;
    default:
      return '';
  }
}

/**
 * Adds the 2.11.0 finish to a coach material (after its own shader changes, which it keeps). `detail` = the high quality
 * (patterns); the edge light is drawn in both qualities.
 */
export function applyFinish(m: Material, kind: FinishKind, detail: boolean) {
  if (kind === 'aucun' || m.userData.cssFinish2110) return;
  const std = m as MeshStandardMaterial;
  if (!('roughness' in std)) return;
  m.userData.cssFinish2110 = kind;
  const rim = rimOn() ? RIM_SCALE[kind] : 0;
  const pattern = detail && patternsOn() && kind !== 'peau' ? patternGlsl(kind) : '';
  // B. leather: the old normal map's blotches softened, a softer coat (the grain now gives the leather's texture)
  if (kind === 'cuir' && patternsOn()) {
    std.normalScale?.multiplyScalar(0.3);
    std.roughness = Math.max(std.roughness, 0.5);
    const ph = std as MeshStandardMaterial & { clearcoat?: number; clearcoatRoughness?: number };
    if (typeof ph.clearcoat === 'number') {
      ph.clearcoat = Math.min(ph.clearcoat, 0.18);
      ph.clearcoatRoughness = Math.max(ph.clearcoatRoughness ?? 0, 0.42);
    }
  }
  if (!rim && !pattern) return;
  const prev = m.onBeforeCompile;
  const prevKey = m.customProgramCacheKey.bind(m);
  m.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms, r) => {
    prev.call(m, shader, r);
    Object.assign(shader.uniforms, COACH_RIM);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VERT_HEAD}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${VERT_BODY}`);
    let f = shader.fragmentShader.replace('#include <common>', `#include <common>\n${HEAD}`);
    // roughnessFactor (roughnessmap_fragment) is read later by lights_physical_fragment: the pattern's gloss goes into it
    if (pattern) f = f.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n  float cssRough = 0.0;\n${pattern}\n  roughnessFactor = clamp(roughnessFactor + cssRough, 0.05, 1.0);`);
    if (rim) {
      f = f.replace(
        '#include <opaque_fragment>',
        // the light reflected takes the surface's colour: dark hair painted on the scalp stays dark (a grey sheen on
        // Amara's hair in the first captures), the skin only catches it along its true outline
        `{
    vec3 cssV = normalize(vViewPosition);
    // the surface's own shape, not its normal map: no bright line along the folds of the skin or the cloth
    vec3 cssN = normalize(nonPerturbedNormal);
    float cssFr = pow(1.0 - clamp(dot(cssN, cssV), 0.0, 1.0), ${kind === 'peau' ? '3.0' : '1.8'});
    float cssS1 = smoothstep(-0.15, 0.65, dot(cssN, cssRimDir));
    float cssS2 = smoothstep(-0.15, 0.65, dot(cssN, cssRim2Dir));
    outgoingLight += ${rim.toFixed(2)} * cssFr * (cssRimK.x * cssS1 * cssRimColor + cssRimK.y * cssS2 * cssRim2Color) * ${kind === 'peau' ? '1.4 * diffuseColor.rgb' : '(0.15 + 0.85 * diffuseColor.rgb)'};
  }
#include <opaque_fragment>`,
      );
    }
    shader.fragmentShader = f;
  };
  m.customProgramCacheKey = () => `${prevKey()}|css-finish2110-${kind}-${rim ? 1 : 0}${pattern ? 'p' : ''}`;
}
