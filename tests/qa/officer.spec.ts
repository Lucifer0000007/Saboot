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

test('objections: the Draft list moment already shows one, a filter lists them oldest first, a closed window with no response is flagged, and the officer can note that a response came (OF-05)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `await s.jump('draft'); s.tab('insurer'); s.insurer('draft');`);
  const filter = page.locator('[data-obj-filter]');
  await expect(filter).toContainText('Objections (1)', { timeout: 20_000 });
  await expect(page.locator('[data-list-state]')).toHaveAttribute('data-list-state', 'published');
  // after the window: every scripted objection, oldest first; the unanswered ones are flagged
  await sab(page, `s.seek(150);`);
  await filter.click();
  await expect(filter).toHaveAttribute('aria-pressed', 'true');
  const rows = page.locator('.dtable tbody tr');
  const n = await rows.count();
  expect(n).toBeGreaterThan(2);
  const filed = await rows.locator('td[data-l=Objection] .obj-l:first-child .num').allTextContents();
  expect(filed.length).toBe(n);
  const flagged = page.locator('.dtable [data-obj-overdue]');
  const k = await flagged.count();
  expect(k).toBeGreaterThan(0);
  await expect(flagged.first()).toHaveText('Window closed, no response noted');
  // noting a response records only that it came, labelled as entered by hand, and it survives a reload
  const first = rows.filter({ has: page.locator('[data-obj-overdue]') }).first();
  const plot = ((await first.locator('.plink').textContent()) ?? '').trim().split(' ')[0];
  const row = rows.filter({ has: page.getByRole('button', { name: new RegExp(`Open ${plot} details`) }) });
  await row.locator('[data-note-response]').click();
  await expect(row).toContainText('Response noted');
  await expect(row.locator('[data-prov=hand]')).toBeVisible();
  await expect(page.locator('.dtable [data-obj-overdue]')).toHaveCount(k - 1);
  await page.reload();
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await page.evaluate('window.__sab.ready()');
  await sab(page, `s.seek(150); s.tab('insurer'); s.insurer('draft');`);
  const again = page.locator('.dtable tbody tr', { has: page.getByRole('button', { name: new RegExp(`Open ${plot} details`) }) });
  await expect(again.locator('[data-prov=hand]')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.draft')).not.toContainText(/approved|accepted|rejected|upheld|resolved|granted|dismissed/i);
  expect(errors).toEqual([]);
});

test('an officer link lands on a moment with something to show, on the console itself; ?at=draft works; an empty console offers moments (OF-07, J5)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?tab=insurer');
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await page.evaluate('window.__sab.ready()');
  await expect(page.locator('.kpis li').first().locator('strong')).not.toHaveText('0', { timeout: 20_000 });
  const landed = ((await page.evaluate('window.__sab.state()')) as { t: number }).t;
  expect(landed).toBeGreaterThan(0);
  await expect.poll(async () => (await page.locator('.sim-tabs').boundingBox())!.y, { timeout: 5_000 }).toBeLessThan(200);
  // a visitor whose stored log set the clock keeps it (the clock goes to their last event, before that moment)
  await page.goto('/?tab=insurer&via=again');
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await page.evaluate('window.__sab.ready()');
  expect(((await page.evaluate('window.__sab.state()')) as { t: number }).t).toBeLessThan(landed);
  await page.goto('/?at=draft');
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await page.evaluate('window.__sab.ready()');
  await expect(page.locator('.ctrl .ctrl-time strong').first()).not.toHaveText('T+0h');
  await page.evaluate(`(async () => { const s = window.__sab; s.seek(0); s.tab('insurer'); s.insurer('claims'); })()`);
  const card = page.locator('[data-t0]');
  await expect(card).toContainText('No plot has been alerted yet');
  await card.locator('[data-t0-jump=deadline]').click();
  await expect(card).toHaveCount(0);
  await expect(page.locator('.queue > li').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('map on a phone: opens a step in on the demo village so plots are at least 20 px, a tap just outside a plot still opens it, and a hint points to the list (OF-10, UI-11)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `await s.jump('deadline'); s.tab('insurer');`);
  const svg = page.locator('.map .map-frame > svg');
  await expect(svg).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.map figcaption')).toContainText('every plot is also in the list below');
  await svg.scrollIntoViewIfNeeded();
  const sizes = await page.evaluate(() => {
    const f = document.querySelector('.map .map-frame > svg')!.getBoundingClientRect();
    return [...document.querySelectorAll('.map .plot polygon')].map((p) => p.getBoundingClientRect())
      .filter((r) => r.left >= f.left && r.right <= f.right && r.top >= f.top && r.bottom <= f.bottom)
      .map((r) => Math.min(r.width, r.height));
  });
  expect(sizes.length).toBeGreaterThan(3);
  // the drawn plot is at least 20 px; its invisible edge adds 14 px on every side that no other plot covers
  expect(Math.min(...sizes)).toBeGreaterThanOrEqual(20);
  // a point 6 px outside some plot that no plot covers lands on that plot's wider edge
  const spot = await page.evaluate(() => {
    for (const p of document.querySelectorAll<SVGPolygonElement>('.map .plot polygon')) {
      const r = p.getBoundingClientRect();
      for (const [x, y] of [[r.left - 6, r.top + r.height / 2], [r.right + 6, r.top + r.height / 2], [r.left + r.width / 2, r.bottom + 6]]) {
        const hit = document.elementFromPoint(x, y);
        if (hit?.classList.contains('plot-hit')) return { x, y, id: hit.getAttribute('data-plot') };
      }
    }
    return null;
  });
  expect(spot).not.toBeNull();
  await page.mouse.click(spot!.x, spot!.y);
  await expect(page.locator('.drawer .sheet-head')).toContainText(spot!.id!);
  expect(errors).toEqual([]);
});
