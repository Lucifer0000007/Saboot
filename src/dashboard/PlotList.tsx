// The worklist (F12, which absorbed the assessment worklist F14, audit OF-04): the map's plots as one ranked list. It ranks
// review work, never claims. Every row says why it sits where it does, using the same four parts and the same weights as
// the original build (they are not tuned). On a phone each plot is a compact row and the list starts with the first ten.
import { signal } from '@preact/signals';
import { Icon } from '../ui/Icon';
import { TierBadge } from '../ui/TierBadge';
import { fmtDur, fmtT } from '../lib/time';
const fmtDurEn = (h: number) => fmtDur(h, true);
import { openPlot, layout } from '../site/layout';
import { importedLabel } from '../k/imported';
import { model, tSlow, scenarioHash } from '../sim/engine';
import { stageLabel, flagLabel } from '../sim/cohort';
import { PRIORITY_WEIGHTS, TIER_LABEL, priorityParts } from '../sim/evidence';
import { RELIEF } from '../config';
import { rows, importedRows, sorted, sortKey, tierFilter, type Row, type SortKey } from './state';
import { rail } from '../lib/prefs';
import { buildDraft } from './draftList';
import { makeBundle, bundleJson } from '../k/bundle';
import { download } from '../lib/download';
import { INSPECTORS, assigned, assign } from './assign';

const LANG: Record<string, string> = { en: 'EN', hi: 'HI', pa: 'PA' };
/** Rows a phone shows before "Show all": the console stays a few screens tall (audit J7). */
const PHONE_ROWS = 10;
const showAll = signal(false);

const pct = (x: number) => Math.round(x * 100);

export const RowTier = ({ r }: { r: Row }) => <TierBadge tier={r.e.tier} range={[r.e.lo, r.e.hi]} />;

export function TimeLeft({ r }: { r: Row }) {
  const s = r.s;
  if (s.timeLeft === null) return <span class="muted">—</span>;
  if (s.stage === 'no-damage') return <span class="muted">Closed (no damage)</span>;
  const done = s.times.fileT !== null && (s.stage === 'filed' || s.stage === 'acknowledged');
  const pm = s.rail === 'pmfby';
  // the relief window is advice, so once the evidence is in there is no time left to show and no verdict on timing; the
  // stage says it was shown (audit OF-11). PMFBY keeps "Reported in time", a real timing outcome.
  if (done) return pm ? <span class="tl-ok"><Icon name="okShape" size={16} /> Reported in time</span> : <span class="muted" data-tl-in>— (evidence in)</span>;
  if (s.timeLeft <= 0) return pm ? <span class="tl-bad"><Icon name="barShape" size={16} /> Window closed</span> : <span class="muted"><Icon name="info" size={16} /> Advice passed</span>;
  // same tones as the farmer's countdown: ink above 24 h, amber with a clock below it, plus a word under 6 h
  const left = s.timeLeft;
  return (
    <span class="tl">
      <span class={'num' + (left < 24 ? ' tl-warn' : '')}>{left < 24 && <Icon name="clock" size={16} />}{fmtDurEn(left)}</span>
      {left < 6 && <span class="tag tag-warn">{pm ? 'Last hours' : 'Capture soon'}</span>}
    </span>
  );
}

/** The four parts of a plot's priority as plain words and points out of 100. Same formula as priority(). */
export function whyParts(r: Row): { id: string; text: string; pts: number }[] {
  const p = priorityParts(r.s, r.e);
  const W = PRIORITY_WEIGHTS;
  const pts = (k: 'ambiguity' | 'urgency' | 'area' | 'flags') => Math.round(100 * W[k] * p[k]);
  const relief = r.s.rail === 'relief';
  const open = r.s.stage === 'alerted' || r.s.stage === 'hail-prompt' || r.s.stage === 'queued';
  const nFlags = r.s.flags.filter((f) => f !== 'tall-crop' && f !== 'assisted').length;
  return [
    { id: 'ambiguity', text: `${TIER_LABEL[r.e.tier].toLowerCase()} evidence`, pts: pts('ambiguity') },
    {
      id: 'urgency',
      text: open && r.s.timeLeft !== null ? `${pct(p.urgency)}% of the ${relief ? 'advice window' : 'window'} used` : r.s.stage === 'missed' ? `${relief ? 'advice window' : 'window'} passed, no evidence` : 'evidence already in',
      pts: pts('urgency'),
    },
    { id: 'area', text: `${r.s.plot.areaHa.toFixed(1)} ha`, pts: pts('area') },
    { id: 'flags', text: `${nFlags} integrity flag${nFlags === 1 ? '' : 's'}`, pts: pts('flags') },
  ];
}

