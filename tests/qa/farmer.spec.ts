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
