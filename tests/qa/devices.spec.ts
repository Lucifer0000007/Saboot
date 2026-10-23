// The camera and the microphone are on only while a person is using them. Leaving a screen, or closing the scanner before the
// device has answered, must switch it off (C-10). The page is given stand-in devices that stay live until the app stops them:
// Chrome's fake camera ends its own track within a second here, which would make "off" mean nothing.
import { test, expect, type Page } from '@playwright/test';
import { ALL_VIEWPORTS, open } from './harness';

const V = (name: string) => ALL_VIEWPORTS.find((v) => v.name === name)!;
const sab = (page: Page, js: string) => page.evaluate(`(async () => { const s = window.__sab; ${js} })()`);
const events = async (page: Page) => ((await page.evaluate('window.__sab.state()')) as { events: number }).events;

type Watched = { __streams: MediaStream[] };

/** Give the page a camera and a microphone that answer `delayMs` late and stay live until stopped. Call before the page opens. */
async function standInDevices(page: Page, delayMs: number) {
  await page.addInitScript((delay) => {
    const w = window as unknown as Watched;
    w.__streams = [];
    const make = (c: MediaStreamConstraints): MediaStream => {
      if (c.video) {
        const cv = document.createElement('canvas');
        cv.width = 320;
        cv.height = 240;
        const g = cv.getContext('2d')!;
        let n = 0;
        setInterval(() => { g.fillStyle = `hsl(${(n += 17) % 360},50%,50%)`; g.fillRect(0, 0, 320, 240); }, 100);
        return cv.captureStream(10);
      }
      const ac = new AudioContext();
      const out = ac.createMediaStreamDestination();
      const osc = ac.createOscillator();
      osc.connect(out);
      osc.start();
      return out.stream;
    };
    navigator.mediaDevices.getUserMedia = async (c) => {
      await new Promise((r) => setTimeout(r, delay));
      const s = make(c ?? {});
      w.__streams.push(s);
      return s;
    };
  }, delayMs);
}
const given = (page: Page) => page.evaluate(() => (window as unknown as Watched).__streams.length);
const live = (page: Page) => page.evaluate(() => (window as unknown as Watched).__streams.flatMap((s) => s.getTracks()).filter((t) => t.readyState === 'live').length);

test('closing the scanner switches the camera off', async ({ page }) => {
  const errors: string[] = [];
  await standInDevices(page, 0);
  await open(page, V('1280x800'), 'en', errors);
  await sab(page, `s.tab('insurer');`);
  await page.getByRole('button', { name: /Import evidence/ }).click();
  await page.waitForFunction(() => (document.querySelector<HTMLVideoElement>('.k-scan video')?.videoWidth ?? 0) > 0, null, { timeout: 15_000 });
  expect(await live(page)).toBeGreaterThan(0);
  await page.locator('.import-sheet button[aria-label="Close import"]').click();
  await expect.poll(() => live(page)).toBe(0);
  expect(errors).toEqual([]);
});

test('closing the scanner before the camera has answered leaves the camera off', async ({ page }) => {
  const errors: string[] = [];
  await standInDevices(page, 800);
  await open(page, V('1280x800'), 'en', errors);
  await sab(page, `s.tab('insurer');`);
  await page.getByRole('button', { name: /Import evidence/ }).click();
  await page.locator('.import-sheet button[aria-label="Close import"]').click();
  // the camera answers after the sheet is gone: nothing may keep it
  await expect.poll(() => given(page), { timeout: 10_000 }).toBe(1);
  await page.waitForTimeout(600);
  expect(await live(page)).toBe(0);
  expect(errors).toEqual([]);
});

/** The consent screen on the demo farmer's phone, with a helper's name typed in. */
async function onConsent(page: Page, errors: string[]) {
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `await s.jump('alert'); s.tab('farmer'); s.screen('assist');`);
  await page.getByLabel(/Helper’s name|Helper's name/).fill('Test Helper');
}

test('leaving the consent screen while recording switches the microphone off and records nothing', async ({ page }) => {
  const errors: string[] = [];
  await standInDevices(page, 0);
  await onConsent(page, errors);
  const before = await events(page);
  await page.getByRole('button', { name: /Record spoken consent/ }).click();
  await expect(page.getByRole('button', { name: /Recording/ })).toBeVisible();
  expect(await live(page)).toBe(1);
  await sab(page, `s.screen('home');`);
  await expect.poll(() => live(page)).toBe(0);
  await page.waitForTimeout(500);
  expect(await events(page), 'a recording the person walked away from is not consent').toBe(before);
  expect(errors).toEqual([]);
});

test('leaving the consent screen before the microphone has answered leaves the microphone off', async ({ page }) => {
  const errors: string[] = [];
  await standInDevices(page, 800);
  await onConsent(page, errors);
  const before = await events(page);
  await page.getByRole('button', { name: /Record spoken consent/ }).click();
  await sab(page, `s.screen('home');`);
  await expect.poll(() => given(page), { timeout: 10_000 }).toBe(1);
  await page.waitForTimeout(600);
  expect(await live(page)).toBe(0);
  expect(await events(page)).toBe(before);
  expect(errors).toEqual([]);
});
