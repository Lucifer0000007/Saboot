// The live flow the demo rests on, end to end on the built site: a farmer's phone (touch device, photos through the camera input,
// real GPS fix) takes three photos,
// seals them and shows a QR code; a second device checks the code, adds the plot to the officer view, and a changed copy fails.
// Also the cases that used to lose or mislabel evidence: a reconnect after a reload, two tabs, storage that will not keep
// anything, and whether the one button is on the first screen.
import { test, expect, type Page, type Browser } from '@playwright/test';
import { ALL_VIEWPORTS, open, check, axe } from './harness';

const V = (name: string) => ALL_VIEWPORTS.find((v) => v.name === name)!;
const sab = (page: Page, js: string) => page.evaluate(`(async () => { const s = window.__sab; ${js} })()`);
type State = { t: number; shots: number; sealed: boolean; events: number; queued: number };
const state = (page: Page) => page.evaluate('window.__sab.state()') as Promise<State>;

// a touch phone: the capture screen then uses the camera input, as it does on a real phone (the viewfinder is for a laptop and is
// covered by camera.spec.ts)
test.use({ isMobile: true, hasTouch: true, permissions: ['geolocation'], geolocation: { latitude: 30.95, longitude: 75.65, accuracy: 12 } });

/** A camera-sized JPEG, different for each label so each photo has its own fingerprint. */
async function jpeg(page: Page, label: string): Promise<Buffer> {
  const b64 = await page.evaluate(async (l) => {
    const c = document.createElement('canvas');
    c.width = 1280;
    c.height = 960;
    const g = c.getContext('2d')!;
    g.fillStyle = '#7f9fc4';
    g.fillRect(0, 0, 1280, 960);
    for (let i = 0; i < 300; i++) {
      g.fillStyle = `hsl(${(i * 37 + l.length * 91) % 360},60%,50%)`;
      g.fillRect((i * 53) % 1200, (i * 29) % 900, 40, 40);
    }
    g.fillStyle = '#000';
    g.fillText(l, 20, 40);
    const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), 'image/jpeg', 0.8));
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let s = '';
    for (const x of bytes) s += String.fromCharCode(x);
    return btoa(s);
  }, label);
  return Buffer.from(b64, 'base64');
}

/** Take the next photo through the camera input and wait until it is in the log. */
async function takePhoto(page: Page, n: number) {
  await page.setInputFiles('input[type=file][capture]', { name: `shot${n}.jpg`, mimeType: 'image/jpeg', buffer: await jpeg(page, `photo ${n} of a flooded field`) });
  await expect.poll(async () => (await state(page)).shots, { timeout: 20_000 }).toBe(n);
}

/** The phone: alert, three real photos, seal, QR. Returns the code the QR stands for. */
async function phoneSeals(page: Page, errors: string[]) {
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `await s.jump('alert'); s.tab('farmer');`);
  await page.locator('[data-tour=cta]').click();
  for (let n = 1; n <= 3; n++) await takePhoto(page, n);
  const shots = page.locator('.shots li');
  await expect(shots).toHaveCount(3);
  // a real camera and a real GPS fix: every photo and location says live, none says simulated
  await expect(shots.locator('[data-v="photo"][data-prov="live"]')).toHaveCount(3);
  await expect(shots.locator('[data-v="loc"][data-prov="live"]')).toHaveCount(3);
  await page.getByRole('button', { name: /Seal my evidence/ }).click();
  await expect.poll(async () => (await state(page)).sealed, { timeout: 20_000 }).toBe(true);
  await page.getByRole('button', { name: /Share as a QR code/ }).click();
  const qr = page.locator('.share-sheet svg.qr');
  await expect(qr).toBeVisible({ timeout: 20_000 });
  // 57 squares a side and a 4-square quiet zone: version 10 (the old link QR was 77 and a 2-square zone)
  expect(await qr.getAttribute('viewBox')).toBe('0 0 65 65');
  const code = (await page.locator('.share-sheet details.k-code p.hash').textContent())!.trim();
  expect(code.length).toBeGreaterThan(300);
  expect(code.length).toBeLessThan(400);
  return code;
}

