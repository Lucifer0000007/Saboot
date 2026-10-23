// The judge's own farmer (focus plot), and the farmers a helper captures for. Everything they do is an event in an
// append-only, SHA-256 hash-chained device log persisted in IndexedDB: one log per farmer, so each farmer's consent and
// photos are sealed in that farmer's own chain. The visible state at sim time t is a pure reduction of events with
// simT <= t, so scrubbing the replay backwards "un-happens" actions.
import { signal, computed } from '@preact/signals';
import { appendLink, canonical, sha256, type ChainLink } from '../lib/hash';
import { dbGet, dbSet, dbDel, dbClear, dbKeys } from '../lib/db';
import { network, browserOnline } from '../lib/prefs';
import { t, seek, model, focusPlot, focusDet, toLatLon, activePlotId } from '../sim/engine';
import { syntheticPhoto, type ShotKind, SHOTS } from './photo';
import { imported } from '../k/imported';

export interface Geo { lat: number; lon: number; acc: number; src: 'gps' | 'sim' }
export interface ShotData {
  kind: ShotKind;
  photoId: string;
  sha: string;
  bytes: number;
  w: number;
  h: number;
  geo: Geo;
  synthetic: boolean;
  helper?: string;
  queued: boolean;
}
export interface Consent { farmer: string; helper: string; role: string; method: 'hold' | 'voice'; audioSha?: string; text: string }

/** 'hash' = only the tiny fingerprint message reached the server (weak 2G network): it fixes the
 *  server receipt time. 'full' = the photo bodies arrived too. Old logs without a stage count as 'full'. */
export type SyncStage = 'hash' | 'full';
export type FocusEvent =
  | { type: 'shot'; simT: number; data: ShotData }
  | { type: 'sync'; simT: number; data: { photoIds: string[]; packet?: string; stage?: SyncStage } }
  | { type: 'seal'; simT: number; data: { packetHash: string; shots: string[]; queued: boolean; /** the phone's own clock when it sealed (older logs have none) */ deviceMs?: number } }
  | { type: 'ref'; simT: number; data: { ref: string } }
  | { type: 'no_damage'; simT: number; data: { undo?: boolean } }
  | { type: 'consent'; simT: number; data: Consent }
  /** Relief rail: the farmer attaches the sealed evidence packet to their entry of the published draft list. */
  | { type: 'objection'; simT: number; data: { packetHash: string } };

export type Link = ChainLink<FocusEvent>;

/** Key of the demo farmer's log. Helper sessions add one log per farmer, keyed by plot id. */
export const DEMO = '$demo';
export const logs = signal<Record<string, Link[]>>({});
/** The log the farmer app is writing to: the demo farmer's, or the farmer a helper is capturing for. */
export const activeKey = computed(() => activePlotId.value ?? DEMO);
export const chain = computed(() => logs.value[activeKey.value] ?? []);
/** The demo farmer's own log, whoever the app is acting for right now. */
export const demoChain = computed(() => logs.value[DEMO] ?? []);
export const busy = signal(false);
export const rewound = signal(false);

/** A helper (sarpanch, CSC operator, cooperative or extension worker) captures for several farmers on one phone. */
export interface HelperSession { name: string; role: string }
export const helperSession = signal<HelperSession | null>(null);

const KEY = 'focus-chain';
const IDS = 'log-ids';
const SESSION = 'helper-session';
const kvKey = (k: string) => (k === DEMO ? KEY : 'log:' + k);
let loaded = false;

export async function loadFocus() {
  const next: Record<string, Link[]> = {};
  const demo = await dbGet<Link[]>('kv', KEY);
  if (demo) next[DEMO] = demo;
  for (const id of (await dbGet<string[]>('kv', IDS)) ?? []) {
    const c = await dbGet<Link[]>('kv', kvKey(id));
    if (c) next[id] = c;
  }
  logs.value = { ...next, ...logs.value };
  const hs = await dbGet<HelperSession>('kv', SESSION);
  if (hs && !helperSession.value) helperSession.value = hs;
  loaded = true;
}

async function save(key: string) {
  await dbSet('kv', kvKey(key), logs.value[key] ?? []);
  const ids = Object.keys(logs.value).filter((k) => k !== DEMO);
  await dbSet('kv', IDS, ids);
}

/** Remember who the helper is for this session (name and role only; nothing else about them is kept). */
export async function startHelperSession(s: HelperSession) {
  helperSession.value = s;
  await dbSet('kv', SESSION, s);
}
/** End the helper session: the app goes back to the demo farmer. Each farmer's sealed log stays as it is. */
export async function endHelperSession() {
  activePlotId.value = null;
  helperSession.value = null;
  await dbDel('kv', SESSION);
}

