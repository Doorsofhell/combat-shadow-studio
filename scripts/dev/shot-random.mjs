import { chromium } from '@playwright/test';
// Random fighters (seeded) in the training studio, two moments of the move (dev server on :5173).
// usage: node scripts/dev/shot-random.mjs OUT_DIR "1,2,3" [sex: homme|femme] [exercise]
const OUT = process.argv[2];
const SEEDS = (process.argv[3] ?? '1,2,3,4').split(',').map(Number);
const SEX = process.argv[4] ?? 'homme';
const EX = process.argv[5] ?? 'boxe-debutant-01';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 360, height: 700 } });
p.on('pageerror', (e) => console.log('ERR', e.message));
for (const seed of SEEDS) {
  await p.goto('http://localhost:5173/');
  await p.waitForLoadState('networkidle');
  await p.evaluate(async ({ seed, sex }) => {
    const R = await import('/src/editor/random.ts');
    let a = seed >>> 0;
    const rng = () => ((a = (a + 0x6d2b79f5) >>> 0), (((a ^ (a >>> 15)) * (1 | a)) >>> 0) / 4294967296);
    const look = R.randomLook(sex, rng, ['etoile', 'soleil', 'bande-tribale']);
    const put = (k, val) => new Promise((res) => { const r = indexedDB.open('keyval-store'); r.onupgradeneeded = () => r.result.createObjectStore('keyval'); r.onsuccess = () => { const tx = r.result.transaction('keyval', 'readwrite'); tx.objectStore('keyval').put(JSON.stringify(val), k); tx.oncomplete = () => res(); }; });
    await put('u:local:css-profile', { state: { profile: { experience: 'aucune', levels: { boxe: 'debutant', kickboxing: 'debutant', mma: 'debutant', muaythai: 'debutant' }, goals: [], daysPerWeek: 3, sessionMinutes: 30, guard: 'orthodoxe', limitations: '', mainDiscipline: 'boxe', coach: sex, completed: true } }, version: 0 });
    await put('u:local:css-fighters', { state: { fighters: [{ id: 'f1', name: 'r' + seed, look, createdAt: '', updatedAt: '' }], activeId: 'f1' }, version: 0 });
    window.__look = look;
  }, { seed, sex: SEX });
  await p.goto('about:blank');
  await p.goto(`http://localhost:5173/#/entrainement?ex=${EX}&mode=technique`);
  await p.waitForTimeout(6000);
  await p.locator('.tr-stage').screenshot({ path: `${OUT}/r${SEX[0]}${seed}-a.png` });
  await p.waitForTimeout(1300);
  await p.locator('.tr-stage').screenshot({ path: `${OUT}/r${SEX[0]}${seed}-b.png` });
}
await b.close();
