import type { StanceOffsets } from '../../engine';

const deg = (d: number) => (d * Math.PI) / 180;

/**
 * Each coach's own guard, as small offsets on the discipline guard: the techniques stay the same
 * (same key poses, same biomechanical checks), only the coach's way of standing changes. Every
 * profile is checked by the ankle, balance and kinetic-chain tests (coach-profiles.test.ts).
 */
export const COACH_STANCES: Record<string, StanceOffsets> = {
  // wrestler's guard: lower, chest over the knees, wider base, hands open and forward to frame and grab
  'mma-kadir': {
    knee: 0.03,
    pelvisPitch: deg(4),
    chestPitch: deg(4),
    leadHand: [0, -0.04, 0.03],
    rearHand: [0, -0.03, 0.02],
    fist: -0.2,
    leadFoot: [0.008, 0],
    rearFoot: [-0.008, 0],
  },
  // striker's guard: taller, more side-on, fists closed and higher, rear heel lighter (loaded right hand)
  'mma-amara': {
    knee: -0.02,
    pelvisYaw: deg(-6),
    pelvisPitch: deg(-4),
    leadHand: [0, 0.03, -0.03],
    rearHand: [0, 0.03, 0],
    fist: 0.2,
    rearHeel: deg(4),
  },
  // 1.11 Naël « Le Faucon »: counter-striker, light on the feet, lead hand low, chin behind the shoulder
  nael: {
    knee: 0.01,
    pelvisYaw: deg(-4),
    chestPitch: deg(2),
    leadHand: [0, -0.05, -0.01],
    // 1.11: rear hand a little lower and forward (the higher one folded the armpit, deformation-v1100.test.ts)
    rearHand: [0, -0.03, 0.02],
    fist: 0.15,
    rearHeel: deg(5),
  },
  // Inaya « La Panthère »: kicker, side-on, on the balls of the feet, hands high
  inaya: {
    knee: -0.01,
    pelvisYaw: deg(-8),
    // 1.11: pelvis tilted as Amara's (-2° crushed the groin in guard, deformation-v1100.test.ts)
    pelvisPitch: deg(-4),
    leadHand: [0, 0.03, -0.02],
    rearHand: [0, 0.04, 0],
    fist: 0.25,
    rearHeel: deg(6),
  },
};

export const coachProfile = (id: string | null | undefined) => (id && COACH_STANCES[id] ? { id, offsets: COACH_STANCES[id] } : undefined);
