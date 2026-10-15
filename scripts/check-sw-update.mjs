// Proves the service-worker update path: a browser that cached build v1 gets build v2 after a deploy, and the old
// cache is deleted. Serves a copy of dist/ as v1, lets Chrome install the worker, swaps in v2 (a visible change +
// regenerated sw.js) at the same origin, reloads, and checks the title and the cache names.
//   npm run build && npm run sw:update-check
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { serve } from './snap.mjs';
import { writeServiceWorker } from './sw.mjs';

const LIVE = '.cache/sw-live';
const V2 = '.cache/sw-v2';
const port = 4398;
const MARK = ' · v2-update-check';
if (!existsSync('dist/sw.js')) { console.error('dist/ is missing: run npm run build first'); process.exit(1); }

const swap = (src) => { rmSync(LIVE, { recursive: true, force: true }); mkdirSync(LIVE, { recursive: true }); cpSync(src, LIVE, { recursive: true }); };
swap('dist');
// v2: the same build with a visible change, re-stamped like a real deploy
rmSync(V2, { recursive: true, force: true });
cpSync('dist', V2, { recursive: true });
writeFileSync(`${V2}/index.html`, readFileSync(`${V2}/index.html`, 'utf8').replace('</title>', `${MARK}</title>`));
const v2 = writeServiceWorker(V2);
const v1 = /saboot-([0-9a-f]+)/.exec(readFileSync('dist/sw.js', 'utf8'))[1];
if (v1 === v2.version) throw new Error('v2 produced the same cache name as v1');

const srv = await serve(LIVE, port);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
let ok = false;
try {
  const page = await browser.newPage();
  const url = `http://localhost:${port}/`;
  const keys = () => page.evaluate(() => caches.keys());
  const activeV = () => page.evaluate(async () => (await navigator.serviceWorker.ready).active?.scriptURL ?? null);
  await page.goto(url);
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await activeV();
  await page.waitForFunction(() => caches.keys().then((k) => k.length === 1), null, { timeout: 20_000 });
  const k1 = await keys();
  console.log(`v1 installed: cache ${k1.join(', ')}; title "${await page.title()}"`);
  if (k1[0] !== `saboot-${v1}`) throw new Error(`unexpected v1 cache ${k1}`);
  await page.goto('about:blank');

  swap(V2);
  console.log(`deployed v2 (cache saboot-${v2.version})`);
  // The first load after a deploy is still served from the old cache, but the app asks for an update check on every
  // load (src/main.tsx): the new worker installs, skipWaiting()s and claims, so the SECOND load must be v2.
  await page.goto(url);
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  const t1 = await page.title();
  // The update check runs from this page (src/main.tsx); the new worker precaches (a couple of seconds), skips
  // waiting, activates and deletes the old cache. Watch the registration until only the v2 cache is left.
  const snap = () => page.evaluate(async () => {
    const r = await navigator.serviceWorker.getRegistration();
    return { installing: r?.installing?.state ?? '-', waiting: r?.waiting?.state ?? '-', active: r?.active?.state ?? '-', keys: await caches.keys() };
  });
  let st = await snap();
  for (let ms = 0; ms < 20_000 && !(st.keys.length === 1 && st.keys[0] === `saboot-${v2.version}` && st.active === 'activated' && st.installing === '-'); ms += 250) {
    await page.waitForTimeout(250);
    const next = await snap();
    if (JSON.stringify(next) !== JSON.stringify(st)) console.log(`   t+${ms + 250} ms: ${JSON.stringify(next)}`);
    st = next;
  }
  console.log(`load 1 after deploy: title "${t1}" (old shell, as expected); worker now ${JSON.stringify(st)}`);
  await page.goto(url);
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  const title = await page.title();
  console.log(`load 2 after deploy: title "${title}"; caches ${(await keys()).join(', ')}`);
  if (!title.includes(MARK)) throw new Error('the second load after the deploy did not serve v2');
  await page.waitForFunction((v) => caches.keys().then((k) => k.length === 1 && k[0] === `saboot-${v}`), v2.version, { timeout: 20_000 });
  console.log(`✓ v2 served, old cache deleted, only saboot-${v2.version} remains`);
  // and v2 still works offline
  const ctx = page.context();
  await ctx.setOffline(true);
  await page.goto(url);
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  if (!(await page.title()).includes(MARK)) throw new Error('offline reload did not serve v2');
  console.log('✓ v2 opens with the network off');
  ok = true;
} finally {
  await browser.close();
  srv.close();
  rmSync(LIVE, { recursive: true, force: true });
  rmSync(V2, { recursive: true, force: true });
}
process.exit(ok ? 0 : 1);
