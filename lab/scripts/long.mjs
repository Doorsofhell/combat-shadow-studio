/** long session: the combo plays in a loop; frame rate and JS memory every 30 s (built lab on :5200) */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const [, , OUT = 'lab/out/long.json', MIN = '5'] = process.argv;
const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const out = {};
for (const engine of ['three', 'babylon']) {
  const b = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-precise-memory-info'] });
  const p = await b.newPage({ viewport: { width: 720, height: 1280 } });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`http://localhost:5200/${engine}.html?coach=homme&s=combo&q=haute`);
  await p.waitForFunction(() => window.__lab?.ready && window.__lab.timings.firstFrame, null, { timeout: 180000 });
  const samples = [];
  for (let i = 0; i < Number(MIN) * 2; i++) {
    await p.evaluate(() => window.__lab.startStats());
    await p.waitForTimeout(30000);
    const s = await p.evaluate(() => ({ ...window.__lab.stats(), heapMB: window.__lab.heap() / 1048576 }));
    samples.push({ t: (i + 1) * 30, fps: s.fpsMean, frameMsSd: s.frameMsSd, heapMB: s.heapMB });
  }
  out[engine] = { samples, errors };
  console.log(engine, JSON.stringify(samples.map((s) => [s.t, +s.fps.toFixed(2), +s.heapMB.toFixed(1)])), errors.length, 'erreurs');
  await b.close();
}
writeFileSync(OUT, JSON.stringify(out, null, 1));
