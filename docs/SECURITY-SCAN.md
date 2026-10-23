# Security scan

Scope: the whole repository, which has no backend yet. A scan or a review finding is not a claim that the product is secure.
It is a list of what was looked at and what was decided. Rerun after the final loop, and again with backend rules if a
backend is ever added.

## How the scan was run
- **Tool:** Semgrep 1.182.1, installed in an isolated virtual environment outside the repository (see `docs/SETUP.md`).
  Not in `package.json`, not installed user-wide.
- **Flags:** `--metrics=off --disable-version-check`. No `semgrep login`, no Pro engine, no cloud upload. Rules come from the
  public registry, and the code stays on the machine.
- **Rulesets:** `p/typescript` (74 rules), `p/javascript` (74), `p/secrets` (52), `p/owasp-top-ten` (560),
  `p/security-audit` (225), and, because the first packs contain no DOM-sink rules, `p/xss`, `p/nodejs` and `p/react`.
- **Targets:** `src/`, `scripts/`, `public/`, `tests/`, `index.html`, `vite.config.ts`, `playwright.config.ts`,
  `netlify.toml`, `package.json` (123 files for the JavaScript and TypeScript packs, 144 for the multi-language packs), plus
  the generated service worker `dist/sw.js` in a separate run. `.semgrepignore` lists every exclusion with its reason.
- **Positive control.** A one-line file with `eval(x)` and `el.innerHTML = x` returned nothing from `p/javascript`, so the
  packs themselves do not include those rules. The same file was flagged by `r/javascript.browser.security.eval-detected`
  and `r/javascript.browser.security.insecure-innerhtml` run by name, and by a local rule. That shows the engine and the
  registry connection work. Those two rules, plus `insecure-document-method`, were then run over the repository by name and
  found nothing. A plain search for `innerHTML`, `dangerouslySetInnerHTML`, `insertAdjacentHTML`, `document.write`, `eval(`
  and `new Function` agrees (see S-03).
- **Not run:** `/security-review` on the branch, because the branch has no security-relevant change yet. It runs in the
  final loop.

## Semgrep results

| ID | Rule | File:line | Severity | Decision |
|---|---|---|---|---|
| S-01 | `python.lang.security.audit.dynamic-urllib-use-detected` (`p/security-audit`) | `scripts/build-fonts.py:60` | Warning | **False positive.** `urlretrieve(BASE + SOURCES[key], path)`: `BASE` is a constant `https://` URL and `SOURCES` is a constant dictionary. The only callers pass keys from that dictionary. It is a developer script (`npm run fonts`) with no untrusted input. No `nosemgrep` comment added. |
| S-02 | Coverage gap: partial parse of two scripts (not a finding) | `scripts/docs-facts.mjs:65-75`, `scripts/markers.mjs:42` | Info | **Reviewed by hand.** Semgrep's parser stops at regular expressions that contain HTML-comment text. Both scripts read repository files and write repository docs. No network, no untrusted input. |
| S-03 | Not flagged by any pack, found by search | `scripts/snap.mjs:115` | Info | **Accept.** `new Function` in a developer-only QA helper, fed from the command line. Not shipped. |
| S-04 | `p/secrets`, `p/owasp-top-ten`, `p/typescript`, `p/javascript`, `p/xss`, `p/nodejs`, `p/react` | all targets | none | No findings. |
| S-05 | `dist/sw.js` (generated) with `p/javascript` and `p/security-audit` | `dist/sw.js` | none | No findings, no parse errors. |

## By-hand review (required regardless of Semgrep)
Findings from a read-only review of the areas the plan names. IDs L2-nn match `docs/AUDIT-REPORT.md`. "Phase 4" means a
small commit with a test during implementation. **Decision** is fix, accept or defer, with a reason.

