// The owner's minimal field mode (?mode=field): a real farmer, their consent, a clock started by hand, real (fake-device)
// camera photos, a seal, the code copied, then checked on the officer side. Separate file: it needs the fake-camera flags.
import { test, expect, type Page } from '@playwright/test';

test.use({
  viewport: { width: 360, height: 640 },
  launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] },
  permissions: ['camera', 'geolocation', 'clipboard-read', 'clipboard-write'],
  geolocation: { latitude: 30.95, longitude: 75.65, accuracy: 12 },
});

const watch = (page: Page) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
};

/** A small real image file, as the phone's own camera app would hand back through the file input. */
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAMCAIAAADkharWAAAAFUlEQVR4nGPQqLAhCTGMahjVgB0BAHxfpQHJqjQoAAAAAElFTkSuQmCC', 'base64');

async function pick(page: Page, kind: 'wide' | 'close') {
  const chooser = page.waitForEvent('filechooser');
  await page.locator(`[data-field-shot=${kind}] .pill-ghost`).click();
  await (await chooser).setFiles({ name: 'field.png', mimeType: 'image/png', buffer: PNG });
  const shot = page.locator(`[data-field-shot=${kind}]`);
  await expect(shot).toContainText('Taken at', { timeout: 20_000 });
  await expect(shot).toContainText(/GPS ±\d+ m/);
}

async function snap(page: Page, kind: 'wide' | 'close') {
  await page.locator(`[data-field-take=${kind}]`).click();
  await expect(page.locator('.finder')).toBeVisible({ timeout: 15_000 });
  await page.waitForFunction(() => { const v = document.querySelector<HTMLVideoElement>('.finder video'); return !!v && v.videoWidth > 0; }, null, { timeout: 15_000 });
  await page.locator('.finder .shutter').click();
  const shot = page.locator(`[data-field-shot=${kind}]`);
  await expect(shot).toContainText('Taken at', { timeout: 20_000 });
  await expect(shot).toContainText(/GPS ±\d+ m/);
}

