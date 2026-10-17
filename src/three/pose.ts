import type { Bone, Object3D, Quaternion, Vector3 } from 'three';

/**
 * Puts every bone back in the model's reference pose. CoachRig reads the bones as they are when it
 * is built and takes that as its rest pose: rebuilt while the coach was animated (leg length changed
 * by the creator or the random look), it took the guard as the rest pose and every move then added
 * the guard a second time, twisting the body. The reference pose is recorded the first time.
 */
export function restoreReferencePose(root: Object3D) {
  root.traverse((o) => {
    if (!(o as Bone).isBone) return;
    const ref = (o.userData.cssRef ??= { q: o.quaternion.clone(), p: o.position.clone(), s: o.scale.clone() }) as { q: Quaternion; p: Vector3; s: Vector3 };
    o.quaternion.copy(ref.q);
    o.position.copy(ref.p);
    o.scale.copy(ref.s);
  });
}

/** move the knees and ankles along their bones: longer or shorter legs, same skinning */
export function setLegLength(root: Object3D, f: number) {
  root.traverse((o) => {
    if (!/(Left|Right)(Leg|Foot)$/.test(o.name.replace(/^mixamorig[:]?/i, ''))) return;
    const base = (o.userData.cssBase ??= o.position.clone()) as typeof o.position;
    o.position.copy(base).multiplyScalar(f);
  });
}
