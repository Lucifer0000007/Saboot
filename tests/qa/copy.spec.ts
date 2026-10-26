// Copy and honesty on the built site (audit W1-copy): each screen names the real actor, a relief farmer is not told about a
// claim, and every range and time says where it comes from.
import { test, expect, type Page } from '@playwright/test';
import { ALL_VIEWPORTS, open } from './harness';

const V = (name: string) => ALL_VIEWPORTS.find((v) => v.name === name)!;
const sab = (page: Page, js: string) => page.evaluate(`(async () => { const s = window.__sab; ${js} })()`);

test('the farmer status screen says Evidence status on the relief rail and Claim status only on PMFBY', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  await sab(page, `await s.jump('draft'); s.tab('farmer'); s.screen('status');`);
  const title = page.locator('.farmer .f-title');
  await expect(title).toHaveText('Evidence status');
  await expect(page.locator('.farmer')).not.toContainText('Claim status');
  await sab(page, `s.rail('pmfby'); await s.jump('confirm'); s.tab('farmer'); s.screen('status');`);
  await expect(title).toHaveText('Claim status');
  expect(errors).toEqual([]);
});

test('after the relief advice window passes, the alert says when it ended, not "Best to capture within"', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  await sab(page, `await s.jump('alert'); s.tab('farmer'); s.screen(null);`);
  const label = page.locator('[data-tour=alert] .clock-label');
  await expect(label).toHaveText('Best to capture within');
  await sab(page, `s.seek(90);`);
  await expect(label).toHaveText('Capture-soon advice');
  await expect(page.locator('[data-tour=alert] .count')).toHaveText(/^ended \S+ \d+ \S+, \d\d:\d\d$/);
  await expect(page.locator('[data-tour=alert]')).not.toContainText('the advice window has passed');
  expect(errors).toEqual([]);
});

test('the Proof screen names the plot in words, keeps coordinates and the data file in the technical details', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  await sab(page, `await s.jump('capture'); await s.ensure('sealed'); s.tab('farmer'); s.seek(s.state().t + 0.2); s.screen('packet');`);
  const loc = page.locator('[data-pk-loc] dd');
  await expect(loc).toContainText(/At plot P-\d+ · Simulated location/);
  await expect(loc).not.toContainText(/\d+\.\d{4}/);
  await expect(page.locator('[data-pk-coords]')).toBeHidden();
  await expect(page.locator('[data-pk-coords] .num')).toHaveText(/^\d+\.\d{5}, \d+\.\d{5}$/);
  await expect(page.locator('[data-pk-coords] [data-v="loc"][data-prov="sim"]')).toHaveCount(1);
  await page.locator('[data-tour=share] button').click();
  await expect(page.locator('.share-sheet .qr')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.share-sheet [data-export-bundle]')).toBeHidden();
  await page.locator('.share-sheet details.k-code summary').click();
  await expect(page.locator('.share-sheet [data-export-bundle]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('the farmer reads out an 8-digit check code, and the officer drawer shows the same code', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `await s.jump('capture'); await s.ensure('sealed'); s.seek(s.state().t + 0.3); s.tab('farmer'); s.screen('file');`);
  const row = page.locator('.summary .facts div', { hasText: 'Check code' }).locator('dd');
  await expect(row).toHaveText(/^\d{4} \d{4}$/);
  const code = (await row.textContent())!;
  await expect(page.locator('.howto')).toContainText('read out your check code');
  await sab(page, `s.tab('insurer'); s.plot('P-04');`);
  await expect(page.locator('.drawer [data-check-code] strong')).toHaveText(code, { timeout: 20_000 });
  expect(errors).toEqual([]);
});

test('each photo row tags its replay-clock time as simulated', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  await sab(page, `await s.jump('capture'); s.tab('farmer'); s.screen('capture');`);
  const rows = page.locator('.shots li');
  await expect(rows).toHaveCount(3, { timeout: 20_000 });
  await expect(rows.locator('[data-v="time"][data-prov="sim"]')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('the draft list and the drawer show the flooded share as a range inside 0-100%', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `await s.jump('draft'); s.tab('insurer'); s.insurer('draft');`);
  const cells = page.locator('.draft td[data-l="Flooded share"]');
  await expect(cells.first()).toBeVisible({ timeout: 20_000 });
  const texts = await cells.allTextContents();
  expect(texts.join(' ')).not.toContain('±');
  for (const m of texts.join(' ').matchAll(/(\d+)–(\d+)%/g)) {
    expect(Number(m[1])).toBeGreaterThanOrEqual(0);
    expect(Number(m[2])).toBeLessThanOrEqual(100);
    expect(Number(m[1])).toBeLessThanOrEqual(Number(m[2]));
  }
  expect(texts.join(' ')).toMatch(/\d+–100%/);
  await sab(page, `s.plot('P-04');`);
  await expect(page.locator('.drawer [data-share]')).toContainText(/flooded share now: \d+–\d+%, about \d+%/);
  expect(errors).toEqual([]);
});

test('review priority says it is a sort key and points to the evidence band for its uncertainty', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `await s.jump('deadline'); s.tab('insurer');`);
  await expect(page.locator('[data-pri-note]')).toContainText('sort key for review order, not a measurement', { timeout: 20_000 });
  await sab(page, `s.insurer('triage');`);
  await expect(page.locator('.triage').first().locator('p.muted').first()).toContainText('Priority is a sort key from fixed rules, not a measurement');
  expect(errors).toEqual([]);
});

