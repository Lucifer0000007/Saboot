// Relief rail: the draft assessment list. What the officer's office would review, with the evidence Saboot holds for each
// plot. The officer publishes it and decides, outside Saboot. Farmers can attach sealed evidence during the objection
// window. SIMULATED: the publication time, the objections and the officer's responses are scripted.
import { Icon, type IconName } from '../ui/Icon';
import { TierBadge } from '../ui/TierBadge';
import { fmtT } from '../lib/time';
import { openPlot } from '../site/layout';
import { model, tSlow, scenarioHash } from '../sim/engine';
import { RELIEF } from '../config';
import { rows } from './state';
import { buildDraft, draftCsv, draftJson, type Draft as DraftData, type DraftEntry } from './draftList';
import { download } from '../lib/download';

type StepState = 'Running' | 'Done' | 'Open' | 'Closed' | 'Not yet' | 'Outside Saboot';
interface Step { who: string; text: string; note: string; state: StepState; icon: IconName; outside?: boolean }

// Design: the relief rail's proposed workflow (docs/SABOOT-SPEC.md §14), shown as simulated; no state's order is described.
function Steps({ d, t }: { d: DraftData; t: number }) {
  const { publishAtHour: pub, objectionWindowHours: win } = d.provenance.publication;
  const end = pub + win;
  const steps: Step[] = [
    { who: 'Saboot', text: 'Assembles and ranks the evidence', note: 'Continuously, from the first alert', state: 'Running', icon: 'shield' },
    { who: 'Officer', text: 'Publishes the draft list', note: `Simulated at ${fmtT(pub)}. This happens outside Saboot.`, state: t >= pub ? 'Done' : 'Not yet', icon: 'file', outside: true },
    { who: 'Farmers', text: 'May attach sealed evidence', note: `Objections are open from ${fmtT(pub)} to ${fmtT(end)}`, state: t < pub ? 'Not yet' : t < end ? 'Open' : 'Closed', icon: 'users' },
    { who: 'Department', text: 'Decides the final list', note: 'Outside Saboot. Saboot never sees or makes this decision.', state: 'Outside Saboot', icon: 'gavel', outside: true },
  ];
  return (
    <ol class="dsteps" role="list" aria-label="Draft list steps">
      {steps.map((s) => (
        <li key={s.text} class={'dstep' + (s.outside ? ' outside' : '') + (s.state === 'Done' || s.state === 'Closed' ? ' done' : '')}>
          <span class="pipe-who">{s.who}</span>
          <span class="pipe-pill"><Icon name={s.icon} size={16} /><span>{s.text}</span></span>
          <span class="pipe-note">{s.note}</span>
          <span class="dstate"><strong>{s.state}</strong></span>
        </li>
      ))}
    </ol>
  );
}

function Objection({ e }: { e: DraftEntry }) {
  const o = e.objection;
  if (!o) return <span class="muted">None</span>;
  return (
    <span class="obj">
      <span class="obj-l"><Icon name="file" size={16} /><span>Evidence attached <span class="nb num">{fmtT(o.filedAtHour)}</span></span></span>
      {o.answeredAtHour !== null
        ? <span class="obj-l sub"><Icon name="check" size={16} /><span>Response noted <span class="nb num">{fmtT(o.answeredAtHour)}</span>, outside Saboot</span></span>
        : <span class="obj-l sub"><Icon name="clock" size={16} /><span>No response noted yet</span></span>}
    </span>
  );
}

