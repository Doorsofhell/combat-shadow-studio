/**
 * 2.10.3 (audit ponytail n°2): « une séance d'entraînement est en cours ». The training screen sets it, the sync
 * engine listens: the history is then only written on the device and sent once at the pause and at the end.
 * Kept apart from session.ts so the training screen does not load the account code.
 */
let held = false;
const listeners = new Set<(on: boolean) => void>();

export const trainingHeld = () => held;
export function setTrainingHold(on: boolean) {
  if (on === held) return;
  held = on;
  listeners.forEach((l) => l(on));
}
export function onTrainingHold(l: (on: boolean) => void) {
  listeners.add(l);
  return () => void listeners.delete(l);
}
