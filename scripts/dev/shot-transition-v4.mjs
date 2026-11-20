// Captures pendant un changement de coach (V4) : vérifie qu'aucune image n'est noire pendant le fondu.
// Usage : node scripts/dev/shot-transition-v4.mjs <dossier> <port>
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const [OUT, PORT] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 393, height: 851 } });
await p.goto(`http://localhost:${PORT}/`);
await p.evaluate(() => new Promise((res) => { const r = indexedDB.open('keyval-store'); r.onupgradeneeded = () => r.result.createObjectStore('keyval'); r.onsuccess = () => { const tx = r.result.transaction('keyval', 'readwrite'); tx.objectStore('keyval').put(JSON.stringify({ state: { profile: { completed: true, coach: 'femme', champion: 'kanya', mainDiscipline: 'boxe', pseudo: 'T' } }, version: 0 }), 'u:local:css-profile'); tx.oncomplete = () => res(); }; }));
await p.goto(`http://localhost:${PORT}/#/coach`);
await p.waitForSelector('[data-testid=star-stage][data-ready=true]', { timeout: 120000 });
await p.waitForTimeout(3000);
await p.getByTestId('star-next').click();
for (let i = 0; i < 6; i++) {
  await p.screenshot({ path: `${OUT}/t${i}.png`, clip: { x: 0, y: 0, width: 393, height: 520 } });
  await p.waitForTimeout(250);
}
console.log(await p.evaluate(() => (localStorage.getItem("css-3d-diag") || "").match(/"[^"]*(qualit|niveau)[^"]*"/g)?.join("\n")));
await b.close();