export function DraftView() {
  const m = model.value!;
  const t = tSlow.value;
  const d = buildDraft(m, rows.value, t, scenarioHash.value);
  const st = d.provenance.publication.state;
  const stamp = fmtT(t).replace(/\W+/g, '');
  const p = d.provenance;
  return (
    <section class="draft triage" aria-labelledby="dl-h" data-sim-numbers>
      <div class="row-between">
        <div class="stack">
          <h3 id="dl-h" class="h-sm">Draft assessment list</h3>
          <p class="muted">The evidence Saboot holds, village by village, for the officer to review. The officer decides, outside Saboot.</p>
          <div class="row">
            <span class="tag tag-sim" data-sim-label><span class="dot" aria-hidden="true" />Simulated cohort</span>
            <span class="tag tag-flow" data-list-state={st}><Icon name={st === 'working draft' ? 'clock' : st === 'published' ? 'file' : 'check'} size={16} />{st === 'working draft' ? 'Working draft, not yet published' : st === 'published' ? 'Published, objections open' : 'Published, objections closed'}</span>
          </div>
        </div>
        <div class="row">
          <button type="button" class="pill pill-ghost pill-sm" onClick={() => download(`saboot-draft-list-${stamp}.json`, draftJson(d), 'application/json')} disabled={!d.entries.length} data-export="json"><Icon name="download" /> Export JSON</button>
          <button type="button" class="pill pill-ghost pill-sm" onClick={() => download(`saboot-draft-list-${stamp}.csv`, draftCsv(d), 'text/csv')} disabled={!d.entries.length} data-export="csv"><Icon name="download" /> Export CSV</button>
        </div>
      </div>
      <p class="note note-plain" role="note"><Icon name="info" /><span><strong>Draft, for officer review.</strong> This list ranks evidence. It does not decide any claim, eligibility or amount, and it shows no amount.</span></p>
      <Steps d={d} t={t} />

      <div class="card stack">
        <h4>Villages by review load</h4>
        <p class="muted">Review load is the sum of the review priority of a village’s listed plots: how much review work is waiting there.</p>
        <table class="rtable vtable">
          <caption class="sr-only">Villages ranked by review load</caption>
          <thead>
            <tr>
              <th scope="col">Rank</th><th scope="col">Village</th><th scope="col">Plots</th><th scope="col">Evidence</th>
              <th scope="col">At or above the share parameter</th><th scope="col">Review load</th><th scope="col">Objections</th>
            </tr>
          </thead>
          <tbody>
            {d.villages.map((v) => (
              <tr key={v.name}>
                <td data-l="Rank" class="num">{v.rank}</td>
                <th scope="row" data-l="Village">{v.name}</th>
                <td data-l="Plots" class="num">{v.plots}<span class="sub">{v.areaHa.toFixed(1)} ha</span>{v.unconfirmed > 0 && <span class="sub">+{v.unconfirmed} unconfirmed (hail prompt, no reply)</span>}</td>
                <td data-l="Evidence" class="num"><span class="tcount">{v.supported} supported</span><span class="tcount">{v.partial} partial</span><span class="tcount">{v.insufficient} insufficient</span></td>
                <td data-l="At or above" class="num">{v.atOrAbove}</td>
                <td data-l="Load" class="num">{v.reviewLoad}</td>
                <td data-l="Objections" class="num">{v.objections}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p class="muted">
          Share parameter <span class="num">{RELIEF.damageShareThreshold}</span>: plots whose radar-estimated flooded share is at or above it are listed first within their village.
          It is a labelled scenario setting, not an official figure. Flooded share is not crop damage: only the officer assesses that.
        </p>
      </div>

      {d.entries.length === 0 ? (
        <p class="note note-plain"><Icon name="info" /><span>The list is empty at {fmtT(t)}. Play the replay or jump to “Trigger”.</span></p>
      ) : (
        <div class="card stack">
        <h4>Entries, by village</h4>
        <table class="rtable dtable">
          <caption class="sr-only">Draft assessment list entries, by village</caption>
          <thead>
            <tr>
              <th scope="col">Plot</th><th scope="col">Stage</th><th scope="col">Evidence</th>
              <th scope="col">Flooded share (radar estimate)</th><th scope="col">Objection</th>
            </tr>
          </thead>
          <tbody>
            {d.entries.map((e) => {
              const r = rows.value.find((x) => x.s.plot.id === e.plot)!;
              return (
                <tr key={e.plot}>
                  <td data-l="Plot">
                    <button type="button" class="plink" onClick={() => (openPlot.value = e.plot)} aria-label={`Open ${e.plot} details`}>{e.plot} <Icon name="arrow" size={16} /></button>
                    <span class="sub">{e.village} · {e.crop} · <span class="nb num">{e.areaHa.toFixed(1)} ha</span></span>
                  </td>
                  <td data-l="Stage">{e.stage}{e.flags.length > 0 && <span class="flags">{e.flags.map((f) => <span key={f} class="flag"><Icon name="flag" size={14} />{f}</span>)}</span>}</td>
                  <td data-l="Evidence">{e.unconfirmed ? <span class="tag"><Icon name="info" size={16} />No evidence yet</span> : <TierBadge tier={e.tier} range={[e.scoreLo, e.scoreHi]} />}</td>
                  <td data-l="Flooded share" class="num">
                    {e.unconfirmed ? <span class="muted">Unconfirmed</span> : <>{Math.round(e.floodShareLo * 100)}–{Math.round(e.floodShareHi * 100)}%<span class="sub">radar estimate, about {Math.round(e.floodShare * 100)}%</span></>}
                    {e.atOrAboveShareParameter && !e.unconfirmed && <span class="tag tag-share">At or above the share parameter</span>}
                  </td>
                  <td data-l="Objection"><Objection e={e} />{r.s.persona === 'focus' && <span class="tag you">Demo phone</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}

      <details class="dprov">
        <summary>Provenance of this list</summary>
        <dl class="kv">
          <div><dt>Rail</dt><dd>Relief (simulated)</dd></div>
          <div><dt>Simulation time</dt><dd class="num">{fmtT(p.simHour)}</dd></div>
          <div><dt>Rule versions</dt><dd class="num">A {p.ruleVersions.A} · B {p.ruleVersions.B} · C {p.ruleVersions.C}</dd></div>
          <div><dt>Scenario</dt><dd>{p.scenario.name}, seed <span class="num">{p.scenario.seed}</span></dd></div>
          <div><dt>Scenario SHA-256</dt><dd class="hash num">{p.scenario.sha256 ?? 'computing…'}</dd></div>
          <div><dt>Share parameter</dt><dd class="num">{RELIEF.damageShareThreshold} (scenario setting)</dd></div>
          <div><dt>Capture-soon advice</dt><dd class="num">{RELIEF.captureSoonHours} h (advice, not a deadline)</dd></div>
        </dl>
        <p class="muted">The exports carry these values, the tier rule, the factor and priority weights and the thresholds, so the list can be reproduced.</p>
      </details>
    </section>
  );
}