async function laptop(browser: Browser, errors: string[], hash = '') {
  const ctx = await browser.newContext({ baseURL: 'http://localhost:4330', serviceWorkers: 'block', viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/?tab=insurer' + hash);
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await page.evaluate('window.__sab.ready()');
  return { ctx, page };
}

test('the live flow: three real photos are sealed on the phone, the laptop checks the code and shows a new row, and a changed copy fails', async ({ page, browser }) => {
  const errors: string[] = [];
  const code = await phoneSeals(page, errors);

  const { ctx, page: lap } = await laptop(browser, errors, '#k=' + code);
  const result = lap.locator('.k-result');
  await expect(result.locator('.note-ok')).toContainText('Integrity verified: not altered since sealing.', { timeout: 20_000 });
  // where it came from, and when this laptop received it
  await expect(result.locator('[data-k-shot] [data-v="photo"][data-prov="live"]')).toHaveCount(3);
  await expect(result.locator('[data-k-shot] [data-v="loc"][data-prov="live"]')).toHaveCount(3);
  await expect(result).toContainText('Received by this console');
  await lap.locator('.import-sheet button', { hasText: 'Add to dashboard' }).click();
  await expect(lap.locator('.import-sheet')).toContainText('Imported (live)');

  // the ledger shows the import straight away and the tamper test works: the replay moved to the packet's time
  await lap.locator('.import-sheet button[aria-label="Close import"]').click();
  await expect(lap.locator('tr.imported')).toContainText('Imported (live)');
  await sab(lap, `s.tab('ledger');`);
  await expect(lap.locator('.ledger').first()).toContainText('IMPORTED_PACKET', { timeout: 20_000 });
  await expect(lap.getByRole('button', { name: /Tamper test/ })).toBeEnabled();

  // the same code again does not add a second row
  await sab(lap, `s.tab('insurer');`);
  await lap.getByRole('button', { name: /Import evidence/ }).click();
  await lap.getByRole('radio', { name: /Paste code/ }).click();
  await lap.locator('.import-sheet textarea').fill(code);
  await lap.locator('.import-sheet button', { hasText: 'Verify' }).click();
  await expect(lap.locator('.k-result .note-ok')).toBeVisible();
  await lap.locator('.import-sheet button', { hasText: 'Add to dashboard' }).click();
  await lap.locator('.import-sheet button[aria-label="Close import"]').click();
  await expect(lap.locator('tr.imported')).toHaveCount(1);

  // editing the box clears the verdict at once: it must never stay green over different text
  await lap.getByRole('button', { name: /Import evidence/ }).click();
  await lap.getByRole('radio', { name: /Paste code/ }).click();
  const box = lap.locator('.import-sheet textarea');
  await box.fill(code);
  await lap.locator('.import-sheet button', { hasText: 'Verify' }).click();
  await expect(lap.locator('.k-result .note-ok')).toBeVisible();
  await box.fill(code.slice(0, -1));
  await expect(lap.locator('.k-result')).toHaveCount(0);

  // a changed copy: one bit of a photo fingerprint, the chain step fails, and the original comes back
  await box.fill(code);
  await lap.locator('.import-sheet button', { hasText: 'Verify' }).click();
  await lap.locator('[data-change-copy]').click();
  await expect(lap.locator('.k-result .note-bad')).toContainText('Changed after sealing', { timeout: 10_000 });
  await expect(lap.locator('.k-steps li.bad')).toContainText('chain');
  await lap.locator('[data-restore]').click();
  await expect(lap.locator('.k-result .note-ok')).toBeVisible({ timeout: 10_000 });

  expect(errors).toEqual([]);
  await ctx.close();
});

test('a link pasted into a tab that is already open opens the import sheet and checks the code', async ({ page, browser }) => {
  const errors: string[] = [];
  const code = await phoneSeals(page, errors);
  const { ctx, page: lap } = await laptop(browser, errors);
  await expect(lap.locator('.import-sheet')).toHaveCount(0);
  await lap.evaluate((c) => { location.hash = '#k=' + c; }, code);
  await expect(lap.locator('.import-sheet .k-result .note-ok')).toBeVisible({ timeout: 20_000 });
  await ctx.close();
});

test('sealed evidence survives a reload and a reconnect: the log only moves forward', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `s.seek(18); s.net('offline'); await s.ensure('sealed');`);
  const sealed = await state(page);
  expect(sealed.shots).toBe(3);
  expect(sealed.sealed).toBe(true);
  expect(sealed.queued).toBeGreaterThan(0);
  await page.reload();
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await page.evaluate('window.__sab.ready()');
  // the clock comes back to the evidence, and nothing was removed
  const back = await state(page);
  expect(back.sealed).toBe(true);
  expect(back.shots).toBe(3);
  expect(back.t, 'the replay returns to the last thing done (the seal), not to the start').toBeGreaterThan(17);
  expect(back.t).toBeLessThanOrEqual(sealed.t);
  await sab(page, `s.net('online');`);
  await expect.poll(async () => (await state(page)).queued, { timeout: 20_000 }).toBe(0);
  const after = await state(page);
  expect(after.sealed).toBe(true);
  expect(after.shots).toBe(3);
  expect(after.events).toBeGreaterThanOrEqual(sealed.events);
  expect(errors).toEqual([]);
});

