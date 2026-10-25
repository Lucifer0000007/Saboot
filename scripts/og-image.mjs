// Render the social preview image public/og.jpg (1200 × 630) from an HTML card in headless Chrome, with the
// site's own fonts and copy (src/i18n/en.ts). Re-run after changing the hero copy: npm run og
import { chromium } from '@playwright/test';
import { copyFileSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { serve } from './snap.mjs';
import en from '../src/i18n/en.ts';
import { EVENT, TRACK } from '../src/config.ts';

const DIR = '.cache/og';
// the light theme's colours, read from src/styles/tokens.css so the card cannot drift from the site
const css = readFileSync('src/styles/tokens.css', 'utf8');
const root = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));
const T = Object.fromEntries([...root.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));
mkdirSync(`${DIR}/fonts`, { recursive: true });
for (const f of ['display-latin', 'sans-latin']) copyFileSync(`public/fonts/${f}.woff2`, `${DIR}/fonts/${f}.woff2`);

// the lac seal of src/ui/Seal.tsx, drawn the same way: an 18-lobed rim, two rings and a lock
const pt = (a, r) => `${(60 + r * Math.cos(a)).toFixed(2)} ${(60 + r * Math.sin(a)).toFixed(2)}`;
let rim = `M${pt(0, 50)}`;
for (let i = 0; i < 18; i++) { const a0 = (i / 18) * 2 * Math.PI, a1 = ((i + 1) / 18) * 2 * Math.PI; rim += `Q${pt((a0 + a1) / 2, 57)} ${pt(a1, 50)}`; }
const seal = `<svg width="150" height="150" viewBox="-8 -8 136 136"><path d="${rim}Z" fill="${T['lac']}"/><circle cx="60" cy="60" r="38" fill="none" stroke="${T['lac-hi']}" stroke-width="2.5"/><circle cx="60" cy="60" r="31" fill="none" stroke="${T['lac-hi']}" stroke-width="1.25"/><path d="M50 57v-7a10 10 0 0 1 20 0v7M46 57h28v20H46zM60 64v6" fill="none" stroke="${T['paper']}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
writeFileSync(`${DIR}/index.html`, `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
@font-face{font-family:D;src:url(fonts/display-latin.woff2) format('woff2');font-weight:600}
@font-face{font-family:N;src:url(fonts/sans-latin.woff2) format('woff2');font-weight:400 700}
html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{background:${T['silt']};color:${T['kali']};font-family:N,sans-serif;position:relative}
.ann{position:absolute;left:0;right:0;top:0;height:44px;display:flex;align-items:center;padding:0 72px;font-size:17px;font-weight:700;
  background:${T['haldi']} repeating-linear-gradient(135deg,rgba(30,28,23,.12) 0 1.5px,transparent 1.5px 8px);border-bottom:1px solid ${T['kali']}}
.top{position:absolute;left:72px;right:72px;top:84px;display:flex;align-items:center;gap:12px;font-family:D;font-weight:600;font-size:40px}
.top i{width:26px;height:26px;border-radius:50%;border:2.5px solid ${T['khet']};display:grid;place-items:center}
.top i b{width:10px;height:10px;border-radius:50%;background:${T['khet']}}
.main{position:absolute;left:72px;top:170px;width:600px}
.eyebrow{font-size:20px;font-weight:600;color:${T['khet']};margin:0 0 16px}
h1{font-family:D;font-weight:600;font-size:92px;line-height:1.0;margin:0 0 26px}
.sub{font-size:22px;line-height:1.5;color:${T['kali-2']};margin:0;max-width:560px}
.card{position:absolute;right:72px;top:176px;width:420px;padding:32px;background:${T['paper']};border:2px solid ${T['kali']};border-radius:12px;display:flex;flex-direction:column;gap:18px}
.row{display:flex;align-items:center;gap:18px}
.clock{font-family:D;font-weight:600;font-size:78px;font-variant-numeric:tabular-nums;line-height:1}
.cap{font-size:17px;color:${T['kali-2']};line-height:1.45;border-top:1px dashed ${T['rule-strong']};padding-top:14px}
.foot{position:absolute;left:72px;right:72px;bottom:44px;display:flex;justify-content:space-between;font-size:17px;color:${T['kali-2']}}
</style></head><body><div class="ann">${esc(en['ann.text'])}</div>
<div class="top"><i><b></b></i>saboot</div>
<div class="main"><p class="eyebrow">${esc(en['hero.eyebrow'])}</p><h1>${esc(en['hero.h'])}</h1><p class="sub">${esc(en['hero.l2'])}</p></div>
<div class="card"><div class="row">${seal}<div class="clock">00:41:07</div></div><div class="cap">${esc(en['hero.clockCap'])}</div></div>
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
