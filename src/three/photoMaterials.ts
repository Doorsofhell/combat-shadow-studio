import { isHeadSkin, newFaceRenderUniforms, type FaceRenderUniforms } from './human/faceRender';
import { applySkinShader, DEFAULT_SKIN, type SkinLook } from './skinShader';
import { BufferAttribute, BufferGeometry, DoubleSide, FrontSide, Material, MeshPhysicalMaterial, MeshStandardMaterial, SRGBColorSpace, type MeshStandardMaterialParameters } from 'three';

/**
 * 1.10 materials of the Ultra-réaliste coaches (PhotoCoach) and of their outfits (outfit.ts dress()).
 *
 * Audit 2026-11-03 (Youssef, « classification des yeux et des cheveux », « conservation des matériaux »):
 * - PhotoCoach took every material whose name held « opacity » for hair: the eyes (Eyes_opacity), the eyebrows
 *   and the eyelashes too. In high quality the eyes were therefore never the wet material written for them (they
 *   got the hair's alpha cut and a matte look), and the thin eyelashes lost most of their hairs to the 0.4 cut;
 * - the rebuilt materials dropped what the source said: double-sided hair cards were drawn from one side only
 *   (holes and a compact « helmet » from behind), vertex colours, the colour factor, roughness and occlusion maps
 *   were lost; dress() did the same to the garments in high quality (loose shorts are double-sided).
 * Now each part is classified explicitly (glTF extras `css_kind` first, then known names) and every rebuilt material
 * starts from all the standard properties of its source; only what the look needs is changed on top.
 */
export type PhotoPart = 'peau' | 'yeux' | 'cheveux' | 'sourcils' | 'cils';

const KINDS: readonly PhotoPart[] = ['peau', 'yeux', 'cheveux', 'sourcils', 'cils'];

/** the part of the body a material of a photo coach dresses (Rocketbox: m021_body/head, Eyes_opacity; MakeHuman:
 * Skin, Eyes_opacity, Eyebrows_opacity, Eyelashes_opacity, Hair_opacity) */
export function photoPart(m: Pick<Material, 'name' | 'userData'>): PhotoPart {
  const k = m.userData?.css_kind;
  if (typeof k === 'string' && (KINDS as readonly string[]).includes(k)) return k as PhotoPart;
  const n = m.name.toLowerCase();
  if (/eyebrow|sourcil/.test(n)) return 'sourcils';
  if (/eyelash|lash|cils/.test(n)) return 'cils';
  if (/^eyes?([_\s-]|$)|cornea|iris|yeux/.test(n)) return 'yeux';
  if (/hair|cheveu|ponytail|braid|opacity/.test(n)) return 'cheveux';
  return 'peau';
}

/** every property of a standard material worth keeping, as constructor parameters (textures are shared, not copied) */
export function standardParams(m: MeshStandardMaterial): MeshStandardMaterialParameters {
  return {
    name: m.name,
    color: m.color.clone(),
    map: m.map,
    lightMap: m.lightMap,
    lightMapIntensity: m.lightMapIntensity,
    aoMap: m.aoMap,
    aoMapIntensity: m.aoMapIntensity,
    emissive: m.emissive.clone(),
    emissiveMap: m.emissiveMap,
    emissiveIntensity: m.emissiveIntensity,
    bumpMap: m.bumpMap,
    bumpScale: m.bumpScale,
    normalMap: m.normalMap,
    normalMapType: m.normalMapType,
    // the loader flips the green channel when the model has no tangents: the scale carries that, keep it
    normalScale: m.normalScale.clone(),
    roughness: m.roughness,
    roughnessMap: m.roughnessMap,
    metalness: m.metalness,
    metalnessMap: m.metalnessMap,
    alphaMap: m.alphaMap,
    envMapIntensity: m.envMapIntensity,
    vertexColors: m.vertexColors,
    side: m.side,
    transparent: m.transparent,
    opacity: m.opacity,
    alphaTest: m.alphaTest,
    alphaToCoverage: m.alphaToCoverage,
    depthWrite: m.depthWrite,
    flatShading: m.flatShading,
    userData: { ...m.userData },
  };
}

