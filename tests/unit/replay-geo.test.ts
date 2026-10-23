// The geometry the replay samples with (scripts/replay/geo.ts): reproducible sampling, points in and near polygons, and the rain
// cell a point falls in. No network and no files: a tiny made-up square stands in for a flood extent.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32, shuffle, pointInPolygon, distToSegmentKm, PolygonIndex, parseWktPolygon, era5Cell, percentile, haversineKm, type Polygon } from '../../scripts/replay/geo.ts';

const square: Polygon = [[[73.0, 31.0], [73.1, 31.0], [73.1, 31.1], [73.0, 31.1], [73.0, 31.0]]];

test('the same seed gives the same numbers and the same shuffle', () => {
  const a = mulberry32(838), b = mulberry32(838);
  const xs = [a(), a(), a()], ys = [b(), b(), b()];
  assert.deepEqual(xs, ys);
  assert.ok(xs.every((x) => x >= 0 && x < 1));
  assert.notEqual(mulberry32(839)(), xs[0], 'another seed gives another sequence');
  assert.deepEqual(shuffle([1, 2, 3, 4, 5, 6, 7, 8], mulberry32(838)), shuffle([1, 2, 3, 4, 5, 6, 7, 8], mulberry32(838)));
  assert.deepEqual([...shuffle([1, 2, 3, 4, 5, 6, 7, 8], mulberry32(838))].sort(), [1, 2, 3, 4, 5, 6, 7, 8], 'a shuffle only reorders');
  // pinned: if the generator ever changed, every sample in the replay would change with it
  assert.deepEqual(xs.map((x) => Math.round(x * 1e6) / 1e6), [0.749649, 0.111404, 0.846999]);
});

test('a point is inside a polygon, outside it, or in a hole', () => {
  assert.equal(pointInPolygon(73.05, 31.05, square), true);
  assert.equal(pointInPolygon(73.2, 31.05, square), false);
  const donut: Polygon = [...square, [[73.04, 31.04], [73.06, 31.04], [73.06, 31.06], [73.04, 31.06], [73.04, 31.04]]];
  assert.equal(pointInPolygon(73.05, 31.05, donut), false, 'in the hole');
  assert.equal(pointInPolygon(73.02, 31.02, donut), true);
});

test('the distance to a segment is in kilometres, along the segment or to its end', () => {
  // 0.01 degree of latitude is 1.1057 km
  assert.ok(Math.abs(distToSegmentKm(73.05, 31.11, [73.0, 31.1], [73.1, 31.1]) - 1.1057) < 0.01);
  // past the end of the segment, the distance is to the end point
  const d = distToSegmentKm(73.2, 31.1, [73.0, 31.1], [73.1, 31.1]);
  assert.ok(Math.abs(d - haversineKm([73.2, 31.1], [73.1, 31.1])) < 0.2, String(d));
  assert.equal(distToSegmentKm(73.05, 31.1, [73.0, 31.1], [73.1, 31.1]), 0);
});

test('the polygon index finds containment and nearness to an edge, and misses what is far', () => {
  const idx = new PolygonIndex([square]);
  assert.equal(idx.contains(73.05, 31.05), true);
  assert.equal(idx.contains(73.15, 31.05), false);
  assert.equal(idx.withinKmOfEdge(73.105, 31.05, 1), true, '0.5 km outside the east edge');
  assert.equal(idx.withinKmOfEdge(73.05, 31.05, 1), false, 'the middle of the square is 5 km from every edge');
  assert.equal(idx.withinKmOfEdge(73.12, 31.05, 1), false, '2 km outside');
  assert.equal(idx.withinKmOfEdge(73.0995, 31.05, 1), true, 'just inside the edge also counts');
});

test('a WKT outline and the ERA5 cell of a point', () => {
  const p = parseWktPolygon('POLYGON ((73 31, 73.5 31, 73.5 31.5, 73 31.5, 73 31))');
  assert.equal(p[0].length, 5);
  assert.equal(pointInPolygon(73.25, 31.25, p), true);
  assert.throws(() => parseWktPolygon('MULTIPOLYGON (((1 1)))'));
  assert.deepEqual(era5Cell(31.3, 73.6), { lat: 31.25, lon: 73.5 });
  assert.deepEqual(era5Cell(31.38, 73.62), { lat: 31.5, lon: 73.5 });
});

test('a percentile interpolates between ranks', () => {
  assert.equal(percentile([1, 2, 3, 4, 5], 0.5), 3);
  assert.equal(percentile([10, 20], 0.5), 15);
  assert.equal(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.9), 9.1);
  assert.equal(percentile([7], 0.9), 7);
});
