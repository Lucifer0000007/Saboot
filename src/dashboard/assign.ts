// Field-staff assignments on the worklist (audit OF-13): kept in this browser's store, so a reload or a tab switch keeps the
// office's plan, and cleared with the replay reset. A plan for who visits which plot, never a decision about any claim.
import { signal } from '@preact/signals';
import { dbGet, dbSet, dbDel } from '../lib/db';

export const INSPECTORS = ['Inspector A (Kesarpur–Neelkot)', 'Inspector B (Dhanpura–Sarangwal)', 'Inspector C (Ambwali)'];
/** Plot id -> index into INSPECTORS. */
export const assigned = signal<Record<string, number>>({});
const KEY = 'assignments';
let loaded = false;

export async function loadAssignments() {
  if (loaded) return;
  loaded = true;
  const stored = (await dbGet<Record<string, number>>('kv', KEY)) ?? {};
  assigned.value = { ...stored, ...assigned.value };
}

export async function assign(plot: string, who: number | null) {
  const next = { ...assigned.value };
  if (who === null) delete next[plot]; else next[plot] = who;
  assigned.value = next;
  await dbSet('kv', KEY, next);
}

export async function clearAssignments() {
  assigned.value = {};
  await dbDel('kv', KEY);
}
