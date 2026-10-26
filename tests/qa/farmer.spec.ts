// The farmer app's structure and the judge tour on a phone (workstream W5): four honest tabs, the farmer's own draft-list
// entry, voice that says why it is silent, a short explainer and How it works, and a tour that never covers what it shows.
import { test, expect, type Page } from '@playwright/test';
import { ALL_VIEWPORTS, open } from './harness';

const V = (name: string) => ALL_VIEWPORTS.find((v) => v.name === name)!;
const sab = (page: Page, js: string) => page.evaluate(`(async () => { const s = window.__sab; ${js} })()`);

test('the farmer app has four tabs: Proof holds the QR code, Report holds the steps and then the status', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  await sab(page, `await s.jump('capture'); await s.ensure('sealed'); s.seek(s.state().t + 0.3); s.tab('farmer'); s.screen('packet');`);
  const tabs = page.locator('.farmer .f-nav button');
  await expect(tabs).toHaveText(['Home', 'Photos', 'Proof', 'Report']);
  await expect(page.locator('.farmer [data-tour=share]')).toBeVisible();
  // the Proof screen's next step opens the Report tab, which starts with how to report and the receipt field
  await page.locator('.farmer .pill-primary', { hasText: 'Next: report the loss' }).click();
  await expect(page.locator('.farmer .f-title')).toHaveText('Report the loss');
  await expect(tabs.nth(3)).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.farmer .howto li')).toHaveCount(4);
  await expect(page.locator('.farmer [data-tour=share]')).toHaveCount(0);
  await page.locator('.farmer input.input').fill('KR-2026-1234');
  await page.locator('.farmer button[type=submit]').click();
  // once saved, the status comes first and the details fold away underneath
  await expect(page.locator('.farmer .f-title')).toHaveText('Evidence status');
  await expect(page.locator('.farmer .note-ok').first()).toContainText('KR-2026-1234');
  await expect(page.locator('.farmer [data-report-details]')).not.toHaveAttribute('open', '');
  expect(errors).toEqual([]);
});

