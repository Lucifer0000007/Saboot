# Privacy and consent

> **Designed with India's DPDP Act in mind. Not legally reviewed. Needs legal review before any real deployment.**
> This document describes how the simulation behaves and how a real deployment is intended to behave. It does not claim
> compliance with any law, and nothing in it is legal advice.

## Scope

Saboot today is a front-end-only simulation. Its farmers, plots, villages and officers are synthetic. A visitor who takes
photos or records consent in the simulation creates data on **their own device only**. The sections below say what that data
is, where it lives, and what a real pilot would have to settle with the buyer and with counsel.

## What data exists, and where it lives

| Data | Where it lives | Purpose | Leaves the device? |
|---|---|---|---|
| Photos the farmer or helper takes | The phone's IndexedDB. | Evidence of the field's condition. | **No.** The share code holds only fingerprints. A photo leaves only if the person sends the file themselves. |
| Photo fingerprints (SHA-256) | The phone's log; the shareable code. | Proof the photo was not changed after sealing. | Only if the person shares the code, the link or a bundle, or sends the code to the demo laptop (below). |
| Exact GPS position at capture | The phone's log, to six decimals, on the phone. | Recording where the photo was taken (a real fix is not compared with the fictional plot). | **Only inside the person's own export file** (*Export my data*), which they make and hold themselves. Not in the share code, the link or a bundle. |
| Rounded position | The shareable code and the bundle: **0.001 degrees, about 100 m.** | Showing roughly where, without the exact field. | Only if the person shares it. |
| Times (replay hour and the phone clock) | The phone's log; the shareable code. | The evidence clock. | Only if shared. |
| Consent record: the sentence agreed to, the helper's name and role, the method, the time | The farmer's **own** log on the phone, and in the packet body. For a voice consent, also a recording and its fingerprint, on the phone. | To show the farmer agreed before anyone took photos for them. | **No.** An evidence bundle names the helper and the consent in an unsigned context block, if the person exports one. |
| Helper session (name, role) | The phone. | So the helper says who they are once. | No. |
| Farmer name and plot number | In the simulation these are synthetic. The filing summary the farmer can copy holds them. | The farmer's own use when they file. | Only if the farmer pastes it somewhere. |
| Language, text size, voice, rail | The browser's local storage. | Convenience. | No. |
| Packets imported on the laptop | The browser's IndexedDB. | Showing the officer console. | No. |

There is **no analytics, no tracking, no cookie and no third-party request** at run time: fonts, maps and icons are bundled, and
a build gate checks it. A real pilot would add a server. Everything in the table that says "on the phone" would then need a
stated upload path, with its own consent, retention and access rules. None of that exists yet.

**Optional demo receiver.** When the owner runs `scripts/receipt-server.mjs` on the demo laptop and a phone opened the app from
that laptop's address with `?receiver=1`, the share sheet shows "Send to the laptop". A tap posts the signed code (fingerprints,
times, rounded position; no photo, no name) to that laptop over HTTPS. The laptop keeps the codes and its own receipt times in a
file under `.cache/`, and nothing else: no address, no browser string. Nothing is sent without the tap, the hosted site never
shows the button, and the laptop verifies nothing: the console checks each code in the browser, as it checks a scanned one.
It is a demo receiver, not a product backend.

## Consent

Nobody captures anything for a farmer without that farmer's consent, recorded **per farmer** in **that farmer's own log**. The
helper must be named first. The farmer agrees by pressing and holding a button for two seconds, or by speaking, and the
sentence they agreed to is stored with the method and the time. The record is part of the farmer's packet body and is in the
hash chain, so a change to it breaks the chain.

The consent sentence, shown and read aloud in the farmer's language (the language the scenario lists for that farmer, whatever
the helper's phone is set to; the helper gets the same words in the phone's language underneath, and the log records which
language the farmer was read). `{farmer}` and `{helper}` are replaced by the names:

