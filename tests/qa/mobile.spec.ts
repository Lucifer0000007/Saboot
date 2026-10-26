// The whole page on a phone (workstream W6): where "Run the simulation" lands, the pause at the alert, the farmer's main
// button above the dock, screen changes that open at the top, the nav on one row, the view switch in the dock, toasts and
// sheets that never get in the way.
import { test, expect, type Page } from '@playwright/test';
import { ALL_VIEWPORTS, open } from './harness';

const V = (name: string) => ALL_VIEWPORTS.find((v) => v.name === name)!;
const sab = (page: Page, js: string) => page.evaluate(`(async () => { const s = window.__sab; ${js} })()`);
const box = (page: Page, sel: string) => page.locator(sel).first().evaluate((e) => { const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height }; });
const t = (page: Page) => page.evaluate(() => (window.__sab.state() as { t: number }).t);

test('Run the simulation on a phone goes to the farmer’s phone and stops once at the alert, its button above the dock (F1, J1)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  await page.locator('.cta-row a', { hasText: 'Explore it yourself' }).click();
  await expect.poll(async () => (await box(page, '[data-tour=phone]')).top, { timeout: 5_000 }).toBeLessThan(200);
  expect((await box(page, '[data-tour=phone]')).top).toBeGreaterThanOrEqual(0);
  // the replay runs, then stops by itself at the alert and stays there
  await expect(page.locator('[data-tour=alert]')).toBeVisible({ timeout: 40_000 });
  await page.waitForTimeout(1000);
  const at = await t(page);
  expect(at).toBeLessThan(15);
  await page.waitForTimeout(1500);
  expect(await t(page), 'the replay is paused at the alert').toBe(at);
  await expect(page.locator('.ctrl-dock button[aria-label="Play replay"]')).toBeVisible();
  const cta = await box(page, '[data-tour=cta]');
  const dock = await box(page, '.ctrl-dock');
  expect(cta.top).toBeGreaterThan(0);
  expect(cta.bottom).toBeLessThanOrEqual(dock.top);
  // play goes on from the alert, with no second stop
  await page.locator('.ctrl-dock button[aria-label="Play replay"]').click();
  await expect.poll(() => t(page), { timeout: 5_000 }).toBeGreaterThan(at + 0.5);
  expect(errors).toEqual([]);
});

/** The screen title sits between the sticky nav and the bottom of the screen. */
async function titleOnScreen(page: Page) {
  await expect.poll(async () => {
    const r = await box(page, '.farmer .f-title');
    const nav = await box(page, 'header.nav');
    return r.top >= nav.bottom - 1 && r.bottom <= 640;
  }, { timeout: 5_000 }).toBe(true);
}

test('a new farmer screen opens at its top, not where the last one was scrolled to (H1, UI-02)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  await sab(page, `await s.jump('capture'); await s.ensure('sealed'); s.seek(s.state().t + 0.3); s.tab('farmer'); s.screen('packet');`);
  const next = page.locator('.farmer .pill-primary', { hasText: 'Next: report the loss' });
  await next.scrollIntoViewIfNeeded();
  await next.click();
  await expect(page.locator('.farmer .f-title')).toHaveText('Report the loss');
  await titleOnScreen(page);
  // the helper: from the queue's last row to a farmer's consent screen
  await sab(page, `s.seek(20); await s.helper(1); s.screen('helper');`);
  const start = page.locator('.hq li').last().getByRole('button', { name: /Start|Continue/ });
  await start.scrollIntoViewIfNeeded();
  await start.click();
  await expect(page.locator('.farmer .f-title')).toContainText('Consent from');
  await titleOnScreen(page);
  expect(errors).toEqual([]);
});
