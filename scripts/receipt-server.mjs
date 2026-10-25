// Optional demo receiver. Serves the built site over HTTPS on every interface (a mkcert certificate given on the command
// line) and accepts a signed evidence code POSTed from a phone that opened the app from this address. It stamps this
// laptop's clock, keeps the codes in a JSON file under .cache/, and lets the officer console list them. It never verifies
// a code: the console does that in the browser. Not the QA server (scripts/serve-dist.mjs), and not a backend.
//   node scripts/receipt-server.mjs --cert <pem> --key <pem> [--port 4443] [--dir dist] [--store .cache/receipts.json]
import https from 'node:https';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';
import { staticHandler } from './snap.mjs';

/** A code is about 338 characters; anything bigger is not one. */
export const MAX_BODY = 4096;
/** The shape of a code: the base64url alphabet and the length rule the verifier applies. Not verification. */
export const codeShape = (s) => typeof s === 'string' && s.length > 0 && s.length <= 1024 && s.length % 4 !== 1 && /^[A-Za-z0-9_-]+$/.test(s);

const DEFAULT_STORE = fileURLToPath(new URL('../.cache/receipts.json', import.meta.url));

/** The two routes. The handler answers true when it handled the request, false to let the static handler serve it. */
export function receiptRoutes({ store = DEFAULT_STORE, now = Date.now, log = () => {} } = {}) {
  const read = () => (existsSync(store) ? JSON.parse(readFileSync(store, 'utf8')) : { v: 1, receipts: [] });
  // tens of entries in a demo: the whole file is rewritten each time
  const write = (d) => { mkdirSync(dirname(store), { recursive: true }); writeFileSync(store, JSON.stringify(d, null, 1) + '\n'); };
  const json = (res, status, body) => {
    res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(JSON.stringify(body));
  };
  const body = (req) =>
    new Promise((resolve, reject) => {
      const parts = [];
      let size = 0;
      req.on('data', (c) => {
        size += c.length;
        // too big to be a code: the rest is drained (not cut off, or the phone never sees the answer) and refused at the end
        if (size > MAX_BODY) { parts.length = 0; return; }
        parts.push(c);
      });
      req.on('end', () => (size > MAX_BODY ? reject(Object.assign(new Error('too large'), { status: 413 })) : resolve(Buffer.concat(parts).toString('utf8'))));
      req.on('error', reject);
    });
  return async (req, res) => {
    const path = new URL(req.url, 'http://x').pathname;
    if (req.method !== 'POST' || (path !== '/receipt' && path !== '/receipts')) return false;
    // POST for the list on purpose: the service worker never caches a POST, so the console always sees the latest
    if (path === '/receipts') { json(res, 200, read()); return true; }
    let code;
    try {
      code = JSON.parse(await body(req)).code;
    } catch (e) {
      json(res, e?.status ?? 400, { ok: false });
      return true;
    }
    if (!codeShape(code)) { json(res, 400, { ok: false }); return true; }
    const d = read();
    // a retried send keeps its first receipt time
    const dup = d.receipts.find((r) => r.code === code);
    const receivedAt = dup ? dup.receivedAt : now();
    if (!dup) { d.receipts.push({ code, receivedAt }); write(d); }
    // nothing else is kept: no address, no browser string
    log(`receipt ${d.receipts.length} at ${new Date(receivedAt).toISOString()} (${code.length} chars)`);
    json(res, 200, { ok: true, receivedAt });
    return true;
  };
}

/** One handler: the receipt routes first, then the static site. */
export function compose(routes, fallback) {
  return async (req, res) => { if (!(await routes(req, res))) await fallback(req, res); };
}

function arg(name, dflt) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : dflt;
}

async function main() {
  const cert = arg('--cert'), key = arg('--key');
  if (!cert || !key) {
    console.error('usage: node scripts/receipt-server.mjs --cert <pem> --key <pem> [--port 4443] [--dir dist] [--store .cache/receipts.json]');
    console.error("The certificate comes from mkcert, made by you for this laptop's address (docs/SETUP.md).");
    process.exit(2);
  }
  const port = +arg('--port', 4443), dir = arg('--dir', 'dist'), store = arg('--store', DEFAULT_STORE);
  const handler = compose(receiptRoutes({ store, log: (m) => console.log('  ' + m) }), staticHandler(dir));
  const srv = https.createServer({ key: readFileSync(key), cert: readFileSync(cert) }, handler);
  await new Promise((r) => srv.listen(port, r));
  const ips = Object.values(networkInterfaces()).flat().filter((x) => x && x.family === 'IPv4' && !x.internal).map((x) => x.address);
  console.log(`demo receiver: serving ${dir}/ over HTTPS on port ${port}; receipts in ${store}`);
  for (const ip of ips) {
    console.log(`  phone:  https://${ip}:${port}/?receiver=1&at=alert`);
    console.log(`  laptop: https://${ip}:${port}/?receiver=1&tab=insurer   (open by IP, not localhost)`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
