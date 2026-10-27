// Packets imported on the laptop (feature K). Kept in IndexedDB so a reload keeps them; shared with the
// dashboard (map badge, list row) and the audit ledger (records that the tamper test can alter).
import { signal } from '@preact/signals';
import { dbGet, dbSet } from '../lib/db';
import type { KKind, KPayload } from './payload';

export interface Imported extends KPayload { code: string; importedAt: number }
export const imported = signal<Imported[]>([]);
let loaded = false;

export async function loadImported() {
  if (loaded) return;
  loaded = true;
  imported.value = (await dbGet<Imported[]>('kv', 'k-imported')) ?? [];
}

/** What a packet says about itself: every part live, any part simulated, any part entered by hand, or nothing recorded. */
export function importedOrigin(k: KPayload): 'live' | 'sim' | 'hand' | 'unrecorded' {
  const all = k.shots.flatMap((s) => [s.photo, s.loc]);
  if (all.includes('sim')) return 'sim';
  if (all.includes('hand')) return 'hand';
  return all.every((o) => o === 'live') ? 'live' : 'unrecorded';
}
const WORDS = { live: 'live', sim: 'simulated', hand: 'entered by hand', unrecorded: 'origin not recorded' };
export const importedLabel = (k: KPayload) => `Imported (${WORDS[importedOrigin(k)]})`;

/**
 * Live-camera photos whose fingerprint (SHA-256) is also in a packet already imported for a DIFFERENT plot: the same file
 * sealed for two plots. A flag for the officer to ask about, not a finding. Simulated photos are left out on purpose (the demo's
 * simulated photos repeat across plots), and so is the same plot sealed again (a farmer may seal the same photos twice).
 */
export function photoReuse(p: KPayload, others: readonly KPayload[]): { kind: KKind; plot: string }[] {
  const out: { kind: KKind; plot: string }[] = [];
  for (const s of p.shots) {
    if (s.photo !== 'live') continue;
    const hit = others.find((o) => o.head !== p.head && o.plot !== p.plot && o.shots.some((x) => x.photo === 'live' && x.sha === s.sha));
    if (hit) out.push({ kind: s.kind, plot: hit.plot });
  }
  return out;
}

/** `importedAt` is when this laptop received the packet (a real wall clock). The same seal imports once. */
export async function addImported(p: KPayload, code: string, importedAt: number = Date.now()) {
  await loadImported();
  if (imported.value.some((x) => x.head === p.head)) return false;
  imported.value = [...imported.value, { ...p, code, importedAt }];
  await dbSet('kv', 'k-imported', imported.value);
  return true;
}

export async function clearImported() {
  imported.value = [];
  await dbSet('kv', 'k-imported', []);
}
