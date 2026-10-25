// Replay R-1, step 6 (docs/REPLAY-METHOD.md): write what the product may show, public/data/validation-status.json, from the run's
// summary. Raw counts, the source ID, the assumptions and "Rule B: not independently validated". No percentage is written: the
// screen shows a ratio only beside its counts. A fixture summary is refused.
//   node --import ./scripts/ts-resolve.mjs scripts/replay/publish.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import type { ReplaySummary } from './run.ts';

export interface ReplayStatus {
  v: 2;
  run: true;
  replay: {
    id: string;
    source: string;
    method: string;
    sample: Record<string, number>;
    farmland?: { ha: number; source: string };
    assumptions: string[];
    ruleB: string;
    scale: string;
    runs: ReplaySummary['runs'];
    credits: { text: string; url?: string }[];
  };
}

export function statusFromReplay(s: ReplaySummary): ReplayStatus {
  if (s.fixture) throw new Error('Refusing to publish: this summary was made from a test fixture, which is never shown in the product.');
  if (!Object.keys(s.runs).length) throw new Error('Refusing to publish: no runs in the summary.');
  return {
    v: 2,
    run: true,
    replay: {
      id: s.replay,
      source: s.source,
      method: s.method,
      sample: s.sample,
      farmland: s.farmland,
      assumptions: s.assumptions,
      ruleB: s.ruleB,
      scale: 'Rain is a 25 km grid cell and river discharge a daily value on a 5 km grid; the flood extent was mapped at tens of metres. Every point in one rain cell gets the same rain.',
      runs: s.runs,
      credits: [
        { text: 'Flood extent: Copernicus Emergency Management Service (© European Union), EMSR838, first delivered flood-extent products.' },
        { text: 'Rain (ERA5) and river discharge (GloFAS): weather data by Open-Meteo.com, CC BY 4.0, non-commercial use. Generated using Copernicus Climate Change Service information.', url: 'https://open-meteo.com/' },
      ],
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const summary = JSON.parse(readFileSync('qa/replay/summary.json', 'utf8')) as ReplaySummary;
  const status = statusFromReplay(summary);
  writeFileSync('public/data/validation-status.json', JSON.stringify(status) + '\n');
  console.log('published public/data/validation-status.json: Replay', status.replay.id, 'with', Object.keys(status.replay.runs).length, 'runs');
}
