# SABOOT BUILD SPEC (complete, self-contained)

> **Reading order.** Sections 0 to 13 are the original build spec, written around the 72-hour crop-insurance window. Sections 14 and 15 (at the end) record the viability upgrade: two rails on one core, the relief workflow, helper mode, and the detection and evidence parameters. Where they differ, 14 and 15 win. The 72-hour framing below is now the second rail.

Save this file as `docs/SABOOT-SPEC.md` in the Saboot repo. It replaces the earlier pasted prompt, which was cut off. It does NOT depend on any external style file: the design system below is the source of truth.

## 0. Decisions log (resolved open questions)

1. **Style guide:** there is no `docs/style-reference.md`. Build from Section 3 (Design System) and Section 4 (Adaptations) only.
2. **"Hybrid" means online/offline hybrid:** the intelligence layer is server-side (simulated), and the farmer side must keep working with weak or no connectivity. Make that visible (Feature I). Also show the human-in-the-loop step (Feature J). A phone-to-laptop evidence transfer (Feature K) is a STRETCH goal after M4, with a go/no-go rule. Field-agent expansion is out of scope beyond the existing assisted mode.
3. **Verification markers:** real-world claims carry `{{VERIFY: ...}}`. Synthetic scenario numbers do not, but are labelled "simulated" everywhere. See Section 11.
4. **Deployment:** the user runs it. Provide `npm run deploy` (Section 11). Do not deploy yourself.

---

## 1. Role

You are a lead UI/UX designer and senior front-end engineer. Build "Saboot" as a polished, front-end-only SIMULATION website for a hackathon judging round. It must feel like the real product working end to end, but all external systems (satellite, weather, messaging, insurer portals) are simulated with deterministic seeded data. Goal: qualify and win. Clarity, polish, and a flawless live demo matter more than production completeness. Never trade features for speed: optimize by engineering, not by removing anything. Use the frontend-design skill if available.

## 2. Product context

Saboot is an evidence engine for crop-loss insurance claims. For localized calamities such as flood and hail, claims have a 72-hour reporting window that farmers often miss because they do not know the clock started. Saboot:

1. watches weather and satellite signals over registered plots,
2. detects a likely qualifying event,
3. starts the 72-hour countdown at the EVENT time,
4. alerts the farmer by voice in their language,
5. guides capture of geo-tagged, time-stamped photos that work offline,
6. packages tamper-evident evidence in a hash chain,
7. hands off to the official filing channel with pre-filled details and tracks status,
8. gives insurers and district officers a ranked, evidence-backed dashboard.

Principles to show everywhere:
- Saboot assembles evidence and NEVER decides claims. A human at the insurer or district decides, outside Saboot.
- Deterministic rules own deadlines and eligibility. AI is used only for perception and language.
- Uncertainty is always shown.
- Never state invented statistics.

## 3. Design system (editorial technical journal on warm parchment)

> Superseded by `docs/DESIGN.md`: the visual system was rebuilt (soil-and-field palette, Anek and Noto Sans, a dark theme,
> the lac seal as the one bold element). This section is kept as the record of the first design; the adaptations in
> section 4 (Indic line heights, the 16 px floor, 48 px targets, reduced motion) still hold.

Mood: calm, trustworthy, spacious. No stock photos, no emoji, no icon library (hand-drawn inline SVG icons, 20px, 1.5px stroke).

**Colors (CSS custom properties)**
- `--parchment #f6f3f1`: page canvas, never pure white
- `--lake-blue #2b59d1`: the ONE primary action per screen
- `--periwinkle-mist #cfdaf5`: a single elevated hero card per screen
- `--off-black #242424`: text, secondary buttons
- `--ink #000000`: announcement bar
- `--graphite #4e4d4d`: secondary text
- `--smoke #797776`: large or decorative only (see Adaptations)
- `--ash #cecac8`: decorative hairlines only
- Decorative-only washes: coral `#ff9473`, sky `#a0b5eb`, mint `#a7fccd`, gold `#ecda98`

