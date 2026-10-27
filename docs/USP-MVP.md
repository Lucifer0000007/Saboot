# USP, MVP, X factor and the demo (Phase 3)

Proposals for Checkpoint 2. Scores are my judgement from evidence in the product, not a prediction of any judge's score.
Numbers marked "measured" were taken in this review on the built site (Chrome, mobile emulation, 4x CPU slowdown, 2 Mbps,
300 ms round trip). Numbers marked "README" are the project's own reported figures and were not re-run.

## 1. The three seats

### Senior evaluator

| Criterion | Now | After the planned changes | Evidence from the product | What lowers it |
|---|---|---|---|---|
| Innovation | 6 | 7 | The event clock starts at the **earliest** qualifying signal, so a farmer is never given more time than there was (`src/sim/rules.ts`, `combine`). Evidence is held by the farmer: a signed packet of 253 bytes (338 characters) that two independent verifiers check. Helper mode seals each farmer's own consent in that farmer's own log. | The pieces are known (thresholds, hash chains, QR). The newest claim, a plot-level clock from rain, river and radar, has never met real data. The official crop-insurance app reportedly already takes geo-tagged photos (secondary sources, not checked against the official site). |
| Feasibility | 5 | 7 | Runs from the service-worker cache with no network. Real camera, location, hashing, signing and verification work: about 4.7 s of machine time for the whole phone flow (measured, `docs/FINAL-REPORT.md` §4). 280 unit tests pass; 713 of 715 Playwright tests pass and 563 QA captures show 0 problems (README). | No backend, no real data feeds, no plot register, no telephony. Detection is not tested on real floods. Privacy design and the Hindi and Punjabi text are not reviewed. |
| Technical approach | 7 | 8 | One set of pure rule functions is shared by the app, the scenario generator and the real-data harness. Strict CSP and no third-party requests. Lighthouse 96 to 98 performance and 100 accessibility (README, code freeze); axe 0 serious or critical across 20 states × 7 viewports × 3 languages. | INP fails (288 to 312 ms against 200 ms); interactive is 2.76 to 2.88 s against 3 s; the R2 reload test fails. |
| Potential impact | 6 | 7 | A real gap: assessment happens after the water recedes, and evidence fades. The pilot plan has a comparison block, agreed stop conditions and no invented figures. Helper-led reach suits shared phones. The packet format is open. | No measured effect, by design. Depends on a department supplying plot and gauge data. The false-alarm cost is real (alert fatigue). Flood only. The customer is slow to move. |

Overall: about 6 of 10 today. The jump comes from showing the real loop (a real photo, sealed, checked on another device,
broken on purpose) and from being exact about what is real.

### Mentor
- **Double down on** the live seal-and-check loop. It is the one part that touches reality. Then helper mode (the real user
  is the person holding a shared phone), the habit of saying what is not real, and the pilot kit.
- **Cut from the demo path:** the tour, the explainer, the two-rail and radar-cadence switches on the first screen, pilot
  metrics, and anything that needs a server. About twenty controls compete before the product appears. (Later decided
  otherwise: the hero starts with the 2-minute tour, D-89.)
- **Underselling:**
  1. It works with no internet on a shared phone.
  2. The seal is 253 bytes. It fits in a QR code, and a stranger's script with no Saboot code can check it.
  3. The clock rule is conservative on purpose: when unsure, the farmer gets less time, never more.
  4. The team documented its own limits (validation harness, privacy design, pilot plan) before being asked.

### Judge: the ten hardest questions
C-02, C-03 and C-04 are done; still never say "location verified".

