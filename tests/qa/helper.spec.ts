// Helper mode on the built site: a first-class entry on the farmer home, a session for several farmers with each farmer's
// own consent and photos sealed in that farmer's own log, who captured what shown to the officer, the feature-phone design
// simulation (keys 1 and 2, a missed call, a helper), and state that survives a reload.
import { test, expect, type Page } from '@playwright/test';
import { ALL_VIEWPORTS, open } from './harness';

const V = (name: string) => ALL_VIEWPORTS.find((v) => v.name === name)!;
const sab = (page: Page, js: string) => page.evaluate(`(async () => { const s = window.__sab; ${js} })()`);
type LogInfo = { events: number; head: string | null; consentFarmer: string | null; consentHelper: string | null; packetHash: string | null; shotHelpers: (string | null)[] };
const logs = (page: Page) => page.evaluate('window.__sab.logs()') as Promise<Record<string, LogInfo>>;

/** Press and hold the consent button for longer than it asks (2 s). */
async function giveConsent(page: Page) {
  const hold = page.locator('button.hold');
  await hold.scrollIntoViewIfNeeded();
  const box = (await hold.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(2300);
  await page.mouse.up();
  await expect(page.locator('.farmer')).toContainText('Consent recorded at', { timeout: 10_000 });
}

async function takePhotos(page: Page, n: number) {
  for (let i = 0; i < n; i++) {
    await page.getByRole('button', { name: /Use simulated photo/ }).click();
    await expect(page.locator('.shots li')).toHaveCount(i + 1, { timeout: 10_000 });
  }
}

test('helper mode is a card on the farmer home, and a session serves several farmers, each with their own sealed consent', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('1440x900'), 'en', errors);
  await sab(page, `s.seek(20); s.tab('farmer'); s.screen('home');`);

  // first-class entry: on the home screen itself, not in settings
  const card = page.locator('[data-helper-card]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Helping other farmers?');
  await card.getByRole('button', { name: /Open helper mode/ }).click();

  // the helper names themselves once, for the whole session
  await expect(page.locator('[data-helper-screen]')).toBeVisible();
  await page.getByLabel('Your name').fill('Test Helper');
  await page.getByRole('radio', { name: 'Sarpanch' }).check();
  await page.getByRole('button', { name: /Start helper session/ }).click();
  await expect(page.locator('[data-helper-name]')).toContainText('Test Helper, Sarpanch');
  await expect(page.locator('.hq li')).toHaveCount(4);
  await expect(page.locator('.hs-progress')).toHaveText('0 of 4 farmers done');
  // H2: the queue is the only way to a farmer: no farmer tabs that would open the demo farmer instead
  await expect(page.locator('.farmer .f-nav')).toHaveCount(0);

  // farmer one: consent, three photos, seal; the packet names the helper
  await page.locator('[data-farmer="P-05"]').getByRole('button', { name: /Start/ }).click();
  await expect(page.locator('.farmer .f-title')).toHaveText('Consent from Mohinder Dhillon');
  await giveConsent(page);
  await page.getByRole('button', { name: /Start photos/ }).click();
  await expect(page.locator('[data-helper-bar]')).toContainText('Capturing for Mohinder Dhillon (P-05)');
  await expect(page.locator('.farmer .f-nav')).toHaveCount(1);
  await takePhotos(page, 3);
  await page.getByRole('button', { name: /Seal my evidence/ }).click();
  await expect(page.locator('[data-captured-by]')).toContainText('Test Helper, Sarpanch', { timeout: 10_000 });
  await page.getByRole('button', { name: /Next farmer/ }).click();
  const first = page.locator('[data-farmer="P-05"]');
  await expect(first).toContainText('Evidence sealed');
  await expect(first.locator('[data-captured-by]')).toContainText('Captured by Test Helper, Sarpanch');
  await expect(page.locator('.hs-progress')).toHaveText('1 of 4 farmers done');

  // farmer two: their own consent, one photo, then back to the queue
  await page.locator('[data-farmer="P-09"]').getByRole('button', { name: /Start/ }).click();
  await expect(page.locator('.farmer .f-title')).toHaveText('Consent from Rekha Rana');
  await giveConsent(page);
  await page.getByRole('button', { name: /Start photos/ }).click();
  await takePhotos(page, 1);
  await page.getByRole('button', { name: /Back to the queue/ }).click();
  await expect(page.locator('[data-farmer="P-09"]')).toContainText('Photos 1 of 3');

  // each farmer has their own log: their own consent, their own packet, the helper on every photo
  const l = await logs(page);
  expect(Object.keys(l).sort()).toEqual(['P-05', 'P-09']);
  expect(l['P-05'].consentFarmer).toBe('Mohinder Dhillon');
  expect(l['P-09'].consentFarmer).toBe('Rekha Rana');
  expect(l['P-05'].consentHelper).toBe('Test Helper');
  expect(l['P-09'].consentHelper).toBe('Test Helper');
  expect(l['P-05'].shotHelpers).toEqual(['Test Helper', 'Test Helper', 'Test Helper']);
  expect(l['P-09'].shotHelpers).toEqual(['Test Helper']);
  expect(l['P-05'].packetHash).toMatch(/^[0-9a-f]{64}$/);
  expect(l['P-09'].packetHash).toBeNull();
  expect(l['P-05'].head).not.toBe(l['P-09'].head);

  // the officer sees who captured what, and the assisted flag
  await sab(page, `s.tab('insurer'); s.insurer('triage');`);
  const row = page.locator('.queue li', { has: page.getByRole('button', { name: /^P-05/ }) });
  await expect(row).toContainText('Assisted capture (consent)', { timeout: 20_000 });
  await sab(page, `s.plot('P-05');`);
  await expect(page.locator('.drawer [data-captured-by]')).toContainText('Captured by Test Helper (Sarpanch) with the farmer’s consent', { timeout: 20_000 });
  await sab(page, `s.plot(null); s.tab('ledger');`);
  await page.waitForSelector('.lg-table tbody tr', { timeout: 20_000 });
  const table = page.locator('.lg-table');
  await expect(table).toContainText('HELPER_CONSENT');
  expect(await table.locator('tbody tr', { hasText: 'HELPER_CONSENT' }).filter({ hasText: 'Test Helper' }).count()).toBeGreaterThanOrEqual(2);
  expect(errors).toEqual([]);
});