test('two tabs: the second one cannot erase what the first one sealed', async ({ page, context }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  const other = await context.newPage();
  await open(other, V('390x844'), 'en', errors);
  // tab one captures and seals; tab two (opened earlier, so it holds an older copy of the log) then acts
  await sab(page, `await s.jump('capture'); await s.ensure('sealed');`);
  const one = await state(page);
  expect(one.sealed).toBe(true);
  await sab(other, `s.seek(30); await s.ensure('filed');`);
  const fresh = await context.newPage();
  await open(fresh, V('390x844'), 'en', errors);
  const now = await state(fresh);
  expect(now.sealed, 'the seal from the first tab is still there').toBe(true);
  expect(now.events).toBeGreaterThanOrEqual(one.events);
  expect(errors).toEqual([]);
});

test('storage that will not keep anything: the person is told, not shown "saved"', async ({ page }) => {
  const errors: string[] = [];
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', { get() { throw new Error('storage blocked'); } });
  });
  await open(page, V('390x844'), 'en', errors);
  await expect(page.locator('[data-storage-warning]')).toHaveCount(0);
  await sab(page, `await s.jump('capture'); await s.ensure('captured');`);
  await expect(page.locator('[data-storage-warning]')).toContainText('not saving your photos', { timeout: 10_000 });
  expect(errors.filter((e) => !/storage blocked/.test(e))).toEqual([]);
});

for (const lang of ['en', 'hi', 'pa']) {
  test(`the alert's one button is on the first screen of a phone (${lang})`, async ({ page }) => {
    const errors: string[] = [];
    await page.addInitScript(() => { localStorage.setItem('saboot.tourSeen', 'true'); });
    await page.goto('/?at=alert');
    await open(page, V('390x844'), lang, errors);
    await page.goto('/?at=alert');
    await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
    await page.evaluate('window.__sab.ready()');
    await page.waitForTimeout(1200); // the smooth scroll to the phone
    const cta = await page.evaluate(() => {
      const b = document.querySelector('[data-tour=cta]')!.getBoundingClientRect();
      return { top: Math.round(b.top), bottom: Math.round(b.bottom), height: innerHeight };
    });
    expect(cta.top, 'the button starts on screen').toBeGreaterThan(0);
    expect(cta.bottom, `the button ends above the dock (${JSON.stringify(cta)})`).toBeLessThanOrEqual(cta.height - 70);
    expect(errors).toEqual([]);
  });
}

test('Reset, by the key or the button, asks before it clears what the phone captured', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `await s.jump('alert'); s.tab('farmer');`);
  const ask = page.getByRole('dialog', { name: /Clear what this phone captured/ });
  const idle = () => page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  // nothing captured yet: there is nothing to lose, so R resets at once
  await idle();
  await page.keyboard.press('r');
  await expect(ask).toHaveCount(0);
  await expect(page.locator('.toast')).toContainText('Replay reset');

  // one real photo is on the phone: R asks first, and keeping it changes nothing
  await sab(page, `await s.jump('alert'); s.tab('farmer');`);
  await page.locator('[data-tour=cta]').click();
  await takePhoto(page, 1);
  await idle();
  await page.keyboard.press('r');
  await expect(ask).toBeVisible();
  expect((await state(page)).shots).toBe(1);
  await ask.getByRole('button', { name: /Keep what was captured/ }).click();
  await expect(ask).toHaveCount(0);
  expect((await state(page)).shots).toBe(1);

  // the same question from the Reset button in the "More controls" sheet; saying yes clears it
  await page.getByRole('button', { name: 'More controls' }).click();
  await page.locator('.ctrl-sheet').getByRole('button', { name: 'Reset' }).click();
  await expect(ask).toBeVisible();
  await ask.getByRole('button', { name: /Clear it and start over/ }).click();
  await expect.poll(async () => (await state(page)).shots).toBe(0);
  await expect(ask).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the empty Proof screen offers a way to take photos instead of a dead end', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `await s.jump('alert'); s.tab('farmer'); s.screen('packet');`);
  await page.locator('[data-take-photos]').click();
  await expect(page.locator('.farmer .f-title')).toContainText('Take 3 photos');
  expect(errors).toEqual([]);
});

