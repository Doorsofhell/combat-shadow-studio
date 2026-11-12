import { describe, expect, test } from 'vitest';
import { Bone, Object3D, Quaternion, Vector3 } from 'three';
import { loadSkeleton } from '../../../test/skeleton';
import { CoachRig } from '../../../engine/rig';
import { getLibrary, getMotion } from '../../../engine/library';
import { MotionSampler } from '../../../engine/motion';
import { COACH_STANCES } from '../../../domain/coaches/motion';
import { FaceAnimator } from '../../face';
import { humanProfileFor } from '../profiles';
import type { StanceStyle } from '../../../engine';

/**
 * 1.34 (Youssef 11/11: « orienter naturellement le regard vers l'adversaire… éliminer les regards systématiquement
 * dirigés vers le sol »). Measured on the real skeleton of each coach, in the guard of each striking style: before
 * 1.34 the eyes looked 10 to 20° below the horizon (the head is pitched down in guard); now within a few degrees of
 * the opponent's eyes, straight ahead.
 */
const COACHES = [
  ['mma-kadir', 'homme'],
  ['mma-amara', 'femme'],
  ['nael', 'homme'],
  ['inaya', 'femme'],
  ['axel', 'homme'],
  ['kaila', 'femme'],
] as const;
const STYLES: StanceStyle[] = ['boxing', 'mma', 'muaythai', 'kickboxing'];

function bone(root: Object3D, name: string) {
  let hit: Bone | undefined;
  root.traverse((o) => {
    if (!hit && (o as Bone).isBone && o.name.replace(/^mixamorig/, '') === name) hit = o as Bone;
  });
  return hit!;
}

/** line of sight of an eye in the world: the facing direction at rest, carried by the eye's rotation */
function sight(eye: Bone, local: Vector3) {
  eye.updateWorldMatrix(true, false);
  return local.clone().applyQuaternion(eye.getWorldQuaternion(new Quaternion())).normalize();
}

const deg = (r: number) => (r * 180) / Math.PI;

describe.each(COACHES)('%s : regard vers l’adversaire', (id, sex) => {
  test.each(STYLES)('en garde %s, les yeux regardent devant à hauteur des yeux (pas le sol)', (style) => {
    const root = loadSkeleton(sex, `coaches/${id}/photo.glb`);
    const le = bone(root, 'LeftEye');
    const re = bone(root, 'RightEye');
    const lat = le.getWorldPosition(new Vector3()).sub(re.getWorldPosition(new Vector3())).normalize();
    const facing = new Vector3().crossVectors(lat, new Vector3(0, 1, 0)).normalize();
    const local = facing.clone().applyQuaternion(le.getWorldQuaternion(new Quaternion()).invert());
    const localR = facing.clone().applyQuaternion(re.getWorldQuaternion(new Quaternion()).invert());
    const restQ = le.quaternion.clone();
    const face = new FaceAnimator(root, 3, humanProfileFor(id));
    const rig = new CoachRig(root);
    const lib = getLibrary(rig, style, COACH_STANCES[id as keyof typeof COACH_STANCES]);
    const s = new MotionSampler(rig, getMotion(lib, 'garde', false)!);
    let pitchBefore = 0;
    for (let i = 0; i < 30; i++) {
      rig.apply(s.sample(i / 60));
      // the head as the engine leaves it, before the face: where the eyes looked before 1.34
      if (i === 29) {
        le.quaternion.copy(restQ);
        pitchBefore = deg(Math.asin(sight(le, local).y));
      }
      face.update(1 / 60, { still: true });
    }
    const v = sight(le, local);
    const pitch = deg(Math.asin(v.y));
    const yaw = deg(Math.atan2(v.x, v.z) - Math.atan2(facing.x, facing.z));
    // the head looks down in guard: that is what the eyes now make up for
    expect(pitchBefore, 'regard avant 1.34').toBeLessThan(-3);
    expect(Math.abs(pitch), `regard ${pitch.toFixed(1)}° (avant ${pitchBefore.toFixed(1)}°)`).toBeLessThan(2.5);
    expect(Math.abs(yaw)).toBeLessThan(8);
    // both eyes look the same way
    expect(deg(sight(re, localR).angleTo(v))).toBeLessThan(2);
  });
});
