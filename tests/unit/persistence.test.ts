// The offline queue lives in IndexedDB, which a browser may clear when the phone runs low on space. The app asks for
// persistence when a real photo is taken and tells the farmer when the browser refuses (src/lib/db.ts, FarmerApp.tsx).
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { requestPersistence, storagePersistent } from '../../src/lib/db.ts';
import en from '../../src/i18n/en.ts';
import hi from '../../src/i18n/hi.ts';
import pa from '../../src/i18n/pa.ts';

const stub = (storage: unknown) => Object.defineProperty(globalThis, 'navigator', { value: { storage }, configurable: true });

beforeEach(() => { storagePersistent.value = null; });

test('a refusal is remembered as false, so the farmer is told', async () => {
  stub({ persisted: async () => false, persist: async () => false });
  await requestPersistence();
  assert.equal(storagePersistent.value, false);
});

test('a grant is true, and an already-persistent origin is not asked again', async () => {
  let asked = 0;
  stub({ persisted: async () => false, persist: async () => { asked++; return true; } });
  await requestPersistence();
  assert.equal(storagePersistent.value, true);
  stub({ persisted: async () => true, persist: async () => { asked++; return false; } });
  await requestPersistence();
  assert.equal(storagePersistent.value, true);
  assert.equal(asked, 1);
});

test('a browser that cannot say, or that throws, leaves the answer unknown: no false warning', async () => {
  stub(undefined);
  await requestPersistence();
  assert.equal(storagePersistent.value, null);
  stub({ persisted: async () => { throw new Error('denied'); }, persist: async () => true });
  await requestPersistence();
  assert.equal(storagePersistent.value, null);
});

test('the warning exists in all three languages and the screen shows it only for a refusal with working storage', () => {
  for (const [lang, d] of [['en', en], ['hi', hi], ['pa', pa]] as const) assert.ok(String(d['db.notPersistent']).length > 10, `${lang} db.notPersistent`);
  const app = readFileSync('src/farmer/FarmerApp.tsx', 'utf8');
  assert.match(app, /storageOk\.value && storagePersistent\.value === false/);
});