test('field mode at 360x640: farmer, consent, clock, real photos, seal, copy, then the officer sees exactly that record', async ({ page }) => {
  const errors = watch(page);
  await page.goto('/?mode=field');
  await expect(page.locator('[data-field-mode]')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[data-field-strip]')).toContainText('Field mode: real photos on this phone. Nothing is sent unless you share the code. Saboot decides nothing.');

  await page.locator('[data-fd=name]').fill('Test Farmer');
  await page.locator('[data-fd=village]').fill('Test Village');
  await page.locator('[data-fd=khasra]').fill('112/4');
  await page.locator('[data-fd=crop]').fill('Wheat');
  await page.locator('[data-fd=lang]').selectOption('hi');
  await page.locator('[data-fd=by]').fill('Field Tester');
  await page.getByRole('button', { name: 'Save farmer' }).click();
  const rec = page.locator('[data-field-record="F-1"]');
  await expect(rec).toBeVisible();
  // consent first, in the farmer's language; no camera before it
  await expect(page.locator('.fd-consent')).toContainText('अनुमति', { timeout: 10_000 });
  await expect(page.locator('[data-field-take]')).toHaveCount(0);
  await page.locator('[data-field-agree]').click();
  await page.locator('[data-field-clock-start]').click();
  await expect(page.locator('[data-field-clock] .val[data-prov=hand]')).toBeVisible();

  await snap(page, 'wide');
  // the second photo through the file input (the phone's camera app): Chrome's fake device does not open twice in one page
  await pick(page, 'close');
  await page.locator('[data-field-seal-btn]').click();
  await expect(page.locator('[data-field-share] svg.qr')).toBeVisible({ timeout: 20_000 });
  const code = await page.locator('[data-field-code]').inputValue();
  expect(code).toMatch(/^[A-Za-z0-9_-]{200,}$/);
  await page.locator('[data-copy-code]').click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(code);

  await page.locator('[data-field-tab=officer]').click();
  await expect(page.locator('[data-field-officer]')).toContainText('Nothing received yet.');
  await page.locator('[data-field-paste]').fill(await page.evaluate(() => navigator.clipboard.readText()));
  await page.locator('[data-field-check]').click();
  const items = page.locator('[data-received]');
  await expect(items).toHaveCount(1);
  await expect(items.first()).toHaveAttribute('data-received', 'F-1');
  await expect(items.first()).toContainText('Unchanged since sealing', { timeout: 10_000 });
  expect(await items.first().locator('[data-prov=live]').count()).toBeGreaterThan(0);
  expect(await items.first().locator('[data-prov=hand]').count()).toBeGreaterThan(0);
  await expect(page.locator('[data-prov=sim], [data-sim-label]')).toHaveCount(0);
  const text = await page.locator('body').innerText();
  for (const s of ['Simulated', 'Simulation', 'Harjit Kaur', 'P-04']) expect(text).not.toContain(s);
  // the same code twice is one record
  await page.locator('[data-field-paste]').fill(code);
  await page.locator('[data-field-check]').click();
  await expect(page.locator('[data-field-say]')).toContainText('already in the list');
  await expect(items).toHaveCount(1);
  await page.screenshot({ path: '.cache/field/officer-360x640-light.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('settings opens field mode, and leaving it returns to the demo unchanged', async ({ page }) => {
  const errors = watch(page);
  await page.goto('/');
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await page.evaluate('window.__sab.ready()');
  await page.evaluate(`(async () => { const s = window.__sab; await s.jump('alert'); s.tab('farmer'); s.settings(true); })()`);
  await page.locator('[data-enter-field]').click();
  await expect(page.locator('[data-field-mode]')).toBeVisible({ timeout: 20_000 });
  expect(page.url()).toContain('mode=field');
  for (const s of ['Simulated', 'Simulation', 'Harjit Kaur']) expect(await page.locator('body').innerText()).not.toContain(s);
  await page.locator('[data-leave-field]').click();
  await expect(page.locator('[data-field-mode]')).toHaveCount(0);
  expect(page.url()).not.toContain('mode=field');
  await expect(page.locator('#hero-h')).toBeVisible();
  await page.evaluate(`(async () => { const s = window.__sab; s.tab('farmer'); s.screen('capture'); })()`);
  await expect(page.locator('.farmer .f-title')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.farmer')).toContainText('Harjit Kaur');
  expect(errors).toEqual([]);
});

test('a page opened at ?mode=field leaves to a working demo', async ({ page }) => {
  const errors = watch(page);
  await page.goto('/?mode=field');
  await expect(page.locator('[data-field-mode]')).toBeVisible({ timeout: 20_000 });
  await page.locator('[data-leave-field]').click();
  await expect(page.locator('[data-field-mode]')).toHaveCount(0);
  await expect(page.locator('#hero-h')).toBeVisible();
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await page.evaluate('window.__sab.ready()');
  await page.evaluate(`(async () => { const s = window.__sab; await s.jump('alert'); s.tab('farmer'); s.screen('capture'); })()`);
  await expect(page.locator('.farmer')).toContainText('Harjit Kaur', { timeout: 20_000 });
  expect(errors).toEqual([]);
});

for (const scheme of ['light', 'dark'] as const) {
  test(`field mode capture screen renders at 360x640 (${scheme})`, async ({ page }) => {
    const errors = watch(page);
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/?mode=field');
    await page.locator('[data-fd=name]').fill('Test Farmer');
    await page.locator('[data-fd=village]').fill('Test Village');
    await page.locator('[data-fd=khasra]').fill('7');
    await page.locator('[data-fd=crop]').fill('Paddy');
    await page.locator('[data-fd=by]').fill('Field Tester');
    await page.getByRole('button', { name: 'Save farmer' }).click();
    await page.locator('[data-field-agree]').click();
    await page.locator('[data-field-clock-start]').click();
    await expect(page.locator('[data-field-photos]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    await page.screenshot({ path: `.cache/field/capture-360x640-${scheme}.png`, fullPage: true });
    expect(errors).toEqual([]);
  });
}