/** a physical material holding all the source's standard properties, plus the given physical ones */
export function physicalFrom(m: MeshStandardMaterial, extra: ConstructorParameters<typeof MeshPhysicalMaterial>[0] = {}) {
  return new MeshPhysicalMaterial({ ...standardParams(m), ...extra });
}

export type PhotoLook = SkinLook;

/**
 * 1.10 per coach (Youssef: « calibrez les paramètres par coach », « n'appliquez pas une amplification globale »):
 * 1.9 drew every skin's anatomy 1.5 times deeper. The Rocketbox photo skins (Kadir, Amara) already carry the
 * muscles in their photo and their normal map: 1.2 and 1.15. (The MakeHuman skins of Axel and Kaila, removed in 1.37,
 * had 1.5 and 1.35.)
 */
export const SKIN_LOOK: Record<string, SkinLook> = {
  // 1.48.0: individual, mobile-friendly calibration; colours and anatomical relief unchanged.
  'mma-kadir': { ...DEFAULT_SKIN, relief: 1.2, pores: 0.035, roughVar: 0.14, tintVar: 0.05, wrap: 0.45, shadowLift: 0.36 },
  // 1.47.1 Amara-only semi-realistic skin study: retain original relief, wrap, colour and geometry;
  // slightly enrich high-quality roughness and tint variation without touching other coaches.
  // 1.37.8: only Amara, shader-only: clearer muscle highlights without any mesh, garment or rig change.
  // Keep colour, pores and skin texture identical; small gain to normal-map relief and local contrast.
  // 2.4.0 prototype 2 (Youssef 20/11 14:30 « supprimer la dominante orange », « peau mate naturelle », « pas d'ombres
  // musculaires cuites ») : teinte désaturée et refroidie, diffusion moins rouge, relief de l'anatomie adouci
  'mma-amara': { ...DEFAULT_SKIN, relief: 1.0, pores: 0.03, roughVar: 0.15, tintVar: 0.04, wrap: 0.43, shadowLift: 0.36, tint: [1, 0.6, 0.48], sat: 0.84, gain: 1.06, warm: -0.07 },
  // 1.11 Naël and Inaya: Rocketbox photo skins like Kadir and Amara (same relief maps); lighter skins, the
  // scattering a little warmer
  // 1.21 same light as Kadir (Inaya got Amara's in 1.20): the wider wrap softened the shadows between the muscles
  nael: { ...DEFAULT_SKIN, relief: 1.2, pores: 0.035, roughVar: 0.13, tintVar: 0.045, wrap: 0.45, shadowLift: 0.34, tint: [1, 0.55, 0.42] },
  // 1.20 (Youssef 05/11 14:09, Amara's muscles « bien dessinés »): Inaya's wrapped light was wider than Amara's
  // (0.55 for 0.45) and softened the shadows between the muscles; same as Amara now
  // 1.43 Victor: the Kadir photo skin repainted (tan of Youssef's sheets): Kadir's light and relief
  // 2.4.0 prototype 2 (« supprimer les taches et marbrures ») : teinte moins saturée, relief cuit adouci
  victor: { ...DEFAULT_SKIN, relief: 1.05, pores: 0.022, roughVar: 0.11, tintVar: 0.012, wrap: 0.45, shadowLift: 0.38, cleanBody: true, tint: [1, 0.56, 0.44], sat: 0.88, warm: -0.04 },
  // 2.4.0 prototype 2 (Youssef 25/11, maquette des femmes, « fais mieux ») : peau plus claire et unie, ombres plus douces
  inaya: { ...DEFAULT_SKIN, relief: 1.0, pores: 0.025, roughVar: 0.12, tintVar: 0.015, wrap: 0.48, shadowLift: 0.4, tint: [1, 0.52, 0.38], sat: 1.0, gain: 0.92, warm: 0.03 },
  // 1.51 Kanya: Inaya's photo skin repainted to the tone of Youssef's sheets (the texture already carries the tone: no
  // gain, the light and relief of Inaya's body)
  // 2.4.0 prototype 2 (maquette des femmes) : peau unie, ombres plus douces
  kanya: { ...DEFAULT_SKIN, relief: 1.0, pores: 0.025, roughVar: 0.12, tintVar: 0.015, wrap: 0.48, shadowLift: 0.4, tint: [1, 0.52, 0.38] },
};

