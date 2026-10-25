// The cache-first service worker, generated at build time from the files in dist/ (scripts/postbuild.mjs) and by
// scripts/check-sw-update.mjs, which proves that a new build replaces an old one. The cache name is a hash of every
// precached file, so any change to the build produces a new cache; activate() deletes the previous one.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

/** Not precached: the worker itself, host config and the social preview (crawlers only). The voice clips are (about 62 KB). */
const skip = (p) => p === 'sw.js' || p === '_headers' || p === 'og.jpg' || p.endsWith('.map');

const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));

export function writeServiceWorker(out) {
  const files = walk(out).map((p) => relative(out, p).replace(/\\/g, '/')).filter((p) => !skip(p));
  const h = createHash('sha256');
  for (const f of files) h.update(f + readFileSync(join(out, f)).length + createHash('sha1').update(readFileSync(join(out, f))).digest('hex'));
  const version = h.digest('hex').slice(0, 12);
  const precache = ['./', ...files.filter((f) => f !== 'index.html').map((f) => './' + f)];
  writeFileSync(join(out, 'sw.js'), `// Generated at build time. Cache-first app shell, voice clips included.
const V = 'saboot-${version}';
const PRECACHE = ${JSON.stringify(precache)};
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// A media element asks for a byte range. The cache holds the whole file, so answer with the slice as a 206, as a server does.
async function slice(req, hit) {
  const m = /^bytes=(\\d*)-(\\d*)$/.exec(req.headers.get('range') || '');
  if (!m || (m[1] === '' && m[2] === '')) return hit;
  const buf = await hit.arrayBuffer();
  const size = buf.byteLength;
  const start = m[1] === '' ? Math.max(0, size - Number(m[2])) : Number(m[1]);
  const end = m[1] === '' || m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
  if (start > end || start >= size) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: { 'Content-Type': hit.headers.get('Content-Type') || 'application/octet-stream', 'Content-Length': String(end - start + 1), 'Content-Range': 'bytes ' + start + '-' + end + '/' + size },
  });
}
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(caches.match('./', { ignoreSearch: true }).then((r) => r || fetch(req)));
    return;
  }
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) =>
      hit
        ? slice(req, hit)
        : fetch(req).then((res) => {
            // only a whole response can be stored: the cache rejects a 206, and a rejection must not surface
            if (res.status === 200 && res.type === 'basic') { const copy = res.clone(); caches.open(V).then((c) => c.put(req, copy)).catch(() => {}); }
            return res;
          })
    )
  );
});
`);
  return { version, count: precache.length };
}
