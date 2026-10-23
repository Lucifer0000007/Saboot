// Spec §10.3–10.4 and §9: pseudo-localisation, 200% text, reduced motion, anchors under sticky chrome,
// offline after first load (service worker), and INP under 4x CPU throttling.
import { test, expect } from '@playwright/test';
import { STATES, ALL_VIEWPORTS, open, settle, check, record, subjectOnScreen } from './harness';
import { pseudoLocalize } from './checks';

const pick = (...ids: string[]) => STATES.filter((s) => ids.includes(s.id));
const V = (name: string) => ALL_VIEWPORTS.find((v) => v.name === name)!;
const quick = process.env.QA_QUICK === '1';

// 10.3 pseudo-localisation: +40% text, then overflow / clipping / overlap must still pass
for (const st of pick('landing', 'alert', 'capture', 'evidence-packet', 'filing', 'dashboard', 'drawer', 'hitl-pipeline', 'worklist', 'draft-list', 'pilot-metrics', 'objection', 'helper-queue', 'helper-consent', 'feature-phone')) {
  for (const v of (quick ? [V('360x640'), V('1440x900')] : [V('360x640'), V('768x1024'), V('1440x900')])) {
    test(`pseudo-loc +40% · ${st.id} · ${v.name}`, async ({ page }) => {
      const errors: string[] = [];
      await open(page, v, 'en', errors);
      await st.setup(page, v);
      await settle(page, st.focus);
      await page.evaluate('window.__sab.seek(window.__sab.state().t)'); // pause the replay so text stays expanded
      const n = await page.evaluate(pseudoLocalize);
      await page.waitForTimeout(250);
      const layout = [...(await subjectOnScreen(page, st.focus)), ...(await check(page, v, { only: ['overflow', 'clip', 'overlap', 'sticky-cover'] }))];
      await record(page, 'pseudo-loc', `${st.id}-${v.name}`, { state: st.id, viewport: v.name, lang: 'en+40%', expanded: n, layout, console: errors });
      expect(layout).toEqual([]);
    });
  }
}

// 10.4 200% text (WCAG 1.4.4 at desktop/tablet widths); reflow at 320 CSS px with normal text (WCAG 1.4.10)
for (const st of pick('landing', 'alert', 'evidence-packet', 'dashboard', 'drawer', 'draft-list', 'pilot-metrics', 'helper-queue', 'feature-phone')) {
  for (const v of [V('768x1024'), V('1280x800')]) {
    test(`text 200% · ${st.id} · ${v.name}`, async ({ page }) => {
      const errors: string[] = [];
      // like the browser's text-size setting: in force before the first render
      await page.addInitScript(() => {
        const add = () => {
          const s = document.createElement('style');
          s.textContent = 'html { font-size: 200% !important; }';
          document.documentElement.appendChild(s);
        };
        if (document.documentElement) add();
        else new MutationObserver((_, o) => { if (document.documentElement) { o.disconnect(); add(); } }).observe(document, { childList: true });
      });
      await open(page, v, 'en', errors);
      await st.setup(page, v);
      await settle(page, st.focus);
      const layout = [...(await subjectOnScreen(page, st.focus)), ...(await check(page, v, { only: ['overflow', 'clip', 'overlap', 'sticky-cover'] }))];
      await record(page, 'text-200', `${st.id}-${v.name}`, { state: st.id, viewport: v.name, lang: 'en 200%', layout, console: errors });
      expect(errors).toEqual([]);
      expect(layout).toEqual([]);
    });
  }
  test(`reflow 320px · ${st.id}`, async ({ page }) => {
    const errors: string[] = [];
    const v = { name: '320x640', width: 320, height: 640, mobile: true };
    await open(page, v, 'en', errors);
    await st.setup(page, v);
    await settle(page, st.focus);
    const layout = [...(await subjectOnScreen(page, st.focus)), ...(await check(page, v, { only: ['overflow', 'clip', 'overlap', 'sticky-cover'] }))];
    await record(page, 'reflow-320', st.id, { state: st.id, viewport: v.name, lang: 'en', layout, console: errors });
    expect(layout).toEqual([]);
  });
}

