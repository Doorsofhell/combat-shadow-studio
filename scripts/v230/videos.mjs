// 2.3.0 Lot 2: real WebGL sequences (Lab view of a local build), before (?v230=0) and after, image by image at 30 i/s
// of animation time, then a side-by-side video (left: before, right: after) at half speed with ffmpeg.
// node scripts/v230/videos.mjs OUT coachs techniques   env PORT (vite preview, default 4180), CHROMIUM_PATH
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const [OUT = 'docs/v230/videos', coachArg = 'mma-kadir,mma-amara', techArg = 'direct,uppercut-arriere,overhand,high-kick-avant'] = process.argv.slice(2);
const PORT = process.env.PORT ?? 4180;
const DISC = { overhand: 'mma', sprawl: 'mma', 'uchikomi-o-soto-gari': 'judo', 'teep-avant': 'muaythai', 'genou-direct-arriere': 'muaythai', 'middle-kick-arriere': 'muaythai', 'low-kick-arriere': 'kickboxing', 'high-kick-avant': 'kickboxing' };
const AZ = { sprawl: 90, 'uchikomi-o-soto-gari': 60, jab: 60, direct: 60, 'crochet-arriere': 35, 'uppercut-arriere': 60, overhand: 60, 'teep-avant': 90 };
const FPS = 30;
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 360, height: 520 }, deviceScaleFactor: 1 });
const log = [];
for (const coach of coachArg.split(',')) {
  for (const tech of techArg.split(',')) {
    const dirs = {};
    for (const ver of ['avant', 'apres']) {
      const url = `http://localhost:${PORT}/#/lab?champion=${coach}&look=realiste&d=${DISC[tech] ?? 'boxe'}&tech=${tech}&az=${AZ[tech] ?? 45}&el=8${ver === 'avant' ? `&v230=${process.env.AVANT ?? '0'}` : ''}`;
      await p.goto('about:blank');
      await p.goto(url);
      await p.waitForFunction(() => window.__labReady === true, null, { timeout: 300000 });
      await p.waitForTimeout(2500);
      const dur = await p.evaluate(() => window.__labDur);
      const dir = `${OUT}/frames/${coach}_${tech}_${ver}`;
      mkdirSync(dir, { recursive: true });
      // the same number of images for both versions (the longer one), the shorter one holds its guard at the end
      const n = Math.ceil(Math.max(1.4, dur + 0.1) * FPS);
      for (let i = 0; i < n; i++) {
        await p.evaluate((x) => window.__labT(x), Math.min(dur, i / FPS));
        await p.waitForTimeout(120);
        await p.screenshot({ path: `${dir}/${String(i).padStart(3, '0')}.png` });
      }
      dirs[ver] = dir;
      log.push({ coach, tech, ver, url, duration: dur, images: n });
    }
    const file = `${OUT}/${coach}_${tech}_avant-apres.mp4`;
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS / 2), '-i', `${dirs.avant}/%03d.png`, '-framerate', String(FPS / 2), '-i', `${dirs.apres}/%03d.png`,
      '-filter_complex', "[0]drawtext=text='avant (2.2.0)':x=10:y=10:fontsize=18:fontcolor=black[a];[1]drawtext=text='après (2.3.0)':x=10:y=10:fontsize=18:fontcolor=black[b];[a][b]hstack", '-pix_fmt', 'yuv420p', '-vcodec', 'libx264', file]);
    console.log(file);
  }
}
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(log, null, 1));
await b.close();
