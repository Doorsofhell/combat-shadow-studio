import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.CAPTURE_BASE || 'http://127.0.0.1:4173';
const output = 'captures/revue-amara-v1379';
const outfits = [
  ['boxe', 'boxe', 'Boxe'],
  ['kickboxing', 'kickboxing', 'Kick-boxing'],
  ['muaythai', 'muaythai', 'Muay-thaï'],
  ['mma', 'mma', 'MMA'],
  ['bjj', 'bjj', 'JJB'],
  ['bjj-nogi', 'bjj', 'JJB no-gi'],
  ['judo', 'judo', 'Judo'],
];
const poses = [
  { name: 'garde-face', label: 'GARDE — FACE', motion: 'motion=garde', az: 15 },
  { name: 'garde-dos', label: 'GARDE — DOS', motion: 'motion=garde', az: 180 },
  { name: 'low-kick', label: 'LOW KICK', motion: 'tech=low-kick-arriere', az: 40 },
  { name: 'high-kick', label: 'HIGH KICK', motion: 'tech=high-kick-arriere', az: 40 },
];
const browser = await chromium.launch({
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'],
});
await mkdir(output, { recursive: true });
const diagnostics = [];

try {
  const page = await browser.newPage({ viewport: { width: 360, height: 590 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('JS PAGE ERROR', String(e).slice(0, 500)));
  for (const [outfit, disc, label] of outfits) {
    const shots = [];
    for (const pose of poses) {
      const query = [
        'champion=mma-amara', 'd=' + encodeURIComponent(disc),
        'tenue=' + encodeURIComponent(outfit), pose.motion,
        'az=' + pose.az, 'light=app', 'zoom=1',
      ].join('&');
      await page.goto('about:blank');
      await page.goto(base + '/#/lab?' + query, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForFunction(() => window.__labReady === true && window.__labOutfit === 'portee', null, { timeout: 120000 });
      await page.waitForTimeout(900);
      const state = await page.evaluate(() => ({
        outfit: window.__labOutfit,
        stretch: typeof window.__labStretch === 'function' ? window.__labStretch(3, 0.04).length : null,
      }));
      if (state.outfit !== 'portee') throw new Error(outfit + '/' + pose.name + ': outfit not worn');
      const screenshot = await page.screenshot({ type: 'png' });
      shots.push({ ...pose, png: screenshot.toString('base64'), stretch: state.stretch });
      diagnostics.push({ outfit, pose: pose.name, outfitState: state.outfit, largeStretchTriangles: state.stretch });
      console.log('CAPTURE', outfit, pose.name, 'stretched triangles:', state.stretch);
    }
    const panel = await browser.newPage({ viewport: { width: 1480, height: 750 }, deviceScaleFactor: 1 });
    const escaped = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      *{box-sizing:border-box}body{margin:0;background:#131820;color:#e9edf4;font:15px Arial,sans-serif}
      header{height:81px;padding:14px 19px;display:flex;align-items:center;justify-content:space-between}
      h1{font-size:25px;margin:0 0 5px}p{font-size:12px;margin:0;color:#abb9cf}
      .strip{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:0 10px}
      .panel{background:#fff;overflow:hidden;border-radius:6px}
      .caption{height:29px;padding:7px 9px;background:#253147;color:white;font-weight:bold;font-size:13px}
      img{display:block;width:100%;height:590px;object-fit:contain;background:#d9dfe8}
      footer{padding:8px 16px;color:#eaa6a2;font-size:12px}
    </style></head><body><header><div><h1>AMARA — ${escaped(label)}</h1>
    <p>Contrôle réel du moteur 3D / branche 1.37.9 / 4 poses / vêtements existants</p></div>
    <div>À INSPECTER — PAS ENCORE VALIDÉ</div></header><div class="strip">
    ${shots.map(s=>`<div class="panel"><div class="caption">${escaped(s.label)} · triangles étirés &gt;3× : ${s.stretch ?? '?'}</div>
    <img src="data:image/png;base64,${s.png}" /></div>`).join('')}
    </div><footer>Rechercher : ancien bikini, trous au buste ou aux aisselles, coutures, filets entre les cuisses, stretch en kick. 
    JJB et judo : le kick est uniquement un stress test du vêtement.</footer></body></html>`;
    await panel.setContent(html, { waitUntil: 'load' });
    await panel.screenshot({ path: `${output}/amara-${outfit}.jpg`, type: 'jpeg', quality: 88 });
    await panel.close();
    console.log('SHEET', `${output}/amara-${outfit}.jpg`);
  }
  await page.close();
  await writeFile(`${output}/diagnostic.json`, JSON.stringify({ version: '1.37.9', source: 'Lab React Three.js', imagesAreValidated: false, records: diagnostics }, null, 2) + '\n');
} finally {
  await browser.close();
}
