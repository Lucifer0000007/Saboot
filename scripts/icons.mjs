// Render the install icons public/icon-192.png and public/icon-512.png from public/icon.svg in headless Chrome. Android
// installs a web app more reliably with PNG icons than with an SVG alone. Run once after changing icon.svg: node scripts/icons.mjs
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

// full bleed: the launcher applies its own mask, so the rounded corners of the favicon are squared off here
const svg = readFileSync('public/icon.svg', 'utf8').replace(/ rx="[\d.]+"/, '');
const browser = await chromium.launch();
try {
  for (const size of [192, 512]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(`<html><body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
    await page.screenshot({ path: `public/icon-${size}.png`, omitBackground: true });
    await page.close();
    console.log(`public/icon-${size}.png`);
  }
} finally {
  await browser.close();
}
