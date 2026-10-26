// After `vite build`: (1) prerender the static English shell into dist/index.html so the first paint is
// real content (LCP); (2) add the canonical link and Open Graph / Twitter tags from PUBLIC_URL (src/config.ts);
// (3) fill the CSP in dist/_headers with the hash of each inline script; (4) write the cache-first service worker.
import { createServer } from 'vite';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { writeServiceWorker } from './sw.mjs';
import { PUBLIC_URL } from '../src/config.ts';
import en from '../src/i18n/en.ts';
import hi from '../src/i18n/hi.ts';
import pa from '../src/i18n/pa.ts';

const OUT = 'dist';

// 1. prerender (with the build stamp `vite build` just wrote: vite.config.ts)
process.env.SABOOT_PRERENDER = '1';
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
let out;
try {
  const { renderShell } = await vite.ssrLoadModule('/src/ssr.tsx');
  const shell = renderShell();
  const p = join(OUT, 'index.html');
  const html = readFileSync(p, 'utf8');
  if (!html.includes('<!--ssr-->')) throw new Error('dist/index.html has no <!--ssr--> placeholder');
  out = html.replace('<!--ssr-->', shell);
  // Paint first, then boot: the entry module is fetched at once (modulepreload) but evaluated only once the first
  // contentful paint is on screen. When the scripts are already at hand (a repeat visit served by the service worker)
  // they would otherwise run before that paint and hold the prerendered page back. A saved Hindi/Punjabi choice hides
  // the page until the app has loaded that language, so it boots at once; a hidden tab too; and never later than 1 s.
  const entry = /<script type="module" crossorigin src="(\.\/assets\/index-[^"]+\.js)"><\/script>/.exec(out);
  if (!entry) throw new Error('dist/index.html: entry <script type="module"> not found');
  // Nothing the app needs is requested before that paint either: the entry's static imports, the scenario data and a
  // deep link's chunk (self.__dl, scripts/vite-plugins.mjs) are preloaded together, in parallel, the moment go() runs.
  // (A request that starts before the first paint is counted into Lighthouse's simulated LCP.)
  const deps = [...out.matchAll(/<link rel="modulepreload" crossorigin href="([^"]+)">/g)].map((m) => m[1]);
  out = out.replace(/<link rel="modulepreload" crossorigin href="[^"]+">/g, '');
  if (!/<link rel="preload" href="data\/flood-replay\.json"[^>]*>/.test(out)) throw new Error('dist/index.html: the scenario preload is missing');
  out = out.replace(/<link rel="preload" href="data\/flood-replay\.json"[^>]*>/, '');
  // The page must never be left on "Loading the flood replay…" with no way out. A failed download of the entry script reloads
  // the page once by itself (a failed import() is remembered by the browser for the life of the page, so a reload is the retry);
  // if that fails too, or nothing has started after 25 s, the placeholder says so in the visitor's language, with a Reload
  // button and the browser's own error text (so a phone with no developer tools can still show what went wrong). The words
  // come from the dictionaries (boot.*). main.tsx sets data-booted once the app is running, and the watch stands down.
  const BOOT = Object.fromEntries([['en', en], ['hi', hi], ['pa', pa]].map(([l, dict]) => [l, ['boot.slow', 'boot.failed', 'boot.reload'].map((k) => String(dict[k]))]));
  const boot = `const P=${JSON.stringify([entry[1], ...deps])},M=${JSON.stringify(BOOT)},H=document.documentElement;let d=0,e="";` +
    `addEventListener("error",(x)=>{e=e||String(x.message||"error")});addEventListener("unhandledrejection",(x)=>{e=e||String((x.reason&&x.reason.message)||x.reason||"rejected")});` +
    `const show=(k)=>{const h=document.querySelector(".sim-ph");if(!h||H.dataset.booted)return;const m=M[H.classList.contains("l-hi")?"hi":H.classList.contains("l-pa")?"pa":"en"],p=document.createElement("p"),b=document.createElement("button");p.textContent=m[k];b.type="button";b.className="pill pill-primary";b.textContent=m[2];b.onclick=()=>location.reload();h.textContent="";h.append(p,b);if(k&&e){const s=document.createElement("small");s.textContent=e.slice(0,140);h.append(s)}};` +
    `const add=(h,a)=>{const e=document.createElement("link");e.rel=a?"preload":"modulepreload";if(a)e.as=a;e.href=h;e.crossOrigin="";document.head.appendChild(e)};` +
    `const go=()=>{if(!d){d=1;add("data/flood-replay.json","fetch");P.concat(self.__dl||[]).forEach((h)=>add(h));import("${entry[1]}").catch((x)=>{e=e||String((x&&x.message)||x);try{if(!sessionStorage.getItem("saboot.bootRetry")){sessionStorage.setItem("saboot.bootRetry","1");return location.reload()}}catch(_){}show(1)})}};` +
    `if(document.visibilityState==="hidden"||H.classList.contains("lang-pending")||!(self.PerformanceObserver&&(PerformanceObserver.supportedEntryTypes||[]).includes("paint")))go();` +
    `else{new PerformanceObserver((l,o)=>{if(l.getEntries().some((e)=>e.name==="first-contentful-paint")){o.disconnect();setTimeout(go,0)}}).observe({type:"paint",buffered:true});setTimeout(go,1000)}` +
    `setTimeout(()=>show(0),25000);`;
  out = out
    .replace(entry[0], '')
    .replace('</body>', `<script type="module">${boot}</script></body>`);
  // Lazy chunks list the entry's CSS among their preload dependencies, but inlineCss moved it into index.html and
  // dropped the file. Point those entries at the entry chunk instead: already loaded, so the preload helper skips it.
  const entryJs = entry[1].replace('./assets/', './');
  for (const f of readdirSync(join(OUT, 'assets')).filter((n) => n.endsWith('.js'))) {
    const fp = join(OUT, 'assets', f);
    const code = readFileSync(fp, 'utf8');
    const fixed = code.replace(/"\.\/(index-[\w-]+\.css)"/g, (m, name) => (existsSync(join(OUT, 'assets', name)) ? m : JSON.stringify(entryJs)));
    if (fixed !== code) writeFileSync(fp, fixed);
  }
  console.log(`prerendered shell: ${(shell.length / 1024).toFixed(1)} KB of HTML; the entry boots after the first paint`);
} finally {
  await vite.close();
}

