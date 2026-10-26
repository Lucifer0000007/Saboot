// District audit ledger: every event across the cohort, append-only, SHA-256 hash-chained in the
// browser (WebCrypto). "Tamper test" edits one stored record without re-hashing to show detection.
import { signal } from '@preact/signals';
import { appendLink, sha256, verifyChain, type ChainLink, type LinkStatus } from '../lib/hash';
import type { Row } from '../dashboard/state';
import { SCRIPT } from '../farmer/focus';
import { cohortPhotoSvg } from '../dashboard/photos';
import type { Imported } from '../k/imported';

export interface LedgerBody {
  simT: number;
  type: string;
  plot: string;
  data: Record<string, string | number | boolean | null>;
}
export type LedgerLink = ChainLink<LedgerBody>;

export const ledger = signal<LedgerLink[]>([]);
export const statuses = signal<LinkStatus[] | null>(null);
export const tamper = signal<{ seq: number; before: LedgerBody } | null>(null);
export const building = signal(false);
export const verifyMs = signal<number | null>(null);

const photoHashCache = new Map<string, string>();
async function cohortShotHash(r: Row, kind: 'wide' | 'close' | 'landmark') {
  const key = r.s.plot.id + kind;
  if (!photoHashCache.has(key)) photoHashCache.set(key, await sha256(cohortPhotoSvg(r.s.plot, kind, r.s.times.geoOffM > 100)));
  return photoHashCache.get(key)!;
}

/** Real photo fingerprints per plot: the demo farmer and every farmer a helper captured for (kind -> SHA-256). */
export type LiveShots = Record<string, Record<string, string>>;

export async function collect(list: Row[], t: number, liveShots: LiveShots, imports: Imported[] = []): Promise<LedgerBody[]> {
  const out: LedgerBody[] = [];
  const add = (simT: number | null, type: string, plot: string, data: LedgerBody['data'] = {}) => {
    if (simT !== null && simT <= t) out.push({ simT: +simT.toFixed(3), type, plot, data });
  };
  for (const r of list) {
    const s = r.s, tm = s.times, id = s.plot.id, d = s.det;
    if (tm.hail) {
      add(tm.alertT, 'HAIL_PROMPT_SENT', id, { lang: s.plot.lang, confidence: 'low' });
    } else if (d.detected) {
      add(d.detectT, 'EVENT_DETECTED', id, { rule: d.rule, rules: d.fired.join('+'), eventT: d.eventT, [s.rail === 'pmfby' ? 'deadlineT' : 'adviceEndsT']: d.deadlineT });
      add(tm.alertT, 'VOICE_ALERT_DELIVERED', id, { lang: s.plot.lang });
    }
    add(tm.noDamageT, 'FARMER_NO_DAMAGE', id);
    add(tm.consentT, 'HELPER_CONSENT', id, { method: tm.helper?.method ?? (s.persona === 'focus' ? 'device' : 'hold'), helper: tm.helper?.name ?? null, role: tm.helper?.role ?? null });
    if (tm.captureT !== null && tm.captureT <= t) {
      const kinds = (['wide', 'close', 'landmark'] as const).slice(0, tm.shots);
      const hashes: Record<string, string> = {};
      const real = liveShots[id];
      for (const k of kinds) hashes[k] = real ? real[k] ?? '' : await cohortShotHash(r, k);
      add(tm.captureT, 'PHOTOS_CAPTURED', id, { shots: tm.shots, deviceT: tm.captureT, capturedBy: tm.helper?.name ?? (tm.consentT !== null ? 'helper' : 'farmer'), ...Object.fromEntries(kinds.map((k) => ['sha_' + k, hashes[k]])) });
    }
    add(tm.syncT, 'EVIDENCE_RECEIVED', id, { deviceT: tm.captureT, serverT: tm.syncT, gapH: tm.syncT !== null && tm.captureT !== null ? +(tm.syncT - tm.captureT).toFixed(2) : null });
    add(tm.fileT, 'FILING_REFERENCE', id, { ref: s.ref ?? (s.persona === 'focus' ? null : `SIM-REF-${7000 + s.plot.idx * 37}`) });
    if (tm.fileT !== null) {
      if (tm.ackT === null || tm.ackT > tm.fileT + SCRIPT.ackDue) add(tm.fileT + SCRIPT.ackDue, s.rail === 'pmfby' ? 'INSURER_REMINDED' : 'OFFICER_REMINDED', id);
      if (tm.ackT === null || tm.ackT > tm.fileT + SCRIPT.escalate) add(tm.fileT + SCRIPT.escalate, 'ESCALATED_DISTRICT', id);
    }
    add(tm.ackT, s.rail === 'pmfby' ? 'INSURER_ACK' : 'OFFICER_ACK', id);
    if (tm.deadlineT !== null && tm.alertT !== null && tm.noDamageT === null && (tm.captureT === null || tm.captureT > tm.deadlineT)) add(tm.deadlineT, tm.hail ? 'HAIL_PROMPT_UNCONFIRMED' : s.rail === 'pmfby' ? 'WINDOW_CLOSED_NO_EVIDENCE' : 'ADVICE_PASSED_NO_EVIDENCE', id);
  }
  // Feature K: packets signed on a judge's phone and verified here (photo fingerprints + the signed seal).
  for (const k of imports) {
    for (const s of k.shots) add(s.simT, 'IMPORTED_PHOTO', k.plot, { kind: s.kind, sha: s.sha, deviceT: s.simT, via: 'phone-to-laptop', photo: s.photo ?? 'not recorded', location: s.loc ?? 'not recorded' });
    add(k.sealT, 'IMPORTED_PACKET', k.plot, { head: k.head, pubkey: k.pub.slice(0, 16), signature: 'verified', deviceT: k.sealT, receivedAt: k.importedAt });
  }
  return out.sort((a, b) => a.simT - b.simT || a.plot.localeCompare(b.plot) || a.type.localeCompare(b.type));
}

