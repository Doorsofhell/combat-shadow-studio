import { useEffect, useMemo, useState } from 'react';
import { BufferAttribute, Material, Mesh, MeshStandardMaterial, Object3D, Skeleton, SkinnedMesh, Bone, SRGBColorSpace } from 'three';
import { GLTFLoader, MeshoptDecoder, type GLTF } from 'three-stdlib';
import type { DisciplineId } from '../domain/types';
import { log3d } from './diag3d';
import { physicalFrom } from './photoMaterials';

/**
 * v0.31 discipline outfits of the Ultra-réaliste coaches (Youssef, 2026-10-22: « TENUES ET ACCESSOIRES 3D PREMIUM
 * PAR DISCIPLINE »). Each outfit is a GLB made by tools/generator/rocketbox/outfits.py on the coach's own body:
 * the garments carry the body's skin weights, so they are bound here to the coach's skeleton (same bone names)
 * and follow every animation. The body vertices the garments cover are not drawn (list in the GLB), so the skin
 * cannot show through, even when a joint bends far.
 */
export type OutfitId = DisciplineId | 'bjj-nogi';

/**
 * 1.34 (Youssef, 2026-11-11: « que ça ne mette pas de temps à s'afficher lorsqu'on change de coach »): an outfit file
 * is read once and kept, so putting it on again (coming back to a coach, the same outfit on another screen) or after
 * preloadOutfit() does not read and decode it again. Each wearing builds its own garments over the shared geometry
 * (useOutfit), the kept model itself is never changed. The last few are kept (about 3 Mo each in memory).
 */
const OUTFITS_KEPT = 14;
const outfitModels = new Map<string, Promise<GLTF>>();

export function loadOutfitModel(url: string, extendLoader: (l: GLTFLoader) => void): Promise<GLTF> {
  const kept = outfitModels.get(url);
  if (kept) {
    // most recently used last
    outfitModels.delete(url);
    outfitModels.set(url, kept);
    return kept;
  }
  const loader = new GLTFLoader();
  // 1.34: the models of a build are compressed (tools/build/bootModels.ts, EXT_meshopt_compression)
  loader.setMeshoptDecoder(typeof MeshoptDecoder === 'function' ? (MeshoptDecoder as () => unknown)() : MeshoptDecoder);
  extendLoader(loader);
  const p = loader.loadAsync(url);
  outfitModels.set(url, p);
  // a failed read is not kept: the next attempt reads the file again
  p.catch(() => outfitModels.get(url) === p && outfitModels.delete(url));
  while (outfitModels.size > OUTFITS_KEPT) outfitModels.delete(outfitModels.keys().next().value as string);
  return p;
}

/** reads an outfit ahead of time (the coach screen, the other coaches): wearing it later is then immediate */
export function preloadOutfit(url: string, extendLoader: (l: GLTFLoader) => void) {
  loadOutfitModel(url, extendLoader).catch(() => undefined);
}

export const OUTFIT_LABEL: Record<OutfitId, string> = {
  boxe: 'boxe anglaise',
  kickboxing: 'kick-boxing',
  muaythai: 'muay-thaï',
  mma: 'MMA',
  bjj: 'jiu-jitsu brésilien (kimono)',
  'bjj-nogi': 'jiu-jitsu brésilien (sans kimono)',
  judo: 'judo',
};

export function outfitFor(discipline: DisciplineId, enabled: boolean, bjj: 'gi' | 'nogi'): OutfitId | null {
  if (!enabled) return null;
  return discipline === 'bjj' && bjj === 'nogi' ? 'bjj-nogi' : discipline;
}

/** body vertices hidden under an outfit: quantised positions (glTF axes, body units x scale) */
export function hiddenKeys(b64: string): Set<string> {
  const bin = atob(b64);
  const keys = new Set<string>();
  const dv = new DataView(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) dv.setUint8(i, bin.charCodeAt(i));
  for (let o = 0; o + 6 <= bin.length; o += 6) keys.add(`${dv.getInt16(o, true)},${dv.getInt16(o + 2, true)},${dv.getInt16(o + 4, true)}`);
  return keys;
}