test('the objection card shows the farmer their own draft-list entry, labelled simulated, before asking right or wrong', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  await sab(page, `await s.jump('draft'); s.tab('farmer'); s.screen('status');`);
  const card = page.locator('.ob-card');
  await expect(card).toHaveAttribute('data-objection', 'open', { timeout: 20_000 });
  const entry = card.locator('[data-my-entry]');
  await expect(entry).toBeVisible({ timeout: 20_000 });
  await expect(entry.locator('[data-prov=sim]')).toBeVisible();
  await expect(entry).toContainText(/Plot P-\d+ is (not )?on the list\./);
  await expect(entry).not.toContainText(/₹|Rs\.?\s?\d|rupee|amount|eligib|approved|rejected/i);
  // "Looks right" records nothing and leaves the evidence one tap away
  const before = await page.evaluate('JSON.stringify(window.__sab.logs())');
  await card.getByRole('button', { name: 'Looks right' }).click();
  await expect(card.locator('[data-ob-right]')).toContainText('You do not need to do anything');
  expect(await page.evaluate('JSON.stringify(window.__sab.logs())')).toBe(before);
  await expect(card.getByRole('button', { name: 'Looks wrong: attach my evidence' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('with no Hindi voice on the phone, the alert says why it is silent and how to get a voice; no online voice is used', async ({ page }) => {
  const errors: string[] = [];
  // the phone offers only an online Hindi voice: it must not be used
  await page.addInitScript(() => {
    const remote = { lang: 'hi-IN', localService: false, name: 'Online Hindi', voiceURI: 'x', default: true };
    const spoken: unknown[] = [];
    (window as unknown as { __spoken: unknown[] }).__spoken = spoken;
    speechSynthesis.getVoices = () => [remote as unknown as SpeechSynthesisVoice];
    speechSynthesis.speak = (u) => { spoken.push(u); };
  });
  await open(page, V('360x640'), 'hi', errors);
  await sab(page, `await s.jump('alert'); s.tab('farmer'); s.screen('home');`);
  await page.locator('.farmer .voice-btn').first().click();
  const na = page.locator('.farmer [data-voice-na]').first();
  await expect(na).toContainText('हिन्दी');
  await expect(na).toContainText('सिमुलेटेड');
  expect(await page.evaluate('window.__spoken.length')).toBe(0);
  expect(errors).toEqual([]);
});

test('on a phone the explainer gives one line per rule and reaches the rain chart within its first screen; the full rules fold away', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  await sab(page, `s.tab('explainer'); await s.jump('trigger');`);
  await expect(page.locator('.explainer .rules-short li')).toHaveCount(4);
  const more = page.locator('.explainer [data-rules-more]');
  await expect(more).not.toHaveAttribute('open', '');
  const gap = await page.evaluate(() => document.querySelector('#x-rain')!.getBoundingClientRect().top - document.querySelector('.explainer')!.getBoundingClientRect().top);
  expect(gap).toBeLessThan(640);
  await more.locator('summary').click();
  await expect(more).toContainText('Rule A, rain + terrain');
  expect(errors).toEqual([]);
});

test('How it works on a phone is the five steps, two notes and the replay; the diagram and the real-vs-simulated table fold away', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  await page.locator('#how').scrollIntoViewIfNeeded();
  const arch = page.locator('#how [data-how-arch]'), rs = page.locator('#how [data-how-rs]');
  await expect(arch).toHaveCount(1, { timeout: 20_000 });
  await expect(arch).not.toHaveAttribute('open', '');
  await expect(rs).not.toHaveAttribute('open', '');
  // it was about 7,800 px (audit S-09)
  expect(await page.evaluate(() => document.getElementById('how')!.getBoundingClientRect().height)).toBeLessThan(2600);
  await rs.locator('summary').click();
  await expect(rs.locator('.rs-table')).toBeVisible();
  await arch.locator('summary').click();
  await expect(arch.locator('[data-node=pk]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('the tour spotlight keeps tracking its target after ten seconds and a scroll', async ({ page }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `s.tour(2);`);
  await page.locator('.tour-card').waitFor();
  await page.locator('.tour-actions button[aria-pressed]').click(); // pause
  await page.waitForTimeout(11_000);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(600);
  const [spot, target] = await page.evaluate(() => [
    document.querySelector('.spot')!.getBoundingClientRect().top,
    document.querySelector('[data-tour=alert] .countdown')!.getBoundingClientRect().top,
  ]);
  expect(Math.abs(spot + 6 - target)).toBeLessThan(3);
  expect(errors).toEqual([]);
});

test('with the menu open over the tour, Escape closes the menu and the tour stays and holds its step', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `s.tour(0);`);
  await page.locator('.tour-card').waitFor();
  await page.evaluate(() => (document.querySelector('.nav-menu') as HTMLButtonElement).click());
  await expect(page.locator('.menu-sheet')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.menu-sheet')).toHaveCount(0);
  await expect(page.locator('.tour-card')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.tour-card')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('on a 360 px phone every tour step shows its spotlight above the card, and the card keeps its buttons in view', async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  await sab(page, `s.tour(0);`);
  const card = page.locator('.tour-card');
  await card.waitFor();
  const total = Number((await page.locator('.tour-top .eyebrow').textContent())!.match(/\/ (\d+)/)![1]);
  for (let i = 0; i < total; i++) {
    await sab(page, `s.tour(${i});`);
    await expect(page.locator('.tour-top .eyebrow')).toContainText(`${i + 1} / ${total}`);
    await page.waitForTimeout(2200);
    const m = await page.evaluate(() => {
      const s = document.querySelector('.spot')?.getBoundingClientRect();
      const c = document.querySelector('.tour-card')!.getBoundingClientRect();
      const next = document.querySelector('.tour-actions .pill-dark')!.getBoundingClientRect();
      return { spot: s ? { top: s.top, bottom: s.bottom, h: s.height } : null, cardTop: c.top, cardH: c.height, nextBottom: next.bottom };
    });
    expect(m.spot, `step ${i + 1} has a spotlight`).not.toBeNull();
    expect(m.spot!.bottom, `step ${i + 1}: spotlight ends above the card`).toBeLessThanOrEqual(m.cardTop);
    expect(m.spot!.top, `step ${i + 1}: spotlight is on screen`).toBeGreaterThanOrEqual(0);
    expect(m.spot!.h, `step ${i + 1}: spotlight is not a sliver`).toBeGreaterThan(40);
    expect(m.cardH, `step ${i + 1}: card leaves room`).toBeLessThanOrEqual(640 * 0.47);
    expect(m.nextBottom).toBeLessThanOrEqual(640);
  }
  expect(errors).toEqual([]);
});

test('the tour step that asks for offline carries its own Go offline button', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `s.tour(3);`);
  const b = page.locator('.tour-card [data-tour-net]');
  await expect(b).toHaveText(/Go offline/);
  await b.click();
  await expect(b).toHaveText(/Back online/);
  await expect(page.locator('.farmer')).toContainText(/Offline/);
  await b.click();
  expect(errors).toEqual([]);
});

test('the tour has a tamper step: it opens the ledger at a populated moment, runs the tamper test from the card, and restores the record on Next', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  await sab(page, `s.tour(5);`);
  await expect(page.locator('#tour-h')).toHaveText('Tamper check: one changed record breaks the chain');
  await expect(page.locator('.ledger')).toBeVisible({ timeout: 20_000 });
  await page.locator('.tour-card [data-tour-tamper]').click();
  await expect(page.locator('.ledger .lg-verdict .note-bad')).toContainText('Integrity failure at record', { timeout: 20_000 });
  await expect(page.locator('.tour-card [data-tour-tamper]')).toHaveCount(0);
  // the spotlight follows the failure, above the card
  await page.waitForTimeout(1200);
  const [spot, card] = await page.evaluate(() => [document.querySelector('.spot')!.getBoundingClientRect().bottom, document.querySelector('.tour-card')!.getBoundingClientRect().top]);
  expect(spot).toBeLessThanOrEqual(card);
  await page.locator('.tour-actions .pill-dark').click();
  await expect(page.locator('#tour-h')).toHaveText('Ranked evidence, not verdicts');
  await sab(page, `s.tour(null); s.tab('ledger');`);
  await expect(page.locator('.ledger .tamper-btn')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[data-lg-restore]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
