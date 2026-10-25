# Saboot design

The visual system for the farmer app, the officer console and the public site. It replaces the earlier "editorial
journal on parchment" look (`docs/DESIGN-TOKENS.md` keeps the history). Tokens live in `src/styles/tokens.css`;
`scripts/contrast.mjs` checks every text and control pair in the light, dark and high-contrast themes.

## 1. Who it is for, and what that demands

| Person | Where | What the design must do |
|---|---|---|
| Farmer | A low-end Android phone, a weak network, often outdoors, often stressed | One action per screen, an icon and a word on every control, 48 px targets with 12 px between them, 18 px reading text, no thin grey type, nothing that needs colour to be understood |
| Patwari or helper | In the field, in sunlight, entering for several farmers | Dark text on a light ground at high contrast, large numbers, state shown by shape as well as colour, the farmer's name and plot always visible |
| Agriculture officer | A laptop, many plots, a queue to work through | Dense, scannable tables, numbers that line up, the reason behind every rank on the same row, and the honest label on every figure |
| A judge or visitor | The public site on any screen | Understand in one screen what Saboot does and which parts are real |

## 2. Identity

Saboot handles evidence that a government office will read. The look borrows from the things that already carry
weight in that world: the land record (khasra, jamabandi) on pale ruled paper, the red lac seal on an official packet,
and the hand-painted signboards of a mandi or a block office: condensed, heavy, readable from a distance. It is
not a SaaS template: no gradient washes, no glass, no identical rounded cards, no all-caps mono labels.

The one bold element is the **seal**. Everything else is quiet.

### Palette (light)

| Token | Name | Hex | Role |
|---|---|---|---|
| `--silt` | Silt | `#F0F1EA` | Page ground: the pale grey-green of a ruled land-record page |
| `--paper` | Paper | `#FCFCF8` | Cards, sheets, tables |
| `--kali` | Kali mitti | `#1E1C17` | Text and strong lines: the black cotton soil of the Deccan |
| `--khet` | Khet | `#2D5B39` | The brand, structure, navigation, "sealed" and "verified" |
| `--haldi` | Haldi | `#F2B300` | The single primary action per screen, always with kali text and a kali edge |
| `--neel` | Neel | `#1F4E8C` | Water and flood data, links, the replay label: indigo was a field crop here before it was a colour |
| `--lal` | Lal | `#B3261E` | Alerts and "changed copy detected" |
| `--lac` | Lac | `#8E2A1C` | The seal itself |

Secondary text (`--kali-2`, `--kali-3`), lines (`--rule`, `--rule-strong`) and the status tints are derived from these.
Status always carries a shape and a word: ok is a tick in a circle, warning a triangle, bad a bar in a circle.

**Dark** keeps the same roles on a night-field ground (`--silt` `#12140F`, `--paper` `#1B1E17`, text `#ECEBE2`), with
lightened khet, neel, lal and warn so every pair stays at AA. Haldi stays haldi, with kali text: the primary action
looks the same by day and by night. The QR code always sits on a white quiet zone so it scans in either theme.

**High contrast** (Settings) is pure black on pure white with 2 px black edges, whatever the theme.

### Type

| Role | Family | Why |
|---|---|---|
| Display: headings, big numbers, the countdown | **Anek** (Ek Type, OFL), weight 600, width 87.5 | An Indian multi-script family designed as one system: Anek Latin, Anek Devanagari and Anek Gurmukhi share proportions, so a heading looks like the same voice in all three languages. Semi-condensed, it reads like a painted signboard and fits long Hindi headings on a 360 px phone. Tabular figures for the clock |
| Body and interface | **Noto Sans** (OFL), 400 to 700 | Plain, open, very legible at small sizes on cheap screens. Noto Sans Devanagari and Noto Sans Gurmukhi are the same design, so body text is consistent across scripts |
| Codes and fingerprints | JetBrains Mono, 400 | Only where equal widths carry meaning: hashes, codes, the chain. Never for labels |

Rules: sentence case everywhere (no all-caps labels, no tracking), Latin body at line-height 1.5 and Indic at 1.6,
headings at 1.05 (Latin) and 1.3 (Indic, for the matras), a 16 px floor for Indic text. Every font is subset and
bundled (`scripts/build-fonts.py`); only Anek Latin and Noto Sans Latin are preloaded. Fallbacks are metric-matched
local fonts (`Nirmala UI`, `Arial`), so a swap does not shift the layout.

Type scale (rem, a 1.25 ratio on a 1 rem base; the farmer app reads at 1.125 rem):
`0.8 · 0.875 · 1 · 1.125 · 1.25 · 1.563 · 1.953 · 2.441 · 3.052 · clamp(2.5 → 4.5)` for display.

### Shape, space, depth, motion