**Shapes:** buttons and tags are pills (100px / 9999px radius). Cards have 40px radius on desktop. 1px solid borders. No drop shadows, except one soft overlay shadow (`0 0 10px rgba(0,0,0,.1)`) for the detail drawer / bottom sheet.

**Spacing:** 8px base; scale 8/16/24/32/40/64/80. Page max-width 1432px. Section gap 64px (48px on mobile). Card padding 40px desktop.

**Type roles:** serif for headings, weight 400 always, letter-spacing -0.02em. Mono for body, nav, buttons, badges, tags (Latin script only, see Adaptations), with tight negative tracking and uppercase for Latin nav/buttons/tags. Fluid sizes with `clamp()`: display 40-80px, heading-lg 32-48px, heading 28-40px, heading-sm 24-32px, subheading 20-24px, body 16-20px.

**Components**
- Announcement bar: ink, 40px, parchment text, small outlined pill on the right.
- Primary pill (blue): lake-blue fill, white 14px uppercase mono text, 16px 32px padding, ~48px tall (56px in farmer app), trailing arrow glyph.
- Secondary pill (black): off-black fill, white text, no arrow.
- Ghost pill: transparent, 1px off-black border, off-black text.
- Text link with arrow: off-black text, trailing arrow, no background or border.
- Feature card: transparent or parchment, 1px border, 40px radius, 40px padding, 20px icon top-left, serif 24px title, mono 16px graphite body.
- Elevated card: periwinkle-mist fill, 40px radius, may contain a gradient illustration (coral to sky to mint).
- FAQ accordion row: full width, 40px vertical padding, bottom hairline only, serif 24px question, trailing chevron, no hover fill change.
- Pipeline node tag: parchment fill, 1px border, pill, 12px icon + 14px uppercase mono, 12px 20px padding, joined by thin curved lines.
- Nav bar: parchment, logo left (wordmark + circular dot mark), links, action buttons right.
- Hero: pure typographic, centered, serif display headline, mono subtext, two pill buttons.

**Atmospheric washes:** layered `radial-gradient`s (no `filter: blur`, no images) behind the hero and one feature area, coral-to-sky and sky-to-mint at about 60-80% opacity.

**Architecture diagram style:** pill nodes joined by thin curved lines, with a soft mint radial glow behind the central hub.

## 4. Adaptations (these apply on top of Section 3)

1. **Fonts (licensing and scripts).** Use open-licence fonts only, self-hosted WOFF2, subset at build time with `pyftsubset` to the glyphs the app actually uses:
   - Headings, Latin: Instrument Serif 400.
   - Body/UI, Latin: JetBrains Mono (variable 400-500), or IBM Plex Mono if smaller after subsetting.
   - Hindi: Noto Serif Devanagari 400 for headings; Noto Sans Devanagari 400/500 for body and UI.
   - Punjabi (Gurmukhi): Noto Serif Gurmukhi 400 for headings; Noto Sans Gurmukhi 400/500 for body and UI.

   No monospace font exists for these scripts and mono body text is hard to read in them, so mono applies to Latin text only. Load Indic fonts lazily on language switch. Preload only the Latin heading font and mono 400. Every webfont gets a metric-matched fallback (`size-adjust`, `ascent-override`) so language and font swaps cause zero layout shift.