test('the officer console marks the demo farmer as the demo phone, not as "Your farmer" or "You"', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `await s.jump('draft'); s.tab('insurer'); s.insurer('draft');`);
  await expect(page.locator('.draft .tag.you')).toHaveText('Demo phone', { timeout: 20_000 });
  await sab(page, `s.plot('P-04');`);
  await expect(page.locator('.drawer .tag.you')).toHaveText('Demo phone');
  expect(errors).toEqual([]);
});

test('the last pipeline step is named after its lane: Department decides on relief, Officer decision on PMFBY', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('1440x900'), 'en', errors);
  await sab(page, `await s.jump('confirm'); s.tab('insurer');`);
  const last = page.locator('.pipe .pipe-node.outside').first();
  await expect(last.locator('.pipe-who')).toHaveText('Department', { timeout: 20_000 });
  await expect(last.locator('.pipe-pill')).toHaveText('Department decides');
  await sab(page, `s.rail('pmfby');`);
  await expect(last.locator('.pipe-who')).toHaveText('Officer');
  await expect(last.locator('.pipe-pill')).toHaveText('Officer decision');
  expect(errors).toEqual([]);
});

test('How it works: simulated rows use the Simulated icon, and the status words are defined above the table', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await page.locator('#how').scrollIntoViewIfNeeded();
  const key = page.locator('[data-rs-key]');
  await expect(key).toContainText('Real: code that runs in your browser', { timeout: 20_000 });
  // the Simulated icon in the table is the one the Simulated provenance tag uses
  const tagIcon = await page.locator('.hero-labels .tag-prov-sim svg').first().innerHTML();
  const simCells = page.locator('.rs-table td', { hasText: /^Simulated$/ });
  expect(await simCells.count()).toBeGreaterThan(3);
  expect(await simCells.first().locator('svg').innerHTML()).toBe(tagIcon);
  expect(errors).toEqual([]);
});

test('the landing interview card shows the strip, folds the list away, links the list, and names the next state', async ({ page }) => {
  const { fieldCounts, TARGET_STATE } = await import('../../src/data/fieldEvidence');
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  const card = page.locator('[data-field-people]');
  await card.scrollIntoViewIfNeeded();
  await expect(card).not.toContainText('docs/INTERVIEWS.md');
  await expect(card.locator('.fp-list')).toBeHidden();
  if (fieldCounts().inTargetState === 0) await expect(card.locator('[data-fp-note]')).toContainText(`Next: interviews in ${TARGET_STATE}.`);
  await card.locator('[data-fp-more] summary').click();
  await expect(card.locator('.fp-list')).toBeVisible();
  await expect(card.locator('[data-fp-more] a')).toHaveAttribute('href', /\/blob\/main\/docs\/INTERVIEWS\.md$/);
  expect(errors).toEqual([]);
});