test('the helper session and every farmer log survive a reload; ending the session returns to the demo farmer', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('1440x900'), 'en', errors);
  await sab(page, `s.seek(20); await s.helper(2); s.tab('farmer'); s.screen('helper');`);
  await expect(page.locator('[data-farmer="P-05"]')).toContainText('Evidence sealed');
  const before = await logs(page);
  await page.reload();
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await page.evaluate('window.__sab.ready()');
  await sab(page, `s.seek(20); s.tab('farmer'); s.screen('helper');`);
  await expect(page.locator('[data-helper-name]')).toContainText('QA helper', { timeout: 20_000 });
  await expect(page.locator('[data-farmer="P-05"]')).toContainText('Evidence sealed', { timeout: 20_000 });
  const after = await logs(page);
  expect(after['P-05'].head).toBe(before['P-05'].head);
  expect(after['P-06'].head).toBe(before['P-06'].head);
  // scrubbing back before the farmer was alerted un-happens their work: the log is not rewritten, the view just reads earlier
  await sab(page, `s.seek(10);`);
  await expect(page.locator('[data-farmer="P-05"]')).toContainText('No alert yet');
  await sab(page, `s.seek(20);`);
  await page.getByRole('button', { name: /End helper session/ }).click();
  await expect(page.locator('[data-helper-screen]')).toHaveCount(0);
  await expect(page.locator('.farmer .f-who strong')).toHaveText('Harjit Kaur');
  expect(errors).toEqual([]);
});

