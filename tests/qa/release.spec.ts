// Release gates on the built site: hosting headers (CSP), deep links from a cold start, a sub-path deployment, the
// presenter shortcuts, the real camera and GPS path (fake device) and its denied fallback, weak and offline sync,
// a flagged clock gap, filing reminders and escalation, the ledger tamper test, the impact numbers against the data
// file, the imported packet (good and tampered), and state across reload / reset / cleared site data.
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { ALL_VIEWPORTS, open } from './harness';
// @ts-expect-error plain JS dev server (same one the QA web server uses)
import { serve } from '../../scripts/snap.mjs';

const V = (name: string) => ALL_VIEWPORTS.find((v) => v.name === name)!;
const sab = (page: Page, js: string) => page.evaluate(`(async () => { const s = window.__sab; ${js} })()`);
const state = (page: Page) => page.evaluate('window.__sab.state()') as Promise<{ t: number; shots: number; queued: number; sealed: boolean; events: number }>;
const raw = JSON.parse(readFileSync('public/data/flood-replay.json', 'utf8')) as { focus: string; seed: number };
// every number a test expects about the replay comes from the facts file the generator writes, never from a literal
const facts = JSON.parse(readFileSync('docs/scenario-facts.json', 'utf8'));
/** Hours as the app prints a duration in English: 2.75 -> "2h 45m", 18.25 -> "18h 15m", 0.75 -> "45m". */
const dur = (h: number) => {
  let m = Math.round(h * 60);
  const d = Math.floor(m / 1440);
  m -= d * 1440;
  const hh = Math.floor(m / 60);
  m -= hh * 60;
  return d ? `${d}d ${hh}h` : hh ? `${hh}h ${String(m).padStart(2, '0')}m` : `${m}m`;
};
/**
 * The countdown the farmer sees at the alert moment, as a pattern: the clock already reads the window minus the event-to-call
 * time, less the 0.02 h the alert moment lands after the call. The minute may be off by one while the page loads.
 */
const clockLeft = (window: number, callH: number) => {
  const left = window - callH - 0.02;
  const hh = Math.floor(left);
  const mm = Math.floor((left - hh) * 60);
  const mins = [mm - 1, mm, mm + 1].map((m) => String(m).padStart(2, '0')).join('|');
  return new RegExp('^' + String(hh).padStart(2, '0') + ':(' + mins + '):[0-9][0-9]$');
};

test('hosting headers: CSP without unsafe-inline scripts, nosniff, no framing, cache rules', async ({ page }) => {
  const r = await page.request.get('/');
  const h = r.headers();
  const csp = h['content-security-policy'] ?? '';
  const scriptSrc = /script-src ([^;]*)/.exec(csp)?.[1] ?? '';
  expect(scriptSrc).toContain("'self'");
  expect(scriptSrc).toMatch(/'sha256-[A-Za-z0-9+/=]+'/);
  expect(scriptSrc).not.toContain('unsafe-inline');
  expect(scriptSrc).not.toContain('unsafe-eval');
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("worker-src 'self'");
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['x-frame-options']).toBe('DENY');
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(h['permissions-policy']).toContain('camera=(self)');
  expect(h['permissions-policy']).toContain('geolocation=(self)');
  expect(h['strict-transport-security']).toContain('max-age=');
  const sw = await page.request.get('/sw.js');
  expect(sw.headers()['cache-control']).toBe('no-cache');
  const entry = /href="\.\/(assets\/index-[^"]+\.js)"/.exec(readFileSync('dist/index.html', 'utf8'))![1];
  expect((await page.request.get('/' + entry)).headers()['cache-control']).toContain('immutable');
  for (const p of ['/manifest.webmanifest', '/og.jpg', '/icon.svg', '/data/flood-replay.json']) expect((await page.request.get(p)).status(), p).toBe(200);
  const html = readFileSync('dist/index.html', 'utf8');
  expect(html).toContain('<link rel="canonical" href="');
  expect(html).toContain('<meta property="og:image" content="');
  expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
  expect(html).not.toContain('{{VERIFY');
});