/** 1.48 premium material finish: calibrated individually, never changes body proportions or facial expressions. */
export const PREMIUM_FINISH: Partial<Record<keyof typeof SKIN_LOOK, {
  bodySheen: number; faceSheen: number; bodySpecular: number; faceSpecular: number; eyeRoughness: number; hairScale: number;
}>> = {
  'mma-kadir': { bodySheen: 0.12, faceSheen: 0.13, bodySpecular: 0.24, faceSpecular: 0.25, eyeRoughness: 0.20, hairScale: 1 },
  'mma-amara': { bodySheen: 0.15, faceSheen: 0.14, bodySpecular: 0.27, faceSpecular: 0.26, eyeRoughness: 0.19, hairScale: 0.92 },
  nael: { bodySheen: 0.14, faceSheen: 0.13, bodySpecular: 0.27, faceSpecular: 0.26, eyeRoughness: 0.19, hairScale: 0.96 },
  inaya: { bodySheen: 0.13, faceSheen: 0.12, bodySpecular: 0.25, faceSpecular: 0.24, eyeRoughness: 0.20, hairScale: 0.97 },
  victor: { bodySheen: 0.12, faceSheen: 0.13, bodySpecular: 0.24, faceSpecular: 0.26, eyeRoughness: 0.20, hairScale: 0.98 },
  kanya: { bodySheen: 0.13, faceSheen: 0.12, bodySpecular: 0.25, faceSpecular: 0.24, eyeRoughness: 0.20, hairScale: 0.97 },
};

/** 1.50.0 isolated optical pilot — NEVER changes vertices, neck or GLSL. */
export const FIGHTER_PILOT_150: Partial<Record<keyof typeof SKIN_LOOK, {
  faceSheen: number;
  bodySheen: number;
  faceSpecular: number;
  bodySpecular: number;
  sheenRoughnessFace: number;
  sheenRoughnessBody: number;
  eyeRoughness: number;
  hairScale: number;
}>> = {
  'mma-amara': {
    faceSheen: 0.17, bodySheen: 0.19, faceSpecular: 0.33, bodySpecular: 0.35,
    sheenRoughnessFace: 0.76, sheenRoughnessBody: 0.78,
    eyeRoughness: 0.16, hairScale: 0.89,
  },
  victor: {
    faceSheen: 0.15, bodySheen: 0.16, faceSpecular: 0.31, bodySpecular: 0.32,
    sheenRoughnessFace: 0.77, sheenRoughnessBody: 0.79,
    eyeRoughness: 0.17, hairScale: 0.93,
  },
  // 1.51.0: individual non-GLSL optical profiles, preserving each coach's identity.
  'mma-kadir': {
    faceSheen: 0.16, bodySheen: 0.17, faceSpecular: 0.31, bodySpecular: 0.33,
    sheenRoughnessFace: 0.77, sheenRoughnessBody: 0.79,
    eyeRoughness: 0.175, hairScale: 0.96,
  },
  nael: {
    faceSheen: 0.16, bodySheen: 0.17, faceSpecular: 0.32, bodySpecular: 0.33,
    sheenRoughnessFace: 0.77, sheenRoughnessBody: 0.79,
    eyeRoughness: 0.16, hairScale: 0.93,
  },
  inaya: {
    faceSheen: 0.15, bodySheen: 0.16, faceSpecular: 0.30, bodySpecular: 0.31,
    sheenRoughnessFace: 0.78, sheenRoughnessBody: 0.80,
    eyeRoughness: 0.175, hairScale: 0.94,
  },
  // 1.54.0 Kanya: built on Inaya's body and photo skin, she takes Inaya's validated profile
  kanya: {
    faceSheen: 0.15, bodySheen: 0.16, faceSpecular: 0.30, bodySpecular: 0.31,
    sheenRoughnessFace: 0.78, sheenRoughnessBody: 0.80,
    eyeRoughness: 0.175, hairScale: 0.94,
  },
};

function pilot150(look: SkinLook) {
  look = source(look);
  const id = Object.keys(SKIN_LOOK).find((k) => SKIN_LOOK[k] === look);
  return id ? FIGHTER_PILOT_150[id] : undefined;
}

