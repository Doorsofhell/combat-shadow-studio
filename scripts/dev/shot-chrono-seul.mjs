import { chromium } from '@playwright/test';
// v0.48 « Chrono de combat »: the bar, the setup, the full-screen phases (preparation, combat, pause, rest) and the
// summary, light and dark, small phone (vite preview, PORT env, default 4174).
// node scripts/dev/shot-chrono-seul.mjs OUT
const OUT = process.argv[2];
const BASE = `http://localhost:${process.env.PORT ?? 4174}`;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const scheme of ['light', 'dark']) {
  const tag = scheme === 'light' ? 'clair' : 'sombre';
  const p = await b.newPage({ viewport: { width: 360, height: 640 }, colorScheme: scheme });
  await p.goto(BASE + '/');
  await p.waitForLoadState('networkidle');
  await p.evaluate(async () => {
    // the profile of tests/e2e/nav-helpers.ts seedProfile (DEFAULT_PROFILE, completed)
    const put = (k, v) => new Promise((res) => { const r = indexedDB.open('keyval-store'); r.onupgradeneeded = () => r.result.createObjectStore('keyval'); r.onsuccess = () => { const tx = r.result.transaction('keyval', 'readwrite'); tx.objectStore('keyval').put(JSON.stringify(v), k); tx.oncomplete = () => res(); }; });
    await put('u:local:css-profile', { state: { profile: { pseudo: '', avatar: 'fighter', language: 'fr', display: { textSize: 'normal', reduceMotion: false }, experience: 'aucune', disciplines: ['boxe'], levels: { boxe: 'debutant', kickboxing: 'debutant', mma: 'debutant', muaythai: 'debutant', bjj: 'debutant', judo: 'debutant' }, goals: [], daysPerWeek: 3, sessionMinutes: 30, difficulty: 'progressive', guard: 'orthodoxe', limitations: '', mainDiscipline: 'boxe', coach: 'femme', coachAi: { usePseudo: true }, completed: true } }, version: 0 });
  });
  await p.goto('about:blank');
  await p.goto(BASE + '/#/');
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/${tag}-0-accueil-barre.png` });
  await p.locator('[data-action="nav:/chrono"]').click();
  await p.getByTestId('chrono-setup-screen').waitFor();
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}/${tag}-1-reglages.png` });
  // a short session: 10 s rounds, 10 s rest, 2 rounds
  const minusTo = async (id, to) => { for (let i = 0; i < 30 && (await p.getByTestId(`chrono-value-${id}`).textContent()) !== to; i++) await p.getByTestId(`chrono-minus-${id}`).click(); };
  await minusTo('work', '0:10');
  await minusTo('rest', '0:10');
  await minusTo('rounds', '2');
  await p.getByTestId('chrono-start').click();

  await p.waitForTimeout(800);
  await p.screenshot({ path: `${OUT}/${tag}-2-preparation.png` });
  await p.locator('[data-phase="travail"]').waitFor({ timeout: 10000 });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/${tag}-3-combat.png` });
  await p.getByTestId('chrono-tap').click();
  await p.waitForTimeout(600);
  await p.screenshot({ path: `${OUT}/${tag}-4-pause.png` });
  await p.getByTestId('chrono-tap').click();
  await p.locator('[data-phase="repos"]').waitFor({ timeout: 15000 });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/${tag}-5-repos.png` });
  await p.getByTestId('chrono-end').waitFor({ timeout: 30000 });
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${OUT}/${tag}-6-bilan.png` });
  console.log('ok', scheme);
  await p.close();
}
await b.close();
