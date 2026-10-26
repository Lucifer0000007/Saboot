# Decisions

Every decision gets one line and a reason. **GO** build it. **REDUCE** build a smaller version. **MERGE** fold it into another
item. **NO-GO** do not build it, and do not map it for implementation. Feature-by-feature decisions are in
`docs/FEATURE-MAP.md` (F1 to F28, N1 to N4). This file records the rest.

## 1. Viability log

| ID | Item | Decision | Reason |
|---|---|---|---|
| D-01 | A backend or relay server | **NO-GO** | The laptop is the receiver. A server adds venue-network risk and HTTPS needs, and contradicts `privacy.spec.ts` (plain GETs, no bodies) and the CSP. |
| D-02 | A live weather or river call from the app | **NO-GO** | Breaks "no runtime third-party requests", leaks the user's location, needs internet. Real data is fetched in advance and stored. |
| D-03 | Real outbound voice calls | **NO-GO** | Vendor documentation says business registration and template approval take 1 to 2 weeks (indicative, from vendor pages; confirm with counsel). Not realistic in the window. The alert stays real audio on the phone, the call stays SIMULATED. |
| D-04 | Live cross-device sync | **NO-GO** | Needs a server (D-01). The QR, link and paste routes already carry the evidence. |
| D-05 | On-device photo classification | **NO-GO** | Speculative. The principle "AI only does perception and language" stays a design statement, and no copy says it is built. |
| D-06 | A separate real plot-registration screen | **MERGE** into capture | The packet's rounded GPS position is the real location. A second screen adds steps and nothing the officer can use. |
| D-07 | Four provenance labels (LIVE, REPLAY, SIMULATED, HAND) | **GO, REDUCED** | Per input or observation value. Derived numbers inherit through their region label. A badge on every score would bury the farmer screens. |
| D-08 | Packet provenance flag in the high bits of the kind byte | **GO** | Chain-covered and signed, and old codes verify unchanged (their bits are 0). Fallback if any vector changes: UI-only labels, with the reason documented. |
| D-09 | HAND trust cap: a hand-entered value alone cannot reach Supported | **GO (proposed default)** | Shown as its own factor with before and after. Needs N4 to have a live input. Without N4 it is a unit-tested rule with no input yet, and says so. |
| D-10 | Hand-entered water depth, four choices (N4) | **GO-LAST** | First to cut after the MVP flow. It is the only hand input that can reach the evidence. |
| D-11 | A real-flood replay, run offline | **GO, timeboxed** | See section 2. Fallback: the validation block stays "Not run". |
| D-12 | Scoring Rule B on the replay | **NO-GO** | The flood extent is derived from radar, so scoring a radar rule against it is circular. Reported as "not independently validated". |
| D-13 | Semgrep | **GO, done** | Isolated, metrics off, no login. Results in `docs/SECURITY-SCAN.md`. |
| D-14 | Chrome extension | **REDUCE** | Documentation only (`docs/SETUP.md`). The owner installs it. Playwright stays the only automated gate. |
| D-15 | Skill and plugin curation | **REDUCE** | `docs/TOOLS.md`. Nothing installed or changed until the owner says go. |
| D-16 | A pre-commit hook | **NO-GO** | The gate loop is run by hand after every task. A hook adds a commit-time failure mode. |
| D-17 | Recreating `verify.sh` | **GO** (first Phase 4 task) | Without it `npm run verify` and `npm run deploy` cannot run. Labelled a reconstruction from the README list. |
| D-18 | Primary live demo on a team-owned phone | **GO** | Works from the service-worker cache with no internet. A judge's own phone is a bonus when mobile data exists. |
| D-19 | Working rules file (`CLAUDE.md`) | **GO, done** | Replaces the dangling "rules for contributors" pointer. |
| D-20 | `window.__sab` test hook in the production bundle | **ACCEPT, mitigated** | The QA suite needs it. The provenance flag makes a code built through it say SIMULATED. |
| D-21 | Per-farmer export and delete | **DEFER** | Medium effort. The privacy document is corrected to match behaviour instead. |