- **Spacing:** the farmer app keeps the `--sp1..6` scale (4 / 8 / 12 / 16 / 24 / 32); the site keeps its 8 px grid.
- **Radius by hierarchy, not one radius everywhere:** sheets 20 px, cards 12 px, buttons 10 px, inputs 8 px, chips and
  options inside a segmented control 6 px; the phone frame keeps a device's 32 px (`--r-device`).
- **Depth:** flat paper on silt with a 1 px rule; one shadow level for things that float (sheets, menus, the toast).
- **Motion:** only in answer to an action (a sheet opens, the seal closes or breaks), 160 to 280 ms, and none at all
  under `prefers-reduced-motion` or low-data mode.

## 3. The honest labels: the signature system

Every value says where it comes from. The five labels share one chip: a word, an icon and an edge pattern, so they
work in greyscale, in high contrast and for colour-blind readers.

| Label | Word | Icon | Edge | Colour |
|---|---|---|---|---|
| LIVE | Live | target | solid | khet |
| REPLAY | Replay | clock | double | neel |
| SIMULATED | Simulated | layers | dotted, on a hatched ground | kali-2 |
| HAND | Entered by hand | hand | dashed | warn |
| FIELD | Field record | person | solid, thick left edge | kali on a haldi tint |

The diagonal hatch is the visual word for "simulated": the announcement strip and the simulated chip use it, so the
page says "this is a simulation" even before it is read. FIELD marks evidence from a consented interview
or a signed letter; it is a display label, not a packet origin, and the evidence strip that uses it stays hidden
until such a record exists (`src/lib/field.ts`).

## 4. The seal: the hero moment

`src/ui/Seal.tsx` draws a lac seal in four states. The same seal appears on the farmer's Proof screen, in the officer's
import check and on the ledger.

```
  open            sealed           verified          changed copy detected
 ( · · · )        (#####)          (#####)✓          (### / ###)
 dashed ring      lac disc,        lac disc,         the disc cracks in two,
 "Not sealed"     scalloped edge   khet ring, tick   lal ring, "Changed after sealing"
```

"Try a changed copy" sits directly under a verified seal as a clear secondary button. One tap flips a bit of a photo
fingerprint: the seal cracks, the chain step turns lal with a bar icon, and "Put the original back" restores it.
Under reduced motion the crack appears without moving.

## 5. Language

English, Hindi and Punjabi are equal. The site shows an always-visible EN / हि / ਪੰ switch from 600 px up, and
a compact globe button below that; the farmer app has the same three-way switch in Settings (the gear on every screen),
so the alert screen keeps its one action above the fold.
Layouts never truncate: buttons grow to two lines, headings wrap, and the 40%-longer pseudo-locale and 200% text
runs in `tests/qa/extra.spec.ts` keep it honest. The officer console stays English by design and says so.

## 6. Screens

```
Site, 1440                                    Farmer app, 360
┌───────────────────────────────────────┐     ┌──────────────────┐
│ ▨▨ Simulation: synthetic data ▨▨▨▨▨▨▨ │     │ ▨ Sim  Offline  ⚙ │
│ saboot  Problem Simulation How  EN|हिं|ਪੰ│     │ Harjit Kaur P-04 │
├───────────────────────────────────────┤     │ ┌──────────────┐ │
│ The clock starts     ┌──────────────┐ │     │ │ ⚠ Flood likely│ │
│ at the storm.        │ (seal)  14:00│ │     │ │ at your field │ │
│                      │ Live Replay  │ │     │ │ [■ Take photos]│ │
│ [■ Run simulation]   │ Sim  Hand    │ │     │ │ about 1 d 21 h│ │
│  How it works        └──────────────┘ │     │ └──────────────┘ │
└───────────────────────────────────────┘     │ Home Photos Proof│
                                              └──────────────────┘
```

- **Landing:** left-aligned headline in Anek; beside it the product's real moment: the seal, the clock that started
  at the event, and the label legend. No stat grid.
- **Farmer flow:** alert card on paper with a lal edge, one haldi action, the countdown in Anek numerals; capture
  shows the three shots as a checklist; Proof leads with the seal.
- **QR verify:** the result is the seal plus the three chain steps, each with its own icon; the QR sits on white.
- **Officer console:** tables with tabular figures, the evidence tier as a shaped badge, the draft list marked "not a
  decision" in its header, the objection window as a dated bar.
- **Impact:** simulated figures under their label, the replay block under REPLAY, the field-evidence strip under FIELD
  once records exist.
- **How it works:** one diagram in khet and neel lines on paper; real and simulated parts carry their chips.

## 7. Checks that hold the system

`scripts/contrast.mjs` (every pair, three themes), the QA matrix (axe WCAG 2.2 AA, overflow, clipping, 48 px and 12 px
targets, sticky bars, provenance), the dark-mode block in `tests/qa/extra.spec.ts`, `scripts/budgets.mjs` and
`scripts/lighthouse.mjs`. `tests/qa/checks.ts` holds the one primary colour (haldi) for the "one primary per screen" check.
