import { Mesh } from 'three';

/**
 * Amara 1.37.9 — preserve old Rocketbox base POSITION for every approved hideBody mask.
 *
 * The new CSS_CleanBikini target is additive (base 0 -> new cleaned surface 1).
 * Bake it once into a clone of the loaded geometry and drop ONLY the body's
 * static face targets. The original vertex coordinates stay in userData for
 * the seven old garment masks. No shape or morph on the face is changed.
 *
 * This is intentionally metadata-gated: other coaches and the baseline 1.37.8
 * image have no CSS_CleanBikini and remain unchanged.
 */
export function bakeAmaraCleanSurface(mesh: Mesh): boolean {
  const idx = mesh.morphTargetDictionary?.CSS_CleanBikini;
  if (idx === undefined || idx < 0) return false;
  const source = mesh.geometry;
  const base = source.getAttribute('position');
  const morphs = source.morphAttributes.position;
  const cleaned = morphs?.[idx];
  if (!base || !cleaned || cleaned.count !== base.count) {
    throw new Error('Amara: morphologie de nettoyage incompatible avec le corps');
  }
  // The whole facial rig is retained on the HEAD primitive. This special
  // morph may only be baked when all other morphs are still, as on BODY.
  for (let k = 0; k < morphs.length; k++) {
    if (k === idx) continue;
    const target = morphs[k];
    for (let i = 0; i < target.count; i++) {
      if (Math.abs(target.getX(i)) + Math.abs(target.getY(i)) + Math.abs(target.getZ(i)) > 1e-6) {
        return false; // face / eyes: the facial animator continues to own this mesh
      }
    }
  }
  const geometry = source.clone();
  const pos = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal');
  const morphNormals = geometry.morphAttributes.normal?.[idx];
  const original = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    original.set([x, y, z], i * 3);
    pos.setXYZ(i, x + cleaned.getX(i), y + cleaned.getY(i), z + cleaned.getZ(i));
    if (normals && morphNormals) {
      normals.setXYZ(i,
        normals.getX(i) + morphNormals.getX(i),
        normals.getY(i) + morphNormals.getY(i),
        normals.getZ(i) + morphNormals.getZ(i));
    }
  }
  pos.needsUpdate = true;
  if (normals && morphNormals) normals.needsUpdate = true;
  // Kept in MEMORY only. Do not serialise float positions into GLB extras.
  geometry.userData.cssOriginalMaskPositions = original;
  geometry.morphAttributes = {};
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();
  mesh.geometry = geometry;
  mesh.updateMorphTargets();
  mesh.morphTargetInfluences = undefined;
  mesh.morphTargetDictionary = undefined;
  return true;
}