function premiumFinish(look: SkinLook) {
  look = source(look);
  const id = Object.keys(SKIN_LOOK).find((k) => SKIN_LOOK[k] === look);
  return id ? PREMIUM_FINISH[id] : undefined;
}

export function skinLookFor(url: string): SkinLook {
  const id = Object.keys(SKIN_LOOK).find((k) => url.includes(`/${k}/`));
  const look = id ? SKIN_LOOK[id] : DEFAULT_SKIN;
  const fx = skinIsolation();
  if (!fx) return look;
  // 2.2.0 Lab only (?fx=pores,teinte,...): the same look with the named effects switched off, to find which effect
  // makes a defect (Youssef 19/11 § 5 « isoler chaque effet »). Never set by the app itself.
  const x: SkinLook = { ...look };
  if (fx.has('relief')) x.relief = 0;
  if (fx.has('diffusion')) { x.wrap = 0; }
  if (fx.has('ombres')) x.shadowLift = 0;
  if (fx.has('pores')) x.pores = 0;
  if (fx.has('rugosite')) x.roughVar = 0;
  if (fx.has('teinte')) x.tintVar = 0;
  if (fx.has('etalonnage')) { x.sat = 1; x.gain = 1; x.warm = 0; }
  if (fx.has('nettoyage')) x.cleanBody = false;
  isolated.set(x, look);
  return x;
}

/** 2.2.0 effets coupés pour l'étude d'isolation du Lab (?fx=), null dans l'application */
export function skinIsolation(): Set<string> | null {
  const f = (globalThis as { __cssSkinFx?: string }).__cssSkinFx;
  return f ? new Set(f.split(',')) : null;
}
/** the look a Lab isolation copy was made from (the per-coach finish tables are keyed by the original) */
const isolated = new WeakMap<SkinLook, SkinLook>();
const source = (look: SkinLook) => isolated.get(look) ?? look;

/**
 * The material drawn for one part of a photo coach. Skin: closed surface, front faces only (as in 1.9: the back
 * faces of a double-sided body lit the inside of the lips and the ears from the wrong side). Eyes: wet, a sharp
 * highlight under a clear coat (cornea). Hair, eyebrows, eyelashes: alpha cards seen from both sides, cut with
 * alpha to coverage (no sorting, smooth edges with the canvas multisampling); the fine hairs of the brows and lashes
 * keep a lower cut, or they vanish.
 */
