// QA harness: viewports, languages, deterministic states (via window.__sab), axe, screenshots, results.
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { runChecks, type CheckOpts } from './checks';

const require = createRequire(import.meta.url);
export const AXE_PATH = require.resolve('axe-core/axe.min.js');
const quick = process.env.QA_QUICK === '1';

export interface Viewport { name: string; width: number; height: number; mobile: boolean }
const vp = (w: number, h: number): Viewport => ({ name: `${w}x${h}`, width: w, height: h, mobile: w < 600 });
export const ALL_VIEWPORTS = [vp(360, 640), vp(390, 844), vp(412, 915), vp(768, 1024), vp(1024, 768), vp(1280, 800), vp(1440, 900)];
export const VIEWPORTS = quick ? [vp(360, 640), vp(768, 1024), vp(1440, 900)] : ALL_VIEWPORTS;
export const LANGS = quick ? ['en', 'hi'] : ['en', 'hi', 'pa'];

type Sab = Record<string, (...a: unknown[]) => unknown>;
declare global { interface Window { __sab: Sab } }

export interface State { id: string; focus: string; setup: (page: Page, v: Viewport) => Promise<void> }

// Errors thrown inside the page are re-thrown with their name and message (some engines serialise a DOMException as {}).
const sab = async (page: Page, js: string): Promise<void> => {
  await page.evaluate(`(async () => { const s = window.__sab; try { ${js} } catch (e) { throw new Error('QA hook failed: ' + (e && e.name) + ': ' + (e && e.message) + ' | ' + String(e && e.stack).slice(0, 400)); } })()`);
};

export const STATES: State[] = [
  { id: 'landing', focus: '#hero-h', setup: async () => {} },
  { id: 'alert', focus: '[data-tour=alert]', setup: (p) => sab(p, `await s.jump('alert'); s.tab('farmer');`) },
  { id: 'capture', focus: '.farmer .f-title', setup: (p) => sab(p, `await s.jump('alert'); s.tab('farmer'); s.screen('capture');`) },
  { id: 'offline-queue', focus: '.synclog', setup: (p) => sab(p, `s.net('offline'); await s.jump('capture'); s.tab('farmer'); s.screen('packet');`) },
  { id: 'evidence-packet', focus: '[data-tour=hash]', setup: (p) => sab(p, `await s.jump('capture'); await s.ensure('sealed'); s.tab('farmer'); await s.jump('capture'); s.seek(s.state().t + 0.2); s.screen('packet');`) },
  { id: 'filing', focus: '.farmer .f-title', setup: (p) => sab(p, `await s.jump('capture'); await s.ensure('sealed'); s.seek(s.state().t + 0.3); s.tab('farmer'); s.screen('file');`) },
  { id: 'dashboard', focus: '.dash', setup: (p) => sab(p, `await s.jump('deadline'); s.tab('insurer');`) },
  {
    id: 'drawer', focus: '.drawer',
    setup: async (p) => {
      await sab(p, `await s.jump('deadline'); s.tab('insurer');`);
      await p.waitForSelector('.dash');
      await p.evaluate(() => document.querySelector('.dash')?.scrollIntoView({ block: 'start' }));
      await sab(p, `s.plot('P-04');`);
    },
  },
  {
    id: 'ledger-tamper', focus: '.lg-status',
    setup: async (p) => {
      await sab(p, `await s.jump('deadline'); s.tab('ledger');`);
      await p.waitForSelector('.lg-table tbody tr', { timeout: 20_000 });
      await p.waitForTimeout(400);
      await p.locator('button.tamper-btn').click();
      await p.waitForSelector('.lg-status .note-bad', { timeout: 10_000 });
    },
  },
  { id: 'hitl-pipeline', focus: '[data-tour=pipeline]', setup: (p) => sab(p, `await s.jump('confirm'); s.tab('insurer');`) },
  // relief rail: the officer's worklist with the reason behind every rank, the draft list, the pilot metrics, and the farmer's objection
  { id: 'worklist', focus: '.triage', setup: (p) => sab(p, `await s.jump('deadline'); s.tab('insurer'); s.insurer('triage');`) },
  { id: 'draft-list', focus: '.draft', setup: (p) => sab(p, `await s.jump('draft'); s.tab('insurer'); s.insurer('draft');`) },
  { id: 'pilot-metrics', focus: '.impactp', setup: (p) => sab(p, `s.seek(168); s.tab('insurer'); s.insurer('impact');`) },
  { id: 'objection', focus: '.ob-card', setup: (p) => sab(p, `await s.jump('draft'); s.tab('farmer'); s.screen('status');`) },
  // helper mode: the home card, the queue with two farmers done, the consent screen for one farmer, and the feature-phone design simulation
  { id: 'helper-home', focus: '[data-helper-card]', setup: (p) => sab(p, `s.seek(20); s.tab('farmer'); s.screen('home');`) },
  { id: 'helper-queue', focus: '[data-helper-screen]', setup: (p) => sab(p, `s.seek(20); await s.helper(2); s.tab('farmer'); s.screen('helper');`) },
  { id: 'helper-consent', focus: '.farmer .f-title', setup: (p) => sab(p, `s.seek(20); await s.helper(1); s.active('P-06'); s.tab('farmer'); s.screen('assist');`) },
  {
    id: 'feature-phone', focus: '.fphone-sheet',
    setup: async (p) => {
      await sab(p, `s.seek(20); s.tab('farmer'); s.screen('helper');`);
      await p.locator('[data-fp-open]').first().click();
      await p.locator('[data-fp-call]').click();
      await p.waitForSelector('.fphone-sheet .keypad');
    },
  },
  { id: 'judge-tour', focus: '.tour-card', setup: async (p) => { await sab(p, `s.tour(2);`); await p.waitForSelector('.tour-card'); await p.waitForTimeout(1200); } },
  {
    // feature K: a packet sealed and signed "on a phone" (this browser), then opened on the laptop via its #k= link
    id: 'import', focus: '.import-sheet',
    setup: async (p) => {
      await sab(p, `await s.jump('capture'); await s.ensure('sealed'); s.seek(s.state().t + 0.3);`);
      const code = await p.evaluate('window.__sab.kcode()');
      await p.goto('/?via=qa#k=' + code);
      await p.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
      await p.evaluate('window.__sab.ready()');
      await p.waitForSelector('.k-result .note-ok', { timeout: 20_000 });
      await p.locator('.import-sheet button', { hasText: 'Add to dashboard' }).click();
      await p.waitForSelector('.import-sheet .note-plain');
    },
  },
];

