# Saboot evidence packet format, version 1

An open, small, signed format for "these photos were sealed together at this time and place, and nothing has changed since".
It is **designed to be ingestible by other systems**. It is **not an integration**: no external system reads it today, and
nothing in this repository sends it anywhere. Everything built on it so far is a simulation with synthetic plots.

A packet is about 253 bytes. It is written as base64url text (about 338 characters) so it fits in a QR code, a copy-and-paste
code, or the `#k=` fragment of a link. A browser never sends the fragment of a link to a server. A JSON wrapper, the
*evidence bundle*, is described at the end.

Two verifiers exist and agree on every test vector: the one inside the app (`src/k/payload.ts`) and a standalone Node script
that shares no code with it (`scripts/verify-packet.mjs`).

## What a packet holds

All numbers are big-endian. The signed bytes are the **body**, then the **head**, then the **public key**.

| Offset | Size | Field | Meaning |
|---|---|---|---|
| 0 | 1 | `version` | `1`. A verifier must refuse any other value. |
| 1 | 1 | `plot` | The plot number, 0 to 255, shown as `P-NN`. |
| 2 | 2 | `eventHour` | When the event began, in hours since the start of the replay, times 100. |
| 4 | 2 | `sealHour` | When the packet was sealed, same unit. |
| 6 | 4 | `phoneClock` | The phone's own clock when it sealed the packet, in unix seconds. Not checked against any trusted clock. |
| 10 | 4 | `lat` | Latitude in degrees times 1000, signed. About 100 m: deliberately coarse. |
| 14 | 4 | `lon` | Longitude in degrees times 1000, signed. |
| 18 | 1 | `n` | How many photos, 1 to 3. |
| 19 | 35 each | photos | `kind` (1 byte, below), `captureHour` (2 bytes, times 100), `sha256` (32 bytes) of the photo file. |
| 19 + 35n | 32 | `head` | The chain head, below. |
| 51 + 35n | 33 | `publicKey` | The signer's P-256 public key, compressed (SEC1). |
| 84 + 35n | 64 | `signature` | ECDSA P-256 with SHA-256 over every byte before it, written as `r` then `s`, 32 bytes each. |

### The kind byte

| Bits | Meaning |
|---|---|
| 0 and 1 | The photo kind: 0 wide, 1 close, 2 landmark. 3 is not defined. |
| 2 and 3 | Where the **photo** came from: 0 not recorded, 1 live (the camera), 2 simulated, 3 entered by hand. |
| 4 and 5 | Where the **location** came from: the same four values (1 is a GPS fix, 2 is a simulated position). |
| 6 and 7 | Must be 0. |

The origin bits were added after the first test vectors. Every packet made before then has them at 0, so it still verifies and
reads "not recorded". They sit inside the chained and signed bytes, so changing one breaks the seal. A verifier that predates
them still verifies such a packet and only shows the photo kind as unknown. They are a statement made by the phone's software:
a modified client could write "live" next to a staged photo, and the seal would keep that statement unchanged.

Times are **replay hours** because the simulation has no real calendar for its fictional district. A real deployment would carry
real timestamps; that needs a new version (see Versioning).

The photos themselves are never in a packet. Only their SHA-256 fingerprints are. Anyone holding a photo can hash it and look
for the fingerprint.

## The chain

The chain links the photos and the seal so that no part can be swapped without every later link changing.

```text
link[-1] = 32 zero bytes
record[i] = the 35 bytes of photo i                 (i = 0 .. n-1)
record[n] = 0xff followed by bytes 1 to 17 of the body   (the seal: plot, event hour, seal hour, phone clock, location)
link[i]   = SHA-256( link[i-1] || record[i] )
head      = link[n]
```

## How to verify

1. Take the code: everything after the last `#k=` if there is one, with all white space removed (a pasted code may wrap).
   Refuse it unless it is at most 1,024 characters of the base64url alphabet (no padding), and unless decoding and encoding
   it again gives the same text. The last character carries unused bits, and one packet must have exactly one text.
   Otherwise: **decode** failure.
2. Refuse unless the first byte is `1`, the photo count is 1 to 3, and the length is exactly `19 + 35n + 32 + 33 + 64`.
   Refuse a latitude beyond 90 degrees or a longitude beyond 180. Refuse a kind byte whose kind is 3 or whose bits 6 and 7
   are set, and refuse two photos of the same kind. Otherwise: **decode** failure. All of these checks come before the chain.
3. Split the bytes into body, head, public key and signature.
4. Recompute the chain from the body as above. If the result is not equal to the head in the packet: **chain** failure. A
   photo fingerprint or the seal was changed.
5. Decompress the public key to an uncompressed P-256 point (65 bytes), so WebCrypto can import it.
6. Verify the ECDSA P-256 / SHA-256 signature over `body || head || publicKey`. If it does not verify, or the key is not a
   valid point: **signature** failure. Someone changed the packet and recomputed the chain, but could not sign.
7. Otherwise the packet is **verified**.

The standalone script does exactly this:

```text
node scripts/verify-packet.mjs "<code, or a link containing #k=..., or a file>"
node scripts/verify-packet.mjs --json bundle.json
```

