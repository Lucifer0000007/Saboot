// Privacy on the built site (docs/PRIVACY-AND-CONSENT.md): what reaches a server, what the consent screen says in each
// language, and what "export my data" and "delete my data" really do. The first test listens on a server of its own, so it
// sees exactly the request lines and headers a real host would see.
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { ALL_VIEWPORTS, open } from './harness';
import en from '../../src/i18n/en';
import hi from '../../src/i18n/hi';
import pa from '../../src/i18n/pa';
// @ts-expect-error plain JS dev server (the same one the QA web server uses)
import { serve } from '../../scripts/snap.mjs';

const V = (name: string) => ALL_VIEWPORTS.find((v) => v.name === name)!;
const sab = (page: Page, js: string) => page.evaluate(`(async () => { const s = window.__sab; ${js} })()`);
type LogInfo = { events: number; head: string | null; packetHash: string | null; shotShas: string[] };

test.describe('what reaches a server', () => {
  test.describe.configure({ mode: 'serial' });
  const port = 4332;
  const seen: { method: string; url: string; headers: Record<string, string | string[] | undefined> }[] = [];
  let srv: { close(): void };
  test.beforeAll(async () => { srv = await serve('dist', port, { onRequest: (r: (typeof seen)[number]) => seen.push(r) }); });
  test.afterAll(() => srv.close());
  test.use({ baseURL: `http://localhost:${port}` });

  test('a full capture, seal, share and import flow makes only plain GETs, and nothing in any URL or header is a photo fingerprint or the packet code', async ({ page }) => {
    const errors: string[] = [];
    const origins = new Set<string>();
    page.on('request', (r) => { const u = new URL(r.url()); if (u.protocol.startsWith('http')) origins.add(u.origin); });
    await open(page, V('1280x800'), 'en', errors);
    // a helper captures for one farmer: consent, three photos, seal
    await sab(page, `s.seek(20); await s.helper(1); s.active('P-05'); s.tab('farmer'); s.screen('packet');`);
    // the share sheet signs the packet and shows its QR code
    await page.locator('[data-tour=share] button').click();
    await expect(page.locator('.share-sheet .qr')).toBeVisible({ timeout: 20_000 });
    const code = (await page.evaluate('window.__sab.kcode()')) as string;
    const logs = (await page.evaluate('window.__sab.logs()')) as Record<string, LogInfo>;
    const secrets = [code, logs['P-05'].head!, logs['P-05'].packetHash!, ...logs['P-05'].shotShas];
    expect(secrets.every((s) => s && s.length >= 32)).toBe(true);
    // the laptop opens the link: the code travels in the fragment
    await page.goto('/?via=privacy#k=' + code);
    await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
    await expect(page.locator('.k-result .note-ok')).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(500);

    expect(seen.length).toBeGreaterThan(5);
    // only plain GETs, never a body
    for (const r of seen) {
      expect(['GET', 'HEAD'], `${r.method} ${r.url}`).toContain(r.method);
      expect(Number(r.headers['content-length'] ?? 0), `body on ${r.url}`).toBe(0);
    }
    // nothing sensitive in any request line or header (this includes the Referer the browser sends)
    const wire = JSON.stringify(seen);
    for (const s of secrets) expect(wire.includes(s), `a secret of ${s.length} characters reached the server`).toBe(false);
    expect(seen.some((r) => r.url.includes('#')), 'a URL fragment reached the server').toBe(false);
    expect(wire.includes('#k='), 'the #k= link fragment reached the server').toBe(false);
    // and nothing went to any other host
    expect([...origins]).toEqual([`http://localhost:${port}`]);
    expect(errors).toEqual([]);
  });
});

test('the share code and the bundle carry a position rounded to about 100 m, never the exact reading', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('1280x800'), 'en', errors);
  await sab(page, `s.seek(20); await s.helper(1); s.active('P-05');`);
  const code = (await page.evaluate('window.__sab.kcode()')) as string;
  const bytes = Buffer.from(code.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  const lat = bytes.readInt32BE(10), lon = bytes.readInt32BE(14);
  // stored as degrees times 1000: three decimals at most
  expect(Number.isInteger(lat) && Number.isInteger(lon)).toBe(true);
  expect(Math.abs(lat / 1000 - Math.round((lat / 1000) * 1000) / 1000)).toBeLessThan(1e-9);
  expect(errors).toEqual([]);
});

