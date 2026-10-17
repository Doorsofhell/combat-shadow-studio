import { Box3, Vector3 } from 'three';

export const FOV = 30;
const deg = Math.PI / 180;
const corner = new Vector3();
const fwd = new Vector3();
const right = new Vector3();
const up = new Vector3();
const UP = new Vector3(0, 1, 0);

/** unit vectors of a camera looking at a target from the direction (az, el), radians */
export function cameraBasis(az: number, el: number) {
  fwd.set(-Math.sin(az) * Math.cos(el), -Math.sin(el), -Math.cos(az) * Math.cos(el));
  right.crossVectors(fwd, UP).normalize();
  up.crossVectors(right, fwd).normalize();
  return { fwd: fwd.clone(), right: right.clone(), up: up.clone() };
}

/**
 * Distance at which every corner of `box` fits in the frame for a camera looking at `target`
 * from the direction (az, el). Margin 0.9 keeps hands and feet off the edges.
 */
export function fitDistance(box: Box3, target: Vector3, az: number, el: number, aspect: number, fov = FOV, margin = 0.9) {
  const tv = Math.tan((fov * deg) / 2) * margin;
  const th = tv * aspect;
  const b = cameraBasis(az, el);
  let d = 0;
  for (let i = 0; i < 8; i++) {
    corner.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).sub(target);
    const x = corner.dot(b.right);
    const y = corner.dot(b.up);
    const z = corner.dot(b.fwd);
    d = Math.max(d, Math.abs(x) / th - z, Math.abs(y) / tv - z);
  }
  return d;
}
