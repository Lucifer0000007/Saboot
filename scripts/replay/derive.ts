// Replay R-1, step 4 (docs/REPLAY-METHOD.md): turn the saved API responses into the harness's input files. No network: it reads
// data/replay/raw/ and writes data/replay/derived/rainfall.csv, river.csv and PROVENANCE.json (plots.csv and confirmed.csv come
// from sample.ts). The danger level of each river point is the method's labelled percentile of its baseline days.
// Run: node --import ./scripts/ts-resolve.mjs scripts/replay/derive.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { percentile } from './geo.ts';
import { RIVERS, METHOD } from './sample.ts';

const RAW = 'data/replay/raw';
const OUT = 'data/replay/derived';
const manifest = JSON.parse(readFileSync(`${RAW}/manifest.json`, 'utf8')) as { files: Record<string, { url: string; sha256: string; retrieved: string; bytes: number }> };
const sample = JSON.parse(readFileSync(`${OUT}/sample.json`, 'utf8')) as { windows: { baseline: [string, string] }; rainCells: { lat: number; lon: number }[] };

// ---- rain: one row per hour per cell. The API stamps an hour with the START of the hour its value covers; the harness wants
// the END, so one hour is added. Zero rows are written too: the harness needs them to see that the station reported.
const rain: string[] = [];
let rainRows = 0;
for (const c of sample.rainCells) {
  for (const win of ['quiet', 'event'] as const) {
    const r = JSON.parse(readFileSync(`${RAW}/weather/rain_${c.lat}_${c.lon}_${win}.json`, 'utf8')) as { latitude: number; longitude: number; hourly: { time: string[]; precipitation: (number | null)[] } };
    const id = `ERA5-${r.latitude}-${r.longitude}`;
    r.hourly.time.forEach((t, i) => {
      const mm = r.hourly.precipitation[i];
      if (mm === null || mm === undefined) return; // a missing hour stays missing: the harness's coverage check sees the gap
      const end = new Date(Date.parse(t + ':00Z') + 3600e3).toISOString().replace('.000Z', 'Z');
      rain.push(`${id},${r.latitude},${r.longitude},${end},${mm},1`);
      rainRows++;
    });
  }
}
writeFileSync(
  `${OUT}/rainfall.csv`,
  ['# Replay R-1 rain: hourly ERA5 precipitation from the Open-Meteo historical weather API, one grid cell per station id. time_utc is the END of the hour. See data/replay/README.md for licence and credit.',
    'station_id,lat,lon,time_utc,rain_mm,interval_h', ...rain].join('\n') + '\n',
);

// ---- river: one row per day per point, stamped at the END of the day it describes. The danger level is the method's
// percentile of the baseline days, computed here and written on every row.
const river: string[] = [];
const dangers: Record<string, { danger: number; baselineDays: number; baselineMin: number; baselineMax: number }> = {};
const [b0, b1] = sample.windows.baseline;
for (const p of RIVERS) {
  const r = JSON.parse(readFileSync(`${RAW}/weather/river_${p.id}.json`, 'utf8')) as { latitude: number; longitude: number; daily: { time: string[]; river_discharge: (number | null)[] } };
  const days = r.daily.time.map((t, i) => [t, r.daily.river_discharge[i]] as const).filter((x): x is readonly [string, number] => x[1] !== null && x[1] !== undefined);
  const base = days.filter(([t]) => t >= b0 && t <= b1).map(([, v]) => v);
  if (base.length < METHOD.baselineDays * 0.9) throw new Error(`${p.id}: only ${base.length} baseline days`);
  const danger = Math.round(percentile(base, METHOD.dangerPercentile) * 100) / 100;
  dangers[p.id] = { danger, baselineDays: base.length, baselineMin: Math.min(...base), baselineMax: Math.max(...base) };
  for (const [t, v] of days) {
    const end = new Date(Date.parse(t + 'T00:00:00Z') + 86400e3).toISOString().replace('.000Z', 'Z');
    river.push(`${p.id},${r.latitude},${r.longitude},release,m3/s,${danger},${end},${v}`);
  }
}
writeFileSync(
  `${OUT}/river.csv`,
  [`# Replay R-1 river: daily discharge (GloFAS v4 through the Open-Meteo flood API) at three fixed points. time_utc is the END of the day. danger_level is NOT an official level: it is the ${Math.round(METHOD.dangerPercentile * 100)}th percentile of the point's own daily discharge over the baseline days ${b0} to ${b1} (docs/REPLAY-METHOD.md).`,
    'gauge_id,lat,lon,kind,unit,danger_level,time_utc,value', ...river].join('\n') + '\n',
);