/** index of the body without the triangles whose three corners are all hidden; returns how many vertices matched */
export function maskedIndex(positions: ArrayLike<number>, index: ArrayLike<number>, keys: Set<string>, scale: number) {
  const n = positions.length / 3;
  const hidden = new Uint8Array(n);
  let matched = 0;
  for (let v = 0; v < n; v++) {
    const k = `${Math.round(positions[v * 3] * scale)},${Math.round(positions[v * 3 + 1] * scale)},${Math.round(positions[v * 3 + 2] * scale)}`;
    if (keys.has(k)) {
      hidden[v] = 1;
      matched++;
    }
  }
  const out: number[] = [];
  for (let t = 0; t < index.length; t += 3) {
    const a = index[t], b = index[t + 1], c = index[t + 2];
    if (hidden[a] && hidden[b] && hidden[c]) continue;
    out.push(a, b, c);
  }
  return { index: out, matched };
}

export type OutfitStatus = Status;
type Status = { state: 'aucune' | 'chargement' | 'portee' | 'erreur'; outfit: OutfitId | null; message?: string };
/** status of one effect run: the body and the file it was put on */
type Owned = Status & { scene?: Object3D; url?: string };

/**
 * Puts the outfit on a loaded photo coach (scene from PhotoCoach). Returns the loading state, so the stage can
 * say when an outfit could not be loaded (never a silent fallback: the coach then shows in its training base
 * layer and the message names the missing outfit).
 */
export function useOutfit(
  scene: Object3D,
  url: string | null,
  outfit: OutfitId | null,
  quality: 'haute' | 'basse',
  extendLoader: (l: GLTFLoader) => void,
  /** v0.32: sends the garments' textures and shaders to the graphics chip before the coach is shown */
  prepare?: (garments: Object3D[]) => Promise<void>,
  /** 1.10: shader additions of the coach (breathing) given to each garment once bound */
  decorate?: (garment: SkinnedMesh) => void,
): Status {
  // v0.32 (Youssef, 2026-10-22 10:33: the coach showed in underwear before the outfit): an outfit to put on
  // starts as « chargement » from the first image, so the stage keeps the coach hidden until it is worn
  const [status, setStatus] = useState<Owned>(() => (url && outfit ? { state: 'chargement', outfit } : { state: 'aucune', outfit: null }));
  useEffect(() => {
    if (!url || !outfit) {
      setStatus({ state: 'aucune', outfit: null });
      return;
    }
    let live = true;
    const added: Object3D[] = [];
    const restore: (() => void)[] = [];
    setStatus({ state: 'chargement', outfit, scene, url });
    // a request that never answers must not keep the coach hidden: after 20 s the base layer is shown and said
    const fail = (err: unknown) => {
      if (!live) return;
      live = false;
      clearTimeout(timer);
      const message = `La tenue de ${OUTFIT_LABEL[outfit]} n’a pas pu être chargée.`;
      log3d('modele', `${message} ${String((err as Error)?.message ?? err).slice(0, 120)}`);
      setStatus({ state: 'erreur', outfit, message, scene, url });
    };
    const timer = setTimeout(() => fail('délai de 20 s dépassé'), 20_000);
    const attempt = (tries: number): void =>
      void loadOutfitModel(url, extendLoader).then(
        (gltf) => {
          if (!live) return;
          const bones = new Map<string, Bone>();
          const skins: SkinnedMesh[] = [];
          scene.traverse((o) => {
            if ((o as Bone).isBone) bones.set(o.name, o as Bone);
            if ((o as SkinnedMesh).isSkinnedMesh && !o.name.startsWith('tenue:')) skins.push(o as SkinnedMesh);
          });
          const body = skins[0] ?? null;
          if (!body) return fail('corps du coach introuvable');
          const host = body.parent ?? scene;
          let hide: { keys: string; scale: number } | null = null;
          const meshes: SkinnedMesh[] = [];
          gltf.scene.traverse((o) => {
            const m = o as SkinnedMesh;
            if (m.userData?.hideBody) hide = { keys: m.userData.hideBody as string, scale: Number(m.userData.hideScale ?? 1000) };
            if (m.isSkinnedMesh) meshes.push(m);
          });
          for (const m of meshes) {
            const skel = new Skeleton(
              m.skeleton.bones.map((b) => bones.get(b.name) ?? b),
              m.skeleton.boneInverses,
            );
            const mesh = new SkinnedMesh(m.geometry, dress(m.material as Material, quality));
            mesh.name = `tenue:${m.name}`;
            mesh.position.copy(m.position);
            mesh.quaternion.copy(m.quaternion);
            mesh.scale.copy(m.scale);
            mesh.frustumCulled = false;
            mesh.castShadow = body.castShadow;
            mesh.receiveShadow = body.receiveShadow;
            host.add(mesh);
            mesh.updateMatrixWorld(true);
            mesh.bind(skel, m.bindMatrix);
            // four influences per point, summing to one (the export keeps the four strongest)
            mesh.normalizeSkinWeights();
            decorate?.(mesh);
            added.push(mesh);
          }
          if (hide) {
            const h = hide as { keys: string; scale: number };
            const keys = hiddenKeys(h.keys);
            let matched = 0;
            // the body and the head are separate meshes (one per material): each one hides its covered points
            for (const b of skins) {
              const g = b.geometry;
              const own = g.clone();
              const pos = g.getAttribute('position');
              const idx = g.index ? Array.from(g.index.array) : Array.from({ length: pos.count }, (_, i) => i);
              // 1.26: the points read one by one (Axel's and Kaila's bodies store them interleaved with their
              // normals and texture coordinates: read as a plain array, only a third of their hidden points were found
              // and the skin came through their clothes, Youssef 2026-11-06 « les bottes avec des trous »)
              const flat = new Float32Array(pos.count * 3);
              for (let v = 0; v < pos.count; v++) flat.set([pos.getX(v), pos.getY(v), pos.getZ(v)], v * 3);
              const r = maskedIndex(flat, idx, keys, h.scale);
              matched += r.matched;
              own.setIndex(new BufferAttribute(pos.count > 65535 ? new Uint32Array(r.index) : new Uint16Array(r.index), 1));
              b.geometry = own;
              restore.push(() => {
                b.geometry = g;
                own.dispose();
              });
            }
            if (matched < keys.size * 0.9) log3d('modele', `tenue ${OUTFIT_LABEL[outfit]} : ${matched} points de peau masqués sur ${keys.size} attendus`);
          }
          const worn = () => {
            if (!live) return;
            clearTimeout(timer);
            log3d('modele', `tenue ${OUTFIT_LABEL[outfit]} portée (${meshes.length} pièces)`);
            setStatus({ state: 'portee', outfit, scene, url });
          };
          // shown only once the graphics chip holds the garments (no half-textured first image); a failed
          // preparation still shows the outfit, three then uploads it on the first image as before
          (prepare ? prepare(added) : Promise.resolve()).then(worn, worn);
        },
        (err) => {
          if (!live) return;
          if (tries > 0) return attempt(tries - 1);
          fail(err);
        },
      );
    attempt(1);
    return () => {
      live = false;
      clearTimeout(timer);
      for (const o of added) {
        o.removeFromParent();
        const m = o as Mesh;
        (m.material as Material).dispose();
      }
      restore.forEach((f) => f());
    };
  }, [scene, url, outfit, quality, extendLoader, prepare, decorate]);
  // a state left by the previous coach or file never counts for this one: when the coach changes, the new body
  // was drawn once with the old « portée » state before the effect ran (outfit-loading.spec, coach change)
  const stale = !!url && !!outfit && (status.scene !== scene || status.url !== url);
  return useMemo<Status>(
    () => (stale ? { state: 'chargement', outfit } : { state: status.state, outfit: status.outfit, message: status.message }),
    [stale, outfit, status],
  );
}

