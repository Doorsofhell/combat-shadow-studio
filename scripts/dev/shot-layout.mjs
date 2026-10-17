import { chromium } from '@playwright/test';
// Training screen screenshots at several sizes (dev server on :5173): node scripts/dev/shot-layout.mjs OUT [WxH,...] [exercise,...]
const OUT = process.argv[2];
const sizes = (process.argv[3] ?? '360x640,740x360').split(',').map((s) => s.split('x').map(Number));
const exs = (process.argv[4] ?? 'muaythai-expert-02,boxe-debutant-01').split(',');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const [w, h] of sizes) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.on('pageerror', (e) => console.log('ERR', e.message));
  await p.goto('http://localhost:5173/');
  await p.waitForLoadState('networkidle');
  await p.evaluate(async () => {
    const put = (k, val) => new Promise((res) => { const r = indexedDB.open('keyval-store'); r.onupgradeneeded = () => r.result.createObjectStore('keyval'); r.onsuccess = () => { const tx = r.result.transaction('keyval', 'readwrite'); tx.objectStore('keyval').put(JSON.stringify(val), k); tx.oncomplete = () => res(); }; });
    await put('u:local:css-profile', { state: { profile: { experience: 'aucune', levels: { boxe: 'debutant', kickboxing: 'debutant', mma: 'debutant', muaythai: 'debutant' }, goals: [], daysPerWeek: 3, sessionMinutes: 30, guard: 'orthodoxe', limitations: '', mainDiscipline: 'boxe', coach: 'homme', completed: true } }, version: 0 });
  });
  for (const ex of exs) {
    await p.goto('about:blank');
    await p.goto(`http://localhost:5173/#/entrainement?ex=${ex}&mode=technique`);
    await p.waitForTimeout(5000);
    await p.screenshot({ path: `${OUT}/${w}x${h}-${ex}.png` });
  }
  await p.close();
}
await b.close();
