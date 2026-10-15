// Packets imported on the laptop (feature K). Kept in IndexedDB so a reload keeps them; shared with the
// dashboard (map badge, list row) and the audit ledger (records that the tamper test can alter).
import { signal } from '@preact/signals';
import { dbGet, dbSet } from '../lib/db';
import type { KPayload } from './payload';

export interface Imported extends KPayload { code: string; importedAt: number }
export const imported = signal<Imported[]>([]);
let loaded = false;

export async function loadImported() {
  if (loaded) return;
  loaded = true;
  imported.value = (await dbGet<Imported[]>('kv', 'k-imported')) ?? [];
}

export async function addImported(p: KPayload, code: string) {
  await loadImported();
  if (imported.value.some((x) => x.head === p.head)) return false;
  imported.value = [...imported.value, { ...p, code, importedAt: Date.now() }];
  await dbSet('kv', 'k-imported', imported.value);
  return true;
}

export async function clearImported() {
  imported.value = [];
  await dbSet('kv', 'k-imported', []);
}
