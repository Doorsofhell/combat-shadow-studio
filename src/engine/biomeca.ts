/**
 * Opt-in experimental motion pipeline.
 *
 * The existing renderers, rigs, IK solver, timing and motion catalog are NOT modified.
 * We clone only the motion keys being evaluated, so changing the option can never
 * alter the premium or fallback libraries (including their southpaw mirrors).
 *
 * Stage 1: evaluate a more compact wind-up and elbow plane for the diagonal
 * Muay Thai elbow on both reference humanoids. Other techniques deliberately use
 * the validated existing library until their own references and tests are ready.
 */
import type { Motion } from './motion';
import type { CoachRig } from './rig';
import type { MotionLibrary } from './library';

const cache = new WeakMap<CoachRig, WeakMap<MotionLibrary, MotionLibrary>>();

const DIAGONAL_ELBOW = /^coude-diagonal-(avant|arriere)$/;

function refineDiagonalElbow(motion: Motion, bodyScale: number): Motion {
  const side = motion.id.endsWith('avant') ? 1 : -1;
  const keys = motion.keys.map((key) => ({ ...key, pose: structuredClone(key.pose) }));
  const setPhase = (
    time: number,
    shift: { x: number; y: number; z: number },
    pole: { x: number; y: number; z: number },
  ) => {
    const key = keys.find((k) => Math.abs(k.t - time) < 0.001);
    if (!key) return;
    const hand = side === 1 ? key.pose.handL : key.pose.handR;
    if (hand.space !== 'world') return;
    hand.pos.x += shift.x * bodyScale;
    hand.pos.y += shift.y * bodyScale;
    hand.pos.z += shift.z * bodyScale;
    hand.pole = pole;
  };

  // The original raised fist and lateral pole open the elbow far beyond the
  // silhouette during the wind-up. Keep the hand nearer the temple and the
  // elbow in a forward plane, then blend toward the UNCHANGED impact position.
  setPhase(0.12, { x: -side * 0.05, y: -0.08, z: 0.025 }, { x: side * 0.25, y: 0.35, z: 0.95 });
  setPhase(0.19, { x: -side * 0.035, y: -0.045, z: 0.02 }, { x: side * 0.22, y: 0.12, z: 1 });
  setPhase(0.26, { x: 0, y: 0, z: 0 }, { x: side * 0.2, y: -0.16, z: 1 });
  setPhase(0.30, { x: 0, y: 0, z: 0 }, { x: side * 0.2, y: -0.16, z: 1 });

  return { ...motion, keys };
}

/** Get an isolated motion library without altering the current or fallback engine. */
export function getBiomecaLibrary(rig: CoachRig, source: MotionLibrary): MotionLibrary {
  let perRig = cache.get(rig);
  if (!perRig) {
    perRig = new WeakMap();
    cache.set(rig, perRig);
  }
  const cached = perRig.get(source);
  if (cached) return cached;

  const experimental: MotionLibrary = new Map();
  for (const [id, motion] of source) {
    // Southpaw variants must be mirrored from the experimental source, rather
    // than accidentally copied from a previously cached standard variant.
    if (id.endsWith('@gaucher')) continue;
    experimental.set(
      id,
      DIAGONAL_ELBOW.test(id) ? refineDiagonalElbow(motion, rig.metrics.height / 1.8) : motion,
    );
  }
  perRig.set(source, experimental);
  return experimental;
}
