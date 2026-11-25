/**
 * 1.34 Human Behavior & Facial Expression Engine — the registry of the characters. Every coach of the app
 * (src/domain/coaches/catalog.ts ALL_COACHES) has an entry here; the contract tests
 * (src/three/human/__tests__/contract.test.ts) fail when a coach is missing, when its model does not have the
 * capabilities its contract says, or when a new coach is declared « dégradé » (only the older models listed in
 * LEGACY_DEGRADED may be). Rules: docs/HUMAN_CHARACTER_STANDARDS.md.
 *
 * Individual features are settings of the one engine (traits, blink rate), never a separate face logic.
 */
import { DEFAULT_TRAITS, type BehaviorTraits } from './behavior';
import type { FaceLevel } from './capabilities';

export interface HumanProfile {
  /** coach id (src/domain/coaches/catalog.ts) = folder of its model in public/coaches/ */
  id: string;
  /** level the model must reach: 'complet' for every new character */
  contract: Extract<FaceLevel, 'complet' | 'os'>;
  /** why a model is allowed below « complet » (older models only) */
  degradedReason?: string;
  traits: BehaviorTraits;
  /** factor on the blink rate (1 = every 3 to 6 s) */
  blinkRate: number;
  /** 1.40 the face at rest (src/three/face.ts FACE_BASES); the default one when absent */
  faceBase?: 'actuel' | 'calme' | 'doux' | 'vif' | 'determine';
}

/** older models allowed a degraded face (facial bones only, no expressions). Never add a new coach here. */
// 1.37: empty, Axel and Kaila (MakeHuman, bones only) are removed; every coach of the app has the complete face
export const LEGACY_DEGRADED: readonly string[] = [];

const p = (id: string, traits: Partial<BehaviorTraits> = {}, blinkRate = 1, contract: HumanProfile['contract'] = 'complet', degradedReason?: string): HumanProfile => ({
  id,
  contract,
  degradedReason,
  traits: { ...DEFAULT_TRAITS, ...traits },
  blinkRate,
});

export const HUMAN_PROFILES: Record<string, HumanProfile> = {
  // 2.4.0 (Youssef 24/11 « des visages plus doux et moins crispés, humains et homogènes ») : les 6 coachs ont le même
  // visage de repos « doux », la même expressivité (0,85) et une chaleur d'au moins 1 ; seuls les sourires, le
  // clignement et l'endurance gardent de petites différences de caractère
  // Kadir, lutteur patient : visage posé, sourit peu
  'mma-kadir': { ...p('mma-kadir', { expressiveness: 0.85, warmth: 1, stamina: 1.2 }, 0.95), faceBase: 'doux' },
  // Amara, frappeuse : expressive à l'effort. 2.4.0 (Youssef 24/11 « adoucis son visage et ses expressions ») : visage
  // doux au repos, effort et concentration moins marqués, sourires un peu plus fréquents
  // 2.10.1 (Youssef 25/11 « les visages d'Amara et de Kanya ont régressé », planche « Focus visage ») : repos
  // « déterminé » comme sur la planche (paupières un peu lourdes, sans sourire)
  'mma-amara': { ...p('mma-amara', { expressiveness: 0.85, warmth: 1.15, stamina: 1 }, 1), faceBase: 'determine' },
  nael: { ...p('nael', { expressiveness: 0.85, warmth: 1.15, stamina: 1 }, 1.05), faceBase: 'doux' },
  inaya: { ...p('inaya', { expressiveness: 0.85, warmth: 1.15, stamina: 1.1 }, 1), faceBase: 'doux' },
  // 1.43 Victor, vétéran posé : visage calme, sourire rare mais chaleureux, endurant
  victor: { ...p('victor', { expressiveness: 0.85, warmth: 1, stamina: 1.2 }, 0.9), faceBase: 'doux' },
  // 1.51 Kanya, Kru : regard calme et déterminé, visage peu expressif, sourire rare, très endurante
  kanya: { ...p('kanya', { expressiveness: 0.85, warmth: 1, stamina: 1.25 }, 0.9), faceBase: 'determine' },
};

/** standard profile, given automatically to a model the registry does not know (its tests will still fail) */
export const DEFAULT_PROFILE: HumanProfile = p('defaut');

/** the profile of a coach, from its id or from the url of its model (./coaches/<id>/photo.glb) */
export function humanProfileFor(idOrUrl: string | null | undefined): HumanProfile {
  if (!idOrUrl) return DEFAULT_PROFILE;
  const id = /coaches\/([^/]+)\//.exec(idOrUrl)?.[1] ?? idOrUrl;
  return HUMAN_PROFILES[id] ?? DEFAULT_PROFILE;
}