test('deep links open from a cold start, survive a reload, and the alert countdown counts from the event', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('1280x800'), 'en', errors);
  for (const pass of ['cold', 'reload']) {
    if (pass === 'cold') await page.goto('/?at=alert'); else await page.reload();
    await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
    await page.evaluate('window.__sab.ready()');
    const card = page.locator('[data-tour=alert]');
    await expect(card, pass).toBeVisible({ timeout: 20_000 });
    // the default rail is the relief assessment: a capture-soon advice window that already runs when the call comes,
    // so the clock reads the window minus the event-to-call time (never the full window)
    const c = facts.combos['relief-demo'];
    await expect(card.locator('.count'), pass).toHaveText(clockLeft(c.windowHours, c.focus.eventToCallH));
    await expect(card.locator('.alert-started'), pass).toContainText('The clock started at about');
    await expect(card.locator('.alert-started'), pass).toContainText('This is advice, not a legal deadline.');
  }
  // the PMFBY rail keeps the 72-hour rule: the same call leaves 72 h minus the event-to-call time
  await page.goto('/?at=alert&rail=pmfby');
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await page.evaluate('window.__sab.ready()');
  const pm = facts.combos['pmfby-demo'];
  await expect(page.locator('[data-tour=alert] .count')).toHaveText(clockLeft(pm.windowHours, pm.focus.eventToCallH), { timeout: 20_000 });
  expect(pm.windowHours).toBe(72);
  await expect(page.locator('[data-tour=alert] .alert-started')).toContainText('when the event began');
  await page.goto('/?at=alert');
  // at T+0 the ledger has no records yet, so its heading (not its empty table) proves the tab opened
  const tabs: [string, () => ReturnType<Page['locator']>][] = [
    ['insurer', () => page.locator('.dash')],
    ['ledger', () => page.getByRole('heading', { name: 'Audit ledger', level: 2 })],
    ['explainer', () => page.locator('#ex-h')],
  ];
  for (const [q, loc] of tabs) {
    await page.goto('/?tab=' + q);
    await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
    await expect(loc(), q).toBeVisible({ timeout: 20_000 });
  }
  expect(errors).toEqual([]);
});

test.describe('sub-path deployment', () => {
  const port = 4331;
  const prefix = '/demo/sub/';
  let srv: { close(): void };
  test.beforeAll(async () => { srv = await serve('dist', port, { prefix }); });
  test.afterAll(() => srv.close());
  test.use({ baseURL: `http://localhost:${port}`, serviceWorkers: 'allow' });

  test('every asset, the manifest and the worker scope resolve under the sub-path; it then works offline', async ({ page, context }) => {
    const failed: string[] = [];
    page.on('requestfailed', (r) => failed.push(r.url()));
    page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(prefix + '?tab=insurer');
    await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
    await page.evaluate('window.__sab.ready()');
    await expect(page.locator('.dash')).toBeVisible({ timeout: 20_000 });
    const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
    expect(scope).toBe(`http://localhost:${port}${prefix}`);
    const manifest = await page.request.get(prefix + 'manifest.webmanifest');
    expect(manifest.status()).toBe(200);
    expect((await manifest.json()).start_url).toBe('./');
    await page.waitForFunction(() => caches.keys().then((k) => k.length === 1), null, { timeout: 20_000 });
    expect(failed).toEqual([]);
    expect(errors).toEqual([]);
    await context.setOffline(true);
    await page.goto(prefix + '?at=alert');
    await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
    await expect(page.locator('[data-tour=alert]')).toBeVisible({ timeout: 20_000 });
    await context.setOffline(false);
  });
});

