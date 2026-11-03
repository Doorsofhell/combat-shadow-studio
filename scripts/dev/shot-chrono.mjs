import { chromium } from '@playwright/test';
// v0.47: the chronometer in the training screen (preparation, round, rest, summary) and the Cardio options of the
// exercise sheet, light and dark, small phone (vite preview, PORT env, default 4174).
// node scripts/dev/shot-chrono.mjs OUT
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
  // the exercise sheet in Cardio: intervals, intensity, chronometer options
  await p.goto(BASE + '/#/discipline/boxe?niveau=debutant&ex=boxe-debutant-08');
  await p.getByTestId('mode-cardio').click();
  await p.waitForTimeout(600);
  await p.getByTestId('cardio-options').scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${OUT}/${tag}-cardio-options.png` });
  await p.getByTestId('chrono-options').scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${OUT}/${tag}-chrono-options.png` });
  await p.goto('about:blank');
  // a short Rounds session: preparation, round, rest, summary
  await p.goto(BASE + '/#/entrainement?ex=boxe-debutant-08&mode=rounds&round=8&rest=6&rounds=2');
  await p.waitForTimeout(2500);
  await p.getByTestId('start').click();
  const phase = p.getByTestId('phase');
  await phase.filter({ hasText: 'Prépare-toi' }).waitFor();
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${OUT}/${tag}-1-preparation.png` });
  await phase.filter({ hasText: 'Round 1/2' }).waitFor({ timeout: 10000 });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${OUT}/${tag}-2-round.png` });
  await phase.filter({ hasText: 'Repos' }).waitFor({ timeout: 15000 });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/${tag}-3-repos.png` });
  await phase.filter({ hasText: 'Terminé' }).waitFor({ timeout: 30000 });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/${tag}-4-bilan.png` });
  console.log('ok', scheme);
  await p.close();
}
await b.close();
