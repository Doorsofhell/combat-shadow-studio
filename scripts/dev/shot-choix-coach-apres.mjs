// 2.7 option A « Un seul sélecteur » : captures après (Accueil, panneau « Ton coach », Réglages, écran Coach)
import { chromium } from '@playwright/test';
const [OUT, PORT] = process.argv.slice(2);
const base = `http://localhost:${PORT}`;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 2 });
await p.goto(base + '/'); await p.waitForLoadState('networkidle');
await p.evaluate(() => new Promise((res) => { const r = indexedDB.open('keyval-store'); r.onupgradeneeded = () => r.result.createObjectStore('keyval'); r.onsuccess = () => { const tx = r.result.transaction('keyval', 'readwrite'); const st = tx.objectStore('keyval'); st.put(JSON.stringify({ state: { profile: { completed: true, coach: 'homme', champion: 'mma-kadir', mainDiscipline: 'boxe', disciplines: ['boxe'], guard: 'orthodoxe', pseudo: '', level: 'debutant' } }, version: 0 }), 'u:local:css-profile'); tx.oncomplete = res; }; }));
await p.goto('about:blank');
const wait = (ms) => p.waitForTimeout(ms);
await p.goto(base + '/#/'); await wait(10000); await p.screenshot({ path: `${OUT}/apres-1-accueil.png` });
await p.getByTestId('home-change-coach').click(); await wait(1500); await p.screenshot({ path: `${OUT}/apres-2-panneau.png` });
await p.getByTestId('cp-coach-inaya').click(); await wait(9000); await p.screenshot({ path: `${OUT}/apres-3-panneau-inaya.png` });
await p.keyboard.press('Escape'); await wait(600);
await p.goto(base + '/#/reglages/coach'); await wait(3000); await p.screenshot({ path: `${OUT}/apres-4-reglages.png` });
await p.goto(base + '/#/coach'); await wait(12000); await p.screenshot({ path: `${OUT}/apres-5-ecran-coach.png` });
await b.close();
