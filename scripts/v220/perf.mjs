// v2.2.0 Phase E — mesures de performance comparables entre deux builds (même page Lab, même vue, même machine).
// node scripts/v220/perf.mjs <base-url> <sortie.json> [coachs]
// Compté dans WebGL lui-même (script injecté avant la page, identique pour les deux versions) :
// appels de dessin et triangles par image, textures envoyées (Mo estimés, non compressées, sans mipmaps), temps
// jusqu'au coach habillé, durée moyenne d'une image sur 4 s. Logiciel (SwiftShader, sans carte graphique) : les
// valeurs absolues ne disent rien d'un téléphone ; seul l'écart entre versions compte.
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const [BASE, OUT, coachArg] = process.argv.slice(2);
const COACHES = coachArg ? coachArg.split(',') : ['mma-kadir', 'mma-amara', 'nael', 'inaya', 'victor', 'kanya'];
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const res = {};
for (const c of COACHES) {
  const p = await b.newPage({ viewport: { width: 540, height: 720 } });
  await p.addInitScript(() => {
    const S = (window.__perf = { calls: 0, tris: 0, texBytes: 0, frames: [] });
    for (const C of [WebGLRenderingContext, WebGL2RenderingContext]) {
      const P = C.prototype;
      const de = P.drawElements;
      P.drawElements = function (mode, count, ...r) { S.calls++; S.tris += count / 3; return de.call(this, mode, count, ...r); };
      const da = P.drawArrays;
      P.drawArrays = function (mode, first, count) { S.calls++; S.tris += count / 3; return da.call(this, mode, first, count); };
      const ti = P.texImage2D;
      P.texImage2D = function (...a) {
        const src = a[a.length - 1];
        const w = a.length >= 9 ? a[3] : src?.width ?? 0;
        const h = a.length >= 9 ? a[4] : src?.height ?? 0;
        if (a[1] === 0) S.texBytes += (w || 0) * (h || 0) * 4;
        return ti.apply(this, a);
      };
    }
    const tick = () => { S.frames.push(performance.now()); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  const t0 = Date.now();
  await p.goto(`${BASE}/#/lab?champion=${c}&look=realiste&d=mma&frame=1&motion=garde&az=35&el=8&light=app`);
  await p.waitForFunction(() => window.__labReady === true && ['portee', 'aucune', 'erreur'].includes(window.__labOutfit), null, { timeout: 300000 });
  const loadMs = Date.now() - t0;
  await p.waitForTimeout(3000);
  // une fenêtre de mesure de 4 s
  const m = await p.evaluate(async () => {
    const S = window.__perf;
    const c0 = S.calls, t0 = S.tris, f0 = S.frames.length, s = performance.now();
    await new Promise((r) => setTimeout(r, 4000));
    const n = S.frames.length - f0;
    return { callsPerFrame: (S.calls - c0) / n, trisPerFrame: (S.tris - t0) / n, msPerFrame: (performance.now() - s) / n, texMB: S.texBytes / 1048576 };
  });
  res[c] = { loadMs, ...Object.fromEntries(Object.entries(m).map(([k, v]) => [k, Math.round(v * 10) / 10])) };
  console.log(c, JSON.stringify(res[c]));
  await p.close();
}
writeFileSync(OUT, JSON.stringify(res, null, 1));
await b.close();