## 2. Replay candidates (for Checkpoint 1)
Test requests were made for each source. Nothing has been downloaded into the repository. Dates belong in the provenance
README under `data/replay/`, so none are written here.

**R-1, recommended, needs no login.** Copernicus EMS Rapid Mapping activation **EMSR838**, "Flood in Pakistan": a monsoon
flash flood affecting Punjab and Khyber Pakhtunkhwa. **This is the Pakistan side.** No flood activation involving India appears
in the EMS public list (268 activations checked); the only other recent flood activation in South Asia is for Nepal.

| Part | Source | What the test request showed | Licence and credit |
|---|---|---|---|
| Flood extent | EMSR838 delineation products, 11 areas, observations from Sentinel-1, ICEYE and COSMO-SkyMed. The products ZIP is public: a plain GET redirects to the download, no login | Areas on the Chenab, Ravi and Sutlej exist for the same places as the river points below | Free, open, "full, open and free-of-charge basis". Credit line template: `Copernicus Emergency Management Service (© <activation year> European Union), EMSR838 [area]: [product]`. Anyone distributing it must say where it came from. No DOI. |
| Rain | Open-Meteo historical API, `models=era5` (hourly, 0.25 degree, about 25 km) | Returns hourly precipitation for the period without a key. Same point: ERA5 about 129 mm over a 17-day window, IFS (9 km) about 114 mm | CC BY 4.0. "Give appropriate credit, provide a link to the licence, and indicate if changes were made", with a link next to any place the data is shown. Free tier is **non-commercial only**: 600 per minute, 5,000 per hour, 10,000 per day. Also: "Generated using Copernicus Climate Change Service information". |
| River | Open-Meteo Flood API (GloFAS v4, daily discharge in m³/s, about 5 km) | Returns data for the period. Three points snap to the right river: Chenab (32.325, 73.675) 892 to 4,129; Ravi (31.475, 74.125) 401 to 3,596; Sutlej (31.025, 74.525) 1,258 to 3,089. Other points snap to tiny streams (0 to 33), which confirms the "wrong river" warning | CC BY 4.0 as above. The consolidated reanalysis ends years before this period, so the period comes from the archived forecast runs of the same product. Label it that way. |

Corrections to the earlier research notes: ERA5 is about 25 km, not 10 km (the 9 to 11 km products are IFS and ERA5-Land, and
ERA5-Land returned no precipitation). The Flood API's daily discharge for this period is a forecast-run archive, not
reanalysis. Rule C is stage-based, so it needs a **labelled percentile threshold on discharge** as a scenario parameter, fixed
before the run.

**Hand steps for R-1: none.** No key, no account, no login.

**R-2, needs a login you create.** Copernicus Global Flood Monitoring (Sentinel-1, 20 m, free; viewing and download need a
free registration). It would give an Indian-side extent if one exists for the period. **Not verified**: coverage for Indian
Punjab was not checked, because it needs the login.

**What a result can and cannot say.** Rain at 25 km and discharge at 5 km daily are being compared with an extent mapped at
tens of metres. Every point in one rain cell gets the same rain, so a negative control inside the same cell can only be a false
alarm by construction. The result shows whether these coarse signals were high where flooding was mapped. It is not
point-level skill and not "alerted X hours earlier".

## 3. Gate conflicts: proposals for the owner (nothing changed yet)

