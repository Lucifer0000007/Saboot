// Render the social preview image public/og.jpg (1200 × 630) from an HTML card in headless Chrome, with the
// site's own fonts and copy (src/i18n/en.ts). Re-run after changing the hero copy: npm run og
import { chromium } from '@playwright/test';
import { copyFileSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { serve } from './snap.mjs';
import en from '../src/i18n/en.ts';
import { EVENT, TRACK } from '../src/config.ts';

const DIR = '.cache/og';
mkdirSync(`${DIR}/fonts`, { recursive: true });
for (const f of ['serif-latin', 'mono-latin']) copyFileSync(`public/fonts/${f}.woff2`, `${DIR}/fonts/${f}.woff2`);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
writeFileSync(`${DIR}/index.html`, `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
@font-face{font-family:S;src:url(fonts/serif-latin.woff2) format('woff2');font-weight:400}
@font-face{font-family:M;src:url(fonts/mono-latin.woff2) format('woff2');font-weight:400 500}
html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{background:#f6f3f1;color:#242424;font-family:M,monospace;position:relative}
.wash{position:absolute;inset:0;background:
  radial-gradient(60% 70% at 88% 30%, rgba(255,148,115,.55), rgba(160,181,235,.35) 55%, rgba(246,243,241,0) 78%),
  radial-gradient(45% 55% at 92% 85%, rgba(167,252,205,.55), rgba(160,181,235,0) 70%)}
.top{position:absolute;left:72px;right:72px;top:56px;display:flex;justify-content:space-between;align-items:center}
.brand{display:flex;align-items:center;gap:12px;font-size:28px;letter-spacing:-.03em}
.brand i{width:16px;height:16px;border-radius:50%;background:#2b59d1;display:inline-block}
.tag{border:1px solid #242424;border-radius:999px;padding:12px 22px;font-size:16px;text-transform:uppercase;letter-spacing:-.01em;background:rgba(246,243,241,.7)}
.main{position:absolute;left:72px;top:170px;width:640px}
.eyebrow{font-size:18px;text-transform:uppercase;letter-spacing:-.01em;color:#4e4d4d;margin:0 0 20px}
h1{font-family:S,serif;font-weight:400;font-size:84px;line-height:1.02;letter-spacing:-.02em;margin:0 0 28px}
.sub{font-size:21px;line-height:1.5;color:#4e4d4d;margin:0;max-width:560px}
.card{position:absolute;right:72px;top:190px;width:380px;height:300px;border-radius:40px;background:#cfdaf5;border:1px solid rgba(36,36,36,.12);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}
.clock{font-size:70px;font-variant-numeric:tabular-nums;letter-spacing:-.04em;line-height:1}
.cap{font-size:16px;color:#4e4d4d;text-align:center;max-width:300px;line-height:1.45}
.foot{position:absolute;left:72px;right:72px;bottom:52px;display:flex;justify-content:space-between;font-size:16px;color:#4e4d4d}
</style></head><body><div class="wash"></div>
<div class="top"><div class="brand"><i></i>saboot</div><div class="tag">${esc(en['ann.text'])}</div></div>
<div class="main"><p class="eyebrow">${esc(en['hero.eyebrow'])}</p><h1>${esc(en['hero.h'])}</h1><p class="sub">${esc(en['hero.l2'])}</p></div>
<div class="card"><div class="clock">00:41:07</div><div class="cap">${esc(en['hero.clockCap'])}</div></div>
<div class="foot"><span>${esc(EVENT)}</span><span>${esc(TRACK)}</span></div>
</body></html>`);

const port = 4399;
const srv = await serve(DIR, port);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });
  await page.evaluate('document.fonts.ready');
  await page.screenshot({ path: 'public/og.jpg', type: 'jpeg', quality: 82 });
} finally {
  await browser.close();
  srv.close();
}
console.log(`public/og.jpg: ${(statSync('public/og.jpg').size / 1024).toFixed(1)} KB (1200×630)`);
