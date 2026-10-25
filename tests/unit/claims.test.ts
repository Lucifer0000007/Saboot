// Claims hygiene. Saboot assembles evidence and never decides, files, pays or integrates, and shows no amount. These tests
// scan the copy and the docs for the phrases that would say otherwise, so a later edit cannot slip one in unnoticed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import en from '../../src/i18n/en.ts';
import hi from '../../src/i18n/hi.ts';
import pa from '../../src/i18n/pa.ts';
import { RELIEF, PMFBY } from '../../src/config.ts';

const walk = (d: string): string[] => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
const srcFiles = walk('src').filter((f) => /\.(ts|tsx)$/.test(f));
const docs = ['README.md', ...walk('docs').filter((f) => f.endsWith('.md') && !f.endsWith('translation-review.md'))].filter(existsSync);
const copy = (d: Record<string, string | string[]>) => Object.entries(d).map(([k, v]) => [k, Array.isArray(v) ? v.join(' ') : v] as const);

// ---- no amounts --------------------------------------------------------------------------------------------------
const MONEY = /₹|\bRs\.?\s?\d|\bINR\b|\brupees?\b|\bcompensation amount\b|\bper[- ]acre amount\b/i;

test('no rupee figure and no amount anywhere in the copy, in any language', () => {
  for (const [lang, d] of [['en', en], ['hi', hi], ['pa', pa]] as const) {
    for (const [k, v] of copy(d)) assert.ok(!MONEY.test(v), `${lang} ${k}: "${v.slice(0, 80)}"`);
  }
  for (const f of srcFiles) assert.ok(!/₹|\bRs\.?\s?\d|\bINR\b/.test(readFileSync(f, 'utf8')), `${f} must not contain a currency figure`);
});

test('the configuration has no per-acre amount and no acreage cap: the product applies none', () => {
  assert.equal(RELIEF.perAcreAmount, null);
  assert.equal(RELIEF.acreageCapHa, null);
});

// ---- no overclaims ----------------------------------------------------------------------------------------------------
const OVERCLAIM: [RegExp, string][] = [
  [/\bSaboot (files|submits|pays|approves|rejects|sanctions|certifies)\b/i, 'Saboot is said to file, pay, approve or reject'],
  [/\b(we|saboot) (will )?guarantee\b|\bguaranteed (payout|claim|compensation)\b/i, 'a guarantee'],
  [/\bintegrat(es|ed|ion) with (the )?(government|state|insurer|bank|pmfby|crop insurance|bhuvan|imd|cwc|isro)\b/i, 'an integration is claimed'],
  [/\b(official(ly)? )?(partner|partnership) (with|of) (the )?(government|department|insurer|isro|imd)\b/i, 'a partnership is claimed'],
  [/\b(dpdp|gdpr)[- ](compliant|certified)\b|\bfully compliant\b|\blegally compliant\b/i, 'compliance is claimed'],
  [/\bvalidated (accuracy|detection|on real)\b|\b\d+\s?% (accurate|accuracy)\b/i, 'validation or accuracy is claimed'],
  [/\b(saves?|saved) (lives|money|crores?|lakhs?)\b/i, 'an impact is claimed'],
  [/\bvisits? (avoided|saved)\b/i, '"visits avoided" has no honest baseline'],
];

test('the English copy never claims that Saboot files, pays, approves, integrates, guarantees, is compliant or is validated', () => {
  // a question ("Has any of this been validated on real floods?") is not a claim; its answer is checked like any other copy
  for (const [k, v] of copy(en)) if (!v.trim().endsWith('?')) for (const [re, why] of OVERCLAIM) assert.ok(!re.test(v), `en ${k}: ${why}: "${v.slice(0, 100)}"`);
});

