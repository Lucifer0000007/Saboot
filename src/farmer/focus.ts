// The judge's own farmer (focus plot), and the farmers a helper captures for. Everything they do is an event in an
// append-only, SHA-256 hash-chained device log persisted in IndexedDB: one log per farmer, so each farmer's consent and
// photos are sealed in that farmer's own chain. The visible state at sim time t is a pure reduction of events with
// simT <= t, so scrubbing the replay backwards "un-happens" actions.
import { signal, computed } from '@preact/signals';
import { appendLink, canonical, sha256, type ChainLink } from '../lib/hash';
import { dbGet, dbSet, dbDel, dbClear, dbKeys, requestPersistence } from '../lib/db';
import { network, browserOnline } from '../lib/prefs';
import { t, seek, pause, model, focusPlot, focusDet, toLatLon, activePlotId } from '../sim/engine';
import { syntheticPhoto, type ShotKind, SHOTS } from './photo';
import { imported } from '../k/imported';
import type { Lang } from '../sim/types';

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
/** `lang`: the language of `text`, the one the farmer was read the consent in (older logs have none). */
export interface Consent { farmer: string; helper: string; role: string; method: 'hold' | 'voice'; audioSha?: string; text: string; lang?: Lang }

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
/** The farmer a helper has open, kept beside the session (audit H4). */
const ACTIVE = 'helper-active';
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

/** Remember who the helper is for this session (name and role only; nothing else about them is kept). The replay pauses (H6). */
export async function startHelperSession(s: HelperSession) {
  pause();
  helperSession.value = s;
  await dbSet('kv', SESSION, s);
}
/** End the helper session: the app goes back to the demo farmer. Each farmer's sealed log stays as it is. */
export async function endHelperSession() {
  activePlotId.value = null;
  helperSession.value = null;
  await Promise.all([dbDel('kv', SESSION), dbDel('kv', ACTIVE)]);
}
/** Remember which farmer the helper has open, so a phone that drops the page (its camera app took the memory) comes back
 *  to that farmer, not to the demo farmer (audit H4). null: the helper is on the queue. */
export const keepActive = (id: string | null) => (id ? dbSet('kv', ACTIVE, id) : dbDel('kv', ACTIVE));
export const storedActive = () => dbGet<string>('kv', ACTIVE);

/** Writes one at a time (and across tabs where the browser has Web Locks), so two actions can never overwrite each other. */
let writes: Promise<unknown> = Promise.resolve();
function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = writes.then(() => (typeof navigator !== 'undefined' && navigator.locks ? navigator.locks.request('saboot-log', fn) : fn()));
  writes = run.catch(() => undefined);
  return run as Promise<T>;
}

/** The log as it stands now. Another tab, or this page before it has loaded, may have stored more than memory holds. */
async function currentLog(key: string): Promise<Link[]> {
  const stored = await dbGet<Link[]>('kv', kvKey(key));
  const c = logs.value[key] ?? [];
  return stored && stored.length > c.length ? stored : c;
}

/**
 * Append an event. A log only moves forward: an event that would land before the last one is stamped just after it, so
 * scrubbing the replay back, reloading or reconnecting can never remove sealed evidence. When a person acts while the
 * replay is behind their last action, the replay moves forward to it so they can see what they did. A `passive` event (a
 * sync) never moves the replay.
 */