export function photoMaterial(old: MeshStandardMaterial, part: PhotoPart, quality: 'haute' | 'basse', look: PhotoLook): MeshStandardMaterial {
  if (old.map) old.map.colorSpace = SRGBColorSpace;
  // 1.49.0 experimental premium filter: increase texture clarity at grazing
  // viewing angles only in 'haute'. Does NOT change resolution, UVs or geometry.
  // The source glTF texture objects are cached; never reduce a higher value.
  const filtering = quality === 'haute' && premiumFinish(look) ? 8 : 4;
  for (const t of [old.map, old.normalMap, old.roughnessMap]) {
    if (t) t.anisotropy = Math.max(t.anisotropy, filtering);
  }
  const base = standardParams(old);
  const hi = quality === 'haute';
  switch (part) {
    case 'peau': {
      const normalScale = old.normalScale.clone().multiplyScalar(look.relief);
      // 1.12: a model can ask for its body skin from both sides (`bothSides` in the glTF material's extras, set by
      // tools/generator/rocketbox/both_sides.py): Inaya's halter straps make a fold whose inner wall faces away
      const side = old.userData?.bothSides ? DoubleSide : FrontSide;
      // 1.46 Kadir: a body roughness map (matte boxer, skin less smooth than the shared 0.58): the map gives the value
      const rough = old.roughnessMap ? 1 : 0.58;
      const p: MeshStandardMaterialParameters = { ...base, normalScale, side, metalness: 0, roughness: rough, transparent: false, alphaTest: 0 };
      const m = hi
        ? new MeshPhysicalMaterial({ ...p, sheen: 0.3, sheenRoughness: 0.6, sheenColor: '#c98a72', specularIntensity: 0.4 })
        : new MeshStandardMaterial({ ...p, roughness: old.roughnessMap ? 1 : 0.6 });
      // 1.48.0: calibrated material finish on each photo coach (not a copy of Amara's face).
      const finish = premiumFinish(look);
      if (hi && finish && m instanceof MeshPhysicalMaterial) {
        const head = isHeadSkin(old);
        m.sheen = head ? finish.faceSheen : finish.bodySheen;
        m.sheenRoughness = head ? 0.86 : 0.84;
        m.specularIntensity = head ? finish.faceSpecular : finish.bodySpecular;
        // 1.49.0: restrained high-quality premium lighting response.
        // Kept to material parameters — no GLSL rewriting after 1.48.1.
        m.sheenRoughness = head ? 0.79 : 0.81;
        m.specularIntensity = Math.min(0.38, m.specularIntensity + 0.04);
        const fighter = pilot150(look);
        if (fighter) {
          m.sheen = head ? fighter.faceSheen : fighter.bodySheen;
          m.sheenRoughness = head ? fighter.sheenRoughnessFace : fighter.sheenRoughnessBody;
          m.specularIntensity = head ? fighter.faceSpecular : fighter.bodySpecular;
          m.userData.cssFighterPilot150 = true;
        }
        if (skinIsolation()?.has('brillance')) { m.sheen = 0; m.specularIntensity = 0.2; }
        m.userData.cssPremium149 = true;
        m.userData.cssPremiumFinish = true;
        // Historic regression flags retained for the Amara-specific test.
        if (source(look) === SKIN_LOOK['mma-amara']) m.userData[head ? 'cssAmaraFaceFinish' : 'cssAmaraBodyFinish'] = true;
      }
      // scattering and lifted shadows in both qualities (a few instructions), pores in high quality only
      // 1.44 the head's skin also carries the face's soft zones (src/three/human/faceRender.ts)
      applySkinShader(m, look, hi, isHeadSkin(old));
      return m;
    }
    case 'yeux': {
      // drawn opaque, so the eye never sorts against the lashes or the lids. The MakeHuman eye has an outer shell
      // (the cornea) mapped on the 1 % of its texture that is transparent: it stays cut out (alpha test), or it
      // covers the iris in black; the wet look of the cornea is the clear coat of the eye itself
      const cut = old.transparent || old.alphaTest > 0 ? 0.5 : 0;
      const p: MeshStandardMaterialParameters = { ...base, metalness: 0, roughness: 0.18, transparent: false, alphaTest: cut, depthWrite: true };
      const m = hi ? new MeshPhysicalMaterial({ ...p, clearcoat: 1, clearcoatRoughness: 0.04, specularIntensity: 0.8 }) : new MeshStandardMaterial({ ...p, roughness: 0.12 });
      // 1.48.0: subtle corneal highlights, with individual roughness.
      const eyeFinish = premiumFinish(look);
      if (hi && eyeFinish && m instanceof MeshPhysicalMaterial) {
        m.roughness = eyeFinish.eyeRoughness;
        m.clearcoatRoughness = 0.045;
        m.specularIntensity = 0.78;
        m.roughness = Math.max(0.14, eyeFinish.eyeRoughness - 0.025);
        m.clearcoatRoughness = 0.038;
        m.userData.cssPremium149 = true;
        const fighter = pilot150(look);
        if (fighter) {
          m.roughness = fighter.eyeRoughness;
          m.userData.cssFighterPilot150 = true;
        }
        m.userData.cssPremiumEyes = true;
      }
      eyeCatchlight(m);
      return m;
    }
    case 'cheveux': {
      const m = new MeshStandardMaterial({ ...base, metalness: 0, roughness: Math.max(0.55, old.roughness), side: DoubleSide, transparent: false, alphaTest: 0.4, alphaToCoverage: true, depthWrite: true });
      // Per-coach hair finish; never alter alpha edges, geometry or depth order.
      const hairFinish = premiumFinish(look);
      if (hi && hairFinish) {
        m.roughness = Math.max(0.48, old.roughness * hairFinish.hairScale * 0.94);
        const fighter = pilot150(look);
        if (fighter) {
          m.roughness = Math.max(0.48, old.roughness * fighter.hairScale);
          m.userData.cssFighterPilot150 = true;
        }
        m.userData.cssPremium149 = true;
      }
      fadeHairEnds(m);
      return m;
    }
    case 'sourcils':
    case 'cils':
      return new MeshStandardMaterial({ ...base, metalness: 0, side: DoubleSide, transparent: false, alphaTest: 0.3, alphaToCoverage: true, depthWrite: true });
  }
}

