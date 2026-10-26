// The worklist: where should limited field staff go first? Ranks review work, never claims. Every row says why it sits
// where it does, using the same four parts and the same weights as the original build (they are not tuned).
import { signal } from '@preact/signals';
import { Icon } from '../ui/Icon';
import { fmtT } from '../lib/time';
import { openPlot } from '../site/layout';
import { model, tSlow, scenarioHash } from '../sim/engine';
import { stageLabel, flagLabel } from '../sim/cohort';
import { PRIORITY_WEIGHTS, TIER_LABEL, priorityParts } from '../sim/evidence';
import { RELIEF } from '../config';
import { rail } from '../lib/prefs';
import { rows, type Row } from './state';
import { RowTier, TimeLeft } from './PlotList';
import { buildDraft } from './draftList';
import { download } from '../lib/download';

const INSPECTORS = ['Inspector A (Kesarpur–Neelkot)', 'Inspector B (Dhanpura–Sarangwal)', 'Inspector C (Ambwali)'];
const assigned = signal<Record<string, number>>({});

const pct = (x: number) => Math.round(x * 100);

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

export function Triage() {
  const m = model.value!;
  const relief = rail.value === 'relief';
  const W = PRIORITY_WEIGHTS;
  const queue = rows.value.filter((r) => r.e.tier !== 'none').sort((a, b) => b.pri - a.pri || a.s.plot.id.localeCompare(b.s.plot.id));
  const villages = buildDraft(m, rows.value, tSlow.value, scenarioHash.value).villages;
  return (
    <section class="triage" aria-labelledby="tr-h" data-sim-numbers>
      <div class="row-between">
        <div class="stack">
          <h3 id="tr-h" class="h-sm">{relief ? 'Assessment worklist' : 'District triage · inspection queue'}</h3>
          <p class="muted">
            {relief ? 'For the officer’s office: where should limited field staff go first?' : 'For the district agriculture office: where should limited field inspectors go first?'}{' '}
            Priority = {pct(W.ambiguity)}% evidence ambiguity + {pct(W.urgency)}% urgency + {pct(W.area)}% area + {pct(W.flags)}% integrity flags. It ranks review work; it never decides a claim. Priority is a sort key from fixed rules, not a measurement: its uncertainty is the evidence band beside it.
          </p>
          <span class="tag tag-sim" data-sim-label><span class="dot" aria-hidden="true" />Simulated cohort</span>
        </div>
        <button type="button" class="pill pill-ghost pill-sm" onClick={() => download(`saboot-worklist-${fmtT(tSlow.value).replace(/\W+/g, '')}.csv`, csv(queue), 'text/csv')} disabled={!queue.length}><Icon name="download" /> Export CSV</button>
      </div>
      <h4 id="tr-v">Villages by review load</h4>
      <ol class="vgrid vrank" role="list" aria-labelledby="tr-v">
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
      {queue.length === 0 ? (
        <p class="note note-plain"><Icon name="info" /><span>The worklist is empty at {fmtT(tSlow.value)}.</span></p>
      ) : (
        <ol class="queue" role="list">
          {queue.map((r, i) => {
            const a = assigned.value[r.s.plot.id];
            const why = whyParts(r);
            return (
              <li key={r.s.plot.id}>
                <span class="qrank num">{i + 1}</span>
                <div class="qmain">
                  <button type="button" class="plink" onClick={() => (openPlot.value = r.s.plot.id)}>{r.s.plot.id} · {r.s.plot.village}</button>
                  <span class="sub">{r.s.plot.crop} · {r.s.plot.areaHa.toFixed(1)} ha · {stageLabel(r.s)}</span>
                  <span class="flags">{r.s.flags.filter((f) => f !== 'tall-crop').map((f) => <span key={f} class="flag"><Icon name="flag" size={14} />{flagLabel(f, r.s.rail)}</span>)}</span>
                  <span class="why" data-why>
                    <span class="why-l">Why this rank</span>
                    {why.map((w) => <span key={w.id} class="why-i">{w.text} <b class="num">+{w.pts}</b></span>)}
                  </span>
                </div>
                <div class="qfig">
                  <span class="qcell" data-l="Evidence"><RowTier r={r} /></span>
                  <span class="qcell" data-l={relief ? 'Advice left' : 'Time left'}><TimeLeft r={r} /></span>
                  <span class="qcell" data-l="Priority"><span class="pri num" style={{ '--p': r.pri } as Record<string, number>} aria-label={`Priority ${r.pri}`}>{r.pri}</span></span>
                </div>
                <label class="assign">
                  <span class="sr-only">Assign {relief ? 'field staff' : 'inspector'} for {r.s.plot.id}</span>
                  <select class="input" value={a ?? ''} onChange={(e) => {
                    const v = (e.currentTarget as HTMLSelectElement).value;
                    const next = { ...assigned.value };
                    if (v === '') delete next[r.s.plot.id]; else next[r.s.plot.id] = +v;
                    assigned.value = next;
                  }}>
                    <option value="">Assign…</option>
                    {INSPECTORS.map((n, k) => <option key={n} value={k}>{n}</option>)}
                  </select>
                </label>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