| # | Question | Honest answer | What we show |
|---|---|---|---|
| 1 | Photos can be faked or old. How do you know? | We do not prove a photo is true. We prove it has not changed since sealing, and what the phone said about time and place. Capture goes through the camera path and rejects files whose timestamp is older than 10 minutes. Location is rounded to about 100 m. Phone time is compared with receipt time. We do not yet check EXIF, device integrity, or a photo of a screen. The officer still visits and decides. | The broken seal. |
| 2 | Why not the official crop-insurance app? | It waits for an insured farmer to know the clock started and to act, and it serves insurance. Saboot starts from the event, supports helpers and offline capture, and serves the state relief assessment, which is not tied to insurance. Not every state runs the scheme. We do not claim the app lacks features, and we do not integrate with it. | The relief rail as the default. |
| 3 | Radar cannot see under tall crops, and paddy is wet on purpose. | Agreed, and the app says so. Rain and river rules give the first signal. Radar only confirms. Tall crops hide water, and for paddy only water above the expected level counts. That paddy choice is not tested. Every score shows a band, and the farmer can always report. | The plot drawer's bands. |
| 4 | Who is the customer? | A district or state revenue and disaster-management department: a licence plus a fee per flood event, with farmers paying nothing. Insurers could come later. No figures exist. A one-block pilot with a comparison block comes first. | The pilot plan. |
| 5 | Privacy of farmland photos, locations and consent? | Photos stay on the phone. Only fingerprints, times and a location rounded to about 100 m can be shared. Consent is per farmer. No analytics or third-party requests. It is designed with India's data protection law in mind and is not legally reviewed. There is no access control yet. Export and delete act on the whole phone, and in helper mode on one farmer only. | The share sheet, with nothing but a code. |
| 6 | What is real? | Real: the camera, location, hashing, signing, offline queue and the check on the laptop. Replay: one real flood run through the rules, as raw counts (or "Not run"). Simulated: the district, farmers, rain and river series, the server and the phone call. Entered by hand: references, names and any typed reading. | The four labels on screen. |
| 7 | Is detection validated? | No. The 0.67 and 1 on screen are a consistency check on a synthetic flood. The same rules ran on one real flood, with counts, the source named and the scale mismatch stated. Rule B (radar) is not independently tested. | The replay block, or "Not run". |
| 8 | False alarms and alert fatigue? | In the simulation the river rule alerts more plots than the synthetic flood reached. Thresholds are uncalibrated. The pilot tracks false alarms from week one and has a stop condition. | The pilot plan's risk table. |
| 9 | Farmers with no smartphone? | A helper (sarpanch, CSC operator) captures with each farmer's consent. The feature-phone flow is a design simulation. Real calls need provider registration, which vendor documents put at 1 to 2 weeks. | Helper mode. |
| 10 | Can I trust the phone's clock? | Not blindly. The packet carries the phone's time. The laptop adds its own receipt time and flags large gaps. There is no clock-skew defence yet. | The "received at" line. |

**What a judge still remembers an hour later:** (1) the moment the seal broke when one character changed; (2) that the team
told them what was not real; (3) a shared phone in a helper's hands.

## 2. The USP

> **Saboot tells a farmer the moment a flood starts, and seals their photos so any change shows.**

Ten-second test: it names who (a farmer), when (the moment a flood starts), what (their photos) and why it matters (any change
shows). It avoids "can't be faked", which would be false: a seal proves a photo is unchanged, not that it is true. In the pitch
say "unchanged", never "genuine". Hindi and Punjabi versions need native review before use.

## 3. The MVP: the smallest live flow that proves the USP

| Step | Who | What happens | What it proves | Label shown |
|---|---|---|---|---|
| 1 | Presenter | The alert opens on a team phone (or a judge scans the QR) with the button in view | The clock and the call to act | SIMULATED (detection feed), LIVE (audio) |
| 2 | Judge | Takes three real photos with the phone camera | Real capture, location, time | LIVE (a visible choice, never a silent substitute) |
| 3 | Judge | Taps Seal, then shows the QR | The evidence is sealed on the phone | LIVE |
| 4 | Presenter | The laptop scans or pastes the code: "Unchanged since sealing", received time, rounded location, three fingerprints, a new officer row | The officer view updates from a real packet | LIVE |
| 5 | Judge | Taps "Try a changed copy" or edits one character: "Changed after sealing" | Tampering shows | LIVE |

**Success checks (verifiable).**
- `tests/qa/mvp.spec.ts` runs steps 2 to 5 end to end with Chrome's fake camera and fake location. It asserts three
  shots, a seal, a code of about 338 characters, "Unchanged" on import, the new officer row, a visible receipt time, and a
  failure at the chain or signature step after one character is changed.
- On the throttled profile the machine time for steps 2 to 4 stays under 10 s (measured: about 4.7 s, `docs/FINAL-REPORT.md` §4).
- A hand rehearsal on a real Android phone and the real laptop webcam, in the real venue conditions. Only you can do this.

## 4. The X factor, and the tea-stall test
**The breaking seal.** A judge changes one character and the check flips from "Unchanged since sealing" to "Changed after
sealing". Why it works: everyone knows a wax seal or a tamper sticker, the judge does it with their own hand, it takes five
seconds, and nothing needs explaining. **Tea-stall test:** after 30 seconds someone can retell it as "they put a seal on the
farmer's flood photos, and when the judge changed one letter the seal broke". The retelling stays correct as long as the pitch
says "changed", not "faked".

