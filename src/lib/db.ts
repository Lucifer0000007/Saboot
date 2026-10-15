// Tiny IndexedDB wrapper. Stores: kv (JSON state), photos (Blobs), outbox (queued uploads).
// Falls back to memory when IndexedDB is unavailable (private mode, old browsers).

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
      })
  );
}

export async function dbGet<T>(store: Store, key: string): Promise<T | undefined> {
  try { return await tx<T>(store, 'readonly', (s) => s.get(key)); }
  catch { return mem[store].get(key) as T | undefined; }
}
export async function dbSet(store: Store, key: string, val: unknown): Promise<void> {
  try { await tx(store, 'readwrite', (s) => s.put(val, key)); }
  catch { mem[store].set(key, val); }
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