// The in-app 150% text setting on a 360px phone — the farmer persona's real case (240 text-px wide). Checked at the
// state's subject and again with the farmer app's top (tab row) on screen.
for (const st of pick('landing', 'alert', 'capture', 'offline-queue', 'evidence-packet', 'filing', 'objection', 'helper-home', 'helper-queue', 'helper-consent', 'feature-phone')) {
  for (const lang of quick ? ['en'] : ['en', 'hi']) {
    test(`farmer text 150% · ${st.id} · 360x640 · ${lang}`, async ({ page }) => {
      const errors: string[] = [];
      const v = V('360x640');
      await page.addInitScript(() => { try { localStorage.setItem('saboot.textScale', '150'); } catch { /* ignore */ } });
      await open(page, v, lang, errors);
      await st.setup(page, v);
      await settle(page, st.focus);
      const only = ['overflow', 'clip', 'overlap', 'sticky-cover', 'sticky', 'targets'];
      const layout = [...(await subjectOnScreen(page, st.focus)), ...(await check(page, v, { only }))];
      await record(page, 'text-150', `${st.id}-${lang}`, { state: st.id, viewport: v.name, lang: `${lang} 150%`, layout, console: errors });
      await page.evaluate(() => document.querySelector('#simulation .farmer')?.scrollIntoView({ block: 'start' }));
      await page.waitForTimeout(250);
      const top = await check(page, v, { only });
      await record(page, 'text-150', `${st.id}-${lang}-top`, { state: st.id, viewport: v.name, lang: `${lang} 150%`, layout: top, console: [] });
      expect(errors).toEqual([]);
      expect([...layout, ...top]).toEqual([]);
    });
  }
}

// 10.4 reduced motion: nothing animates, the hero clock stands still, the tour never auto-advances
for (const v of [V('360x640'), V('1440x900')]) {
  test(`reduced motion · ${v.name}`, async ({ page }) => {
    const errors: string[] = [];
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, v, 'en', errors);
    const c1 = await page.textContent('.hero-clock');
    await page.waitForTimeout(1300);
    expect(await page.textContent('.hero-clock'), 'hero clock must not tick').toBe(c1);
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && (a.effect?.getComputedTiming().duration as number) > 1).length);
    expect(running, 'running animations').toBe(0);
    await page.evaluate('window.__sab.tour(1)');
    await page.waitForSelector('.tour-manual');
    const h1 = await page.textContent('#tour-h');
    await page.waitForTimeout(2000);
    expect(await page.textContent('#tour-h'), 'tour must not auto-advance').toBe(h1);
    await record(page, 'reduced-motion', v.name, { viewport: v.name, lang: 'en', layout: [], console: errors });
    expect(errors).toEqual([]);
  });
}

// sticky layers never cover anchor targets
for (const v of [V('360x640'), V('768x1024'), V('1440x900')]) {
  test(`anchors clear the sticky nav · ${v.name}`, async ({ page }) => {
    const errors: string[] = [];
    await open(page, v, 'en', errors);
    for (const id of ['problem', 'simulation', 'how', 'limits']) {
      await page.evaluate((sid) => {
        const el = document.getElementById(sid)!;
        el.scrollIntoView({ block: 'start' });
      }, id);
      await page.waitForTimeout(500);
      const res = await page.evaluate((sid) => {
        const h = document.getElementById(sid)!.querySelector('h2')!;
        const nav = document.querySelector('.nav')!.getBoundingClientRect();
        const r = h.getBoundingClientRect();
        return { top: r.top, navBottom: nav.bottom };
      }, id);
      expect(res.top, `#${id} heading under the sticky nav`).toBeGreaterThanOrEqual(res.navBottom - 1);
    }
    expect(errors).toEqual([]);
  });
}

