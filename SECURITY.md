# Security

Saboot is a **prototype**: a front-end-only simulation with synthetic data and a fictional district. It has no backend, no
accounts and no real personal data, and the only network call it makes beyond its own files is the optional demo receiver on the
owner's laptop (`scripts/receipt-server.mjs`, off by default). Please read this with that in mind.

## Report a problem

Use GitHub's private route: the **Security** tab of this repository → **Report a vulnerability**. If that is not available to
you, open an issue that says only "security report, please contact me" and no details, and the owner will reach out. Please do
not post exploit details in a public issue.

## What is most worth reporting

- A way to make the **verifier accept a packet that was changed** after sealing: `src/k/payload.ts` or the independent
  `scripts/verify-packet.mjs`. Both must give the same answer on every input; `tests/vectors/evidence-v1.json`,
  `tests/unit/evidence-vectors.test.ts` and the fuzz test `tests/unit/verifier-fuzz.test.ts` are the starting point.
- Input to the decoder, a scanned QR, a pasted code or a link that makes it **throw, hang or run out of memory**.
- A **third-party request** at run time, or a secret, fingerprint or evidence code that reaches a URL, a header or a server
  (`tests/qa/privacy.spec.ts` checks this on the main flow).
- A hole in the **content security policy** (`public/_headers`, hashes written by `scripts/postbuild.mjs`).

## What is known and documented, not a vulnerability

These limits are stated in `docs/EVIDENCE-FORMAT.md` ("What it proves, and what it does not") and `docs/PRIVACY-AND-CONSENT.md`:

- A seal proves a packet was **not altered after sealing**. It does not prove who sealed it (the key is a device key, tied to no
  person), that a photo is true, that the phone clock was right, or where the phone was.
- In format version 1 the **consent text and the helper's name are not part of the signed bytes**. They are recorded in a
  separate hash-chained log on the phone. Signing them is planned for a later version (`docs/ROADMAP.md`).
- The tamper test edits an in-memory ledger only.
- The privacy and consent design is **not legally reviewed**.

## Supported versions

Only the current `main` branch. There are no releases to patch.

## What has been checked

A Semgrep scan and a branch security review are recorded in `docs/SECURITY-SCAN.md` (one false positive, no finding).
