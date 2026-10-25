// Dev utility: serve dist/ and capture screenshots + console errors with headless Chrome.
// Usage: node scripts/snap.mjs <outDir> [name=url@WxH[:action,action...]] ...
// Actions: click:<text>  key:<key>  wait:<ms>  scroll:<selector>  js:<expression>  (window.__sab has QA hooks)
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { readFile, mkdir, stat } from 'node:fs/promises';
import { join, extname, resolve, sep } from 'node:path';
import { brotliCompressSync, gzipSync, constants } from 'node:zlib';
import puppeteer from 'puppeteer-core';
import { Launcher } from 'chrome-launcher';

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.webm': 'audio/webm', '.png': 'image/png', '.jpg': 'image/jpeg' };

/** dist/_headers (Netlify / Cloudflare Pages format): path patterns with indented "Name: value" lines. */
function headerRules(dir) {
  let txt;
  try { txt = readFileSync(join(dir, '_headers'), 'utf8'); } catch { return []; }
  const rules = [];
  let cur = null;
  for (const line of txt.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (/^\S/.test(line)) {
      const pat = line.trim();
      const test = pat.endsWith('/*') ? (p) => p.startsWith(pat.slice(0, -1)) : (p) => p === pat;
      cur = { test, headers: {} };
      rules.push(cur);
    } else if (cur) {
      const i = line.indexOf(':');
      cur.headers[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
    }
  }
  return rules;
}

/**
 * Serve a built folder like a static host: brotli/gzip, the headers from its `_headers` file, and optionally
 * mounted under a sub-path (`prefix: '/demo/'`) to prove relative URLs, the manifest and the worker scope hold there.
 */
/** The request handler of serve(): a static host for one built folder. Exported so another server (the demo receiver) can mount it. */
export function staticHandler(dir = 'dist', { prefix = '/', onRequest } = {}) {
  // It listens on every interface on purpose: a phone on the same Wi-Fi opens the laptop's address to rehearse the demo.
  // What it can serve is the built public site and nothing else (the path check below).
  // Compressed bodies are cached per file version (path + size + mtime), so parallel QA runs stay cheap.
  const cache = new Map();
  const rules = headerRules(dir);
  const mount = prefix.replace(/\/$/, '');
  return async (req, res) => {
    // QA can listen to exactly what reaches a server: the request line and its headers
    onRequest?.({ method: req.method, url: req.url, headers: req.headers });
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (mount) {
      if (p !== mount && !p.startsWith(mount + '/')) { res.writeHead(404); res.end('not found'); return; }
      p = p.slice(mount.length) || '/';
    }
    const route = p;
    if (p.endsWith('/')) p += 'index.html';
    try {
      // only files inside the served folder: "/..%2fpackage.json" decodes to a path outside it and gets a 404
      const root = resolve(dir);
      const file = resolve(root, '.' + p);
      if (file !== root && !file.startsWith(root + sep)) throw new Error('outside the served folder');
      const st = await stat(file);
      let body = await readFile(file);
      const headers = { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream', 'cache-control': 'no-cache' };
      for (const r of rules) if (r.test(route)) Object.assign(headers, r.headers);
      // Compress like any static host (Netlify / Vercel / Cloudflare Pages) would.
      const ae = String(req.headers['accept-encoding'] ?? '');
      if (!/\.(woff2|png|jpg|webm)$/.test(p)) {
        const enc = ae.includes('br') ? 'br' : ae.includes('gzip') ? 'gzip' : null;
        if (enc) {
          const key = `${enc}:${file}:${st.size}:${st.mtimeMs}`;
          if (!cache.has(key)) cache.set(key, enc === 'br' ? brotliCompressSync(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }) : gzipSync(body, { level: 9 }));
          body = cache.get(key);
          headers['content-encoding'] = enc;
        }
      }
      res.writeHead(200, headers);
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  };
}

export function serve(dir = 'dist', port = 4321, opts = {}) {
  const srv = http.createServer(staticHandler(dir, opts));
  return new Promise((r) => srv.listen(port, () => r(srv)));
}

async function main() {
  const [out, ...specs] = process.argv.slice(2);
  await mkdir(out, { recursive: true });
  const srv = await serve();
  const browser = await puppeteer.launch({ executablePath: Launcher.getInstallations()[0], headless: true, args: ['--no-sandbox'] });
  const errors = [];
  for (const spec of specs) {
    const name = spec.slice(0, spec.indexOf('=')), rest = spec.slice(spec.indexOf('=') + 1); // the URL may contain '='
    const [urlSize, actions = ''] = rest.split(/:(?=[a-z]+:|$)/).length > 1 ? [rest.slice(0, rest.indexOf(':', rest.indexOf('@'))), rest.slice(rest.indexOf(':', rest.indexOf('@')) + 1)] : [rest, ''];
    const [path, size] = urlSize.split('@');
    const [w, h] = size.split('x').map(Number);
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    page.on('console', (m) => m.type() === 'error' && errors.push(`${name}: ${m.text()}`));
    page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: w < 700, hasTouch: w < 700 });
    await page.goto('http://localhost:4321/' + path, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#simulation .farmer', { timeout: 10000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 300));
    for (const a of actions.split(',').filter(Boolean)) {
      const [kind, ...arg] = a.split(':');
      const v = arg.join(':');
      if (kind === 'click') {
        await page.evaluate((txt) => {
          const el = [...document.querySelectorAll('button, a')].find((b) => b.textContent.trim().includes(txt) || b.getAttribute('aria-label') === txt);
          if (!el) throw new Error('no element ' + txt + ' in: ' + document.body.innerText.slice(0, 300));
          el.click();
        }, v);
      } else if (kind === 'key') await page.keyboard.press(v);
      else if (kind === 'wait') await new Promise((r) => setTimeout(r, +v));
      else if (kind === 'offline') await page.setOfflineMode(true);
      else if (kind === 'sel') await page.click(v);
      else if (kind === 'reload') await page.reload({ waitUntil: 'load' });
      else if (kind === 'scroll') await page.evaluate((s) => document.querySelector(s)?.scrollIntoView(), v);
      else if (kind === 'js') await page.evaluate((code) => Promise.resolve(new Function('return (' + code + ')')()), v.replace(/~/g, ','));
      await new Promise((r) => setTimeout(r, 350));
    }
    await page.screenshot({ path: join(out, name + '.png'), fullPage: name.startsWith('full') });
    await ctx.close();
  }
  await browser.close();
  srv.close();
  console.log(errors.length ? 'CONSOLE ERRORS:\n' + errors.join('\n') : 'no console errors');
}

if (process.argv[1]?.endsWith('snap.mjs')) main();