2. **Indic typography rules.** For `:lang(hi)` and `:lang(pa)`: letter-spacing 0, no text-transform, line-height 1.6 for body and 1.4 for headings (matras and ascenders clip at 1.2). Expect strings 20-40% longer than English: no fixed-width containers around text, allow wrapping, never truncate with ellipsis except dense dashboard table cells where the full text is available on tap. Use Latin digits 0-9 in all languages, in the mono face with `tabular-nums`, for the countdown and timestamps.
3. **Farmer-app sizes.** Body 18px minimum, labels 16px minimum, primary buttons 56px tall with 18px labels, all touch targets at least 48x48px with at least 8px between them. 12px caption text is allowed only in the dashboard and only for non-critical metadata.
4. **Status colors (deliberate extension).** supported `#1f6b4a` on tint `#e4eee8`; partial `#8a5a00` on tint `#f3e8cf`; insufficient/expired `#b3402a` on tint `#f3dfd9`. Status is NEVER color alone: each also has a distinct icon shape (check, half-circle, ring-with-bar) and a text label, and map polygons also use distinct hatch patterns. Countdown: ink when more than 24h left; amber when under 24h; amber with a "last hours" label under 6h; red only when expired. Do not use these colors decoratively.
5. **Contrast rules.** Smoke is about 4:1 on parchment: use it only for text 18px or larger, or decorative marks; use graphite for all small secondary text. Ash is only for decorative hairlines; any control boundary (inputs, toggles, unselected chips) needs a 3:1 border, such as smoke or off-black. Lake blue with white text passes AA. Run an automated contrast check over every text/background pair and fail the build under 4.5:1 (3:1 for large text and UI boundaries).
6. **Uppercase.** Only on Latin-script nav, buttons, tags. Never on Hindi or Punjabi, and never on full sentences.
7. **Primary action rule.** Exactly one lake-blue filled button per screen/state (for example "Capture evidence" on the alert screen, "Run the simulation" on the landing page). Everything else is off-black or ghost.
8. **Mobile scaling.** Under 480px: card radius 24px (never below 16px), card padding 20-24px, section gap 48px. Pills stay 100px.
9. **No blur filters, no backdrop-filter, no large images.** Performance on mid-range Android is a hard requirement.
10. **Reduced motion.** Respect `prefers-reduced-motion`: no tick animation, no map spread animation (show the end state), no auto-advancing tour.

## 5. Page structure

1. **Announcement bar** (ink, 40px): "SIMULATION: synthetic data, fictional district" plus a small pill "Skip to demo". Not sticky on mobile.
2. **Nav** (56px mobile / 80px desktop, sticky, parchment): wordmark "saboot"; links Problem, Simulation, How it works, Honest limits; right side: language switch (EN / हि / ਪੰ) as a ghost pill, and the blue pill "Run the simulation". Mobile: a menu button opens a full-height sheet with a focus trap; the language switch stays visible in the bar.
3. **Hero:** serif display headline "The clock starts at the storm." Two short mono lines on what Saboot does. A large live-ticking "72:00:00" as the visual on a soft gradient wash. Two pills: blue "Run the simulation", ghost "How it works".
4. **Problem:** three feature cards: the 72-hour window, the farmer unaware, the missing proof. Each has an icon, serif 24px title, mono body. Content stating a rule carries `{{VERIFY}}`.
5. **Simulation** (core of the site):
   - Desktop (1024px and up): a control bar on top; below it a two-column grid. Left: the farmer app in a phone frame (360x740 inner, 1px border, 40px radius). Right: the Insurer/District dashboard. The Ledger opens as a tab in the right panel.
   - Tablet (600-1023px): single column with a tab bar [Farmer | Insurer | Ledger | Explainer]; the farmer app is centered, max 420px, in the frame.
   - Mobile (under 600px): same tabs, farmer app full-bleed with no frame.
   - Control bar: play/pause, speed 1x/10x/100x, scrubber T+0 to T+7 days, reset, jump chips (Trigger, Alert, Capture, Deadline, Confirmation). Sticky at the top of the simulation section on desktop; a bottom dock on mobile with `env(safe-area-inset-bottom)` padding, with matching bottom padding on the content so nothing is hidden.
