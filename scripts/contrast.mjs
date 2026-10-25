// Contrast gate over every text/background token pair the UI uses (values read from tokens.css).
// Fails under 4.5:1 for text, 3:1 for large text and UI boundaries (WCAG 2.2 AA). Rendered pages are
// additionally checked by axe in the QA suite.
import { readFileSync } from 'node:fs';

const css = readFileSync('src/styles/tokens.css', 'utf8');
/** The #rrggbb tokens of the first block that opens with `selector {`. */
const block = (selector) => {
  const at = css.indexOf(selector + ' {');
  if (at < 0) throw new Error(`tokens.css has no ${selector} block`);
  return Object.fromEntries([...css.slice(at, css.indexOf('}', at)).matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2].toLowerCase()]));
};
const T = block(':root');
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
/** colour `fg` at `alpha` over `bg` */
const over = (fg, alpha, bg) => toHex(hex(fg).map((c, i) => c * alpha + hex(bg)[i] * (1 - alpha)));
const lum = (h) => {
  const [r, g, b] = hex(h).map((c) => c / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
// Dark (html.theme-dark) and high contrast (html.hc) override tokens; every pair is checked again with each.
const DARK = { ...T, ...block('html.theme-dark') };
const HC = { ...T, ...block('html.hc') };
/** A pair's colour in a token set: a token name, a hex, or a function of the set (a wash over the page). */
const colour = (set, k) => (typeof k === 'function' ? k(set) : k.startsWith('#') ? k : set[k] ?? (() => { throw new Error('unknown token --' + k); })());
const name = (k) => (typeof k === 'function' ? 'hatch' : k);

// [use, foreground, background, kind]   kind: text (4.5) | large (3, >= 24px or 18.66px bold) | ui (3)
const P = [
  ['Body text on the page', 'kali', 'silt', 'text'],
  ['Body text on paper (cards, sheets, tables)', 'kali', 'paper', 'text'],
  ['Secondary text on the page', 'kali-2', 'silt', 'text'],
  ['Secondary text on paper', 'kali-2', 'paper', 'text'],
  ['Tertiary text on the page (large only)', 'kali-3', 'silt', 'large'],
  ['Tertiary text on paper (large only)', 'kali-3', 'paper', 'large'],
  ['Text on a sunken well', 'kali', 'sunk', 'text'],
  ['Secondary text on a sunken well', 'kali-2', 'sunk', 'text'],
  ['Primary action label (haldi)', 'haldi-ink', 'haldi', 'text'],
  ['Text on a haldi tint (field label, focus band)', 'kali', 'haldi-tint', 'text'],
  ['Dark button / selected segment / offline strip', 'silt', 'kali', 'text'],
  ['Text on a khet fill', 'on-fill', 'khet', 'text'],
  ['Text on a neel fill', 'on-fill', 'neel', 'text'],
  ['Text on a lal fill', 'on-fill', 'lal', 'text'],
  ['Khet text on the page (brand, live label)', 'khet', 'silt', 'text'],
  ['Khet text on paper', 'khet', 'paper', 'text'],
  ['Neel text on the page (links, replay label)', 'neel', 'silt', 'text'],
  ['Neel text on paper', 'neel', 'paper', 'text'],
  ['Lal text on the page (alerts)', 'lal', 'silt', 'text'],
  ['Lal text on paper', 'lal', 'paper', 'text'],
  ['Supported tag / ok note', 'ok', 'ok-tint', 'text'],
  ['Partial tag / warning note', 'warn', 'warn-tint', 'text'],
  ['Insufficient tag / error note', 'bad', 'bad-tint', 'text'],
  ['Replay chip / water note', 'neel', 'neel-tint', 'text'],
  ['Live chip on its tint', 'khet', 'khet-tint', 'text'],
  ['Ok text on the page', 'ok', 'silt', 'text'],
  ['Warning text on the page', 'warn', 'silt', 'text'],
  ['Warning text on paper (a selected row)', 'warn', 'paper', 'text'],
  ['Error text on the page', 'bad', 'silt', 'text'],
  ['Error text on paper', 'bad', 'paper', 'text'],
  ['Simulated chip text on its hatch', 'kali-2', (S) => over(S.kali, 0.12, S.paper), 'text'],
  ['Announcement strip on its hatch', 'haldi-ink', (S) => over(S['haldi-ink'], 0.12, S.haldi), 'text'],
  ['Control boundary on the page', 'rule-strong', 'silt', 'ui'],
  ['Control boundary on paper', 'rule-strong', 'paper', 'ui'],
  ['Focus ring on the page', 'kali', 'silt', 'ui'],
  ['Focus ring on paper', 'kali', 'paper', 'ui'],
  ['Primary action edge on the page', 'haldi-edge', 'silt', 'ui'],
  ['Primary action edge on paper', 'haldi-edge', 'paper', 'ui'],
  ['The seal on paper', 'lac', 'paper', 'ui'],
  ['Seal mark on the seal', 'paper', 'lac', 'ui'],
  ['Flood water on a plot (map)', 'water-deep', 'paper', 'ui'],
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

// Dark: AA again with the dark tokens.
let darkFail = 0;
for (const [use, f, b, kind] of P) {
  const r = ratio(colour(DARK, f), colour(DARK, b));
  const min = kind === 'text' ? 4.5 : 3;
  if (r < min) {
    darkFail++;
    console.log(`  ✗ dark ${r.toFixed(2)}:1 (min ${min})  ${use} — ${name(f)} on ${name(b)}`);
  }
}
console.log(darkFail ? `
✗ ${darkFail} pair(s) below the minimum in dark` : `✓ dark: all ${P.length} pairs meet AA`);

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
process.exit(fail || darkFail || hcFail ? 1 : 0);