test('presenter shortcuts: jump, network, language, help, HUD, tour, play, reset', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('1280x800'), 'en', errors);
  await sab(page, `s.tab('farmer');`);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const key = async (k: string) => { await page.keyboard.press(k); await page.waitForTimeout(250); };
  await key('2');
  expect(Math.abs((await state(page)).t - 14.27)).toBeLessThan(0.1);
  const strip = page.locator('.farmer .f-net');
  await key('a');
  await expect(strip).toContainText(/Offline/);
  await key('a');
  await expect(strip).toContainText(/Online/);
  await key('w');
  await expect(strip).toContainText(/Weak/);
  await key('w');
  await key('l');
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi', { timeout: 20_000 });
  await key('l');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pa', { timeout: 20_000 });
  await key('l');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en', { timeout: 20_000 });
  await key('?');
  await expect(page.getByText('Presenter shortcuts')).toBeVisible();
  await key('Escape');
  await expect(page.getByText('Presenter shortcuts')).toBeHidden();
  await key('p');
  await expect(page.locator('.hud')).toBeVisible();
  await key('p');
  await expect(page.locator('.hud')).toBeHidden();
  await key('t');
  await expect(page.locator('.tour-card')).toBeVisible();
  await key('Escape');
  await expect(page.locator('.tour-card')).toBeHidden();
  const t0 = (await state(page)).t;
  await key('Space');
  await page.waitForTimeout(700);
  expect((await state(page)).t).toBeGreaterThan(t0);
  await key('Space');
  const t1 = (await state(page)).t;
  await page.waitForTimeout(500);
  expect((await state(page)).t).toBe(t1);
  await key('r');
  await page.waitForTimeout(400);
  const after = await state(page);
  expect(after.t).toBe(0);
  expect(after.shots).toBe(0);
  expect(errors).toEqual([]);
});

test('camera denied: the person is told why and chooses a labelled simulated photo, and nothing is swapped in silently', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `await s.jump('alert'); s.tab('farmer'); s.screen('capture');`);
  await page.getByRole('button', { name: /Open camera/ }).click();
  // the camera is refused: a message with the way forward, and no photo taken on the person's behalf
  await expect(page.locator('[data-cam-blocked]')).toContainText('The camera is blocked or not available', { timeout: 10_000 });
  await page.waitForTimeout(600);
  expect((await state(page)).shots).toBe(0);
  await expect(page.locator('.shots li')).toHaveCount(0);
  // the person chooses the simulated photo, and it says so on the photo and on its location
  await page.getByRole('button', { name: /Use simulated photo/ }).click();
  const shot = page.locator('.shots li').first();
  await expect(shot).toBeVisible({ timeout: 20_000 });
  await expect(shot).toContainText('Simulated location', { timeout: 20_000 });
  await expect(shot.locator('[data-v="photo"][data-prov="sim"]')).toBeVisible();
  await expect(shot.locator('[data-v="loc"][data-prov="sim"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('weak network: the fingerprint reaches the server first, the photo follows', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  // shots are scripted 3 h after the alert: jump('capture') takes them and seeks there; on a weak network each fingerprint goes first
  await sab(page, `s.net('weak'); await s.jump('capture'); s.tab('farmer'); s.screen('packet');`);
  const log = page.locator('.synclog');
  await expect(log).toContainText('Fingerprint sent, photo waiting', { timeout: 20_000 });
  await expect(log.locator('li')).toHaveCount(3, { timeout: 10_000 });
  // every fingerprint has a server receipt time while the photo bodies wait for a better signal
  await expect.poll(async () => log.locator('li .tag', { hasText: 'Fingerprint sent' }).count(), { timeout: 20_000 }).toBe(3);
  await expect(log.locator('li .sl-times dd').nth(1)).not.toHaveText('—');
  await expect(page.locator('.farmer .f-queue')).toContainText(/waiting/);
  // the signal improves: the bodies follow and everything is synced
  await sab(page, `s.net('online');`);
  await expect.poll(async () => log.locator('li .tag', { hasText: 'Synced' }).count(), { timeout: 20_000 }).toBe(3);
  await expect(page.locator('.farmer .f-queue')).toContainText('All sent');
  expect(errors).toEqual([]);
});

test('offline: three photos queue on the phone; a 3-hour wait before syncing is flagged as a clock gap', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `s.net('offline'); await s.jump('capture'); s.tab('farmer'); s.screen('packet');`);
  const log = page.locator('.synclog');
  await expect(log.locator('li')).toHaveCount(3, { timeout: 20_000 });
  await expect(log.locator('li .tag').first()).toContainText('Queued');
  await expect(page.locator('.farmer')).toContainText('3 waiting');
  expect((await state(page)).queued).toBe(3);
  await sab(page, `s.seek(s.state().t + 3); s.net('online');`);
  await expect(log).toContainText('Gap flagged', { timeout: 20_000 });
  await expect(page.locator('.farmer')).toContainText(/flagged for review/);
  expect(errors).toEqual([]);
});

