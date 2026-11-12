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
  'mma-kadir': { ...DEFAULT_SKIN, relief: 1.2, pores: 0.035, wrap: 0.45, shadowLift: 0.36 },
  // 1.37.8: only Amara, shader-only: clearer muscle highlights without any mesh, garment or rig change.
  // Keep colour, pores and skin texture identical; small gain to normal-map relief and local contrast.
  'mma-amara': { ...DEFAULT_SKIN, relief: 1.21, pores: 0.03, wrap: 0.43, shadowLift: 0.33 },
  // 1.11 Naël and Inaya: Rocketbox photo skins like Kadir and Amara (same relief maps); lighter skins, the
  // scattering a little warmer
  // 1.21 same light as Kadir (Inaya got Amara's in 1.20): the wider wrap softened the shadows between the muscles
  nael: { ...DEFAULT_SKIN, relief: 1.2, pores: 0.035, wrap: 0.45, shadowLift: 0.34, tint: [1, 0.55, 0.42] },
  // 1.20 (Youssef 05/11 14:09, Amara's muscles « bien dessinés »): Inaya's wrapped light was wider than Amara's
  // (0.55 for 0.45) and softened the shadows between the muscles; same as Amara now
  inaya: { ...DEFAULT_SKIN, relief: 1.15, pores: 0.03, wrap: 0.45, shadowLift: 0.32, tint: [1, 0.52, 0.38], sat: 1.12, gain: 0.8, warm: 0.12 },
};

export function skinLookFor(url: string): SkinLook {
  const id = Object.keys(SKIN_LOOK).find((k) => url.includes(`/${k}/`));
  return id ? SKIN_LOOK[id] : DEFAULT_SKIN;
}

/**
 * The material drawn for one part of a photo coach. Skin: closed surface, front faces only (as in 1.9: the back
 * faces of a double-sided body lit the inside of the lips and the ears from the wrong side). Eyes: wet, a sharp
 * highlight under a clear coat (cornea). Hair, eyebrows, eyelashes: alpha cards seen from both sides, cut with
 * alpha to coverage (no sorting, smooth edges with the canvas multisampling); the fine hairs of the brows and lashes
 * keep a lower cut, or they vanish.
 */
export function photoMaterial(old: MeshStandardMaterial, part: PhotoPart, quality: 'haute' | 'basse', look: PhotoLook): MeshStandardMaterial {
  if (old.map) old.map.colorSpace = SRGBColorSpace;
  // v0.31: anisotropic filtering keeps the skin's detail at grazing angles (4 samples: cheap on phones)
  for (const t of [old.map, old.normalMap, old.roughnessMap]) if (t) t.anisotropy = 4;
  const base = standardParams(old);
  const hi = quality === 'haute';
  switch (part) {
    case 'peau': {
      const normalScale = old.normalScale.clone().multiplyScalar(look.relief);
      // 1.12: a model can ask for its body skin from both sides (`bothSides` in the glTF material's extras, set by
      // tools/generator/rocketbox/both_sides.py): Inaya's halter straps make a fold whose inner wall faces away
      const side = old.userData?.bothSides ? DoubleSide : FrontSide;
      const p: MeshStandardMaterialParameters = { ...base, normalScale, side, metalness: 0, roughness: 0.58, transparent: false, alphaTest: 0 };
      const m = hi
        ? new MeshPhysicalMaterial({ ...p, sheen: 0.3, sheenRoughness: 0.6, sheenColor: '#c98a72', specularIntensity: 0.4 })
        : new MeshStandardMaterial({ ...p, roughness: 0.6 });
      // scattering and lifted shadows in both qualities (a few instructions), pores in high quality only
      applySkinShader(m, look, hi);
      return m;
    }
    case 'yeux': {
      // drawn opaque, so the eye never sorts against the lashes or the lids. The MakeHuman eye has an outer shell
      // (the cornea) mapped on the 1 % of its texture that is transparent: it stays cut out (alpha test), or it
      // covers the iris in black; the wet look of the cornea is the clear coat of the eye itself
      const cut = old.transparent || old.alphaTest > 0 ? 0.5 : 0;
      const p: MeshStandardMaterialParameters = { ...base, metalness: 0, roughness: 0.18, transparent: false, alphaTest: cut, depthWrite: true };
      return hi ? new MeshPhysicalMaterial({ ...p, clearcoat: 1, clearcoatRoughness: 0.04, specularIntensity: 0.8 }) : new MeshStandardMaterial({ ...p, roughness: 0.12 });
    }
    case 'cheveux': {
      const m = new MeshStandardMaterial({ ...base, metalness: 0, roughness: Math.max(0.55, old.roughness), side: DoubleSide, transparent: false, alphaTest: 0.4, alphaToCoverage: true, depthWrite: true });
      fadeHairEnds(m);
      return m;
    }
    case 'sourcils':
    case 'cils':
      return new MeshStandardMaterial({ ...base, metalness: 0, side: DoubleSide, transparent: false, alphaTest: 0.3, alphaToCoverage: true, depthWrite: true });
  }
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
