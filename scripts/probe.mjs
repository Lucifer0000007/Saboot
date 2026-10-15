// Dev utility: run a JS expression in the built app after optional actions. node scripts/probe.mjs "<url>" "<expr>" [lang]
import puppeteer from 'puppeteer-core';
import { Launcher } from 'chrome-launcher';
import { serve } from './snap.mjs';
const [url, expr, lang] = process.argv.slice(2);
const srv = await serve('dist', 4325);
const b = await puppeteer.launch({ executablePath: Launcher.getInstallations()[0], headless: true });
const p = await b.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', e.stack));
await p.setViewport({ width: 360, height: 740 });
if (lang) await p.evaluateOnNewDocument((l) => localStorage.setItem('saboot.lang', JSON.stringify(l)), lang);
await p.goto('http://localhost:4325/' + url, { waitUntil: 'networkidle0' });
await p.waitForSelector('#simulation .farmer').catch(() => {});
await new Promise((r) => setTimeout(r, 800));
console.log(await p.evaluate(expr));
await b.close(); srv.close();
