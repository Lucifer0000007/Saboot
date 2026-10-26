# Response to an outside review

An outside review ("Saboot: Code Review and Improvement Plan") was written from the README, the live site and an older snapshot
of the repository. Its own scope note says **no source file was opened**, so every finding rests on documented behaviour. This
page checks each one against the actual code, says what was right and what was not, and says what changed. Nothing here is a
verdict on the reviewer; a review from documents is a useful second pair of eyes, and several points were right.

Verdicts: **Right, done** · **Right, already known** (the repo documented it) · **Partly right** · **Wrong or outdated** ·
**Right, roadmap** (not built now, with the reason) · **Yours to do** (needs a person or a device).

## Fix before judging

| # | The review said | Verdict | What the code showed | What changed |
|---|---|---|---|---|
| 5.1 | Request persistent storage for the offline queue | **Partly right** | `navigator.storage.persist()` was already requested (`src/farmer/focus.ts`), but the answer was thrown away, so a refusal was silent. Running real Chrome showed a second thing: a fresh profile answers no, so warning on every refusal would have shown to nearly every new farmer, even online, after the photos were already sent. | `requestPersistence()` keeps the answer (`src/lib/db.ts`). The farmer sees a warning (English, Hindi, Punjabi) only when the browser refused **and photos are still waiting to be sent**, which is when eviction would lose them. Only real photos ask. `tests/unit/persistence.test.ts` and three browser tests (refused and offline warns; refused and online, and granted and offline, stay silent). |
| 5.2 | The README has leaked template placeholders (`<!--f:...-->`) and truncated cells | **Wrong** | Those are deliberate, invisible HTML comments that `scripts/docs-facts.mjs` fills and `npm run facts:check` verifies. They were visible only because the reviewer read the raw text. | None needed. |
| 5.2 | "rules for contributors:" ends with nothing | **Right, done** | A dangling line. | The README now links `CONTRIBUTING.md` and `CLAUDE.md`. |
| 5.2 | `docs/screenshot.jpg`, `recording-script.md` missing | **Right, done** (`SCENARIO-FACTS.md` already existed) | Both README links were broken (audit A-18). | `docs/screenshot.jpg` generated from the new design; `docs/recording-script.md` generated from the dictionaries by `scripts/recording-script.mjs`. |
| 5.2 | Add a repo description, topics and a v1.0.0 release | **Right; set on GitHub, not in the code** | The description and topics are repository settings, and were empty. | Set with the GitHub CLI: a description, the homepage, and ten topics. The `v1.0.0` release tag waits until this work is merged to `main`. |
| 5.3 | The README's Firefox `crypto.subtle` note is probably wrong | **Right, done** | Tested directly: Playwright's Firefox (157) hashes and signs with ECDSA. The smoke config the README named (`playwright.browsers.config.ts`) was never committed, and the tests skipped Firefox on the stale claim. | Config added, skips removed, README corrected: 46 of 46 Firefox and WebKit smoke tests pass, none skipped. |
| 5.4 | Add PR CI | **Right, done** | The only workflow was a manual Pages deploy. | `.github/workflows/ci.yml`: typecheck, lint, unit tests, i18n, contrast, facts, fixture, markers, build and budgets on every push (about 2 minutes). The reviewer's snippet ran `biome ci .`; the repo's lint is `npm run lint`, so CI uses the repo's scripts. The 15-minute browser matrix and Lighthouse stay local (`npm run verify`). |

## Trust and integrity

| # | The review said | Verdict | What the code showed | What changed |
|---|---|---|---|---|
| 6.1 | Packet v2 should sign the whole context (helper, consent) | **Right, already known; roadmap** | `docs/EVIDENCE-FORMAT.md` already says the consent and helper are not signed in version 1 and lists signing them as "intended for a later version, not built". The reviewer's sketch (canonical JSON, RFC 8785) does not fit the signed body, which is a compact binary format; what would be signed is a hash of the canonical-JSON context block. Changing the signed bytes breaks old codes, both verifiers and the 21 test vectors, so it is not done days before judging. | `docs/ROADMAP.md`, and `SECURITY.md` lists it as a known limit. |
| 6.2 | A key ID and shared-device handling | **Right, roadmap** | The key is a device key tied to no person (documented). A helper's phone signs for many farmers. | `docs/ROADMAP.md`. |
| 6.3 | Flag the same photo SHA-256 in two packets or on two plots | **Right, done (exact copies)** | Nothing flagged it. | The import sheet flags the same live photo file sealed for a different plot (`photoReuse`, `src/k/imported.ts`; `tests/unit/photo-reuse.test.ts` and an end-to-end browser test in `tests/qa/mvp.spec.ts`; both fail if the rule is broken). Simulated photos and the same plot sealed twice are left out on purpose. A perceptual hash for re-saved copies needs a format change: roadmap. |
| 6.4 | Fuzz the verifier and decoder, add size caps | **Right, done; caps already existed** | The app decoder already caps input at 1,024 characters and checks lengths and counts. | `tests/unit/verifier-fuzz.test.ts`: random input, every truncation, every single-character change, oversized and lying-length input, against both verifiers, which must agree. It found no bug. |
| 6.5 | A monotonic clock anchor at seal time | **Right, roadmap** | The clock is documented as unchecked. The anchor needs a new field. | `docs/ROADMAP.md`. |