test('status: a reminder when the acknowledgement is due, the acknowledgement at confirmation, escalation in the cohort', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('1280x800'), 'en', errors);
  // relief rail (the default): the officer acknowledges. The advice window ends well before the acknowledgement is due, so
  // look between the two (hour 80) for the reminder, then at the confirmation moment for the acknowledgement.
  await sab(page, `await s.ensure('filed'); s.seek(80); s.tab('farmer'); s.screen('status');`);
  const farmer = page.locator('.farmer');
  await expect(farmer).toContainText('Shown to the officer', { timeout: 20_000 });
  await expect(farmer).toContainText('Officer reminded: acknowledgement is due');
  // while the acknowledgement is still due the reminder is a warning; once it has come, the same line is history
  await expect(farmer.locator('.reminders li', { hasText: 'Officer reminded' })).toHaveClass(/warn/);
  await expect(farmer).toContainText('Saboot never decides. The officer does.');
  await sab(page, `await s.jump('confirm'); s.screen('status');`);
  await expect(farmer).toContainText('Officer acknowledged', { timeout: 20_000 });
  await expect(farmer.locator('.reminders li', { hasText: 'Officer reminded' })).toHaveClass(/past/);
  await expect(farmer).not.toContainText('Escalated to the district');
  await sab(page, `s.seek(168); s.tab('insurer'); s.plot('P-02');`);
  const drawer = page.locator('.drawer');
  await expect(drawer).toBeVisible({ timeout: 20_000 });
  await expect(drawer).toContainText('Escalated to the district office');
  await expect(drawer).toContainText('Officer acknowledgement overdue');
  await expect(drawer).toContainText('Evidence tier, not a decision.');
  // PMFBY rail: the insurer acknowledges, and the wording says claim
  await sab(page, `s.plot(null); s.rail('pmfby'); await s.jump('deadline'); s.tab('farmer'); s.screen('status');`);
  await expect(farmer).toContainText('Loss reported', { timeout: 20_000 });
  await expect(farmer).toContainText('Insurer reminded: acknowledgement is due');
  await expect(farmer).toContainText('Saboot never decides claims.');
  await sab(page, `await s.jump('confirm'); s.screen('status');`);
  await expect(farmer).toContainText('Insurer acknowledged', { timeout: 20_000 });
  await sab(page, `s.seek(168); s.tab('insurer'); s.plot('P-02');`);
  await expect(drawer).toContainText('Escalated to district agriculture office', { timeout: 20_000 });
  await expect(drawer).toContainText('Evidence tier, not a claim decision.');
  expect(errors).toEqual([]);
});

test('ledger: verify passes, the tamper test fails verification from the edited record, restore passes again', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('1280x800'), 'en', errors);
  await sab(page, `await s.jump('deadline'); s.tab('ledger');`);
  await page.waitForSelector('.lg-table tbody tr', { timeout: 20_000 });
  const status = page.locator('.lg-status');
  await page.getByRole('button', { name: /Verify integrity/ }).click();
  await expect(status.locator('.note-ok')).toContainText('Chain intact', { timeout: 20_000 });
  await page.locator('button.tamper-btn').click();
  await expect(status.locator('.note-bad')).toContainText(/Integrity failure at record #\d+/, { timeout: 10_000 });
  await page.getByRole('button', { name: /Verify integrity/ }).click();
  await expect(status.locator('.note-bad')).toContainText(/Integrity failure at record #\d+/, { timeout: 10_000 });
  await page.getByRole('button', { name: /Restore record/ }).click();
  await page.getByRole('button', { name: /Verify integrity/ }).click();
  await expect(status.locator('.note-ok')).toContainText('Chain intact', { timeout: 20_000 });
  expect(errors).toEqual([]);
});

