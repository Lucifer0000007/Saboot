// INP runs alone (after every other QA test) so the 4x CPU throttle measures the app, not the test machine.
import { test, expect } from '@playwright/test';
import { ALL_VIEWPORTS, open, record } from './harness';

const V = (name: string) => ALL_VIEWPORTS.find((v) => v.name === name)!;

// INP (< 200 ms) for the main interactions on a mid-range phone profile (4x CPU throttle)
test('INP under 200 ms at 4x CPU · 360x640', async ({ page }) => {
  const errors: string[] = [];
  const v = V('360x640');
  await page.addInitScript(() => {
    (window as unknown as { __inp: number }).__inp = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as PerformanceEventTiming[]) {
        if (e.interactionId) (window as unknown as { __inp: number }).__inp = Math.max((window as unknown as { __inp: number }).__inp, e.duration);
      }
    }).observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
  });
  await open(page, v, 'en', errors);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.locator('#simulation').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Play replay' }).click();
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'Pause replay' }).click();
  await page.getByRole('tab', { name: 'Officer' }).click();
  await page.waitForSelector('.dash');
  await page.getByRole('tab', { name: 'Farmer' }).click();
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const inp = await page.evaluate(() => (window as unknown as { __inp: number }).__inp);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await record(page, 'inp', v.name, { viewport: v.name, lang: 'en', inp, layout: [], console: errors });
  expect(inp, 'worst interaction duration (ms)').toBeLessThan(200);
  expect(errors).toEqual([]);
});