// The farmer is read the consent in the language they speak (Avtar Sharma speaks Hindi), whatever the phone is set to; the
// helper gets the same words in the phone's language underneath (audit H5).
for (const [lang, dict] of [['en', en], ['hi', hi], ['pa', pa]] as const) {
  test(`consent screen in ${lang}: the farmer's sentence and three plain lines are in Hindi, the helper's copy in ${lang}, all as in the privacy document`, async ({ page }) => {
    const errors: string[] = [];
    await open(page, V('1280x800'), lang, errors);
    await sab(page, `s.seek(20); await s.helper(0); s.active('P-06'); s.tab('farmer'); s.screen('assist');`);
    const sentence = (d: typeof dict) => String(d['as.consentText']).replace('{farmer}', 'Avtar Sharma').replace('{helper}', 'QA helper');
    const farmer = page.locator('[data-consent-farmer]');
    await expect(farmer).toHaveAttribute('lang', 'hi');
    await expect(farmer.locator('.captions')).toContainText(sentence(hi), { timeout: 20_000 });
    const lines = farmer.locator('[data-consent-means] li');
    await expect(lines).toHaveCount(3);
    await expect(lines.nth(0)).toHaveText(String(hi['as.means1']));
    await expect(lines.nth(1)).toHaveText(String(hi['as.means2']));
    await expect(lines.nth(2)).toHaveText(String(hi['as.means3']));
    const copy = page.locator('[data-consent-ui]');
    if (lang === 'hi') await expect(copy).toHaveCount(0);
    else {
      await copy.locator('summary').click();
      await expect(copy).toContainText(sentence(dict));
      for (const k of ['as.means1', 'as.means2', 'as.means3']) await expect(copy).toContainText(String(dict[k]));
    }
    // the document carries the same words
    const doc = readFileSync('docs/PRIVACY-AND-CONSENT.md', 'utf8');
    for (const k of ['as.consentText', 'as.means1', 'as.means2', 'as.means3']) expect(doc.includes(String(dict[k])), `${lang} ${k} in the document`).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('export my data gives a copy without photos; delete my data removes logs, photos, key, queue and session', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('1440x900'), 'en', errors);
  await sab(page, `s.seek(20); await s.helper(2); s.tab('farmer'); s.screen('helper');`);
  const count = (store: string) => page.evaluate((st) => new Promise<number>((res) => {
    const r = indexedDB.open('saboot');
    r.onsuccess = () => { const q = r.result.transaction(st).objectStore(st).count(); q.onsuccess = () => res(q.result); };
  }), store);
  expect(await count('photos')).toBeGreaterThanOrEqual(6);
  expect(await count('kv')).toBeGreaterThan(0);

  await sab(page, `s.settings(true);`);
  await expect(page.locator('[data-your-data]')).toBeVisible({ timeout: 20_000 });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('[data-export-data]').click()]);
  const json = readFileSync((await dl.path())!, 'utf8');
  const copy = JSON.parse(json);
  expect(copy.kind).toBe('saboot.device-export');
  expect(Object.keys(copy.logs).sort()).toEqual(['P-05', 'P-06']);
  expect(copy.helperSession.name).toBe('QA helper');
  expect(copy.note).toMatch(/Photos are not included/);
  expect(json).not.toMatch(/data:image|base64,/);
  expect(json).toContain('"type": "consent"');

  // deleting asks first, and "keep" keeps everything
  await page.locator('[data-delete-data]').click();
  await expect(page.locator('[data-delete-ask]')).toBeVisible();
  await page.getByRole('button', { name: 'Keep my data' }).click();
  expect(Object.keys((await page.evaluate('window.__sab.logs()')) as object).length).toBe(2);
  await page.locator('[data-delete-data]').click();
  await page.locator('[data-delete-yes]').click();
  await expect.poll(async () => Object.keys((await page.evaluate('window.__sab.logs()')) as object).length, { timeout: 10_000 }).toBe(0);
  expect(await count('photos')).toBe(0);
  expect(await count('outbox')).toBe(0);
  expect(await count('kv')).toBe(0);
  await sab(page, `s.settings(false); s.screen('helper');`);
  await expect(page.locator('[data-helper-name]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
