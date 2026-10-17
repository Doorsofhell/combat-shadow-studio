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

/**
 * Distance at which every sphere of an envelope (x, y, z, r flattened, in the coach's frame, placed
 * at `origin`) fits in the frame of a camera looking at `target` from (az, el). Framing the limbs
 * rather than the corners of their box makes the coach larger without ever cropping a fist or a
 * foot: the spheres already hold the volume of the head, hands and feet.
 */
export function fitSpheres(pts: ArrayLike<number>, origin: { x: number; z: number; yaw: number }, target: Vector3, az: number, el: number, aspect: number, fov = FOV, margin = 0.93) {
  const tv = Math.tan((fov * deg) / 2) * margin;
  const th = tv * aspect;
  const b = cameraBasis(az, el);
  const c = Math.cos(origin.yaw);
  const sn = Math.sin(origin.yaw);
  let d = 0;
  for (let i = 0; i < pts.length; i += 4) {
    const lx = pts[i];
    const lz = pts[i + 2];
    corner.set(origin.x + lx * c + lz * sn, pts[i + 1], origin.z - lx * sn + lz * c).sub(target);
    const r = pts[i + 3];
    const x = corner.dot(b.right);
    const y = corner.dot(b.up);
    const z = corner.dot(b.fwd);
    // a sphere seen from closer looks a little larger: its radius counts on both axes
    d = Math.max(d, (Math.abs(x) + r) / th - z + r, (Math.abs(y) + r) / tv - z + r);
  }
  return d;
}

/**
 * Moves `target` (in place) to the middle of what the camera sees of the envelope, so the margins
 * are even on both sides: the box centre is off-centre for a bladed stance or a kick.
 */
export function centerOnSpheres(pts: ArrayLike<number>, origin: { x: number; z: number; yaw: number }, target: Vector3, az: number, el: number) {
  const b = cameraBasis(az, el);
  const c = Math.cos(origin.yaw);
  const sn = Math.sin(origin.yaw);
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (let i = 0; i < pts.length; i += 4) {
    const lx = pts[i];
    const lz = pts[i + 2];
    corner.set(origin.x + lx * c + lz * sn, pts[i + 1], origin.z - lx * sn + lz * c).sub(target);
    const r = pts[i + 3];
    const x = corner.dot(b.right);
    const y = corner.dot(b.up);
    x0 = Math.min(x0, x - r);
    x1 = Math.max(x1, x + r);
    y0 = Math.min(y0, y - r);
    y1 = Math.max(y1, y + r);
  }
  if (x0 > x1) return target;
  return target.addScaledVector(b.right, (x0 + x1) / 2).addScaledVector(b.up, (y0 + y1) / 2);
}
