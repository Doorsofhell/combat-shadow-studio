import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

/**
 * 1.34 démarrage rapide (Youssef, 2026-11-11: « Pourquoi le démarrage est devenu si lent ? », then « toute la 3D des
 * coachs et des salles chargée au démarrage pour que ça ne mette pas de temps à s'afficher quand on change de coach »).
 *
 * 1. The coaches' models are compressed when the app is built (EXT_meshopt_compression, without quantization or
 *    reordering: every point, normal, weight and texture stays exactly the same; checked by
 *    src/boot/__tests__/compression.test.ts). The files in public/ stay as they are, for the tests and the generators.
 *    98.6 Mo → 63.6 Mo for the 48 models the start screen downloads.
 * 2. The start screen knows each file by a fingerprint of the bytes it serves (virtual:boot-assets), so it can tell a
 *    file already on the phone without the size the server announces (a server that compresses on the fly gives none:
 *    the app then threw away and downloaded again 90 Mo at each launch).
 */

const PUB = 'public';
const VIRTUAL = 'virtual:boot-assets';
const CACHE = 'node_modules/.cache/css-meshopt';

/** the files of the start screen: each coach's photo model and outfits (not the referee's), the rooms */
export function bootFiles(pub = PUB): string[] {
  const out: string[] = [];
  for (const c of readdirSync(join(pub, 'coaches')).sort()) {
    const dir = join(pub, 'coaches', c);
    if (!statSync(dir).isDirectory()) continue;
    if (readdirSync(dir).includes('photo.glb')) out.push(`coaches/${c}/photo.glb`);
    // Amara's cleaned dressed-only source must also be fingerprinted and
    // losslessly compressed, so her first outfit loads from the startup cache.
    if (c === 'mma-amara' && readdirSync(dir).includes('photo-clean.glb')) out.push(`coaches/${c}/photo-clean.glb`);
    const t = join(dir, 'tenues');
    if (existsSync(t)) for (const f of readdirSync(t).sort()) if (f.endsWith('.glb') && !f.startsWith('arbitre')) out.push(`coaches/${c}/tenues/${f}`);
  }
  for (const r of readdirSync(join(pub, 'salles')).sort()) for (const f of readdirSync(join(pub, 'salles', r)).sort()) out.push(`salles/${r}/${f}`);
  return out;
}

const sha = (b: Uint8Array) => createHash('sha1').update(b).digest('hex');

/** the model with its buffers compressed (lossless), kept between builds under its source fingerprint */
export async function compressModel(src: Uint8Array): Promise<Uint8Array> {
  const file = join(CACHE, `${sha(src)}.glb`);
  if (existsSync(file)) return readFileSync(file);
  const [{ NodeIO }, { ALL_EXTENSIONS, EXTMeshoptCompression }, { MeshoptEncoder, MeshoptDecoder }] = await Promise.all([
    import('@gltf-transform/core'),
    import('@gltf-transform/extensions'),
    import('meshoptimizer'),
  ]);
  await MeshoptEncoder.ready;
  await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
  const doc = await io.readBinary(src);
  // QUANTIZE method without the quantize() step: the buffers are only encoded, their values are not changed
  doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
  const out = await io.writeBinary(doc);
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(file, out);
  return out;
}

export type BootAssets = Record<string, [bytes: number, version: string]>;

export function bootModels(): Plugin {
  let build = false;
  let outDir = 'dist';
  let served: Promise<Map<string, Uint8Array>> | null = null;
  /** what the server will send for each file: the compressed model in a build, the file itself otherwise */
  const files = () =>
    (served ??= (async () => {
      const m = new Map<string, Uint8Array>();
      for (const rel of bootFiles()) {
        const src = readFileSync(join(PUB, rel));
        m.set(rel, build && rel.endsWith('.glb') ? await compressModel(src) : src);
      }
      return m;
    })());
  return {
    name: 'css-boot-models',
    configResolved(c) {
      build = c.command === 'build' && process.env.CSS_RAW_MODELS !== '1';
      outDir = c.build.outDir;
    },
    resolveId(id) {
      return id === VIRTUAL ? `\0${VIRTUAL}` : null;
    },
    async load(id) {
      if (id !== `\0${VIRTUAL}`) return null;
      const out: BootAssets = {};
      for (const [rel, b] of await files()) out[rel] = [b.byteLength, sha(b).slice(0, 12)];
      return `export default ${JSON.stringify(out)};`;
    },
    closeBundle: {
      sequential: true,
      async handler() {
        if (!build) return;
        let before = 0;
        let after = 0;
        for (const [rel, b] of await files()) {
          if (!rel.endsWith('.glb')) continue;
          const dest = join(outDir, rel);
          if (!existsSync(dest)) continue;
          before += statSync(dest).size;
          writeFileSync(dest, b);
          after += b.byteLength;
        }
        console.log(`modèles des coachs compressés : ${(before / 1e6).toFixed(1)} Mo → ${(after / 1e6).toFixed(1)} Mo`);
      },
    },
  };
}