/** fabric look: satin and knit get a soft sheen, leather a light clear coat (in high quality only). 1.10: the
 * physical material starts from all the source's properties (photoMaterials.ts physicalFrom): double faces of the
 * loose garments, roughness and occlusion maps, alpha were lost before in high quality */
/** materials of the printed marks of the garments (tools/generator/rocketbox/outfits.py, logo_on) */
export function isPrint(name: string) {
  return name.startsWith('logo-');
}

function dress(src: Material, quality: 'haute' | 'basse'): Material {
  const m = src as MeshStandardMaterial;
  // 1.20: the printed mark (CS logo) lies 1.5 mm above its cloth; on a phone's depth buffer, seen from a few metres,
  // that is too little and the cloth flickered over it. It is drawn a little in front of what lies at its depth
  if (isPrint(m.name)) {
    m.polygonOffset = true;
    m.polygonOffsetFactor = -2;
    m.polygonOffsetUnits = -4;
  }
  if (m.map) m.map.colorSpace = SRGBColorSpace;
  for (const t of [m.map, m.normalMap, m.roughnessMap]) if (t) t.anisotropy = 4;
  const sheen = Number(m.userData?.css_sheen ?? 0);
  const coat = Number(m.userData?.css_coat ?? 0);
  if (quality === 'basse' || (!sheen && !coat)) return m.clone();
  return physicalFrom(m, {
    metalness: 0,
    sheen,
    sheenRoughness: 0.45,
    sheenColor: m.color.clone().lerp(m.color.clone().set('#ffffff'), 0.4),
    clearcoat: coat,
    clearcoatRoughness: 0.35,
  });
}