| Language | Sentence |
|---|---|
| English | I, {farmer}, allow {helper} to take photos of my field and send them for my crop loss report. |
| हिन्दी | मैं, {farmer}, {helper} को अपने खेत की फ़ोटो लेने और उन्हें मेरी फ़सल नुकसान रिपोर्ट के लिए भेजने की अनुमति देता/देती हूँ। |
| ਪੰਜਾਬੀ | ਮੈਂ, {farmer}, {helper} ਨੂੰ ਆਪਣੇ ਖੇਤ ਦੀਆਂ ਫ਼ੋਟੋਆਂ ਖਿੱਚਣ ਅਤੇ ਉਹਨਾਂ ਨੂੰ ਮੇਰੀ ਫ਼ਸਲ ਨੁਕਸਾਨ ਰਿਪੋਰਟ ਲਈ ਭੇਜਣ ਦੀ ਇਜਾਜ਼ਤ ਦਿੰਦਾ/ਦਿੰਦੀ ਹਾਂ। |

Under it, three plain lines say what the consent means:

| Language | What this means |
|---|---|
| English | The photos stay on this phone. Only their fingerprints, the time and a place rounded to about 100 m can be shared. |
| English | The helper only takes the photos. The officer decides. Saboot decides nothing. (On the insurance rail: The insurer decides.) |
| English | You can ask for a copy, or for everything to be deleted from this phone, at any time. |
| हिन्दी | फ़ोटो इसी फ़ोन में रहती हैं। सिर्फ़ उनकी पहचान-छाप, समय और लगभग 100 मीटर तक गोल की हुई जगह साझा की जा सकती है। |
| हिन्दी | सहायक सिर्फ़ फ़ोटो लेता है। फ़ैसला अधिकारी करता है। सबूत कोई फ़ैसला नहीं करता। |
| हिन्दी | आप कभी भी अपनी कॉपी माँग सकते हैं, या इस फ़ोन से सब कुछ मिटवा सकते हैं। |
| ਪੰਜਾਬੀ | ਫ਼ੋਟੋਆਂ ਇਸੇ ਫ਼ੋਨ ਵਿੱਚ ਰਹਿੰਦੀਆਂ ਹਨ। ਸਿਰਫ਼ ਉਨ੍ਹਾਂ ਦੀ ਪਛਾਣ-ਛਾਪ, ਸਮਾਂ ਅਤੇ ਲਗਭਗ 100 ਮੀਟਰ ਤੱਕ ਗੋਲ ਕੀਤੀ ਹੋਈ ਥਾਂ ਸਾਂਝੀ ਕੀਤੀ ਜਾ ਸਕਦੀ ਹੈ। |
| ਪੰਜਾਬੀ | ਸਹਾਇਕ ਸਿਰਫ਼ ਫ਼ੋਟੋਆਂ ਖਿੱਚਦਾ ਹੈ। ਫ਼ੈਸਲਾ ਅਧਿਕਾਰੀ ਕਰਦਾ ਹੈ। ਸਬੂਤ ਕੋਈ ਫ਼ੈਸਲਾ ਨਹੀਂ ਕਰਦਾ। |
| ਪੰਜਾਬੀ | ਤੁਸੀਂ ਕਦੇ ਵੀ ਆਪਣੀ ਕਾਪੀ ਮੰਗ ਸਕਦੇ ਹੋ, ਜਾਂ ਇਸ ਫ਼ੋਨ ਤੋਂ ਸਭ ਕੁਝ ਮਿਟਵਾ ਸਕਦੇ ਹੋ। |

The Hindi and Punjabi text is machine-drafted and flagged for native review (`docs/translation-review.md`). A real pilot needs
the consent wording reviewed by a native speaker **and** by counsel, for each language and for oral consent.

A farmer's own, helper-free use needs no consent step in the app: the farmer is the one taking the photos.

## Location

The exact GPS reading stays in the phone's own log. Anything that can leave the phone carries a position rounded to
**0.001 degrees, about 100 m**: the share code, the QR code, and the evidence bundle. The officer's draft list carries no
coordinates at all, and no farmer name. This is checked by tests (`tests/unit/evidence-vectors.test.ts`,
`tests/unit/relief.test.ts`).