test('impact panel: the figures match the facts file, the median leads, the check is not called validation, and validation is "not run"', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('1280x800'), 'en', errors);
  await sab(page, `s.seek(168); s.tab('insurer'); s.insurer('impact');`);
  const panel = page.locator('.impactp');
  await expect(panel).toBeVisible({ timeout: 20_000 });
  await expect(panel.locator('[data-sim-label]').first()).toContainText('These are not real-world results and must not be quoted as impact.');
  await expect(panel).toHaveAttribute('data-sim-numbers');
  const f = facts.combos['relief-demo'];
  // the headline is the median, in the lead card, with its definition; the demo farmer is named as one plot, not the typical case
  const lead = panel.locator('[data-metric="median-event-to-call"]');
  await expect(lead).toContainText('Typical farmer: event to call (median)');
  await expect(lead.locator('strong')).toHaveText(dur(f.eventToCall.medianH));
  await expect(lead).toContainText(`over every alerted plot (${f.eventToCall.n} of them)`);
  await expect(lead).toContainText(dur(f.eventToCall.p90H));
  await expect(lead).toContainText(dur(f.eventToCall.minH));
  await expect(lead).toContainText(`The demo farmer ${raw.focus} is one plot, at ${dur(f.focus.eventToCallH)}: not the typical case.`);
  // evidence on file, event to evidence, objections: each with its definition
  await expect(panel.locator('[data-metric="evidence-on-file"]')).toContainText(`${f.pilot.truthWithEvidence} of ${f.pilot.truthFlooded} plots flooded in the synthetic truth`);
  await expect(panel.locator('[data-metric="event-to-evidence"] strong')).toHaveText(dur(f.pilot.eventToEvidenceMedianH));
  await expect(panel.locator('[data-metric="objections"]')).toContainText(`${f.pilot.objections} of ${f.pilot.onList} listed entries`);
  await expect(panel.locator('[data-metric="objections"]')).toContainText(`${f.pilot.objectionsAnswered} answered by the officer, outside Saboot`);
  // no "visits avoided": there is no honest baseline for it
  await expect(panel).not.toContainText(/visits? avoided/i);
  // both radar cadences are shown, with the flooded plots each one never alerted
  const cad = panel.locator('[data-metric="cadence"]');
  await expect(cad).toContainText('Demo');
  await expect(cad).toContainText('Slower');
  const sl = facts.combos['relief-slow'];
  await expect(cad).toContainText(dur(sl.eventToCall.p90H));
  await expect(cad.locator('tbody tr').nth(1)).toContainText(`${sl.consistencyCheck.fn}`);
  // precision and recall are a consistency check, never validation, and never a headline
  const cc = panel.locator('[data-metric="consistency"]');
  await expect(cc.locator('h4')).toHaveText('Simulated consistency check, not validation');
  await expect(cc).toContainText(`Precision ${Math.round(f.consistencyCheck.precision * 100)}%, recall ${Math.round(f.consistencyCheck.recall * 100)}%`);
  await expect(panel.locator('.impact')).not.toContainText(/precision|recall/i);
  // real-data validation: not run
  const val = panel.locator('[data-metric="validation"]');
  await expect(val.locator('[data-validation-run="false"]')).toContainText('Not run.', { timeout: 20_000 });
  await expect(panel).toContainText('Decision happens outside Saboot.');
  expect(raw.seed).toBe(20260714);
  expect(raw.focus).toBe('P-04');
  // the PMFBY rail keeps its claim wording and reports within-window instead of objections
  await sab(page, `s.rail('pmfby');`);
  const pf = facts.combos['pmfby-demo'];
  await expect(panel.locator('[data-metric="reported-in-window"]')).toContainText(`${pf.cohortJudgeIdle.filedInWindow} of ${pf.cohortJudgeIdle.floodEvents} alerted flood events`, { timeout: 20_000 });
  await expect(panel.locator('[data-metric="objections"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('imported packet: a good code verifies and says where it came from (here simulated photos); a tampered code fails', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('1280x800'), 'en', errors);
  await sab(page, `await s.jump('capture'); await s.ensure('sealed'); s.seek(s.state().t + 0.3);`);
  const code = (await page.evaluate('window.__sab.kcode()')) as string;
  expect(code.length).toBeGreaterThan(200);
  expect(code.length).toBeLessThan(600);
  await page.goto('/?via=qa#k=' + code);
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await page.evaluate('window.__sab.ready()');
  const result = page.locator('.k-result');
  await expect(result.locator('.note-ok')).toContainText('Integrity verified: not altered since sealing.', { timeout: 20_000 });
  await expect(result.locator('.note-ok')).toContainText('This does not prove who sealed it.');
  await page.locator('.import-sheet button', { hasText: 'Add to dashboard' }).click();
  // the scripted photos are simulated, and the packet says so: the laptop must not call them live
  await expect(page.locator('.import-sheet')).toContainText('Imported (simulated)');
  await expect(page.locator('.import-sheet [data-k-shot] [data-prov="sim"]').first()).toBeVisible();
  // flip one character in the middle (a photo fingerprint byte): chain or signature must fail
  const mid = Math.floor(code.length / 2);
  const bad = code.slice(0, mid) + (code[mid] === 'A' ? 'B' : 'A') + code.slice(mid + 1);
  await page.goto('/?via=qa2#k=' + bad); // a new query string forces a real load (a fragment-only change would not)
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await page.evaluate('window.__sab.ready()');
  await expect(page.locator('.k-result .note-bad')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.k-result')).not.toContainText('Integrity verified');
  expect(errors).toEqual([]);
});

test('plain HTTP (no secure context): a clear notice, and the fingerprint chain still works', async ({ page }) => {
  // the machine's LAN address is not a secure context (localhost is), so the page runs without crypto.subtle,
  // mediaDevices or geolocation: exactly what a phone sees on the laptop's http://192.168… address
  const lan = Object.values(networkInterfaces()).flat().find((i) => i?.family === 'IPv4' && !i.internal)?.address;
  test.skip(!lan, 'no LAN IPv4 address on this machine');
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`http://${lan}:4330/?at=alert`);
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await page.evaluate('window.__sab.ready()');
  expect(await page.evaluate('window.isSecureContext')).toBe(false);
  await sab(page, `s.tab('farmer'); s.screen('capture');`);
  await expect(page.locator('.farmer .note-warn')).toContainText('Opened over plain HTTP');
  await sab(page, `await s.jump('capture'); await s.ensure('sealed'); s.seek(s.state().t + 0.3); s.screen('packet');`);
  const st = await state(page);
  expect(st.shots).toBe(3);
  expect(st.sealed).toBe(true);
  await expect(page.locator('.farmer')).toContainText(/[0-9a-f]{8}…/);
  await page.getByRole('button', { name: /Share as a QR code/ }).click();
  await expect(page.locator('.share-sheet .note-warn')).toContainText('Opened over plain HTTP', { timeout: 20_000 });
  expect(errors).toEqual([]);
});

