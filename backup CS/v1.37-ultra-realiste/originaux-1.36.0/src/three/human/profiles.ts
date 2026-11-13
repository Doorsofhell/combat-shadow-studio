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
}

/** older models allowed a degraded face (facial bones only, no expressions). Never add a new coach here. */
export const LEGACY_DEGRADED = ['axel', 'kaila'] as const;

const p = (id: string, traits: Partial<BehaviorTraits> = {}, blinkRate = 1, contract: HumanProfile['contract'] = 'complet', degradedReason?: string): HumanProfile => ({
  id,
  contract,
  degradedReason,
  traits: { ...DEFAULT_TRAITS, ...traits },
  blinkRate,
});

const BONES_ONLY = 'Modèle MakeHuman (1.9) : os du visage seulement (paupières, sourcils, coins de la bouche, mâchoire, yeux), pas de morph targets ; regard, clignements, respiration, effort et états fonctionnent, sourire et bouche plus limités.';

export const HUMAN_PROFILES: Record<string, HumanProfile> = {
  // Kadir, lutteur patient : visage posé, sourit peu
  'mma-kadir': p('mma-kadir', { expressiveness: 1, warmth: 0.8, stamina: 1.2 }, 0.95),
  // Amara, frappeuse : expressive à l'effort
  'mma-amara': p('mma-amara', { expressiveness: 1.1, warmth: 1, stamina: 1 }, 1),
  nael: p('nael', { expressiveness: 1, warmth: 1.1, stamina: 1 }, 1.05),
  inaya: p('inaya', { expressiveness: 1.05, warmth: 1, stamina: 1.1 }, 1),
  axel: p('axel', { expressiveness: 1, warmth: 1, stamina: 1 }, 1, 'os', BONES_ONLY),
  kaila: p('kaila', { expressiveness: 1, warmth: 1, stamina: 1 }, 1, 'os', BONES_ONLY),
};

/** standard profile, given automatically to a model the registry does not know (its tests will still fail) */
export const DEFAULT_PROFILE: HumanProfile = p('defaut');

/** the profile of a coach, from its id or from the url of its model (./coaches/<id>/photo.glb) */
export function humanProfileFor(idOrUrl: string | null | undefined): HumanProfile {
  if (!idOrUrl) return DEFAULT_PROFILE;
  const id = /coaches\/([^/]+)\//.exec(idOrUrl)?.[1] ?? idOrUrl;
  return HUMAN_PROFILES[id] ?? DEFAULT_PROFILE;
}
