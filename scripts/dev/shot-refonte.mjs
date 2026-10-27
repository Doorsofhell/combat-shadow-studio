import { chromium } from '@playwright/test';
// 1.0.0 refonte ergonomique: the main screens at phone size, Nuit (default) and Jour, MMA as main discipline
// (vite preview, PORT env, default 4174). node scripts/dev/shot-refonte.mjs OUT [lot]
const OUT = process.argv[2];
const BASE = `http://localhost:${process.env.PORT ?? 4174}`;
const SCREENS = [
  ['accueil', '/', 9000],
  ['entrainer', '/entrainer', 3000],
  ['techniques', '/techniques', 3000],
  ['fiche', '/techniques/jab', 9000],
  ['legendes', '/champions', 3000],
  ['progres', '/stats', 3000],
  ['profil', '/profil', 3000],
  ['reglages', '/reglages', 3000],
  ['chrono', '/chrono', 3000],
  ['seance', '/entrainement?ex=mma-debutant-01&mode=libre', 12000],
];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const theme of ['sombre', 'clair']) {
  const p = await b.newPage({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 2, colorScheme: 'light' });
  await p.goto(BASE + '/');
  await p.waitForLoadState('networkidle');
  await p.evaluate(async (theme) => {
    const put = (k, v) => new Promise((res) => { const r = indexedDB.open('keyval-store'); r.onupgradeneeded = () => r.result.createObjectStore('keyval'); r.onsuccess = () => { const tx = r.result.transaction('keyval', 'readwrite'); tx.objectStore('keyval').put(JSON.stringify(v), k); tx.oncomplete = () => res(); }; });
    await put('u:local:css-profile', { state: { profile: { pseudo: 'Youssef', firstName: 'Youssef', avatar: 'fighter', language: 'fr', display: { textSize: 'normal', reduceMotion: false }, experience: 'aucune', disciplines: ['mma'], levels: { boxe: 'debutant', kickboxing: 'debutant', mma: 'expert', muaythai: 'debutant', bjj: 'debutant', judo: 'debutant' }, goals: [], daysPerWeek: 3, sessionMinutes: 30, difficulty: 'progressive', guard: 'orthodoxe', limitations: '', mainDiscipline: 'mma', coach: 'homme', coachAi: { usePseudo: true }, completed: true } }, version: 0 });
    if (theme === 'clair') localStorage.setItem('css-theme', 'clair');
    else localStorage.removeItem('css-theme');
  }, theme);
  await p.goto('about:blank');
  for (const [id, path, wait] of SCREENS) {
    if (theme === 'clair' && !['accueil', 'fiche', 'reglages'].includes(id)) continue;
    await p.goto(BASE + '/#' + path);
    await p.waitForTimeout(wait);
    await p.screenshot({ path: `${OUT}/${theme === 'sombre' ? 'nuit' : 'jour'}-${id}.png` });
    console.log('ok', theme, id);
  }
  await p.close();
}
await b.close();