function csv(list: Row[]) {
  const head = ['rank', 'plot', 'village', 'farmer', 'crop', 'area_ha', 'stage', 'tier', 'score_lo', 'score_hi', 'flooded_share_estimate', 'priority', 'points_ambiguity', 'points_urgency', 'points_area', 'points_flags', 'flags', 'inspector'];
  const lines = list.map((r, i) => {
    const w = whyParts(r);
    return [
      i + 1, r.s.plot.id, r.s.plot.village, r.s.plot.name, r.s.plot.crop, r.s.plot.areaHa.toFixed(2), stageLabel(r.s),
      TIER_LABEL[r.e.tier], r.e.lo.toFixed(2), r.e.hi.toFixed(2), r.e.floodShare.toFixed(2), r.pri, ...w.map((x) => x.pts),
      r.s.flags.map((f) => flagLabel(f, r.s.rail)).join('; '),
      assigned.value[r.s.plot.id] !== undefined ? INSPECTORS[assigned.value[r.s.plot.id]] : '',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });
  const W = PRIORITY_WEIGHTS;
  return [
    '# SIMULATION - synthetic data. The rank orders review work; it is not a decision about any claim, eligibility or amount.',
    `# priority = ${W.ambiguity} ambiguity + ${W.urgency} urgency + ${W.area} area + ${W.flags} integrity flags (weights unchanged since the first build)`,
    head.join(','), ...lines,
  ].join('\n');
}

/** Villages by review load: the same priorities summed per village, folded away so the plot list stays the one ranking. */
function Villages() {
  const m = model.value!;
  const relief = rail.value === 'relief';
  const villages = buildDraft(m, rows.value, tSlow.value, scenarioHash.value).villages;
  return (
    <details class="vsum">
      <summary>Villages by review load</summary>
      <p class="muted">Review load is the sum of the priority of a village’s listed plots: how much review work is waiting there.</p>
      <ol class="vgrid vrank" role="list" aria-label="Villages by review load">
        {villages.map((v) => (
          <li class="vcard" key={v.name}>
            <span class="vr num">Rank {v.rank}</span>
            <strong>{v.name}</strong>
            <span class="num">{v.plots} plots · {v.areaHa.toFixed(0)} ha{v.unconfirmed > 0 ? ` · +${v.unconfirmed} unconfirmed` : ''}</span>
            <div class="vbar" aria-hidden="true">
              {v.plots > 0 && <><i class="s" style={{ flex: v.supported }} /><i class="p" style={{ flex: v.partial }} /><i class="i" style={{ flex: v.insufficient }} /></>}
            </div>
            <ul class="vmix" role="list" aria-label="Evidence in this village">
              <li class="s"><Icon name="okShape" size={14} /><b class="num">{v.supported}</b><span class="sr-only">supported</span></li>
              <li class="p"><Icon name="halfShape" size={14} /><b class="num">{v.partial}</b><span class="sr-only">partial</span></li>
              <li class="i"><Icon name="barShape" size={14} /><b class="num">{v.insufficient}</b><span class="sr-only">insufficient</span></li>
            </ul>
            <span class="muted">Review load <span class="num">{v.reviewLoad}</span>{relief && <> · <span class="num">{v.atOrAbove}</span> at or above the share parameter</>}</span>
          </li>
        ))}
      </ol>
      {relief && <p class="muted">Share parameter <span class="num">{RELIEF.damageShareThreshold}</span> is a labelled scenario setting, not an official figure. Flooded share is a radar estimate, not crop damage.</p>}
    </details>
  );
}

function Figures({ r, relief }: { r: Row; relief: boolean }) {
  return (
    <div class="qfig">
      <span class="qcell" data-l="Evidence"><RowTier r={r} /></span>
      <span class="qcell" data-l={relief ? 'Advice left' : 'Time left'}><TimeLeft r={r} /></span>
      <span class="qcell" data-l="Priority"><span class="pri num" style={{ '--p': r.pri } as Record<string, number>} aria-label={`Priority ${r.pri}`}>{r.pri}</span></span>
    </div>
  );
}

function Item({ r, rank, relief }: { r: Row; rank: number; relief: boolean }) {
  const p = r.s.plot;
  const a = assigned.value[p.id];
  const flags = r.s.flags.filter((f) => f !== 'tall-crop');
  const focus = r.s.persona === 'focus';
  return (
    <li class={(openPlot.value === p.id ? 'sel ' : '') + (focus ? 'focus' : '')}>
      <span class="qrank num">{rank}</span>
      <div class="qmain">
        <button type="button" class="plink" onClick={() => (openPlot.value = p.id)}>{p.id} · {p.village} <Icon name="arrow" size={16} /></button>
        <span class="sub">{p.name} <span class="lang-code">{LANG[p.lang]}</span>{focus && <span class="tag you">Demo phone</span>} · {p.crop} · <span class="nb num">{p.areaHa.toFixed(1)} ha</span> · {stageLabel(r.s)}</span>
        {flags.length > 0 && <span class="flags">{flags.map((f) => <span key={f} class="flag"><Icon name="flag" size={14} />{flagLabel(f, r.s.rail)}</span>)}</span>}
        {a !== undefined && <span class="tag assigned-tag" data-assigned><Icon name="users" size={14} />{INSPECTORS[a]}</span>}
      </div>
      <Figures r={r} relief={relief} />
      <details class="qwhy">
        <summary>Why this rank · assign</summary>
        <span class="why" data-why>
          <span class="why-l">Priority {r.pri}, from four parts</span>
          {whyParts(r).map((w) => <span key={w.id} class="why-i">{w.text} <b class="num">+{w.pts}</b></span>)}
        </span>
        <label class="assign">
          <span>Assign {relief ? 'field staff' : 'an inspector'} for {p.id}</span>
          <select class="input" value={a ?? ''} onChange={(e) => {
            const v = (e.currentTarget as HTMLSelectElement).value;
            void assign(p.id, v === '' ? null : +v);
          }}>
            <option value="">Not assigned</option>
            {INSPECTORS.map((n, k) => <option key={n} value={k}>{n}</option>)}
          </select>
        </label>
      </details>
    </li>
  );
}

export function PlotList() {
  const relief = rail.value === 'relief';
  const W = PRIORITY_WEIGHTS;
  const filt = tierFilter.value;
  const list = sorted(rows.value.filter((r) => filt[r.e.tier]), sortKey.value);
  const cut = layout.value === 'mobile' && !showAll.value && list.length > PHONE_ROWS;
  const shown = cut ? list.slice(0, PHONE_ROWS) : list;
  const imports = importedRows.value;
  return (
    <section class="plist triage" aria-labelledby="plist-h" data-sim-numbers>
      <div class="row-between">
        <h3 id="plist-h" class="h-sm">{relief ? 'Assessment worklist' : 'Inspection worklist'} <span class="cnt num">{list.length}</span></h3>
        <button type="button" class="pill pill-ghost pill-sm" onClick={() => download(`saboot-worklist-${fmtT(tSlow.value).replace(/\W+/g, '')}.csv`, csv(sorted(list, 'priority')), 'text/csv')} disabled={!list.length}><Icon name="download" /> Export CSV</button>
      </div>
      <p class="muted" data-pri-note>
        {relief ? 'Where should limited field staff go first?' : 'Where should limited field inspectors go first?'}{' '}
        Priority = {pct(W.ambiguity)}% evidence ambiguity + {pct(W.urgency)}% urgency + {pct(W.area)}% area + {pct(W.flags)}% integrity flags. It ranks review work; it never decides a claim. Priority is a sort key from fixed rules, not a measurement: its uncertainty is the evidence band beside it.
      </p>
      <div class="row plist-ctl">
        <span class="tag tag-sim" data-sim-label><span class="dot" aria-hidden="true" />Simulated cohort</span>
        <label class="sortby">
          <span>Sort by</span>
          <select class="input" value={sortKey.value} onChange={(e) => (sortKey.value = (e.currentTarget as HTMLSelectElement).value as SortKey)}>
            <option value="priority">Review priority</option>
            <option value="timeLeft">Time left</option>
            <option value="tier">Evidence tier</option>
          </select>
        </label>
      </div>
      <Villages />
      {imports.length > 0 && (
        <ul class="imp-list" role="list" aria-label="Imported from a phone">
          {imports.map((r) => (
            <li key={r.k.head} class="imported" data-tour="imported">
              <span class="qrank" aria-hidden="true"><Icon name="scan" size={16} /></span>
              <div class="qmain">
                <button type="button" class="plink" onClick={() => (openPlot.value = r.s.plot.id)}>{r.s.plot.id} · {r.s.plot.village} <Icon name="arrow" size={16} /></button>
                <span class="tag imported-tag"><Icon name="scan" size={16} />{importedLabel(r.k)}</span>
                <span class="sub">{r.s.plot.name} · signed on the judge’s phone · Evidence received · integrity verified</span>
                <span class="sub num">{r.k.shots.length} photo fingerprints · chain {r.k.head.slice(0, 10)}…</span>
                <button type="button" class="pill pill-ghost pill-sm" data-export-bundle onClick={() => download(`saboot-evidence-${r.k.plot}.json`, bundleJson(makeBundle(r.k.code, r.k)), 'application/json')}><Icon name="download" size={16} /> Export bundle</button>
              </div>
              <Figures r={r} relief={relief} />
            </li>
          ))}
        </ul>
      )}
      {list.length === 0 ? (
        <p class="note note-plain"><Icon name="info" /><span>No plots match the filter at {fmtT(tSlow.value)}. Play the replay or jump to a moment.</span></p>
      ) : (
        <ol class="queue" role="list" aria-label={`Plots ranked by ${sortKey.value === 'priority' ? 'review priority' : sortKey.value === 'timeLeft' ? 'time left' : 'evidence tier'}`}>
          {shown.map((r, i) => <Item key={r.s.plot.id} r={r} rank={i + 1} relief={relief} />)}
        </ol>
      )}
      {cut && (
        <button type="button" class="pill pill-ghost pill-block" data-show-all onClick={() => (showAll.value = true)}>Show all {list.length} plots</button>
      )}
    </section>
  );
}
