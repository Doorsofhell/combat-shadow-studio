import { chromium } from '@playwright/test';
// v0.45.1: the bottom bar on Premium (Avantages open), Entraîner, Techniques and Progrès, light and dark (vite preview :4174).
// node scripts/dev/shot-bars.mjs OUT
const OUT = process.argv[2];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const scheme of ['light', 'dark']) {
  const p = await b.newPage({ viewport: { width: 360, height: 740 }, colorScheme: scheme });
  await p.goto('http://localhost:4174/');
  await p.waitForLoadState('networkidle');
  await p.evaluate(async () => {
    // the profile of tests/e2e/nav-helpers.ts seedProfile (DEFAULT_PROFILE, completed)
    const put = (k, v) => new Promise((res) => { const r = indexedDB.open('keyval-store'); r.onupgradeneeded = () => r.result.createObjectStore('keyval'); r.onsuccess = () => { const tx = r.result.transaction('keyval', 'readwrite'); tx.objectStore('keyval').put(JSON.stringify(v), k); tx.oncomplete = () => res(); }; });
    await put('u:local:css-profile', { state: { profile: { pseudo: '', avatar: 'fighter', language: 'fr', display: { textSize: 'normal', reduceMotion: false }, experience: 'aucune', disciplines: ['boxe'], levels: { boxe: 'debutant', kickboxing: 'debutant', mma: 'debutant', muaythai: 'debutant', bjj: 'debutant', judo: 'debutant' }, goals: [], daysPerWeek: 3, sessionMinutes: 30, difficulty: 'progressive', guard: 'orthodoxe', limitations: '', mainDiscipline: 'boxe', coach: 'femme', coachAi: { usePseudo: true }, completed: true } }, version: 0 });
  });
  await p.goto('about:blank');
  for (const [name, path, click] of [['premium', '/#/premium', 'nav-benefits'], ['entrainer', '/#/entrainer', null], ['techniques', '/#/techniques', null], ['progres', '/#/stats', null]]) {
    await p.goto('http://localhost:4174' + path);
    await p.waitForTimeout(1500);
    if (click) { await p.getByTestId(click).click(); await p.waitForTimeout(600); }
    await p.getByTestId('bottom-bar').screenshot({ path: `${OUT}/${scheme === 'light' ? 'clair' : 'sombre'}-${name}.png` });
    console.log('ok', scheme, name);
  }
  await p.close();
}
await b.close();
