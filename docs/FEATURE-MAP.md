# Feature map (viable features only)

Scores run 1 to 5, **higher is better** for every column: farmer value, judge value, real viability within the 24-hour
final, build cost (5 = cheap), demo risk (5 = safe), uniqueness (5 = nothing overlaps). Ideas that are not viable are
not mapped here. They are recorded as NO-GO in `docs/DECISIONS.md`.

The lens is a seller walking into a village: low literacy, Hindi or Punjabi first, a mid-range Android phone on 2G or
3G, a shared phone, stress after a flood, fear of mistakes, a helper (sarpanch, CSC operator) as the real user, and very
little patience for a new app. Jargon (hash, SHA-256, packet, ledger) goes behind a "Details" control.

Decisions: **KEEP**, **MERGE INTO x**, **MAKE REAL** (the simulated part becomes a real one), **DEMOTE TO FUTURE**
(stays in the code and docs, leaves the demo path), **CUT**.

## Farmer and helper app

| ID | Feature | Farmer | Judge | Viable | Cost | Risk | Unique | Decision | Reason |
|---|---|---|---|---|---|---|---|---|---|
| F1 | Alert screen with the clock and the voice button | 5 | 4 | 5 | 5 | 4 | 4 | KEEP | The first thing a farmer sees. One clear message and one button. The relief window stays advice, never red. |
| F2 | Guided capture: three photos, real camera and GPS | 5 | 5 | 5 | 4 | 3 | 5 | KEEP, MAKE REAL | The core of the product. Fix the stalls (A-06). A denied camera shows a permission-denied state with a labelled choice, never a silent substitute (A-02). |
| F3 | Proof screen: the seal and the chain | 3 | 5 | 5 | 5 | 4 | 5 | KEEP, MERGE share card INTO it | Farmers need "your photos are sealed", not "SHA-256". Technical detail moves under "Details". |
| F4 | Offline queue, connection strip, sync log | 5 | 4 | 5 | 5 | 4 | 3 | KEEP | Works with no signal. The sync log (phone time, receipt time, gap) goes under "Details". |
| F5 | Filing summary and reference number | 3 | 2 | 5 | 5 | 5 | 3 | MERGE INTO F6 | One "Next step" screen instead of two. The typed reference gets the HAND label. |
| F6 | Status: reminders and the escalation script | 2 | 2 | 5 | 5 | 5 | 2 | KEEP (absorbs F5), DEMOTE escalation detail | The scripted 48 h and 72 h steps stay in the ledger but leave the farmer screen. |
| F7 | Helper mode: queue, per-farmer consent | 5 | 5 | 5 | 4 | 3 | 5 | KEEP, promote on the farmer home | The helper is the real user. Per-farmer consent stays. The helper's name carries a HAND label and a "not signed" note (packet v1). |
| F8 | Feature-phone design simulation | 3 | 2 | 3 | 4 | 4 | 3 | DEMOTE TO FUTURE | It is a labelled design simulation with no telephony behind it. It leaves the demo path. Done: one folded 'Future' link in the helper screen. |
| F9 | Voice alert: pre-recorded clip, speech fallback, captions | 4 | 4 | 5 | 5 | 4 | 3 | KEEP, MAKE REAL | A real clip plays on the real phone. Hindi and Punjabi fall back to speech synthesis and say so. No claim that a call was placed. |
| F10 | Language, text size and low-data controls | 5 | 4 | 5 | 5 | 5 | 3 | KEEP | Hindi and Punjabi first. Native-review flags stay. |

## Evidence, share and import

