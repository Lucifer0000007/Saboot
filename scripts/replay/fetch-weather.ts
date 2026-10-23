// Replay R-1, step 3 (docs/REPLAY-METHOD.md): fetch hourly ERA5 rain for every rain cell the sample touches, in both windows, and
// daily river discharge at the three river points. Plain GETs of the public Open-Meteo APIs: no key, no login, nothing is
// uploaded. Responses are saved untouched in data/replay/raw/weather/ (not in git) with their address, size and SHA-256 in
// the manifest. Run: node --import ./scripts/ts-resolve.mjs scripts/replay/fetch-weather.ts  [--refresh]
import { createHash } from 'node:crypto';
import dns from 'node:dns';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { RIVERS, METHOD } from './sample.ts';

// a network with a broken IPv6 route made Node's fetch time out where curl did not
dns.setDefaultResultOrder('ipv4first');

const RAW = 'data/replay/raw';
const refresh = process.argv.includes('--refresh');
const sample = JSON.parse(readFileSync('data/replay/derived/sample.json', 'utf8')) as {
  windows: { event: [string, string]; quiet: [string, string] };
  rainCells: { lat: number; lon: number }[];
};
const day = (iso: string, plus = 0) => new Date(Date.parse(iso) + plus * 86400e3).toISOString().slice(0, 10);

const manifestPath = `${RAW}/manifest.json`;
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { files: Record<string, unknown> };
mkdirSync(`${RAW}/weather`, { recursive: true });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function get(url: string, file: string) {
  const path = `${RAW}/${file}`;
  if (!refresh && existsSync(path)) return;
  let last: unknown = null;
  for (const wait of [0, 1000, 3000]) {
    if (wait) await sleep(wait);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      JSON.parse(buf.toString('utf8')); // a response that is not JSON is an error, not data
      writeFileSync(path, buf);
      manifest.files[file] = { url, bytes: buf.length, sha256: createHash('sha256').update(buf).digest('hex'), retrieved: new Date().toISOString() };
      await sleep(250); // the free tier allows 600 requests a minute; this is far under
      return;
    } catch (e) {
      last = e;
    }
  }
  throw new Error(`${url}: ${(last as Error).message}`);
}

// rain: one request per cell per window, from 24 hours before the window opens (a day earlier, whole days) to its end
const windows = {
  event: [day(sample.windows.event[0], -1), day(sample.windows.event[1])],
  quiet: [day(sample.windows.quiet[0], -1), day(sample.windows.quiet[1])],
} as const;
let n = 0;
for (const c of sample.rainCells) {
  for (const [name, [s, e]] of Object.entries(windows)) {
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${c.lat}&longitude=${c.lon}&start_date=${s}&end_date=${e}&hourly=precipitation&models=era5&timezone=GMT`;
    await get(url, `weather/rain_${c.lat}_${c.lon}_${name}.json`);
    n++;
  }
}
console.log(`rain: ${n} requests for ${sample.rainCells.length} cells in 2 windows`);

// river: daily discharge from the start of the quiet window to the end of the event window
for (const r of RIVERS) {
  const url = `https://flood-api.open-meteo.com/v1/flood?latitude=${r.lat}&longitude=${r.lon}&daily=river_discharge&start_date=${day(sample.windows.quiet[0])}&end_date=${day(sample.windows.event[1])}`;
  await get(url, `weather/river_${r.id}.json`);
}
console.log(`river: ${RIVERS.length} points`);
void METHOD;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log('manifest updated');
