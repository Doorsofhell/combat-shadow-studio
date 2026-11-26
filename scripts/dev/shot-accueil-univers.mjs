// 2.10.5 : capture de l'Accueil (carte « Ton coach ») pour un coach et un thème donnés — avant/après réels WebGL.
// usage : node scripts/dev/shot-accueil-univers.mjs <sortie.png> <port> <coach> <theme clair|sombre> [largeur] [hauteur]
import { chromium } from '@playwright/test';
const [OUT, PORT, CHAMP = 'nael', THEME = 'clair', W = '393', H = '851'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: 2 });
const errors = [];
p.on('pageerror', (e) => errors.push(String(e)));
await p.goto(`http://localhost:${PORT}/`);
await p.waitForLoadState('networkidle');
const coach = CHAMP.includes('amara') || ['inaya', 'kanya'].includes(CHAMP) ? 'femme' : 'homme';
await p.evaluate(
  async ({ CHAMP, coach, THEME }) => {
    localStorage.setItem('css-theme', THEME);
    await new Promise((res, rej) => {
      const r = indexedDB.open('keyval-store');
      r.onupgradeneeded = () => r.result.createObjectStore('keyval');
      r.onsuccess = () => {
        const tx = r.result.transaction('keyval', 'readwrite');
        tx.objectStore('keyval').put(JSON.stringify({ state: { profile: { completed: true, coach, champion: CHAMP, mainDiscipline: 'muaythai', disciplines: ['muaythai'], pseudo: 'Test' } }, version: 0 }), 'u:local:css-profile');
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
      };
    });
  },
  { CHAMP, coach, THEME },
);
await p.goto("about:blank");
await p.goto(`http://localhost:${PORT}/#/`);
try { await p.waitForSelector("[data-testid=hero-stage] canvas", { timeout: 90000 }); } catch (e) { await p.screenshot({ path: OUT.replace(".png", "-echec.png") }); console.log(await p.evaluate(() => location.href + " " + document.body.innerText.slice(0, 300))); throw e; }
await p.waitForTimeout(25000);
await p.screenshot({ path: OUT });
if (errors.length) console.log('ERREURS', errors.join('\n'));
await b.close();
