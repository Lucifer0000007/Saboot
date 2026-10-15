// README screenshot (docs/screenshot.jpg): the built landing page at 1280 × 800 in headless Chrome. Run after a build:
//   npm run build && node scripts/screenshot.mjs
import { chromium } from '@playwright/test';
import { statSync } from 'node:fs';
import { serve } from './snap.mjs';

const port = 4397;
const srv = await serve('dist', port);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await page.evaluate('window.__sab.ready()');
  await page.evaluate('document.fonts.ready');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'docs/screenshot.jpg', type: 'jpeg', quality: 80 });
} finally {
  await browser.close();
  srv.close();
}
console.log(`docs/screenshot.jpg: ${(statSync('docs/screenshot.jpg').size / 1024).toFixed(1)} KB (1280×800)`);
