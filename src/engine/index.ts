/**
 * Moteur de mouvement Shadow : l'unique porte d'entrée de l'application (v0.49, Youssef 2026-10-27 : « le moteur
 * soit une espèce de module à part qui est utilisé par l'application et que je peux faire évoluer progressivement »).
 *
 * - The app (src/three, src/ui, src/domain) imports the engine from here only, never a file inside it
 *   (checked by src/engine/__tests__/boundary.test.ts). Tests may still reach inside to measure it.
 * - The engine reads no screen, store, sound or 3D scene of the app: it receives a skeleton (three.js bones)
 *   and returns poses. Only the catalogue checks (registry.ts, audit.ts) read the technique catalogue.
 * - Every change of behaviour raises ENGINE_VERSION and gets a line in docs/moteur/CHANGELOG.md.
 */

/** version of the motion engine, independent of the app version (docs/moteur/CHANGELOG.md) */
export const ENGINE_VERSION = '1.0.0';

// the skeleton and its limits
export { CoachRig, KNEE_MAX_FLEX, type Side } from './rig';
export { PLANTED_LIMIT } from './limits';
export { ankleAngles } from './joints';
export { centreOfMass } from './balance';

// the guards of the six disciplines
export { STANCES, type StanceOffsets, type StanceStyle } from './author';

// the motions and their playback
export { MotionSampler, duration, motionPhase, type Motion } from './motion';
export { getDuo, getIllustration, getLibrary, getMotion, type MotionLibrary } from './library';
export type { DuoScene, Place } from './library/illustrations';
export { ComboPlayer, type PlayerEvents, type PlayerMove } from './player';

// the study mode (Analyse technique) and the framing
export { STUDY_PHASE_LABEL, StudyPlayer, analyseMotion, type Effector } from './study';
export type { BodyFocus } from './phases';
export { sequenceEnvelope, type Envelope } from './envelope';

// v0.49, taken from the CME-3D lab (PR #25): velocity-aware smoothing of a stream of positions
export { MotionSmoother } from './smoothing';
