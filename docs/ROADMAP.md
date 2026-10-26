# Roadmap: what is not built, and why

Everything here is **not built**. Each item says what it would change and what it needs. There are no dates, because the order
depends on what real conversations and a real pilot show (`docs/PILOT-PLAN.md`). Where an item came from an outside review, see
`docs/REVIEW-RESPONSE.md`.

## Integrity (a new packet format, version 2)

Version 1 is a compact binary body, a hash chain and an ECDSA P-256 signature (`docs/EVIDENCE-FORMAT.md`). Anything that changes
the signed bytes is a **new version**: a verifier must refuse a version it does not know, so these ship together, with new test
vectors and both verifiers (`src/k/payload.ts` and the independent `scripts/verify-packet.mjs`) changed in step.

- **Sign "who captured what".** Today the helper's name and the consent text are recorded in a separate hash-chained log on the
  phone, not in the signed bytes. Version 2 would put the hash of that log's canonical-JSON context block inside the signed
  bytes, so a changed helper name or consent line is caught like a changed photo. Test vectors that flip one bit of each, which
  both verifiers must reject.
- **A key identifier, and shared devices.** A helper's phone signs for many farmers with one device key. Options: a key ID in the
  packet; per-farmer sub-keys or a signed helper assertion. Also to define: what happens when site data is cleared and the
  non-extractable key is lost (packets already sealed keep verifying, because each carries its public key).
- **A monotonic clock anchor.** Record `performance.now()` beside `Date.now()` at seal time, so a clock changed on the phone shows
  as an inconsistency and not only as a phone-versus-receipt gap. It only catches a clock changed while the page is open:
  `performance.now()` restarts at zero on every load, so a clock that was wrong before the page loaded stays invisible.
- **Real timestamps** with a stated clock source, a longer plot identifier, and a perceptual photo hash (see below).

## Detection

- **Per-rule precision and recall in the console.** The consistency check shows the combined result of the rules against the
  simulator's own truth. A per-rule breakdown would show which rule produces the false alarms: computed from the model, Rule A
  fires on 3 plots (all flooded), Rule B on 22 (20 flooded), Rule C on 32 (20 flooded), so every false alarm is Rule C's.
- **Rule C false alarms.** Rule C alerts every plot in the river's reach, flooded or not; the farmer's "no damage" reply closes
  each at no cost, and the explainer says so. Options once real data exists: two consecutive readings above the danger level, a
  minimum rate of rise, or a reach-and-lag range per plot. Each changes every published count, so it is decided on evidence.
- **Rule parameters in one versioned file.** The rule versions (`RULE_VERSIONS` in `src/sim/rules.ts`) are stamped into every
  draft-list export. The thresholds, evidence weights and priority weights still live in code and in the scenario data; moving
  them into one versioned configuration is a small, safe step.
- **Real-data validation on an Indian flood.** `npm run validate:real` needs a flood-extent map and the department's confirmed
  affected list for the same event. The replay run (`docs/REPLAY-METHOD.md`) used the one public activation found, which is not
  in India. It is the biggest credibility gain still open, and it needs data from a department (`docs/PILOT-PLAN.md`, Phase 0).

## Evidence and trust

- **Photo reuse beyond exact copies.** The console flags the same live photo file sealed for two plots. A re-saved or
  re-compressed copy has a different fingerprint; catching it needs a perceptual hash computed on the phone and carried in the
  packet, which is a format change.
- **C2PA or another provenance standard**, in the long run, for the photo itself.

## Pilot and product

- A first pilot that needs no department data: `docs/PILOT-PLAN.md`, Phase 0 (a helper captures, an officer opens the sealed codes).
- A "start the clock by hand" action for a helper who hears a flood warning, labelled HAND (the trust rule is built and tested).
- Real Hindi and Punjabi voice (`docs/recording-script.md`), and a native-speaker review of every string.
- Real-device testing on an iPhone in Safari and a low-end Android phone.
- Haryana conversations (none yet), and letters of interest (none yet): `docs/INTERVIEWS.md`.
