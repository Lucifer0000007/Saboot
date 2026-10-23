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

## 4. Loop log

| Task | Success check | Attempts | Result |
|---|---|---|---|
| Public URL, team name, prototype wording | `npm run build` puts the Netlify host in canonical and og tags, zero `placeholder` in `dist/`; `budgets.mjs`, `markers` (19 left), the claims tests and `release.spec.ts` pass | 1 | Pass |
| Install Semgrep in isolation | `semgrep --version` runs | 1 | Pass (1.182.1) |
| Prove the Semgrep packs actually detect something | A planted `eval` and `innerHTML` file is flagged | 2 | Attempt 1: nothing flagged, because `p/javascript` has no DOM-sink rules. Attempt 2: the same rules run by name were flagged. The engine works. Extra packs and named rules were then run on the repository. |
| Semgrep coverage | No parse errors | 1 | Two build scripts partly parsed. Reviewed by hand (S-02). |
| Performance audit on a throttled phone profile | Cold-load, deep-link, MVP-flow and play-cost numbers for three profiles | 2 | Attempt 1 (a delegated agent) stalled with no progress for ten minutes after saving a cold-load matrix. Attempt 2 ran the missing measurements directly in smaller steps. Pass. |

## 5. Blocked log
None so far.

## 6. Compliance check
Instruction | met, partly or not | evidence | gap. "Met" is claimed only where a file, test or command shows it. Rows are updated at
each checkpoint and at the end.

| Instruction | Status | Evidence | Gap |
|---|---|---|---|
| Features first, then the evaluator, mentor and judge review | Partly | `docs/FEATURE-MAP.md` (Phase 2) exists | Phase 3 starts only after your go |
| USP and MVP | Not yet | The MVP hypothesis is in the approved plan. `docs/USP-MVP.md` does not exist | Phase 3 |
| Two checkpoints only, autonomy between | Met so far | No question was put to you after the plan was approved. Work stopped at Checkpoint 1 | Checkpoint 2 is ahead |
| Viability gate before building | Met so far | Section 1 of this file. Nothing was built beyond the trivial placeholder fixes | Applies to every Phase 4 task |
| Looping engineer, three attempts at most | Partly | Section 4: four tasks, one needed two attempts, none blocked | Phase 4 loops have not started |
| Karpathy rules | Partly | `CLAUDE.md`. `git log` shows three commits, one concern each, no refactors. `docs/TOOLS.md` pins the plugin | Judged on the Phase 4 diffs |
| All four labels (LIVE, REPLAY, SIMULATED, HAND) | Not yet | Design only, in `docs/FEATURE-MAP.md` | Phase 4. The audit shows why it is needed (A-02, L1-01) |
| Real or past data | Partly | Section 2: test requests for rain, discharge and the extent listing all succeeded. Nothing downloaded or run | Method document, retrieval and harness run in Phase 4. Fallback: "Not run" |
| Semgrep | Partly | `docs/SECURITY-SCAN.md`: version 1.182.1, metrics off, registry packs plus named rules, one false positive documented, positive control in section 4 | True positives are fixed in Phase 4. Rerun in the final loop. `/security-review` not yet run |
| Chrome tooling | Partly | `docs/SETUP.md`. Claude Code 2.1.302 meets the 2.0.73 minimum. No Chrome browser tools were present in this session | You install the extension and run `/chrome` |
| Curated tools | Partly | `docs/TOOLS.md`: 11 audited, a shortlist of 7, pins checked against the installed-plugins record. Nothing installed | Needs your go on pins, scope and disables |
| No calendar dates | Met in the new files | A date search over `CLAUDE.md` and the new docs finds none (version strings such as 2026.10.4 aside). The plan file has no schedule | The earlier Word guide (`docs/Saboot-Complete-Guide.docx`, untracked) has dates on its cover and in its source notes |
| Non-negotiables | Partly | 127 unit tests pass, including the claims tests. Budgets pass. No amount is shown anywhere | The audit finds the demo path breaking three: honest labels (A-02), no claims of capabilities that do not exist (L1-01), and per-farmer consent in helper mode (L1-05) |
| Nothing non-viable is mapped | Met | `docs/FEATURE-MAP.md` has no NO-GO items. They are in section 1 (D-01 to D-05, D-12, D-16) | None |
| Mistakes found and explained | Partly | `docs/AUDIT-REPORT.md`: 6 blocker rows, 31 major, 43 minor, each with repro, why it matters, fix and effort. Three were fixed | The plain-language explanation comes in the final report |
| Text, font and spacing fixes | Not yet | Measurements and a monospace judgement are in the audit (L4-10 to L4-15) | Phase 5 |
| Honesty about real versus simulated | Partly | Meta, manifest and noscript reworded. The placeholder host is gone from `dist/` | A-02, A-04 and L1-01 are open and the labels are unbuilt |
| Stop list respected | Met so far | No account, key, payment, user-wide install, `semgrep login`, upload or deploy. Semgrep lives outside the repository. `tests/unit/claims.test.ts` is untouched | I deleted two `{{VERIFY}}` markers in `src/config.ts`. They were placeholders for the team name and public URL, which you supplied, not real-world claims. The other 19 markers are untouched |
