# Design log

One entry per iteration of the redesign (`docs/DESIGN.md`): what changed, what the screenshot critique found, and what the
gates said. Screenshots: `node --import ./scripts/ts-resolve.mjs scripts/design-shots.mjs <dir>` after `npm run build`.

## Why an old UI was showing

`npm run dev` (port 5173) serves the source through Vite and never registers the service worker, so it always shows the
current code; a fresh browser context confirmed it (no worker, no cache, `src/main.tsx` served). Everything built (`npm
run preview` on 4173, the QA server on 4330, the demo receiver on 4443, the hosted site) registers a service worker that
answers every page load cache-first (`scripts/sw.mjs`). After a new build, the first load is still the previous build
from the cache; the new worker installs, skips waiting and takes over in the background, but nothing told the page, so
the old UI stayed on screen until the next reload (`npm run sw:update-check` shows it: "load 1 after deploy: old shell").
Each port is its own origin with its own cache, so a build checked on one port says nothing about another. Fixes: a build
stamp (version and build time, UTC) in the site footer and in Settings, and a "A new version of Saboot is ready. Reload"
bar the moment the new worker takes over a page the old one served; `scripts/check-sw-update.mjs` now asserts that bar.
To clear a browser by hand once: DevTools → Application → Storage → Clear site data, on the port in question.

## Iteration 0: before

`.cache/design-shots/before/` (234 shots: 13 states × 360x800, 768x1024, 1440x900 × en, hi, pa × light, dark; dark is
identical to light because the old UI has no dark theme). Critique of the old UI:

- The body and all labels are set in a monospace face in all caps: dense, mechanical, and slow to read for a farmer;
  it reads as a developer tool, not a public service.
- The hero is a centred serif headline over pastel gradient washes and a giant mono clock: the generic "editorial
  startup" look, with nothing that says farm, flood or evidence.
- One pill radius on every control and card, so nothing has rank; the officer console is a wall of identical outlined
  pills (jump chips, speed, network, rail, cadence) that compete with the content.
- The honest labels exist but look like every other pill; "Simulated" is repeated many times without a visual identity.
- The seal, the product's X factor, has no visual at all: a tag that says "Sealed" and a button in a list.
- No dark theme; the language switch is a small globe pill.

## Iteration 1: the foundation and a first pass over every screen

What changed:
- Tokens rewritten (`src/styles/tokens.css`): silt, paper, kali, khet, haldi, neel, lal, lac; a dark theme (`html.theme-dark`,
  from Settings or the device) and high contrast on top of both. `scripts/contrast.mjs` now checks 41 pairs in all three themes.
- Fonts (`scripts/build-fonts.py`): Anek Latin, Devanagari and Gurmukhi for headings and numbers, Noto Sans for text,
  JetBrains Mono only for hashes; Instrument Serif and the mono body are gone. OFL text in `public/fonts/OFL.txt`.
- Primitives (`base.css`): soft-rectangle buttons with one haldi primary and a kali edge, chips with the five label
  edges (solid, double, dotted on a hatch, dashed, haldi bar), notes with a strong left edge, a sunken segmented control.
- Every stylesheet moved to the new tokens; maps and charts draw in tokens so they follow the theme; the QR stays black
  on white. New: `src/ui/Seal.tsx` (open, sealed, verified, broken) on the landing board, the Proof screen, the import
  verdict and the ledger; a FIELD chip and an evidence strip that stays hidden while `src/lib/field.ts` is empty; a
  three-way language switch in the nav; Settings → Light or dark; the build stamp; the update bar.

Critique of the screenshots (`.cache/design-shots/it1/`):
- Better: the page now reads as a working tool for this subject: the hero board shows the seal, the clock and the
  labels; the alert is a signboard with a lal band; the console is dense and calm; the broken seal sits beside the
  integrity failure.
- At 150% text on a 360 px phone the nav wrapped to two rows (the bigger wordmark) and the replay time wrapped in the
  dock: the sticky chrome took 219 px of 640 (limit 30%). Fixed by restoring the old wordmark and time sizes.
- The Devanagari and Gurmukhi letters in the nav switch render in the device font on an English page (by design, so no
  Indic font downloads unasked) and sit a little small.

Gates: typecheck, lint, 223 unit tests, i18n, contrast (three themes), budgets (initial 97.9 KB, site 469.7 KB), and the
full Playwright suite: 583 of 584 passed on the first run, the one failure above fixed and its 22 tests rerun green.
New: 24 dark-theme tests (layout checks and axe on 12 states at 360 and 1440), all passing.

## Iteration 2: every screen in three languages and two themes, and the slowest paint

What the critique found (`.cache/design-shots/it2/`, 234 shots, plus how it works, limits, footer, Proof, explainer,
the import verdict and the offline strip):
- Hindi and Punjabi headings set well in Anek Devanagari and Gurmukhi; no overflow at 360 px (the QA matrix and the
  40%-longer pseudo-locale agree). The officer console stays English by design.
- The seal reads at every size: sealed on the board and the Proof screen, ringed and ticked when the import checks
  pass, cracked beside the integrity failure, a dashed ring when nothing is sealed yet.
- Too much empty space under the hero on a laptop: the bottom padding is one step smaller now.
- The social card (`public/og.jpg`) still showed the old parchment and blue: `scripts/og-image.mjs` now draws the new
  identity, seal included (it also pointed at font files that no longer exist).
- The farmer Home screen does not get its own language switch: it would push the alert's one action below the fold
  (a QA check holds it above the dock). Settings carries it, and `docs/DESIGN.md` says so.

Performance: Lighthouse read LCP 3.0 s against 2.5 s. The LCP element was the hero paragraph and the app did not repaint
it (every prerendered node survives hydration), but the entry script and the scenario data were requested before the first
paint, so the simulation counted their download and run time into LCP in some runs (readings split 2.3 s / 3.0 s).
`scripts/postbuild.mjs` now preloads them, in parallel, from the boot script the moment the first paint lands, and a deep
link's chunk waits for the same moment (`scripts/vite-plugins.mjs`). Result, median of 5 runs: LCP 2.11 s on all three
pages, interactive 2.92 / 2.92 / 2.55 s, performance 98, accessibility 100, best practices 100, CLS 0. The INP test reads
136 to 200 ms run to run on this machine; the previous build measures the same spread here (152 and 192 ms medians).

## Final gates

Typecheck, lint, 223 unit tests, i18n (609 keys, every Hindi and Punjabi line still flagged for native review), contrast
(41 pairs in light, dark and high contrast), facts, the validation fixture, 13 `{{VERIFY}}` markers (unchanged), build,
budgets (initial 97.9 KB of 200, site 473.6 KB of 700, no third-party URL), the full Playwright suite (608 passed: the 584
before plus 24 dark-theme tests; 564 captures, 0 problems), the service-worker update check (now with the update bar), and
Lighthouse at 5 runs (98 / 100 / 100 on all three pages, LCP 2.10 s, CLS 0). Before and after:
`docs/screenshots/redesign/before/` and `after/`.
