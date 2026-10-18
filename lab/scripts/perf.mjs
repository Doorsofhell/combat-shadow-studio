/**
 * Performance runs on the built lab (node lab/scripts/serve.mjs on :5200). One fresh browser per run,
 * one engine per page. Chromium headless with SwiftShader (software WebGL on the CPU): the absolute
 * numbers are NOT those of a phone or a GPU; only the comparison between the two versions, measured
 * the same way on the same machine, is meaningful.
 * Usage: node lab/scripts/perf.mjs <out.json> [runs] [seconds]
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const [, , OUT = 'lab/out/perf.json', RUNS = '3', SECS = '15'] = process.argv;
const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const CASES = [
  { engine: 'three', q: 'haute', look: 'realiste' },
  { engine: 'babylon', q: 'haute', look: 'realiste' },
  { engine: 'three', q: 'basse', look: 'realiste' },
  { engine: 'babylon', q: 'basse', look: 'realiste' },
  { engine: 'three', q: 'haute', look: 'encre' },
];
const results = [];
for (let run = 0; run < Number(RUNS); run++) {
  for (const c of CASES) {
    const b = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-precise-memory-info'] });
    const p = await b.newPage({ viewport: { width: 720, height: 1280 } });
    const cdp = await p.context().newCDPSession(p);
    await cdp.send('Performance.enable');
    const metric = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
    await p.goto(`http://localhost:5200/${c.engine}.html?coach=homme&s=combo&q=${c.q}&look=${c.look}`);
    await p.waitForFunction(() => window.__lab?.ready && window.__lab.timings.firstFrame, null, { timeout: 180000 });
    const load = await p.evaluate(() => {
      const js = performance.getEntriesByType('resource').filter((r) => r.name.endsWith('.js'));
      return { ...window.__lab.timings, jsFiles: js.length, jsTransfer: js.reduce((a, r) => a + r.encodedBodySize, 0), jsDecoded: js.reduce((a, r) => a + r.decodedBodySize, 0) };
    });
    await p.waitForTimeout(3000); // warm-up
    const heapStart = await p.evaluate(() => window.__lab.heap());
    const m0 = await metric();
    await p.evaluate(() => window.__lab.startStats());
    await p.waitForTimeout(Number(SECS) * 1000);
    const st = await p.evaluate(() => window.__lab.stats());
    const m1 = await metric();
    const heapEnd = await p.evaluate(() => window.__lab.heap());
    const wall = m1.Timestamp - m0.Timestamp;
    results.push({
      ...c, run,
      load,
      heapStartMB: heapStart / 1048576, heapEndMB: heapEnd / 1048576,
      mainThreadBusy: (m1.TaskDuration - m0.TaskDuration) / wall,
      scriptShare: (m1.ScriptDuration - m0.ScriptDuration) / wall,
      ...st,
      cpuMsPerFrame: ((m1.TaskDuration - m0.TaskDuration) * 1000) / Math.max(1, st.frames),
    });
    console.log(JSON.stringify(results.at(-1)));
    await b.close();
  }
}
writeFileSync(OUT, JSON.stringify(results, null, 1));
