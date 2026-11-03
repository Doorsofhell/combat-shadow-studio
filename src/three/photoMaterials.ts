import { DoubleSide, FrontSide, Material, MeshPhysicalMaterial, MeshStandardMaterial, SRGBColorSpace, type MeshStandardMaterialParameters } from 'three';

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

export interface PhotoLook {
  /** depth of the skin's normal map (1 = as exported) */
  skinRelief: number;
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
      const normalScale = old.normalScale.clone().multiplyScalar(look.skinRelief);
      const p: MeshStandardMaterialParameters = { ...base, normalScale, side: FrontSide, metalness: 0, roughness: 0.58, transparent: false, alphaTest: 0 };
      return hi
        ? new MeshPhysicalMaterial({ ...p, sheen: 0.3, sheenRoughness: 0.6, sheenColor: '#c98a72', specularIntensity: 0.4 })
        : new MeshStandardMaterial({ ...p, roughness: 0.6 });
    }
    case 'yeux': {
      // drawn opaque, so the eye never sorts against the lashes or the lids. The MakeHuman eye has an outer shell
      // (the cornea) mapped on the 1 % of its texture that is transparent: it stays cut out (alpha test), or it
      // covers the iris in black; the wet look of the cornea is the clear coat of the eye itself
      const cut = old.transparent || old.alphaTest > 0 ? 0.5 : 0;
      const p: MeshStandardMaterialParameters = { ...base, metalness: 0, roughness: 0.18, transparent: false, alphaTest: cut, depthWrite: true };
      return hi ? new MeshPhysicalMaterial({ ...p, clearcoat: 1, clearcoatRoughness: 0.04, specularIntensity: 0.8 }) : new MeshStandardMaterial({ ...p, roughness: 0.12 });
    }
    case 'cheveux':
      return new MeshStandardMaterial({ ...base, metalness: 0, roughness: Math.max(0.55, old.roughness), side: DoubleSide, transparent: false, alphaTest: 0.4, alphaToCoverage: true, depthWrite: true });
    case 'sourcils':
    case 'cils':
      return new MeshStandardMaterial({ ...base, metalness: 0, side: DoubleSide, transparent: false, alphaTest: 0.3, alphaToCoverage: true, depthWrite: true });
  }
}