test('state survives a reload mid-flow; reset and cleared site data return to first run', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `await s.jump('capture'); await s.ensure('captured');`);
  expect((await state(page)).shots).toBe(3);
  await page.reload();
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await page.evaluate('window.__sab.ready()');
  await expect.poll(async () => (await state(page)).shots, { timeout: 20_000 }).toBe(3);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press('r');
  // three real shots are on the phone, so Reset asks first
  await page.getByRole('dialog', { name: /Clear what this phone captured/ }).getByRole('button', { name: /Clear it and start over/ }).click();
  await expect.poll(async () => (await state(page)).shots, { timeout: 10_000 }).toBe(0);
  expect((await state(page)).t).toBe(0);
  await sab(page, `await s.jump('capture'); await s.ensure('captured');`);
  expect((await state(page)).shots).toBe(3);
  await page.evaluate(async () => {
    localStorage.clear();
    for (const db of await indexedDB.databases()) if (db.name) await new Promise((r) => { const q = indexedDB.deleteDatabase(db.name!); q.onsuccess = q.onerror = q.onblocked = () => r(null); });
  });
  await page.reload();
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await page.evaluate('window.__sab.ready()');
  const fresh = await state(page);
  expect(fresh.shots).toBe(0);
  expect(fresh.events).toBe(0);
  expect(errors).toEqual([]);
});
