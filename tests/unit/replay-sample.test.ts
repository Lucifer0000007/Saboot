// The pure parts of the replay sampler (scripts/replay/sample.ts) on a tiny made-up extent, with no files and no network: grid
// points, the three-way labelling, a reproducible sample, river reach and the windows taken from day D.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gridInside, classify, pickSample, reachOf, windows, METHOD, RIVERS, type GridPoint } from '../../scripts/replay/sample.ts';
import { PolygonIndex, type Polygon } from '../../scripts/replay/geo.ts';

const outline: Polygon = [[[73.005, 31.005], [73.055, 31.005], [73.055, 31.055], [73.005, 31.055], [73.005, 31.005]]];

test('grid points inside an outline come in a fixed order, south to north and then west to east', () => {
  const g = gridInside(outline, 0.01);
  assert.equal(g.length, 25);
  assert.deepEqual(g[0], { lat: 31.01, lon: 73.01 });
  assert.deepEqual(g[1], { lat: 31.01, lon: 73.02 });
  assert.deepEqual(g[24], { lat: 31.05, lon: 73.05 });
});

test('a point is affected inside the extent, not affected well away from it, and dropped within the buffer', () => {
  const extent = new PolygonIndex([[[[73.0, 31.0], [73.02, 31.0], [73.02, 31.02], [73.0, 31.02], [73.0, 31.0]]]]);
  assert.equal(classify({ lat: 31.01, lon: 73.01 }, extent, 1), 'affected');
  assert.equal(classify({ lat: 31.05, lon: 73.05 }, extent, 1), 'not_affected');
  assert.equal(classify({ lat: 31.01, lon: 73.025 }, extent, 1), null, 'about half a kilometre outside the edge');
});

test('the sample takes at most the requested number of each class per area, and the same seed gives the same sample', () => {
  const pts = (n: number, base: number): GridPoint[] => Array.from({ length: n }, (_, i) => ({ lat: base + i / 100, lon: 73 }));
  const cand = new Map([[1, { affected: pts(50, 31), notAffected: pts(10, 32) }], [2, { affected: pts(3, 33), notAffected: pts(40, 34) }]]);
  const a = pickSample(cand, [1, 2], 30, 838), b = pickSample(cand, [1, 2], 30, 838);
  assert.deepEqual(a, b);
  const count = (area: number, cls: string) => a.filter((p) => p.area === area && p.class === cls).length;
  assert.equal(count(1, 'affected'), 30);
  assert.equal(count(1, 'not_affected'), 10, 'fewer than asked: all of them');
  assert.equal(count(2, 'affected'), 3);
  assert.equal(count(2, 'not_affected'), 30);
  assert.notDeepEqual(pickSample(cand, [1, 2], 30, 839), a, 'another seed, another sample');
  assert.equal(new Set(a.map((p) => `${p.area},${p.lat},${p.lon}`)).size, a.length, 'no point is taken twice');
});

test('a river point is in reach within 48 km, with the lag at 4 km/h, and out of reach beyond it', () => {
  const r = RIVERS[0];
  assert.deepEqual(reachOf(r.lat, r.lon), [{ id: r.id, lagH: 0 }]);
  const near = reachOf(r.lat + 0.18, r.lon); // about 20 km north
  assert.equal(near.length, 1);
  assert.ok(near[0].lagH > 4.5 && near[0].lagH < 5.5, String(near[0].lagH));
  assert.deepEqual(reachOf(r.lat + 1, r.lon), [], 'about 110 km away');
  assert.equal(METHOD.reachKm / METHOD.waveKmh, 12, 'the farthest reach is exactly the app’s longest lag');
});

test('the windows follow from the activation’s event time and do not depend on a hand-written date', () => {
  const w = windows('2025-08-29T12:00:00');
  assert.equal(w.D, '2025-08-29');
  assert.deepEqual(w.event, ['2025-08-20T00:00:00Z', '2025-09-04T00:00:00Z']);
  assert.deepEqual(w.quiet, ['2025-05-01T00:00:00Z', '2025-05-15T00:00:00Z']);
  assert.deepEqual(w.baseline, ['2025-05-02', '2025-07-30']);
});
