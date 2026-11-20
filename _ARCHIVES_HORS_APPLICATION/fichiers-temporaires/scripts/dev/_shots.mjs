import { chromium } from 'playwright';
const [out, theme, ...paths] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 412, height: 915 } });
const B = 'http://localhost:4192';
await p.goto(B + '/');
await p.evaluate(async (THEME) => { const put=(k,v)=>new Promise(res=>{const r=indexedDB.open('keyval-store');r.onupgradeneeded=()=>r.result.createObjectStore('keyval');r.onsuccess=()=>{const tx=r.result.transaction('keyval','readwrite');tx.objectStore('keyval').put(JSON.stringify(v),k);tx.oncomplete=()=>res();};});
 if (THEME) await put('css-settings',{state:{settings:{theme:THEME}},version:2});
 await put('u:local:css-profile',{state:{profile:{completed:true,coach:'femme',mainDiscipline:'boxe',disciplines:['boxe','muaythai'],name:'Youssef',level:'debutant',favorites:['jab','teep-avant']}},version:0}); }, theme === 'sombre' ? null : theme);
for (const path of paths) {
  await p.goto('about:blank'); await p.goto(B + '/#' + path); await p.waitForTimeout(2500);
  await p.screenshot({ path: `${out}/${theme}-${path.replace(/[^a-z0-9]+/gi, '_') || 'home'}.png` });
}
await b.close();