This was fixed by C-12: both verifiers decode strictly, so any changed character fails.

## 5. What to change, add, demote or cut

**Must (needed for the MVP flow and for honesty).** Each has a check and an effort (S under an hour, M under half a day).

| ID | Change | Why | Check | Effort | Audit refs |
|---|---|---|---|---|---|
| C-01 | Sealed evidence is never lost: never truncate sealed events, stamp sync and seal at `max(t, last event)`, clamp the clock on load, serialise writes | Capture offline, reconnect later is the product's own story | e2e: offline capture, seal, reload, reconnect keeps all events. Unit tests for rewind and concurrent writes | M | L3-01, L1-03, L3-03, L3-02 |
| C-02 | Import updates the officer view and enables the tamper demo: pause and seek, receipt time, stable import key, "Try a changed copy", clear the result on edit, handle errors, `hashchange` | Steps 4 and 5 | `mvp.spec.ts` | M | A-01, A-10, A-11, A-14, L2-02, L2-11, L3-07 |
| C-03 | Four labels and packet flags, with no silent substitution. A refused camera or location is a visible choice. The laptop shows the flags | Honest about LIVE, REPLAY, SIMULATED, HAND | QA provenance check over all states. Unit: a hand-entered-only plot cannot reach Supported. Both verifiers agree on every vector | M to L | A-02, L2-08, L3-06 |
| C-04 | Remove claims that are not true: "AI perception", "Hashes verify", "location on plot" | Non-negotiable | A test that fails if those phrases return (a new test file, not an edit to `claims.test.ts`) | S | L1-01 |
| C-05 | A QR that scans: the bare code at error level L, version 10, 4-module border | The hand-off | Unit: the rendered QR decodes with `jsqr` to the same code | S | A-05 |
| C-06 | Capture never hangs: try/finally, `onabort`, a 3.5 s location wait with a pre-warm, permission-denied states | Steps 2 and 3 | Playwright: location never answers, capture still completes in under 4 s | S to M | A-06, L2-10, L3-04, L4-07 |
| C-07 | The alert button in view: under the headline, and `?at=alert` scrolls to the phone | Step 1 | Screenshot at 360x740 shows the button | M | L4-01, L4-02 |
| C-08 | Fix the FAQ tokens, add the GitHub link and judge QR (the two named allowlist entries you approved) | A visible bug and a missing link | "No raw token" QA assertion. Budgets pass | S | A-04, A-09 |
| C-09 | Recreate `verify.sh` as a labelled reconstruction | The gates run again | `npm run verify -- --quick` completes | S | A-13 |
| C-10 | Microphone and camera stop on leaving a screen. Reset asks first | A hot microphone, a stray key on stage | Unit and e2e | S | L2-01, L2-13 |
| C-11 | Helper consent is enforced before photos and before sealing | Non-negotiable | Unit | S | L1-05 |
| C-12 | Strict decoding in both verifiers (alphabet, padding, kind, ranges, length) | One changed character must fail | Both verifiers agree on the vectors and on a set of malformed inputs | S | L1-14, L2-12 |

**Should.** Hindi and Punjabi first paint and layout shift (L5-01, L5-02, M). Device language by default (L4-03, S). Jargon behind
"Details" (L4-08, M). Officer console order: map and list first, open at the draft-list moment (M). The real-flood replay block,
timeboxed (N3, L). Receipt time and clock-skew display (S). Audio cache fix (L2-14, S). Numbers that disagree between tabs, the
hail-prompt count and rail parity (L1-08, L1-02, L1-04, M). Scroll padding under the dock (L4-05, S). The high-contrast switch
works or goes (L4-04, S). Phase 5 type scale, spacing and copy.

**Could (cut line, in this order).** Badge polish; footer QR; hand-entered water depth (N4); packet flags fall back to
UI-only labels; replay stays "Not run"; the 100x play-cost fix (L5-04).

**Demote** (stays in the code, leaves the demo path): feature-phone design, objections, pilot metrics detail, the explainer,
the PMFBY and radar-cadence switches. **Cut:** the pre-commit hook, a backend, live weather, real voice calls, live sync, photo AI.

## 6. The demo: 5 to 7 minutes

Two people: a **presenter** who speaks and a **hands** person who works the phone and laptop. Sleep and notifications off.
The team phone has the site cached and the camera permission already granted.

