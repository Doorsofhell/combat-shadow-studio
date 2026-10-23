// v0.42 (Youssef, « Architecture humanoïde évolutive » §3 and §21-A): the fingerprint of everything that makes
// Kadir, Amara and the validated movements. Written once, before any change; the test
// src/domain/coaches/__tests__/reference.test.ts fails if one of these files changes.
// Usage: node scripts/coach-reference.mjs > src/domain/coaches/reference/manifest.json
import { createHash } from 'crypto';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export const FROZEN = ['public/coaches/mma-kadir', 'public/coaches/mma-amara', 'public/models', 'src/engine/library', 'src/domain/coaches/looks.ts', 'src/domain/coaches/motion.ts'];

const walk = (p) => (statSync(p).isDirectory() ? readdirSync(p).sort().flatMap((f) => walk(join(p, f))) : [p]);
export const manifest = () =>
  Object.fromEntries(FROZEN.flatMap(walk).map((f) => [f, createHash('sha256').update(readFileSync(f)).digest('hex')]));

if (import.meta.url === `file://${process.argv[1]}`) console.log(JSON.stringify({ written: '2026-10-23', base: '407ff26 (v0.41.0)', files: manifest() }, null, 1));
