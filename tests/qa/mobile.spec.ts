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

test('an open sheet holds the page still, also when a sheet over it closes; a confirm is a short bottom sheet (UI-08, UI-14)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  await sab(page, `await s.jump('capture'); s.tab('farmer');`);
  await page.locator('.ctrl-dock .ctrl-more').click();
  await expect(page.locator('.ctrl-sheet')).toBeVisible();
  const y = await page.evaluate(() => scrollY);
  await page.mouse.move(180, 100);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => scrollY), 'the page behind the sheet did not scroll').toBe(y);
  // Reset with photos on the phone asks first, in a sheet over this one: short, at the bottom
  await page.locator('.ctrl-sheet button', { hasText: 'Reset' }).click();
  const ask = page.locator('.reset-ask');
  await expect(ask).toBeVisible();
  const a = await box(page, '.reset-ask');
  expect(a.height).toBeLessThan(640 * 0.75);
  expect(a.bottom).toBeGreaterThan(638);
  await ask.getByRole('button', { name: 'Keep what was captured' }).click();
  await expect(ask).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.classList.contains('sheet-open'))).toBe(false);
  expect(errors).toEqual([]);
});

test('nested sheets: closing the top one keeps the page locked for the one under it (UI-08)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  await sab(page, `await s.jump('deadline'); s.tab('insurer');`);
  await page.locator('.ctrl-dock .ctrl-more').click();
  await expect(page.locator('.ctrl-sheet')).toBeVisible();
  await sab(page, `s.settings(true);`);
  await expect(page.locator('.sheet')).toHaveCount(2);
  await page.keyboard.press('Escape');
  await expect(page.locator('.sheet')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.classList.contains('sheet-open'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('.sheet')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.classList.contains('sheet-open'))).toBe(false);
  expect(errors).toEqual([]);
});

test.describe('on a touch screen', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 360, height: 640 } });
  test('a tapped button keeps its own colour, not the hover one (UI-09)', async ({ page }) => {
    const errors: string[] = [];
    await open(page, V('360x640'), 'en', errors);
    expect(await page.evaluate(() => matchMedia('(hover: hover)').matches)).toBe(false);
    const cta = page.locator('#hero-cta');
    const before = await cta.evaluate((e) => getComputedStyle(e).backgroundColor);
    await cta.hover();
    expect(await cta.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(before);
    expect(errors).toEqual([]);
  });
});

test('typing in a field hides the bottom dock; leaving the field brings it back (R8)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  await sab(page, `await s.jump('capture'); await s.ensure('sealed'); s.seek(s.state().t + 0.3); s.tab('farmer'); s.screen('file');`);
  const input = page.locator('.farmer input.input');
  await input.focus();
  await expect(page.locator('.ctrl-dock')).toBeHidden();
  await input.blur();
  await expect(page.locator('.ctrl-dock')).toBeVisible();
  // the scrubber is an input too, but not a text field: using it keeps the dock
  await page.locator('.ctrl-dock input[type=range]').focus();
  await expect(page.locator('.ctrl-dock')).toBeVisible();
  expect(errors).toEqual([]);
});

test('turning a phone on its side keeps the farmer’s alert on screen, and the nav scrolls away instead of sticking (R7)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `await s.jump('alert'); s.tab('farmer');`);
  await page.bringToFront();
  await page.evaluate(() => document.querySelector('[data-tour=alert] .countdown')!.scrollIntoView({ block: 'center' }));
  await page.mouse.wheel(0, 1);
  // the page notes what is on screen once the scrolling has settled (a scroll event comes with a rendered frame)
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.waitForTimeout(400);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect.poll(async () => { const r = await box(page, '[data-tour=alert]'); return r.bottom > 0 && r.top < 390; }, { timeout: 5_000 }).toBe(true);
  expect(await page.locator('header.nav').evaluate((e) => getComputedStyle(e).position)).toBe('static');
  await expect(page.locator('.nav-cta')).toBeHidden();
  expect(errors).toEqual([]);
});

test('a helper capturing for a farmer keeps the farmer’s name in view: under the nav on a tall phone, on the photo card on a short one (H12)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `s.seek(20); await s.helper(1); s.active('P-05'); s.tab('farmer'); s.screen('capture');`);
  await page.evaluate(() => document.querySelector('.farmer .shots li:last-child')!.scrollIntoView({ block: 'end' }));
  const top = await box(page, '.farmer .f-top');
  const nav = await box(page, 'header.nav');
  expect(Math.abs(top.top - nav.bottom)).toBeLessThan(2);
  await expect(page.locator('.farmer .f-top')).toContainText('Mohinder Dhillon');
  // a short phone: no extra bar, the photo card says whose photo it is
  await page.setViewportSize({ width: 360, height: 640 });
  await sab(page, `s.active(null); s.screen('helper');`);
  await page.locator('[data-farmer="P-06"]').getByRole('button', { name: /Start/ }).click();
  const hold = page.locator('button.hold');
  await expect(page.locator('[data-consent-farmer]')).not.toHaveAttribute('lang', 'en');
  await hold.scrollIntoViewIfNeeded();
  const b = (await hold.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(2300);
  await page.mouse.up();
  await page.getByRole('button', { name: /Start photos/ }).click();
  await expect(page.locator('.farmer .shotcard .eyebrow')).toHaveText(/^Photo 1 of 3 · \S+/);
  expect(await page.locator('.farmer .f-top').evaluate((e) => getComputedStyle(e).position)).toBe('static');
  expect(errors).toEqual([]);
});

test('the feature-phone design and the pilot metrics are off the main path: folded in the helper screen, under the draft list in the console (S-11)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  await sab(page, `s.seek(20); s.tab('farmer'); s.screen('helper');`);
  await expect(page.locator('[data-fp-open]')).toHaveCount(1);
  await expect(page.locator('[data-fp-open]')).toBeHidden();
  await expect(page.locator('[data-fp-future] summary')).toHaveText('Future: a farmer with no smartphone?');
  await sab(page, `await s.jump('draft'); s.tab('insurer'); s.insurer('draft');`);
  await expect(page.locator('.draft')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.view-seg [role=radio]')).toHaveCount(3);
  await expect(page.locator('.impactp')).toBeAttached();
  expect(await page.evaluate(() => !!(document.querySelector('.draft')!.compareDocumentPosition(document.querySelector('.impactp')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  expect(errors).toEqual([]);
});

test('the farmer can see how the alert reached them and who registered the plot, both labelled simulated, under the main button (F11)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  await sab(page, `s.tab('farmer');`);
  await expect(page.locator('.farmer .facts')).toContainText('A CSC camp in the village (simulated)');
  await sab(page, `await s.jump('alert'); s.tab('farmer');`);
  const how = page.locator('[data-alert-how]');
  await expect(how).not.toHaveAttribute('open', '');
  expect((await box(page, '[data-alert-how]')).top).toBeGreaterThan((await box(page, '[data-tour=cta]')).bottom);
  await how.locator('summary').click();
  await expect(how).toContainText('no call is made and no SMS is sent');
  await expect(how).toContainText('(P-');
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