| Time | On screen | Say |
|---|---|---|
| 0:00 to 0:40 | Landing hero with the clock | "After a flood, the proof of damage fades as the water goes down, and the officer comes later. Nobody tells the farmer the clock has started." |
| 0:40 to 1:20 | The alert on the phone, with the audio | "Saboot watches rain, river and satellite signals. When a plot is at risk, the farmer is told. Three photos, while the water is still there. This phone is shared, so a helper can do it with the farmer's own consent." |
| 1:20 to 2:30 | A judge takes three real photos | "Real camera, real location. If the camera or location is refused, it says so and labels the substitute." |
| 2:30 to 3:30 | Seal, then the QR, then the laptop scans | "Sealed on the phone. The photos never leave it. Only a 338-character code travels. The laptop checks it: unchanged since sealing, received just now." |
| 3:30 to 4:15 | The judge changes one character | "Now change one character." (The check flips to "Changed after sealing".) "That is the seal." |
| 4:15 to 5:15 | Officer view: map, ranked list, one plot's reasons | "The officer sees why each plot is ranked where it is, with its uncertainty. Saboot ranks the work. The decision happens outside Saboot." |
| 5:15 to 6:15 | The four labels, and the replay result or "Not run" | "Live, replay, simulated, entered by hand: every value says which. We ran the same rules on one real flood: here are the counts, the source, and what they cannot tell you." |
| 6:15 to 7:00 | The pilot slide | "One block, one comparison block, success and stop conditions agreed before the season. We need a plot register, gauge data and a nodal officer." |

**Backup layers, in order.** (1) The team phone and the laptop webcam. (2) The judge's own phone through the QR, if the venue
has mobile data. (3) The link route: share the link through any messenger and open it in a new tab. (4) Paste the code by hand.
(5) A saved valid code from an earlier real capture, labelled "recorded earlier". (6) The recorded clips below.

**Backup recording plan (you record, I prepare).**
- Record three clips on the real devices, with narration, at 1080p: the full flow (about 6 minutes), the tamper moment (60 s),
  and the replay block (45 s).
- Put a small "RECORDED" caption in the corner of each clip, so the backup is honest too.
- Keep copies on the presenting laptop, a USB drive and a phone. Play them in a media player, not a browser tab, so no
  network or cache is needed.
- Optional if time remains: a scripted Playwright run that records a video of the phone flow as an extra fallback.

**Failure table.**

| If | Then |
|---|---|
| The camera is refused | Use the phone's file picker. If that fails, "Use a simulated photo", and say it is simulated |
| The laptop webcam cannot read the QR | Paste the code, or open the link in a new tab |
| There is no internet | Use the team phone. Skip the judge-phone route |
| A page reloads | State is kept, and the page returns to the same screen |
| Someone presses `R` | It asks first when anything is captured |
| The projector or laptop sleeps | Disable sleep. Keep a second laptop with the same cached site |

## 6b. The Impact slide: three sentences a judge can repeat

Every number below comes from the console's replay block (`public/data/validation-status.json`, written by
`scripts/replay/publish.ts`), never typed by hand. Read them in this order:

1. **The scale of the problem.** "In one monsoon flood activation, the first flood maps covered about 180,000 hectares of
   farmland." (Copernicus EMS land-use statistics of the activation the replay uses; a fact about the flood, not about Saboot.)
2. **What the replay showed.** "On that flood, Saboot's rain rule alone would have flagged 47 of the 138 mapped-flooded sample
   points and 39 of the 151 mapped-dry ones; in a quiet fortnight it flagged none. The river rule fires for every point near
   a swollen river, flooded or not, which is why the app weighs it lower." Say "coarse check", never "validated"; say
   nothing about hours earlier.
3. **What a pilot measures.** "A pilot would count three things: how many flooded fields have sealed evidence on file within
   the advice window, how long from the event to that evidence, and how many officer visits end in a dispute about a photo."
   (`docs/PILOT-PLAN.md`; these are the pilot-metrics definitions on the console.)

If a judge asks for accuracy: "We do not have an accuracy figure and will not invent one. The counts are on screen, with
their limits."

## 7. Decisions for you at Checkpoint 2
1. The USP sentence in section 2, and the "unchanged, never genuine" rule for the pitch.
2. The MVP in section 3 and the cut line in section 5.
3. The demo order in section 6, and who records the backup clips.
4. The Phase 4 order: C-01, C-02, C-03 first, then C-04 to C-12, then the Should items.