| ID | Conflict | Options | Recommendation |
|---|---|---|---|
| G-1 | `scripts/budgets.mjs` fails on any absolute URL in `dist/` that is not the site's own host. Two wanted links trip it: the GitHub footer link (A-09) and the Open-Meteo credit link its licence requires "next to any location data are displayed". | (a) Text credit with no URL in the app, links in the docs. (b) Named allowlist entries, with the reason written next to them, for exactly those two URLs. | **(b)** for the two links, because the licence is explicit and the gate stays strict for every other URL. Needs your approval. A GitHub link as plain text with no scheme passes today but is not clickable. |
| G-2 | `tests/unit/claims.test.ts` bans the word "Punjab" in `src`. | Label the replay by source ID only (for example "Replay R-1") and keep place names in the docs and the data README. | **This one.** The test is not edited. Putting the name in a data file and printing it at run time would get around the test's intent, so it is not done. |
| G-3 | The new copy must stay clear of the claim patterns the same test bans. | Say "tested on a real flood" and give counts. Never say "validated", never give a percentage accuracy. | **This one.** Checked by `npm test` after each copy change. |
| G-4 | The Impact validation block prints precision and recall as percentages, and says the numbers "come from real inputs". | For REPLAY, show raw counts first (caught, missed, false alarms, correct rejections, points), the source ID, the scale mismatch and "not independently validated" for Rule B. Show a ratio only when the counts support it. | **This one.** It needs a small change to what `--publish` writes (the counts are not in the status file today). |
| G-5 | `verify.sh` does not exist. | Recreate it from the README list, labelled a reconstruction. | **This one**, as the first Phase 4 task. |

**Approved at Checkpoint 1 (the owner said "go" with these defaults):** G-1 option (b), two named allowlist entries; G-2, G-3,
G-4, G-5 as recommended; replay candidate R-1; the HAND trust cap as the default rule; packet provenance flags in the kind
byte; `verify.sh` reconstruction. Tool disables and pins in `docs/TOOLS.md` remain proposals: no setting was changed.

## 4. Loop log

| Task | Success check | Attempts | Result |
|---|---|---|---|
| Public URL, team name, prototype wording | `npm run build` puts the Netlify host in canonical and og tags, zero `placeholder` in `dist/`; `budgets.mjs`, `markers` (19 left), the claims tests and `release.spec.ts` pass | 1 | Pass |
| Install Semgrep in isolation | `semgrep --version` runs | 1 | Pass (1.182.1) |
| Prove the Semgrep packs actually detect something | A planted `eval` and `innerHTML` file is flagged | 2 | Attempt 1: nothing flagged, because `p/javascript` has no DOM-sink rules. Attempt 2: the same rules run by name were flagged. The engine works. Extra packs and named rules were then run on the repository. |
| Semgrep coverage | No parse errors | 1 | Two build scripts partly parsed. Reviewed by hand (S-02). |
| Performance audit on a throttled phone profile | Cold-load, deep-link, MVP-flow and play-cost numbers for three profiles | 2 | Attempt 1 (a delegated agent) stalled with no progress for ten minutes after saving a cold-load matrix. Attempt 2 ran the missing measurements directly in smaller steps. Pass. |
| The log only moves forward (L3-01, L3-03, L1-06) | `tests/unit/evidence-safety.test.ts` and the reload, reconnect and two-tab tests in `tests/qa/mvp.spec.ts` | 2 | Attempt 1 serialised appends and stamped events forward; the e2e reconnect test still showed one queued item. Attempt 2 found a second bug: a sync at page load ran before the stored log was in memory and dropped the packet. Pass. |
| Camera and microphone off when a screen is left (L2-01) | `tests/qa/devices.spec.ts`, four cases | 2 | Attempt 1 used Chrome's fake camera, whose track ends by itself within a second, so "off" proved nothing. Attempt 2 gives the page stand-in devices that stay live until stopped. Pass. |
| The MVP flow end to end (A-01, A-05, A-10, A-11, A-14) | `tests/qa/mvp.spec.ts`: phone to laptop, QR version 10, dedupe, changed copy, link paste | 1 | Pass |
| The FAQ raw tokens (A-04) | A new QA check fails on any `{token}` in the page text; red on the old page, green on every state | 1 | Pass |
| `verify.sh` (A-13) | `npm run verify -- --quick` runs every gate end to end | 2 | Attempt 1 failed at the URL gate: the new GitHub link was read with the backtick that followed it. Attempt 2 ends a URL at a backtick. Pass. |
| Replay R-1 (B) | Method committed first; raw files fetched with a manifest; harness run three ways with the network blocked; two runs byte-identical; fixture test; console block with raw counts | 1 | Pass. Rule A caught 47 of 138 mapped-flooded points and alarmed on 39 of 151 mapped-dry points; 0 alarms in the quiet window. Rule C fires for every point in its nominal reach, as the method said to expect. |
| Validation harness correctness (L1-09, L1-10, L1-11) | Nine new unit tests; the fixture's counts unchanged | 1 | Pass |
| Console parity (L1-08), rail parity (L1-04), hail prompt (L1-02), helper flag (L1-07), band rounding (L1-12), median (L1-13) | One unit test file each, red on the old code | 1 | Pass |
| High contrast (L4-04), scroll padding (L4-05), device language (L4-03), scenario and language chunk retry (L4-06, L3-05), offline-ready cue (L3-09), audio offline (L2-14) | A QA test each, red before the change | 1 | Pass |
| The farmland number and the counts sentence (plan item A) | The number recomputed from the raw record in a unit test; the sample byte-identical; the replay QA test | 1 | Pass |
| The demo receiver (plan item D) | Unit test over `node:http`; `tests/qa/receipt.spec.ts` off by default, send, offline queue, console import with the laptop's time; the privacy spec untouched | 3 | Attempt 1: the watcher's effect subscribed to a signal the flush flips and starved the main thread after a reload. Attempt 2: the console's poll was a mount-time check that lost to the deep link on a desktop page. Attempt 3: an effect that follows the preference. Pass. |

