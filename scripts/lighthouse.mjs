// Lighthouse gate: mobile emulation, simulated 2 Mbps / 300 ms RTT / 4x CPU, median of N runs per URL.
// Usage: node scripts/lighthouse.mjs [--runs=3]
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { serve } from './snap.mjs';

const MIN = { performance: 0.9, accessibility: 0.95, 'best-practices': 0.95 };
const LCP = 2500, CLS = 0.05, TTI = 3000;
const runsArg = process.argv.find((a) => a.startsWith('--runs='));
const RUNS = runsArg ? +runsArg.split('=')[1] : 3;
const PAGES = ['', '?at=alert', '?tab=insurer'];
let fail = 0;
const check = (cond, m) => { console.log(`  ${cond ? '✓' : '✗'} ${m}`); if (!cond) fail++; };

const srv = await serve('dist', 4322);
const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox'] });
console.log(`  (median of ${RUNS} runs per URL by LCP, Lighthouse's recommended practice for variance)`);
// Note: on localhost every request finishes within milliseconds, so Lighthouse's simulation counts all of them into
// LCP (in a real throttled load the page paints first: ~1.8 s with applied 2 Mbps / 300 ms / 4x CPU throttling).
const audit = (url) =>
  lighthouse(url, {
    port: chrome.port, output: 'json', logLevel: 'error',
    onlyCategories: ['performance', 'accessibility', 'best-practices'],
    formFactor: 'mobile',
    screenEmulation: { mobile: true, width: 360, height: 740, deviceScaleFactor: 2, disabled: false },
    throttlingMethod: 'simulate',
    throttling: { rttMs: 300, throughputKbps: 2000, cpuSlowdownMultiplier: 4, requestLatencyMs: 300, downloadThroughputKbps: 2000, uploadThroughputKbps: 1000 },
  });
try {
  for (const p of PAGES) {
    const all = [];
    for (let k = 0; k < RUNS; k++) all.push(await audit('http://localhost:4322/' + p));
    all.sort((x, y) => x.lhr.audits['largest-contentful-paint'].numericValue - y.lhr.audits['largest-contentful-paint'].numericValue);
    const lhr = all[Math.floor(all.length / 2)].lhr;
    const a = lhr.audits;
    const label = '/' + p;
    for (const [cat, min] of Object.entries(MIN)) check(lhr.categories[cat].score >= min, `${label} ${cat} ${Math.round(lhr.categories[cat].score * 100)} (min ${min * 100})`);
    const lcp = a['largest-contentful-paint'].numericValue;
    const cls = a['cumulative-layout-shift'].numericValue;
    const tti = a.interactive?.numericValue ?? lcp + a['total-blocking-time'].numericValue;
    check(lcp < LCP, `${label} LCP ${Math.round(lcp)} ms (< ${LCP})`);
    check(cls < CLS, `${label} CLS ${cls.toFixed(3)} (< ${CLS})`);
    check(tti <= TTI, `${label} interactive ${Math.round(tti)} ms (<= ${TTI})`);
    console.log(`      TBT ${Math.round(a['total-blocking-time'].numericValue)} ms (lab proxy for INP; real INP is measured in tests/qa/perf.spec.ts)`);
    for (const cat of ['accessibility', 'best-practices']) {
      for (const ref of lhr.categories[cat].auditRefs) {
        const au = a[ref.id];
        if (ref.weight > 0 && au.score !== null && au.score < 1) console.log(`      · ${cat}: ${au.id} — ${au.title}`);
      }
    }
    const errs = a['errors-in-console']?.details?.items ?? [];
    check(errs.length === 0, `${label} console errors: ${errs.length}${errs.length ? ' — ' + errs.map((e) => e.description).join(' | ') : ''}`);
  }
} finally {
  await chrome.kill();
  srv.close();
}
process.exit(fail ? 1 : 0);
