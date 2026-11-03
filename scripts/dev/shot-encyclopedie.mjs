import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
// v0.46 Encyclopédie: the views of the mockup in the app (vite preview, PORT, default 4175), light and dark 412 × 915,
// light 360 × 640. node scripts/dev/shot-encyclopedie.mjs OUT
const [OUT = 'docs/v046-encyclopedie/captures'] = process.argv.slice(2);
const base = `http://localhost:${process.env.PORT ?? 4175}`;
mkdirSync(OUT, { recursive: true });
const PROFILE = { pseudo: '', avatar: 'fighter', language: 'fr', display: { textSize: 'normal', reduceMotion: false }, experience: 'aucune', disciplines: ['boxe'], levels: { boxe: 'debutant', kickboxing: 'debutant', mma: 'debutant', muaythai: 'debutant', bjj: 'debutant', judo: 'debutant' }, goals: [], daysPerWeek: 3, sessionMinutes: 30, difficulty: 'progressive', guard: 'orthodoxe', limitations: '', mainDiscipline: 'boxe', coach: 'femme', coachAi: { usePseudo: true }, completed: true };
const VIEWS = [
  ['01-menu', '/#/', async (p) => { await p.locator('[data-testid="bottom-bar"] [data-action="menu"]').click(); await p.waitForTimeout(500); }],
  ['02-accueil', '/#/encyclopedie'],
  ['03-liste-techniques', '/#/encyclopedie/liste?f=techniques'],
  ['04-fiche-jab', '/#/encyclopedie/terme/jab'],
  ['05-fiche-gants', '/#/encyclopedie/terme/gants-boxe'],
  ['06-fiche-cage', '/#/encyclopedie/terme/cage'],
  ['07-az', '/#/encyclopedie/az?l=S'],
  ['08-favoris', '/#/encyclopedie/favoris'],
  ['09-regles', '/#/encyclopedie/liste?f=regles'],
  ['10-securite', '/#/encyclopedie/liste?f=securite'],
  ['11-fiche-sources', '/#/encyclopedie/terme/teep', async (p) => { await p.getByTestId('enc-tab-src').click(); await p.waitForTimeout(300); }],
  ['12-recherche', '/#/encyclopedie', async (p) => { await p.getByTestId('enc-search').fill('southpaw'); await p.waitForTimeout(300); }],
];
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const [scheme, w, h] of [['light', 412, 915], ['dark', 412, 915], ['light', 360, 640]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, colorScheme: scheme, deviceScaleFactor: 1 });
  await p.goto(base + '/');
  await p.waitForLoadState('networkidle');
  await p.evaluate(async ({ profile }) => {
    const put = (k, v) => new Promise((res) => { const r = indexedDB.open('keyval-store'); r.onupgradeneeded = () => r.result.createObjectStore('keyval'); r.onsuccess = () => { const tx = r.result.transaction('keyval', 'readwrite'); tx.objectStore('keyval').put(JSON.stringify(v), k); tx.oncomplete = () => res(); }; });
    await put('u:local:css-profile', { state: { profile }, version: 0 });
  }, { profile: PROFILE });
  await p.goto('about:blank');
  // three favourites, set the way a person does
  for (const id of ['jab', 'tatami', 'ippon']) {
    await p.goto(`${base}/#/encyclopedie/terme/${id}`);
    await p.getByTestId('enc-fav').click();
    await p.waitForTimeout(300);
  }
  for (const [name, path, act] of VIEWS) {
    await p.goto('about:blank');
    await p.goto(base + path);
    await p.waitForTimeout(1200);
    if (act) await act(p);
    // lazy pictures below the fold never load: wait for the others, at most 4 s
    await p.evaluate(() => Promise.race([Promise.all([...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r; }))), new Promise((r) => setTimeout(r, 4000))]));
    await p.screenshot({ path: `${OUT}/${name}-${scheme === 'light' ? 'clair' : 'sombre'}-${w}x${h}.png` });
    console.log('ok', name, scheme, w);
  }
  await p.close();
}
await b.close();
