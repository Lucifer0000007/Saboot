// Back and reload on a phone (workstream W7): Android Back closes the top sheet or the camera, then goes back one farmer
// screen or console view, before it leaves the site; a reload comes back to the tab, the view, the replay time, the farmer
// screen and the helper's farmer; a menu link leaves focus on the section heading it went to.
import { test, expect, type Page } from '@playwright/test';
import { ALL_VIEWPORTS, open } from './harness';

const V = (name: string) => ALL_VIEWPORTS.find((v) => v.name === name)!;

test('a menu link leaves focus on the heading of the section it went to, not on the menu button (UI-13)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  for (const [name, id] of [['How it works', 'how'], ['Honest limits', 'limits']]) {
    await page.locator('.nav-menu').click();
    await page.locator('.menu-sheet').getByRole('link', { name }).click();
    await expect(page.locator('.menu-sheet')).toHaveCount(0);
    await page.waitForTimeout(300);
    // the section's heading, or the section itself while its lazy part is still loading
    expect(await page.evaluate(() => document.activeElement?.closest('section')?.id), name).toBe(id);
  }
  // a sheet closed by its own button still hands focus back to the button that opened it
  await page.locator('.nav-menu').click();
  await page.locator('.menu-sheet').getByRole('button', { name: 'Close menu' }).click();
  await expect(page.locator('.nav-menu')).toBeFocused();
  expect(errors).toEqual([]);
});

const sab = (page: Page, js: string) => page.evaluate(`(async () => { const s = window.__sab; ${js} })()`);
const onSite = (page: Page) => page.url().startsWith('http://localhost');

test('Android Back closes the plot details, then goes back one view at a time, and only then leaves the site (R1, UI-03)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  const url = page.url();
  await sab(page, `await s.jump('deadline');`);
  await expect(page.locator('.farmer .f-nav [aria-current=page]')).toHaveText('Report');
  await sab(page, `s.tab('insurer');`);
  await page.waitForSelector('.dash .queue > li', { timeout: 20_000 });
  await page.locator('.queue > li .plink').first().click();
  await expect(page.locator('.drawer')).toBeVisible();
  await page.goBack();
  await expect(page.locator('.drawer'), 'Back closes the plot details').toHaveCount(0);
  expect(page.url(), 'and stays on the page, at the same address').toBe(url);
  await expect(page.locator('.dash'), 'the console is still open').toBeVisible();
  await page.goBack();
  await expect(page.locator('.farmer'), 'Back goes back to the farmer view').toBeVisible();
  await expect(page.locator('.farmer .f-nav [aria-current=page]')).toHaveText('Report');
  await page.goBack();
  await expect(page.locator('.farmer .f-nav [aria-current=page]'), 'then to the screen the visit started on, before the jump').toHaveText('Home');
  expect(onSite(page)).toBe(true);
  await page.goBack();
  expect(onSite(page), 'only now does Back leave the site').toBe(false);
  expect(errors).toEqual([]);
});

test('Back goes back one farmer screen; a sheet closed with its own button gives its Back step back (R1, UI-03)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  await sab(page, `s.seek(20); s.tab('farmer');`);
  const tabs = page.locator('.farmer .f-nav');
  await tabs.getByRole('button', { name: 'Photos' }).click();
  await tabs.getByRole('button', { name: 'Proof' }).click();
  await expect(tabs.locator('[aria-current=page]')).toHaveText('Proof');
  // Settings opened and closed by its X three times: no step is left behind for Back to walk through
  for (let i = 0; i < 3; i++) {
    await page.locator('.farmer [data-tour=settings]').click();
    await expect(page.locator('.set-sheet')).toBeVisible();
    await page.locator('.set-sheet .sheet-head').getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('.set-sheet')).toHaveCount(0);
  }
  // Back with Settings open closes it, and focus goes back to the gear that opened it
  await page.locator('.farmer [data-tour=settings]').click();
  await expect(page.locator('.set-sheet')).toBeVisible();
  await page.goBack();
  await expect(page.locator('.set-sheet')).toHaveCount(0);
  await expect(page.locator('.farmer [data-tour=settings]')).toBeFocused();
  await page.goBack();
  await expect(tabs.locator('[aria-current=page]')).toHaveText('Photos');
  await page.goBack();
  await expect(tabs.locator('[aria-current=page]')).toHaveText('Home');
  // tapping a tab already on the way back drops the steps after it: Home, Photos, Home is one step, not two
  await tabs.getByRole('button', { name: 'Photos' }).click();
  await tabs.getByRole('button', { name: 'Home' }).click();
  await page.goBack();
  expect(onSite(page)).toBe(false);
  expect(errors).toEqual([]);
});