6. **How it works:** the architecture diagram (sources, event detector, plausibility score, 72-hour clock, farmer alert, guided capture, evidence packet, insurer console / district triage / filing handoff / audit ledger), the 5-step workflow, and a "Real vs simulated" table. On mobile the diagram re-flows to a vertical layout (a separate SVG layout, not a scaled-down desktop one). No essential content depends on horizontal scrolling.
7. **Honest limits** (FAQ accordion): Does it decide claims? (No.) How does it handle hail? (Low-confidence prompt only.) Are offline timestamps tamper-proof? (No; gaps are flagged.) Who controls it? (A neutral evidence layer: the farmer holds a copy, access is consent-based.) What is real vs simulated? Who pays?
8. **Footer:** team name, project name, track (AgriTech & Rural Transformation, Agri-FinTech), "Code Yudh Hackathon, Chandigarh University".

## 6. Simulation model

- One fictional district, clearly labelled. About 50 synthetic plots as hand-drawn SVG polygons on an inline SVG map (rivers, low-lying zones, a legend).
- Seeded PRNG, so every run is identical.
- Scenario "Flood replay": hourly rainfall series, flood extent growing over time, per-plot onset times. Data file at most 40 KB, generated by a build-time script.
- Scripted farmer behaviors: most capture in time; one has no signal (offline queue, then sync); one misses the window; one replies "no damage" (false-alarm handling); one uses assisted mode (a helper captures, consent recorded).
- A persistent "SIMULATION" indicator on every screen. All impact numbers are computed from the simulation and labelled simulated.
- Hybrid architecture shown honestly: the intelligence layer is labelled "server (simulated)"; the farmer device layer is real in the browser.

## 7. Required features (all must work)

**A. Simulation control bar** as above, with keyboard shortcuts.

**B. Farmer app**
1. Plot registered screen (pin on map, crop, policy number stub).
2. Alert screen: a periwinkle hero card holding the countdown from the event time, a plain-language message, a voice play button, always-visible captions.
3. Guided capture with a fixed shot list (wide field, close-up of damage, landmark), using real camera input and real Geolocation, with graceful simulated fallback if permission is denied, and no gallery uploads in the flow.
4. Offline queue in IndexedDB with an "Airplane mode" simulation toggle, visible queued state, auto-sync, and server receipt time vs device time with a flagged gap if large.
5. Evidence packet: photos, location, times, and real SHA-256 hashes via WebCrypto chained into an append-only log.
6. Filing handoff: pre-filled summary, step-by-step guide to the official channel, and a field to record the returned reference number.
7. Status tracker with reminders and escalation if timelines slip.
8. Assisted mode for a helper, with consent recorded.
9. Controls: language toggle (English, Hindi, Punjabi), larger-text button (+25% and +50%), voice mode on/off, low-data mode that drops non-essential visuals.

**C. Insurer/District dashboard**
1. Map of plots colored AND hatched by evidence tier, with filter and legend.
2. Ranked list sortable by priority, time left, evidence tier.
3. Plot detail drawer (right-side drawer on desktop, full-height bottom sheet on mobile, focus-trapped, Esc closes): event timeline, rainfall chart against the threshold, flood overlay, photos, hash verification status, and the plausibility breakdown showing each factor, its weight, and an uncertainty range, with the copy "evidence tier, not a claim decision".
4. District triage view: inspection priority queue.
5. Audit ledger view: append-only log with a "Verify integrity" button and a "Tamper test" button that alters one record and shows the hash chain failing.

**D. Detection explainer** that updates as the scrubber moves: rainfall accumulation vs threshold, terrain check, flood extent, alerts sent, time-to-alert. Hail is shown as a low-confidence prompt path, honestly labelled.

**E. Judge tour:** a 6-step overlay (problem, detection, alert, capture, evidence, dashboard) completing in under 2 minutes, with Skip and Restart, plus a presenter mode with keyboard shortcuts to jump between states.

**F. Impact panel** computed from the simulation (time-to-alert, share of cohort filed within the window, detection precision/recall on the replay), labelled simulated.

**G. Accessibility:** semantic landmarks, ARIA labels, visible focus rings (2px off-black with a 2px parchment offset), full keyboard navigation, `aria-live` for alerts and sync status, skip link, voice-only path for low vision, 200% text zoom without loss of content or function, reflow at 320 CSS px with no two-dimensional scrolling (except the SVG map, which has pan/zoom buttons).

