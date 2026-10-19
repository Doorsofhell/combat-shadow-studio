// Renders the icon reference page (tools/icon-lab) to a PNG: node scripts/dev/shot-icons.mjs out.png [width]
import { chromium } from 'playwright';
const [out = 'icons.png', w = '1400'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const p = await b.newPage({ viewport: { width: +w, height: 900 }, deviceScaleFactor: 1 });
await p.goto(`http://localhost:${process.env.PORT ?? 5173}/tools/icon-lab/index.html`);
await p.waitForTimeout(1500);
await p.screenshot({ path: out, fullPage: true });
await b.close();
