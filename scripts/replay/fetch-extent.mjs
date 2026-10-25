// Replay R-1, step 1 (docs/REPLAY-METHOD.md): fetch the public activation record of Copernicus EMS EMSR838 and the flood-extent layer
// of the first delivered product of each delineation area that has one. Plain GETs of public files: no login, no key, nothing
// is uploaded. The files go to data/replay/raw/ (not in git) with a manifest of address, size and SHA-256, so they can be
// fetched again and compared. Run: node scripts/replay/fetch-extent.mjs
import { createHash } from 'node:crypto';
import dns from 'node:dns';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// a network with a broken IPv6 route made Node's fetch time out where curl did not
dns.setDefaultResultOrder('ipv4first');

const RAW = 'data/replay/raw';
const RECORD = 'https://rapidmapping.emergency.copernicus.eu/backend/dashboard-api/public-activations/?code=EMSR838';
/** The areas of the method: those whose first delivered product lists a flood-extent layer. */
const AREAS = [1, 2, 3, 4, 5, 7, 8];

mkdirSync(join(RAW, 'extent'), { recursive: true });
// the raw folder stays out of git, except its manifest and this rule
writeFileSync(join(RAW, '.gitignore'), '*\n!.gitignore\n!manifest.json\n');
const manifestPath = join(RAW, 'manifest.json');
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : { files: {} };

async function get(url, file) {
  const path = join(RAW, file);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(path, buf);
  manifest.files[file] = {
    url,
    bytes: buf.length,
    sha256: createHash('sha256').update(buf).digest('hex'),
    etag: res.headers.get('etag'),
    lastModified: res.headers.get('last-modified'),
    retrieved: new Date().toISOString(),
  };
  console.log(`  ${file}: ${(buf.length / 1048576).toFixed(1)} MB`);
  return buf;
}

console.log('activation record');
const record = JSON.parse((await get(RECORD, 'emsr838.json')).toString('utf8')).results[0];
console.log(`  ${record.code} ${record.name}, event time ${record.eventTime}`);

console.log('flood-extent layers (first delivered product of each area)');
for (const n of AREAS) {
  const aoi = record.aois.find((a) => a.number === n);
  const product = aoi?.products.find((p) => p.type === 'DEL' && p.monitoring === false && p.feasible);
  const layer = product?.layers?.find((l) => /observedEventA/.test(l.name));
  if (!layer) throw new Error(`area ${n} has no first-delivery flood-extent layer`);
  await get(layer.json, `extent/AOI${String(n).padStart(2, '0')}.geojson`);
  manifest.files[`extent/AOI${String(n).padStart(2, '0')}.geojson`].area = { number: n, name: aoi.name, product: product.id, layer: layer.name };
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`manifest: ${manifestPath}`);