## 4b. Phase 3 decisions

| ID | Item | Decision | Reason |
|---|---|---|---|
| D-22 | The USP sentence | **GO** | "Saboot tells a farmer the moment a flood starts, and seals their photos so any change shows." It says "any change shows", never "can't be faked". |
| D-23 | The MVP | **GO** | Five steps: alert, three real photos, seal and QR, check on the laptop with a new officer row, one changed character fails. Success checks are in `docs/USP-MVP.md` section 3. |
| D-24 | The X factor | **GO** | The breaking seal. A judge changes one character and the check flips. |
| D-25 | Strict decoding in both verifiers | **GO** | Today the last character of a code can change without breaking it (16 valid strings for a 3-photo code). A judge could hit that during the X factor. |
| D-26 | New tests as new files | **GO** | `claims.test.ts` is not edited. Checks such as "no raw token", "no capability claims" and the MVP flow go in new test files. |
| D-27 | Backup recording | **GO (you record)** | Three clips with a "RECORDED" caption, played from a media player. A scripted video of the phone flow is optional and last. |

## 4c. Phase 4 decisions (taken while building, each with its reason)

| ID | Item | Decision | Reason |
|---|---|---|---|
| D-28 | Hand-entered water depth (N4) | **CUT** | First on the cut line after the MVP flow. The HAND trust rule is built and unit-tested (`capHand`, `tests/unit/hand-cap.test.ts`) and says it has no input yet. Typed values that exist today (filing reference, helper name) never enter the evidence score. |
| D-29 | The photo factor's time window | **Same on both rails: 72 h after the event** | The relief rail's capture-soon advice is not a deadline, yet it halved a late photo's strength on that rail only. The spec promises identical tiers on both rails; a test now pins it. |
| D-30 | "Missed" in the console figures | **No evidence captured yet after the window closed** | The old definition counted a plot as missed and as late at once, and the top strip and the pilot-metrics tab disagreed. One function feeds both. The facts file changed from 2 to 1 missed. |
| D-31 | A hail prompt still waiting for a reply | **Unconfirmed in the draft list from the start** | It used to count as flooded until its window ended, so the published list rewrote itself when the prompts closed. |
| D-32 | The Open-Meteo credit | **Link to open-meteo.com in-app, licence link in the data README** | The licence asks for credit, a licence link and a note of changes. A third outside address (the licence page) would widen the gate beyond the two entries approved; the data README carries it. |
| D-33 | Rule C danger level for the replay | **The 90th percentile of the point's own baseline days, labelled** | No official level exists for a discharge grid point. Fixed in the method before the run; shown as "not an official level" wherever it appears. |
| D-34 | Replay Rule A low-lying input | **Every point assumed low-lying, stated as an upper bound** | The real data has no elevation per point. Stated before the run; the Rule A + low-lying test of the app is not exercised. |
| D-35 | The QA file server's bind address | **Keep every interface, fix the path check** | A phone on the same Wi-Fi opens the laptop's address to rehearse the demo. After the fix it can serve only the public build. |
| D-36 | The voice clips | **Precached with the app** | "Cached on first play" never worked: a media element asks for a byte range and the cache refuses a 206. Four clips, 62 KB. |
| D-37 | Toast duration | **5 s** | 3.6 s was gone before a warning could be read, in Hindi and Punjabi least of all. |
| D-38 | A receipt server for the demo | **GO, on the laptop over HTTPS** | A phone on the laptop's plain-HTTP address has no WebCrypto and nothing to sign; a phone on the public HTTPS site cannot post to a LAN address (mixed content, `connect-src 'self'`, the private-network block). So the laptop serves the build over HTTPS with a mkcert certificate the owner makes, and the POST is relative and same-origin. A Netlify function was the alternative: a real backend on the owner's account, needing internet at the venue. |
| D-39 | How the console reads the receiver's list | **POST, not GET** | The service worker caches any same-origin 200 GET and ignores the query string; a GET poll would go stale. A POST passes through, and the one-cache assertions of the offline proof stay untouched. |
| D-40 | The send queue on the phone | **Its own kv entry, not the simulated outbox** | The simulated sync counts and clears every outbox key; a real network item inside it would show on the sim strip. |
| D-41 | What the receiver keeps | **The code and its receipt time, nothing else** | No address, no browser string. The laptop never verifies: the console checks each code in the browser, as it checks a scanned one. |
| D-43 | The Lighthouse gate at 2.70 s in the last session | **Recorded, not worked around** | The earlier passing source measures the same on this machine now, so the cause is environmental. The threshold is untouched; the owner reruns on a quiet machine before deploying. |
| D-42 | The farmland number on the console | **From the activation's own statistics, labelled as the problem's scale** | The number flows from the saved record through the sample, the summary and the status file; it is never typed by hand, and the sentence says it is not a result of this app. |

