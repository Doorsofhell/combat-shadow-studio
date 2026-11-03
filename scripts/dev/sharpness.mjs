import { chromium, devices } from '@playwright/test';
// Sharpness diagnosis of the 3D coach on a simulated phone (Pixel 7, device pixel ratio 2.625, touch screen):
// for each case, reads the canvas's internal size against its size on screen, the quality chosen by the app,
// and saves a screenshot at the phone's real resolution (OUT/<case>.png).
// node scripts/dev/sharpness.mjs OUT [base=http://localhost:5173] [path=/#/]
// CASES env: comma list of name:quality:level[:coach] (quality auto|haute|basse, level = stability level 0-2)
const [OUT, BASE = 'http://localhost:5173', PATH = '/#/'] = process.argv.slice(2);
const CASES = (process.env.CASES ?? 'auto0:auto:0,haute0:haute:0,basse0:basse:0,auto1:auto:1,auto2:auto:2').split(',');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const c of CASES) {
  const [name, quality, level, coach = 'homme'] = c.split(':');
  const ctx = await b.newContext({ ...devices['Pixel 7'] });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('ERR', e.message.slice(0, 200)));
  await p.goto(`${BASE}/icons/icon.svg`);
  await p.evaluate(
    async ({ quality, level, coach }) => {
      const put = (k, v) =>
        new Promise((res, rej) => {
          const r = indexedDB.open('keyval-store');
          r.onupgradeneeded = () => r.result.createObjectStore('keyval');
          r.onsuccess = () => {
            const tx = r.result.transaction('keyval', 'readwrite');
            tx.objectStore('keyval').put(JSON.stringify(v), k);
            tx.oncomplete = () => res();
            tx.onerror = () => rej(tx.error);
          };
        });
      await put('u:local:css-profile', { state: { profile: { completed: true, coach, mainDiscipline: 'muaythai' } }, version: 0 });
      await put('u:local:css-settings', { state: { settings: { quality, coachStyle: 'realiste', coachRender: 'premium' } }, version: 2 });
      localStorage.setItem('css-3d-level', JSON.stringify({ level: Number(level), at: Date.now() }));
      localStorage.removeItem('css-3d-diag');
    },
    { quality, level, coach },
  );
  await p.goto(`${BASE}${PATH}`);
  await p.waitForFunction(() => (JSON.parse(localStorage.getItem('css-3d-diag') ?? '[]')).some((e) => e.kind === 'modele'), null, { timeout: 180000 });
  await p.waitForTimeout(Number(process.env.WAIT ?? 6000));
  const info = await p.evaluate(() => {
    const cv = document.querySelector('canvas');
    const gl = cv.getContext('webgl2') ?? cv.getContext('webgl');
    const r = cv.getBoundingClientRect();
    return {
      css: `${Math.round(r.width)}x${Math.round(r.height)}`,
      internal: `${cv.width}x${cv.height}`,
      scale: +(cv.width / r.width).toFixed(3),
      dpr: devicePixelRatio,
      msaa: gl.getContextAttributes().antialias,
      samples: gl.getParameter(gl.SAMPLES),
      journal: JSON.parse(localStorage.getItem('css-3d-diag') ?? '[]').filter((e) => /demarrage|qualite/.test(e.kind)).map((e) => `${e.kind}: ${e.msg}`),
    };
  });
  console.log(name, JSON.stringify(info));
  const box = await p.locator('canvas').boundingBox();
  await p.screenshot({ path: `${OUT}/${name}.png`, clip: box });
  await ctx.close();
}
await b.close();