// one dropped chunk request (flaky venue Wi-Fi) must not leave a panel loading forever: Chrome caches failed module
// fetches, so the retry has to use a fresh URL
test('a lazy panel recovers from one failed chunk request', async ({ page }) => {
  const errors: string[] = [];
  let n = 0;
  await page.route(/\/assets\/Dashboard-[^/?]*\.js(\?.*)?$/, (route) => (++n === 1 ? route.abort('failed') : route.continue()));
  await open(page, V('412x915'), 'en', errors);
  await page.evaluate('window.__sab.tab("insurer")');
  await page.waitForSelector('.dash', { timeout: 15_000 });
  expect(n).toBeGreaterThan(1);
});

// the farmer flow keeps working with the network fully off after the first load
test.describe('offline', () => {
  test.use({ serviceWorkers: 'allow' });
  test('works offline after first load (service worker)', async ({ page, context }) => {
    const errors: string[] = [];
    const v = V('412x915');
    // If a panel never arrives, the failure says why: resource timings, worker state, caches and an event trail.
    const trail: string[] = [];
    const t0 = Date.now();
    const at = () => `${Date.now() - t0}ms`;
    page.on('requestfailed', (r) => trail.push(`${at()} failed ${r.url().split('/').pop()} ${r.failure()?.errorText}`));
    page.on('console', (m) => trail.push(`${at()} console.${m.type()} ${m.text().slice(0, 200)}`));
    page.on('framenavigated', (fr) => { if (fr === page.mainFrame()) trail.push(`${at()} nav ${fr.url()}`); });
    context.on('serviceworker', (w) => trail.push(`${at()} sw ${w.url()}`));
    const pending = new Map<object, string>();
    page.on('request', (r) => pending.set(r, `${at()} ${r.url().split('/').pop()}`));
    page.on('requestfinished', (r) => pending.delete(r));
    page.on('requestfailed', (r) => pending.delete(r));
    const panel = async (sel: string) => {
      try { await page.waitForSelector(sel, { timeout: 20_000 }); } catch {
        const diag = await page.evaluate(async () => ({
          res: performance.getEntriesByType('resource').filter((e) => /assets/.test(e.name)).map((e) => `${e.name.split('/').pop()} ${Math.round(e.startTime)}+${Math.round(e.duration)}ms ${(e as PerformanceResourceTiming).responseStatus ?? ''}`),
          sw: navigator.serviceWorker.controller?.state,
          caches: await Promise.all((await caches.keys()).map(async (k) => `${k}:${(await (await caches.open(k)).keys()).length}`)),
          loading: !!document.querySelector('.loading'),
          failed: !!document.querySelector('.load-failed'),
        }));
        trail.push(`pending requests: ${[...pending.values()].join(' | ') || 'none'}`);
        throw new Error(`${sel} never appeared. ${JSON.stringify(diag)}\nTRAIL\n${trail.join('\n')}`);
      }
    };
    await open(page, v, 'en', errors);
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    trail.push(`${at()} sw ready (${await page.evaluate(async () => (await navigator.serviceWorker.ready).active?.state)})`);
    await page.reload();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 20_000 });
    // the app boots after the first paint, so a warm service worker can finish the reload before it is ready
    await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
    await page.evaluate('window.__sab.ready()');
    await page.evaluate('window.__sab.tab("insurer")');
    await panel('.dash');
    await page.evaluate('window.__sab.tab("explainer")');
    await panel('.explainer');
    await page.evaluate('window.__sab.tab("farmer")');
    await context.setOffline(true);
    await page.reload();
    await page.waitForFunction(() => !!window.__sab, null, { timeout: 20_000 });
    await page.evaluate('window.__sab.ready()');
    await page.evaluate(`(async () => { const s = window.__sab; await s.jump('capture'); s.screen('packet'); })()`);
    await page.waitForSelector('[data-tour=synclog]');
    const strip = await page.textContent('.f-strip');
    await page.evaluate('window.__sab.tab("insurer")');
    await page.waitForSelector('.dash', { timeout: 10_000 });
    await record(page, 'offline', 'reload-offline', { viewport: v.name, lang: 'en', strip, layout: [], console: errors });
    expect(strip).toMatch(/Offline/);
    expect(errors.filter((e) => !/net::ERR_INTERNET_DISCONNECTED|Failed to fetch/.test(e))).toEqual([]);
  });
});