test('the console and farmer-app source strings never claim it either', () => {
  for (const f of srcFiles.filter((x) => x.endsWith('.tsx'))) {
    const text = readFileSync(f, 'utf8');
    for (const [re, why] of OVERCLAIM) {
      const hit = text.split('\n').findIndex((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*') && re.test(l));
      assert.equal(hit, -1, `${f}:${hit + 1}: ${why}`);
    }
  }
});

test('the docs make no overclaim either (negations such as "not an integration" are fine)', () => {
  for (const f of docs) {
    const text = readFileSync(f, 'utf8').split('\n').filter((l) => !/\b(not|never|no|nothing|without|neither|cannot|does not|do not|is not|are not)\b/i.test(l)).join('\n');
    for (const [re, why] of OVERCLAIM) assert.ok(!re.test(text), `${f}: ${why}`);
  }
});

// ---- the relief rail names no state; the demo and its fictional district do -------------------------------------------
const STATES = ['Punjab', 'Haryana', 'Himachal', 'Uttar Pradesh', 'Bihar', 'Assam', 'Kerala', 'Maharashtra', 'Gujarat', 'Rajasthan', 'Odisha', 'West Bengal', 'Tamil Nadu', 'Karnataka', 'Andhra', 'Telangana', 'Uttarakhand', 'Madhya Pradesh', 'Chhattisgarh', 'Jharkhand', 'Kashmir'];

test('the relief rail (every base key) names no state; only the crop-insurance variants may, and only through {state}', () => {
  for (const [k, v] of copy(en)) {
    if (k.endsWith('.pmfby') || k.startsWith('lang.name.')) continue;
    for (const s of STATES) assert.ok(!new RegExp(`\\b${s}\\b`, 'i').test(v), `en ${k} names ${s}`);
  }
  for (const [k, v] of copy(en)) if (k.endsWith('.pmfby')) for (const s of STATES) assert.ok(!new RegExp(`\\b${s}\\b`, 'i').test(v), `en ${k} hard-codes ${s}: use {state}`);
  assert.equal(PMFBY.state, 'Haryana', 'the crop-insurance rail uses the state the owner chose, with a marker to confirm it');
  const cfg = readFileSync('src/config.ts', 'utf8');
  assert.match(cfg, /Source: Haryana notifies PMFBY/);
});

test('every real-world parameter of the relief rail carries its source', () => {
  const cfg = readFileSync('src/config.ts', 'utf8');
  assert.match(cfg, /Source: MHA norms for SDRF\/NDRF assistance: input subsidy for crop loss of 33% and above/);
  assert.equal(RELIEF.damageShareThreshold, 0.33);
});

test('the relief window is advice: its copy says so in all three languages', () => {
  for (const [lang, d] of [['en', en], ['hi', hi], ['pa', pa]] as const) {
    assert.ok(String(d['al.advice']).length > 3, `${lang} al.advice`);
    assert.notEqual(d['al.advice'], undefined);
  }
  assert.match(String(en['al.advice']), /advice/i);
  assert.match(String(en['al.started']), /advice, not a legal deadline/i);
});

// ---- Punjab, translations and statistics -----------------------------------------------------------------------------
const NEGATION = /\b(not|never|no|nothing|without|neither|cannot|does not|do not|is not|are not|machine-drafted|needs?[- ]native[- ]review)\b/i;

test('the app never names Punjab (only the Punjabi language), and the docs never call Punjab a crop-insurance state', () => {
  for (const f of srcFiles) {
    const text = readFileSync(f, 'utf8').replace(/Punjabi/g, '');
    assert.ok(!/\bPunjab\b/.test(text), `${f} must not name Punjab`);
  }
  for (const f of docs.filter((d) => !d.endsWith('PREDEPLOY-REPORT.md'))) {
    for (const line of readFileSync(f, 'utf8').split('\n')) {
      if (/\bPunjab\b/.test(line.replace(/Punjabi/g, '')) && /\b(PMFBY|crop[- ]insurance scheme|72.hour)\b/i.test(line) && !NEGATION.test(line)) {
        assert.fail(`${f}: Punjab is placed in the crop-insurance scheme: "${line.slice(0, 120)}"`);
      }
    }
  }
});

test('nothing says the Hindi or Punjabi text has been verified', () => {
  const claim = /\btranslations?\b[^.\n]{0,40}\b(are|were|is|have been)\b[^.\n]{0,20}\b(verified|reviewed|checked|native[- ]checked|accurate)\b/i;
  for (const [k, v] of copy(en)) assert.ok(!claim.test(v), `en ${k}`);
  for (const f of docs) for (const line of readFileSync(f, 'utf8').split('\n')) if (claim.test(line) && !NEGATION.test(line)) assert.fail(`${f}: "${line.slice(0, 120)}"`);
  // the review flag on every Hindi and Punjabi line is enforced by scripts/i18n-check.mjs (npm run i18n), part of verify
});

test('no market size, user count, loss percentage or revenue figure appears in the pilot documents', () => {
  const figures = /\b(\d[\d,.]*\s?(crore|lakh|million|billion)s?\b|\bTAM\b|\bSAM\b|\bSOM\b|\b\d+\s?%\s+of\s+(all\s+)?(claims|farmers|plots)\b|\bmarket size\b[^.\n]*\d|\brevenue (of|projection)[^.\n]*\d|\b\d[\d,]*\s+(users|farmers|downloads)\b)/i;
  for (const f of ['docs/PILOT-PLAN.md', 'docs/BUYER-ONE-PAGER.md', 'docs/EXISTING-SOLUTIONS.md', 'docs/STAKEHOLDER-INTERVIEW-GUIDE.md', 'docs/LETTER-OF-SUPPORT-TEMPLATE.md']) {
    for (const line of readFileSync(f, 'utf8').split('\n')) {
      if (figures.test(line) && !NEGATION.test(line)) assert.fail(`${f}: a figure that needs a source: "${line.slice(0, 120)}"`);
    }
  }
});

test('the pilot kit uses placeholders for everything the buyer decides, and marks real-world claims', () => {
  for (const f of ['docs/PILOT-PLAN.md', 'docs/BUYER-ONE-PAGER.md']) assert.match(readFileSync(f, 'utf8'), /\[TO FILL\]/, f);
  for (const f of ['docs/EXISTING-SOLUTIONS.md', 'docs/BUYER-ONE-PAGER.md', 'docs/VALIDATION.md']) assert.match(readFileSync(f, 'utf8'), /\{\{VERIFY:/, f);
  assert.match(readFileSync('docs/PILOT-PLAN.md', 'utf8'), /no projections, market sizes or user counts/i);
});