## Detection quality

| # | The review said | Verdict | What the code showed | What changed |
|---|---|---|---|---|
| 7.1 | The river rule fired on 32 plots against 24 flooded (precision 0.67, recall 1) | **Mostly right** | Computed from the model: Rule C fires on all 32 plots in the river's reach (31 riverside, 1 low-lying) and 20 of them are truly flooded: precision 0.63, recall 0.83. The review's 0.67 and 1.00 are the figures for all rules together (36 flagged, 24 correct), so it paired one rule's count with the combined scores. Its diagnosis holds: every one of the 12 false alarms in the combined check comes from Rule C (Rule A: 3 of 3 correct; Rule B: 20 of 22). Alerting every plot in reach is documented design: the farmer's "no damage" reply closes it, the explainer says so, and the check is labelled a consistency check, not a validation. | Nothing in the rules: each suggested fix changes every published number and should follow real data. The per-rule figures are not shown in the console yet (`docs/ROADMAP.md`). |
| 7.2 | Version the rule configuration and stamp it into exports | **Mostly done already** | `RULE_VERSIONS` (`src/sim/rules.ts`) is stamped into every draft-list export, and tests read it. The thresholds and weights are not in one versioned file. | The remaining step is in `docs/ROADMAP.md`. |
| 7.3 | Property tests on tiers and priority (fast-check) | **Right, done** | Tests covered tier-versus-band rules but not the stated invariants. | `tests/unit/invariants.test.ts` over every plot, moment and rail: the score and band stay in 0..1 and hold each other, adding a photo never lowers a score, a tier never outruns its band, hand-entered evidence never raises a tier, priority ranks the ambiguous first. It uses a seeded generator instead of fast-check, because CLAUDE.md asks for no new dependency without a reason. All hold. |
| 7.4 | Run `npm run validate:real` once on a past Punjab or Bihar flood | **Partly outdated; yours to do** | The replay already ran two of the rules on a real flood and shows raw counts under a REPLAY label (`docs/REPLAY-METHOD.md`). An Indian flood needs a flood-extent map and the department's confirmed affected list, which the repo does not have. | `docs/ROADMAP.md`, `docs/PILOT-PLAN.md` Phase 0. |

## Engineering hygiene and open questions

| The review said | Verdict | What changed |
|---|---|---|
| Add `SECURITY.md` and a CI badge | **Right, done** | `SECURITY.md` (what to report, what is a documented limit), `CONTRIBUTING.md`, and a CI badge in the README. |
| A service-worker "update available" prompt instead of a silent swap | **Already done** | The update bar, with a build stamp in the footer and Settings (`docs/DESIGN_LOG.md`). |
| Test on a real iPhone in Safari and a low-end Android | **Yours to do** | On the manual list (`docs/FINAL-REPORT.md`). |
| Consider C2PA in the long run | **Right, roadmap** | `docs/ROADMAP.md`. |
| Move paragraph text out of monospace | **Already done** | The redesign set text in Noto Sans and kept mono for hashes (`docs/DESIGN.md`). |
| Decide the primary buyer: revenue department or insurer | **Already decided** | The revenue department is first and the insurer a second use of the same evidence (`docs/BUYER-ONE-PAGER.md`). |
| The guide's "one story, three doors, one workbench" UI split | **Not adopted** | The redesign addressed the same concerns without splitting the product. |
| "Several issues in the guide no longer appear" (`verify.sh`, `PUBLIC_URL`, 21 markers) | **Right** | All three were already fixed; no `{{VERIFY}}` claim remains. |

## Summary

**Right and done:** the Firefox note and its missing test config, the missing CI, the silent persistence refusal, the dangling
README line and broken links, the missing security file, photo-reuse flagging for exact copies, fuzzing, and property tests.

**Right, already known to the repo:** the unsigned context in packet version 1 (now laid out in `docs/ROADMAP.md`), rule
versions in exports, the update prompt, the monospace paragraphs and the buyer question.

**Wrong or partly wrong:** the "leaked placeholders" (deliberate comments that render invisibly), the claim that persistence was not requested at all (it was; the answer was ignored), and the pairing of the river-rule counts with the combined precision and recall. The review's diagnosis was right: the river rule produces every false alarm in the replay.

**Roadmap, with the reason:** the format changes (signed context, key identifier, clock anchor, perceptual hash), rule changes
that wait for real data, and real-data validation, which needs data the repo does not have.

**For the owner by hand:** a real iPhone and a low-end Android test, the GitHub description, topics and release tag.
