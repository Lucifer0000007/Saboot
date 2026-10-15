// Evidence bundle (JSON): the signed packet code, its decoded fields, and a context block. It is written in the open format
// of docs/EVIDENCE-FORMAT.md and is designed to be ingestible by other systems. It is NOT an integration with any system:
// nothing here is sent anywhere, and no such system is connected. `node scripts/verify-packet.mjs bundle.json` verifies it.
import type { KPayload } from './payload';

export interface BundleContext {
  rail?: 'relief' | 'pmfby';
  /** Who took the photos. From a helper's phone this names the helper and the consent that was recorded. */
  capturedBy?: { who: 'farmer' | 'helper'; helper?: string; role?: string; consent?: { method: string; replayHour: number } };
  /** SHA-256 of the full packet body kept on the phone (it also holds consent and the helper on each photo). */
  packetHash?: string;
}

export const BUNDLE_KIND = 'saboot.evidence-bundle';

/** The code alone, from whatever was pasted: a bare code or a link with #k=. */
export const codeOf = (text: string) => text.trim().replace(/^.*#k=/, '');

export function makeBundle(code: string, p: KPayload, context?: BundleContext) {
  return {
    kind: BUNDLE_KIND,
    v: 1,
    simulation: true,
    note: 'Designed to be ingestible by other systems. It is not an integration with any system and nothing here was sent anywhere. Verify it with scripts/verify-packet.mjs, which needs no Saboot code.',
    format: 'docs/EVIDENCE-FORMAT.md, packet format version 1',
    code: codeOf(code),
    decoded: {
      formatVersion: 1,
      plot: p.plot,
      eventHour: p.eventT,
      sealHour: p.sealT,
      phoneClockUtc: new Date(p.deviceMs).toISOString().replace('.000Z', 'Z'),
      location: { lat: p.lat, lon: p.lon, roundedTo: '0.001 degrees, about 100 m' },
      photos: p.shots.map((s) => ({ kind: s.kind, captureHour: s.simT, sha256: s.sha })),
      chainHead: p.head,
      publicKey: p.pub,
    },
    verifiedBy: 'not verified by this file: whoever receives it should run a verifier on the code',
    ...(context ? { context: { notSigned: 'This block is recorded on the phone and is NOT covered by the signature in format version 1. Treat it as a claim made by the phone, not as proven.', ...context } } : {}),
    photos: 'Photos are not included. They stay on the phone unless the farmer shares them. Only their SHA-256 fingerprints are in the code.',
  };
}

export const bundleJson = (b: ReturnType<typeof makeBundle>) => JSON.stringify(b, null, 2) + '\n';
