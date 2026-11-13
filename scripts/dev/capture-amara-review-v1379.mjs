import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

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
      // Save the ACTUAL Three.js screenshot immediately: no giant base64 images in Chromium.
      // Composing giant data URLs after WebGL caused Page.captureScreenshot to fail on GitHub Actions.
      await page.evaluate((label) => {
        const tag = document.createElement('div');
        tag.textContent = label + ' — AMARA — CAPTURE DE DIAGNOSTIC NON VALIDÉE';
        tag.style.cssText = 'position:fixed;left:0;right:0;top:0;background:rgba(17,24,39,.9);' +
          'color:white;font:700 12px Arial;padding:9px 12px;z-index:2147483647;pointer-events:none';
        document.body.appendChild(tag);
      }, pose.label);
      const filepath = `${output}/amara-${outfit}-${pose.name}.jpg`;
      await page.screenshot({ path: filepath, type: 'jpeg', quality: 87 });
      shots.push({ ...pose, filepath, stretch: state.stretch });
      diagnostics.push({ outfit, pose: pose.name, outfitState: state.outfit, largeStretchTriangles: state.stretch });
      console.log('CAPTURE', outfit, pose.name, 'stretched triangles:', state.stretch);
    }
    // Compose four already saved JPEGs with ffmpeg, not via a second WebGL-heavy browser page.
    // Contact sheet is 4x360px wide: guard front/back and low/high kicks, same camera & light.
    execFileSync('ffmpeg', [
      '-y', '-loglevel', 'error',
      ...shots.flatMap(s => ['-i', s.filepath]),
      '-filter_complex', 'hstack=inputs=4',
      '-q:v', '3',
      `${output}/amara-${outfit}.jpg`,
    ], { stdio: 'inherit' });
    console.log('SHEET', `${output}/amara-${outfit}.jpg`);
  }
  await page.close();
  await writeFile(`${output}/diagnostic.json`, JSON.stringify({ version: '1.37.9', source: 'Lab React Three.js', imagesAreValidated: false, records: diagnostics }, null, 2) + '\n');
} finally {
  await browser.close();
}
