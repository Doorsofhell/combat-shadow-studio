import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const OUT = 'captures/amara-mma-prototype';
const BASE = 'http://127.0.0.1:4173';
const camera = [
  ['01-garde-face', 'motion=garde', '15'],
  ['02-garde-dos', 'motion=garde', '180'],
  ['03-low-kick', 'tech=low-kick-arriere', '40'],
  ['04-high-kick', 'tech=high-kick-arriere', '40'],
  ['05-high-kick-profil', 'tech=high-kick-arriere', '90'],
  ['06-brassiere-profil', 'motion=garde&span=0.48&fy=1.2', '80'],
];
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ args: [
  '--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage',
] });
const p = await browser.newPage({ viewport:{width:430,height:670}, deviceScaleFactor:1 });
const rows = [];
try {
  p.on('pageerror', e => console.error('PAGE ERROR',String(e).slice(0,500)));
  for (const [name, motion, az] of camera) {
    const url = BASE + '/#/lab?champion=mma-amara&d=mma&tenue=mma&light=app&az=' + az + '&' + motion;
    await p.goto('about:blank');
    await p.goto(url, { waitUntil:'domcontentloaded', timeout:60000 });
    await p.waitForFunction(() => window.__labReady === true && window.__labOutfit === 'portee',
      null, {timeout:120000});
    await p.waitForTimeout(800);
    const stretch = await p.evaluate(() => {
      const all = window.__labStretch ? window.__labStretch(3, 0.04) : [];
      const shorts = all.filter(x => x.mesh.includes('short-vale-tudo'));
      return {all:all.length, short:shorts.length, sample:shorts.slice(0,5)};
    });
    const file = OUT + '/' + name + '.jpg';
    await p.screenshot({path:file,type:'jpeg',quality:88});
    rows.push({name,file,stretch});
    console.log('CAPTURE',name,JSON.stringify({all:stretch.all,short:stretch.short}));
  }
  const imgs=rows.slice(0,4).map(x=>x.file);
  execFileSync('ffmpeg',['-y','-loglevel','error',...imgs.flatMap(x=>['-i',x]),
    '-filter_complex','hstack=inputs=4','-q:v','3',OUT+'/planche-4-poses.jpg'],{stdio:'inherit'});
  await writeFile(OUT+'/diagnostic.json',JSON.stringify({
    branch:'prototype/amara-mma-compression-reference',
    status:'EXPERIMENTAL — NOT VALIDATED',
    note:'Original underwear is still present in source photo.glb. No production release approved.',
    poses:rows},null,2)+'\n');
}finally{await browser.close();}