/** Writes one at a time (and across tabs where the browser has Web Locks), so two actions can never overwrite each other. */
let writes: Promise<unknown> = Promise.resolve();
function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = writes.then(() => (typeof navigator !== 'undefined' && navigator.locks ? navigator.locks.request('saboot-log', fn) : fn()));
  writes = run.catch(() => undefined);
  return run as Promise<T>;
}

/**
 * Append an event. A log only moves forward: an event that would land before the last one is stamped just after it, so
 * scrubbing the replay back, reloading or reconnecting can never remove sealed evidence. When a person acts while the
 * replay is behind their last action, the replay moves forward to it so they can see what they did. A `passive` event (a
 * sync) never moves the replay.
 */
async function append(ev: FocusEvent, key: string = activeKey.value, passive = false) {
  return exclusive(async () => {
    if (!loaded) await loadFocus();
    // Another tab may have written since this one read the log: start from the longer one.
    const stored = await dbGet<Link[]>('kv', kvKey(key));
    let c = logs.value[key] ?? [];
    if (stored && stored.length > c.length) c = stored;
    const last = c.length ? c[c.length - 1].body.simT : -Infinity;
    const simT = Math.max(ev.simT, last);
    if (simT > ev.simT && !passive) {
      seek(simT);
      rewound.value = true;
    }
    const link = await appendLink(c, simT === ev.simT ? ev : ({ ...ev, simT } as FocusEvent));
    logs.value = { ...logs.value, [key]: [...c, link] };
    await save(key);
    return link;
  });
}

/** After a reload the replay clock is back at the start: take it to the last thing the person did, so their evidence shows. */
export function restoreClock() {
  let last = 0;
  for (const c of Object.values(logs.value)) if (c.length) last = Math.max(last, c[c.length - 1].body.simT);
  if (t.value < last) seek(last);
}

export async function resetFocus() {
  const ids = Object.keys(logs.value).filter((k) => k !== DEMO);
  logs.value = {};
  activePlotId.value = null;
  helperSession.value = null;
  rewound.value = false;
  photoUrls.forEach((u) => URL.revokeObjectURL(u));
  photoUrls.clear();
  await Promise.all([dbDel('kv', KEY), dbDel('kv', IDS), dbDel('kv', SESSION), ...ids.map((id) => dbDel('kv', kvKey(id))), dbClear('photos'), dbClear('outbox')]);
}

/**
 * A copy of everything this phone holds about the people it captured for: each farmer's hash-chained log (consent, photo
 * fingerprints, seal) and the helper session. Photos are not in it: they stay on the phone. For the farmer, or the helper
 * on a farmer's behalf, to keep or hand over (docs/PRIVACY-AND-CONSENT.md).
 */
export function exportMyData() {
  return {
    kind: 'saboot.device-export',
    v: 1,
    simulation: true,
    note: 'Everything this phone holds in the Saboot simulation: the logs and the helper session. Photos are not included; they stay on the phone. Nothing was uploaded.',
    helperSession: helperSession.value,
    logs: Object.fromEntries(Object.entries(logs.value).map(([k, c]) => [k === DEMO ? 'demo-farmer' : k, c])),
  };
}

/** Delete every log, photo, queued item, helper session, signing key and imported packet from this phone. Cannot be undone. */
export async function deleteMyData() {
  await resetFocus();
  imported.value = [];
  await Promise.all([dbDel('kv', 'k-device-key'), dbDel('kv', 'k-imported')]);
}

/** What each log shows at sim time t: the demo farmer's view, and the view of every farmer a helper has captured for. */
export function liveViews(at: number): { focus: FocusView; live: Record<string, FocusView> } {
  const live: Record<string, FocusView> = {};
  for (const [k, c] of Object.entries(logs.value)) if (k !== DEMO) live[k] = reduce(c, at);
  return { focus: reduce(logs.value[DEMO] ?? [], at), live };
}

// ---------- derived view ----------
export interface ShotView extends ShotData { simT: number; recvT: number | null; bodyT: number | null }
/** One row of the sync log: device time vs (simulated) server receipt time. */
export interface SyncItem { id: string; kind: ShotKind | 'packet'; deviceT: number; recvT: number | null; bodyT: number | null }
export interface FocusView {
  events: Link[];
  shots: Partial<Record<ShotKind, ShotView>>;
  shotCount: number;
  queued: number;
  /** received as a hash only; photo body still waiting for a better network */
  bodyPending: number;
  items: SyncItem[];
  seal: { simT: number; packetHash: string; recvT: number | null; shots: string[]; deviceMs?: number } | null;
  ref: { ref: string; simT: number } | null;
  noDamage: number | null;
  consent: (Consent & { simT: number }) | null;
  objection: { simT: number; packetHash: string } | null;
  firstShotT: number | null;
  lastShotT: number | null;
  syncedT: number | null;
}