**H. Audio:** short Opus clips (at most 20 KB, 16 kbps, lazy-loaded) per language if available; fall back to `speechSynthesis`; captions always visible. Document in the README which languages have real audio. Hindi and Punjabi copy is machine-drafted: mark every translated string in a locale file with a "needs native review" flag and list them in the README. Never claim the translations are verified.

**I. Connection-state strip and sync log (makes the online/offline hybrid visible).**
- A slim strip in the farmer app showing the state: Online / Weak (2G) / Offline, driven by the Airplane-mode and Weak-network simulation toggles, with an icon and text label (not color alone).
- A queue counter ("3 items waiting") and a sync log listing each item with device time, server receipt time, and the gap, each marked "synced", "queued", or "gap flagged".
- Status changes announced through `aria-live`.
- The service worker keeps the farmer flow working with the network fully off after first load.

**J. Human-in-the-loop step.** On the dashboard, the claim pipeline shows: Evidence assembled (Saboot) → Filed by farmer → Insurer review → Officer decision. The last stage is rendered distinctly as "Decision happens outside Saboot", reinforcing that Saboot never decides.

**K. STRETCH: phone-to-laptop evidence transfer (build only after M4, see go/no-go).**
- Purpose: a judge can capture and seal evidence on their own phone and see it appear on the projected dashboard, with no server.
- On the phone, sealing produces a compact payload: version, synthetic plot id, event time, capture times, device time, coarse location (rounded to roughly 100 m), the SHA-256 hash of each photo, the hash-chain head, a per-device ECDSA P-256 public key (compact), and a signature over the payload. Target under about 1.5 KB. Photos never leave the phone.
- The payload is shown as a QR code (error correction M) and also as a copyable code and a link with the payload in the URL fragment (`#...`), which is never sent to any server. An optional demo receiver on the laptop may carry the same code over the venue Wi-Fi; it stamps the laptop's clock and verifies nothing.
- On the laptop, "Import evidence" offers three paths: scan with the webcam (use `BarcodeDetector` if present, otherwise a lazy-loaded decoder), paste the code, or open the link.
- Verification: recompute the chain and verify the signature. Show "Integrity verified: not altered since sealing. This does not prove who sealed it." Photos are shown as placeholders with a note that the real product would upload them. The Tamper test works on imported records too.
- The imported plot appears on the dashboard map and list, tagged "Imported (live)".
- Size: the scanner/decoder and QR encoder are one lazy chunk, at most 60 KB gzipped, loaded only on demand, and the whole flow works offline.
- **Go/no-go:** if any QA gate or budget fails after adding K, ship only the paste-code and link path, or cut K entirely. K must never break features A-J.

## 8. Layout engineering rules (zero overlap, zero misalignment)

- Mobile-first CSS. Breakpoints: 360 (base), 480, 600, 768, 1024, 1280, 1432 max.
- CSS Grid and Flexbox only for layout. Absolute positioning only for decorative washes and badges anchored inside a `position: relative` parent with reserved space. Every flex/grid child containing text gets `min-width: 0`. Use `gap`, not margins, between siblings. Use `dvh`, not `vh`. Respect `env(safe-area-inset-*)`.
- A z-index scale in tokens: base 0, sticky 10, drawer 20, modal 30, toast 40. Sticky heights are CSS variables; use `scroll-margin-top` / `scroll-padding-top` and matching padding so sticky layers never cover anchor targets or content. At 360x640, sticky chrome must leave at least 70% of the viewport for content.
- Reserve space for async content (map, charts, fonts, images) with `aspect-ratio` or explicit `min-height` to prevent layout shift.
- Alignment: everything on an 8px grid; icons and text in a row aligned on the text's optical center; numbers in `tabular-nums`; cards in a row share equal heights; baseline-align label/value pairs.
- No horizontal page scroll at any width. Tables become stacked cards under 600px.
- Long words and strings wrap (`overflow-wrap: anywhere` inside tight containers) and never widen containers.
- Hover is never the only way to reveal anything. Touch and keyboard parity everywhere.
- SVG diagrams and the map use `viewBox` with responsive sizing; text inside SVG never falls below 12px rendered size; the mobile diagram has its own vertical layout.