It exits 0 when verified, 1 when not, 2 for a usage error, and prints what a pass does not prove.

## What a pass proves, and what it does not

**It proves** that the bytes of the packet are unchanged since the holder of the private key signed them, that the chain is
consistent, and that each photo fingerprint, the times and the rounded location were bound together at signing. A photo file
whose SHA-256 equals a listed fingerprint is the photo that was sealed.

**It does not prove**

- **Where a photo or a location really came from.** The origin bits are what the phone's software wrote. A packet can say
  "live" about a staged photo. What the seal guarantees is that the statement was not changed afterwards.
- **Identity.** The key is a device key made on the phone and never exported. It is not tied to a person, an office or a
  registry. Anyone can make a valid packet with a key of their own.
- **That the photo is true.** A staged, old or edited photo seals as well as a real one. Saboot uses AI only to describe what is
  visible. It never decides that a photo is genuine.
- **The clock.** `phoneClock` is whatever the phone said. Nothing here checks it against a trusted time source. The server
  receipt time shown in the app is simulated.
- **The place.** GPS can be wrong or faked, and the location is rounded to about 100 m on purpose.
- **Consent, or who took the photos.** In version 1 the consent text and the helper's name are **not** part of the signed bytes
  (see the bundle). They are recorded on the phone in a separate hash-chained log.
- **Anything about damage, a claim, eligibility or an amount.** The format says nothing about them, and Saboot decides none of them.

## Versioning

- The first byte is the version. A verifier must refuse a version it does not know, and the test vectors include one.
- Any change that would alter the meaning of an existing packet is a new version, and nothing of that kind is changed inside
  version 1. One addition was made inside it: the origin bits of the kind byte (above). They were zero in every earlier
  packet, an earlier verifier still verifies a packet that uses them, and the first ten test vectors still give the same
  result. The stricter decoding rules in "How to verify" are verifier policy and apply to version 1 packets as well.
- Limits of version 1: replay hours instead of real timestamps, a one-byte plot number, at most three photos, three photo kinds,
  location to 0.001 degrees.
- Intended for a later version, **not built**: real timestamps with a stated clock source, a longer plot identifier, and the
  hash of the full packet body (which holds the consent and the helper on every photo) inside the signed bytes, so that "who
  captured what" becomes verifiable and not only recorded.

## Test vectors

`tests/vectors/evidence-v1.json` holds 21 synthetic vectors, each with the result a verifier must give. The first ten were
fixed first and have not changed. The rest were appended later.

| Vector | Must fail at |
|---|---|
| `valid`, `valid-link` | passes |
| `tampered-photo-hash`, `tampered-chain-head`, `tampered-seal-time` | chain |
| `edited-and-rechained`, `wrong-signature` | signature |
| `wrong-version`, `truncated`, `not-a-code` | decode |
| `origin-live`, `origin-simulated`, `origin-hand-location`, `wrapped-lines` | passes, with the origins and the line breaks as named |
| `origin-changed-after-sealing` | chain |
| `not-canonical-last-character`, `code-too-long` | decode |
| `reserved-bits-set`, `unknown-photo-kind`, `duplicate-photo-kind`, `latitude-out-of-range` (each correctly signed) | decode |

`tests/unit/evidence-vectors.test.ts` checks both verifiers against every vector, and flips every single bit of a packet with no
origin bits and of one with them (2,024 each) to confirm that both catch every one and name the same failing step. ECDSA
signatures are randomised, so the committed file is the fixed set: `scripts/evidence-vectors.ts` only appends vectors whose
name is missing and never rewrites an existing one.

## The evidence bundle (JSON)

The dashboard (the import sheet and the imported row) and the phone's share sheet, which a helper uses, can export a bundle:

```json
{
  "kind": "saboot.evidence-bundle",
  "v": 1,
  "simulation": true,
  "note": "Designed to be ingestible by other systems. It is not an integration with any system ...",
  "code": "<the packet, base64url>",
  "decoded": { "formatVersion": 1, "plot": "P-05", "eventHour": 11, "sealHour": 18.9,
               "phoneClockUtc": "2026-07-14T12:00:00Z",
               "location": { "lat": 30.123, "lon": 75.456, "roundedTo": "0.001 degrees, about 100 m" },
               "photos": [ { "kind": "wide", "photoOrigin": "live", "locationOrigin": "live", "captureHour": 18.8, "sha256": "..." } ],
               "chainHead": "...", "publicKey": "..." },
  "context": { "notSigned": "...", "rail": "relief",
               "capturedBy": { "who": "helper", "helper": "...", "role": "...", "consent": { "method": "hold", "replayHour": 18.4 } },
               "packetHash": "..." },
  "photos": "Photos are not included. They stay on the phone unless the farmer shares them."
}
```

`decoded` is a convenience: **only `code` is authoritative**, and a receiver should verify it. `context` appears only when
the bundle is exported from the phone, is recorded there, and is **not covered by the signature** in version 1: treat it as a
claim made by the phone. The bundle holds no farmer name and no photo.

## Privacy

A packet holds a plot number, rounded location, times and fingerprints. It holds no name, phone number or photo. See
`docs/PRIVACY-AND-CONSENT.md`.