let gen = 0;
export async function rebuild(list: Row[], t: number, liveShots: LiveShots, imports: Imported[] = []) {
  if (tamper.value) return; // frozen while a tamper test is on screen
  // Hashing hundreds of records takes a while on a slow phone. Only the latest rebuild may write: an older one finishing late
  // would show a stale ledger, and one finishing after a tamper test started would wipe it.
  const my = ++gen;
  building.value = true;
  const bodies = await collect(list, t, liveShots, imports);
  const chain: LedgerLink[] = [];
  for (const b of bodies) chain.push(await appendLink(chain, b));
  if (my !== gen) return;
  building.value = false;
  if (tamper.value) return;
  ledger.value = chain;
  statuses.value = null;
}

export async function verifyLedger() {
  const t0 = performance.now();
  statuses.value = await verifyChain(ledger.value);
  verifyMs.value = Math.round(performance.now() - t0);
}

/** Alter one stored record WITHOUT re-hashing (what a quiet edit to a database would look like). */
export async function tamperTest() {
  const c = ledger.value;
  if (!c.length) return;
  const imp = c.findIndex((l) => l.body.type === 'IMPORTED_PHOTO');
  const idx = imp >= 0 ? imp : c.findIndex((l, i) => i > c.length / 3 && l.body.type === 'PHOTOS_CAPTURED');
  const seq = idx >= 0 ? idx : Math.floor(c.length / 2);
  const before = c[seq].body;
  const after: LedgerBody = { ...before, simT: +(before.simT - 6).toFixed(3), data: { ...before.data, deviceT: typeof before.data.deviceT === 'number' ? +(before.data.deviceT - 6).toFixed(3) : before.data.deviceT, note: 'backdated by 6 h' } };
  tamper.value = { seq, before };
  ledger.value = c.map((l, i) => (i === seq ? { ...l, body: after } : l));
  await verifyLedger();
}

export async function restore() {
  const tp = tamper.value;
  if (!tp) return;
  ledger.value = ledger.value.map((l, i) => (i === tp.seq ? { ...l, body: tp.before } : l));
  tamper.value = null;
  await verifyLedger();
}