## 4d. Final-round decisions (the owner gave full control of the project; each with its reason)

| # | Decision | Chosen | Why |
|---|---|---|---|
| D-44 | The six `{{VERIFY}}` markers removed in the citation pass (Sentinel revisit ×3, IMD heavy rain, the 14447 channel, the missed-call noticeboard) | **Removed, signed off** | The owner supplied the verified facts (Sentinel-1C and 1D, IMD categories, KRPH and 14447) and asked for the noticeboard to become a design note; the replacement copy uses only those facts. Thirteen markers remain. |
| D-45 | The visual layer | **Rebuilt (docs/DESIGN.md)** | The parchment, serif and mono look read as a template; the soil palette, Anek and Noto Sans, the lac seal and the five label chips make the subject and the honesty visible. Logic, facts and label meaning unchanged. |
| D-46 | Field evidence | **One data file (src/data/fieldEvidence.ts), shown on the landing page and the impact view** | Every number comes from fieldCounts(); themes, figures and quotes stay empty until a raw note exists; roles are counted plainly (4), a description never makes a new role. |
| D-47 | The scheme field where a person did not say | **"not confirmed"** | The owner's rule; Bihar and West Bengal already carried it. |
| D-48 | The target-state line | **"{state} interviews: {n} so far."** | The owner's word order; the state comes from the data because English copy may not name a state (tests/unit/claims.test.ts). |
| D-49 | Phase 0 of the pilot | **An evidence-only pilot with a helper and an officer** | It needs no department data and uses what runs today; it claims nothing about detection or assessment. |
| D-51 | The last 13 `{{VERIFY}}` claims | **Cited, softened or reworded as design; the owner approved the two claims-test lines** | Cited (public sources, each named in its code comment): the SDRF/NDRF 33% crop-loss norm and Haryana running PMFBY (`src/config.ts`), the 72-hour intimation window, KRPH 14447 and the Crop Insurance App, CWC flood forecasting, flooded paddy in radar (Singha et al.), radar and flooded vegetation (UN-SPIDER). Softened to "often": the assessment after the water recedes, and farmers not hearing a clock has started. Reworded as design: the helper roles and the draft list with its objection window. Removed: the unconfirmed Kharif 2026 PMFBY paddy line. `tests/unit/claims.test.ts` now checks the two `config.ts` claims carry their source instead of a marker. |
| D-52 | The outside review (docs/REVIEW-RESPONSE.md) | **Each point checked against the code; fix what is right, record what is not** | The review read documents, not source. Done: the persistence refusal is now shown to the farmer, the Firefox note and its test skips removed after testing Firefox directly, CI, SECURITY.md, CONTRIBUTING.md, photo-reuse flag, fuzz and property tests, the broken README links. Not done, with reasons in docs/ROADMAP.md: packet version 2 (it changes the signed bytes, both verifiers and the 21 test vectors), key IDs, the clock anchor, rule changes that wait for real data. Wrong: the "leaked placeholders" (deliberate comments). Partly wrong: the river-rule figures paired Rule C's count (32, correct) with the combined precision and recall; its diagnosis that Rule C is the noisy rule is right, it produces all 12 false alarms (computed from the model). |
| D-53 | Property tests without a library | **A seeded generator, no fast-check** | CLAUDE.md asks for no new dependency without a reason; the properties need only a loop over the replay's plots and a small seeded generator. |
| D-54 | Photo-reuse flag | **Live photos, different plots, exact fingerprint only** | Simulated photos repeat across plots in the demo, and the same plot may seal the same photos twice, so both are left out; it is a flag to ask the farmer about, never a finding. A perceptual hash needs a format change (roadmap). |
| D-55 | When the storage warning shows | **The browser refused AND photos are waiting to be sent** | A fresh Chrome profile refuses persistence, so a warning on every refusal would show for nearly everyone, online, after the photos are already sent. Found by running real Chrome, not by reading the code. |
| D-56 | Private vulnerability reporting on GitHub | **Enabled** | SECURITY.md sends reporters to it and it was off. |
| D-57 | A phone that stayed on "Loading the flood replay…" with no tabs | **The start can no longer fail silently: one automatic reload, then a message with a Reload button; the data request gives up after 8 s** | Reported by the owner from a phone. A clean run could not reproduce it (Chromium as a Pixel 7, WebKit as an iPhone 13 and Firefox, on slow 4G, 3G and an EDGE-like link, first visit and as a returning visitor with the old service worker), so the cause on that phone is **not confirmed**. Two ways to hang with no message were found and reproduced: the main script fails to download once (the page stayed dead, with no retry), and the replay-data request stalls (it had no time-out, so the placeholder stayed for ever). Fixed: the inline boot script in `index.html` (`scripts/postbuild.mjs`) reloads the page once when the main script fails to load, and if that fails too, or nothing has started after 25 s, the placeholder says so in the visitor's language with a Reload button and the browser's own error text; `loadScenario` gives each of its three tries 8 s. Tests: `tests/unit/load-timeout.test.ts` and four browser cases in `tests/qa/extra.spec.ts` (six runs, one per language where it matters); run against the previous build first, all six browser runs stayed on the placeholder and two of the three unit tests hung. The Netlify badge script logs a content-security-policy error from `about:srcdoc` on the live site; it is injected by Netlify, the same for every browser, and is not the cause. Not tested: a real phone or an in-app browser. The new `boot.*` Hindi and Punjabi strings keep their review flag. |
| D-50 | The ECC plugin the owner installed | **Kept as installed (user-wide, standard hooks)** | The owner's choice. Its Stop hook may reformat edited files; the repo's own lint and tests stay the gate. |

