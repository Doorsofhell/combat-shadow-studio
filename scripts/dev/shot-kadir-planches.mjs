// node shots.mjs base outdir prefix  — views like the planches
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const [base, out, prefix, champ='mma-kadir'] = process.argv.slice(2);
await mkdir(out, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 420, height: 720 }, deviceScaleFactor: 1 });
p.on('pageerror', e => console.error('ERR', String(e).slice(0,300)));
const V = (process.env.VIEWS || 'corps').split(',');
const sets = {
  corps: [0,35,90,180,270,325].map(az => ({ n:`corps-az${az}`, q:`tenue=0&rest=1&az=${az}&el=4` })),
  tenue: [0,90,180,325].map(az => ({ n:`tenue-az${az}`, q:`d=mma&tenue=mma&rest=1&az=${az}&el=4` })),
  tete:  [0,40,90,180,270].map(az => ({ n:`tete-az${az}`, q:`tenue=0&rest=1&az=${az}&el=6&span=0.16&fy=${process.env.FY||'1.66'}` })),
  dessus:[{ n:'tete-dessus', q:'tenue=0&rest=1&az=0&el=60&span=0.16&fy=1.70' }],
  garde: [20,200].map(az => ({ n:`garde-az${az}`, q:`d=mma&motion=garde&az=${az}&el=8&light=app` })),
  oreille: [80,270].map(az => ({ n:`oreille-az${az}`, q:`tenue=0&rest=1&az=${az}&el=4&span=0.09&fy=${process.env.FY||'1.66'}` })),
  expr: [['neutre',''],['clin','&blink=1'],['bouche','&expr=JawOpen:1'],['sourire','&expr=MouthSmileLeft:1,MouthSmileRight:1'],['effort','&effort=1']].map(([n,e]) => ({ n:`expr-${n}`, q:`tenue=0&rest=1&az=15&el=4&span=0.16&fy=${process.env.FY||'1.66'}${e}` })),
  lutte: [0,45,90,135,315].map(az => ({ n:`lutte-az${az}`, q:`d=mma&tenue=0&motion=${process.env.MOTION||'defense-lutte'}&t=${process.env.T||'0.27'}&az=${az}&el=15&light=app` })),
  visage: (process.env.VAZ||"10,45,300").split(",").map(Number).map(az => ({ n:`visage-az${az}`, q:`d=mma&motion=garde&az=${az}&el=6&light=app&span=0.2&fy=1.50` })),
};
for (const v of V) for (const s of sets[v]) {
  await p.goto('about:blank');
  await p.goto(`${base}/#/lab?champion=${champ}&${s.q}`, { waitUntil:'domcontentloaded', timeout:60000 });
  await p.waitForFunction(() => window.__labReady === true, null, { timeout: 180000 });
  await p.waitForTimeout(1500);
  // a frame can come out blank (white) while the model is still uploading under CPU load: retake it
  for (let k = 0; k < 6; k++) {
    const buf = await p.screenshot({ path: `${out}/${prefix}-${s.n}.jpg`, type:'jpeg', quality: 88 });
    if (buf.length > 6000) break;
    await p.waitForTimeout(2500);
  }
  console.log('ok', s.n);
}
await b.close();