/**
 * 1.39 (Youssef 13/11: « le visage reste trop figé… pas du tout naturel »): verified in the Lab, the eyes showed no
 * highlight at all in close-up (the studio lights sit above and to the side, the eyes deep under the brows): matte,
 * « dead » eyes. A real eye always carries the small reflection of the light in front of it (the catchlight). Each eye
 * gets one: a sharp highlight of a soft light just above the viewer, computed in view space (it follows the camera, as
 * the window reflected in a real eye does), a few instructions, both qualities.
 */
// 1.40.3 (Youssef 13/11 23:24: « le point blanc dans les yeux fait trop, soit retire soit réduit beaucoup »): the dot
// was a white disc about a third of the iris wide. Now about 5 times dimmer and smaller: a faint wet glint, no dot.
export const EYE_CATCHLIGHT = { dir: [-0.18, 0.05, 1] as [number, number, number], sharpness: 700, strength: 0.45 };

export function eyeCatchlight(m: Material) {
  const [x, y, z] = EYE_CATCHLIGHT.dir;
  m.onBeforeCompile = (shader) => {
    const fr: FaceRenderUniforms = m.userData.cssFaceRender ?? newFaceRenderUniforms();
    shader.uniforms.cssEyeUp = fr.cssEyeUp;
    shader.uniforms.cssLidShade = fr.cssLidShade;
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 cssEyeUp;\nuniform float cssLidShade;').replace(
      '#include <opaque_fragment>',
      `{
        vec3 cssV = normalize(vViewPosition);
        vec3 cssH = normalize(normalize(vec3(${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)})) + cssV);
        outgoingLight += vec3(${EYE_CATCHLIGHT.strength.toFixed(3)}) * pow(max(dot(normalize(normal), cssH), 0.0), ${EYE_CATCHLIGHT.sharpness.toFixed(1)});
        // 1.44 the upper lid shades the top of the eyeball (the head's up, not the eye's: the shade stays as the eye
        // turns), softly
        outgoingLight *= 1.0 - cssLidShade * smoothstep(0.15, 0.7, dot(normalize(normal), cssEyeUp));
      }
      #include <opaque_fragment>`,
    );
  };
  m.customProgramCacheKey = () => 'css-eye-catchlight-v1403-lid144';
  m.userData.cssCatchlight = true;
}

/**
 * 1.10 (« effet casque », « travaillez d'abord la silhouette et l'implantation »): the hair cards ended at the nape on
 * a hard, opaque line (Axel's short cut read as a helmet from behind). The lowest 2.5 cm of a hair mesh thin out
 * (alpha times a ramp read from the attribute cssHairFade, prepared once per geometry by hairFadeAttribute), so
 * the hairline at the nape and the tips of a ponytail fade into single strands as real hair does.
 */
export function hairFadeAttribute(geometry: BufferGeometry, span = 0.025) {
  if (geometry.getAttribute('cssHairFade')) return;
  const pos = geometry.getAttribute('position');
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    lo = Math.min(lo, pos.getY(i));
    hi = Math.max(hi, pos.getY(i));
  }
  // the Rocketbox and MakeHuman files may be in metres or centimetres: the span follows the size of the head's hair
  const unit = hi - lo > 5 ? 100 : 1;
  const f = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const t = Math.min(1, Math.max(0, (pos.getY(i) - lo) / (span * unit)));
    f[i] = 0.35 + 0.65 * t * t * (3 - 2 * t);
  }
  geometry.setAttribute('cssHairFade', new BufferAttribute(f, 1));
}

function fadeHairEnds(m: Material) {
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float cssHairFade;\nvarying float vCssHairFade;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCssHairFade = cssHairFade;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vCssHairFade;')
      .replace('#include <alphamap_fragment>', '#include <alphamap_fragment>\ndiffuseColor.a *= vCssHairFade;');
  };
  m.customProgramCacheKey = () => 'css-hair-fade';
}
