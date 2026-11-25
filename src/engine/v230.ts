/**
 * 2.3.0 (Lot 2, « Biomécanique et animations de combat AAA », Youssef 2026-11-19): the engine changes of this lot,
 * each one behind its own switch so that a change that fails can be turned back alone without undoing the others,
 * and so that the Lab can show the same coach, pose and camera before and after (?v230=0 turns them all off,
 * ?v230=-legArc turns one off). Measures and reasons: docs/v230/RAPPORT_V230.md.
 *
 * - legArc: a foot in the air travels about the hip (the leg swings from its joint) instead of on a straight line
 *   between two key poses; the straight line folded the leg completely when a high kick came back to its chamber
 *   and the knee whipped across (measured 27 % of the height in 1/60 s on every coach).
 * - chainLead: on punches, the pelvis leads the shoulders from the very start of the blow (the lead faded in over
 *   0.15 s, longer than a jab takes to land, so hips and shoulders peaked together).
 * - snap: the fist, elbow or knee no longer waits frozen at full extension (the impact pose was held 30 to 40 ms
 *   after having arrived at full speed, then left from rest: a dead stop, then a restart).
 * - armLag: in the « drive » key of the uppercuts the striking arm is left partly behind while the hips and the
 *   shoulders turn, then rises last (see author.lagHand). Tried on the hooks, straights and elbows too: no gain or a
 *   slower fist at impact there (docs/v230/RAPPORT_V230.md), so not kept for them.
 * - twistCap: the rig never turns an elbow or a knee a long way round its limb to settle a small excess of shoulder
 *   or hip rotation (the root it found jumped from one side to the other between two images: the elbow whipped over,
 *   158 to 163° in 1/60 s on the overhand and the sprawl).
 * - poleSlerp (tried, OFF): where an elbow or a knee points turns at a steady rate between two keys instead of a
 *   straight blend. No gain on the ukemi it was meant for (the flip there comes from the shoulder reading), and the
 *   forearm went through the trunk on the changement de base (5,8 cm) and the hand on the middle kick (3,7 cm).
 * - overhandPath: the overhand's fist is no longer cocked beside the ear (see boxing.ts, OVERHAND).
 * - sprawlPath (2.4.0, lot 3): the sprawl's hands go lower and less far on the way down: the shoulder no longer
 *   reaches its stop with the arm raised high, where the elbow whipped round (mma.ts).
 * - sotoPole (2.4.0, lot 3): o-soto-gari, the knee of the reaping leg points down instead of back; the knee no
 *   longer whips round between the swing and the reap (grappling.ts).
 * - kneeRelease (2.4.0, lot 3): knee strikes (not in the clinch), the knee starts down while the hands go back to
 *   guard instead of waiting at the impact (stop 150 ms → about 60 ms) (legs.ts).
 * - idleLife: the guard's bounce no longer repeats identically every 0.9 s (correlation 0.999 from one bounce to
 *   the next), and the living guard's drift scales with the coach's height.
 */
export interface V230Flags {
  legArc: boolean;
  chainLead: boolean;
  snap: boolean;
  idleLife: boolean;
  armLag: boolean;
  twistCap: boolean;
  poleSlerp: boolean;
  overhandPath: boolean;
  sprawlPath: boolean;
  sotoPole: boolean;
  kneeRelease: boolean;
}

export const V230: V230Flags = { legArc: true, chainLead: true, snap: true, idleLife: true, armLag: true, twistCap: true, poleSlerp: false, overhandPath: true, sprawlPath: true, sotoPole: true, kneeRelease: true };

/** signature of the switches, for the caches built from them (motion library) */
export const v230Key = () => (Object.keys(V230) as (keyof V230Flags)[]).map((k) => (V230[k] ? 1 : 0)).join('');

/** reads ?v230=0 (all off) or ?v230=-legArc,-snap (some off); for the Lab and the comparisons only */
const DEFAULTS: V230Flags = { ...V230 };

export function setV230FromQuery(value: string | null) {
  Object.assign(V230, DEFAULTS);
  if (value === null) return;
  if (value === '0') {
    for (const k of Object.keys(V230) as (keyof V230Flags)[]) V230[k] = false;
    return;
  }
  for (const part of value.split(',')) {
    const k = part.replace(/^-/, '') as keyof V230Flags;
    if (k in V230) V230[k] = !part.startsWith('-');
  }
}

// tests and measures in Node: V230=0 or V230=-snap,-legArc runs the suite with some changes switched off
const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.V230;
if (env !== undefined) setV230FromQuery(env);