test('feature-phone design simulation: a missed call, key 1 asks for a helper, key 2 means no damage, and the replay is untouched', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('1280x800'), 'en', errors);
  await sab(page, `s.seek(20); s.tab('farmer'); s.screen('helper');`);
  const before = await page.evaluate('window.__sab.state()');
  await page.locator('[data-fp-open]').first().click();
  const sheet = page.locator('.fphone-sheet');
  await expect(sheet).toBeVisible();
  // labelled as a design simulation, with no real telephony
  await expect(sheet).toContainText('Design simulation');
  await expect(sheet).toContainText('Nothing here places a real call or sends an SMS or WhatsApp message.');
  await expect(sheet.locator('.keypad')).toHaveCount(0);
  await sheet.locator('[data-fp-call]').click();
  // captions are always on: the voice prompt is on screen as text, with the key meanings
  await expect(sheet.locator('.captions')).toContainText('Press 1 if your field has water damage. Press 2 if it has no damage.');
  await expect(sheet.locator('.key-btn[data-key="1"]')).toContainText('Damage');
  await expect(sheet.locator('.key-btn[data-key="2"]')).toContainText('No damage');
  // a key that means nothing asks again
  await sheet.locator('.key-btn[data-key="7"]').click();
  await expect(sheet.locator('.fp-line')).toContainText('Please press 1 for damage or 2 for no damage.');
  // 2: no damage, nothing starts
  await sheet.locator('.key-btn[data-key="2"]').click();
  await expect(sheet.locator('[data-fp-outcome="2"]')).toContainText('logs “no damage” for this plot and starts nothing');
  await expect(sheet.locator('.fp-log')).toContainText('key: 2 (no damage)');
  await expect(sheet.getByRole('button', { name: /Open helper mode/ })).toHaveCount(0);
  // 1: damage, a helper is asked to visit and record photos for the farmer
  await sheet.locator('.key-btn[data-key="1"]').click();
  await expect(sheet.locator('[data-fp-outcome="1"]')).toContainText('asks a helper near you to visit and record the photos for you');
  await expect(sheet.locator('.fp-log')).toContainText('action: helper_visit_requested');
  await expect(sheet.locator('.fp-log')).toContainText('via: voice_call (design simulation)');
  // nothing in the replay changed
  expect(await page.evaluate('window.__sab.state()')).toEqual(before);
  // the flow hands over to helper mode
  await sheet.getByRole('button', { name: /Open helper mode/ }).click();
  await expect(sheet).toHaveCount(0);
  await expect(page.locator('[data-helper-screen]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('helper mode keeps the accessibility floor: 48 px targets in the queue and the keypad, even at 150% text on a 360 px phone', async ({ page }) => {
  const errors: string[] = [];
  await page.addInitScript(() => { try { localStorage.setItem('saboot.textScale', '150'); } catch { /* ignore */ } });
  await open(page, V('360x640'), 'en', errors);
  await sab(page, `s.seek(20); await s.helper(1); s.tab('farmer'); s.screen('helper');`);
  await page.locator('[data-helper-screen]').scrollIntoViewIfNeeded();
  const small = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-helper-screen] button, [data-helper-screen] input')]
    .map((el) => ({ n: (el.textContent ?? el.getAttribute('aria-label') ?? '').trim().slice(0, 30), h: el.getBoundingClientRect().height, w: el.getBoundingClientRect().width }))
    .filter((r) => r.h > 0 && (r.h < 47.5 || r.w < 47.5)));
  expect(small, 'targets under 48 px in the helper queue').toEqual([]);
  await page.locator('[data-fp-open]').first().click();
  await page.locator('[data-fp-call]').click();
  const keys = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.fphone-sheet .key-btn')].map((el) => Math.min(el.getBoundingClientRect().height, el.getBoundingClientRect().width)));
  expect(keys.length).toBe(12);
  expect(Math.min(...keys), 'smallest keypad key side').toBeGreaterThanOrEqual(48);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), 'no horizontal scroll').toBe(true);
  expect(errors).toEqual([]);
});

