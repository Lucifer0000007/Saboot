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
  await expect(page.locator('.view-seg [role=radio]')).toHaveText([/Map & worklist/, /Draft list/, /Tamper check/, /Pilot metrics/]);
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

test('one tamper check in the console: the real packet and the audit ledger in one view, no Ledger tab; old ledger links land there (S-05)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await expect(page.locator('#st-ledger')).toHaveCount(0);
  await expect(page.locator('.sim-tabs [role=tab]')).toHaveCount(3);
  await sab(page, `await s.jump('deadline'); s.tab('insurer'); s.insurer('ledger');`);
  const view = page.locator('.tcheck');
  await expect(view.locator('[data-tc-packet]')).toContainText('Try a changed copy', { timeout: 20_000 });
  await expect(view.locator('.ledger .lg-table tbody tr').first()).toBeVisible({ timeout: 20_000 });
  // nothing imported yet: the packet card opens the import sheet
  await view.locator('[data-tc-packet] button', { hasText: 'Import evidence' }).click();
  await expect(page.locator('.import-sheet')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.goto('/?tab=ledger');
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await page.evaluate('window.__sab.ready()');
  await expect(page.locator('.tcheck')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[data-view-bar] [aria-checked=true]')).toHaveText(/Tamper check/);
  // the chosen view is scrolled into the sideways bar, and only the figures' own view carries the figures
  const bar = (await page.locator('[data-view-bar]').boundingBox())!, on = (await page.locator('[data-view-bar] [aria-checked=true]').boundingBox())!;
  expect(on.x).toBeGreaterThanOrEqual(bar.x - 1);
  expect(on.x + on.width).toBeLessThanOrEqual(bar.x + bar.width + 1);
  await expect(page.locator('.dash .kpis')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('ledger on a phone: no scroll box inside the page, the latest 20 then older ones, a plot and a kind filter; the chain is still verified whole (OF-14, UI-12)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `await s.jump('deadline'); s.tab('ledger');`);
  const rows = page.locator('.lg-table tbody tr');
  await expect(rows.first()).toBeVisible({ timeout: 20_000 });
  const box = await page.locator('.lg-scroll').evaluate((e) => ({ oy: getComputedStyle(e).overflowY, mh: getComputedStyle(e).maxHeight }));
  expect(box).toEqual({ oy: 'visible', mh: 'none' });
  await expect(rows).toHaveCount(20);
  const total = Number((await page.locator('#lg-h .cnt').textContent()) ?? 0);
  expect(total).toBeGreaterThan(40);
  await page.locator('[data-lg-older]').click();
  await expect(rows).toHaveCount(40);
  // one plot's trail, then one kind of record
  await page.locator('[data-lg-plot]').selectOption('P-04');
  expect((await rows.locator('td[data-l=Record]').allTextContents()).every((x) => x.includes('P-04'))).toBe(true);
  await page.locator('[data-lg-plot]').selectOption('');
  await page.locator('[data-lg-type]').selectOption('VOICE_ALERT_DELIVERED');
  expect((await rows.locator('td[data-l=Record] strong').allTextContents()).every((x) => x === 'VOICE_ALERT_DELIVERED')).toBe(true);
  await page.getByRole('button', { name: /Verify integrity/ }).click();
  await expect(page.locator('.lg-status .note-ok')).toContainText(`Chain intact — ${total} records`);
  // the drawer's link opens the ledger on that plot
  await sab(page, `s.insurer('claims'); s.plot('P-04');`);
  await page.locator('.drawer [data-plot-ledger]').click();
  await expect(page.locator('[data-lg-plot]')).toHaveValue('P-04');
  await expect(page.locator('.ledger')).toBeInViewport();
  expect(errors).toEqual([]);
});

test('after the tamper test the verdict is on screen, with that plot\'s trail and the changed record under it (OF-02)', async ({ page }) => {
  for (const v of [V('390x844'), V('1440x900')]) {
    const errors: string[] = [];
    await open(page, v, 'en', errors);
    await sab(page, `await s.jump('deadline'); s.tab('ledger');`);
    await expect(page.locator('.lg-table tbody tr').first()).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(400);
    await page.locator('button.tamper-btn').click();
    const verdict = page.locator('.lg-status .note-bad');
    await expect(verdict).toContainText(/Integrity failure at record #\d+/, { timeout: 10_000 });
    await expect(verdict).toBeInViewport({ ratio: 1, timeout: 5_000 });
    await page.locator('[data-show-changed]').click();
    await expect(page.locator('.lg-table tr.tampered')).toBeInViewport({ timeout: 5_000 });
    expect(errors).toEqual([]);
  }
});

/** A sealed packet's code from this browser's own demo farmer (simulated photos), then a fresh load of it as a #k= link. */
async function importOwnPacket(page: Page) {
  await sab(page, `await s.jump('capture'); await s.ensure('sealed'); s.seek(s.state().t + 0.3);`);
  const code = (await page.evaluate('window.__sab.kcode()')) as string;
  await page.goto('/?via=w4#k=' + code);
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await page.evaluate('window.__sab.ready()');
  await expect(page.locator('.k-result .note-ok')).toBeVisible({ timeout: 20_000 });
  await page.locator('.import-sheet button', { hasText: 'Add to dashboard' }).click();
  return code;
}

test('an imported packet opens its own record, verified again, not the simulated plot; the simulated record is a separate link (OF-01)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await importOwnPacket(page);
  await page.locator('.import-sheet [data-open-imported]').click();
  const d = page.locator('.imp-drawer');
  await expect(d).toContainText('P-04 · imported packet');
  await expect(d.locator('[data-imp-verdict]')).toContainText('Integrity verified: not altered since sealing.', { timeout: 20_000 });
  await expect(d.locator('[data-k-shot]')).toHaveCount(3);
  await expect(d).toContainText('Chain head');
  await expect(d).toContainText('Simulated cohort record');
  await expect(d).not.toContainText('Evidence assembled');
  await page.keyboard.press('Escape');
  // from the worklist: the imported row and the cohort row have different names and open different records
  await sab(page, `s.tab('insurer'); s.insurer('claims');`);
  await page.getByRole('button', { name: /^P-04 · imported packet/ }).click();
  await expect(page.locator('.imp-drawer')).toBeVisible();
  await page.locator('.imp-drawer [data-open-cohort]').click();
  await expect(page.locator('.imp-drawer')).toHaveCount(0);
  await expect(page.locator('.drawer')).toContainText('Simulated plot');
  expect(errors).toEqual([]);
});