| ID | Feature | Farmer | Judge | Viable | Cost | Risk | Unique | Decision | Reason |
|---|---|---|---|---|---|---|---|---|---|
| F11 | Share as QR, link or bundle (feature K) | 3 | 5 | 5 | 3 | 3 | 5 | KEEP, MAKE REAL | This is the bridge from the phone to the officer. Make the QR smaller and scannable (A-05) and carry real-versus-simulated flags (A-02). |
| F20 | Import evidence: scan, paste or link, then verify | 2 | 5 | 5 | 4 | 3 | 5 | KEEP, MAKE REAL | Pause and seek on import (A-01), a wall-clock receipt time, a one-click tamper copy (A-11), a `hashchange` listener (A-10). |
| F19 | Audit ledger and the tamper test | 1 | 5 | 5 | 5 | 3 | 5 | MERGE INTO F20 as one "Tamper check" view | The ledger tab is a second place to look for the same idea. Keep the chain and verify. Drop the separate tab from the demo path. Done: the Ledger tab is gone; the console's Tamper check view holds both. |
| F28 | Standalone verifier, evidence format, test vectors | 1 | 5 | 5 | 5 | 5 | 5 | KEEP, extend | Independent proof. Gains the provenance flags with new vectors. |
| N2 | Receipt time stamped by the officer console | 2 | 5 | 5 | 5 | 5 | 4 | MAKE REAL (new, small) | The laptop is the receiver. It records a wall-clock "received" time and reuses the 2 h gap flag. There is no server in the product; the optional demo receiver on the laptop (`scripts/receipt-server.mjs`) only stamps its clock. |

## Officer console

| ID | Feature | Farmer | Judge | Viable | Cost | Risk | Unique | Decision | Reason |
|---|---|---|---|---|---|---|---|---|---|
| F12 | Map and ranked list | 3 | 5 | 5 | 5 | 4 | 4 | KEEP, simplify, absorbs F14 | Lead with the map and the list. Put the reason for each rank on its row. |
| F13 | Plot drawer: factors with uncertainty | 2 | 5 | 5 | 5 | 5 | 5 | KEEP | Shows why, with a band. Gains the provenance of each factor. |
| F14 | Assessment worklist | 2 | 4 | 5 | 5 | 5 | 4 | MERGE INTO F12 | Two lists for one job. Done: one ranked worklist under the map ('Map & worklist'). |
| F15 | Draft list with JSON and CSV export | 2 | 4 | 5 | 5 | 5 | 4 | KEEP | "Draft, for officer review." Exports carry provenance. |
| F16 | Objections: attach the sealed packet | 3 | 3 | 5 | 5 | 5 | 4 | DEMOTE TO FUTURE | Strong idea, long to demo. Kept as one line in the draft list. Since OF-05 the draft list also sorts objections oldest first, flags a closed window with no response, and lets the officer note one by hand. |
| F17 | Pilot metrics and the Impact panel | 1 | 3 | 5 | 5 | 5 | 3 | DEMOTE detail, KEEP the validation block | The validation block is where REPLAY results appear. Done: the relief metrics sit under the draft list. |
| F18 | Human-in-the-loop pipeline strip | 2 | 4 | 5 | 5 | 5 | 4 | MERGE INTO the console header | One line: "Decision happens outside Saboot." |
| F21 | Detection explainer | 1 | 4 | 5 | 5 | 5 | 3 | DEMOTE TO FUTURE | Useful for technical judges. Not on the demo path. |

## Simulation shell and framing

| ID | Feature | Farmer | Judge | Viable | Cost | Risk | Unique | Decision | Reason |
|---|---|---|---|---|---|---|---|---|---|
| F22 | Two rails | 3 | 3 | 5 | 5 | 5 | 3 | KEEP relief as default, DEMOTE the insurance rail | `?rail=pmfby` still works. The toggle leaves the first screen. |
| F23 | Radar cadence toggle | 1 | 2 | 5 | 5 | 5 | 2 | DEMOTE TO FUTURE | Under "What if?" only. |
| F24 | Judge tour and presenter keys | 1 | 4 | 5 | 5 | 4 | 3 | KEEP presenter keys; the tour is the hero's first button ('Take the 2-minute tour') and has a tamper step (J11, J2) | |
| F25 | Replay control bar | 2 | 4 | 5 | 5 | 4 | 3 | KEEP, simplify in Phase 5 | About twenty controls are visible before the product. Advanced ones go behind a drawer. |
| F26 | Landing sections | 2 | 4 | 5 | 5 | 5 | 3 | KEEP | Fix the raw FAQ tokens (A-04). The prototype framing is already fixed (A-08). |
| F27 | Validation harness and the "Not run" block | 1 | 5 | 5 | 5 | 5 | 5 | KEEP, MAKE REAL if the replay holds | See N3. |

## New items