## Retention

- **In the simulation:** everything stays until the person chooses *Delete my data from this phone* in Settings, presses
  *Reset*, or clears the site's data in the browser. The control bar's *Reset* clears the logs, photos and queue.
- **In a pilot:** the retention period for each kind of data is a decision for the buyer and counsel: **[TO FILL]**. A sensible
  default to propose is the shortest period the assessment and any objection window need, with deletion after.

## Revoke, copy, delete

In Settings, under *Your data on this phone*:

- **Export my data (JSON)** gives a copy of **every log on the phone**: the consent, the fingerprints, the exact positions and
  the seal of each farmer the phone captured for. Photos are not in the file; they stay on the phone.
- **Delete my data from this phone** (with a confirmation step) removes **every** log, photo, queued item, helper session, the
  phone's signing key and any imported packets. It cannot be undone.

Both act on the whole phone, for the phone's owner. In helper mode, with a farmer open, Settings also shows
*{farmer}'s data on this phone*, which acts on that one farmer only:

- **Copy of {farmer}'s data (JSON)** gives that farmer's own log and nothing about any other farmer.
- **Delete {farmer}'s data from this phone** (with a confirmation step) removes that farmer's log, photos, spoken consent,
  queued items and queued sends. Every other farmer's evidence stays; a photo file another farmer's log also holds stays too.

In the simulation nothing exists anywhere else, so deleting on the phone deletes everything. In a pilot, withdrawing consent
would also have to reach the officer's office: how a withdrawal changes a draft list that already names the plot is a process
the department defines, **[TO FILL]**. Saboot itself never decides what happens to a claim or an assessment.

## What is shared, and with whom

Nothing leaves the device by itself. A person can choose to:

- show a **QR code or link** to a laptop: it carries the plot number, the times, the rounded position and the photo fingerprints.
  A link holds the code after `#k=`; a browser never sends that part to a server (checked by a test);
- **export an evidence bundle**: the same signed code, its decoded fields and, from a helper's phone, the helper and consent
  recorded on the phone, marked as not signed. No photo and no farmer name are in it;
- **export the officer's draft list**: plot numbers, villages, evidence tiers, no names, no coordinates, no amounts;
- **copy the filing summary**: it holds the farmer's name and plot, for the farmer to paste into the official channel.

## Security measures that exist today

Every farmer's log is hash chained, so a change to any record shows. The packet code is signed by a key made on the phone and
never exported. The site is served with a strict content security policy and no third-party code. These protect integrity.
**They are not access control**: anyone who holds the phone can read what is on it. A real deployment needs device protection,
an access model for the officer's side, and a threat model.

## Open questions for counsel

Who is responsible for the data when an officer's office receives it, and when a helper holds it first. Whether and how the
notice and consent must be given in each language and orally. How long evidence may be kept, and deletion across systems.
How a withdrawal interacts with an assessment already published. What is required for children's or incapacitated persons'
land records. What a grievance route must look like. Whether and how a signed packet may be used as evidence in a dispute.
None of these is answered here.

## How the claims above are checked

| Claim | Check |
|---|---|
| No request carries a body, none goes off-origin, and none contains a photo fingerprint or a code, through a full capture, seal, share and import flow. | `tests/qa/privacy.spec.ts` |
| The `#k=` fragment is never in a request URL or header. | `tests/qa/privacy.spec.ts` |
| The shareable position is rounded to 0.001 degrees. | `tests/unit/privacy.test.ts` |
| An export names no farmer and holds no coordinates, amount or decision field. | `tests/unit/relief.test.ts`, `tests/unit/bundle.test.ts` |
| This document's consent text equals the text in the app, in all three languages. | `tests/unit/privacy.test.ts` |
| Delete removes the logs, photos, key and imports. | `tests/qa/privacy.spec.ts` |
