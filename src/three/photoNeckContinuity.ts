import { Mesh, Object3D, SkinnedMesh, Vector3, type BufferAttribute } from 'three';
import { isHeadSkin } from './human/faceRender';

/**
 * v1.52.0 — conservative head/neck surface-normal continuity.
 *
 * Rocketbox models render the head and torso as separate skinned primitives.
 * A sharp light break can occur where coincident neck-ring vertices have
 * inconsistent normals. This pass only reconciles normals of *actually
 * coincident* vertices and never edits the cached GLTF, UVs, morph targets,
 * skin weights, shaders, source textures, materials or vertex positions.
 *
 * Unlike the reverted 1.48.1 attempt, this pass does not add a colour-blend
 * shader. If the two meshes are not in the same local coordinate system, or
 * there are no coincident vertices, it does nothing and reports that fact.
 */
export interface NeckContinuityReport {
  skipped: boolean;
  reason: string;
  matched: number;
  adjusted: number;
  maximumAngleDegrees: number;
}
const empty = (reason: string): NeckContinuityReport =>
  ({ skipped: true, reason, matched: 0, adjusted: 0, maximumAngleDegrees: 0 });

function pair(root: Object3D): { head: Mesh; body: Mesh } | null {
  let head: Mesh | undefined;
  let body: Mesh | undefined;
  root.traverse(o => {
    const mesh = o as Mesh;
    if (!mesh.isMesh || !mesh.geometry?.getAttribute('position')) return;
    const mat = Array.isArray(mesh.material) ? null : mesh.material;
    if (!mat) return;
    if (isHeadSkin(mat)) head = mesh;
    if (/_body$/i.test(mat.name || '')) body = mesh;
  });
  return head && body ? { head, body } : null;
}

export function harmonizePhotoNeckNormals(root: Object3D): NeckContinuityReport {
  const p = pair(root);
  if (!p) return empty('head/body pair unavailable');
  const { head, body } = p;
  const hs = head as SkinnedMesh, bs = body as SkinnedMesh;
  if (!!hs.isSkinnedMesh !== !!bs.isSkinnedMesh) return empty('different mesh types');
  if (hs.isSkinnedMesh && bs.isSkinnedMesh &&
      (hs.skeleton.bones.length !== bs.skeleton.bones.length ||
       hs.skeleton.bones.some((bone, i) => bone.name !== bs.skeleton.bones[i]?.name)))
    return empty('incompatible skeletons');
  // The transform must be identical: local-space coordinates cannot otherwise be compared.
  if (!head.matrix.equals(body.matrix)) return empty('different local transforms');

  const bp = body.geometry.getAttribute('position');
  const hp = head.geometry.getAttribute('position');
  const bn = body.geometry.getAttribute('normal');
  const hn = head.geometry.getAttribute('normal');
  if (!bp || !hp || !bn || !hn || bp.itemSize !== 3 || hp.itemSize !== 3 ||
      bn.itemSize !== 3 || hn.itemSize !== 3) return empty('invalid geometry');

  body.geometry.computeBoundingBox();
  const box = body.geometry.boundingBox!;
  const height = box.max.y - box.min.y;
  // Keep tolerance relative to the model dimensions: no approximate welding.
  const eps = Math.max(1e-7, Math.min(0.0002, height * 0.00005));
  const key = (a: BufferAttribute, i: number) =>
    [a.getX(i), a.getY(i), a.getZ(i)].map(v => Math.round(v / eps)).join(':');
  const bodyIndices = new Map<string, number[]>();
  for (let i = 0; i < bp.count; ++i) {
    const k = key(bp as BufferAttribute, i);
    const ids = bodyIndices.get(k) ?? [];
    ids.push(i);
    bodyIndices.set(k, ids);
  }

  const matches: { bi: number; hi: number; vector: Vector3; angle: number }[] = [];
  for (let i = 0; i < hp.count; ++i) {
    const ids = bodyIndices.get(key(hp as BufferAttribute, i));
    if (!ids) continue;
    const j = ids.find(j => Math.hypot(
      hp.getX(i) - bp.getX(j), hp.getY(i) - bp.getY(j),
      hp.getZ(i) - bp.getZ(j)) < eps * 0.5);
    if (j === undefined) continue;
    const n1 = new Vector3(bn.getX(j), bn.getY(j), bn.getZ(j)).normalize();
    const n2 = new Vector3(hn.getX(i), hn.getY(i), hn.getZ(i)).normalize();
    const dot = Math.max(-1, Math.min(1, n1.dot(n2)));
    const angle = Math.acos(dot) * 180 / Math.PI;
    // Do not reverse hard anatomical creases or alter already matched normals.
    if (angle < 0.2 || angle > 65) continue;
    const average = n1.add(n2).normalize();
    matches.push({ bi: j, hi: i, vector: average, angle });
  }
  if (!matches.length) return empty('no safely adjustable neck vertices');

  // Clone only once we know the operation actually changes something.
  body.geometry = body.geometry.clone();
  head.geometry = head.geometry.clone();
  body.geometry.userData.cssNeck152Clone = true;
  head.geometry.userData.cssNeck152Clone = true;
  const newBodyNormals = body.geometry.getAttribute('normal');
  const newHeadNormals = head.geometry.getAttribute('normal');
  let maximumAngleDegrees = 0;
  for (const { bi, hi, vector, angle } of matches) {
    newBodyNormals.setXYZ(bi, vector.x, vector.y, vector.z);
    newHeadNormals.setXYZ(hi, vector.x, vector.y, vector.z);
    maximumAngleDegrees = Math.max(maximumAngleDegrees, angle);
  }
  newBodyNormals.needsUpdate = true;
  newHeadNormals.needsUpdate = true;
  return { skipped: false, reason: 'normal continuity only', matched: matches.length,
    adjusted: matches.length * 2, maximumAngleDegrees };
}
