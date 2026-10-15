// Dev utility: print Lighthouse timing, request waterfall and failing a11y nodes for one route.
// Usage: node scripts/lh-debug.mjs "?tab=insurer"   (or "" for the landing page, "?at=alert")
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { serve } from './snap.mjs';
const srv = await serve('dist', 4323);
const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new'] });
const url = 'http://localhost:4323/' + (process.argv[2] || '');
const r = await lighthouse(url, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance','accessibility'], formFactor: 'mobile',
  screenEmulation: { mobile: true, width: 360, height: 740, deviceScaleFactor: 2, disabled: false }, throttlingMethod: 'simulate',
  throttling: { rttMs: 300, throughputKbps: 2000, cpuSlowdownMultiplier: 4, requestLatencyMs: 300, downloadThroughputKbps: 2000, uploadThroughputKbps: 1000 } });
const a = r.lhr.audits;
for (const id of ['first-contentful-paint','largest-contentful-paint','speed-index','total-blocking-time','interactive','max-potential-fid']) console.log(id, a[id]?.displayValue);
const lcpIns = Object.keys(a).filter((k) => /lcp/.test(k));
for (const k of lcpIns) console.log('AUDIT', k, String(JSON.stringify(a[k].details ?? a[k].displayValue)).slice(0, 600));
console.log('bootup', JSON.stringify(a['bootup-time']?.details?.items?.map(i=>[i.url.replace(url,''),Math.round(i.total),Math.round(i.scripting)])));
console.log('long tasks', JSON.stringify(a['long-tasks']?.details?.items?.map(i=>[i.url?.replace(url,''),Math.round(i.startTime),Math.round(i.duration)])));
console.log('mainthread', JSON.stringify(a['mainthread-work-breakdown']?.details?.items?.map(i=>[i.group,Math.round(i.duration)])));
console.log('requests', (a['network-requests'].details.items).map(i => `${i.url.replace(url,'')} ${Math.round(i.networkRequestTime)}-${Math.round(i.networkEndTime)} ${i.transferSize}`).join('\n'));
for (const id of Object.keys(a)) { const au=a[id]; if (au.score!==null && au.score<1 && r.lhr.categories.accessibility.auditRefs.find(x=>x.id===id)) console.log('A11Y', id, JSON.stringify(au.details?.items?.map(i=>i.node?.snippet).slice(0,5))); }
await chrome.kill(); srv.close();
