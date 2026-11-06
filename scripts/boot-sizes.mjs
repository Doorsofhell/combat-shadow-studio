// 1.25 chargement au démarrage: sizes of the files the start screen downloads (photo coaches, their outfits, the
// rooms), so its bar follows the bytes really received from the very first file. Run after a model or a room
// changes: node scripts/boot-sizes.mjs (src/boot/__tests__/preload.test.ts fails while the list is out of date).
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const pub = 'public';
const out = {};
const add = (rel) => (out[rel] = statSync(join(pub, rel)).size);
for (const c of readdirSync(join(pub, 'coaches')).sort()) {
  const dir = join(pub, 'coaches', c);
  if (!statSync(dir).isDirectory()) continue;
  if (readdirSync(dir).includes('photo.glb')) add(`coaches/${c}/photo.glb`);
  const t = join(dir, 'tenues');
  try {
    for (const f of readdirSync(t).sort()) if (f.endsWith('.glb') && !f.startsWith('arbitre')) add(`coaches/${c}/tenues/${f}`);
  } catch {}
}
for (const r of readdirSync(join(pub, 'salles')).sort()) for (const f of readdirSync(join(pub, 'salles', r)).sort()) add(`salles/${r}/${f}`);
writeFileSync('src/boot/assetSizes.json', JSON.stringify(out, null, 1) + '\n');
console.log(Object.keys(out).length, 'fichiers', (Object.values(out).reduce((a, b) => a + b, 0) / 1e6).toFixed(1), 'Mo');
