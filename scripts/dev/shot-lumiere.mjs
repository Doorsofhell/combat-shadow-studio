import { chromium } from '@playwright/test';
// v0.49 « Lumière vive » (CME-3D lab) next to the studio light: Kadir in MMA, training screen in guard (Libre) and
// the home screen, light theme, phone size (vite preview, PORT env, default 4174). Software rendering: colours
// match a phone, the frame rate does not.
// node scripts/dev/shot-lumiere.mjs OUT
const OUT = process.argv[2];
const BASE = `http://localhost:${process.env.PORT ?? 4174}`;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const light of ['studio', 'vive']) {
  const p = await b.newPage({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 2, colorScheme: 'light' });
  await p.goto(BASE + '/');
  await p.waitForLoadState('networkidle');
  await p.evaluate(async (light) => {
    const put = (k, v) => new Promise((res) => { const r = indexedDB.open('keyval-store'); r.onupgradeneeded = () => r.result.createObjectStore('keyval'); r.onsuccess = () => { const tx = r.result.transaction('keyval', 'readwrite'); tx.objectStore('keyval').put(JSON.stringify(v), k); tx.oncomplete = () => res(); }; });
    await put('u:local:css-profile', { state: { profile: { pseudo: '', avatar: 'fighter', language: 'fr', display: { textSize: 'normal', reduceMotion: false }, experience: 'aucune', disciplines: ['mma'], levels: { boxe: 'debutant', kickboxing: 'debutant', mma: 'expert', muaythai: 'debutant', bjj: 'debutant', judo: 'debutant' }, goals: [], daysPerWeek: 3, sessionMinutes: 30, difficulty: 'progressive', guard: 'orthodoxe', limitations: '', mainDiscipline: 'mma', coach: 'homme', coachAi: { usePseudo: true }, completed: true } }, version: 0 });
    await put('css-settings', { state: { settings: { coachLight: light, quality: 'haute' } }, version: 2 });
  }, light);
  await p.goto('about:blank');
  await p.goto(BASE + '/#/entrainement?ex=mma-debutant-01&mode=libre');
  await p.waitForTimeout(25000);
  await p.screenshot({ path: `${OUT}/${light}-entrainement.png` });
  await p.goto(BASE + '/#/');
  await p.waitForTimeout(20000);
  await p.screenshot({ path: `${OUT}/${light}-accueil.png` });
  console.log('ok', light);
  await p.close();
}
await b.close();
