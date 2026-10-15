// The relief rail on the built site: the worklist and why each plot is ranked where it is, the draft list and its exports,
// the objection window, Rule C and the paddy note in the drawer, the radar cadence, and the rail switch itself.
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { ALL_VIEWPORTS, open } from './harness';

const V = (name: string) => ALL_VIEWPORTS.find((v) => v.name === name)!;
const sab = (page: Page, js: string) => page.evaluate(`(async () => { const s = window.__sab; ${js} })()`);
const facts = JSON.parse(readFileSync('docs/scenario-facts.json', 'utf8'));
const raw = JSON.parse(readFileSync('public/data/flood-replay.json', 'utf8')) as { plots: { name: string }[] };

async function download(page: Page, selector: string) {
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator(selector).click()]);
  return readFileSync((await dl.path())!, 'utf8');
}

test('worklist: ranked by the unchanged priority, every row says why, villages by review load, the export carries the reasons', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('1280x800'), 'en', errors);
  await sab(page, `s.seek(40); s.tab('insurer'); s.insurer('triage');`);
  const rows = page.locator('.queue li');
  await expect(rows.first()).toBeVisible({ timeout: 20_000 });
  expect(await rows.count()).toBeGreaterThan(5);
  const pri = await rows.locator('.pri').allTextContents();
  const nums = pri.map(Number);
  expect([...nums].sort((a, b) => b - a)).toEqual(nums);
  // the four parts, with their points: ambiguity, urgency, area, integrity flags; they add up to the priority within rounding
  for (let i = 0; i < Math.min(8, await rows.count()); i++) {
    const row = rows.nth(i);
    const parts = row.locator('[data-why] .why-i');
    await expect(parts).toHaveCount(4);
    const text = (await parts.allTextContents()).join(' | ');
    expect(text).toMatch(/evidence/);
    expect(text).toMatch(/\bha\b/);
    expect(text).toMatch(/integrity flag/);
    const pts = (await parts.locator('b').allTextContents()).map((x) => Number(x.replace('+', '')));
    expect(Math.abs(pts.reduce((a, b) => a + b, 0) - nums[i]), `row ${i + 1}: parts add up to the priority`).toBeLessThanOrEqual(2);
  }
  await expect(page.locator('.triage').first().locator('p.muted').first()).toContainText('Priority = 35% evidence ambiguity + 30% urgency + 15% area + 20% integrity flags');
  const ranks = (await page.locator('.vrank .vr').allTextContents()).map((x) => Number(x.replace('Rank ', '')));
  expect(ranks).toEqual(ranks.map((_, i) => i + 1));
  await expect(page.locator('.triage')).toContainText('Share parameter 0.33 is a labelled scenario setting, not an official figure');
  // the export
  const csv = await download(page, '.triage .row-between button.pill');
  expect(csv).toMatch(/^# SIMULATION/);
  expect(csv).toContain('# priority = 0.35 ambiguity + 0.3 urgency + 0.15 area + 0.2 integrity flags (weights unchanged since the first build)');
  expect(csv).toContain('points_ambiguity,points_urgency,points_area,points_flags');
  expect(errors).toEqual([]);
});

