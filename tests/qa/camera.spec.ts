// The real capture path with a (fake) camera device and a granted GPS fix. Separate file: launchOptions must be
// top-level, and this browser instance carries the fake-device flags.
import { test, expect, type Page } from '@playwright/test';
import { ALL_VIEWPORTS, open } from './harness';

const V = (name: string) => ALL_VIEWPORTS.find((v) => v.name === name)!;
const sab = (page: Page, js: string) => page.evaluate(`(async () => { const s = window.__sab; ${js} })()`);
const state = (page: Page) => page.evaluate('window.__sab.state()') as Promise<{ shots: number }>;

test.use({
  launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] },
  permissions: ['camera', 'geolocation'],
  geolocation: { latitude: 30.95, longitude: 75.65, accuracy: 12 },
});

test('camera granted: a real camera frame and a real GPS fix become a hashed, geo-tagged shot', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `await s.jump('alert'); s.tab('farmer'); s.screen('capture');`);
  await page.getByRole('button', { name: /Open camera/ }).click();
  await expect(page.locator('.finder')).toBeVisible({ timeout: 15_000 });
  await page.waitForFunction(() => { const v = document.querySelector<HTMLVideoElement>('.finder video'); return !!v && v.videoWidth > 0; }, null, { timeout: 15_000 });
  await page.locator('.finder .shutter').click();
  const shot = page.locator('.shots li').first();
  await expect(shot).toBeVisible({ timeout: 20_000 });
  await expect(shot).toContainText(/GPS ±\d+ m/, { timeout: 20_000 });
  await expect(shot).not.toContainText('Simulated location');
  await expect.poll(async () => (await state(page)).shots, { timeout: 20_000 }).toBe(1);
  expect(errors).toEqual([]);
});
