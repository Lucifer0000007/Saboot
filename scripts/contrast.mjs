// Contrast gate over every text/background token pair the UI uses (values read from tokens.css).
// Fails under 4.5:1 for text, 3:1 for large text and UI boundaries (WCAG 2.2 AA). Rendered pages are
// additionally checked by axe in the QA suite.
import { readFileSync } from 'node:fs';

const css = readFileSync('src/styles/tokens.css', 'utf8');
const root = css.slice(css.indexOf(':root'), css.indexOf('}', css.indexOf(':root')));
const T = Object.fromEntries([...root.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2].toLowerCase()]));

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
/** colour `fg` at `alpha` over `bg` */
const over = (fg, alpha, bg) => toHex(hex(fg).map((c, i) => c * alpha + hex(bg)[i] * (1 - alpha)));
const lum = (h) => {
  const [r, g, b] = hex(h).map((c) => c / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
// High contrast overrides some tokens (html.hc in tokens.css). Every pair is checked again with them.
const hcBlock = css.slice(css.indexOf('html.hc'), css.indexOf('}', css.indexOf('html.hc')));
const HC = { ...T, ...Object.fromEntries([...hcBlock.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2].toLowerCase()])) };
/** A pair's colour in a token set: a token name, a hex, or a function of the set (a wash over the page). */
const colour = (set, k) => (typeof k === 'function' ? k(set) : k.startsWith('#') ? k : set[k] ?? (() => { throw new Error('unknown token --' + k); })());
const name = (k) => (typeof k === 'function' ? 'wash' : k);

// [use, foreground, background, kind]   kind: text (4.5) | large (3, >= 24px or 18.66px bold) | ui (3)
const P = [
  ['Body text', 'off-black', 'parchment', 'text'],
  ['Secondary text', 'graphite', 'parchment', 'text'],
  ['Large decorative text (smoke)', 'smoke', 'parchment', 'large'],
  ['Primary pill label', 'white', 'lake-blue', 'text'],
  ['Secondary pill label', 'white', 'off-black', 'text'],
  ['Announcement bar', 'parchment', 'ink', 'text'],
  ['Elevated card text', 'off-black', 'periwinkle-mist', 'text'],
  ['Secondary text on elevated card', 'graphite', 'periwinkle-mist', 'text'],
  ['Countdown > 24 h (ink)', 'ink', 'periwinkle-mist', 'large'],
  ['Countdown < 24 h (amber)', 'warn', 'periwinkle-mist', 'large'],
  ['Countdown expired (red)', 'bad', 'periwinkle-mist', 'large'],
  ['Supported tag', 'ok', 'ok-tint', 'text'],
  ['Partial tag / warning note', 'warn', 'warn-tint', 'text'],
  ['Insufficient tag / error note', 'bad', 'bad-tint', 'text'],
  ['Supported text on page', 'ok', 'parchment', 'text'],
  ['Warning flag on page', 'warn', 'parchment', 'text'],
  ['Error text on page', 'bad', 'parchment', 'text'],
  ['Warning flag on a selected (white) row', 'warn', 'white', 'text'],
  ['Text on white (captions, inputs, map)', 'off-black', 'white', 'text'],
  ['Secondary text on white', 'graphite', 'white', 'text'],
  ['Offline strip', 'white', 'off-black', 'text'],
  ['Selected segment', 'white', 'off-black', 'text'],
  ['Control boundary (smoke) on page', 'smoke', 'parchment', 'ui'],
  ['Control boundary (smoke) on white', 'smoke', 'white', 'ui'],
  ['Focus ring', 'off-black', 'parchment', 'ui'],
  ['Focus ring on announcement bar', 'parchment', 'ink', 'ui'],
  ['Hero caption on coral wash', 'off-black', (S) => over(S.coral, 0.72, S.parchment), 'text'],
  ['Hero caption on sky wash', 'off-black', (S) => over(S.sky, 0.78, S.parchment), 'text'],
  ['Hero caption on mint wash', 'off-black', (S) => over(S.mint, 0.68, S.parchment), 'text'],
  ['Map labels on flood (sky 70%)', 'off-black', (S) => over(S.sky, 0.7, S.white), 'text'],
];

let fail = 0;
for (const [use, f, b, kind] of P) {
  const r = ratio(colour(T, f), colour(T, b));
  const min = kind === 'text' ? 4.5 : 3;
  const ok = r >= min;
  if (!ok) fail++;
  console.log(`  ${ok ? '✓' : '✗'} ${r.toFixed(2).padStart(5)}:1  ${use} (${kind}, min ${min}) — ${name(f)} on ${name(b)}`);
}
console.log(fail ? `\n✗ ${fail} contrast pair(s) below the minimum` : `\n✓ ${P.length} token pairs meet WCAG AA`);

// High contrast: AA again, and no pair may be weaker than in the normal theme (that would defeat the switch).
let hcFail = 0;
for (const [use, f, b, kind] of P) {
  const r = ratio(colour(HC, f), colour(HC, b));
  const was = ratio(colour(T, f), colour(T, b));
  const min = kind === 'text' ? 4.5 : 3;
  if (r < min || r < was - 0.005) {
    hcFail++;
    console.log(`  ✗ high contrast ${r.toFixed(2)}:1 (normal ${was.toFixed(2)}:1, min ${min})  ${use}`);
  }
}
console.log(hcFail ? `\n✗ ${hcFail} pair(s) weaker in high contrast` : `✓ high contrast: all ${P.length} pairs meet AA and none is weaker than in the normal theme`);
process.exit(fail || hcFail ? 1 : 0);