## 9. Performance budgets (mid-range Android, 2 Mbps average 4 Mbps, about 300 ms RTT)

- Initial load (HTML + CSS + JS + first fonts) at most 200 KB gzipped; interactive within 3 s on throttled 2 Mbps / 300 ms. Entire site at most 700 KB gzipped excluding optional audio. Each lazy route at most 60 KB gz.
- Lighthouse mobile: Performance at least 90, Accessibility at least 95, Best Practices at least 95. LCP under 2.5 s, CLS under 0.05, INP under 200 ms.
- Zero runtime third-party requests: no CDN, no Google Fonts, no map tiles, no analytics.
- Stack: Vite + Preact + TypeScript, hand-written SVG for map and charts, no UI kit, no chart or map library. Inline critical CSS. Code-split by route and by tab. Service worker with a cache-first app shell.

## 10. Automated QA gates (the build fails if any fails)

Write a Playwright suite plus axe-core, run by `verify.sh`:

1. Viewports 360x640, 390x844, 412x915, 768x1024, 1024x768, 1280x800, 1440x900; languages en, hi, pa; states: landing, alert, capture, offline queue (with connection strip and sync log), evidence packet, filing, dashboard, drawer open, ledger with tamper failure, human-in-the-loop pipeline, judge tour (and, if built, the import flow).
2. For each: no horizontal overflow (`document` scrollWidth at most clientWidth); no clipped text (scrollWidth greater than clientWidth on `overflow: hidden` text elements); no overlap between sibling interactive elements or between sticky layers and content (bounding-box intersection checks); touch targets at least 48px in the farmer app and at least 44px elsewhere; labels on all images/SVG; no console errors.
3. Pseudo-localization stress test: expand all strings by 40% and re-run the overflow and overlap checks.
4. 200% browser text zoom and reduced-motion runs.
5. axe-core: zero serious or critical violations. Contrast check across all token pairs.
6. Gzipped size budgets and Lighthouse mobile thresholds, with throttling.
7. Screenshot every state at each viewport into `/qa` and generate a contact-sheet HTML for visual review.

## 11. Verification markers and deploy

**Rule:** any real-world claim shown in the UI or copy must carry a marker in the source: `{{VERIFY: what to check, where}}`.

**Marked (needs verification):**
- the 72-hour reporting window and which perils it applies to
- scheme rules, covered perils, and any penalty or timeline rules for insurers
- IMD's heavy-rainfall threshold figure (64.5 mm) and any other official threshold
- any satellite or weather-radar revisit or update timing presented as real. Note: satellite radar revisit is on the order of days and weather radar updates in minutes. Do NOT present a "12-hour radar revisit" as a real-world fact. If 12 hours is a scenario timing, it is a simulated assumption: label it "simulated" and do not mark it
- the name of the real official filing channel, app, or helpline number
- the capabilities of any named third party or existing product
- any statistic or percentage about real-world claims, farmers, or losses

**Not marked:** synthetic scenario values (rainfall series, plot counts, onset times, cohort behaviors, impact numbers computed from the simulation), because they are already labelled "simulated" on every screen. A script checks that every screen showing such numbers has the simulated label.

**Tooling:**
- `npm run markers` lists every remaining `{{VERIFY ...}}` with file and line.
- The README lists each marker with the source the user should check, so they can resolve them quickly.

## 12. Workspace and process

1. Start in plan mode. Produce a short plan, the file structure, and a component inventory before writing code.
3. Milestones, committing and running verify after each:
   - **M1** vertical slice: tokens, fonts, farmer alert, capture, evidence packet with hashing
   - **M2** simulation engine, control bar, SVG map, dashboard
   - **M3** offline queue, connection strip and sync log (Feature I), assisted mode, languages and Indic typography, voice, accessibility toggles
   - **M4** audit ledger with tamper test, human-in-the-loop step (Feature J), explainer, architecture page, impact panel, FAQ
   - **M5** judge tour, presenter mode, polish, README, deploy script
   - **M6 (stretch)** Feature K, subject to its go/no-go rule
