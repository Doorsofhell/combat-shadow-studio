import { BufferAttribute, BufferGeometry, Mesh, Object3D, SkinnedMesh, Vector3 } from 'three';
import { isHeadSkin } from './human/faceRender';

/**
 * 1.48.1: reconcile normals at *identical* body/head neck-ring vertices.
 * Rocketbox exports head and body as separate draw primitives. Their coincident
 * vertices can carry different normals, producing a bright/dark seam even with
 * perfectly matching skin colour.
 *
 * Work on cloned geometry only: useGLTF caches the source geometry, which must
 * never be changed for another coach or a subsequent render.
 *
 * This pass deliberately does not weld positions, touch UVs, skin weights,
 * bind matrices, morph targets or facial expression geometry.
 */
export interface NeckSeamReport {
  matchingVertices: number;
  adjustedVertices: number;
  worstNormalAngleDegrees: number;
  skipped: boolean;
}

function findSkinPair(root: Object3D): { body: Mesh; head: Mesh } | null {
  let body: Mesh | undefined;
  let head: Mesh | undefined;
  root.traverse(o => {
    const m = o as Mesh;
    if (!m.isMesh || !m.geometry?.getAttribute('position')) return;
    const mat = Array.isArray(m.material) ? null : m.material;
    if (!mat) return;
    if (isHeadSkin(mat)) head = m;
    else if (/_body$/i.test(mat.name ?? '')) body = m;
  });
  return body && head ? { body, head } : null;
}

export function smoothPhotoNeckSeam(root: Object3D): NeckSeamReport {
  const empty = { matchingVertices: 0, adjustedVertices: 0, worstNormalAngleDegrees: 0, skipped: true };
  const pair = findSkinPair(root);
  if (!pair) return empty;
  const { body, head } = pair;
  // Never smooth unrelated skin pieces or mismatched skeletal spaces.
  if (body.isSkinnedMesh !== head.isSkinnedMesh) return empty;
  if (body.isSkinnedMesh && head.isSkinnedMesh) {
    const b = body as SkinnedMesh, h = head as SkinnedMesh;
    if (b.skeleton.bones.length !== h.skeleton.bones.length ||
        b.skeleton.bones.some((bone, i) => bone.name !== h.skeleton.bones[i]?.name)) return empty;
  }
  const bg = body.geometry, hg = head.geometry;
  const bp = bg.getAttribute('position'), hp = hg.getAttribute('position');
  const bn = bg.getAttribute('normal'), hn = hg.getAttribute('normal');
  if (!bp || !hp || !bn || !hn || bp.itemSize !== 3 || hp.itemSize !== 3 ||
      bn.itemSize !== 3 || hn.itemSize !== 3) return empty;

  // Quantization in model space, designed for metre- or centimetre-sized GLBs.
  const box = bg.boundingBox ?? (bg.computeBoundingBox(), bg.boundingBox);
  if (!box) return empty;
  const span = box.max.y - box.min.y;
  const tolerance = span > 10 ? 0.02 : 0.0002;
  const key = (x: number, y: number, z: number) =>
    `${Math.round(x / tolerance)},${Math.round(y / tolerance)},${Math.round(z / tolerance)}`;
  const bodyByPosition = new Map<string, number[]>();
  for (let i = 0; i < bp.count; i++) {
    const k = key(bp.getX(i), bp.getY(i), bp.getZ(i));
    const ids = bodyByPosition.get(k) ?? [];
    ids.push(i);
    bodyByPosition.set(k, ids);
  }
  const groups: { bodyIds: number[]; headIds: number[] }[] = [];
  const headByPosition = new Map<string, number[]>();
  for (let i = 0; i < hp.count; i++) {
    const k = key(hp.getX(i), hp.getY(i), hp.getZ(i));
    if (!bodyByPosition.has(k)) continue;
    const ids = headByPosition.get(k) ?? [];
    ids.push(i);
    headByPosition.set(k, ids);
  }
  for (const [key, headIds] of headByPosition) {
    const bodyIds = bodyByPosition.get(key)!;
    // Guard against false matches from quantization.
    const i = bodyIds[0], j = headIds[0];
    const dist = Math.hypot(bp.getX(i) - hp.getX(j), bp.getY(i) - hp.getY(j), bp.getZ(i) - hp.getZ(j));
    if (dist <= tolerance) groups.push({ bodyIds, headIds });
  }
  if (groups.length === 0) return empty;

  // Do not edit the cached source GLB's shared BufferGeometry.
  body.geometry = bg.clone();
  head.geometry = hg.clone();
  const bnorm = body.geometry.getAttribute('normal');
  const hnorm = head.geometry.getAttribute('normal');
  let adjusted = 0, worst = 0;
  for (const { bodyIds, headIds } of groups) {
    const all = [...bodyIds.map(i => ({ n: bnorm, i })), ...headIds.map(i => ({ n: hnorm, i }))];
    const normals = all.map(({ n, i }) => new Vector3(n.getX(i), n.getY(i), n.getZ(i)).normalize());
    const average = normals.reduce((a, n) => a.add(n), new Vector3());
    if (average.lengthSq() < 1e-8) continue;
    average.normalize();
    for (let k = 0; k < all.length; k++) {
      const angle = Math.acos(Math.min(1, Math.max(-1, normals[k].dot(average)))) * 180 / Math.PI;
      worst = Math.max(worst, angle);
      if (angle < 0.05) continue;
      const { n, i } = all[k];
      n.setXYZ(i, average.x, average.y, average.z);
      adjusted++;
    }
  }
  bnorm.needsUpdate = true;
  hnorm.needsUpdate = true;
  return { matchingVertices: groups.length, adjustedVertices: adjusted, worstNormalAngleDegrees: worst, skipped: false };
}