test('evidence bundle: exported from a helper’s share sheet and from the console, each verified by the standalone script', async ({ page }) => {
  const errors: string[] = [];
  const { readFileSync } = await import('node:fs');
  const { spawnSync } = await import('node:child_process');
  const grab = async (selector: string) => {
    const [dl] = await Promise.all([page.waitForEvent('download'), page.locator(selector).first().click()]);
    const file = (await dl.path())!;
    return { file, json: JSON.parse(readFileSync(file, 'utf8')) };
  };
  const verified = (file: string) => spawnSync(process.execPath, ['scripts/verify-packet.mjs', file], { encoding: 'utf8' });
  await open(page, V('1280x800'), 'en', errors);
  await sab(page, `s.seek(20); await s.helper(1); s.active('P-05'); s.tab('farmer'); s.screen('packet');`);

  // the helper's phone: the signed code, and who captured, marked as not signed
  await page.locator('[data-tour=share] button').click();
  await expect(page.locator('.share-sheet .qr')).toBeVisible({ timeout: 20_000 });
  // H8: the sheet says whose code it is, and who captured
  await expect(page.locator('.share-sheet [data-share-farmer]')).toContainText('Mohinder Dhillon · P-05');
  await expect(page.locator('.share-sheet [data-share-farmer]')).toContainText('Captured by QA helper, Sarpanch');
  await expect(page.locator('.share-sheet')).toContainText('Open format, designed to be ingestible by other systems. It is not an integration with any system.');
  await page.locator('.share-sheet details.k-code summary').click(); // the data file sits in the technical details
  const phone = await grab('.share-sheet [data-export-bundle]');
  const b = phone.json;
  expect(b.kind).toBe('saboot.evidence-bundle');
  expect(b.decoded.plot).toBe('P-05');
  expect(b.decoded.photos).toHaveLength(3);
  expect(b.decoded.location.roundedTo).toMatch(/100 m/);
  expect(b.context.capturedBy).toMatchObject({ who: 'helper', helper: 'QA helper', role: 'Sarpanch' });
  expect(b.context.notSigned).toMatch(/NOT covered by the signature/);
  expect(b.context.packetHash).toMatch(/^[0-9a-f]{64}$/);
  expect(JSON.stringify(b)).not.toMatch(/Mohinder|data:image|base64,/);
  const ok = verified(phone.file);
  expect(ok.status, ok.stdout).toBe(0);
  expect(ok.stdout).toMatch(/^VERIFIED/);

  // the console: import the same code from its link, export again (no phone context exists there)
  await page.goto('/?via=bundle#k=' + b.code);
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await expect(page.locator('.k-result .note-ok')).toBeVisible({ timeout: 20_000 });
  const desk = await grab('.import-sheet [data-export-bundle]');
  expect(desk.json.code).toBe(b.code);
  expect('context' in desk.json).toBe(false);
  expect(verified(desk.file).status).toBe(0);

  // and from the imported row on the claims list
  await page.locator('.import-sheet button', { hasText: 'Add to dashboard' }).click();
  await page.keyboard.press('Escape');
  await sab(page, `s.tab('insurer'); s.insurer('claims');`);
  const row = await grab('tr.imported [data-export-bundle]');
  expect(row.json.decoded.chainHead).toBe(b.decoded.chainHead);
  expect(verified(row.file).status).toBe(0);
  expect(errors).toEqual([]);
});

test('CC-01: a presenter jump while a helper has a farmer open goes back to the demo farmer and writes nothing into that farmer’s log', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  await sab(page, `s.seek(20); await s.helper(0); s.active('P-06'); s.tab('farmer'); await s.jump('capture');`);
  const l = await logs(page);
  expect(l['P-06'], 'nothing scripted in the helped farmer’s log').toBeUndefined();
  expect(l.$demo.shotHelpers).toHaveLength(3);
  await expect(page.locator('[data-helper-bar]')).toHaveCount(0);
  await expect(page.locator('.farmer .f-who strong')).toHaveText('Harjit Kaur');
  // a tour step that catches up on its own goes the same way
  await sab(page, `s.active('P-06'); await s.ensure('sealed');`);
  expect((await logs(page))['P-06']).toBeUndefined();
  expect(errors).toEqual([]);
});

test('CC-02, H3: the Home tab offers no "no damage" for a farmer who has not agreed; it asks for consent instead', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  await sab(page, `s.seek(20); await s.helper(0); s.active('P-06'); s.tab('farmer'); s.screen('home');`);
  const need = page.locator('.farmer [data-need-consent]');
  await expect(need).toContainText('has not agreed yet');
  await expect(page.getByRole('button', { name: /no damage/i })).toHaveCount(0);
  await need.getByRole('button', { name: /Ask for consent/ }).click();
  await expect(page.locator('.farmer .f-title')).toContainText('Consent from');
  expect((await logs(page))['P-06']).toBeUndefined();
  expect(errors).toEqual([]);
});