/** Open the built site in a language and wait until it is ready (scenario loaded, fonts in). */
export async function open(page: Page, v: Viewport, lang: string, errors: string[]) {
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: v.width, height: v.height });
  await page.addInitScript((l) => {
    try { localStorage.setItem('saboot.lang', JSON.stringify(l)); } catch { /* ignore */ }
  }, lang);
  await page.goto('/');
  await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
  await page.evaluate('window.__sab.ready()');
  if (lang !== 'en') await page.waitForFunction((l) => document.documentElement.lang === l && !document.documentElement.classList.contains('lang-pending'), lang, { timeout: 20_000 });
  await page.evaluate(() => document.fonts.ready.then(() => undefined)); // a plain promise: Firefox cannot serialise the FontFaceSet
}

/** Wait for lazy views to finish loading, then bring the state's subject on screen. */
export async function settle(page: Page, focus?: string) {
  await page.waitForTimeout(250);
  await page.waitForFunction(() => !document.querySelector('.loading'), null, { timeout: 20_000 }).catch(() => {});
  if (focus) {
    // a subject inside a closed <details> (the Proof screen's technical details) is opened first, as a person would
    await page.waitForSelector(focus, { state: 'attached', timeout: 20_000 });
    await page.evaluate((sel) => { for (let d = document.querySelector(sel)?.closest('details'); d; d = d.parentElement?.closest('details') ?? null) d.open = true; }, focus);
    await page.waitForSelector(focus, { state: 'visible', timeout: 20_000 });
    await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ block: 'start' }), focus);
  }
  await page.waitForTimeout(350);
  await page.evaluate(() => document.fonts.ready.then(() => undefined)); // a plain promise: Firefox cannot serialise the FontFaceSet
}

/** A capture is only meaningful if its subject is actually on screen (not loading, not scrolled away). */
export async function subjectOnScreen(page: Page, focus: string): Promise<string[]> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return [`state subject ${sel} is missing`];
    const r = el.getBoundingClientRect();
    if (r.bottom <= 0 || r.top >= innerHeight || r.width === 0) return [`state subject ${sel} is not on screen (top ${Math.round(r.top)})`];
    return [];
  }, focus);
}

const AXE_SRC = readFileSync(AXE_PATH, 'utf8');

export async function axe(page: Page): Promise<string[]> {
  // Evaluated over the debugger channel, not injected as a <script>: the site's Content Security Policy (served
  // from dist/_headers) allows no inline scripts, and the QA run must keep that policy in force.
  if ((await page.evaluate('typeof window.axe')) !== 'object') await page.evaluate(AXE_SRC);
  const res = await page.evaluate(async () => {
    // @ts-expect-error axe is injected above
    // target-size is covered by our stricter 44/48 px check (axe flags targets partly under the sticky nav)
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }, rules: { 'target-size': { enabled: false } }, resultTypes: ['violations'] });
    return r.violations
      .filter((v: { impact: string }) => v.impact === 'serious' || v.impact === 'critical')
      .map((v: { id: string; impact: string; help: string; nodes: { target: string[] }[] }) => `axe ${v.impact} ${v.id}: ${v.help} (${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(', ')})`);
  });
  return res as string[];
}

export async function check(page: Page, v: Viewport, opts: CheckOpts = {}) {
  return page.evaluate(runChecks, { stickyMax: v.mobile ? 0.3 : undefined, ...opts });
}

/** Screenshot + per-test result file (aggregated into qa/index.html by contact-sheet.ts). */
export async function record(page: Page, group: string, id: string, data: Record<string, unknown>) {
  mkdirSync(`qa/shots/${group}`, { recursive: true });
  const shot = `shots/${group}/${id}.png`;
  await page.screenshot({ path: 'qa/' + shot, animations: 'disabled', caret: 'hide' });
  writeFileSync(`qa/results/${group}__${id}.json`, JSON.stringify({ group, id, shot, ...data }, null, 1));
}