test('tabbing to a button is never left under the bottom dock (360 px phone)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  await sab(page, `await s.jump('alert'); s.tab('farmer');`);
  await page.evaluate(() => { window.scrollTo(0, 0); (document.activeElement as HTMLElement | null)?.blur(); });
  // walk the page with the keyboard, as a keyboard or switch user does, until the last button of the alert screen
  let reached = false;
  for (let i = 0; i < 120 && !reached; i++) {
    await page.keyboard.press('Tab');
    reached = await page.evaluate(() => /No damage at my field/.test(document.activeElement?.textContent ?? ''));
  }
  expect(reached, 'Tab reaches "No damage at my field"').toBe(true);
  const gap = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    return document.querySelector('.ctrl-dock')!.getBoundingClientRect().top - el.getBoundingClientRect().bottom;
  });
  expect(gap, 'the focused button ends above the dock').toBeGreaterThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('high contrast, switched on in Settings, turns the page black on white and keeps every layout and axe check', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `await s.jump('alert'); s.tab('farmer');`);
  await expect(page.locator('html.hc')).toHaveCount(0);
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('switch', { name: 'High contrast' }).check();
  await expect(page.locator('html.hc')).toHaveCount(1);
  await page.locator('.set-sheet').getByRole('button', { name: 'Close' }).last().click();
  const [bg, fg] = await page.evaluate(() => { const cs = getComputedStyle(document.body); return [cs.backgroundColor, cs.color]; });
  expect([bg, fg]).toEqual(['rgb(255, 255, 255)', 'rgb(0, 0, 0)']);
  expect(await check(page, V('390x844'))).toEqual([]);
  expect(await axe(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test.describe('a phone set to Hindi', () => {
  test.use({ locale: 'hi-IN' });
  test('with no saved choice the page opens in Hindi, and a saved choice still wins', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto('/');
    await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
    await expect(page.locator('html')).toHaveAttribute('lang', 'hi', { timeout: 20_000 });
    expect(await page.evaluate(() => localStorage.getItem('saboot.lang'))).toBe('"hi"');
    // the person picks English: that stays, whatever the phone says
    await page.evaluate(() => localStorage.setItem('saboot.lang', '"en"'));
    await page.reload();
    await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    expect(errors).toEqual([]);
  });
});

test('if the scenario data does not load, the page says so plainly and a button tries again', async ({ page }) => {
  let block = true;
  await page.route('**/data/flood-replay.json', (r) => (block ? r.abort() : r.continue()));
  await page.goto('/');
  const note = page.locator('#simulation .note-bad');
  await expect(note).toBeVisible({ timeout: 30_000 });
  await expect(note).not.toContainText(/TypeError|Failed to fetch|HTTP/);
  block = false;
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(note).toHaveCount(0, { timeout: 20_000 });
  await expect(page.locator('.farmer').first()).toBeVisible({ timeout: 20_000 });
});

test('one dropped request for the Hindi dictionary does not strand the language switch', async ({ page }) => {
  let n = 0;
  await page.route(/\/assets\/hi-[^/?]*\.js(\?.*)?$/, (r) => (++n === 1 ? r.abort('failed') : r.continue()));
  await open(page, V('390x844'), 'en', []);
  await page.keyboard.press('l');
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi', { timeout: 20_000 });
  expect(n).toBeGreaterThan(1);
});

test('if the Hindi dictionary cannot be fetched at all, the page stays in English and says so, and a second try works', async ({ page }) => {
  let block = true;
  await page.route(/\/assets\/hi-[^/?]*\.js(\?.*)?$/, (r) => (block ? r.abort('failed') : r.continue()));
  await open(page, V('390x844'), 'en', []);
  await page.keyboard.press('l');
  await expect(page.locator('.toast.warn')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.nav .spin')).toHaveCount(0);
  block = false;
  await page.keyboard.press('l');
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi', { timeout: 20_000 });
});

test.describe('the voice alert offline', () => {
  test.use({ serviceWorkers: 'allow' });
  test('the English voice clip is cached by the worker and plays with the network off', async ({ page, context }) => {
    const errors: string[] = [];
    await open(page, V('390x844'), 'en', errors);
    await page.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration())?.active && !!navigator.serviceWorker.controller, null, { timeout: 30_000 });
    // the cache becomes visible a moment after the worker reports itself active
    await expect.poll(() => page.evaluate(async () => !!(await caches.match('audio/alert-relief-en.webm', { ignoreSearch: true }))), { message: 'the clip is in the cache', timeout: 15_000 }).toBe(true);
    await context.setOffline(true);
    const seconds = await page.evaluate(
      () => new Promise<number>((res, rej) => {
        const a = new Audio('audio/alert-relief-en.webm');
        a.onloadedmetadata = () => res(a.duration);
        a.onerror = () => rej(new Error('the clip did not load offline'));
        a.load();
      }),
    );
    expect(seconds).toBeGreaterThan(1);
    // a byte range is answered from the cached file as a 206, the way a server would
    const part = await page.evaluate(async () => {
      const r = await fetch('audio/alert-relief-en.webm', { headers: { Range: 'bytes=0-9' } });
      return { status: r.status, range: r.headers.get('content-range'), bytes: (await r.arrayBuffer()).byteLength };
    });
    expect(part.status).toBe(206);
    expect(part.range).toMatch(/^bytes 0-9\//);
    expect(part.bytes).toBe(10);
    expect(errors.filter((e) => !/Failed to load resource|net::ERR/.test(e))).toEqual([]);
  });
});
