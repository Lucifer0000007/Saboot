// The optional demo receiver, end to end. Off by default: no button, no request beyond the site's own files, no console error
// (tests/qa/privacy.spec.ts keeps its own stricter check). On: this file hosts the receipt routes in front of the built site on
// a localhost port (a secure context, so the phone can sign without TLS), a phone sends a sealed code, the laptop's console
// lists it with the laptop's receipt time and imports it like a scanned code; a code queued while offline goes on reconnect.
import { test, expect, type Page } from '@playwright/test';
import http from 'node:http';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ALL_VIEWPORTS, open } from './harness';
// @ts-expect-error plain JavaScript, imported as the other specs import the file server
import { receiptRoutes, compose } from '../../scripts/receipt-server.mjs';
// @ts-expect-error plain JavaScript
import { staticHandler } from '../../scripts/snap.mjs';

const V = (name: string) => ALL_VIEWPORTS.find((v) => v.name === name)!;
const sab = (page: Page, js: string) => page.evaluate(`(async () => { const s = window.__sab; ${js} })()`);
// an ephemeral port: Playwright runs this file in more than one worker, each with its own server
let PORT = 0;
let srv: http.Server;
let store: string;

test.beforeAll(async () => {
  store = join(mkdtempSync(join(tmpdir(), 'saboot-receipt-qa-')), 'receipts.json');
  srv = http.createServer(compose(receiptRoutes({ store }), staticHandler('dist')));
  await new Promise<void>((r) => srv.listen(0, r));
  PORT = (srv.address() as { port: number }).port;
});
test.afterAll(async () => { await new Promise((r) => srv.close(r)); });

const stored = (): { receipts: { code: string; receivedAt: number }[] } => (existsSync(store) ? JSON.parse(readFileSync(store, 'utf8')) : { receipts: [] });

/** Every request the page makes, by method. */
function watch(page: Page) {
  const seen: { method: string; url: string }[] = [];
  page.on('request', (r) => seen.push({ method: r.method(), url: r.url() }));
  return seen;
}

/** A phone on the receiver's address: seal with simulated photos and open the share sheet. */
async function phoneOnReceiver(page: Page, errors: string[], query = '?receiver=1&at=alert') {
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`http://localhost:${PORT}/${query}`);
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await page.evaluate('window.__sab.ready()');
  await sab(page, `await s.jump('capture'); await s.ensure('sealed'); s.tab('farmer'); await s.jump('capture'); s.seek(s.state().t + 0.2); s.screen('packet');`);
  await page.getByRole('button', { name: /Share as a QR code/ }).click();
  await expect(page.locator('.share-sheet details.k-code')).toBeVisible({ timeout: 20_000 });
}

test('off by default: no send button, no "received" view, nothing but plain GETs of the site', async ({ page }) => {
  const errors: string[] = [];
  const seen = watch(page);
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `await s.jump('capture'); await s.ensure('sealed'); s.tab('farmer'); await s.jump('capture'); s.seek(s.state().t + 0.2); s.screen('packet');`);
  await page.getByRole('button', { name: /Share as a QR code/ }).click();
  await expect(page.locator('.share-sheet details.k-code')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[data-send-laptop]')).toHaveCount(0);
  await sab(page, `s.tab('insurer');`);
  await page.getByRole('button', { name: /Import evidence/ }).click();
  await expect(page.locator('.import-sheet')).toBeVisible();
  await expect(page.getByRole('radio', { name: /Received over the network/ })).toHaveCount(0);
  for (const r of seen) expect(r.method, r.url).toBe('GET');
  expect(seen.some((r) => /^\/receipts?$/.test(new URL(r.url).pathname))).toBe(false);
  expect(errors).toEqual([]);
});

test('with the receiver on, a tap sends the sealed code once and the status shows the laptop\'s receipt time', async ({ page }) => {
  const errors: string[] = [];
  const seen = watch(page);
  await phoneOnReceiver(page, errors);
  const code = (await page.locator('.share-sheet details.k-code p.hash').textContent())!.trim();
  await expect(page.locator('[data-send-state]')).toContainText('Sends only this signed code');
  await page.locator('[data-send-laptop]').click();
  await expect(page.locator('[data-send-state]')).toContainText('Received by the laptop at', { timeout: 15_000 });
  // a second tap sends nothing: the laptop already has it
  await page.locator('[data-send-laptop]').click();
  await page.waitForTimeout(500);
  const posts = seen.filter((r) => r.method === 'POST');
  expect(posts.map((r) => new URL(r.url).pathname)).toEqual(['/receipt']);
  // the code travels in the body, never in a URL or a header
  for (const r of seen) expect(r.url.includes(code), r.url.slice(0, 80)).toBe(false);
  const kept = stored().receipts.filter((r) => r.code === code);
  expect(kept.length, 'kept once, with a time').toBe(1);
  expect(kept[0].receivedAt).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('a code queued while offline is sent on reconnect, even after a reload', async ({ page }) => {
  const errors: string[] = [];
  await phoneOnReceiver(page, errors);
  const code = (await page.locator('.share-sheet details.k-code p.hash').textContent())!.trim();
  const before = stored().receipts.filter((r) => r.code === code).length;
  await sab(page, `s.net('offline');`);
  const seen = watch(page);
  await page.locator('[data-send-laptop]').click();
  await expect(page.locator('[data-send-state]')).toContainText('No connection');
  await page.waitForTimeout(500);
  expect(seen.filter((r) => r.method === 'POST')).toEqual([]);
  // the phone is reloaded while still offline: the queue is on disk, the watcher starts from the preference
  await page.reload();
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await page.evaluate('window.__sab.ready()');
  await sab(page, `s.net('offline');`);
  await page.waitForTimeout(300);
  await sab(page, `s.net('online');`);
  await expect.poll(() => stored().receipts.filter((r) => r.code === code).length, { timeout: 15_000 }).toBe(before + 1);
  expect(errors).toEqual([]);
});
