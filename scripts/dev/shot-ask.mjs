import { chromium } from '@playwright/test';
// "Demander au coach" on the training screen (dev server on :5173): node scripts/dev/shot-ask.mjs OUT
const OUT = process.argv[2];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const [w, h] of [[360, 640], [740, 360]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.on('pageerror', (e) => console.log('ERR', e.message));
  await p.goto('http://localhost:5173/');
  await p.waitForLoadState('networkidle');
  await p.evaluate(async () => {
    const put = (k, val) => new Promise((res) => { const r = indexedDB.open('keyval-store'); r.onupgradeneeded = () => r.result.createObjectStore('keyval'); r.onsuccess = () => { const tx = r.result.transaction('keyval', 'readwrite'); tx.objectStore('keyval').put(JSON.stringify(val), k); tx.oncomplete = () => res(); }; });
    await put('u:local:css-profile', { state: { profile: { experience: 'aucune', levels: { boxe: 'debutant', kickboxing: 'debutant', mma: 'debutant', muaythai: 'debutant' }, goals: [], daysPerWeek: 3, sessionMinutes: 30, guard: 'orthodoxe', limitations: '', mainDiscipline: 'boxe', coach: 'homme', completed: true, pseudo: 'Youssef' } }, version: 0 });
  });
  await p.goto('about:blank');
  await p.goto('http://localhost:5173/#/entrainement?ex=boxe-debutant-01&mode=technique');
  await p.waitForTimeout(4000);
  await p.screenshot({ path: OUT + '/dbg.png' });
  await p.getByTestId('start').click();
  await p.waitForTimeout(1500);
  await p.getByTestId('ask-coach').click();
  await p.getByTestId('coach-input').fill('Pourquoi dois-je pivoter le pied arrière ?');
  await p.getByTestId('coach-send').click();
  await p.waitForTimeout(800);
  console.log(w, 'phase:', await p.getByTestId('phase').textContent(), 'scrollY:', await p.evaluate(() => document.scrollingElement.scrollHeight - innerHeight));
  await p.screenshot({ path: `${OUT}/${w}x${h}-ask.png` });
  await p.getByTestId('coach-input').fill('Montre-moi le crochet gauche au ralenti');
  await p.getByTestId('coach-send').click();
  await p.waitForTimeout(3000);
  console.log(w, 'after slow:', await p.getByTestId('current-move').textContent(), await p.locator('[data-testid=study-phase]').count());
  await p.screenshot({ path: `${OUT}/${w}x${h}-slow.png` });
  await p.close();
}
await b.close();