export function reduce(events: Link[], at: number): FocusView {
  const v: FocusView = {
    events: [], shots: {}, shotCount: 0, queued: 0, bodyPending: 0, items: [], seal: null, ref: null, noDamage: null,
    consent: null, objection: null, firstShotT: null, lastShotT: null, syncedT: null,
  };
  const recv = new Map<string, number>();
  const body = new Map<string, number>();
  for (const l of events) {
    const e = l.body;
    if (e.simT > at) continue;
    v.events.push(l);
    if (e.type === 'shot') v.shots[e.data.kind] = { ...e.data, simT: e.simT, recvT: e.data.queued ? null : e.simT, bodyT: e.data.queued ? null : e.simT };
    else if (e.type === 'sync') {
      for (const id of e.data.photoIds) {
        if (!recv.has(id)) recv.set(id, e.simT);
        if ((e.data.stage ?? 'full') === 'full' && !body.has(id)) body.set(id, e.simT);
      }
      if (e.data.packet && v.seal && v.seal.recvT === null) v.seal.recvT = e.simT;
    } else if (e.type === 'seal') v.seal = { simT: e.simT, packetHash: e.data.packetHash, recvT: e.data.queued ? null : e.simT, shots: e.data.shots, deviceMs: e.data.deviceMs };
    else if (e.type === 'ref') v.ref = { ref: e.data.ref, simT: e.simT };
    else if (e.type === 'no_damage') v.noDamage = e.data.undo ? null : e.simT;
    else if (e.type === 'consent') v.consent = { ...e.data, simT: e.simT };
    else if (e.type === 'objection') v.objection = { simT: e.simT, packetHash: e.data.packetHash };
  }
  for (const k of SHOTS) {
    const s = v.shots[k];
    if (!s) continue;
    if (s.recvT === null && recv.has(s.photoId)) s.recvT = recv.get(s.photoId)!;
    if (s.bodyT === null && body.has(s.photoId)) s.bodyT = body.get(s.photoId)!;
    v.shotCount++;
    if (s.recvT === null) v.queued++;
    else if (s.bodyT === null) v.bodyPending++;
    v.items.push({ id: s.photoId, kind: k, deviceT: s.simT, recvT: s.recvT, bodyT: s.bodyT });
    v.firstShotT = v.firstShotT === null ? s.simT : Math.min(v.firstShotT, s.simT);
    v.lastShotT = Math.max(v.lastShotT ?? 0, s.simT);
    if (s.recvT !== null) v.syncedT = Math.max(v.syncedT ?? 0, s.recvT);
  }
  if (v.seal) {
    if (v.seal.recvT === null) v.queued++;
    v.items.push({ id: 'packet', kind: 'packet', deviceT: v.seal.simT, recvT: v.seal.recvT, bodyT: v.seal.recvT });
  }
  return v;
}

export const view = computed(() => reduce(chain.value, t.value));
/** Everything the user has done, regardless of the replay position. */
export const full = computed(() => reduce(chain.value, Infinity));

// ---------- photos ----------
const photoUrls = new Map<string, string>();
export const photoTick = signal(0);
export async function photoUrl(id: string): Promise<string | null> {
  if (photoUrls.has(id)) return photoUrls.get(id)!;
  const b = await dbGet<Blob>('photos', id);
  if (!b) return null;
  const u = URL.createObjectURL(b);
  photoUrls.set(id, u);
  return u;
}

/** Simulated GPS: plot centroid with a few metres of deterministic jitter. */
export function simGeo(seed = 0): Geo {
  const m = model.value!, p = focusPlot.value!;
  const [lat, lon] = toLatLon(m, p.cx + ((seed % 5) - 2) * 0.4, p.cy + ((seed % 3) - 1) * 0.4);
  return { lat: +lat.toFixed(6), lon: +lon.toFixed(6), acc: 8, src: 'sim' };
}

/** How long a photo waits for a location before it says "simulated location" and goes on. */
const GEO_WAIT_MS = 3500;