4. Do not ask questions unless blocked; make reasonable assumptions and list them in the README. No backend and no real integrations.

## 13. Definition of done

- Features A-J work at 360px and on desktop, offline after first load, in all three languages. Feature K works or is explicitly cut per its go/no-go rule.
- All QA gates and budgets pass; the contact sheet is generated.
- Remaining `{{VERIFY}}` markers are listed for the user to resolve (the deploy script blocks until they are gone).
- README includes run/build/deploy steps, a 2-minute demo script, the real-vs-simulated table, assumptions, the translation-review list, and known limitations.

---

## 14. Two rails, one core (the viability upgrade)

The original build told one story: a farmer's 72-hour window for a localized calamity under a crop-insurance scheme. That
story is real, but it applies only in states that run the scheme and only for insured farmers, and it hides the broader
use: after a flood, a state or district revenue office assesses crop loss field by field and prepares lists. The product is
therefore repositioned as a **disaster crop-loss evidence layer** with **two rails on one core**.

| | Relief (primary) | Crop insurance (second) |
|---|---|---|
| Supports | A state or district revenue assessment of flood losses (a girdawari-style process). | The farmer's intimation of a localized calamity under a crop-insurance scheme. |
| Who decides | The department's officer. | The insurer, then an officer. |
| The window | **Advice:** "capture soon", because photos of standing water fade as the water recedes. Never a legal deadline, never shown red, labelled as advice in all three languages. | **A rule:** 72 hours from the event, a hard deadline, red once passed. |
| State named in the app | None. | A fictional district in Haryana, with a marker to confirm Haryana runs the scheme. |
| Amounts | None anywhere in the product. | None anywhere in the product. |

The rail is a per-viewer choice (default relief, kept in the browser, also `?rail=`). It changes **words, windows and the
actors**: base i18n keys carry the relief wording, `key.pmfby` variants carry the insurance wording, and the model is
rebuilt from the scenario, the rail and the radar cadence. It does **not** change detection, the event clock, capture,
sealing, the audit trail, the evidence tiers or the priority formula. The two rails produce identical detections and event
times (a test pins this); only the window length and wording differ.

Scenario parameters live in `src/config.ts` (`RELIEF`, `PMFBY`), each labelled as a scenario setting and not an official
figure, each with a `{{VERIFY}}` marker where it points at the real world: the damage-share threshold (0.33, from state
orders and SDRF norms), and whether Haryana runs the scheme. The per-acre amount and the acreage cap are deliberately unset.

### The relief workflow (all simulated and labelled so)

1. **Assessment worklist.** The existing priority formula (35% evidence ambiguity, 30% urgency, 15% area, 20% integrity flags,
   unchanged) with the reason for each rank written on each row, and villages ranked by review load.
2. **Draft assessment list, not a decision.** Village by village, marked "draft, for officer review". Exports as JSON and CSV
   with provenance: rule versions, parameters, scenario fingerprint, rail, time. No farmer name, no coordinates, no amount.
3. **Objection-ready evidence.** After the officer publishes the draft list (a simulated time, outside Saboot), a farmer may
   attach their sealed packet to their entry during a simulated window. The objection is a sealed event in the farmer's own
   log and changes no tier. Saboot shows that an officer's response came, never what it said, and never resolves anything.
4. **Pilot metrics.** Median event to call (the headline, with the demo farmer named as one plot and not the typical case),
   flooded plots with evidence on file, event to evidence, objection rate, each with its definition. The slower, more
   realistic radar cadence is shown beside the demo one with the flooded plots it never alerts. "Visits avoided" is omitted:
   there is no honest baseline for it. Precision and recall appear only as a *simulated consistency check, not validation*.
