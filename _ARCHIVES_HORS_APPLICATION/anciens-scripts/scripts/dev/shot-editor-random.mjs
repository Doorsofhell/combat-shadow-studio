import { chromium } from '@playwright/test';
// Fighter creator: front view, then several presses on « Aléatoire » (dev server on :5173).
// usage: node scripts/dev/shot-editor-random.mjs OUT_DIR [count] [view: face|profil|dos|trois-quarts]
const OUT = process.argv[2];
const N = Number(process.argv[3] ?? 5);
const VIEW = process.argv[4] ?? 'face';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 412, height: 915 } });
p.on('pageerror', (e) => console.log('ERR', e.message));
await p.goto('http://localhost:5173/icons/icon.svg');
await p.evaluate(async () => {
  const put = (k, val) => new Promise((res) => { const r = indexedDB.open('keyval-store'); r.onupgradeneeded = () => r.result.createObjectStore('keyval'); r.onsuccess = () => { const tx = r.result.transaction('keyval', 'readwrite'); tx.objectStore('keyval').put(JSON.stringify(val), k); tx.oncomplete = () => res(); }; });
  await put('u:local:css-profile', { state: { profile: { experience: 'aucune', levels: { boxe: 'debutant', kickboxing: 'debutant', mma: 'debutant', muaythai: 'debutant' }, goals: [], daysPerWeek: 3, sessionMinutes: 30, guard: 'orthodoxe', limitations: '', mainDiscipline: 'boxe', coach: 'homme', completed: true } }, version: 0 });
});
await p.goto('http://localhost:5173/#/combattant');
await p.waitForTimeout(5000);
await p.locator(`[data-testid="view-${VIEW}"]`).click();
await p.waitForTimeout(800);
await p.locator('.cs-stage').screenshot({ path: `${OUT}/ed-0.png` });
for (let i = 1; i <= N; i++) {
  await p.getByRole('button', { name: 'Apparence aléatoire' }).click();
  await p.waitForTimeout(2500);
  await p.locator('.cs-stage').screenshot({ path: `${OUT}/ed-${i}.png` });
}
await b.close();