export function getGeo(): Promise<Geo> {
  return new Promise((res) => {
    if (!('geolocation' in navigator)) return res(simGeo(1));
    const done = (g: Geo) => res(g);
    const timer = setTimeout(() => done(simGeo(2)), GEO_WAIT_MS);
    navigator.geolocation.getCurrentPosition(
      (p) => { clearTimeout(timer); done({ lat: +p.coords.latitude.toFixed(6), lon: +p.coords.longitude.toFixed(6), acc: Math.round(p.coords.accuracy), src: 'gps' }); },
      () => { clearTimeout(timer); done(simGeo(3)); },
      { enableHighAccuracy: true, timeout: GEO_WAIT_MS - 500, maximumAge: 60000 }
    );
  });
}

export const isOffline = () => network.value === 'offline' || !browserOnline.value;
const isWeak = () => network.value === 'weak';
/** Flag a phone-time to server-receipt gap larger than this (hours) for review. */
export const GAP_FLAG_H = 2;
/** Items currently being sent over the (simulated) network. */
export const sending = signal(0);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** 2G: one small message every ~1.2 s of real time. */
export const WEAK_DELAY_MS = 1200;

export async function addShot(kind: ShotKind, blob: Blob, w: number, h: number, geo: Geo, synthetic: boolean, helper?: string) {
  busy.value = true;
  // ask the browser to keep what is captured when storage runs low (no prompt; the answer is not needed)
  void navigator.storage?.persist?.().catch(() => undefined);
  try {
    const sha = await sha256(blob);
    const photoId = 'ph-' + sha.slice(0, 16);
    await dbSet('photos', photoId, blob);
    const queued = isOffline() || isWeak();
    if (queued) await dbSet('outbox', photoId, { kind: 'photo', id: photoId, simT: t.value, plot: activeKey.value });
    await append({ type: 'shot', simT: t.value, data: { kind, photoId, sha, bytes: blob.size, w, h, geo, synthetic, helper, queued } });
    photoTick.value++;
  } finally {
    busy.value = false;
  }
  if (isWeak()) void syncOutbox();
}

export async function addSyntheticShot(kind: ShotKind, helper?: string) {
  const p = focusPlot.value!;
  const label = `${p.id} · ${kind.toUpperCase()}`;
  const { blob, w, h } = await syntheticPhoto(kind, label, 17);
  await addShot(kind, blob, w, h, simGeo(SHOTS.indexOf(kind) + 4), true, helper);
}

/** Canonical packet body — what the fingerprint covers. */
export function packetBody(v: FocusView) {
  const m = model.value!, p = focusPlot.value!, d = focusDet.value!;
  return {
    v: 1,
    rail: m.opts.rail,
    plot: p.id,
    farmer: p.name,
    policy: policyNo(p.id),
    khasra: p.khasra,
    crop: p.crop,
    cause: 'flood',
    district: m.raw.district,
    eventT: d.eventT,
    // a deadline on the PMFBY rail, advice on the relief rail: the packet says which
    [m.opts.rail === 'pmfby' ? 'deadlineT' : 'adviceEndsT']: d.deadlineT,
    detection: d.rule,
    rules: d.fired.join('+'),
    shots: SHOTS.filter((k) => v.shots[k]).map((k) => {
      const s = v.shots[k]!;
      return { kind: k, sha256: s.sha, simT: +s.simT.toFixed(3), geo: s.geo, synthetic: s.synthetic, helper: s.helper };
    }),
    consent: v.consent ? { helper: v.consent.helper, role: v.consent.role, method: v.consent.method, simT: v.consent.simT } : undefined,
    prev: v.events.length ? v.events[v.events.length - 1].hash : undefined,
  };
}

export async function seal() {
  const v = view.value;
  if (!v.shotCount || full.value.seal) return;
  busy.value = true;
  try {
    const body = packetBody(v);
    const packetHash = await sha256(canonical(body));
    const queued = isOffline() || isWeak();
    if (queued) await dbSet('outbox', 'packet-' + packetHash.slice(0, 12), { kind: 'packet', simT: t.value, plot: activeKey.value });
    await append({ type: 'seal', simT: t.value, data: { packetHash, shots: body.shots.map((s) => s.sha256), queued, deviceMs: Date.now() } });
  } finally {
    busy.value = false;
  }
  if (isWeak()) void syncOutbox();
}

interface OutboxEntry { kind: 'photo' | 'packet'; id?: string; simT: number; hashSent?: boolean; /** whose log: a plot id, or DEMO (entries from before helper sessions have none) */ plot?: string }
let syncing = false;

/**
 * Flush the IndexedDB outbox; the (simulated) server stamps its own receipt time.
 * Online: everything goes at once. Weak (2G): hash-first. Each fingerprint goes alone, slowly, and fixes
 * the receipt time; photo bodies wait for a better network. Offline: nothing moves.
 */
