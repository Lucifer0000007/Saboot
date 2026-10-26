// Objection responses the officer notes by hand (audit OF-05): only THAT a response was given, outside Saboot, and when (the
// replay time). Never what it said and never an outcome. Kept in this browser's store, cleared with the replay reset.
import { signal } from '@preact/signals';
import { dbGet, dbSet, dbDel } from '../lib/db';

/** Plot id -> replay hour at which the officer noted a response. */
export const noted = signal<Record<string, number>>({});
const KEY = 'obj-responses';
let loaded = false;

export async function loadNoted() {
  if (loaded) return;
  loaded = true;
  noted.value = { ...((await dbGet<Record<string, number>>('kv', KEY)) ?? {}), ...noted.value };
}

export async function noteResponse(plot: string, atHour: number) {
  noted.value = { ...noted.value, [plot]: atHour };
  await dbSet('kv', KEY, noted.value);
}

export async function clearNoted() {
  noted.value = {};
  await dbDel('kv', KEY);
}
