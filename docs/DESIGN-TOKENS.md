# Design tokens

Every colour, size, radius, layer and sticky height lives in `src/styles/tokens.css`; `scripts/contrast.mjs` reads that file and
fails on any text pair under 4.5:1 (3:1 for large text and control boundaries), in the normal theme and again in high contrast.
This page says what the tokens mean and why they are what they are. Nothing here is decoration: every rule answers a person
reading on a mid-range phone, often in Hindi or Punjabi, often after a flood.

## Colour

| Token | Value | Role |
|---|---|---|
| `--parchment` | `#f6f3f1` | the page |
| `--lake-blue` | `#2b59d1` | the one primary action on a screen (the QA "one blue primary" check matches this exact value: do not change it) |
| `--periwinkle-mist` | `#cfdaf5` | the elevated card: the alert, the consent sentence |
| `--off-black`, `--ink` | `#242424`, `#000000` | text; `--ink` only for the countdown |
| `--graphite`, `--smoke`, `--ash` | `#4e4d4d`, `#797776`, `#cecac8` | secondary text, control boundaries, hairlines |
| `--ok`, `--warn`, `--bad` and their tints | green, amber, red | status, never alone: each carries a shape and words |
| `--coral`, `--sky`, `--mint`, `--gold` | washes | decorative only, never under text that matters |

High contrast (`html.hc`, from Settings) replaces the page and card with white, every grey with black, the tints with white and
the hairlines with 2 px black. The primary blue and the type do not change.

## Type

Two families, one job each, plus the system's own face for reading on the phone.

| Token | Face | Where |
|---|---|---|
| `--font-head` | Saboot Serif (Instrument Serif subset) | headings, the words countdown, the farmer's name |
| `--font-body` | Saboot Mono (JetBrains Mono subset) | the site and the officer console: labels, pills, tags, tables |
| `--font-num` | Saboot Mono | every number, hash and code, everywhere: equal widths carry meaning |
| `--font-read` | `system-ui` and friends | **reading text in the farmer app**: about 34 characters a line on a 360 px phone against 24 in the mono, for zero extra bytes |

Hindi and Punjabi switch `--font-head`, `--font-body` and `--font-read` to the Noto Devanagari and Gurmukhi subsets (`html.l-hi`,
`html.l-pa`), loaded only when that language is chosen, in the 400 and 500 weights. In those scripts: no mono, no tracking, no
uppercase; body line-height 1.6, headings 1.4 and chrome (pills, tags, nav) 1.45 (`--lh-chrome`), because matras sit above
and below the line; nothing under 16 px (`--fs-xs`, `--fs-sm` and `--fs-ui` rise to 1rem); `strong` is the loaded 500 weight,
never a browser-made bold (`--weight-strong`). The officer console stays English and Latin inside any page (`[lang='en']`).

Scale (clamped between the phone and the desktop): display, h-lg, h, h-sm, sub, body (16 to 20 px), ui and sm (14 px, 16 px in
Indic), xs (12 px, 16 px in Indic). The farmer app's body is 18 px and its labels 16 px.

## Spacing

The site keeps its 8 px grid (`--s1` 8 to `--s7` 80, `--sec-gap`, `--gutter`). The farmer app has its own scale, finer at the
small end because a phone screen is made of small distances:

| Token | px | Used for |
|---|---|---|
| `--sp1` | 4 | the gap inside a tag or a nav button |
| `--sp2` | 8 | between lines of one thing: a label and its value, list items |
| `--sp3` | 12 | between targets (the minimum the QA check allows inside the farmer app), inside cards |
| `--sp4` | 16 | the phone gutter, the step from the tab bar to the screen title |
| `--sp5` | 24 | between blocks on a screen, card padding |
| `--sp6` | 32 | the bottom of a screen |

The gutter grows to 24 px when the app is wider than 26 em (the framed phone on a laptop).

## Targets

Every control is at least 48 px on both axes in the farmer app and 44 px elsewhere, with at least 12 px between neighbours in
the farmer app; `tests/qa/checks.ts` measures every state at every size and language. One primary (blue) action per screen,
reachable without scrolling on the alert screen, and never under the bottom dock (`scroll-padding-bottom` follows the dock's
measured height).

## Shape and layers

Pills are fully round; cards 24 to 40 px by width; controls 16 px. Hairlines are 1 px `--ash`, controls 1 px `--smoke`. Layers:
sticky chrome 10, drawer 20, modal 30, toast 40. Sticky heights are measured (`--nav-real`, `--ctrl-real`, `--dock-real`) and
never guessed.

## What changed in Phase 5 and why

- The farmer app reads in the system sans; numbers and codes stay mono. Monospace body text gave 20 to 26 characters a line
  on phones (audit L4-10).
- The relief rail's advice window reads "about 1 day 20 h" in the heading face. "44:43:48" ticking in 46 px mono read as a
  time of day and made urgency the copy denies (L4-09). The insurance rail keeps its clock: there the window is a rule.
- The Proof screen keeps the fingerprint, the sync log and the hash chain behind one closed "Technical details" (L4-08), so
  the one action sits higher.
- Indic chrome line-height, the 16 px floor and the real 500 weight (L4-15); the advice tag wraps as a flow tag (L4-11); the
  screen title sits 16 px under the tab bar and labels never break mid-word (L4-13); segment buttons are 48 px with 8 px gaps
  (L4-14); targets in the farmer app keep 12 px apart (the check was 8 px).
