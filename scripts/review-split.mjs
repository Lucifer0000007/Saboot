// The two files a native speaker edits: translation/hi.md and translation/pa.md, one row per string in the order a judge
// sees them (the alert first, the site last), from docs/translation-review.md (`npm run i18n` writes that first).
//   node scripts/i18n-check.mjs --write && node scripts/review-split.mjs
// A reviewer corrects the third column in place and marks the last column ok or fixed; the edits are then applied to
// src/i18n/hi.ts and pa.ts by hand, and only the marked rows lose their `needs-native-review` flag.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const md = readFileSync('docs/translation-review.md', 'utf8').split('\n');
const rows = md.filter((l) => l.startsWith('| `')).map((l) => { const c = l.split(' | '); return { key: c[0].replace(/^\| `|`$/g, ''), en: c[1], hi: c[2], pa: c[3] }; });
const ORDER = ['al.', 'cap.', 'shot.', 'as.', 'pk.', 'k.', 'set.', 'reg.', 'hm.', 'fl.', 'st.', 'f.', 'prov.', 'net.', 'ctl.', 'sim.', 'nav.', 'hero.', 'pb.', 'faq.', 'foot.', 'tour.', 'arch.', 'wf.', 'rs.', 'how.'];
const rank = (k) => { const i = ORDER.findIndex((p) => k.startsWith(p)); return i < 0 ? ORDER.length : i; };
rows.sort((a, b) => rank(a.key) - rank(b.key));
mkdirSync('translation', { recursive: true });
for (const [lang, name] of [['hi', 'Hindi'], ['pa', 'Punjabi']]) {
  const out = [`# ${name} review: edit the ${name} column in place`, '',
    `Every ${name} string was machine-drafted. Read the English, correct the ${name} in the third column where it is wrong or unnatural`,
    '(keep it short and plain; a farmer under stress is reading it on a phone), and put `ok` or `fixed` in the last column. Leave the',
    'last column empty for anything you did not get to. Rows are in the order a judge sees them: the alert first, the site last.',
    'Do not translate the brand (सबूत / ਸਬੂਤ stays), and never add a promise the English does not make.', '',
    `| Key | English | ${name} | ok / fixed |`, '|---|---|---|---|',
    ...rows.map((r) => `| \`${r.key}\` | ${r.en} | ${r[lang]} |  |`), ''];
  writeFileSync(`translation/${lang}.md`, out.join('\n'));
  console.log(`translation/${lang}.md: ${rows.length} rows`);
}