// 2. canonical + social tags, all from PUBLIC_URL. Title and description stay single-sourced from index.html.
const base = PUBLIC_URL.replace(/\/+$/, '') + '/';
const title = /<title>(.*?)<\/title>/.exec(out)?.[1];
const desc = /<meta name="description" content="([^"]*)"/.exec(out)?.[1];
if (!title || !desc) throw new Error('dist/index.html: <title> or meta description not found');
if (!existsSync(join(OUT, 'og.jpg'))) console.warn('⚠ public/og.jpg is missing: run `npm run og` (the social preview image)');
const social = [
  `<link rel="canonical" href="${base}">`,
  `<meta property="og:type" content="website">`,
  `<meta property="og:url" content="${base}">`,
  `<meta property="og:title" content="${title}">`,
  `<meta property="og:description" content="${desc}">`,
  `<meta property="og:image" content="${base}og.jpg">`,
  `<meta property="og:image:width" content="1200">`,
  `<meta property="og:image:height" content="630">`,
  `<meta property="og:image:alt" content="Saboot: the clock starts at the storm. A clock counting up from the storm, on parchment, marked SIMULATION.">`,
  `<meta name="twitter:card" content="summary_large_image">`,
].join('');
out = out.replace(/(<meta name="description"[^>]*>)/, `$1${social}`);
writeFileSync(join(OUT, 'index.html'), out);
if (/\.invalid(\/|$)/.test(PUBLIC_URL)) console.warn(`⚠ PUBLIC_URL is the placeholder (${PUBLIC_URL}): canonical and social tags point nowhere until src/config.ts is set`);
else console.log(`canonical + social tags: ${base}`);

// 3. CSP: hash every inline script in the final HTML (no 'unsafe-inline' for scripts).
const hashes = [...out.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .filter((m) => !/\ssrc=/.test(m[1] ?? ''))
  .map((m) => `'sha256-${createHash('sha256').update(m[2]).digest('base64')}'`);
const hp = join(OUT, '_headers');
const headers = readFileSync(hp, 'utf8');
if (!headers.includes('__SCRIPT_HASHES__')) throw new Error('dist/_headers has no __SCRIPT_HASHES__ token');
const filled = headers.replace(/__SCRIPT_HASHES__/g, hashes.join(' '));
const csp = filled.split('\n').find((l) => /^\s*Content-Security-Policy:/.test(l)) ?? '';
if (!/script-src 'self' 'sha256-/.test(csp)) throw new Error('dist/_headers: the CSP script-src did not receive the inline-script hashes');
writeFileSync(hp, filled);
console.log(`_headers: CSP with ${hashes.length} inline-script hash(es)`);

// 4. service worker
const sw = writeServiceWorker(OUT);
console.log(`sw.js: ${sw.count} files precached (version ${sw.version})`);