test('draft list: working draft, then published, then closed; the exports carry their provenance and no name, coordinate or amount', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('1280x800'), 'en', errors);
  await sab(page, `s.seek(60); s.tab('insurer'); s.insurer('draft');`);
  const tag = page.locator('[data-list-state]');
  await expect(tag).toHaveAttribute('data-list-state', 'working draft', { timeout: 20_000 });
  await expect(page.locator('.draft')).toContainText('Draft, for officer review.');
  await expect(page.locator('.draft')).toContainText('Decides the final list');
  await sab(page, `s.seek(110);`);
  await expect(tag).toHaveAttribute('data-list-state', 'published');
  await sab(page, `s.seek(160);`);
  await expect(tag).toHaveAttribute('data-list-state', 'objections closed');
  await sab(page, `s.seek(110);`);
  await page.waitForFunction(() => /^[0-9a-f]{64}$/.test(document.querySelector('.dprov .hash')?.textContent ?? ''), null, { timeout: 20_000 }).catch(() => {});
  await page.locator('.dprov summary').click();
  await expect(page.locator('.dprov .hash')).toHaveText(/^[0-9a-f]{64}$/, { timeout: 20_000 });

  const json = await download(page, '[data-export="json"]');
  const d = JSON.parse(json);
  expect(d.kind).toBe('saboot.draft-assessment-list');
  expect(d.simulation).toBe(true);
  expect(d.status).toMatch(/does not decide claims, eligibility or amounts/);
  expect(d.provenance.rail).toBe('relief');
  expect(d.provenance.publication.state).toBe('published');
  expect(d.provenance.ruleVersions).toEqual({ A: '1', B: '2', C: '1' });
  expect(d.provenance.parameters.floodedShareParameter).toBe(0.33);
  // the fingerprint of the scenario file the browser really received is the one the generator wrote
  expect(d.provenance.scenario.sha256).toBe(facts.file.sha256);
  expect(d.entries.length).toBeGreaterThan(10);
  expect(d.villages.map((v: { rank: number }) => v.rank)).toEqual(d.villages.map((_v: unknown, i: number) => i + 1));
  const both = json + (await download(page, '[data-export="csv"]'));
  for (const p of raw.plots) expect(both.includes(p.name), `${p.name} is not in an export`).toBe(false);
  expect(both).not.toMatch(/₹|rupee|"lat"|"lon"|latitude|longitude/i);
  const csv = await download(page, '[data-export="csv"]');
  expect(csv).toMatch(/^# SABOOT DRAFT ASSESSMENT LIST - SIMULATION/);
  expect(csv).toContain(`scenario_sha256=${facts.file.sha256}`);
  expect(csv).toContain('rules=A1+B2+C1');
  expect(errors).toEqual([]);
});

test('objection: the farmer attaches sealed evidence once, it is a sealed event in their own log, and Saboot never resolves it', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('1440x900'), 'en', errors);
  // before the officer publishes: a line saying what will happen
  await sab(page, `await s.jump('confirm'); s.screen('status');`);
  const card = page.locator('.ob-card');
  await expect(card).toHaveAttribute('data-objection', 'soon', { timeout: 20_000 });
  await expect(card).toContainText('Later, the officer publishes a draft list. This is simulated');
  // the Draft list moment: the list is out, the window is open
  await page.locator('.chips .chip-btn', { hasText: 'Draft list' }).first().click();
  await expect(card).toHaveAttribute('data-objection', 'open', { timeout: 20_000 });
  const before = (await page.evaluate('window.__sab.logs()')) as Record<string, { events: number; head: string }>;
  await card.getByRole('button', { name: 'Attach my sealed evidence' }).click();
  await expect(card).toHaveAttribute('data-objection', 'filed');
  await expect(card).toContainText('The officer decides, outside Saboot.');
  const after = (await page.evaluate('window.__sab.logs()')) as Record<string, { events: number; head: string }>;
  expect(after.$demo.events).toBe(before.$demo.events + 1);
  expect(after.$demo.head).not.toBe(before.$demo.head);
  await expect(card.getByRole('button', { name: 'Attach my sealed evidence' })).toHaveCount(0);
  // the officer sees it on the draft list, next to the entry that is the judge's own
  await sab(page, `s.tab('insurer'); s.insurer('draft');`);
  const mine = page.locator('.dtable tr', { has: page.locator('.tag.you') });
  await expect(mine).toContainText('Evidence attached', { timeout: 20_000 });
  await expect(mine).toContainText('No response noted yet');
  // twenty hours later a response is noted: that it came, never what it said
  await sab(page, `s.seek(122);`);
  await expect(mine).toContainText('Response noted');
  await expect(mine).toContainText('outside Saboot');
  await expect(card).toContainText('The officer has responded');
  await expect(page.locator('.farmer')).not.toContainText(/approved|accepted|rejected|upheld|resolved|granted|dismissed/i);
  await expect(page.locator('.draft')).not.toContainText(/approved|accepted|rejected|upheld|resolved|granted|dismissed/i);
  // scrubbing back before the objection un-happens it; the log is not rewritten until the farmer acts again
  await sab(page, `s.seek(90);`);
  await expect(card).toHaveAttribute('data-objection', 'soon');
  // long after the window has closed the filed objection still stands: nothing resolves it
  await sab(page, `s.seek(160);`);
  await expect(card).toHaveAttribute('data-objection', 'filed');
  expect(errors).toEqual([]);
});

