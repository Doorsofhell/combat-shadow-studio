import { chromium } from '@playwright/test';
const SP = process.argv[2];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 400, height: 860 }, deviceScaleFactor: 1 });
p.on('pageerror', (e) => console.log('ERR', e.message));
await p.goto('http://localhost:5173/');
await p.getByText('Entraîne-toi seul').waitFor();
for (let i = 0; i < 5; i++) await p.getByTestId('next').click();
await p.getByTestId('coach-homme').click();
await p.getByTestId('next').click();
await p.getByTestId('finish').click();
for (const [ex, name] of [['muaythai-debutant-05', 'mt'], ['boxe-debutant-08', 'bx']]) {
  await p.goto(`http://localhost:5173/#/entrainement?ex=${ex}&mode=technique`);
  await p.waitForTimeout(6000);
  await p.screenshot({ path: `${SP}/tr-${name}.png` });
}
await p.getByTestId('decompose').click();
await p.waitForTimeout(9000);
await p.screenshot({ path: `${SP}/study-1.png` });
await p.getByTestId('study-play').click();
await p.getByTestId('study-next').click();
await p.getByTestId('study-next').click();
await p.waitForTimeout(1500);
await p.screenshot({ path: `${SP}/study-2.png` });
await b.close();