test('H6: opening a farmer pauses the replay, so the consent time is the replay time when the helper acted', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `s.seek(20); await s.helper(0); s.tab('farmer'); s.screen('helper');`);
  await expect(page.locator('[data-replay-paused]')).toBeVisible();
  await page.getByRole('button', { name: 'Play replay' }).first().click();
  await page.waitForTimeout(300);
  await page.locator('[data-farmer="P-05"]').getByRole('button', { name: /Start/ }).click();
  await expect(page.getByRole('button', { name: 'Play replay' }).first()).toBeVisible();
  const t0 = ((await page.evaluate('window.__sab.state()')) as { t: number }).t;
  await page.waitForTimeout(1500);
  expect(((await page.evaluate('window.__sab.state()')) as { t: number }).t).toBe(t0);
  expect(errors).toEqual([]);
});

test('H7: a queue opened before any alert offers one jump to the first alert, and stays on the queue', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  await sab(page, `s.seek(2); await s.helper(0); s.tab('farmer'); s.screen('helper');`);
  await expect(page.locator('.hq li.hq-no-alert')).toHaveCount(4);
  await page.locator('[data-jump-alert]').click();
  await expect(page.locator('[data-helper-screen]')).toBeVisible();
  await expect(page.locator('.hq li.hq-consent').first().getByRole('button', { name: /Start/ })).toBeEnabled();
  await expect(page.locator('[data-jump-alert]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('H9: offline, the queue row and the strip say which farmer’s evidence still waits for the network', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  await sab(page, `s.seek(20); s.net('offline'); await s.helper(1); s.tab('farmer'); s.screen('helper');`);
  const row = page.locator('[data-farmer="P-05"]');
  await expect(row).toContainText('Evidence sealed');
  await expect(row.locator('[data-waiting]')).toHaveText(/Waiting for network: 4 queued/);
  await expect(page.locator('[data-farmer="P-06"] [data-waiting]')).toHaveCount(0);
  await expect(page.locator('.farmer .f-strip .f-queue')).toHaveText('4 waiting');
  await sab(page, `s.net('online');`);
  await expect(row.locator('[data-waiting]')).toHaveCount(0, { timeout: 10_000 });
  await expect(page.locator('.farmer .f-strip .f-queue')).toHaveText('All sent');
  expect(errors).toEqual([]);
});

test('H10: one farmer can take a copy of their own data, or have it deleted, and the other farmers keep theirs', async ({ page }) => {
  const errors: string[] = [];
  const { readFileSync } = await import('node:fs');
  await open(page, V('360x640'), 'en', errors);
  await sab(page, `s.seek(20); await s.helper(2); s.active('P-05'); s.tab('farmer'); s.screen('packet'); s.settings(true);`);
  const box = page.locator('[data-farmer-data]');
  await expect(box).toContainText('Mohinder Dhillon’s data on this phone');
  const [dl] = await Promise.all([page.waitForEvent('download'), box.locator('[data-farmer-export]').click()]);
  const json = readFileSync((await dl.path())!, 'utf8');
  expect(JSON.parse(json)).toMatchObject({ kind: 'saboot.farmer-export', plot: 'P-05' });
  expect(json).not.toContain('P-06');
  await box.locator('[data-farmer-delete]').click();
  await expect(box.locator('[data-farmer-delete-ask]')).toContainText('Other farmers’ data stays');
  await box.locator('[data-farmer-delete-yes]').click();
  await expect(page.locator('[data-helper-screen]')).toBeVisible();
  await expect.poll(async () => Object.keys(await logs(page)).sort()).toEqual(['P-06']);
  await expect(page.locator('[data-farmer="P-05"]')).toContainText('Waiting for consent');
  await expect(page.locator('[data-farmer="P-06"]')).toContainText('Evidence sealed');
  expect(errors).toEqual([]);
});

test('a helper cannot take photos for a farmer who has not agreed: the capture screen asks for consent first', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `s.seek(20); await s.helper(1); s.active('P-06'); s.tab('farmer'); s.screen('capture');`);
  const need = page.locator('[data-need-consent]');
  await expect(need).toBeVisible();
  await expect(need).toContainText('has not agreed yet');
  await expect(page.getByRole('button', { name: /Open camera/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Use simulated photo/ })).toHaveCount(0);
  await need.getByRole('button', { name: /Ask for consent/ }).click();
  await expect(page.locator('.farmer .f-title')).toContainText('Consent from');
  expect(errors).toEqual([]);
});