test('Rule C and the paddy note: a river-detected plot shows the gauge and its chart, a paddy plot seen only by radar says radar is weak evidence there', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('1280x800'), 'en', errors);
  await sab(page, `s.seek(60); s.tab('insurer'); s.plot('P-11');`);
  const drawer = page.locator('.drawer');
  await expect(drawer).toBeVisible({ timeout: 20_000 });
  await expect(drawer).toContainText('Rule C fired');
  await expect(drawer).toContainText('River stage vs danger level');
  await expect(drawer).toContainText('Event begins:');
  await sab(page, `s.plot('P-34');`);
  await expect(drawer).toContainText('Rule B fired: simulated radar shows water above the paddy’s standing water (low confidence)');
  await expect(drawer.locator('.note-warn')).toContainText('Paddy in the standing-water season');
  await expect(drawer.locator('.note-warn')).toContainText('unvalidated design decision');
  expect(errors).toEqual([]);
});

test('the slower radar cadence changes who is alerted, and the table shows the flooded plots it never alerts', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('1280x800'), 'en', errors);
  await sab(page, `s.seek(168); s.tab('insurer'); s.insurer('impact');`);
  const lead = page.locator('[data-metric="median-event-to-call"]');
  const demo = facts.combos['relief-demo'], slow = facts.combos['relief-slow'];
  await expect(lead).toContainText(`over every alerted plot (${demo.eventToCall.n} of them)`, { timeout: 20_000 });
  await sab(page, `s.cadence('slow');`);
  await expect(lead).toContainText(`over every alerted plot (${slow.eventToCall.n} of them)`, { timeout: 20_000 });
  const rows = page.locator('[data-metric="cadence"] tbody tr');
  await expect(rows.nth(1)).toHaveClass(/sel/);
  await expect(rows.nth(1)).toContainText(`${slow.consistencyCheck.fn}`);
  await expect(page.locator('[data-metric="cadence"]')).toContainText('the percentiles cover fewer plots');
  expect(slow.eventToCall.n).toBeLessThan(demo.eventToCall.n);
  expect(errors).toEqual([]);
});

test('the draft list and its moment belong to the relief rail: the crop-insurance rail has neither, and the key does nothing there', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('1280x800'), 'en', errors);
  await sab(page, `s.tab('insurer'); s.insurer('draft');`);
  await expect(page.locator('.draft')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.chips .chip-btn', { hasText: 'Draft list' })).toHaveCount(1);
  await sab(page, `s.rail('pmfby');`);
  await expect(page.locator('.draft')).toHaveCount(0);
  await expect(page.locator('.claims')).toBeVisible();
  await expect(page.locator('.chips .chip-btn', { hasText: 'Draft list' })).toHaveCount(0);
  await expect(page.locator('.view-seg')).not.toContainText('Draft list');
  const t0 = ((await page.evaluate('window.__sab.state()')) as { t: number }).t;
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('6');
  expect(((await page.evaluate('window.__sab.state()')) as { t: number }).t).toBe(t0);
  expect(errors).toEqual([]);
});

