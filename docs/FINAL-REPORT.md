# Final report: what was done on `overflow/final-prep`, in plain language

For the Overflow team before the final. Every claim here points at a file, a test or a command; nothing is a promise about
the real world. No calendar dates: the order of events is in `git log`.

## 1. In one paragraph

The branch turns a simulation into a prototype that touches reality in three places and tells the truth about each: real
photos sealed on a real phone and checked on a laptop with no server; a real past flood run offline through two of the
rules, shown as raw counts under a REPLAY label; and a label on every value saying whether it is live, replayed, simulated or
typed by hand. Along the way the audit found 80 problems; every blocker and every major one on the demo path is fixed, each
with a test that was red before the fix. The quick gate (`npm run verify -- --quick`), the full QA matrix and Lighthouse
pass: 580 Playwright tests, 540 captures with 0 problems, 219 unit tests, Lighthouse 98/100/100 on all three pages.
Sixty-five commits, one concern each.

## 2. The mistakes that mattered most, and what was done

| What was wrong | Why it mattered | What changed | Proof |
|---|---|---|---|
| Sealed evidence could vanish: reconnect after a reload, or scrub the replay back, and the log was truncated to one event. A second bug dropped the packet from the outbox when a sync ran before the stored log was loaded | The weak-network story, the thing the product is for, destroyed its own evidence | The log only moves forward; appends are serialised across tabs; a sync reads the stored log | `tests/unit/evidence-safety.test.ts`; reload, reconnect and two-tab tests in `tests/qa/mvp.spec.ts` |
| Nothing said whether a photo or a location was real. A refused camera silently swapped in a simulated photo; a slow GPS fell back to the plot centroid; the laptop said "Imported (live)" regardless | Breaks "honest about real versus simulated" at the strongest moment of the demo | Provenance bits inside the signed code (old codes verify unchanged), a label on every photo and location on both devices, no silent swap | `tests/unit/evidence-vectors.test.ts` (both verifiers agree on 21 vectors), the provenance QA check over every state |
| The breakdown claimed "AI perception" and "Hashes verify"; neither exists | Judges and officers read capabilities that are not there | The phrases are gone; a test keeps them out; the explainer says the photo check is planned, not built | `tests/unit/copy-honesty.test.ts` |
| The tamper demo did nothing on a fresh laptop (the ledger hid the import until the replay clock caught up); the QR was version 15 and untested; a changed last character could still verify | The X factor failed silently | Import pauses and seeks; a bare-code QR at version 10 (57 modules); strict decoding in both verifiers; a one-click "Try a changed copy" that fails and restores | `tests/qa/mvp.spec.ts`, `tests/unit/qr.test.ts` |
| A helper could take photos for a farmer who had not agreed | Consent is per farmer, non-negotiable | Real photos and the seal need that farmer's consent; the screen asks for it first | `tests/unit/consent-first.test.ts`, `tests/qa/helper.spec.ts` |
| The FAQ answer about real versus simulated showed raw `{plots}`, `{cadence}`, `{slow}` | The one honest answer looked broken | Filled from the scenario's own numbers; a QA check fails on any raw token | `tests/qa/checks.ts` |
| Two tabs of one console disagreed (missed 1 against 2, in-window 23 against 21), the draft list rewrote itself when hail prompts closed, a late photo scored lower on one rail only, band ends rounded across tier lines, the median of an even count was wrong | A judge who flips between tabs sees two answers to one question | One function feeds both tabs; a waiting prompt is unconfirmed from the start; the photo window is the same on both rails; band ends round down; the median is the mean of the middle two | `console-parity`, `relief`, `rail-parity`, `score-display`, `median` tests |
| The validation harness credited rain before it was measured, accepted the digits of a year as a time zone, made a plot with no elevation "evaluable", read gaps as dry weather, and published with 12 of 18 rows rejected | A published recall could be quietly wrong, and the replay runs through this code | All fixed; rejected rows, a missing column or an unbalanced quote now block publishing | nine tests in `tests/unit/validation.test.ts` |
| Reset and the bare `R` key erased everything with no question; the microphone or camera could stay on after leaving a screen; the voice alert was never cached; a photo that could not be re-encoded was stored with its camera metadata | Live-demo hazards and privacy | Reset asks when anything is captured; devices stop on leaving; the clips are precached and range requests are answered; such a photo is refused | `tests/qa/mvp.spec.ts`, `tests/qa/devices.spec.ts`, `tests/unit/serve.test.ts` |
| `verify.sh` never existed, so `npm run verify` and `npm run deploy` exited 127 | The "every gate" claim could not be reproduced | A labelled reconstruction from the README list, with `--quick` and `--hook` | `npm run verify -- --quick` |

The complete list with status per row: `docs/AUDIT-REPORT.md` section 7. Decisions taken while building, with reasons:
`docs/DECISIONS.md` section 4c.

## 3. Feature decisions