async function append(next: FocusEvent | ((c: Link[]) => Promise<FocusEvent | null>), key: string = activeKey.value, passive = false) {
  return exclusive(async () => {
    if (!loaded) await loadFocus();
    const c = await currentLog(key);
    // an event built from the log (a seal) is built here, under the lock, from the log it will follow; null writes nothing
    const ev = typeof next === 'function' ? await next(c) : next;
    if (!ev) return null;
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
  await Promise.all([dbDel('kv', KEY), dbDel('kv', IDS), dbDel('kv', SESSION), dbDel('kv', ACTIVE), ...ids.map((id) => dbDel('kv', kvKey(id))), dbClear('photos'), dbClear('outbox')]);
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
  await Promise.all([dbDel('kv', 'k-device-key'), dbDel('kv', 'k-imported'), dbDel('kv', 'k-send-queue')]);
}

/**
 * One farmer's copy: that farmer's own log (consent, photo fingerprints, seal) and nothing about anyone else. What a helper
 * hands over when one farmer asks (as.means3, audit H10). Photos are not in it: they stay on the phone.
 */
export function exportFarmerData(key: string) {
  return {
    kind: 'saboot.farmer-export',
    v: 1,
    simulation: true,
    note: 'One farmer’s log from this phone in the Saboot simulation: their consent, photo fingerprints and seal. Photos are not included; they stay on the phone. Nothing was uploaded.',
    plot: key,
    log: logs.value[key] ?? [],
  };
}

/** Delete one farmer's log, photos, spoken consent and queued items from this phone. Every other farmer's evidence stays. */
export async function deleteFarmerData(key: string) {
  await exclusive(async () => {
    const owned = (c: Link[]) => c.flatMap((l) => {
      const e = l.body;
      if (e.type === 'shot') return [e.data.photoId];
      if (e.type === 'consent' && e.data.audioSha) return ['consent-' + e.data.audioSha.slice(0, 16)];
      return [];
    });
    // the same photo file can sit in two farmers' logs (it is flagged as reused): it stays while another log holds it
    const others = new Set(Object.entries(logs.value).filter(([k]) => k !== key).flatMap(([, c]) => owned(c)));
    const mine = owned(await currentLog(key)).filter((id) => !others.has(id));
    const rest = { ...logs.value };
    delete rest[key];
    logs.value = rest;
    for (const id of mine) { const u = photoUrls.get(id); if (u) URL.revokeObjectURL(u); photoUrls.delete(id); }
    const queued = await Promise.all((await dbKeys('outbox')).map(async (k) => [k, await dbGet<OutboxEntry>('outbox', k)] as const));
    const sends = (await dbGet<{ plot: string }[]>('kv', 'k-send-queue')) ?? [];
    await Promise.all([
      dbDel('kv', kvKey(key)),
      dbSet('kv', IDS, Object.keys(rest).filter((k) => k !== DEMO)),
      dbSet('kv', 'k-send-queue', sends.filter((s) => s.plot !== key)),
      ...mine.map((id) => dbDel('photos', id)),
      ...queued.filter(([, e]) => e?.plot === key).map(([k]) => dbDel('outbox', k)),
    ]);
  });
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

/** How long a photo waits for a location before the person is asked to turn location on. */
const GEO_WAIT_MS = 3500;

/** A fix is reused for a photo while it is younger than this. */
const FIX_MAX_AGE_MS = 60000;
let lastFix: { geo: Geo; at: number } | null = null;
const freshFix = () => (lastFix && Date.now() - lastFix.at < FIX_MAX_AGE_MS ? lastFix.geo : null);
const keepFix = (p: GeolocationPosition): Geo => {
  const geo: Geo = { lat: +p.coords.latitude.toFixed(6), lon: +p.coords.longitude.toFixed(6), acc: Math.round(p.coords.accuracy), src: 'gps' };
  lastFix = { geo, at: Date.now() };
  return geo;
};

/**
 * Listen for the phone's location while the camera screen is open. A cold GPS fix outdoors, or a permission prompt still on
 * screen, takes longer than a photo can wait; this way the fix is usually there by the time the photo is taken. Returns the stop.
 */
export function watchGeo(): () => void {
  if (!('geolocation' in navigator)) return () => {};
  const id = navigator.geolocation.watchPosition(keepFix, () => {}, { enableHighAccuracy: true, maximumAge: FIX_MAX_AGE_MS });
  return () => navigator.geolocation.clearWatch(id);
}

/**
 * The phone's location for a photo: a recent fix, else a precise one, else a coarse (network) one. null when the phone gives
 * none (location off, refused, or not found in time): the camera screen then asks the person to turn it on, and never puts a
 * made-up location on a real photo without saying so (audit F6).
 */
export function getGeo(): Promise<Geo | null> {
  const recent = freshFix();
  if (recent) return Promise.resolve(recent);
  return new Promise((res) => {
    if (!('geolocation' in navigator)) return res(null);
    let over = false;
    const done = (g: Geo | null) => { if (!over) { over = true; clearTimeout(timer); res(g); } };
    // a fix the watch delivers while this waits counts too
    const timer = setTimeout(() => done(freshFix()), GEO_WAIT_MS);
    const ok = (p: GeolocationPosition) => done(keepFix(p));
    const coarse = () => navigator.geolocation.getCurrentPosition(ok, () => done(freshFix()), { enableHighAccuracy: false, timeout: GEO_WAIT_MS - 500, maximumAge: FIX_MAX_AGE_MS });
    navigator.geolocation.getCurrentPosition(ok, (e) => (e.code === e.PERMISSION_DENIED ? done(null) : coarse()), { enableHighAccuracy: true, timeout: GEO_WAIT_MS - 1500, maximumAge: FIX_MAX_AGE_MS });
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

/** A helper acts for a farmer only once that farmer has agreed. */
export class ConsentMissing extends Error {
  override name = 'ConsentMissing';
  constructor() { super('The farmer has not agreed yet.'); }
}

/** In helper mode, real photos and a seal need the consent recorded in that farmer's own log. The demo farmer acts for themself. */
async function requireConsent(key: string) {
  if (key !== DEMO && !reduce(await currentLog(key), Infinity).consent) throw new ConsentMissing();
}

export async function addShot(kind: ShotKind, blob: Blob, w: number, h: number, geo: Geo, synthetic: boolean, helper?: string) {
  // the farmer this photo is for is fixed now: moving on to another farmer while it is saved must not move the photo
  const key = activeKey.value;
  // no photo after the seal, even with the replay scrubbed back to before it: the packet would not hold it (FARM-01)
  if (reduce(await currentLog(key), Infinity).seal) throw new Error('Already sealed.');
  if (!synthetic) await requireConsent(key);
  busy.value = true;
  // ask the browser to keep what is captured when storage runs low; if it refuses, the farmer is told (FarmerApp). A
  // simulated photo stores nothing that matters, so it never asks.
  if (!synthetic) void requestPersistence();
  try {
    const sha = await sha256(blob);
    const photoId = 'ph-' + sha.slice(0, 16);
    await dbSet('photos', photoId, blob);
    const queued = isOffline() || isWeak();
    if (queued) await dbSet('outbox', photoId, { kind: 'photo', id: photoId, simT: t.value, plot: key });
    await append({ type: 'shot', simT: t.value, data: { kind, photoId, sha, bytes: blob.size, w, h, geo, synthetic, helper, queued } }, key);
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
  const key = activeKey.value;
  const f = full.value;
  if (!f.shotCount || f.seal) return;
  if (Object.values(f.shots).some((s) => s && !s.synthetic)) await requireConsent(key);
  busy.value = true;
  try {
    // The packet covers the whole log, not what the replay shows at t: after a scrub back it still holds every photo, and
    // its prev is the head the seal actually follows.
    await append(async (c) => {
      const v = reduce(c, Infinity);
      if (!v.shotCount || v.seal) return null;
      const body = packetBody(v);
      const packetHash = await sha256(canonical(body));
      const queued = isOffline() || isWeak();
      if (queued) await dbSet('outbox', 'packet-' + packetHash.slice(0, 12), { kind: 'packet', simT: t.value, plot: key });
      return { type: 'seal', simT: t.value, data: { packetHash, shots: body.shots.map((s) => s.sha256), queued, deviceMs: Date.now() } };
    }, key);
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
          await append({ type: 'sync', simT: t.value, data: { photoIds: [], packet: reduce(await currentLog(owner), Infinity).seal?.packetHash, stage: 'hash' } }, owner, true);
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
        // not from memory alone: a sync can start at page load, or in a second tab, before this page holds the sealed log
        const seal = reduce(await currentLog(owner), Infinity).seal;
        const packet = mine.some((k) => k.startsWith('packet-')) && seal ? seal.packetHash : undefined;
        await append({ type: 'sync', simT: t.value, data: { photoIds: ids, packet, stage: 'full' } }, owner, true);
      }
      // only what was sent: a photo or seal queued while this sync ran stays queued, and goes out on the next pass
      await Promise.all(keys.map((k) => dbDel('outbox', k)));
    }
  } finally {
    syncing = false;
    sending.value = 0;
  }
}

export const recordRef = (ref: string) => append({ type: 'ref', simT: t.value, data: { ref: ref.trim().toUpperCase() } });
/** A helper records "no damage" for a farmer only once that farmer has agreed, as for photos (audit CC-02). */
export async function reportNoDamage(undo = false) {
  const key = activeKey.value;
  if (!undo) await requireConsent(key);
  return append({ type: 'no_damage', simT: t.value, data: { undo } }, key);
}
/** `key`: the farmer whose consent this is, fixed when the hold or the recording began (audit CC-05). */
export const recordConsent = (c: Consent, key: string = activeKey.value) => append({ type: 'consent', simT: t.value, data: c }, key);
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

let ensuring: Promise<unknown> = Promise.resolve();
/**
 * One catch-up at a time: two jumps at once (a double tap, a presenter key pressed twice) would each add the same photos.
 * The script only ever writes to the demo farmer's log: a jump or a tour step while a helper is acting for a farmer first
 * goes back to the demo farmer, so no scripted photo lands in a real farmer's log without their consent (audit CC-01).
 * `helped` is for the QA helper demo alone, which records each farmer's consent before it catches up for them.
 */
export function ensureFocus(stage: 'captured' | 'sealed' | 'filed', helped = false): Promise<void> {
  if (!helped) activePlotId.value = null;
  const run = ensuring.then(() => catchUp(stage));
  ensuring = run.catch(() => undefined);
  return run;
}

async function catchUp(stage: 'captured' | 'sealed' | 'filed') {
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
