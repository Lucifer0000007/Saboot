// A real photo on a real phone gets the phone's location (October audit CC-08). A cold GPS fix, or a permission prompt still on
// screen, takes longer than a photo can wait: the camera screen now listens for the location while it is open, and a photo
// falls back to a coarse (network) fix. With no fix at all it gives none, and the camera screen asks the person (audit F6).
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rawScenario } from '../../src/sim/engine.ts';
import { getGeo, watchGeo } from '../../src/farmer/focus.ts';
import type { ScenarioRaw } from '../../src/sim/types.ts';

rawScenario.value = JSON.parse(readFileSync(new URL('../../public/data/flood-replay.json', import.meta.url), 'utf8')) as ScenarioRaw;

// a stand-in for the phone's location service
function stubGeo(api: Partial<Geolocation>) {
  Object.defineProperty(globalThis.navigator, 'geolocation', { value: api, configurable: true });
}
const pos = (lat: number, lon: number) => ({ coords: { latitude: lat, longitude: lon, accuracy: 20 } }) as GeolocationPosition;
const timeout = { code: 3, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: 'timeout' } as GeolocationPositionError;

test('CC-08: a fix the phone found while the camera screen was open is used for the photo, even when a new fix would be slow', async () => {
  let cleared = false;
  stubGeo({
    watchPosition: (ok) => { ok(pos(30.91, 75.81)); return 7; },
    clearWatch: (id) => { cleared = id === 7; },
    getCurrentPosition: () => {}, // a cold GPS: never answers within the wait
  });
  const stop = watchGeo();
  const g = await getGeo();
  stop();
  assert.equal(g?.src, 'gps');
  assert.equal(g?.lat, 30.91);
  assert.ok(cleared, 'leaving the screen stops the watch');
});

test('CC-08: when the precise fix times out, a coarse (network) fix is used before giving up', async () => {
  // the fix from the test above is now old
  mock.timers.enable({ apis: ['Date'], now: Date.now() + 5 * 60_000 });
  try {
    stubGeo({
      getCurrentPosition: (ok, fail, o) => (o?.enableHighAccuracy ? fail!(timeout) : ok(pos(30.92, 75.82))),
    });
    const g = await getGeo();
    assert.equal(g?.src, 'gps');
    assert.equal(g?.lat, 30.92);
  } finally {
    mock.timers.reset();
  }
});

test('F6: a refused location gives no location, so the camera screen can ask: a real photo is never given a made-up one', async () => {
  mock.timers.enable({ apis: ['Date'], now: Date.now() + 10 * 60_000 });
  try {
    stubGeo({ getCurrentPosition: (_ok, fail) => fail!({ ...timeout, code: 1 }) });
    assert.equal(await getGeo(), null);
  } finally {
    mock.timers.reset();
  }
});

test('F6: a phone with no location service gives no location either', async () => {
  mock.timers.enable({ apis: ['Date'], now: Date.now() + 20 * 60_000 });
  try {
    // the property must be absent, as on a page without location
    delete (globalThis.navigator as { geolocation?: unknown }).geolocation;
    assert.equal(await getGeo(), null);
  } finally {
    mock.timers.reset();
  }
});
