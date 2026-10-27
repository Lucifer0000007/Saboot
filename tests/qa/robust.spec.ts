// Robustness on real phones and flaky networks (October audit, workstream W2). Each test names the audit finding it
// reproduces (.cache/audit/all.json) and failed before its fix.
import { test, expect, type Page } from '@playwright/test';
import { ALL_VIEWPORTS, open } from './harness';

const V = (name: string) => ALL_VIEWPORTS.find((v) => v.name === name)!;
const PHONE = V('360x640');
const sab = (page: Page, js: string) => page.evaluate(`(async () => { const s = window.__sab; ${js} })()`);
const saved = (page: Page, l: string) => page.addInitScript((x) => { try { localStorage.setItem('saboot.lang', JSON.stringify(x)); } catch { /* ignore */ } }, l);

test('CC-03: two jumps at once add each photo once, and no photo after the seal', async ({ page }) => {
  const errors: string[] = [];
  await open(page, PHONE, 'en', errors);
  await sab(page, `await Promise.all([s.jump('confirm'), s.jump('draft')]);`);
  const demo = (await page.evaluate('window.__sab.logs()["$demo"]')) as { shotShas: string[]; packetHash: string | null; events: number };
  expect(demo.shotShas).toHaveLength(3);
  expect(new Set(demo.shotShas).size).toBe(3);
  expect(demo.packetHash).not.toBeNull();
  expect(demo.events, 'three photos, the seal and the reference').toBe(5);
  expect(errors).toEqual([]);
});

test('CC-07: a seal that cannot be stored says so on screen, and works once storage does', async ({ page }) => {
  const errors: string[] = [];
  await open(page, PHONE, 'en', errors);
  await sab(page, `await s.jump('capture'); s.tab('farmer'); s.screen('capture');`);
  // the phone's storage refuses every write (the log is written under a Web Lock)
  await page.evaluate(() => { (navigator.locks as unknown as { request: unknown }).request = () => Promise.reject(new Error('QuotaExceededError')); });
  const btn = page.getByRole('button', { name: /Seal my evidence/ });
  await btn.click();
  await expect(page.locator('[data-seal-fail]')).toContainText('could not be sealed');
  expect(await page.evaluate('window.__sab.state().sealed')).toBe(false);
  await page.evaluate(() => { delete (navigator.locks as unknown as { request?: unknown }).request; });
  await btn.click();
  await expect.poll(() => page.evaluate('window.__sab.state().sealed')).toBe(true);
  await expect(page.locator('[data-seal-fail]')).toHaveCount(0);
});

test('CC-11: a saved Hindi choice whose dictionary cannot load leaves the page wholly in English, and switches when back online', async ({ page }) => {
  await saved(page, 'hi');
  let block = true;
  await page.route(/\/assets\/hi-[^/]*\.js/, (r) => (block ? r.abort('internetdisconnected') : r.continue()));
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await page.evaluate('window.__sab.ready()');
  await expect.poll(() => page.evaluate(() => ({ lang: document.documentElement.lang, cls: document.documentElement.className.match(/\b(l-hi|l-pa|lang-pending)\b/g) })), { timeout: 20_000 })
    .toEqual({ lang: 'en', cls: null });
  block = false;
  await page.evaluate(() => dispatchEvent(new Event('online')));
  await expect.poll(() => page.evaluate(() => document.documentElement.lang), { timeout: 20_000 }).toBe('hi');
});

test('R6: a saved Hindi choice fetches its dictionary and fonts with the main script, not after it', async ({ page }) => {
  await saved(page, 'hi');
  await page.goto('/');
  await page.waitForFunction(() => document.documentElement.lang === 'hi', null, { timeout: 20_000 });
  const links = await page.evaluate(() => [...document.querySelectorAll('link[rel=modulepreload], link[rel=preload][as=font]')].map((l) => l.getAttribute('href')));
  expect(links.some((h) => /assets\/hi-/.test(h ?? ''))).toBe(true);
  expect(links).toEqual(expect.arrayContaining(['fonts/deva-sans.woff2', 'fonts/deva-display.woff2']));
});

test('R6: an English visit fetches no other language', async ({ page }) => {
  await saved(page, 'en');
  await page.goto('/');
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  const links = await page.evaluate(() => [...document.querySelectorAll('link')].map((l) => l.getAttribute('href') ?? ''));
  expect(links.filter((h) => /assets\/(hi|pa)-|deva|guru/.test(h))).toEqual([]);
});

test('UI-04: a panel whose chunk never arrives says so after a while, with Reload, instead of spinning for ever', async ({ page }) => {
  test.setTimeout(60_000);
  await page.route(/\/assets\/Explainer-[^/]*\.js/, () => { /* never answers */ });
  await open(page, PHONE, 'en', []);
  await sab(page, `s.tab('explainer');`);
  const failed = page.locator('.load-failed');
  await expect(failed).toBeVisible({ timeout: 20_000 });
  await expect(failed.getByRole('button')).toHaveText('Reload the page');
});

test('UI-04: starting the tour while its chunk is slow shows a loading card on screen', async ({ page }) => {
  const held: (() => void)[] = [];
  await page.route(/\/assets\/Tour-[^/]*\.js/, (r) => { held.push(() => void r.continue()); });
  await open(page, PHONE, 'en', []);
  await sab(page, `s.tour(0);`);
  const card = page.locator('.lazy-card');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Loading the tour');
  await expect(card).toBeInViewport();
  held.forEach((go) => go());
  await expect(card).toHaveCount(0, { timeout: 15_000 });
});

test('R4: one dropped shared chunk does not leave the officer console broken: it recovers on that tab', async ({ page }) => {
  let n = 0;
  await page.route(/\/assets\/state-[^/?]*\.js(\?.*)?$/, (r) => (++n === 1 ? r.abort('failed') : r.continue()));
  await open(page, PHONE, 'en', []);
  await sab(page, `s.tab('insurer');`);
  await expect(page.locator('.dash')).toBeVisible({ timeout: 30_000 });
  // The console now recovers by fetching the file again, without a page reload, so the tab is checked on screen, not in the URL.
  await expect(page.locator('#st-insurer')).toHaveAttribute('aria-selected', 'true');
  expect(n).toBeGreaterThan(1);
});

test('R4: a chunk that keeps failing reloads only once, then shows Reload', async ({ page }) => {
  let navs = 0;
  page.on('request', (r) => { if (r.isNavigationRequest()) navs++; });
  await page.route(/\/assets\/state-[^/?]*\.js(\?.*)?$/, (r) => r.abort('failed'));
  await open(page, PHONE, 'en', []);
  await sab(page, `s.tab('insurer');`);
  await expect(page.locator('.load-failed')).toBeVisible({ timeout: 30_000 });
  expect(navs, 'one automatic reload, no loop').toBe(2);
});

test('R5: once the start has failed, the 25 s "taking longer" message does not replace the error', async ({ page }) => {
  test.setTimeout(90_000);
  await page.route('**/assets/index-*.js', (r) => r.abort('connectionreset'));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const dict = (await import('../../src/i18n/en')).default as Record<string, string>;
  const ph = page.locator('.sim-ph');
  await expect(ph).toContainText(dict['boot.failed'], { timeout: 20_000 });
  await page.waitForTimeout(27_000);
  await expect(ph).toContainText(dict['boot.failed']);
  await expect(ph.locator('small')).toContainText('index-');
});