// ---- provenance, from the manifest of the raw files
const retrievedOn = (prefix: string) => {
  const dates = Object.entries(manifest.files).filter(([k]) => k.startsWith(prefix)).map(([, v]) => v.retrieved.slice(0, 10));
  return [...new Set(dates)].sort().join(', ');
};
const extentFiles = Object.entries(manifest.files).filter(([k]) => k.startsWith('extent/'));
const prov = {
  _dataset: 'Replay R-1: Copernicus EMS activation EMSR838 flood extent, with ERA5 rain and GloFAS discharge from Open-Meteo',
  _method: 'docs/REPLAY-METHOD.md, committed before this run',
  'rainfall.csv': {
    source: 'Open-Meteo historical weather API, model era5 (ECMWF ERA5 reanalysis, 0.25 degree, hourly precipitation)',
    licence: 'CC BY 4.0 (Open-Meteo, non-commercial use). Generated using Copernicus Climate Change Service information.',
    retrieved: retrievedOn('weather/rain_'),
    url: 'https://open-meteo.com/en/docs/historical-weather-api',
    notes: `${sample.rainCells.length} grid cells, 2 windows, ${rainRows} hourly rows; saved responses in data/replay/raw/weather/ (manifest has each address and SHA-256)`,
  },
  'river.csv': {
    source: 'Open-Meteo flood API (GloFAS v4 river discharge, about 5 km, daily). For this period the values come from the archived forecast runs, not the consolidated reanalysis.',
    licence: 'CC BY 4.0 (Open-Meteo, non-commercial use). GloFAS is a Copernicus Emergency Management Service product.',
    retrieved: retrievedOn('weather/river_'),
    url: 'https://open-meteo.com/en/docs/flood-api',
    notes: 'Three fixed points. danger_level is a labelled scenario parameter (a percentile of the baseline days), not an official level: ' + JSON.stringify(dangers),
  },
  'confirmed.csv': {
    source: 'Copernicus Emergency Management Service rapid mapping, activation EMSR838, flood-extent layer (observedEventA) of the first delivered product of areas 1, 2, 3, 4, 5, 7 and 8; the quiet window is assumed, not confirmed',
    licence: 'Copernicus EMS products are free, open and free of charge. Credit: Copernicus Emergency Management Service (© European Union), EMSR838.',
    retrieved: retrievedOn('extent/'),
    url: 'https://rapidmapping.emergency.copernicus.eu/EMSR838/',
    notes: 'Layers used: ' + extentFiles.map(([k, v]) => `${k} (${v.bytes} bytes, sha256 ${v.sha256.slice(0, 12)})`).join('; '),
  },
  'plots.csv': {
    source: 'Grid points sampled inside the published outlines of the same activation (scripts/replay/sample.ts, docs/REPLAY-METHOD.md): low_lying is assumed 1 for every point, river_reach is a nominal 48 km at 4 km/h',
    licence: 'Derived from the Copernicus EMS outlines above, same terms',
    retrieved: retrievedOn('emsr838.json'),
    notes: 'Not fields and not farmers: sample points of a flood map.',
  },
};
writeFileSync(`${OUT}/PROVENANCE.json`, JSON.stringify(prov, null, 2) + '\n');
console.log(`rainfall.csv ${rainRows} rows; river.csv ${river.length} rows; danger levels ${JSON.stringify(Object.fromEntries(Object.entries(dangers).map(([k, v]) => [k, v.danger])))}`);