test('Back from a farmer a helper has open returns to the helper’s queue (R1, UI-03)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `s.seek(20); await s.helper(0); s.tab('farmer'); s.screen('helper');`);
  await page.locator('[data-farmer="P-05"]').getByRole('button', { name: /Start/ }).click();
  await expect(page.locator('.farmer .f-title')).toHaveText('Consent from Mohinder Dhillon');
  await page.goBack();
  await expect(page.locator('[data-helper-screen]')).toBeVisible();
  await expect(page.locator('[data-helper-bar]')).toHaveCount(0);
  expect(onSite(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('Android Back closes the tour, as Skip does, and stays on the site (R1)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `s.tour(0);`);
  await expect(page.locator('.tour')).toBeVisible();
  await page.goBack();
  await expect(page.locator('.tour')).toHaveCount(0);
  expect(onSite(page)).toBe(true);
  expect(errors).toEqual([]);
});

const logs = (page: Page) => page.evaluate('window.__sab.logs()') as Promise<Record<string, { events: number; head: string | null; consentFarmer: string | null }>>;
const ready = async (page: Page) => {
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await page.evaluate('window.__sab.ready()');
};

test('a reload mid-capture, or the page opened again, returns to the helper’s farmer with the consent intact (H4)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `s.seek(20); s.tab('farmer'); s.screen('home');`);
  await page.locator('[data-helper-card]').getByRole('button', { name: /Open helper mode/ }).click();
  await page.getByLabel('Your name').fill('Test Helper');
  await page.getByRole('radio', { name: 'Sarpanch' }).check();
  await page.getByRole('button', { name: /Start helper session/ }).click();
  await page.locator('[data-farmer="P-05"]').getByRole('button', { name: /Start/ }).click();
  await expect(page.locator('[data-consent-farmer]')).not.toHaveAttribute('lang', 'en');
  const hold = page.locator('button.hold');
  await hold.scrollIntoViewIfNeeded();
  const b = (await hold.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(2300);
  await page.mouse.up();
  await expect(page.locator('.farmer')).toContainText('Consent recorded at', { timeout: 10_000 });
  await page.getByRole('button', { name: /Start photos/ }).click();
  await page.getByRole('button', { name: /Use simulated photo/ }).click();
  await expect(page.locator('.shots li')).toHaveCount(1, { timeout: 10_000 });
  const before = (await logs(page))['P-05'];
  // the reload a phone does when it dropped the page for its camera app, and the page opened again from the home screen
  for (const how of ['reload', 'open again']) {
    if (how === 'reload') await page.reload(); else await page.goto('/');
    await ready(page);
    await expect(page.locator('[data-helper-bar]'), how).toContainText('Capturing for Mohinder Dhillon (P-05)', { timeout: 20_000 });
    await expect(page.locator('.shots li'), how).toHaveCount(1);
    await expect(page.locator('.farmer .f-title'), how).not.toHaveText(/Consent from/);
    const after = (await logs(page))['P-05'];
    expect(after.head, how).toBe(before.head);
    expect(after.consentFarmer, how).toBe('Mohinder Dhillon');
  }
  // back on the queue, a reload stays on the queue
  await page.getByRole('button', { name: /Back to the queue|Back to queue/ }).click();
  await expect(page.locator('[data-helper-screen]')).toBeVisible();
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-helper-screen]')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[data-helper-bar]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