test('the rail switch changes words and windows, survives a reload, a deep link overrides it, and the relief rail names no state', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('1280x800'), 'en', errors);
  const seg = page.locator('#simulation .rail-seg').first();
  // relief is the default: no state is named, the officer is the other party
  await expect(seg.getByRole('radio', { name: 'Relief assessment' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('#simulation')).toContainText('No state is named.');
  await expect(page.locator('#simulation')).not.toContainText('Haryana');
  await expect(page.getByRole('tab', { name: 'Officer' }).first()).toBeVisible();
  await sab(page, `await s.jump('alert'); s.tab('farmer');`);
  await expect(page.locator('[data-tour=alert]')).toContainText('This is advice, not a legal deadline.');
  await expect(page.locator('[data-tour=alert] .advice-tag')).toBeVisible();
  // the crop-insurance rail: the insurer, a fictional district in the state the owner chose, and a rule with a deadline
  await seg.getByRole('radio', { name: 'PMFBY intimation' }).click();
  await expect(seg.getByRole('radio', { name: 'PMFBY intimation' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('#simulation')).toContainText('A fictional district in Haryana.');
  await expect(page.getByRole('tab', { name: 'Insurer' }).first()).toBeVisible();
  await expect(page.locator('[data-tour=alert]')).toContainText(/72.hour clock started/);
  await expect(page.locator('[data-tour=alert] .advice-tag')).toHaveCount(0);
  // the choice is kept for this viewer
  await page.reload();
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await page.evaluate('window.__sab.ready()');
  await expect(page.locator('#simulation .rail-seg').first().getByRole('radio', { name: 'PMFBY intimation' })).toHaveAttribute('aria-checked', 'true');
  // a deep link wins over the stored choice
  await page.goto('/?rail=relief');
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await page.evaluate('window.__sab.ready()');
  await expect(page.locator('#simulation .rail-seg').first().getByRole('radio', { name: 'Relief assessment' })).toHaveAttribute('aria-checked', 'true');
  // the rail never changes what the rules detect: the same plots are alerted at the same times
  const same = facts.combos['relief-demo'], other = facts.combos['pmfby-demo'];
  expect(other.detected).toBe(same.detected);
  expect(other.eventToCall).toEqual(same.eventToCall);
  expect(other.windowHours).not.toBe(same.windowHours);
  expect(errors).toEqual([]);
});

test('validation status: "not run" by default; a published real report shows its numbers with their limits and fingerprint', async ({ page }) => {
  const errors: string[] = [];
  const status = { v: 1, run: true, dataset: 'A test dataset', events: 2, villagesLabelled: 11, precision: 0.8, recall: 0.7, rulesEvaluated: ['A', 'C'], reportSha256: 'ab'.repeat(32), note: 'Village level, rules A and C only (the radar rule was not evaluated). See docs/VALIDATION.md for what this does and does not show.' };
  await page.route('**/data/validation-status.json', (r) => r.fulfill({ json: status }));
  await open(page, V('1280x800'), 'en', errors);
  await sab(page, `s.seek(168); s.tab('insurer'); s.insurer('impact');`);
  const val = page.locator('[data-metric="validation"]');
  await expect(val.locator('[data-validation-run="true"]')).toBeVisible({ timeout: 20_000 });
  await expect(val).toContainText('A real-data validation report is on record');
  await expect(val).toContainText('A test dataset');
  await expect(val).toContainText('80% · 70%, village level');
  await expect(val).toContainText('A, C');
  await expect(val).toContainText('ab'.repeat(32));
  await expect(val).toContainText('the radar rule was not evaluated');
  await expect(val).not.toContainText('Not run.');
  // and nothing in the simulated consistency check pretends to be it
  await expect(page.locator('[data-metric="consistency"] h4')).toHaveText('Simulated consistency check, not validation');
  expect(errors).toEqual([]);
});

test('worklist cells: the advice countdown has a clock under 24 h and words under 6 h, "shown" passes no verdict on timing, every figure has a caption, villages show shapes with counts', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('1280x800'), 'en', errors);
  await sab(page, `await s.jump('deadline'); s.tab('insurer'); s.insurer('triage');`);
  const rows = page.locator('.queue li');
  await expect(rows.first()).toBeVisible({ timeout: 20_000 });
  // the countdown rule: amber with a clock below 24 h, and the words "Capture soon" below 6 h (advice, so never red)
  const soon = page.locator('.queue li .tl', { has: page.locator('.tag-warn') }).first();
  await expect(soon).toContainText('Capture soon');
  await expect(soon.locator('.tl-warn svg')).toHaveCount(1);
  await expect(page.locator('.queue li .tl-bad')).toHaveCount(0);
  // every figure in the row is captioned
  await expect(rows.first().locator('.qcell')).toHaveCount(3);
  expect(await rows.first().locator('.qcell').evaluateAll((els) => els.map((e) => e.getAttribute('data-l')))).toEqual(['Evidence', 'Advice left', 'Priority']);
  // villages: the mix is shapes and counts, not a bare coloured bar
  const mix = page.locator('.vrank .vmix').first();
  await expect(mix.locator('li')).toHaveCount(3);
  await expect(mix.locator('li svg')).toHaveCount(3);
  await expect(mix.locator('li').first()).toContainText(/supported/);
  // a week in, a plot that reached the officer is "shown": there is no verdict on timing on the relief rail
  await sab(page, `s.seek(168);`);
  await expect(page.locator('.queue')).toContainText('Shown to the officer');
  await expect(page.locator('.queue')).not.toContainText('Shown in time');
  expect(errors).toEqual([]);
});
