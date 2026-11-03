import { chromium, devices } from '@playwright/test';
// Reproduces what a phone does when its graphics process resets: crashes Chromium's GPU process (DevTools
// protocol Browser.crashGpuProcess) while the coach is on screen, then reports whether the page can still
// create a WebGL context and what the home screen shows.
// node scripts/dev/gpucrash.mjs <baseUrl> <crashes> [homme|femme]
const [BASE = 'http://localhost:4190', CRASHES = '1', COACH = 'homme'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ ...devices['Pixel 7'] });
const p = await ctx.newPage();
const t0 = Date.now();
const stamp = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;
p.on('console', (m) => /3D|WebGL|context|CoachStage/i.test(m.text()) && console.log(stamp(), 'console', m.type(), m.text().slice(0, 220)));
p.on('pageerror', (e) => console.log(stamp(), 'PAGEERROR', e.message.slice(0, 200)));
await p.goto(`${BASE}/icons/icon.svg`);
await p.evaluate(async (coach) => {
  await new Promise((res, rej) => {
    const r = indexedDB.open('keyval-store');
    r.onupgradeneeded = () => r.result.createObjectStore('keyval');
    r.onsuccess = () => {
      const tx = r.result.transaction('keyval', 'readwrite');
      tx.objectStore('keyval').put(JSON.stringify({ state: { profile: { completed: true, coach, mainDiscipline: 'mma', levels: { boxe: 'debutant', kickboxing: 'debutant', mma: 'debutant', muaythai: 'debutant', bjj: 'debutant', judo: 'debutant' }, guard: 'orthodoxe' } }, version: 0 }), 'u:local:css-profile');
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    };
  });
}, COACH);
await p.goto(`${BASE}/#/`);
const state = () =>
  p.evaluate(() => {
    const c = document.createElement('canvas');
    const probe = c.getContext('webgl2') ? 'ok' : 'NULL';
    c.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();
    const cv = [...document.querySelectorAll('canvas')];
    return { newContext: probe, canvases: cv.length, lost: cv.map((x) => { try { return x.getContext('webgl2')?.isContextLost?.() ?? 'n/a'; } catch { return 'err'; } }), text: (document.querySelector('.hero-loading')?.textContent ?? '').slice(0, 90), safe: localStorage.getItem('css-3d-safe'), diag: (localStorage.getItem('css-3d-diag') ?? '').slice(-300) };
  });
await p.waitForSelector('canvas', { timeout: 60000 });
await p.waitForTimeout(6000);
console.log(stamp(), 'before', JSON.stringify(await state()));
const cdp = await b.newBrowserCDPSession();
for (let i = 0; i < Number(CRASHES); i++) {
  await cdp.send('Browser.crashGpuProcess').catch((e) => console.log('crash call', e.message));
  console.log(stamp(), `GPU process crashed (${i + 1})`);
  await p.waitForTimeout(1200);
  console.log(stamp(), 'after', JSON.stringify(await state()));
}
for (const w of (process.env.WAITS ?? '3000,6000,12000').split(',').map(Number)) {
  await p.waitForTimeout(w);
  console.log(stamp(), 'later', JSON.stringify(await state()));
}
await p.screenshot({ path: process.env.SHOT ?? '/tmp/gpucrash.png' });
await p.reload();
await p.waitForTimeout(12000);
console.log(stamp(), 'after reload', JSON.stringify(await state()));
await b.close();
