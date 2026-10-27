// Write docs/recording-script.md from the dictionaries, so the text a native speaker records is the text the app shows.
//   node --import ./scripts/ts-resolve.mjs scripts/recording-script.mjs
import { writeFileSync } from 'node:fs';
import en from '../src/i18n/en.ts';
import hi from '../src/i18n/hi.ts';
import pa from '../src/i18n/pa.ts';

const CLIPS = [
  ['alert-relief', 'al.voice', 'The alert call, relief rail'],
  ['reg-relief', 'reg.voice', 'The registration call, relief rail'],
  ['alert-pmfby', 'al.voice.pmfby', 'The alert call, crop-insurance rail'],
  ['reg-pmfby', 'reg.voice.pmfby', 'The registration call, crop-insurance rail'],
];
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

const out = [
  '# Recording script: real Hindi and Punjabi voice lines',
  '',
  'Today the voice alert is a recorded clip in English and the phone\'s own speech engine in Hindi and Punjabi (many phones have no',
  'Punjabi voice, and the app then says so). Captions are always on screen. To add real audio, a native speaker records the',
  'eight lines below: four in Hindi, four in Punjabi, one pair per rail.',
  '',
  '> Generated from `src/i18n/*.ts` by `scripts/recording-script.mjs`: rerun it after any of these lines change.',
  '> The Hindi and Punjabi lines are machine-drafted and flagged `needs-native-review`. Read each one aloud first: if a word is',
  '> wrong or unnatural, say it correctly, and send the corrected text back so `src/i18n/hi.ts` or `pa.ts` is fixed to match the',
  '> recording. Do not translate the brand (सबूत / ਸਬੂਤ stays), and do not add a promise the English does not make.',
  '',
  '## How to record',
  '',
  '1. A quiet room, the phone about a hand\'s length away, one take per line, a normal speaking pace. Under 8 seconds each: the',
  '   importer compresses to at most 20 KB per clip (about 12 to 18 KB is normal).',
  '2. Save each as `alert-relief-hi.m4a`, `reg-relief-hi.m4a`, `alert-pmfby-hi.m4a`, `reg-pmfby-hi.m4a`, and the same four for `pa`.',
  '   Any format ffmpeg reads works.',
  '3. Import each one (Windows, with ffmpeg installed by you; nothing here installs it):',
  '',
  '```',
  'npm run audio:import -- -In C:\\rec\\alert-relief-hi.m4a -Clip alert-relief -Lang hi -Ffmpeg C:\\path\\to\\ffmpeg.exe',
  '```',
  '',
  '   `-Clip` is one of `alert-relief`, `reg-relief`, `alert-pmfby`, `reg-pmfby`; `-Lang` is `hi` or `pa`. The script writes',
  '   `public/audio/<clip>-<lang>.webm` and regenerates `src/lib/clips.ts`, which the app reads. Then `npm run build` and listen',
  '   once on a phone.',
  '4. Run `node scripts/budgets.mjs`: each clip must stay at or under 20 KB.',
  '',
  '## The eight lines',
  '',
  ...CLIPS.flatMap(([clip, key, what]) => [
    `### \`${clip}\`: ${what}`,
    '',
    '| Language | Say | Save as |',
    '|---|---|---|',
    `| English (already recorded) | ${cell(en[key])} | \`${clip}-en.webm\` |`,
    `| Hindi | ${cell(hi[key])} | \`${clip}-hi.webm\` |`,
    `| Punjabi | ${cell(pa[key])} | \`${clip}-pa.webm\` |`,
    '',
  ]),
];
writeFileSync('docs/recording-script.md', out.join('\n'));
console.log(`docs/recording-script.md: ${CLIPS.length} clips`);
