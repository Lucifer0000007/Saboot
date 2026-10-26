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

test('the top nav stays one row from 320 to 600 px in every language, 390 included (H15, J4, R3)', async ({ page }) => {
  const errors: string[] = [];
  for (const lang of ['en', 'hi', 'pa']) {
    await open(page, V('390x844'), lang, errors);
    for (const w of [320, 360, 384, 386, 390, 393, 400, 412, 430, 480, 599]) {
      await page.setViewportSize({ width: w, height: 844 });
      await expect.poll(async () => (await box(page, 'header.nav')).height, { message: `${lang} at ${w}px` }).toBeLessThan(80);
    }
  }
  expect(errors).toEqual([]);
});

test('the bottom dock passes under the top nav when the end of the simulation scrolls up (UI-01)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  await expect(page.locator('.ctrl-dock')).toBeAttached();
  // the end of #simulation 40 px below the top of the screen: the dock, stuck to that end, now sits where the nav is
  await page.evaluate(() => { const s = document.getElementById('simulation')!; scrollTo(0, s.getBoundingClientRect().bottom + scrollY - 40); });
  const dock = await box(page, '.ctrl-dock');
  expect(dock.top).toBeLessThan(65);
  const hit = await page.evaluate(() => !!document.elementFromPoint(300, 30)?.closest('header.nav'));
  expect(hit, 'the menu button, not the dock, is under a tap at the top right').toBe(true);
  expect(errors).toEqual([]);
});

test.describe('the first-visit toast', () => {
  test.use({ serviceWorkers: 'allow' });
  test('sits under the nav, clear of the farmer’s button, lets taps through, and follows a language switch (F2, H14, UI-15, S-16, J19)', async ({ page }) => {
    const errors: string[] = [];
    await open(page, V('360x640'), 'en', errors);
    await sab(page, `await s.jump('alert'); s.tab('farmer');`);
    await page.evaluate(() => document.querySelector('[data-tour=cta]')!.scrollIntoView({ block: 'end' }));
    const toast = page.locator('.toast');
    await expect(toast).toContainText('Ready to work offline', { timeout: 40_000 });
    expect(await toast.evaluate((e) => getComputedStyle(e).pointerEvents)).toBe('none');
    const tb = await box(page, '.toast'), cta = await box(page, '[data-tour=cta]'), nav = await box(page, 'header.nav');
    expect(tb.top).toBeGreaterThanOrEqual(nav.bottom);
    expect(tb.bottom <= cta.top || tb.top >= cta.bottom, 'the toast does not cover the main button').toBe(true);
    const hi = (await import('../../src/i18n/hi')).default as Record<string, string>;
    await sab(page, `await s.lang('hi');`);
    await expect(toast).toHaveText(hi['app.offlineReady']);
    expect(errors).toEqual([]);
  });
});

test('the view switch rides in the dock: from the bottom of the console one tap opens the farmer at the top; the dock’s Moments button says so (J3, UI-07, UI-16)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  await sab(page, `await s.jump('deadline'); s.tab('insurer');`);
  await expect(page.locator('.dash')).toBeVisible({ timeout: 20_000 });
  const tabs = page.locator('.ctrl-dock .sim-tabs [role=tab]');
  await expect(tabs).toHaveText(['Farmer', 'Officer', 'Explainer']);
  // far down the officer console, the switch is still on screen
  await page.evaluate(() => { const p = document.getElementById('st-panel')!; scrollTo(0, p.getBoundingClientRect().bottom + scrollY - 700); });
  await expect(tabs.first()).toBeInViewport();
  await tabs.first().click();
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  await titleOnScreen(page);
  const more = page.locator('.ctrl-dock .ctrl-more');
  await expect(more).toContainText('Moments');
  await more.click();
  await expect(page.locator('.ctrl-sheet')).toContainText('Jump to a moment');
  expect(errors).toEqual([]);
});

test('on a phone the process and radar switches are only in the dock’s sheet; a line above the phone says which are on and opens it (J9, S-10)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  await expect(page.locator('.sim-head .rails')).toBeHidden();
  const chip = page.locator('.sim-head .rail-chip');
  await expect(chip).toHaveText('Process: Relief assessment · Radar passes: Every 12 h (demo)');
  await chip.click();
  const sheet = page.locator('.ctrl-sheet');
  await expect(sheet).toContainText('No state is named.');
  await sheet.getByRole('radio', { name: 'PMFBY intimation' }).click();
  await page.keyboard.press('Escape');
  await expect(chip).toContainText('Process: PMFBY intimation');
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
