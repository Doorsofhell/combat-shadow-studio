import { BufferAttribute, Mesh, Object3D, SkinnedMesh, Vector3, type Material, type MeshStandardMaterial, type Texture, type WebGLProgramParametersWithUniforms } from 'three';
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
  toneBlendVertices: number;
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
  const empty = { matchingVertices: 0, adjustedVertices: 0, worstNormalAngleDegrees: 0, skipped: true, toneBlendVertices: 0 };
  const pair = findSkinPair(root);
  if (!pair) return empty;
  const { body, head } = pair;
  // Never smooth unrelated skin pieces or mismatched skeletal spaces.
  if (!!(body as SkinnedMesh).isSkinnedMesh !== !!(head as SkinnedMesh).isSkinnedMesh) return empty;
  if ((body as SkinnedMesh).isSkinnedMesh && (head as SkinnedMesh).isSkinnedMesh) {
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
  body.geometry.userData.cssNeckSeamClone = true;
  head.geometry.userData.cssNeckSeamClone = true;
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

  // Colour discontinuities are independent from normal continuity. Give the
  // head's *last 3.5 cm* a smooth transition towards the body albedo sampled
  // at the corresponding neck ring. No source PNG or cached GLB is repainted.
  let toneBlendVertices = 0;
  const bm = body.material as MeshStandardMaterial;
  const hm = head.material as MeshStandardMaterial;
  const buv = bg.getAttribute('uv');
  if (bm.map && hm.map && buv && buv.count === bp.count) {
    const fromBodyUv = new Float32Array(hp.count * 2);
    const fade = new Float32Array(hp.count);
    const radius = span > 10 ? 3.5 : 0.035;
    const seamPoints = groups.map(g => {
      const i = g.bodyIds[0], j = g.headIds[0];
      return { x: hp.getX(j), y: hp.getY(j), z: hp.getZ(j),
        u: buv.getX(i), v: buv.getY(i) };
    });
    for (let j = 0; j < hp.count; j++) {
      const x = hp.getX(j), y = hp.getY(j), z = hp.getZ(j);
      let nearest = seamPoints[0], best = Infinity;
      for (const point of seamPoints) {
        const ds = (x - point.x) ** 2 + (y - point.y) ** 2 + (z - point.z) ** 2;
        if (ds < best) { nearest = point; best = ds; }
      }
      fromBodyUv[j * 2] = nearest.u;
      fromBodyUv[j * 2 + 1] = nearest.v;
      const t = Math.max(0, 1 - Math.sqrt(best) / radius);
      fade[j] = 0.9 * t * t * (3 - 2 * t);
      if (fade[j] > 0) toneBlendVertices++;
    }
    head.geometry.setAttribute('cssNeckBodyUv', new BufferAttribute(fromBodyUv, 2));
    head.geometry.setAttribute('cssNeckFade', new BufferAttribute(fade, 1));
    hm.userData.cssNeckToneBlend = { bodyMap: bm.map, bodyColor: bm.color.clone() };
  }
  return { matchingVertices: groups.length, adjustedVertices: adjusted, worstNormalAngleDegrees: worst, skipped: false, toneBlendVertices };
}

/** Layer a neck tone correction on top of the existing skin shader. */
export function applyHeadNeckToneBlend(material: Material): void {
  const blend = material.userData.cssNeckToneBlend as
    | { bodyMap: Texture; bodyColor: { r: number; g: number; b: number } }
    | undefined;
  if (!blend) return;
  const prior = material.onBeforeCompile;
  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms, renderer) => {
    prior.call(material, shader, renderer);
    shader.uniforms.cssNeckBodyMap = { value: blend.bodyMap };
    shader.uniforms.cssNeckBodyColor = {
      value: new Vector3(blend.bodyColor.r, blend.bodyColor.g, blend.bodyColor.b),
    };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\\nattribute vec2 cssNeckBodyUv;\\nattribute float cssNeckFade;\\nvarying vec2 vCssNeckBodyUv;\\nvarying float vCssNeckFade;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\\nvCssNeckBodyUv = cssNeckBodyUv;\\nvCssNeckFade = cssNeckFade;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\\nuniform sampler2D cssNeckBodyMap;\\nuniform vec3 cssNeckBodyColor;\\nvarying vec2 vCssNeckBodyUv;\\nvarying float vCssNeckFade;')
      .replace('#include <map_fragment>', `#include <map_fragment>
#ifdef USE_MAP
  // The neck ring shares the body's colour. Blend out towards the jawline.
  vec3 cssNeckBodyAlbedo = texture2D(cssNeckBodyMap, vCssNeckBodyUv).rgb * cssNeckBodyColor;
  diffuseColor.rgb = mix(diffuseColor.rgb, cssNeckBodyAlbedo, clamp(vCssNeckFade, 0.0, 0.95));
#endif`);
  };
  const oldKey = material.customProgramCacheKey.bind(material);
  material.customProgramCacheKey = () => oldKey() + '-neck-tone1481';
  material.userData.cssNeckToneApplied = true;
}
