// The officer console on a phone and a laptop (audit workstream W4): the card tables, the one ranked worklist, the tamper
// check, the imported packet's own record, objections, the deep link, the map's tap targets and the import sheet.
import { test, expect, type Page } from '@playwright/test';
import { ALL_VIEWPORTS, open } from './harness';

const V = (name: string) => ALL_VIEWPORTS.find((v) => v.name === name)!;
const sab = (page: Page, js: string) => page.evaluate(`(async () => { const s = window.__sab; ${js} })()`);

test('card tables on a phone: a label that wraps to two lines makes its cell taller instead of running into the next row (OF-08, J17)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `s.seek(168); s.tab('insurer'); s.insurer('impact');`);
  const cells = page.locator('.impactp .rtable td[data-l]');
  await expect(cells.first()).toBeVisible({ timeout: 20_000 });
  const bad = await cells.evaluateAll((els) => els.flatMap((td) => {
    const label = parseFloat(getComputedStyle(td, '::before').height) || 0;
    const cs = getComputedStyle(td);
    const inner = td.getBoundingClientRect().height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    return label > inner + 1 ? [`${td.getAttribute('data-l')}: label ${label} px in a ${inner} px cell`] : [];
  }));
  expect(bad).toEqual([]);
  expect(errors).toEqual([]);
});

test('one ranked worklist under the map: no second list view, compact rows on a phone, the first ten then "Show all" (OF-04, J7, J8, S-03, S-04)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `await s.jump('deadline'); s.tab('insurer');`);
  await expect(page.locator('.claims .queue li').first()).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.view-seg [role=radio]')).toHaveText([/Map & worklist/, /Draft list/, /Pilot metrics/]);
  const rows = page.locator('.queue > li');
  await expect(rows).toHaveCount(10);
  const tallest = Math.max(...(await rows.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))));
  expect(tallest, 'a plot row stays compact').toBeLessThan(260);
  // the reasons and the assignment are folded into the row; the village summary is folded above the list
  await expect(rows.first().locator('details.qwhy [data-why] .why-i')).toHaveCount(4);
  await expect(page.locator('details.vsum')).not.toHaveAttribute('open', '');
  const all = page.locator('[data-show-all]');
  const n = Number((await page.locator('#plist-h .cnt').textContent()) ?? 0);
  await expect(all).toHaveText(`Show all ${n} plots`);
  await all.click();
  await expect(rows).toHaveCount(n);
  // the old worklist name still opens the merged view
  await sab(page, `s.insurer('draft'); s.insurer('triage');`);
  await expect(page.locator('.claims .queue')).toBeVisible();
  expect(errors).toEqual([]);
});

test('the console views stay in reach: the view bar sticks under the nav while the list scrolls, on a phone and a laptop (OF-03)', async ({ page }) => {
  for (const v of [V('360x640'), V('1440x900')]) {
    const errors: string[] = [];
    await open(page, v, 'en', errors);
    await sab(page, `await s.jump('deadline'); s.tab('insurer');`);
    const bar = page.locator('[data-view-bar]');
    await expect(bar).toBeVisible({ timeout: 20_000 });
    await page.locator('.queue > li').nth(6).scrollIntoViewIfNeeded();
    await page.evaluate(() => scrollBy(0, 200));
    const box = (await bar.boundingBox())!;
    const nav = (await page.locator('header.nav').boundingBox())!;
    expect(box.y, v.name).toBeGreaterThanOrEqual(nav.y + nav.height - 1);
    expect(box.y + box.height, v.name).toBeLessThan(v.height / 2);
    await bar.getByRole('radio', { name: /Draft list/ }).click();
    await expect(page.locator('.draft')).toBeVisible();
    expect(errors).toEqual([]);
  }
});

test('field-staff assignments survive a reload, show on the row and in the drawer, and the replay reset clears them (OF-13)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('1280x800'), 'en', errors);
  await sab(page, `await s.jump('deadline'); s.tab('insurer');`);
  const row = page.locator('.queue > li').first();
  await expect(row).toBeVisible({ timeout: 20_000 });
  const id = ((await row.locator('.plink').textContent()) ?? '').split(' ')[0];
  await row.locator('summary').click();
  await row.locator('.assign select').selectOption({ label: 'Inspector B (Dhanpura–Sarangwal)' });
  await expect(row.locator('[data-assigned]')).toHaveText(/Inspector B/);
  await page.reload();
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await page.evaluate('window.__sab.ready()');
  await sab(page, `await s.jump('deadline'); s.tab('insurer');`);
  const again = page.locator('.queue > li', { has: page.getByRole('button', { name: new RegExp('^' + id + ' ') }) });
  await expect(again.locator('[data-assigned]')).toHaveText(/Inspector B/, { timeout: 20_000 });
  await sab(page, `s.plot('${id}');`);
  await expect(page.locator('.drawer [data-assigned]')).toContainText('Field visit: Inspector B');
  await sab(page, `s.plot(null);`);
  await page.getByRole('button', { name: /^Reset/ }).first().click();
  // the demo farmer's log holds the jump's evidence, so the reset asks first
  await page.locator('[data-reset-yes]').click();
  await sab(page, `await s.jump('deadline'); s.tab('insurer');`);
  await expect(page.locator('.queue [data-assigned]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