| ID | Sev | Where | Finding | Decision |
|---|---|---|---|---|
| L2-01 | Major | `src/farmer/screens/Assist.tsx:30,90-111`, `src/k/scan.ts:33-35` | The voice-consent recorder and the QR-scan stream stop only through their own buttons. Leaving the screen mid-recording leaves the microphone on. If `stop()` runs before the camera stream arrives, the webcam stays on. (`Capture.tsx` handles this correctly.) | **Fix in Phase 4.** Stop the recorder and tracks on unmount, and stop a late stream in the `!alive` branch. Spot-checked in the source. |
| L2-02 | Major | `src/farmer/ShareToLaptop.tsx:30`, `src/k/payload.ts:67-72`, `src/dashboard/Import.tsx:45`, `src/k/imported.ts:19` | The packet's `deviceMs` is read when the share sheet opens, not at sealing, and it sits inside the chained seal record. The same sealed packet shared 60 s apart produced a different head and code. The laptop labels it "Phone clock at sealing", and import de-duplicates by head, so it imports twice. | **Fix in Phase 4.** Store the clock in the seal event, sign that, and key imports on a stable value. Also fixes A-14. |
| L2-03 | Minor | `scripts/snap.mjs:47,55,78` | The QA and demo file server does `decodeURIComponent` then `join('dist', p)` with no prefix check, and listens on all interfaces. A request such as `/..%2fpackage.json` resolves outside `dist`. Developer tooling, not shipped. | **Fix in Phase 4** (small): resolve and check the prefix, bind to 127.0.0.1. |
| L2-04 | Minor (suspected) | `src/lib/voice.ts:26-31,57-64`, `Assist.tsx:138` | `pickVoice` ignores `localService`. The consent sentence, with the farmer's and helper's names, goes to speech synthesis. Some desktop browsers send text to a remote voice. | **Fix in Phase 4** (small): local voices only for the consent sentence, otherwise show captions. Needs a real-browser check by hand. |
| L2-05 | Minor | `src/farmer/focus.ts:111,118,126-142`, `docs/PRIVACY-AND-CONSENT.md:19,84-87,128` | Export and Delete are device-wide. On a helper's phone one farmer's request exports or erases every farmer's log. The export holds names and exact six-decimal GPS, while the privacy table says exact GPS does not leave the device. The test never creates a key or an import, so the "key and imports" row is untested. | **Fix the document in Phase 4** so it matches behaviour. **Defer** per-farmer export and delete (medium effort, listed as future). |
| L2-06 | Minor | `.github/workflows/pages.yml`, `public/_headers` | The GitHub Pages backup ignores `_headers`: no CSP, frame protection, `nosniff` or Permissions-Policy. | **Accept, document.** Manual backup only. Netlify is the primary host. Add a README line in Phase 4. |
| L2-07 | Minor | `src/qa-hooks.ts:36-58` | `window.__sab` ships in the production bundle. `ensure('sealed')` then `kcode()` yields a valid signed code from watermarked synthetic photos. | **Accept with a mitigation.** The QA suite needs the hook. The provenance flag (A-02) makes such a code say SIMULATED. Document it. |
| L2-08 | Minor | `src/farmer/focus.ts:240-251` | A denied or slow GPS falls back to the plot centroid (`src: 'sim'`), and that value is signed as the location with no source flag. | **Fix in Phase 4** through the location-provenance bits (A-02). |
| L2-09 | Minor | `src/farmer/photo.ts:12-25` | If `createImageBitmap` or `toBlob` fails, the original file (with EXIF GPS) is stored and hashed. The canvas path strips EXIF. | **Fix in Phase 4** (small): reject instead of falling back. |
| L2-10 | Minor (suspected) | `src/lib/db.ts:26-37` | `tx()` has no `onabort`, so a quota-aborted transaction never settles and capture hangs. No `navigator.storage.persist()`, so evidence can be evicted on low storage. | **Fix in Phase 4** (part of A-06). |
| L2-11 | Minor | `src/dashboard/Import.tsx:72-77,87,110,123,125`, `payload.ts:154` | The verification result is not cleared when the textarea is edited, so "Integrity verified", Export and Add stay live while the code differs. `run` has no catch. | **Fix in Phase 4.** Directly affects the live tamper demo. |
| L2-12 | Minor | `src/k/payload.ts:31-35,126,147` | The in-app verifier accepts standard base64, shows an unknown kind byte as "wide", accepts latitude 2,000,000.5 and has no length cap. The standalone verifier is stricter. Agreement is proven only for the test vectors. | **Fix in Phase 4**, together with the provenance-flag change to both verifiers. |
| L2-13 | Minor | `src/ui/ControlBar.tsx:22-29`, `src/tour/Presenter.tsx:76` | The Reset button and the bare `R` key erase logs, photos and voice consent with no confirmation. | **Fix in Phase 4** (small): confirm when real captures exist. A live-demo hazard. |
| L2-14 | Minor (suspected) | `scripts/sw.mjs:36-41` | Audio is requested with `Range`. A 206 response passes `res.ok`, but `cache.put` rejects partial responses, so "cached on first play" fails and the voice alert is not available offline. | **Fix in Phase 4** (small): cache only status 200 and handle the rejection, or precache the four clips. |
| L2-15 | Minor | `scripts/validation/harness.ts:176,191-193,257-258` | `Math.min(...ts)` throws from about 125,000 rows. The event window and `interval_h` loops are unbounded. | **Defer.** The planned replay is far below that size. Fix if real files grow. |
| L2-16 | Info | `src/k/payload.ts`, `docs/EVIDENCE-FORMAT.md`, `docs/PRIVACY-AND-CONSENT.md` | Every packet carries the phone's persistent public key, so a helper's farmers can be linked. The (r, n-s) signature variant also verifies, giving a new code string with the same head. Sharing the link through a messaging app shows the code to that app. | **Document** in the privacy doc and the evidence format (Phase 4). |
| L2-17 | Info | `public/_headers:7,11` | `style-src 'unsafe-inline'` is needed only for three inline style blocks and one noscript style attribute, which could be hashed. The Permissions-Policy has no deny list for unused features. | **Defer** (hardening, medium effort). |
| L2-18 | Info | `src/dashboard/draftList.ts:180`, `scripts/vite-plugins.mjs:65-66`, `src/sim/moments.ts:31-34`, `scripts/deploy.sh:12`, `scripts/snap.mjs:9` | The CSV cell writer has no guard for cells starting with `=`, `+`, `-` or `@` (today no names reach cells). `?tab=constructor` throws a harmless TypeError in the build-injected preload. `?at=capture` writes synthetic shots on open. `npx --yes netlify-cli` is unpinned and `puppeteer-core` is imported but undeclared. | **Defer** the CSV guard and the pin. Hygiene items, recorded here. |