Kept and made real: guided capture with real photos, helper mode with per-farmer consent, the sealed packet with provenance
bits, import and tamper check on the laptop with a wall-clock receipt time, the real audio alert (now offline too), the four
labels. Kept and simplified: the officer worklist and the draft list. Merged: the ledger into the import's tamper check. Demoted
or cut: the hand-entered water depth (first on the cut line; the HAND trust rule is built, tested and waiting for an input),
real voice calls (NO-GO), the extra tooling (documented, nothing installed). The table: `docs/FEATURE-MAP.md`.

## 4. USP, MVP, X factor

- **USP:** Saboot tells a farmer the moment a flood starts, and seals their photos so any change shows.
- **MVP (proven in the browser):** alert on a phone, three real photos, seal and QR, check on the laptop with a new officer
  row, one changed character fails. `tests/qa/mvp.spec.ts` runs it on a touch phone and a laptop. On the throttled phone
  profile (2 Mbps, 300 ms, 4× CPU, 12-megapixel photos through the file input) the alert button is on screen at 1.4 s, the
  three photos take 0.4 to 0.6 s each, the seal 0.2 s, the QR 0.3 s, about 4.7 s of machine time on the phone, and the laptop
  verifies the code in 0.3 s, with no console errors.
- **X factor:** the breaking seal. A judge presses "Try a changed copy", one bit of a photo fingerprint flips, the chain step
  turns red, the original comes back. Demo order and backup plan: `docs/USP-MVP.md`.

## 5. The replay of a real flood

Method first (`docs/REPLAY-METHOD.md`, committed before any run), then the data (`data/replay/`), then three offline runs
with the network blocked (`scripts/replay/`). On 289 sample points of a published flood map: the rain rule caught 47 of 138
mapped-flooded points and alarmed on 39 of 151 mapped-dry points, and raised no alarm in an assumed-quiet window; the river
rule fired for every point within its nominal reach, flooded or not, as the method said to expect. The console shows these
counts under REPLAY with the source by ID, the scale mismatch, the assumptions and "Rule B: not independently validated". It
is a consistency check at coarse scale on the Pakistan side of one monsoon, not a validation and not a lead time.

## 6. The UI changes, with before and after

`docs/screenshots/phase5/` holds the 360 px captures from before and after. What changed and why: `docs/DESIGN-TOKENS.md`.

- Reading text in the farmer app is the system sans; numbers and codes stay mono (`alert-before.png` against `alert-after.png`).
- The relief advice window reads "about 1 day 21 h" in the heading face instead of "44:43:48" ticking.
- The Proof screen keeps the fingerprint, sync log and chain behind one closed "Technical details"
  (`evidence-packet-before.png` against `evidence-packet-after.png`).
- One spacing scale in the farmer app, 12 px between targets, a clear step under the tab bar, no mid-word breaks, 48 px
  segment buttons, Indic chrome at line-height 1.45 with a 16 px floor and real bold (`alert-hi-before.png` against
  `alert-hi-after.png`), a high-contrast theme that does something, focus never under the dock.

## 7. Tools used and skipped

Used: the repository's own gates; Semgrep 1.182.1 in an isolated virtual environment outside the repository, metrics off,
twice (one false positive both times); a reviewer agent for the branch security review (no finding at the bar); the Karpathy
guideline plugin as a reading. Skipped, with reasons in `docs/TOOLS.md` and `docs/DECISIONS.md`: anything that sends code or
prompts outside, the Chrome extension (yours to install), every other plugin on the shortlist (nothing was installed).

## 8. Remaining risks

- LCP is 2.41 s against a 2.5 s limit (Lighthouse median of 3). Any new above-the-fold weight can fail the gate.
- A Hindi or Punjabi first visit paints at 2.3 s on the budget profile and about 3 s on fast 3G; the Lighthouse gate measures
  English only (audit L5-01, L5-02, open).
- The 100× replay drops to about 27 frames a second on a 4× throttled phone (L5-04, not on the demo path).
- The translations are machine-made and flagged `needs-native-review`; farmer and village names are Latin in Hindi and
  Punjabi (L4-16).
- 19 `{{VERIFY}}` claims remain for you to confirm or remove; the LICENSE holder is a placeholder.
- The replay is Pakistan-side data; India has no public activation. Rule B is not independently validated.
- A deploy during the event can break open tabs (A-12): do not deploy once the demo has started.

## 9. What is yours to do by hand

1. Native-speaker review of Hindi and Punjabi, the consent wording first.
2. Rehearse on a real phone: Android Chrome after the camera, iOS `capture`, an in-app browser, EXIF rotation; and the
   laptop webcam reading the phone's QR (`?at=alert`, three photos, seal, share).
3. Confirm or remove the 19 `{{VERIFY}}` claims (`node scripts/markers.mjs`) and fill the LICENSE holder.
4. Install the Chrome extension and run `/chrome` if you want exploratory checks (`docs/SETUP.md`).
5. Record three backup clips with a "RECORDED" caption (`docs/USP-MVP.md`).
6. Deploy from this branch when you are ready: `npm run deploy` (it runs the full gate first). Not before the demo starts.
7. Optional: a Copernicus Global Flood Monitoring login if you ever want an Indian-side replay (R-2).