export async function syncOutbox() {
  if (syncing || isOffline()) return;
  syncing = true;
  try {
    for (;;) {
      if (isOffline()) return;
      const keys = await dbKeys('outbox');
      if (!keys.length) return;
      const entries = await Promise.all(keys.map(async (k) => [k, await dbGet<OutboxEntry>('outbox', k)] as const));
      if (isWeak()) {
        const left = entries.filter(([, e]) => e && !e.hashSent);
        if (!left.length) return; // only photo bodies left: they wait for a better network
        sending.value = left.length;
        await sleep(WEAK_DELAY_MS);
        if (!isWeak()) continue;
        const [k, e] = left[0];
        const owner = e?.plot ?? DEMO;
        if (k.startsWith('packet-')) {
          await append({ type: 'sync', simT: t.value, data: { photoIds: [], packet: reduce(logs.value[owner] ?? [], Infinity).seal?.packetHash, stage: 'hash' } }, owner, true);
          await dbDel('outbox', k);
        } else {
          await append({ type: 'sync', simT: t.value, data: { photoIds: [k], stage: 'hash' } }, owner, true);
          await dbSet('outbox', k, { ...e, hashSent: true });
        }
        continue;
      }
      sending.value = entries.length;
      // every farmer's queue goes to that farmer's own log
      const owners = new Set(entries.map(([, e]) => e?.plot ?? DEMO));
      for (const owner of owners) {
        const mine = entries.filter(([, e]) => (e?.plot ?? DEMO) === owner).map(([k]) => k);
        const ids = mine.filter((k) => k.startsWith('ph-'));
        const seal = reduce(logs.value[owner] ?? [], Infinity).seal;
        const packet = mine.some((k) => k.startsWith('packet-')) && seal ? seal.packetHash : undefined;
        await append({ type: 'sync', simT: t.value, data: { photoIds: ids, packet, stage: 'full' } }, owner, true);
      }
      await dbClear('outbox');
      return;
    }
  } finally {
    syncing = false;
    sending.value = 0;
  }
}

export const recordRef = (ref: string) => append({ type: 'ref', simT: t.value, data: { ref: ref.trim().toUpperCase() } });
export const reportNoDamage = (undo = false) => append({ type: 'no_damage', simT: t.value, data: { undo } });
export const recordConsent = (c: Consent) => append({ type: 'consent', simT: t.value, data: c });
/** Attach the sealed packet to the published draft list (relief rail). Saboot never resolves it: the officer does, outside Saboot. */
export async function fileObjection() {
  const v = view.value;
  if (!v.seal || v.objection) return;
  await append({ type: 'objection', simT: t.value, data: { packetHash: v.seal.packetHash } });
}

export const policyNo = (plotId: string) => `SIM-KSG-26-${plotId.replace('P-', '0')}17`;

/** Scripted catch-up so presenter jumps always land on a complete story. Real user data is kept. */
/** Scripted timings (hours). capture/seal/ref are after the focus alert; ack/survey after the reference is saved. */
/** Scripted timings of the simulated people around the farmer (hours). Simulated, not rules and not real service levels. */
export const SCRIPT = { capture: 3, seal: 3.1, ref: 5.1, ackDue: 48, escalate: 72, ack: 70, survey: 30, objectionResponse: 20 };

export async function ensureFocus(stage: 'captured' | 'sealed' | 'filed') {
  if (!loaded) await loadFocus();
  const d = focusDet.value;
  if (!d || d.alertT === null) return;
  const back = t.value;
  // Run scripted actions at their scripted time (never before the user's own last action).
  const at = async (offset: number, fn: () => Promise<unknown>) => {
    const c = chain.value;
    const lastT = c.length ? c[c.length - 1].body.simT : 0;
    t.value = Math.max(d.alertT! + offset, lastT + 0.02);
    await fn();
  };
  try {
    const helper = full.value.consent?.helper;
    for (const k of SHOTS) {
      if (!full.value.shots[k]) await at(SCRIPT.capture + SHOTS.indexOf(k) * 0.02, () => addSyntheticShot(k, helper));
    }
    if (stage === 'captured') return;
    if (full.value.queued && network.value === 'online') await at(SCRIPT.seal - 0.05, syncOutbox);
    if (!full.value.seal) await at(SCRIPT.seal, seal);
    if (stage === 'sealed') return;
    if (!full.value.ref) await at(SCRIPT.ref, () => recordRef('SIM-REF-' + (4000 + Math.floor(d.alertT! * 37) % 900)));
  } finally {
    t.value = back;
  }
}

export const lastEventHash = computed(() => {
  const e = view.value.events;
  return e.length ? e[e.length - 1].hash : null;
});
