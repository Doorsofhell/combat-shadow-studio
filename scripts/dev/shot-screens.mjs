import { chromium } from '@playwright/test';
// Reference screenshots of every screen (non-regression), against a served build.
// usage: node scripts/dev/shot-screens.mjs OUT_DIR [BASE_URL] [theme: auto|light|dark]
const OUT = process.argv[2];
const BASE = process.argv[3] ?? 'http://localhost:4173';
const SCHEME = process.argv[4] ?? 'dark';
const SIZES = [
  ['p360', 360, 740],
  ['p412', 412, 915],
  ['l800', 800, 400],
];
const SCREENS = [
  ['accueil', '/#/'],
  ['entrainer', '/#/entrainer'],
  ['discipline', '/#/discipline/boxe'],
  ['techniques', '/#/techniques'],
  ['technique', '/#/techniques/jab'],
  ['champions', '/#/champions'],
  ['createur-enchainement', '/#/createur'],
  ['programmes', '/#/programmes'],
  ['coach-editeur', '/#/combattant'],
  ['progres', '/#/stats'],
  ['historique', '/#/historique'],
  ['reglages', '/#/reglages'],
  ['profil', '/#/profil'],
  ['confidentialite', '/#/confidentialite'],
  ['coach-ia', '/#/coach-ia'],
  ['connexion', '/#/connexion'],
  ['entrainement', '/#/entrainement?ex=muaythai-expert-02&mode=technique'],
];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const [name, w, h] of SIZES) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: SCHEME === 'light' ? 'light' : 'dark' });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('ERR', name, e.message));
  await p.goto(BASE + '/icons/icon.svg');
  await p.evaluate(async () => {
    const put = (k, val) => new Promise((res) => { const r = indexedDB.open('keyval-store'); r.onupgradeneeded = () => r.result.createObjectStore('keyval'); r.onsuccess = () => { const tx = r.result.transaction('keyval', 'readwrite'); tx.objectStore('keyval').put(JSON.stringify(val), k); tx.oncomplete = () => res(); }; });
    const profile = { experience: 'reguliere', levels: { boxe: 'intermediaire', kickboxing: 'debutant', mma: 'debutant', muaythai: 'avance' }, goals: ['apprentissage-technique'], daysPerWeek: 3, sessionMinutes: 30, guard: 'orthodoxe', limitations: '', mainDiscipline: 'muaythai', coach: 'homme', completed: true, pseudo: 'Youssef' };
    await put('u:local:css-profile', { state: { profile }, version: 0 });
    await put('css-profile', { state: { profile }, version: 0 });
  });
  for (const [s, path] of SCREENS) {
    await p.goto('about:blank');
    await p.goto(BASE + path);
    await p.waitForTimeout(s === 'entrainement' || s === 'coach-editeur' || s === 'accueil' || s === 'technique' ? 5000 : 1500);
    await p.screenshot({ path: `${OUT}/${name}-${s}.png`, fullPage: s !== 'entrainement' });
  }
  await ctx.close();
}
await b.close();
