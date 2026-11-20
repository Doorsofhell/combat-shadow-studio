// Captures réelles (WebGL) de l'écran « Ton coach » pour chaque coach : même profil, même discipline, même taille
// d'écran, même attente. Usage : node scripts/dev/shot-selection-v4.mjs <dossier> <port> [discipline] [largeur] [hauteur]
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const [OUT, PORT, DISC = 'boxe', W = '393', H = '851'] = process.argv.slice(2);
const COACHS = [
  ['mma-kadir', 'homme'],
  ['nael', 'homme'],
  ['victor', 'homme'],
  ['mma-amara', 'femme'],
  ['inaya', 'femme'],
  ['kanya', 'femme'],
];
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const report = [];
for (const [id, coach] of COACHS.filter(([id]) => !process.env.ONLY || process.env.ONLY.split(',').includes(id))) {
  const p = await b.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: 2 });
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await p.goto(`http://localhost:${PORT}/`);
  await p.evaluate(
    ([champion, coach, d]) =>
      new Promise((res) => {
        const r = indexedDB.open('keyval-store');
        r.onupgradeneeded = () => r.result.createObjectStore('keyval');
        r.onsuccess = () => {
          const tx = r.result.transaction('keyval', 'readwrite');
          tx.objectStore('keyval').put(JSON.stringify({ state: { profile: { completed: true, coach, champion, mainDiscipline: d, pseudo: 'Test' } }, version: 0 }), 'u:local:css-profile');
          tx.oncomplete = () => res();
        };
      }),
    [id, coach, DISC],
  );
  const t0 = Date.now();
  await p.goto(`http://localhost:${PORT}/#/coach`);
  await p.waitForSelector('[data-testid=star-stage][data-ready=true]', { timeout: 180000 });
  const ready = Date.now() - t0;
  await p.waitForTimeout(4000);
  const file = `${OUT}/${id}.png`;
  await p.screenshot({ path: file });
  report.push({ id, readyMs: ready, errors });
  console.log(id, ready, 'ms', errors.length, 'erreurs');
  await p.close();
}
writeFileSync(`${OUT}/rapport.json`, JSON.stringify(report, null, 2));
await b.close();
