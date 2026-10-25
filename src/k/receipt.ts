// Feature K over the venue Wi-Fi (optional): send the signed code to the demo laptop this page was opened from, and on the
// laptop list what it received (scripts/receipt-server.mjs). Everything here runs only when prefs.receiver is on; the
// receiver is this page's origin, so every address is relative. Nothing is queued unless the person tapped.
import { effect, signal } from '@preact/signals';
import { dbGet, dbSet } from '../lib/db';
import { isOffline } from '../farmer/focus';

export interface SendEntry { code: string; plot: string; queuedAt: number; /** the laptop's clock when it took the code; null until it has */ receivedAt: number | null }
export interface Receipt { code: string; receivedAt: number }

const KEY = 'k-send-queue';
/** Every code the person asked to send from this phone, with the laptop's receipt time once it answered. */
export const sends = signal<SendEntry[]>([]);
export const sending = signal(false);
/** The last try reached no laptop; the next reconnect or tick tries again. */
export const failed = signal(false);
/** What the laptop holds (the laptop's console reads this). */
export const receipts = signal<Receipt[]>([]);

let loaded = false;
export async function loadSends() {
  if (loaded) return;
  sends.value = (await dbGet<SendEntry[]>('kv', KEY)) ?? [];
  loaded = true;
}
const save = () => dbSet('kv', KEY, sends.value);
export const sendOf = (code: string) => sends.value.find((e) => e.code === code) ?? null;

async function postReceipt(code: string): Promise<number> {
  const r = await fetch('receipt', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code }) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return ((await r.json()) as { receivedAt: number }).receivedAt;
}

/** Post every code the laptop has not taken yet. Stops at the first failure; a reconnect or the next tick tries again. */
export async function flushSends() {
  if (sending.value || isOffline()) return;
  sending.value = true;
  try {
    await loadSends();
    for (const e of sends.value) {
      if (e.receivedAt !== null) continue;
      try {
        const at = await postReceipt(e.code);
        sends.value = sends.value.map((x) => (x.code === e.code ? { ...x, receivedAt: at } : x));
        await save();
      } catch {
        failed.value = true;
        return;
      }
    }
    failed.value = false;
  } finally {
    sending.value = false;
  }
}

/** Remember the code (once) and try at once. The person tapped: that is the only way a code is ever sent. */
export async function queueSend(code: string, plot: string) {
  await loadSends();
  if (!sendOf(code)) {
    sends.value = [...sends.value, { code, plot, queuedAt: Date.now(), receivedAt: null }];
    await save();
  }
  await flushSends();
}

/** Once per page load when the receiver pref is on: send what is waiting now, on every reconnect, and every 10 s while a send is unanswered. */
export function watchSends() {
  // the flush runs outside the effect: called inside it, its first read of `sending` would subscribe the effect to a signal
  // the flush itself flips, and the two would chase each other for ever
  const stop = effect(() => { if (!isOffline()) setTimeout(() => void flushSends(), 0); });
  const id = setInterval(() => { if (sends.value.some((e) => e.receivedAt === null)) void flushSends(); }, 10_000);
  return () => { stop(); clearInterval(id); };
}

export async function listReceipts(): Promise<Receipt[]> {
  // a POST on purpose: the service worker caches a same-origin GET and would serve a stale list
  const r = await fetch('receipts', { method: 'POST' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return ((await r.json()) as { receipts: Receipt[] }).receipts;
}

/** The laptop's console keeps `receipts` fresh while it is open. Returns the stop function. */
export function startReceiptPoll(ms = 3000) {
  const tick = async () => { try { receipts.value = await listReceipts(); } catch { /* the receiver is not running: the list stays as it was */ } };
  void tick();
  const id = setInterval(tick, ms);
  return () => clearInterval(id);
}
