// Tiny IndexedDB wrapper. Stores: kv (JSON state), photos (Blobs), outbox (queued uploads).
// Falls back to memory when IndexedDB is unavailable (private mode, old browsers).

import { signal } from '@preact/signals';

/** False once something had to be kept only in memory because the browser would not store it: the person must be told. */
export const storageOk = signal(true);

/** True once the browser has promised to keep what is stored, false when it refused (it may clear photos if the phone runs
 * low on space), null until asked or when the browser cannot say. The person is told when it is false. */
export const storagePersistent = signal<boolean | null>(null);

/** Ask the browser to keep the stored photos (no prompt on most browsers) and remember its answer. */
export async function requestPersistence(): Promise<void> {
  try {
    const sm = navigator.storage;
    if (!sm?.persist) return;
    storagePersistent.value = (await sm.persisted?.()) || (await sm.persist());
  } catch {
    /* the answer is only a hint; the offline queue works without it */
  }
}

type Store = 'kv' | 'photos' | 'outbox';
const mem: Record<Store, Map<string, unknown>> = { kv: new Map(), photos: new Map(), outbox: new Map() };
let dbp: Promise<IDBDatabase | null> | null = null;

function open(): Promise<IDBDatabase | null> {
  if (dbp) return dbp;
  dbp = new Promise((res) => {
    try {
      const r = indexedDB.open('saboot', 1);
      r.onupgradeneeded = () => {
        for (const s of ['kv', 'photos', 'outbox']) if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s);
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => res(null);
      r.onblocked = () => res(null);
    } catch {
      res(null);
    }
  });
  return dbp;
}

function tx<T>(store: Store, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((res, rej) => {
        if (!db) return rej(new Error('no-idb'));
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        t.oncomplete = () => res(req.result as T);
        t.onerror = () => rej(t.error);
        // a transaction the browser abandons (the storage is full) must settle, or the caller waits for ever
        t.onabort = () => rej(t.error ?? new Error('aborted'));
      })
  );
}

export async function dbGet<T>(store: Store, key: string): Promise<T | undefined> {
  try { return await tx<T>(store, 'readonly', (s) => s.get(key)); }
  catch { return mem[store].get(key) as T | undefined; }
}
export async function dbSet(store: Store, key: string, val: unknown): Promise<void> {
  try { await tx(store, 'readwrite', (s) => s.put(val, key)); }
  catch { mem[store].set(key, val); storageOk.value = false; }
}
export async function dbDel(store: Store, key: string): Promise<void> {
  try { await tx(store, 'readwrite', (s) => s.delete(key)); }
  catch { mem[store].delete(key); }
}
export async function dbKeys(store: Store): Promise<string[]> {
  try { return (await tx<IDBValidKey[]>(store, 'readonly', (s) => s.getAllKeys())).map(String); }
  catch { return [...mem[store].keys()]; }
}
export async function dbClear(store: Store): Promise<void> {
  try { await tx(store, 'readwrite', (s) => s.clear()); }
  catch { mem[store].clear(); }
}
