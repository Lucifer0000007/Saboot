// Privacy by construction (docs/PRIVACY-AND-CONSENT.md): what the shareable packet can hold, what an export of the
// phone's data holds, and that the consent words the document quotes are the words the app shows, in all three languages.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeCode, newDeviceKey, verifyCode } from '../../src/k/payload.ts';
import { makeBundle, bundleJson } from '../../src/k/bundle.ts';
import { exportMyData, logs, helperSession, DEMO, type Link } from '../../src/farmer/focus.ts';
import { appendLink } from '../../src/lib/hash.ts';
import en from '../../src/i18n/en.ts';
import hi from '../../src/i18n/hi.ts';
import pa from '../../src/i18n/pa.ts';

const doc = readFileSync('docs/PRIVACY-AND-CONSENT.md', 'utf8');

test('the shareable packet rounds the position to 0.001 degrees, about 100 m, whatever the phone measured', async () => {
  const code = await makeCode(
    { plot: 'P-05', eventT: 11, sealT: 18.9, deviceMs: 0, lat: 30.1234567, lon: 75.9876543, shots: [{ kind: 'wide', simT: 18.8, sha: 'ab'.repeat(32) }] },
    await newDeviceKey(),
  );
  const r = await verifyCode(code);
  assert.equal(r.ok, true);
  assert.equal(r.payload!.lat, 30.123);
  assert.equal(r.payload!.lon, 75.988);
  const bundle = makeBundle(code, r.payload!);
  assert.deepEqual(bundle.decoded.location, { lat: 30.123, lon: 75.988, roundedTo: '0.001 degrees, about 100 m' });
  // nothing finer than three decimals is anywhere in the exported text
  assert.ok(!/\b(30\.1234|75\.9876)/.test(bundleJson(bundle)));
});

test('the packet holds no name, no phone number and no photo, only a plot number, rounded place, times and fingerprints', async () => {
  const code = await makeCode(
    { plot: 'P-05', eventT: 11, sealT: 18.9, deviceMs: 1, lat: 30.1, lon: 75.9, shots: [{ kind: 'wide', simT: 18.8, sha: 'cd'.repeat(32) }] },
    await newDeviceKey(),
  );
  const bytes = Buffer.from(code.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  // 19 + 35 for one photo + 32 head + 33 key + 64 signature: a fixed, small size with no room for free text
  assert.equal(bytes.length, 19 + 35 + 32 + 33 + 64);
});

test('a copy of the phone’s data holds the logs and the helper session, and says photos are not in it', async () => {
  const chain: Link[] = [];
  chain.push(await appendLink(chain, { type: 'consent', simT: 18, data: { farmer: 'A Farmer', helper: 'A Helper', role: 'Sarpanch', method: 'hold', text: 'I agree.' } }));
  chain.push(await appendLink(chain, { type: 'shot', simT: 19, data: { kind: 'wide', photoId: 'ph-1', sha: 'ef'.repeat(32), bytes: 10, w: 1, h: 1, geo: { lat: 30.123456, lon: 75.123456, acc: 8, src: 'sim' }, synthetic: true, helper: 'A Helper', queued: false } }));
  logs.value = { [DEMO]: [], 'P-05': chain };
  helperSession.value = { name: 'A Helper', role: 'Sarpanch' };
  try {
    const copy = exportMyData();
    assert.equal(copy.kind, 'saboot.device-export');
    assert.equal(copy.simulation, true);
    assert.match(copy.note, /Photos are not included/);
    assert.deepEqual(Object.keys(copy.logs).sort(), ['P-05', 'demo-farmer']);
    assert.equal(copy.logs['P-05'].length, 2);
    assert.equal(copy.helperSession?.name, 'A Helper');
    // the copy is the person's own data on their own phone, so it is complete; the photo file itself is never in it
    const text = JSON.stringify(copy);
    assert.ok(!/data:image|base64,/.test(text));
    assert.ok(text.includes('"photoId":"ph-1"'), 'the log refers to the photo by id');
  } finally {
    logs.value = {};
    helperSession.value = null;
  }
});

for (const [lang, dict] of [['English', en], ['Hindi', hi], ['Punjabi', pa]] as const) {
  test(`${lang}: the consent sentence and the three plain lines are in the privacy document word for word`, () => {
    for (const k of ['as.consentText', 'as.means1', 'as.means2', 'as.means3']) {
      assert.ok(doc.includes(String(dict[k])), `${lang} ${k} must appear in docs/PRIVACY-AND-CONSENT.md`);
    }
    // the insurance-rail wording exists too, so the helper never tells a PMFBY farmer that "the officer decides"
    assert.ok(String(dict['as.means2.pmfby']).length > 10);
    assert.notEqual(dict['as.means2.pmfby'], dict['as.means2']);
  });
}

test('the privacy document keeps its required warning and claims no compliance', () => {
  assert.ok(doc.includes("Designed with India's DPDP Act in mind. Not legally reviewed. Needs legal review before any real deployment."));
  assert.ok(!/\b(is|are) (fully )?(DPDP[- ])?compliant\b/i.test(doc));
});