## 5. Blocked log
None. Three tasks needed a second attempt (section 4).

## 6. Compliance check
Instruction | met, partly or not | evidence | gap. "Met" is claimed only where a file, test or command shows it. Rows are updated at
each checkpoint and at the end.

| Instruction | Status | Evidence | Gap |
|---|---|---|---|
| Features first, then the evaluator, mentor and judge review | Met | `docs/FEATURE-MAP.md` (Phase 2) was written and approved before `docs/USP-MVP.md` (Phase 3), which holds the three seats | None |
| USP and MVP | Met in the browser | `docs/USP-MVP.md`; `tests/qa/mvp.spec.ts` runs the five steps on a touch phone and a laptop, with the changed copy failing and the original restored | The real-phone and webcam rehearsal is yours (hand steps) |
| Two checkpoints only, autonomy between | Met | Two approvals. Phases 4 to 6 ran without a question | None |
| Viability gate before building | Met so far | Section 1 of this file. Nothing was built beyond the trivial placeholder fixes | Applies to every Phase 4 task |
| Looping engineer, three attempts at most | Met | Section 4: every task has a check that was red before the change; three needed a second attempt; none blocked | None |
| Karpathy rules | Met | `CLAUDE.md`. `git log` on `overflow/final-prep`: one concern per commit, assumptions stated in the message, no drive-by refactors (the one helper moved, `importWithRetry`, was moved because a second caller needed it) | None |
| All four labels (LIVE, REPLAY, SIMULATED, HAND) | Met | `src/lib/prov.ts`, `ProvTag`/`Val`; LIVE and SIMULATED on every photo and location on the phone and the laptop; REPLAY on the console's replay block; HAND on the typed reference and the helper name; the packet carries live/sim/hand bits; a QA check over every state fails on a value without a label or a coordinate outside one | No hand-entered value reaches the evidence (D-28) |
| Real or past data | Met | `docs/REPLAY-METHOD.md` committed before the run; `data/replay/`; `scripts/replay/`; the console shows raw counts under REPLAY with the source ID and credit lines | The event is on the Pakistan side; India has no public activation. Rule B is not independently validated |
| Semgrep | Partly | `docs/SECURITY-SCAN.md`: version 1.182.1, metrics off, registry packs plus named rules, one false positive documented; every "fix in Phase 4" row is fixed with a test (status section) | Rerun and `/security-review` in the final loop |
| Chrome tooling | Partly | `docs/SETUP.md`. Claude Code 2.1.302 meets the 2.0.73 minimum. No Chrome browser tools were present in this session | You install the extension and run `/chrome` |
| Curated tools | Partly | `docs/TOOLS.md`: 11 audited, a shortlist of 7, pins checked against the installed-plugins record. Nothing installed | Needs your go on pins, scope and disables |
| No calendar dates | Met in the new files | A date search over `CLAUDE.md` and the new docs finds none (version strings such as 2026.10.4 aside). The plan file has no schedule | The earlier Word guide (`docs/Saboot-Complete-Guide.docx`, untracked) has dates on its cover and in its source notes |
| Non-negotiables | Met | The claims tests pass; budgets pass; no amount anywhere; labels on every value (A-02); the untrue capability phrases are gone and a test keeps them out (L1-01); a helper cannot capture or seal without that farmer's consent (L1-05) | None known |
| Nothing non-viable is mapped | Met | `docs/FEATURE-MAP.md` has no NO-GO items. They are in section 1 (D-01 to D-05, D-12, D-16) | None |
| Mistakes found and explained | Met | `docs/AUDIT-REPORT.md` with its status section: every blocker and every major on the demo path fixed, each with a test | The plain-language account is in the final report |
| Text, font and spacing fixes | Not yet | Measurements and a monospace judgement are in the audit (L4-10 to L4-15) | Phase 5 |
| Honesty about real versus simulated | Met | Labels per value; the FAQ answer fixed; the AI step described as planned, not built; the replay says what it is and is not | Native-speaker review of the Hindi and Punjabi labels is yours |
| Stop list respected | Met so far | No account, key, payment, user-wide install, `semgrep login`, upload or deploy. Semgrep lives outside the repository. `tests/unit/claims.test.ts` is untouched | I deleted two `{{VERIFY}}` markers in `src/config.ts`. They were placeholders for the team name and public URL, which you supplied, not real-world claims. The other 19 markers are untouched |
