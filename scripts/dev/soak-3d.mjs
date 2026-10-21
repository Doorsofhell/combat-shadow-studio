import { chromium, devices } from '@playwright/test';
// Soak test of the 3D coach on a simulated phone: counts live WebGL objects, contexts and errors over time.
// node scripts/dev/soak-3d.mjs <baseUrl> <seconds> <path> [coach]
const [BASE = 'http://localhost:4190', SECS = '180', PATH = '/', COACH = 'homme'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info'] });
const ctx = await b.newContext({ ...devices['Pixel 7'] });
const p = await ctx.newPage();
const log = [];
p.on('response', (r) => (r.status() >= 400 || /\.(glb|json|jpg|png|webp)$/.test(r.url()) && /coaches|models/.test(r.url())) && log.push(`HTTP ${r.status()} ${r.url().replace(BASE, '')}`));
p.on('pageerror', (e) => log.push(`PAGEERROR ${e.message}`));
p.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && log.push(`${m.type()} ${m.text().slice(0, 300)}`));
await p.addInitScript(() => {
  const live = { contexts: 0, textures: 0, buffers: 0, programs: 0, framebuffers: 0, renderbuffers: 0, texBytes: 0, lost: 0 };
  window.__gl = live;
  const origGet = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...a) {
    const c = origGet.call(this, type, ...a);
    if (c && /webgl/.test(type) && !this.__counted) {
      this.__counted = true;
      live.contexts++;
      this.addEventListener('webglcontextlost', () => live.lost++);
    }
    return c;
  };
  for (const P of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
    for (const [mk, rm, k] of [
      ['createTexture', 'deleteTexture', 'textures'],
      ['createBuffer', 'deleteBuffer', 'buffers'],
      ['createProgram', 'deleteProgram', 'programs'],
      ['createFramebuffer', 'deleteFramebuffer', 'framebuffers'],
      ['createRenderbuffer', 'deleteRenderbuffer', 'renderbuffers'],
    ]) {
      const c0 = P[mk];
      const d0 = P[rm];
      P[mk] = function (...a) {
        live[k]++;
        return c0.apply(this, a);
      };
      P[rm] = function (o) {
        if (o) live[k]--;
        return d0.call(this, o);
      };
    }
    const ti = P.texImage2D;
    P.texImage2D = function (...a) {
      if (a.length >= 9 && typeof a[3] === 'number') live.texBytes += a[3] * a[4] * 4;
      else if (a[5] && a[5].width) live.texBytes += a[5].width * a[5].height * 4;
      return ti.apply(this, a);
    };
  }
});
await p.goto(`${BASE}/icons/icon.svg`);
await p.evaluate(async (coach) => {
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
  await put('u:local:css-profile', { state: { profile: { completed: true, coach, mainDiscipline: 'mma', levels: { boxe: 'debutant', kickboxing: 'debutant', mma: 'debutant', muaythai: 'debutant', bjj: 'debutant', judo: 'debutant' }, guard: 'orthodoxe' } }, version: 0 });
}, COACH);
const t0 = Date.now();
await p.goto(`${BASE}/#${PATH}`);
const end = t0 + Number(SECS) * 1000;
while (Date.now() < end) {
  await p.waitForTimeout(10000);
  const s = await p.evaluate(() => ({
    gl: { ...window.__gl, texMB: Math.round(window.__gl.texBytes / 1e6) },
    canvases: document.querySelectorAll('canvas').length,
    failed: /indisponible|pas pu être affiché/.test(document.body.innerText),
    heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null,
  }));
  console.log(Math.round((Date.now() - t0) / 1000) + 's', JSON.stringify(s));
}
await p.screenshot({ path: process.env.SHOT ?? '/tmp/soak.png' });
console.log(log.slice(0, 40).join('\n'));
await b.close();