## Status after Phase 4
Every "fix in Phase 4" row is fixed on `overflow/final-prep`, each with a test: L2-01 (`tests/qa/devices.spec.ts`), L2-02,
L2-11 and L2-12 (`tests/qa/mvp.spec.ts`, `tests/unit/evidence-vectors.test.ts`), L2-03 (`tests/unit/serve.test.ts`; the server
keeps every interface on purpose, see `docs/DECISIONS.md` D-35), L2-04 (local voices only), L2-05 (the privacy document now
says what export and delete do), L2-08 (provenance bits), L2-09 (a photo that cannot be re-encoded is refused), L2-10
(`onabort`, storage banner), L2-13 (reset asks first), L2-14 (clips precached, range answers). L2-15 is fixed too (a loop
replaces the spread; a command-line number is checked). Accepted or deferred as before: S-01, S-03, L2-06, L2-07, L2-16,
L2-17, L2-18. The rerun and `/security-review` happen in the final loop.

## Reviewed, no issue
- **HTML sinks:** no `innerHTML`, `dangerouslySetInnerHTML`, `eval`, `document.write` or `srcdoc` in `src`, `index.html` or
  the built JavaScript. Photos load through `<img data:>`, where scripts do not run.
- **Links and redirects:** no `window.open`, `target=_blank`, `postMessage` or `location` assignment. Anchors are constants or
  blob downloads. `frame-ancestors 'none'` and `X-Frame-Options: DENY` cover clickjacking on Netlify.
- **Deep links:** `?at`, `?tab`, `?rail` and `?cadence` use allowlists (`src/site/layout.ts:84-91`). `#k=` goes only to a
  textarea and the verifier, and never imports on its own.
- **Prototype pollution:** no merge of untrusted keys. The validation harness uses Maps.
- **Network claim:** the built JavaScript has two same-origin GET `fetch` calls (the replay file and the status file) and no
  XHR, beacon, WebSocket or analytics string. The only absolute URLs are the w3.org namespace and the site's own address.
- **Keys and randomness:** the device key is created non-extractable, stored in IndexedDB and removed by "delete my data".
  Signatures use WebCrypto's generator. The only `Math.random` is a DOM id.
- **Service worker:** GET and same-origin only, caches only `ok && type === 'basic'`, the cache name is a content hash,
  old caches are deleted on activate, `sw.js` is not cached, and the scope is the site root.
- **Photos and exports:** normal capture re-encodes through a canvas, which drops EXIF. The draft list and CSV carry no names,
  coordinates or amounts. No code path exports photos.
- **Secrets:** a pattern scan of the 199 tracked files found none. `.netlify/state.json` holds a site id only and is ignored.

## Dependencies
`npm audit --omit=dev`: **found 0 vulnerabilities.** Runtime packages: `preact` 11.0.1, `@preact/signals` 2.11.3 (with
`@preact/signals-core` 1.14.4), `jsqr` 1.4.0 (not maintained for several years, loaded only as a lazy chunk) and `uqr` 0.1.3. Nothing
loads from a third party at run time.
