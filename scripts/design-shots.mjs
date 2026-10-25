// Design review screenshots: the QA states (tests/qa/harness.ts) at phone, tablet and laptop widths, in each language,
// light and dark. Serves dist/ (build first). Writes JPEGs and an index.html contact sheet.
//   node --import ./scripts/ts-resolve.mjs scripts/design-shots.mjs <outDir> [--states=a,b] [--langs=en,hi,pa]
//     [--vps=360x800,768x1024,1440x900] [--themes=light,dark]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { serve } from './snap.mjs';
import { STATES, open, settle, subjectOnScreen } from '../tests/qa/harness.ts';

const args = process.argv.slice(2);
const out = args.find((a) => !a.startsWith('--')) ?? '.cache/design-shots';
const opt = (k, d) => (args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d).split(',');
const DEFAULT_STATES = 'landing,alert,capture,evidence-packet,filing,objection,helper-queue,dashboard,worklist,draft-list,pilot-metrics,import,ledger-tamper';
const states = opt('states', DEFAULT_STATES).map((id) => {
  const s = STATES.find((x) => x.id === id);
  if (!s) throw new Error(`unknown state ${id}`);
  return s;
});
const langs = opt('langs', 'en,hi,pa');
const themes = opt('themes', 'light,dark');
const vps = opt('vps', '360x800,768x1024,1440x900').map((s) => { const [w, h] = s.split('x').map(Number); return { name: s, width: w, height: h, mobile: w < 600 }; });

const PORT = 4398;
const server = await serve('dist', PORT);
const browser = await chromium.launch({ channel: 'chrome' });
mkdirSync(out, { recursive: true });

const jobs = [];
for (const st of states) for (const v of vps) for (const lang of langs) for (const theme of themes) jobs.push({ st, v, lang, theme });
const rows = [];
let next = 0;
async function worker() {
  while (next < jobs.length) {
    const { st, v, lang, theme } = jobs[next++];
    const ctx = await browser.newContext({ baseURL: `http://localhost:${PORT}`, serviceWorkers: 'block', colorScheme: theme, viewport: { width: v.width, height: v.height }, isMobile: v.mobile, hasTouch: v.mobile });
    const page = await ctx.newPage();
    const errors = [];
    const file = `${st.id}-${v.name}-${lang}-${theme}.jpg`;
    try {
      await open(page, v, lang, errors);
      await st.setup(page, v);
      await settle(page, st.focus);
      errors.push(...(await subjectOnScreen(page, st.focus)));
      await page.screenshot({ path: join(out, file), type: 'jpeg', quality: 72 });
    } catch (e) {
      errors.push(String(e).split('\n')[0]);
    }
    rows.push({ file, state: st.id, vp: v.name, lang, theme, errors });
    process.stdout.write(errors.length ? `\n✗ ${file}: ${errors.join('; ')}\n` : '.');
    await ctx.close();
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);
await browser.close();
server.close();

rows.sort((a, b) => a.file.localeCompare(b.file));
const html = `<!doctype html><meta charset="utf-8"><title>Design shots</title>
<style>body{font:14px system-ui;margin:16px;background:#ddd}figure{display:inline-block;margin:6px;vertical-align:top;background:#fff;padding:6px}
img{max-width:360px;max-height:420px;display:block}figcaption{font-size:12px}.bad{color:#b00}</style>
${rows.map((r) => `<figure><a href="${r.file}"><img loading="lazy" src="${r.file}" alt=""></a><figcaption class="${r.errors.length ? 'bad' : ''}">${r.file}${r.errors.length ? ' — ' + r.errors.join('; ') : ''}</figcaption></figure>`).join('\n')}`;
writeFileSync(join(out, 'index.html'), html);
const bad = rows.filter((r) => r.errors.length).length;
console.log(`\n${rows.length} shots in ${out}, ${bad} with problems`);