| ID | Feature | Farmer | Judge | Viable | Cost | Risk | Unique | Decision | Reason |
|---|---|---|---|---|---|---|---|---|---|
| N1 | Four provenance labels: LIVE, REPLAY, SIMULATED, HAND | 3 | 5 | 5 | 4 | 4 | 5 | GO, reduced scope | Per input or observation value, with derived numbers inheriting through their region label. See the design below. |
| N3 | A real-flood replay result, run offline | 1 | 5 | 4 | 3 | 3 | 5 | GO, timeboxed. Fallback: "Not run" | See `docs/DECISIONS.md` (replay candidates). |
| N4 | Hand-entered water depth (four choices) | 4 | 4 | 4 | 3 | 3 | 4 | GO-LAST (first to cut after the MVP flow) | The only hand-entered observation that can reach the evidence. Without it the HAND trust rule has no live input. |

## From simulation to real: the plan

| Part | Today | In the final | Label |
|---|---|---|---|
| Photo, location, time, signature | Real in the browser, but substitutes silently | Real. A substitute is a visible choice and is flagged in the signed packet | LIVE, or SIMULATED when chosen |
| Receipt time ("server") | A scripted sim hour | The officer console's wall clock when it verifies an import, or the demo laptop's clock when a phone sent the code to it. There is no server in the product | LIVE |
| Officer view updates | Replay clock | An import adds a row at once and pauses the clock at the packet time | LIVE (row), SIMULATED (cohort) |
| Alert | A call is described | A real clip or speech plays on the phone. No call is placed | SIMULATED call, LIVE audio |
| Plot registration | Fixed synthetic plot P-04 | The packet's rounded GPS position is the real location. No separate registration screen | LIVE (location), SIMULATED (plot id) |
| Past real flood | Not run | One public flood, rules A and C, raw counts, source named | REPLAY |
| Cohort, scripted farmers, rain, river, radar | Synthetic | Unchanged | SIMULATED |
| Filing reference, helper name, no-damage report, water depth | Typed or chosen | Unchanged, now labelled | HAND, with who entered it |

**Switching.** There is no global mode switch. The label belongs to each value. The farmer capture screen offers
"Take a real photo" as the primary action and "Use a simulated photo" as a labelled secondary action. A denied camera
offers "Try again" and the labelled substitute. A short "What the labels mean" sheet explains the four values.

## HAND (entered by hand): design

- **One type.** `Prov = 'live' | 'replay' | 'sim' | 'hand'` in `src/lib/prov.ts`. A small component takes `prov` as a
  required prop, so a labelled value cannot be written without it (a compile error, not a review comment).
- **Look.** It reuses the `.tag` and `.tag-sim` styles and `data-sim-label`, and never removes an existing
  `[data-sim-label]`. Each value has its own word and shape (a different glyph per label), so meaning never depends on
  colour. New strings are minimal, in English, Hindi and Punjabi, each with `// needs-native-review`.
- **Who.** HAND shows who entered the value (helper or farmer) when known, for example "By hand · helper".
- **Scope.** Inputs and observations get a label each: a location, a capture time, a typed reading, a registration, a note,
  a photo, a rain or river reading. Derived numbers (scores, KPIs) inherit through their region label, which names the
  provenance of its inputs.
- **Trust rule (proposed default).** A hand-entered value alone can never reach Supported. The plausibility breakdown shows
  a separate "Entered by hand" factor at a reduced weight with a wider band, with before and after for two example plots.
  Existing weights are not changed without that comparison, and the priority formula is untouched (a test pins it).
- **Packet.** Per-shot provenance rides in the high bits of the kind byte: 0 = not recorded (every old code), 1 = live,
  2 = simulated, 3 = hand. It is covered by the chain and the signature. Old codes verify unchanged because their bits are
  zero. `verify-packet.mjs`, `EVIDENCE-FORMAT.md` and the test vectors change together. If any existing vector changes its
  result, fall back to UI-only labelling and say why. The helper's name and the consent text stay unsigned in version 1 and
  are shown with a "not signed" note.
- **Checks.** (1) A QA check over all twenty states fails if a latitude or longitude, a capture time, a typed reading, a
  registration or a note renders outside a `[data-prov]` element, or if a `[data-v]` element has no valid `data-prov`.
  (2) A unit test shows a hand-entered-only plot cannot reach Supported. (3) Both verifiers agree on every vector.