5. **Validation status.** "Not run" until a real report exists (`docs/VALIDATION.md`).
6. **Decision happens outside Saboot,** said on the pipeline and the list.

### Helper mode is the main path

A sarpanch, CSC operator, cooperative or extension worker is a first-class entry on the farmer home screen. One helper
session serves several farmers: the helper is named once, each farmer gives their own consent (sealed in that farmer's own
log), each farmer has their own photos and sealed packet, and the helper is named on every photo. A feature-phone path (a
missed call, a keypad answer, a helper) is shown as a labelled **design simulation**: no real telephony, SMS or WhatsApp.

### Open format, privacy, pilot

The signed evidence packet is documented (`docs/EVIDENCE-FORMAT.md`), has test vectors, and can be verified by a standalone
script that shares no code with the app. The privacy and consent design is `docs/PRIVACY-AND-CONSENT.md`: designed with
India's DPDP Act in mind, not legally reviewed. The pilot kit (`docs/PILOT-PLAN.md`, `BUYER-ONE-PAGER.md`,
`EXISTING-SOLUTIONS.md`, `STAKEHOLDER-INTERVIEW-GUIDE.md`, `LETTER-OF-SUPPORT-TEMPLATE.md`) states proposals, not facts.

## 15. Detection rules and evidence parameters (uncalibrated)

All values below are **scenario parameters, not fitted to any claims data and not official figures** unless a person has
checked them. The pure rule code is `src/sim/rules.ts`; the app and the real-data harness call the same functions.

| Rule | Fires when | Event clock starts at | Version |
|---|---|---|---|
| A: rain on low-lying land | The 24-hour rain at the nearest gauge reaches the heavy-rain line on a low-lying plot. | The first time that gauge crossed the lower heavy-rain line, if before detection. | 1 |
| B: radar change | Radar-observed water **above the water this crop shows anyway** reaches the flood share, at a pass that began clear. Paddy in the standing-water season is expected wet, so only water above that counts. | The last clear radar pass. | 2 |
| C: river or dam | A gauge upstream of or beside a riverside or low-lying plot reaches its danger level, with the flood wave able to reach the plot within the allowed lag. | The gauge's crossing time. | 1 |

Detection is the earliest rule to fire. The event clock starts at the **earliest** qualifying signal before detection, so
when unsure the farmer gets less time, never more. Confidence is high when two independent rules fired, low when only the
radar fired on a crop that normally shows water, medium otherwise. Hail is a low-confidence path: a prompt, never an
auto-"supported" tier, and a plot that never replies is **unconfirmed**, not missed.

**Evidence tiers** are a weighted plausibility score with a band, never a decision: rain 0.20, terrain 0.15, radar 0.30,
photos 0.25, integrity 0.10. A plot the river can reach adds a river factor at 0.10 and the others scale to 0.90, so a plot
out of reach scores exactly as before. Paddy keeps 0.4 of its radar weight, renormalised, with wider uncertainty and a note
that this is an **unvalidated design decision**. Supported needs the whole band at or above 0.60, insufficient is a band all
below 0.45, and hail is capped at partial.

**Priority** is unchanged since the first build and a test pins it to the original formula. It ranks review work.

**What the numbers can and cannot say.** Rule C's river series is generated from the same simulated flood the rules are then
tested on, so its agreement is partly by construction. The precision and recall on the replay are a simulated consistency
check. Detection claims need the real-data harness. The event-to-call figures: the median is
<!--f:combos.relief-demo.eventToCall.medianH|h-->2 h 45 min<!--/f--> on the demo radar cadence and
<!--f:combos.relief-slow.eventToCall.medianH|h-->2 h 45 min<!--/f--> on the slower one, which leaves
<!--f:combos.relief-slow.consistencyCheck.fn|int-->4<!--/f--> flooded plots never alerted. A lower 90th percentile at the slower
cadence is therefore **not an improvement**: those plots dropped out of the count.
